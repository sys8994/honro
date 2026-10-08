import {splitV1Profile} from './split-v1-test-helpers.mjs';
/** Isolated native contracts for the approved location rebuild; not campaign-completion evidence. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {applyAct3Locations} from '../tools/map-forge/act3-location-rebuild.mjs';
import {LOCATION_ENCOUNTERS} from '../tools/map-forge/act3-location-encounters.mjs';
import {traverse} from './act1-spatial-test-helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,clone=x=>JSON.parse(JSON.stringify(x)),source=JSON.parse(await readFile(process.env.HONRO_LOCATION_INPUT||'shared/data/campaign.json','utf8')),p=applyAct3Locations(g,source),rows=[];
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
 const run=open=>{const b=g.HonroMaps.createBattle(s,p,splitV1Profile(g,s),{origin:'campaign'}),u=b.units.find(u=>u.side===0&&u.cls===cls),e=new C.Engine(b,()=>{},true);b.units=[u];b.active=u.id;e.checkEnd=()=>false;if(open)for(const t of b.terrain)if(t.honroAct3Gate)t.broken=true;return{b,u,e};};
 const ready=run(false),m=s.markers.find(m=>m.id===control),controlResult=traverse(g,ready.b,ready.e,ready.u,[m]);assert(controlResult.passed,'Starting '+cls+' reaches own control with both barriers closed');
 const blocked=run(false),route=s.design.act3.splitRoutes[key].map(([x,y])=>({x,y})),closed=traverse(g,blocked.b,blocked.e,blocked.u,route);assert(!closed.passed,'Closed fire/beam barrier blocks '+cls+' normal route');
 const free=run(true),opened=traverse(g,free.b,free.e,free.u,route);assert(opened.passed&&!opened.damage,'After controls '+cls+' reaches central court without damage');rows.push({stage:27,hero:cls,ownControl:controlResult.passed,closedBarrierBlocks:!closed.passed,openedRoute:opened.passed});
}
await mkdir('_local/reports/act3-locations',{recursive:true});await writeFile('_local/reports/act3-locations/contracts.json',JSON.stringify({scope:'Explicit historical v1 regenerated locations; native data, actual bodies, water recovery and ordinary split approach fixtures. Gates opened in after-state fixture only. No continuous campaign, balance, UI or browser claim.',rows},null,2));console.log('PASS historical v1 location source, canonical round-trip, 8 authored formations, actual party rosters, water/body safety and 4 two-sided approaches');
