"""Stage44 same-stroke diagnostic only: no-op A/A0 after each real phase at z=1.05/1.06."""
import base64,hashlib,io,json,math,sys,time
from pathlib import Path
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
from coverage import counter
H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes());E=json.loads((H/'entry.json').read_bytes())
OUT=Path(sys.argv[1])/'out'; G=json.loads((OUT/'GRAPH.json').read_bytes())
proof={'status':'HOLD_IN_PROGRESS','scope':'Actual normal compiled A/A0 same-stroke diagnostic only. Synthetic campaign entry; no source injection or gameplay.','frames':{},'http':{}}
def sha(b):return hashlib.sha256(b).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':sha(b)}
def dump(): (OUT/'BROWSER.json').write_text(json.dumps(proof,indent=2)+'\n')
def decode(b):return Image.open(io.BytesIO(b)).convert('RGBA')
CANVAS="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"
CHECK="""()=>{const a=HonroApp,b=a.engine.b,s=a.scene;
 if(!b.honroCanonical||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||!HonroTerrainDomain.active(b))throw Error('not actual canonical scenario');
 const stage=HONRO_PROJECT.stages.find(x=>x.id===b.honroAuthoredId);
 if(!stage||stage.metadata.stageId!==b.honroStage)throw Error('Wrong map authority');
 const p=HonroTerrainReadability.prepare(b);
 const groups=p.groups.map(g=>({id:g.id,segments:g.segments}));
 const found=groups.filter(g=>g.id==='a5-root-floor');
 const pick=x=>x?.id==='a5-root-floor'&&x.a.x===6700.39&&x.z.x===6700.39&&x.a.y===1733.2&&x.z.y===2269&&x.walkable===false;
 const target=found.flatMap(g=>g.segments).filter(x=>pick({...x,id:'a5-root-floor'}));
 const qa=window.HonroEdgeClosureQA;
 if(!qa||!Array.isArray(qa.removed)||qa.walkableRemoved!==0||!Number.isInteger(qa.keptWalkableCount))throw Error('Exact stock closure observer unavailable');
 const root=b.terrain.filter(t=>t.id==='a5-root-floor').map(t=>({painted:t.honroAct5Painted,broken:t.broken,oneWay:t.oneWay,poly:HONRO_CORE.poly(t)}));
 const artIds=new Set(stage.elements.map(c=>c.assetId));
 const art=HONRO_PROJECT.library.filter(e=>artIds.has(e.id));
 const native=art.find(x=>x.id==='act5:near:44');
 if(b.honroStage===44&&(!native?.rootExterior||!native?.upperCanopy||!native?.rootUpperClip))throw Error('canonical roots/canopy ownership missing');
 return{authored:b.honroAuthoredId,stage:b.honroStage,allSegments:groups,map:JSON.stringify(stage),
    registeredArt:JSON.stringify(art),domain:JSON.stringify(HonroTerrainDomain.render(b)),root,
    raster:s._worldRasterScale(b,s.canvas.clientWidth),closurePhysical:target.length,
    closure:qa.removed.filter(pick).length,alreadyRemoved:qa.removed.filter(x=>!pick(x)),
    keptWalk:qa.keptWalkableCount, rootWalk:found.flatMap(g=>g.segments).filter(g=>g.walkable).length};
}"""
PREFETCH={
 'web/data/chapter-02.5faa275befa85b0d.json':{'bytes':55013,'sha256':'5faa275befa85b0d49205b25a9d902c9d7ce448cf52fe25e124d4005b10f2ad2'},
 'web/data/chapter-02-assets.ddddf53df4d749c6.json':{'bytes':256633,'sha256':'ddddf53df4d749c60375cba085a79d790319b1e9c1790cb29e840529409ab434'},
}
PHASE=2000
# Keep the reviewed normal camera/state fixture, but do not pre-render target pose.
park=E['PARK']
pre="if(!q.readback)s.render(e,0,'',.6,false,0);"
assert park.count(pre)==1
park=park.replace(pre,'',1)
pin="const initial=signature();"
assert park.count(pin)==1
park=park.replace(pin,pin+"const cache0=s.renderCacheStats(),world0=!!s._screenWorldCache?.canvas;",1)
last="sceneTime:s.time,signature:initial"
assert park.count(last)==1
park=park.replace(last,last+",cache0,cache1:s.renderCacheStats(),world0,world1:!!s._screenWorldCache?.canvas,dpr:devicePixelRatio",1)
FROZEN="q=>{const run=("+park+");"+r'''
 const s=HonroApp.scene,clock=Object.getOwnPropertyDescriptor(performance,'now'),
  state=new Map(['_honroClouds','_honroTime'].map(k=>[k,Object.getOwnPropertyDescriptor(s,k)]));
 for(const k of state.keys())delete s[k];
 Object.defineProperty(performance,'now',{configurable:true,value:()=>q.fixedNow});
 try{
  const meta=run(q), cloud=s._honroClouds?{...s._honroClouds}:null, time=s._honroTime?{...s._honroTime}:null;
  return{meta,cloud,time};
 }finally{
  if(clock)Object.defineProperty(performance,'now',clock);else delete performance.now;
  for(const [k,v] of state)if(v)Object.defineProperty(s,k,v);else delete s[k];
 }
}'''
INIT_SEED=r'''(()=>{
 const reset=()=>{let n=3910;Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);};
 Object.defineProperty(window,'__honroResetDiagnosticSeed',{value:reset,enumerable:false});
 reset();Date.now=()=>1794931200000;
})()'''
def capture(browser,mode,f,replica='',trace=False):
 css=f['cssViewport'];stage=44
 assert not trace or mode=='B'
 label=f['key']+'-'+('A0' if mode=='B' else 'A')+replica
 if trace:label+='-trace'
 base=f'http://127.0.0.1:{18841 if mode=="A" else 18842}/'
 evidence=G[mode]; w,h=css
 ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=f['dpr'],service_workers='block')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 page=ctx.new_page();page.set_default_timeout(25000)
 pending=set(); hits=[]; blobs=[];errors=[];seen={};media=set()
 def rel(u):return u[len(base):] if u.startswith(base) and '?' not in u and '#' not in u else None
 def route(r):
  q=r.request;k=rel(q.url)
  if q.url.startswith(('blob:'+base,'data:')) or q.method=='GET' and (k in evidence or k in P['media'] and q.resource_type=='media'):
   return r.continue_()
  errors.append(['request',q.url]);return r.abort()
 def response(r):
  q=r.request;k=rel(q.url)
  if r.url.startswith('blob:'+base) and r.status==200:blobs.append(r.url)
  elif k in P['media'] and q.resource_type=='media' and r.status in (200,206):media.add(k)
  elif k in evidence and r.status==200 and q.method=='GET':hits.append((k,r))
  else:errors.append(['response',r.status,r.url])
 def fail(q):
  if not (rel(q.url) in P['media'] and q.resource_type=='media' and q.failure=='net::ERR_ABORTED'):
   errors.append(['failure',q.url,q.failure])
 ctx.route('**/*',route)
 page.on('request',lambda q:pending.add(q) if rel(q.url) in evidence else None)
 page.on('requestfinished',lambda q:pending.discard(q))
 page.on('requestfailed',lambda q:pending.discard(q))
 page.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
 page.on('requestfailed',fail);page.on('response',response)
 page.add_init_script('('+E['INIT']+')();'+INIT_SEED)
 try:
  shell=page.goto(base+'HONRO.html',wait_until='domcontentloaded')
  assert shell and shell.url==base+'HONRO.html' and shell.status==200 and facts(shell.body())==evidence['HONRO.html']
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'")
  assert all(evidence[k]==v for k,v in PREFETCH.items()),'exact Stage2 preload graph changed'
  page.evaluate("()=>{if(HonroApp.screen!=='title'||HonroCampaignLoader.has(2))throw Error('not title or unintended Stage2 activation');HonroCampaignLoader.prewarmNext(1);}")
  deadline=time.monotonic()+10; warmed={}
  while time.monotonic()<deadline:
   assert not errors,errors
   for k,res in hits:
    if k in PREFETCH and res.request not in pending and k not in warmed:
     warmed[k]=facts(res.body());assert warmed[k]==PREFETCH[k]
   if warmed.keys()==PREFETCH.keys():break
   page.wait_for_timeout(40)
  proof.setdefault('prewarm',{})[label]=warmed
  dump();assert warmed==PREFETCH,('normal title preload did not deterministically finish',warmed)
  assert page.evaluate("()=>HonroApp.screen==='title'&&!HonroCampaignLoader.has(2)")
  page.evaluate("()=>{window.__honroResetDiagnosticSeed();if(HonroApp.audio?.configure)HonroApp.audio.configure({...HonroApp.profile.settings,music:false,sound:false});}")
  page.evaluate(E['LAUNCH'],stage); canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
  page.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}",timeout=12000)
  dd=page.evaluate(E['DECODE']);assert dd['registered']>0 and not dd['failed']
  assert page.evaluate("()=>document.fonts.status==='loaded'&&HonroApp.profile.settings.music===false&&HonroApp.profile.settings.sound===false")
  session=None;module=G['slots'][P['readabilityPath']]['new']
  if trace:
   session=ctx.new_cdp_session(page)
   session.send('Debugger.enable');session.send('Profiler.enable')
   session.send('Profiler.startPreciseCoverage',{'callCount':True,'detailed':True})
  q={'id':stage,'mapId':'stage-44','name':f['view'],'dx':1,'dy':1,'ordinary':f['ordinary'],'fixedNow':PHASE}
  metadata=[]; branch={}
  picture_keys=('actual','viewport','focus','css','backing','actorCount','phase','round','tide','sceneTime','dpr')
  for phase in ('first','settle','warm'):
   proof['active']={'key':f['key'],'arm':label,'phase':phase};dump()
   if trace:session.send('Profiler.takePreciseCoverage')
   obs=page.evaluate(FROZEN,{**q,'readback':phase!='first'})
   if trace:
    r=session.send('Profiler.takePreciseCoverage')['result']
    branch[phase]=counter(session,r,base+module,evidence[module]['sha256'])
   m=obs['meta'];info=page.evaluate(CHECK)
   assert info['stage']==44 and info['authored']=='stage-44' and info['raster']>0 and info['closurePhysical']==1
   assert info['closure']==int(mode=='B'),('Wrong scope metadata; A0 branch marker is not a removed stroke',label,phase)
   assert info['keptWalk']==23 and info['rootWalk']==8 and len(info['root'])==1
   assert info['root'][0]['painted'] is True and info['root'][0]['oneWay'] is False and not info['root'][0]['broken']
   assert abs(m['actual']['scale']-f['zoom'])<=1e-10 and m['dpr']==f['dpr'],('app clamped away from requested route',label,phase,m['actual'])
   if f.get('archive'):
    assert all(m[k]==f['archive'][k]for k in picture_keys if k!='dpr'),('archive pose drifted',label,m['actual'])
   assert (m['actual']['scale']<=1.05)==(f['expected']=='tile')
   z=m['actual']['scale'];v=m['viewport'];css=m['css']
   x=(6700.39-v['left'])*z;y0=(1733.2-v['top'])*z;y1=(2269-v['top'])*z
   assert 0<=x<css['w'] and y0<css['h'] and y1>0,('exact stroke not actually visible',label,phase)
   if obs['cloud'] is not None:assert obs['cloud']['at']==PHASE
   if obs['time'] is not None:assert obs['time']['at']==PHASE
   rb=base64.b64decode(page.evaluate(CANVAS),validate=True); db=canvas.screenshot(animations='disabled')
   for kind,vv in [('raw',rb),('dom',db)]:
    (OUT/f'{label}-{phase}-{kind}.png').write_bytes(vv)
   bounds=m['backing'];dpr=min(1.7,m['dpr']);rs=info['raster'];scale=dpr*z
   # For exact-equality proof, whole backing and DOM are always checked. This
   # projected/axis-aligned bounds is diagnostic only, not a looser permit mask.
   half=(.75 if f['expected']=='direct' else math.ceil(.75*z/rs)+2)
   sig={'phaseLabel':phase,'raw':facts(rb),'dom':facts(db),
    'anchorCSS':[x,y0,y1],'ctmDirectDerived':[scale,0,0,scale,-v['left']*scale,-v['top']*scale] if f['expected']=='direct' else None,
    'projectedConservativeBackingBox':[max(0,math.floor((x-half)*dpr)),max(0,math.floor((y0-half)*dpr)),
       min(bounds[0],math.ceil((x+half)*dpr)),min(bounds[1],math.ceil((y1+half)*dpr))],
    'camera':{k:m[k]for k in picture_keys},'raster':rs,
    'geometrySHA':sha(json.dumps(info['allSegments'],separators=(',',':')).encode()),
    'mapSHA':sha(info['map'].encode()),'artSHA':sha(info['registeredArt'].encode()),'physicalSHA':sha(m['signature'].encode()),
    'rootSHA':sha(json.dumps(info['root'],sort_keys=True).encode()),'domainSHA':sha(info['domain'].encode()),
    'walk':[info['rootWalk'],info['keptWalk']],'sameOtherRemoved':info['alreadyRemoved'],'cloud':obs['cloud'],'time':obs['time'],
    'worldSlot':[m['world0'],m['world1']],
    'cacheDeltas':{k:m['cache1'].get(k,0)-m['cache0'].get(k,0) for k in ('screenHits','screenBuilds','worldHits','worldBuilds')}}
   metadata.append(sig)
   proof['frames'][label]={'rows':metadata,'branch':branch};dump()
  # Cache warm is an actual viewport cache hit, not merely another screenshot.
  assert metadata[2]['worldSlot']==[True,True] and metadata[2]['cacheDeltas']['worldHits']>0,('no actual settled world cache hit',label)
  if trace:
   a=branch['first'];assert a and a[f['expected']]['count']>0,('target A0 branch never executed first time',label,a)
   alternate='direct' if f['expected']=='tile' else 'tile'
   assert not a[alternate]['count'],('ambiguous A0 first path',label,a)
   assert branch['warm'] is None or branch['warm']['functionCalls']==0,('warm hit re-entered target branch',label,branch['warm'])
   session.send('Profiler.stopPreciseCoverage')
  i=quiet=0; deadline=time.monotonic()+12
  while time.monotonic()<deadline:
   assert not errors,errors
   while i<len(hits) and hits[i][1].request not in pending:
    k,r=hits[i]; seen[k]=facts(r.body()); assert seen[k]==evidence[k],('actual loaded response differs',k)
    i+=1
   created=set(page.evaluate("()=>[...window.__honroObserver.blobs]"))
   before=(i,len(blobs));page.wait_for_timeout(100)
   idle=before==(len(hits),len(blobs)) and not pending and set(blobs)<=created
   quiet=quiet+1 if idle else 0
   if quiet==3:break
  proof['http'][label]={'verified':seen,'media':sorted(media),'errors':errors};dump()
  assert quiet==3 and not errors,('HTTP/image drain',errors)
  assert all(seen.get(k)==v for k,v in PREFETCH.items())
  if stage==44:assert set(G['mustObserve'+mode])<=seen.keys()
  return set(seen)
 finally:ctx.close()
