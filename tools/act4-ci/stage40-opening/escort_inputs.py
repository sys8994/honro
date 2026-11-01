"""Normal-input high-road escort after combat, including original-context reload.
The ferry carries residents; heroes need not take an unnecessary water crossing.
"""
import time,json,lzma,hashlib

def finish_escort(p,out):
 events=[];start=time.monotonic()
 def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,q=b.honroAct4PreviewState,u=e.active;return{round:b.round,phase:b.phase,side:b.side,active:b.active,can:a.canInput(),dialogue:!!a.dialogue,x:u?.x,y:u?.y,move:u?.moveLeft,grounded:u&&e.grounded(u),support:u&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id,heroes:b.units.filter(v=>v.side===0&&!v.summoned&&!v.honroAct4Resident).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead,acted:v.acted,grounded:e.grounded(v)})),residents:b.units.filter(v=>v.honroAct4Resident).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead})),escort:q.returnEscort||null,events:q.events,roster:q.roster,complete:q.complete,water:q.water?.recoveries||[],geometry:b.honroAct4Design.geometry40}}''')
 def record(label):
  s=state();events.append({'step':label,'state':s});(out/'escort-progress.json').write_text(json.dumps(events,ensure_ascii=False));print(label,s['round'],s['escort'] and s['escort']['phase'],flush=True);return s
 def ready():
  for _ in range(120):
   s=state()
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
 def move_to(id,x):
  for _ in range(45):
   ready();s=state();assert s['round']<=20 and all(h['hp']>0 and not h['dead'] for h in s['heroes']+s['residents']),s
   h=next(h for h in s['heroes'] if h['id']==id)
   if abs(h['x']-x)<45 and h['grounded']:return
   if h['acted'] or not choose(id):p.keyboard.press('f');p.wait_for_timeout(1000);continue
   s=state()
   if s['move']<100:p.keyboard.press('f');p.wait_for_timeout(1000);continue
   # Upper ridge joins the coast on the east. Never walk off its west cliff.
   goal=5820 if s['support']=='approved40-upper-east' and s['x']<5750 else x
   key='ArrowRight' if goal>s['x'] else 'ArrowLeft';ms=min(400,max(80,abs(goal-s['x'])/420*1000))
   p.keyboard.down(key);p.wait_for_timeout(ms);p.keyboard.up(key);p.wait_for_timeout(500);ready();z=record('escort-walk-'+id)
   if abs(z['x']-s['x'])<12 and z['active']==id and z['move']>120:p.keyboard.press('Control');p.keyboard.down(key);p.wait_for_timeout(260);p.keyboard.up(key);p.wait_for_timeout(900)
  raise TimeoutError('escort route did not reach target')
 ready();s=record('escort-start');g=s['geometry'];pan(g['marks']['boat']);pan(g['marks']['high'])
 if not state()['escort']:
  move_to('occultist',2610);pan(g['marks']['boat']);pan(g['marks']['high']);ready();record('boarding-trigger')
 assert state()['escort'],'normal boarding trigger not reached'
 for id,x in [('mage',5030),('knight',5060),('archer',5000),('occultist',5090)]:move_to(id,x)
 phase=None
 for _ in range(300):
  if time.monotonic()-start>600:raise TimeoutError('escort observation budget')
  ready();s=state();assert all(h['hp']>0 and not h['dead'] for h in s['heroes']+s['residents']),s
  current=s['escort']['phase']
  if current!=phase:record('phase-'+current);p.screenshot(path=str(out/('escort-'+current+'.jpg')),type='jpeg',quality=88);phase=current
  if current=='safe':break
  pan(g['marks']['boat'] if current in ['boarding','sailing'] else g['marks']['safe']);p.wait_for_timeout(1000)
 assert state()['escort']['phase']=='safe'
 pan(g['marks']['safe']);ready();pan(g['marks']['ridge']);pan(g['marks']['dislocation']);ready();s=record('gathered')
 rows=[f'A4.S40.{prefix}.{i:02d}' for prefix,count in [('BOARD',2),('REUNION',2),('THIRTEEN',3),('NEXT',4)] for i in range(1,count+1)]
 presented=[r for e in s['events'].values() for r in e.get('presented',[])];retired=[r for e in s['events'].values() for r in e.get('retired',[])]
 assert all(r in presented and r not in retired for r in rows),(presented,retired)
 assert s['roster']=={'total':13,'living':11,'priorDeaths':2},s['roster']
 p.keyboard.press('e');p.wait_for_function("HonroApp.engine.b.phase==='won'",timeout=30000);final=record('won');assert final['complete'] and final['round']<=20
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
 p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('여정 이어가기',exact=True).click();p.wait_for_function("HonroApp.screen==='rest'",timeout=60000);after=p.evaluate(projection);(out/'postwin-reload.json').write_text(json.dumps({'before':before,'after':after},ensure_ascii=False,indent=2));assert before==after
 p.screenshot(path=str(out/'same-context-restored.jpg'),type='jpeg',quality=90)
 return {'passed':True,'round':final['round'],'heroes':final['heroes'],'residents':final['residents'],'roster':final['roster'],'presentedRequired':rows,'retiredRequired':[],'waterRecoveries':final['water'],'sameOriginalContextPostVictoryReload':True,'completedStorageSha256':hashlib.sha256(raw.encode()).hexdigest()}
