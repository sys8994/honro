import base64,functools,io,json,os,sys
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
from dag import sha,ADDR
D=Path(__file__).resolve().parent; W=Path(os.environ['OUT'])
E=json.load(open(D/'expected.json')); MODES=('stock','target')
ROOTS=[Path(os.environ[x]) for x in ('STOCK','TARGET')]
DAGS=[json.load(open(W/(m+'-built-dag.json'))) for m in MODES]
RENDERER=json.load(open(W/'approved-dag-diff.json'))
roll=[]
def persist():
 (W/'actual-paired-receipt.json').write_text(json.dumps(roll,indent=2)+'\n')
def open_im(v):
 p=Image.open(io.BytesIO(v)).convert('RGBA');p.load();return p
def changed(a,b):
 u,v=map(open_im,(a,b));assert u.size==v.size
 return functools.reduce(ImageChops.lighter,ImageChops.difference(u,v).split()).point(lambda p:255 if p else 0)
def gate_pair(a,b,q):
 res={}
 for k in ('raw','dom'):
  m=changed(a[k],b[k]);w,h=m.size;n=m.histogram()[255];p=m.getbbox()
  # Use same independently signed world clip for both archived grids.
  expected=round((8192-q['viewport']['top'])*q['actual']['scale'])
  assert expected==591 if q['extra'] else True
  tail=m.crop((0,expected,w,h)) if q['extra'] else None
  inside=(tail.histogram()[255] if tail is not None else 0)
  allRows=(all(tail.crop((0,i,w,i+1)).getbbox() for i in range(tail.height)) if tail is not None else False)
  res[k]=dict(size=[w,h],bbox=p,changed=n,outside=n-inside,inside=inside,allAuthorizedTailRowsObserved=allRows,
   signedFirstRow=expected if q['extra'] else None,pass_=n==inside and (inside>0 and allRows if q['extra'] else n==0))
 return res
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
 const initial=JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives});
 const game=()=>JSON.stringify({terrain:b.terrain,units:b.units,state:b.honroState,water:b.water,waterZones:b.honroWaterZones,
  flags:[b.honroCustom,b.width,b.height],play:b.honroPlayBounds,domain:b.honroTerrainBounds,markers:b.honroMarkers,objectives:b.honroObjectives,
  stage:[st.terrains,st.initialState,st.objectives,st.elements,st.layers,st.camera,st.anchors,st.markers,st.events,st.routes,st.metadata]});
 const state=game(), orig=s._stage2DeepBodyTileLandmark;
 if((mode==='target')!==(typeof orig==='function'))throw Error('unexpected active renderer registration');
 let supplements=[]; if(orig) s._stage2DeepBodyTileLandmark=function(...args){
  const v=Reflect.apply(orig,this,args);if(v)supplements.push({id:v.id,asset:v.asset?.id,clip:!!v.honroTerrainMaterialClip,tile:args[3]});return v;};
 const sky=HonroTimeOfDay.sky, p=performance, now=p.now, own=Object.getOwnPropertyDescriptor(p,'now');let calls=0,restores=0,inside=false;
 function observe(...z){if(z[4]?.honroStage!==q.stage)return Reflect.apply(sky,this,z);
  if(inside||p.now!==now||own?.configurable===false)throw Error('clock contamination');
  Object.defineProperty(p,'now',{value:()=>41000,writable:true,configurable:true});inside=true;
  try{calls++;return Reflect.apply(sky,this,z);}finally{if(own)Object.defineProperty(p,'now',own);else delete p.now;inside=false;restores++;
  if(p.now!==now)throw Error('clock not restored');}}
 HonroTimeOfDay.sky=observe;
 window.__q={
  proof:()=>{if(state!==game())throw Error('actual pixels mutated gameplay geometry/state');
   const r=s.canvas.getBoundingClientRect();return{initial,state,binding,role,supplements,
    actual:{x:s.x,y:s.y,scale:s.scale},focus:HonroBounds.focus(b),viewport:HonroBounds.viewport(s,r.width,r.height),
    css:{w:r.width,h:r.height},backing:[s.canvas.width,s.canvas.height],actorCount:b.units.length,projectStage:st.id};},
  restore:()=>{if(inside||HonroTimeOfDay.sky!==observe||p.now!==now||calls!==restores)throw Error('native sky isolation failed');
   HonroTimeOfDay.sky=sky;if(orig)delete s._stage2DeepBodyTileLandmark;return{calls,restores,normal:HonroTimeOfDay.sky===sky&&p.now===now};}};
 HonroStoryFraming.clear(s);Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,...q.requested});
 HonroBounds.constrain(s,b);s._releaseDomainTiles();s._releaseRasterCanvas(s._staticWorldCache?.canvas);s._staticWorldCache=null;
 s.render(a.engine,0,'',.6,false,0);}"""
RENDER="""(times)=>{const a=HonroApp,s=a.scene;for(let i=0;i<times;i++)s.render(a.engine,0,'',.6,false,0);return s.canvas.toDataURL('image/png').split(',')[1]}"""
def frame(browser,i,q):
 mode=MODES[i];n=f'{mode}-s{q["stage"]:02}-{q["width"]}-{q["view"]}'
 r=ROOTS[i]; proof=DAGS[i]
 ctx=browser.new_context(viewport=dict(width=q['width'],height=q['height']),device_scale_factor=1)
 p=ctx.new_page(); bad=[]; assets={}; readiness=None; phase='boot'; written=[]
 p.on('pageerror',lambda e:bad.append(str(e)[:2000]))
 p.on('response',lambda e:assets.update({urlparse(e.url).path[1:]:e}) if ADDR.fullmatch(urlparse(e.url).path[1:]) or e.status>=400 else None)
 p.on('requestfailed',lambda e:bad.append([e.resource_type,urlparse(e.url).path,e.failure]) if not(e.resource_type=='media' and 'ERR_ABORTED' in (e.failure or ''))else None)
 p.add_init_script("""window.__im=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
 Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){this.__srcTime=performance.now();window.__im.push(this);return d.set.call(this,v)}});""")
 try:
  got=p.goto(f'http://127.0.0.1:{18841+i}/HONRO.html',wait_until='domcontentloaded',timeout=18000)
  assert got and got.ok and sha(got.body())==proof['htmlSHA256']
  p.wait_for_function(BOOT,timeout=18000);phase='launch';p.evaluate(LAUNCH,q['stage'])
  c=p.locator('#battlecanvas');c.wait_for(state='visible',timeout=18000)
  phase='native-turn-ready';readiness=ready_turn(p)
  phase='registered-scene';p.evaluate(CONFIG,{'q':q,'mode':mode})
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
  for k in ('initial','state','binding'):
   v=obs.pop(k,None)
   obs[k+'SHA256']=sha(v.encode())if v is not None else None
  runtime=RENDERER[mode+'CompiledRenderer'];need=[proof['entry']['path'],runtime,*(f['path'] for f in E['leaf'][str(q['stage'])].values())]
  http={}
  for k in need:
   v=assets.get(k);assert v and v.ok,(k,'no actual loaded response')
   s=sha(v.body());assert s==proof['reachable'][k]['sha256']==sha((r/k).read_bytes()),k
   http[k]=s
  assert not bad,bad
  assert set(obs['actual'])==set(q['actual']) and all(abs(obs['actual'][k]-q['actual'][k])<1e-7 for k in q['actual'])
  for k in ('focus','viewport','css','backing','actorCount','projectStage'): assert obs[k]==q[k],(n,k,obs[k],q[k])
  assert obs['initialSHA256']==q['physicsSha256'],(n,'original baseline snapshot divergence')
  spr=obs['supplements'];stats=len(spr)
  assert stats==(q['extra'] if mode=='target' else 0),(n,stats,q['extra'])
  assert all(v['id']=='act1-stage02-traced-body' and v['clip'] and v['tile']['top']==8192 and v['asset']=='act1-traced:stage02-body-v2' for v in spr)
  assert len({v['tile']['left'] for v in spr})==stats
  assert all(v==0 for v in rep.values()) and clock['normal'] and clock['calls']==clock['restores'] and clock['calls']>0,(rep,clock)
  return obs|dict(repeat=rep,nativeSky=clock,http=http,png={k:sha(v)for k,v in ims.items()},noErrors=True,turnReadiness=readiness),ims
 except Exception as exc:
  if phase=='native-turn-ready':
   try:readiness=p.evaluate(TURN_STATE)
   except Exception:pass
  details=dict(phase=phase,error=str(exc)[:2000],written=written,turnReadiness=readiness)
  (W/f'{n}-boot-errors.json').write_text(json.dumps(details|dict(errors=bad,responses={k:v.status for k,v in assets.items()}),indent=2))
  return details,None
 finally:ctx.close()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 # Capture the three signed positive Stage02 views before any negatives, then
 # the other fifteen Stage02 views, then the six adjacent-stage controls.
 for q in sorted(E['rows'],key=lambda row:0 if row['extra'] else 1 if row['stage']==2 else 2):
  pair=dict(stage=q['stage'],requestedViewport=[q['width'],q['height']],view=q['view'])
  pairs=[]
  for i,mode in enumerate(MODES):
   try: result=frame(browser,i,q)
   except Exception as e: result=(dict(phase='browser-transport',error=str(e)[:2000],written=[]),None)
   pairs.append(result)
   pair[mode]=result[0]
   pair['pass']=False
   if i==0:roll.append(pair)
   persist()
  a,b=pairs
  if a[1] is None or b[1] is None:
   pair['error']={mode:r[0]['error'] for mode,r in zip(MODES,pairs) if r[1] is None}
  else:
   try:
    pair['matched']=all(a[0][k]==b[0][k] for k in ('actual','focus','viewport','css','backing','actorCount','projectStage','stateSHA256','initialSHA256','bindingSHA256','role'))
    pair['pixels']=gate_pair(a[1],b[1],q)
    pair['pass']=pair['matched'] and all(x['pass_'] for x in pair['pixels'].values())
   except Exception as e:pair['error']=str(e)[:2000]
  persist()
  print(pair['stage'],pair['requestedViewport'],pair['view'],pair['pass'],pair.get('error'),flush=True)
 browser.close()
assert len(roll)==24 and all(r['pass'] for r in roll),[(r['stage'],r['view'],r.get('error'))for r in roll if not r['pass']]
