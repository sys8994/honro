"""Stage21 exact native neutral A/A. Stock A twice and one isolated normal A0. No candidate art or release."""
import base64,hashlib,io,json,math,re,sys,time
from pathlib import Path
from PIL import Image,ImageChops
Q=Path(__file__).resolve().parent; P=json.loads((Q/'PINS.json').read_bytes()); W=Path(sys.argv[1]);OUT=W/'out'
G=json.loads((OUT/'GRAPH.json').read_bytes())
assert P['enable'] and G['activeAssetsAnd50MapsExact'] and G['orderedModulesExactOutsideOneAct3Module']
INIT=r"""()=>{
 const images=new Set(), blobs=new Set();
 const proto=HTMLImageElement.prototype, d=Object.getOwnPropertyDescriptor(proto,'src');
 Object.defineProperty(proto,'src',{...d,set(v){images.add(this);return d.set.call(this,v);}});
 const create=URL.createObjectURL;
 URL.createObjectURL=function(...args){const url=Reflect.apply(create,this,args);blobs.add(url);return url};
 Object.defineProperty(window,'__honroObserver',{value:{images,blobs},enumerable:false});
}"""
LAUNCH=r"""async id=>{
 const a=window.HonroApp;
 if(!a||typeof a.launch!=='function')throw Error('Normal app unavailable');
 a.frame=()=>{};
 a.profile.settings.music=false;a.profile.settings.sound=false;
 await HonroCampaignLoader.ensureStage(id);
 for(let n=1;n<id;n++)a.profile.cleared[n]=true;
 for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(id).entryLevel);
 a.launch(id);
 if(a.engine?.b?.honroStage!==id)throw Error('Campaign wrong stage');
 for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
 if(a.dialogue)throw Error('Entry dialogue remains');
 a.close();HonroStoryFraming.clear(a.scene);
}"""
PARK=r"""q=>{
 const a=HonroApp,s=a.scene,e=a.engine,b=e.b;
 const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.id);
 if(!st||st.id!==q.mapId||b.honroStage!==q.id||b.honroCustom!==false||!b.honroCanonical)
   throw Error('Wrong canonical project stage');
 const r=s.canvas.getBoundingClientRect(), f=HonroBounds.focus(b), z=HonroBounds.zoomLimits(r.width);
 if(![z.min,z.max,f.left,f.top,f.right,f.bottom].every(Number.isFinite)||z.min>=z.max)throw Error('Missing real native zoom and focus bounds');
 const desired=q.name==='ordinary'?{x:q.ordinary[0],y:q.ordinary[1],scale:q.ordinary[2]}:
    {x:q.dx?q.dx*1e6:st.width/2,y:q.dy?q.dy*1e6:st.height/2,scale:z.min};
 const pos=()=>({x:s.x,y:s.y,scale:s.scale});
 if(!q.readback){
   HonroStoryFraming.clear(s);
   Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,
     focusUntil:0,speakerUntil:0,...desired});
   HonroBounds.constrain(s,b);
 }
 const constrained=pos();
 // First draw only stabilizes genuine runtime lazy caches. The observation draw must not mutate gameplay.
 if(!q.readback)s.render(e,0,'',.6,false,0);
 const signature=()=>JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,
    objectives:st.objectives,water:b.water??null,tide:b.honroAct4PreviewState?.tide??null,
    phase:b.phase??null,round:b.round??null});
 const initial=signature();
 s.render(e,0,'',.6,false,0);
 if(signature()!==initial)throw Error('Draw mutated campaign/physics/actors');
 const actual=pos(), viewport=HonroBounds.viewport(s,r.width,r.height);
 if(Object.keys(actual).some(k=>!Number.isFinite(actual[k])||Math.abs(actual[k]-constrained[k])>1e-6)||
   actual.x<f.left-1e-6||actual.x>f.right+1e-6||actual.y<f.top-1e-6||actual.y>f.bottom+1e-6)
   throw Error('Render after clamp changed camera');
 if(q.name==='ordinary'){
   const margin=1e-6, cx=(q.ordinary[0]-viewport.left)*actual.scale, cy=(q.ordinary[1]-viewport.top)*actual.scale;
   if(actual.scale<=z.min+margin||actual.scale>z.max+margin||cx<0||cx>r.width||cy<0||cy>r.height)
     throw Error('Ordinary target outside current camera or not at ordinary scale');
 }else if(Math.abs(actual.scale-z.min)>1e-6)throw Error('Not actual min zoom');
 if(q.name!=='ordinary'&&!q.readback){
   const edge=axis=>{const p=pos(), ext=axis==='x'?[f.left,f.right]:[f.top,f.bottom];return p[axis]>=ext[0]-1e-6&&p[axis]<=ext[1]+1e-6};
   if(!edge('x')||!edge('y'))throw Error('Extremes outside approved focus');
 }
 return {desired,actual,viewport,focus:f,zoomLimits:z,css:{w:r.width,h:r.height},backing:[s.canvas.width,s.canvas.height],
         actorCount:b.units.length,tide:b.honroAct4PreviewState?.tide??null,
         phase:b.phase??null,round:b.round??null,sceneTime:s.time,signature:initial};
}"""
DECODE=r"""async()=>{
 const chosen=new Set([...document.images,...__honroObserver.images].filter(i=>i.currentSrc||i.src));
 await Promise.race([Promise.all([document.fonts.ready,...Array.from(chosen,i=>i.decode())]),
    new Promise((_,bad)=>setTimeout(()=>bad(Error('declared image decode timeout')),30000))]);
 const failed=[...chosen].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.currentSrc||i.src);
 return {registered:chosen.size,font:document.fonts.status,failed};
}"""
OBSERVE=r"""async q=>{
 const a=HonroApp,b=a.engine.b,D=HonroTerrainDomain;
 const s=a.scene;
 const snapshot=()=>JSON.stringify({terrain:b.terrain,units:b.units,water:b.water,phase:b.phase,round:b.round,camera:[s.x,s.y,s.scale,s.time]});
 const initial=snapshot();
 const source=HONRO_PROJECT.stages.find(s=>s.metadata.stageId===q.stage);
 if(source?.id!=='stage-21'||source?.design?.act3HandoffArt!==q.front||b.honroStage!==q.stage||b.honroCustom!==false||!b.honroCanonical||b.honroMapOrigin!=='campaign'||!D.active(b))
   throw Error('Wrong stage/owner selectors');
 const list=D.materialLandmarks(b), inList=id=>list.filter(x=>x.asset?.id===id), lib=id=>HONRO_PROJECT.library.filter(x=>x.id===id);
 const placed=source.elements.filter(x=>x.assetId===q.back);
 const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 const sha=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),i=>i.toString(16).padStart(2,'0')).join('');
 const [front,frontSource,base,baseSource]=[inList(q.front),lib(q.front),inList(q.back),lib(q.back)];
 if([front,frontSource,base,baseSource,placed].some(x=>x.length!==1))throw Error('Native F/B material owner cardinality');
 if(!same(placed[0],q.foundationsPlacement)||!same(source.playBounds,q.playBounds)||!same(source.terrainBounds,q.worldBounds)||
    await sha(frontSource[0].vector)!==q.vectorHashes[q.front]||await sha(baseSource[0].vector)!==q.vectorHashes[q.back]||
    baseSource[0].vector.root.children[31]?.d!==q.stockB31)throw Error('immutable raw native owner or source placement changed');
 const F=front[0], B=base[0], id=source.design.act3HandoffArt, diagnostic=q.variant==='B';
 if((diagnostic? F.asset===frontSource[0]||F.asset.vector!==frontSource[0].vector : F.asset!==frontSource[0])||F.kind!=='canonical-element'||F.layer!=='front'||F.depthLayer!=='L1'||
    F.x!==0||F.y!==0||F.scale!==1||F.asset.bounds.x!==(diagnostic?-380:0)||F.asset.bounds.w!==(diagnostic?6780:6400)||
    F.asset.params?.blendFace||F.asset.params?.edgeFade||(b.honroLandmarks||[]).some(x=>x.asset?.id===id))
   throw Error('Missing canonical direct-strip F');
 if(B.id!=='foundations'||B.layer!=='front'||B.kind!=='canonical-element'||B.asset.bounds.x!==-6000||
    B.asset.bounds.w!==18400||B.asset.bounds.y!==-24000||B.asset.bounds.h!==51200||
    baseSource[0].bounds.x!==0||baseSource[0].bounds.w!==6400||
    list.indexOf(B)>=list.indexOf(F))throw Error('Separate materialized B and order not witnessed');
 const floor=D.render(b).find(x=>x.id==='a3-foundation'), pts=floor&&HONRO_CORE.poly(floor);
 const contact=F.asset.params.contactMapping;
 if(!pts||!contact.every(([,,x,y])=>pts.some(p=>Math.abs(p.x-x)<.01&&Math.abs(p.y-y)<.01)))
   throw Error('Actual render floor does not carry registered contacts');
 const points=q.worldPoints;
 if(!points.every(([x,y])=>pts.some(p=>p.x===x&&Math.abs(p.y-y)<.01)))throw Error('Actual west render roof points drifted');
 const authored=source.terrains.find(x=>x.id===floor.id)?.playProjection;
 if(!same(authored,q.playProjection)||source.materials.length!==0||!B.honroTerrainMaterialClip)
   throw Error('Author PLAY/water boundary mismatch');
 const physical=b.terrain.find(t=>t.id===floor.id), ph=physical&&HONRO_CORE.poly(physical);
 if(!ph||!ph.some(p=>p.x===6400&&p.y===2220)||!ph.some(p=>p.x===6400&&p.y===3200)||ph.some(p=>p.x<0||p.x>6400))
   throw Error('original clipped physical floor not retained');
 const exact=[...HonroTerrainReadability.prepare(b).groups].find(g=>g.id===floor.id);
 if(!exact?.segments.some(x=>x.walkable&&x.a.x===6400&&x.a.y===2220&&x.z.x===6900&&x.z.y===2288.359375)||
   exact.segments.some(x=>!x.walkable&&x.a.x===6400&&x.z.x===6400&&x.a.y>=2220&&x.z.y<=3200))
   throw Error('false closure or real walk rim changed');
 if(snapshot()!==initial)throw Error('source observation changed live state');
 const sample=l=>({assetId:l.asset.id,id:l.id,layer:l.layer,depthLayer:l.depthLayer??null,kind:l.kind,
                   placement:[l.x,l.y,l.scale],bounds:l.asset.bounds,materialListIndex:list.indexOf(l)});
 return {front:sample(F),back:sample(B),backAuthoredBounds:baseSource[0].bounds,
   contact,renderRoof:points,floorId:floor.id,authoredPLAY:authored,sourceWater:source.materials.map(x=>x.id),
   realState:{phase:b.phase,round:b.round,actorCount:b.units.length,canvasDPR:devicePixelRatio},
   registeredVectorSHA256:q.vectorHashes,observationOnly:true,trace:'real registered render owners after normal screenshot; no layer toggling or game state injection'};
}"""
PNG=r"""()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"""
MEDIA={f'assets/bgm/{n}.mp3' for n in ('main','battle-1','battle-2','battle-3','battle-4')}
VIEWS=('east-ordinary','east','west-ordinary')
NEAR=[6500,2660,.5]
TRACE="()=>window.__honroStage21NeutralAA??null"
NATIVE_TILES=r"""async()=>{
 const s=HonroApp.scene,b=HonroApp.engine.b,q=s._domainTiles;
 if(!q?.tiles?.size||s.scale>1.05||!HonroTerrainDomain.active(b))throw Error('expected genuine whole cached world tiles');
 const out=[];const sum=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),i=>i.toString(16).padStart(2,'0')).join('');
 for(const [id,t] of q.tiles){if(t.canvas.width!==516||t.canvas.height!==516)throw Error('wrong tile backing');
  // Same Chrome PNG serialization over the actual full backing tile. No
  // getImageData or frequent backing reads that alter Canvas rendering mode.
  const png=t.canvas.toDataURL('image/png');
  out.push({id,left:t.left,top:t.top,png:await sum(new TextEncoder().encode(png))});
 }
 const z=s.renderCacheStats();return{rs:q.rs,tiles:out.sort((a,b)=>a.id.localeCompare(b.id)),builds:z.domainTileBuilds,worldHits:z.worldHits,screenHits:z.screenHits};
}"""
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def emit(r):(OUT/'RECEIPT.json').write_text(json.dumps(r,indent=2)+'\n')
def im(b):
 a=Image.open(io.BytesIO(b)).convert('RGBA');a.load();return a
