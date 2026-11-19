"""Review-only proposal: two fresh native P6r3/A10 fixtures, one ordinary shot each."""
import hashlib,json,math,os,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright
P=Path(__file__).parent;out=Path(sys.argv[1]);assert not out.exists();out.mkdir(parents=True)
url=sys.argv[2];assert url=='http://127.0.0.1:8884/HONRO_WORKSHOP.html'
sha=lambda b:hashlib.sha256(b).hexdigest()
src=(P/'slice.json').read_bytes();ab=(P/'A10-honro-asset.json').read_bytes()
assert sha(src)=='7a6cc9aa56d0916634be76e5a3baf359596c0da7725d9f45f0eb284e13fac498'
assert sha(ab)=='e04c8abf48f35d9550de0207d86f53953d131debf3ef6478ee45b4349a4a8359'
raw=json.loads(src);art=json.loads(ab);rings={q['id']:q['ring'] for q in raw['owners']};assert [len(v) for v in rings.values()]==[74,61,70]
wanted={k:[dict(x=x,y=y) for x,y in r] for k,r in rings.items()}
def surface(r,x):return min(y+(x-X)*(Y-y)/(XX-X) for (X,y),(XX,Y) in zip(r,r[1:]+r[:1]) if X!=XX and min(X,XX)<=x<=max(X,XX))
foot=surface(rings['RescueOverhang'],800);tid='p6r3-tactical-target';target=[{'x':788,'y':foot-40},{'x':812,'y':foot-40},{'x':812,'y':foot},{'x':788,'y':foot}]
proof={'scope':'two fresh synthetic P6r3/A10 one-Archer shots; no campaign or escort proof','source':sha(src),'asset':sha(ab),'arms':{},'passed':False}
def save():(out/'proof.json').write_text(json.dumps(proof,indent=2))
READ='''()=>{const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,b=e.b,u=e.active,w=a.scene.canvas.ownerDocument.defaultView,s=w.HONRO_CORE.SKILLS[a.selected];return {
 ready:a.canInput(),focus:w.document.hasFocus(),focusTag:w.document.activeElement?.tagName,dialogue:!!a.dialogue,modal:a.modal.classList.contains('open'),round:b.round,phase:b.phase,shot:b.shot,selected:a.selected,power:a.power,charging:a.charging,
 unit:{id:u.id,x:u.x,y:u.y,h:u.h,r:u.r,hp:u.hp,tune:u.tune,move:u.moveLeft,angle:u.angle,facing:u.facing,loadout:u.loadout,grounded:e.grounded(u),support:e.contactSurface(u.x,u.y-4,u.y+4)?.t.id??null},
 skill:{mode:s.mode,cls:s.cls,gravity:s.gravity??1,drag:s.drag??.034},physics:b.physics,wind:b.wind,fields:b.fields.length,drafts:b.drafts.length,
 terrain:b.terrain.map(q=>({id:q.id,hp:q.hp,broken:!!q.broken,indestructible:!!q.indestructible,vertices:q.vertices})),
 projectiles:b.projectiles.map(q=>({id:q.id,owner:q.owner,skill:q.skill,shot:q.shot,x:q.x,y:q.y,vx:q.vx,vy:q.vy,age:q.age,child:!!q.child,followup:!!q.followup,repeatIndex:q.repeatIndex})),observer:window.__tacticalObs?{events:window.__tacticalObs.events,frames:window.__tacticalObs.frames}:null};}'''
