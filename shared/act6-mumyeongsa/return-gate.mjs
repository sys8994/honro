// The original west approach in chapter 58 is also the first floor in chapter 59.
const crest=[[2680,3488],[2928,3416],[3208,3336],[3440,3208]];
const roles=['archer','knight','mage','occultist'];
export const returnGate=Object.freeze({id:'mumyeongsa-return-gate',floor:'local-lower-08-body',sill:3260,
 left:2840,right:3400,leave:2890,arrivalSupport:'m59-return-gate-stone',gravity:{x:0,y:320}});
function grade(x){
 const i=crest.findIndex(p=>p[0]>=x);
 if(i<1)return NaN;
 const [a,b]=[crest[i-1],crest[i]];
 return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);
}
const point=([x,y])=>({x,y});
const polygon=(fill,points)=>({fill,points:points.map(point)});
const foot=u=>({x:u.x,y:u.y});
const onLine=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(grade(p.x)-p.y)<1e-7;
function returnGateTerrain(height){
 const {left,right,arrivalSupport}=returnGate;
 const bed=height+200;
 return {id:arrivalSupport,type:'solid',baseMaterial:'rock',breakable:false,
  points:[[left,grade(left)],...crest.slice(1,-1),[right,grade(right)],[right,bed],[left,bed]].map(point)};
}
export function returnGateArt(){
 const {id,sill}=returnGate,y=grade(sill),rail=[3108,3208,3260,3350,3400];
 const step=[...rail.map(x=>[x,grade(x)]),...rail.slice().reverse().map(x=>[x,grade(x)+22])];
 const visual=[
  polygon('#514c40',[[3078,grade(3078)+14],[3132,grade(3132)+10],[3208,grade(3208)+12],[3350,grade(3350)+13],[3400,grade(3400)+9],
   [3410,grade(3410)+47],[3314,grade(3314)+64],[3240,grade(3240)+52],[3120,grade(3120)+68]]),
  polygon('#82775f',[[3100,grade(3100)+25],[3190,grade(3190)+26],[3249,grade(3249)+32],[3217,grade(3217)+53],[3145,grade(3145)+46]]),
  polygon('#978865',step),
  polygon('#675848',[[3129,y-255],[3181,y-263],[3181,grade(3181)-10],[3131,grade(3131)-17]]),
  polygon('#75604c',[[3331,y-353],[3375,y-359],[3376,grade(3376)-13],[3327,grade(3327)-8]]),
  polygon('#857058',[[3134,y-253],[3147,y-256],[3146,grade(3131)-17],[3134,grade(3131)-17]]),
  polygon('#5b4d41',[[3333,y-348],[3345,y-352],[3342,grade(3327)-8],[3330,grade(3327)-8]]),
  polygon('#4d3d36',[[3097,y-278],[3264,y-345],[3403,y-384],[3450,y-377],[3427,y-345],[3268,y-302],[3110,y-232]]),
  polygon('#686054',[[3078,y-289],[3240,y-354],[3404,y-399],[3458,y-397],[3441,y-374],[3252,y-332],[3097,y-266]]),
  polygon('#a08861',[[3238,y-339],[3263,y-348],[3265,y-304],[3243,y-299]]),
  polygon('#a08861',[[3253,y-11],[3260,y],[3280,grade(3280)],[3271,grade(3280)-11]])
 ];
 const asset={id,renderer:'vector',category:'terrain-art',layer:'prop',anchor:{x:0,y:0},
  bounds:{x:3078,y:y-399,w:380,h:530},collision:[],visual,sockets:[],params:{}};
 return {id:'art-'+id,assetId:id,x:0,y:0,scale:1,rotation:0,snap:false,layer:'prop',depthLayer:'L1',
  visualRole:'scenery',kind:'canonical-element',collisionIds:[],asset};
}
function receivingRock(){
 const id='m59-return-cliff';
 const visual=[
  polygon('#342b29',[[2440,3930],[2640,3700],[2840,3452],[2950,3525],[3220,3390],[3400,3260],
    [3600,3435],[3890,3610],[4020,4330],[2440,4330]]),
  polygon('#3e3431',[[2595,3970],[2860,3550],[2980,3610],[3170,3510],[3460,3400],[3600,3490],
    [3780,3920],[3540,4280],[2940,4290]]),
  polygon('#52423b',[[2830,3640],[2940,3588],[3130,3545],[3330,3470],[3485,3415],[3570,3500],
    [3270,3640],[3130,3670],[2940,3755]]),
  polygon('#372d2b',[[2500,3890],[2820,3700],[3100,3660],[3230,3650],[3500,3540],[3610,3650],
    [3630,3730],[3150,3850],[3120,4100],[2570,4290]])
 ];
 const asset={id,renderer:'vector',category:'terrain-art',layer:'back',anchor:{x:0,y:0},
  bounds:{x:2440,y:3235,w:1580,h:1095},collision:[],visual,sockets:[],params:{}};
 return {id:'art-'+id,assetId:id,x:0,y:0,scale:1,rotation:0,layer:'back',depthLayer:'L0',
  visualRole:'scenery',kind:'canonical-element',collisionIds:[],asset};
}
export function verifyReturnGate(proof,crew){
 const R=returnGate;
 return proof?.id===R.id&&proof.floor===R.floor&&proof.sill===R.sill&&proof.gravity?.x===0&&proof.gravity?.y===320&&
  Array.isArray(proof.actors)&&proof.actors.length===roles.length&&roles.every(cls=>{
   const row=proof.actors.find(a=>a.role===cls),u=crew?.[cls];
   return row&&u&&u.id===row.id&&onLine(row.enter)&&onLine(row.step)&&onLine(row.exit)&&
    row.enter.x>R.sill&&row.step.x<=R.sill&&row.enter.x-row.step.x<=7&&
    row.exit.x<=R.sill-12&&row.exit.x>=R.left&&u.x===row.exit.x&&u.y===row.exit.y;
  });
}
function groundedAt(e,u,support){
 return u&&!u.dead&&u.hp>0&&!u.jumping&&e.grounded(u)&&onLine(u)&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id===support;
}
export function watchReturnGate(e,C,crew){
 const R=returnGate,walk=e.walk,starts=new Map();
 const originals=Object.fromEntries(crew.map(u=>[u.cls,u]));
 e.walk=function(u,dir,...args){
  const monitor=e.b.phase==='aim'&&e.b.side===0&&e.active===u&&originals[u.cls]===u&&e.b.honroState.flags['place(correctedInnerStake)'];
  const before=monitor&&dir<0&&groundedAt(e,u,R.floor)?foot(u):null;
  const result=walk.call(this,u,dir,...args);
  if(!monitor)return result;
  if(u.x>R.sill)starts.delete(u);
  if(before?.x>R.sill&&u.x<=R.sill&&groundedAt(e,u,R.floor)){
   const g=C.environmentAt(e.b.physics,u.x,u.y-u.h/2,true).gravity;
   if(g.x===R.gravity.x&&g.y===R.gravity.y)starts.set(u,{enter:before,step:foot(u)});
  }
  return result;
 };
 function proof(){
  if(starts.size!==roles.length||crew.some(u=>!groundedAt(e,u,R.floor)))return null;
  const data={id:R.id,floor:R.floor,sill:R.sill,gravity:R.gravity,actors:roles.map(role=>{
   const u=originals[role];
   return {role,id:u.id,...starts.get(u),exit:foot(u)};
  })};
  return verifyReturnGate(data,originals)?data:null;
 }
 return {proof,remaining:()=>roles.length-starts.size};
}
export function mountReturnGate({G,e,scene,crew,proof,installArt,onExit}){
 const C=G.HONRO_CORE,R=returnGate,b=e.b,parked=b.units.filter(u=>!crew.includes(u));
 const compiled=G.HonroGeometry.terrain(returnGateTerrain(b.height),b.height);
 const {terrain,honroWorldTerrain,honroElements,honroLandmarks,physics}=b;
 const art=returnGateArt(),positions=new Map(crew.map(u=>[u,foot(u)]));
 const walk=e.walk,noncombat=e.noncombatWalk;
 const incoming=crew.map(u=>({u,pose:proof.actors.find(row=>row.id===u.id)?.exit}));
 if(incoming.some(({u,pose})=>!onLine(pose)||!C.validTerrainContactPose([compiled],{...u,...pose})))return null;
 b.honroReturnGatePending=true;b.terrain=b.honroWorldTerrain=[compiled];b.units=crew.slice();
 b.honroElements=[];b.honroLandmarks=[];
 b.physics={...physics,gravity:{...R.gravity},regions:[]};
 for(const {u,pose} of incoming)Object.assign(u,pose,{vx:0,vy:0,airborne:false,jumping:false});
 e.invalidateTerrainCollisionIndex();installArt(e,scene,[receivingRock(),art]);
 e.noncombatWalk=()=>true;
 const left=new Set();
 e.walk=function(u,dir,...args){
  if(left.has(u)&&dir<0)return false;
  const did=walk.call(this,u,dir,...args);
  if(did&&e.active===u&&crew.includes(u)&&u.x<=R.leave&&groundedAt(e,u,R.arrivalSupport))left.add(u);
  else if(u.x>R.leave)left.delete(u);
  if(left.size===crew.length){
   for(const v of crew)Object.assign(v,positions.get(v),{vx:0,vy:0,airborne:false,jumping:false,moveLeft:v.maxMove});
   Object.assign(b,{terrain,honroWorldTerrain,honroElements,honroLandmarks,physics,units:[...crew,...parked],honroReturnGatePending:false});
   e.walk=walk;e.noncombatWalk=noncombat;e.invalidateTerrainCollisionIndex();
   b.sceneVersion=(b.sceneVersion??0)+1;
   scene._releaseDomainTiles?.();scene._releaseScreenCaches?.();
   onExit();
  }
  return did;
 };
 return {remaining:()=>crew.length-left.size};
}
