/** Freeze a reviewed one-asset ascetic; every preceding fixture stays immutable. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {runtime} from '../game/tests/helpers.mjs';
import {act12Project} from './campaign-scope-helpers.mjs';
import {buddhaHash as hash,buddhaPlain as plain,templeGameplayFingerprints,templeBattleContract} from './stage16-temple-buddha-contract-helpers.mjs';

assert.equal(process.env.HONRO_CAPTURE_APPROVED_STAGE16_BUDDHA_ASCETIC,'1','Explicit reviewed Buddha ascetic capture required');
const local=process.argv.find(arg=>arg.startsWith('--output='))?.slice(9);
if(local)assert(resolve(local).startsWith(resolve('_local')+'/'),'Provisional output must remain under ignored _local');
const file=local||'tests/fixtures/stage16-temple-buddha-ascetic-delta.json';
try{await access(file);throw Error('Refusing to overwrite a frozen Buddha ascetic: '+file);}catch(error){if(error.code!=='ENOENT')throw error;}
if(!local)execFileSync('git',['diff','--exit-code','HEAD','--','shared/data/campaign.json','tools/environment/stage16-temple-buddha-art.mjs'],{stdio:'pipe'});
const beforeSourceCommit='abddb351b4b3048870ecd7dc22013ba9e7e4c90f';
const before=JSON.parse(execFileSync('git',['show',beforeSourceCommit+':shared/data/campaign.json'],{encoding:'utf8',maxBuffer:32*1024*1024}));
const previous=JSON.parse(await readFile('tests/fixtures/stage16-temple-buddha-refinement-delta.json','utf8'));
assert.equal(hash(before),previous.afterProjectSha256,'The immutable revision2 Buddha artwork is the only predecessor');
assert.equal(hash(before.library),previous.afterLibrarySha256);
const after=JSON.parse(await readFile('shared/data/campaign.json','utf8')),g=await runtime({legacyMaps:false});
assert.equal(hash(g.HONRO_PROJECT),hash(after),'Built runtime uses the exact reviewed ascetic');
const assetId='stage16:temple-stone-buddha-cliff-colossus';
const getAsset=p=>{const rows=p.library.filter(a=>a.id===assetId);assert.equal(rows.length,1,'Exactly one named Buddha asset');return rows[0];};
const beforeAsset=getAsset(before),afterAsset=getAsset(after);
assert.equal(before.library.length,540);assert.deepEqual(after.library.map(a=>a.id),before.library.map(a=>a.id),'All540 asset IDs and order are immutable');
assert.notDeepEqual(afterAsset,beforeAsset,'An ascetic revision must actually change the reviewed artwork');
assert.equal(beforeAsset.params.artRevision,2);assert.equal(afterAsset.params.artRevision,3);
assert.equal(beforeAsset.params.nodeCount,67);assert.equal(afterAsset.params.nodeCount,67);
assert.deepEqual(beforeAsset.collision,[]);assert.deepEqual(afterAsset.collision,[],'The refined artwork remains noncolliding');
assert.deepEqual(after.stages,before.stages,'Every field and order in all30 stages, including Buddha placement, stays exact');
const prior=plain(after);prior.library[prior.library.findIndex(a=>a.id===assetId)]=plain(beforeAsset);
assert.deepEqual(prior,before,'Replacing only the named art asset restores every field and all539 other assets in order');
const fingerprints=await templeGameplayFingerprints(g);assert.deepEqual(fingerprints,previous.gameplayFingerprints,'Original47-round gameplay identity remains exact');
const currentBattle=templeBattleContract(g,after);assert.deepEqual(currentBattle,templeBattleContract(g,before),'Actual battle and protected NPCs remain exact');
assert.equal(hash(currentBattle),previous.battleContractSha256,'Same compiled battle as the revision2 and original47-round gameplay');
const f={schemaVersion:1,scope:'Exactly one noncolliding Buddha asset value changes. All30 complete stages, placement, all539 other assets, order, globals and gameplay remain exact.',beforeSourceCommit,afterSourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),assetId,beforeAsset:plain(beforeAsset),afterAsset:plain(afterAsset),beforeProjectSha256:hash(before),afterProjectSha256:hash(after),beforeAct12ProjectSha256:hash(act12Project(before)),afterAct12ProjectSha256:hash(act12Project(after)),beforeLibrarySha256:hash(before.library),afterLibrarySha256:hash(after.library),beforeAct12LibrarySha256:hash(act12Project(before).library),afterAct12LibrarySha256:hash(act12Project(after).library),libraryOrder:before.library.map(a=>a.id),stages:before.stages.map(s=>({id:s.id,sha256:hash(s)})),gameplayFingerprints:fingerprints,battleContractSha256:hash(currentBattle)};
await mkdir(dirname(file),{recursive:true});await writeFile(file,JSON.stringify(f,null,2)+'\n',{flag:'wx'});
console.log('Captured exact Buddha ascetic: one asset value only; all30 stages, all539 other assets/order, gameplay and actual battle identical.',local?'Provisional local output.':'Frozen reviewed fixture.');
