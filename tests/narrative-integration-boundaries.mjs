import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false});
for(let id=11;id<=20;id++){
 const {b}=battlefield(g,id);
 assert.deepEqual(JSON.parse(JSON.stringify(g.HonroAct2Plan.forStage(id))),JSON.parse(JSON.stringify(g.HONRO_CONTENT.stages[id-1].act2Plan)));
 assert.doesNotThrow(()=>g.HonroAct2.state(b),`Act2 ${id} objective state retains wave API`);
}
const {b,app}=battlefield(g,9);delete b.honroNarrativeCatalogueRevision;
const id=g.HonroStoryStaging.ID,old=g.HONRO_NARRATIVE_COMPAT.staging.find(d=>d.id===id);
b.honroNarrativeRevision=1;
const result=g.HonroStoryStaging.opening(app,[['서술','queued',{stagingRequest:{id,context:{}}}]],{});
assert.deepEqual(JSON.parse(JSON.stringify(result.options.staging.steps)),JSON.parse(JSON.stringify(old.steps)));
const saved={staging:{id,steps:[{type:'dialogue',lines:[['설오','saved authored row']]}],cursor:0}};
assert.equal(g.HonroStoryStaging.opening(app,[['설오','saved authored row']],saved).options,saved);
console.log('PASS Act2 runtime wave API and unopened legacy/stored staging boundaries');
