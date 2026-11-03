"""Unpublished Stage40 prepared-profile UI diagnostic, never fun/cohort approval.
All live mutations use exposed DOM, keyboard or minimap controls. Planner clones
current state only. No HP/pose/kill/scene-flag injection or hidden item actions.
"""
import os,json,lzma,time,hashlib,traceback,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'act4-ci'))
from precise_aim import aim_with_joystick
from role_outcome import useful_role_effect
root=Path(os.environ.get('HONRO_REPO_ROOT','.')).resolve();out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=False)
bridge=(Path(__file__).parent/'browser-planner.js').read_text()
actor='archer';case='joint';entry_round=4
raw=lzma.decompress((root/'tools/stage40-qa/records/41646946262-turn-013.json.xz').read_bytes());resume=True
flank_source=(Path(__file__).parent/'coast-flank-route.mjs').read_text().replace('export function','function')
flank_bridge="()=>{const e=HonroApp.engine,b=e.b,u=e.active,surface=v=>e.contactSurface(v.x,v.y-4,v.y+5)?.t.id;"+flank_source+";return coastFlankGoal(u,{support:surface(u),foes:b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0),heroes:b.units.filter(v=>v.side===0&&!v.summoned&&!v.honroAct4Resident),surface,topAt:HONRO_CORE.topAt,terrains:b.terrain});}"
(out/'source-profile.json').write_bytes(raw)
result={'passed':False,'releaseApproved':False,'scope':'Prepared endgame profile, actual browser inputs; not earned1–39/cohort/fun approval','sourceCommit':os.environ.get('GITHUB_SHA'),'events':[],'errors':[]}
result['continuationOf']=41646946262;result['case']=case
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
 def shoot(actor):
  choose(actor);warnings();q=p.evaluate(bridge,'plan-faced');c=q['choice']
  if c and state()['facing']!=(-1 if c['angle']>90 else 1):
   hold('ArrowLeft' if c['angle']>90 else 'ArrowRight',60);ready();q=p.evaluate(bridge,'plan-faced');c=q['choice']
  record('role-plan',q)
  if not c:raise AssertionError('No safe useful role shot for '+actor)
  p.keyboard.press('Digit'+str(c['idx']+1));view()
  a=aim_with_joystick(p,c['angle'],lambda:{**state(),'moveLeft':state()['move']});assert a['passed']
  p.screenshot(path=str(out/(actor+'-aim.png')));before=state()
  report_read="""(actor)=>{const r=HonroApp.engine.b.honroReport;if(!r?.heroes?.[actor])throw Error('Missing actual battle report');return{actorDamage:r.heroes[actor].damage,friendlyDamage:r.other.friendly?.damage||0,enemyReceived:r.other.enemy?.received||0};}"""
  report_before=p.evaluate(report_read,actor);p.keyboard.down('Space')
  try:p.wait_for_function('target=>HonroApp.charging&&HonroApp.chargePower(performance.now())>=target',arg=max(0,c['power']-.02),timeout=8000,polling=16)
  finally:p.keyboard.up('Space')
  p.wait_for_timeout(1200);ready();after=state()
  damage=sum(u['hp'] for u in before['foes'])-sum(u['hp'] for u in after['foes']);friendly=sum(max(0,u['hp']-next(v['hp'] for v in after['health'] if v['id']==u['id'])) for u in before['health'])
  healing=sum(max(0,next(v['hp'] for v in after['health'] if v['id']==u['id'])-u['hp']) for u in before['health'])
  report_after=p.evaluate(report_read,actor);attributed_damage=report_after['actorDamage']-report_before['actorDamage'];friendly_report_delta=report_after['friendlyDamage']-report_before['friendlyDamage']
  record('role-shot',{'reportBefore':report_before,'reportAfter':report_after,'actorDamageDelta':attributed_damage,'friendlyReportDelta':friendly_report_delta,'actor':actor,'choice':c,'actual':p.evaluate('(id)=>HonroApp.engine.b.lastShots[id]',actor),'enemyHpLoss':damage,'friendlyHpLoss':friendly,'friendlyHpGain':healing});assert attributed_damage>0 and friendly_report_delta==0,'No positive attributable damage or friendly-fire report increased'
 try:
  p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded');p.wait_for_function('window.HonroApp')
  p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str((out/'source-profile.json').resolve()))
  p.wait_for_function('HonroApp.profile?.lastStage===40',timeout=120000);p.reload();p.wait_for_function('window.HonroApp');p.locator('.title-actions [data-action="continue"]').first.click();p.wait_for_function('(round)=>HonroApp.engine?.b.round===round',arg=entry_round,timeout=120000)
  ready();started=time.monotonic();initial=record('exact-saved-entry');saved=json.loads(raw);assert initial['active']==actor
  for u in initial['health']:
   old=next(v for v in saved['honroBattle']['units'] if v['id']==u['id']);assert u['hp']==old['hp'] and abs(u['x']-old['x'])<.1
  assert p.evaluate('HonroApp.profile.heroes')==saved['heroes']
  cast_count=0;roles=[]
  for actor in ['archer','mage','occultist']:
   assert state()['round']==entry_round;choose(actor);warnings();q=p.evaluate(bridge,'plan-faced');goal=None
   if not q['choice']:
    goal=p.evaluate(flank_bridge);record('current-unoccupied-flank-goal',goal)
    if goal:walk_to(actor,goal['x']);record('joint-normal-reposition');q=p.evaluate(bridge,'plan-faced')
   roles.append({'actor':actor,'goal':goal,'choice':q['choice']})
   if q['choice']:shoot(actor);cast_count+=1
   else:p.keyboard.press('f');p.wait_for_timeout(1100);ready();record('no-useful-shot-normal-defend')
  final=record('joint-after-enemy-response');assert final['round']==entry_round+1
  p.wait_for_timeout(1000);view();p.screenshot(path=str(out/'joint-enemy-response.png'))
  result['roles']=roles;result['castCount']=cast_count
  assert cast_count>=2,'Joint formation did not preserve two useful shooting roles'
  result['passed']=True;result['scope']='One exact R4 normal continuation, current-facing choice plus unoccupied flank fallback;two useful roles and next enemy response;no whole-stage acceptance'

 except Exception as e:
  result['failure']=str(e);result['traceback']=traceback.format_exc()
  try:record('failure');p.screenshot(path=str(out/'failure.png'))
  except Exception:pass
 finally:
  try:(out/'final-storage.json.xz').write_bytes(lzma.compress(p.evaluate("localStorage.getItem('honro-first-act-profile-1')").encode()))
  except Exception:pass
  result['elapsedSeconds']=time.monotonic()-started if 'started' in locals() else None
  (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));browser.close()
if not result['passed']:raise SystemExit(1)