def trace_ok(past,now,t,armed,west):
 if not armed:
  assert past is None and now is None,'stock executed diagnostic'
  return 0
 n0=0 if past is None else past['total']; n1=0 if now is None else now['total']
 if west:
  assert n1==n0,'neutral visited west control'
  return 0
 assert n1>n0 and now['last']['row']==[5740,6400],'terminal native draw not executed'
 r=now['last']; rs=t['rs']; assert r['tiled'] and r['canvas']==[516,516]
 # Transform provenance, not a pixel allowance. A backend may expose
 # a binary32 Canvas matrix; allow at most 2 representable f32 ULP.
 def eq(x,y):
  return math.isfinite(x) and math.isfinite(y) and (x==y or y!=0 and abs(x-y)<=2*math.ldexp(1,math.frexp(abs(y))[1]-24))
 ax,ay,_,_,dx,dy=r['outer']
 assert eq(ax,rs) and ay==0 and r['outer'][2]==0 and eq(r['outer'][3],rs)
 assert any(eq(dx,2-w['left']*rs) and eq(dy,2-w['top']*rs) for w in t['tiles'])
 sx,sy=660/212, 2.65/212; ex=5740-sx*1960;ey=2220-sy*1960-297*2.65
 m=[sx,sy,0,2.65,ex,ey]
 v=[rs*sx,rs*sy,0,rs*2.65,rs*ex+dx,rs*ey+dy]
 assert len(r['matrix'])==len(r['transform'])==6 and all(abs(a-b)<1e-12 for a,b in zip(r['matrix'],m)) and all(eq(a,b) for a,b in zip(r['transform'],v)),(r,m,v)
 return n1-n0
