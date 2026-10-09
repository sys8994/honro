import {historicalStage11Runtime} from './stage11-ravine-history-helpers.mjs';
import './act2-reviewed-routes.mjs';
import {traverse} from './act1-spatial-test-helpers.mjs';
import {beforeApprovedTopology} from './approved-topology-history-helpers.mjs';
// Structural/physics fixtures. These prove room contracts and isolated actions,
// not normal-combat difficulty, human readability or browser rendering quality.
import assert from 'node:assert/strict';
import {beforeObjectiveRevision} from './objective-delta-helpers.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {plain,hash} from './act2-spatial-contract-helpers.mjs';
import {openRoute,terrainFace,assertStanding,coordinates} from './act2-spatial-test-helpers.mjs';

const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
// Keep the original Stage11 room/geometry assertions on immutable public D;
// stage11-ravine-traversal/semantics/history separately require the full new map.
historicalStage11Runtime(g);
console.log('SCOPE original Stage11 spatial contracts plus unchanged current12–20; new ravine has its separate command-only suite');
const intent=JSON.parse(await readFile('tests/fixtures/act2-spatial-intent.json','utf8'));
const beforeTopology=beforeApprovedTopology(g.HONRO_PROJECT,{stages:[15]});
const historicalProject=beforeObjectiveRevision(beforeTopology,g.HONRO_CONTENT).project;
const idFilter=process.argv.slice(2).map(Number);
const check=(name,fn)=>{const detail=fn();rows.push({name,passed:true,detail});console.log('PASS',name);};
const fixture=id=>{const q=battlefield(g,id);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);return q;};
for(const expected of intent.stages.filter(s=>!idFilter.length||idFilter.includes(s.id))){
 const id=expected.id,st=g.HONRO_PROJECT.stages[id-1],space=st.design?.space;
 check(`${id}: distinct approved topology and canonical surface references`,()=>{
  assert(space,'A paint-only room label is not a spatial design');assert.equal(space.version,1);assert.equal(space.geometryRevision,3);assert.equal(beforeTopology.stages[id-1].design.space.topologyId,expected.topologyId,'Original topology identity after exact approved path reversal');
  const rooms=new Map(space.rooms.map(r=>[r.id,r])),surfaces=new Map(space.surfaces.map(s=>[s.id,s]));
  assert.equal(rooms.size,space.rooms.length,'room IDs must be unique');assert.equal(surfaces.size,space.surfaces.length,'surface IDs must be unique');
  assert.deepEqual([...rooms.keys()].sort(),[...expected.rooms].sort());
  for(const room of rooms.values()){
   assert(room.terrainIds.length,room.id+' has no physical support');assert(['open','cave','transition'].includes(room.sky),room.id+' has invalid sky state');if(room.sky==='cave')assert(room.ceilingIds.length,room.id+' cave room omits its collision roof');
   assert(['x','y','w','h'].every(k=>Number.isFinite(room.bounds[k]))&&room.bounds.w>0&&room.bounds.h>0,room.id+' has invalid bounds');
   for(const ref of [...room.terrainIds,...room.ceilingIds])assert(st.terrains.some(t=>t.id===ref),room.id+' references missing terrain '+ref);
  }
  for(const surface of surfaces.values()){
   const terrain=st.terrains.find(t=>t.id===surface.terrainId);assert(terrain,surface.id);
   assert(surface.edgeIndices.length,surface.id+' has no canonical edges');
   assert(surface.edgeIndices.every(i=>Number.isInteger(i)&&i>=0&&i<terrain.points.length),surface.id+' edge index');
   assert(surface.roomIds.length&&surface.roomIds.every(id=>rooms.has(id)),surface.id+' room references');
  }
  const main=space.routes.find(r=>r.id==='main');assert(main?.kind==='required'&&main.anchors.length>2);
  assert.deepEqual(plain(main.anchors.map(coordinates)),plain(st.routes.map(coordinates)),'runtime route and authored main route disagree');
  for(const point of main.anchors){
   const surface=surfaces.get(point.surfaceId);assert(surface,'main route references missing surface '+point.surfaceId);
   const face=terrainFace(st,surface,point.x,{restored:main.requires?.some(r=>r.terrainId===surface.terrainId&&r.state==='restored')});assert(face,'no canonical edge beneath main anchor');
   assert(Math.abs(face.y-point.y)<.1,`${id}: anchor is off canonical edge by ${face.y-point.y}`);
   assert(Math.abs(face.slope)<=1.35,'required route anchor exceeds standing slope');
  }
  const graph=new Map([...rooms.keys()].map(id=>[id,[]]));
  for(const link of space.connections){
   assert(rooms.has(link.from)&&rooms.has(link.to),link.id+' invalid rooms');
   assert(['walk','gated-walk','optional-jump'].includes(link.kind),link.id+' invents a movement mechanic');
   assert(space.routes.some(r=>r.id===link.routeId),link.id+' missing actual route');
   if(link.kind==='gated-walk'&&!link.requires?.length){const prior=historicalProject.stages[id-1].design.space.connections.find(r=>r.id===link.id),retired=new Set([...(g.HonroObjectiveRevision.removed[id]||[]),...(g.HonroObjectiveRevision.gates[id]||[])]);assert(prior?.requires?.length&&prior.requires.every(r=>retired.has(r.objectiveId)||retired.has(r.terrainId)),link.id+' lost an unrelated state prerequisite');}
   if(link.kind!=='optional-jump'){graph.get(link.from).push(link.to);graph.get(link.to).push(link.from);}
  }
  const reached=new Set(),queue=[space.rooms[0].id];while(queue.length){const key=queue.shift();if(reached.has(key))continue;reached.add(key);queue.push(...graph.get(key));}
  for(const [objectiveId,roomId] of Object.entries(expected.bindings)){
   if(g.HonroObjectiveRevision.removed[id]?.includes(objectiveId)){assert(!space.sites[objectiveId],'retired attack target still has a live site');continue;}
   const site=space.sites[objectiveId];assert(site,objectiveId+' has no site');assert.equal(site.roomId,roomId,objectiveId+' moved into the wrong narrative room');
   assert(reached.has(roomId),objectiveId+' requires an optional jump');
   assert(surfaces.has(site.standing?.surfaceId),objectiveId+' has no standing surface');
   assert([site.x,site.y,site.standing.x,site.standing.y].every(Number.isFinite),objectiveId+' has nonfinite coordinates');
  }
  return{topology:space.topologyId,rooms:rooms.size,surfaces:surfaces.size,mainAnchors:main.anchors.length};
 });
 if(space.routes.find(r=>r.id==='main').defaultJump)check(`${id}: approved cavern route is reachable by all four unupgraded bodies`,()=>{
  const rows=[];
  for(const cls of ['archer','mage','knight','occultist']){
   const {b,e}=fixture(id),u=e.heroesAlive().find(u=>u.cls===cls);assert(!u.ranks.SP03,'No jump training in this route proof');
   b.units=[u];b.active=u.id;e.checkEnd=()=>false;openRoute(b);
   const result=traverse(g,b,e,u,space.routes.find(r=>r.id==='main').anchors);
   assert(result.passed,JSON.stringify({cls,failed:result.failed}));rows.push({cls,jumps:result.jumps,damage:result.damage});
  }
  return rows;
 });
 check(`${id}: mandatory route and every objective have exposed four-hero clearance`,()=>{
  const {b,e}=fixture(id);openRoute(b);let probes=0;
  const route=space.routes.find(r=>r.id==='main').anchors;
  for(const point of route)for(const hero of e.heroesAlive()){assertStanding(g,b,e,point,hero,`${id}/${hero.cls}/route`);probes++;}
  for(const step of g.HONRO_CONTENT.stages[id-1].steps){
   const site=space.sites[step.id];
   for(const hero of e.heroesAlive()){assertStanding(g,b,e,site.standing,hero,`${id}/${hero.cls}/${step.id}`);probes++;}
   const marker=b.honroMarkers.find(m=>m.id===step.id);
   if(step.kind!=='destroy'&&step.kind!=='defeat')assert(marker,step.id+' objective marker is absent');
   if(step.kind==='hold'){
    assert(Math.hypot(site.standing.x-marker.x,site.standing.y-marker.y)<step.radius,step.id+' is outside its unchanged hold radius');
    for(const offset of [-120,120]){
     const y=g.HonroWorld.top(b,site.standing.x+offset,site.standing.y);
     assertStanding(g,b,e,{x:site.standing.x+offset,y},e.active,step.id+' defense footprint');
     assert(Math.hypot(offset,y-marker.y)<step.contestRadius,step.id+' lacks a continuous nearby contest floor');
    }
   }
  }
  return{probes};
 });
 check(`${id}: gate controls remain reachable on the approach side before opening`,()=>{
  const {b,e}=fixture(id),checked=[];
  for(const step of g.HONRO_CONTENT.stages[id-1].steps.filter(s=>['gate','bridge','repair','sluice'].includes(s.id))){
   const gate=b.terrain.find(t=>t.id===(step.id==='sluice'?'water-gate':'gate-'+step.id));if(!gate)continue;
   const standing=space.sites[step.id].standing;
   for(const hero of e.heroesAlive())assertStanding(g,b,e,standing,hero,`${id}/${step.id} closed gate`);
   const m=b.honroMarkers.find(m=>m.id===step.id);
   assert(Math.hypot(standing.x-m.x,(standing.y-m.y)*.75)<=250&&Math.abs(standing.y-m.y)<=150,step.id+' control outside interaction range');
   const sequence=g.HONRO_CONTENT.stages[id-1].steps,index=sequence.findIndex(s=>s.id===step.id),previous=space.sites[sequence[Math.max(0,index-1)].id].standing,center=gate.x+gate.w*.5;
   assert((previous.x-center)*(standing.x-center)>=0,step.id+' control moved behind its closed gate');
   checked.push(step.id);
  }
  return checked;
 });
 for(const step of g.HONRO_CONTENT.stages[id-1].steps.filter(s=>s.kind==='destroy'))check(`${id}/${step.id}: actual projectile reaches the destructible target`,()=>{
  const {b,e}=fixture(id),site=space.sites[step.id],u=e.heroesAlive().find(u=>u.cls===(step.requiredClass||'archer'));
  const t=b.terrain.find(t=>t.id===step.id);assert(t&&site.target,'target geometry and declared site required');
  // Isolate the authored firing position, without moving the target or roof.
  b.units=[u];b.active=u.id;e.checkEnd=()=>false;Object.assign(u,{...coordinates(site.standing),vx:0,vy:0});
  g.HonroAct2.memory(b).silenced=true;g.HonroAct2.memory(b).done.brace=true;
  assertStanding(g,b,e,site.standing,u,step.id+' firing position');
  if(t.honroRockfall)assert(u.x<=t.x-150||u.x>=t.x+t.w+150,step.id+' firing point inside the rockfall footprint');
  const skill=C.SKILLS[C.baseSkill(u.cls)],powers=[.2,.35,.5,.65,.8,1],direct=Math.atan2(u.y-u.h*.6-(t.y+t.h*.5),t.x+t.w*.5-u.x)*180/Math.PI;
  const angles=[direct,...Array.from({length:97},(_,j)=>-12+j*2)];let aim=null;
  for(const power of powers){for(const angle of angles){const p=e.predict(u,skill,angle,power,undefined,false,true);if(p.terrain===t.id){aim={angle,power};break;}}if(aim)break;}
  assert(aim,`${id}/${step.id}: no legal ${skill.id} path from declared standing site`);
  const before=t.hp;assert(e.fire(skill.id,aim.angle,aim.power));
  for(let frame=0;frame<1800&&b.projectiles.length;frame++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);
  assert(t.hp<before||t.broken,step.id+' prediction succeeded but live projectile never damaged target');
  return{standing:coordinates(site.standing),skill:skill.id,...aim,damage:before-t.hp};
 });
}
function roomSection(id,roomId){
 const {b,e}=fixture(id),space=g.HONRO_PROJECT.stages[id-1].design.space,room=space.rooms.find(r=>r.id===roomId),x=room.bounds.x+room.bounds.w*.5;
 const floor=b.terrain.find(t=>t.id==='act2-floor'),y=C.topAt(floor,x,0);
 const intersections=b.terrain.filter(t=>t.honroCeiling).flatMap(t=>(t.vertices||[]).flatMap((a,i)=>{const z=t.vertices[(i+1)%t.vertices.length];return Math.abs(z.x-a.x)>1e-6&&x>=Math.min(a.x,z.x)&&x<=Math.max(a.x,z.x)?[a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x)]:[];})).filter(v=>v<y);
 const ceiling=intersections.length?Math.max(...intersections):null;return{b,e,x,y,ceiling,clearance:ceiling===null?Infinity:y-ceiling};
}
if(!idFilter.length||idFilter.includes(13))check('13 daylight forecourt and low gallery have different actual shot ceilings',()=>{
 const outside=roomSection(13,'sunken-forecourt'),low=roomSection(13,'low-gallery'),pocket=roomSection(13,'inner-pocket');
 assert.equal(outside.ceiling,null,'forecourt is painted as outdoor but physically roofed');assert(low.clearance>150&&low.clearance<1300);assert(pocket.clearance>low.clearance+250,'inner pocket never opens above low gallery');
 const {b,e,x,y}=low,u=e.active;b.units=[u];Object.assign(u,{x,y,vx:0,vy:0});
 const high=e.predict(u,C.SKILLS.A01,90,1,undefined,true,true),flat=e.predict(u,C.SKILLS.A01,0,.65,undefined,true,true);
 assert(b.terrain.find(t=>t.id===high.terrain)?.honroCeiling,'high gallery arc escaped actual roof');assert(Math.abs(flat.x-x)>350,'low gallery has no usable low-angle firing lane');
 return{lowClearance:low.clearance,pocketClearance:pocket.clearance,highHit:high.terrain,lowFlight:Math.abs(flat.x-x)};
});
if(!idFilter.length||idFilter.includes(15))check('15 low sluice neck opens into a physically tall target shaft',()=>{
 const low=roomSection(15,'sluice-neck'),shaft=roomSection(15,'open-shaft');assert(shaft.clearance>low.clearance*1.8&&shaft.clearance>2000,'shaft silhouette does not open in collision geometry');return{neckClearance:low.clearance,shaftClearance:shaft.clearance};
});
if(!idFilter.length||idFilter.includes(20))check('20 convoy leaves a real overhang and reaches an unroofed dawn shelf',()=>{
 const mouth=roomSection(20,'blocked-mouth'),shelf=roomSection(20,'open-rest-shelf');assert(Number.isFinite(mouth.clearance)&&mouth.clearance>150);assert.equal(shelf.ceiling,null,'convoy rest shelf remains under invisible cave collision');return{mouthClearance:mouth.clearance,shelfOpen:true};
});
if(!idFilter.length||idFilter.includes(18)||idFilter.includes(19))check('18/19 share exact structural polygons, portals, walking connections and bell transform',()=>{
 const [a,b]=[18,19].map(id=>g.HONRO_PROJECT.stages[id-1]);
 const structural=st=>st.terrains.filter(t=>!t.properties?.honroSeal&&!t.properties?.honroBlocker&&!t.id.startsWith('gate-')&&!g.HONRO_CONTENT.stages[Number(st.id.split('-')[1])-1].steps.some(s=>s.kind==='destroy'&&s.id===t.id));
 assert.equal(a.design.space.sharedSpaceId,b.design.space.sharedSpaceId);assert(a.design.space.sharedSpaceId);
 assert.deepEqual(plain(structural(a)),plain(structural(b)),'shared vault structural polygons differ');
 assert.deepEqual(plain(a.initialState.honroCaveEnvelope),plain(b.initialState.honroCaveEnvelope),'shared vault envelope differs');
 assert.deepEqual(plain(a.design.space.surfaces),plain(b.design.space.surfaces));
 assert.deepEqual(plain(a.design.space.connections),plain(b.design.space.connections));
 const bell=st=>st.elements.filter(e=>/bell|mokjong/.test(e.assetId));
 assert(bell(a).length,'missing visible bell');assert.deepEqual(plain(bell(a).map(e=>({assetId:e.assetId,x:e.x,y:e.y,scale:e.scale,rotation:e.rotation,flipX:e.flipX}))),plain(bell(b).map(e=>({assetId:e.assetId,x:e.x,y:e.y,scale:e.scale,rotation:e.rotation,flipX:e.flipX}))));
 return{sharedSpaceId:a.design.space.sharedSpaceId,geometryHash:hash(structural(a)),bells:bell(a).length};
});
if(!idFilter.length||idFilter.includes(20))check('20 convoy physically walks right, rests, restarts and reaches the final marker',()=>{
 const {b,e,app,st}=fixture(20),npc=e.unit('objective'),hero=e.active,space=g.HONRO_PROJECT.stages[19].design.space;
 assert(npc?.honroProtected);openRoute(b);b.units=[hero,npc];e.checkEnd=()=>false;
 const a=g.HonroAct2.memory(b);for(const s of st.steps){if(s.id==='escort-mid')break;a.done[s.id]=true;}a.escort=true;
 const sx=npc.x+180;Object.assign(hero,{x:sx,y:g.HonroWorld.top(b,sx,npc.y),vx:0,vy:0});
 let ticks=0,lastX=npc.x,maxStall=0,stall=0,ambush=null;
 const advance=()=>{
  hero.moveLeft=1800;if(hero.x<npc.x+450)e.walk(hero,1,1/60,true);
  e.tick(1/60);g.HonroAct2.tick(app,1/60);ticks++;
  if(!ambush){
   app.actorBoundary=hero.id;g.HonroAct2.tick(app,0);app.actorBoundary=null;
   if(npc.x<4400)assert(!a.events['convoy-ambush'],'existing progress ambush fired before its threshold');
   else if(a.events['convoy-ambush']){const spawned=b.units.filter(u=>u.honroSpawnSource==='convoy-ambush');assert.equal(spawned.length,g.HonroAct2Plan.forStage(20).progressWave.count);ambush={x:npc.x,count:spawned.length};b.units=[hero,npc];}
  }
  assert(npc.x>=lastX-.01,'convoy reversed direction');assert(!npc.dead&&npc.hp>0,'convoy died during isolated walking');
  if(Math.abs(npc.x-lastX)<.01)stall++;else stall=0;maxStall=Math.max(maxStall,stall);lastX=npc.x;
  assert(stall<240,`convoy blocked at ${npc.x},${npc.y}`);
 };
 while(g.HonroAct2.current(b)?.id==='escort-mid'&&ticks<9000)advance();
 assert(ambush,'existing convoy progress wave never spawned');assert(a.done['escort-mid'],'convoy did not physically reach rest shelf');assert.equal(g.HonroAct2.current(b)?.id,'hold-convoy');
 const restingX=npc.x;for(let j=0;j<120;j++){e.tick(1/60);g.HonroAct2.tick(app,1/60);}assert.equal(npc.x,restingX,'convoy must wait during defense');
 // Defense and its enemies are isolated elsewhere; only its completion is
 // supplied here to verify the existing NPC restart/arrival mechanism.
 a.done['hold-convoy']=true;a.done['clear-pass']=true;
 while(g.HonroAct2.current(b)?.id==='escape'&&ticks<15000)advance();
 assert(a.done.escape,'convoy did not physically reach dawn arrival');
 const target=b.honroMarkers.find(m=>m.id==='escape');assert(Math.hypot(npc.x-target.x,npc.y-target.y)<170);
 const convoyRoute=space.routes.find(r=>r.id==='main').anchors.filter(p=>p.x>=space.sites.escort.x);
 assert(convoyRoute.every((p,i)=>!i||p.x>=convoyRoute[i-1].x),'convoy route reverses X');
 app.actorBoundary=hero.id;g.HonroAct2.tick(app,0);app.actorBoundary=null;assert(!b.units.some(u=>u.honroSpawnSource==='convoy-ambush'),'one-time progress wave repeated');
 return{ticks,restingX,arrival:coordinates(npc),maxStall,ambush};
});
await mkdir('_local/reports/act2-spatial',{recursive:true});await writeFile(`_local/reports/act2-spatial/space${idFilter.length?'-'+idFilter.join('-'):''}.json`,JSON.stringify({checks:rows,limitations:'Isolated structural and action fixtures. No normal-combat clear, browser visual approval or performance claim.'},null,2));
console.log(`PASS ${rows.length} spatial/action checks`);