def compare(probe,left,right):
 a,b=[proof['frames'][l]['rows'] for l in (left,right)]
 for x,y in zip(a,b,strict=True):
  phase=x['phaseLabel']
  assert all(x[k]==y[k]for k in x if k not in ('raw','dom')),('nonpixel state/cache parity',probe,phase,left,right)
  for kind in ('raw','dom'):
   p,q=[decode((OUT/f'{l}-{phase}-{kind}.png').read_bytes()) for l in (left,right)]
   assert p.size==q.size
   difference=ImageChops.difference(p,q); rgbaBox=pastebbox(difference)
   if rgbaBox:
    backing=x['projectedConservativeBackingBox']
    # Both screenshot modes use same device pixel dimensions, otherwise only
    # record the raw contract. The complete RGBA exact gate never relaxes.
    detail={'kind':kind,'changed':rgbaBox,'declaredBackingBox':backing}
    if kind=='raw':
     inside=difference.crop(backing)
     detail['insideBox']=pastebbox(inside)
     copy=difference.copy();copy.paste((0,0,0,0),tuple(backing));detail['outsideBox']=pastebbox(copy)
    proof.setdefault('mismatch',[]).append({'probe':probe,'phase':phase,'arms':[left,right],**detail});dump()
  assert not proof.get('mismatch'),('strict A/A or A/A0 whole-view RGBA difference',probe,phase,left,right)
