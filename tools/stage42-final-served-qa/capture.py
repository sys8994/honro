import base64,functools,io,json,os,re,sys,zlib
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image,ImageChops
import numpy as np
from playwright.sync_api import sync_playwright
from verify import sha,ADDR
root=Path(__file__).resolve().parent
views=json.loads((root/'views.json').read_text())
TEMPLATE=json.loads((root/'template.json').read_bytes())
donor=TEMPLATE['donor']; donor_h=sha(json.dumps(donor,separators=(',',':')).encode())
assert donor_h==TEMPLATE['donorVectorSHA256']=='b83e9dc8feaba4f980f1969f9b7aa8b134825f625053aaeacd7bf5431a914b56'
assert TEMPLATE['donorFullOriginalSHA256']=='1db7c108f45a1ee4842893db886790658808baa7f8dce508359cdcd581eae922'


# Determine distance to the original analytical 1db7 Host curve, not to
# a candidate mask derived from pixels. Host is known letters/absolute.
HOST=donor['clips']['host'][0]
def build_host_polynomials(host):
 tokens=re.findall(r'[MLQHVZ]|[-+]?\d+(?:\.\d+)?',host)
 arity={'M':2,'L':2,'Q':4,'H':1,'V':1}
 comps=[]; current=None;i=0;origin=None
 while i<len(tokens):
  code=tokens[i];i+=1
  if code=='Z':
   assert current==origin
   continue
  assert code in arity
  count=arity[code];value=[float(v) for v in tokens[i:i+count]];i+=count
  if code=='M':current=complex(*value);assert origin is None;origin=current;continue
  if code=='L':end=complex(*value)
  elif code=='H':end=complex(value[0],current.imag)
  elif code=='V':end=complex(current.real,value[0])
  else:end=complex(*value[2:])
  if code=='Q':
   ctrl=complex(*value[:2]);coefs=np.array([end-2*ctrl+current,2*(ctrl-current),current])
  else:coefs=np.array([end-current,current])
  comps.append((code,coefs));current=end
 assert len(comps)==41
 return comps
HOST_POLY=build_host_polynomials(HOST)
def exact_east_support(tile,sample):
 x,y,sx,sy,before,after=sample
 A,b,c,D,e,f=tile['transform']
 assert A>0 and D>0 and b==c==0
 assert abs(sx-(x+.5-e)/A)<1e-9 and abs(sy-(y+.5-f)/D)<1e-9, ('unexpected actual alpha point transform',sample)
 # Curves are transformed into the actual device space before distance.
 # Global minimum is among both endpoints and all real stationary points
 # of squared Euclidean distance in t=0..1 for each line or quadratic.
 closest=None
 for n,(cmd,coefs)in enumerate(HOST_POLY):
  px=np.poly1d(coefs.real*A)+e-x-.5
  py=np.poly1d(coefs.imag*D)+f-y-.5
  ds=px*np.polyder(px)+py*np.polyder(py)
  for t in [0.,1.,*(float(r.real)for r in ds.r if abs(r.imag)<1e-10 and 0<r.real<1)]:
   dx,dy=float(px(t)),float(py(t));d= (dx*dx+dy*dy)**.5
   record=(d,n,t,sx+dx/A,sy+dy/D,cmd)
   if closest is None or record<closest:closest=record
 d,n,t,qx,qy,cmd=closest;K=6500/2022
 return dict(device=[x,y],source=[sx,sy],world=[sx*K,sy*K],before=before,after=after,difference=after-before,nearestHost=dict(commandIndex=n,opcode=cmd,t=t,distanceDevicePx=d,source=[qx,qy],world=[qx*K,qy*K]),withinOneCell=d<1.0)
