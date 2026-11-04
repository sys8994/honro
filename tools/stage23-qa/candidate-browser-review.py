"""HUD-only candidate: real UI Continue from exact earned-in-native R33 checkpoint.
Not fresh browser R1 play, not human/device timing, no live battle writes.
"""
import json,os,hashlib,time,traceback,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('_local/reports/stage23-candidate-browser');OUT.mkdir(parents=True,exist_ok=True)
# This is an allowlisted CI-generated game fixture, never a player's save.
# Its repository constructor uses C.defaults() and legal simulated reward-ledger
# setup, without reading any account, browser storage or personal file.
SOURCE=Path('_local/stage23-prior/checkpoint.json')
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()=='3fc9877946d2aa13b7d3dfc920f433c352827bf7edec8910336dfbbf8d7ca3c9','Only the reviewed synthetic checkpoint is permitted'
source=json.loads(SOURCE.read_text())
assert source['provenance']['sourceTarget']=='5a0e8e2dda9a606e02f1c1e72e5222ac10948f64' and source['provenance']['resume'] is None
assert source['provenance']['entryFixture'].startswith('Pre-entry first-clear/recruit reward-ledger fixture through22;')
saved=source['profile'];(OUT/'source-profile.json').write_text(json.dumps(saved,ensure_ascii=False))
URL='http://127.0.0.1:8765/HONRO.html'
R={'passed':False,'scope':'This exact built HUD-only candidate, actual Chromium UI/keyboard/touch from original40 natural native R33. Not a whole browser playthrough or subjective fun approval. Entry progression through22 is a legal fixture.','sourceCommit':os.environ.get('GITHUB_SHA'),'nativeRun':41759542357,'nativeCommit':'5a0e8e2dda9a606e02f1c1e72e5222ac10948f64','checkpointSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'views':[],'errors':[]}
STATE='''()=>{const a=HonroApp,e=a.engine,b=e?.b,u=e?.active,n=b?.units.find(v=>v.id==='act3-carrier'),s=a.scene,cv=s?.canvas.getBoundingClientRect(),rect=id=>{const q=document.getElementById(id),x=q?.getBoundingClientRect();return q&&!q.hidden&&getComputedStyle(q).display!=='none'&&getComputedStyle(q).visibility!=='hidden'&&x?.width>0?{left:x.left,right:x.right,top:x.top,bottom:x.bottom}:null};return {stage:b?.honroStage,round:b?.round,phase:b?.phase,side:b?.side,can:a.canInput(),dialogue:!!a.dialogue,mode:a.mode,revision:b?.honroCampaignMapRevision,difficulty:b?.difficulty,goal:b?HonroAct23V4.current(b)?.id:null,done:b?HonroAct23V4.mem(b).done:null,active:u?{id:u.id,x:u.x,y:u.y,hp:u.hp,move:u.moveLeft,angle:u.angle,ground:e.grounded(u)}:null,npc:n?{x:n.x,y:n.y,hp:n.hp,move:n.moveLeft,walk:n.honroV4Distance}:null,remaining:b?.units.filter(v=>v.side===1&&!v.dead&&v.hp>0).length,shots:b?.shot,cleared:a.profile.cleared?.['23'],heroes:b?.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,acted:v.acted,dead:!!v.dead})),camera:s?{x:s.x,y:s.y,scale:s.scale,manual:s.manual}:null,labels:(s?.missionDrawn||[]).map(q=>({...q,left:q.left+(cv?.left||0),right:q.right+(cv?.left||0),top:q.top+(cv?.top||0),bottom:q.bottom+(cv?.top||0)})),equipmentButton:rect('equipment-pending-battle'),minimap:rect('minimap'),documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,bodyPoseValid:u?HONRO_CORE.validTerrainContactPose(b.terrain,u):null}}'''
def snap(p,label):
 s=p.evaluate(STATE);p.screenshot(path=str(OUT/(label+'.png')));return s
def clearance(s):
 assert s['labels'] and s['equipmentButton'],s
 def overlap(a,b):return a['left']<b['right'] and a['right']>b['left'] and a['top']<b['bottom'] and a['bottom']>b['top']
 for q in s['labels']:
  assert not overlap(q,s['equipmentButton']),('equipment overlap',q,s)
  assert not s['minimap'] or not overlap(q,s['minimap']),('minimap overlap',q,s)
def ready(p,terminal=True):
 for _ in range(100):
  s=p.evaluate(STATE)
  if s['dialogue']:p.wait_for_timeout(350);p.keyboard.press('Enter');continue
  if s['phase'] in ['won','lost']:return False
  if s['can'] and s['active'] and s['active']['ground']:return True
  p.wait_for_timeout(150)
 raise TimeoutError('Normal input not ready')
def opened(browser,w,h,mobile):
 ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1);p=ctx.new_page();p.on('pageerror',lambda e:R['errors'].append(str(e)))
 response=p.goto(URL,wait_until='domcontentloaded');assert response and response.status==200,'Public HTML unavailable';p.wait_for_function('window.HonroApp',timeout=60000)
 p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str((OUT/'source-profile.json').resolve()))
 p.wait_for_function('HonroApp.profile?.lastStage===23',timeout=60000);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.locator('.title-actions [data-action="continue"]').first.click();p.wait_for_function('HonroApp.engine?.b.honroStage===23',timeout=60000);ready(p)
 s=p.evaluate(STATE);assert s['round']==33 and s['revision']==423 and s['difficulty']=='story' and s['phase']=='aim',s
 assert p.evaluate('(t)=>JSON.stringify(HonroApp.engine.b.terrain)===JSON.stringify(t)',saved['honroBattle']['terrain']),'Terrain changed on Continue'
 assert p.evaluate('(h)=>Object.keys(h).every(k=>JSON.stringify(HonroApp.profile.heroes[k].ranks)===JSON.stringify(h[k].ranks)&&HonroApp.profile.heroes[k].xp===h[k].xp)',saved['heroes']),'Continue changed earned growth'
 return ctx,p
