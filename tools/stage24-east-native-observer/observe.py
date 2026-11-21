"""Read-only Stage24 public east-scale observer. No asset, authored source, response or actor mutations."""
import base64, hashlib, json, os, re, subprocess, sys, time
from io import BytesIO
from statistics import median
from math import ceil,floor
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler,Request,build_opener

REPO='sys8994/honro'
BASE='https://sys8994.github.io/honro/'
REF='refs/heads/qa/stage24-east-native-b79-observer'
LIVE='f7704f08b7462cb10587b582d8a3a4feafe643d1'
MASTER='b79ea7fd87fda5586d78eae0a7052996b8e71fb5'
RUN, JOB = 44897685446, 136827113112
PARENT_RUN, PARENT_JOB=44896684762,136824052511
TREE="1e55d910bbabc43919c20a14d1a06002b20f4977"
PARENT_TREE="b62b549c804989cc3bbf861d9e5f9a33df520717"
DOCS={f'game/docs/{f}.md' for f in ('HONRO_NEW_VERSION_SOP','STAGE_PRODUCTION_SOP','TERRAIN_EDGE_JOIN_AUDIT_SOP','TERRAIN_GENERATION_SOP','TERRAIN_PRODUCTION_REVIEW_SOP_20261120','VECTOR_AUTHORING_SOP')}
FILES={'.github/workflows/stage24-east-native-observer.yml','tools/stage24-east-native-observer/observe.py'}
MEDIA={f'assets/bgm/{n}.mp3' for n in ('main','battle-1','battle-2','battle-3','battle-4')}
PATHS={'map': 'web/data/chapter-24.966a29d49ef5b519.json', 'packet': 'web/data/chapter-24-assets.9da653528c6235b1.json', 'entry': 'web/entries/game.16fa712378260ab7.js', 'campaign': 'web/data/campaign.324003dbe6483ac8.json', 'base': 'web/data/campaign-base.0c57dcfe7c08d421.json', 'shared': 'web/data/campaign-shared.8f8343b5c21518d4.json', 'loader': 'web/runtime/load-data.248fb3aada6f16bb.js', 'domain': 'web/runtime/ordered-common-11.6adcb81897ec0663.js', 'tiles': 'web/runtime/ordered-common-15.370f1fb43d3a212f.js', 'art': 'web/runtime/ordered-common-17.9a592f68229e4289.js'}
EXACT={'web/data/chapter-24.966a29d49ef5b519.json': {'bytes': 35703, 'sha256': '966a29d49ef5b5199b0d962e64e52cd6c9cf1c462286b4b7c5d38e2e0df41fe3'}, 'web/data/chapter-24-assets.9da653528c6235b1.json': {'bytes': 490200, 'sha256': '9da653528c6235b1bfdc6617cad6421d45da11b2aeeef7d0c3957b6fa7235116'}, 'web/entries/game.16fa712378260ab7.js': {'bytes': 20483, 'sha256': '16fa712378260ab755902f838024524e733b769c5cd540f95737b3eaff58f7b1'}, 'web/data/campaign.324003dbe6483ac8.json': {'bytes': 54961, 'sha256': '324003dbe6483ac8a778ba250d8aa8d1c63d9149f1cb5b580e6011256006f437'}, 'web/data/campaign-base.0c57dcfe7c08d421.json': {'bytes': 257, 'sha256': '0c57dcfe7c08d421901ffa8eeb437940b6b6d4779816207b51dca7be44c73e5e'}, 'web/data/campaign-shared.8f8343b5c21518d4.json': {'bytes': 577195, 'sha256': '8f8343b5c21518d4fdaa2314e58031fd137b8622d3a6c1ca2fdabafde3bb158f'}, 'web/runtime/load-data.248fb3aada6f16bb.js': {'bytes': 15550, 'sha256': '248fb3aada6f16bbe2d7df7e369db772df2d923bc91b1e517daa53858f558dcb'}, 'web/runtime/ordered-common-11.6adcb81897ec0663.js': {'bytes': 177221, 'sha256': '6adcb81897ec06638dc92386b515b2f8ff10ee38a60c6fa4fb2d9040be22ea77'}, 'web/runtime/ordered-common-15.370f1fb43d3a212f.js': {'bytes': 163921, 'sha256': '370f1fb43d3a212f035eabb93ea935aff41d6146fb8c9103c77a1f9c1f07d737'}, 'web/runtime/ordered-common-17.9a592f68229e4289.js': {'bytes': 104308, 'sha256': '9a592f68229e42894a87a328a71e2ac8408bb1556f441bcbc67229aa80ba718c'}, 'HONRO.html': {'bytes': 17379, 'sha256': 'c8d009ef643d2b24abd85400162b307a2e5a8e95100fe999b89a6afdd5faaecc'}, 'web/manifest.json': {'bytes': 6774523, 'sha256': '0bf1527b6aa52fa5f4f22eb1b90102df5f1c6ea0cb791d664b1b94081c1b65cf'}}
OWNER_CONTRACT={'shape': {'id': 'family24:retaining-earth-faces', 'd': 'M6410 2452 L7000 2452 L6977 2590 L6453 2572 Z', 'rim': 'M6410 2444 L7000 2444'}, 'vectors': {'family24:retaining-earth-faces': '098b7fdac911fc6aa5de83c943ee47234bddcbb28bf48ab3514ef2cbd0a39a72', 'family24:deep-foundation-masonry': '40b5d108e311b483a75a99a4cd034614a57cda17683f3a318e7dde34996df0f6', 'family24:terrain-material': 'b905a72c2d7d124d0991707794aebf846b2f99a0cb874ae5d2b580d09ae269e8', 'act3-handoff:24:garden-foundation': '68fe783e255f1017b335709ad1b2e23a628abe2c59b6996755f8100981d206ff'}, 'placements': [{'id': 'terrain-material', 'assetId': 'family24:terrain-material', 'x': 0, 'y': 0, 'scale': 1, 'rotation': 0, 'snap': False, 'depthLayer': 'L1', 'layer': 'front'}, {'id': 'retaining-earth-faces', 'assetId': 'family24:retaining-earth-faces', 'x': 0, 'y': 0, 'scale': 1, 'rotation': 0, 'snap': False, 'depthLayer': 'L1', 'layer': 'front'}, {'id': 'deep-foundation-masonry', 'assetId': 'family24:deep-foundation-masonry', 'x': 0, 'y': 0, 'scale': 1, 'rotation': 0, 'snap': False, 'depthLayer': 'L1', 'layer': 'back'}], 'worldFloor': [[6410, 2440], [7000, 2440], [7500, 2385.3125], [8000, 2375.5496296296296]], 'mapBounds': {'left': -6000, 'top': -24000, 'right': 13000, 'bottom': 27300}, 'playBounds': {'left': 0, 'top': 0, 'right': 7000, 'bottom': 3300}, 'encoding': 'json'}
ARCHIVE={'s24-1440x900-east': {'view': 'east', 'viewportCSS': [1440, 900], 'pngSHA256': '630e837eb98a74fde14db79329114bf60b08263aaa18523918c25cfbb14e2c6b', 'actual': {'x': 7320, 'y': 1650, 'scale': 0.21176470588235294}, 'viewport': {'left': 3920, 'right': 10720, 'top': -166.13715277777783, 'bottom': 3466.137152777778}, 'focus': {'left': -320, 'top': -1800, 'right': 7320, 'bottom': 3540}, 'zoomLimits': {'min': 0.21176470588235294, 'max': 1.65, 'tactical': 0.21176470588235294, 'readability': 0.056818181818181816}, 'css': {'w': 1440, 'h': 769.1875}, 'backing': [1440, 769], 'phase': 'aim', 'round': 1, 'sceneTime': 2, 'tide': None, 'actorCount': 30, 'physicsSHA256': '4f2176310fc331d0c8d37fcbba29f9df89b3e438b26fe800ac6b19cc935b61e0'}, 's24-1440x900-southeast': {'view': 'southeast', 'viewportCSS': [1440, 900], 'pngSHA256': '089ff6e20a383828b03357d816fc57e0628f1c12af6cde11f09b5b4ed8b612a2', 'actual': {'x': 7320, 'y': 3540, 'scale': 0.21176470588235294}, 'viewport': {'left': 3920, 'right': 10720, 'top': 1723.8628472222222, 'bottom': 5356.137152777777}, 'focus': {'left': -320, 'top': -1800, 'right': 7320, 'bottom': 3540}, 'zoomLimits': {'min': 0.21176470588235294, 'max': 1.65, 'tactical': 0.21176470588235294, 'readability': 0.056818181818181816}, 'css': {'w': 1440, 'h': 769.1875}, 'backing': [1440, 769], 'phase': 'aim', 'round': 1, 'sceneTime': 2, 'tide': None, 'actorCount': 30, 'physicsSHA256': '4f2176310fc331d0c8d37fcbba29f9df89b3e438b26fe800ac6b19cc935b61e0'}, 's24-390x844-east': {'view': 'east', 'viewportCSS': [390, 844], 'pngSHA256': 'ba8624cb114021b2c7317fb29927028369e9ea7760f5f4bb7c943c265308539e', 'actual': {'x': 7320, 'y': 1650, 'scale': 0.057352941176470586}, 'viewport': {'left': 3920, 'right': 10720, 'top': -3995.8253205128203, 'bottom': 7295.82532051282}, 'focus': {'left': -320, 'top': -1800, 'right': 7320, 'bottom': 3540}, 'zoomLimits': {'min': 0.057352941176470586, 'max': 1.65, 'tactical': 0.057352941176470586, 'readability': 0.056818181818181816}, 'css': {'w': 390, 'h': 647.609375}, 'backing': [390, 648], 'phase': 'aim', 'round': 1, 'sceneTime': 2, 'tide': None, 'actorCount': 30, 'physicsSHA256': '4f2176310fc331d0c8d37fcbba29f9df89b3e438b26fe800ac6b19cc935b61e0'}, 's24-390x844-southeast': {'view': 'southeast', 'viewportCSS': [390, 844], 'pngSHA256': '62bee289ebce79f649ebcc7b6c6351133869c80b6009449c2cebb44cf6d4a0f9', 'actual': {'x': 7320, 'y': 3540, 'scale': 0.057352941176470586}, 'viewport': {'left': 3920, 'right': 10720, 'top': -2105.8253205128203, 'bottom': 9185.82532051282}, 'focus': {'left': -320, 'top': -1800, 'right': 7320, 'bottom': 3540}, 'zoomLimits': {'min': 0.057352941176470586, 'max': 1.65, 'tactical': 0.057352941176470586, 'readability': 0.056818181818181816}, 'css': {'w': 390, 'h': 647.609375}, 'backing': [390, 648], 'phase': 'aim', 'round': 1, 'sceneTime': 2, 'tide': None, 'actorCount': 30, 'physicsSHA256': '4f2176310fc331d0c8d37fcbba29f9df89b3e438b26fe800ac6b19cc935b61e0'}}
NEAR=[6930,2520,.5]
PHYSICS='4f2176310fc331d0c8d37fcbba29f9df89b3e438b26fe800ac6b19cc935b61e0'
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
  const wantLayer=id===ids[1]?'back':'front',wantRole=id===ids[3]?'gameplay':'decoration';
  if((l.x??0)!==0||(l.y??0)!==0||(l.scale??1)!==1||l.layer!==wantLayer||role!==wantRole||
    Boolean(l.honroTerrainMaterialClip)!==(id!==ids[3]))throw Error('unexpected rendered owner route: '+id);
  if(id===fId){
   const nodes=l.asset.vector.root.children;
   if(nodes[6].d!==law.shape.d||nodes[6].fill!=='#5b6756'||nodes[8].d!==law.shape.rim)
     throw Error('lost original front6 or y2444 rim');
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
 c=obj(data[PATHS['campaign']]);index=23
 assert len(c['stages'])==len(c['stageLibraries'])==50
 assert (c['stages'][index],c['stageLibraries'][index],c['base'],c['shared'])==(PATHS['map'],PATHS['packet'],PATHS['base'],PATHS['shared'])
 assert c['assetEncodings']['stageLibraries'][index]==OWNER_CONTRACT['encoding']
 s=obj(data[PATHS['map']]);a=obj(data[PATHS['packet']]);f=next(x for x in a if x['id']==OWNER_CONTRACT['shape']['id'])
 assert s['metadata']['stageId']==24 and s['id']=='stage-24'
 assert f['vector']['root']['children'][6]['d']==OWNER_CONTRACT['shape']['d']
 assert f['vector']['root']['children'][8]['d']==OWNER_CONTRACT['shape']['rim']
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
 crop=[max(0,ix(6810)),max(0,iy(2320)),min(w,ceil((7190-v['left'])*z)),min(h,ceil((2690-v['top'])*z))]
 probes={'seam':compare(7000,2452,2610),'sameDepthLeftControl':compare(6850,2452,2610),
    'sameDepthRightControl':compare(7110,2452,2610),'sameXBelowControl':compare(7000,2635,2680)}
 assert crop[0]<crop[2] and crop[1]<crop[3] and probes['seam']['rowsObserved']>0
 return {'witnessWindowRawPixelLTRB':crop,'pixelProbeMethod':'unscaled actual RGB, before/after each world line using row medians 8..40wu from seam; descriptive, no pass threshold','probes':probes}
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
  page.evaluate(LAUNCH,24)
  page.locator('#battlecanvas').wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
    return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=12000)
  page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
  keys={*PATHS.values(),'HONRO.html'}
  ref=ARCHIVE[f's24-{w}x{h}-east']
  normal=(ref['css'],ref['backing'],ref['focus'],ref['zoomLimits'],ref['phase'],ref['round'],ref['actorCount'],ref['sceneTime'],ref['tide'])
  for name in ('east-ordinary','east','southeast'):
   k=f's24-{w}x{h}-{name}';near=name.endswith('ordinary')
   row['attempt']=k;emit()
   q={'id':24,'mapId':'stage-24','name':'ordinary' if near else name,'ordinary':NEAR if near else None,'dx':1,
    'dy':int(name=='southeast'),'readback':False}
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
    assert u['left']<=6810<7000<7190<=u['right'] and u['top']<=2320<2452<2610<2690<=u['bottom']
   else:
    p=ARCHIVE[k]
    assert f['actual']==p['actual'] and f['viewport']==p['viewport'],('different min zoom than signed actual archive',k)
   drain(keys)
   # Unmodified normal app raw after read-only checks; no image replacement.
   assert page.evaluate("()=>{const a=HonroApp,r=a.scene.canvas.getBoundingClientRect();return [a.scene.x,a.scene.y,a.scene.scale,a.scene.time,a.engine.b.phase,a.engine.b.round,devicePixelRatio,r.width,r.height];}")==[
    *(f['actual'][u]for u in ('x','y','scale')),f['sceneTime'],f['phase'],f['round'],1,f['css']['w'],f['css']['h']]
   raw=base64.b64decode(page.evaluate(PNG),validate=True)
   rep={'raw':f'{k}-raw.png','rawSHA256':sha(raw),'physicsSHA256':sig,'imageDecode':media,**f,'owner':owner}
   (out/rep['raw']).write_bytes(raw)
   result['frames'][k]=rep;emit()
   with Image.open(BytesIO(raw))as im:
    im.load()
    assert list(im.size)==f['backing']
    rep.update(quant(im,f))
    crop=im.crop(rep['witnessWindowRawPixelLTRB']); file=f'{k}-native-crop.png';crop.save(out/file)
    rep.update(crop=file,cropSHA256=sha((out/file).read_bytes()))
   if not near:rep['archiveSamePoseRawSHA256']=ARCHIVE[k]['pngSHA256']
   emit()
  row.pop('attempt',None);row['status']='EXACT_ORDINARY_AND_MINZOOM_OBSERVATIONS'
 except Exception as e:
  errs.append(['capture stopped',repr(e)]);row['status']='HOLD'
 finally:emit();ctx.close()
def run(out):
 from playwright.sync_api import sync_playwright
 result={'stage':24,'target':OWNER_CONTRACT['shape']['id'],'status':'INIT','visits':[],'frames':{},
  'scope':'Public normal Chrome, fresh diagnostic profile and allowed camera pokes. No source/gameplay/input replay or edit; contrast is descriptive; real human visual verdict pending.'}
 try:
  known=gate(out)
  with sync_playwright()as pw:
   browser=pw.chromium.launch(headless=True);result['browser']=browser.version
   assert browser.version=='151.0.7922.34'
   for w,h in ((1440,900),(390,844)):capture(browser,out,known,w,h,result)
   browser.close()
  expect={f's24-{w}x{h}-{k}'for w,h in ((1440,900),(390,844))for k in ('east-ordinary','east','southeast')}
  assert set(result['frames'])==expect and all(v['status']=='EXACT_ORDINARY_AND_MINZOOM_OBSERVATIONS' for v in result['visits']), 'inspect exact partial receipts'
  assert facts(public('web/manifest.json'))==EXACT['web/manifest.json'],'served product drifted during capture'
  result['status']='PASS_STAGE24_OBSERVATION_ONLY_AIM1_NO_ART_VERDICT'
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
