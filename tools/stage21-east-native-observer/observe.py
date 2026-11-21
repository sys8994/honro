"""Read-only Stage21 public east-scale observer. No asset, authored source, response or actor mutations."""
import base64, hashlib, json, os, re, subprocess, sys, time
from io import BytesIO
from statistics import median
from math import ceil,floor
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler,Request,build_opener

REPO='sys8994/honro'
BASE='https://sys8994.github.io/honro/'
REF='refs/heads/qa/stage21-east-native-b79-observer'
LIVE='f7704f08b7462cb10587b582d8a3a4feafe643d1'
MASTER='b79ea7fd87fda5586d78eae0a7052996b8e71fb5'
RUN, JOB = 44897685446, 136827113112
PARENT_RUN, PARENT_JOB=44896684762,136824052511
TREE="1e55d910bbabc43919c20a14d1a06002b20f4977"
PARENT_TREE="b62b549c804989cc3bbf861d9e5f9a33df520717"
DOCS={f'game/docs/{f}.md' for f in ('HONRO_NEW_VERSION_SOP','STAGE_PRODUCTION_SOP','TERRAIN_EDGE_JOIN_AUDIT_SOP','TERRAIN_GENERATION_SOP','TERRAIN_PRODUCTION_REVIEW_SOP_20261120','VECTOR_AUTHORING_SOP')}
FILES={'.github/workflows/stage21-east-native-observer.yml','tools/stage21-east-native-observer/observe.py'}
MEDIA={f'assets/bgm/{n}.mp3' for n in ('main','battle-1','battle-2','battle-3','battle-4')}
PATHS={'map': 'web/data/chapter-21.724a765a85d437a2.json', 'packet': 'web/data/chapter-21-assets.195e73632de8b164.json', 'entry': 'web/entries/game.16fa712378260ab7.js', 'campaign': 'web/data/campaign.324003dbe6483ac8.json', 'base': 'web/data/campaign-base.0c57dcfe7c08d421.json', 'shared': 'web/data/campaign-shared.8f8343b5c21518d4.json', 'loader': 'web/runtime/load-data.248fb3aada6f16bb.js', 'domain': 'web/runtime/ordered-common-11.6adcb81897ec0663.js', 'tiles': 'web/runtime/ordered-common-15.370f1fb43d3a212f.js', 'art': 'web/runtime/ordered-common-17.9a592f68229e4289.js', 'readability': 'web/runtime/ordered-common-16.3d9993bd92d5eb93.js'}
EXACT={'web/data/chapter-21.724a765a85d437a2.json': {'bytes': 67494, 'sha256': '724a765a85d437a24ea9437ba300f5602282abda9ecbd190074a7d25b8b1c51b'}, 'web/data/chapter-21-assets.195e73632de8b164.json': {'bytes': 688805, 'sha256': '195e73632de8b16431e39ac63f87eed9ad1ea538a47dcc0d980e4a0e1c624e67'}, 'web/entries/game.16fa712378260ab7.js': {'bytes': 20483, 'sha256': '16fa712378260ab755902f838024524e733b769c5cd540f95737b3eaff58f7b1'}, 'web/data/campaign.324003dbe6483ac8.json': {'bytes': 54961, 'sha256': '324003dbe6483ac8a778ba250d8aa8d1c63d9149f1cb5b580e6011256006f437'}, 'web/data/campaign-base.0c57dcfe7c08d421.json': {'bytes': 257, 'sha256': '0c57dcfe7c08d421901ffa8eeb437940b6b6d4779816207b51dca7be44c73e5e'}, 'web/data/campaign-shared.8f8343b5c21518d4.json': {'bytes': 577195, 'sha256': '8f8343b5c21518d4fdaa2314e58031fd137b8622d3a6c1ca2fdabafde3bb158f'}, 'web/runtime/load-data.248fb3aada6f16bb.js': {'bytes': 15550, 'sha256': '248fb3aada6f16bbe2d7df7e369db772df2d923bc91b1e517daa53858f558dcb'}, 'web/runtime/ordered-common-11.6adcb81897ec0663.js': {'bytes': 177221, 'sha256': '6adcb81897ec06638dc92386b515b2f8ff10ee38a60c6fa4fb2d9040be22ea77'}, 'web/runtime/ordered-common-15.370f1fb43d3a212f.js': {'bytes': 163921, 'sha256': '370f1fb43d3a212f035eabb93ea935aff41d6146fb8c9103c77a1f9c1f07d737'}, 'web/runtime/ordered-common-17.9a592f68229e4289.js': {'bytes': 104308, 'sha256': '9a592f68229e42894a87a328a71e2ac8408bb1556f441bcbc67229aa80ba718c'}, 'web/runtime/ordered-common-16.3d9993bd92d5eb93.js': {'bytes': 177610, 'sha256': '3d9993bd92d5eb93572f4b05fe9da2f19d4202c7a3e24ba767a5274ca3364f2c'}, 'HONRO.html': {'bytes': 17379, 'sha256': 'c8d009ef643d2b24abd85400162b307a2e5a8e95100fe999b89a6afdd5faaecc'}, 'web/manifest.json': {'bytes': 6774523, 'sha256': '0bf1527b6aa52fa5f4f22eb1b90102df5f1c6ea0cb791d664b1b94081c1b65cf'}}
OWNER_CONTRACT={'stage': 21, 'front': 'act3-handoff:21:bedrock', 'back': 'eup21:foundations', 'variant': 'B', 'encoding': 'json-pool-v1', 'worldPoints': [[-500, 2755.3125], [0, 2810], [620, 2810], [5740, 2220], [6400, 2220], [6900, 2288.359375], [7400, 2302.5066666666667], [12400, 1840], [12400, 27200]], 'playProjection': {'bounds': {'left': 0, 'top': 0, 'right': 6400, 'bottom': 3200}, 'start': {'x': 0, 'y': 2810}}, 'playBounds': {'left': 0, 'top': 0, 'right': 6400, 'bottom': 3200}, 'worldBounds': {'left': -6000, 'top': -24000, 'right': 12400, 'bottom': 27200}, 'vectorHashes': {'eup21:foundations': '6c7abc407f1161cdc2146735ddab4088bbc668a0dbb05a9ee48b4039d2ddef0a', 'act3-handoff:21:bedrock': 'cd892b83afea2501ce0db0425df958428da7f011b0af4dba3ca82e9f8d93fe39'}, 'stockB31': 'M60 3060 Q700 2980 1150 3115 T2340 3110 L2590 3200 H0Z', 'foundationsPlacement': {'id': 'foundations', 'assetId': 'eup21:foundations', 'x': 0, 'y': 0, 'scale': 1, 'rotation': 0, 'snap': False, 'depthLayer': 'L1', 'layer': 'front'}}
ARCHIVE={'s21-1440x900-east': {'actual': {'x': 6720, 'y': 1600, 'scale': 0.21176470588235294}, 'viewport': {'left': 3320, 'right': 10120, 'top': -216.13715277777783, 'bottom': 3416.137152777778}, 'focus': {'left': -320, 'top': -1800, 'right': 6720, 'bottom': 3440}, 'zoomLimits': {'min': 0.21176470588235294, 'max': 1.65, 'tactical': 0.21176470588235294, 'readability': 0.056818181818181816}, 'css': {'w': 1440, 'h': 769.1875}, 'backing': [1440, 769], 'phase': 'aim', 'round': 1, 'sceneTime': 2, 'tide': None, 'actorCount': 35, 'physicsSHA256': 'd72051916d0afb4f0cbe3cf026aaba47db8cb14a763d8b2cd1c26dbbe839ba75', 'pngSHA256': 'f44bc7229a0210b743ded10574638b6ed92f08cc32c82e19b5c65a58bb8aed09', 'rgbaSHA256': '2a36597847d9bb39758324fee80c75d01b0116a17a9e4b19e412c4a0430db872'}, 's21-390x844-east': {'actual': {'x': 6720, 'y': 1600, 'scale': 0.057352941176470586}, 'viewport': {'left': 3320, 'right': 10120, 'top': -4045.8253205128203, 'bottom': 7245.82532051282}, 'focus': {'left': -320, 'top': -1800, 'right': 6720, 'bottom': 3440}, 'zoomLimits': {'min': 0.057352941176470586, 'max': 1.65, 'tactical': 0.057352941176470586, 'readability': 0.056818181818181816}, 'css': {'w': 390, 'h': 647.609375}, 'backing': [390, 648], 'phase': 'aim', 'round': 1, 'sceneTime': 2, 'tide': None, 'actorCount': 35, 'physicsSHA256': 'd72051916d0afb4f0cbe3cf026aaba47db8cb14a763d8b2cd1c26dbbe839ba75', 'pngSHA256': '9f3f39a39447d42a28efb475d89ba7b541d7894b2efe54d391baaccbe8c66c65', 'rgbaSHA256': '89536e21a8462cbe2d66a8c383f7dd64e0eb228de1af15fa1cc98d9b48bda03a'}, 's21-1440x900-west-ordinary': {'actual': {'x': -120, 'y': 3000, 'scale': 0.5}, 'viewport': {'left': -1560, 'right': 1320, 'top': 2230.8125, 'bottom': 3769.1875}, 'focus': {'left': -320, 'top': -1800, 'right': 6720, 'bottom': 3440}, 'zoomLimits': {'min': 0.21176470588235294, 'max': 1.65, 'tactical': 0.21176470588235294, 'readability': 0.056818181818181816}, 'css': {'w': 1440, 'h': 769.1875}, 'backing': [1440, 769], 'phase': 'aim', 'round': 1, 'sceneTime': 2, 'tide': None, 'actorCount': 35, 'physicsSHA256': 'd72051916d0afb4f0cbe3cf026aaba47db8cb14a763d8b2cd1c26dbbe839ba75', 'pngSHA256': 'ab0a3a728c71d1e48458b39ff5ea34fd67d27213c0d1f267133529f1b1865843', 'rgbaSHA256': 'fc9db29c588834446e3c9198454c6ba54fff51b38623368f84c03def60bdce8b'}, 's21-390x844-west-ordinary': {'actual': {'x': -120, 'y': 3000, 'scale': 0.5}, 'viewport': {'left': -510, 'right': 270, 'top': 2352.390625, 'bottom': 3647.609375}, 'focus': {'left': -320, 'top': -1800, 'right': 6720, 'bottom': 3440}, 'zoomLimits': {'min': 0.057352941176470586, 'max': 1.65, 'tactical': 0.057352941176470586, 'readability': 0.056818181818181816}, 'css': {'w': 390, 'h': 647.609375}, 'backing': [390, 648], 'phase': 'aim', 'round': 1, 'sceneTime': 2, 'tide': None, 'actorCount': 35, 'physicsSHA256': 'd72051916d0afb4f0cbe3cf026aaba47db8cb14a763d8b2cd1c26dbbe839ba75', 'pngSHA256': 'd1d2ef2d4f308c105acfb9ec9f532fe7f25af0031f1bdb04afe2e907588a6a07', 'rgbaSHA256': '0fc905b71380f68e70ef3189a751eec51d779f643745db1eea1b1aa61421cf5b'}}
NEAR=[6500,2660,.5]
PHYSICS='d72051916d0afb4f0cbe3cf026aaba47db8cb14a763d8b2cd1c26dbbe839ba75'
PREFETCH={'web/data/chapter-02.5faa275befa85b0d.json': {'bytes': 55013, 'sha256': '5faa275befa85b0d49205b25a9d902c9d7ce448cf52fe25e124d4005b10f2ad2'}, 'web/data/chapter-02-assets.ddddf53df4d749c6.json': {'bytes': 256633, 'sha256': 'ddddf53df4d749c60375cba085a79d790319b1e9c1790cb29e840529409ab434'}}
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
PNG="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"
BLOB=re.compile(r'blob:https://sys8994\.github\.io/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')
def sha(b):return hashlib.sha256(b).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':sha(b)}
def checked(k,b,p):
 assert facts(b)==p,(k,'wrong exact bytes',facts(b),p)
 return b
