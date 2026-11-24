import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,realpath,lstat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const hash=(value,algorithm='sha256')=>createHash(algorithm).update(value).digest('hex');
const terrainSourceSHA='6b01d867cab98268bcd8d4f328f4166c90d091b64bf69d0a1e1eb6da51e245ca';
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
 const signed=await readFile(new URL('./data/act6-qa/first-two.json',import.meta.url));
 assert.equal(hash(signed),terrainSourceSHA,'Exact author Stage51/52 bytes changed');
 const intake=JSON.parse(signed);
 assert.equal(intake.schema,'honro-act6-app-owner-integrated-sources-r1');
 assert.equal(intake.base,'b607164fd31da526373efb12d06063c2b564719d');
 assert.deepEqual(Object.keys(intake.rows),['51','52']);
 assert.deepEqual(Array.from(project.stages,s=>s.metadata.stageId),Array.from({length:50},(_,i)=>i+1));
 assert(project.stages.every(s=>s.metadata.campaign===true));
 const seen=new Set(project.library.map(x=>x.id)),packets=[];
 for(const id of [51,52]){
  const {entry,mission,owner}=intake.rows[id],key=id-50;
  assert.equal(entry.stageId,id);assert.equal(entry.originalKey,key);
  assert.equal(entry.ownerId,'qa-act6-r4-0'+key);assert.equal(entry.strictWorkshopPassed,false);
  assert.equal(hash(entry.mapBytesUTF8),entry.mapSHA256);assert.equal(hash(entry.assetBytesUTF8),entry.assetSHA256);
  assert(!project.stages.some(s=>s.id===entry.ownerId));
  const original=JSON.parse(entry.mapBytesUTF8),library=JSON.parse(entry.assetBytesUTF8);
  assert.equal(original.id,entry.ownerId);assert.deepEqual(original.metadata,{stageId:key,campaign:false});
  const map={...original,metadata:{stageId:id,campaign:false,act:6,actStage:key}};
  const ids=new Set(map.elements.map(x=>x.assetId)),local=new Set(library.map(x=>x.id));
  assert.equal(ids.size,library.length);assert.equal(local.size,library.length);
  assert(Array.from(ids,x=>local.has(x)&&!seen.has(x)).every(Boolean),'provider collides with authored definition');
  for(const x of local)seen.add(x);
  assert.equal(mission.id,id);assert.equal(mission.authoredAlias,map.id);assert.equal(mission.runtimeReleaseEnabled,false);
  assert.equal(mission.authorReadyMissionCandidate,true);assert.deepEqual(mission.requires,[id-1]);assert.equal(mission.objective,'act6-native');
  assert.equal(mission.shape.sourceSHA,entry.mapSHA256);assert.equal(mission.shape.assetsSHA,entry.assetSHA256);assert.equal(mission.shape.playSHA,owner.colliderSHA256);
  assert(!map.environment.placements.length&&!map.design?.space?.terrainAttachments?.length);
  assert.deepEqual(map.units.map(x=>[x.id,x.kind,x.x,x.y]),owner.actors.map(x=>[x.id,x.cls,x.x,x.y]));
  const trace={stageId:id,authoredId:entry.ownerId,mapSHA256:entry.mapSHA256,assetSHA256:entry.assetSHA256};
  packets.push({schema:'honro-act6-app-owner-integrated-packet-r1',owner,trace,map,library,mission});
 }
 let source=await readFile(new URL('./runtime/act6-app-qa.js',import.meta.url),'utf8');
 const rest=await readFile(new URL('./runtime/act6-fifty-rest-qa.mjs',import.meta.url),'utf8');
 assert.equal(hash(rest),'10a7e17d918c9cd3f58eb2382433cac534776b72a26f1c672130d82ccb83ec84');
 let first=await readFile(new URL('./runtime/act6-first-missions.mjs',import.meta.url),'utf8');
 assert.equal(hash(first),'1bbbfff697c2664ce873f97393faa714bf89a5d0f047111631d5108fdc4f49cf');
 assert.equal(first.split('export function createFirstMissionOwner').length,2);
 if(env.HONRO_ACT6_QA_NORMAL51==='1'){
  const normal=await readFile(new URL('./runtime/stage51-entry.inc.js',import.meta.url),'utf8');
  source=replaceOne(source,'      function enter(app,id,ticket){',normal+'\n      function enter(app,id,ticket){');
  source=replaceOne(source,'try{return enter(app,51,null);}finally{restGrants.delete(app);}', 'try{return enterNormal51(app,grant,carried);}finally{restGrants.delete(app);}');
  source=replaceOne(source,"kind:'isolated-authored-engine',incoming:s.previous","kind:s.normal51?'normal-owned-release':'isolated-authored-engine',incoming:s.previous");
  source=replaceOne(source,"Object.defineProperty(e,'stage',{configurable:true,get:()=>rule});","if(!s.normal51)Object.defineProperty(e,'stage',{configurable:true,get:()=>rule});");
  source=replaceOne(source,'active:app=>active.has(app),bind','active:app=>active.has(app),isNormal:app=>active.get(app)?.normal51===true,bind');
  first=replaceOne(first,'||b.honroGrowth||', "||b.honroGrowth&&!(source?.kind==='normal-owned-release'&&b.honroGrowth.limit.total===0&&b.honroGrowth.limit.combat===0)||");
 }
 return {source:replaceOne(replaceOne(source,'/* FIRST_OWNER */',first.replace('export function createFirstMissionOwner','function createFirstMissionOwner')),'/* FIFTY_OWNER */','const {createFiftyRestAdmission,buildPartyFromNormalRest,bindOrdinaryFiftyRestUI}=(()=>{'+rest.replaceAll('export function ','function ')+'\nreturn {createFiftyRestAdmission,buildPartyFromNormalRest,bindOrdinaryFiftyRestUI};})();'),packets};
}
function replaceOne(src,old,next){
 assert.equal(src.split(old).length,2,'Unreviewed normal App callsite '+old);
 return src.replace(old,()=>next);
}
export function makeQaMain(main,source,descriptor){
 const bytes=Buffer.from(main);
 assert.equal(hash(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes]),'sha1'),pinnedMain);
 const proto=source.replace('/* SIGNED_ASSET */',JSON.stringify(descriptor));
 assert.equal(source.split('/* SIGNED_ASSET */').length,2);
 const edits=[
 ['    class App {',proto+'\n    class App {'],
 ['if(this.profileStore.locked&&!this.profileRecoveryShown)','qa51.offer(this); if(this.profileStore.locked&&!this.profileRecoveryShown)'],
 ['G.HonroEquipmentUI.tick(this);return out;}','G.HonroEquipmentUI.tick(this);qa51.offerRest(this);return out;}'],
 ['G.HonroRestJourney.requestRest(this);','G.HonroRestJourney.requestRest(this);qa51.offerRest(this);'],
 ['        persist() {','        persist() { if(qa51.active(this))return false;'],
 ['        flushBattleSave() {','        flushBattleSave() { if(qa51.active(this)){this.dirty=false;return;}'],
 ["if (this.engine && !this.training && !this.done) {","if (!qa51.active(this) && this.engine && !this.training && !this.done) {"],
 ['this.profile=this.customMap.returnProfile;this.stageId=this.customMap.returnStageId;this.customMap=null;}','this.profile=this.customMap.returnProfile;this.stageId=this.customMap.returnStageId;this.customMap=null;} qa51.release(this);'],
 ['        isOpen(st) {','        isOpen(st) { if(st?.id>=51)return false;'],
 ['        launch(id = this.stageId, training = false, skill = null) {','        launch(id = this.stageId, training = false, skill = null, permit) {\n            if(id>=51)return (id===51||id===52)&&!training?qa51.launch(this,id,permit):undefined;'],
 ['        retry() {','        retry() { if(qa51.active(this))return this.showTitle();'],
 ['        continue() {','        continue() {\n            if(qa51.active(this)||this.profile.honroBattle?.honroStage>=51||this.profile.honroMapRestart>=51)return;'],
 ['const st=H.stages[this.stageId-1], campaign=', 'const st=qa51.active(this)?this.stage:H.stages[this.stageId-1], campaign='],
 ['            e.checkEnd = () => this.checkMission(e);','            if(!qa51.bind(this,e))e.checkEnd = () => this.checkMission(e);'],
 ['        missionTick(dt){','        missionTick(dt){if(qa51.active(this))return;'],
 ['G.HonroObjectives.state(b,st);','(qa51.goalState(this,e)??G.HonroObjectives.state(b,st));'],
 ['const win=G.HonroObjectives.state(b,st).complete;', 'const win=(qa51.goalState(this,e)??G.HonroObjectives.state(b,st)).complete;'],
 ['            if(this.done||!this.engine)return;','            if(this.done||!this.engine)return;\n            if(qa51.outcome(this))return;'],
 ["if(e.code==='KeyE'&&G.HonroInteractions?.key(this,e))return;", "if(e.code==='KeyE'&&(qa51.action(this,e)||G.HonroInteractions?.key(this,e)))return;"],
 ['const a = el.dataset.action, id = el.dataset.id, sk = el.dataset.skill;','const a = el.dataset.action, id = el.dataset.id, sk = el.dataset.skill; if(!qa51.keepAction(this,a))return;'],
 ['        async export() {','        async export() { if(qa51.active(this))return;'],
 ["else if (el.id === 'file-import' && el.files[0]) {","else if (el.id === 'file-import' && el.files[0]) {\n                if(qa51.active(this)){el.value='';return;}"]
 ];
 if(source.includes('function enterNormal51('))edits.push(
  ['            G.HonroObjectives.updateSettlement(b,st,state.objectiveReady);','            if(!qa51.isNormal(this))G.HonroObjectives.updateSettlement(b,st,state.objectiveReady);']);
 return edits.reduce((code,[a,b])=>replaceOne(code,a,b),main);
}
