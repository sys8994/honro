import base64,functools,io,json,os,re,zlib,hashlib,traceback
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
cfg=json.loads((root/'config.json').read_text())
views=cfg['views']
sha=lambda b:hashlib.sha256(b).hexdigest()
ADDR=re.compile(r'^(web/[A-Za-z0-9_.\-/]+)\.([a-f0-9]{16})\.([A-Za-z0-9]+)$')
INSPECT_ACTUAL="() => {\n  const a=HonroApp,s=a.scene,b=a.engine.b;\n  const v=HONRO_PROJECT.library.find(x=>x.id==='act5:near:42');\n  const l=HonroTerrainDomain.materialLandmarks(b).find(x=>x.id==='a5-near'&&x.kind==='canonical-element'&&x.asset?.id==='act5:near:42');\n  if(!l||!v?.edgeWall||b.honroStage!==42||!b.honroLandmarks.includes(l)||l.x||l.y||l.scale!==6500/2022||l.rotation||!HonroTerrainDomain.active(b))throw Error('actual Stage42 authored placement mismatch');\n  if(JSON.stringify(l.asset)!==JSON.stringify(v))throw Error('actual compiled asset differs from loaded registry');\n  const size=s.canvas.getBoundingClientRect();\n  return {compiled:JSON.stringify(l.asset),d:JSON.stringify(l.asset.edgeWall),paint:s._landmarkPaintBounds(l),focus:HonroBounds.focus(b),viewport:HonroBounds.viewport(s,size.width,size.height),world:b.honroTerrainBounds};\n}"
def compare_pixels(a,b,q):
    from PIL import Image
    import io,numpy as np,zlib,base64,hashlib
    px=lambda v:np.asarray(Image.open(io.BytesIO(v)).convert('RGBA')).astype(np.int16)
    aa,bb=px(a),px(b)
    assert aa.shape==bb.shape
    H,W=aa.shape[:2]
    assert [W,H]==q['pose']['backing']
    M=q['mask'];m=zlib.decompress(base64.b64decode(M['encoded']))
    assert hashlib.sha256(m).hexdigest()==M['sha']
    ok=np.unpackbits(np.frombuffer(m,dtype=np.uint8).reshape(H,(W+7)//8),axis=1)[:,:W].astype(bool)
    assert int(ok.sum())==M['count']
    s=q['pose']['actual'];K=6500/2022
    sx=(np.arange(W)+.5-q['pose']['css']['w']/2)/(s['scale']*K)+s['x']/K
    sy=(np.arange(H)+.5-q['pose']['css']['h']/2)/(s['scale']*K)+s['y']/K
    d=np.abs(aa-bb)
    changed=d.max(2)>0
    def zone(mask):
        v=d[np.broadcast_to(mask,(H,W))]
        return dict(anyRGBA=int((v.max(1)>0).sum()),maxRGBA=int(v.max(initial=0)),maxRGB=int(v[:,:3].max(initial=0)),maxAlpha=int(v[:,3].max(initial=0)))
    bottom=np.arange(H)[:,None]==H-1
    # Explicitly report the full row and only permit it inside the pre-declared
    # legitimate W shape (the exact SW/S final row is wholly outside).
    measures={'outsideSignedFootprintAA':zone(~ok),'withinSignedFootprintAA':zone(ok),
              'rightLowerSkyAndExistingEast':zone((sx[None,:]>=0)&(sy[:,None]>=1371)),
              'allUpperAndProps':zone(sy[:,None]<1300),
              'deepLowerBeyond2250':zone(sy[:,None]>2260+2/(K*s['scale'])),
              'lastRowFull':zone(bottom),'lastRowOutsideSigned':zone(bottom&~ok)}
    bbounds=None
    yy,xx=np.nonzero(changed); zz=np.nonzero(changed&~ok); differences=[]
    if len(yy):bbounds=[int(xx.min()),int(yy.min()),int(xx.max()),int(yy.max())]
    for y,x in zip(*zz):
        if len(differences)>=2048:break
        differences.append({'x':int(x),'y':int(y),'source':[float(sx[x]),float(sy[y])],
                            'before':aa[y,x].tolist(),'after':bb[y,x].tolist()})
    flags={k:measures[k]['anyRGBA']==0 for k in ('outsideSignedFootprintAA','rightLowerSkyAndExistingEast','allUpperAndProps','deepLowerBeyond2250','lastRowOutsideSigned')}
    flags['additionWitnessOrNegativeExact']=bool(changed.any())==q['positive']
    if not q['positive']:flags['negativeFullFrameExact']=not changed.any()
    if q['key'] in ('390-south','390-southwest'):flags['fullLastRowY647Exact']=H==648 and measures['lastRowFull']['anyRGBA']==0
    return {'zones':measures,'checks':flags,'passes':all(flags.values()),'changedPixels':int(changed.sum()),'deltaBBox':bbounds,
            'outsideCoordinateCounts':len(zz[0]),'outsideCoordinatesFirst2048':differences},(changed&~ok)

out=Path(os.environ["OUT"]);out.mkdir(parents=True,exist_ok=True)
bins=[Path(os.environ[s]) for s in ("STOCK","TARGET")]
rel='shared/assets/environment/act5/stage42-registered-body.json'
for i,mode in enumerate(('stock','target')):
 assert sha((bins[i]/rel).read_bytes())==cfg['digest'][mode]['wrapperFileSHA256']
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
   if i==0:assert htmlSHA==cfg['knownBefore']['htmlSHA256'],'stock exact actual archive HTML' 
   try:
    page.wait_for_function("() => document.documentElement.dataset.honroReady==='true' && typeof window.HonroCampaignLoader?.ensureStage==='function' && typeof window.HonroTimeOfDay?.sky==='function'",timeout=50000)
   except Exception:
    snapshot=page.evaluate("""()=>({dataset:{...document.documentElement.dataset},loader:typeof window.HonroCampaignLoader,timeOfDay:typeof window.HonroTimeOfDay,sky:typeof window.HonroTimeOfDay?.sky,app:typeof window.HonroApp,ready:typeof window.HONRO_APP_READY,startup:document.querySelector('[data-startup-progress]')?.textContent,retry:!!document.querySelector('[data-startup-retry]'),body:document.body.innerText.slice(0,3000),scripts:[...document.scripts].map(s=>s.src)})""")
    snapshot.update(errors=bad,console=console,responses=[{'url':r.url,'status':r.status}for r in immutable])
    (out/(prefix+'-first-false.json')).write_text(json.dumps(snapshot,indent=2))
    page.screenshot(path=str(out/(prefix+'-first-false.png')))
    raise
   (out/(prefix+'-init-ready.json')).write_text(json.dumps(page.evaluate("() => ({ready:document.documentElement.dataset.honroReady,loader:typeof window.HonroCampaignLoader?.ensureStage,sky:typeof window.HonroTimeOfDay?.sky,app:typeof window.HonroApp})")))
   page.evaluate("""async sid=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
     await Promise.race([HonroCampaignLoader.ensureStage(sid),new Promise((_,r)=>setTimeout(()=>r(Error('Stage42 cache proof load timeout')),30000))]);
     for(let n=1;n<sid;n++)a.profile.cleared[n]=true;
     for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(sid).entryLevel);
     a.launch(sid);if(a.engine?.b.honroStage!==sid)throw Error('wrong launch');
     for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
     if(a.dialogue)throw Error('entry dialogue remained');
     a.close();HonroStoryFraming.clear(a.scene);}""",q['stage'])
   c=page.locator('#battlecanvas');c.wait_for(state='visible',timeout=20000)
   page.wait_for_timeout(1500)
   page.evaluate("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);if(document.getElementById('turn-banner')?.hidden===false)throw Error('First-turn banner still active');}")
   sessions[key]=(ctx,page,bad,immutable,console,c,htmlSHA)
  ctx,page,bad,immutable,console,c,htmlSHA=sessions[key]
  try:
   page.evaluate("""q=>{const a=HonroApp,s=a.scene,b=a.engine.b;HonroStoryFraming.clear(s);
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
    const before=signature();
    s.render(a.engine,0,'',.6,false,0);s.render(a.engine,0,'',.6,false,0);
    if(signature()!==before)throw Error('Renderer changed physical or gameplay state');
    const pos={x:s.x,y:s.y,scale:s.scale}, r=s.canvas.getBoundingClientRect(),focus=HonroBounds.focus(b);
    if(Object.keys(pos).some(k=>Math.abs(pos[k]-q.pose.actual[k])>1e-7))throw Error('Archived pose not reached without changing the camera contract: '+JSON.stringify(pos));
    if(pos.x<focus.left-1e-7||pos.x>focus.right+1e-7||pos.y<focus.top-1e-7||pos.y>focus.bottom+1e-7)throw Error('Archived camera outside supported focus');
    const timing=[];for(let i=0;i<12;i++){const t=performance.now();s.render(a.engine,0,'',.6,false,0);timing.push(performance.now()-t);} const near=HONRO_PROJECT.library.find(v=>v.id==='act5:near:42'); if(!near?.edgeWall)throw Error('missing actual BODY binding'); const binding=JSON.stringify(near.edgeWall);const surface=JSON.stringify(near.edgeSurface),props=JSON.stringify(near.vector);return {timing,binding,surface,props,actual:pos,css:{w:r.width,h:r.height},backing:[s.canvas.width,s.canvas.height],focus,viewport:HonroBounds.viewport(s,r.width,r.height),tide:b.honroAct4PreviewState?.tide||null,state:before,raw:s.canvas.toDataURL('image/png').split(',')[1]};}""")
   assert result['backing']==params['backing'],(q['stage'],'archive backing',result['backing'],params['backing'])
   if 'css' in params:assert result['css']==params['css'],(q['stage'],'archive CSS',result['css'],params['css'])
   pixels={'raw':base64.b64decode(result.pop('raw')),'dom':c.screenshot(animations='disabled',timeout=45000)}
   for k,v in pixels.items(): (out/(prefix+'-'+k+'.png')).write_bytes(v)
   again=page.evaluate("()=>{const a=HonroApp;a.scene.render(a.engine,0,'',.6,false,0);return a.scene.canvas.toDataURL('image/png').split(',')[1]}")
   sec={'raw':base64.b64decode(again),'dom':c.screenshot(animations='disabled',timeout=45000)}
   repeat={k:changed(sig_image(v),sig_image(sec[k])).histogram()[255] for k,v in pixels.items()}
   for k,v in sec.items():
    if repeat[k]:(out/(prefix+'-'+k+'-repeat.png')).write_bytes(v)
   # App raw+DOM already on disk. No production cache patch/observer.
   S=cfg['digest'][mode];prev=cfg['knownBefore'];live=page.evaluate(INSPECT_ACTUAL)
   assert sha(live.pop('compiled').encode())==S['compiledNearSHA256']
   assert sha(live.pop('d').encode())==S['bindingSHA256']
   assert live['viewport']==q['expectedViewport'] and live['focus']==q['expectedFocus']
   assert live['world']=={'left':-1800,'top':-2400,'right':8300,'bottom':5061}
   K=6500/2022
   for k,z in {'left':-1250*K,'right':3260*K,'top':0,'bottom':2900*K}.items():assert abs(live['paint'][k]-z)<1e-8
   assert sha(result.pop('state').encode())==prev['stateSHA256']
   assert sha(result.pop('binding').encode())==S['bindingSHA256']
   assert sha(result.pop('surface').encode())==prev['surfaceSHA256']
   assert sha(result.pop('props').encode())==prev['propsSHA256']
   nativeSky=page.evaluate('()=>window.__restoreNativeQA()')
   assert nativeSky['calls']>0 and nativeSky['calls']==nativeSky['restores']
   response_indices={}
   for r in immutable:
    path=urlparse(r.url).path[1:]
    if path in response_indices:continue
    if r.status!=200:bad.append(['http',path,r.status]);continue
    if ADDR.fullmatch(path):
     body=r.body();b=sha(body);expected_sha=sha((bins[i]/path).read_bytes())
     if b!=expected_sha or not b.startswith(ADDR.fullmatch(path)[2]):bad.append(['HTTP-content-address',path,b,expected_sha])
     response_indices[path]={'sha256':b,'bytes':len(body)}
   core=('web/runtime/ordered-common-16.','web/runtime/ordered-common-18.','web/data/chapter-42.')
   assert {k:v for k,v in response_indices.items()if k.startswith(core)}=={k:v for k,v in prev['transport'].items()if k.startswith(core)}
   active=[v for k,v in response_indices.items()if k.startswith('web/data/chapter-42-assets.')]
   assert active==[{'sha256':S['packetSHA256'],'bytes':S['packetB']}], 'served exact candidate chapter packet mismatch'
   selected={k:v for k,v in response_indices.items()if k.startswith((*core,'web/entries/game.','web/data/chapter-42-assets.'))}
   assert sum(k.startswith('web/entries/game.')for k in selected)==1
   if i==0:assert selected==prev['transport']
   assert not any(repeat.values()) and not bad,(q['key'],repeat,bad)
   info={**live,'htmlSHA256':htmlSHA,'transport':selected,'repeat':repeat,'nativeSky':nativeSky,'stateSHA256':prev['stateSHA256'],'surfaceSHA256':prev['surfaceSHA256'],'propsSHA256':prev['propsSHA256'],'compiledNearSHA256':S['compiledNearSHA256'],'bindingSHA256':S['bindingSHA256'],'hashes':{k:sha(v)for k,v in pixels.items()}}
   if i==0:assert info['hashes']==q['archive'],'stock raw or DOM does not match the archived 0a94 frame'
   (out/(prefix+'-integrity.json')).write_text(json.dumps(info,indent=2)+'\n')
   return info,pixels
  except Exception:
   (out/(prefix+'-fault.json')).write_text(json.dumps({'error':traceback.format_exc(),'errors':bad,'console':console,'status':[(r.url,r.status)for r in immutable],'htmlSHA256':htmlSHA},indent=2)+'\n')
   raise
 frames=[]
 for q in views:
  m={'view':q['key'],'stock':None,'target':None,'sideErrors':{}}
  data={}
  for i,mode in enumerate(('stock','target')):
   try:m[mode],data[mode]=get(i,q)
   except Exception as ex:m['sideErrors'][mode]=str(ex)
   finally:
    key=(i,q['pose']['width'],q['key']);ctx=opened.pop(key,None);sessions.pop(key,None)
    if ctx:ctx.close()
  if len(data)==2:
   try:
    m['rawGate'],outside=compare_pixels(data['stock']['raw'],data['target']['raw'],q)
    if m['rawGate']['outsideCoordinateCounts']:
     Image.fromarray((outside*255).astype('uint8')).save(out/(q['key']+'-outside-diff.png'))
   except Exception as ex:m['pairException']=str(ex)
  frames.append(m)
  (out/'comparison.json').write_text(json.dumps(frames,indent=2)+'\n')
 browser.close()
 allPass=len(frames)==6 and all(r.get('rawGate',{}).get('passes',False) and not r['sideErrors'] for r in frames)
 (out/'FINAL.json').write_text(json.dumps({'result':'six actual frame integrity gates PASS, still needs visual review'if allPass else 'HOLD: outside-geometry, sentinel or source integrity not exact','cameraCount':len(frames),'actualRawDomPersistedFirstTrue':True,'nativeSurrogateComparedAsActual':False,'priorDonorArchiveBitExactClaim':False},indent=2)+'\n')
 assert allPass, 'Left visual-only candidate stays HOLD: strict for all six, including the final y647 row'
