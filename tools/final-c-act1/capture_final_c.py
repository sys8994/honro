import base64,functools,io,json,os,sys
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
from dag import sha,ADDR
from argparse import ArgumentParser
A=ArgumentParser();A.add_argument('root',type=Path);A.add_argument('proof',type=Path);A.add_argument('out',type=Path);A.add_argument('--group',type=int,choices=[4,5,6,10]);A.add_argument('--shard',type=int,choices=range(9));A=A.parse_args();assert A.group is None or A.shard is None
D=Path(__file__).resolve().parent;W=A.out;W.mkdir(parents=True,exist_ok=True)
E=json.loads((D/'poses.json').read_bytes())
PROOF=json.loads(A.proof.read_bytes())
PINS=json.loads((D/'pins.json').read_bytes())
assert PROOF['source']==PINS['candidate'] and PROOF['htmlSHA256']==PINS['htmlSHA256']
def open_im(v):
 p=Image.open(io.BytesIO(v)).convert('RGBA');p.load();return p
def changed(a,b):
 u,v=map(open_im,(a,b));assert u.size==v.size
 return functools.reduce(ImageChops.lighter,ImageChops.difference(u,v).split()).point(lambda p:255 if p else 0)
BOOT="""() => document.documentElement.dataset.honroReady==='true' && typeof HonroCampaignLoader?.ensureStage==='function'
 && typeof HonroTimeOfDay?.sky==='function' && typeof HonroApp==='object'"""
LAUNCH="""async sid=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
 await Promise.race([HonroCampaignLoader.ensureStage(sid),new Promise((_,reject)=>setTimeout(()=>reject(Error('ensureStage 18s')),18000))]);
 for(let n=1;n<sid;n++)a.profile.cleared[n]=true;
 for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(sid).entryLevel);
 a.launch(sid);if(a.engine?.b.honroStage!==sid)throw Error('wrong stage');
 for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);if(a.dialogue)throw Error('entry dialogue remained');
 a.close();HonroStoryFraming.clear(a.scene);}"""
# Match the successful stock Act 1 launcher: once canvas is visible, give the
# native first-turn notice its real wall-clock interval. Its app frame is
# paused by this existing initial-state audit, so drive only the native story
# UI tick/draw; never remove the notice, change its expiry, or hide its DOM.
TURN_READY="""() => {const a=HonroApp,t=performance.now();
 HonroStory.tick(a,t);HonroStory.draw(a);
 return !a.dialogue && document.getElementById('turn-banner')?.hidden===true;}"""
TURN_STATE="""() => {const a=HonroApp,b=document.getElementById('turn-banner');
 return {now:performance.now(),dialogue:!!a.dialogue,notice:!!a.turnNotice,
  bannerPresent:!!b,bannerHidden:b?.hidden??null};}"""
def ready_turn(page):
 before=page.evaluate(TURN_STATE)
 page.wait_for_timeout(1500)
 page.wait_for_function(TURN_READY,polling=100,timeout=6500)
 return dict(before=before,after=page.evaluate(TURN_STATE))
