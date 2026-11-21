"""Official local compiled Stage24 native renderer; A and B separate clean stock normal apps."""
import base64,copy,json,re,sys,time
from math import ceil,floor
from statistics import median
from io import BytesIO
from PIL import Image,ImageChops
from pathlib import Path
from guard import facts,sha,save,obj,CANON
P=json.loads((Path(__file__).resolve().parent/'POSES.json').read_text())
PHYSICS='4f2176310fc331d0c8d37fcbba29f9df89b3e438b26fe800ac6b19cc935b61e0'
NEAR=[6930,2520,.5]
MEDIA={f'assets/bgm/{n}.mp3'for n in ('main','battle-1','battle-2','battle-3','battle-4')}
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
OBSERVE=r"""async law=>{
 const a=HonroApp,b=a.engine.b,s=a.scene,d=HonroTerrainDomain;
 const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===24);
 if(st?.id!=='stage-24'||b.honroStage!==24||b.honroCustom||!b.honroCanonical||b.honroMapOrigin!=='campaign'||!d.active(b))
   throw Error('not canonical normal Stage24');
 const stable=()=>JSON.stringify({terrain:b.terrain,units:b.units,phase:b.phase,round:b.round,camera:[s.x,s.y,s.scale,s.time]});
 const signed=stable(),same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 const sha=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),i=>i.toString(16).padStart(2,'0')).join('');
 const fId=law.shape.id, ids=Object.keys(law.vectors),actual=[];
 const flat=d.materialLandmarks(b);
 const native=st.elements.filter(x=>ids.includes(x.assetId));
 if(!same(native,law.placements)||!same(st.playBounds,law.playBounds)||!same(st.terrainBounds,law.mapBounds)||
   st.design?.act3HandoffArt!==ids[3])throw Error('unchanged owner placement/bounds expected');
 for(const id of ids){
  const raw=HONRO_PROJECT.library.filter(x=>x.id===id);
  const draw=flat.filter(x=>x.asset?.id===id);
  if(raw.length!==1||draw.length!==1||await sha(raw[0].vector)!==law.vectors[id])throw Error('registered stage paint identity: '+id);
  const l=draw[0],role=HonroVisualStyle.classify(l,b);
  if(await sha(l.asset.vector)!==law.native[id])throw Error('native drawing bytes: '+id);
  const wantLayer=id===ids[1]?'back':'front',wantRole=id===ids[3]?'gameplay':'decoration';
  if((l.x??0)!==0||(l.y??0)!==0||(l.scale??1)!==1||l.layer!==wantLayer||role!==wantRole||
    Boolean(l.honroTerrainMaterialClip)!==(id!==ids[3]))throw Error('unexpected rendered owner route: '+id);
  if(id===fId){
   const nodes=l.asset.vector.root.children;
   const target=law.facet?nodes[6].children?.[0]:nodes[6];
   if(target?.d!==law.shape.d||target?.fill!=='#5b6756'||nodes[8].d!==law.shape.rim)
     throw Error('lost original front6 or y2444 rim');
   if(law.facet){
    const t=law.facet,c=nodes[6].children?.[1];
    if(nodes[6].children.length!==2||c?.clipPath!==t.id||c.children.length!==1||c.children[0].d!==law.shape.d||c.children[0].fill!==t.fill||
        !same(l.asset.vector.clips[t.id],[t.d]))throw Error('changed narrow facet identity');
   }
  }
  actual.push({id:l.asset.id,renderedID:l.id,layer:l.layer,kind:l.kind,role,nativeTerrainClip:!!l.honroTerrainMaterialClip,
    registeredVectorSHA256:law.vectors[id],nativeRenderVectorSHA256:await sha(l.asset.vector)});
 }
 const authored=st.terrains.find(t=>t.id==='a3-foundation');
 const world=d.render(b).find(t=>t.id==='a3-foundation'),poly=world&&HONRO_CORE.poly(world);
 if(!poly||!same(authored.points.filter(p=>p.x>=6400&&p.x<=8000).map(p=>[p.x,p.y]),law.worldFloor)||
   !law.worldFloor.every(([x,y])=>poly.some(p=>Math.abs(p.x-x)<1e-6&&Math.abs(p.y-y)<1e-6))||
   authored.playProjection?.bounds?.right!==7000)
    throw Error('authored/actual render floor continued geometry no longer binds');
 if(stable()!==signed)throw Error('observation changed normal state');
 return {expectedSource:'front6; rear and B/F ownership retained, not live paint isolation',
   owners:actual,front6:law.shape,worldFloor:law.worldFloor,authoredPlay:authored.playProjection,terrainDomainActive:true,
   realState:{phase:b.phase,round:b.round,actorCount:b.units.length,canvasDPR:devicePixelRatio},unmodified:true};
}"""
PNG="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"
VIEWS=('east-ordinary','east','southeast','west','southwest')
SCOPE='Local B79 identical normal Chrome, A exact deployed files and B regenerated normal build, fresh detached QA profile and diagnostic stock camera; not a playthrough, no publication.'
ROI=(6890,2448,7040,2622)
ROOT='family24:retaining-earth-faces'
CAND_V='a1c2cd901cb96494d00542fc4dca168cc80fa838c100b3d326e24a96274247b5'
NATIVE_V='6fd9ef04593300209147ef91937c7a20ae4ca1ff9ff4cbbbbaba56d6a948d7f8'
def raw_png(b):
 im=Image.open(BytesIO(b)).convert('RGBA'); im.load();return im