REMAINING=['1440-south','1440-east','390-west','390-east']
viewIndex={r['key']:r for r in views};views=[viewIndex[k]for k in REMAINING]
PRIOR_APPROVED={'390-south': {'exactAlpha': False, 'exactComposite': False, 'hashes': {'stock': {'raw': '8954ae83eb690075be3e70756a1891a5ac14532769327a6a47d4f201b295e50d', 'dom': '7cbc5bdcf635a608f1a000f0e71a85517ad97eedc3ebe00163037bc95c5bbc9c'}, 'target': {'raw': 'd0bf9da1b0f2aeb54b771a8c5b63b169b91f9f4b34d7aa690930b46970d095a7', 'dom': 'ea144d386d942532bd8daf735f4714ec34ab575b6bd9d1a31a28ae46f8200bd2'}}, 'state': '913d0b98f987bc1fb4f1a62b65a1604febbe7c6d58f9923cc89e1b7714da1174'}, '390-southwest': {'exactAlpha': True, 'exactComposite': True, 'hashes': {'stock': {'raw': '7a0d515a60f381cfe4a033115575ef2c1c15d19ab502cea1994af2d57063f38d', 'dom': '84d7ee34ec56ab60ba11cc385f4d7ec4fcfc292e0a4ceb426f3edac46b90e290'}, 'target': {'raw': '33c15e2b3e72cb85f96ed1ab8c0c3a372c89350da56ffb8bbc11717f6aa272dd', 'dom': '5b618350959b0d2d26d9fc2d4fec458a5af551f062c168f562831febaeea429e'}}, 'state': '913d0b98f987bc1fb4f1a62b65a1604febbe7c6d58f9923cc89e1b7714da1174'}}
PRIOR_ARTIFACT={'run':44712869412,'artifact':14617714502,'zipSHA256':'7abd966b3808158952f3c559b2e7e57190feb6a27ad24858ed4e6988b437cadf','comparisonSHA256':' 569ea091cffc9386526630963069abd1609a6ed18c3359cc405a292935628a86 '.strip()}
CACHE_OBSERVER="() => {\n const P=HonroScene.prototype, A=HonroVectorArt, C=CanvasRenderingContext2D.prototype;\n const originals={tiles:P._drawTerrainDomainTiles,screen:P._screenRaster,draw:A.draw,img:C.drawImage,render:P.render};\n const expect=()=>HONRO_PROJECT.library.find(x=>x.id==='act5:near:42')?.edgeWall;\n if(Object.values(originals).some(x=>typeof x!=='function'))throw Error('missing pinned cache/asset observer APIs');\n const certByCanvas=new WeakMap, screenByCanvas=new WeakMap;\n let dispatch=null,screen=null,trace=null,commits=[];\n const copy=x=>JSON.parse(JSON.stringify(x));\n const cacheMeta=(scene,canvas)=>{\n  const q=scene._domainTiles;\n  if(!q?.tiles)return null;\n  for(const [id,row]of q.tiles)if(row.canvas===canvas)return {id,key:q.key,left:row.left,top:row.top,rs:q.rs};\n  return null;\n };\n A.draw=function(c,asset,...args) {\n  const r=Reflect.apply(originals.draw,this,[c,asset,...args]);\n  if(r!==false&&asset===expect()&&(dispatch||trace)&&asset?.id==='act5:stage42:registered-body'){\n   const m=c.getTransform(),z={canvas:[c.canvas.width,c.canvas.height],style:c.honroVisualLayer??null,transform:[m.a,m.b,m.c,m.d,m.e,m.f],clip:copy(asset.bounds)};\n   if(z.canvas[0]===516&&z.canvas[1]===516){const before=certByCanvas.get(c.canvas);if(before&&before.asset!==asset)throw Error('same cache canvas repainted by different BODY asset');certByCanvas.set(c.canvas,{asset,meta:z,committed:null});}\n   if(trace)trace.direct.push(z);\n   if(screen&&dispatch&&(z.canvas[0]!==516||z.canvas[1]!==516))screen.direct.push(z);\n  }\n  return r;\n };\n P._drawTerrainDomainTiles=function(c,b,w,h){\n  if(b?.honroStage!==42)return Reflect.apply(originals.tiles,this,[c,b,w,h]);\n  const prev=dispatch;dispatch={scene:this,b,w,h};\n  try{return Reflect.apply(originals.tiles,this,[c,b,w,h]);}finally{dispatch=prev;}\n };\n P._screenRaster=function(c,key,w,h,paint,slot,world){\n  if(!trace||slot!=='_screenWorldCache')return Reflect.apply(originals.screen,this,[c,key,w,h,paint,slot,world]);\n  const prev=screen, before=this[slot]?.canvas??null;screen={scene:this,key,slot,src:[],direct:[]};\n  try{\n   const value=Reflect.apply(originals.screen,this,[c,key,w,h,paint,slot,world]); const current=this[slot];\n   if(value&&current?.canvas&&current.canvas!==before){\n    const valid=screen.src.every(t=>t.asset===expect()&&t.committed);\n    screenByCanvas.set(current.canvas,{asset:valid&&(screen.src.length||screen.direct.length)?expect():null,tileSources:screen.src.slice(),directSources:screen.direct.slice(),slot,signature:current.key});\n   }\n   if(value&&current?.canvas){\n    const source=screenByCanvas.get(current.canvas);\n    if(source?.asset){\n     if(source.asset!==expect()||source.signature!==current.key)throw Error('warm screen cache changed source body/signature');\n     trace.screen.push({stage:42,signature:current.key,cacheHit:current.canvas===before,canvas:[current.canvas.width,current.canvas.height],tiles:source.tileSources.map(t=>t.committed)});\n     for(const row of source.tileSources)trace.consumed.push({...row.meta,tile:row.committed,via:'screen-cache'});\n     for(const row of source.directSources)trace.consumed.push({...row,via:'screen-cache-direct'});\n    }\n   }\n   return value;\n  }finally{screen=prev;}\n };\n C.drawImage=function(canvas,...args){\n  const out=Reflect.apply(originals.img,this,[canvas,...args]);\n  // A real successful drawImage reading a map-committed BODY-painted tile.\n  // For warm screen cache, provenance is copied from the tile(s) that built it.\n  if(dispatch&&certByCanvas.has(canvas)){\n   const cert=certByCanvas.get(canvas);\n   const tile=cacheMeta(dispatch.scene,canvas);\n   if(cert.asset!==expect()||!tile)throw Error('uncommitted/foreign BODY raster read');\n   if(!cert.committed){\n    cert.committed=tile;\n    if(commits.length<400)commits.push({...cert.meta,tile});\n   }else if(JSON.stringify(cert.committed)!==JSON.stringify(tile))throw Error('committed BODY raster identity changed');\n   const key=dispatch.scene._worldCacheKey(dispatch.b,dispatch.w);\n   if(tile.key!==key)throw Error('stale world raster cache id/key');\n   if(screen)screen.src.push(cert);\n   if(trace)trace.consumed.push({...cert.meta,tile,via:'domain-tile'});\n  }\n  return out;\n };\n P.render=function(engine,...args){\n  const b=engine?.b;\n  if(b?.honroStage!==42)return Reflect.apply(originals.render,this,[engine,...args]);\n  const prev=trace;trace={direct:[],consumed:[],screen:[]};\n  try{return Reflect.apply(originals.render,this,[engine,...args]);}\n  finally{trace.actual={x:this.x,y:this.y,scale:this.scale};trace.worldViewport=HonroBounds.viewport(this,this.canvas.getBoundingClientRect().width,this.canvas.getBoundingClientRect().height);\n    const {width:w,height:h}=this.canvas.getBoundingClientRect();\n    const rs=this._worldRasterScale(b,w),size=512/rs,d=b.honroTerrainBounds,l=HonroTerrainDomain.materialLandmarks(b).find(a=>a.asset?.id==='act5:near:42'&&a.asset.edgeWall===expect());\n    if(!l||!(rs>0)||!d)throw Error('stage 42 active domain metadata unavailable');\n    const tiles={left:Math.floor(d.left/size)*size,top:Math.floor(d.top/size)*size,right:(Math.floor(d.right/size)+1)*size,bottom:(Math.floor(d.bottom/size)+1)*size};\n    const v=trace.worldViewport;\n    trace.domain={tileWorldSize:size,domain:d,viewport:v,tiles,landmark:{x:l.x,y:l.y,scale:l.scale},paint:this._landmarkPaintBounds(l),extended:v.left<tiles.left||v.right>tiles.right||v.top<tiles.top||v.bottom>tiles.bottom};\n    trace.cacheKeys={currentWorld:this._worldCacheKey(b,w),committedDomain:this._domainTiles?.key??null,committedScreen:this._screenWorldCache?.key??null};\n    window.__stage42CacheLast=trace;trace=prev;}\n };\n window.__stage42CacheReceipt=()=>({priorCommitted:commits,last:window.__stage42CacheLast??null,boundID:expect()?.id??null});\n}\n"
out=Path(os.environ["OUT"]);out.mkdir(parents=True,exist_ok=True)
bins=[Path(os.environ[s]) for s in ("STOCK","TARGET")]
rel='shared/assets/environment/act5/stage42-registered-body.json'
cbf=json.loads((bins[0]/rel).read_bytes())
assert sha((bins[0]/rel).read_bytes())=='95ce6aee7094c1b4f9a1f62c7f90f1fe164d99b007b286a8c41ebd2b4565ace8'
urls=["http://127.0.0.1:18841","http://127.0.0.1:18842"]
def scan_frame(s):return str(s)[:1600]
def sig_image(x):return Image.open(io.BytesIO(x)).convert("RGBA")
def changed(a,b):return functools.reduce(ImageChops.lighter,ImageChops.difference(a,b).split()).point(lambda x:255 if x else 0,mode="1")
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 sessions={}; opened={}; firstSignatures={}
 def get(i,q):
  mode=['stock','target'][i]; prefix=mode+f"-s{q['stage']:02}-{q['key']}"
  params=q['pose']; expected=params['actual']; w,h=params['width'],params['height']
  key=(i,w,q['key'])
  if key not in sessions:
   ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1)
   opened[key]=ctx
   page=ctx.new_page();page.set_default_timeout(25000); bad=[]; immutable=[]; console=[]
   page.on("console",lambda m:console.append([m.type,m.text]))
   page.on('pageerror',lambda e:bad.append(['page',scan_frame(e)]))
   page.on('requestfailed',lambda r: bad.append(['request',urlparse(r.url).path,r.resource_type,r.failure]) if not(r.resource_type=='media' and 'ERR_ABORTED' in (r.failure or '')) else None)
   page.on('response',lambda r:immutable.append(r) if ADDR.fullmatch(urlparse(r.url).path[1:]) or r.status>=400 else None)
   page.add_init_script("""window.__qaImages=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});""")
   response=page.goto(urls[i]+'/HONRO.html',wait_until='domcontentloaded',timeout=55000)
   assert response and response.ok and response.body()==(bins[i]/'HONRO.html').read_bytes(), 'actual served HTML mismatch'
   htmlSHA=sha(response.body())
   if i==0:assert htmlSHA==q['baseline']['htmlSHA256'], 'exact cbf release HTML pin' 
   try:
    page.wait_for_function("() => document.documentElement.dataset.honroReady==='true' && typeof window.HonroCampaignLoader?.ensureStage==='function' && typeof window.HonroTimeOfDay?.sky==='function'",timeout=50000)
   except Exception:
    snapshot=page.evaluate("""()=>({dataset:{...document.documentElement.dataset},loader:typeof window.HonroCampaignLoader,timeOfDay:typeof window.HonroTimeOfDay,sky:typeof window.HonroTimeOfDay?.sky,app:typeof window.HonroApp,ready:typeof window.HONRO_APP_READY,startup:document.querySelector('[data-startup-progress]')?.textContent,retry:!!document.querySelector('[data-startup-retry]'),body:document.body.innerText.slice(0,3000),scripts:[...document.scripts].map(s=>s.src)})""")
    snapshot.update(errors=bad,console=console,responses=[{'url':r.url,'status':r.status}for r in immutable])
    (out/(prefix+'-first-false.json')).write_text(json.dumps(snapshot,indent=2))
    page.screenshot(path=str(out/(prefix+'-first-false.png')))
    raise
   (out/(prefix+'-init-ready.json')).write_text(json.dumps(page.evaluate("() => ({ready:document.documentElement.dataset.honroReady,loader:typeof window.HonroCampaignLoader?.ensureStage,sky:typeof window.HonroTimeOfDay?.sky,app:typeof window.HonroApp})")))
   page.evaluate(CACHE_OBSERVER)
   page.evaluate("""async sid=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
     await Promise.race([HonroCampaignLoader.ensureStage(sid),new Promise((_,r)=>setTimeout(()=>r(Error('Stage42 cache proof load timeout')),30000))]);
     for(let n=1;n<sid;n++)a.profile.cleared[n]=true;
     for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(sid).entryLevel);
     a.launch(sid);if(a.engine?.b.honroStage!==sid)throw Error('wrong launch');
     for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
     if(a.dialogue)throw Error('entry dialogue remained');
     a.close();HonroStoryFraming.clear(a.scene);}""",q['stage'])
   c=page.locator('#battlecanvas');c.wait_for(state='visible',timeout=20000)
   if q['mode']=='backing':
    orig=c.evaluate('(c)=>c.clientHeight')
    if orig!=h:page.set_viewport_size({'width':w,'height':h+(h-orig)})
   page.wait_for_timeout(1500)
   page.evaluate("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);if(document.getElementById('turn-banner')?.hidden===false)throw Error('First-turn banner still active');}")
   sessions[key]=(ctx,page,bad,immutable,console,c,htmlSHA)
  ctx,page,bad,immutable,console,c,htmlSHA=sessions[key]
  try:
   page.evaluate("""q=>{const a=HonroApp,s=a.scene,b=a.engine.b;HonroStoryFraming.clear(s);
      if(q.case==='low-tide')HonroAct4TerrainPreview.coast.tide(b);
      Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,...q.pose.actual});
      HonroBounds.constrain(s,b);
      const original=HonroTimeOfDay.sky, p=performance, originalNow=p.now, own=Object.getOwnPropertyDescriptor(p,'now');let call=0,restore=0,active=false;
      function observed(...args){if(args[4]?.honroStage!==q.stage)return Reflect.apply(original,this,args);
       if(active||p.now!==originalNow||own?.configurable===false)throw Error('native sky clock scope unavailable');
       active=true;Object.defineProperty(p,'now',{value:()=>41000,configurable:true,writable:true});
       try{call++;return Reflect.apply(original,this,args);}finally{if(own)Object.defineProperty(p,'now',own);else delete p.now;active=false;restore++;
        if(p.now!==originalNow)throw Error('native performance clock not immediately restored');}}
      HonroTimeOfDay.sky=observed;
      window.__restoreNativeQA=()=>{if(active||p.now!==originalNow||call!==restore||HonroTimeOfDay.sky!==observed)throw Error('native sky receipt inconsistent');
        HonroTimeOfDay.sky=original;return {calls:call,restores:restore};};
      window.__witness=q;
      const origD=HonroVectorArt.draw, origT=s._drawTerrainDomainTiles;
      const draws=[], domains=[], local=()=>HonroTerrainDomain.materialLandmarks(b).find(l=>l.asset?.id==='act5:near:42');
      let inDomain=false;
      HonroVectorArt.draw=function(c,asset,...rest){if(asset?.id==='act5:stage42:registered-body'&&draws.length<64){const m=c.getTransform();
       draws.push({inDomain,transform:[m.a,m.b,m.c,m.d,m.e,m.f],canvas:[c.canvas.width,c.canvas.height],style:c.honroVisualLayer??null,clip:asset.bounds});}
       return origD.call(this,c,asset,...rest);};
      s._drawTerrainDomainTiles=function(c,bb,w,h){if(domains.length<3){const d=bb.honroTerrainBounds,l=local(),size=512/s._worldRasterScale(bb,w),v=HonroBounds.viewport(s,w,h);
       if(!l)throw Error('active near42 terrain landmark missing');
       const tiles={left:Math.floor(d.left/size)*size,top:Math.floor(d.top/size)*size,right:(Math.floor(d.right/size)+1)*size,bottom:(Math.floor(d.bottom/size)+1)*size};
       domains.push({tileWorldSize:size,domain:d,viewport:v,tiles,landmark:{x:l.x,y:l.y,scale:l.scale},paint:s._landmarkPaintBounds(l),
       extended:v.left<tiles.left||v.right>tiles.right||v.top<tiles.top||v.bottom>tiles.bottom});}
       inDomain=true;try{return origT.call(this,c,bb,w,h);}finally{inDomain=false;}};
      window.__ownerReceipt=()=>{HonroVectorArt.draw=origD;delete s._drawTerrainDomainTiles;return {draws,domains};};
      s.render(a.engine,0,'',.6,false,0);}""",q)
   page.wait_for_function("window.__qaImages.every(i=>!i.src||i.complete)",timeout=60000)
   page.evaluate("async()=>{await document.fonts.ready;const failed=window.__qaImages.filter(i=>i.src&&i.complete&&!i.naturalWidth);if(failed.length)throw Error('Registered scene image failed to decode');}")
   result=page.evaluate("""()=>{const a=HonroApp,s=a.scene,b=a.engine.b,q=window.__witness;
    const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.stage);
    if(!st||b.honroStage!==q.stage)throw Error('Wrong stage identity through normal loader');
    const pick=(o,k)=>Object.fromEntries(k.map(n=>[n,o?.[n]??null]));
    const signature=()=>JSON.stringify({terrain:b.terrain,units:b.units,
      battle:pick(b,['width','height','round','water','waterZones','honroWaterZones','honroMarkers','honroState','honroObjectives','honroAct4PreviewState']),
      source:pick(st,['width','height','playBounds','terrainBounds','camera','initialState','units','objectives','events','markers','anchors','encounters','routes','environment','layers']),
      support:b.units.map(u=>pick(u,['id','x','y','grounded','hp','role','dead','support','supportId'])),
      focus:HonroBounds.focus(b)});
    const before=signature();let bodyCalls=0;const drawOriginal=HonroVectorArt.draw;HonroVectorArt.draw=function(c,asset,...args){if(asset?.id==='act5:stage42:registered-body')bodyCalls++;return drawOriginal.call(this,c,asset,...args)};
    s.render(a.engine,0,'',.6,false,0);s.render(a.engine,0,'',.6,false,0);
    if(signature()!==before)throw Error('Renderer changed physical or gameplay state');
    const pos={x:s.x,y:s.y,scale:s.scale}, r=s.canvas.getBoundingClientRect(),focus=HonroBounds.focus(b);
    if(Object.keys(pos).some(k=>Math.abs(pos[k]-q.pose.actual[k])>1e-7))throw Error('Archived pose not reached without changing the camera contract: '+JSON.stringify(pos));
    if(pos.x<focus.left-1e-7||pos.x>focus.right+1e-7||pos.y<focus.top-1e-7||pos.y>focus.bottom+1e-7)throw Error('Archived camera outside supported focus');
    const timing=[];for(let i=0;i<12;i++){const t=performance.now();s.render(a.engine,0,'',.6,false,0);timing.push(performance.now()-t);} const near=HONRO_PROJECT.library.find(v=>v.id==='act5:near:42'); if(!near?.edgeWall)throw Error('missing actual BODY binding'); const binding=JSON.stringify(near.edgeWall);const surface=JSON.stringify(near.edgeSurface),props=JSON.stringify(near.vector);HonroVectorArt.draw=drawOriginal;return {timing,binding,surface,props,bodyCalls,actual:pos,css:{w:r.width,h:r.height},backing:[s.canvas.width,s.canvas.height],focus,viewport:HonroBounds.viewport(s,r.width,r.height),tide:b.honroAct4PreviewState?.tide||null,state:before,raw:s.canvas.toDataURL('image/png').split(',')[1]};}""")
   assert result['backing']==params['backing'],(q['stage'],'archive backing',result['backing'],params['backing'])
   if 'css' in params:assert result['css']==params['css'],(q['stage'],'archive CSS',result['css'],params['css'])
   if q['case']=='low-tide':assert result['tide']=={'phase':'low','surface':4095,'warningRound':2,'highRound':5,'lowRound':7},result['tide']
   pixels={'raw':base64.b64decode(result.pop('raw')),'dom':c.screenshot(animations='disabled',timeout=45000)}
   for k,v in pixels.items(): (out/(prefix+'-'+k+'.png')).write_bytes(v)
   again=page.evaluate("()=>{const a=HonroApp;a.scene.render(a.engine,0,'',.6,false,0);return a.scene.canvas.toDataURL('image/png').split(',')[1]}")
   sec={'raw':base64.b64decode(again),'dom':c.screenshot(animations='disabled',timeout=45000)}
   repeat={k:changed(sig_image(v),sig_image(sec[k])).histogram()[255] for k,v in pixels.items()}
   for k,v in sec.items():
    if repeat[k]:(out/(prefix+'-'+k+'-repeat.png')).write_bytes(v)
   result['edgeRenderer']=page.evaluate('()=>window.__ownerReceipt()')
   receipt=page.evaluate('()=>window.__stage42CacheReceipt()')
   assert receipt['boundID']=='act5:stage42:registered-body' and receipt['last']['actual']==params['actual'] and receipt['last']['worldViewport']==q['expectedViewport'], ('cache observation not for this archived pose',receipt)
   assert receipt['priorCommitted'], ('no Stage42 committed cold tiles observed',receipt)
   last=receipt['last']; entries=[*last['direct'],*last['consumed']]
   assert entries and (last['consumed'] or any(row['canvas']!=[516,516] for row in last['direct'])), ('warm frame did not consume expected Stage42 tile/screen/direct BODY',receipt)
   known={tuple(r['tile'][k]for k in ('key','id','left','top','rs')) for r in receipt['priorCommitted']}
   for row in last['consumed']:
    if row.get('tile') is not None:
     assert tuple(row['tile'][k]for k in ('key','id','left','top','rs')) in known and row['tile']['key']==last['cacheKeys']['currentWorld']
   result['edgeRenderer']['domains']=[last['domain']]
   result['edgeRenderer']['draws']=entries
   result['cacheProvenance']=receipt
   result['nativeSky']=page.evaluate("()=>window.__restoreNativeQA()")
   assert result['nativeSky']['calls']==result['nativeSky']['restores']
   response_indices={}
   for r in immutable:
    path=urlparse(r.url).path[1:]
    if path in response_indices:continue
    if r.status!=200:
     bad.append(['http',path,r.status]);continue
    if ADDR.fullmatch(path):
     body=r.body();b=sha(body);expected_sha=sha((bins[i]/path).read_bytes())
     if b!=expected_sha or not b.startswith(ADDR.fullmatch(path)[2]):bad.append(['HTTP-content-address',path,b,expected_sha])
     response_indices[path]={'sha256':b,'bytes':len(body)}
   assert any('/entries/game.' in path for path in response_indices),('Normal entry fetch not observed',q['stage'])
   result['stateSHA256']=sha(result.pop('state').encode()); binding=result.pop('binding'); result['bindingSHA256']=sha(binding.encode())
   source=json.loads((bins[i]/'shared/assets/environment/act5/stage42-registered-body.json').read_text())
   assert json.loads(binding)==source, 'active BODY does not match the pinned exact package'
   result['surfaceSHA256']=sha(result.pop('surface').encode());result['propsSHA256']=sha(result.pop('props').encode())
   assert result['edgeRenderer']['domains'] and result['edgeRenderer']['draws'] and result['cacheProvenance'], 'missing actual observed BODY cache/direct proof'
   # Strict across-view state: camera is verified separately, not part of signature.
   assert result['stateSHA256']==firstSignatures.setdefault(key,result['stateSHA256']), 'world state drifted across camera sequence'
   result['htmlSHA256']=htmlSHA
   assert result['focus']==q['expectedFocus'] and result['viewport']==q['expectedViewport'], 'native camera focus/viewport changed'
   # Separate from the opaque in-game canvas bytes. Replay the *actual*
   # runtime draw transforms through the same Chromium Canvas/Path2D with
   # no sky/backdrop; current tree, exact 1db7 donor and target are isolated.
   if i==1:
    result['transparentAlpha']=page.evaluate("""({rows,donor,stock})=>{
     const current=HONRO_PROJECT.library.find(v=>v.id==='act5:near:42').edgeWall;
     const legacy={...stock,vector:donor};
     function render(asset,z){
      const canvas=document.createElement('canvas');
      [canvas.width,canvas.height]=z.canvas;
      const c=canvas.getContext('2d');
      c.setTransform(...z.transform); c.honroVisualLayer=z.style;
      if(!HonroVectorArt.draw(c,asset,{x:0,y:0,scale:1}))throw Error('transparent canonical draw failed');
      return c.getImageData(0,0,canvas.width,canvas.height).data;
     }
     const seen=new Set(), out=[];
     for(const z of rows){
      const key=JSON.stringify([z.canvas,z.transform,z.style]);if(seen.has(key))continue;seen.add(key);
      const [w,h]=z.canvas,[a,b,c,d,e,f]=z.transform;
      if(a<=0||d<=0||b||c)throw Error('diagnostic expected actual axis-aligned positive world transform');
      const O=render(stock,z), N=render(current,z), D=render(legacy,z);
      const m={protectedUpper:{pixels:0,changed:0,max:0},canonicalHoleBounds:{pixels:0,changed:0,max:0},side:{pixels:0,changed:0,max:0},deep:{pixels:0,changed:0,max:0,onOffChanged:0,halfContourChanged:0,opaqueChanged:0,samples:[]}};
      const add=(r,diff)=>{r.pixels++;if(diff){r.changed++;r.max=Math.max(r.max,Math.abs(diff));}};
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
       const sx=(x+.5-e)/a,sy=(y+.5-f)/d,p=4*(y*w+x)+3, delta=N[p]-O[p];
       if(sy<789)add(m.protectedUpper,delta);
       if(sx>=161.63&&sx<=1703.24&&sy>=0&&sy<=649.79)add(m.canonicalHoleBounds,delta);
       if(sx<-405-1/a||sx>2360+1/a)add(m.side,delta);
       if(sy>1332){
        const r=m.deep, after=N[p], before=D[p];add(r,after-before);
        if(after!==before&&r.samples.length<2048)r.samples.push([x,y,sx,sy,before,after]);
        if((after>0)!=(before>0))r.onOffChanged++;
        if((after>=128)!=(before>=128))r.halfContourChanged++;
        if((after===255)!=(before===255))r.opaqueChanged++;
       }
      }
      out.push({canvas:z.canvas,transform:z.transform,style:z.style,regions:m});
     }
     return out;
    }""",{'rows':result['edgeRenderer']['draws'],'donor':donor,'stock':cbf})
   result['assets']=response_indices
   result['repeat']=repeat;result['bad']=bad
   return result,pixels
  except Exception:
   (out/(prefix+'-fault.json')).write_text(json.dumps({'errors':bad,'console':console,'status':[(r.url,r.status)for r in immutable],'htmlSHA256':htmlSHA},indent=2))
   raise
 roll=[]
 for q in views:
  item={'view':q['key']}
  try:
   aa,a=get(0,q); bb,b=get(1,q)
   expected=q['baseline']
   for k in ('bindingSHA256','stateSHA256','surfaceSHA256','propsSHA256','htmlSHA256'):
    assert aa[k]==expected[k], (q['key'],k,aa[k],expected[k])
   filters=('web/data/chapter-42.','web/data/chapter-42-assets.','web/runtime/ordered-common-18.','web/entries/game.')
   pruned=lambda f:{k:v for k,v in f['assets'].items()if k.startswith(filters)}
   assert pruned(aa)==expected['assets'], 'cbf archived data/renderer modules mismatch'
   assert len(pruned(bb))==4, 'candidate did not serve expected package graph'
   for prefix,shouldMatch in [('web/data/chapter-42.',True),('web/data/chapter-42-assets.',False),('web/runtime/ordered-common-18.',True),('web/entries/game.',False)]:
    sel=lambda z:[(k,v)for k,v in pruned(z).items()if k.startswith(prefix)]
    assert bool(sel(aa)==sel(bb))==shouldMatch,(q['key'],prefix,sel(aa),sel(bb))
   assert aa['bindingSHA256']!=bb['bindingSHA256'] and aa['htmlSHA256']!=bb['htmlSHA256']
   assert not aa['bad'] and not bb['bad'] and not any(aa['repeat'].values()) and not any(bb['repeat'].values())
   same=all(aa[k]==bb[k] for k in ('actual','css','backing','focus','viewport','stateSHA256','surfaceSHA256','propsSHA256'))
   assert same, 'world, pose, physics, SURFACE, or props changed'
   item.update(stock=aa,target=bb,preservedWorldAndProps=True)
   imA,imB=[np.array(sig_image(s['raw']))for s in (a,b)]; H,W=imA.shape[:2]; K=6500/2022
   sx=(np.arange(W)+.5-W/2)/aa['actual']['scale']/K+aa['actual']['x']/K; sy=(np.arange(H)+.5-H/2)/aa['actual']['scale']/K+aa['actual']['y']/K
   error=np.abs(imA.astype(np.int16)-imB.astype(np.int16)).max(2)
   buf=zlib.decompress(base64.b64decode(q['allowedOwner']));assert sha(buf)==q['allowedOwnerSHA'];owner=np.unpackbits(np.frombuffer(buf,dtype=np.uint8).reshape(H,(W+7)//8),axis=1)[:,:W].astype(bool)
   def check(mask):
    delta=error[np.broadcast_to(mask,error.shape)]
    return dict(changed=int((delta>0).sum()),max=int(delta.max(initial=0)),gt4=int((delta>4).sum()),gt16=int((delta>16).sum()))
   tests={'outsideSignedOwnerAA':~owner,'physicalUpper':sy[:,None]<778,'higherThanNewGeometryAA':sy[:,None]<(789-1/(K*aa['actual']['scale'])),'outerSideAA':(sx[None,:]<(-405-1/(K*aa['actual']['scale'])))|(sx[None,:]>(2360+1/(K*aa['actual']['scale']))),'canonicalHoles':(sx[None,:]>=161.63)&(sx[None,:]<=1703.24)&(sy[:,None]>=0)&(sy[:,None]<=649.79)}
   item['regions']={k:check(v)for k,v in tests.items()}
   item['hashes']={mode:{k:sha(v)for k,v in d.items()}for mode,d in [('stock',a),('target',b)]}
   assert item['hashes']['stock']==expected['rawAndDom'], 'cbf raw/DOM differed from archive'
   for k,area in tests.items():
    if item['regions'][k]['changed']:
     gap=(error>0)&area
     yy,xx=np.nonzero(gap);item['regions'][k]['actualSourceExtent']=[float(sx[xx.min()]),float(sy[yy.min()]),float(sx[xx.max()]),float(sy[yy.max()])]
     Image.fromarray((gap*255).astype('uint8')).save(out/(q['key']+'-protected-'+k+'-delta.png'))
   if q.get('deepReference'):
    d=q['deepReference'];good=sy>d['sourceYMin'];assert int(good.sum())==d['rows']
    staged=imB[good].tobytes()
    deep=zlib.decompress(base64.b64decode(d['deepRGBAZ']))
    assert sha(deep)==d['deepRGBASHA256'] and len(staged)==len(deep)
    observed=sha(staged)
    delta=np.abs(np.frombuffer(staged,dtype=np.uint8).reshape(-1,4).astype(np.int16)-np.frombuffer(deep,dtype=np.uint8).reshape(-1,4))
    item['userReferenceDeep']={k:v for k,v in d.items()if k!='deepRGBAZ'}
    item['userReferenceDeep'].update(observed=observed,exactCompositeRGBA=observed==d['deepRGBASHA256'],changedRGB=int((delta[:,:3].max(1)>0).sum()),maxRGB=int(delta[:,:3].max()),compositeAlphaChanged=int((delta[:,3]>0).sum()))
   da,db=[v['edgeRenderer']['domains'][0]for v in (aa,bb)]; cap=2900*K
   assert all(da[k]==db[k] for k in ('domain','tileWorldSize','tiles','landmark','viewport','extended')), 'terrain domain or tile extents changed'
   assert all(da['paint'][k]==db['paint'][k] for k in ('left','right','top')) and abs(db['paint']['bottom']-cap)<1e-8,('visual culling not unioning canonical bottom',db['paint'])
   draws=bb['edgeRenderer']['draws'];assert any(r['clip']=={'x':-1250,'y':0,'w':4510,'h':2900}for r in draws)
   item['culling']={'stock':da['paint'],'target':db['paint'],'worldTileSize':db['tileWorldSize'],'domain':db['domain'],'lateralCapsOutside':bb['viewport']['left']>-3900 and bb['viewport']['right']<10400,'normalBottomAboveArtEnd':bb['viewport']['bottom']<cap,'dispatchedBodyDraws':len(draws),'drawCanvasShapes':[list(s)for s in sorted({tuple(r['canvas'])for r in draws})]}
   item['boundaries']={}
   for band in ('left','right','top','bottom'):
    vs=sx if band in ('left','right') else sy
    at=int(np.argmin(abs(vs*K-db['tiles'][band])*bb['actual']['scale']))
    dd=abs(vs[at]*K-db['tiles'][band])*bb['actual']['scale']
    if dd>2 or at<2 or at+2>=len(vs):continue
    axes=imB[:,at-2:at+3] if band in ('left','right') else imB[at-2:at+3]
    step=np.abs(np.diff(axes[:,:,:3].astype(np.int16),axis=(1 if band in ('left','right')else 0))).max(2)
    delta=np.moveaxis(step,1 if band in ('left','right')else 0,0)
    item['boundaries'][band]={'pixel':at,'residualPixels':dd,'neighborMax':[int(t.max())for t in delta],'neighborGT16':[int((t>16).sum())for t in delta]}
   if q['key']=='390-south':
    y=item['boundaries'].get('bottom') or {}
    assert db['extended'] and abs(y.get('pixel',-100)-615)<=1 and len(draws)>=2, ('Missing mobile tile/direct paint witness',db,draws)
   assert all(x['changed']==0 for x in item['regions'].values()), ('protected active/side/alpha hole pixel changed',item['regions'])
   alpha=bb['transparentAlpha']
   assert alpha and (not q.get('deepReference') or any(r['regions']['deep']['pixels'] for r in alpha))
   # All actual protected alpha remains hard exact. The archival deep
   # comparison is distinct: save supported subpixel changes, but never
   # call them exact. Changes of occupancy/class or distance are integrity.
   exactDeep=True
   for d in alpha:
    for key in ('protectedUpper','canonicalHoleBounds','side'):
     assert d['regions'][key]['changed']==0, ('transparent protected alpha changed',q['key'],d,key)
    deep=d['regions']['deep'];samples=deep.pop('samples')
    assert len(samples)==deep['changed'], ('excess outside source integrity',deep)
    deep['coordinates']=[exact_east_support(d,r)for r in samples]
    exactDeep &= deep['changed']==0
    categorical=deep['onOffChanged']+deep['halfContourChanged']+deep['opaqueChanged']
    assert categorical==0 and deep['max']<=2 and all(r['withinOneCell'] for r in deep['coordinates']),('donor contour crossed exact curve support',q['key'],d)
   item['rawGeometryStateAndOwnedPass']=True
   item['transparentDeepAlphaExact']=bool(exactDeep)
   assert item['culling']['lateralCapsOutside'] and item['culling']['normalBottomAboveArtEnd']
  except Exception as e:
   item['error']=str(e)
  finally:
   # Isolated context for each pose/mode. Never reuse failed state.
   for i in (0,1):
    key=(i,q['pose']['width'],q['key']);ctx=opened.pop(key,None);sessions.pop(key,None)
    if ctx:ctx.close()
  roll.append(item);(out/'comparison.json').write_text(json.dumps(roll,indent=2))
 browser.close()
 assert len(roll)==4 and set(r['view'] for r in roll)==set(REMAINING)
 good={r['view']:r for r in roll if 'error' not in r and r.get('rawGeometryStateAndOwnedPass')}
 missing=[r['view'] for r in roll if r['view'] not in good]
 refs={k:r['exactComposite']for k,r in PRIOR_APPROVED.items()}
 exactRGBA=all(refs.values())
 exactAlpha=(not missing and all(p['exactAlpha']for p in PRIOR_APPROVED.values()) and all(r['transparentDeepAlphaExact']for r in good.values()))
 strict=exactAlpha and exactRGBA
 receipt=dict(technicalPoseCount=len(good)+len(PRIOR_APPROVED),exactPhysicalAndProtected=not missing,zeroCategoricalAlphaFlips=not missing,
     allObservedDeepAlphaChangesWithinOneExactCurveCell=not missing,transparentProtectedAlphaExact=not missing,
     transparentUserDonorSHA256=donor_h,independentArchivedDeepAlphaExact=exactAlpha,
     independentArchivedDeepRGBAExact=exactRGBA,archivalByteExact=strict,classification='AWAIT VISUAL REVIEW' if strict else 'HOLD: archival deep equality false',
     archivedMobile=PRIOR_ARTIFACT,archivedDeep=refs,unverified=missing,perPoseExactAlpha={**{k:v['exactAlpha'] for k,v in PRIOR_APPROVED.items()},**{k:r['transparentDeepAlphaExact'] for k,r in good.items()}})
 (out/'FINAL-RECEIPT.json').write_text(json.dumps(receipt,indent=2))
 assert not missing,('Four independent pose captures attempted; some observed technical cases had no proof',receipt)
 assert strict,('All six integrity-valid captures preserved; strict donor Alpha/RGBA archival equality remains HOLD',receipt)
