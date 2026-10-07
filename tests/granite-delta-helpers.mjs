// Historical contracts keep their original fixture. Accept only the exact
// current authored granite art before reversing these two visual arrays.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {graniteVisuals} from '../tools/environment/granite-visuals.mjs';
const baseline=JSON.parse(readFileSync(new URL('./fixtures/granite-visual-baseline.json',import.meta.url),'utf8'));
export function beforeGraniteVisuals(project){
 const p=structuredClone(project);
 for(const old of baseline.assets){
  const asset=p.library.find(a=>a.id===old.id);assert(asset,'Reviewed granite asset '+old.id);
  assert.deepEqual(asset.visual,graniteVisuals(asset),'Unreviewed granite visual change '+old.id);
  asset.visual=structuredClone(old.visual);
 }
 return p;
}
