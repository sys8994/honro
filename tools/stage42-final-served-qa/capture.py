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
ARCHIVED={'1440-east': {'stockBinding': '2123df732af9e534a8a63e3b70bb2cfdef065818df0ef5d17c012d75ee75a645', 'stockEntry': '3b3ba95261b2b7588447e1b9ee5db8fee4bdb72692e5153a356054fd26b660b0', 'priorTargetBinding': '600eac6aea07733c651dbe94b287c8bd1290a336e5d1bdb05ab61989920ee023', 'priorState': '913d0b98f987bc1fb4f1a62b65a1604febbe7c6d58f9923cc89e1b7714da1174'}, '390-southeast': {'stockBinding': '2123df732af9e534a8a63e3b70bb2cfdef065818df0ef5d17c012d75ee75a645', 'stockEntry': '3b3ba95261b2b7588447e1b9ee5db8fee4bdb72692e5153a356054fd26b660b0', 'priorTargetBinding': '600eac6aea07733c651dbe94b287c8bd1290a336e5d1bdb05ab61989920ee023', 'priorState': '913d0b98f987bc1fb4f1a62b65a1604febbe7c6d58f9923cc89e1b7714da1174'}}

out=Path(os.environ["OUT"]);out.mkdir(parents=True,exist_ok=True)
bins=[Path(os.environ[s]) for s in ("STOCK","TARGET")]
urls=["http://127.0.0.1:18841","http://127.0.0.1:18842"]
def scan_frame(s):return str(s)[:1600]
def sig_image(x):return Image.open(io.BytesIO(x)).convert("RGBA")
def changed(a,b):return functools.reduce(ImageChops.lighter,ImageChops.difference(a,b).split()).point(lambda x:255 if x else 0,mode="1")
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 def get(i,q):
  mode=['stock','target'][i]; prefix=mode+f"-s{q['stage']:02}-{q['key']}"
  params=q['pose']; expected=params['actual']; w,h=params['width'],params['height']
  ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1)
  page=ctx.new_page(); bad=[]; immutable=[]; console=[]
  page.on("console",lambda m:console.append([m.type,m.text]))
  page.on('pageerror',lambda e:bad.append(['page',scan_frame(e)]))
  page.on('requestfailed',lambda r: bad.append(['request',urlparse(r.url).path,r.resource_type,r.failure]) if not(r.resource_type=='media' and 'ERR_ABORTED' in (r.failure or '')) else None)
  page.on('response',lambda r:immutable.append(r) if ADDR.fullmatch(urlparse(r.url).path[1:]) or r.status>=400 else None)
  page.add_init_script("""window.__qaImages=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});""")
  try:
   page.goto(urls[i]+'/HONRO.html',wait_until='domcontentloaded',timeout=90000)
   try:
    page.wait_for_function("() => document.documentElement.dataset.honroReady==='true' && typeof window.HonroCampaignLoader?.ensureStage==='function' && typeof window.HonroTimeOfDay?.sky==='function'",timeout=90000)
   except Exception:
    snapshot=page.evaluate("""()=>({dataset:{...document.documentElement.dataset},loader:typeof window.HonroCampaignLoader,timeOfDay:typeof window.HonroTimeOfDay,sky:typeof window.HonroTimeOfDay?.sky,app:typeof window.HonroApp,ready:typeof window.HONRO_APP_READY,startup:document.querySelector('[data-startup-progress]')?.textContent,retry:!!document.querySelector('[data-startup-retry]'),body:document.body.innerText.slice(0,3000),scripts:[...document.scripts].map(s=>s.src)})""")
    snapshot.update(errors=bad,console=console,responses=[{'url':r.url,'status':r.status}for r in immutable])
    (out/(prefix+'-first-false.json')).write_text(json.dumps(snapshot,indent=2))
    page.screenshot(path=str(out/(prefix+'-first-false.png')))
    raise
   (out/(prefix+'-init-ready.json')).write_text(json.dumps(page.evaluate("() => ({ready:document.documentElement.dataset.honroReady,loader:typeof window.HonroCampaignLoader?.ensureStage,sky:typeof window.HonroTimeOfDay?.sky,app:typeof window.HonroApp})")))
   page.evaluate("""async sid=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
     await HonroCampaignLoader.ensureStage(sid);
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
   assert result['edgeRenderer']['draws'] and result['edgeRenderer']['domains'], 'missing actual landscape paint/culling path'
   result['assets']=response_indices
   result['repeat']=repeat;result['bad']=bad
   return result,pixels
  finally:ctx.close()
 roll=[]
 for q in views:
  item={'view':q['key']}
  try:
   aa,a=get(0,q);bb,b=get(1,q)
   prior=ARCHIVED[q['key']];assert aa['bindingSHA256']==prior['stockBinding'];assert aa['stateSHA256']==prior['priorState'];assert next(v['sha256'] for k,v in aa['assets'].items() if '/entries/game.' in k)==prior['stockEntry'];assert bb['bindingSHA256']!=prior['priorTargetBinding'];item['exactPriorStockEntryBindingState']=True;item.update(stock=aa,target=bb,stateCameraEqual=all(aa[k]==bb[k] for k in ('actual','css','backing','focus','viewport','stateSHA256')))
   assert item['stateCameraEqual'], 'world/camera/actors changed'
   assert not aa['bad'] and not bb['bad'], 'browser/asset error'
   assert aa['bindingSHA256']!=bb['bindingSHA256'], 'candidate binding lost in build'
   assert all(aa[k]==bb[k] for k in ('surfaceSHA256','propsSHA256')), 'SURFACE or props changed'
   A,B=[np.array(sig_image(x['raw'])).astype(np.int16) for x in (a,b)]
   h,w=A.shape[:2];err=np.abs(A-B).max(2);srcScale=6500/2022;sx=(np.arange(w)+.5-w/2)/aa['actual']['scale']/srcScale+aa['actual']['x']/srcScale;sy=(np.arange(h)+.5-h/2)/aa['actual']['scale']/srcScale+aa['actual']['y']/srcScale
   top=sy[:,None]<779
   owned=(~top)|((sx[None,:]>=2235)&(sx[None,:]<=2325)&(sy[:,None]>=662)&(sy[:,None]<=845))
   core=np.unpackbits(np.frombuffer(zlib.decompress(base64.b64decode(q['nativeCore'])),dtype=np.uint8).reshape(h,(w+7)//8),axis=1)[:,:w].astype(bool)
   assert int(core.sum())==q['nativeCoreCount']
   def summary(mask):
    e=err[np.broadcast_to(mask,err.shape)];return dict(changed=int((e>0).sum()),max=int(e.max(initial=0)),gt4=int((e>4).sum()),gt16=int((e>16).sum()))
   domn=bb['edgeRenderer']['domains'][0];bbands={}
   for axis,lo,hi,coords in [('x','left','right',sx),('y','top','bottom',sy)]:
    for k in (lo,hi):
     proj=abs(coords-domn['tiles'][k]/srcScale)*srcScale*bb['actual']['scale']
     if proj.min()<2.5:bbands[k]=dict(pixel=int(proj.argmin()),within2px=summary((proj<=2)[None,:] if axis=='x' else (proj<=2)[:,None]))
   item['regions']={'outsideProtectedOwnership':summary(~owned),'upperProtected':summary(top&~owned),'outsideNativeCore':summary(~core),'nativeCore':summary(core),'tileExteriorBoundaryBands':bbands}
   # Deviations are observations, not a tolerance-based pass.
   Image.fromarray((core*255).astype('uint8')).save(out/(q['key']+'-native-core.png'))
   Image.fromarray((~owned*255).astype('uint8')).save(out/(q['key']+'-protected.png'))
   assert not any(aa['repeat'].values()) and not any(bb['repeat'].values()), 'unstable repeated frame'
   item['changedPixels']=changed(sig_image(a['raw']),sig_image(b['raw'])).histogram()[255]
  except Exception as e:
   item['error']=str(e);roll.append(item);(out/'comparison.json').write_text(json.dumps(roll,indent=2));raise
  roll.append(item);(out/'comparison.json').write_text(json.dumps(roll,indent=2))
 browser.close()
 assert all('error' not in r for r in roll),roll
