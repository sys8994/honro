/** Stage14 compact projection closure: preserve every other procedural surface. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {Path2D,DOMMatrix} from '@napi-rs/canvas';
import {runtimeParts} from '../shared/build.mjs';
const g=vm.createContext({console,structuredClone,performance,Path2D,DOMMatrix,setTimeout,clearTimeout});g.window=g;
for(const source of await runtimeParts({vector:true,render:false,productionStory:true}))vm.runInContext(source,g);
// Evaluate the prior function in the same context, without modifying runtime files.
const text=await readFile(new URL('../shared/runtime/act2-spatial-art.js',import.meta.url),'utf8');
let old=text.slice(text.indexOf('function surfaceEdges('),text.indexOf('// Optional shared granite material.'));
const current=vm.runInContext(`(()=>{const C=HONRO_CORE;${old};return surfaceEdges})()`,g);
old=old.replace(/\/\/ Compact14[\s\S]*?\nif\(t.honroDomain\)\{const ws=/,'if(t.honroDomain){const ws=');
const prior=vm.runInContext(`(()=>{const C=HONRO_CORE;${old};return surfaceEdges})()`,g);
const plain=v=>JSON.parse(JSON.stringify(v)),p=g.HONRO_PROJECT;let checked=0,removed=0;
for(let id=11;id<=20;id++){
 const s=p.stages.find(s=>s.metadata?.stageId===id),b=g.HonroMaps.createBattle(s,p);g.HonroStageRules.sanitizeStageBattle(b);new g.HONRO_CORE.Engine(b,()=>{},true);
 const before=JSON.stringify({s,b});
 for(const t of g.HonroTerrainDomain.render(b)){
  const previous=plain(prior(t,b)),actual=plain(current(t,b));
  if(id===14&&t.id==='v14-refuge-ground'){
   const closure=[{x:4800,y:5640},{x:0,y:5640}];assert(previous.some(e=>JSON.stringify(e)===JSON.stringify(closure)));
   const expected=previous.filter(e=>JSON.stringify(e)!==JSON.stringify(closure));assert.deepEqual(actual,expected);assert.equal(previous.length-actual.length,1);removed++;
   assert.deepEqual(plain(current(t,{...b,honroAct2CompactRevision:0})),previous,'Noncompact scope changed');
   assert.deepEqual(plain(current(t,{...b,honroStage:13})),previous,'Other-stage scope changed');
  }else assert.deepEqual(actual,previous,`Other surface changed: ${id}/${t.id}`);
  checked++;
 }
 assert.equal(JSON.stringify({s,b}),before,'Surface inspection mutated source or battle');
}
assert.equal(removed,1);console.log(JSON.stringify({checked,removed,scope:'Only compact Stage14 refuge projected bottom closure removed; all other Stage11–20 surface edges and source/battle data unchanged.'}));
