/** Authored density and real shared-engine body fixtures. Not a normal clear. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {authorStage8Bier,bierEncounterSeeds} from '../tools/map-forge/stage8-bier.mjs';
const stageId=8,g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,before=structuredClone(g.HONRO_PROJECT);
const project=await authorStage8Bier(before,g,{art:false});
assert.equal(JSON.stringify(project.stages.filter(s=>s.metadata.stageId!==stageId)),JSON.stringify(before.stages.filter(s=>s.metadata.stageId!==stageId)),'Other chapters remain exact');
const s=project.stages[stageId-1],old=before.stages[stageId-1];
assert.equal(JSON.stringify(s.terrains),JSON.stringify(old.terrains),'Encounter author keeps the reviewed terrain');
assert.equal(JSON.stringify(s.units.filter(u=>u.team==='player'||u.team==='ally')),JSON.stringify(old.units.filter(u=>u.team==='player'||u.team==='ally')),'Player and human NPC authoring remains exact');
assert.equal(s.initialState.honroEncounterDensityRevision,1);
assert.equal(s.initialState.honroEncounterDensityPopulationCap,45);
g.HONRO_PROJECT=project;
const q=battlefield(g,stageId);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);if(stageId!==8)g.HonroAct2.attach(q.app,q.e);
assert.equal(q.e.alive(1).length,37);assert.equal(q.e.alive(1).filter(u=>u.elite).length,9);assert.equal(q.b.enemyLimit,4);
const rows=[];
for(const u of q.b.units){const a=s.units.find(a=>a.id===u.id);assert(a);assert.equal(u.x,a.x,u.id+' has no hidden x repair');assert.equal(u.y,a.y,u.id+' has no hidden y repair');
 const flying=g.HonroWorld.archetypes[u.honroVariant]?.flying;
 assert(flying?!g.HonroTerrain.intersects(q.b,u):C.validTerrainContactPose(q.b.terrain,u),u.id+' has real support or clear air');
 assert.equal(g.HonroStage8Bier.terrainBlockers(q.e,u).length,0,u.id+' has whole-body ceiling clearance');
 rows.push({id:u.id,kind:u.honroVariant||u.cls,x:u.x,y:u.y,hp:u.hp,elite:!!u.elite,role:u.honroEncounterRole});
}
for(const [i,u]of q.b.units.entries())for(const v of q.b.units.slice(i+1))assert(Math.abs(v.x-u.x)>=v.r+u.r+12||u.y<=v.y-v.h-12||u.y-u.h>=v.y+12,u.id+'/'+v.id+' body clearance');
for(let frame=0;frame<960;frame++)q.e.stepUnits(1/120);
for(const old of rows){const u=q.e.unit(old.id);assert(Math.hypot(u.x-old.x,u.y-old.y)<.08,u.id+' no spawn drift');assert.equal(u.hp,old.hp,u.id+' no spawn damage');}
assert.equal(bierEncounterSeeds('candidate28e5').length,28);assert.equal(bierEncounterSeeds('oldBudget20e0').length,20);
const entryChecks=[];
for(const [id,entry]of Object.entries(s.initialState.honroStage8BierSpec.entries))for(const [index,at]of [entry,...entry.alternates].entries()){
 const w=battlefield(g,8);g.HonroAllies.attach(w.app,w.e);g.HonroEncounters.attach(w.app,w.e);
 // Remove opponents only in this isolated entry-geometry fixture. Occupancy,
 // warning/opportunity and actual combat are separate runtime tests.
 w.b.units=w.b.units.filter(u=>u.side!==1);const action=w.b.honroEvents.find(ev=>ev.id===id).action;
 const members=at.members||Array.from({length:action.n},(_,i)=>({kind:action.kind,x:at.x+(i-(action.n-1)/2)*at.spacing,y:at.y,air:at.air,support:at.support}));
 assert(g.HonroEncounterDensity.spawnMembers(w.app,action,{members}),id+' entry '+index+' supports every exact member');
 const born=w.b.units.filter(u=>u.honroSpawnSource===id);assert.equal(born.length,action.n);entryChecks.push({id,index,members:born.map(u=>({kind:u.honroVariant,x:u.x,y:u.y}))});
}
await mkdir('_local/reports/encounter-density',{recursive:true});await writeFile('_local/reports/encounter-density/stage8-authoring.json',JSON.stringify({stageId,initial:37,elites:9,finite:8,rows,scope:'Authored bodies, exact shared-engine mount and eight seconds of natural physics; not normal combat or browser verification.'},null,2)+'\n');
console.log('PASS Stage8 density: 37/9, finite8, exact bodies, eight-second settling and other-stage preservation');
