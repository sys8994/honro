import base64,functools,io,json,os,re,sys,zlib
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
from verify import sha,ADDR
root=Path(__file__).resolve().parent
views=json.loads((root/'views.json').read_text())
assert [q['stage'] for q in views]==[1,2,3,7,12,14,15,28,33,36,38,41,46]
def mask(q,k):
 b=zlib.decompress(base64.b64decode(q[k]));h='maskSHA256' if k=='mask' else 'requiredSHA256'
 assert sha(b)==q[h] and len(b)==((q['size'][0]+7)//8)*q['size'][1]
 im=Image.frombytes('1',tuple(q['size']),b)
 assert im.histogram()[255]==q[k+'Pixels']
 return im
def sig_image(x):
 a=Image.open(io.BytesIO(x)); a.load();return a.convert('RGBA')
def changed(a,b):
 ds=ImageChops.difference(a,b).split()
 t=functools.reduce(ImageChops.lighter,ds)
 return t.point(lambda x:255 if x else 0,mode='1')
def pixel(a,b,q):
 m=changed(a,b)
 outside=ImageChops.logical_and(m,ImageChops.invert(mask(q,'mask')))
 missing=ImageChops.logical_and(mask(q,'required'),ImageChops.invert(m))
 return dict(changed=m.histogram()[255],outside=outside.histogram()[255],missing=missing.histogram()[255],
  bbox=m.getbbox(),outsideBbox=outside.getbbox(),missingBbox=missing.getbbox())
def dry():
 for q in views:
  a,b=(Path(p).read_bytes() for p in q['archivePaths'])
  assert list(map(sha,(a,b)))==q['archiveSHA256']
  d=pixel(sig_image(a),sig_image(b),q)
  if q['stage']!=3:assert not (d['outside'] or d['missing']),(q['stage'],d)
  else:assert d['outside']==486 and not d['missing'],d  # known Stage3 <2/255 archival drift outside physical witness
  p=q['pose'];assert p['backing'][0]==q['size'][0] and 0<=q['size'][1]-p['backing'][1]<=1 and p['actual']['scale']>0 and all(abs(p['actual'][k])<1e5 for k in ('x','y'))
  if 'css' in p:
   assert abs(p['css']['w']-p['backing'][0])<=.5 and abs(p['css']['h']-p['backing'][1])<=.5,p
  print(q['stage'],q['key'],q['requiredPixels'],d,flush=True)
if sys.argv[1:]==['--dry']:dry();raise SystemExit
out=Path(os.environ['OUT']); out.mkdir(parents=True,exist_ok=True)
bins=[Path(os.environ[s]) for s in ('STOCK','TARGET')]
urls=['http://127.0.0.1:18841','http://127.0.0.1:18842']
roll=[]
def save(): (out/'cumulative.json').write_text(json.dumps(roll,indent=2)+'\n')
def scan_frame(s):
 return re.sub(r'http://127\.0\.0\.1:\d+','localhost',str(s))[:1400]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 def get(i,q):
  mode=['stock','target'][i]; prefix=mode+f"-s{q['stage']:02}-{q['key']}"
  params=q['pose']; expected=params['actual']; w,h=params['width'],params['height']
  ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1)
  page=ctx.new_page(); bad=[]; immutable=[]
  page.on('pageerror',lambda e:bad.append(['page',scan_frame(e)]))
  page.on('requestfailed',lambda r: bad.append(['request',urlparse(r.url).path,r.resource_type,r.failure]) if not(r.resource_type=='media' and 'ERR_ABORTED' in (r.failure or '')) else None)
  page.on('response',lambda r:immutable.append(r) if ADDR.fullmatch(urlparse(r.url).path[1:]) or r.status>=400 else None)
  page.add_init_script("""window.__qaImages=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});""")
  try:
   page.goto(urls[i]+'/HONRO.html',wait_until='domcontentloaded',timeout=90000)
   page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader && window.HonroTimeOfDay?.sky",timeout=90000)
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
    return {actual:pos,css:{w:r.width,h:r.height},backing:[s.canvas.width,s.canvas.height],focus,viewport:HonroBounds.viewport(s,r.width,r.height),tide:b.honroAct4PreviewState?.tide||null,state:before,raw:s.canvas.toDataURL('image/png').split(',')[1]};}""")
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
   result['stateSHA256']=sha(result.pop('state').encode())
   result['assets']=response_indices
   result['repeat']=repeat;result['bad']=bad
   return result,pixels
  finally:ctx.close()
 for q in views:
  r={'stage':q['stage'],'view':q['key'],'archivedMaskSHA256':q['maskSHA256'],'expectedPixels':q['maskPixels']}
  try:
   pairs=[]; errors=[]
   for i,key in enumerate(('stock','target')):
    try:
     pair=get(i,q); pairs.append(pair);r[key]=pair[0]
    except Exception as e:errors.append([key,scan_frame(e)])
   if errors: raise RuntimeError(errors)
   (aa,a),(bb,b)=pairs
   raw_a,raw_b=map(sig_image,(a['raw'],b['raw']))
   dom_a,dom_b=map(sig_image,(a['dom'],b['dom']))
   assert list(dom_a.size)==q['size'] and dom_a.size==dom_b.size,(q['stage'],'DOM raster grid',dom_a.size,dom_b.size,q['size'])
   r['stateCameraEqual']=all(aa[k]==bb[k] for k in ('actual','css','backing','focus','viewport','tide','stateSHA256'))
   r['raster']={'dom':pixel(dom_a,dom_b,q)}
   if list(raw_a.size)==q['size']:r['raster']['raw']=pixel(raw_a,raw_b,q)
   elif q['mode']=='control':
    diff=changed(raw_a,raw_b)
    r['raster']['raw']={'outside':diff.histogram()[255],'missing':0,'changed':diff.histogram()[255],'bbox':diff.getbbox()}
   else:
    diff=changed(raw_a,raw_b)
    r['rawDifferentGridDiagnostic']={'changed':diff.histogram()[255],'bbox':diff.getbbox(),'size':raw_a.size,
      'scope':'Archive DOM differs from backing by one pixel row, so DOM mask is not extrapolated to backing. Backing repeat purity still required.'}
   r['pass']=r['stateCameraEqual'] and not (aa['bad'] or bb['bad']) and not any([*aa['repeat'].values(),*bb['repeat'].values()]) and not any(d['outside'] or d['missing'] or (q['mode']!='control' and not d['changed']) for d in r['raster'].values())
  except Exception as e:r.update(error=scan_frame(e),**{'pass':False})
  roll.append(r);save();print(q['stage'],r['pass'],r.get('error'),flush=True)
 browser.close()
assert len(roll)==len(views) and all(r['pass'] for r in roll),[(r['stage'],r['view'],r.get('error')) for r in roll if not r['pass']]