def capture(browser,tag,w,h,r):
 armed=tag=='A0';side='B' if armed else 'A'; known=G[side];need=set(G['mustObserve'+side])
 base='http://127.0.0.1:'+('18842' if armed else '18841')+'/'
 case={'arm':tag,'device':[w,h],'status':'INIT'}
 ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
 r['visits'].append(case);emit(r)
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 page=ctx.new_page();page.set_default_timeout(30000)
 page.add_init_script('('+INIT+')()')
 pend=set();hits=[];seen=set();err=[];blobs=set();cur=0
 key=lambda u:u[len(base):]if u.startswith(base)and not any(x in u for x in '?#')else None
 blob=re.compile('blob:'+re.escape(base)+r'[\da-f-]{36}')
 def on(q):
  k=key(q.url)
  if not (q.method=='GET' and (k in known or (k in MEDIA and q.resource_type=='media') or blob.fullmatch(q.url) or q.url.startswith('data:'))):err.append(['foreign request',q.method,q.url])
  if k in known:pend.add(q)
 def fail(q):
  pend.discard(q)
  if not(key(q.url) in MEDIA and q.method=='GET' and q.resource_type=='media' and q.failure=='net::ERR_ABORTED'):err.append(['request failure',q.url,q.failure])
 def response(u):
  k=key(u.url);q=u.request
  if k in known and q.method=='GET' and u.status==200:hits.append((k,u))
  elif blob.fullmatch(u.url) and q.method=='GET' and u.status==200:blobs.add(u.url)
  elif k in MEDIA and q.method=='GET' and q.resource_type=='media' and u.status in (200,206):return
  elif not u.url.startswith('data:'):err.append(['response failure',u.status,u.url])
 page.on('request',on);page.on('requestfinished',lambda q:pend.discard(q));page.on('requestfailed',fail);page.on('response',response);page.on('pageerror',lambda x:err.append(['page error',str(x)]))
 def drain(expected):
  nonlocal cur
  quiet=0;stop=time.monotonic()+18
  while time.monotonic()<stop:
   assert not err,err
   while cur<len(hits) and hits[cur][1].request not in pend:
    k,v=hits[cur];cur+=1;assert fact(v.body())==known[k],('actual app URL bytes',tag,k);seen.add(k)
   before=(cur,len(blobs));page.wait_for_timeout(100)
   quiet=quiet+1 if before==(cur,len(blobs))and not pend and expected<=seen else 0
   if quiet==3:
    assert not err and blobs<=set(page.evaluate('()=>Array.from(__honroObserver.blobs)'))
    return
  raise RuntimeError(('verified app HTTP closure missing',sorted(expected-seen),err))
 try:
  htm=page.goto(base+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  assert htm and htm.url==base+'HONRO.html' and htm.status==200 and fact(htm.body())==known['HONRO.html']
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  assert page.evaluate("()=>HonroApp.screen==='title'&&!HonroCampaignLoader.has(2)")
  page.evaluate("()=>HonroCampaignLoader.prewarmNext(1)");drain(set(P['prefetch']))
  assert page.evaluate("()=>HonroApp.screen==='title'&&!HonroCampaignLoader.has(2)")
  page.evaluate(LAUNCH,21)
  can=page.locator('#battlecanvas');can.wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
    return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=12000)
  page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
  for n in VIEWS:
   k=f's21-{w}x{h}-{n}';case['attempt']=k;emit(r)
   nr=n=='east-ordinary';west=n=='west-ordinary'
   q={'id':21,'mapId':'stage-21','name':'ordinary' if nr or west else n,
    'ordinary':NEAR if nr else [-120,3000,.5] if west else None,'dx':-1 if west else 1,'dy':0,'readback':False}
   before=page.evaluate(TRACE);f=page.evaluate(PARK,q)
   d=page.evaluate(DECODE);assert d['registered']>0 and d['font']=='loaded' and not d['failed']
   assert page.evaluate(PARK,{**q,'readback':True})==f
   owner=page.evaluate(OBSERVE,P['owner']);assert owner['realState']['canvasDPR']==1
   f['physicsSHA256']=sha(f.pop('signature').encode());ref=P['frames'][k]
   assert {j:f[j]for j in f}=={j:ref[j]for j in f},('camera/walk/campaign changed',tag,k)
   drain(need)
   raw=base64.b64decode(page.evaluate(PNG),validate=True);dom=can.screenshot(animations='disabled')
   assert base64.b64decode(page.evaluate(PNG),validate=True)==raw
   tiles=page.evaluate(NATIVE_TILES); after=page.evaluate(TRACE)
   calls=trace_ok(before,after,tiles,armed,west)
   warm=page.evaluate(PARK,{**q,'readback':True})
   warm['physicsSHA256']=sha(warm.pop('signature').encode())
   assert warm==f,('warm actual state/pose changed',tag,k)
   assert base64.b64decode(page.evaluate(PNG),validate=True)==raw,('warm actual raw changed',tag,k)
   nt=page.evaluate(NATIVE_TILES)
   assert (nt['rs'],nt['tiles'],nt['builds'])==(tiles['rs'],tiles['tiles'],tiles['builds'])
   assert nt['worldHits']>tiles['worldHits'] or nt['screenHits']>tiles['screenHits']
   row={**f,'owner':owner,'decode':d,'raster':tiles['rs'],'tiles':tiles['tiles'],'neutralCalls':calls,'neutralTrace':after if calls else None,
          'warmExact':True,'httpObservedCount':len(seen)}
   for lab,data in (('raw',raw),('dom',dom)):
    z=im(data); assert z.width==f['backing'][0] and z.height in (f['backing'][1],f['backing'][1]+1)
    p=f'{tag}-{k}-{lab}.png';(OUT/p).write_bytes(data)
    row[lab]=p;row[lab+'PNG']=sha(data);row[lab+'RGBA']=sha(z.tobytes())
   r['frames'][tag+'-'+k]=row;emit(r)
   assert row['rawRGBA']==ref['stockRawRGBA'] and row['domRGBA']==ref['stockDomRGBA'],('actual stock evidence differs',tag,k)
  case.pop('attempt',None);case.update(status='PASS_CAPTURE_ONLY',verified=sorted(seen))
 except Exception as e:
  case.update(status='HOLD',error=repr(e),network=err);raise
 finally:emit(r);ctx.close()
