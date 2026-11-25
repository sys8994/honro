// The folded receiving slice is the authority for this shared stone approach.
// The same local vectors are translated into chapter 57's coordinate frame.
export const hallSill=Object.freeze({
 id:'mumyeongsa-hall-sill',source:'local-07-08-exact-receiving-slice',offset:{x:3200,y:-758},
 from:2600,to:3050,clearWidth:408,destination:'local-lower-08-body',approach:'m57-hall-approach'
});
const pt=([x,y])=>({x,y});
const face=(fill,points)=>({fill,points:points.map(pt)});
const solid=(id,name,points,material='rock')=>({id,name,type:'solid',baseMaterial:material,breakable:false,points:points.map(pt)});
function art(id,visual,bounds,layer='prop'){
 const asset={id,renderer:'vector',category:'terrain-art',layer,anchor:{x:0,y:0},bounds,collision:[],visual,sockets:[],params:{}};
 return {id:'art-'+id,assetId:id,x:0,y:0,scale:1,rotation:0,snap:false,layer,depthLayer:layer==='back'?'L0':'L1',
  visualRole:'scenery',kind:'canonical-element',collisionIds:[],asset};
}
const band=(edge,depth)=>[...edge,...edge.slice().reverse().map(([x,y])=>[x,y+depth])];
export function hallLead57(bridge){
 const id=hallSill.approach,first=bridge.vertices[0];
 const edge=[[5240,2995],[5278,2990],[5320,2979],[5352,2974],[first.x,first.y]];
 const terrain={id,type:'platform',oneWay:true,baseMaterial:'rock',breakable:false,control:edge.map(pt),thickness:21,
  detail:{interpolation:'linear',roughness:0,optimizeEpsilon:0}};
 const landmark=art(id,[face('#8d7861',band(edge,11)),face('#61564c',band(edge.map(([x,y])=>[x,y+11]),10))],
  {x:5240,y:2974,w:first.x-5240,h:42});
 return {terrain,landmark};
}
export function hallSillArt(slice,source=false){
 const D=hallSill,x=source?D.offset.x:0,y=source?D.offset.y:0;
 const edge=slice.vertices.slice(0,4).map(v=>[v.x-D.offset.x,v.y-D.offset.y]);
 const measured=art(D.id,[
  face('#776b58',band(edge,18)),
  face('#5b5149',band(edge.map(([x,y])=>[x,y+18]),34)),
  face('#8e7d65',[[2610,3176],[2642,3140],[2682,3155],[2680,3445],[2621,3465]]),
  face('#6b5341',[[3000,3100],[3036,3070],[3073,3070],[3070,3365],[3014,3380]]),
  face('#5b4335',[[2570,3100],[2693,3090],[2875,3025],[3043,2995],[3100,3002],[3073,3064],[2887,3085],[2711,3143],[2584,3155]]),
  face('#60534a',[[2540,3068],[2680,3057],[2851,3004],[3043,2960],[3116,2960],[3088,3012],[2874,3043],[2692,3097],[2562,3110]]),
  face('#846646',[[2576,3118],[2701,3103],[2866,3048],[3041,3011],[3084,3020],[3077,3030],[2875,3060],[2711,3117],[2587,3135]])
 ],{x:2540,y:2960,w:576,h:620});
 return {...measured,x,y};
}
export function installHallArt(e,scene,assets){
 const b=e.b;
 if(assets.every(a=>b.honroLandmarks?.some(v=>v.id===a.id)))return;
 b.honroLandmarks=[...b.honroLandmarks??[],...assets];
 b.honroElements=[...b.honroElements??[],...assets];
 b.sceneVersion=(b.sceneVersion??0)+1;
 scene._releaseDomainTiles?.();scene._releaseScreenCaches?.();
}

