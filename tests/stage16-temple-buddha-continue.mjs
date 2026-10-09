/** Portable old-art save fixture, or explicitly supplied actual R47 checkpoint.
 * Uses production App Continue with DOM/storage doubles; never resumes the bot. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {beforeStage16Buddha,assertStage16BuddhaCurrent,stage16BuddhaDelta as f} from './stage16-temple-buddha-history-helpers.mjs';
import {buddhaHash as hash,templeGameplayFingerprints,templeSaveContract} from './stage16-temple-buddha-contract-helpers.mjs';
const h=await appHarness(),{g}=h,current=g.HONRO_PROJECT,inputFile=process.env.HONRO_STAGE16_BUDDHA_CONTINUE;
assertStage16BuddhaCurrent(current); // Validates each later art revision before the immutable first-art boundary.
const fingerprints=await templeGameplayFingerprints(g);assert.deepEqual(fingerprints,f.gameplayFingerprints);
let profile,inputSha256=null,scope;
if(inputFile){
 const source=await readFile(inputFile,'utf8'),saved=JSON.parse(source);inputSha256=hash(source);
 assert.equal(saved.sourceHash,f.beforeProjectSha256,'Actual checkpoint comes from the completed pre-Buddha temple');
 assert.equal(saved.provenance.gameplayProjectSha256,fingerprints.project);assert.equal(saved.provenance.gameplayRuntimeSha256,fingerprints.runtime);
 assert(saved.profile?.honroBattle,'Actual checkpoint contains a real saved battle');profile=plain(saved.profile);
 scope='Actual pre-art checkpoint restored through production App Continue. No bot resume, state repair, or second fullplay; DOM/storage doubles.';
}else{
 try{
  g.HONRO_PROJECT=beforeStage16Buddha(current);const app=h.load(h.profileThrough(15));app.launch(16);h.finish(app);app.export();profile=await h.exported();
 }finally{g.HONRO_PROJECT=current;}
 scope='Reconstructible synthetic old-art save fixture through production App export/Continue; not a normal-combat result or browser UI proof.';
}
const savedBattle=plain(profile.honroBattle);assert.equal(savedBattle.honroStage,16);assert.equal(savedBattle.honroAuthoredId,'stage-16');
assert(!savedBattle.honroElements.some(e=>e.id==='s16-buddha-stone-colossus'),'Old battle never had the new Buddha element');
const before=templeSaveContract(savedBattle),app=h.load(profile);app.continue();
assert(app.engine?.b,'Production App restored the saved battle');
const after=templeSaveContract(app.engine.b);assert.deepEqual(after,before,'Every actor, terrain, objective, wave, resource, growth, dialogue and old map snapshot remains exact');
assert(!app.engine.b.honroElements.some(e=>e.id==='s16-buddha-stone-colossus'),'Continue keeps the saved element snapshot instead of inserting a later element');
assert.equal(g.HONRO_PROJECT,current,'Current new-entry source remains the post-art project');
const out='_local/reports/stage16-temple/buddha';await mkdir(out,{recursive:true});
const report={passed:true,scope,inputFile:inputFile||null,inputSha256,round:savedBattle.round,phase:savedBattle.phase,actorCount:savedBattle.units.length,sourceBefore:f.beforeProjectSha256,sourceAfter:hash(current),gameplayFingerprints:fingerprints,saveContractSha256:hash(before),checkedFields:Object.keys(before)};
const revision=hash(current)===f.afterProjectSha256?'':'refinement-';
await writeFile(out+'/'+revision+(inputFile?'actual-r47-continue':'portable-continue')+'.json',JSON.stringify(report,null,2)+'\n');
console.log(`PASS Buddha ${inputFile?'actual saved R'+savedBattle.round:'portable old-art'} Continue: ${savedBattle.units.length} actors and ${Object.keys(before).length} complete gameplay/map fields unchanged. ${scope}`);
