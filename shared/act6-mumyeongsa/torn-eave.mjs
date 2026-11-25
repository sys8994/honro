// The sender and receiver compile this same section. The approved 56 body is
// mounted independently and resumes at its original veranda contact.
export const tornEave=Object.freeze({
 id:'mumyeongsa-torn-eave',ceiling:'c-eave-soffit',floor:'c-eave-veranda',plane:900,deck:1136,clearWidth:236,
 left:342,start:380,entryFootY:969,seam:720,receive:736,seat:928,gravity:-320,
 width:1400,height:1440
});
const normal=Object.freeze({x:0,y:1});
const vector=Object.freeze({x:0,y:tornEave.gravity});
const pair=(x,y)=>({x,y});
export function validTornEave(actor,proof){
 const E=tornEave;
 const contact=p=>!!p&&p.id===actor&&p.y===E.plane&&p.vx===0&&p.vy===0&&p.grounded===true&&
  p.support===E.ceiling&&p.normal?.x===0&&p.normal?.y===1;
 return !!(proof?.edge===E.id&&proof.clearWidth===E.clearWidth&&proof.gravity?.x===0&&proof.gravity?.y===E.gravity&&
  contact(proof.landed)&&proof.landed.x===E.start&&contact(proof.approach)&&
  proof.approach.x>=E.seam-10&&proof.approach.x<E.seam&&contact(proof.exit)&&proof.exit.x===E.receive);
}
export function composeTornEave(map){
 const E=tornEave;
 const polygon=(id,points,baseMaterial='rock')=>({id,name:id,type:'solid',baseMaterial,breakable:false,points:points.map(([x,y])=>pair(x,y))});
 const ceiling=polygon(E.ceiling,[[300,785],[374,806],[489,776],[591,804],[720,783],[823,801],[987,772],[987,E.plane],[300,E.plane]],'wood');
 const floor=polygon(E.floor,[[300,E.deck],[988,E.deck],[1020,1242],[906,1292],[771,1269],[671,1303],[490,1271],[360,1294],[300,1240]]);
 const beam=(fill,points)=>({fill,points:points.map(([x,y])=>pair(x,y))});
 const native=[beam('#4e4239',ceiling.points.map(p=>[p.x,p.y])),beam('#625447',floor.points.map(p=>[p.x,p.y])),
  beam('#87725c',[[300,887],[987,887],[987,900],[300,900]]),
  beam('#78695d',[[300,1136],[988,1136],[991,1153],[300,1154]]),
  beam('#594838',[[327,815],[425,826],[535,804],[618,827],[742,807],[862,821],[971,803],[971,845],[845,857],[728,844],[620,862],[519,843],[400,859],[327,849]]),
  beam('#74634e',[[674,833],[700,827],[720,842],[754,831],[773,840],[745,859],[737,887],[717,894],[700,862]]),
  beam('#54463b',[[370,1174],[510,1165],[634,1189],[779,1167],[912,1191],[985,1170],[989,1225],[925,1244],[780,1224],[660,1244],[507,1216],[374,1230]])];
 const back=[beam('#332c2b',[[274,802],[993,778],[1040,1300],[270,1300]]),
  beam('#44362e',[[339,839],[434,840],[439,1250],[343,1260]]),
  beam('#43382f',[[603,801],[654,805],[645,1284],[596,1260]]),
  beam('#4e3e31',[[820,789],[890,798],[885,1246],[814,1230]]),
  beam('#58473a',[[314,981],[996,960],[996,979],[314,1002]])];
 const asset=(id,layer,visual)=>({id,renderer:'vector',category:'terrain',layer,anchor:{x:0,y:0},bounds:{x:260,y:770,w:810,h:560},collision:[],visual,sockets:[],params:{}});
 const library=[asset(E.id+'-rear','back',back),asset(E.id,'prop',native)];
 const elements=library.map(a=>({id:'art-'+a.id,assetId:a.id,x:0,y:0,scale:1,rotation:0,snap:false,layer:a.layer,depthLayer:a.layer==='back'?'L0':'L1',visualRole:'scenery'}));
 return {map:{...map,width:E.width,height:E.height,terrains:[ceiling,floor],materials:[],elements,
  playBounds:{left:0,top:0,right:E.width,bottom:E.height},terrainBounds:{left:-260,top:-280,right:E.width+260,bottom:E.height+280}},library};
}
export function swapTornEave(e,map,compiled){
 const b=e.b,layout={terrain:compiled.terrain,honroWorldTerrain:compiled.worldTerrain,honroLandmarks:compiled.landmarks,honroElements:compiled.elements,
  honroSurfaceZones:compiled.materials,honroPlayBounds:map.playBounds,honroTerrainBounds:map.terrainBounds,width:map.width,height:map.height,vertical:false};
 const saved=Object.fromEntries(Object.keys(layout).map(key=>[key,b[key]]));
 const assign=q=>Object.assign(b,q,{sceneVersion:(b.sceneVersion??0)+1});
 assign(layout);
 return ()=>assign(saved);
}
// Actor feet use the actual boundary of a ceiling polygon. Coordinates are
// world coordinates in both chapters. The inverse stance is only in this room.
export function installTornEave({C,e,scene,u,receiving=null,onContact,onReturn}){
 const E=tornEave,b=e.b,physics=structuredClone(b.physics);
 const methods=['integrateBody','grounded','walk','jump','canDrop','fire','noncombatWalk','honroBBodyEmbedded'];
 const stock=Object.fromEntries(methods.map(key=>[key,e[key]])),draw=scene.unitBody;
 const ceiling=b.terrain.find(t=>t.id===E.ceiling);
 const isActor=v=>v===u;
 const seamLimit=receiving?E.seat:E.receive;
 let up=true,returned=false;
 const touchAt=x=>e.projectileCollision(pair(x,E.plane+2),pair(x,E.plane-2),0,u.id,[],false);
 const face=()=>{const hit=touchAt(u.x);return hit?.terrain===ceiling&&hit.y===E.plane&&hit.n.x===0&&hit.n.y===1;};
 const onFace=()=>!u.dead&&!u.jumping&&u.y===E.plane&&u.vx===0&&u.vy===0&&face();
 const sample=()=>({id:u.id,x:u.x,y:u.y,vx:u.vx,vy:u.vy,grounded:onFace(),support:ceiling.id,normal:{...normal}});
 e.setEnvironment({regions:[...(physics?.regions??[]),{id:E.id,x:300,y:E.plane,w:687,h:E.clearWidth,gravity:vector,projectileOnly:false}]});
 Object.assign(u,{x:receiving?.exit.x??E.start,y:receiving?.exit.y??E.entryFootY,vx:0,vy:0,airborne:!receiving,jumping:false,moving:0,moveTarget:undefined});
 e.grounded=v=>isActor(v)&&up?onFace():stock.grounded.call(e,v);
 e.noncombatWalk=()=>true;
 e.canDrop=v=>isActor(v??e.active)&&up?false:stock.canDrop.call(e,v);
 e.fire=(...args)=>isActor(e.active)?false:stock.fire.apply(e,args);
 e.honroBBodyEmbedded=v=>isActor(v)&&up?b.terrain.some(t=>!t.broken&&!t.oneWay&&
  C.terrainRectIntersects(t,v.x-v.r+.1,v.y+.1,v.r*2-.2,v.h-.2,.1)):stock.honroBBodyEmbedded?.call(e,v);
 e.integrateBody=(v,dt,silent=false)=>{
  if(!isActor(v))return stock.integrateBody.call(e,v,dt,silent);
  if(!up){
   const landed=stock.integrateBody.call(e,v,dt,silent);
   if(landed&&!returned&&v.x===E.seat&&v.y===E.deck&&e.contactSurface(v.x,v.y-2,v.y+2)?.t.id===E.floor){
    returned=true;onReturn({id:v.id,x:v.x,y:v.y,gravity:{...b.physics.gravity},normal:{x:0,y:-1},support:E.floor,grounded:true});
   }
   return landed;
  }
  const g=C.environmentAt(b.physics,v.x,v.y+v.h/2,true).gravity.y;
  const next=C.advanceLinear(v.x,v.y,0,v.vy,0,g,.015,dt);
  if(next.y<=E.plane&&face()){
   v.y=E.plane;v.vy=0;v.jumping=false;v.airborne=false;
   onContact?.(sample());
   if(receiving&&v.x===E.seat){
    up=false;
    b.physics=physics;
    // Preserve center when the foot changes from the top to the bottom.
    Object.assign(v,{y:v.y+v.h,vx:0,vy:0,airborne:true,jumping:false,fallApexY:v.y+v.h});
    scene._releaseScreenCaches?.();
   }
   return up;
  }
  v.y=next.y;v.vy=next.vy;v.airborne=!v.jumping;
  return false;
 };
 e.walk=(v,dir,dt,requireSupport=false)=>{
  if(!isActor(v))return stock.walk.call(e,v,dir,dt,requireSupport);
  if(!up||!dir||v.dead||v.moveLeft<=0||(!v.jumping||requireSupport)&&!onFace())return false;
  const x=Math.max(E.left,Math.min(seamLimit,v.x+Math.sign(dir)*Math.min(v.moveLeft,v.walkSpeed*dt)));
  if(x===v.x)return false;
  v.moveLeft-=Math.abs(x-v.x);v.x=x;v.facing=Math.sign(dir);v.moving=.08;
  return true;
 };
 e.jump=(v=e.active)=>{
  if(!isActor(v))return stock.jump.call(e,v);
  const cost=e.jumpCost(v);
  if(!up||!onFace()||v.moveLeft<cost)return false;
  v.moveLeft-=cost;v.vy=225;v.jumping=true;v.landing=0;
  e.emit('sound',{name:'jump'});
  return true;
 };
 scene.unitBody=function(ctx,v,...args){
  if(!up||v.id!==u.id)return draw.call(this,ctx,v,...args);
  ctx.save();ctx.translate(0,2*v.y);ctx.scale(1,-1);
  try{return draw.call(this,ctx,v,...args);}finally{ctx.restore();}
 };
 return {sample,dispose(){
  b.physics=physics;
  for(const [key,value] of Object.entries(stock)){
   if(value)e[key]=value;else delete e[key];
  }
  scene.unitBody=draw;
 }};
}
