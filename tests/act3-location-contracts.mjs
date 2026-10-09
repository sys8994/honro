import {beforeStage30Ferry} from './stage30-ferry-history-helpers.mjs';
import {splitV1Profile} from './split-v1-test-helpers.mjs';
/** Isolated native contracts for the approved location rebuild; not campaign-completion evidence. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {applyAct3Locations} from '../tools/map-forge/act3-location-rebuild.mjs';
import {LOCATION_ENCOUNTERS} from '../tools/map-forge/act3-location-encounters.mjs';
import {traverse} from './act1-spatial-test-helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,clone=x=>JSON.parse(JSON.stringify(x)),current=JSON.parse(await readFile(process.env.HONRO_LOCATION_INPUT||'shared/data/campaign.json','utf8')),source=beforeStage30Ferry(current),p=applyAct3Locations(g,source),rows=[];
g.HONRO_PROJECT=p;assert.deepEqual(clone(p.stages.slice(0,22)),source.stages.slice(0,22),'Only stages23–30 change');assert.deepEqual(clone(applyAct3Locations(g,p)),clone(p),'Location regeneration is idempotent');assert.deepEqual(clone(g.HonroMaps.finalize(JSON.parse(g.HonroMaps.serialize(p)))),clone(p),'New locations round-trip canonically');
const counts={23:[22,5],24:[18,4],25:[13,2],26:[15,3],27:[18,4],28:[24,5],29:[22,5],30:[20,4]};
for(const s of p.stages.slice(22)){
 const b=g.HonroMaps.createBattle(s,p,splitV1Profile(g,s),{origin:'campaign'}),heroes=b.units.filter(u=>u.side===0),enemies=b.units.filter(u=>u.side===1),expected=s.design.act3.party||['archer','mage','knight','occultist'];
 assert.deepEqual(clone(heroes.map(u=>u.cls).sort()),[...expected].sort());assert.equal(b.enemyLimit,[25,26].includes(s.metadata.stageId)?2:3);assert.equal(enemies.length,counts[s.metadata.stageId][0]);assert.equal(enemies.filter(u=>u.elite).length,counts[s.metadata.stageId][1]);
 for(const u of b.units){if(!g.HonroWorld.archetypes[u.honroVariant]?.flying)assert(C.validTerrainContactPose(b.terrain,u),s.id+'/'+u.id+' clear supported body');}
 for(const q of LOCATION_ENCOUNTERS[s.metadata.stageId]){assert(s.markers.some(m=>m.id===q.anchor)||s.elements.some(e=>e.id===q.anchor),s.id+' encounter anchor '+q.anchor);assert.equal(enemies.filter(u=>u.honroCohort===q.id).length,q.members.length);}
 for(let i=0;i<enemies.length;i++)for(let j=i+1;j<enemies.length;j++){const a=enemies[i],z=enemies[j];assert(!(Math.abs(a.x-z.x)<a.r+z.r&&Math.abs(a.y-z.y)<Math.min(a.h,z.h)),s.id+' overlapping enemies');}
 for(const u of heroes)assert(!enemies.some(e=>Math.hypot(e.x-u.x,e.y-u.y)<260),s.id+' clear initial hero space');
 for(const water of b.waters){for(const cls of expected){const bb=g.HonroMaps.createBattle(s,p,splitV1Profile(g,s),{origin:'campaign'}),u=bb.units.find(u=>u.side===0&&u.cls===cls),e=new C.Engine(bb,()=>{},true);bb.units=[u];bb.active=u.id;e.checkEnd=()=>false;const hp=u.hp;Object.assign(u,{x:water.x+water.w/2,y:s.height+90,vy:600,fallApexY:water.y-200});e.integrateBody(u,C.STEP);assert(!u.dead&&u.hp<hp&&C.validTerrainContactPose(bb.terrain,u),s.id+'/'+cls+' water-boundary recovery');}}
 rows.push({stage:s.metadata.stageId,kind:s.design.act3.kind,heroes:heroes.map(u=>u.cls),enemies:enemies.length,elite:enemies.filter(u=>u.elite).length,active:b.enemyLimit,waterPools:b.waters.length,bodyClearance:true});
}
const s=p.stages[26];assert.equal(s.markers.find(m=>m.id==='fire-screen').fireSite,'fire-west');assert.equal(s.markers.find(m=>m.id==='water-release').fireSite,'fire-east');for(const [cls,key,control]of [['knight','A','fire-screen'],['mage','A','fire-screen'],['archer','B','water-release'],['occultist','B','water-release']]){
 const run=open=>{const b=g.HonroMaps.createBattle(s,p,splitV1Profile(g,s),{origin:'campaign'}),u=b.units.find(u=>u.side===0&&u.cls===cls),e=new C.Engine(b,()=>{},true);b.units=b.units.filter(v=>v.side!==1);b.active=u.id;e.checkEnd=()=>false;const app={engine:e,stage:g.HONRO_SPLIT_V1.content.find(v=>v.id===27),actorBoundary:u.id,checkMission(){return false;},canInput(){return true;},event(){},sayLines(){}};g.HonroAct3.attach(app,e);assert.equal(g.HonroAct3.sourceIssue(b),null,'All required heroes, NPCs and objective sources retained');if(open)for(const t of b.terrain)if(t.honroAct3Gate)t.broken=true;return{b,u,e,app};};
 const ready=run(false),m=s.markers.find(m=>m.id===control),controlResult=traverse(g,ready.b,ready.e,ready.u,[m]);assert(controlResult.passed,'Starting '+cls+' reaches own control with both barriers closed');
 const route=s.design.act3.splitRoutes[key].map(([x,y])=>({x,y})),walking=run(false),walkClosed=traverse(g,walking.b,walking.e,walking.u,route,{jump:false});assert(!walkClosed.passed,'Closed fire/beam barrier still blocks '+cls+' walk-only route');
 // Open roof ascent may offer an ordinary jump bypass. Physical proximity
 // must never substitute for either E control or commit later story/escort work.
 const blocked=run(false),closed=traverse(g,blocked.b,blocked.e,blocked.u,route),A=g.HonroAct3;A.tick(blocked.app,0);
 assert(!A.state(blocked.b).complete);assert.deepEqual(clone(A.memory(blocked.b).done),{},'Jump route cannot commit controls, reunion, records or escort');assert.equal(A.firesStopped(blocked.b),false);
 for(const t of blocked.b.terrain.filter(t=>t.honroAct3Gate)){assert(!t.oneWay&&!t.broken,'Actual fire/beam gates remain solid and closed');blocked.e.damageTerrain(t,1e9,0,blocked.u.id);assert(!t.broken,'Direct damage cannot bypass ordered controls');}
 assert.equal(A.use(blocked.app,A.marker(blocked.b,'petition-record')),false,'Later record interaction stays locked even after roof bypass');
 if(['archer','knight'].includes(cls)){assert(A.eligibility(ready.app,A.marker(ready.b,control)).ok,'Original control remains reachable and usable');assert(A.use(ready.app,A.marker(ready.b,control)));const step=A.steps(ready.b).find(v=>v.id===control);assert(ready.b.terrain.find(t=>t.id===step.opens).broken);assert.deepEqual(Object.keys(A.memory(ready.b).done),[control],'Using one control cannot commit the other or later story');assert(!A.firesStopped(ready.b));}

 const free=run(true),opened=traverse(g,free.b,free.e,free.u,route);assert(opened.passed&&!opened.damage,'After controls '+cls+' reaches central court without damage');rows.push({stage:27,hero:cls,ownControl:controlResult.passed,closedWalkBlocked:!walkClosed.passed,closedJumpBypass:closed.passed,orderedControlsPreserved:true,openedRoute:opened.passed});
}
await mkdir('_local/reports/act3-locations',{recursive:true});await writeFile('_local/reports/act3-locations/contracts.json',JSON.stringify({scope:'Exact reviewed current30 is verified then projected to its immutable original before v1 location regeneration (including original20/4). Fresh30 contracts and all48 native route cases live in stage30-ferry-contracts/traversal. Explicit historical v1 regenerated locations; native data, actual bodies, water recovery and ordinary split approach fixtures. After-state walking uses opened gate fixtures; separate actual control actions and closed-gate jump probes verify ordered objective protection. No continuous campaign, balance, UI or browser claim.',rows},null,2));console.log('PASS historical v1 location source, canonical round-trip, 8 authored formations, actual party rosters, water/body safety and 4 two-sided approaches');
