// Reverse only the reviewed six flags and two exact additive bridge steps when
// comparing older frozen contracts. Any unrelated shape/property drift fails.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
export const platformPassageDelta=JSON.parse(readFileSync(new URL('./fixtures/platform-passages.json',import.meta.url),'utf8'));
const plain=v=>JSON.parse(JSON.stringify(v));
export function beforePlatformTerrain(terrain,stage,g){
 const original=platformPassageDelta.targets[stage]||[],additions=platformPassageDelta.additions[stage]||[];
 return plain(terrain).filter(t=>{const a=additions.find(a=>a.id===t.id);if(!a)return true;assert.deepEqual(t,g?plain(g.HonroGeometry.terrain(a)):a,t.id+' exact approved addition');return false;}).map(t=>{
  const a=original.find(a=>a.id===t.id);if(!a||!t.oneWay)return t;
  const expected=g?plain(g.HonroGeometry.terrain(a)):a;assert.deepEqual({...t,oneWay:false},expected,t.id+' only approved oneWay flag changed');t.oneWay=false;return t;
 });
}
export function beforePlatformPassages(project){const p=plain(project);for(const st of p.stages||[])st.terrains=beforePlatformTerrain(st.terrains,st.metadata?.stageId);return p;}
