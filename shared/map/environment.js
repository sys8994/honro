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
function screen(view,width,height,st,layer,p){const zoom=view.scale??view.zoom,s=zoom*ratio(st,layer,zoom);return{x:width/2+(p.x-view.x)*s,y:height/2+(p.y-view.y)*zoom};}
function world(view,width,height,st,layer,p){const zoom=view.scale??view.zoom,s=zoom*ratio(st,layer,zoom);return{x:view.x+(p.x-width/2)/s,y:view.y+(p.y-height/2)/zoom};}
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
// Finite groups share the battlefield's vertical camera response. Depth changes
// their horizontal pan and apparent size, never the camera-height response.
const VERSION=4,VERTICAL_MODES=['WORLD','SKY'];
const COVERAGE={minZoom:.16,maxViewport:{w:2560,h:1440},margin:240};
const FINISH={L1:{haze:0,detail:1},L2:{haze:.18,detail:1},L3:{haze:.48,detail:.5},L4:{haze:.76,detail:.2}};
// The painted SKY is a distant panorama, not a finite WORLD support. Its small
// camera drift is deliberately independent of the L1-L4 projection and zoom.
const ACT1_FAR={saturation:.45,brightness:{mountains:.80,gorge:.76},veil:'#1b2730',veilOpacity:.08,panX:.025,panY:.0035,marginX:.022,marginY:.007};
function act1Mood(stage){const n=Number(stage);if(!Number.isInteger(n)||n<1||n>10)return null;const t=(n-1)/9;
 return{stage:n,variant:n<6?'mountains':'gorge',tint:mixColor('#83968f','#52627e',t),opacity:.03+t*.12};}
function act1BackdropFrame(view,w,h,b,iw=1600,ih=900){const mx=w*ACT1_FAR.marginX,my=h*ACT1_FAR.marginY,
 s=Math.max((w+2*mx)/iw,(h+2*my)/ih),dw=iw*s,dh=ih*s,
 offsetX=-mx*Math.tanh(((view.x??b.width*.5)-b.width*.5)*ACT1_FAR.panX/mx),
 offsetY=-my*Math.tanh(((view.y??b.height*.5)-b.height*.5)*ACT1_FAR.panY/my),anchor=w/h>=.9?.98:.5;
 return{x:-mx-(dw-w-2*mx)*anchor+offsetX,y:-my-(dh-h-2*my)*.28+offsetY,w:dw,h:dh,offsetX,offsetY};}
