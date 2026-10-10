/** Authored density and real shared-engine body fixtures. Not a normal clear. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {authorStage12Quarry} from '../tools/map-forge/apply-stage12-quarry.mjs';
const stageId=12,g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,before=structuredClone(g.HONRO_PROJECT);
const project=await authorStage12Quarry(before,g,{art:false});
assert.equal(JSON.stringify(project.stages.filter(s=>s.metadata.stageId!==stageId)),JSON.stringify(before.stages.filter(s=>s.metadata.stageId!==stageId)),'Other chapters remain exact');
const s=project.stages[stageId-1],old=before.stages[stageId-1];
assert.equal(JSON.stringify(s.terrains),JSON.stringify(old.terrains),'Encounter author keeps the reviewed terrain');
assert.equal(JSON.stringify(s.units.filter(u=>u.team==='player'||u.team==='ally')),JSON.stringify(old.units.filter(u=>u.team==='player'||u.team==='ally')),'Player and human NPC authoring remains exact');
assert.equal(s.initialState.honroEncounterDensityRevision,1);
assert.equal(s.initialState.honroEncounterDensityPopulationCap,46);
g.HONRO_PROJECT=project;
const q=battlefield(g,stageId);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);if(stageId!==8)g.HonroAct2.attach(q.app,q.e);
assert.equal(q.e.alive(1).length,38);assert.equal(q.e.alive(1).filter(u=>u.elite).length,10);assert.equal(q.b.enemyLimit,4);
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
assert.equal(s.events.length,0,'Original hold-owned eight carts remain the only finite wave source');assert.equal(JSON.stringify(s.initialState.honroAct2Steps),JSON.stringify(old.initialState.honroAct2Steps));
const sign=s.markers.find(m=>m.id==='sign');assert(q.e.alive(1).every(u=>Math.hypot(u.x-sign.x,u.y-sign.y)>220),'The sign has a clear interaction pocket');
await mkdir('_local/reports/encounter-density',{recursive:true});await writeFile('_local/reports/encounter-density/stage12-authoring.json',JSON.stringify({stageId,initial:38,elites:10,finite:8,rows,scope:'Authored bodies, exact shared-engine mount and eight seconds of natural physics; not normal combat or browser verification.'},null,2)+'\n');
console.log('PASS Stage12 density: 38/10, finite8, exact bodies, eight-second settling and other-stage preservation');