def obj(b):
 def pairs(v):
  x=dict(v);assert len(x)==len(v);return x
 return json.loads(b,object_pairs_hook=pairs)
def git(*a):return subprocess.check_output(['git',*a],timeout=30)
def src(rev,p):return git('show',rev+':'+p)
def save(path,data):
 tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');tmp.replace(path)
def gh(t):return obj(subprocess.check_output(['gh','api',f'repos/{REPO}/'+t],timeout=25))
def git_guard(head):
 assert git('rev-list','--parents','-n1','HEAD').decode().split()==[head,MASTER]
 assert git('rev-list','--parents','-n1',MASTER).decode().split()==[MASTER,LIVE]
 assert git('rev-parse',MASTER+'^{tree}').decode().strip()==TREE
 assert git('rev-parse',LIVE+'^{tree}').decode().strip()==PARENT_TREE
 diff=lambda a,b:set(git('diff','--name-status','--no-renames',a,b).decode().splitlines())
 assert diff(LIVE,MASTER)=={('A\t' if p.endswith('TERRAIN_PRODUCTION_REVIEW_SOP_20261120.md') else 'M\t')+p for p in DOCS}
 assert diff(MASTER,head)=={'A\t'+p for p in FILES}
 assert all(git('ls-tree',head,p).split(None,1)[0]==b'100644' for p in FILES)
