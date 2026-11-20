import base64,functools,io,json,os,re,sys
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
from verify import sha,ADDR
root=Path(__file__).resolve().parent
expected=json.loads((root/'expected.json').read_text())
out=Path(os.environ['OUT'])
bins=[Path(os.environ['TARGET'])]
urls=['http://127.0.0.1:18842']
def scan_frame(s): return re.sub(r'http://127\.0\.0\.1:\d+','localhost',str(s))[:1400]
def sig_image(x):
 a=Image.open(io.BytesIO(x)); a.load();return a.convert('RGBA')
def changed(a,b):
 ds=ImageChops.difference(a,b).split()
 return functools.reduce(ImageChops.lighter,ds).point(lambda x:255 if x else 0,mode='1')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 def get(i,q):
  prefix='target'+f"-s{q['stage']:02}-{q['key']}"
  params=q['pose']; expected=params['actual']; w,h=params['width'],params['height']
  ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1)
  page=ctx.new_page(); bad=[]; immutable=[]
  page.on('pageerror',lambda e:bad.append(['page',scan_frame(e)]))
  page.on('requestfailed',lambda r: bad.append(['request',urlparse(r.url).path,r.resource_type,r.failure]) if not(r.resource_type=='media' and 'ERR_ABORTED' in (r.failure or '')) else None)
  page.on('response',lambda r:immutable.append(r) if ADDR.fullmatch(urlparse(r.url).path[1:]) or r.status>=400 else None)
  page.add_init_script("""window.__qaImages=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});""")
  try:
   response=page.goto(urls[i]+'/HONRO.html',wait_until='domcontentloaded',timeout=18000)
   assert response and response.ok and sha(response.body())==sha((bins[i]/'HONRO.html').read_bytes()),('wrong actual HTML body',q['stage'])
   ready_state="""()=>({ready:document.documentElement.dataset.honroReady||null,loader:typeof window.HonroCampaignLoader?.ensureStage,
    sky:typeof window.HonroTimeOfDay?.sky,app:typeof window.HonroApp,promise:typeof window.HONRO_APP_READY?.then})"""
   try:
    page.wait_for_function("""() => document.documentElement.dataset.honroReady==='true'
     && typeof window.HonroCampaignLoader?.ensureStage==='function'
     && typeof window.HonroTimeOfDay?.sky==='function'""",timeout=18000)
   except Exception:
    (out/(prefix+'-boot.json')).write_text(json.dumps({'readiness':page.evaluate(ready_state),'bad':bad},indent=2))
    raise RuntimeError('Startup Boolean readiness gate failed before stage/game render')
   boot=page.evaluate(ready_state)
   (out/(prefix+'-boot.json')).write_text(json.dumps({'readiness':boot,'bad':bad},indent=2))
   page.evaluate("""async sid=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
     await Promise.race([HonroCampaignLoader.ensureStage(sid),new Promise((_,reject)=>setTimeout(()=>reject(Error('Official ensureStage exceeded 18s')),18000))]);
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
        HonroTimeOfDay.sky=original;return {calls:call,restores:restore,fixedMillis:41000,originalRestored:HonroTimeOfDay.sky===original&&performance.now===originalNow};};
      window.__witness=q;
      s.render(a.engine,0,'',.6,false,0);}""",q)
   page.wait_for_function("window.__qaImages.every(i=>!i.src||i.complete)",timeout=18000)
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
   assert result['nativeSky']['calls']==result['nativeSky']['restores'] and result['nativeSky']['calls']>0 and result['nativeSky']['originalRestored'],result['nativeSky']
   result['boot']=boot
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

 q=expected['q']
 r,pix=get(0,q)
 browser.close()
 out_result={'stage':46,'officialAReference':expected['originalReference'],'exactPriorPoseAndState':{},'strictPixels':{},'response':r,'outsideSupportNegativeReceipt':[]}
 for k,v in expected['priorPose'].items():out_result['exactPriorPoseAndState'][k]=r[k]==v
 for mode,b in pix.items():
  im=sig_image(b); exp=expected['priorFrames'][mode]
  equal=sha(im.tobytes())==exp['sha256'] and list(im.size)==exp['size']
  out_result['strictPixels'][mode]={'equal':equal,'imageSize':im.size,'rgbaSha256':sha(im.tobytes()),'pngSha256':sha(b),'sameEncodedPNG':sha(b)==exp['pngSha256']}
  x,y=exp['negativeXY'];color=list(im.getpixel((x,y)))
  out_result['outsideSupportNegativeReceipt'].append({'mode':mode,'xy':[x,y],'rgba':color,'equal':color==exp['negativeRGBA']})
 seen=r['assets']
 browsed={k:seen.get(k) for k in expected['priorStage46']}
 leaf_equal=all(browsed[k]=={n:v for n,v in c.items() if n!='path'} for k,c in expected['priorStage46'].items())
 links_equal=all(seen.get(k)==v for k,v in expected['expectedTargetLink'].items())
 out_result['actualStage46HTTPExact']=leaf_equal
 out_result['actualCoreHTTPExact']=links_equal
 out_result['pass']=all(out_result['exactPriorPoseAndState'].values()) and all(x['equal'] for x in out_result['strictPixels'].values()) and all(x['equal'] for x in out_result['outsideSupportNegativeReceipt']) and leaf_equal and links_equal
 (out/'continued-stage46-actual.json').write_text(json.dumps(out_result,indent=2)+'\n')
 print(json.dumps({k:v for k,v in out_result.items() if k!='response'},indent=2),flush=True)
 assert out_result['pass'],'Same-pose independent strict archived Stage46 continuity NOT established'