def main():
 from playwright.sync_api import sync_playwright
 r={'status':'HOLD_IN_PROGRESS','scope':'Stage21 A/A2 stock vs A0 neutral nested group, existing native map and compiled renderer. No art edit or deployment.', 'posesAuthority':P['observerReceipt'],'frames':{},'comparisons':{},'visits':[]}
 try:
  with sync_playwright()as pw:
   b=pw.chromium.launch(headless=True); r['browser']=b.version;assert b.version==P['browser']
   for w,h in ((1440,900),(390,844)):
    for arm in ('A','A2','A0'):capture(b,arm,w,h,r)
   b.close()
  assert len(r['frames'])==18 and len(r['visits'])==6
  for k in P['frames']:
   u=[r['frames'][a+'-'+k]for a in ('A','A2','A0')]
   assert all(a['owner']==u[0]['owner'] and a['tiles']==u[0]['tiles'] for a in u[1:]),('native registered owners/whole world tile bytes differ',k)
   r['comparisons'][k]={'raw':False,'dom':False,'wholeWorldTilesExact':True}
   for lab in ('raw','dom'):
    a,b,c=[im((OUT/v[lab]).read_bytes())for v in u]
    assert a.size==b.size==c.size
    assert all(not chan.getbbox() for cand in (b,c) for chan in ImageChops.difference(a,cand).split()),('strict full RGBA drift',k,lab)
    r['comparisons'][k][lab]=True
  r['status']='PASS_STAGE21_EXACT_NEUTRAL_NATIVE_AA_ONLY'
 except Exception as e:r.update(status='HOLD',error=repr(e));raise
 finally:emit(r)
if __name__=='__main__':main()