const interiorD=Object.freeze({id:'m56-d-hall-sill',anchor:'E-joined-ordinary-floor',x:6536,y:3232,touch:2928,worldEdge:7200});
const dGravity={x:0,y:320},dNormal={x:0,y:-1};
function dOffsets(slice){
 const first=slice.vertices[0];
 return {x:interiorD.x-(first.x-hallSill.offset.x),y:interiorD.y-(first.y-hallSill.offset.y)};
}
const closeD=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-8;
const vectorD=(value,expected)=>value?.x===expected.x&&value?.y===expected.y;
export function legacyHallExit56(actor){
 return actor?.cls==='mage'&&actor.x>=6316&&actor.x<=6484&&closeD(actor.y,9768-actor.x);
}
export function verifyHallD56(C,slice,actor,receipt,{atExit=false}={}){
 if(!slice||slice.id!==hallSill.source||!actor||actor.cls!=='mage'||receipt?.version!==1||receipt.edge!==hallSill.id||
    receipt.actor!==actor.id||receipt.clearWidth!==hallSill.clearWidth)return false;
 const d=dOffsets(slice),{approach,entry,contact}=receipt;
 const pose=(p,id)=>p?.support===id&&vectorD(p.normal,dNormal)&&vectorD(p.gravity,dGravity);
 const grade=x=>C.topAt(slice,x-d.x+hallSill.offset.x)-hallSill.offset.y+d.y;
 if(!pose(approach,interiorD.anchor)||approach.x<6480||approach.x>interiorD.x||
    !closeD(approach.y,9768-approach.x)||!pose(entry,interiorD.id)||entry.x<interiorD.x||entry.x>interiorD.x+22||
    !closeD(entry.y,grade(entry.x))||!pose(contact,interiorD.id)||contact.x<interiorD.touch+d.x||contact.x>interiorD.touch+d.x+22||
    !closeD(contact.y,grade(contact.x))||!closeD(contact.junctionX,contact.x-d.x)||!closeD(contact.junctionY,contact.y-d.y))return false;
 return !atExit||(actor.x===contact.x&&actor.y===contact.y);
}
export function mountHallD56({C,e,scene,mage,slice}){
 const b=e.b,d=dOffsets(slice),move=e.walk,quiet=e.noncombatWalk,fire=e.fire;
 const anchor=b.terrain.find(t=>t.id===interiorD.anchor);
 if(!anchor||b.width!==6720||slice.id!==hallSill.source||C.topAt(anchor,interiorD.x)!==interiorD.y||
    !e.grounded(mage)||e.contactSurface(mage.x,mage.y-4,mage.y+5)?.t!==anchor)return null;
 const translate=(x,y)=>({x:x-hallSill.offset.x+d.x,y:y-hallSill.offset.y+d.y});
 const support={...slice,...translate(slice.x,slice.y),id:interiorD.id,vertices:slice.vertices.map(v=>translate(v.x,v.y))};
 b.terrain=[...b.terrain,support];b.honroWorldTerrain=[...b.honroWorldTerrain,support];
 b.width=interiorD.worldEdge;
 if(b.honroPlayBounds)b.honroPlayBounds={...b.honroPlayBounds,right:b.width};
 e.invalidateTerrainCollisionIndex();
 const art=hallSillArt(slice);
 installHallArt(e,scene,[{...art,x:d.x,y:d.y}]);
 let approach=null,entry=null,done=null;
 const pose=()=>{
  if(!e.grounded(mage)||!C.validTerrainContactPose(b.terrain,mage))return null;
  const support=e.contactSurface(mage.x,mage.y-4,mage.y+5)?.t.id;
  const gravity=C.environmentAt(b.physics,mage.x,mage.y-mage.h*.5,true).gravity;
  if(!vectorD(gravity,dGravity))return null;
  return {x:mage.x,y:mage.y,support,gravity:{...gravity},normal:{...dNormal}};
 };
 e.noncombatWalk=()=>e.active===mage||quiet.call(e);
 e.fire=(...args)=>e.active!==mage&&fire.apply(e,args);
 e.walk=(u,dir,dt,...args)=>{
  if(u===mage&&done)return false;
  const before=u===mage&&dir>0&&b.side===0&&b.phase==='aim'?pose():null;
  const ret=move.call(e,u,dir,dt,...args);
  if(!before||u.x<=before.x)return ret;
  if(before.support===interiorD.anchor&&before.x>=6480)approach=before;
  const after=pose();
  if(!after)return ret;
  if(!entry&&approach&&after.support===interiorD.id&&after.x<=interiorD.x+22)entry=after;
  if(entry&&after.support===interiorD.id&&after.x>=interiorD.touch+d.x){
   const contact={...after,junctionX:after.x-d.x,junctionY:after.y-d.y};
   const receipt={version:1,edge:hallSill.id,actor:u.id,clearWidth:hallSill.clearWidth,approach,entry,contact};
   if(verifyHallD56(C,slice,mage,receipt,{atExit:true}))done=receipt;
  }
  return ret;
 };
 return {support,proof:()=>done};
}