save()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.environ['HONRO_CHROME'],headless=True,args=['--no-sandbox'])
 for arm in ['B','M']:
  row={'passed':False,'inputs':[]};proof['arms'][arm]=row;save();ctx=browser.new_context(viewport={'width':1500,'height':900});page=ctx.new_page();held=set();errors=[];page.on('pageerror',lambda e:errors.append(type(e).__name__))
  def read():return page.evaluate(READ)
  def guard(q,act=True):
   assert not errors and not q['dialogue'] and not q['modal'] and q['focus'] and q['focusTag'] not in ['BUTTON','INPUT','TEXTAREA','SELECT']
   assert q['unit']['id']=='p6-r3-qa-scout' and q['round']==1 and q['unit']['hp']==365
   if act:assert q['ready'] and q['phase']=='aim'
   assert len(q['terrain'])==4 and {t['id']:t['vertices'] for t in q['terrain'] if t['id']!=tid}==wanted
  def photo(label):
   q=read()
   if not q['dialogue'] and not q['modal']:page.screenshot(path=str(out/(arm+'-'+label+'.png')));return True
   return False
  def pulse(k,ms):
   guard(read());row['inputs'].append({'key':k,'ms':ms});page.keyboard.down(k);held.add(k)
   try:page.wait_for_timeout(ms)
   finally:page.keyboard.up(k);held.discard(k)
  def walk(x,limit=8000):
   guard(read());row['inputs'].append({'key':'KeyD','untilX':x});page.keyboard.down('KeyD');held.add('KeyD')
   try:page.wait_for_function('x=>{const u=HonroWorkshopAPI.getPlayApp().engine.active;return u.x>=x||u.moveLeft<=0}',arg=x,polling='raf',timeout=limit)
   finally:page.keyboard.up('KeyD');held.discard('KeyD')
  try:
   page.goto(url);page.wait_for_function('!!window.HonroWorkshopAPI',timeout=60000)
   data=page.evaluate('''({wanted,art,target,foot})=>{const s=HonroMaps.emptyStage('qa-p6r3-tactical','P6r3 isolated tactical QA',1210,560);
    s.environment.placements=[];s.environment.hiddenLayers=['L2','L3','L4','L5'];s.environment.atmosphere.overrides={skyTop:'#151c23',skyBottom:'#151c23'};
    s.terrains=Object.keys(wanted).map(id=>({id,name:id,layer:'terrain',type:'solid',points:wanted[id],baseMaterial:'rock',oneWay:false,breakable:false}));
    s.terrains.push({id:'p6r3-tactical-target',name:'Synthetic wood target',layer:'terrain',type:'solid',points:target,baseMaterial:'wood',oneWay:false,breakable:true});
    s.units=[HonroUnits.record('archer','p6-r3-qa-scout',95,foot,'player')];
    s.objectives=[{id:'qa-never-reached',type:'reach',label:'QA only',x:1170,y:74,radius:25,required:true}];
    const a={id:'qa-inert-empty',name:'Empty toolbar sentinel',category:'scenery',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};a.reference=HonroEnvironment.referenceForLegacyAsset(a);
    art.reference=HonroEnvironment.referenceForLegacyAsset(art);s.elements=[{id:'qa-p6-r3-a10-surface',assetId:art.id,layer:'prop',depthLayer:'L1',x:0,y:0,scale:1,rotation:0,snap:false}];
    return HonroMaps.finalize({schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,name:s.name,environmentVersion:HonroEnvironment.VERSION,settings:{autosave:false,grid:10},stages:[s],library:[a,art]});}''',dict(wanted=wanted,art=art,target=target,foot=surface(rings['SupplyBasin'],95)))
   if arm=='B':fixture=data;row['fixtureSha256']=sha(json.dumps(data,sort_keys=True).encode())
   else:assert data==fixture,'Fresh arm fixture differs'
   assert {q['id']:q['points'] for q in data['stages'][0]['terrains']}=={**wanted,tid:target}
   with page.expect_file_chooser() as fc:page.locator('#importBtn').click()
   fc.value.set_files(dict(name='synthetic-p6r3-tactical.honro-map.json',mimeType='application/json',buffer=json.dumps(data).encode()))
   page.wait_for_function("HonroWorkshopAPI.queryScene().stage.id==='qa-p6r3-tactical'")
   page.locator('[data-tab=play]').click();page.wait_for_function('HonroWorkshopAPI.getPlayApp()?.canInput()',timeout=45000);page.locator('#runtimeFrame').evaluate('f=>f.contentWindow.focus()')
   q=read();guard(q);assert q['unit']['tune']==.5 and q['unit']['grounded'] and q['unit']['support']=='SupplyBasin'
   row['entry']=q;save();walk(599);q=read();guard(q);assert 598<=q['unit']['x']<=614 and q['unit']['support']=='SupplyBasin' and q['unit']['move']>180
   if arm=='M':
    pulse('ControlLeft',25)
    page.wait_for_function('()=>{const u=HonroWorkshopAPI.getPlayApp().engine.active;return u.jumping&&u.vy<0&&u.y<=232}',polling='raf',timeout=1800)
    walk(686,2600)
    page.wait_for_function("()=>{const e=HonroWorkshopAPI.getPlayApp().engine,u=e.active;return e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+4)?.t.id==='RescueOverhang'}",timeout=5100)
   q=read();guard(q);assert q['unit']['grounded'];assert q['unit']['support']==('SupplyBasin' if arm=='B' else 'RescueOverhang')
   assert (598<=q['unit']['x']<=614) if arm=='B' else (685<=q['unit']['x']<=710)
   slot=q['unit']['loadout'].index('A01')+1;assert slot<=4;pulse('Digit'+str(slot),30)
   goal=45 if arm=='B' else 30
   for _ in range(20):
    q=read();guard(q);delta=goal-q['unit']['angle']
    if abs(delta)<.7:break
    pulse('ArrowUp' if delta>0 else 'ArrowDown',max(10,min(60,abs(delta)/62*1000)))
   q=read();guard(q);u=q['unit'];assert abs(u['angle']-goal)<.7 and u['facing']>0 and u['tune']==.5 and q['selected']=='A01'
   ph=q['physics'];assert ph['gravity']=={'x':0,'y':320} and ph['dragScale']==1 and ph['flow']=={'x':0,'y':0} and not ph['regions'] and not ph['timeline']
   assert q['wind']==0 and q['fields']==q['drafts']==0 and q['skill']=={'mode':'arrow','cls':'archer','gravity':1,'drag':.034}
   tgt=next(t for t in q['terrain'] if t['id']==tid);assert tgt['hp']>0 and not tgt['broken'] and not tgt['indestructible'];row['targetInitialHp']=tgt['hp']
   r=math.radians(u['angle']);ox=u['x']+42*math.cos(r);oy=u['y']-.63*u['h']-42*math.sin(r);dx=800-ox;k=.034
   def y(v):
    z=1-k*dx/(v*math.cos(r))
    if z<=0:return math.inf
    t=-math.log(z)/k;U=(1-z)/k;return oy-v*math.sin(r)*U+320*(t-U)/k
   lo,hi=(280.,400.) if arm=='B' else (70.,140.);aim=foot-20;assert y(lo)>aim>y(hi)
   for _ in range(50):
    v=(lo+hi)/2
    if y(v)>aim:lo=v
    else:hi=v
   v=(lo+hi)/2;power=v/(805*1.15943759);assert (.28<power<.45) if arm=='B' else (.07<power<.16)
   row['prediction']={'speed':v,'power':power,'holdSeconds':v/480,'angle':u['angle'],'origin':[ox,oy],'aim':[800,aim]};row['before']=q;photo('before');save()
   # Observational pass-through callback, no event replacement/filtering to stock.
   page.evaluate('''()=>{const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,original=e.onEvent,obs={events:[],frames:[],done:false};window.__tacticalObs=obs;
    e.onEvent=function(ev){try{return original.call(this,ev)}finally{const s=ev.skillAudio;if(ev.type==='sound'&&ev.name==='playerSkill'&&s&&obs.events.length<100)obs.events.push({phase:s.phase,target:s.target,cast:s.cast,actor:s.actor,autonomous:!!s.autonomous,skill:s.skill,material:s.material});}};
    obs.restore=()=>{e.onEvent=original;obs.done=true};const start=performance.now();function tick(){if(obs.done||performance.now()-start>12000||obs.frames.length>=1000)return;const b=e.b;obs.frames.push({ms:performance.now()-start,phase:b.phase,shot:b.shot,power:a.power,terrain:b.terrain.map(t=>({id:t.id,hp:t.hp,broken:!!t.broken})),projectiles:b.projectiles.map(p=>({id:p.id,owner:p.owner,skill:p.skill,shot:p.shot,x:p.x,y:p.y,vx:p.vx,vy:p.vy,age:p.age,followup:!!p.followup,repeatIndex:p.repeatIndex}))});requestAnimationFrame(tick)}requestAnimationFrame(tick);}''')
   row['inputs'].append({'key':'Space','releaseAtPower':power});page.keyboard.down('Space');held.add('Space')
   try:row['chargeGate']=page.evaluate('''goal=>new Promise(ok=>{const start=performance.now();function poll(){const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,w=a.scene.canvas.ownerDocument.defaultView;const q={elapsedMs:performance.now()-start,power:a.power,charging:a.charging};if(!w.document.hasFocus()||e.b.round!==1||e.b.phase!=='aim'||a.dialogue||a.modal.classList.contains('open'))return ok({...q,ok:false});if(a.charging&&a.power>=goal)return ok({...q,ok:true});if(q.elapsedMs>1100)return ok({...q,ok:false});requestAnimationFrame(poll)}requestAnimationFrame(poll)})''',power)
   finally:page.keyboard.up('Space');held.discard('Space')
   row['release']=read();save();seen=False;deadline=time.monotonic()+8
   while time.monotonic()<deadline:
    q=read()
    if q['projectiles'] and not seen:seen=photo('flight')
    if q['shot']>=1 and not q['projectiles'] and q['phase']!='flight':break
    page.wait_for_timeout(20)
   row['after']=read();row['flightPng']=seen;photo('after')
   row['targetDamage']=row['targetInitialHp']-next(t for t in row['after']['terrain'] if t['id']==tid)['hp']
   ev=row['after']['observer']['events'];row['actualBlockOwners']=sorted({v['target'] for v in ev if v.get('phase')=='block' and v.get('target')})
   row['timingValid']=row['chargeGate']['ok'] and abs(row['release']['power']-power)<=.012
   row['passed']=row['timingValid'] and row['after']['unit']['hp']==365 and row['after']['shot']==1 and (('RescueOverhang' in row['actualBlockOwners'] and row['targetDamage']==0) if arm=='B' else (tid in row['actualBlockOwners'] and row['targetDamage']>0))
  except Exception as e:row['error']=type(e).__name__+': '+str(e)
  finally:
   for key in list(held):page.keyboard.up(key)
   try:row['last']=read();photo('after');page.evaluate('()=>window.__tacticalObs?.restore?.()')
   except Exception:row['captureFailed']=True
   row['pageErrors']=errors;save();ctx.close()
 proof['passed']=all(proof['arms'][k]['passed'] for k in ['B','M']);save();browser.close()
