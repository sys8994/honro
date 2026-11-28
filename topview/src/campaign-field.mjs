import {center} from './terrain.mjs';

const G=globalThis, alive=u=>u&&!u.dead&&u.hp>0;
const attackable=u=>alive(u)&&u.side===1&&!u.honroObjectiveTarget;
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clone=p=>({x:p.x,y:p.y});
const limits=(n,a,b)=>Math.max(a,Math.min(b,n));

// The opposite roost and the low funeral road now share a planar gorge. Both
// the actual flying bodies and the announced reinforcements use these bounds.
export function configureAirspace(b,space){
  if(b.honroStage!==2||!b.honroMap?.flightRegion)return;
  const upper=space.point('safeDescentUpper'),shelf=space.point('rightShelf'),basin=space.point('rightBasin');
  Object.assign(b.honroMap.flightRegion,{left:upper.x-610,right:shelf.x+640,top:shelf.y-870,bottom:basin.y+690});
}
export function placeBierEntries(b,space){
  if(!b.honroStage8BierSpec||!space.map.waveSites)return;
  function locate(entry){
    const pair=space.map.waveSites[entry.side];if(!pair)return;
    [entry,...(entry.alternates||[])].forEach((option,index)=>{
      const [cx,cy]=pair[Math.min(index,pair.length-1)];
      const x=cx*space.cell,y=cy*space.cell;
      Object.assign(option,{x,y,spacing:180});
      for(const [i,m] of (option.members||[]).entries()){
        const def=globalThis.HonroWorld.archetypes[m.kind];
        const foot=space.free({x:x+[-134,134,0][i],y:y+[30,18,-156][i]},def.r,!!def.flying);
        if(!foot)throw Error('상여 증원 발점 '+m.role);
        Object.assign(m,{x:foot.x,y:foot.y+def.h/2});
      }
    });
    for(const alternate of entry.variants||[])locate(alternate);
  }
  for(const entry of Object.values(b.honroStage8BierSpec.entries))locate(entry);
}
// Native actors, named sites and event positions are authored in the original
// stage coordinates. Preserve their local grouping on the corresponding shelf.
export function projectBattle(b,space){
  const {map}=space,old=b.honroMapAnchors;
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
  // Each threatened household has its own named guards in the original mission.
  // Put those same actors on the approach to their resident, within the native
  // rescue challenge. Displacing or stunning the guard still opens the rescue.
  const guardSites=new Map();
  for(const marker of b.honroMarkers.filter(m=>m.rescueGuards?.length)){
    const origin=space.point(map.placements[marker.target]);
    marker.rescueGuards.forEach((id,i)=>guardSites.set(id,{x:origin.x+[-218,198,84][i%3],y:origin.y+[-43,79,118][i%3]}));
  }
  const placed=[],groupCount=new Map();
  function seat(u,hidden=false){
    const key=map.placements[u.id];let p=guardSites.get(u.id)||pointFor(u.id,u.x,u.y);
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
  b.units.slice().sort((a,c)=>(map.placements[c.id]?2:guardSites.has(c.id)?1:0)-(map.placements[a.id]?2:guardSites.has(a.id)?1:0)).forEach(u=>seat(u));
  for(const u of Object.values(b.honroStaging?.hidden||{}))seat(u,true);
  for(const t of b.honroQuestTargets||[]){const u=b.units.find(v=>v.id===t.id);if(u)Object.assign(t,{x:u.x-t.w/2,y:u.y-t.h});}
  for(const m of b.honroMarkers){
    const p=pointFor(m.id,m.x,m.y);const target=m.target&&b.units.find(u=>u.id===m.target);
    const dest=target?center(target):space.free(p,27)||space.landing(p,27);
    if(dest)Object.assign(m,dest);
    if(m.action==='climbSite'&&m.to){
      const steps=map.stairs[m.id.endsWith('-0')?0:1],end=m.id.includes('down')?0:steps.length-1;
      const coord=pt=>({x:pt[0]/map.tileWidth*map.cell,y:pt[1]/map.tileHeight*map.cell});
      Object.assign(m,coord(steps[end?0:steps.length-1]));Object.assign(m.to,coord(steps[end]));
    }
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
  const relocateEntry=o=>{
    if(!o||typeof o!=='object')return;
    position(o);
    if(Number.isFinite(o.maxBossX))o.maxBossX=warp(o.maxBossX,baseline(o.maxBossX)).x;
    if(Number.isFinite(o.minBossX))o.minBossX=warp(o.minBossX,baseline(o.minBossX)).x;
    for(const key of ['members','alternates','variants','points'])for(const child of o[key]||[])relocateEntry(child);
  };
  if(b.honroStage8BierSpec){
    for(const o of Object.values(b.honroStage8BierSpec.entries))relocateEntry(o);
    placeBierEntries(b,space);
    const movement=b.honroStage8BierSpec.movement;
    movement.destinations=[{id:'central-court',...space.point('courtyard')}];
    movement.routes=[{id:'east-courtyard',points:map.convoy}];
  }
  for(const [name,p] of Object.entries(old)){const dest=map.anchors[name]?space.point(name):warp(p.x,p.y);Object.assign(p,dest);}
  for(const cells of [b.honroMap?.positioning?.cells||[]])for(const cell of cells){if(cell.region)condition({region:cell.region});}
  b.honroTopview=1;b.tvTerrainRevision=map.meta.revision;b.width=space.width;b.height=space.height;b.vertical=false;
  b.honroPlayBounds={x:0,y:0,w:b.width,h:b.height};b.honroTerrainBounds={...b.honroPlayBounds};
  for(const name of ['terrain','waters','drafts','fields','decor','honroElements','honroWorldTerrain','honroLandmarks','honroSurfaceZones','routePoints'])b[name]=[];
  const forces=[];
  if(b.honroStage===5){
    const lip=space.point('cleat'),base=space.point('waterfallFoot');
    // The same course is used by the native fluid integrator, preview and sprite ribbons.
    const edge=(offset,a=0)=>[{x:lip.x-190+offset,y:lip.y-240},{x:lip.x-170+offset+a,y:lip.y+10},{x:base.x+offset+a*.4,y:base.y},{x:base.x+107+offset+a*.4,y:base.y+5},{x:lip.x-63+offset+a,y:lip.y+10},{x:lip.x-83+offset,y:lip.y-240}];
    b.tvWaterCourses={closed:edge(0),opened:edge(185,110)};
    const points=b.tvWaterCourses.closed;b.terrain.push({id:'waterfall-veil',mat:'water',x:Math.min(...points.map(p=>p.x)),y:lip.y-240,w:480,h:base.y-lip.y+260,vertices:points,honroWaterFluidVertices:points,indestructible:true,broken:false});
  }
  b.physics=G.HONRO_CORE.makePhysics({gravity:{x:0,y:0},regions:forces});
  if(b.honroStage===9)b.wind=0;
  if(b.honroStage===2)b.honroEscortGoalX=space.point('exit').x;
  configureAirspace(b,space);b.sceneVersion++;
}
