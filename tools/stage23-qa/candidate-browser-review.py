"""Same-commit candidate build and genuine native checkpoint, actual UI only."""
import hashlib,json,os,time,traceback,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('_local/reports/stage23-candidate-browser');OUT.mkdir(parents=True,exist_ok=True)
SOURCE=Path('_local/reports/stage23-candidate-native/browser-checkpoint.json')
source=json.loads(SOURCE.read_text());saved=source['profile'];battle=saved['honroBattle']
assert source['provenance']['sourceTarget']==os.environ['GITHUB_SHA'] and source['provenance']['resume'] is None
assert source['provenance']['entryFixture'].startswith('Pre-entry first-clear/recruit reward-ledger fixture through22;')
assert battle['round']==27 and battle['honroStage']==23 and battle['honroReviewed23PacingRevision']==1
assert set(battle['honroReviewed23PacingRemoved'])=={'s23-C-5','s23-E-2'}
assert len([u for u in battle['units'] if u.get('side')==1])==38
assert not [u for u in battle['units'] if u.get('side')==1 and u.get('hp',0)>0 and u['x']>7800]
PROFILE=OUT/'source-profile.json';PROFILE.write_text(json.dumps(saved,ensure_ascii=False))
URL='http://127.0.0.1:8765/HONRO.html'
R={'passed':False,'sourceCommit':os.environ['GITHUB_SHA'],'checkpointSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'scope':'Same-commit freshly built candidate. Real Chromium keyboard/pointer/touch from earned native R27; not an end-to-end browser campaign or human fun/timing proof. Prior1–22 is a synthetic reward-ledger fixture.','views':[],'errors':[]}
STATE='''()=>{const a=HonroApp,e=a.engine,b=e?.b,u=e?.active,n=b?.units.find(v=>v.id==='act3-carrier'),r=id=>{const q=document.getElementById(id),x=q?.getBoundingClientRect();return q&&!q.hidden&&getComputedStyle(q).visibility!=='hidden'&&x?.width>0?{left:x.left,right:x.right,top:x.top,bottom:x.bottom}:null};return {screen:a.screen,stage:b?.honroStage,round:b?.round,phase:b?.phase,can:a.canInput(),dialogue:!!a.dialogue,modal:a.modalKind,revision:b?.honroCampaignMapRevision,pacing:b?.honroReviewed23PacingRevision,active:u?{id:u.id,x:u.x,y:u.y,hp:u.hp,move:u.moveLeft,angle:u.angle,ground:e.grounded(u)}:null,npc:n?{x:n.x,y:n.y,hp:n.hp,move:n.moveLeft}:null,done:b?HonroAct23V4.mem(b).done:null,remaining:b?.units.filter(v=>v.side===1&&!v.dead&&v.hp>0).length,shots:b?.shot,labels:a.scene?.missionDrawn||[],equipmentButton:r('equipment-pending-battle'),minimap:r('minimap'),documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,pose:u?HONRO_CORE.validTerrainContactPose(b.terrain,u):null}}'''
def snap(p,name):
 s=p.evaluate(STATE);p.screenshot(path=str(OUT/(name+'.png')));return s
def overlap(a,b):return a['left']<b['right'] and a['right']>b['left'] and a['top']<b['bottom'] and a['bottom']>b['top']
def clearance(s):
 assert s['labels'] and s['equipmentButton'],s
 assert s['documentWidth']<=s['viewport'],s
 for box in s['labels']:
  assert not overlap(box,s['equipmentButton']),('equipment overlap',box,s)
  assert not s['minimap'] or not overlap(box,s['minimap']),('minimap overlap',box,s)
def ready(p):
 for _ in range(240):
  s=p.evaluate(STATE)
  if s['phase'] in ['won','lost']:return False
  if s['dialogue']:p.wait_for_timeout(200);p.keyboard.press('Enter');continue
  if s['can'] and s['active'] and s['active']['ground']:return True
  p.wait_for_timeout(100)
 raise TimeoutError('Ordinary input did not return')
def hold(p,key,ms):
 p.keyboard.down(key)
 try:p.wait_for_timeout(ms)
 finally:p.keyboard.up(key)
def touch(ctx,p,selector,dx,dy,ms):
 q=p.locator(selector).bounding_box();assert q,selector;x=q['x']+q['width']/2;y=q['y']+q['height']/2;c=ctx.new_cdp_session(p)
 c.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
 if dx or dy:c.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+dx,'y':y+dy}]})
 p.wait_for_timeout(ms);c.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});c.detach()
def open_view(browser,w,h,mobile):
 ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1);p=ctx.new_page();p.on('pageerror',lambda e:R['errors'].append(str(e)))
 response=p.goto(URL,wait_until='domcontentloaded');assert response and response.status==200;p.wait_for_function('window.HonroApp',timeout=60000)
 p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str(PROFILE.resolve()))
 p.wait_for_function('HonroApp.profile?.lastStage===23',timeout=60000);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.locator('.title-actions [data-action="continue"]').first.click();p.wait_for_function('HonroApp.engine?.b.honroStage===23',timeout=60000);ready(p);p.wait_for_timeout(1100)
 s=p.evaluate(STATE);assert s['round']==27 and s['pacing']==1 and s['phase']=='aim',s
 assert p.evaluate('(t)=>JSON.stringify(HonroApp.engine.b.terrain)===JSON.stringify(t)',battle['terrain'])
 return ctx,p