CONFIG="""({q,mode})=>{const a=HonroApp,s=a.scene,b=a.engine.b,st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.stage);
 if(!st||b.honroStage!==q.stage||st.metadata?.campaign!==true||b.honroCustom!==false)throw Error('not actual exact normal campaign state');
 const d=HonroTerrainDomain.materialLandmarks(b), src=st.elements||[], rec=(l)=>({id:l.id,kind:l.kind,layer:l.layer,x:l.x,y:l.y,scale:l.scale,rotation:l.rotation,materialClip:!!l.honroTerrainMaterialClip,elementCollision:!!l.honroElementCollision,collisionIds:l.collisionIds,
  assetId:l.asset?.id,anchor:l.asset?.anchor,bounds:l.asset?.bounds,viewBox:l.asset?.vector?.viewBox,params:l.asset?.params,collision:l.asset?.collision});
 const ids=['act1-stage02-traced-body','act1-stage02-traced-rear'],select=(k)=>d.filter(l=>l.id===k);
 let role={},binding,geom;
 if(q.stage===2){
  const all=b.honroLandmarks||[];
  if(ids.some(k=>select(k).length!==1||all.filter(l=>l.id===k).length!==1||src.filter(l=>l.id===k).length!==1))throw Error('active Stage2 BODY/REAR not uniquely compiled');
  const landmarks=ids.map(k=>select(k)[0]);role={normal:b.honroCustom===false,dimensions:[b.width,b.height],domain:b.honroTerrainBounds,body:rec(landmarks[0]),rear:rec(landmarks[1])};
  binding=JSON.stringify(ids.map((k,i)=>[src.find(e=>e.id===k),rec(all.find(l=>l.id===k)),landmarks[i].asset]));
  const B=role.body,R=role.rear, P=B.params, bb=B.bounds, dom=role.domain;
  const named=['canyon-ground','left-descent-stone-high','left-descent-stone-low','left-descent-stone-mid','left-high-ground','right-cliff-ground','right-descent-stone-low','right-descent-stone-mid'];
  const terrainIds=new Set((b.terrain||[]).map(v=>v.id));
  if(JSON.stringify(P?.bodyTerrainIds)!==JSON.stringify(named)||P.bodyBaseColor!=='#263c3d'||named.some(id=>!terrainIds.has(id))||
    landmarks.some(l=>HonroVectorArt.validate(l.asset.vector).length!==0))throw Error('active Stage02 approved BODY source ownership invalid');
  const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  if(!eq(role.dimensions,[4300,3300])||![dom.left,dom.top,dom.right,dom.bottom].every((x,i)=>x===[-6000,-24000,10300,27300][i])||
   B.kind!=='canonical-element'||B.layer!=='front'||B.assetId!=='act1-traced:stage02-body-v2'||B.x!==0||B.y!==0||B.scale!==1||B.rotation!==0||B.materialClip||B.elementCollision||B.collisionIds?.length!==0||B.collision?.length!==0||
   B.anchor?.x!==0||B.anchor?.y!==0||!P||P.semanticLayer!=='BODY'||P.previewOnly!==false||P.continuousTerrain!==true||
   !eq([bb.x,bb.y,bb.w,bb.h,B.viewBox],[-4000,0,12300,4500,[-4000,0,12300,4500]])||
   R.kind!=='canonical-element'||R.layer!=='back'||R.assetId!=='act1-traced:stage02-rear-v2'||!eq([R.x,R.y,R.scale,R.rotation],[0,0,1,0])||
   R.collisionIds?.length!==0||R.anchor?.x!==0||R.anchor?.y!==0)throw Error('canonical actual BODY/REAR guard mismatch');
 }
 if(q.stage===8){
  const id='act1-stage08-traced-floor-v1', all=b.honroLandmarks||[];
  if(select(id).length!==1||all.filter(l=>l.id===id).length!==1||src.filter(l=>l.id===id).length!==1)throw Error('active Stage8 BODY not uniquely compiled');
  const l=select(id)[0], B=rec(l), A=l.asset, dom=b.honroTerrainBounds, v=A?.vector, root=v?.root, inner=root?.children?.[0];
  const P=B.params, eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const bb=B.bounds, rb=A?.reference?.bounds, expect=[-4000,1800,17600,6000];
  const dims=[b.width,b.height];
  if(!eq(dims,[9600,5500])||!eq([dom.left,dom.top,dom.right,dom.bottom],[-6000,-24000,15600,29500])||
   B.kind!=='canonical-element'||B.layer!=='prop'||l.visualRole!=='scenery'||B.assetId!=='act1-traced:stage08-floor-v1'||
   !eq([B.x,B.y,B.scale,B.rotation],[0,0,1,0])||B.materialClip||B.elementCollision||B.collisionIds?.length!==0||B.collision?.length!==0||
   B.anchor?.x!==0||B.anchor?.y!==0||P?.semanticLayer!=='BODY'||P.previewOnly!==false||P.bodyBaseColor!=='#26342b'||
   !eq(P.bodyTerrainIds,['s8-ground'])||!bb||!rb||!eq([bb.x,bb.y,bb.w,bb.h],expect)||!eq([rb.x,rb.y,rb.w,rb.h],expect)||!eq(B.viewBox,expect)||
   root?.clipPath!=='canonicalSolid'||inner?.clipPath!=='contactInset'||inner.children?.[0]?.fill!=='#26342b'||
   !(b.terrain||[]).some(t=>t.id==='s8-ground')||HonroVectorArt.validate(v).length!==0)
   throw Error('active canonical Stage08 BODY witness mismatch');
  role={normal:true,dimensions:dims,domain:dom,body:B,referenceBounds:rb,clipKeys:[root.clipPath,inner.clipPath]};
  binding=JSON.stringify([src.find(e=>e.id===id),rec(all.find(o=>o.id===id)),A]);
 }
 if(q.stage===9){
  const floor='act1-stage09-traced-floor-v3',ledge='act1-stage09-traced-ledges-v1',rear='tactical-recessed-support', ids=[floor,ledge,rear];
  const all=b.honroLandmarks||[], eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  if(ids.some(k=>select(k).length!==1||all.filter(l=>l.id===k).length!==1||src.filter(l=>l.id===k).length!==1))throw Error('Stage09 active ownership not singular');
  const [F,L,R]=ids.map(k=>select(k)[0]), B=rec(F), S=rec(L), A=F.asset, dom=b.honroTerrainBounds, dims=[b.width,b.height];
  const bb=B.bounds,rb=A?.reference?.bounds,box=x=>[x.x,x.y,x.w,x.h],v=A?.vector,root=v?.root,inner=root?.children?.[0];
  const stable=l=>l.kind==='canonical-element'&&!l.materialClip&&!l.elementCollision&&l.collisionIds?.length===0&&l.collision?.length===0&&eq([l.x,l.y,l.scale,l.rotation],[0,0,1,0])&&eq(l.anchor,{x:0,y:0});
  if(!eq(dims,[3600,3500])||!eq([dom.left,dom.top,dom.right,dom.bottom],[-6000,-24000,9600,27500])||
   !stable(B)||!stable(S)||!stable(rec(R))||B.layer!=='prop'||S.layer!=='prop'||R.layer!=='back'||F.depthLayer!=='L1'||
   B.assetId!=='act1-traced:stage09-floor-v3'||S.assetId!=='act1-traced:stage09-ledges-v1'||R.asset?.id!=='act1-traced:stage09-rear-v1'||
   B.params?.semanticLayer!=='BODY'||B.params.previewOnly!==false||B.params.bodyBaseColor!=='#263630'||!eq(B.params.bodyTerrainIds,['yard-floor'])||
   S.params?.semanticLayer!=='BODY'||!bb||!rb||!eq(box(bb),[-4000,1500,11600,5000])||!eq(box(bb),box(rb))||!eq(B.viewBox,box(bb))||
   root?.clipPath!=='canonicalSolid'||inner?.clipPath!=='contactInset'||inner.children?.[0]?.fill!=='#263630'||
   !(b.terrain||[]).some(t=>t.id==='yard-floor')||[F,L,R].some(l=>HonroVectorArt.validate(l.asset.vector).length!==0))
   throw Error('Stage09 actual main FLOOR/protected LEDGES/REAR contract mismatch');
  role={normal:true,dimensions:dims,domain:dom,body:B,ledge:S,rear:rec(R),referenceBounds:rb,clipKeys:[root.clipPath,inner.clipPath]};
  binding=JSON.stringify(ids.map((k,i)=>[src.find(e=>e.id===k),rec(all.find(o=>o.id===k)),[F,L,R][i].asset]));
 }
 if(q.signedOwner){
  const O=q.signedOwner, source=src.filter(l=>l.id===O.placement), raw=(b.honroLandmarks||[]).filter(l=>l.id===O.placement), drawn=select(O.placement);
  if(source.length!==1||raw.length!==1||drawn.length!==1||raw[0]!==drawn[0])throw Error('exact original BODY material registration missing');
  const l=drawn[0],X=l.asset,A=rec(l),root=X?.vector?.root, inner=root?.children?.[0], P=X?.params;
  const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const colors=q.stage===6?inner?.fill:inner?.children?.[0]?.fill;
  const ck=q.stage===6?[root?.clipPath]:[root?.clipPath,inner?.clipPath];
  if(!eq([b.width,b.height],O.dimensions)||!eq(b.honroTerrainBounds,O.domain)||A.kind!=='canonical-element'||A.layer!=='prop'||l.depthLayer!=='L1'||l.visualRole!=='scenery'||
    A.assetId!==O.asset||!eq([A.x,A.y,A.scale,A.rotation],[0,0,1,0])||A.materialClip||A.elementCollision||A.collisionIds?.length!==0||A.collision?.length!==0||
    A.anchor?.x!==0||A.anchor?.y!==0||!eq(A.bounds,O.bounds)||!eq(X.reference?.bounds,O.bounds)||!eq(A.viewBox,O.viewBox)||
    Object.entries(O.params).some(([k,v])=>!eq(P?.[k],v))||!eq(ck,O.clips)||colors!==O.baseFill||
    !(b.terrain||[]).some(t=>t.id===O.physicalGround)||HonroVectorArt.validate(X.vector).length!==0)throw Error('signed BODY ownership mismatch');
  role={normal:true,dimensions:[b.width,b.height],domain:b.honroTerrainBounds,body:A,nativeClips:ck};
  binding=JSON.stringify([source[0],rec(raw[0]),X]);
 }
 const waterArt=q.stage===5?globalThis.HonroStage5DynamicArt:null, waterNative=waterArt?.water;
 let waterCalls=0;
 const waterNow=()=>{
  if(q.stage!==5)return null;
  const flags=Object.fromEntries(Object.keys(q.waterExpected.flags).map(k=>[k,b[k]]));
  const targets=HonroQuestTargets.records(b).filter(t=>t.id==='waterfall-veil'), t=targets[0];
  const zs=b.honroSurfaceZones||[], waterZones=zs.map(z=>({id:z.id,bottom:Math.max(...z.points.map(p=>p[1]))}));
  if(!HonroStage5Waterfall.active(b)||targets.length!==1||!!t.honroWaterOpen||!!t.broken||b.honroState?.waterfallSight===true||
    JSON.stringify(flags)!==JSON.stringify(q.waterExpected.flags)||JSON.stringify(waterZones)!==JSON.stringify(q.waterExpected.zones)||
    !Array.isArray(t.honroWaterFluidVertices)||t.honroWaterFluidVertices.length===0||
    Math.max(...t.honroWaterFluidVertices.map(p=>p.y))>3000||typeof waterNative!=='function'||
    zs.some(z=>HonroTerrainDomain.materialWaterZone(b,z)!==z))throw Error('Stage05 live closed water ownership/state not proved');
  return JSON.stringify({flags,zones:zs,opened:!!t.honroWaterOpen,rigid:t.vertices,fluid:t.honroWaterFluidVertices,
                        waterSurface:b.waters,sceneVersion:b.sceneVersion,design:st.design.waterfall});
 };
 const waterBefore=waterNow();
 if(waterArt)waterArt.water=function(...args){
  waterCalls++;return Reflect.apply(waterNative,this,args);
 };
 const initial=JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives});
 const game=()=>JSON.stringify({terrain:b.terrain,units:b.units,state:b.honroState,water:b.water,waterZones:b.honroWaterZones,
  flags:[b.honroCustom,b.width,b.height],play:b.honroPlayBounds,domain:b.honroTerrainBounds,markers:b.honroMarkers,objectives:b.honroObjectives,
  stage:[st.terrains,st.initialState,st.objectives,st.elements,st.layers,st.camera,st.anchors,st.markers,st.events,st.routes,st.metadata]});
 const state=game(), depth={stage02:'_stage2DeepBodyTileLandmark',stage04:'_stage4DeepBodyTileLandmark',
    stage05:'_stage5DeepBankTileLandmark',stage06:'_stage6DeepRoadBodyTileLandmark',stage08:'_stage8DeepBodyTileLandmark',
    stage09:'_stage9DeepFloorTileLandmark',stage10:'_stage10DeepFloorTileLandmark'};
 const prior=new Set(['stage02','stage08','stage09']);
 const originals={},supplements={};
 for(const [slot,key] of Object.entries(depth)){
  const fn=s[key];originals[key]=fn;supplements[slot]=[];
  if((prior.has(slot)||mode==='target')!==(typeof fn==='function'))throw Error('unexpected active renderer '+slot);
  if(fn)s[key]=function(...args){const v=Reflect.apply(fn,this,args);if(v)supplements[slot].push({
     id:v.id,asset:v.asset?.id,clip:!!v.honroTerrainMaterialClip,tile:args[3]});return v;};
 }
 const sky=HonroTimeOfDay.sky, p=performance, now=p.now, own=Object.getOwnPropertyDescriptor(p,'now');let calls=0,restores=0,inside=false;
 function observe(...z){if(z[4]?.honroStage!==q.stage)return Reflect.apply(sky,this,z);
  if(inside||p.now!==now||own?.configurable===false)throw Error('clock contamination');
  Object.defineProperty(p,'now',{value:()=>41000,writable:true,configurable:true});inside=true;
  try{calls++;return Reflect.apply(sky,this,z);}finally{if(own)Object.defineProperty(p,'now',own);else delete p.now;inside=false;restores++;
  if(p.now!==now)throw Error('clock not restored');}}
 HonroTimeOfDay.sky=observe;
 window.__q={
  proof:()=>{if(state!==game())throw Error('actual pixels mutated gameplay geometry/state');
   const waterAfter=waterNow();
   if(waterAfter!==waterBefore||q.stage===5&&waterCalls===0)throw Error('water not drawn or water/waterfall state changed during image');
   const r=s.canvas.getBoundingClientRect();return{initial,state,binding,role,supplements,waterState:waterAfter,waterCalls,
    actual:{x:s.x,y:s.y,scale:s.scale},focus:HonroBounds.focus(b),viewport:HonroBounds.viewport(s,r.width,r.height),
    css:{w:r.width,h:r.height},backing:[s.canvas.width,s.canvas.height],actorCount:b.units.length,projectStage:st.id};},
  restore:()=>{if(inside||HonroTimeOfDay.sky!==observe||p.now!==now||calls!==restores)throw Error('native sky isolation failed');
   HonroTimeOfDay.sky=sky;
   for(const [k,fn] of Object.entries(originals))if(fn)delete s[k];
   if(waterArt)waterArt.water=waterNative;
   return{calls,restores,normal:HonroTimeOfDay.sky===sky&&p.now===now&&Object.entries(originals).every(([k,fn])=>s[k]===fn)&&(!waterArt||waterArt.water===waterNative)};}};
 HonroStoryFraming.clear(s);Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,...q.requested});
 HonroBounds.constrain(s,b);s._releaseDomainTiles();s._releaseRasterCanvas(s._staticWorldCache?.canvas);s._staticWorldCache=null;
 s.render(a.engine,0,'',.6,false,0);}"""
