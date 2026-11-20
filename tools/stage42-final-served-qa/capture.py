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
 sessions={}; firstSignatures={}
 def get(i,q):
  mode=['stock','target'][i]; prefix=mode+f"-s{q['stage']:02}-{q['key']}"
  params=q['pose']; expected=params['actual']; w,h=params['width'],params['height']
  key=(i,w)
  if key not in sessions:
   ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1)
   page=ctx.new_page(); bad=[]; immutable=[]; console=[]
   page.on("console",lambda m:console.append([m.type,m.text]))
   page.on('pageerror',lambda e:bad.append(['page',scan_frame(e)]))
   page.on('requestfailed',lambda r: bad.append(['request',urlparse(r.url).path,r.resource_type,r.failure]) if not(r.resource_type=='media' and 'ERR_ABORTED' in (r.failure or '')) else None)
   page.on('response',lambda r:immutable.append(r) if ADDR.fullmatch(urlparse(r.url).path[1:]) or r.status>=400 else None)
   page.add_init_script("""window.__qaImages=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});""")
   response=page.goto(urls[i]+'/HONRO.html',wait_until='domcontentloaded',timeout=90000)
   assert response and response.ok and response.body()==(bins[i]/'HONRO.html').read_bytes(), 'actual served HTML mismatch'
   htmlSHA=sha(response.body())
   if i==0:assert htmlSHA==q['baseline']['htmlSHA256'], 'exact cbf release HTML pin' 
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
   assert result['edgeRenderer']['domains'] and result['bodyCalls']>0, 'missing actual terrain dispatcher/BODY drawing'
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
      const m={protectedUpper:{pixels:0,changed:0,max:0},canonicalHoleBounds:{pixels:0,changed:0,max:0},side:{pixels:0,changed:0,max:0},deep:{pixels:0,changed:0,max:0,onOffChanged:0,halfContourChanged:0,opaqueChanged:0}};
      const add=(r,diff)=>{r.pixels++;if(diff){r.changed++;r.max=Math.max(r.max,Math.abs(diff));}};
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
       const sx=(x+.5-e)/a,sy=(y+.5-f)/d,p=4*(y*w+x)+3, delta=N[p]-O[p];
       if(sy<789)add(m.protectedUpper,delta);
       if(sx>=161.63&&sx<=1703.24&&sy>=0&&sy<=649.79)add(m.canonicalHoleBounds,delta);
       if(sx<-405-1/a||sx>2360+1/a)add(m.side,delta);
       if(sy>1332){
        const r=m.deep, after=N[p], before=D[p];add(r,after-before);
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
   assert alpha and any(r['regions']['deep']['pixels'] for r in alpha) if q.get('deepReference') else bool(alpha)
   assert all(all(k['changed']==0 for k in d['regions'].values()) for d in alpha), ('signed transparent Chromium alpha changed',alpha)
   item['rawGeometryStateAndOwnedPass']=True
   assert item['culling']['lateralCapsOutside'] and item['culling']['normalBottomAboveArtEnd']
  except Exception as e:
   item['error']=str(e);roll.append(item);(out/'comparison.json').write_text(json.dumps(roll,indent=2));raise
  roll.append(item);(out/'comparison.json').write_text(json.dumps(roll,indent=2))
 for ctx,*_ in sessions.values():ctx.close()
 browser.close()
 assert len(roll)==6 and all('error' not in x and x['rawGeometryStateAndOwnedPass'] for x in roll)
 refs={r['view']:r['userReferenceDeep'] for r in roll if 'userReferenceDeep'in r}
 assert len(refs)==2
 exact=all(r['exactCompositeRGBA']for r in refs.values())
 (out/'FINAL-RECEIPT.json').write_text(json.dumps(dict(technicalPoseCount=len(roll),exactPhysicalAndProtected=True,transparentChromiumAlphaExact=True,transparentUserDonorSHA256=donor_h,independentArchivedDeepRGBAExact=exact,archivedDeep=refs),indent=2))
 assert exact,('All six integrity-valid poses completed; independent archived full-composite donor RGBA gate RED',refs)
