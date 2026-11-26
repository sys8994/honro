// A single authored near mass and contact mask spans the 53/54 chapter line.
export function createBrokenRail(spec){
 const x=2480,y=-255,entryX=2792;
 const solids=spec.solids.map(t=>({...t,left:t.id==='b-entry-sill'?entryX:t.left+x,top:t.top+y,right:t.right+x,bottom:t.bottom+y}));
 const [floor,wall,jamb,cap]=solids;
 const plain=([x,y])=>({x,y});
 const outlines=solids.map(t=>({...t,points:[[t.left,t.top],[t.right,t.top],[t.right,t.bottom],[t.left,t.bottom]]}));
 // The blocks behind the entry and outside the frame share the near silhouette
 // on both sides. They sit away from the playable lane and its outgoing ledge.
 const dummies=[
  {id:'b-dummy-north',paint:'#3e413c',points:[[cap.left,-320],[wall.right,-320],[wall.right,cap.top],[cap.left,cap.top]]},
  {id:'b-dummy-west',paint:'#42433d',points:[[2632,cap.top-28],[cap.left,cap.top],[jamb.left,188],[2789,170],[2698,126]]},
  {id:'b-dummy-east',paint:'#3b413e',points:[[wall.right,wall.top],[wall.right+305,wall.top-44],[wall.right+305,wall.bottom+115],[wall.right,wall.bottom]]},
  {id:'b-dummy-south',paint:'#3d403b',points:[[wall.left,wall.bottom],[wall.right,wall.bottom],[wall.right+305,wall.bottom+115],[wall.right+305,wall.bottom+274],[3220,wall.bottom+227]]}
 ];
 const terrain=[...outlines,...dummies].map(({id,points})=>({id,name:id,points:points.map(plain),type:'solid',baseMaterial:'rock',breakable:false}));
 const crossY=spec.seamY+y;
 const courses=[0,112,218,331,462,581];
 // The foundation is the same painted section on both sides. It follows the
 // outer jamb into the bedrock below the sill, clear of the inner wall face.
 const foundation=[
  ['#41433d',[[3490,375],[3630,329],[3770,241],[3860,244],[3890,357],[3978,426],[3938,563],
    [4044,670],[3986,804],[4020,945],[3896,1072],[3774,1097],[3710,1173],[3528,1142],[3310,1022],[3370,864],[3450,781]]],
  ['#535249',[[3505,383],[3673,360],[3770,241],[3860,244],[3816,368],[3731,423],[3590,449],[3515,500]]],
  ['#494b44',[[3515,500],[3590,449],[3731,423],[3906,436],[3955,471],[3900,522],[3740,548],[3607,599],[3515,617]]],
  ['#373b37',[[3370,864],[3541,843],[3685,754],[3837,696],[3986,682],[3980,767],[3862,833],
    [3740,859],[3610,936],[3510,954],[3462,1000],[3310,1022]]],
  ['#4b4a42',[[3528,1081],[3632,1040],[3701,977],[3810,914],[3913,901],[3976,876],[3990,926],
    [3932,985],[3823,1018],[3746,1083],[3710,1124],[3626,1127]]],
  ['#3e413b',[[3701,977],[3750,931],[3821,897],[3909,882],[3950,836],[3995,799],[3984,858],[3913,901],[3810,914]]],
  ['#535047',[[3471,830],[3566,794],[3627,739],[3725,719],[3694,754],[3605,803],[3550,826]]]
 ];
 const art=[
  ...dummies.map(t=>[t.paint,t.points]),
  ...foundation,
  ['#555048',outlines[0].points],['#514c43',outlines[1].points],['#483d32',outlines[2].points],['#615142',outlines[3].points],
  ...courses.flatMap((offset,i)=>{
   const ax=wall.left,ay=wall.top+offset,by=ay+104;
   return [[i%2?'#665b49':'#5a5346',[[ax+7,ay+9],[ax+81,ay+3],[ax+179,ay+14],[ax+283,ay+1],[ax+267,by],[ax+158,by-17],[ax+61,by-3],[ax+9,by-12]]],
           ['#393733',[[ax+9,by-10],[ax+70,by-6],[ax+159,by-15],[ax+266,by],[ax+182,by-2],[ax+68,by+2],[ax+9,by-6]]]];
  }),
  ['#ac9875',[[wall.left,wall.top],[wall.left+10,wall.top],[wall.left+14,wall.top+188],[wall.left+10,wall.top+360],
              [wall.left+12,wall.bottom],[wall.left,wall.bottom]]],
  ['#806749',[[jamb.right-10,jamb.top],[jamb.right,jamb.top],[jamb.right,jamb.bottom],[jamb.right-10,jamb.bottom]]],
  ['#5b6350',[[wall.left, crossY-9],[wall.left+165,crossY-14],[wall.left+176,crossY+2],[wall.left,crossY+9]]],
  ['#9b8a69',[[floor.left,floor.top],[floor.right,floor.top],[floor.right,floor.top+14],[floor.left,floor.top+12]]]
 ].map(([fill,points])=>({fill,points:points.map(plain)}));
 const asset={id:spec.id,renderer:'vector',category:'terrain',layer:'prop',anchor:{x:0,y:0},
  bounds:{x:2632,y:-320,w:4044-2632,h:1173+320},collision:[],visual:art,sockets:[],params:{}};
 const element={id:'art-'+spec.id,assetId:spec.id,x:0,y:0,scale:1,rotation:0,snap:false,layer:'prop',depthLayer:'L1',visualRole:'scenery'};
 const rear={...asset,id:spec.id+'-rear',layer:'back',bounds:{x:2792,y:-150,w:748,h:900},visual:[
  ['#302e2c',[[2860,-150],[3540,-150],[3540,768],[2780,768],[2796,212]]],
  ['#454039',[[2860,-150],[3540,-150],[3540,165],[3360,184],[3118,129],[2840,208]]],
  ['#3b3833',[[3066,-150],[3109,-150],[3102,197],[3124,358],[3103,624],[3064,768],[3026,768],[3032,485],[3048,224]]],
  ['#504333',[[2847,606],[2913,585],[3070,600],[3296,572],[3540,617],[3540,650],[3140,636],[2860,659]]]
 ].map(([fill,points])=>({fill,points:points.map(plain)}))};
 const rearElement={...element,id:'art-'+rear.id,assetId:rear.id,layer:'back',depthLayer:'L0'};
 return {id:spec.id,width:3540,height:3000,clearWidth:spec.clearWidth,gravity:spec.gravity,crossY,
  turnX:spec.gravityStartX+x,exitY:80,guard:[wall.left-84,crossY-215],wall,jamb,cap,floor,terrain,
  assets:[asset,rear],elements:[rearElement,element]};
}
export function validBrokenRailCrossing(B,actor,receipt){
 const {from,to}=receipt??{};
 const onWall=p=>p&&p.id===actor&&p.x===B.wall.left&&p.grounded===true&&p.surface===B.wall.id;
 return receipt?.id===B.id&&receipt.clearWidth===B.clearWidth&&receipt.gravity===B.gravity&&onWall(from)&&onWall(to)&&
  Number.isFinite(from.y)&&Number.isFinite(to.y)&&from.y>B.crossY&&to.y<=B.crossY&&from.y-to.y<=10;
}

