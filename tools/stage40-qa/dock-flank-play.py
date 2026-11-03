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
raw=lzma.decompress((root/'tools/stage40-qa/records/41624405996-r14-profile.json.xz').read_bytes())
entry_round=14;resume=True
(out/'source-profile.json').write_bytes(raw)
result={'passed':False,'releaseApproved':False,'scope':'Prepared endgame profile, actual browser inputs; not earned1–39/cohort/fun approval','sourceCommit':os.environ.get('GITHUB_SHA'),'events':[],'errors':[]}
result['continuationOf']=41624405996
result['entryRound']=entry_round
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
  p.wait_for_function('HonroApp.profile?.lastStage===40',timeout=120000);p.reload();p.wait_for_function('window.HonroApp');p.locator('.title-actions [data-action="continue"]').first.click();p.wait_for_function('HonroApp.engine?.b.round===14',timeout=120000)
  ready();started=time.monotonic();initial=record('exact-r14-entry');saved=json.loads(raw);assert initial['active']=='mage'
  for u in initial['health']:
   old=next(v for v in saved['honroBattle']['units'] if v['id']==u['id']);assert u['hp']==old['hp'] and abs(u['x']-old['x'])<.1
  assert p.evaluate('JSON.stringify(HonroApp.profile.heroes)')==json.dumps(saved['heroes'],ensure_ascii=False,separators=(',',':')) or p.evaluate('HonroApp.profile.heroes')==saved['heroes']
  view();warnings();p.screenshot(path=str(out/'entry.png'))
  walk_to('mage',2152);z=record('wide-flank-arrival');assert z['active']=='mage' and z['round']==14 and z['support']=='approved40-dock'
  # Face left using normal movement, then inspect the actual changed state.
  if z['facing']!=-1:hold('ArrowLeft',60);ready()
  c={'id':'M01','idx':0,'angle':144.51912245185096,'power':.8041430650599697}
  evaluator=(Path(__file__).parent/'legal-cast.mjs').read_text().replace('export function','function')
  check=p.evaluate('c=>{'+evaluator+';const b=HonroApp.engine.b,old=JSON.stringify(b),r=evaluateLegalCast(HONRO_CORE,b,"mage",c.id,c.angle,c.power);if(JSON.stringify(b)!==old)throw Error("Observer mutated live state");return r}',c)
  record('current-state-shot-check',check);assert check['safe'] and check['enemyDamage']>0,'Registered basic shot unsafe/unusable at actual arrival'
  p.keyboard.press('Digit1');view();a=aim_with_joystick(p,c['angle'],lambda:{**state(),'moveLeft':state()['move']});assert a['passed'];record('aim',a);p.screenshot(path=str(out/'aim.png'))
  before=state();p.keyboard.down('Space')
  try:p.wait_for_function('target=>HonroApp.charging&&HonroApp.chargePower(performance.now())>=target',arg=c['power']-.02,timeout=8000,polling=16)
  finally:p.keyboard.up('Space')
  p.wait_for_timeout(1200);ready();after=record('actual-basic-cast',{'actual':p.evaluate('HonroApp.engine.b.lastShots.mage')});p.screenshot(path=str(out/'cast.png'))
  result['enemyHpLoss']=sum(u['hp'] for u in before['foes'])-sum(u['hp'] for u in after['foes']);result['friendlyHpLoss']=sum(max(0,u['hp']-next(v['hp'] for v in after['health'] if v['id']==u['id'])) for u in before['health'])
  # Observe one genuine enemy response without casting more shots.
  for _ in range(4):
   if state()['round']>14:break
   warnings();p.keyboard.press('f');p.wait_for_timeout(1100);ready();record('actual-defend-for-response')
  warnings();view();record('after-enemy-response');p.screenshot(path=str(out/'response.png'))
  assert result['enemyHpLoss']>0 and result['friendlyHpLoss']==0
  result['passed']=True;result['scope']='One normal-import R14 broad flank/basic shot and enemy response; not whole-stage acceptance'
 except Exception as e:
  result['failure']=str(e);result['traceback']=traceback.format_exc()
  try:record('failure');p.screenshot(path=str(out/'failure.png'))
  except Exception:pass
 finally:
  result['elapsedSeconds']=time.monotonic()-started if 'started' in locals() else None
  (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));browser.close()
if not result['passed']:raise SystemExit(1)
