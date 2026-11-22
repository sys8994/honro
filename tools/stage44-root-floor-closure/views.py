"""Stage44 normal compiled App pairs; save integrity-valid originals before the strict ROI gate."""
import base64,hashlib,io,json,math,sys,time
from pathlib import Path
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes());E=json.loads((H/'entry.json').read_bytes())
OUT=Path(sys.argv[1])/'out'; G=json.loads((OUT/'GRAPH.json').read_bytes())
proof={'status':'HOLD_IN_PROGRESS','scope':'Actual paired normal compiled apps, synthetic in-memory campaign only. No request body substitution or playthrough.','frames':{},'http':{}}
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
FROZEN="q=>{const run=("+E['PARK']+");"+r'''
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
def capture(browser,mode,css,stage,shots,replica=''):
 base=f'http://127.0.0.1:{18841 if mode=="A" else 18842}/'
 evidence=G[mode]; w,h=css
 ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
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
  proof.setdefault('prewarm',{})[f'{stage}-{w}x{h}-{mode}{replica}']=warmed
  dump();assert warmed==PREFETCH,('normal title preload did not deterministically finish',warmed)
  assert page.evaluate("()=>HonroApp.screen==='title'&&!HonroCampaignLoader.has(2)")
  page.evaluate("()=>{window.__honroResetDiagnosticSeed();if(HonroApp.audio?.configure)HonroApp.audio.configure({...HonroApp.profile.settings,music:false,sound:false});}")
  page.evaluate(E['LAUNCH'],stage); canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
  page.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}",timeout=12000)
  page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
  for f in shots:
   k=f['key'];view=f['view']
   q={'id':stage,'mapId':f'stage-{stage}','name':view,'dx':-1 if 'west' in view else 1 if 'east' in view else 0,
     'dy':1 if 'south' in view else 0,'ordinary':f['ordinary'],'readback':False,'fixedNow':PHASE}
   proof['active']={'key':k,'arm':mode,'phase':'before camera/readiness'};dump()
   observed=page.evaluate(FROZEN,q);meta=observed['meta']
   dd=page.evaluate(E['DECODE']);assert dd['registered']>0 and not dd['failed']
   replay=page.evaluate(FROZEN,{**q,'readback':True})
   assert observed==replay,('frozen visual/native state failed repeat',k,mode,observed,replay)
   if observed['cloud'] is not None:assert observed['cloud']['at']==PHASE
   if observed['time'] is not None:assert observed['time']['at']==PHASE
   assert page.evaluate("()=>document.fonts.status==='loaded'&&HonroApp.profile.settings.music===false&&HonroApp.profile.settings.sound===false")
   assert all(meta[n]==f[n]for n in ('actual','viewport','focus','css','backing','sceneTime','phase','round','tide','actorCount')),('reference camera or state changed',k,mode,meta)
   assert sha(meta['signature'].encode())==f['oldFixedPhysicsHash'],('fixed previous actual physics drift',k,mode)
   info=page.evaluate(CHECK);assert info['stage']==stage and info['authored']==f'stage-{stage}' and info['raster']==f['oldRaster']
   if stage==44:
    assert info['closurePhysical']==1 and info['closure']==(0 if mode=='A' else 1),('wrong exact actual draw closure',k,mode,info['closurePhysical'],info['closure'])
    assert len(info['root'])==1 and info['root'][0]['painted'] is True and info['root'][0]['oneWay'] is False and not info['root'][0]['broken']
    assert info['rootWalk']==8 and info['keptWalk']==23,('expected untouched original walk paths',k,info['rootWalk'],info['keptWalk'])
   else:assert info['closure']==0
   rb=base64.b64decode(page.evaluate(CANVAS),validate=True); db=canvas.screenshot(animations='disabled')
   for kind,v in [('raw',rb),('dom',db)]: (OUT/f'{k}-{mode}{replica}-{kind}.png').write_bytes(v)
   (OUT/f'{k}-{mode}{replica}-geometry.json').write_text(json.dumps(info['allSegments'],separators=(',',':'))+'\n')
   second=page.evaluate(FROZEN,{**q,'readback':True})
   assert observed==second
   rb2=base64.b64decode(page.evaluate(CANVAS),validate=True); db2=canvas.screenshot(animations='disabled')
   equality={}
   for kind,p0,p1 in [('raw',rb,rb2),('dom',db,db2)]:
    a,b=decode(p0),decode(p1)
    equality[kind]=a.size==b.size and a.tobytes()==b.tobytes()
    if not equality[kind]:(OUT/f'{k}-{mode}{replica}-{kind}-failed-A-A.png').write_bytes(p1)
   proof['frames'].setdefault(k,{})[mode+replica]={'raw':facts(rb),'dom':facts(db),'mapSHA256':sha(info['map'].encode()),
     'identicalImmediateReplay':equality,'fixedCloud':observed['cloud'],'fixedGrade':observed['time'],
     'registeredArtSHA256':sha(info['registeredArt'].encode()),'domainSHA256':sha(info['domain'].encode()),'rootSHA256':sha(json.dumps(info['root'],sort_keys=True).encode()),
     'allOtherOmitted':info['alreadyRemoved'],'rootWalk':info['rootWalk'],'keptWalk':info['keptWalk'],'physicalClosureCount':info['closurePhysical'],
     'physicsSHA256':sha(meta['signature'].encode()),
     'archiveCameraReferenceOriginalPNG':f['pngSHA256'],'raster':info['raster'],'observedClosure':info['closure'],
     'camera':{n:meta[n]for n in ('actual','viewport','css','backing')}};dump()
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
  proof['http'][f'{stage}-{w}x{h}-{mode}{replica}']={'verified':seen,'media':sorted(media),'errors':errors};dump()
  assert quiet==3 and not errors,('HTTP/image drain',errors)
  assert all(seen.get(k)==v for k,v in PREFETCH.items())
  if stage==44:assert set(G['mustObserve'+mode])<=seen.keys()
  return set(seen)
 finally:ctx.close()
def compare(f):
 key=f['key'];a,b=(proof['frames'][key][m]for m in ('A','B'))
 parity=('mapSHA256','registeredArtSHA256','domainSHA256','physicsSHA256','raster','camera','fixedCloud','fixedGrade','rootSHA256','allOtherOmitted','rootWalk','keptWalk','physicalClosureCount')
 assert all(a[n]==b[n]for n in parity),('actual geometry/map/art/actors/physics/camera changed',key)
 g0,g1=[json.loads((OUT/f'{key}-{m}-geometry.json').read_bytes())for m in ('A','B')]
 assert g0==g1,('actual prepared geometry mutated; omission must be draw-only',key)
 if f['id']==44:assert (a['observedClosure'],b['observedClosure'])==(0,1)
 v=f['viewport']; z=f['actual']['scale'];r=a['raster']; pad=math.ceil(2.5*z/r+1)
 lineX=(6700.39-v['left'])*z; topY=(1733.2-v['top'])*z; botY=(2269-v['top'])*z
 vis=f['expectInk']
 if vis:assert 0<=lineX<f['backing'][0] and topY>=0 and botY<f['backing'][1]
 else:
  if f['id']==44:assert not (0<=lineX<f['backing'][0] and topY<f['backing'][1] and botY>=0)
 result={'lineTargetInActualViewport':vis,'signedRasterPad':pad,'modes':{}}
 for kind in ('raw','dom'):
  a,b=[decode((OUT/f'{key}-{m}-{kind}.png').read_bytes())for m in ('A','B')]
  assert a.size==b.size
  diff=ImageChops.difference(a,b)
  alpha=sum(diff.getchannel('A').histogram()[1:])
  red,green,blue,_=diff.split(); rgb=ImageChops.lighter(ImageChops.lighter(red,green),blue)
  bounds=rgb.getbbox(); changed=sum(rgb.histogram()[1:])
  width,height=a.size
  x0,y0,x1,y1=(max(0,math.floor(lineX-pad)),max(0,math.floor(topY-pad)),min(width,math.ceil(lineX+pad)),min(height,math.ceil(botY+pad)))
  old={(x,y):tuple(delta)for x,y,delta in f['knownOutsideOld']}
  outside=[];inside=0; worst=0
  if bounds:
   l,t,r,bt=bounds; aa=a.load();bb=b.load();rr=rgb.load()
   for y in range(t,bt):
    for x in range(l,r):
     if not rr[x,y]:continue
     if vis and x0<=x<x1 and y0<=y<y1:inside+=1;continue
     worst=max(worst,rr[x,y])
     outside.append({'pixel':[x,y],'A':aa[x,y],'B':bb[x,y],'delta':tuple(q-p for p,q in zip(aa[x,y],bb[x,y]))})
  exact=not outside and alpha==0 and ((inside>0)==vis) and not (not vis and changed)
  bounded=alpha==0 and ((inside>0)==vis) and len(outside)<=len(old)<=2 and worst<=1 and all(
    old.get(tuple(y['pixel']))==y['delta'] for y in outside)
  result['modes'][kind]={'changedLTRB':bounds,'signedLTRB':[x0,y0,x1,y1]if vis else None,
      'changedRGBPixels':changed,'insideRGBPixels':inside,'alphaChanged':alpha,'outsideCount':len(outside),
      'maxOutsideDN':worst,'actualOutside':outside[:20],'strictExactProtected':exact,
      'predeclaredPriorExceptionOnly':bounded}
 proof['frames'][key]['verification']=result;dump()
 assert all(m['predeclaredPriorExceptionOnly'] for m in result['modes'].values()),('outside authenticated historical fringe, opacity or visible line failed',key,result)
def main():
 assert P['enable'] is True and G['activeAssetsAnd50MapsExact'] and G['orderedModulesExactOutsideAct5']
 normalize={b:a for a,b in G['allRenamedPaths']}
 try:
  with sync_playwright() as w:
   b=w.chromium.launch(); assert b.version==P['browser']
   for css in ((1440,900),(390,844)):
    shots=[f for f in P['frames']if tuple(f['viewportCSS'])==css]
    assert len(shots)==(2 if css[0]==1440 else 1) and all(f['id']==44 for f in shots)
    a,c=(capture(b,mode,css,44,shots)for mode in ('A','B'))
    assert a=={normalize.get(k,k)for k in c},('unexpected loaded network paths',css)
   b.close()
  assert len(proof['frames'])==3 and len(proof['http'])==4
  for key,arms in proof['frames'].items():
   for m,r in arms.items():assert all(r['identicalImmediateReplay'].values()),('repeat pixels changed',key,m)
  errors=[]
  for f in P['frames']:
   try:compare(f)
   except AssertionError as e:errors.append({'key':f['key'],'error':repr(e)})
  proof['latePixelGateMismatches']=errors;assert not errors,errors
  strict=all(z['strictExactProtected']for a in proof['frames'].values()for z in a['verification']['modes'].values())
  proof['status']='EXACT_SIGNED_PASS_PENDING_ART' if strict else 'KNOWN_PREVIOUS_1DN_ONLY_PENDING_ART_STRICT_HOLD'
  proof['strictUnchanged']=strict
  proof['visualJudgment']='Human same-size comparison still required; no pixel threshold asserts visual approval.'
  proof.pop('active',None)
 except Exception as e:proof.update(status='HOLD',error=repr(e));raise
 finally:dump()
if __name__=='__main__':main()
