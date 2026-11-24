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
 const third=await readFile(new URL('./data/act6-qa/third.json',import.meta.url));
 assert.equal(hash(third),'7684415ea7182438c8aa3d60c0bf14a1c177682ff25df3ff88c50958cb32231c');
 const t=JSON.parse(third),m=JSON.parse(t.mapText),l=JSON.parse(t.libraryText),d=t.rule;
 assert.equal(t.kind,'isolated-act6-third-author');assert.equal(t.source,intake.base);
 assert.equal(hash(t.mapText),t.mapSHA);assert.equal(hash(t.libraryText),t.librarySHA);
 assert.equal(m.id,'contact-q-03');assert.deepEqual(m.metadata,{stageId:3,campaign:false});
 assert.equal(d.id,53);assert.deepEqual(d.requires,[52]);assert(d.allowCanonical===false);
 const ids=new Set(m.elements.map(v=>v.assetId));assert.equal(ids.size,l.length);
 for(const v of l){assert(ids.has(v.id)&&!seen.has(v.id));seen.add(v.id);}
 assert.deepEqual(m.units.map(v=>[v.id,v.team]),[['draft-damheo','player'],['draft-lower-lane-guard','enemy'],['draft-upper-side-guard','enemy']]);
 assert.deepEqual(Object.keys(t.provisionalTwoStockEnemies),['a5-foe-7','a5-foe-13']);
 packets.push({schema:'honro-act6-app-owner-integrated-packet-r1',map:{...m,metadata:{stageId:53,campaign:false,act:6,actStage:3}},library:l,
  trace:{stageId:53,authoredId:m.id,mapSHA256:t.mapSHA,assetSHA256:t.librarySHA},mission:{...d,runtimeReleaseEnabled:false,shape:{playSHA:d.playSHA,worldSHA:d.worldSHA}},
  donor:t.provisionalTwoStockEnemies});
 const source=await readFile(new URL('./runtime/act6-app-qa.js',import.meta.url),'utf8');
 const e53=await readFile(new URL('./runtime/act6-stage53-actions.mjs',import.meta.url),'utf8');
 const i53=await readFile(new URL('./runtime/act6-inner-missions.mjs',import.meta.url),'utf8');
 assert.equal(hash(e53),'1726794ab2ae768b7ef672590b6a0f21802ee53663c31607233f10fb49f30817');
 assert.equal(hash(i53),'3f5d3b86d7737a0975836545c8aef44fbf8e1b48a429ae053b3540c17fc59f8c');
 const three=replaceOne(replaceOne(source,'/* THIRD_OWNER */','{\n'+i53.replace('export function','function')+'\n third=createInnerMissionOwner({C,manifest:thirdManifest,verifyMounted:verifyThird,verifyIncoming:incomingThird,verifyChart:chartThird});\n}'), '/* THIRD_ACTIONS */', '{\n'+e53.replace('export function','function')+'\n actions53=createStage53PhysicalActions({C,authenticate:verifyThirdActions});\n}');
 const first=await readFile(new URL('./runtime/act6-first-missions.mjs',import.meta.url),'utf8');
 assert.equal(hash(first),'1bbbfff697c2664ce873f97393faa714bf89a5d0f047111631d5108fdc4f49cf');
 assert.equal(first.split('export function createFirstMissionOwner').length,2);
 const c53=await readFile(new URL('./runtime/stage53-aim-camera.mjs',import.meta.url),'utf8');
 const camera=replaceOne(three,'/* THIRD_CAMERA */',c53.replace('export function createStage53AimCamera','function createStage53AimCamera')+'\n const stage53AimCamera=createStage53AimCamera(G);');
 return {source:replaceOne(camera,'/* FIRST_OWNER */',first.replace('export function createFirstMissionOwner','function createFirstMissionOwner')),packets};
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
 ['        persist() {','        persist() { if(qa51.active(this))return false;'],
 ['        flushBattleSave() {','        flushBattleSave() { if(qa51.active(this)){this.dirty=false;return;}'],
 ["if (this.engine && !this.training && !this.done) {","if (!qa51.active(this) && this.engine && !this.training && !this.done) {"],
 ['this.profile=this.customMap.returnProfile;this.stageId=this.customMap.returnStageId;this.customMap=null;}','this.profile=this.customMap.returnProfile;this.stageId=this.customMap.returnStageId;this.customMap=null;} qa51.release(this);'],
 ['        isOpen(st) {','        isOpen(st) { if(st?.id>=51)return false;'],
 ['        launch(id = this.stageId, training = false, skill = null) {','        launch(id = this.stageId, training = false, skill = null, permit) {\n            if(id>=51)return (id===51||id===52||id===53)&&!training?qa51.enter(this,id,permit):undefined;'],
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
 ["const combatSkills=u.meleeFollow==='ready'&&!u.loadout.includes('S00')?['S00',...u.loadout]:u.loadout;",
  "const combatSkills=qa51.withContextSkill(this,u,u.meleeFollow==='ready'&&!u.loadout.includes('S00')?['S00',...u.loadout]:u.loadout);"],
 ['G.HonroStakeCrossing.skills(this.engine.b,active).includes(remembered)','qa51.withContextSkill(this,active,G.HonroStakeCrossing.skills(this.engine.b,active)).includes(remembered)'],
 ['G.HonroStakeCrossing.skills(b,u).includes(this.selected)','qa51.withContextSkill(this,u,G.HonroStakeCrossing.skills(b,u)).includes(this.selected)'],
 ['}else this.engine.fire(this.selected, u.angle, this.power);','}else if(!qa51.releaseContextSkill(this,u))this.engine.fire(this.selected, u.angle, this.power);'],
 ['        async export() {','        async export() { if(qa51.active(this))return;'],
 ["else if (el.id === 'file-import' && el.files[0]) {","else if (el.id === 'file-import' && el.files[0]) {\n                if(qa51.active(this)){el.value='';return;}"]
 ];
 return edits.reduce((code,[a,b])=>replaceOne(code,a,b),main);
}