const ATMOSPHERES={
 forest:{skyTop:'#0c1920',skyBottom:'#47564c',ambientTint:'#3e5147',hazeColor:'#56695f',hazeStrength:.65,nearFogColor:'#687c69',farFogColor:'#83918a',keyLightColor:'#d1c19a',keyLightDirection:[.76,.13],glowColor:'#d7cca7',shadowTint:'#142728',waterBaseColor:'#233d40',waterHighlightColor:'#9bb5a7',waterfallFoamColor:'#c0d0bb',mistStrength:.30,mistSpeed:9,lightStrength:.12},
 valley:{skyTop:'#101f2b',skyBottom:'#66777b',ambientTint:'#41575f',hazeColor:'#738a90',hazeStrength:.78,nearFogColor:'#8aa6a8',farFogColor:'#a1afb0',keyLightColor:'#d2d9cc',keyLightDirection:[.68,.09],glowColor:'#dae4d6',shadowTint:'#1b303c',waterBaseColor:'#334b4d',waterHighlightColor:'#ced4c5',waterfallFoamColor:'#dce0d0',mistStrength:.43,mistSpeed:13,lightStrength:.16},
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
function groupTransform(view,w,h,st,g){if(g.verticalMode==='SKY')return{x:w*g.x,y:h*g.y,scale:1,opacity:1};const zoom=view.scale??view.zoom,s=zoom*ratio(st,g.depthLayer,zoom);
 return{x:w/2+(g.x-view.x)*s,y:h/2+(g.y-view.y)*zoom,scale:s,opacity:1};
}
function placementScreen(view,w,h,st,e){const g=groupOf(st,e);if(!g)return screen(view,w,h,st,e.depthLayer,e);const t=groupTransform(view,w,h,st,g),sf=supportOf(st,e);return{x:t.x+e.x*t.scale,y:t.y+((sf?surfaceY(sf,e.x):0)+e.y)*t.scale};}
function groupWorld(view,w,h,st,groupId,p){const g=st.environment.groups.find(g=>g.id===groupId),t=groupTransform(view,w,h,st,g);return{x:(p.x-t.x)/t.scale,y:(p.y-t.y)/t.scale};}
function coveragePad(st,layer){const s=COVERAGE.minZoom*ratio(st,layer,COVERAGE.minZoom);return Math.ceil((COVERAGE.maxViewport.w/2+COVERAGE.margin)/s);}
// The far ridge is one authored landform per height band, not a row of ridge
// stamps. Broad peaks leave sky between them and remain legible at minimum zoom.
function mountainHeight(x,width,seed){const w=Math.max(width,3600),peaks=[[-.16,.35,690],[.28,.31,1200],[.73,.27,950],[1.16,.37,620]];
 return 250+peaks.reduce((height,[center,spread,rise])=>height+rise*Math.exp(-Math.pow((x/w-center-(seed%3-1)*.025)/spread,2)),0);
}
// The valley has one cropped, rain-dark granite peak. Its broad shoulders and
// abrupt vertical crown are composed deliberately, rather than sampled noise.
const GRANITE_PROFILE=[[-.55,420],[-.28,600],[0,1050],[.14,1330],[.29,1510],[.37,1740],[.43,2110],[.475,2020],[.51,2260],[.55,1900],[.62,1650],[.71,1250],[.83,1160],[1,1290],[1.25,760],[1.6,460]];
function graniteHeight(x,width){const u=x/Math.max(width,3600);for(let i=1;i<GRANITE_PROFILE.length;i++)if(u<=GRANITE_PROFILE[i][0]){const [ax,ay]=GRANITE_PROFILE[i-1],[bx,by]=GRANITE_PROFILE[i],t=clamp((u-ax)/(bx-ax));return ay+(by-ay)*t;}return GRANITE_PROFILE.at(-1)[1];}
function scenicPurpose(sid,backdrop,band,layer){
 if(layer==='L4')return !['tree','temple'].includes(backdrop)&&(['valley','bridge'].includes(backdrop)?band===0:band<2);
 if(layer==='L3')return sid===3||sid===7||[2,5,6,8,9,10].includes(sid)&&band>0;
 if(layer==='L2')return sid===3||sid===7&&band===2||[2,5,6].includes(sid)&&band>0;
 return false;
}
function makeEnvironment(st,options={}){const sid=st.metadata?.stageId||1,presetName=options.preset||SCENE_PRESETS[st.backdrop]||'forest',env={version:VERSION,preset:presetName,atmosphere:{preset:sid===10?'otherworld':ATMOSPHERE_BY_SCENE[st.backdrop]||'forest'},zones:[],groups:[],surfaces:[],placements:[]},source={...st,environment:env},enclosed=presetName==='enclosed'||st.backdrop==='tree',vertical=st.height>=3300;
 if(enclosed)env.skyVisible=false;
 const cuts=vertical?[0,st.height*.37,st.height*.67,st.height]:[0,st.height],names=vertical?['upper-ridge','slope','valley-bottom']:['landscape'];
 const rng=n=>{const r=Math.sin(n*127.1+sid*311.7)*43758.5453;return r-Math.floor(r);};
 for(let i=0;i<cuts.length-1;i++)env.zones.push({id:names[i],from:cuts[i],to:cuts[i+1],blend:Math.min(320,st.height*.075),atmosphere:{mistStrength:ATMOSPHERES[env.atmosphere.preset].mistStrength*(i===2?1.25:i===0&&vertical?.7:1)}});
 const add=(g,assetId,x,supportId,scale=1,y=0)=>env.placements.push({id:`scenery-${st.id}-${env.placements.length}`,assetId,depthLayer:g.depthLayer,groupId:g.id,...(supportId?{supportId}:{}),x:Math.round(x),y,scale,rotation:0});
 // Each band occupies a fixed world height. Long supported terrain overlaps the
 // adjacent bands; a camera pan never moves or fades a band independently.
 for(const [band,zone] of env.zones.entries())for(const layer of ['L4','L3','L2']){
  if(PRESETS[presetName].depths[layer]===undefined||enclosed&&layer==='L4'||vertical&&band===env.zones.length-1&&layer==='L4'||!scenicPurpose(sid,st.backdrop,band,layer))continue;
  const span=zone.to-zone.from,base=vertical?(band===0?zone.to-Math.min(300,span*.20):band===env.zones.length-1?zone.from-160:zone.from+span*.55):st.height*.49;
  const lift=layer==='L4'?(vertical?100:st.height*.07):enclosed?(layer==='L3'?200:250):vertical&&band===0?(layer==='L2'?120:150):layer==='L3'?470:260;
  const g={id:`${zone.id}-${layer}`,depthLayer:layer,verticalMode:'WORLD',zoneId:zone.id,x:0,y:Math.round(base+lift)};env.groups.push(g);
  const granite=layer==='L4'&&['valley','bridge'].includes(st.backdrop),pad=coveragePad(source,layer),step=layer==='L4'?700:layer==='L3'?1100:650,points=[];
  const xs=[];for(let x=-pad;x<=st.width+pad+step;x+=step)xs.push(x);
  if(granite)for(const [u] of GRANITE_PROFILE)if(u>=0&&u<=1)xs.push(Math.round(u*st.width));
  xs.sort((a,b)=>a-b);
  for(const [i,x] of xs.entries()){
   const u=clamp(x/Math.max(1,st.width)),valley=['valley','bridge'].includes(st.backdrop)?-Math.abs(u-.52)*1250:0;
   const roll=Math.sin(u*5.4+band*.7+sid*.31)*155+Math.sin(u*9.8+sid*.7)*68;
   const height=layer==='L4'?470:layer==='L3'?260:125;
   points.push({x,y:layer==='L4'?Math.round(-(granite?graniteHeight(x,st.width):mountainHeight(x,st.width,sid+band))+(granite?0:Math.sin(x/1300+sid*.7)*24)):Math.round(-height+valley*(layer==='L2'?.60:1)+roll*(layer==='L3'?1.2:1)+rng(i+band*23+layer.charCodeAt(1)*19)*24)});
  }
  const foothill=layer==='L3'&&['valley','bridge'].includes(st.backdrop);
  const sf={id:g.id+'-support',groupId:g.id,kind:granite?'ink-granite':foothill?'ink-foothill':layer==='L4'?'ink-mountain':enclosed?'cave-wall':zone.id==='valley-bottom'?'cliff':'rear-ground',...(granite||foothill?{compositionWidth:st.width,inkVariant:band}:{}),points,bottom:st.height+Math.ceil(COVERAGE.maxViewport.h/(COVERAGE.minZoom*ratio(source,layer,COVERAGE.minZoom)))+2200};env.surfaces.push(sf);
  if(layer==='L4')continue;
  const stride=layer==='L3'?Math.max(2300,st.width*.48):Math.max(2200,st.width*.55);
  for(let x=Math.ceil(-pad/stride)*stride,i=0;x<st.width+pad;x+=stride,i++){
   if(enclosed&&layer==='L2'&&i%3===band%3)add(g,'env:rock',x,sf.id,1);
   else if(enclosed&&layer==='L3'&&i%3===band%3)add(g,'env:cliff',x,sf.id,.95);
   else if(layer==='L3'&&!enclosed&&[3,9].includes(sid)&&i%3===band%3)add(g,'env:forest',x,sf.id,1);
   else if(layer==='L2'&&!enclosed&&sid===3&&i%3===0)add(g,'ancient_pine',Math.min(sf.points.at(-1).x,x+Math.round(rng(i+7)*330)),sf.id,1);
   else if(layer==='L2'&&!enclosed&&sid!==3&&i%3===band%3)add(g,'env:rock',x,sf.id,1);
  }
  if(layer==='L3'&&!enclosed&&['shrine','temple'].includes(st.backdrop))add(g,'env:shrine',st.width*.67,sf.id);
  if(layer==='L3'&&!enclosed&&['valley','bridge'].includes(st.backdrop))for(const x of [st.width*.16,st.width*.83])add(g,'env:cliff',x,sf.id,.9);
  if(layer==='L2'&&enclosed&&sid===7)add(g,'lantern',st.width*.58,sf.id,1);
  if(layer==='L2'&&['valley','bridge'].includes(st.backdrop))add(g,'env:waterfall',st.width*.70,sf.id,1);
 }
 return env;
}
function makePlacements(st){return makeEnvironment(st).placements;}
function resize(st){const env=st.environment;if(!env?.zones)return;const oldHeight=env.zones.at(-1).to,k=st.height/oldHeight;for(const z of env.zones){z.from*=k;z.to*=k;z.blend*=k;}for(const g of env.groups)if(g.verticalMode!=='SKY')g.y*=k;for(const sf of env.surfaces){const g=env.groups.find(g=>g.id===sf.groupId);if(!g)continue;const pad=coveragePad(st,g.depthLayer);sf.points[0].x=Math.min(sf.points[0].x,-pad-g.x);sf.points.at(-1).x=Math.max(sf.points.at(-1).x,st.width+pad-g.x);sf.bottom*=k;}}
function place(st,asset,c){const env=st.environment,layer=c.depthLayer||'L2',candidates=env.groups.filter(g=>g.depthLayer===layer&&g.verticalMode!=='SKY');let g=c.groupId?candidates.find(g=>g.id===c.groupId):candidates.find(g=>g.zoneId===c.zoneId)||candidates[0];if(!g)throw Error('Choose an existing scenic group on '+layer);
 const sf=c.supportId?env.surfaces.find(s=>s.id===c.supportId&&s.groupId===g.id):env.surfaces.find(s=>s.groupId===g.id);if(c.supportId&&!sf)throw Error('Invalid support or mismatched scenic group');if(assetRole(asset).rooted&&!sf)throw Error('Rooted scenery needs a support surface');
 return{id:c.id,assetId:asset.id,depthLayer:layer,groupId:g.id,...(sf?{supportId:sf.id}:{}),x:c.localX??(c.x||0)-g.x,y:c.offsetY??0,scale:c.scale??1,rotation:c.rotationRadians??(c.rotation||0)*Math.PI/180};
}
function upgradeComposition(project){for(const a of [...ENV_ASSETS,...COMPOSITION_ASSETS])if(!project.library.some(v=>v.id===a.id))project.library.push(copy({...a,collision:[],anchor:{x:0,y:0},sockets:[],tags:['environment'],params:{}}));
 for(const st of project.stages){if(st.environment?.version===VERSION)continue;const old=st.environment;st.environment=makeEnvironment(st,{preset:PRESETS[old?.preset]?old.preset:undefined});if(ATMOSPHERES[old?.atmosphere?.preset])st.environment.atmosphere=copy(old.atmosphere);if(old?.hiddenLayers)st.environment.hiddenLayers=copy(old.hiddenLayers);if(old?.skyVisible===false)st.environment.skyVisible=false;
  for(const zone of st.environment.zones){const previous=old?.zones?.find(z=>z.id===zone.id);if(previous?.atmosphere)zone.atmosphere={...zone.atmosphere,...copy(previous.atmosphere)};}
  for(const group of old?.groups||[])if(!st.environment.groups.some(g=>g.id===group.id)&&!old.zones?.some(z=>group.id===`${z.id}-${group.depthLayer}`)){
   const oldZone=old.zones?.find(z=>z.id===group.zoneId),mid=oldZone?(oldZone.from+oldZone.to)/2:st.height*.5,zone=st.environment.zones.find(z=>z.id===group.zoneId)||st.environment.zones.find(z=>z.from<=mid&&mid<=z.to)||st.environment.zones[0],anchor=st.environment.groups.find(g=>g.zoneId===zone?.id&&g.depthLayer===group.depthLayer);
   const migrated={...copy(group),zoneId:zone?.id,verticalMode:group.verticalMode==='SKY'?'SKY':'WORLD',y:group.verticalMode==='WORLD'||group.verticalMode==='SKY'?group.y:(anchor?.y||0)+group.y};
   st.environment.groups.push(migrated);(st.environment.migrationNotes??=[]).push(`${group.id}: authored group anchored at world y=${migrated.y}`);
  }
  for(const surface of old?.surfaces||[])if(!st.environment.surfaces.some(s=>s.id===surface.id)&&st.environment.groups.some(g=>g.id===surface.groupId))st.environment.surfaces.push(copy(surface));
  const custom=(old?.placements||[]).filter(e=>!e.id?.startsWith(`scenery-${st.id}-`));
  // A newly sparse map may omit a depth that an older authored scene used.
  // Restore a support for that depth before reattaching custom scenery.
  for(const e of custom)if(!st.environment.groups.some(g=>g.depthLayer===e.depthLayer)&&PRESETS[st.environment.preset]?.depths[e.depthLayer]!==undefined){
   const previous=old?.groups?.find(g=>g.id===e.groupId),zone=st.environment.zones.find(z=>z.id===previous?.zoneId)||st.environment.zones[0],pad=coveragePad(st,e.depthLayer),id=previous?.id||`${zone.id}-${e.depthLayer}`;
   const group=previous?{...copy(previous),verticalMode:'WORLD',zoneId:zone.id}:{id,depthLayer:e.depthLayer,verticalMode:'WORLD',zoneId:zone.id,x:0,y:Math.round((zone.from+zone.to)/2)};
   st.environment.groups.push(group);
   const support=old?.surfaces?.find(s=>s.groupId===id),bottom=st.height+Math.ceil(COVERAGE.maxViewport.h/(COVERAGE.minZoom*ratio(st,e.depthLayer,COVERAGE.minZoom)))+2200;
   st.environment.surfaces.push(support?copy(support):{id:id+'-support',groupId:id,kind:'rear-ground',points:[{x:-pad,y:-120},{x:st.width+pad,y:-120}],bottom});
   (st.environment.migrationNotes??=[]).push(`${e.id}: restored authored ${e.depthLayer} support`);
  }
  for(const e of custom){const a=project.library.find(a=>a.id===e.assetId);if(a&&st.environment.groups.some(g=>g.depthLayer===e.depthLayer)){const oldGroup=old?.groups?.find(g=>g.id===e.groupId),placed=place(st,a,{...e,zoneId:oldGroup?.zoneId,localX:e.x,offsetY:old?.version>=2?e.y:0,rotationRadians:e.rotation||0});st.environment.placements.push(placed);(st.environment.migrationNotes??=[]).push(`${e.id}: attached to ${placed.supportId}; old backdrop position replaced by world support`);}else{st.environment.placements.push(e);(st.environment.migrationNotes??=[]).push(`${e.id}: unresolved legacy scenery; choose support/group explicitly`);}}
 }
 project.environmentVersion=VERSION;return project;
}
function environmentAsset(id,name,role,heightM,pts,extra=[]){const a={id,name,category:'environment',environmentRole:role,visual:[{points:pts.map(([x,y])=>({x,y})),fill:'#334b46'},...extra],collision:[],anchor:{x:0,y:0},sockets:[],tags:['environment'],params:{}};const b=visualBounds(a);a.reference={heightM,bounds:b,foot:{x:0,y:0},scaleRange:[.7,1.3],backgroundRange:[.7,1.3]};return a;}
const plane=(points,fill)=>({points:points.map(([x,y])=>({x,y})),fill});
const COMPOSITION_ASSETS=[
 environmentAsset('env:forest','능선 숲 덩어리','forest',12,[[-500,0],[-500,-64],[-442,-112],[-405,-97],[-373,-190],[-348,-146],[-291,-176],[-243,-255],[-216,-211],[-162,-232],[-132,-328],[-97,-252],[-44,-286],[-9,-237],[35,-252],[76,-203],[141,-225],[183,-161],[240,-204],[284,-148],[354,-163],[394,-92],[460,-110],[500,-56],[500,0]],[
  plane([[-500,-64],[-405,-97],[-373,-190],[-348,-146],[-291,-176],[-243,-255],[-216,-211],[-162,-232],[-132,-328],[-97,-252],[-44,-286],[-9,-237],[35,-252],[76,-203],[141,-225],[183,-161],[240,-204],[284,-148],[354,-163],[394,-92],[460,-110],[500,-56],[365,-105],[185,-115],[-12,-140],[-211,-112],[-390,-76]],'#4c6656'),
  plane([[-500,-7],[-383,-30],[-275,-17],[-148,-61],[-10,-43],[120,-79],[280,-48],[500,-18],[500,0],[-500,0]],'#223b39'),
  plane([[-362,-100],[-299,-166],[-254,-145],[-220,-209],[-170,-189],[-132,-272],[-74,-220],[-13,-222],[37,-193],[68,-203],[132,-161],[160,-116],[-32,-139],[-222,-129]],'#71806a'),
  plane([[65,-115],[145,-195],[187,-155],[239,-197],[284,-140],[344,-154],[390,-88],[259,-108],[163,-98]],'#314d48')]),
 environmentAsset('env:rock','능선 화강암','rock',3.5,[[-105,0],[-119,-48],[-67,-123],[-12,-140],[74,-115],[117,-48],[95,0]],[
  plane([[-105,0],[-119,-48],[-67,-123],[-12,-140],[74,-115],[117,-48],[95,0]],'#263c3c'),
  plane([[-119,-48],[-67,-123],[-44,-101],[-54,-71],[-81,-19],[-105,0]],'#60736a'),
  plane([[-67,-123],[-12,-140],[74,-115],[42,-100],[14,-113],[-25,-104]],'#697c6f'),
  plane([[74,-115],[117,-48],[95,0],[34,-4],[31,-79]],'#30484a'),
  plane([[-35,-100],[14,-113],[31,-79],[9,-51],[-15,-27],[-59,-41]],'#465e56'),
  plane([[-12,-140],[2,-119],[-4,-83],[17,-52],[8,-77],[-8,-113]],'#203738'),
  plane([[31,-79],[42,-100],[55,-84],[47,-41],[26,-18],[33,-49]],'#172f32'),
  plane([[-105,0],[-81,-19],[-15,-27],[34,-4],[95,0]],'#1b3134')]),
 environmentAsset('env:shrine','먼 산신당','building',6,[[-160,0],[-157,-19],[-112,-26],[-112,-153],[-172,-142],[-142,-164],[-70,-190],[0,-222],[76,-184],[138,-161],[169,-149],[110,-152],[110,-26],[153,-19],[158,0]],[
  plane([[-112,-153],[34,-153],[34,-26],[-112,-26]],'#716b5b'),
  plane([[34,-153],[110,-152],[110,-26],[34,-26]],'#474e4a'),
  plane([[-172,-142],[-142,-164],[-70,-190],[0,-222],[76,-184],[138,-161],[169,-149],[100,-159],[0,-204],[-106,-163]],'#51605b'),
  plane([[-142,-164],[-70,-190],[0,-222],[76,-184],[0,-202],[-77,-174]],'#829081'),
  plane([[-156,-19],[-112,-26],[110,-26],[153,-19],[158,0],[-160,0]],'#2c3c3c'),
  plane([[-22,-113],[24,-113],[24,-27],[-22,-27]],'#202d2e'),
  plane([[-160,-145],[-112,-153],[110,-152],[169,-149],[147,-138],[-144,-138]],'#293b3d')]),
 environmentAsset('env:waterfall','절벽 물줄기','waterfall',18,[[-100,0],[-91,520],[-128,540],[118,540],[88,519],[48,0]])
];
ENV_ASSETS[0].visual.push(
 plane([[-800,0],[-730,-92],[-600,-157],[-510,-128],[-330,-294],[-202,-222],[-30,-366],[150,-273],[320,-331],[470,-194],[590,-221],[800,-45],[800,0],[570,-85],[320,-119],[35,-153],[-205,-112],[-500,-68]],'#52676a'),
 plane([[-800,0],[-575,-27],[-342,-18],[-130,-67],[105,-38],[310,-80],[560,-37],[800,0]],'#1c3038'),
 plane([[-330,-294],[-202,-222],[-30,-366],[150,-273],[320,-331],[262,-210],[90,-206],[-78,-179],[-244,-180]],'#7c8580'),
 plane([[150,-273],[320,-331],[470,-194],[590,-221],[675,-126],[500,-145],[356,-160]],'#334c56')
);
ENV_ASSETS[1].visual.push(
 plane([[-162,-188],[-94,-240],[-51,-207],[-78,-99],[-137,-62]],'#829084'),
 plane([[31,-270],[101,-235],[165,-181],[122,-99],[84,-101]],'#536963'),
 plane([[-200,700],[-162,420],[-124,98],[-78,-99],[-48,200],[-6,700]],'#293b3d')
);
function validateComposition(st,byId,error){const env=st.environment||{},groups=env.groups||[],surfaces=env.surfaces||[],zones=env.zones||[];
 if(env.version!==VERSION)error(`${st.id}: missing composition version`);
 if(!ATMOSPHERES[env.atmosphere?.preset])error(`${st.id}: missing environment atmosphere preset`);
 const checkAtmosphere=(value,label)=>{for(const [k,v]of Object.entries(value||{})){const base=ATMOSPHERES.forest[k];if(base===undefined||typeof base==='string'&&!/^#[0-9a-f]{6}$/i.test(v)||typeof base==='number'&&(!Number.isFinite(v)||v<0||v>(k==='mistSpeed'?40:1))||Array.isArray(base)&&(!Array.isArray(v)||v.length!==2||v.some(n=>!Number.isFinite(n)||n<0||n>1)))error(`${st.id}/${label}: invalid atmosphere ${k}`);}};checkAtmosphere(env.atmosphere?.overrides,'preset');for(const z of zones)checkAtmosphere(z.atmosphere,z.id);
 const unique=(items,label)=>{const ids=new Set();for(const a of items){if(!a.id||ids.has(a.id))error(`${st.id}: duplicate/missing ${label} ${a.id}`);ids.add(a.id);}};unique(groups,'scenic group');unique(surfaces,'support');unique(zones,'zone');
 unique([...groups,...surfaces,...zones,...(env.placements||[]),...(st.elements||[]),...(st.units||[]),...(st.terrains||[]),...(st.events||[]),...(st.markers||[])],'environment/content ID');
 if(!zones.length||zones[0].from!==0||zones.at(-1).to!==st.height)error(`${st.id}: invalid zone coverage`);
 zones.forEach((z,i)=>{if(!Number.isFinite(z.from)||!Number.isFinite(z.to)||!(z.to>z.from)||!(z.blend>0)||z.blend>(z.to-z.from)/2||i&&Math.abs(z.from-zones[i-1].to)>.001)error(`${st.id}/${z.id}: invalid zone transition`);});
 for(const g of groups){if(!VERTICAL_MODES.includes(g.verticalMode))error(`${st.id}/${g.id}: unsupported vertical mode`);if(g.zoneId&&!zones.some(z=>z.id===g.zoneId))error(`${st.id}/${g.id}: invalid background zone`);if(!Number.isFinite(g.x)||!Number.isFinite(g.y)||depth(st,g.depthLayer)===undefined)error(`${st.id}/${g.id}: invalid scenic group depth/position`);if(g.verticalMode==='SKY'&&g.depthLayer!=='L5'||g.depthLayer==='L5'&&g.verticalMode!=='SKY')error(`${st.id}/${g.id}: SKY requires L5`);}
 for(const sf of surfaces){const g=groups.find(g=>g.id===sf.groupId);if(!g){error(`${st.id}/${sf.id}: invalid scenic group`);continue;}if(!Array.isArray(sf.points)||sf.points.length<2||sf.points.some((p,i)=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||i&&p.x<=sf.points[i-1].x)||!Number.isFinite(sf.bottom)||sf.bottom<=Math.max(...(sf.points||[]).map(p=>p.y))){error(`${st.id}/${sf.id}: invalid support geometry`);continue;}if(g.verticalMode==='WORLD'&&zones.some(z=>g.id===`${z.id}-${g.depthLayer}`)&&sf.id===g.id+'-support'){const pad=coveragePad(st,g.depthLayer),s=COVERAGE.minZoom*ratio(st,g.depthLayer,COVERAGE.minZoom),bottomScreen=COVERAGE.maxViewport.h/2+(g.y-st.height)*COVERAGE.minZoom+sf.bottom*s;if(sf.points[0].x+g.x>-pad||sf.points.at(-1).x+g.x<st.width+pad||bottomScreen<COVERAGE.maxViewport.h+COVERAGE.margin)error(`${st.id}/${sf.id}: background coverage insufficient for max zoom`);}}
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
G.HonroEnvironment={VERSION,REFERENCE_SCALE,WORLD_UNITS_PER_METER,D0_METERS,PRESETS,SCENE_PRESETS,LAYERS,preset,depth,factor,ratio,screen,world,vectorScale,screenBounds,classifyLegacyElement,referenceForLegacyAsset,makePlacements,makeEnvironment,resize,upgradeLegacy,upgradeComposition,validate,VERTICAL_MODES,COVERAGE,FINISH,ACT1_FAR,act1Mood,act1BackdropFrame,ATMOSPHERES,ATMOSPHERE_BY_SCENE,mixColor,atmosphere,atmosphereAt,zoneWeights,assetRole,surfaceY,groupOf,supportOf,placementPosition,placementScreen,groupTransform,groupWorld,coveragePad,place,generatedAssets:()=>copy([...ENV_ASSETS,...COMPOSITION_ASSETS])};
})(globalThis);