def quant(im,row):
 x0,x1,y0,y1=6918,7006,2452,2610
 z=row['actual']['scale'];left=row['viewport']['left'];top=row['viewport']['top']
 w,h=im.size; r=im.convert('RGB'); px=r.load()
 i0=max(7,ceil((x0-left)*z-.5));i1=min(w-8,floor((x1-left)*z-.5))
 j0=max(0,ceil((y0-top)*z-.5));j1=min(h-1,floor((y1-top)*z-.5))
 vs=[]
 for j in range(j0,j1+1):
  diff=[]
  for k in range(i0,i1+1):
   a=[px[i,j]for i in range(k-7,k-2)];b=[px[i,j]for i in range(k+2,k+7)]
   diff.append(max(abs(median(p[c]for p in a)-median(p[c]for p in b)) for c in range(3)))
  vs.append(max(diff))
 assert len(vs)==79
 ls=sorted(vs); q=.9*(len(vs)-1); i=floor(q);v=ls[i]+(ls[i+1]-ls[i])*(q-i)
 return {'rows':len(vs),'yWorld':[y0,y1],'medianMaxStep':median(ls),'p90MaxStep':v,'maximum':max(ls)}
def compare(a,b,row,opposite):
 assert a.size==b.size
 w,h=a.size; cw,ch=row['backing']; assert w==cw and (h==ch or h==ch+1)
 cols=ImageChops.difference(a,b).split();diff=ImageChops.lighter(ImageChops.lighter(cols[0],cols[1]),ImageChops.lighter(cols[2],cols[3]))
 z=row['actual']['scale'];left=row['viewport']['left'];top=row['viewport']['top']
 changed=alpha=unsigned=roof=0; saved=[];ma=cols[3].getdata()
 for i,v in enumerate(diff.getdata()):
  if not v:continue
  xx=i%w; yy=i//w; xl=left+xx/z; xr=xl+1/z; yt=top+yy/z;yb=yt+1/z
  high=yt<=max(2446,2440-max(0,xl-7000)*54.6875/500)
  allowed=not opposite and yy<ch and ROI[0]<=xl<=xr<=ROI[2] and ROI[1]<=yt<=yb<=ROI[3]
  changed+=1;alpha+=bool(ma[i]);unsigned+=not allowed;roof+=high
  if len(saved)<12 and (not allowed or high or ma[i]):saved.append({'raw':[xx,yy],'world':[xl,yt,xr,yb],'A':a.getpixel((xx,yy)),'B':b.getpixel((xx,yy))})
 return {'changed':changed,'alpha':alpha,'unsigned':unsigned,'roofOrRim':roof,'offenders':saved,
    'strict':not(alpha or unsigned or roof) and (changed==0 if opposite else changed>0)}
