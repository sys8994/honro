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
function screenBounds(asset,instance,view,w,h,st){const q=screen(view,w,h,st,instance.depthLayer,instance),z=vectorScale(asset,instance,st,view.scale??view.zoom),b=asset.reference.bounds,a=asset.reference.foot;return{x:q.x+(b.x-a.x)*z,y:q.y+(b.y-a.y)*z,w:b.w*z,h:b.h*z};}
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
function makePlacements(st){const p=preset(st),out=[],sid=st.metadata?.stageId||1,wide=st.width,tall=st.height>4000;
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
 for(const st of project.stages){st.environment??={preset:SCENE_PRESETS[st.backdrop],placements:makePlacements(st)};for(const e of st.elements||[])e.depthLayer??=classifyLegacyElement(e);}
 project.environmentVersion=1;return project;
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
 }
 return issues;
}
G.HonroEnvironment={REFERENCE_SCALE,WORLD_UNITS_PER_METER,D0_METERS,PRESETS,SCENE_PRESETS,LAYERS,preset,depth,factor,ratio,screen,world,vectorScale,screenBounds,classifyLegacyElement,referenceForLegacyAsset,makePlacements,upgradeLegacy,validate};
})(globalThis);
