import base64,functools,io,json,os,re,zlib,hashlib,traceback
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
cfg=json.loads((root/'config.json').read_text())
views=list(cfg['views'])
for n in cfg['negative']:
    views.append({'key':n['key'],'stage':n['stage'],'pose':{'width':n['width'],'height':n['height'],'actual':{'x':n['x'],'y':n['y'],'scale':n['width']/6800}}})
sha=lambda b:hashlib.sha256(b).hexdigest()
ADDR=re.compile(r'^(web/[A-Za-z0-9_.\-/]+)\.([a-f0-9]{16})\.([A-Za-z0-9]+)$')
INSPECT_ACTUAL="() => {\n  const a=HonroApp,s=a.scene,b=a.engine.b;\n  const v=HONRO_PROJECT.library.find(x=>x.id==='act5:near:42');\n  const l=HonroTerrainDomain.materialLandmarks(b).find(x=>x.id==='a5-near'&&x.kind==='canonical-element'&&x.asset?.id==='act5:near:42');\n  if(!l||!v?.edgeWall||b.honroStage!==42||!b.honroLandmarks.includes(l)||l.x||l.y||l.scale!==6500/2022||l.rotation||!HonroTerrainDomain.active(b))throw Error('actual Stage42 authored placement mismatch');\n  if(JSON.stringify(l.asset)!==JSON.stringify(v))throw Error('actual compiled asset differs from loaded registry');\n  const size=s.canvas.getBoundingClientRect();\n  return {compiled:JSON.stringify(l.asset),d:JSON.stringify(l.asset.edgeWall),paint:s._landmarkPaintBounds(l),focus:HonroBounds.focus(b),viewport:HonroBounds.viewport(s,size.width,size.height),world:b.honroTerrainBounds};\n}"
def compare_pixels(a,b):
    import numpy as np
    A,B=(np.asarray(Image.open(io.BytesIO(x)).convert('RGBA')).astype(np.int16) for x in (a,b))
    assert A.shape==B.shape,(A.shape,B.shape)
    d=np.abs(A-B);mask=d.max(axis=2)>0
    y,x=np.where(mask); samples=[{'x':int(xx),'y':int(yy),'before':A[yy,xx].tolist(),'after':B[yy,xx].tolist()} for yy,xx in zip(y[:512],x[:512])]
    return {'pixels':int(mask.sum()),'alphaPixels':int((d[:,:,3]>0).sum()),'maxRGBA':int(d.max()),'lastRow':int(mask[-1].sum()),'samplesFirst512':samples}, mask


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
    for(let i=0;i<12;i++)s.render(a.engine,0,'',.6,false,0);
    if(signature()!==before)throw Error('actual state mutated after repeated scene renders');
    const near=HONRO_PROJECT.library.find(v=>v.id==='act5:near:'+q.stage);if(!near)throw Error('missing active stage near owner');
    const visibility=JSON.stringify({stage:st.elements,bg:st.backdrop,env:st.environment,domain:b.honroTerrainBounds,
      actual:b.honroLandmarks.map(l=>{const r={...l};if(r.asset){const a={...r.asset};if(a.id==='act5:near:42')delete a.edgeWall;r.asset=a;}return r;})});
    const size=s.size(b), actualRoute={d:size.d,max:HonroBounds.zoomLimits(size.w).max,native:s._screenWorldCache?.key?.includes(':native-zoom:')||false};
    return {near:JSON.stringify(near),visibility,actualRoute,actual:pos,css:{w:r.width,h:r.height},backing:[s.canvas.width,s.canvas.height],focus,viewport:HonroBounds.viewport(s,r.width,r.height),state:before,raw:s.canvas.toDataURL('image/png').split(',')[1]};}""")
   if 'backing' in params:assert result['backing']==params['backing'],(q['stage'],'archive backing',result['backing'],params['backing'])
   if 'css' in params:assert result['css']==params['css'],(q['stage'],'archive CSS',result['css'],params['css'])
   pixels={'raw':base64.b64decode(result.pop('raw')),'dom':c.screenshot(animations='disabled',timeout=45000)}
   for k,v in pixels.items(): (out/(prefix+'-'+k+'.png')).write_bytes(v)
   again=page.evaluate("()=>{const a=HonroApp;a.scene.render(a.engine,0,'',.6,false,0);return a.scene.canvas.toDataURL('image/png').split(',')[1]}")
   sec={'raw':base64.b64decode(again),'dom':c.screenshot(animations='disabled',timeout=45000)}
   repeat={k:changed(sig_image(v),sig_image(sec[k])).histogram()[255] for k,v in pixels.items()}
   for k,v in sec.items():
    if repeat[k]:(out/(prefix+'-'+k+'-repeat.png')).write_bytes(v)
   # Save the two real frames before any optional diagnostic. Never fake an absent renderer tile.
   P=q['stage']; S=cfg['digest'][mode];prev=cfg['knownBefore']
   info={k:result[k] for k in ('actual','css','backing','focus','viewport','actualRoute')}
   info.update(htmlSHA256=htmlSHA,hashes={k:sha(v)for k,v in pixels.items()},stateSHA256=sha(result.pop('state').encode()),
               visibleOwnerSHA256=sha(result.pop('visibility').encode()),repeat=repeat)
   response_indices={}
   for r in immutable:
    path=urlparse(r.url).path[1:]
    if path in response_indices:continue
    if r.status!=200:bad.append(['http',path,r.status]);continue
    if ADDR.fullmatch(path):
     body=r.body();b=sha(body);local=bins[i]/path
     if not local.is_file() or b!=sha(local.read_bytes()) or not b.startswith(ADDR.fullmatch(path)[2]):bad.append(['HTTP-content-address',path,b])
     response_indices[path]={'sha256':b,'bytes':len(body)}
   allowed=('web/entries/game.','web/data/chapter-42-assets.')
   info['unchangedHTTP']={k:v for k,v in response_indices.items()if not k.startswith(allowed)}
   info['transport']=response_indices
   current=f'web/data/chapter-{P}-assets.'
   assert sum(k.startswith(current)for k in response_indices)==1,'Missing real chapter response'
   info['nearSHA256']=sha(result['near'].encode())
   if P==42:
    live=page.evaluate(INSPECT_ACTUAL)
    assert sha(live.pop('compiled').encode())==S['compiledNearSHA256']==info['nearSHA256']
    assert sha(live.pop('d').encode())==S['bindingSHA256']
    assert all(abs(live['viewport'][k]-v)<1e-8 for k,v in q['expectedViewport'].items())
    assert live['focus']==q['expectedFocus']
    assert live['world']=={'left':-1800,'top':-2400,'right':8300,'bottom':5061}
    K=6500/2022
    for k,z in {'left':-1250*K,'right':3260*K,'top':0,'bottom':2900*K}.items():assert abs(live['paint'][k]-z)<1e-8
    assert info['stateSHA256']==prev['stateSHA256']
    # Extract these digests with stock JS serialization, not Python escaping/reordering.
    held=page.evaluate("()=>{const n=HONRO_PROJECT.library.find(v=>v.id==='act5:near:42');return [JSON.stringify(n.edgeSurface),JSON.stringify(n.vector)];}")
    assert [sha(x.encode())for x in held]==[prev['surfaceSHA256'],prev['propsSHA256']]
    assert [v for k,v in response_indices.items()if k.startswith(current)]==[{'sha256':S['packetSHA256'],'bytes':S['packetB']}]
    if i==0:
     assert {k:response_indices[k] for k in prev['transport']}==prev['transport']
     if q.get('archive'):assert info['hashes']==q['archive'],'Old verified full-raw and DOM hashes did not reproduce'
    if 'max' in q:
     route=info['actualRoute'];assert route=={'d':1,'max':1.65,'native':True},route
     if 'crop'in q['max']:
      assert [list(z)for z in q['max']['expectCanvas']]==[[x-q['max']['crop'][0],y-q['max']['crop'][1]]for x,y in q['max']['priorPixels']]
      x,y=q['max']['panelOrigin'];u,v=q['max']['crop'];size=result['css'];p=result['actual']
      assert abs((x*K-p['x'])*1.65+size['w']/2+u)<1e-8
      assert abs((y*K-p['y'])*1.65+size['h']/2+v)<1e-8
    if 'tile'in q:
     tile=page.evaluate("q=>{const s=HonroApp.scene,t=s._domainTiles,q0=t?.tiles.get(q.key);\n       if(!q0||t.rs!==q.rs)throw Error('actual production tile missing/wrong bin');\n       return {origin:[q0.left,q0.top],size:[q0.canvas.width,q0.canvas.height],rs:t.rs,key:q.key,\n               raw:q0.canvas.toDataURL('image/png').split(',')[1]};}",q['tile'])
     assert tile['size']==[516,516] and tile['key']=='0:2' and abs(tile['origin'][0])<1e-8 and abs(tile['origin'][1]-1024/tile['rs'])<1e-8
     pixels['tile']=base64.b64decode(tile.pop('raw'))
     (out/(prefix+'-tile.png')).write_bytes(pixels['tile'])
     info['tile']={**tile,'sha256':sha(pixels['tile']),'priorPixel':q['tile']['priorPixel']}
    info['paint']=live['paint'];info['bindingSHA256']=S['bindingSHA256']
   else:
    assert f'act5:near:{P}' in result['near'] and result['actualRoute']['d']==1
   nativeSky=page.evaluate('()=>window.__restoreNativeQA()')
   assert nativeSky['calls']>0 and nativeSky['calls']==nativeSky['restores']
   info['nativeSky']=nativeSky
   assert not any(repeat.values()) and not bad,(q['key'],repeat,bad)
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
    a,b=m['stock'],m['target']
    for k in ('actual','css','backing','focus','viewport','actualRoute','stateSHA256','visibleOwnerSHA256','unchangedHTTP','nativeSky'):
     assert a[k]==b[k],('App A/B identity mismatch',k)
    if q['stage']!=42:assert a['nearSHA256']==b['nearSHA256']
    assert data['stock'].keys()==data['target'].keys()
    m['rgba']={}
    for k in data['stock']:
     d,mask=compare_pixels(data['stock'][k],data['target'][k])
     m['rgba'][k]=d
     if d['pixels']:Image.fromarray((mask*255).astype('uint8')).save(out/(q['key']+'-'+k+'-diff.png'))
    m['passes']=all(r['pixels']==0 for r in m['rgba'].values())
   except Exception as ex:m['pairException']=str(ex)
  frames.append(m)
  (out/'comparison.json').write_text(json.dumps(frames,indent=2)+'\n')
 browser.close()
 allPass=len(frames)==len(views)==12 and all(r.get('passes',False) and not r['sideErrors'] for r in frames)
 (out/'FINAL.json').write_text(json.dumps({'result':'12 integrity-valid actual full-frame pairs exact'if allPass else 'HOLD: one or more real frames/source controls not exact','testedPairCount':sum('rgba'in r for r in frames),'plannedPairCount':len(views),'timingClaim':False},indent=2)+'\n')
 assert allPass,'Scope requires zero RGBA in every actual pair (raw/DOM and two committed renderer tiles), no visual tolerance'
