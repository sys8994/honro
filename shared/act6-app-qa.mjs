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
          if(s.normal51&&terminal.stage===54&&terminal.flags['act6.invertedGalleryCrossed']===true&&terminal.settlement===false&&s.button){
            const witness={stage:54,flags:terminal.flags,mage:terminal.mage,external:terminal.external,chart:terminal.chart,relay:terminal.relay,settlement:false};
            s.button.dataset.act6Normal54Receipt=JSON.stringify(witness);
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
  const fourthRaw=await readFile(new URL('./data/act6-qa/fourth.json',import.meta.url));
  assert.equal(hash(fourthRaw),'b5922a3d8aa7bd413f52171ca945e7096585d336c28780f6ccaba3fefb54f5b8');
  const fourth=JSON.parse(fourthRaw);assert(fourth.id===54&&fourth.authoredId==='stage-54'&&fourth.runtimeReleaseEnabled===false&&fourth.map.units.length===0);
  const mapText54=JSON.stringify(fourth.map),assets54=JSON.stringify(fourth.library);
  packets.push({...fourth,schema:'honro-act6-normal-54-source/v1',trace:{stageId:54,authoredId:'stage-54',mapSHA256:hash(mapText54),assetSHA256:hash(assets54)}});
  const charts54=(await readFile(new URL('./runtime/chart-packet.mjs',import.meta.url),'utf8')).split('// Author-time.')[0].replaceAll('export ','');
  const owner54=(await readFile(new URL('./runtime/stage54-pilot-owner.mjs',import.meta.url),'utf8')).split('\n').slice(1).join('\n').replace('export async function','async function');
  const mount54=await readFile(new URL('./runtime/stage54-entry.inc.js',import.meta.url),'utf8');
  const code54='const createStage54ChartOwner=(()=>{'+charts54+owner54+'\nreturn createStage54ChartOwner;})();\n'+mount54;
  const fifthRaw=await readFile(new URL('./data/act6-qa/fifth.json',import.meta.url));
  assert.equal(hash(fifthRaw),'3ae91543525a09093da52ee1dd2bff8ab8324a7e7858996c363afdd10e066b8f');
  const fifth=JSON.parse(fifthRaw);assert(fifth.id===55&&fifth.authoredId==='stage-55'&&fifth.runtimeReleaseEnabled===false&&fifth.map.units.length===0);
  packets.push({...fifth,schema:'honro-act6-normal-55-source/v1',trace:{stageId:55,authoredId:'stage-55',mapSHA256:hash(JSON.stringify(fifth.map)),assetSHA256:hash(JSON.stringify(fifth.library))}});
  const owner55=await readFile(new URL('./runtime/stage55-pilot-owner.mjs',import.meta.url),'utf8');
  const mount55=await readFile(new URL('./runtime/stage55-entry.inc.js',import.meta.url),'utf8');
  const code55='const {createNormalBellOwner,D55}=(()=>{'+owner55.replaceAll('export ','')+'\nreturn {createNormalBellOwner:createStage55EmptyBell,D55:STAGE55};})();\n'+mount55;
  const bind53='const createInnerMissionOwner=(()=>{'+mission53.replace('export function','function')+'\nreturn createInnerMissionOwner;})();\n'+
    'const createStage53PhysicalActions=(()=>{'+actions53.replace('export function','function')+'\nreturn createStage53PhysicalActions;})();\n'+b53+code54+code55;
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
  source=replaceOne(source,'const {packet,compiled,known}=await prepareExact(id);','const {packet,compiled,known,chart}=await prepareExact(id);');
  source=replaceOne(source,'permits.set(app,{ticket,id,packet,compiled,known,owns});','permits.set(app,{ticket,id,packet,compiled,known,chart,owns});');
  source=replaceOne(source,'const stages=new Set([51,52,53])','const stages=new Set([51,52,53,54])');
  source=replaceOne(source,"        if(id===53)return app.screen", "        if(id===54)return eligible54(app,s);\n        if(id===53)return app.screen");
  source=replaceOne(source,"      if(id===53){\n        check(packet.schema", "      if(id===54){\n        check(packet.schema==='honro-act6-normal-54-source/v1'&&packet.trace.stageId===54&&packet.map.id==='stage-54'&&packet.runtimeReleaseEnabled===false&&packet.trace.mapSHA256===pin.mapSHA256&&packet.trace.assetSHA256===pin.assetSHA256,'Invalid 54 packet authority');\n        const compiled=G.HonroMaps.compile(packet.map,{library:packet.library}),known=[];\n        for(const [v,pin] of [[compiled.terrain,packet.charts.N.terrain],[compiled.worldTerrain,packet.charts.N.world]]){const src=JSON.stringify(v),hash=await sha(new TextEncoder().encode(src));check(src===JSON.stringify(pin),'Invalid 54 chart projection');known.push([src,hash]);}\n        return await prepareNormal54(packet,known);\n      }\n      if(id===53){\n        check(packet.schema");
  source=replaceOne(source,'        if(id===53&&active.get(app)?.normal51===true)','        if(id===54&&active.get(app)?.normal51===true)return enterNormal54(app,grant,active.get(app));\n        if(id===53&&active.get(app)?.normal51===true)');
  source=replaceOne(source,"        if(e.b.honroStage===53&&s.kind", "        if(e.b.honroStage===54&&s.owner54)return bindNormal54(app,e,s);\n        if(e.b.honroStage===53&&s.kind");
  source=replaceOne(source,'function goalState(app,e){return e?.b?.honroStage===53?', 'function goalState(app,e){if(e?.b?.honroStage===54)return active.get(app)?.owner54?.project(app,e);return e?.b?.honroStage===53?');
  source=replaceOne(source,'        if(e.b.honroStage===53){const a=actions53', '        if(e.b.honroStage===54){chart54Input(app,s,e);return true;}\n        if(e.b.honroStage===53){const a=actions53');
  source=replaceOne(source,'const terminal=s.b.honroStage===53?', 'const terminal=s.b.honroStage===54?s.owner54.terminal(app,s.engine):s.b.honroStage===53?');
  source=replaceOne(source,'        if(terminal?.stage===52&&s.normal51)', "        if(terminal?.stage===53&&s.normal51){const btn=document.createElement('button');btn.type='button';btn.dataset.act6QaNext='54';styleAction(btn);btn.textContent='거꾸로 선 처마로';appUI(app)?.append(btn);issue(app,btn,54);}\n        if(terminal?.stage===52&&s.normal51)");
  source=replaceOne(source,"        return e?.b?.honroStage===53&&e.active===u&&actions53.aim(app,e)", "        if(e?.b?.honroStage===54)return chart54Aim(app,e,u)&&!ids.includes('M09')&&ids.length<4?[...ids,'M09']:ids;\n        return e?.b?.honroStage===53&&e.active===u&&actions53.aim(app,e)");
  source=replaceOne(source,"        if(e?.b?.honroStage!==53||e.active!==u||app.selected!=='M09')", "        if(e?.b?.honroStage===54&&e.active===u&&app.selected==='M09'){const s=active.get(app);if(chart54Aim(app,e,u)){const q=s.owner54.relay(app,e,{angle:u.angle,power:app.power});if(!q.ok)app.notify(q.reason);app.updateHUD(true);}return true;}\n        if(e?.b?.honroStage!==53||e.active!==u||app.selected!=='M09')");
  source=replaceOne(source,'const stages=new Set([51,52,53,54])','const stages=new Set([51,52,53,54,55])');
  source=replaceOne(source,'        if(id===54)return eligible54(app,s);','        if(id===55)return eligible55(app,s);\n        if(id===54)return eligible54(app,s);');
  source=replaceOne(source,'const {packet,compiled,known,chart}=await prepareExact(id);','const {packet,compiled,known,chart,bell}=await prepareExact(id);');
  source=replaceOne(source,'permits.set(app,{ticket,id,packet,compiled,known,chart,owns});','permits.set(app,{ticket,id,packet,compiled,known,chart,bell,owns});');
  source=replaceOne(source,"      if(id===54){\n        check(packet.schema", "      if(id===55){\n        check(packet.schema==='honro-act6-normal-55-source/v1'&&packet.trace.stageId===55&&packet.map.id==='stage-55'&&packet.runtimeReleaseEnabled===false&&packet.trace.mapSHA256===pin.mapSHA256&&packet.trace.assetSHA256===pin.assetSHA256,'Invalid 55 packet authority');\n        const compiled=G.HonroMaps.compile(packet.map,{library:packet.library}),known=[];\n        for(const [v,h] of [[compiled.terrain,D55.shape.playSHA],[compiled.worldTerrain,D55.shape.worldSHA]]){const src=JSON.stringify(v);check(await sha(new TextEncoder().encode(src))===h,'Native 55 source mismatch');known.push([src,h]);}\n        return await prepareNormal55(packet,known,compiled);\n      }\n      if(id===54){\n        check(packet.schema");
  source=replaceOne(source,'        if(id===54&&active.get(app)?.normal51===true)','        if(id===55&&active.get(app)?.normal51===true)return enterNormal55(app,grant,active.get(app));\n        if(id===54&&active.get(app)?.normal51===true)');
  source=replaceOne(source,'        if(e.b.honroStage===54&&s.owner54)','        if(e.b.honroStage===55&&s.owner55)return bindNormal55(app,e,s);\n        if(e.b.honroStage===54&&s.owner54)');
  source=replaceOne(source,'function goalState(app,e){if(e?.b?.honroStage===54)','function goalState(app,e){if(e?.b?.honroStage===55)return active.get(app)?.owner55?.project(app,e);if(e?.b?.honroStage===54)');
  source=replaceOne(source,'        if(e.b.honroStage===54){chart54Input','        if(e.b.honroStage===55){bell55UI(app,s,e);return true;}\n        if(e.b.honroStage===54){chart54Input');
  source=replaceOne(source,'const terminal=s.b.honroStage===54?', 'const terminal=s.b.honroStage===55?s.owner55.terminal(app,s.engine):s.b.honroStage===54?');
  source=replaceOne(source,'        if(terminal?.stage===53&&s.normal51)',"        if(terminal?.stage===55&&s.normal51&&terminal.won===true&&terminal.settlement===false&&s.button)s.button.dataset.act6Normal55Receipt=JSON.stringify(terminal);\n        if(terminal?.stage===53&&s.normal51)");
  source=replaceOne(source,'        if(terminal?.stage===53&&s.normal51)',"        if(terminal?.stage===54&&s.normal51){const btn=document.createElement('button');btn.type='button';btn.dataset.act6QaNext='55';styleAction(btn);btn.textContent='빈 종터로 돌아간다';appUI(app)?.append(btn);issue(app,btn,55);}\n        if(terminal?.stage===53&&s.normal51)");
  source=replaceOne(source,'release,keepAction:', 'release,context53,release53,tick54,tick55,keepAction:');

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
  ['(id===51||id===52)&&!training?qa51.launch', '(id===51||id===52||id===53||id===54||id===55)&&!training?qa51.launch'],
  ["const combatSkills=u.meleeFollow==='ready'&&!u.loadout.includes('S00')?['S00',...u.loadout]:u.loadout;", "const combatSkills=qa51.context53(this,u,u.meleeFollow==='ready'&&!u.loadout.includes('S00')?['S00',...u.loadout]:u.loadout);"],
  ['G.HonroStakeCrossing.skills(this.engine.b,active).includes(remembered)','qa51.context53(this,active,G.HonroStakeCrossing.skills(this.engine.b,active)).includes(remembered)'],
  ['G.HonroStakeCrossing.skills(b,u).includes(this.selected)','qa51.context53(this,u,G.HonroStakeCrossing.skills(b,u)).includes(this.selected)'],
  ['}else this.engine.fire(this.selected, u.angle, this.power);','}else if(!qa51.release53(this,u))this.engine.fire(this.selected, u.angle, this.power);']);
 if(source.includes('function enterNormal54('))edits.push(['missionTick(dt){if(qa51.active(this))return;', 'missionTick(dt){if(qa51.active(this)){qa51.tick54(this);qa51.tick55(this);return;}']);
 return edits.reduce((code,[a,b])=>replaceOne(code,a,b),main);
}