def authority(out):
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(REPO,REF,'push')
 git_guard(os.environ['GITHUB_SHA'])
 assert gh('git/ref/heads/master')['object']['sha']==MASTER
 for run,job,head in ((RUN,JOB,MASTER),(PARENT_RUN,PARENT_JOB,LIVE)):
  r,j=gh(f'actions/runs/{run}'),gh(f'actions/jobs/{job}')
  assert r['repository']['full_name']==r['head_repository']['full_name']==REPO
  assert (r['id'],r['head_sha'],r['head_branch'],r['name'],r['status'],r['conclusion'])==(run,head,'master','pages build and deployment','completed','success')
  assert (j['id'],j['run_id'],j['name'],j['status'],j['conclusion'])==(job,run,'deploy','completed','success')
  assert any(w['name']=='Deploy to GitHub Pages' and w['conclusion']=='success' for w in j['steps'])
 for p,w in EXACT.items():assert checked(p,src(MASTER,p),w)==checked(p,src(LIVE,p),w)
 save(out/'AUTHORITY.json',{'master':MASTER,'tree':TREE,'runtimeParent':LIVE,'currentPages':[RUN,JOB],'parentPages':[PARENT_RUN,PARENT_JOB],
 'scope':sorted(FILES),'verified':True})
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*a,**kw):raise RuntimeError('public canonical response redirected')
def public(k):
 u=BASE+k;q=Request(u,headers={'Accept-Encoding':'identity'})
 with build_opener(NoRedirect).open(q,timeout=25)as r:
  assert r.url==u and r.status==200
  return checked(k,r.read(EXACT[k]['bytes']+1),EXACT[k])
