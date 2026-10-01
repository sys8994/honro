(function(G){'use strict';
// World coordinates remain the game's existing units. A 1.8 m actor is roughly
// 108 world units; only scenery authored in metres uses this conversion.
const REFERENCE_SCALE=.66,WORLD_UNITS_PER_METER=60,D0_METERS=18;
const PRESETS={
 forest:{depths:{L1:0,L2:4,L3:14,L4:72},sky:true,tone:{L2:.74,L3:.53,L4:.29}},
 valley:{depths:{L1:0,L2:6,L3:22,L4:96},sky:true,tone:{L2:.76,L3:.52,L4:.32}},
 enclosed:{depths:{L1:0,L2:4,L3:13},sky:false,tone:{L2:.44,L3:.31}}
};
const SCENE_PRESETS={forest:'forest',temple:'enclosed',gate:'forest',river:'forest',valley:'valley',bridge:'valley',tree:'forest',shrine:'forest'};
const LAYERS=['L1','L2','L3','L4','L5'];
function preset(st){return PRESETS[st.environment?.preset||SCENE_PRESETS[st.backdrop]];}
function depth(st,layer){if(layer==='L5')return null;return preset(st)?.depths[layer];}
function factor(d,scale){const z=scale/REFERENCE_SCALE;return z/(1+z*d/D0_METERS);}
function ratio(st,layer,scale){const d=depth(st,layer);if(d===undefined||d===null)throw Error('Unavailable finite scenery layer '+layer);return factor(d,scale)/(scale/REFERENCE_SCALE);}
function screen(view,width,height,st,layer,p){const s=(view.scale??view.zoom)*ratio(st,layer,view.scale??view.zoom);return{x:width/2+(p.x-view.x)*s,y:height/2+(p.y-view.y)*s};}
function world(view,width,height,st,layer,p){const s=(view.scale??view.zoom)*ratio(st,layer,view.scale??view.zoom);return{x:view.x+(p.x-width/2)/s,y:view.y+(p.y-height/2)/s};}
function vectorScale(asset,instance,st,scale){const r=asset.reference,b=r.bounds;return WORLD_UNITS_PER_METER*r.heightM/(b.h)*(instance.scale??1)*scale*ratio(st,instance.depthLayer,scale);}
function screenBounds(asset,instance,view,w,h,st){const q=placementScreen(view,w,h,st,instance),z=vectorScale(asset,instance,st,view.scale??view.zoom),b=asset.reference.bounds,a=asset.reference.foot,angle=instance.rotation||0,cs=Math.cos(angle),sn=Math.sin(angle),points=[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]].map(([x,y])=>({x:q.x+((x-a.x)*cs-(y-a.y)*sn)*z,y:q.y+((x-a.x)*sn+(y-a.y)*cs)*z})),xs=points.map(p=>p.x),ys=points.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};}
function classifyLegacyElement(e){return 'L1';} // v3 map landmarks are attached to the authored battlefield, even `back`.
const ENV_ASSETS=[
 {id:'env:ridge',name:'먹빛 산등성이',category:'environment',visual:[{points:[{x:-800,y:0},{x:-730,y:-92},{x:-600,y:-157},{x:-510,y:-128},{x:-330,y:-294},{x:-202,y:-222},{x:-30,y:-366},{x:150,y:-273},{x:320,y:-331},{x:470,y:-194},{x:590,y:-221},{x:800,y:-45},{x:800,y:0}],fill:'#26373a',stroke:'#536560',lineWidth:1}],reference:{heightM:20,bounds:{x:-800,y:-366,w:1600,h:366},foot:{x:0,y:0},scaleRange:[.8,1.2],backgroundRange:[.8,1.2]}},
 {id:'env:cliff',name:'절벽 암면',category:'environment',visual:[{points:[{x:-200,y:0},{x:-192,y:-112},{x:-162,y:-188},{x:-94,y:-240},{x:-51,y:-207},{x:-15,y:-308},{x:63,y:-273},{x:101,y:-235},{x:165,y:-181},{x:190,y:-83},{x:205,y:700},{x:-200,y:700}],fill:'#374442',stroke:'#718076',lineWidth:1},{points:[{x:-157,y:-179},{x:-94,y:-240},{x:-51,y:-207},{x:-78,y:-99},{x:-126,y:-53}],fill:'#4a5550'},{points:[{x:31,y:-270},{x:99,y:-235},{x:146,y:-173},{x:84,y:-101}],fill:'#293736'}],reference:{heightM:20,bounds:{x:-200,y:-308,w:405,h:1008},foot:{x:0,y:0},scaleRange:[.75,1.25],backgroundRange:[.75,1.25]}},
 {id:'env:cloud',name:'밤구름',category:'environment',visual:[{points:[{x:-260,y:0},{x:-211,y:-30},{x:-157,y:-41},{x:-109,y:-76},{x:-20,y:-68},{x:38,y:-89},{x:139,y:-70},{x:196,y:-36},{x:260,y:0},{x:128,y:12},{x:12,y:7},{x:-150,y:15}],fill:'#263337'}],reference:{heightM:9,bounds:{x:-260,y:-89,w:520,h:104},foot:{x:0,y:0},scaleRange:[.8,1.2],backgroundRange:[.8,1.2]}}
];
function visualBounds(a){const pts=(a.visual||[]).flatMap(s=>s.points||[]);if(!pts.length)return a.bounds||{x:-100,y:-160,w:200,h:160};const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);return{x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};}
function referenceForLegacyAsset(a){const b=visualBounds(a),id=a.id||'',kind=a.kind||'';
 const heightM=id==='ancient_pine'?8:id==='dead_pine'?7.2:kind==='greatTree'?24:/Pine|pines|Tree|deadPines/i.test(kind)?9:/waterfall/i.test(kind)?15:/cliff/i.test(kind)?10:/hall|warehouse|Houses|Shrine|Gate|tower|Wall|Dock|Scaffold/i.test(kind)?5:a.category==='tree'?8:a.category==='architecture'?4.5:a.category==='rock'?2:a.category==='branch'?2:a.category==='vegetation'?.7:a.category==='prop'?1.5:4;
 return{heightM,bounds:b,foot:a.renderer==='landmark'?{x:a.anchor?.x||0,y:a.anchor?.y||0}:{x:a.anchor?.x||0,y:b.y+b.h},scaleRange:a.category==='native'?[.3,5]:a.category==='vegetation'?[.25,2]:[.4,4.5],backgroundRange:[.7,1.3]};
}
function legacyPlacements(st){const p=preset(st),out=[],sid=st.metadata?.stageId||1,wide=st.width,tall=st.height>4000;
 const hash=n=>{const t=Math.sin(n*17.917+sid*61.13)*43758.5453;return t-Math.floor(t);};
 const add=(layer,assetId,x,y,scale,group)=>out.push({id:`scenery-${st.id}-${out.length}`,assetId,depthLayer:layer,x:Math.round(x),y:Math.round(y),scale:+scale.toFixed(3),rotation:0,group});
 for(const layer of ['L3','L2'])if(p.depths[layer]!==undefined){const enclosed=!p.sky,step=enclosed?(layer==='L2'?1500:1000):(layer==='L2'?650:320),low=-4200,high=wide+4200;
  for(let i=Math.floor(low/step);i<=Math.ceil(high/step);i++){
   const x=i*step+(hash(i*11+(layer==='L2'?1:2))-.5)*step*.22,y=st.height*(layer==='L2'?.61:.53)+(hash(i*7+13)-.5)*110;
   const assetId=enclosed?'env:cliff':hash(i*19+29)<(sid===4?.38:.23)?'dead_pine':'ancient_pine';
   add(layer,assetId,x,y,.85+hash(i*13+41)*.30,`${layer}-grove-${Math.floor(i/5)}`);
   if(tall&&i%2===0)add(layer,assetId,x+step*.28,st.height*.31+(hash(i*23+7)-.5)*100,.83+hash(i*17+3)*.25,`${layer}-upper-${Math.floor(i/5)}`);
  }
 }
 if(p.depths.L4!==undefined){if(st.environment?.preset==='valley'||SCENE_PRESETS[st.backdrop]==='valley')for(let i=-2;i<=Math.ceil(wide/4600)+2;i++)
  add('L4','env:ridge',i*4600,st.height*.47+(hash(i*7+99)-.5)*70,.90+hash(i*11+43)*.18,'distant-ridge');
  for(let i=-3;i<=Math.ceil(wide/2200)+3;i++)add('L4','env:cloud',i*2200+850,st.height*.12+(hash(i*5+79)-.5)*120,.85+hash(i*9+17)*.25,'night-clouds');
 }return out;
}
function upgradeLegacy(project){for(const a of ENV_ASSETS)if(!project.library.some(v=>v.id===a.id))project.library.push(JSON.parse(JSON.stringify({...a,collision:[],anchor:{x:0,y:0},sockets:[],tags:['environment'],params:{}})));
 for(const a of project.library)if(!a.reference)a.reference=referenceForLegacyAsset(a);
 for(const st of project.stages){st.environment??={preset:SCENE_PRESETS[st.backdrop],placements:legacyPlacements(st)};for(const e of st.elements||[])e.depthLayer??=classifyLegacyElement(e);}
 return upgradeComposition(project);
}
// Composition does not change factor(d,z). Only a GROUP can select a vertical
// mapping; depth never adds a height offset. The game uses downward-positive y.
const VERSION=2,VERTICAL_MODES=['WORLD','SCENIC','HORIZON','SKY'];
const COVERAGE={minZoom:.16,maxViewport:{w:2560,h:1440},margin:240};
const FINISH={L1:{haze:0,detail:1},L2:{haze:.18,detail:1},L3:{haze:.48,detail:.5},L4:{haze:.76,detail:.2}};
const ATMOSPHERES={
 forest:{skyTop:'#0c1920',skyBottom:'#47564c',ambientTint:'#3e5147',hazeColor:'#56695f',hazeStrength:.65,nearFogColor:'#687c69',farFogColor:'#83918a',keyLightColor:'#d1c19a',keyLightDirection:[.76,.13],glowColor:'#d7cca7',shadowTint:'#142728',waterBaseColor:'#233d40',waterHighlightColor:'#9bb5a7',waterfallFoamColor:'#c0d0bb',mistStrength:.30,mistSpeed:9,lightStrength:.12},
 valley:{skyTop:'#101f2b',skyBottom:'#66777b',ambientTint:'#41575f',hazeColor:'#738a90',hazeStrength:.78,nearFogColor:'#8aa6a8',farFogColor:'#a1afb0',keyLightColor:'#d2d9cc',keyLightDirection:[.68,.09],glowColor:'#dae4d6',shadowTint:'#1b303c',waterBaseColor:'#284b56',waterHighlightColor:'#b0d1d0',waterfallFoamColor:'#d0e0d5',mistStrength:.43,mistSpeed:13,lightStrength:.16},
 enclosed:{skyTop:'#090f16',skyBottom:'#242e34',ambientTint:'#25333b',hazeColor:'#37424d',hazeStrength:.7,nearFogColor:'#667b7b',farFogColor:'#495c66',keyLightColor:'#ccb790',keyLightDirection:[.28,.04],glowColor:'#dab786',shadowTint:'#101c28',waterBaseColor:'#1b303a',waterHighlightColor:'#789393',waterfallFoamColor:'#9cafa8',mistStrength:.35,mistSpeed:5,lightStrength:.22},
 temple:{skyTop:'#211f2b',skyBottom:'#776c65',ambientTint:'#544f51',hazeColor:'#7c7774',hazeStrength:.67,nearFogColor:'#aa9e8d',farFogColor:'#968d86',keyLightColor:'#dbc196',keyLightDirection:[.72,.15],glowColor:'#e1be88',shadowTint:'#2c2b35',waterBaseColor:'#3a484b',waterHighlightColor:'#b6b9a6',waterfallFoamColor:'#c9cbb7',mistStrength:.25,mistSpeed:6,lightStrength:.14},
 burned:{skyTop:'#211c24',skyBottom:'#60554b',ambientTint:'#514b44',hazeColor:'#766c60',hazeStrength:.70,nearFogColor:'#918572',farFogColor:'#8c8279',keyLightColor:'#d3ae80',keyLightDirection:[.81,.12],glowColor:'#d4ad81',shadowTint:'#272a2c',waterBaseColor:'#344449',waterHighlightColor:'#9faeaa',waterfallFoamColor:'#b6c1b7',mistStrength:.22,mistSpeed:8,lightStrength:.10},
 otherworld:{skyTop:'#21192f',skyBottom:'#655161',ambientTint:'#554053',hazeColor:'#806b80',hazeStrength:.76,nearFogColor:'#a3889e',farFogColor:'#917f99',keyLightColor:'#c3b4ca',keyLightDirection:[.68,.17],glowColor:'#d0b6bf',shadowTint:'#242436',waterBaseColor:'#373649',waterHighlightColor:'#b5a6bd',waterfallFoamColor:'#cbbdcf',mistStrength:.31,mistSpeed:7,lightStrength:.13}
};
const ATMOSPHERE_BY_SCENE={forest:'forest',river:'forest',valley:'valley',bridge:'valley',gate:'burned',tree:'enclosed',temple:'enclosed',shrine:'temple'};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),smooth=t=>(t=clamp(t))*t*(3-2*t),copy=x=>JSON.parse(JSON.stringify(x));
function mixColor(a,b,t){const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));const aa=rgb(a),bb=rgb(b);return '#'+aa.map((v,i)=>Math.round(v+(bb[i]-v)*clamp(t)).toString(16).padStart(2,'0')).join('');}
function atmosphere(st,zone){const env=st.environment||{},base=env.atmosphere||{};return{...ATMOSPHERES[base.preset||ATMOSPHERE_BY_SCENE[st.backdrop]||'forest'],...base.overrides,...zone?.atmosphere};}
function zoneWeights(st,y){const zones=st.environment?.zones||[];const raw=zones.map((z,i)=>{let w=1;if(i)w*=smooth((y-(z.from-z.blend))/(2*z.blend));if(i<zones.length-1)w*=1-smooth((y-(z.to-z.blend))/(2*z.blend));return{zone:z,weight:w};}),sum=raw.reduce((n,r)=>n+r.weight,0);return raw.map(r=>({...r,weight:sum?r.weight/sum:0}));}
function atmosphereAt(st,y){const base=atmosphere(st),rows=zoneWeights(st,y);if(!rows.length)return base;const out={};for(const k of Object.keys(base)){if(typeof base[k]==='number')out[k]=rows.reduce((n,r)=>n+atmosphere(st,r.zone)[k]*r.weight,0);else if(typeof base[k]==='string'){const values=rows.map(r=>({v:atmosphere(st,r.zone)[k],w:r.weight}));out[k]='#'+[1,3,5].map(i=>Math.round(values.reduce((n,r)=>n+parseInt(r.v.slice(i,i+2),16)*r.w,0)).toString(16).padStart(2,'0')).join('');}else if(Array.isArray(base[k]))out[k]=base[k].map((_,i)=>rows.reduce((n,r)=>n+atmosphere(st,r.zone)[k][i]*r.weight,0));else out[k]=base[k];}return out;}
function assetRole(a){const id=a.id||'',k=a.kind||id;let role=a.environmentRole;
 if(!role)role=id==='env:cloud'?'cloud':id==='env:ridge'?'ridge':id==='env:cliff'?'cliff':id==='env:forest'?'forest':/waterfall/i.test(k)?'waterfall':/lantern|bell/i.test(k)?'light':/tree|pine/i.test(a.category+' '+k)?'tree':/rock|scree|cliff|stone/i.test(a.category+' '+k)?'rock':/architecture|hall|gate|shrine|hut|warehouse|tower|house/i.test(a.category+' '+k)?'building':/branch|fallenTree/i.test(a.category+' '+k)?'branch':/vegetation|fern|reed|grass/i.test(a.category+' '+k)?'vegetation':'prop';
 return{role,rooted:!['cloud','ridge','cliff','forest','branch'].includes(role),animation:role==='waterfall'?'flow':role==='light'?'glow':'static',strategy:role==='waterfall'?'cached-body/live-flow':'cached-vector'};
}
function surfaceY(surface,x){const pts=surface.points;if(x<=pts[0].x)return pts[0].y;for(let i=1;i<pts.length;i++)if(x<=pts[i].x){const a=pts[i-1],b=pts[i];return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}return pts.at(-1).y;}
function groupOf(st,e){return st.environment?.groups?.find(g=>g.id===e.groupId);}
function supportOf(st,e){return st.environment?.surfaces?.find(s=>s.id===e.supportId);}
function placementPosition(st,e){const g=groupOf(st,e),sf=supportOf(st,e);return{x:(g?.x||0)+e.x,y:(g?.y||0)+(sf?surfaceY(sf,e.x):0)+e.y};}
function groupTransform(view,w,h,st,g){if(g.verticalMode==='SKY')return{x:w*g.x,y:h*g.y,scale:1,opacity:1};const zoom=view.scale??view.zoom,s=zoom*ratio(st,g.depthLayer,zoom),env=st.environment,z=env.zones.find(z=>z.id===g.zoneId);let y;
 if(g.verticalMode==='WORLD')y=h/2+(g.y-view.y)*s;
 else {const from=z?.from??0,to=z?.to??st.height,t=smooth((view.y-from)/(to-from)),pair=g.verticalMode==='HORIZON'?(z?.horizon||[.47,.59]):(z?.scenic||[.76,.88]);y=h*(pair[0]+(pair[1]-pair[0])*t)+g.y*s;}
 return{x:w/2+(g.x-view.x)*s,y,scale:s,opacity:g.zoneId?(zoneWeights(st,view.y).find(r=>r.zone.id===g.zoneId)?.weight??0):1};
}
function placementScreen(view,w,h,st,e){const g=groupOf(st,e);if(!g)return screen(view,w,h,st,e.depthLayer,e);const t=groupTransform(view,w,h,st,g),sf=supportOf(st,e);return{x:t.x+e.x*t.scale,y:t.y+((sf?surfaceY(sf,e.x):0)+e.y)*t.scale};}
function groupWorld(view,w,h,st,groupId,p){const g=st.environment.groups.find(g=>g.id===groupId),t=groupTransform(view,w,h,st,g);return{x:(p.x-t.x)/t.scale,y:(p.y-t.y)/t.scale};}
function coveragePad(st,layer){const s=COVERAGE.minZoom*ratio(st,layer,COVERAGE.minZoom);return Math.ceil((COVERAGE.maxViewport.w/2+COVERAGE.margin)/s);}
function makeEnvironment(st,options={}){const sid=st.metadata?.stageId||1,presetName=options.preset||SCENE_PRESETS[st.backdrop]||'forest',env={version:VERSION,preset:presetName,atmosphere:{preset:sid===10?'otherworld':ATMOSPHERE_BY_SCENE[st.backdrop]||'forest'},zones:[],groups:[],surfaces:[],placements:[]},source={...st,environment:env},enclosed=presetName==='enclosed'||st.backdrop==='tree',vertical=st.height>=3300;
 if(enclosed)env.skyVisible=false;
 const cuts=vertical?[0,st.height*.37,st.height*.67,st.height]:[0,st.height],names=vertical?['upper-ridge','slope','valley-bottom']:['landscape'];
 const rng=n=>{const r=Math.sin(n*127.1+sid*311.7)*43758.5453;return r-Math.floor(r);};
 for(let i=0;i<cuts.length-1;i++)env.zones.push({id:names[i],from:cuts[i],to:cuts[i+1],blend:Math.min(320,st.height*.075),scenic:[.72,.86],horizon:[.43,.56],atmosphere:{mistStrength:ATMOSPHERES[env.atmosphere.preset].mistStrength*(i===2?1.25:i===0&&vertical?.7:1)}});
 const add=(g,assetId,x,supportId,scale=1,y=0)=>env.placements.push({id:`scenery-${st.id}-${env.placements.length}`,assetId,depthLayer:g.depthLayer,groupId:g.id,...(supportId?{supportId}:{}),x:Math.round(x),y,scale,rotation:0});
 // Long continuous surfaces provide coverage, not giant stretched tree sprites.
 for(const zone of env.zones)for(const layer of ['L4','L3','L2']){
  if(PRESETS[presetName].depths[layer]===undefined||enclosed&&layer==='L4')continue;
  const g={id:`${zone.id}-${layer}`,depthLayer:layer,verticalMode:layer==='L4'?'HORIZON':'SCENIC',zoneId:zone.id,x:0,y:0};env.groups.push(g);
  const pad=coveragePad(source,layer),step=layer==='L4'?1900:layer==='L3'?1000:700,points=[];
  for(let x=-pad,i=0;x<=st.width+pad+step;x+=step,i++){const height=layer==='L4'?1000:layer==='L3'?420:170;points.push({x,y:Math.round(-height*(.2+rng(i+layer.charCodeAt(1)*19+zone.from)*.8))});}
  const sf={id:g.id+'-support',groupId:g.id,kind:enclosed?'cave-wall':layer==='L4'?'ridge':zone.id==='valley-bottom'?'cliff':'rear-ground',points,bottom:Math.ceil(COVERAGE.maxViewport.h/(COVERAGE.minZoom*ratio(source,layer,COVERAGE.minZoom)))+2000};env.surfaces.push(sf);
  if(layer==='L4')continue;
  const stride=layer==='L3'?2300:1500;
  for(let x=Math.ceil(-pad/stride)*stride,i=0;x<st.width+pad;x+=stride,i++){
   if(enclosed&&layer==='L2')add(g,'env:rock',x,sf.id,1);
   else if(layer==='L3'&&!enclosed)add(g,'env:forest',x,sf.id,1);
   else if(!enclosed)add(g,rng(i+19)<(sid===4?.6:.18)?'dead_pine':'ancient_pine',Math.min(sf.points.at(-1).x,x+Math.round(rng(i+7)*330)),sf.id,.9+Math.round(rng(i+13)*20)/100);
  }
  if(layer==='L3'&&!enclosed){add(g,'env:shrine',st.width*.67,sf.id);add(g,'env:rock',st.width*.28,sf.id);}
  if(layer==='L2'&&enclosed)add(g,'lantern',st.width*.58,sf.id,1);
  if(layer==='L2'&&['valley','bridge'].includes(st.backdrop)&&zone.id!=='upper-ridge')add(g,'env:waterfall',st.width*.70,sf.id,1);
 }
 return env;
}
function makePlacements(st){return makeEnvironment(st).placements;}
function resize(st){const env=st.environment;if(!env?.zones)return;const oldHeight=env.zones.at(-1).to,k=st.height/oldHeight;for(const z of env.zones){z.from*=k;z.to*=k;z.blend*=k;}for(const sf of env.surfaces){const g=env.groups.find(g=>g.id===sf.groupId);if(!g)continue;const pad=coveragePad(st,g.depthLayer);sf.points[0].x=Math.min(sf.points[0].x,-pad-g.x);sf.points.at(-1).x=Math.max(sf.points.at(-1).x,st.width+pad-g.x);}}
function place(st,asset,c){const env=st.environment,layer=c.depthLayer||'L2',candidates=env.groups.filter(g=>g.depthLayer===layer&&g.verticalMode!=='SKY');let g=c.groupId?candidates.find(g=>g.id===c.groupId):candidates.find(g=>g.zoneId===c.zoneId)||candidates[0];if(!g)throw Error('Choose an existing scenic group on '+layer);
 const sf=c.supportId?env.surfaces.find(s=>s.id===c.supportId&&s.groupId===g.id):env.surfaces.find(s=>s.groupId===g.id);if(c.supportId&&!sf)throw Error('Invalid support or mismatched scenic group');if(assetRole(asset).rooted&&!sf)throw Error('Rooted scenery needs a support surface');
 return{id:c.id,assetId:asset.id,depthLayer:layer,groupId:g.id,...(sf?{supportId:sf.id}:{}),x:c.localX??(c.x||0)-g.x,y:c.offsetY??0,scale:c.scale??1,rotation:(c.rotation||0)*Math.PI/180};
}
function upgradeComposition(project){for(const a of COMPOSITION_ASSETS)if(!project.library.some(v=>v.id===a.id))project.library.push(copy(a));
 for(const st of project.stages){if(st.environment?.version===VERSION)continue;const old=st.environment;st.environment=makeEnvironment(st,{preset:PRESETS[old?.preset]?old.preset:undefined});const custom=(old?.placements||[]).filter(e=>!e.id?.startsWith(`scenery-${st.id}-`));
  for(const e of custom){const a=project.library.find(a=>a.id===e.assetId);if(a&&st.environment.groups.some(g=>g.depthLayer===e.depthLayer)){const placed=place(st,a,e);st.environment.placements.push(placed);(st.environment.migrationNotes??=[]).push(`${e.id}: attached to ${placed.supportId}; legacy world y=${e.y} replaced by surface root`);}else{st.environment.placements.push(e);(st.environment.migrationNotes??=[]).push(`${e.id}: unresolved legacy scenery; choose support/group explicitly`);}}
 }
 project.environmentVersion=VERSION;return project;
}
function environmentAsset(id,name,role,heightM,pts,extra=[]){const a={id,name,category:'environment',environmentRole:role,visual:[{points:pts.map(([x,y])=>({x,y})),fill:'#334b46'},...extra],collision:[],anchor:{x:0,y:0},sockets:[],tags:['environment'],params:{}};const b=visualBounds(a);a.reference={heightM,bounds:b,foot:{x:0,y:0},scaleRange:[.7,1.3],backgroundRange:[.7,1.3]};return a;}
const COMPOSITION_ASSETS=[
 environmentAsset('env:forest','능선 숲 덩어리','forest',12,[[-500,0],[-500,-64],[-442,-112],[-405,-97],[-373,-190],[-348,-146],[-291,-176],[-243,-255],[-216,-211],[-162,-232],[-132,-328],[-97,-252],[-44,-286],[-9,-237],[35,-252],[76,-203],[141,-225],[183,-161],[240,-204],[284,-148],[354,-163],[394,-92],[460,-110],[500,-56],[500,0]]),
 environmentAsset('env:rock','능선 화강암','rock',3.5,[[-105,0],[-119,-48],[-67,-123],[-12,-140],[74,-115],[117,-48],[95,0]],[{points:[{x:-67,y:-123},{x:-12,y:-140},{x:74,y:-115},{x:16,y:-53},{x:-43,y:-38}],fill:'#66716a'}]),
 environmentAsset('env:shrine','먼 산신당','building',6,[[-160,0],[-157,-19],[-112,-26],[-112,-153],[-172,-142],[-142,-164],[-70,-190],[0,-222],[76,-184],[138,-161],[169,-149],[110,-152],[110,-26],[153,-19],[158,0]],[{points:[{x:-109,y:-144},{x:108,y:-144},{x:108,y:-28},{x:-109,y:-28}],fill:'#615e50'},{points:[{x:-150,y:-151},{x:-60,y:-182},{x:0,y:-209},{x:77,y:-177},{x:151,y:-151}],fill:'#283b3e'},{points:[{x:-22,y:-113},{x:24,y:-113},{x:24,y:-27},{x:-22,y:-27}],fill:'#202d2e'}]),
 environmentAsset('env:waterfall','절벽 물줄기','waterfall',18,[[-100,0],[-91,520],[-128,540],[118,540],[88,519],[48,0]])
];
function validateComposition(st,byId,error){const env=st.environment||{},groups=env.groups||[],surfaces=env.surfaces||[],zones=env.zones||[];
 if(env.version!==VERSION)error(`${st.id}: missing composition version`);
 if(!ATMOSPHERES[env.atmosphere?.preset])error(`${st.id}: missing environment atmosphere preset`);
 const checkAtmosphere=(value,label)=>{for(const [k,v]of Object.entries(value||{})){const base=ATMOSPHERES.forest[k];if(base===undefined||typeof base==='string'&&!/^#[0-9a-f]{6}$/i.test(v)||typeof base==='number'&&(!Number.isFinite(v)||v<0||v>(k==='mistSpeed'?40:1))||Array.isArray(base)&&(!Array.isArray(v)||v.length!==2||v.some(n=>!Number.isFinite(n)||n<0||n>1)))error(`${st.id}/${label}: invalid atmosphere ${k}`);}};checkAtmosphere(env.atmosphere?.overrides,'preset');for(const z of zones)checkAtmosphere(z.atmosphere,z.id);
 const unique=(items,label)=>{const ids=new Set();for(const a of items){if(!a.id||ids.has(a.id))error(`${st.id}: duplicate/missing ${label} ${a.id}`);ids.add(a.id);}};unique(groups,'scenic group');unique(surfaces,'support');unique(zones,'zone');
 unique([...groups,...surfaces,...zones,...(env.placements||[]),...(st.elements||[]),...(st.units||[]),...(st.terrains||[]),...(st.events||[]),...(st.markers||[])],'environment/content ID');
 if(!zones.length||zones[0].from!==0||zones.at(-1).to!==st.height)error(`${st.id}: invalid zone coverage`);
 zones.forEach((z,i)=>{if(!Number.isFinite(z.from)||!Number.isFinite(z.to)||!(z.to>z.from)||!(z.blend>0)||z.blend>(z.to-z.from)/2||i&&Math.abs(z.from-zones[i-1].to)>.001)error(`${st.id}/${z.id}: invalid zone transition`);for(const mode of ['scenic','horizon'])if(!Array.isArray(z[mode])||z[mode].length!==2||z[mode].some(v=>!Number.isFinite(v)||v<0||v>1))error(`${st.id}/${z.id}: invalid ${mode} envelope`);});
 for(const g of groups){if(!VERTICAL_MODES.includes(g.verticalMode))error(`${st.id}/${g.id}: unsupported vertical mode`);if(g.zoneId&&!zones.some(z=>z.id===g.zoneId))error(`${st.id}/${g.id}: invalid background zone`);if(!Number.isFinite(g.x)||!Number.isFinite(g.y)||depth(st,g.depthLayer)===undefined)error(`${st.id}/${g.id}: invalid scenic group depth/position`);if(g.verticalMode==='SKY'&&g.depthLayer!=='L5'||g.depthLayer==='L5'&&g.verticalMode!=='SKY')error(`${st.id}/${g.id}: SKY requires L5`);}
 for(const sf of surfaces){const g=groups.find(g=>g.id===sf.groupId);if(!g){error(`${st.id}/${sf.id}: invalid scenic group`);continue;}if(!Array.isArray(sf.points)||sf.points.length<2||sf.points.some((p,i)=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||i&&p.x<=sf.points[i-1].x)||!Number.isFinite(sf.bottom)||sf.bottom<=Math.max(...(sf.points||[]).map(p=>p.y))){error(`${st.id}/${sf.id}: invalid support geometry`);continue;}if(['SCENIC','HORIZON'].includes(g.verticalMode)){const pad=coveragePad(st,g.depthLayer),s=COVERAGE.minZoom*ratio(st,g.depthLayer,COVERAGE.minZoom);if(sf.points[0].x+g.x>-pad||sf.points.at(-1).x+g.x<st.width+pad||(sf.bottom+g.y)*s<COVERAGE.maxViewport.h)error(`${st.id}/${sf.id}: background coverage insufficient for max zoom`);}}
 for(const e of env.placements||[]){const a=byId.get(e.assetId),g=groups.find(g=>g.id===e.groupId),sf=surfaces.find(s=>s.id===e.supportId);if(!g)error(`${st.id}/${e.id}: invalid scenic group`);else if(g.depthLayer!==e.depthLayer)error(`${st.id}/${e.id}: child depth differs from scenic group`);if(e.supportId&&!sf)error(`${st.id}/${e.id}: invalid support id`);if(sf&&sf.groupId!==e.groupId)error(`${st.id}/${e.id}: support belongs to another group`);if(a&&assetRole(a).rooted&&!sf)error(`${st.id}/${e.id}: rooted object without support`);if(sf&&(e.x<sf.points[0]?.x||e.x>sf.points.at(-1)?.x))error(`${st.id}/${e.id}: root outside support`);if(a&&assetRole(a).rooted&&Math.abs(e.y)>WORLD_UNITS_PER_METER*a.reference?.heightM*.025)error(`${st.id}/${e.id}: root detached from support by attachment offset`);if(!Number.isFinite(e.rotation))error(`${st.id}/${e.id}: invalid orientation`);if('verticalMode'in e)error(`${st.id}/${e.id}: vertical mode belongs to scenic group`);}
 const visit=(o,path)=>{if(!o||typeof o!=='object')return;for(const [k,v]of Object.entries(o)){if(/^(parallax|parallaxX|parallaxY|depthPan|yFactor|zoomFactor)$/i.test(k))error(`${path}: old arbitrary parallax factor ${k}`);if(typeof v==='object')visit(v,path+'/'+k);}};visit(env,st.id);
}
function validate(project){const issues=[],error=text=>issues.push({level:'err',text}),byId=new Map(project.library.map(a=>[a.id,a]));
 for(const a of project.library){const r=a.reference,b=r?.bounds;
  if(!r||!Number.isFinite(r.heightM)||r.heightM<=0||!b||!Number.isFinite(b.x)||!Number.isFinite(b.y)||!(b.w>0)||!(b.h>0)||!Number.isFinite(r.foot?.x)||!Number.isFinite(r.foot?.y))error(`${a.id}: missing/invalid reference height, bounds or foot`);
  if(!Array.isArray(r?.scaleRange)||r.scaleRange.length!==2||!(r.scaleRange[0]>0)||r.scaleRange[1]<r.scaleRange[0])error(`${a.id}: invalid physical scale range`);
  if(!Array.isArray(r?.backgroundRange)||r.backgroundRange.length!==2||!(r.backgroundRange[0]>0)||r.backgroundRange[1]<r.backgroundRange[0]||r.backgroundRange[0]<r.scaleRange?.[0]||r.backgroundRange[1]>r.scaleRange?.[1])error(`${a.id}: missing/invalid background scale range`);
  if(b)for(const point of (a.visual||[]).flatMap(s=>s.points||[]))if(point.x<b.x-.001||point.x>b.x+b.w+.001||point.y<b.y-.001||point.y>b.y+b.h+.001){error(`${a.id}: vector extends outside reference bounds`);break;}
 }
 for(const st of project.stages){const p=preset(st),ids=new Set();if(!p)error(`${st.id}: missing/invalid environment preset`);
  for(const e of st.elements||[]){if(e.depthLayer!=='L1')error(`${st.id}/${e.id}: battlefield element must be L1`);if(!st.layers?.some(l=>l.id===e.layer))error(`${st.id}/${e.id}: unregistered draw layer ${e.layer}`);const a=byId.get(e.assetId);if(a?.reference&&(!Number.isFinite(e.scale)||e.scale<a.reference.scaleRange[0]||e.scale>a.reference.scaleRange[1]))error(`${st.id}/${e.id}: scale outside ${a.id} range`);}
  for(const e of st.environment?.placements||[]){const a=byId.get(e.assetId);if(!a)error(`${st.id}/${e.id}: missing scenery asset ${e.assetId}`);if(!e.id||ids.has(e.id)||st.elements.some(x=>x.id===e.id))error(`${st.id}/${e.id}: duplicate/missing scenery ID`);ids.add(e.id);
   if(!st.layers?.some(l=>l.id===e.depthLayer))error(`${st.id}/${e.id}: unregistered editor layer ${e.depthLayer}`);
   if(!e.id||!LAYERS.includes(e.depthLayer)||e.depthLayer==='L1'||e.depthLayer==='L5'||p?.depths[e.depthLayer]===undefined)error(`${st.id}/${e.id}: invalid scenery layer ${e.depthLayer}`);
   if(a?.collision?.length||a?.interactionType)error(`${st.id}/${e.id}: interactive/colliding scenery outside L1`);
   if(!Number.isFinite(e.x)||!Number.isFinite(e.y))error(`${st.id}/${e.id}: invalid scenery position`);
   const range=a?.reference?.backgroundRange;if(a?.reference&&(!Number.isFinite(e.scale)||e.scale<a.reference.scaleRange[0]||e.scale>a.reference.scaleRange[1]||range&&(e.scale<range[0]||e.scale>range[1])))error(`${st.id}/${e.id}: scale outside ${a.id} background range`);
  }
  if(!st.environment||!Array.isArray(st.environment.placements))error(`${st.id}: missing scenery placements`);
  validateComposition(st,byId,error);
 }
 return issues;
}
G.HonroEnvironment={VERSION,REFERENCE_SCALE,WORLD_UNITS_PER_METER,D0_METERS,PRESETS,SCENE_PRESETS,LAYERS,preset,depth,factor,ratio,screen,world,vectorScale,screenBounds,classifyLegacyElement,referenceForLegacyAsset,makePlacements,makeEnvironment,resize,upgradeLegacy,upgradeComposition,validate,VERTICAL_MODES,COVERAGE,FINISH,ATMOSPHERES,ATMOSPHERE_BY_SCENE,mixColor,atmosphere,atmosphereAt,zoneWeights,assetRole,surfaceY,groupOf,supportOf,placementPosition,placementScreen,groupTransform,groupWorld,coveragePad,place};
})(globalThis);