def capture(browser,variant,arm,w,h,out,proof,source):
 base=arm['origin']; known={**arm['active'],'HONRO.html':arm['shell'],CANON:arm['manifest']}
 assert base in ('http://127.0.0.1:18861/','http://127.0.0.1:18862/')
 blob=re.compile(r'blob:'+re.escape(base)+r'[\da-f-]{36}')
 def key(x):return x[len(base):] if x.startswith(base) and not any(c in x for c in '?#') else None
 ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 page=ctx.new_page();page.set_default_timeout(30000)
 page.add_init_script('('+INIT+')()')
 errors=[];pending=set();hits=[];verified=set();blobs=set();pos=0
 state={'side':variant,'device':[w,h],'errors':errors,'status':'INIT'}
 proof['visits'].append(state)
 def emit():save(out/'RECEIPT.json',proof)
 def req(q):
  p=key(q.url)
  if not (q.method=='GET' and (p in known or p in MEDIA and q.resource_type=='media' or blob.fullmatch(q.url) or q.url.startswith('data:'))):
   errors.append(['noncanonical request',q.method,q.url])
  if p in known:pending.add(q)
 def fail(q):
  pending.discard(q)
  if not (key(q.url) in MEDIA and q.resource_type=='media' and q.failure=='net::ERR_ABORTED'):errors.append(['failed request',q.url,q.failure])
 def response(r):
  p=key(r.url)
  if p in known and r.status==200:hits.append((p,r))
  elif blob.fullmatch(r.url) and r.status==200:blobs.add(r.url)
  elif p in MEDIA and r.request.resource_type=='media' and r.status in (200,206):pass
  elif not r.url.startswith('data:'):errors.append(['unexpected response',r.status,r.url])
 page.on('request',req);page.on('requestfinished',lambda r:pending.discard(r))
 page.on('requestfailed',fail);page.on('response',response);page.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
 needs={v for k,v in P['pathStock'].items() if k not in ('entry','campaign','packet')}|set(arm['paths'].values())|{'HONRO.html'}
 law=copy.deepcopy(P['owners'])
 if variant=='B':
  law['vectors'][ROOT]=CAND_V;law['native'][ROOT]=NATIVE_V;law['facet']=source['facet']
 def drain():
  nonlocal pos
  quiet=0;end=time.monotonic()+18
  while time.monotonic()<end:
   assert not errors,errors
   while pos<len(hits) and hits[pos][1].request not in pending:
    k,r=hits[pos];assert facts(r.body())==known[k],('observed request bytes',variant,k);verified.add(k);pos+=1
   before=(pos,len(blobs));page.wait_for_timeout(110)
   quiet=quiet+1 if before==(len(hits),len(blobs)) and not pending and needs<=verified else 0
   if quiet==3:
    assert not errors and blobs<=set(page.evaluate('()=>Array.from(__honroObserver.blobs)'))
    state['requiredObserved']=sorted(needs);state['observedVerifiedCount']=len(verified);return
  raise RuntimeError(('missing required HTTP app body',sorted(needs-verified),sorted(x.url for x in pending),errors))
 try:
  shell=page.goto(base+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  assert shell and shell.url==base+'HONRO.html' and shell.status==200 and facts(shell.body())==known['HONRO.html']
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  page.evaluate(LAUNCH,24)
  canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
    return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=12000)
  page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
  for n in VIEWS:
   k=f's24-{w}x{h}-{n}';state['attempt']=k;emit()
   near=n=='east-ordinary'; q={'id':24,'mapId':'stage-24','name':'ordinary' if near else n,'ordinary':NEAR if near else None,
      'dx':(-1 if n.endswith('west') else 1),'dy':int(n.startswith('south')),'readback':False}
   f=page.evaluate(PARK,q);decode=page.evaluate(DECODE)
   assert decode['registered']>0 and decode['font']=='loaded' and not decode['failed']
   assert page.evaluate(PARK,{**q,'readback':True})==f
   owner=page.evaluate(OBSERVE,law);assert owner['realState']['canvasDPR']==1
   sig=sha(f.pop('signature').encode());f['physicsSHA256']=sig
   exact=P['frames'][k]
   assert {x:f[x] for x in exact}==exact and sig==PHYSICS,('genuine pose and movement state mismatch',variant,k)
   drain()
   raw=base64.b64decode(page.evaluate(PNG),validate=True)
   dom=canvas.screenshot(animations='disabled',timeout=30000)
   assert base64.b64decode(page.evaluate(PNG),validate=True)==raw,('DOM moved frozen scene',variant,k)
   row={**f,'sourceOwners':owner,'imageDecode':decode}
   for label,x in (('raw',raw),('dom',dom)):
    im=raw_png(x);assert im.width==exact['backing'][0]and im.height in (exact['backing'][1],exact['backing'][1]+1)
    filename=f'{variant}-{k}-{label}.png';(out/filename).write_bytes(x);row[label]=filename;row[label+'SHA256']=sha(x)
   proof['frames'][variant+'-'+k]=row;emit()
  del state['attempt'];state['status']='CAPTURED'
 except Exception as e:state['status']='HOLD';errors.append(['first failed gate',repr(e)])
 finally:emit();ctx.close()
