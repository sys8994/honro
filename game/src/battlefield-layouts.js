(function(G){'use strict';
// Campaign terrain is authored as exposed ground first. Optional decks must leave
// firing windows and may never be the only route to a mission objective.
const REVISION=1,STAGES=[5,6,7];
function create(st){
 const terrain=[],landmarks=[],route=[];
 const add=(id,x,y,w,h,mat='rock',extra={})=>terrain.push({id,x,y,w,h,mat,hp:99999,maxHp:99999,route:true,...extra});
 const ground=(prefix,points)=>{for(let i=0;i<points.length-1;i++){const [x,y]=points[i],[nx,ny]=points[i+1];add(prefix+'-'+i,x,y,nx-x,st.h-Math.min(y,ny)+300,'rock',{slope:ny-y});}route.push(...points.map(([x,y])=>({x,y})));};
 const landmark=(kind,x,y,size=1)=>landmarks.push({kind,x,y,size});
 let sectors,seals,altar;
 if(st.id===5){
  ground('valley',[[0,1260],[2100,1260],[4050,2430],[4470,2430],[4670,2250],[5060,2250],[5260,2430],[6050,2430],[8200,1220],[10800,1220]]);
  landmark('stoneArch',4900,2250,1.6);landmark('watchtower',8800,1220,1.7);
 }else if(st.id===6){
  ground('rescue-road',[[0,1250],[1500,1250],[2250,1800],[3400,1800],[3800,1690],[4300,1800],[5550,1800],[6050,1650],[6550,1800],[7800,1800],[8400,1650],[9000,1190],[10400,1190]]);
  // Three isolated remnants, 180 above a continuous safe road. 1,810+ wide
  // openings separate the decks; every deck is reachable by a normal jump.
  for(const [id,x] of [[4,2700],[13,5000],[21,7170]]){add('bridge-'+id,x,1620,360,24,'wood',{oneWay:true,hp:540,maxHp:540});landmark('bridgePillar',x+180,1620,.75);}
  landmark('brokenGate',900,1250,1.2);landmark('bell',9140,1190,1.2);
 }else if(st.id===7){
  // A climb along the outside of the roots, not forty-four stacked ceilings.
  // Grade <= 1.2 (walk limit 1.35); level landings hold both knots and the altar.
  ground('root-rise',[[0,5010],[700,5010],[1650,3870],[1900,3870],[2775,2820],[3025,2820],[3925,1740],[4150,1740],[4700,1080],[6000,1080]]);
  sectors=[900,1820,2960,4470];seals=[{x:1775,y:3870},{x:2900,y:2820}];altar={x:4950,y:1080};
  landmark('greatTree',2880,5150,4);landmark('rootShrine',1850,3870,.8);landmark('rootShrine',2980,2820,.8);landmark('royalGate',altar.x,altar.y,1.5);
 }
 return {terrain,landmarks,route,sectors,seals,altar};
}
const authored=id=>/^(valley-|west-stair-|east-stair-|bridge-|lower-path-|escape-step-|root-\d|connecting-|root-rise-|rescue-road-)/.test(id)||['valley-island','ravine','west-cliff','far-cliff','lower-descent','exit-ramp','rootfloor','royal-altar'].includes(id);
function routeX(route,y){
 for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i];if(a.y!==b.y&&y<=a.y&&y>=b.y)return a.x+(b.x-a.x)*(a.y-y)/(a.y-b.y);}
 return y>=5010?500:4950;
}
function upgrade(b){
 if(b.mode!=='campaign'||!STAGES.includes(b.honroStage)||b.honroLayoutRevision===REVISION)return false;
 // Do not move terrain out from under an attack or a falling body in a save.
 // A live battle retries this at the next settled player turn / turn boundary.
 if(!['aim','transition'].includes(b.phase)||b.projectiles.length||b.volley||b.summonTurn||b.units.some(u=>!u.dead&&!u.fixed&&(u.jumping||u.airborne||Math.abs(u.vx||0)>3||Math.abs(u.vy||0)>3)))return false;
 const st=G.HONRO_CONTENT.stages[b.honroStage-1],layout=create(st),oldTerrain=b.terrain;
 const oldSurface=(x,y)=>oldTerrain.filter(t=>!t.broken&&!t.honroSeal&&x>=t.x&&x<=t.x+t.w).map(t=>G.HonroTerrain.topAt(t,x)).sort((a,c)=>Math.abs(a-y)-Math.abs(c-y))[0]??y;
 const point=(x,y,flying=false)=>{
  const sy=oldSurface(x,y),nx=st.id===7?(sy>=5000?Math.min(x,650):sy<=1120?4950+(x-4050)*.3:routeX(layout.route,sy)):x;
  const ny=G.HonroWorld.top({terrain:layout.terrain,height:b.height},nx);
  return {x:nx,y:ny-(flying?Math.max(130,Math.min(360,sy-y)):0)};
 };
 const carried=oldTerrain.filter(t=>!authored(t.id)).map(t=>({...t}));
 if(st.id===7)for(const [i,p] of layout.seals.entries()){const t=carried.find(t=>t.id==='root-seal-'+i);if(t)Object.assign(t,{x:p.x-42,y:p.y-148});}
 for(const t of layout.terrain){const old=oldTerrain.find(o=>o.id===t.id);if(old&&t.id.startsWith('bridge-'))Object.assign(t,{hp:old.hp,broken:!!old.broken});}
 const shadow={...b,terrain:[...layout.terrain,...carried],units:[]},placements=[];
 for(const u of b.units){
  if(u.dead||u.hp<=0){shadow.units.push(u);continue;}
  const flying=!!G.HonroWorld.archetypes[u.honroType]?.flying||!!u.summonFloating,p=point(u.x,u.y,flying);
  const position=G.HonroTerrain.place(shadow,u,{...p,flying,maxDistance:Math.max(b.width,b.height)});
  if(!position)return false;
  const spawn=point(u.spawnX??u.x,u.spawnY??u.y,flying);
  placements.push({u,position,spawn});shadow.units.push({...u,...position});
 }
 b.terrain=shadow.terrain;b.honroLandmarks=layout.landmarks;b.honroRoute=layout.route;
 for(const {u,position,spawn} of placements){Object.assign(u,position,{spawnX:spawn.x,spawnY:spawn.y,vx:0,vy:0});delete u.aiMove;delete u.moveTarget;}
 for(const m of b.honroMarkers||[]){
  if(st.id===7&&m.type==='shrine'){Object.assign(m,layout.altar);continue;}
  if(st.id===7&&(m.type==='sector'||m.type==='rest')){const i=m.sector??Math.min(3,Math.max(0,Math.round((4880-m.y)/1040)));m.x=layout.sectors[i]-(m.type==='rest'?160:0);}
  m.y=G.HonroWorld.top(b,m.x);
 }
 // Preserve placed effects and their timers/owners while moving ground anchors.
 for(const name of ['fields','zones','drafts'])for(const f of b[name]||[])if(Number.isFinite(f.x)&&Number.isFinite(f.y))Object.assign(f,point(f.x,f.y));
 if(st.id===7)for(const ev of b.honroEvents||[]){if(ev.id==='king-hears')ev.action.x=4350;if(ev.id==='ritual-defense')ev.action.x=4700;}
 b.honroLayoutRevision=REVISION;b.sceneVersion++;return true;
}
G.HonroLayouts={create,upgrade,revision:REVISION,stages:STAGES};
})(globalThis);
