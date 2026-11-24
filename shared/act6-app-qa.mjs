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
  source=replaceOne(source,'        permits.delete(app);\n        const {packet,compiled,known}=grant','        permits.delete(app);\n        if(id===52&&active.get(app)?.normal51===true)return enterNormal52(app,grant,active.get(app));\n        const {packet,compiled,known}=grant');
  source=replaceOne(source,'terminal?.stage===51&&!s.ordinaryRest','terminal?.stage===51&&(!s.ordinaryRest||s.normal51===true)');
  source=replaceOne(source,"kind:'isolated-authored-engine',incoming:s.previous","kind:s.normal51?'normal-owned-release':'isolated-authored-engine',incoming:s.previous");
  source=replaceOne(source,"Object.defineProperty(e,'stage',{configurable:true,get:()=>rule});","if(!s.normal51)Object.defineProperty(e,'stage',{configurable:true,get:()=>rule});");
  source=replaceOne(source,'active:app=>active.has(app),bind','active:app=>active.has(app),isNormal:app=>active.get(app)?.normal51===true,bind');
  source=replaceOne(source,'if(terminal)s.terminal=terminal;',`if(terminal){
          s.terminal=terminal;
          if(s.normal51&&terminal.stage===51&&terminal.flags['act6.threeSitesSighted']===true&&terminal.settlement===false&&s.button){
            const witness=Object.freeze({stage:terminal.stage,flags:terminal.flags,actors:terminal.actors,events:terminal.events,settlement:terminal.settlement});
            s.button.dataset.act6Normal51Receipt=JSON.stringify(witness);
          }
          if(s.normal51&&terminal.stage===53&&terminal.flags['act6.innerStakeAReady']===true&&terminal.settlement===false&&s.button){
            const witness={stage:53,flags:terminal.flags,mage:terminal.mage,external:terminal.external,stake:terminal.stake,settlement:false};
            s.button.dataset.act6Normal53Receipt=JSON.stringify(witness);
          }
        }`);
  first=replaceOne(first,'||b.honroGrowth||', "||b.honroGrowth&&!(source?.kind==='normal-owned-release'&&b.honroGrowth.limit.total===0&&b.honroGrowth.limit.combat===0)||");
  const thirdRaw=await readFile(new URL('./data/act6-qa/third.json',import.meta.url));
  assert.equal(hash(thirdRaw),'7684415ea7182438c8aa3d60c0bf14a1c177682ff25df3ff88c50958cb32231c');
  const third=JSON.parse(thirdRaw),v=third.rule;
  assert(v.id===53&&v.allowCanonical===false&&hash(third.mapText)===third.mapSHA&&hash(third.libraryText)===third.librarySHA);
  const map53=JSON.parse(third.mapText),library53=JSON.parse(third.libraryText);
  assert(map53.id===v.authoredAlias&&map53.units.filter(u=>u.team==='player').length===1);
  assert(library53.every(u=>!seen.has(u.id)));
  packets.push({schema:'honro-act6-normal-53-source/v1',trace:{stageId:53,authoredId:map53.id,mapSHA256:third.mapSHA,assetSHA256:third.librarySHA},map:map53,library:library53,mission:v,foes:third.provisionalTwoStockEnemies});
  const b53=await readFile(new URL('./runtime/stage53-entry.inc.js',import.meta.url),'utf8');
  let mission53=await readFile(new URL('./runtime/act6-inner-missions.mjs',import.meta.url),'utf8');
  mission53=mission53.replaceAll('!g.b.honroGrowth','(!g.b.honroGrowth||g.quotedZeroPilot)')
    .replace('||b.honroGrowth||b.honroJourneyReplay','||(b.honroGrowth&&!d.quotedZeroPilot)||b.honroJourneyReplay')
    .replace('const g={app,b,stage:s,actor:u,d,external:','const g={app,b,stage:s,actor:u,d,quotedZeroPilot:d.quotedZeroPilot===true,external:');
  const actions53=await readFile(new URL('./runtime/stage53-actions.mjs',import.meta.url),'utf8');
  const bind53='const createInnerMissionOwner=(()=>{'+mission53.replace('export function','function')+'\nreturn createInnerMissionOwner;})();\n'+
    'const createStage53PhysicalActions=(()=>{'+actions53.replace('export function','function')+'\nreturn createStage53PhysicalActions;})();\n'+b53;
  source=replaceOne(source,'      function enter(app,id,ticket){',bind53+'\n      function enter(app,id,ticket){');
  source=replaceOne(source,'const stages=new Set([51,52])','const stages=new Set([51,52,53])');
  source=replaceOne(source,"        return app.screen==='battle'&&!!s&&s.b.honroStage===51", "        if(id===53)return app.screen==='battle'&&s?.normal51&&s.b.honroStage===52&&app.engine===s.engine&&s.b.phase==='won'&&app.done&&s.terminal?.stage===52&&s.terminal.flags['act6.outerSitesPrepared']===true&&s.terminal.flags['act6.darmheoInTemple']===true;\n        return app.screen==='battle'&&!!s&&s.b.honroStage===51");
  source=replaceOne(source,"      check(packet.schema==='honro-act6-app-owner-integrated-packet-r1'", "      if(id===53){\n        check(packet.schema==='honro-act6-normal-53-source/v1'&&packet.trace.stageId===53&&packet.map.id===packet.trace.authoredId&&packet.trace.mapSHA256===pin.mapSHA256&&packet.trace.assetSHA256===pin.assetSHA256&&packet.mission.id===53&&packet.mission.allowCanonical===false,'Unexpected archived 53 origin');\n        const compiled=G.HonroMaps.compile(packet.map,{library:packet.library}),known=[];\n        for(const [k,v] of [['playSHA',compiled.terrain],['worldSHA',compiled.worldTerrain]]){const x=JSON.stringify(v),h=await sha(new TextEncoder().encode(x));check(h===packet.mission[k],'Invalid 53 physical owner');known.push([x,h]);}\n        return {packet,compiled,known};\n      }\n      check(packet.schema==='honro-act6-app-owner-integrated-packet-r1'");
  source=replaceOne(source,'        if(id===52&&active.get(app)?.normal51===true)', '        if(id===53&&active.get(app)?.normal51===true)return enterNormal53(app,grant,active.get(app));\n        if(id===52&&active.get(app)?.normal51===true)');
  source=replaceOne(source,'        const source=Object.freeze({kind:s.normal51?', "        if(e.b.honroStage===53&&s.kind==='normal-53-private')return bindNormal53(app,e,s);\n        const source=Object.freeze({kind:s.normal51?");
  source=replaceOne(source,'function goalState(app,e){return owner.project(app,e);}', 'function goalState(app,e){return e?.b?.honroStage===53?indoor53.project(app,e):owner.project(app,e);}');
  source=replaceOne(source,'        const id=owner.project(app,e)?.targets?.[0]?.id;', "        if(e.b.honroStage===53){const a=actions53.usePassage(app,e);if(a.ok&&s.button)s.button.disabled=true;else if(!a.ok)app.notify(a.reason);e.checkEnd();app.updateHUD(true);return true;}\n        const id=owner.project(app,e)?.targets?.[0]?.id;");
  source=replaceOne(source,'        const terminal=owner.terminal(app,s.engine);','        const terminal=s.b.honroStage===53?indoor53.terminal(app,s.engine):owner.terminal(app,s.engine);');
  source=replaceOne(source,'        app.notify(terminal?', "        if(terminal?.stage===52&&s.normal51){const btn=document.createElement('button');btn.type='button';btn.dataset.act6QaNext='53';styleAction(btn);btn.textContent='담허가 문지방을 넘는다';appUI(app)?.append(btn);issue(app,btn,53);}\n        app.notify(terminal?");
  source=replaceOne(source,'release,keepAction:', 'release,context53,release53,keepAction:');

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
 if(source.includes('function enterNormal53('))edits.push(
  ['(id===51||id===52)&&!training?qa51.launch', '(id===51||id===52||id===53)&&!training?qa51.launch'],
  ["const combatSkills=u.meleeFollow==='ready'&&!u.loadout.includes('S00')?['S00',...u.loadout]:u.loadout;", "const combatSkills=qa51.context53(this,u,u.meleeFollow==='ready'&&!u.loadout.includes('S00')?['S00',...u.loadout]:u.loadout);"],
  ['G.HonroStakeCrossing.skills(this.engine.b,active).includes(remembered)','qa51.context53(this,active,G.HonroStakeCrossing.skills(this.engine.b,active)).includes(remembered)'],
  ['G.HonroStakeCrossing.skills(b,u).includes(this.selected)','qa51.context53(this,u,G.HonroStakeCrossing.skills(b,u)).includes(this.selected)'],
  // Keep the ordinary App charge/HUD path, but treat a genuinely exposed
  // story M09 as equipped at these presentation/input checks only. Engine.fire
  // still denies a raw attempt; the mounted owner grants the exact one cast.
  ['!this.engine.skillAllowed(sk,u) || !this.engine.canAfford(sk,u,0)', '!(this.engine.skillAllowed(sk,u)||qa51.context53(this,u,[]).includes(sk.id)) || !this.engine.canAfford(sk,u,0)'],
  ['e.skillAllowed(s,u),!e.canAfford(s,u)', '(e.skillAllowed(s,u)||qa51.context53(this,u,[]).includes(id)),!e.canAfford(s,u)'],
  ['selected=id===this.selected,allowed=e.skillAllowed(s,u);', 'selected=id===this.selected,allowed=e.skillAllowed(s,u)||qa51.context53(this,u,[]).includes(id);'],
  ['!e.skillAllowed(sk,u)||!this.canInput()', '!(e.skillAllowed(sk,u)||qa51.context53(this,u,[]).includes(sk?.id))||!this.canInput()'],
  ['}else this.engine.fire(this.selected, u.angle, this.power);','}else if(!qa51.release53(this,u))this.engine.fire(this.selected, u.angle, this.power);']);
 return edits.reduce((code,[a,b])=>replaceOne(code,a,b),main);
}
