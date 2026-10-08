// Exact approved stage 9 hall reuse / stage 10 guardian scene delta only.
// The immutable older map hashes remain the final comparison authority.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {beforeGuardianTerrain} from './guardian-terrain-history-helpers.mjs';
export const guardianSceneDelta=JSON.parse(readFileSync(new URL('./fixtures/guardian-scene-delta.json',import.meta.url),'utf8'));
export function beforeGuardianScene(project){
 const p=structuredClone(project);
 for(const row of guardianSceneDelta.rows){
  let target=p.stages.find(s=>s.metadata.stageId===row.stage);
  for(const key of row.path.slice(0,-1))target=target[key];
  const key=row.path.at(-1),label=`Exact approved guardian scene ${row.stage}/${row.path.join('/')}`;
  assert.equal(Object.hasOwn(target,key),row.hasAfter,label);
  if(row.hasAfter)assert.deepEqual(target[key],row.after,label);
  if(row.hasBefore)target[key]=structuredClone(row.before);else delete target[key];
 }
 for(const map of p.stages)map.terrains=beforeGuardianTerrain(map.terrains,map.metadata.stageId);
 return p;
}