def pathof(u):return u[len(BASE):] if u.startswith(BASE) and not any(c in u for c in '?#') else None
def bindings(data):
 m=obj(data['web/manifest.json']);inv={r['path']:{k:r[k]for k in ('bytes','sha256')}for r in m['files']}
 assert len(inv)==len(m['files'])==810 and m['gameEntry']==PATHS['entry'] and m['project']==PATHS['campaign']
 assert all(inv[p]==EXACT[p]for p in PATHS.values())
 c=obj(data[PATHS['campaign']]);index=20
 assert len(c['stages'])==len(c['stageLibraries'])==50
 assert (c['stages'][index],c['stageLibraries'][index],c['base'],c['shared'])==(PATHS['map'],PATHS['packet'],PATHS['base'],PATHS['shared'])
 assert c['assetEncodings']['stageLibraries'][index]==OWNER_CONTRACT['encoding']
 s=obj(data[PATHS['map']]);a=obj(data[PATHS['packet']])
 assert s['metadata']['stageId']==21 and s['id']=='stage-21' and s['design']['act3HandoffArt']==OWNER_CONTRACT['front']
 assert s['playBounds']==OWNER_CONTRACT['playBounds'] and s['terrainBounds']==OWNER_CONTRACT['worldBounds']
 # Packed identity is already byte-pinned; the official loader decodes its true
 # owners. Their complete decoded vectors are checked in OBSERVE, not guessed.
 assert a.keys()=={'version','nodes','root'} and a['version']==1 and type(a['nodes']) is list and type(a['root']) is int and 0<=a['root']<len(a['nodes'])
 assert all(inv[k]==v for k,v in PREFETCH.items())
 return inv|{k:EXACT[k]for k in ('HONRO.html','web/manifest.json')}
