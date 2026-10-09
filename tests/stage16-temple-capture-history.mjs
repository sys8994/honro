/** Explicit one-time capture after Stage16 geometry and artwork review.
 * Reads the immutable before fixture; never changes it or a frozen delta.
 * --output=_local/... permits a provisional local validation without freezing. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {runtimeParts} from '../shared/build.mjs';
import {semanticContent,unitContract} from './act2-spatial-contract-helpers.mjs';

assert.equal(process.env.HONRO_CAPTURE_APPROVED_STAGE16,'1','Explicit reviewed Stage16 capture required');
const local=process.argv.find(arg=>arg.startsWith('--output='))?.slice(9);
if(local)assert(resolve(local).startsWith(resolve('_local')+'/'),'Provisional captures must stay under ignored _local');
const file=local||'tests/fixtures/stage16-temple-history-delta.json';
try{await access(file);throw Error('Refusing to overwrite an existing temple delta: '+file);}catch(error){if(error.code!=='ENOENT')throw error;}
if(!local)execFileSync('git',['diff','--exit-code','HEAD','--','shared/data/campaign.json','shared/runtime/act2-plan.js','game/config/balance.json'],{stdio:'pipe'});
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex'),plain=value=>JSON.parse(JSON.stringify(value));
const before=JSON.parse(await readFile('tests/fixtures/stage16-temple-before.json','utf8'));
const after=JSON.parse(await readFile('shared/data/campaign.json','utf8')),g=await runtime({legacyMaps:false});
assert.equal(hash(g.HONRO_PROJECT),hash(after),'Runtime must match canonical source before history capture');
assert.equal(after.stages.length,30);assert.equal(new Set(after.stages.map(stage=>stage.id)).size,30);
const st=after.stages.find(stage=>stage.metadata?.stageId===16);assert.equal(st.id,'stage-16');
assert.equal(st.initialState.honroTempleVersion,1);assert.equal(st.initialState.honroAct2GeometryRevision,8);
assert.equal(before.sourceCommit,'39fa80735eb2a2ad5b5d282b0e56bac52ae50c8b','The reviewed prior boundary is immutable');
for(const row of before.otherStages){const matches=after.stages.filter(stage=>stage.id===row.id);assert.equal(matches.length,1);assert.equal(hash(matches[0]),row.sha256,'Unchanged original map '+row.id);}
const originalIds=new Set(before.libraryIds),original=after.library.filter(asset=>originalIds.has(asset.id)),added=after.library.filter(asset=>!originalIds.has(asset.id));
assert.equal(hash(original),before.librarySha256,'Every original asset and its order must remain exact');
assert.equal(new Set(after.library.map(asset=>asset.id)).size,after.library.length,'No duplicate asset IDs');
assert(added.length>0,'Capture final temple art with the reviewed geometry');
for(const asset of added){assert(asset.id.startsWith('stage16:temple-'),'Only Stage16 art additions');assert.deepEqual(asset.collision,[],'Temple art has no invisible collision');}
assert.deepEqual(after.library.map(asset=>asset.id),[...before.libraryIds,...added.map(asset=>asset.id)],'Stage16 assets append after the complete immutable Library');
assert.deepEqual(st.initialState.honroAct2Steps,before.stage.initialState.honroAct2Steps,'All seven original mission rules remain exact');
const paths=[];
function diff(a,b,path=[]){
 if(JSON.stringify(a)===JSON.stringify(b))return;
 if(a&&b&&!Array.isArray(a)&&!Array.isArray(b)&&typeof a==='object'&&typeof b==='object'){
  for(const key of new Set([...Object.keys(a),...Object.keys(b)])){
   const hasBefore=Object.hasOwn(a,key),hasAfter=Object.hasOwn(b,key);
   if(hasBefore&&hasAfter)diff(a[key],b[key],[...path,key]);
   else paths.push({path:[...path,key],hasBefore,hasAfter,...(hasBefore?{before:a[key]}:{}),...(hasAfter?{after:b[key]}:{})});
  }
 }else paths.push({path,hasBefore:true,hasAfter:true,before:a,after:b});
}
diff(before.stage,st);
assert(paths.length>0,'Capture must contain an explicit Stage16 delta');
const prior=plain(after);prior.stages[prior.stages.findIndex(stage=>stage.id==='stage-16')]=plain(before.stage);prior.library=plain(original);
assert.equal(hash(prior),before.projectSha256,'Exact immutable 39fa807 project recovered before runtime capture');
// Build the old map with the old plan and budget from the immutable commit.
// Runtime hooks remain loaded, so this also exercises their marker opt-out.
const readBefore=path=>execFileSync('git',['show',before.sourceCommit+':'+path],{encoding:'utf8',maxBuffer:32*1024*1024}).replace(/\r\n/g,'\n');
const oldPlanSource=readBefore('shared/runtime/act2-plan.js'),currentPlanSource=(await readFile('shared/runtime/act2-plan.js','utf8')).replace(/\r\n/g,'\n');
const oldBalance=JSON.parse(readBefore('game/config/balance.json')),bg=vm.createContext({console,performance,structuredClone});
for(let source of await runtimeParts({vector:false,render:false})){
 if(source.startsWith('globalThis.HONRO_BALANCE='))source='globalThis.HONRO_BALANCE='+JSON.stringify(oldBalance)+';';
 else if(source.startsWith('globalThis.HONRO_PROJECT='))source='globalThis.HONRO_PROJECT='+JSON.stringify(prior)+';';
 else if(source===currentPlanSource)source=oldPlanSource;
 vm.runInContext(source,bg);
}
const compile=context=>{const q=battlefield(context,16);context.HonroAllies.attach(q.app,q.e);context.HonroEncounters.attach(q.app,q.e);context.HonroAct2.attach(q.app,q.e);return q;};
const bq=compile(bg),aq=compile(g);
for(let index=0;index<30;index++)if(index!==15)assert.deepEqual(plain(g.HONRO_CONTENT.stages[index]),plain(bg.HONRO_CONTENT.stages[index]),'Unchanged other runtime content '+(index+1));
for(let index=0;index<10;index++)if(index!==5)assert.deepEqual(plain(g.HonroAct2Plan.stages[index]),plain(bg.HonroAct2Plan.stages[index]),'Unchanged other Act2 plan '+(index+11));
assert.deepEqual(plain(aq.st.steps),plain(bq.st.steps),'All story-bearing mission rules stay exact');
assert(!bq.b.honroTempleVersion,'Original Stage16 does not opt into the fresh temple encounter');
assert.equal(bg.HonroStage16Temple.active(bq.b),false,'New temple defense opts out of the exact original battle');
assert.equal(g.HonroStage16Temple.active(aq.b),true,'Fresh Stage16 opts into the explicitly reviewed temple defense');
const content={before:plain(bq.st),after:plain(aq.st)},balance={before:plain(oldBalance.stages[15]),after:plain(g.HONRO_BALANCE.stages[15])};
const planningOnly=new Set(['initialEnemies','maxAlive','targetRounds']);
for(const key of new Set([...Object.keys(balance.before),...Object.keys(balance.after)]))if(!planningOnly.has(key))assert.deepEqual(balance.after[key],balance.before[key],'Protected Stage16 growth/damage budget '+key);
assert.equal(aq.b.honroGrowth.limit.combat,bq.b.honroGrowth.limit.combat,'Original total combat XP ceiling');
assert.equal(aq.b.honroGrowth.limit.end,bq.b.honroGrowth.limit.end,'Original completion XP target');
for(let index=0;index<oldBalance.stages.length;index++)if(index!==15)assert.deepEqual(plain(g.HONRO_BALANCE.stages[index]),oldBalance.stages[index],'Unchanged other stage budget '+(index+1));
for(const key of Object.keys(oldBalance))if(key!=='stages')assert.deepEqual(plain(g.HONRO_BALANCE[key]),oldBalance[key],'Unchanged global balance '+key);
const act12=library=>library.filter(asset=>!asset.id.startsWith('a3-'));
const data={schemaVersion:1,beforeSourceCommit:before.sourceCommit,afterSourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'Exact current Stage16, its reviewed encounter planning/budget/roster and additive local art only; all original maps, assets, order and historical assertions remain independently checked.',afterTempleVersion:1,afterGeometryRevision:8,stageOrder:after.stages.map(stage=>stage.id),beforeProjectSha256:hash(prior),afterProjectSha256:hash(after),beforeStageSha256:hash(before.stage),afterStageSha256:hash(st),beforeLibrarySha256:hash(original),afterLibrarySha256:hash(after.library),beforeAct12LibrarySha256:hash(act12(original)),afterAct12LibrarySha256:hash(act12(after.library)),paths,addedAssets:plain(added),content,plan:{before:plain(bg.HonroAct2Plan.stages[5]),after:plain(g.HonroAct2Plan.stages[5])},balance,semanticContent:{before:semanticContent(bq.st),after:semanticContent(aq.st)},unitContracts:{before:plain(bq.b.units.map(unitContract)),after:plain(aq.b.units.map(unitContract))}};
await mkdir(dirname(file),{recursive:true});await writeFile(file,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
console.log('Captured exact temple boundary:',paths.length,'paths;',added.length,'assets;',data.afterStageSha256,local?'(provisional local output)':'(frozen reviewed fixture)');
