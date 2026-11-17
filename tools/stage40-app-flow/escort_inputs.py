"""Normal-input high-road escort after combat, including original-context reload.
The ferry carries residents; heroes need not take an unnecessary water crossing.
"""
import time,json,lzma,hashlib

def finish_escort(p,out):
 events=[];start=time.monotonic()
 def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,q=b.honroAct4PreviewState,u=e.active;return{round:b.round,phase:b.phase,side:b.side,active:b.active,can:a.canInput(),dialogue:!!a.dialogue,x:u?.x,y:u?.y,move:u?.moveLeft,grounded:u&&e.grounded(u),support:u&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id,quiet:HonroAct4TerrainPreview.quietReady(b),projectiles:b.projectiles.length,volley:!!b.volley,heroes:b.units.filter(v=>v.side===0&&!v.summoned&&!v.honroAct4Resident).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead,acted:v.acted,grounded:e.grounded(v)})),residents:b.units.filter(v=>v.honroAct4Resident).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead,grounded:e.grounded(v),support:e.contactSurface(v.x,v.y-4,v.y+5)?.t?.id,r:v.r,h:v.h,jumping:v.jumping})),escort:q.returnEscort||null,events:q.events,roster:q.roster,complete:q.complete,water:q.water?.recoveries||[],geometry:b.honroAct4Design.geometry40}}''')
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
   ready();s=state();assert s['round']<=120 and all(h['hp']>0 and not h['dead'] for h in s['residents']),s
   h=next(h for h in s['heroes'] if h['id']==id)
   if h['hp']<=0 or h['dead']:record('incapacitated-hero-not-moved-'+id);return
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

 def return_to_coast(id):
  for _ in range(150):
   ready();s=state()
   h=next(v for v in s['heroes'] if v['id']==id)
   if h['hp']<=0 or h['dead']:record('incapacitated-hero-observed-'+id);return
   if h['acted'] or not choose(id):p.keyboard.press('f');p.wait_for_timeout(700);continue
   s=state();support=s['support']
   if support in ['approved40-coast-west','approved40-coast-east','approved40-upper-east']:return
   if s['move']<100:p.keyboard.press('f');p.wait_for_timeout(700);continue
   if support=='approved40-departure-ramp':goal=2170
   elif support=='approved40-departure-stair':goal=1615
   elif support=='a4-return-deck':goal=1905
   elif support=='approved40-dock':goal=1905
   elif support=='approved40-dock-stair':goal=2740
   else:
    record('unhandled-return-support');raise AssertionError('No prepared input policy for '+str(support))
   key='ArrowRight' if goal>s['x'] else 'ArrowLeft'
   takeoff=(support=='approved40-departure-ramp' and abs(s['x']-2170)<25) or (support=='approved40-departure-stair' and abs(s['x']-1615)<25)
   if takeoff:
    p.keyboard.press('Control');key='ArrowLeft' if support=='approved40-departure-ramp' else 'ArrowRight';record('normal-ascent-jump-'+id)
   if (support=='approved40-dock' and s['x']>1845) or (support=='approved40-dock-stair' and s['x']>2600):p.keyboard.press('Control')
   p.keyboard.down(key);p.wait_for_timeout(90 if takeoff else min(350,max(65,abs(goal-s['x'])/500*1000)));p.keyboard.up(key);p.wait_for_timeout(200);ready();after=record('return-to-coast-'+id)
   if after['active']==id and abs(after['x']-s['x'])<10 and after['move']>120:p.keyboard.press('Control');p.keyboard.down(key);p.wait_for_timeout(220);p.keyboard.up(key);p.wait_for_timeout(400)
  raise TimeoutError('actual lower-to-coast ascent stalled')
 for hero in state()['heroes']:return_to_coast(hero['id'])

 ready();s=record('escort-start');g=s['geometry'];pan(g['marks']['boat']);pan(g['marks']['high'])
 if not state()['escort']:
  move_to('occultist',2610);pan(g['marks']['boat']);pan(g['marks']['high']);ready();record('boarding-trigger')
 assert state()['escort'],'normal boarding trigger not reached'
 for id,x in [('mage',5030),('knight',5060),('archer',5000),('occultist',5090)]:move_to(id,x)
 phase=None;last_snapshot=0;last_motion=time.monotonic();last_positions=None
 for _ in range(300):
  if time.monotonic()-start>1200:
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
 rows=[f'A4.S40.{prefix}.{i:02d}' for prefix,count in [('BOARD',2),('REUNION',2),('THIRTEEN',3),('NEXT',4)] for i in range(1,count+1)]
 presented=[r for e in s['events'].values() for r in e.get('presented',[])];retired=[r for e in s['events'].values() for r in e.get('retired',[])]
 coverage={'required':rows,'presented':[r for r in rows if r in presented],'retired':[r for r in rows if r in retired],'missing':[r for r in rows if r not in presented]}
 (out/'dialogue-coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2))
 assert s['roster']=={'total':13,'living':11,'priorDeaths':2},s['roster']
 p.keyboard.press('e');p.wait_for_function("HonroApp.engine.b.phase==='won'",timeout=30000);final=record('won');assert final['complete'] and final['round']<=120
 p.screenshot(path=str(out/'outcome.jpg'),type='jpeg',quality=90)
 p.locator('[data-action="result-continue"]').click()
 # With Act5 released, the normal destination is Stage41, not a forced rest.
 p.wait_for_function("HonroApp.screen==='battle'&&HonroApp.engine?.b?.honroStage===41&&HonroApp.profile.honroBattle?.honroStage===41",timeout=60000)
 p.wait_for_timeout(1200)
 projection="""()=>Object.fromEntries(['cleared','heroes','equipment','honroAct4','recruited','loadouts'].map(k=>[k,HonroApp.profile[k]]))"""
 battle_projection="""()=>{const b=HonroApp.engine.b;return{stage:b.honroStage,round:b.round,phase:b.phase,heroes:b.units.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,hp:u.hp,maxHp:u.maxHp,dead:!!u.dead,x:u.x,y:u.y,loadout:u.loadout})),enemyCount:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length}}"""
 before=p.evaluate(projection);battle_before=p.evaluate(battle_projection)
 assert before['cleared'].get('40',{}).get('rounds')==final['round']
 assert before['equipment']['rewardLedger']['eq_so_t3b']['state']=='committed'
 (out/'postwin-destination.json').write_text(json.dumps({'profile':before,'battle':battle_before,'dialogue':p.evaluate('HonroApp.dialogue?.title')},ensure_ascii=False,indent=2))
 raw=p.evaluate("localStorage.getItem('honro-first-act-profile-1')");(out/'completed-storage.json.xz').write_bytes(lzma.compress(raw.encode()))
 p.screenshot(path=str(out/'next-stage-entry.jpg'),type='jpeg',quality=90)
 p.reload();p.wait_for_function('window.HonroApp');p.locator('.title-actions button.primary[data-action="continue"]').click()
 p.wait_for_function("HonroApp.screen==='battle'&&HonroApp.engine?.b?.honroStage===41",timeout=60000);p.wait_for_timeout(1200)
 after=p.evaluate(projection);battle_after=p.evaluate(battle_projection)
 (out/'postwin-reload.json').write_text(json.dumps({'before':before,'after':after,'battleBefore':battle_before,'battleAfter':battle_after},ensure_ascii=False,indent=2))
 assert before==after,'growth/proof/reward/clear/loadout changed on normal continuation'
 assert {k:v for k,v in battle_before.items() if k!='heroes'}=={k:v for k,v in battle_after.items() if k!='heroes'}
 for a,b in zip(battle_before['heroes'],battle_after['heroes']):
  assert {k:v for k,v in a.items() if k not in ['x','y']}=={k:v for k,v in b.items() if k not in ['x','y']}
  assert abs(a['x']-b['x'])<2 and abs(a['y']-b['y'])<2,(a,b)
 p.screenshot(path=str(out/'same-context-restored.jpg'),type='jpeg',quality=90)
 return {'passed':True,'round':final['round'],'heroes':final['heroes'],'residents':final['residents'],'roster':final['roster'],'presentedRequired':coverage['presented'],'retiredRequired':coverage['retired'],'unaccountedRequired':[r for r in rows if r not in presented and r not in retired],'allRequiredPresented':not coverage['missing'],'waterRecoveries':final['water'],'sameOriginalContextPostVictoryReload':True,'normalDestination':battle_after,'completedStorageSha256':hashlib.sha256(raw.encode()).hexdigest()}