def gate(out):
 assert not any(os.environ.get(k) for k in ('GH_TOKEN','GITHUB_TOKEN'))
 v=obj((out/'AUTHORITY.json').read_bytes())
 assert v.get('verified') is True and v['master']==MASTER and v['currentPages']==[RUN,JOB]
 # Original no-query URL must be the expected new B79 body before opening a browser.
 m=public('web/manifest.json');data={'web/manifest.json':m}
 for k in EXACT.keys()-data.keys():data[k]=public(k)
 known=bindings(data);save(out/'HTTP.json',{'exactCurrentGraph':True,'verifiedPaths':EXACT,'declaredAssetEncoding':OWNER_CONTRACT['encoding']})
 return known
def quant(image,frame):
 import math
 im=image.convert('RGB');z=frame['actual']['scale'];v=frame['viewport'];w,h=im.size
 def ix(x):return floor((x-v['left'])*z)
 def iy(y):return floor((y-v['top'])*z)
 def med(x1,x2,y):
  a,b=ceil((x1-v['left'])*z-.5),floor((x2-v['left'])*z-.5)
  if not(0<=a<=b<w) or not 0<=y<h:return None
  xs=[im.getpixel((k,y))for k in range(a,b+1)]
  return tuple(median(k[j]for k in xs)for j in range(3))
 def compare(x,y0,y1,margin=8,extent=40):
  lo=max(0,ceil((y0-v['top'])*z-.5));hi=min(h-1,floor((y1-v['top'])*z-.5))
  rows=[]
  for iy0 in range(lo,hi+1):
   a,b=med(x-extent,x-margin,iy0),med(x+margin,x+extent,iy0)
   if a is not None and b is not None:
    rows.append({'rawY':iy0,'worldY':v['top']+(iy0+.5)/z,'leftMedian':a,'rightMedian':b,'maximumChannelGap':max(abs(i-j)for i,j in zip(a,b))})
  vals=[u['maximumChannelGap']for u in rows]
  return {'rows':rows,'medianMaxChannelGap':median(vals) if vals else None,
    'rowsGapAtLeast12':sum(j>=12 for j in vals),'rowsObserved':len(vals)}
 crop=[max(0,ix(6180)),max(0,iy(2150)),min(w,ceil((6770-v['left'])*z)),min(h,ceil((3230-v['top'])*z))]
 probes={'seamUpperCollar':compare(6400,2225,2240,8,42),'seamFullMaterial':compare(6400,2240,3152.8,8,42),
    'sameDepthRightControl':compare(6500,2240,3152.8,8,42),'sameXBelowControl':compare(6400,3165,3220,8,42)}
 assert crop[0]<crop[2] and crop[1]<crop[3] and probes['seamFullMaterial']['rowsObserved']>0
 return {'witnessWindowRawPixelLTRB':crop,'pixelProbeMethod':'unscaled actual RGB, 8–42 WU column medians by row; descriptive, not an art pass','probes':probes}
