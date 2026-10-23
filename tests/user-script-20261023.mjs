import assert from 'node:assert/strict';
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {patch,before,after,get,hash,verify} from './user-script-20261023-spec.mjs';
if(process.argv.includes('--apply')){
 const raw=await readFile(patch.sourceFile);assert.equal(hash(raw),patch.sourceSha256,'Before writing, whole current source equals approved baseline');
 const current=JSON.parse(raw);for(const o of patch.operations)assert.equal(get(current,o.path),o.before);
 const tmp=patch.sourceFile+'.approved-tmp';await writeFile(tmp,JSON.stringify(after,null,2)+'\n');await rename(tmp,patch.sourceFile);
}
const result=verify(JSON.parse(await readFile(patch.sourceFile,'utf8')));await mkdir('_local/reports/user-script-20261023',{recursive:true});await writeFile('_local/reports/user-script-20261023/exact.json',JSON.stringify(result,null,2)+'\n');
console.log('PASS 661 exact before/after; only supplied strings differ; row counts/order/speakers/IDs/cameras/gates and all other metadata unchanged');
if(!process.argv.includes('--apply')&&!process.argv.includes('--static-only')){
 const {runtime,battlefield}=await import('../game/tests/helpers.mjs');const g=await runtime({legacyMaps:false}),plain=x=>JSON.parse(JSON.stringify(x));
 let checked=0;
 for(let id=1;id<=30;id++){
  const f=battlefield(g,id);f.b.honroBellWitness=f.b.honroVoidWitness=true;const effective=g.HonroObjectiveRevision.contentFor(f.b,f.st);
  for(const o of patch.operations.filter(o=>o.path.startsWith('/stages/'+id+'/'))){const path=o.path.slice(('/stages/'+id).length);assert.equal(get(effective,path),o.after,'Fresh effective runtime '+o.path);checked++;}
  if([20,28,29].includes(id)){f.b.honroBellWitness=f.b.honroVoidWitness=false;const hidden=g.HonroObjectiveRevision.contentFor(f.b,f.st);assert(![...hidden.outro,...Object.values(hidden.beats||{}).flat()].some(r=>r[2]?.requiresBellWitness||r[2]?.requiresVoidWitness));}
 }
 assert.equal(checked,419);assert.deepEqual(plain(g.HonroNarrativeCatalogue.data),after);
 for(const id of [13,16,30])for(const choice of ['A','B']){const p=g.HONRO_CORE.defaults();p.honroRouteHandoff={revision:1,fromStage:id-1,toStage:id,choice,sourceRun:'approved-script'};const {b}=battlefield(g,id,{profile:p});assert.deepEqual(plain(g.HonroRouteBranches.entryLines(b)),after.routes[id].variants[choice].lines.map(([who,text,meta])=>[who,text,{...meta,storyId:`route-entry-${id}-${choice}`}]));}
 assert.deepEqual(after.values,before.values);assert.deepEqual(after.places,before.places);
 console.log('PASS fresh final runtime: all30 chapters/419 changed stage strings, canonical globals, six route entries, 20/28/29 witness gates; unprovided values/places unchanged');
}