try:
 raw=urllib.request.urlopen(URL,timeout=60).read();R['builtHtmlSha256']=hashlib.sha256(raw).hexdigest();assert raw==Path('HONRO.html').read_bytes(),'Served HTML must be this exact build'
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  for label,w,h,mobile in [('desktop',1440,900,False),('portrait',390,844,True),('landscape',844,390,True)]:
   ctx,p=open_view(browser,w,h,mobile);row={'label':label,'entry':snap(p,label+'-entry')};R['views'].append(row);clearance(row['entry']);assert row['entry']['pose']
   # Opening this existing control must still work; do not choose or equip items.
   owned=p.evaluate('HonroApp.profile.equipment.ownedItemIds');p.locator('#equipment-pending-battle').click();p.wait_for_function('HonroApp.modalKind?.includes("equipment")');p.get_by_text('나중에',exact=True).click();ready(p);assert p.evaluate('HonroApp.profile.equipment.ownedItemIds')==owned;row['equipmentOpenClose']=True
   if mobile:
    ctx.set_default_timeout(30000)
    p.set_viewport_size({'width':h,'height':w});p.wait_for_timeout(400);row['rotated']=snap(p,label+'-rotated');clearance(row['rotated']);p.set_viewport_size({'width':w,'height':h});p.wait_for_timeout(400)
   if mobile:touch(ctx,p,'#joystick',0,-28,250)
   else:hold(p,'ArrowUp',250)
   row['aim']=snap(p,label+'-aim');assert row['aim']['active']['angle']!=row['entry']['active']['angle'];clearance(row['aim'])
   for _ in range(100):
    s=p.evaluate(STATE)
    if s['phase'] in ['won','lost']:break
    if not s['can']:ready(p);continue
    assert s['active']['id']=='p-archer',s
    if s['active']['x']>=9160:break
    if mobile:touch(ctx,p,'#joystick',35,0,100)
    else:hold(p,'ArrowRight',100)
    p.wait_for_timeout(25)
   row['walked']=snap(p,label+'-walked');assert row['walked']['active']['x']>row['entry']['active']['x']+800
   # Fire one real basic arrow away from the convoy, using the visible controls.
   p.locator('[data-action="combat-skill"][data-skill="A01"]').click()
   if mobile:touch(ctx,p,'#joystick',0,-28,700)
   else:hold(p,'ArrowUp',700)
   before=p.evaluate(STATE)
   if mobile:touch(ctx,p,'#fire',0,0,450)
   else:
    q=p.locator('#fire').bounding_box();p.mouse.move(q['x']+q['width']/2,q['y']+q['height']/2);p.mouse.down();p.wait_for_timeout(450);p.mouse.up()
   p.wait_for_timeout(80);row['fired']=snap(p,label+'-fired');assert row['fired']['shots']>before['shots'],'Actual pointer/touch firing must create a shot'
   # The finite escort budget is nearly exhausted at R27. End remaining actions
   # through the visible defense control and let actual enemy/round handling run.
   for _ in range(12):
    if not ready(p):break
    s=p.evaluate(STATE)
    if s['phase'] in ['won','lost']:break
    if mobile:p.locator('[data-action="defend"]').tap()
    else:p.locator('[data-action="defend"]').click()
    p.wait_for_timeout(150)
   ready(p);row['arrival']=snap(p,label+'-arrival');assert row['arrival']['phase']=='won',row['arrival'];assert row['arrival']['npc']['hp']>0 and row['arrival']['remaining']>0
   assert all(row['arrival']['done'].get(k) for k in ['dispatch-bundle','dock-mid','dock-exit'])
   reward=p.evaluate('({clear:HonroApp.profile.cleared[23],heroes:HonroApp.profile.heroes,equipment:HonroApp.profile.equipment,honroGrowth:HonroApp.profile.honroGrowth})');row['clear']=reward['clear']
   p.locator('[data-action="result-continue"]').click();p.wait_for_timeout(400)
   for _ in range(30):
    if not p.evaluate('!!HonroApp.dialogue'):break
    p.keyboard.press('Enter');p.wait_for_timeout(200)
   row['rest']=snap(p,label+'-rest');assert p.locator('.rest-screen').count()==1
   p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');assert p.evaluate('({clear:HonroApp.profile.cleared[23],heroes:HonroApp.profile.heroes,equipment:HonroApp.profile.equipment,honroGrowth:HonroApp.profile.honroGrowth})')==reward;row['rewardStableAfterReload']=True;p.screenshot(path=str(OUT/(label+'-reload.png')));ctx.close()
  browser.close()
 R['passed']=not R['errors']
except Exception:
 R['failure']=traceback.format_exc()
 try:R['failureState']=snap(p,'failure')
 except Exception:pass
finally:
 (OUT/'result.json').write_text(json.dumps(R,ensure_ascii=False,indent=2));print(json.dumps(R,ensure_ascii=False),flush=True)
if not R['passed']:raise SystemExit(1)
