/** Explicit one-time authoring of a reviewed after boundary. Not part of tests.
 * Old fixtures are never rewritten; this refuses to replace an existing delta. */
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {plain,semanticContent,unitContract} from './act2-spatial-contract-helpers.mjs';
assert.equal(process.env.HONRO_CAPTURE_APPROVED_STAGE11,'1','Run only after the final Stage11 source has been reviewed');
const path='tests/fixtures/stage11-ravine-history-delta.json';
try{await access(path);throw Error('Refusing to overwrite existing approved delta: '+path);}catch(error){if(error.code!=='ENOENT')throw error;}
const before=JSON.parse(await readFile('tests/fixtures/stage11-ravine-before.json','utf8')),g=await runtime({legacyMaps:false}),p=g.HONRO_PROJECT,st=p.stages.find(s=>s.metadata.stageId===11),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
assert.equal(st.initialState.honroRavineVersion,2);assert.equal(hash(before.stage),before.stageSha256);
for(const row of before.otherStages)assert.equal(hash(p.stages.find(s=>s.id===row.id)),row.sha256,'Unrelated stage changed '+row.id);
const oldIds=new Set(before.libraryIds),old=p.library.filter(a=>oldIds.has(a.id)),added=p.library.filter(a=>!oldIds.has(a.id));
assert.equal(hash(old),before.librarySha256,'No original asset changes');assert.equal(new Set(p.library.map(a=>a.id)).size,p.library.length,'Unique asset IDs');
assert.deepEqual(plain(p.library.map(a=>a.id)),[...before.libraryIds,...added.map(a=>a.id)],'Additive art only, original order intact');
const paths=[];
function diff(a,b,path=[]){
 if(JSON.stringify(a)===JSON.stringify(b))return;
 if(a&&b&&!Array.isArray(a)&&!Array.isArray(b)&&typeof a==='object'&&typeof b==='object'){
  for(const key of new Set([...Object.keys(a),...Object.keys(b)])){
   const hasBefore=Object.hasOwn(a,key),hasAfter=Object.hasOwn(b,key);
   if(!hasBefore||!hasAfter)paths.push({path:[...path,key],hasBefore,hasAfter,...(hasBefore?{before:a[key]}:{}),...(hasAfter?{after:b[key]}:{})});
   else diff(a[key],b[key],[...path,key]);
  }
 }else paths.push({path,hasBefore:true,hasAfter:true,before:a,after:b});
}
diff(before.stage,st);
const q=battlefield(g,11);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);
const data={schemaVersion:1,beforeSourceCommit:before.sourceCommit,afterSourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),afterRavineVersion:2,beforeProjectSha256:before.projectSha256,beforeAct12LibrarySha256:hash(old.filter(a=>!a.id.startsWith('a3-'))),afterProjectSha256:hash(p),beforeStageSha256:before.stageSha256,afterStageSha256:hash(st),paths,addedAssets:plain(added),semanticContent:{before:semanticContent(before.content),after:semanticContent(q.st)},unitContracts:{before:before.legacyBattle.units.map(unitContract),after:plain(q.b.units.map(unitContract))},balance:{before:before.balance,after:plain(g.HONRO_BALANCE.stages[10])}};
await writeFile(path,JSON.stringify(data,null,2)+'\n',{flag:'wx'});console.log('WROTE exact reviewed Stage11 delta:',paths.length,'paths;',added.length,'new assets; unchanged29 maps and all492 old assets');