def capture(browser,out,known,w,h,result):
 from PIL import Image
 ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 page=ctx.new_page();page.set_default_timeout(30000)
 errs=[];hits=[];pending=set();observed={};blobs=set()
 row={'cssDevice':[w,h],'errors':errs,'requiredObserved':{},'status':'INIT'}
 result['visits'].append(row)
 def emit():save(out/'RECEIPT.json',result)
 def allow(q):
  k=pathof(q.url)
  return q.method=='GET' and (k in known or (k in MEDIA and q.resource_type=='media') or BLOB.fullmatch(q.url) or q.url.startswith('data:'))
 def request(q):
  if not allow(q):errs.append(['noncanonical request',q.method,q.url])
  if pathof(q.url) in known:pending.add(q)
 def failed(q):
  pending.discard(q)
  if not (pathof(q.url) in MEDIA and q.method=='GET' and q.resource_type=='media' and q.failure=='net::ERR_ABORTED'):
   errs.append(['request failed',q.url,q.failure])
 def reply(r):
  k=pathof(r.url);q=r.request
  if q.method=='GET' and BLOB.fullmatch(r.url) and r.status==200:blobs.add(r.url)
  elif q.method=='GET' and k in MEDIA and q.resource_type=='media' and r.status in (200,206):return
  elif q.method=='GET' and k in known and r.status==200:hits.append((k,r))
  elif not r.url.startswith('data:'):errs.append(['unexpected response',r.status,r.url])
 page.on('request',request);page.on('requestfinished',lambda r:pending.discard(r))
 page.on('requestfailed',failed);page.on('response',reply);page.on('pageerror',lambda e:errs.append(['pageerror',str(e)]))
 page.add_init_script('('+INIT+')()')
 i=0
 def drain(needs):
  nonlocal i
  quiet=0;until=time.monotonic()+18
  while time.monotonic()<until:
   assert not errs,errs
   while i<len(hits) and hits[i][1].request not in pending:
    k,r=hits[i];observed[k]=facts(checked(k,r.body(),known[k]));i+=1
   before=(i,len(blobs));page.wait_for_timeout(100)
   idle=before==(len(hits),len(blobs)) and not pending and needs<=observed.keys()
   quiet=quiet+1 if idle else 0
   if quiet==3:
    assert not errs and blobs<=set(page.evaluate("()=>Array.from(__honroObserver.blobs)"))
    row['requiredObserved']={p:observed[p] for p in sorted(needs)}
    row['allObservedVerifiedCount']=len(observed)
    return
  raise RuntimeError(('verified normal HTTP closure missing',sorted(needs-observed.keys()),sorted(x.url for x in pending),errs))
 try:
  shell=page.goto(BASE+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  assert shell and shell.url==BASE+'HONRO.html' and shell.status==200
  b=checked('HONRO.html',shell.body(),EXACT['HONRO.html'])
  assert b.count(('src="'+PATHS['entry']+'"').encode())==1
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  # Reproduce the verified normal Stage21 title preload before Chapter21.
  assert page.evaluate("()=>HonroApp.screen==='title'&&!HonroCampaignLoader.has(2)")
  page.evaluate("()=>HonroCampaignLoader.prewarmNext(1)")
  drain(set(PREFETCH))
  assert page.evaluate("()=>HonroApp.screen==='title'&&!HonroCampaignLoader.has(2)")
  page.evaluate(LAUNCH,21)
  page.locator('#battlecanvas').wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
    return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=12000)
  page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
  keys={*PATHS.values(),*PREFETCH,'HONRO.html'}
  ref=ARCHIVE[f's21-{w}x{h}-east']
  normal=(ref['css'],ref['backing'],ref['focus'],ref['zoomLimits'],ref['phase'],ref['round'],ref['actorCount'],ref['sceneTime'],ref['tide'])
  for name in ('east-ordinary','east','west-ordinary'):
   k=f's21-{w}x{h}-{name}';near=name=='east-ordinary';west=name=='west-ordinary'
   row['attempt']=k;emit()
   q={'id':21,'mapId':'stage-21','name':'ordinary' if near or west else name,
      'ordinary':NEAR if near else [-120,3000,.5] if west else None,'dx':-1 if west else 1,'dy':0,'readback':False}
   f=page.evaluate(PARK,q)
   media=page.evaluate(DECODE)
   assert media['registered']>0 and media['font']=='loaded' and not media['failed']
   assert page.evaluate(PARK,{**q,'readback':True})==f
   owner=page.evaluate(OBSERVE,OWNER_CONTRACT)
   assert owner['realState']['canvasDPR']==1 and owner['realState']['phase']==f['phase'] and owner['realState']['round']==f['round']
   assert (f['css'],f['backing'],f['focus'],f['zoomLimits'],f['phase'],f['round'],f['actorCount'],f['sceneTime'],f['tide'])==normal
   sig=sha(f.pop('signature').encode())
   assert sig==PHYSICS==ref['physicsSHA256'],('original full terrain/units/design/water state changed',k,sig,PHYSICS)
   assert f['phase']=='aim' and f['round']==1 and f['sceneTime']==2
   if near:
    assert [f['actual'][n] for n in ('x','y','scale')]==NEAR,('actual .5 camera clamp altered proposed east target',f)
    u=f['viewport']
    assert u['left']<=6180<6400<6770<=u['right'] and u['top']<=2150<2220<2240<3152.8<3230<=u['bottom']
   else:
    p=ARCHIVE[k]
    assert f['actual']==p['actual'] and f['viewport']==p['viewport'],('different pose from signed actual archive',k)
   drain(keys)
   # Unmodified normal app raw after read-only checks; no image replacement.
   assert page.evaluate("()=>{const a=HonroApp,r=a.scene.canvas.getBoundingClientRect();return [a.scene.x,a.scene.y,a.scene.scale,a.scene.time,a.engine.b.phase,a.engine.b.round,devicePixelRatio,r.width,r.height];}")==[
    *(f['actual'][u]for u in ('x','y','scale')),f['sceneTime'],f['phase'],f['round'],1,f['css']['w'],f['css']['h']]
   dom=page.locator('#battlecanvas').screenshot(animations='disabled')
   raw=base64.b64decode(page.evaluate(PNG),validate=True)
   rep={'raw':f'{k}-raw.png','rawSHA256':sha(raw),'physicsSHA256':sig,'imageDecode':media,**f,'owner':owner}
   (out/rep['raw']).write_bytes(raw)
   rep.update(dom=f'{k}-dom.png',domSHA256=sha(dom));(out/rep['dom']).write_bytes(dom)
   result['frames'][k]=rep;emit()
   with Image.open(BytesIO(raw))as im:
    im.load()
    assert list(im.size)==f['backing']
    rep['rawRGBASHA256']=sha(im.convert('RGBA').tobytes())
    if not west:
     rep.update(quant(im,f))
     crop=im.crop(rep['witnessWindowRawPixelLTRB']); file=f'{k}-native-crop.png';crop.save(out/file)
     rep.update(crop=file,cropSHA256=sha((out/file).read_bytes()))
   if not near:
    ref=ARCHIVE[k];rep['archiveSamePoseRawSHA256']=ref['pngSHA256']
    rep['archiveExactRGBA']=rep['rawRGBASHA256']==ref['rgbaSHA256']
    if west:
     emit()
     assert rep['archiveExactRGBA'],('published west ordinary actual RGBA changed; diagnostic not certified',k)
   emit()
  row.pop('attempt',None);row['status']='EXACT_ORDINARY_AND_MINZOOM_OBSERVATIONS'
 except Exception as e:
  errs.append(['capture stopped',repr(e)]);row['status']='HOLD'
 finally:emit();ctx.close()
