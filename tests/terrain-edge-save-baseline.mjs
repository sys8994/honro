/** Baseline codec diagnosis; not a full historical App/build replay.
 * CI: git fetch --depth=1 origin <SHA>
 * BASELINE_REF=<SHA> node tests/terrain-edge-save-baseline.mjs
 */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const ref=process.env.BASELINE_REF||'be99eb99781b07d7167d7fe8ab09726080d676cf';
assert(/^[a-f0-9]{7,40}$/i.test(ref),'BASELINE_REF must be an explicit commit SHA');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024});
const commit=git('rev-parse','--verify',ref+'^{commit}').trim(),source=path=>git('show',commit+':'+path);
const hash=text=>createHash('sha256').update(text).digest('hex');
const codecPath='shared/runtime/profile-store.js',testPath='tests/act1-local-art-save.mjs';
const baselineCodec=source(codecPath),currentCodec=readFileSync(codecPath,'utf8');
const baselineTest=source(testPath),currentTest=readFileSync(testPath,'utf8');
assert.equal(currentCodec,baselineCodec,'Save codec differs from baseline: re-investigate');
assert.equal(currentTest,baselineTest,'Legacy Act1 test differs from baseline: re-investigate');
assert(baselineTest.includes('assert(packed.honroLocalArtTable,`Missing table for stage${stageId}`)'),'Expected legacy table assertion missing');
const manifest=JSON.parse(source('web/manifest.json'));
assert(typeof manifest.project==='string'&&manifest.project.startsWith('web/data/'));
const project=JSON.parse(source(manifest.project));
const context=code=>{const g={structuredClone,console};vm.runInNewContext(code,g);return g.HonroProfileStore;};
const codecs={baseline:context(baselineCodec),candidate:context(currentCodec)};
const expectedIds={3:['act1-site:3:body','act1-site:3:landmarks','act1-site:3:ferry','act1-site:3:lantern','act1-site:3:spirit-flame'],7:['act1-site:7:body','act1-site:7:landmarks']},results=[];
for(const stage of [3,7]){
 const path=project.stageLibraries[stage-1];assert(typeof path==='string'&&path.startsWith('web/data/'));
 assert.equal(project.assetEncodings.stageLibraries[stage-1],'json');
 const assets=JSON.parse(source(path));assert(Array.isArray(assets));
 assert.deepEqual(assets.map(a=>a.id).sort(),[...expectedIds[stage]].sort(),'Historical provider inventory changed');
 // Duplicate baseline assets in both save views to isolate codec eligibility
 // from deduplication count. This is not an App-created gameplay snapshot.
 const original={mode:'campaign',honroStage:stage,honroLandmarks:assets.map(asset=>({asset:structuredClone(asset)})),honroElements:assets.map(asset=>({asset:structuredClone(asset)}))};
 const bytes=JSON.stringify(original),observations={};
 for(const [name,codec]of Object.entries(codecs)){
  const battle=structuredClone(original),packed=codec.compactBattleArt(battle);
  assert.strictEqual(packed,battle,`${name} Stage${stage}: unexpected compaction`);
  assert(!Object.hasOwn(packed,'honroLocalArtTable'),`${name} Stage${stage}: unexpected local table`);
  assert.equal(JSON.stringify(packed),bytes,`${name} mutated historical inline artwork`);
  const restored=structuredClone(packed);assert.equal(codec.restoreBattleArt(restored),true);
  assert.equal(JSON.stringify(restored),bytes,`${name} failed exact inline restoration`);
  // Detect the historical failure explicitly, never relabel it as passed.
  assert.throws(()=>assert(packed.honroLocalArtTable,`Missing table for stage${stage}`),error=>error.code==='ERR_ASSERTION'&&error.message.includes(`Missing table for stage${stage}`));
  observations[name]={table:false,unchangedObject:true,exactInlineRestore:true,legacyTableAssertion:'fails as expected'};
 }
 assert.deepEqual(observations.candidate,observations.baseline);
 results.push({stage,assetPath:path,assetIds:expectedIds[stage],observations});
}
console.log(JSON.stringify({passed:true,baselineCommit:commit,identicalSources:{[codecPath]:hash(currentCodec),[testPath]:hash(currentTest)},results,scope:'Direct execution of baseline published assets and exact baseline/current codec; legacy all-stage table assertion conflicts with Stage3/7 inline providers.',limits:['Not a full baseline App test, historical build replay, browser save test, or campaign completion.','Does not mark the original act1-local-art-save test passed.']},null,2));