def paired(out,p):
 status=True
 for k in P['frames']:
  a,b=(p['frames'][j+'-'+k]for j in ('A','B'))
  opposite=k.endswith('west'); near=k.endswith('ordinary')
  assert {j:a[j] for j in P['frames'][k]}=={j:b[j] for j in P['frames'][k]}
  row={}
  for label in ('raw','dom'):
   x,y=(raw_png((out/f[label]).read_bytes()) for f in (a,b))
   row[label]=compare(x,y,a,opposite);status &= row[label]['strict']
   if near:
    qa,qb=quant(x,a),quant(y,b)
    row[label]['edge']={'A':qa,'B':qb}
    goal=qb['medianMaxStep']<qa['medianMaxStep'] and qb['p90MaxStep']<=qa['p90MaxStep'] and qb['maximum']<=qa['maximum']
    row[label]['edgeIndependentlyImproved']=goal;status &= goal
    if label=='raw':
     z=a['actual']['scale'];v=a['viewport'];cx=(floor((6810-v['left'])*z),floor((2320-v['top'])*z),ceil((7190-v['left'])*z),ceil((2690-v['top'])*z))
     w,h=(cx[2]-cx[0],cx[3]-cx[1]); montage=Image.new('RGB',(2*w+4,h),'#1c2530');montage.paste(x.crop(cx),(0,0));montage.paste(y.crop(cx),(w+4,0));montage.save(out/(k+'-A-B-actual-1x.png'))
  p['comparisons'][k]=row;save(out/'RECEIPT.json',p)
 return status
def main(work):
 from playwright.sync_api import sync_playwright
 out=work/'out';ri=obj((out/'GRAPH.json').read_bytes());source=obj((out/'CANDIDATE-SOURCE.json').read_bytes())
 p={'scope':SCOPE,'status':'INIT','visits':[],'frames':{},'comparisons':{}}
 try:
  with sync_playwright()as pw:
   browser=pw.chromium.launch(headless=True);p['browser']=browser.version
   assert browser.version=='151.0.7922.34'
   for w,h in ((1440,900),(390,844)):
    for side in ('A','B'):capture(browser,side,ri[side],w,h,out,p,source)
   browser.close()
  assert len(p['frames'])==20 and all(x['status']=='CAPTURED' for x in p['visits']), 'see partial real captures'
  assert paired(out,p),'strict actual picture scope or contrast failed'
  p['status']='PASS_EXACT_STAGE24_VISUAL_SCOPE_AND_CONTRAST_PENDING_HUMAN_REVIEW'
 except Exception as e:p.update(status='HOLD',error=repr(e));raise
 finally:save(out/'RECEIPT.json',p)
if __name__=='__main__':main(Path(sys.argv[1]))