def touch(ctx,p,selector,dx,dy,ms):
 b=p.locator(selector).bounding_box();assert b,selector;x=b['x']+b['width']/2;y=b['y']+b['height']/2;c=ctx.new_cdp_session(p)
 c.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
 if dx or dy:c.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+dx,'y':y+dy}]})
 p.wait_for_timeout(ms);c.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});c.detach()
def hold(p,key,ms):
 p.keyboard.down(key)
 try:p.wait_for_timeout(ms)
 finally:p.keyboard.up(key)
try:
 raw=urllib.request.urlopen(URL,timeout=60).read();R['builtHtmlSha256']=hashlib.sha256(raw).hexdigest();assert raw==Path('HONRO.html').read_bytes(),'Served HTML must equal this exact normal build'
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  for label,w,h,mobile in [('desktop',1440,900,False),('portrait',390,844,True),('landscape',844,390,True)]:
   ctx,p=opened(browser,w,h,mobile);row={'label':label,'entry':snap(p,label+'-entry')};R['views'].append(row)
   assert row['entry']['documentWidth']<=w and row['entry']['bodyPoseValid'],row;clearance(row['entry'])
   assert p.evaluate('HonroApp.engine.b.units.filter(u=>u.side===1).length')==40
   owned=p.evaluate('HonroApp.profile.equipment.ownedItemIds');p.locator('#equipment-pending-battle').click();p.wait_for_function('HonroApp.modalKind?.includes("equipment")');p.get_by_text('나중에',exact=True).click();ready(p);assert p.evaluate('HonroApp.profile.equipment.ownedItemIds')==owned;row['equipmentOpenClose']=True
   if mobile:
    p.set_viewport_size({'width':h,'height':w});p.wait_for_timeout(500);row['rotated']=snap(p,label+'-rotated');clearance(row['rotated']);p.set_viewport_size({'width':w,'height':h});p.wait_for_timeout(500)
   if mobile:touch(ctx,p,'#joystick',0,-28,250)
   else:hold(p,'ArrowUp',250)
   row['aimAdjusted']=snap(p,label+'-aim-adjusted');assert row['aimAdjusted']['active']['angle']!=row['entry']['active']['angle'],'Ordinary aim input ineffective'
   # Walk on the actual final slope/road and let the carrier follow. No engine calls.
   for step in range(60):
    s=p.evaluate(STATE)
    if s['dialogue']:ready(p);s=p.evaluate(STATE)
    if s['phase'] in ['won','lost']:break
    if s['active']['id']!='p-archer':raise AssertionError('Unexpected active hero')
    if s['active']['x']>=9250:break
    if mobile:touch(ctx,p,'#joystick',35,0,100)
    else:hold(p,'ArrowRight',100)
    p.wait_for_timeout(30)
   for _ in range(80):
    s=p.evaluate(STATE)
    if s['dialogue']:p.wait_for_timeout(350);p.keyboard.press('Enter')
    elif s['phase'] in ['won','lost']:break
    else:p.wait_for_timeout(150)
   row['arrival']=snap(p,label+'-arrival');assert row['arrival']['phase']=='won',row['arrival'];assert row['arrival']['npc']['hp']>0 and row['arrival']['remaining']>0
   assert all(row['arrival']['done'].get(k) for k in ['dispatch-bundle','dock-mid','dock-exit'])
   # Settlement and reload must not grant a second victory or duplicate XP.
   reward=p.evaluate('({clear:HonroApp.profile.cleared[23],heroes:HonroApp.profile.heroes,equipment:HonroApp.profile.equipment,honroGrowth:HonroApp.profile.honroGrowth})');row['reward']=reward
   p.locator('[data-action="result-continue"]').click();p.wait_for_timeout(500)
   for _ in range(30):
    if not p.evaluate('!!HonroApp.dialogue'):break
    p.keyboard.press('Enter');p.wait_for_timeout(350)
   row['rest']=snap(p,label+'-rest');assert p.locator('.rest-screen').count()==1,'Normal result continuation did not reach shelter'
   p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');after=p.evaluate('({clear:HonroApp.profile.cleared[23],heroes:HonroApp.profile.heroes,equipment:HonroApp.profile.equipment,honroGrowth:HonroApp.profile.honroGrowth})')
   assert after==reward,'Reload changed settlement';row['rewardStableAfterReload']=True;p.screenshot(path=str(OUT/(label+'-reload.png')));ctx.close()
  browser.close()
 R['passed']=not R['errors']
except Exception:
 R['failure']=traceback.format_exc()
 try:R['failureState']=snap(p,'failure')
 except Exception:pass
finally:
 (OUT/'result.json').write_text(json.dumps(R,ensure_ascii=False,indent=2));print(json.dumps(R,ensure_ascii=False),flush=True)
if not R['passed']:raise SystemExit(1)