def pastebbox(im):
 return im.getbbox(alpha_only=False)

def main():
 assert P['enable'] is True and G['activeAssetsAnd50MapsExact'] and G['orderedModulesExactOutsideAct5'] and G['noOpOnly']
 old=P['frames'][0]
 probes=[
  {'key':'pc-106-direct-boundary','cssViewport':[1440,900],'dpr':1.7,'ordinary':[6630,1800,1.06],'zoom':1.06,'view':'ordinary','expected':'direct'},
  {'key':'pc-105-cache-boundary','cssViewport':[1440,900],'dpr':1.7,'ordinary':[6630,1800,1.05],'zoom':1.05,'view':'ordinary','expected':'tile'},
  {'key':'mobile-106-direct-boundary','cssViewport':[390,844],'dpr':1,'ordinary':[6630,1800,1.06],'zoom':1.06,'view':'ordinary','expected':'direct'},
  {'key':'pc-southeast-archived-cache','cssViewport':old['viewportCSS'],'dpr':1,'ordinary':old['ordinary'],'zoom':old['actual']['scale'],'view':'southeast','expected':'tile','archive':old},
 ]
 normal={b:a for a,b in G['allRenamedPaths']}
 try:
  with sync_playwright() as w:
   b=w.chromium.launch();assert b.version==P['browser']
   for f in probes:
    key=f['key']; hit={}
    for mode,rep,trace in [('A','',False),('A','2',False),('B','',False),('B','2',False),('B','',True)]:
     hit[mode+rep+str(trace)]=capture(b,mode,f,rep,trace)
    a=hit['AFalse'];assert all(a=={normal.get(k,k)for k in hits}for hits in hit.values()),('normal HTTP parity differs',key)
    for l,r in [('A','A2'),('A0','A02'),('A','A0'),('A0','A0-trace')]:
     compare(key,key+'-'+l,key+'-'+r)
   b.close()
  proof['status']='PASS_EXACT_WHOLE_RGBA_STAGE44_NOOP_ONLY';proof.pop('active',None)
 except Exception as err:proof.update(status='HOLD',error=repr(err));raise
 finally:dump()
if __name__=='__main__':main()
