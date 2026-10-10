/** Exact input adapter for the existing RC21 migration comparison.
 * Execute today's exported migration function unchanged, with only its
 * legacyRuntime dependency receiving the reviewed pre-Stage8 balance row.
 * No stored before-source string is executed. The existing checked-in legacy
 * comparison and current Engine remain intact; no migration source changes. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {legacyRuntime as currentLegacyRuntime,migrate as currentMigrate} from '../migration/migrate-stages.mjs';
import {beforeStage8Bier,beforeStage8BierBalance,beforeStage8BierRuntimeSources,stage8BierRuntimeSources,bierHistoryHash,stage8BierOriginal} from './stage8-bier-history-helpers.mjs';
const root=new URL('../',import.meta.url),plain=v=>JSON.parse(JSON.stringify(v));
export const migrationSourceHashes=Object.freeze({
 'migration/migrate-stages.mjs':'4b01ab3f9b99b81a4b1895182edd162170470e53015adc2dc37d06d8a244b7b3',
 'migration/legacy/rc21-stage-maps.js':'269f5f311be79adc3836a73571ff476349f439f1a791894bec7ad2e5cbd6ffe4',
 'migration/legacy/rc21-world.js':'df025e5c81af9ac130c4145f02fe1545bc3a115a5fe60dff6bb0f3523f0cb6e2'
});
export const migrationSources=()=>Object.fromEntries(Object.keys(migrationSourceHashes).map(path=>[path,readFileSync(new URL(path,root),'utf8')]));
export function assertMigrationHistoryInputs({project=JSON.parse(readFileSync(new URL('shared/data/campaign.json',root),'utf8')),sources=stage8BierRuntimeSources(),migration=migrationSources()}={}){
 beforeStage8Bier(project);beforeStage8BierRuntimeSources(sources);
 assert.deepEqual(Object.keys(migration),Object.keys(migrationSourceHashes),'Exact original migration module membership');
 for(const[path,digest]of Object.entries(migrationSourceHashes))assert.equal(bierHistoryHash(migration[path]),digest,'Exact original/current migration source '+path);
 return {sources,migration};
}
export async function legacyRuntime(){
 const evidence=assertMigrationHistoryInputs(),g=await currentLegacyRuntime(),before=plain(g.HONRO_BALANCE),content=plain(g.HONRO_CONTENT),projected=beforeStage8BierBalance(before);
 assert.equal(g.HONRO_BALANCE.stages[7].id,8);g.HONRO_BALANCE.stages[7]=projected.stages[7];
 assert.deepEqual(plain(g.HONRO_BALANCE.stages[7]),stage8BierOriginal.balance,'Only original Stage8 progression row reaches historical map generation');
 assert.deepEqual(plain(g.HONRO_BALANCE),{...before,stages:before.stages.map((row,index)=>index===7?plain(stage8BierOriginal.balance):row)},'No other balance input changed');
 assert.deepEqual(plain(g.HONRO_CONTENT),content,'Existing legacy content is untouched');
 assert.deepEqual(stage8BierRuntimeSources(),evidence.sources,'Current sources stable through legacy runtime construction');return g;
}
export async function migrate(){
 const {migration}=assertMigrationHistoryInputs(),body=currentMigrate.toString();
 assert(migration['migration/migrate-stages.mjs'].includes('export '+body),'Execute exactly the current exported migrate body');
 const read=async path=>{assert.equal(path,'shared/data/elements.json','The unchanged migration body reads only its current library');return readFile(new URL(path,root),'utf8');};
 return new Function('legacyRuntime','read','return ('+body+');')(legacyRuntime,read)();
}