// This port belongs to an engine and its own scene. The normal solver is used
// for every body except those admitted to the wall by the chapter owner.
export function installBrokenRail({C,e,scene,B,hero,canTurn=()=>false,afterLand=()=>{},foe=null}){
 const b=e.b,wallBodies=new WeakSet();
 const names=['grounded','integrateBody','walk','jump','canDrop','origin','projectileOrigin','damageAim','damageDistance','collision','enemyAction'];
 const original=Object.fromEntries(names.map(k=>[k,e[k]]));
 const stock=Object.fromEntries(names.map(k=>[k,original[k].bind(e)]));
 const originalDraw=scene.unit,physicsBefore=structuredClone(b.physics),wallX=B.wall.left;
 const stockEmbedded=e.honroBBodyEmbedded;
 const wallBody=u=>wallBodies.has(u);
 const minY=u=>B.cap.bottom+u.r;
 const maxY=u=>B.floor.top-u.r;
 const within=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 const contact=u=>({id:u.id,x:u.x,y:u.y,vx:u.vx,vy:u.vy,grounded:e.grounded(u),surface:B.wall.id});
 const minX=u=>u.y-u.r<B.jamb.bottom?B.jamb.right+u.h:B.turnX;
 const alongRail=(u,end,x)=>{
  for(const v of b.units){
   if(v===u||v.dead||!wallBody(v)||v.x-v.h>=x||x-u.h>=v.x)continue;
   const gap=u.r+v.r+2;
   if(end<u.y&&v.y<u.y)end=Math.min(u.y,Math.max(end,v.y+gap));
   if(end>u.y&&v.y>u.y)end=Math.max(u.y,Math.min(end,v.y-gap));
  }
  return end;
 };
 let enabled=false;
 e.grounded=u=>wallBody(u)?!u.dead&&!u.jumping&&u.x===wallX&&u.y>=minY(u)&&u.y<=maxY(u)&&Math.abs(u.vx)<2&&Math.abs(u.vy)<2:stock.grounded(u);
 e.honroBBodyEmbedded=u=>wallBody(u)?b.terrain.some(t=>!t.broken&&!t.oneWay&&
  C.terrainRectIntersects(t,u.x-u.h+.1,u.y-u.r+.1,u.h-.2,u.r*2-.2,.1)):stockEmbedded?.call(e,u);
 e.canDrop=(u=e.active)=>!wallBody(u)&&stock.canDrop(u);
 e.walk=(u,dir,dt,needSupport=false)=>{
  if(!wallBody(u))return stock.walk(u,dir,dt,needSupport);
  if(!dir||u.dead||u.fixed||u.moveLeft<=0||(!u.jumping||needSupport)&&!e.grounded(u))return false;
  const speed=u.walkSpeed*(1-(u.slowed?.factor??0));
  const end=alongRail(u,within(u.y-dir*Math.min(u.moveLeft,speed*dt),minY(u),maxY(u)),u.x);
  if(end===u.y)return false;
  u.moveLeft-=Math.abs(end-u.y);
  u.y=end;u.facing=Math.sign(dir);u.moving=.08;
  return true;
 };
 e.jump=(u=e.active)=>{
  if(!wallBody(u))return stock.jump(u);
  const cost=e.jumpCost(u);
  if(!e.grounded(u)||u.fixed||u.moveLeft<cost)return false;
  u.moveLeft-=cost;
  u.jumping=true;u.vx=-660;u.landing=0;
  e.emit('sound',{name:'jump'});
  return true;
 };
 function adopt(u){
  if(!enabled){
   e.setEnvironment({regions:[...(physicsBefore?.regions??[]),{
    id:B.id,x:B.turnX-96,y:B.cap.bottom,w:wallX-B.turnX+96,h:B.floor.top-B.cap.bottom,
    gravity:{x:B.gravity,y:0},projectileOnly:false
   }]});
   enabled=true;
  }
  wallBodies.add(u);
 }
 e.integrateBody=(u,dt,silent=false)=>{
  if(!wallBody(u)){
   const supported=stock.integrateBody(u,dt,silent);
   if(u!==hero||!supported||u.x<B.turnX||u.y!==B.floor.top||!canTurn(u))return supported;
   // Rotate the body around its world center as its feet leave the sill.
   u.x+=u.h*.5;u.y-=u.h*.5;u.vx=0;u.vy=0;u.jumping=false;
   adopt(u);
  }
  const gravity=C.environmentAt(b.physics,u.x-u.h*.5,u.y,true).gravity.x;
  const next=C.advanceLinear(u.x,u.y,u.vx,u.vy,gravity*(u.jumping?1000/B.gravity:1),0,.015,dt);
  const x=within(next.x,minX(u),wallX);
  u.y=alongRail(u,within(next.y,minY(u),maxY(u)),x);
  u.vy=next.y===u.y&&Math.abs(next.vy)>=2?next.vy:0;
  if(next.x>=wallX){
   u.x=wallX;u.vx=0;
   if(u.jumping)u.landing=.24;
   u.jumping=false;
  }else{
   u.x=Math.max(minX(u),next.x);
   u.vx=u.x===next.x?next.vx:Math.max(0,next.vx);
  }
  const grounded=e.grounded(u);
  u.airborne=!grounded&&!u.jumping;
  if(grounded&&u===hero)afterLand(contact(u));
  return grounded;
 };
 e.damageAim=(u,p=.5)=>wallBody(u)?{x:u.x-u.h*p,y:u.y}:stock.damageAim(u,p);
 e.damageDistance=(u,p)=>wallBody(u)?Math.hypot(u.x-u.h*.45-p.x,u.y-p.y):stock.damageDistance(u,p);
 e.origin=(u,angle,body=false)=>{
  const base=stock.origin(u,angle,body);
  if(!wallBody(u))return base;
  return {x:base.x-u.h*.63,y:base.y+u.h*.63};
 };
 e.projectileOrigin=(u,skill,angle)=>{
  if(!wallBody(u))return stock.projectileOrigin(u,skill,angle);
  const point=e.origin(u,angle);
  if(skill.phase==='terrain'||skill.phase==='all')return point;
  const hit=e.projectileCollision(e.damageAim(u,.63),point,skill.mode==='arrow'?3:6,u.id,[],false);
  return hit?{x:hit.x+hit.n.x*.05,y:hit.y+hit.n.y*.05}:point;
 };
 e.collision=(a,z,r,ownerId,hit=[],units=true,skip=[],terrain=true,projectile=false,attack)=>{
  if(!units||!wallBody(hero))return stock.collision(a,z,r,ownerId,hit,units,skip,terrain,projectile,attack);
  let best=stock.collision(a,z,r,ownerId,hit,false,skip,terrain,projectile,attack);
  for(const u of b.units){
   if(u.dead||u.id===ownerId||hit.includes(u.id)||!e.attackAllows(u,ownerId,attack))continue;
   const box=wallBody(u)?[u.x-u.h,u.y-u.r,u.h,2*u.r]:[u.x-u.r,u.y-u.h,2*u.r,u.h];
   const q=C.segRect(a,z,...box,r);
   if(q&&(!best||q.t<best.t))best={t:q.t,n:q.n,x:a.x+(z.x-a.x)*q.t,y:a.y+(z.y-a.y)*q.t,unit:u};
  }
  return best;
 };
 const guardPacing=new WeakMap();
 e.enemyAction=()=>{
  const enemy=e.active;
  if(!foe||enemy?.side!==1||!wallBody(enemy))return stock.enemyAction();
  if(!e.grounded(enemy))return;
  let pace=guardPacing.get(enemy);
  if(pace?.round!==b.round){pace={round:b.round,walk:0};guardPacing.set(enemy,pace);}
  if(pace.walk<28){
   const y=enemy.y;
   if(e.walk(enemy,Math.sign(enemy.y-hero.y),C.STEP,true)){pace.walk+=Math.abs(enemy.y-y);return;}
  }
  if(b.turnAge<.22)return;
  const skill=C.SKILLS[enemy.loadout[0]];
  const a=e.damageAim(enemy),z=e.damageAim(hero);
  const angle=Math.atan2(a.y-z.y,z.x-a.x)*180/Math.PI;
  for(const power of [.62,.82,.95])for(const delta of [0,12,-12,24,-24,36,-36,48,-48]){
   const aim=within((angle+delta+450)%360-90,C.AIM_MIN,C.AIM_MAX);
   if(skill&&e.predict(enemy,skill,aim,power,hero,false).unit===hero.id&&e.fire(skill.id,aim,power,true))return;
  }
  e.finishAction();
 };
 scene.unit=function(ctx,u,...args){
  if(!wallBody(u))return originalDraw.call(this,ctx,u,...args);
  ctx.save();
  ctx.translate(u.x,u.y);ctx.rotate(-Math.PI/2);ctx.translate(-u.x,-u.y);
  try{return originalDraw.call(this,ctx,u,...args);}finally{ctx.restore();}
 };
 return {adopt,isWall:wallBody,contact,dispose(){
  b.physics=physicsBefore;
  for(const name of names)e[name]=original[name];
  if(stockEmbedded)e.honroBBodyEmbedded=stockEmbedded;
  else delete e.honroBBodyEmbedded;
  scene.unit=originalDraw;
 }};
}
