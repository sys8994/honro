import {gzipSync,gunzipSync} from 'node:zlib';
/** Synthetic regression for real artillery-compressed poses; not mission evidence. */
import assert from'node:assert/strict';import vm from'node:vm';import{readFile,writeFile}from'node:fs/promises';import{runtime}from'../../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';const g=await runtime({legacyMaps:false}),p=JSON.parse(gunzipSync(await readFile('art/stage39-vector-production/official-project.json.gz')));const profile=g.HONRO_CORE.defaults();g.HonroEquipment.fresh(profile);const b=g.HonroMaps.createBattle(p.stages[0],p,profile),e=new g.HONRO_CORE.Engine(b,()=>{},true);b.honroAct4Preview=39;b.units=b.units.filter(u=>u.honroAct4Resident).slice(0,2);const[a,z]=b.units;Object.assign(a,{x:5059.897624008539,y:2000,fixed:false});Object.assign(z,{x:5091.6117617839955,y:2000,fixed:false});
const src=await readFile('shared/runtime/act4-coast-events.js','utf8'),start=src.indexOf('function separatingRescueStep('),end=src.indexOf('\n',src.indexOf('function moveNpc('));vm.runInContext('const G=globalThis;const alive=u=>u&&!u.dead&&u.hp>0;'+src.slice(start,end)+';globalThis.testMoveNpc=moveNpc;',g);
const move=g.testMoveNpc,initial=z.x;assert(e.grounded(z));assert(!g.HonroTerrain.separated(b,z,z.x,z.y,12));assert.equal(move(e,a,6900,1/60,170),0,'rear cannot move deeper into existing overlap');assert(move(e,z,7050,1/60,170)>0,'front ordinary step separates existing compression');assert(z.x-initial<=z.walkSpeed/60+1e-6);
for(let i=0;i<40;i++)move(e,z,7050,1/60,170);assert(g.HonroTerrain.separated(b,z,z.x,z.y,12));assert(move(e,a,6900,1/60,170)>0);
// Other occupants remain blockers even when the resident already overlaps them.
Object.assign(a,{x:5059.897624008539,y:2000});Object.assign(z,{x:5091.6117617839955,y:2000,honroAct4Resident:false});assert.equal(move(e,a,6900,1/60,170),0);
// New resident overlap is not permitted.
z.honroAct4Resident=true;a.x=5000;z.x=5056;assert.equal(move(e,a,6900,1/60,170),0);
// A real solid wall remains a blocker; no terrain bypass for de-overlap.
a.x=5059.897624008539;z.x=5091.6117617839955;b.terrain.push(g.HonroGeometry.terrain({id:'regression-wall',type:'solid',points:[{x:5100,y:1850},{x:5140,y:1850},{x:5140,y:2000},{x:5100,y:2000}]},b.height));assert.equal(move(e,z,7050,1/60,170),0);b.terrain.pop();
// Airborne compressed actors cannot use the supported separation exception.
z.airborne=true;assert.equal(move(e,z,7050,1/60,170),0);z.airborne=false;
// No safe rescue flags are synthesized; route/support decisions remain Engine's.
assert(!b.honroAct4PreviewState?.rescued);const report={scope:'Synthetic isolated actual Engine movement regression from normal-tape artillery positions; not a gameplay pass',existingRescueOverlapSeparatesByWalking:true,rearCannotDeepenOverlap:true,unrelatedActorStillBlocks:true,newResidentOverlapStillBlocks:true,solidWallStillBlocks:true,airborneStillBlocked:true,stepBoundedByWalkSpeed:true,noRescueFlags:true};await writeFile('art/stage39-vector-production/resident-separation-check.json',JSON.stringify(report,null,2));console.log(report);
