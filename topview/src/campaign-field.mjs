import {center} from './terrain.mjs';

const G=globalThis, alive=u=>u&&!u.dead&&u.hp>0;
const attackable=u=>alive(u)&&u.side===1&&!u.honroObjectiveTarget;
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clone=p=>({x:p.x,y:p.y});
const limits=(n,a,b)=>Math.max(a,Math.min(b,n));

// Native actors, named sites and event positions are authored in the original
// stage coordinates. Preserve their local grouping on the corresponding shelf.
export function projectBattle(b,space){
  const {map,cell}=space,old=b.honroMapAnchors,originalWidth=b.width,originalHeight=b.height;
  const sites=Object.keys(old).filter(k=>map.anchors[k]).map(k=>({from:old[k],to:space.point(k)}));
  const points=sites.filter((v,i)=>sites.findIndex(w=>near(v.from,w.from)<1)===i);
  function warp(x,y){
    const nearest=points.map(p=>({...p,d:Math.hypot(x-p.from.x,(y-p.from.y)*.83)})).sort((a,b)=>a.d-b.d).slice(0,3);
    if(nearest[0].d<1)return clone(nearest[0].to);
    let sx=0,sy=0,total=0;
    for(const p of nearest){const weight=1/Math.max(45,p.d)**2.4;total+=weight;
      sx+=(p.to.x+(x-p.from.x)*.91)*weight;sy+=(p.to.y+(y-p.from.y)*.78)*weight;}
    return {x:limits(sx/total,80,space.width-80),y:limits(sy/total,80,space.height-80)};
  }
  function pointFor(id,x,y){
    const key=map.placements[id];return key?space.point(key):warp(x,y);
  }
  const placed=[],groupCount=new Map();
  function seat(u,hidden=false){
    const key=map.placements[u.id];let p=pointFor(u.id,u.x,u.y);
    if(key){
      const n=groupCount.get(key)||0;groupCount.set(key,n+1);
      if(n){const offset=[[108,45],[44,117],[-106,65],[-80,-70],[75,-95]][(n-1)%5];p={x:p.x+offset[0],y:p.y+offset[1]};}
    }
    const flying=!!G.HonroWorld.archetypes[u.honroVariant||u.honroType]?.flying;
    const dest=space.free(p,u.r,flying,placed)||space.landing(p,u.r,flying,placed);
    if(!dest)throw Error(map.meta.title+' · 배치할 발점 없음 '+u.id);
    Object.assign(u,{x:dest.x,y:dest.y+u.h/2,spawnX:dest.x,spawnY:dest.y+u.h/2,vx:0,vy:0,tvHeading:{x:u.side===1?-1:1,y:0}});
    if(!hidden)placed.push(u);
  }
  b.units.slice().sort((a,c)=>Number(map.placements[c.id]!=null)-Number(map.placements[a.id]!=null)).forEach(u=>seat(u));
  for(const u of Object.values(b.honroStaging?.hidden||{}))seat(u,true);
  for(const t of b.honroQuestTargets||[]){const u=b.units.find(v=>v.id===t.id);if(u)Object.assign(t,{x:u.x-t.w/2,y:u.y-t.h});}
  for(const m of b.honroMarkers){
    const p=pointFor(m.id,m.x,m.y);const target=m.target&&b.units.find(u=>u.id===m.target);
    const dest=target?center(target):space.free(p,27)||space.landing(p,27);
    if(dest)Object.assign(m,dest);
    if(m.action==='climbSite'&&m.to){const to=warp(m.to.x,m.to.y);Object.assign(m.to,space.free(to,28)||to);}
  }
  const raw=[...Object.values(old)].sort((a,b)=>a.x-b.x);
  function baseline(x){return raw.reduce((a,p)=>Math.abs(p.x-x)<Math.abs(a.x-x)?p:a,raw[0]).y;}
  function position(o){
    if(!o||!Number.isFinite(o.x))return;
    const wasX=o.x,wasY=o.y??o.airY??baseline(wasX),p=warp(wasX,wasY);
    Object.assign(o,p);if(Number.isFinite(o.airY))o.airY=p.y;
  }
  function action(a){if(!a)return;position(a);for(const q of a.actions||[])action(q);for(const q of a.entryOptions||[])position(q);}
  function condition(w){if(!w)return;if(w.progress!=null)w.progress=warp(w.progress,baseline(w.progress)).x;
    if(w.region){const q=w.region;const p=warp(q.x+q.width/2,q.y+q.height/2);Object.assign(q,{x:p.x-q.width/2,y:p.y-q.height/2});}
    for(const q of w.any||[])condition(q);for(const q of w.all||[])condition(q);
  }
  for(const ev of b.honroEvents){condition(ev.when);action(ev.action);}
  for(const [name,p] of Object.entries(old)){const dest=map.anchors[name]?space.point(name):warp(p.x,p.y);Object.assign(p,dest);}
  for(const cells of [b.honroMap?.positioning?.cells||[]])for(const cell of cells){if(cell.region)condition({region:cell.region});}
  b.honroTopview=1;b.tvTerrainRevision=map.meta.revision;b.width=space.width;b.height=space.height;b.vertical=false;
  b.honroPlayBounds={x:0,y:0,w:b.width,h:b.height};b.honroTerrainBounds={...b.honroPlayBounds};
  for(const name of ['terrain','waters','drafts','fields','decor','honroElements','honroWorldTerrain','honroLandmarks','honroSurfaceZones','routePoints'])b[name]=[];
  const forces=[];
  if(b.honroStage===5){const at=space.point('waterfallFoot');forces.push({id:'낙수',x:at.x-320,y:space.point('cleat').y-220,w:520,h:1150,gravity:{x:-80,y:390},projectileOnly:true});}
  b.physics=G.HONRO_CORE.makePhysics({gravity:{x:0,y:0},regions:forces});
  if(b.honroStage===9)b.wind=0;
  if(b.honroStage===2)b.honroEscortGoalX=space.point('exit').x;
  b.sceneVersion++;
}
