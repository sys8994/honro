"""Unpublished Stage40 prepared-profile UI diagnostic, never fun/cohort approval.
All live mutations use exposed DOM, keyboard or minimap controls. Planner clones
current state only. No HP/pose/kill/scene-flag injection or hidden item actions.
"""
import os,json,lzma,time,hashlib,traceback,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'act4-ci'))
from precise_aim import aim_with_joystick
root=Path(os.environ.get('HONRO_REPO_ROOT','.')).resolve();out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=False)
bridge=(Path(__file__).parent/'browser-planner.js').read_text()
late=False
variant=os.environ['HONRO40_MAGE_CHOICE']
choices=json.loads((Path(__file__).parent/'records/mage-choice-candidates.json').read_text())
cast_count=0
raw=lzma.decompress((root/'tools/stage40-qa/records/41615805406-precast-mage-profile.json.xz').read_bytes())
(out/'source-profile.json').write_bytes(raw)
result={'passed':False,'releaseApproved':False,'scope':'Prepared endgame profile, actual browser inputs; not earned1–39/cohort/fun approval','sourceCommit':os.environ.get('GITHUB_SHA'),'events':[],'errors':[]}
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True);context=browser.new_context(viewport={'width':1440,'height':900});p=context.new_page();p.on('pageerror',lambda e:result['errors'].append(str(e)))
 def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active;return {round:b.round,active:u?.id,phase:b.phase,side:b.side,can:a.canInput(),dialogue:!!a.dialogue,x:u?.x,y:u?.y,facing:u?.facing,angle:u?.angle,move:u?.moveLeft,grounded:u&&e.grounded(u),support:u&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id,canDrop:e.canDrop(),finale:b.honroFinalDefenseRevision,major:b.units.filter(v=>v.side===1&&v.boss).length,minis:b.units.filter(v=>v.side===1&&v.honroMidboss).length,shots:b.shots,proof:HonroAct4TerrainPreview.proofValid(b),health:b.units.filter(v=>v.side===0&&!v.summoned&&!v.honroAct4Resident).map(v=>({id:v.id,hp:v.hp,dead:v.dead,acted:v.acted,x:v.x,y:v.y})),residents:b.units.filter(v=>v.honroAct4Resident).map(v=>({id:v.id,hp:v.hp,dead:v.dead})),foes:b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0).map(v=>({id:v.id,hp:v.hp,x:v.x,y:v.y})),boss:b.units.find(v=>v.honroAct4FinaleBoss)?.honroPilotCombat}}''')
 def record(label,extra=None):
  s=state();result['events'].append({'label':label,'state':s,'extra':extra});(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(label,s['round'],s['active'],len(s['foes']),flush=True);return s
 def ready():
  for _ in range(150):
   s=state()
   if s['dialogue']:p.wait_for_timeout(850);p.keyboard.press('Enter');continue
   if s['phase'] in ['won','lost']:return False
   if s['can'] and s['side']==0 and s['grounded']:return True
   p.wait_for_timeout(300)
  raise TimeoutError('Input readiness bound')
 def hold(key,ms):
  p.keyboard.down(key)
  try:p.wait_for_timeout(ms)
  finally:p.keyboard.up(key)
  p.wait_for_timeout(250)
 def walk_to(actor,x,air=False):
  for _ in range(80):
   s=state()
   if s['active']!=actor or not s['can'] or s['move']<100 or abs(s['x']-x)<20:break
   p.keyboard.down('ArrowRight' if x>s['x'] else 'ArrowLeft')
   try:p.wait_for_timeout(max(16,min(100,abs(x-s['x'])/420*1000)))
   finally:p.keyboard.up('ArrowRight' if x>s['x'] else 'ArrowLeft')
  if not air:ready()
 def join_stair(actor):
  walk_to(actor,2350)
  if state()['active']!=actor:return
  p.keyboard.press('Control');p.wait_for_timeout(250);walk_to(actor,2140,True);ready()
  z=record('jump-land-before-climb')
  assert z['active']!=actor or z['support']=='approved40-departure-stair','Deck stair join did not land'
 def pan(x,y):
  dims=p.evaluate('({w:HonroApp.engine.b.width,h:HonroApp.engine.b.height})');box=p.locator('#minimap').bounding_box();assert box;p.mouse.click(box['x']+box['width']*x/dims['w'],box['y']+box['height']*y/dims['h']);p.wait_for_timeout(450)
 def view():
  s=state();p.mouse.move(720,400);p.mouse.wheel(0,1800);p.wait_for_timeout(200);pan(s['x'],s['y']-180)
 def warnings():
  targets=p.evaluate('HonroApp.engine.b.units.filter(u=>u.side===1&&!u.dead&&u.honroPilotCombat?.target&&!u.honroPilotCombat.target.seen).map(u=>({x:u.honroPilotCombat.target.x,y:u.honroPilotCombat.target.y}))')
  for t in targets:pan(t['x'],t['y'])
 def choose(id):
  if state()['active']==id:return
  p.locator('[data-action="select-hero"][data-id="'+id+'"]').click();p.wait_for_timeout(150);ready()
 try:
  p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded');p.wait_for_function('window.HonroApp')
  p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str((out/'source-profile.json').resolve()))
  p.wait_for_function('HonroApp.profile?.lastStage===40',timeout=120000);p.reload();p.wait_for_function('window.HonroApp');p.locator('.title-actions [data-action="continue"]').first.click();p.wait_for_function('HonroApp.engine?.b.honroStage===40&&HonroApp.engine.b.round==='+str(25 if late else 1),timeout=120000)
  ready();initial=record('entry');assert initial['proof'] and len(initial['foes'])==41 and initial['major']==1 and initial['minis']==2 and initial['finale']==2
  # A normal import must retain earned skill ranks/equipment, not add test gear.
  saved=json.loads(raw);assert initial['active']=='mage'
  for u in initial['health']:
   v=next(v for v in saved['honroBattle']['units'] if v['id']==u['id']);assert u['hp']==v['hp'] and abs(u['x']-v['x'])<.1 and abs(u['y']-v['y'])<.1
  budget=p.evaluate('()=>Object.fromEntries(Object.entries(HonroApp.profile.heroes).map(([k,v])=>[k,{xp:v.xp,ranks:v.ranks,equipmentIds:v.equipmentIds,earned:HONRO_CORE.pointsEarned(v),spent:HONRO_CORE.pointsSpent(v,k)}]))')
  for cls,v in budget.items():
   assert v['spent']<=v['earned']
   for k in ['xp','ranks','equipmentIds']:assert v[k]==saved['heroes'][cls][k]
  (out/'entry-budget.json').write_text(json.dumps(budget,indent=2));view();p.screenshot(path=str(out/'entry.png'));started=time.monotonic();selected=set()
  for turn in range(1):
   if time.monotonic()-started>2400:raise TimeoutError('Registered40-minute combat observation bound')
   ready();s=state()
   if not s['foes'] or s['round']>(25 if late else 6) or s['phase'] in ['won','lost']:break
   if any(v['dead'] for v in s['residents']):raise AssertionError('Resident casualty')
   if False and s['round'] not in selected:
    selected.add(s['round'])
    if any(h['id']=='knight' and not h['dead'] and not h['acted'] for h in s['health']):choose('knight')
   warnings();priority=p.evaluate(bridge,'priority')
   if priority:choose(priority)
   actor=state()['active'];goal=None;support=None;retreat=None
   if retreat:
    if state()['support'] in ['a4-return-deck','approved40-departure-ramp']:join_stair(actor)
    if state()['active']==actor:walk_to(actor,retreat['refuge']);record('visible-tide-retreat')
   for _ in range(0):
    s=state()
    if s['active']!=actor or not s['can'] or s['move']<120:break
    if goal is None or support!=s['support']:goal=p.evaluate(bridge,'goal');support=s['support']
    if not goal:break
    dx=goal['x']-s['x']
    if abs(dx)<(20 if goal.get('jumpLanding') or goal.get('deckJoin') else 35):
     if goal.get('deckJoin'):join_stair(actor);goal=None;continue
     if goal.get('jumpLanding'):
      p.keyboard.press('Control');ready();z=record('upper-connection-jump')
      assert z['active']!=actor or z['support']==goal['jumpLanding'];goal=None;continue
     if goal.get('drop') and s['canDrop']:
      p.keyboard.press('Alt')
      if goal.get('driftRight'):hold('ArrowRight',540)
      p.wait_for_timeout(1400);ready();goal=None;continue
     break
    hold('ArrowRight' if dx>0 else 'ArrowLeft',max(20,min(300,abs(dx)/420*1000)));ready();z=record('move',{'actor':actor,'goal':goal})
    if z['active']!=actor:break
    if abs(z['x']-s['x'])<12 and z['move']>300:p.keyboard.press('Control');hold('ArrowRight' if dx>0 else 'ArrowLeft',260);ready()
   ready()
   if state()['active']!=actor:continue
   view();q={'choice':choices[variant],'scope':'Registered candidate from the identical captured current-state snapshot'};record('plan',q);c=q['choice'];c['idx']=p.evaluate('(id)=>HonroApp.engine.active.loadout.indexOf(id)',c['id'])
   if c:
    s=state();face=-1 if c['angle']>90 else 1
    if s['facing']!=face:hold('ArrowLeft' if face<0 else 'ArrowRight',60);ready();q=p.evaluate(bridge,'plan');c=q['choice'];record('replan-facing',q)
   if not c:before=state();p.keyboard.press('f');p.wait_for_timeout(1100);ready();record('actual-ui-defend',{'actor':before['active'],'move':before['move']});continue
   p.keyboard.press('Digit'+str(c['idx']+1));p.wait_for_timeout(100)
   aim_result=aim_with_joystick(p,c['angle'],lambda:{**state(),'moveLeft':state()['move']})
   record('precision-aim',{'choice':c,'inputResult':aim_result})
   assert aim_result['passed'],'Bounded normal joystick aim did not converge without context change'
   before_cast=state()
   checkpoint=p.evaluate('()=>({battle:HonroApp.engine.b,profile:HonroApp.profile})')
   (out/('precast-%02d.json.xz'%cast_count)).write_bytes(lzma.compress(json.dumps({'choice':c,'actualUI':before_cast,**checkpoint}).encode()))
   evaluator=(Path(__file__).parent/'legal-cast.mjs').read_text().replace('export function','function')
   matrix=p.evaluate('c=>{'+evaluator+";const a=HonroApp,b=a.engine.b,original=JSON.stringify(b),rows=[];for(const da of [-1,-.25,0,.25,1])for(const dp of [-.05,-.03,-.01,0,.01,.03,.05]){const power=Math.max(0,Math.min(1,c.power+dp));rows.push({da,dp,...evaluateLegalCast(HONRO_CORE,b,a.engine.active.id,c.id,c.angle+da,power)});}if(JSON.stringify(b)!==original)throw Error('Tolerance observer mutated live state');return rows;}",c)
   (out/('tolerance-%02d.json'%cast_count)).write_text(json.dumps({'choice':c,'rows':matrix},indent=2))
   p.screenshot(path=str(out/'idle-guide.png'))
   p.keyboard.down('Space')
   try:
    if variant!='basic':
     p.wait_for_function('target=>HonroApp.charging&&HonroApp.chargePower(performance.now())>=target',arg=max(0,c['power']-.05),timeout=8000,polling=16)
     preview_before=p.evaluate('()=>({power:HonroApp.chargePower(performance.now()),preview:HonroApp.scene.preview})')
     p.screenshot(path=str(out/'charging-guide.png'))
     preview_after=p.evaluate('()=>({power:HonroApp.chargePower(performance.now()),preview:HonroApp.scene.preview})')
     (out/'preview-window.json').write_text(json.dumps({'before':preview_before,'after':preview_after},indent=2))
    p.wait_for_function('target=>HonroApp.charging&&HonroApp.chargePower(performance.now())>=target',arg=max(0,c['power']-.02),timeout=8000,polling=16)
   finally:p.keyboard.up('Space')
   p.wait_for_timeout(1200);ready();record('actual-ui-cast',{'choice':c,'actual':p.evaluate('(id)=>HonroApp.engine.b.lastShots?.[id]',actor)})
   cast_count+=1
   p.screenshot(path=str(out/('cast-%02d.png'%cast_count)))
   if cast_count>=1:
    if late:assert not state()['foes'],'Observed 2HP boss countercast did not clear combat'
    result['passed']=True;result['focused']='One saved mage choice/preview '+variant;result['friendlyHpLoss']=sum(max(0,u['hp']-next(v['hp'] for v in state()['health'] if v['id']==u['id'])) for u in before_cast['health']);result['enemyHpLoss']=sum(u['hp'] for u in before_cast['foes'])-sum(u['hp'] for u in state()['foes']);raise SystemExit(0)
   if turn%8==0:p.screenshot(path=str(out/('turn-%03d.png'%turn)))
  raise AssertionError('Registered focused cast limit not reached')
 except Exception as error:
  result['failure']=str(error);result['traceback']=traceback.format_exc()
  try:record('failure');p.screenshot(path=str(out/'failure.png'))
  except Exception:pass
 finally:
  try:(out/'final-storage.json.xz').write_bytes(lzma.compress(p.evaluate("localStorage.getItem('honro-first-act-profile-1')").encode()))
  except Exception:pass
  result['elapsedSeconds']=time.monotonic()-started if 'started' in locals() else None;(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));browser.close()
if not result['passed']:raise SystemExit(1)
