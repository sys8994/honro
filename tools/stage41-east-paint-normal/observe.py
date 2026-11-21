"""Pinned Stage41 normal A/B carrier. Test-only; no publishing or response substitution."""
import base64, hashlib, io, json, math, os, subprocess, sys, time, zipfile
from pathlib import Path

H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes())
W=Path(sys.argv[2]).resolve() if len(sys.argv)>2 else None
OUT=W/'out' if W else None
BASE=P['base']; REF='refs/heads/'+P['ref']; SRC=P['sourcePath']
FILES={'.github/workflows/stage41-east-paint-normal.yml','tools/stage41-east-paint-normal/observe.py','tools/stage41-east-paint-normal/PINS.json'}
L=P['logical'];SWAP=P['swaps'];BACK={b:a for a,b in SWAP.items() if a!=b}

def sha(b):return hashlib.sha256(b).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':sha(b)}
def blob(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def stamp(b):return {**facts(b),'git':blob(b)}
def git(*args):return subprocess.check_output(['git',*args])
def save(name,obj):(OUT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def view(path):return json.loads(path.read_bytes())
def read(arm,p):return (W/arm/p).read_bytes()
def parent(r):return git('rev-list','--parents','-n1',r).decode().split()
def diff(a,b):return set(git('diff','--name-status','--no-renames',a,b).decode().splitlines())
def load(r,p):return git('show',r+':'+p)
def leaves(data):
    rows=data['files'];result={v['path']:{k:v[k] for k in ('bytes','sha256')} for v in rows}
    assert len(rows)==len(result)==810
    return result

def brush():
    return {'type':'radial','cx':107.3,'cy':169.3,'r':34,'stops':[
        {'offset':0,'color':'#81715e','opacity':1},{'offset':0.9,'color':'#81715e','opacity':1},{'offset':1,'color':'#83766d','opacity':1}]}
def transform():
    literal='"fill":"#83766d"'
    signature='"fill":"url(#east-shoulder-unified-paint)"'
    tail=',"gradients":'+json.dumps({P['gradientKey']:brush()},separators=(',',':'))+'}}'
    return {'path':SRC,'sourceBefore':P['sourceA'],'sourceAfter':P['sourceB'],
        'oldOneCountLiteral':literal,'newOneCountLiteral':signature,'oldSuffix':'}}','newSuffix':tail}
def reverse_paint(b):
    t=transform();lit,new,oldtail,tail=(t[x].encode() for x in ('oldOneCountLiteral','newOneCountLiteral','oldSuffix','newSuffix'))
    assert b.count(new)==1 and b.endswith(tail)
    assert json.loads(b)['vector']['gradients']=={P['gradientKey']:brush()}
    return (b[:-len(tail)]+oldtail).replace(new,lit)
def apply_paint(a):
    t=transform();lit,new,oldtail,tail=(t[x].encode() for x in ('oldOneCountLiteral','newOneCountLiteral','oldSuffix','newSuffix'))
    assert stamp(a)==P['sourceA'] and a.count(lit)==1 and not a.count(new) and a.endswith(oldtail)
    o=json.loads(a);assert list(o)[-1]=='vector' and 'gradients' not in o['vector']
    b=a.replace(lit,new)[:-len(oldtail)]+tail
    assert stamp(b)==P['sourceB'] and reverse_paint(b)==a
    return b
def pre():
    assert os.environ['GITHUB_REPOSITORY']=='sys8994/honro' and os.environ['GITHUB_EVENT_NAME']=='push' and os.environ['GITHUB_REF']==REF
    head=os.environ['GITHUB_SHA']; assert git('rev-parse','HEAD').decode().strip()==head
    assert not git('status','--porcelain=v1','-z')
    assert git('rev-parse',BASE+'^{tree}').decode().strip()==P['baseTree']
    assert parent(head)==[head,BASE] and diff(BASE,head)=={'A\t'+x for x in FILES}
    a=load(BASE,SRC);b=apply_paint(a)
    assert facts(load(BASE,'web/manifest.json'))==P['oldPins']['web/manifest.json']
    OUT.mkdir(exist_ok=False)
    for name in ('A','B'):git('worktree','add','--detach',str(W/name),BASE)
    assert read('A',SRC)==read('B',SRC)==a
    (W/'B'/SRC).write_bytes(b)
    assert git('-C',str(W/'B'),'diff','--no-renames','--name-status','HEAD').decode().splitlines()==['M\t'+SRC]
    assert not git('-C',str(W/'A'),'status','--porcelain=v1','-z')
    save('SOURCE.json',{'exactBase':BASE,'qa':head,'temporaryOnly':True,'productRefCreated':False,
        'onlyScratchMutation':SRC,'A':stamp(a),'B':stamp(b),'reversedExactly':True})
    save('SOURCE-TRANSFORM.json',transform())

def rewrite_bytes(data):
    for old,new in SWAP.items():
        data=data.replace(Path(old).name.encode(),Path(new).name.encode())
    return data
def normalized(data):
    if isinstance(data,dict):return {k:normalized(v) for k,v in data.items()}
    if isinstance(data,list):return [normalized(v) for v in data]
    if isinstance(data,str):
        for b,a in BACK.items():data=data.replace(b,a)
    return data
def packet_guard(a,b,source_a,source_b):
    aa,bb=map(json.loads,(a,b))
    assert len(aa)==len(bb)==1 and aa[0]['id']==bb[0]['id']=='act5:near:41'
    assert aa[0]['campExterior']['east']==json.loads(source_a) and bb[0]['campExterior']['east']==json.loads(source_b)
    bb[0]['campExterior']['east']=aa[0]['campExterior']['east']
    assert aa==bb,'other chapter41 field or owner changed'

def graph():
    source=view(OUT/'SOURCE.json')
    assert source['temporaryOnly'] and source['productRefCreated'] is False
    assert apply_paint(read('A',SRC))==read('B',SRC)
    for k,v in P['oldPins'].items():assert facts(read('A',k))==v,k
    for k,v in P['newPins'].items():assert facts(read('B',k))==v,k
    packet_guard(read('A',L['packet']),read('B',SWAP[L['packet']]),read('A',SRC),read('B',SRC))
    a,b=[json.loads(read(arm,'web/manifest.json')) for arm in ('A','B')]
    A,B=map(leaves,(a,b))
    removed,added=A.keys()-B.keys(),B.keys()-A.keys()
    renamed={x:y for x,y in SWAP.items() if x!=y}
    assert removed==renamed.keys() and added==set(renamed.values()),('unexpected generated coverage diff',sorted(removed),sorted(added))
    assert all(A[k]==B[k] for k in A.keys()&B.keys())
    assert normalized({k:v for k,v in b.items() if k not in ('files','previousFiles','previousGenerations','publishedGenerations')})=={k:v for k,v in a.items() if k not in ('files','previousFiles','previousGenerations','publishedGenerations')}
    for k,y in SWAP.items():
        if k!=L['packet']: assert rewrite_bytes(read('A',k))==read('B',y),('old/new wrapper semantics changed beyond rename',k)
    ca,cb=(json.loads(read(arm,x)) for arm,x in [('A',L['campaign']),('B',SWAP[L['campaign']])])
    assert len(ca['stages'])==len(ca['stageLibraries'])==50 and normalized(cb)==ca
    assert ca['stages'][40]==L['map'] and ca['stageLibraries'][40]==L['packet'] and cb['stageLibraries'][40]==SWAP[L['packet']]
    assert ca['stages'][41]==L['controlMap'] and ca['stageLibraries'][41]==L['controlPacket']
    assert ca['assetEncodings']['stageLibraries'][40]=='json' and not ca['assetPaths']['stageLibraries'][40]
    assert all(k in A and A[k]==B[k] for k in [*ca['stages'],L['base'],L['shared'],L['loader'],L['domain'],L['tiles'],L['art']])
    requestedA=A|{k:P['oldPins'][k] for k in ('HONRO.html','index.html','HONRO_WORKSHOP.html','web/manifest.json')}
    requestedB=B|{k:P['newPins'][k] for k in ('HONRO.html','index.html','HONRO_WORKSHOP.html')}|{'web/manifest.json':facts(read('B','web/manifest.json'))}
    for name,table in [('A',requestedA),('B',requestedB)]:
        for k,v in sorted(table.items()): assert facts(read(name,k))==v,('actual published-or-built file changed',name,k)
    history={}
    for row in a['publishedGenerations']:
        for q in row['files']:
            d={k:q[k] for k in ('bytes','sha256')}
            assert q['path'] not in history or history[q['path']]==d
            history[q['path']]=d
    for k,v in history.items():
        assert facts(read('A',k))==facts(read('B',k))==v,('prior published immutable resource lost',k)
    save('GRAPH.json',{'A':requestedA,'B':requestedB,'allRenamedPaths':renamed,'sealedSource':source,'publishedHistoryVerifiedCount':len(history),
        'normalBuildAcceptable':True,'verified50MapsAndAllOtherPackets':True})

E={'INIT': "()=>{\n const images=new Set(), blobs=new Set();\n const proto=HTMLImageElement.prototype, d=Object.getOwnPropertyDescriptor(proto,'src');\n Object.defineProperty(proto,'src',{...d,set(v){images.add(this);return d.set.call(this,v);}});\n const create=URL.createObjectURL;\n URL.createObjectURL=function(...args){const url=Reflect.apply(create,this,args);blobs.add(url);return url};\n Object.defineProperty(window,'__honroObserver',{value:{images,blobs},enumerable:false});\n}", 'LAUNCH': "async id=>{\n const a=window.HonroApp;\n if(!a||typeof a.launch!=='function')throw Error('Normal app unavailable');\n a.frame=()=>{};\n a.profile.settings.music=false;a.profile.settings.sound=false;\n await HonroCampaignLoader.ensureStage(id);\n for(let n=1;n<id;n++)a.profile.cleared[n]=true;\n for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(id).entryLevel);\n a.launch(id);\n if(a.engine?.b?.honroStage!==id)throw Error('Campaign wrong stage');\n for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);\n if(a.dialogue)throw Error('Entry dialogue remains');\n a.close();HonroStoryFraming.clear(a.scene);\n}", 'PARK': "q=>{\n const a=HonroApp,s=a.scene,e=a.engine,b=e.b;\n const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.id);\n if(!st||st.id!==q.mapId||b.honroStage!==q.id||b.honroCustom!==false||!b.honroCanonical)\n   throw Error('Wrong canonical project stage');\n const r=s.canvas.getBoundingClientRect(), f=HonroBounds.focus(b), z=HonroBounds.zoomLimits(r.width);\n if(![z.min,z.max,f.left,f.top,f.right,f.bottom].every(Number.isFinite)||z.min>=z.max)throw Error('Missing real native zoom and focus bounds');\n const desired=q.name==='ordinary'?{x:q.ordinary[0],y:q.ordinary[1],scale:q.ordinary[2]}:\n    {x:q.dx?q.dx*1e6:st.width/2,y:q.dy?q.dy*1e6:st.height/2,scale:z.min};\n const pos=()=>({x:s.x,y:s.y,scale:s.scale});\n if(!q.readback){\n   HonroStoryFraming.clear(s);\n   Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,\n     focusUntil:0,speakerUntil:0,...desired});\n   HonroBounds.constrain(s,b);\n }\n const constrained=pos();\n // First draw only stabilizes genuine runtime lazy caches. The observation draw must not mutate gameplay.\n if(!q.readback)s.render(e,0,'',.6,false,0);\n const signature=()=>JSON.stringify({terrain:b.terrain,units:b.units,design:{...st.design,nativeArt:{...st.design.nativeArt,far:'act4FarBambooHandoff'}},initialState:st.initialState,\n    objectives:st.objectives,water:b.water??null,tide:b.honroAct4PreviewState?.tide??null,\n    phase:b.phase??null,round:b.round??null});\n const initial=signature();\n s.render(e,0,'',.6,false,0);\n if(signature()!==initial)throw Error('Draw mutated campaign/physics/actors');\n const actual=pos(), viewport=HonroBounds.viewport(s,r.width,r.height);\n if(Object.keys(actual).some(k=>!Number.isFinite(actual[k])||Math.abs(actual[k]-constrained[k])>1e-6)||\n   actual.x<f.left-1e-6||actual.x>f.right+1e-6||actual.y<f.top-1e-6||actual.y>f.bottom+1e-6)\n   throw Error('Render after clamp changed camera');\n if(q.name==='ordinary'){\n   const margin=1e-6, cx=(q.ordinary[0]-viewport.left)*actual.scale, cy=(q.ordinary[1]-viewport.top)*actual.scale;\n   if(actual.scale<=z.min+margin||actual.scale>z.max+margin||cx<0||cx>r.width||cy<0||cy>r.height)\n     throw Error('Ordinary target outside current camera or not at ordinary scale');\n }else if(Math.abs(actual.scale-z.min)>1e-6)throw Error('Not actual min zoom');\n if(q.name!=='ordinary'&&!q.readback){\n   const edge=axis=>{const p=pos(), ext=axis==='x'?[f.left,f.right]:[f.top,f.bottom];return p[axis]>=ext[0]-1e-6&&p[axis]<=ext[1]+1e-6};\n   if(!edge('x')||!edge('y'))throw Error('Extremes outside approved focus');\n }\n return {desired,actual,viewport,focus:f,zoomLimits:z,css:{w:r.width,h:r.height},backing:[s.canvas.width,s.canvas.height],\n         actorCount:b.units.length,tide:b.honroAct4PreviewState?.tide??null,\n         phase:b.phase??null,round:b.round??null,sceneTime:s.time,signature:initial};\n}", 'DECODE': "async()=>{\n const work=(async()=>{\n const obs=window.__honroObserver;\n const chosen=new Set([...obs.images,...document.images].filter(i=>i.currentSrc||i.src));\n await document.fonts.ready;\n await Promise.all([...chosen].map(i=>i.decode()));\n const failed=[...chosen].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.currentSrc||i.src);\n return{registered:chosen.size,failed};})();\n return await Promise.race([work,new Promise((_,reject)=>setTimeout(()=>reject(Error('image decode deadline')),30000))]);\n}"}
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
def decode(b):return Image.open(io.BytesIO(b)).convert("RGBA")
CANVAS="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"

# Passive trace of exact existing draw. Install before normal canonical launch so a
# warm final frame may reuse real already observed raster tiles.
TRACE=r"""()=>{
 const results={calls:[],grad:[],alpha:new Map()}, V=HonroVectorArt, C=CanvasRenderingContext2D.prototype;
 const original=V.draw,g=C.createRadialGradient, oid='act5:act5-east-wide-v2-trace16';
 let active=0;
 V.draw=function(c,a,inst){
    if(a.id!==oid)return Reflect.apply(original,this,arguments);
    active++;
    try{
      if(results.calls.length<80)results.calls.push({origin:[inst.x,inst.y,inst.scale],role:c.honroVisualLayer??null,
        drawGeometry:a.vector.clips.authoredBody?.length,gradient:Object.keys(a.vector.gradients??{})});
      const result=Reflect.apply(original,this,arguments);
      // Observe clip-local owner alpha *before* campPost's unchanged transfer
      // mask. The raw scratch canvas contains only this isolated native owner.
      const raw=HonroVisualStyle.raw(c),t=raw.getTransform(),w=raw.canvas.width,h=raw.canvas.height;
      if(t.a>0&&t.d===t.a&&t.b===0&&t.c===0){
        const xx=t.e+t.a*(inst.x+107.3*inst.scale),yy=t.f+t.d*(inst.y+169.3*inst.scale);
        const r=t.a*inst.scale*34+2, x=Math.max(0,Math.floor(xx-r)),y=Math.max(0,Math.floor(yy-r));
        const bw=Math.min(w,Math.ceil(xx+r))-x,bh=Math.min(h,Math.ceil(yy+r))-y;
        const k=[w,h,t.a,t.e,t.f,x,y,bw,bh].join(':');
        if(bw>0&&bh>0&&!results.alpha.has(k)){
          const d=raw.getImageData(x,y,bw,bh).data,alpha=Uint8Array.from({length:bw*bh},(_,i)=>d[i*4+3]);
          if(alpha.some(v=>v!==0))results.alpha.set(k,alpha);
        }
      }
      return result;
    }finally{active--;}
 };
 C.createRadialGradient=function(...args){
    if(active&&results.grad.length<80){const m=this.getTransform();results.grad.push({args,m:[m.a,m.b,m.c,m.d,m.e,m.f]});}
    return Reflect.apply(g,this,args);
 };
 Object.defineProperty(window,'__stage41EastPaintProof',{value:results});
}"""
CHECK=r"""async q=>{
 const a=HonroApp,b=a.engine.b,s=a.scene;
 if(!b.honroCanonical||b.honroCustom||b.honroMapOrigin!=='campaign'||!HonroTerrainDomain.active(b))throw Error('not actual canonical campaign');
 const st=HONRO_PROJECT.stages.find(x=>x.id===b.honroAuthoredId),ids=st.elements.map(c=>c.assetId);
 const pool=HONRO_PROJECT.library.filter(e=>ids.includes(e.id)), data=structuredClone(pool);
 const digest=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x)))),n=>n.toString(16).padStart(2,'0')).join('');
 let eastJSONSHA=null;
 if(q.stage===41){
  const row=pool.filter(e=>e.id==='act5:near:41'), land=HonroTerrainDomain.materialLandmarks(b).filter(e=>e.id==='a5-near');
  if(row.length!==1||land.length!==1||JSON.stringify(row[0].campExterior.east)!==JSON.stringify(land[0].asset?.campExterior?.east))
     throw Error('real material instance lost exact loaded campExterior.east');
  const placement=land[0];
  if(placement.x!==0||placement.y!==0||placement.scale!==6400/1902)throw Error('wrong actual east visual placement');
  eastJSONSHA=await digest(row[0].campExterior.east);
  if(eastJSONSHA!==q.eastSHA||HonroEnvironment.act3Palette(b)!==null)throw Error('wrong active authored paint or palette');
  const e=data.find(e=>e.id==='act5:near:41').campExterior.east, leaves=e.vector.root.children[0].children[0].children[0].children;
  if(q.mode==='B'){
    if(leaves[2].fill!=='url(#'+q.key+')'||Object.keys(e.vector.gradients).length!==1)throw Error('wrong signed leaf-only overwrite');
    leaves[2].fill='#83766d';delete e.vector.gradients;
  }else if(leaves[2].fill!=='#83766d'||e.vector.gradients)throw Error('A0 did not load original opaque paint');
  if(await digest(e)!==q.stockSHA)throw Error('runtime east geometry/paint scope leak');
 }
 const pg=HonroTerrainReadability.prepare(b);
 const segments=pg.groups.map(g=>({id:g.id,segments:g.segments}));
 return{stage:b.honroStage,sourceId:b.honroAuthoredId,eastJSONSHA,mapSHA:await digest(st),normalizedArtSHA:await digest(data),
     domainSHA:await digest(HonroTerrainDomain.render(b)),geomSHA:await digest(segments),
     raster:s._worldRasterScale(b,s.canvas.getBoundingClientRect().width),
     traceCounts:{owner:window.__stage41EastPaintProof.calls.length,gradient:window.__stage41EastPaintProof.grad.length,
       alphaTiles:window.__stage41EastPaintProof.alpha.size}};
}"""

PREFETCH={L[n]:P['oldPins'][L[n]] for n in ('preMap','preAsset')}
MEDIA=set(f'assets/bgm/{n}.mp3' for n in ('main','battle-1','battle-2','battle-3','battle-4'))

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
  if q.url.startswith(('blob:'+base.rstrip('/')+'/', 'data:')) or q.method=='GET' and (k in evidence or k in MEDIA and q.resource_type=='media'):
   return r.continue_()
  errors.append(['request',q.url]);return r.abort()
 def response(r):
  q=r.request;k=rel(q.url)
  if r.url.startswith('blob:'+base.rstrip('/')+'/') and r.status==200:blobs.append(r.url)
  elif k in MEDIA and q.resource_type=='media' and r.status in (200,206):media.add(k)
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
  page.evaluate(TRACE)
  page.evaluate(E['LAUNCH'],stage); canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
  page.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}",timeout=12000)
  page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
  for f in shots:
   k=f['key'];view=f['view']
   q={'id':stage,'mapId':f'stage-{stage}','name':view,'dx':-1 if 'west' in view else 1 if 'east' in view else 0,
     'dy':1 if 'south' in view else -1 if 'north' in view else 0,'ordinary':P['ordinary'],'readback':False,'fixedNow':PHASE}
   proof['active']={'key':k,'arm':mode,'phase':'before camera/readiness'};dump()
   observed=page.evaluate(FROZEN,q);meta=observed['meta']
   dd=page.evaluate(E['DECODE']);assert dd['registered']>0 and not dd['failed']
   replay=page.evaluate(FROZEN,{**q,'readback':True})
   assert observed==replay,('frozen visual/native state failed repeat',k,mode,observed,replay)
   assert page.evaluate("()=>document.fonts.status==='loaded'&&HonroApp.profile.settings.music===false&&HonroApp.profile.settings.sound===false")
   assert all(meta[n]==f[n]for n in ('actual','viewport','focus','css','backing','sceneTime','phase','round','tide','actorCount')),('reference camera or state changed',k,mode,meta)
   assert sha(meta['signature'].encode())==f['physicsSHA256'],(k,'archived canonical physics/actors/state drift')
   info=page.evaluate(CHECK,{'stage':stage,'mode':mode,'eastSHA':P['eastJSONSHA'][mode], 'stockSHA':P['eastJSONSHA']['A'],'key':P['gradientKey']})
   assert info['stage']==stage and info['sourceId']==f'stage-{stage}' and info['raster']>0
   rb=base64.b64decode(page.evaluate(CANVAS),validate=True); db=canvas.screenshot(animations='disabled')
   for kind,v in [('raw',rb),('dom',db)]: (OUT/f'{k}-{mode}{replica}-{kind}.png').write_bytes(v)
   second=page.evaluate(FROZEN,{**q,'readback':True})
   assert observed==second
   rb2=base64.b64decode(page.evaluate(CANVAS),validate=True); db2=canvas.screenshot(animations='disabled')
   equality={}
   for kind,p0,p1 in [('raw',rb,rb2),('dom',db,db2)]:
    a,b=decode(p0),decode(p1)
    equality[kind]=a.size==b.size and a.tobytes()==b.tobytes()
    if not equality[kind]:(OUT/f'{k}-{mode}{replica}-{kind}-failed-A-A.png').write_bytes(p1)
   proof['frames'].setdefault(k,{})[mode+replica]={'raw':facts(rb),'dom':facts(db),'nativeState':{m:info[m] for m in ('mapSHA','normalizedArtSHA','domainSHA','geomSHA','raster')},'actualEastSHA':info['eastJSONSHA'],'traceCounts':info['traceCounts'],
     'identicalImmediateReplay':equality,'fixedCloud':observed['cloud'],'fixedGrade':observed['time'],
     'physicsSHA256':sha(meta['signature'].encode()),
     'archiveCameraReferenceOriginalPNG':f['pngSHA256'],
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
  rawkeys=['entry','campaign','wrapper','loader','base','shared','domain','tiles','art']+(['map','packet'] if stage==41 else ['controlMap','controlPacket'])
  needs={SWAP.get(L[n],L[n]) if mode=='B' else L[n] for n in rawkeys}|{'HONRO.html'}
  assert needs<=seen.keys(),('live receipt missing full owning graph',sorted(needs-seen.keys()))
  last=page.evaluate(r'''async ()=>{
   const t=window.__stage41EastPaintProof,alpha={};
   for(const [k,v]of t.alpha)alpha[k]=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',v)),x=>x.toString(16).padStart(2,'0')).join('');
   return {calls:t.calls,grad:t.grad,alpha};
  }''')
  if stage==41:
   assert last['alpha'] and last['calls'] and all(x['origin']==[1700,-25,2.4] and x['role']=='L1' and x['drawGeometry']>0 for x in last['calls']),('wrong actual owner pivot/style',last)
   assert all(x['gradient']==([P['gradientKey']] if mode=='B' else []) for x in last['calls'])
   assert bool(last['grad'])==(mode=='B'),('expected B only gradient brush',last)
   assert all(x['args']==[107.3,169.3,0,107.3,169.3,34] and len(x['m'])==6 and x['m'][0]==x['m'][3] and x['m'][0]>0 and x['m'][1:3]==[0,0] for x in last['grad'])
  else:assert not last['calls'] and not last['grad'] and not last['alpha'],'peer played Stage41-only asset'
  proof.setdefault('activeDrawByContext',{})[f'{stage}-{w}x{h}-{mode}{replica}']=last;dump()
  return set(seen)
 finally:ctx.close()

def app():
    from PIL import Image,ImageChops
    from playwright.sync_api import sync_playwright
    globals().update(Image=Image,ImageChops=ImageChops,G=view(OUT/'GRAPH.json'))
    globals()['proof']={'status':'HOLD_IN_PROGRESS','scope':'Canonical compiled normal Stage41 A/B, aim1.',
        'frames':{},'http':{},'disclaimer':'No response injection, no gameplay verification, no release.'}
    def dump_( ):save('BROWSER.json',proof)
    globals()['dump']=dump_
    def png(key,arm,kind):return decode((OUT/f'{key}-{arm}-{kind}.png').read_bytes())
    def paired_http(a,b,k):
        norm={BACK.get(x,x) for x in b}
        assert a==norm,('authorized content address changes only',k,sorted(a-norm),sorted(norm-a))
        stage,(w,h),*seq=k
        suffix='2' if seq else ''
        x=f'{stage}-{w}x{h}-'
        ta,tb=(proof['activeDrawByContext'][x+n+suffix]['alpha'] for n in ('A','B'))
        assert ta==tb,('native owner clip alpha pixels changed before the immutable east mask transfer',k)
    def compare(f):
        key=f['key']; rows=proof['frames'][key]; a,b=rows['A'],rows['B']
        parity=('nativeState','camera','physicsSHA256','fixedGrade','fixedCloud')
        assert all(a[n]==b[n]for n in parity),('actual render geometry/physical/camera/phase differs',key)
        if f['id']==41:
            assert (a['actualEastSHA'],b['actualEastSHA'])==(P['eastJSONSHA']['A'],P['eastJSONSHA']['B'])
        else:assert a['actualEastSHA'] is None and b['actualEastSHA'] is None
        # Predeclared screen support: full exact local paint disc transformed to
        # CSS native viewport, plus existing Stage7 tile/gutter transfer bound from
        # the measured world raster and zoom. No observed-diff-derived ROI.
        z=f['actual']['scale']; r=a['nativeState']['raster']; w=f['viewport']; wx,wy,rad=P['worldDisc']
        signed=((wx-w['left'])*z,(wy-w['top'])*z,rad*z)
        pad=math.ceil(2.5*z/r+1)
        expected=f['id']==41 and (f['view']=='east' or f['view']=='northeast' and f['viewportCSS'][0]==390)
        result={'signedCssDisc':signed,'predeclaredTileAndDevicePad':pad,'expectPositive':expected,'rgba':{}}
        for kind in ('raw','dom'):
            aImg,bImg=png(key,'A',kind),png(key,'B',kind)
            assert aImg.size==bImg.size,('image size changed',key,kind)
            delta=ImageChops.difference(aImg,bImg)
            alpha=delta.getchannel('A').getbbox()
            rgb=delta.convert('RGB'); bb=rgb.getbbox(); changes=outside=0
            if bb:
                px=rgb.load()
                sx,sy,sr=signed
                for y in range(bb[1],bb[3]):
                    for x in range(bb[0],bb[2]):
                        if px[x,y]!=(0,0,0):
                            changes+=1
                            if math.hypot(x+.5-sx,y+.5-sy)>sr+pad:outside+=1
            result['rgba'][kind]={'changedRGB':changes,'outsideRGBA':outside,'changedAlphaBBox':alpha,'rgbBBox':bb}
            rows['verification']=result;dump_()
            assert alpha is None and not outside,('signed whole-frame RGBA/alpha protection failed',key,kind,result)
            assert bool(changes)==expected,('unexpected invisible change or affected true control',key,kind)
    fail=[]
    try:
        with sync_playwright() as p:
            b=p.chromium.launch(headless=True)
            assert b.version==P['browser']
            for stage in (41,42):
                for css in ((1440,900),(390,844)):
                    f=[z for z in P['frames'] if z['id']==stage and tuple(z['viewportCSS'])==css]
                    assert len(f)==(4 if stage==41 else 1)
                    # Warm same-arm ordinary and positive captures independently, then
                    # separately require exact fresh East context for both source arms.
                    n,m=(capture(b,arm,css,stage,f)for arm in ('A','B'));paired_http(n,m,(stage,css))
                    if stage==41:
                        east=[x for x in f if x['view']=='east']
                        n,m=(capture(b,arm,css,stage,east,'2')for arm in ('A','B'));paired_http(n,m,(stage,css,'fresh'))
            b.close()
        assert len(proof['frames'])==len(P['frames'])
        for f in P['frames']:
            key=f['key'];rows=proof['frames'][key]
            assert all(all(z['identicalImmediateReplay'].values()) for z in rows.values())
            if f['id']==41 and f['view']=='east':
                for arm in ('A','B'):
                    j=arm+'2'
                    for k in ('nativeState','camera','physicsSHA256','fixedGrade','fixedCloud','actualEastSHA'):assert rows[arm][k]==rows[j][k],(key,k,'fresh context state drift')
                    for kind in ('raw','dom'):
                        a,c=png(key,arm,kind),png(key,j,kind)
                        assert a.size==c.size and a.tobytes()==c.tobytes(),(key,kind,'same-arm fresh pixel drift')
        for f in P['frames']:
            try:compare(f)
            except AssertionError as exc:fail.append({'view':f['key'],'cause':repr(exc)})
        proof['afterCapturedPixelGate']=fail;assert not fail,fail
        proof['status']='PASS_EXACT_STAGE41_SCOPED_NORMAL_A_B_VISUAL_REVIEW_PENDING'
        proof.pop('active',None)
    except Exception as exc:
        proof.update(status='HOLD',error=repr(exc));raise
    finally:
        dump_()

def seal():
    source=view(OUT/'SOURCE.json');recipe=view(OUT/'SOURCE-TRANSFORM.json')
    graph=view(OUT/'GRAPH.json');browser=view(OUT/'BROWSER.json')
    assert source['temporaryOnly'] and source['productRefCreated'] is False and recipe==transform()
    assert browser['status']=='PASS_EXACT_STAGE41_SCOPED_NORMAL_A_B_VISUAL_REVIEW_PENDING'
    assert graph['normalBuildAcceptable'] and set(browser['frames'])=={f['key'] for f in P['frames']} and not browser['afterCapturedPixelGate']
    paths=sorted(set(P['newPins'])|{'web/manifest.json'})
    assert len(paths)==10 and len(graph['allRenamedPaths'])==6
    expected={k:graph['B'][k] for k in paths}
    assert all(facts(read('B',k))==v for k,v in expected.items())
    z=OUT/'B-EXACT-NORMAL-DELTA-NOT-DEPLOYED.zip'
    with zipfile.ZipFile(z,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as arc:
        for k in paths:arc.writestr(k,read('B',k))
    with zipfile.ZipFile(z) as arc:
        assert arc.namelist()==paths and all(facts(arc.read(k))==v for k,v in expected.items())
    save('NORMAL-SEAL-NOT-PUBLISHED.json',{'exactBase':BASE,'qaHead':source['qa'],'scopedTemporaryB':True,
        'notPublished':True,'visualAndReleaseReviewPending':True,
        'zip':facts(z.read_bytes()),'generated':expected,'recipe':facts((OUT/'SOURCE-TRANSFORM.json').read_bytes()),
        'validatedReceipts':{k:facts((OUT/k).read_bytes()) for k in ('SOURCE.json','GRAPH.json','BROWSER.json')}})

if __name__=='__main__':{'pre':pre,'graph':graph,'app':app,'seal':seal}[sys.argv[1]]()