export const hallUpper=Object.freeze({
 sill:'m58-upper-deck',wall:'m58-apse-pier',ceiling:'m58-timber-soffit',
 xIn:4168,wallX:4380,floorY:3080,plane:2570,left:3890,dismount:3960,turnY:2716,
 slotLeft:4200,slotRight:4292,
 gravity:320
});
export function hallB58(){
 const A=hallUpper;
 const access=[
  {id:'m58-west-stone-step',points:[[3315,3152],[3400,3080],[3552,3072],[3672,3074]]},
  {id:'m58-rising-gallery',points:[[3672,3074],[3800,3068],[3990,3074],[4128,3080]]}
 ];
 const terrain=[
  ...access.map(({id,points})=>({id,name:id,type:'platform',oneWay:true,baseMaterial:'wood',breakable:false,control:points.map(pt),
   thickness:25,detail:{interpolation:'linear',roughness:0,optimizeEpsilon:0}})),
  solid(A.sill,'상층 교전 마루',[[4128,A.floorY],[A.slotLeft,A.floorY],[A.slotLeft,3117],[4128,3117]],'wood'),
  solid('m58-east-deck','내부 동쪽 마루',[[A.slotRight,A.floorY],[A.wallX,A.floorY],[A.wallX,3117],[A.slotRight,3117]],'wood'),
  solid(A.wall,'동쪽 벽 교전 기둥',[[A.wallX,2500],[4415,2482],[4422,2792],[4410,3117],[A.wallX,3117]],'wood'),
  solid(A.ceiling,'법당 위쪽 처마',[[A.left,2482],[4032,2444],[4220,2452],[4380,2422],[4440,2460],[4440,A.plane],[A.left,A.plane]],'wood')
 ];
 const beam=(x,y,w,h,fill)=>face(fill,[[x,y],[x+w,y-14],[x+w-5,y+h-16],[x+4,y+h]]);
 const attic=art('m58-suspended-hall',[
  ...terrain.filter(t=>t.type==='solid').map(t=>face(t.id===A.wall?'#6a4939':'#5d4a3e',t.points.map(p=>[p.x,p.y]))),
  ...access.map(t=>face('#826b54',band(t.points,15))),
  face('#5d5650',[[3315,3152],[3400,3080],[3552,3072],[3672,3074],[3667,3090],[3550,3094],[3400,3101],[3324,3172]]),
  face('#686054',[[3316,3151],[3400,3080],[3552,3072],[3672,3074],[3672,3080],[3553,3078],[3402,3086],[3321,3157]]),
  face('#685141',[[3672,3086],[3800,3080],[3990,3086],[4128,3092],[4128,3105],[3975,3098],[3810,3095],[3672,3099]]),
  face('#4a4d47',[[3324,3172],[3400,3101],[3550,3094],[3672,3090],[3668,3138],[3574,3192],[3433,3224],[3355,3209]]),
  face('#686858',[[3345,3178],[3411,3124],[3472,3124],[3459,3156],[3425,3179],[3374,3199]]),
  face('#56594e',[[3459,3156],[3472,3124],[3562,3114],[3600,3130],[3571,3164],[3501,3177]]),
  face('#444d47',[[3374,3199],[3425,3179],[3501,3177],[3571,3164],[3551,3192],[3451,3218],[3409,3212]]),
  face('#6b6b5b',[[3604,3105],[3672,3090],[3669,3119],[3649,3137],[3601,3138],[3589,3124]]),
  face('#55594f',[[3601,3138],[3649,3137],[3669,3119],[3668,3138],[3622,3175],[3574,3192],[3581,3164]]),
  face('#807660',[[3401,3134],[3431,3116],[3471,3118],[3448,3135],[3423,3142]]),
  face('#665646',[[3695,3097],[3760,3093],[3753,3130],[3722,3148],[3693,3134]]),
  face('#51473d',[[3753,3130],[3760,3093],[3796,3091],[3790,3123],[3764,3140],[3722,3148]]),
  face('#675747',[[3885,3103],[3990,3108],[4024,3112],[4014,3144],[3962,3152],[3890,3139]]),
  face('#51473e',[[3962,3152],[4014,3144],[4024,3112],[4050,3110],[4044,3136],[4011,3161],[3972,3168]]),
  face('#574535',[[3938,2480],[4032,2444],[4220,2452],[4380,2422],[4440,2460],[4361,2471],[4215,2477],[4050,2471]]),
  face('#59473a',[[4026,2478],[4060,2475],[4063,2554],[4054,2563],[4030,2557]]),
  face('#59473a',[[4330,2474],[4365,2468],[4368,2547],[4354,2562],[4331,2554]]),
  face('#473a31',[[A.left,2538],[4030,2524],[4210,2533],[4440,2523],[4440,2563],[A.left,2563]]),
  face('#695545',[[3938,2480],[4027,2454],[4065,2455],[4084,2489],[4060,2517],[4006,2523],[3954,2511]]),
  face('#866c52',[[3991,2478],[4041,2460],[4065,2464],[4077,2486],[4051,2500],[4004,2505]]),
  face('#544439',[[4060,2517],[4084,2489],[4102,2494],[4090,2529],[4061,2543],[4014,2544],[4006,2523]]),
  face('#7c634b',[[4042,2526],[4076,2516],[4080,2532],[4057,2546],[4026,2548]]),
  face('#655344',[[4126,2468],[4206,2471],[4224,2460],[4252,2464],[4238,2494],[4201,2520],[4158,2529],[4114,2514]]),
  face('#4e4138',[[4114,2514],[4158,2529],[4201,2520],[4238,2494],[4247,2503],[4210,2540],[4152,2555],[4122,2540]]),
  face('#8a7156',[[4152,2526],[4182,2518],[4206,2517],[4187,2533],[4155,2541],[4137,2536]]),
  face('#715b47',[[4284,2467],[4330,2461],[4336,2476],[4327,2508],[4283,2514],[4267,2494]]),
  face('#57473a',[[4283,2514],[4327,2508],[4336,2476],[4360,2460],[4381,2460],[4375,2509],[4335,2531],[4293,2536]]),
  face('#8c7254',[[4318,2521],[4350,2509],[4375,2502],[4371,2518],[4344,2535],[4317,2537]]),
  face('#c5ae87',[[A.left,2564],[4055,2560],[4210,2565],[4440,2561],[4440,A.plane],[A.left,A.plane]]),
  face('#a48968',[[4130,3080],[A.slotLeft,3080],[A.slotLeft,3088],[4130,3088]]),
  face('#a48968',[[A.slotRight,3080],[A.wallX,3080],[A.wallX,3088],[A.slotRight,3088]]),
  face('#977b60',[[A.wallX,2530],[4390,2526],[4393,2594],[4391,2851],[4394,3112],[A.wallX,3117]]),
  beam(4540,2515,1100,32,'#40372f'),
  beam(4622,2536,42,378,'#523e35'),beam(4900,2504,53,471,'#58463a'),beam(5390,2482,53,457,'#533f36')
 ],{x:3315,y:2410,w:2310,h:820});
 const columns=[3350,3610,3900,4290,4700,5050,5420,5680,6000];
 const chamber=art('m58-timber-hall-rear',[
  face('#362d2c',[[3200,2925],[3310,2100],[3870,1840],[5610,1790],[6220,1940],[6280,2930],[6010,3340],[3390,3510]]),
  face('#4b372e',[[3290,2137],[3540,2076],[3910,1905],[4560,1854],[5460,1843],[6010,1865],[6210,1960],[6160,2005],[5470,1940],[3910,2002],[3520,2160]]),
  face('#4f3a30',[[3390,2320],[4400,2156],[5690,2096],[6140,2171],[6150,2228],[5700,2180],[4400,2240],[3395,2381]]),
  ...columns.flatMap((x,index)=>[beam(x,2090-index*15,85,1140,index%2?'#604538':'#685041'),
    beam(x+12,2130-index*15,24,1020,'#78604d'),
    beam(x-11,2160-index*15,105,45,'#575e55'),
    beam(x-5,2350-index*12,90,26,'#83654e')]),
  face('#4a4841',[[3095,3250],[3495,3336],[3940,3319],[4535,3271],[4850,3230],[5204,3120],[5900,3070],[6168,3045],[6240,3210],[5480,3398],[4220,3485],[3110,3600]])
 ],{x:3080,y:1770,w:3230,h:1840},'back');
 const roof=art('m58-tile-eaves',[
  face('#2d2929',[[3109,2160],[3340,2100],[3575,2001],[3905,1852],[4600,1770],[5540,1760],[5960,1757],[6275,1820],[6215,1920],[5550,1870],[4650,1880],[3937,1942],[3552,2094],[3350,2172],[3140,2210]]),
  face('#595348',[[3115,2150],[3380,2080],[3870,1870],[4580,1795],[5220,1790],[5970,1781],[6260,1830],[6253,1848],[5987,1805],[4590,1821],[3894,1900],[3387,2110],[3131,2180]]),
  ...[3420,3770,4140,4520,4910,5290,5640,5960].map((x,i)=>beam(x,2060-Math.min(i,4)*45,68,28,'#757158'))
 ],{x:3090,y:1740,w:3200,h:500});
 return {terrain,visual:[chamber,attic,roof]};
}

