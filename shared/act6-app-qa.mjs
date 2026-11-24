import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,realpath,lstat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const hash=(value,algorithm='sha256')=>createHash(algorithm).update(value).digest('hex');
const ownerSHA='413805734d68b071a430f5917533d4c4c99b7e7f08f4fafa6a5aa00489a9313f';
const terrainSourceSHA='ed58e8fe1ac789a812143d324eed878bf5852a693e6cb3a1921f985fddfe2798';
const pinnedMain='d73360989a51f142e9da9d59c0da81adf55c8e2f';
export async function assertQaWebRoot(repoRoot,env=process.env){
 const root=await realpath(repoRoot), tmp=await realpath(tmpdir());
 assert.equal(path.dirname(root),tmp,'Act6 Web pilot requires a disposable direct temporary checkout');
 assert.match(path.basename(root),/^honro-act6-web-qa-[A-Za-z0-9]+$/);
 assert.equal(env.HONRO_ACT6_QA_WEB_ROOT,root,'explicit exact disposable checkout required');
 assert.equal((await lstat(root)).mode&0o077,0,'Act6 Web pilot checkout must be private');
}
export async function createAct6WebQa(project,repoRoot,env=process.env){
 await assertQaWebRoot(repoRoot,env);
 const signedTerrain=await readFile(new URL('./data/act6-qa/01-author.json',import.meta.url));
 assert.equal(hash(signedTerrain),terrainSourceSHA,'Exact Stage51-only authored source changed');
 const intake=JSON.parse(signedTerrain);
 assert.deepEqual(Object.keys(intake),['schema','reviewedAgainst','sourceReceiptSHA256','only']);
 assert.equal(intake.schema,'honro-act6-app-qa-51-only-source');
 assert.equal(intake.reviewedAgainst,'b607164fd31da526373efb12d06063c2b564719d');
 assert.equal(intake.sourceReceiptSHA256,'25dce1c8605603b751b9ac1825c15d6e0daff39efee47757ef8f03d0f848a09f');
 const only=intake.only;
 assert.equal(only.stageId,51);assert.equal(only.originalKey,1);
 assert.equal(only.ownerId,'qa-act6-r4-01');assert.equal(only.strictWorkshopPassed,false);
 assert.equal(hash(only.mapBytesUTF8),only.mapSHA256);assert.equal(hash(only.assetBytesUTF8),only.assetSHA256);
 assert.deepEqual(Array.from(project.stages,s=>s.metadata.stageId),Array.from({length:50},(_,i)=>i+1));
 assert(project.stages.every(s=>s.metadata.campaign===true)&&!project.stages.some(s=>s.id===only.ownerId));
 const original=JSON.parse(only.mapBytesUTF8),library=JSON.parse(only.assetBytesUTF8);
 assert.equal(original.id,only.ownerId);
 assert.deepEqual(original.metadata,{stageId:1,campaign:false});
 const map={...original,metadata:{stageId:51,campaign:false,act:6,actStage:1}};
 const ids=new Set(map.elements.map(x=>x.assetId)), local=new Set(library.map(x=>x.id)), stock=new Set(project.library.map(x=>x.id));
 assert.equal(library.length,10);assert.equal(ids.size,10);assert.equal(local.size,10);
 assert(Array.from(ids,x=>local.has(x)&&!stock.has(x)).every(Boolean),'Release provider collides with QA definition');
 const trace={stageId:51,authoredId:only.ownerId,originalKey:1,mapSHA256:only.mapSHA256,assetSHA256:only.assetSHA256,art:10,strictWorkshopPassed:false,campaign:false};
 const signed=await readFile(new URL('./data/act6-qa/01-owner.json',import.meta.url));
 assert.equal(hash(signed),ownerSHA,'01 initial founder and mission owner data have changed');
 const owner=JSON.parse(signed);
 assert.equal(library.length,10);assert.equal(trace.authoredId,'qa-act6-r4-01');assert.deepEqual(map.metadata,{stageId:51,campaign:false,act:6,actStage:1});
 assert(!map.environment.placements.length&&!map.design?.space?.terrainAttachments?.length);
 assert.deepEqual(map.units.map(x=>[x.id,x.kind,x.x,x.y]),owner.actors.map(x=>[x.id,x.cls,x.x,x.y]));
 assert.equal(owner.contract.marks[0]?.id,'overlook');
 const source=await readFile(new URL('./runtime/act6-app-qa.js',import.meta.url),'utf8');
 return {source,packet:{schema:'honro-act6-app-qa-51-r1',owner,trace,map,library}};
}
function replaceOne(src,old,next){
 assert.equal(src.split(old).length,2,'Unreviewed normal App callsite '+old);
 return src.replace(old,next);
}
export function makeQaMain(main,source,descriptor){
 const bytes=Buffer.from(main);
 assert.equal(hash(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes]),'sha1'),pinnedMain);
 const proto=source.replace('/* SIGNED_ASSET */',JSON.stringify(descriptor));
 assert.equal(source.split('/* SIGNED_ASSET */').length,2);
 const edits=[
 ['    class App {',proto+'\n    class App {'],
 ['if(this.profileStore.locked&&!this.profileRecoveryShown)','qa51.offer(this); if(this.profileStore.locked&&!this.profileRecoveryShown)'],
 ['        persist() {','        persist() { if(qa51.active(this))return false;'],
 ['        flushBattleSave() {','        flushBattleSave() { if(qa51.active(this)){this.dirty=false;return;}'],
 ["if (this.engine && !this.training && !this.done) {","if (!qa51.active(this) && this.engine && !this.training && !this.done) {"],
 ['this.profile=this.customMap.returnProfile;this.stageId=this.customMap.returnStageId;this.customMap=null;}','this.profile=this.customMap.returnProfile;this.stageId=this.customMap.returnStageId;this.customMap=null;} qa51.release(this);'],
 ['        isOpen(st) {','        isOpen(st) { if(st?.id>=51)return false;'],
 ['        launch(id = this.stageId, training = false, skill = null) {','        launch(id = this.stageId, training = false, skill = null, permit) {\n            if(id>=51)return id===51&&!training?qa51.enter(this,permit):undefined;'],
 ['        retry() {','        retry() { if(qa51.active(this))return this.showTitle();'],
 ['        continue() {','        continue() {\n            if(qa51.active(this)||this.profile.honroBattle?.honroStage>=51||this.profile.honroMapRestart>=51)return;'],
 ['const st=H.stages[this.stageId-1], campaign=', 'const st=qa51.active(this)?this.stage:H.stages[this.stageId-1], campaign='],
 ['            e.checkEnd = () => this.checkMission(e);','            if(!qa51.bind(this,e))e.checkEnd = () => this.checkMission(e);'],
 ['        missionTick(dt){','        missionTick(dt){if(qa51.active(this))return;'],
 ['            if(this.done||!this.engine)return;','            if(this.done||!this.engine)return;\n            if(qa51.outcome(this))return;'],
 ["if(e.code==='KeyE'&&G.HonroInteractions?.key(this,e))return;", "if(e.code==='KeyE'&&(qa51.action(this,e)||G.HonroInteractions?.key(this,e)))return;"],
 ['const a = el.dataset.action, id = el.dataset.id, sk = el.dataset.skill;','const a = el.dataset.action, id = el.dataset.id, sk = el.dataset.skill; if(!qa51.keepAction(this,a))return;'],
 ['        async export() {','        async export() { if(qa51.active(this))return;'],
 ["else if (el.id === 'file-import' && el.files[0]) {","else if (el.id === 'file-import' && el.files[0]) {\n                if(qa51.active(this)){el.value='';return;}"]
 ];
 return edits.reduce((code,[a,b])=>replaceOne(code,a,b),main);
}
