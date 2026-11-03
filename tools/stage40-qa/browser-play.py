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
raw=lzma.decompress((root/'tools/act4-rc/fixtures/stage40-checkpoints/sailing-observation-local-storage.json.xz').read_bytes());assert hashlib.sha256(raw).hexdigest()=='2c8e5d95e1e956059da5ae0b74a02641beed0bccf0932568194b108fec3a8141'
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
  p.wait_for_function('HonroApp.profile?.lastStage===40',timeout=120000);p.reload();p.wait_for_function('window.HonroApp');p.locator('.title-actions [data-action="continue"]').first.click();p.wait_for_function('HonroApp.engine?.b.honroStage===40&&HonroApp.engine.b.round===1',timeout=120000)
  ready();initial=record('entry');assert initial['proof'] and len(initial['foes'])==42 and initial['major']==1 and initial['minis']==2 and initial['finale']==2
  # A normal import must retain earned skill ranks/equipment, not add test gear.
  saved=json.loads(raw);budget=p.evaluate('()=>Object.fromEntries(Object.entries(HonroApp.profile.heroes).map(([k,v])=>[k,{xp:v.xp,ranks:v.ranks,equipmentIds:v.equipmentIds,earned:HONRO_CORE.pointsEarned(v),spent:HONRO_CORE.pointsSpent(v,k)}]))')
  for cls,v in budget.items():
   assert v['spent']<=v['earned']
   for k in ['xp','ranks','equipmentIds']:assert v[k]==saved['heroes'][cls][k]
  (out/'entry-budget.json').write_text(json.dumps(budget,indent=2));view();p.screenshot(path=str(out/'entry.png'));started=time.monotonic();selected=set()
  for turn in range(140):
   if time.monotonic()-started>3600:raise TimeoutError('Registered60-minute combat observation bound')
   ready();s=state()
   if not s['foes'] or s['round']>24 or s['phase'] in ['won','lost']:break
   if any(v['dead'] for v in s['residents']):raise AssertionError('Resident casualty')
   if s['round'] not in selected:
    selected.add(s['round'])
    if any(h['id']=='knight' and not h['dead'] and not h['acted'] for h in s['health']):choose('knight')
   warnings();priority=p.evaluate(bridge,'priority')
   if priority:choose(priority)
   actor=state()['active'];goal=None;support=None;retreat=p.evaluate(bridge,'tide')
   if retreat:
    if state()['support'] in ['a4-return-deck','approved40-departure-ramp']:join_stair(actor)
    if state()['active']==actor:walk_to(actor,retreat['refuge']);record('visible-tide-retreat')
   for _ in range(0 if retreat else 30):
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
   # Read the existing save object only; never force/replace a battle snapshot.
   (out/('turn-profile-%03d.json.xz'%turn)).write_bytes(lzma.compress(p.evaluate('JSON.stringify(HonroApp.profile)').encode()))
   view();q=p.evaluate(bridge,'plan');record('plan',q);c=q['choice']
   if c:
    s=state();face=-1 if c['angle']>90 else 1
    if s['facing']!=face:hold('ArrowLeft' if face<0 else 'ArrowRight',60);ready();q=p.evaluate(bridge,'plan');c=q['choice'];record('replan-facing',q)
   if not c:before=state();p.keyboard.press('f');p.wait_for_timeout(1100);ready();record('actual-ui-defend',{'actor':before['active'],'move':before['move']});continue
   p.keyboard.press('Digit'+str(c['idx']+1));p.wait_for_timeout(100)
   aim_result=aim_with_joystick(p,c['angle'],lambda:{**state(),'moveLeft':state()['move']})
   record('precision-aim',{'choice':c,'inputResult':aim_result})
   assert aim_result['passed'],'Bounded normal joystick aim did not converge without context change'
   before_cast=state()
   p.keyboard.down('Space')
   try:p.wait_for_function('target=>HonroApp.charging&&HonroApp.chargePower(performance.now())>=target',arg=max(0,c['power']-.02),timeout=8000,polling=16)
   finally:p.keyboard.up('Space')
   p.wait_for_timeout(1200);ready();record('actual-ui-cast',{'choice':c,'actual':p.evaluate('(id)=>HonroApp.engine.b.lastShots?.[id]',actor)})
   if os.environ.get('HONRO40_FIRST_CAST_ONLY')=='1':
    actual=p.evaluate('(id)=>HonroApp.engine.b.lastShots?.[id]',actor);after_cast=state()
    assert actual and actual['skill']==c['id'],'Actual requested skill was not cast'
    assert sum(v['hp'] for v in after_cast['foes'])<sum(v['hp'] for v in before_cast['foes']),'First cast caused no observed enemy damage'
    result['passed']=True;result['focused']='First normal-input cast only; no stage completion claim';p.screenshot(path=str(out/'first-cast.png'));raise SystemExit(0)
   if turn%8==0:p.screenshot(path=str(out/('turn-%03d.png'%turn)))
  final=record('combat-end');p.screenshot(path=str(out/'combat-end.png'));assert not final['foes'] and final['round']<=20,'Combat failed approved time target'
  from escort_inputs import finish_escort
  result['escort']=finish_escort(p,out);assert not result['errors'];result['passed']=True
 except Exception as error:
  result['failure']=str(error);result['traceback']=traceback.format_exc()
  try:record('failure');p.screenshot(path=str(out/'failure.png'))
  except Exception:pass
 finally:
  try:(out/'final-storage.json.xz').write_bytes(lzma.compress(p.evaluate("localStorage.getItem('honro-first-act-profile-1')").encode()))
  except Exception:pass
  result['elapsedSeconds']=time.monotonic()-started if 'started' in locals() else None;(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));browser.close()
if not result['passed']:raise SystemExit(1)
