/** Synthetic consistency only. Generated pixels and parent messages are NOT art evidence. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {DEFAULT_CONFIG,sourceHash,checkArtReview} from '../tools/release/art-review.mjs';
import {makeSourceState} from '../tools/release/art-review-provenance.mjs';
import {prepareRelease} from '../tools/release/prepare.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex'),clone=v=>structuredClone(v);
const ids=['hierarchy','materials','grounding','readability','place'],holistic=['whole-naturalism','whole-place'];
const core=c=>({id:c.id,stage:c.stage,view:c.view,sourceHash:c.sourceHash,camera:c.camera,viewport:c.viewport,screenshot:c.screenshot});
async function fixture({failThenFix=false}={}){
 const root=await mkdtemp(path.join(os.tmpdir(),'honro-art-review-'));
 for(const dir of ['game/docs/art-review','art/source','evidence'])await mkdir(path.join(root,dir),{recursive:true});
 const config={version:1,scope:'synthetic-only',manifest:'game/docs/art-review/manifest.json',sourcePaths:['art/source'],stages:[1,3],affectedStages:[18],restStages:[3],criteria:ids.map(id=>({id,description:'Synthetic '+id+' criterion'})),finalCriteria:holistic.map(id=>({id,description:'Separate synthetic '+id+' judgment'})),requiredViews:{representative:['normal','wide','mobile'],affected:['overview']}};
 await writeFile(path.join(root,DEFAULT_CONFIG),JSON.stringify(config));
 await writeFile(path.join(root,'art/source/terrain.js'),'synthetic source before the correction');
 const first=await makeSourceState({root,statePath:'evidence/source-r1.json'});let current=first,serial=0;
 async function image(name,width=16,height=12){
  const n=++serial,file='evidence/'+name+'.png';
  const bytes=await sharp({create:{width,height,channels:4,background:{r:n*13%256,g:n*37%256,b:n*71%256,alpha:1}}}).png().toBuffer();
  await writeFile(path.join(root,file),bytes);return{path:file,sha256:sha(bytes)};
 }
 const reference=(await image('synthetic-reference')).path;
 async function rewriteReceipt(c){
  const file=c.receipt?.path||'evidence/'+c.id+'-receipt.json',bytes=Buffer.from(JSON.stringify({version:1,sourceHash:c.sourceHash,captures:[core(c)]}));
  await writeFile(path.join(root,file),bytes);c.receipt={path:file,sha256:sha(bytes)};
 }
 async function capture(stage,view,id,hash=current.sourceHash){
  const [width,height]=view==='mobile'?[12,24]:view==='wide'?[24,12]:view==='overview'?[20,10]:[16,12];
  const screenshot=await image(id,width,height),c={id,stage,view,sourceHash:hash,camera:{x:100+serial,y:200+stage,scale:view==='wide'?.22:.6},viewport:{width,height},screenshot};
  await rewriteReceipt(c);return c;
 }
 const verdict=(id,shot,context,status='pass')=>({id,status,evidence:`Synthetic ${context} ${id}: the embedded left shoulder overlaps its adjacent bank while its short ledge remains visible; this is a schema fixture.`,refs:[shot,reference]});
 const rounds=[],previousPasses=new Set();
 for(let i=0;i<5;i++){
  if(failThenFix&&i===1){
   await writeFile(path.join(root,'art/source/terrain.js'),'synthetic corrected source: medium embedded shoulder with a narrower soil return');
   current=await makeSourceState({root,statePath:'evidence/source-r2-fixed.json'});
  }
  const shot=await capture(i%2?3:1,'normal','r'+(i+1)+'-original');
  const criteria=ids.slice(0,i+1).map(id=>verdict(id,shot.screenshot.path,`round ${i+1} focused`,failThenFix&&i===0?'fail':'pass'));
  const r={id:'r'+(i+1),sourceHash:current.sourceHash,sourceState:clone(current.state),stages:[shot.stage],focusCriteria:[ids[i]],changes:`Synthetic round ${i+1}: inspect the named shoulder with a fresh original capture.`,captures:[shot],criteria,regressions:[...previousPasses].map(id=>verdict(id,shot.screenshot.path,`round ${i+1} regression`)),resolutions:[]};
  if(failThenFix&&i===1)r.resolutions.push({failures:['r1:hierarchy'],correction:{kind:'art-change',description:'Synthetic repair adds an embedded medium shoulder and its bearing into the actual source file.',beforeSourceHashes:[first.sourceHash],afterSourceHash:current.sourceHash},afterCaptureIds:[shot.id],judgment:verdict('hierarchy',shot.screenshot.path,'explicit corrected hierarchy rejudgment')});
  rounds.push(r);criteria.filter(c=>c.status==='pass').forEach(c=>previousPasses.add(c.id));
 }
 const captures=[rounds[4].captures[0]];
 for(const stage of config.stages)for(const view of config.requiredViews.representative)if(!(stage===1&&view==='normal'))captures.push(await capture(stage,view,`final-stage${stage}-${view}`));
 captures.push(await capture(18,'overview','final-stage18-overview'));captures.push(await capture(3,'rest','final-stage3-rest'));
 const shot=captures[0].screenshot.path;
 const final={reviewKind:'holistic',sourceHash:current.sourceHash,sourceState:clone(current.state),stages:[1,3,18],captures,criteria:ids.map(id=>verdict(id,shot,'separate final focused comparison')),regressions:ids.map(id=>verdict(id,shot,'separate final regression inspection')),holisticCriteria:holistic.map(id=>verdict(id,shot,'whole artwork across normal wide and mobile')),resolutions:[],unresolvedFailures:[],parentImageReview:{status:'approved',reviewer:'parent',sourceHash:current.sourceHash,evidence:'Synthetic parent separately compares all final representative images together and records no open defect; this fixture is not an actual art approval.',refs:captures.map(c=>c.screenshot.path),message:{threadId:'synthetic-parent-thread',messageId:'synthetic-final-review-message',receivedAt:'2026-10-20T12:00:00Z'}}};
 const manifest={version:1,scope:config.scope,rounds,final},save=()=>writeFile(path.join(root,config.manifest),JSON.stringify(manifest));await save();
 return{root,config,hash:current.sourceHash,first,manifest,save,capture,rewriteReceipt,reference};
}
const using=(fn,options={})=>async()=>{const f=await fixture(options);try{await fn(f);}finally{await rm(f.root,{recursive:true,force:true});}};
async function blocked(f,pattern){
 await f.save();const r=await checkArtReview({root:f.root});assert.equal(r.status,'blocked');assert.equal(r.quality,'not-automatically-assessed');assert.match(r.errors.join('\n'),pattern);
 let builds=0;const prepared=await prepareRelease({root:f.root,runBuild:()=>{builds++;return{status:0};}});
 assert.equal(builds,0,'blocked records must prevent the public release build');assert.equal(prepared.build,'not-run');assert.equal(prepared.exitCode,1);
}

test('source states, original receipts, focused subsets and separate final/parent judgments satisfy consistency only',using(async f=>{
 const r=await checkArtReview({root:f.root});assert.deepEqual(r.errors,[]);assert.equal(r.status,'records-consistent');assert.equal(r.quality,'not-automatically-assessed');assert.equal(r.approved,undefined);
 assert(f.manifest.rounds.every(r=>r.stages.length===1));
 for(const stage of f.config.stages)for(const view of ['normal','wide','mobile'])assert(f.manifest.final.captures.some(c=>c.stage===stage&&c.view===view));
 assert(f.manifest.final.captures.some(c=>c.stage===18&&c.view==='overview'));assert(f.manifest.final.captures.some(c=>c.stage===3&&c.view==='rest'));
 let builds=0;const prepared=await prepareRelease({root:f.root,runBuild:()=>{builds++;return{status:0};}});assert.equal(builds,1);assert.equal(prepared.exitCode,0);assert.equal(prepared.build,'completed');
 assert.equal((await prepareRelease({root:f.root,runBuild:()=>({status:7})})).exitCode,7);
}));
test('missing scope, manifest or round sourceState blocks before any public build',using(async f=>{
 await rm(path.join(f.root,DEFAULT_CONFIG));await blocked(f,/ENOENT/);await writeFile(path.join(f.root,DEFAULT_CONFIG),JSON.stringify(f.config));
 delete f.manifest.rounds[0].sourceState;await blocked(f,/Source state path\/sha256 required/);
 await rm(path.join(f.root,f.config.manifest));const r=await prepareRelease({root:f.root,runBuild:()=>assert.fail('must not build')});assert.equal(r.status,'blocked');assert.match(r.errors[0],/ENOENT/);
}));
test('live source changes/new files invalidate final content; historical criterion wording cannot be redefined',using(async f=>{
 await writeFile(path.join(f.root,'art/source/terrain.js'),'changed after final images');await blocked(f,/Stale source/);
 await writeFile(path.join(f.root,'art/source/terrain.js'),'synthetic source before the correction');await writeFile(path.join(f.root,'art/source/new.js'),'new source');await blocked(f,/Stale source/);await rm(path.join(f.root,'art/source/new.js'));
 const hash=await sourceHash(f.root);await writeFile(path.join(f.root,f.config.manifest),'arbitrary manifest bytes');assert.equal(await sourceHash(f.root),hash);
 f.config.criteria[0].description='An easier changed criterion';await writeFile(path.join(f.root,DEFAULT_CONFIG),JSON.stringify(f.config));await blocked(f,/Historical scope\/criteria wording/);
}));
test('inventing the earlier source hash independently in each of rounds one through four is rejected against original bytes',using(async f=>{
 for(let i=0;i<4;i++){const r=f.manifest.rounds[i],hash=r.sourceHash;r.sourceHash='sha256:'+String(i+1).repeat(64);await blocked(f,/Source provenance digest mismatch/);r.sourceHash=hash;}
}));
test('five rounds, complete cumulative focus and previous-pass regression records are required',using(async f=>{
 const last=f.manifest.rounds.pop();await blocked(f,/At least five/);f.manifest.rounds.push(last);
 f.manifest.rounds[4].focusCriteria=['hierarchy'];await blocked(f,/Every configured criterion/);f.manifest.rounds[4].focusCriteria=['place'];f.manifest.rounds[2].regressions.pop();await blocked(f,/missing criterion or previous-pass regression/);
}));
test('relabeling an original Stage1 picture as Stage3 or Stage18 contradicts its original receipt',using(async f=>{
 const original=f.manifest.rounds[0].captures[0];
 for(const [stage,view]of [[3,'normal'],[18,'overview']]){const target=f.manifest.final.captures.find(c=>c.stage===stage&&c.view===view),saved=clone(target);Object.assign(target,clone(original),{stage,view});await blocked(f,/original stage\/camera\/viewport\/view\/screenshot metadata mismatch/);Object.assign(target,saved);}
}));
test('a rewritten relabeling receipt still cannot use Stage1 pixels to create Stage3 or Stage18 coverage',using(async f=>{
 const old=f.manifest.rounds[0].captures[0];
 for(const [stage,view]of [[3,'normal'],[18,'overview']]){const target=f.manifest.final.captures.find(c=>c.stage===stage&&c.view===view),saved=clone(target);target.screenshot=clone(old.screenshot);target.viewport=clone(old.viewport);await f.rewriteReceipt(target);await blocked(f,/duplicated screenshot bytes\/pixels|duplicate screenshot\/path\/pixels/);Object.assign(target,saved);await f.rewriteReceipt(target);}
}));
test('changing PNG metadata, camera or view cannot turn duplicate pixels into a fresh round',using(async f=>{
 const old=f.manifest.rounds[0].captures[0],shot=f.manifest.rounds[1].captures[0],original=await readFile(path.join(f.root,old.screenshot.path));
 const bytes=await sharp(original).withMetadata({density:96}).png().toBuffer();assert.notEqual(sha(bytes),sha(original));await writeFile(path.join(f.root,shot.screenshot.path),bytes);shot.screenshot.sha256=sha(bytes);await f.rewriteReceipt(shot);await blocked(f,/duplicated screenshot bytes\/pixels/);
}));
test('capture ID/view/source/camera/viewport/screenshot must exactly match original receipt metadata and bytes',using(async f=>{
 const shot=f.manifest.rounds[0].captures[0],original=clone(shot);
 for(const [change,pattern]of [[c=>{c.id='invented';},/capture ID missing/],[c=>{c.view='wide';},/metadata mismatch/],[c=>{c.camera.x++;},/metadata mismatch/],[c=>{c.viewport.width++;},/metadata mismatch/],[c=>{c.sourceHash='sha256:'+'0'.repeat(64);},/capture sourceHash/],[c=>{c.screenshot.sha256='0'.repeat(64);},/metadata mismatch/]]){Object.assign(shot,clone(original));change(shot);await blocked(f,pattern);}
 Object.assign(shot,clone(original));await writeFile(path.join(f.root,shot.receipt.path),'changed receipt');await blocked(f,/capture receipt bytes changed/);
}));
test('missing/disguised/changed screenshots, wrong viewport and detached evidence fail even with rewritten metadata',using(async f=>{
 const shot=f.manifest.rounds[0].captures[0],file=path.join(f.root,shot.screenshot.path),bytes=await readFile(file),hash=shot.screenshot.sha256;
 await rm(file);await blocked(f,/ENOENT/);const text=Buffer.from('not PNG');await writeFile(file,text);shot.screenshot.sha256=sha(text);await f.rewriteReceipt(shot);await blocked(f,/Not PNG\/WebP/);
 await writeFile(file,bytes);await blocked(f,/screenshot bytes changed/);shot.screenshot.sha256=hash;shot.viewport.width=100;await f.rewriteReceipt(shot);await blocked(f,/screenshot viewport mismatch/);
 shot.viewport.width=16;await f.rewriteReceipt(shot);f.manifest.rounds[0].criteria[0].refs=[f.reference];await blocked(f,/evidence detached/);
}));
test('a fail cannot become pass silently, through prose-only correction, or through a camera-only material correction',using(async f=>{
 f.manifest.rounds[0].criteria[0].status='fail';await blocked(f,/earlier fail has no concrete correction\/new-capture resolution/);
 const r=f.manifest.rounds[1],shot=r.captures[0];r.resolutions=[{failures:['r1:hierarchy'],correction:{kind:'art-change',description:'An alleged correction with no changed actual source bytes behind this assertion.',beforeSourceHashes:[r.sourceHash],afterSourceHash:r.sourceHash},afterCaptureIds:[shot.id],judgment:{id:'hierarchy',status:'pass',evidence:'Synthetic unearned pass asserts that the unchanged source was corrected.',refs:[shot.screenshot.path]}}];
 await blocked(f,/art correction must change the failed source/);r.resolutions[0].correction.kind='camera-correction';await blocked(f,/camera-only correction cannot close/);
}));
test('explicit fail→actual source edit→snapshot→new capture→concrete rejudgment closes the named failure',using(async f=>{
 assert.equal(f.manifest.rounds[0].criteria[0].status,'fail');assert.notEqual(f.manifest.rounds[0].sourceHash,f.manifest.rounds[1].sourceHash);assert.notDeepEqual(f.manifest.rounds[0].sourceState,f.manifest.rounds[1].sourceState);
 const r=await checkArtReview({root:f.root});assert.deepEqual(r.errors,[]);assert.equal(r.status,'records-consistent');
},{failThenFix:true}));
test('resolution requires concrete correction, actual before/after source states, its own new captures and pass judgment',using(async f=>{
 const resolution=f.manifest.rounds[1].resolutions[0],original=clone(resolution);
 for(const [change,pattern]of [[r=>{r.correction.description='fixed';},/concrete correction/],[r=>{r.correction.beforeSourceHashes=['sha256:'+'0'.repeat(64)];},/before\/after source states/],[r=>{r.afterCaptureIds=[f.manifest.rounds[0].captures[0].id];},/captured in this review/],[r=>{r.judgment.status='fail';},/rejudged pass/],[r=>{r.judgment.refs=[f.reference];},/reference its new captures/]]){Object.assign(resolution,clone(original));change(resolution);await blocked(f,pattern);}
},{failThenFix:true}));
test('final holistic judgments cannot be absent, copied from rounds, or copied between final judgments',using(async f=>{
 const final=f.manifest.final,original=clone(final);
 delete final.reviewKind;await blocked(f,/Separate final holistic/);Object.assign(final,clone(original));final.holisticCriteria.pop();await blocked(f,/missing criterion/);Object.assign(final,clone(original));
 for(const change of [q=>{q.criteria[0].evidence=f.manifest.rounds[0].criteria[0].evidence;},q=>{q.holisticCriteria[0].evidence=q.criteria[0].evidence;},q=>{q.criteria[1].evidence=q.criteria[0].evidence;},q=>{q.holisticCriteria[1].evidence=q.holisticCriteria[0].evidence;}]){Object.assign(final,clone(original));change(final);await blocked(f,/copied earlier review text/);}
}));
test('parent needs actual message metadata, independent text and all final representative pictures',using(async f=>{
 const final=f.manifest.final,parent=final.parentImageReview,original=clone(parent);
 for(const [change,pattern]of [[p=>{p.status='pending';},/Parent final image review/],[p=>{p.sourceHash='sha256:'+'0'.repeat(64);},/Parent final image review source hash is stale/],[p=>{delete p.message;},/Actual received parent review message/],[p=>{p.message.messageId='';},/Actual received parent review message/],[p=>{p.evidence=final.criteria[0].evidence;},/copied earlier review text/],[p=>{p.evidence=final.regressions[0].evidence;},/copied earlier review text/],[p=>{p.evidence=final.holisticCriteria[0].evidence;},/copied earlier review text/],[p=>{p.refs=p.refs.filter(ref=>!ref.includes('final-stage3-mobile'));},/reference all final representative captures/]]){Object.assign(parent,clone(original));change(parent);await blocked(f,pattern);}
}));
test('final requires normal/wide/mobile per representative, affected overview, related rest and the full stage set',using(async f=>{
 const final=f.manifest.final;
 for(const [stage,view,pattern]of [[1,'mobile',/missing representative mobile/],[3,'wide',/missing representative wide/],[18,'overview',/missing stage capture|missing affected overview/],[3,'rest',/missing related rest scene/]]){const index=final.captures.findIndex(c=>c.stage===stage&&c.view===view),[removed]=final.captures.splice(index,1);await blocked(f,pattern);final.captures.splice(index,0,removed);}
 final.stages.pop();await blocked(f,/all representative and affected/);
}));
test('unresolved focused, holistic, regression judgments or open findings block final release',using(async f=>{
 const final=f.manifest.final;for(const rows of [final.criteria,final.holisticCriteria,final.regressions]){rows[0].status='fail';await blocked(f,/Unresolved fail/);rows[0].status='pass';}
 final.unresolvedFailures=['Synthetic unclosed root contact'];await blocked(f,/Unresolved failures/);
}));
test('a final reference cannot silently change original capture metadata even if its receipt is rewritten',using(async f=>{
 const final=f.manifest.final;final.captures[0]=clone(final.captures[0]);final.captures[0].camera.x++;
 final.captures[0].receipt={path:'evidence/altered-final-receipt.json'};
 await f.rewriteReceipt(final.captures[0]);await blocked(f,/metadata mismatch|final reference must exactly match/);
}));
test('public build and release preparation share the art gate; private candidate captures use explicit preview',async()=>{
 const root=path.resolve(import.meta.dirname,'..'),pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
 assert.equal(pkg.scripts.build,'node workshop/build.mjs');assert.equal(pkg.scripts['prepare:release'],'node tools/release/prepare.mjs');assert.equal(pkg.scripts['build:preview'],'node tools/release/preview.mjs');
 const source=await readFile(path.join(root,'tools/release/prepare.mjs'),'utf8');assert.match(source,/import\s*\{buildWeb\}.*shared\/web-build/);assert.match(source,/await buildWeb\(\)/);assert.doesNotMatch(source,/spawnSync|\['run',\s*'build'\]/);
});
