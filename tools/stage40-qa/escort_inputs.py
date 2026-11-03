from navigation_proof import verify_navigation
"""Normal-input high-road escort after combat, including original-context reload.
The ferry carries residents; heroes need not take an unnecessary water crossing.
"""
import time,json,lzma,hashlib
from pathlib import Path

def finish_escort(p,out,*,functional_continuation=False):
 # A late, separately registered saved-state continuation diagnoses safety and
 # settlement only. The normal whole-run 20-round acceptance stays unchanged.
 def within_observation(round):return functional_continuation or round<=20
 events=[];start=time.monotonic();bridge=(Path(__file__).parent/'browser-planner.js').read_text()
 def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,q=b.honroAct4PreviewState,u=e.active;return{round:b.round,phase:b.phase,side:b.side,active:b.active,can:a.canInput(),dialogue:!!a.dialogue,x:u?.x,y:u?.y,move:u?.moveLeft,grounded:u&&e.grounded(u),support:u&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id,quiet:HonroAct4TerrainPreview.quietReady(b),foes:b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0).map(v=>v.id),projectiles:b.projectiles.length,volley:!!b.volley,heroes:b.units.filter(v=>v.side===0&&!v.summoned&&!v.honroAct4Resident).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead,acted:v.acted,grounded:e.grounded(v),support:e.contactSurface(v.x,v.y-4,v.y+5)?.t?.id})),residents:b.units.filter(v=>v.honroAct4Resident).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead,grounded:e.grounded(v),support:e.contactSurface(v.x,v.y-4,v.y+5)?.t?.id,r:v.r,h:v.h,jumping:v.jumping})),escort:q.returnEscort||null,events:q.events,roster:q.roster,complete:q.complete,water:q.water?.recoveries||[],geometry:b.honroAct4Design.geometry40}}''')
 def record(label):
  s=state();events.append({'step':label,'state':s});(out/'escort-progress.json').write_text(json.dumps(events,ensure_ascii=False));print(label,s['round'],s['escort'] and s['escort']['phase'],flush=True);return s
 def ready():
  for _ in range(120):
   s=state()
   assert not s['foes'],'Enemy/reinforcement during safe return'
   if s['dialogue']:p.wait_for_timeout(850);p.keyboard.press('Enter');continue
   if s['phase'] in ['won','lost']:return False
   if s['can'] and s['side']==0 and s['grounded']:return True
   p.wait_for_timeout(400)
  raise TimeoutError('escort input did not become ready')
 def pan(point):
  dims=p.evaluate('({w:HonroApp.engine.b.width,h:HonroApp.engine.b.height})');box=p.locator('#minimap').bounding_box();p.mouse.click(box['x']+box['width']*point['x']/dims['w'],box['y']+box['height']*point['y']/dims['h']);p.wait_for_timeout(1200);ready()
 def choose(id):
  if state()['active']==id:return True
  p.locator('[data-action="select-hero"][data-id="'+id+'"]').click();p.wait_for_timeout(300);return state()['active']==id
 def join_stair(id):
  def walk(goal,air=False):
   for _ in range(80):
    s=state()
    if s['active']!=id or not s['can'] or s['move']<100 or abs(s['x']-goal)<20:break
    key='ArrowRight' if goal>s['x'] else 'ArrowLeft';p.keyboard.down(key)
    try:p.wait_for_timeout(max(16,min(100,abs(goal-s['x'])/420*1000)))
    finally:p.keyboard.up(key)
   if not air:ready()
  walk(2350)
  if state()['active']!=id:return
  p.keyboard.press('Control');p.wait_for_timeout(250);walk(2140,True);ready();s=record('return-jump-land-before-climb')
  assert s['active']!=id or s['support']=='approved40-departure-stair','Return stair join failed'
 def move_to(id,x):
  for _ in range(45):
   ready();s=state();assert within_observation(s['round']) and all(h['hp']>0 and not h['dead'] for h in s['residents']),s
   h=next(h for h in s['heroes'] if h['id']==id)
   if abs(h['x']-x)<45 and h['grounded'] and h['support'] in ['approved40-coast-west','approved40-coast-east','approved40-upper-east']:return
   if h['acted'] or not choose(id):p.keyboard.press('f');p.wait_for_timeout(1000);continue
   s=state()
   if s['support']=='a4-return-deck':join_stair(id);continue
   if s['move']<100:p.keyboard.press('f');p.wait_for_timeout(1000);continue
   # Upper ridge joins the coast on the east. Never walk off its west cliff.
   connection=p.evaluate(bridge,'return-goal')
   if connection and abs(connection['x']-s['x'])<20:
    p.keyboard.press('Control');ready();z=record('return-support-jump');assert z['support']==connection['jumpLanding'];continue
   goal=connection['x'] if connection else 5820 if s['support']=='approved40-upper-east' and s['x']<5750 else 1445 if s['support'] in ['approved40-departure-stair','approved40-departure-ramp'] else 2670 if s['support'] in ['approved40-dock','approved40-dock-stair'] else x
   key='ArrowRight' if goal>s['x'] else 'ArrowLeft';ms=min(400,max(80,abs(goal-s['x'])/420*1000))
   p.keyboard.down(key);p.wait_for_timeout(ms);p.keyboard.up(key);p.wait_for_timeout(500);ready();z=record('escort-walk-'+id)
   if abs(z['x']-s['x'])<12 and z['active']==id and z['move']>120:p.keyboard.press('Control');p.keyboard.down(key);p.wait_for_timeout(260);p.keyboard.up(key);p.wait_for_timeout(900)
  raise TimeoutError('escort route did not reach target')
 ready();p.wait_for_function('HonroAct4TerrainPreview.quietReady(HonroApp.engine.b)',timeout=15000);s=record('escort-start');g=s['geometry'];pan(g['marks']['boat']);pan(g['marks']['high'])
 if not state()['escort']:
  move_to(next(h['id'] for h in state()['heroes'] if h['hp']>0 and not h['dead']),2610);pan(g['marks']['boat']);pan(g['marks']['high']);ready();record('boarding-trigger')
 assert state()['escort'],'normal boarding trigger not reached'
 # Advance every available survivor, not one hero while defending away the
 # other three movement budgets. Civilian survival remains mandatory.
 destinations={'mage':5030,'knight':5060,'archer':5000,'occultist':5090}
 for step in range(260):
  ready();s=state();assert within_observation(s['round']) and all(h['hp']>0 and not h['dead'] for h in s['residents']),s
  living=[h for h in s['heroes'] if h['hp']>0 and not h['dead']]
  assert living,'No surviving party'
  done=lambda h:abs(h['x']-destinations[h['id']])<45 and h['grounded'] and h['support'] in ['approved40-coast-west','approved40-coast-east','approved40-upper-east']
  if all(done(h) for h in living):break
  todo=[h for h in living if not done(h) and not h['acted']]
  if not todo:p.keyboard.press('f');p.wait_for_timeout(900);continue
  h=next((h for h in todo if h['id']==s['active']),todo[0])
  if not choose(h['id']):raise RuntimeError('Available survivor cannot be selected')
  s=state()
  if s['support']=='a4-return-deck':join_stair(h['id']);continue
  if s['move']<100:p.keyboard.press('f');p.wait_for_timeout(900);continue
  connection=p.evaluate(bridge,'return-goal')
  if connection and abs(connection['x']-s['x'])<20:
   p.keyboard.press('Control');ready();z=record('return-support-jump');assert z['support']==connection['jumpLanding'];continue
  goal=connection['x'] if connection else 1445 if s['support'] in ['approved40-departure-stair','approved40-departure-ramp'] else 2670 if s['support'] in ['approved40-dock','approved40-dock-stair'] else 5820 if s['support']=='approved40-upper-east' and s['x']<5750 else destinations[h['id']]
  key='ArrowRight' if goal>s['x'] else 'ArrowLeft';ms=min(400,max(25,abs(goal-s['x'])/420*1000))
  p.keyboard.down(key);p.wait_for_timeout(ms);p.keyboard.up(key);p.wait_for_timeout(450);ready();z=record('party-return-'+h['id'])
  if abs(z['x']-s['x'])<12 and z['active']==h['id'] and z['move']>120:p.keyboard.press('Control');p.keyboard.down(key);p.wait_for_timeout(220);p.keyboard.up(key);p.wait_for_timeout(800)
 else:raise TimeoutError('Supported party return did not converge')

 phase=None;last_snapshot=0;last_motion=time.monotonic();last_positions=None
 for _ in range(300):
  if time.monotonic()-start>600:
   record('observation-timeout');raise TimeoutError('escort observation budget')
  ready();s=state();assert all(h['hp']>0 and not h['dead'] for h in s['residents']),s
  current=s['escort']['phase']
  positions=[(v['id'],round(v['x']),round(v['y'])) for v in s['residents']]
  now=time.monotonic()
  if positions!=last_positions:last_motion=now;last_positions=positions
  if now-last_snapshot>=15:
   record('escort-observation');last_snapshot=now
   raw=p.evaluate("localStorage.getItem('honro-first-act-profile-1')")
   (out/'escort-observation-storage.json.xz').write_bytes(lzma.compress(raw.encode()))
  if now-last_motion>90:
   record('resident-motion-stall')
   raise TimeoutError('residents stationary for 90s; full state and actual persisted profile captured')
  if current!=phase:record('phase-'+current);p.screenshot(path=str(out/('escort-'+current+'.jpg')),type='jpeg',quality=88);phase=current
  if current=='safe':break
  pan(g['marks']['boat'] if current in ['boarding','sailing'] else g['marks']['safe']);p.wait_for_timeout(1000)
 assert state()['escort']['phase']=='safe'
 pan(g['marks']['safe']);ready();pan(g['marks']['ridge']);pan(g['marks']['dislocation']);ready();s=record('gathered')
 reviewed=json.loads((Path(__file__).resolve().parents[2]/'shared/data/act4/reviewed.json').read_text())
 rows=[line[0] for scene in reviewed['scenes'] if scene['stage']==40 for line in scene['lines']]
 assert rows,'Current Stage40 dialogue contract is empty'
 presented=[r for e in s['events'].values() for r in e.get('presented',[])];retired=[r for e in s['events'].values() for r in e.get('retired',[])]
 assert all(r in presented and r not in retired for r in rows),(presented,retired)
 assert s['roster']=={'total':13,'living':11,'priorDeaths':2},s['roster']
 p.keyboard.press('e');p.wait_for_function("HonroApp.engine.b.phase==='won'",timeout=30000);final=record('won');assert final['complete'] and within_observation(final['round'])
 p.screenshot(path=str(out/'outcome.jpg'),type='jpeg',quality=90)
 p.locator('[data-action="result-continue"]').click();p.wait_for_function("HonroApp.screen==='rest'",timeout=60000)
 projection='''()=>Object.fromEntries(['cleared','heroes','equipment','honroAct4','recruited'].map(k=>[k,HonroApp.profile[k]]))'''
 immediate=p.evaluate(projection)
 # The committed reward is notified by the normal rest UI. This legitimate
 # false->true acknowledgement is not growth/equipment loss on reload.
 p.wait_for_function("HonroApp.profile.equipment.rewardLedger.eq_so_t3b.notified===true",timeout=15000)
 before=p.evaluate(projection)
 transition={'immediate':immediate,'settled':before}
 (out/'postwin-notification.json').write_text(json.dumps(transition,ensure_ascii=False,indent=2))
 raw=p.evaluate("localStorage.getItem('honro-first-act-profile-1')");(out/'completed-storage.json.xz').write_bytes(lzma.compress(raw.encode()))
 verify_navigation(p.reload(),out,'settled-reload');p.wait_for_function('window.HonroApp');p.get_by_text('여정 이어가기',exact=True).click();p.wait_for_function("HonroApp.screen==='rest'",timeout=60000);after=p.evaluate(projection);(out/'postwin-reload.json').write_text(json.dumps({'before':before,'after':after},ensure_ascii=False,indent=2));assert before==after
 p.screenshot(path=str(out/'same-context-restored.jpg'),type='jpeg',quality=90)
 return {'passed':True,'round':final['round'],'functionalContinuation':functional_continuation,'within20':final['round']<=20,'heroes':final['heroes'],'residents':final['residents'],'roster':final['roster'],'presentedRequired':rows,'retiredRequired':[],'waterRecoveries':final['water'],'sameOriginalContextPostVictoryReload':True,'completedStorageSha256':hashlib.sha256(raw.encode()).hexdigest()}
