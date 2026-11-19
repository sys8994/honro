"""Review-only proposal: two stock native four-owner combined fixtures, one ordinary shot each."""
import hashlib,json,math,os,sys,time,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
P=Path(__file__).parent;out=Path(sys.argv[1]);assert not out.exists();out.mkdir(parents=True)
url=sys.argv[2];assert url=='http://127.0.0.1:8884/HONRO_WORKSHOP.html'
sha=lambda b:hashlib.sha256(b).hexdigest()
src=(P/'combined.json').read_bytes()
assert sha(src)=='fbb5f2cb2e240adffaf7b6bdbf74977a756f5269051866f159e0b832d58c6932'
raw=json.loads(src);rings={q['id']:q['ring'] for q in raw['owners']};assert [len(v) for v in rings.values()]==[416,235,58,97]
wanted={k:[dict(x=x,y=y) for x,y in r] for k,r in rings.items()}
def surface(r,x):return min(y+(x-X)*(Y-y)/(XX-X) for (X,y),(XX,Y) in zip(r,r[1:]+r[:1]) if X!=XX and min(X,XX)<=x<=max(X,XX))
support={'M':'MAIN_ESCORT_C_FULL','E':'EAST_OPTIONAL_LOOKOUT'}
east=rings[support['E']]
foot=max(surface(east,x) for x in (4516,4550,4584));assert abs(foot-323.8666666666667)<1e-7
tid='qa-combined-target';target=[{'x':4516,'y':foot-100},{'x':4584,'y':foot-100},{'x':4584,'y':foot},{'x':4516,'y':foot}]
power=.4362314960138478
proof={'scope':'Synthetic stock Player same A01 shot/angle and same x/target, only controlled prelaunch support differs. No campaign, tactics balance or traversal claim.',
 'source':sha(src),'arms':{},'passed':False,'target':target,'sameCommand':dict(power=power,angle=43,originX=4000)}
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
 for arm in ['M','E']:
  row={'passed':False,'inputs':[]};proof['arms'][arm]=row;save();ctx=browser.new_context(viewport={'width':1500,'height':900},accept_downloads=True);page=ctx.new_page();held=set();errors=[];page.on('pageerror',lambda e:errors.append(type(e).__name__))
  def read():return page.evaluate(READ)
  def snapshot(q):
   return {k:q.get(k) for k in ['ready','focus','focusTag','dialogue','modal','round','phase','shot','selected','unit']} | {'terrainIds':[t['id'] for t in q.get('terrain',[])],'pageErrorTypes':list(errors)}
  def guard(q,act=True):
   checks={'noPageErrors':not errors,'noDialogue':not q['dialogue'],'noModal':not q['modal'],'frameFocused':q['focus'],'safeFocusTag':q['focusTag'] not in ['BUTTON','INPUT','TEXTAREA','SELECT'],
    'sameActor':q['unit']['id']=='combined-qa-archer','round1':q['round']==1,'unchangedActorHp':q['unit']['hp']==365,
    'fiveTerrain':len(q['terrain'])==5,'exactFourSolids':{t['id']:t['vertices'] for t in q['terrain'] if t['id']!=tid}==wanted}
   if act:checks.update(ready=q['ready'],aimPhase=q['phase']=='aim')
   row.setdefault('guardSnapshots',[]).append({'checks':checks,'state':snapshot(q),'act':act});save()
   assert all(checks.values()),'Guard failed: '+','.join(k for k,v in checks.items() if not v)
  def photo(label):
   q=read()
   if not q['dialogue'] and not q['modal']:page.screenshot(path=str(out/(('01' if arm=='M' else '02')+'-'+arm+'-'+label+'.png')));return True
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
   data=page.evaluate("""({wanted,target,spawnY})=>{
    const s=HonroMaps.emptyStage('qa-combined-lookout-artillery','Four-owner lookout tactical QA · bare',6500,1900);
    s.environment.placements=[];s.environment.hiddenLayers=['L2','L3','L4','L5'];
    s.environment.atmosphere.overrides={skyTop:'#151c23',skyBottom:'#151c23'};
    s.terrains=Object.keys(wanted).map(id=>({id,name:id,layer:'terrain',type:'solid',points:wanted[id],baseMaterial:'rock',oneWay:false,breakable:false}));
    s.terrains.push({id:'qa-combined-target',name:'Synthetic wood target',layer:'terrain',type:'solid',points:target,baseMaterial:'wood',oneWay:false,breakable:true});
    s.units=[HonroUnits.record('archer','combined-qa-archer',4000,spawnY,'player')];
    s.objectives=[{id:'qa-never-reached',type:'reach',label:'QA only',x:20,y:75,radius:25,required:true}];
    const a={id:'qa-inert-empty',name:'Empty toolbar sentinel',category:'scenery',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
    a.reference=HonroEnvironment.referenceForLegacyAsset(a);
    return HonroMaps.finalize({schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,name:s.name,
       environmentVersion:HonroEnvironment.VERSION,settings:{autosave:false,grid:10},stages:[s],library:[a]});}""",
        dict(wanted=wanted,target=target,spawnY=surface(rings[support[arm]],4000)))
   same=json.loads(json.dumps(data));same['stages'][0]['units'][0].pop('y')
   if arm=='M':fixture=same
   else:assert same==fixture,'Fresh arm terrain/settings differs beyond designed prelaunch vertical start'
   row['fixtureDigest']=sha(json.dumps(data,sort_keys=True).encode())
   assert {q['id']:q['points'] for q in data['stages'][0]['terrains']}=={**wanted,tid:target}
   with page.expect_file_chooser() as fc:page.locator('#importBtn').click()
   fc.value.set_files(dict(name='synthetic-combined-artillery.honro-map.json',mimeType='application/json',buffer=json.dumps(data).encode()))
   page.wait_for_function("HonroWorkshopAPI.queryScene().stage.id==='qa-combined-lookout-artillery'")
   same_project=page.evaluate('HonroWorkshopAPI.getProject()')
   with page.expect_download() as d:page.locator('#exportBtn').click()
   local=out.parent/(arm+'-native-combined.honro-map.json');d.value.save_as(local)
   assert json.loads(local.read_bytes())==same_project
   old=ctx;ctx=browser.new_context(viewport={'width':1500,'height':900},accept_downloads=True)
   page=ctx.new_page();page.on('pageerror',lambda e:errors.append(type(e).__name__))
   page.goto(url);page.wait_for_function('!!window.HonroWorkshopAPI',timeout=60000)
   with page.expect_file_chooser() as fc:page.locator('#importBtn').click()
   fc.value.set_files(local)
   page.wait_for_function("HonroWorkshopAPI.queryScene().stage.id==='qa-combined-lookout-artillery'")
   assert page.evaluate('HonroWorkshopAPI.getProject()')==same_project
   row['nativeExportDigest']=sha(local.read_bytes());old.close()
   page.locator('[data-tab=play]').click();page.wait_for_function('!!HonroWorkshopAPI.getPlayApp()?.engine',timeout=45000)
   row['preFocus']=snapshot(read());save()
   page.bring_to_front()
   page.locator('#runtimeFrame').evaluate('f=>f.contentWindow.focus()')
   row['postFocus']=snapshot(read());save()
   # Serial live RAF observations only: no changing phase, actor, geometry or readiness.
   row['initialReadiness']=page.evaluate("""support=>new Promise(resolve=>{const start=performance.now();let stable=0,total=0,last=null;function poll(){const a=HonroWorkshopAPI.getPlayApp(),e=a?.engine,b=e?.b,u=e?.active,w=a?.scene?.canvas?.ownerDocument?.defaultView;total++;last={ready:!!a?.canInput(),focus:!!w?.document.hasFocus(),focusTag:w?.document.activeElement?.tagName,dialogue:!!a?.dialogue,modal:!!a?.modal.classList.contains('open'),round:b?.round,phase:b?.phase,actor:u?.id,hp:u?.hp,tune:u?.tune,grounded:!!u&&e.grounded(u),support:u?e.contactSurface(u.x,u.y-4,u.y+4)?.t.id:null};const ok=last.ready&&last.focus&&!['BUTTON','INPUT','TEXTAREA','SELECT'].includes(last.focusTag)&&!last.dialogue&&!last.modal&&last.round===1&&last.phase==='aim'&&last.actor==='combined-qa-archer'&&last.hp===365&&last.tune===.5&&last.grounded&&last.support===support;stable=ok?stable+1:0;if(stable>=8)return resolve({ok:true,stable,total,elapsedMs:performance.now()-start,last});if(performance.now()-start>=15000)return resolve({ok:false,stable,total,elapsedMs:performance.now()-start,last});requestAnimationFrame(poll)}requestAnimationFrame(poll)})""",support[arm])
   save();assert row['initialReadiness']['ok'],'Initial readiness/focus did not stabilize'
   row['preFirstGuard']=snapshot(read());save()
   q=read();guard(q);u=q['unit']
   assert u['tune']==.5 and u['h']==92 and u['grounded'] and u['support']==support[arm]
   assert abs(u['x']-4000)<1e-7 and abs(u['y']-surface(rings[support[arm]],4000))<.1
   row['entry']=q;save()
   slot=u['loadout'].index('A01')+1;assert slot<=4;pulse('Digit'+str(slot),30)
   goal=43
   for _ in range(20):
    q=read();guard(q);delta=goal-q['unit']['angle']
    if abs(delta)<.7:break
    pulse('ArrowUp' if delta>0 else 'ArrowDown',max(10,min(60,abs(delta)/62*1000)))
   q=read();guard(q);u=q['unit'];assert abs(u['angle']-goal)<.7 and u['facing']>0 and u['tune']==.5 and q['selected']=='A01'
   ph=q['physics'];assert ph['gravity']=={'x':0,'y':320} and ph['dragScale']==1 and ph['flow']=={'x':0,'y':0} and not ph['regions'] and not ph['timeline']
   assert q['wind']==0 and q['fields']==q['drafts']==0 and q['skill']=={'mode':'arrow','cls':'archer','gravity':1,'drag':.034}
   tgt=next(t for t in q['terrain'] if t['id']==tid);assert tgt['hp']>0 and not tgt['broken'] and not tgt['indestructible'];row['targetInitialHp']=tgt['hp']
   assert abs(u['x']-4000)<1e-7 and u['support']==support[arm] and u['h']==92
   row['prediction']={'power':power,'targetX':4550,'angle':u['angle'],'controlAngle':43,
      'fromDifferentSupport':support[arm],'firstExpected':'EAST_OPTIONAL_LOOKOUT' if arm=='M' else tid}
   row['before']=q;photo('before');save()
   # Observational pass-through callback, no event replacement/filtering to stock.
   page.evaluate('''()=>{const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,original=e.onEvent,obs={events:[],frames:[],done:false};window.__tacticalObs=obs;
    e.onEvent=function(ev){try{return original.call(this,ev)}finally{const s=ev.skillAudio;if(ev.type==='sound'&&ev.name==='playerSkill'&&s&&obs.events.length<100)obs.events.push({phase:s.phase,target:s.target,cast:s.cast,actor:s.actor,autonomous:!!s.autonomous,skill:s.skill,material:s.material});}};
    obs.restore=()=>{e.onEvent=original;obs.done=true};const start=performance.now();function tick(){if(obs.done||performance.now()-start>12000||obs.frames.length>=1000)return;const b=e.b;obs.frames.push({ms:performance.now()-start,phase:b.phase,shot:b.shot,power:a.power,terrain:b.terrain.map(t=>({id:t.id,hp:t.hp,broken:!!t.broken})),projectiles:b.projectiles.map(p=>({id:p.id,owner:p.owner,skill:p.skill,shot:p.shot,x:p.x,y:p.y,vx:p.vx,vy:p.vy,age:p.age,followup:!!p.followup,repeatIndex:p.repeatIndex}))});requestAnimationFrame(tick)}requestAnimationFrame(tick);}''')
   row['inputs'].append({'key':'Space','releaseAtPower':power});page.keyboard.down('Space');held.add('Space')
   # R2 observed native keyup lag: B29.4ms/M31.0ms, not an assumed one-frame zero-latency release.
   row['chargeLatencyReference']={'run':44550183565,'proofSha256':'311ff40fcc20b283561c959ecf5c1eeb1df814d638667cb32c3324e5dfa91aad','lagMs':[29.4,31.0],'meanLagMs':30.2}
   try:row['chargeGate']=page.evaluate("""goal=>new Promise(ok=>{
    const start=performance.now(),samples=[];let calibration=null;
    const median=x=>{const a=[...x].sort((x,y)=>x-y);const i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2};
    function poll(){const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,w=a.scene.canvas.ownerDocument.defaultView,now=performance.now();
     const q={elapsedMs:now-start,power:a.power,charging:a.charging};
     const finish=(valid,reason)=>ok({...q,ok:valid,reason,plannedPower:goal,calibration,samples});
     if(!w.document.hasFocus()||e.b.round!==1||e.b.phase!=='aim'||a.dialogue||a.modal.classList.contains('open'))return finish(false,'state changed');
     if(a.charging&&a.power>0&&samples.length<6&&(!samples.length||a.power>samples[samples.length-1].power))samples.push({ms:q.elapsedMs,power:a.power});
     if(samples.length===6&&!calibration){
      const bins=samples.slice(1).map((s,i)=>s.ms-samples[i].ms),slopes=samples.slice(1).map((s,i)=>(s.power-samples[i].power)/(s.ms-samples[i].ms));
      const binMs=median(bins),slope=median(slopes),referenceSlope=480/(805*1.15943759)/1000;
      const correctionMs=30.2+binMs/2,correctionPower=slope*correctionMs,threshold=goal-correctionPower;
      calibration={sampleCount:samples.length,binMs,powerPerMs:slope,referenceSlope,observedNativeKeyupLagMs:30.2,halfBinMs:binMs/2,correctionMs,correctionPower,releaseThreshold:threshold};
      if(binMs<10||binMs>25||Math.abs(slope/referenceSlope-1)>.12||correctionPower<.014||correctionPower>.026||threshold<=a.power)return finish(false,'early calibration outside narrow bounds');
     }
     if(calibration&&a.charging&&a.power>=calibration.releaseThreshold)return finish(true,'measured early-release threshold');
     if(q.elapsedMs>1100)return finish(false,'charge timeout');
     requestAnimationFrame(poll);
    }requestAnimationFrame(poll);
   })""",power)
   finally:page.keyboard.up('Space');held.discard('Space')
   row['release']=read();row['timingTelemetry']={'plannedPower':power,'observedGatePower':row['chargeGate']['power'],'actualReleasePower':row['release']['power'],'actualMinusPlanned':row['release']['power']-power,'strictTolerance':.012,'observedGateToReleaseMs':(row['release']['power']-row['chargeGate']['power'])*(805*1.15943759/480)*1000};save();seen=False;deadline=time.monotonic()+8
   while time.monotonic()<deadline:
    q=read()
    if q['projectiles'] and not seen:seen=photo('flight')
    if q['shot']>=1 and not q['projectiles'] and q['phase']!='flight':break
    page.wait_for_timeout(20)
   row['after']=read();row['flightPng']=seen;photo('after')
   row['targetDamage']=row['targetInitialHp']-next(t for t in row['after']['terrain'] if t['id']==tid)['hp']
   ev=row['after']['observer']['events'];row['actualBlockOwners']=sorted({v['target'] for v in ev if v.get('phase')=='block' and v.get('target')})
   row['firstBlockOwner']=next((v['target'] for v in ev if v.get('phase')=='block' and v.get('target') and not v.get('autonomous')),None)
   row['timingValid']=row['chargeGate']['ok'] and abs(row['release']['power']-power)<=.012
   row['passed']=row['timingValid'] and row['firstBlockOwner']==('EAST_OPTIONAL_LOOKOUT' if arm=='M' else tid) and row['after']['unit']['hp']==365 and row['after']['shot']==1 and (('EAST_OPTIONAL_LOOKOUT' in row['actualBlockOwners'] and row['targetDamage']==0) if arm=='M' else (tid in row['actualBlockOwners'] and row['targetDamage']>0))
  except Exception as e:
   row['error']=type(e).__name__+': '+str(e)
   row['traceback']=[{'file':Path(f.filename).name,'line':f.lineno,'function':f.name} for f in traceback.extract_tb(e.__traceback__) if Path(f.filename).name=='combined-artillery.py']
   save()
  finally:
   for key in list(held):page.keyboard.up(key)
   try:row['last']=read();photo('after');page.evaluate('()=>window.__tacticalObs?.restore?.()')
   except Exception:row['captureFailed']=True
   row['pageErrors']=errors;save();ctx.close()
 proof['passed']=all(proof['arms'][k]['passed'] for k in ['M','E']);save();browser.close()