def run(out):
 from playwright.sync_api import sync_playwright
 result={'stage':21,'target':'Stage21 east F terminal / original west control','status':'INIT','visits':[],'frames':{},
  'scope':'Public normal Chrome, fresh diagnostic profile and allowed camera pokes. No source/gameplay/input replay or edit; contrast is descriptive; real human visual verdict pending.'}
 try:
  known=gate(out)
  with sync_playwright()as pw:
   browser=pw.chromium.launch(headless=True);result['browser']=browser.version
   assert browser.version=='151.0.7922.34'
   for w,h in ((1440,900),(390,844)):capture(browser,out,known,w,h,result)
   browser.close()
  expect={f's21-{w}x{h}-{k}'for w,h in ((1440,900),(390,844))for k in ('east-ordinary','east','west-ordinary')}
  assert set(result['frames'])==expect and all(v['status']=='EXACT_ORDINARY_AND_MINZOOM_OBSERVATIONS' for v in result['visits']), 'inspect exact partial receipts'
  assert facts(public('web/manifest.json'))==EXACT['web/manifest.json'],'served product drifted during capture'
  result['status']='PASS_STAGE21_OBSERVATION_ONLY_AIM1_NO_ART_VERDICT'
 except Exception as e:
  result.update(status='HOLD',error=repr(e));raise
 finally:save(out/'RECEIPT.json',result)
if __name__=='__main__':
 mode=sys.argv[1];out=Path(sys.argv[2]);assert out.is_dir()
 if mode=='authority':
  try:authority(out)
  except Exception as e:save(out/'AUTHORITY-HOLD.json',{'status':'HOLD_BEFORE_PUBLIC','error':repr(e)});raise
 elif mode=='app':run(out)
 else:raise RuntimeError('authority or app')