RENDER="""(times)=>{const a=HonroApp,s=a.scene;for(let i=0;i<times;i++)s.render(a.engine,0,'',.6,false,0);return s.canvas.toDataURL('image/png').split(',')[1]}"""
def frame(browser,row):
 q=row['q'];mode='target';n=f'C-s{q["stage"]:02}-{q["width"]}-{q["view"]}'
 r=A.root; proof=PROOF
 ctx=browser.new_context(viewport=dict(width=q['width'],height=q['height']),device_scale_factor=1)
 p=ctx.new_page(); bad=[]; assets={}; readiness=None; phase='boot'; written=[]
 p.on('pageerror',lambda e:bad.append(str(e)[:2000]))
 paths=set()
 def seen(e):
  url=urlparse(e.url)
  if url.scheme in ('http','https'):
   if url.hostname!='127.0.0.1' or url.port!=18841:bad.append(['unexpected remote response',url.hostname,url.path]);return
   path=url.path[1:];assets[path]=e;paths.add(path)
 p.on('response',seen)
 p.on('requestfailed',lambda e:bad.append([e.resource_type,urlparse(e.url).path,e.failure]) if not(e.resource_type=='media' and 'ERR_ABORTED' in (e.failure or ''))else None)
 p.add_init_script("""window.__im=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
 Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){this.__srcTime=performance.now();window.__im.push(this);return d.set.call(this,v)}});""")
 try:
  got=p.goto(f'http://127.0.0.1:{18841}/HONRO.html',wait_until='domcontentloaded',timeout=18000)
  assert got and got.ok and sha(got.body())==proof['htmlSHA256']
  p.wait_for_function(BOOT,timeout=18000);phase='launch';p.evaluate(LAUNCH,q['stage'])
  c=p.locator('#battlecanvas');c.wait_for(state='visible',timeout=18000)
  phase='native-turn-ready';readiness=ready_turn(p)
  phase='registered-scene';p.evaluate(CONFIG,{'q':q|{'waterExpected':E['water']},'mode':mode})
  p.wait_for_function('() => window.__im.every(i=>!i.src||i.complete)',timeout=18000)
  p.evaluate('async()=>{await document.fonts.ready;if(window.__im.some(i=>i.src&&!i.naturalWidth))throw Error("asset decode failed")}')
  phase='write-images';ims={}
  def save(k,v):
   file=W/f'{n}-{k}.png';file.write_bytes(v);written.append(file.name);ims[k]=v
  save('raw',base64.b64decode(p.evaluate(RENDER,2)))
  save('dom',c.screenshot(animations='disabled',timeout=18000))
  phase='post-capture-proof'
  repeat={'raw':base64.b64decode(p.evaluate(RENDER,1)),'dom':c.screenshot(animations='disabled',timeout=18000)}
  rep={k:changed(ims[k],repeat[k]).histogram()[255]for k in ims}
  obs=p.evaluate('()=>window.__q.proof()');clock=p.evaluate('()=>window.__q.restore()')
  for k in ('initial','state','binding','waterState'):
   v=obs.pop(k,None)
   obs[k+'SHA256']=sha(v.encode())if v is not None else None
  need={proof['roles'][k] for k in ('entry','manifest','loader')}|set(proof['leaves'][str(q['stage'])].values())|{v['path']for v in proof['compiled']}|set(PINS['fontAuthority'])
  assert need<=paths,(n,'missing immutable HTTP responses',need-paths)
  http={}
  for k,v in assets.items():
   if k=='HONRO.html':assert v.status==200 and sha(v.body())==proof['htmlSHA256'];continue
   assert k in proof['all'] and v.status in (200,206),(n,'unknown request or status',k,v.status)
   rowHash=proof['all'][k]; file=(r/k).read_bytes(); got=v.body()
   assert {'bytes':len(file),'sha256':sha(file)}==rowHash,(n,'disk/graph authority',k)
   if v.status==200:assert got==file,(n,'actual response bytes',k)
   else:
    assert k in PINS['staticAudio'],(n,'only verified audio can use byte ranges',k)
    import re
    m=re.fullmatch(r'bytes (\d+)-(\d+)/(\d+)',v.headers.get('content-range',''))
    assert m and int(m[3])==len(file) and got==file[int(m[1]):int(m[2])+1],(n,'invalid exact range',k)
   http[k]={'sha256':sha(got),'status':v.status}
  assert not bad,bad
  assert set(obs['actual'])==set(q['actual']) and all(abs(obs['actual'][k]-q['actual'][k])<1e-7 for k in q['actual'])
  for k in ('focus','viewport','css','backing','actorCount','projectStage'): assert obs[k]==q[k],(n,k,obs[k],q[k])
  assert obs['initialSHA256']==q['physicsSha256'],(n,'original baseline snapshot divergence')
  priorSlots={'stage02','stage08','stage09'}
  retain=q.get('retainedApproved')
  created=f'stage{q["stage"]:02}'
  newSlots=set(obs['supplements'])-priorSlots
  for k,rows in obs['supplements'].items():
   if k in priorSlots:
    assert rows==(retain['supplements'][k] if retain else []),(n,'existing stage supplements changed',k)
   elif k in newSlots:
    required=q['extra'] if mode=='target' and k==created else 0
    assert len(rows)==required,(n,k,len(rows),required)
    if required:
     O=q['signedOwner']
     assert all(x['id']==O['placement'] and x['asset']==O['asset'] and x['clip'] and x['tile']['top']==8192 for x in rows)
     assert [x['tile']['left'] for x in rows]==q['signedTileLefts']
  if retain:
   for k in ('initialSHA256','stateSHA256','bindingSHA256','role'):assert retain[k]==obs[k],(n,'prior archived state/binding changed',k)
  assert (obs['waterStateSHA256'] is not None and obs['waterCalls']>0) if q['stage']==5 else not obs['waterCalls']
  assert all(v==0 for v in rep.values()) and clock['normal'] and clock['calls']==clock['restores'] and clock['calls']>0,(rep,clock)
  for k,v in row['proof'].items():assert obs[k]==v,(n,'signed c720 active state mismatch',k)
  for k,v in ims.items():
   im=open_im(v);want=row['images'][k]
   assert list(im.size)==want['size'] and sha(im.tobytes())==want['rgbaSHA256'],(n,'signed c720 image mismatch',k)
  return obs|dict(repeat=rep,nativeSky=clock,http=http,png={k:sha(v)for k,v in ims.items()},noErrors=True,turnReadiness=readiness),ims
 except Exception as exc:
  if phase=='native-turn-ready':
   try:readiness=p.evaluate(TURN_STATE)
   except Exception:pass
  details=dict(phase=phase,error=str(exc)[:2000],written=written,turnReadiness=readiness)
  (W/f'{n}-boot-errors.json').write_text(json.dumps(details|dict(errors=bad,responses={k:v.status for k,v in assets.items()}),indent=2))
  return details,None
 finally:ctx.close()
groups=(A.group,) if A.group else (4,5,6,10)
rows=[r for group in groups for r in json.loads((D/f'rows-{group}.json').read_bytes())]
assert len(rows)==sum({4:24,5:18,6:21,10:21}[g]for g in groups)
if A.shard is not None:
 rows=rows[A.shard::9]
 assert len(rows)==(10 if A.shard<3 else 9)
roll=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for row in rows:
  q=row['q']
  try:detail,imgs=frame(browser,row)
  except Exception as ex:detail,imgs={'error':str(ex)},None
  roll.append({'group':row['group'],'stage':q['stage'],'view':q['view'],'width':q['width'],'pass':bool(imgs) and detail['noErrors'],'detail':detail})
  (W/'ACT1-FINAL-C.json').write_text(json.dumps(roll,indent=2)+'\n')
 browser.close()
assert len(roll)==len(rows) and all(r['pass']for r in roll),[(r['stage'],r['width'],r['view'],r['detail'].get('error'))for r in roll if not r['pass']]