// The upper gallery is independent of the boss's lower hull contacts. A body
// changes stance only after standing on its deck, then touching each actual face.
export function installHallAxes({C,e,scene,crew}){
 const A=hallUpper,b=e.b,actors=new Set(crew),stances=new WeakMap(),exited=new WeakSet();
 const methods=['integrateBody','grounded','walk','jump','impulse','canDrop','origin','projectileOrigin','damageAim','damageDistance','collision','setEnvironment'];
 const stock=Object.fromEntries(methods.map(k=>[k,e[k].bind(e)])),draw=scene.unitBody,embedded=e.honroBBodyEmbedded;
 const wall=b.terrain.find(t=>t.id===A.wall),ceiling=b.terrain.find(t=>t.id===A.ceiling);
 const regions=[
  {id:'m58-gallery-right-axis',x:A.xIn-29,y:A.turnY,w:A.wallX-A.xIn+29,h:A.floorY-A.turnY,gravity:{x:A.gravity,y:0},projectileOnly:false},
  {id:'m58-gallery-upper-axis',x:A.dismount,y:A.plane,w:A.wallX-A.dismount,h:A.turnY-A.plane+1,gravity:{x:0,y:-A.gravity},projectileOnly:false}
 ];
 const ids=new Set(regions.map(r=>r.id));
 e.setEnvironment=p=>stock.setEnvironment(p.regions?{...p,regions:[...p.regions.filter(r=>!ids.has(r.id)),...regions]}:p);
 e.setEnvironment({regions:b.physics?.regions??[]});
 const face=(v,mode)=>{
  if(mode==='wall'){
   const h=e.projectileCollision(pt([A.wallX-2,v.y]),pt([A.wallX+2,v.y]),0,v.id,[],false);
   return h?.terrain===wall&&h.x===A.wallX&&h.n.x===-1&&h.n.y===0;
  }
  const h=e.projectileCollision(pt([v.x,A.plane+2]),pt([v.x,A.plane-2]),0,v.id,[],false);
  return h?.terrain===ceiling&&h.y===A.plane&&h.n.x===0&&h.n.y===1;
 };
 const pose=(v,mode)=>mode==='wall'?[v.x-v.h,v.y-v.r,v.h,2*v.r]:[v.x-v.r,v.y,2*v.r,v.h];
 const centered=(v,mode,n=.5)=>mode==='wall'?pt([v.x-v.h*n,v.y]):pt([v.x,v.y+v.h*n]);
 const stop=(v,mode)=>!v.dead&&!v.jumping&&v.vx===0&&v.vy===0&&
  (mode==='wall'?v.x===A.wallX:v.y===A.plane)&&face(v,mode);
 e.grounded=v=>stances.has(v)?stop(v,stances.get(v)):stock.grounded(v);
 e.canDrop=v=>!stances.has(v??e.active)&&stock.canDrop(v);
 e.impulse=(u,vx,vy,attack)=>{
  const mode=stances.get(u);
  if(!mode)return stock.impulse(u,vx,vy,attack);
  const wallMode=mode==='wall';
  [u.vx,u.vy]=wallMode?[-u.vy,u.vx]:[u.vx,-u.vy];
  try{return stock.impulse(u,vx,vy,attack);}
  finally{[u.vx,u.vy]=wallMode?[u.vy,-u.vx]:[u.vx,-u.vy];}
 };
 e.honroBBodyEmbedded=v=>{
  const mode=stances.get(v);
  if(!mode)return embedded?.call(e,v);
  const [x,y,w,h]=pose(v,mode);
  return b.terrain.some(t=>!t.broken&&!t.oneWay&&C.terrainRectIntersects(t,x+.1,y+.1,w-.2,h-.2,.1));
 };
 function normal(u,x,y,vy=0){
  stances.delete(u);exited.add(u);
  Object.assign(u,{x,y,vx:0,vy,airborne:true,jumping:false,fallApexY:y,moveTarget:undefined});
 }
 const slide=(velocity,dt)=>Math.abs(velocity)<1.5?0:velocity*Math.exp(-13*dt);
 e.integrateBody=(u,dt,silent=false)=>{
  let mode=stances.get(u);
  if(!mode){
   const supported=stock.integrateBody(u,dt,silent);
   if(!actors.has(u)||u.dead||!supported)return supported;
   if(u.x<A.xIn-70)exited.delete(u);
   if(exited.has(u)||u.x<A.xIn||u.x>=A.wallX-u.h/2||e.contactSurface(u.x,u.y-2,u.y+2)?.t.id!==A.sill)return supported;
   mode='wall';stances.set(u,mode);
   Object.assign(u,{x:u.x+u.h/2,y:u.y-u.h/2,vx:0,vy:0,airborne:true,jumping:false});
  }
  const center=centered(u,mode),g=C.environmentAt(b.physics,center.x,center.y,true).gravity;
  if(mode==='wall'){
   const next=C.advanceLinear(u.x,u.y,u.vx,u.vy,g.x*(u.jumping?2:1),0,.015,dt);
   u.y=Math.max(A.turnY,Math.min(A.floorY-u.h/2,next.y));u.vy=u.y===next.y?next.vy:0;
   if(next.x>=A.wallX&&face(u,mode)){u.x=A.wallX;u.vx=0;u.vy=slide(u.vy,dt);u.jumping=false;}
   else{u.x=Math.max(A.xIn+u.h/2,next.x);u.vx=u.x===next.x?next.vx:0;}
  }else{
   const next=C.advanceLinear(u.x,u.y,u.vx,u.vy,0,g.y*(u.jumping?2:1),.015,dt);
   u.x=Math.max(A.left+u.r,Math.min(A.wallX-u.r,next.x));u.vx=u.x===next.x?next.vx:0;
   if(next.y<=A.plane&&face(u,mode)){u.y=A.plane;u.vy=0;u.vx=slide(u.vx,dt);u.jumping=false;}
   else if(next.y+u.h/2>A.turnY&&next.vy>0){normal(u,u.x,next.y+u.h,next.vy);return false;}
   else{u.y=next.y;u.vy=next.vy;}
  }
  const now=stop(u,mode);u.airborne=!now&&!u.jumping;
  return now;
 };
 e.walk=(u,dir,dt,requireSupport=false)=>{
  const mode=stances.get(u);
  if(!mode)return stock.walk(u,dir,dt,requireSupport);
  if(!dir||u.dead||u.moveLeft<=0||(!u.jumping||requireSupport)&&!stop(u,mode))return false;
  const facing=Math.sign(dir),step=facing*Math.min(u.moveLeft,u.walkSpeed*dt),key=mode==='wall'?'y':'x';
  let next=mode==='wall'?Math.max(A.turnY,Math.min(A.floorY-u.h/2,u.y-step)):
   Math.max(A.left+u.r,Math.min(A.wallX-u.r,u.x+step));
  for(const v of b.units){
   if(v===u||v.dead||stances.get(v)!==mode)continue;
   const gap=u.r+v.r+2;
   if(next<u[key]&&v[key]<u[key])next=Math.min(u[key],Math.max(next,v[key]+gap));
   if(next>u[key]&&v[key]>u[key])next=Math.max(u[key],Math.min(next,v[key]-gap));
  }
  const travel=Math.abs(next-u[key]);
  u.moveLeft-=travel;u[key]=next;u.moving=.08;u.walkPhase=(u.walkPhase||0)+travel*.038;
  if(u.facing!==facing){u.facing=facing;u.angle=C.clamp(180-u.angle,C.AIM_MIN??-85,C.AIM_MAX??265);}
  if(mode==='wall'&&u.y===A.turnY&&stop(u,mode)){
   stances.set(u,'ceiling');
   Object.assign(u,{x:u.x-u.h/2,y:u.y-u.h/2,vx:0,vy:0,jumping:false,airborne:true});
  }else if(mode==='wall'&&step<0&&u.y===A.floorY-u.h/2&&stop(u,mode)){
   normal(u,u.x-u.h/2,A.floorY);
  }else if(mode==='ceiling'&&u.x<A.dismount){
   normal(u,u.x,u.y+u.h,u.vy);
  }
  return true;
 };
 e.jump=(u=e.active)=>{
  const mode=stances.get(u);
  if(!mode)return stock.jump(u);
  const cost=e.jumpCost(u);
  if(!stop(u,mode)||u.moveLeft<cost)return false;
  u.moveLeft-=cost;u.jumping=true;
  if(mode==='wall')u.vx=-240;
  else u.vy=240;
  e.emit('sound',{name:'jump'});return true;
 };
 e.damageAim=(u,p=.5)=>stances.has(u)?centered(u,stances.get(u),p):stock.damageAim(u,p);
 e.damageDistance=(u,p)=>{
  if(!stances.has(u))return stock.damageDistance(u,p);
  const c=centered(u,stances.get(u),.45);return Math.hypot(c.x-p.x,c.y-p.y);
 };
 e.origin=(u,angle,body=false)=>{
  const base=stock.origin(u,angle,body),mode=stances.get(u);
  if(!mode)return base;
  const p=centered(u,mode,.63);
  return {x:p.x+base.x-u.x,y:p.y+base.y-u.y+u.h*.63};
 };
 e.projectileOrigin=(u,skill,angle)=>{
  if(!stances.has(u))return stock.projectileOrigin(u,skill,angle);
  const p=e.origin(u,angle);
  if(skill.phase==='terrain'||skill.phase==='all')return p;
  const h=e.projectileCollision(e.damageAim(u,.63),p,skill.mode==='arrow'?3:6,u.id,[],false);
  return h?{x:h.x+h.n.x*.05,y:h.y+h.n.y*.05}:p;
 };
 e.collision=(a,z,r,owner,hit=[],units=true,skip=[],terrain=true,projectile=false,attack)=>{
  if(!units||!crew.some(u=>stances.has(u)))return stock.collision(a,z,r,owner,hit,units,skip,terrain,projectile,attack);
  let nearest=stock.collision(a,z,r,owner,hit,false,skip,terrain,projectile,attack);
  for(const v of b.units){
   if(v.dead||v.id===owner||hit.includes(v.id)||!e.attackAllows(v,owner,attack))continue;
   const box=stances.has(v)?pose(v,stances.get(v)):[v.x-v.r,v.y-v.h,2*v.r,v.h];
   const c=C.segRect(a,z,...box,r);
   if(c&&(!nearest||c.t<nearest.t))nearest={t:c.t,n:c.n,x:a.x+(z.x-a.x)*c.t,y:a.y+(z.y-a.y)*c.t,unit:v};
  }
  return nearest;
 };
 scene.unitBody=function(c,u,...args){
  const mode=stances.get(u);
  if(!mode)return draw.call(this,c,u,...args);
  c.save();c.translate(u.x,u.y);
  if(mode==='wall')c.rotate(-Math.PI/2);else c.scale(1,-1);
  c.translate(-u.x,-u.y);
  try{return draw.call(this,c,u,...args);}finally{c.restore();}
 };
}
