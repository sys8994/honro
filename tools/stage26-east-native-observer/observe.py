"""Read-only Stage26 public east-scale observer. No asset, authored source, response or actor mutations."""
import base64, datetime as dt, hashlib, json, os, re, subprocess, sys, time
from io import BytesIO
from statistics import median
from math import ceil,floor
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler,Request,build_opener

REPO='sys8994/honro'
BASE='https://sys8994.github.io/honro/'
REF='refs/heads/qa/stage26-east-native-acb-observer'
LIVE='b79ea7fd87fda5586d78eae0a7052996b8e71fb5'
MASTER='acb51f4ee1c5afa90751dc256d6ad8d900732779'
RUN, JOB = 44918541021, 136889673324
PARENT_RUN, PARENT_JOB = 44897685446, 136827113112
TREE='5cc36cfd7ef62fc801dc967605260610596d8061'
PARENT_TREE='1e55d910bbabc43919c20a14d1a06002b20f4977'
RELEASE_FILES={'HONRO.html': {'bytes': 17379, 'sha256': '7f0b08897737d44f4f7d9a436e703b7ec48659fcb121098ea1cffd5b1f93d46d', 'git': '9573df8929e12558e1b0b9c12f65865292aaa05f', 'mode': '100644', 'change': 'M'}, 'HONRO_WORKSHOP.html': {'bytes': 4011, 'sha256': 'd143e5de877a183302966e43aef3f684c9ca305bb09437d8de99f987c68404ad', 'git': '920a8c98d67fa4324dc197d69d878e791d413902', 'mode': '100644', 'change': 'M'}, 'index.html': {'bytes': 17379, 'sha256': '7f0b08897737d44f4f7d9a436e703b7ec48659fcb121098ea1cffd5b1f93d46d', 'git': '9573df8929e12558e1b0b9c12f65865292aaa05f', 'mode': '100644', 'change': 'M'}, 'shared/data/campaign.json': {'bytes': 9319399, 'sha256': '66c78d24b733f602eb238bd6ad5d1d68a386035771a393895ac90d4e3a10733f', 'git': 'a13fc5834808899bcf3b0eac1aa3ca4ada625a2b', 'mode': '100644', 'change': 'M'}, 'tools/map-forge/stage24-family-compound.mjs': {'bytes': 15030, 'sha256': '6e7f5a4ca0113ce91090a5ee00f6a03a872fa98f69df467418c6aa18f508d0e6', 'git': '9028bacf5603eb7447f97f1f0ccc65ec37912e2e', 'mode': '100644', 'change': 'M'}, 'web/data/campaign.7140da5d3649e4ab.json': {'bytes': 54961, 'sha256': '7140da5d3649e4aba2c58e180c8ff3f6f171a70e5e6704ad05dc98d428c52822', 'git': 'c4d6537020ffea3fd7aebaeb7ff4d5ed7f684fdd', 'mode': '100644', 'change': 'A'}, 'web/data/chapter-24-assets.636aabc0f572b723.json': {'bytes': 490928, 'sha256': '636aabc0f572b7234b3f5b6bebfcb4b6376433a22e76d1a073c5ca28b7d1a46c', 'git': '502065987ad6030b7ce09d051e3e6a55de73b0eb', 'mode': '100644', 'change': 'A'}, 'web/entries/game.1acc5c361cb2b136.html': {'bytes': 11318, 'sha256': '1acc5c361cb2b1369b8205dc7a3ba8277775c668e0a3e393772d199a53669a80', 'git': '0b0287c56bc9507b627452cc021688d208226c3d', 'mode': '100644', 'change': 'A'}, 'web/entries/game.b0b1e648c2c03457.js': {'bytes': 20483, 'sha256': 'b0b1e648c2c034576f5e2c701faaa06c4a8f6dca7459e3f54f07fdb94bf61dee', 'git': '8b4599600231d4b1001d51482bce40c101ed14e7', 'mode': '100644', 'change': 'A'}, 'web/entries/workshop.b980331722d6690d.js': {'bytes': 16706, 'sha256': 'b980331722d6690df3fd67e9c22f93f8ede135ac3758e940a0d8d8c0034a66c5', 'git': 'a02011b626f619a253cb8aa951dbfb875c9db154', 'mode': '100644', 'change': 'A'}, 'web/manifest.json': {'bytes': 6458505, 'sha256': 'e274ee2d3dbfee5ce35dfccd6055bfa1a898e3804bde80b687fd49f890c4079b', 'git': '264dc2eaa4a48d683aff9519b3281c961071c49e', 'mode': '100644', 'change': 'M'}, 'web/runtime/campaign.926544619e01a04a.js': {'bytes': 527, 'sha256': '926544619e01a04af2f2cc0e2bd435265ae9efff23062e259563bded6d851307', 'git': 'cd93ab106d111a38701b937c7efd849813fd04cd', 'mode': '100644', 'change': 'A'}}
PAGE_STAMP='2026-11-21T15:20:54.6142454Z'
FILES={'.github/workflows/stage26-east-native-observer.yml','tools/stage26-east-native-observer/observe.py'}
MEDIA={f'assets/bgm/{n}.mp3' for n in ('main','battle-1','battle-2','battle-3','battle-4')}
PATHS={'map': 'web/data/chapter-26.cc8e0e37503433b3.json', 'packet': 'web/data/chapter-26-assets.d511268fb4869e94.json', 'entry': 'web/entries/game.b0b1e648c2c03457.js', 'campaign': 'web/data/campaign.7140da5d3649e4ab.json', 'base': 'web/data/campaign-base.0c57dcfe7c08d421.json', 'shared': 'web/data/campaign-shared.8f8343b5c21518d4.json', 'loader': 'web/runtime/load-data.248fb3aada6f16bb.js', 'domain': 'web/runtime/ordered-common-11.6adcb81897ec0663.js', 'tiles': 'web/runtime/ordered-common-15.370f1fb43d3a212f.js', 'art': 'web/runtime/ordered-common-17.9a592f68229e4289.js', 'readability': 'web/runtime/ordered-common-16.3d9993bd92d5eb93.js', 'campaignRuntime': 'web/runtime/campaign.926544619e01a04a.js'}
EXACT={'web/data/chapter-26.cc8e0e37503433b3.json': {'bytes': 25148, 'sha256': 'cc8e0e37503433b3d091272c8900b7163a8a7f3187286f2e6391885ae6f87cf6'}, 'web/data/chapter-26-assets.d511268fb4869e94.json': {'bytes': 251826, 'sha256': 'd511268fb4869e94e624ec13b28b64eb69c7871bc1dca2155dd8b7f7b8b9b394'}, 'web/entries/game.b0b1e648c2c03457.js': {'bytes': 20483, 'sha256': 'b0b1e648c2c034576f5e2c701faaa06c4a8f6dca7459e3f54f07fdb94bf61dee'}, 'web/data/campaign.7140da5d3649e4ab.json': {'bytes': 54961, 'sha256': '7140da5d3649e4aba2c58e180c8ff3f6f171a70e5e6704ad05dc98d428c52822'}, 'web/data/campaign-base.0c57dcfe7c08d421.json': {'bytes': 257, 'sha256': '0c57dcfe7c08d421901ffa8eeb437940b6b6d4779816207b51dca7be44c73e5e'}, 'web/data/campaign-shared.8f8343b5c21518d4.json': {'bytes': 577195, 'sha256': '8f8343b5c21518d4fdaa2314e58031fd137b8622d3a6c1ca2fdabafde3bb158f'}, 'web/runtime/load-data.248fb3aada6f16bb.js': {'bytes': 15550, 'sha256': '248fb3aada6f16bbe2d7df7e369db772df2d923bc91b1e517daa53858f558dcb'}, 'web/runtime/ordered-common-11.6adcb81897ec0663.js': {'bytes': 177221, 'sha256': '6adcb81897ec06638dc92386b515b2f8ff10ee38a60c6fa4fb2d9040be22ea77'}, 'web/runtime/ordered-common-15.370f1fb43d3a212f.js': {'bytes': 163921, 'sha256': '370f1fb43d3a212f035eabb93ea935aff41d6146fb8c9103c77a1f9c1f07d737'}, 'web/runtime/ordered-common-17.9a592f68229e4289.js': {'bytes': 104308, 'sha256': '9a592f68229e42894a87a328a71e2ac8408bb1556f441bcbc67229aa80ba718c'}, 'web/runtime/ordered-common-16.3d9993bd92d5eb93.js': {'bytes': 177610, 'sha256': '3d9993bd92d5eb93572f4b05fe9da2f19d4202c7a3e24ba767a5274ca3364f2c'}, 'web/runtime/campaign.926544619e01a04a.js': {'bytes': 527, 'sha256': '926544619e01a04af2f2cc0e2bd435265ae9efff23062e259563bded6d851307'}, 'HONRO.html': {'bytes': 17379, 'sha256': '7f0b08897737d44f4f7d9a436e703b7ec48659fcb121098ea1cffd5b1f93d46d'}, 'web/manifest.json': {'bytes': 6458505, 'sha256': 'e274ee2d3dbfee5ce35dfccd6055bfa1a898e3804bde80b687fd49f890c4079b'}}
OWNER_CONTRACT={'encoding': 'json', 'front': 'act3-handoff:26:kiln-foundation', 'back': 'stage26-witness:earth-and-footing-planes', 'frontVector': '79d8eb38fba3480a3ad0cc1c9a47e92b4e4c38f46543dc1cb75670eaa4f79003', 'backVector': '30dc8a88df29ce2e10843417ca294c73e9bed51634c596c94fedf233565f47b3', 'westRecipe': 'e7dbfd267a4121ff94c75bf341cb1d53f354f36795286bffa03156c180be3db8', 'edgeFade': [[0, 115], [6780, 7000]], 'rawFrontBounds': {'x': 0, 'y': 2150, 'w': 7000, 'h': 3907}, 'rawBackBounds': {'x': -6000, 'y': 1500, 'w': 19000, 'h': 2000}, 'registeredBack': {'id': 'earth-and-footing-planes', 'assetId': 'stage26-witness:earth-and-footing-planes', 'x': 0, 'y': 0, 'scale': 1, 'rotation': 0, 'snap': False, 'depthLayer': 'L1', 'layer': 'front'}, 'authoredPlay': {'bounds': {'left': 0, 'top': 0, 'right': 7000, 'bottom': 3300}, 'start': {'x': 0, 'y': 2300}}, 'playBounds': {'left': 0, 'top': 0, 'right': 7000, 'bottom': 3300}, 'worldBounds': {'left': -6000, 'top': -24000, 'right': 13000, 'bottom': 27300}, 'contacts': [[1692, 572, 6550, 2250], [1827, 552, 7000, 2250]], 'worldPoints': [[6550, 2250], [7000, 2250], [7500, 2318.359375], [8000, 2332.5066666666667], [13000, 1870], [13000, 27300]], 'rawEarthGradient': {'type': 'linear', 'stops': [{'offset': 0, 'color': '#667164', 'opacity': 1}, {'offset': 0.55, 'color': '#3c504a', 'opacity': 1}, {'offset': 1, 'color': '#1b3032', 'opacity': 1}], 'x1': 0, 'y1': 2300, 'x2': 0, 'y2': 3100}, 'earthGradient': {'type': 'linear', 'stops': [{'offset': 0, 'color': '#667164', 'opacity': 1}, {'offset': 0.07333333333333335, 'color': '#3c504a', 'opacity': 1}, {'offset': 0.13333333333333333, 'color': '#1b3032', 'opacity': 1}, {'offset': 1, 'color': '#14272b', 'opacity': 1}], 'x1': 0, 'y1': 2300, 'x2': 0, 'y2': 8300}}
ARCHIVE={'s26-1440x900-west': {'desired': {'x': -1000000, 'y': 1650, 'scale': 0.21176470588235294}, 'actual': {'x': -320, 'y': 1650, 'scale': 0.21176470588235294}, 'viewport': {'left': -3720, 'right': 3080, 'top': -166.13715277777783, 'bottom': 3466.137152777778}, 'focus': {'left': -320, 'top': -1800, 'right': 7320, 'bottom': 3540}, 'zoomLimits': {'min': 0.21176470588235294, 'max': 1.65, 'tactical': 0.21176470588235294, 'readability': 0.056818181818181816}, 'css': {'w': 1440, 'h': 769.1875}, 'backing': [1440, 769], 'actorCount': 22, 'tide': None, 'phase': 'aim', 'round': 1, 'sceneTime': 2, 'physicsSHA256': 'dfa434ca4e84a5d0352d2b67f9db5bbc7c8ced7d0c71acc6ba005968f57405cd', 'pngSHA256': '53be720c5fe75c833c4295639a173cd100a5c8cf43d201655f21684782da0ec0', 'rgbaSHA256': 'dbd9d7eed5e2e6579ad8b7ad3e6399f5cb4ef348763ecdcf466980c78617ff7e', 'kind': 'public 42879 raw west'}, 's26-390x844-west': {'desired': {'x': -1000000, 'y': 1650, 'scale': 0.057352941176470586}, 'actual': {'x': -320, 'y': 1650, 'scale': 0.057352941176470586}, 'viewport': {'left': -3720, 'right': 3080, 'top': -3995.8253205128203, 'bottom': 7295.82532051282}, 'focus': {'left': -320, 'top': -1800, 'right': 7320, 'bottom': 3540}, 'zoomLimits': {'min': 0.057352941176470586, 'max': 1.65, 'tactical': 0.057352941176470586, 'readability': 0.056818181818181816}, 'css': {'w': 390, 'h': 647.609375}, 'backing': [390, 648], 'actorCount': 22, 'tide': None, 'phase': 'aim', 'round': 1, 'sceneTime': 2, 'physicsSHA256': 'dfa434ca4e84a5d0352d2b67f9db5bbc7c8ced7d0c71acc6ba005968f57405cd', 'pngSHA256': 'aa7b5b8e05fa4effff8d8be2e47a26339a0e66656388e2b822f0226d0490cbea', 'rgbaSHA256': '8f68835c35a0cb6294725832707a6f37769fc7d7ef38c1414b302f97beeed0a6', 'kind': 'public 42879 raw west'}, 's26-1440x900-east': {'desired': {'x': -1000000, 'y': 1650, 'scale': 0.21176470588235294}, 'actual': {'x': 7320, 'y': 1650, 'scale': 0.21176470588235294}, 'viewport': {'left': 3920, 'right': 10720, 'top': -166.13715277777783, 'bottom': 3466.137152777778}, 'focus': {'left': -320, 'top': -1800, 'right': 7320, 'bottom': 3540}, 'zoomLimits': {'min': 0.21176470588235294, 'max': 1.65, 'tactical': 0.21176470588235294, 'readability': 0.056818181818181816}, 'css': {'w': 1440, 'h': 769.1875}, 'backing': [1440, 769], 'actorCount': 22, 'tide': None, 'phase': 'aim', 'round': 1, 'sceneTime': 2, 'physicsSHA256': 'dfa434ca4e84a5d0352d2b67f9db5bbc7c8ced7d0c71acc6ba005968f57405cd', 'pngSHA256': '0f24a5ae665ff9ae8db06f4b98a40056c4b55d1f755e72d02f8f0799c5469c0b', 'rgbaSHA256': None, 'kind': 'public 2939958 DOM east baseline'}, 's26-390x844-east': {'desired': {'x': -1000000, 'y': 1650, 'scale': 0.057352941176470586}, 'actual': {'x': 7320, 'y': 1650, 'scale': 0.057352941176470586}, 'viewport': {'left': 3920, 'right': 10720, 'top': -3995.8253205128203, 'bottom': 7295.82532051282}, 'focus': {'left': -320, 'top': -1800, 'right': 7320, 'bottom': 3540}, 'zoomLimits': {'min': 0.057352941176470586, 'max': 1.65, 'tactical': 0.057352941176470586, 'readability': 0.056818181818181816}, 'css': {'w': 390, 'h': 647.609375}, 'backing': [390, 648], 'actorCount': 22, 'tide': None, 'phase': 'aim', 'round': 1, 'sceneTime': 2, 'physicsSHA256': 'dfa434ca4e84a5d0352d2b67f9db5bbc7c8ced7d0c71acc6ba005968f57405cd', 'pngSHA256': '762e1c0eaadb5f69e0b914905c72f8353005da53a246aca9d635907f05c7a26e', 'rgbaSHA256': None, 'kind': 'public 2939958 DOM east baseline'}}
NEAR=[7000, 2600, 0.5]
PHYSICS='dfa434ca4e84a5d0352d2b67f9db5bbc7c8ced7d0c71acc6ba005968f57405cd'
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
 const a=HonroApp,b=a.engine.b,s=a.scene,D=HonroTerrainDomain;
 const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===26);
 if(st?.id!=='stage-26'||b.honroStage!==26||b.honroCustom!==false||!b.honroCanonical||b.honroMapOrigin!=='campaign'||!D.active(b))
   throw Error('not the canonical published Stage26');
 const snap=()=>JSON.stringify({terrain:b.terrain,units:b.units,water:b.water,round:b.round,phase:b.phase,camera:[s.x,s.y,s.scale,s.time]});
 const pre=snap(),same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 const sha=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x)))),n=>n.toString(16).padStart(2,'0')).join('');
 const traces=D.materialLandmarks(b),lr=id=>traces.filter(l=>l.asset?.id===id),lib=id=>HONRO_PROJECT.library.filter(n=>n.id===id);
 const [ff,bb,rf,rb]=[lr(q.front),lr(q.back),lib(q.front),lib(q.back)];
 if([ff,bb,rf,rb].some(x=>x.length!==1))throw Error('wrong loaded F/B material identities');
 const [F,B,f,bbare]=[ff[0],bb[0],rf[0],rb[0]];
 if(st.design?.act3HandoffArt!==q.front||!same(st.elements.find(x=>x.assetId===q.back),q.registeredBack)||
    !same(st.terrainBounds,q.worldBounds)||!same(st.playBounds,q.playBounds)||
    await sha(f.vector)!==q.frontVector||await sha(bbare.vector)!==q.backVector||
    !same(f.bounds,q.rawFrontBounds)||!same(bbare.bounds,q.rawBackBounds)||
    !same(bbare.vector.gradients['witness-earth'],q.rawEarthGradient)||await sha(f.params.westBedMaterial)!==q.westRecipe)
   throw Error('underlying original vector assets, bounds or west recipe changed');
 if(F.id!==q.front||F.layer!=='front'||F.depthLayer!=='L1'||F.kind!=='canonical-element'||
    F.x!==0||F.y!==0||F.scale!==1||F.asset.vector!==f.vector||
    F.asset.bounds.x!==-1480||F.asset.bounds.w!==8480||F.asset.params.blendFace!==true||
    !same(F.asset.params.edgeFade,q.edgeFade)||!same(F.asset.params.contactMapping.slice(-2),q.contacts)||
    B.id!==q.registeredBack.id||B.layer!=='front'||B.depthLayer!=='L1'||B.kind!=='canonical-element'||
    !B.honroTerrainMaterialClip||traces.indexOf(B)>=traces.indexOf(F))
   throw Error('native F/B ownership/order, exact fade or approved west draw extent changed');
 const bg=B.asset.vector.gradients['witness-earth'];
 if(!same(bg,q.earthGradient)||bg.x1!==0||bg.x2!==0)throw Error('expected only vertical B0 color grading');
 const author=st.terrains.find(t=>t.id==='a3-foundation'),physical=b.terrain.find(t=>t.id===author.id),world=D.render(b).find(t=>t.id===author.id);
 const points=world&&HONRO_CORE.poly(world),pk=physical&&HONRO_CORE.poly(physical);
 if(!points||!pk||!same(author.playProjection,q.authoredPlay)||
    !q.worldPoints.every(([x,y])=>points.some(s=>Math.abs(x-s.x)<1e-6&&Math.abs(y-s.y)<1e-6))||
    !pk.some(p=>p.x===7000&&p.y===2250)||!pk.some(p=>p.x===7000&&p.y===3300)||pk.some(p=>p.x>7000))
   throw Error('physical projection and visual extended ground diverged');
 const stg=HonroTerrainReadability.prepare(b).groups.find(g=>g.id===world.id);
 if(!stg?.segments.some(x=>x.walkable&&x.a.x===7000&&x.a.y===2250&&x.z.x===7500&&x.z.y===2318.359375)||
    stg.segments.some(x=>!x.walkable&&x.a.x===7000&&x.z.x===7000&&Math.min(x.a.y,x.z.y)<=3300&&Math.max(x.a.y,x.z.y)>=2250))
   throw Error('east stock contour/false physical closure witness changed');
 if(pre!==snap())throw Error('read-only proof changed state');
 const pick=l=>({id:l.id,assetId:l.asset.id,layer:l.layer,depthLayer:l.depthLayer,bounds:l.asset.bounds});
 return {front:pick(F),back:pick(B),registeredVectorSHA256:[q.frontVector,q.backVector], westRecipeSHA256:q.westRecipe,
  shape:{world:q.worldPoints,originalPlay:q.authoredPlay,falseReadabilityClosure:false},sourceFade:q.edgeFade,verticalEarth:bg,
  realState:{phase:b.phase,round:b.round,canvasDPR:devicePixelRatio,actorCount:b.units.length},observationOnly:true};
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
 assert diff(LIVE,MASTER)=={d['change']+'\t'+p for p,d in RELEASE_FILES.items()}
 for p,d in RELEASE_FILES.items():
  raw=src(MASTER,p)
  assert facts(raw)=={k:d[k]for k in ('bytes','sha256')}
  assert hashlib.sha1(f'blob {len(raw)}\0'.encode()+raw).hexdigest()==d['git']
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
  step=[w for w in j['steps']if w['name']=='Deploy to GitHub Pages' and w['conclusion']=='success']
  assert len(step)==1
  if run==RUN:
   parse=dt.datetime.fromisoformat
   assert parse(step[0]['started_at'])<=parse(PAGE_STAMP)<=parse(j['completed_at'])
 for p,w in EXACT.items():
  checked(p,src(MASTER,p),w)
  if p not in RELEASE_FILES:checked(p,src(LIVE,p),w)
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
 c=obj(data[PATHS['campaign']]);index=25
 assert len(c['stages'])==len(c['stageLibraries'])==50
 assert (c['stages'][index],c['stageLibraries'][index],c['base'],c['shared'])==(PATHS['map'],PATHS['packet'],PATHS['base'],PATHS['shared'])
 assert c['assetEncodings']['stageLibraries'][index]==OWNER_CONTRACT['encoding']
 s=obj(data[PATHS['map']]);a=obj(data[PATHS['packet']])
 assert s['metadata']['stageId']==26 and s['id']=='stage-26' and s['design']['act3HandoffArt']==OWNER_CONTRACT['front']
 assert s['playBounds']==OWNER_CONTRACT['playBounds'] and s['terrainBounds']==OWNER_CONTRACT['worldBounds']
 assert type(a)is list and len(a)==19 and sum(x['id']==OWNER_CONTRACT['front'] for x in a)==1 and sum(x['id']==OWNER_CONTRACT['back'] for x in a)==1
 assert all(inv[k]==v for k,v in PREFETCH.items())
 assert PATHS['campaignRuntime'] in m['gameOnly'] or PATHS['campaignRuntime'] in m['common']
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
 crop=[max(0,ix(6650)),max(0,iy(2180)),min(w,ceil((7250-v['left'])*z)),min(h,ceil((3470-v['top'])*z))]
 probes={'landmarkFadeEntry':compare(6780,2380,2950,8,42),'playEdgeFadeEnd':compare(7000,2380,2950,8,42),
   'steadyEarthControl':compare(7140,2380,2950,8,42),'lowerEarthControlVisibleOnly':compare(7000,3150,3460,8,42)}
 ramps={}
 for yy in (2380,2540,2750,2950,3130,3220,3340,3445):
  fixed=iy(yy)
  if not 0<=fixed<h:continue
  xs=[6780,6820,6870,6910,6955,7000,7050,7120,7200]
  values={x:list(im.getpixel((ix(x),fixed)))for x in xs if 0<=ix(x)<w}
  ramps[yy]={'sampledWorldY':v['top']+(fixed+.5)/z,'worldXtoActualRGB':values}
 assert crop[0]<crop[2] and crop[1]<crop[3] and probes['landmarkFadeEntry']['rowsObserved']>0
 return {'witnessWindowRawPixelLTRB':crop,'pixelProbeMethod':'actual unscaled device row RGB, diagnostics only, not an art pass','probes':probes,'fadeRampRows':ramps}
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
  # Reproduce the verified normal Stage26 title preload before Chapter21.
  assert page.evaluate("()=>HonroApp.screen==='title'&&!HonroCampaignLoader.has(2)")
  page.evaluate("()=>HonroCampaignLoader.prewarmNext(1)")
  drain(set(PREFETCH))
  assert page.evaluate("()=>HonroApp.screen==='title'&&!HonroCampaignLoader.has(2)")
  page.evaluate(LAUNCH,26)
  page.locator('#battlecanvas').wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
    return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=12000)
  page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
  keys={*PATHS.values(),*PREFETCH,'HONRO.html'}
  ref=ARCHIVE[f's26-{w}x{h}-east']
  normal=(ref['css'],ref['backing'],ref['focus'],ref['zoomLimits'],ref['phase'],ref['round'],ref['actorCount'],ref['sceneTime'],ref['tide'])
  for name in ('east-ordinary','east','west'):
   k=f's26-{w}x{h}-{name}';near=name=='east-ordinary';west=name=='west'
   row['attempt']=k;emit()
   q={'id':26,'mapId':'stage-26','name':'ordinary' if near else name,
      'ordinary':NEAR if near else None,'dx':-1 if west else 1,'dy':0,'readback':False}
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
    assert u['left']<=6650<6780<7000<7250<=u['right'] and u['top']<=2180<2250<2380<2950<3200<=u['bottom']
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
    rep['archiveKind']=ref['kind']
    rep['archiveExactRGBA']=rep['rawRGBASHA256']==ref['rgbaSHA256'] if west else None
    if west:
     emit()
     assert rep['archiveExactRGBA'],('published west min-zoom actual RGBA changed; diagnostic not certified',k)
   emit()
  row.pop('attempt',None);row['status']='EXACT_ORDINARY_AND_MINZOOM_OBSERVATIONS'
 except Exception as e:
  errs.append(['capture stopped',repr(e)]);row['status']='HOLD'
 finally:emit();ctx.close()
def run(out):
 from playwright.sync_api import sync_playwright
 result={'stage':26,'target':'Stage26 east stock F color fade / protected west control','status':'INIT','visits':[],'frames':{},
  'scope':'Public normal Chrome, fresh diagnostic profile and allowed camera pokes. No source/gameplay/input replay or edit; contrast is descriptive; real human visual verdict pending.'}
 try:
  known=gate(out)
  with sync_playwright()as pw:
   browser=pw.chromium.launch(headless=True);result['browser']=browser.version
   assert browser.version=='151.0.7922.34'
   for w,h in ((1440,900),(390,844)):capture(browser,out,known,w,h,result)
   browser.close()
  expect={f's26-{w}x{h}-{k}'for w,h in ((1440,900),(390,844))for k in ('east-ordinary','east','west')}
  assert set(result['frames'])==expect and all(v['status']=='EXACT_ORDINARY_AND_MINZOOM_OBSERVATIONS' for v in result['visits']), 'inspect exact partial receipts'
  assert facts(public('web/manifest.json'))==EXACT['web/manifest.json'],'served product drifted during capture'
  result['status']='PASS_STAGE26_OBSERVATION_ONLY_AIM1_NO_ART_VERDICT'
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
