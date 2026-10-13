/** Stage-local invariants, not a traversal/combat acceptance proxy. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {runtime} from '../game/tests/helpers.mjs';
import {applyCityTacticalRoutes,CITY_TACTICAL_SURFACES} from '../tools/map-forge/city-tactical-routes.mjs';
const clone=v=>JSON.parse(JSON.stringify(v)),before=JSON.parse(execFileSync('git',['show','25ae85c:shared/data/campaign.json'],{encoding:'utf8',maxBuffer:40*1024*1024})),after=applyCityTacticalRoutes(before);
assert.deepEqual(applyCityTacticalRoutes(after),after,'Idempotent stage-local author');
assert.deepEqual(after.library.filter(a=>!a.id.startsWith('city-tactical:')),before.library,'Existing art/collision library is preserved');
const g=await runtime({legacyMaps:false}),rows=[];
for(let i=0;i<before.stages.length;i++){
 const old=before.stages[i],fresh=after.stages[i],n=old.metadata.stageId;
 if(!CITY_TACTICAL_SURFACES[n]){assert.deepEqual(fresh,old,'Unrelated stage '+n);continue;}
 for(const k of Object.keys(old).filter(k=>!['terrains','design','initialState','units','elements'].includes(k)))assert.deepEqual(fresh[k],old[k],n+' preserves '+k);
 assert.deepEqual(fresh.elements.filter(e=>!e.cityTacticalRearOnly),old.elements,n+' original art retained');
 assert.deepEqual(fresh.units.map(({y,...u})=>u),old.units.map(({y,...u})=>u),n+' actor identity/count/stats/x retained');
 assert.deepEqual(fresh.terrains.filter(t=>!t.properties?.honroCityTactical&&!['a3-foundation',...(n===24?['shrine-door']:[])].includes(t.id)),old.terrains.filter(t=>!['a3-foundation',...(n===24?['shrine-door']:[])].includes(t.id)),n+' unrelated gates unchanged');
 if(n===24){const d=fresh.terrains.find(t=>t.id==='shrine-door'),o=old.terrains.find(t=>t.id==='shrine-door');assert.equal(Math.max(...d.points.map(v=>v.y))-Math.min(...d.points.map(v=>v.y)),350);assert.deepEqual(d.properties,o.properties);assert.deepEqual(d.points.slice(2),o.points.slice(2));}
 assert.deepEqual(fresh.terrains.find(t=>t.id==='a3-foundation').playProjection,old.terrains.find(t=>t.id==='a3-foundation').playProjection,n+' single domain bounds preserved');
 const state=clone(fresh.initialState);delete state.honroCityTacticalRevision;assert.deepEqual(state,old.initialState,n+' objectives/party/resources unchanged');
 const design=clone(fresh.design);delete design.cityTactical;assert.deepEqual(design,old.design,n+' historical route metadata unchanged');
 assert.deepEqual(clone(g.HonroTerrainDomain.validate(fresh)),[],n+' domain bounds');
 const compiled=g.HonroMaps.createBattle(fresh,after,undefined,{origin:'campaign'});
 assert.equal(compiled.terrain.filter(t=>t.honroCityTactical).length,CITY_TACTICAL_SURFACES[n].filter(r=>!(r[4]>=250)).length,n+' actual compiled new collision');
 for(const u of compiled.units)if(!u.flying&&!u.fixed)assert(g.HONRO_CORE.validTerrainContactPose(compiled.terrain,u),n+' initial body clearance '+u.id);
 const oldBattle=g.HonroMaps.createBattle(old,before,undefined,{origin:'campaign'}),serialized=JSON.stringify(oldBattle);g.HONRO_PROJECT=after;
 assert.equal(JSON.stringify(oldBattle),serialized,'Project replacement must not touch live snapshot');
 assert(!oldBattle.terrain.some(t=>t.honroCityTactical),'Historical snapshots retain original terrain');
 const saved=JSON.parse(JSON.stringify(compiled));assert.deepEqual(saved.terrain,clone(compiled.terrain),'New terrain JSON round trip');
 rows.push({stage:n,addedSurfaces:CITY_TACTICAL_SURFACES[n].length,originalObjectivesAndActorsPreserved:true,initialBodyClearance:true,domainValid:true});
}
console.log(JSON.stringify({pass:true,rows,scope:'Source invariants and raw production compile only. No traversal, combat, visual, App Continue or browser approval.'},null,2));
