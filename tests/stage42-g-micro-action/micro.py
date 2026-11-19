"""LOCAL REVIEW CANDIDATE. One G campaign action, not mission progress proof."""
import argparse,ast,hashlib,json,math,os,pathlib,time,urllib.parse
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('url');p.add_argument('output',type=pathlib.Path);p.add_argument('entry_observer',type=pathlib.Path);p.add_argument('source_invariants',type=pathlib.Path);a=p.parse_args()
assert urllib.parse.urlparse(a.url).hostname in ('localhost','127.0.0.1','::1') and urllib.parse.urlparse(a.url).scheme=='http'
assert not a.output.exists();src=a.entry_observer.read_bytes()
# Pin trusted setup without importing/executing the prior observer's main routine.
EXPECTED='ad80cc9ad60be841ea64fe57f7f36fb6d1ec16ebaf8e566e31dd00e6fe5f0b12'
assert hashlib.sha256(src).hexdigest()==EXPECTED
setup=None
for n in ast.parse(src).body:
 if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in n.targets):setup=ast.literal_eval(n.value)
assert isinstance(setup,str)
inv=json.loads(a.source_invariants.read_text());assert inv['checks']==46 and inv['othersUnchanged'] and inv['gameplayRolesUnchanged']
a.output.mkdir(parents=True);result={'classification':'prepared G campaign, one ordinary action only','completed':False,'events':[]};held=set();start=time.monotonic()
READ='''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active;const cv=document.querySelector('#battlecanvas');return {
 stage:b.honroStage,origin:b.honroMapOrigin,custom:!!b.honroCustom,screen:a.screen,dialogue:!!a.dialogue,modal:a.modal.classList.contains('open'),done:!!a.done,canInput:a.canInput(),focus:document.hasFocus(),focusTag:document.activeElement?.tagName,focusEditable:!!document.activeElement?.isContentEditable,
 round:b.round,side:b.side,step:b.honroState.act5.step,phase:b.phase,shot:b.shot,selected:a.selected,charging:a.charging,power:a.power,fireDisabled:document.querySelector('#fire')?.disabled,
 ground:b.terrain.find(t=>t.id==='stage42-g-engineering-ground')?.vertices.length,world:b.honroWorldTerrain?.find(t=>t.id==='stage42-g-engineering-ground')?.vertices.length,
 active:u&&{id:u.id,x:u.x,y:u.y,h:u.h,tune:u.tune,angle:u.angle,facing:u.facing,moveLeft:u.moveLeft,acted:!!u.acted,loadout:u.loadout},
 units:b.units.map(v=>({id:v.id,side:v.side,x:v.x,y:v.y,h:v.h,r:v.r,hp:v.hp,maxHp:v.maxHp,dead:!!v.dead,airborne:!!v.airborne})),
 environment:{wind:b.wind,physics:b.physics,drafts:b.drafts.length,fields:b.fields.length},skill:{id:HONRO_CORE.SKILLS[a.selected]?.id,cls:HONRO_CORE.SKILLS[a.selected]?.cls,mode:HONRO_CORE.SKILLS[a.selected]?.mode,gravity:HONRO_CORE.SKILLS[a.selected]?.gravity,drag:HONRO_CORE.SKILLS[a.selected]?.drag},projectiles:b.projectiles.map(q=>({id:q.id,skill:q.skill,shot:q.shot,age:q.age,followup:!!q.followup,repeatIndex:q.repeatIndex,child:!!q.child,launchX:q.launchX,launchY:q.launchY,owner:q.owner,x:q.x,y:q.y,vx:q.vx,vy:q.vy})),canvas:!!cv&&cv.isConnected};}'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('HONRO_CHROME') or None);context=browser.new_context(viewport={'width':1280,'height':800});page=context.new_page();errors=[]
 context.add_init_script("Storage.prototype.setItem=function(){throw Error('QA persistent storage blocked')};")
 page.on('pageerror',lambda e:errors.append(type(e).__name__))
 def read():return page.evaluate(READ)
 def save():
  result['elapsedMs']=round((time.monotonic()-start)*1000);(a.output/'micro.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
 def log(kind,**kw):result['events'].append({'ms':round((time.monotonic()-start)*1000),'kind':kind,**kw});save()
 def guard(s,action=False):
  assert s['stage']==42 and s['origin']=='campaign' and not s['custom'] and s['screen']=='battle'
  assert s['ground']==76 and s['world']==100 and s['step']==0 and not s['done'] and not s['dialogue'] and not s['modal']
  assert s['focus'] and not s['focusEditable'] and s['focusTag'] not in ('INPUT','TEXTAREA','SELECT','BUTTON','A')
  assert not errors
  if action:assert s['canInput'] and s['round']==1 and s['side']==0 and s['phase']=='aim' and s['active']['id']=='p-archer' and not s['active']['acted']
 def pulse(key,ms):
  guard(read(),True);log('key',key=key,durationMs=ms);page.keyboard.down(key);held.add(key)
  try:page.wait_for_timeout(ms)
  finally:page.keyboard.up(key);held.discard(key)
 def photo(name):
  s=read()
  if s['stage']==42 and s['screen']=='battle' and not s['dialogue'] and not s['modal']:page.screenshot(path=str(a.output/name));return True
  return False
 try:
  page.goto(a.url,wait_until='domcontentloaded');page.wait_for_function('!!globalThis.HonroApp && !!globalThis.HonroCampaignLoader',timeout=90000)
  result['setup']=page.evaluate(setup)
  page.wait_for_function('HonroApp.engine?.b?.honroStage===42 && HonroApp.screen==="battle"',timeout=30000)
  # Same reviewed introductory transition only; no calls to progression/combat APIs.
  page.evaluate("()=>{const a=HonroApp,b=a.engine.b;let n=0;while(a.dialogue&&n<12){HonroStory.finish(a);n++;}if(a.dialogue||b.round!==1||b.honroState.act5.step!==0)throw Error('Intro not initial');}")
  page.bring_to_front();page.wait_for_timeout(700)
  s=read();guard(s,True);result['before']=s;assert photo('before.png');save()
  # No click/focus injection: if natural page focus is not safe, guard fails closed.
  assert s['active']['moveLeft']>0
  pulse('KeyD',200);m=read();guard(m,True)
  result['movement']={'before':s['active'],'after':m['active'],'dx':m['active']['x']-s['active']['x'],'dy':m['active']['y']-s['active']['y']};save()
  assert 0<result['movement']['dx']<200 and m['active']['moveLeft']<s['active']['moveLeft'],'D200 did not prove movement expenditure'
  assert m['active']['facing']>0
  # Prior genuine D200 measured 128.530759 world units. Re-measure this run,
  # then walk normally ahead of stationary teammates; never change actor pose.
  rate=result['movement']['dx']/200
  assert .1<rate<1.0,'Unexpected measured movement rate'
  result['clearanceMovement']=[]
  for attempt in range(6):
   m=read();guard(m,True);actor=m['active']
   if actor['x']>=550:break
   assert actor['moveLeft']>=100 and actor['x']<620,'Movement budget/position unsafe'
   target=next(v for v in m['units'] if v['id']=='a5-foe-0')
   guests=[v for v in m['units'] if v['id'] in ('a5-gwak','a5-soldier-one','a5-soldier-two')]
   assert not target['dead'] and target['x']-actor['x']>350
   assert len(guests)==3 and all(not v['dead'] and v['x']-actor['x']>1500 for v in guests)
   ms=max(20,min(70,(570-actor['x'])/rate))
   pulse('KeyD',ms);n=read();guard(n,True)
   row={'durationMs':ms,'before':actor,'after':n['active']}
   result['clearanceMovement'].append(row);save()
   assert 0<n['active']['x']-actor['x']<100 and n['active']['moveLeft']<actor['moveLeft'],'No genuine forward budget use'
   assert n['active']['x']<=620,'Exceeded safe clearance window'
  m=read();guard(m,True)
  assert 550<=m['active']['x']<=620,'Clearance window not reached within bounded inputs'
  teammates=[v for v in m['units'] if v['id'] in ('p-mage','p-knight','p-occultist')]
  assert len(teammates)==3 and all(not v['dead'] and m['active']['x']-v['x']>=60 for v in teammates),'Not safely ahead of teammates'
  # Only ordinary A01, selected through the real loadout key; no guessed special skill.
  slot=m['active']['loadout'].index('A01')+1;assert 1<=slot<=4
  pulse('Digit'+str(slot),40);m=read();assert m['selected']=='A01' and m['fireDisabled'] is False
  target=next(v for v in m['units'] if v['id']=='a5-foe-0');assert not target['dead'] and target['hp']>0 and target['x']>m['active']['x']
  assert 350<target['x']-m['active']['x']<550,'Nearest foe no longer in planned directional window'
  result['target']={'id':target['id'],'x':target['x'],'y':target['y'],'reason':'first living required approach foe to the right; hit not promised'}
  # Conservative elevated rightward shot, not a claimed ballistic solution.
  # Raise the barrel above allied bodies on the initial rising shoulder; reject blocked launch ray.
  goal=65.0
  for i in range(18):
   m=read();guard(m,True);delta=goal-m['active']['angle']
   if abs(delta)<=2:break
   pulse('ArrowUp' if delta>0 else 'ArrowDown',max(15,min(100,abs(delta)/62*1000)))
  m=read();guard(m,True);assert abs(m['active']['angle']-goal)<=2
  actor=m['active'];rad=math.radians(actor['angle']);originY=actor['y']-actor['h']*.65
  for v in m['units']:
   if v['dead'] or v['id']==actor['id'] or v['side']==1:continue
   dx=v['x']-actor['x']
   if 0<dx<350:assert originY-math.tan(rad)*dx<v['y']-v['h']-25,'Nearby friendly launch ray not clear'
  guests=[v for v in m['units'] if v['id'] in ('a5-gwak','a5-soldier-one','a5-soldier-two')]
  assert len(guests)==3 and all(not v['dead'] and v['x']>actor['x']+1500 for v in guests)
  result['preFire']=m;save()
  env=m['environment'];ph=env['physics'];sk=m['skill']
  assert sk['id']=='A01' and sk['cls']=='archer' and sk['mode']=='arrow','Unexpected draw/shot type'
  assert sk.get('gravity',1) in (None,1) and sk.get('drag',.034) in (None,.034)
  assert env['wind']==0 and env['drafts']==0 and env['fields']==0,'Unmodelled force source'
  assert ph['gravity']=={'x':0,'y':320} and ph['dragScale']==1 and ph['flow']=={'x':0,'y':0} and not ph['regions'] and not ph['timeline'],'Nonconstant environment'
  assert 0<=actor['tune']<=1 and 63<=actor['angle']<=67
  target=next(v for v in m['units'] if v['id']=='a5-foe-0')
  assert abs(target['x']-1034.67)<.1 and abs(target['y']-1615.8852941176472)<.1 and target['h']==120 and not target['dead']
  assert target['r']>3 and target['hp']==1451
  # Analytic inverse of exact constant-force linear drag; no game predict/fire API.
  rad=math.radians(actor['angle']);ox=actor['x']+42*math.cos(rad);oy=actor['y']-actor['h']*.63-42*math.sin(rad);dx=target['x']-ox;aimY=target['y']-target['h']*.5
  def at(v,x):
   z=1-.034*(x-ox)/(v*math.cos(rad))
   if z<=0:return math.inf
   t=-math.log(z)/.034;U=(1-z)/.034
   return oy-v*math.sin(rad)*U+320*(t-U)/.034
  lo,hi=380.,500.
  assert at(lo,target['x'])>aimY>at(hi,target['x'])
  for _ in range(50):
   mid=(lo+hi)/2
   if at(mid,target['x'])>aimY:lo=mid
   else:hi=mid
  speed=(lo+hi)/2;full=805*1.15943759*(1+(.5-actor['tune'])*.04);goalPower=speed/full
  assert .4<=goalPower<=.55 and .8<=speed/480<=1.05
  # Validate the trajectory against actual G ring, not a restored old terrain.
  ring=page.evaluate("()=>HonroApp.engine.b.terrain.find(t=>t.id==='stage42-g-engineering-ground').vertices.map(v=>({x:v.x,y:v.y}))")
  assert len(ring)==76
  def top(x):
   ys=[a['y']+(x-a['x'])/(b['x']-a['x'])*(b['y']-a['y']) for a,b in zip(ring,ring[1:]+ring[:1]) if a['x']!=b['x'] and min(a['x'],b['x'])<=x<=max(a['x'],b['x'])]
   assert ys
   return min(ys)
  clear=min(top(ox+dx*i/1000)-at(speed,ox+dx*i/1000) for i in range(1001))
  assert clear>20,'Ground clearance too small'
  blockers=[v['id'] for v in m['units'] if not v['dead'] and v['id'] not in (actor['id'],target['id']) and ox-3<=v['x']+v['r'] and v['x']-v['r']<=target['x']]
  assert not blockers,'Another body lies in target corridor'
  result['prediction']={'speed':speed,'actualAngle':actor['angle'],'fullSpeed':full,'power':goalPower,'holdSeconds':speed/480,'origin':{'x':ox,'y':oy},'aimY':aimY,'minVerticalClearance':clear};save()
  # Exactly one ordinary Space press/release. RAF only reads current charge HUD.
  guard(read(),True);log('key',key='Space',release='read-only RAF threshold');page.keyboard.down('Space');held.add('Space')
  try:
   result['chargeGate']=page.evaluate("""goal=>new Promise(resolve=>{const start=performance.now();let n=0;const poll=()=>{const a=HonroApp,b=a.engine.b,u=a.engine.active;n++;const q={frames:n,elapsedMs:performance.now()-start,power:a.power,charging:a.charging,holdMs:performance.now()-a.chargeAt};if(!document.hasFocus()||a.dialogue||a.modal.classList.contains('open')||b.honroStage!==42||b.round!==1||b.honroState.act5.step!==0||b.phase!=='aim'||u.id!=='p-archer'||a.selected!=='A01')return resolve({...q,ok:false,reason:'state changed'});if(a.charging&&a.power>=goal)return resolve({...q,ok:true});if(q.elapsedMs>=1200)return resolve({...q,ok:false,reason:'charge timeout'});requestAnimationFrame(poll)};requestAnimationFrame(poll)})""",goalPower)
  finally:
   page.keyboard.up('Space');held.discard('Space')
  result['postRelease']=read();save()
  result['chargeWithinTolerance']=result['chargeGate']['ok'] and abs(result['postRelease']['power']-goalPower)<=.015
  seen=[];result['projectileObservations']=seen;deadline=time.monotonic()+15;flightPhoto=False
  while time.monotonic()<deadline:
   q=read();guard(q)
   own=[v for v in q['projectiles'] if v.get('owner')==actor['id']]
   if own:
    seen.append({'ms':round((time.monotonic()-start)*1000),'phase':q['phase'],'projectiles':own});save()
    if not flightPhoto:flightPhoto=photo('in-flight.png');result['inFlightPng']=flightPhoto
   if seen and not own and q['phase']!='flight':break
   if q['shot']!=m['shot'] and not own and time.monotonic()>deadline-12:break
   page.wait_for_timeout(50)
  result['after']=read();result['projectileObservations']=seen;result['shotCounterChanged']=result['after']['shot']!=m['shot']
  beforeHP={v['id']:v['hp'] for v in m['units']};result['hpDelta']=[{'id':v['id'],'before':beforeHP[v['id']],'after':v['hp'],'delta':v['hp']-beforeHP[v['id']]} for v in result['after']['units'] if v['id'] in beforeHP]
  result['targetDamaged']=any(v['id']=='a5-foe-0' and v['delta']<0 for v in result['hpDelta'])
  protected={v['id'] for v in m['units'] if v['side']==0 or v['id'] in ('a5-gwak','a5-soldier-one','a5-soldier-two')}
  result['protectedHpUnchanged']=all(v['delta']==0 for v in result['hpDelta'] if v['id'] in protected)
  result['projectileIds']=sorted({v['id'] for f in seen for v in f['projectiles']})
  result['completed']=bool(seen) and result['targetDamaged'] and result['protectedHpUnchanged'] and result['chargeWithinTolerance']
  result['stopReason']='one target0 damage test finished; no quest claim' if result['completed'] else 'partial or failed target0 test; no retry'
 except Exception as e:result['stopReason']=type(e).__name__+': '+str(e)
 finally:
  for key in list(held):page.keyboard.up(key)
  try:result['last']=read();result['afterPng']=photo('after.png')
  except Exception:result['captureFailed']=True
  result['pageErrorTypes']=errors;result['inFlightPng']=result.get('inFlightPng',False);save();context.close();browser.close()
print(a.output/'micro.json')

