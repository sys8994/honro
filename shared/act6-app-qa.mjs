import {spliceEndingPresentation} from './act6-ending-replan/build.mjs';
import {layout57,layout58,layout60} from './act6-boundary/late-layouts.mjs';
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
export async function createAct6WebQa(project,repoRoot,env=process.env,release=null){
 if(release){
  const {readAct6Release}=await import('./act6-release-settings.mjs');
  assert.deepEqual(release,await readAct6Release(repoRoot),'Unapproved Act6 build route');
  assert.equal(env.HONRO_ACT6_QA_WEB_ROOT,release.checkout);
 }else await assertQaWebRoot(repoRoot,env);
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
 assert.equal(hash(first),'82bc8352ada6c06202186c467d236f9d858f4fff6698bff206f5f7a34d74ffb1');
 assert.equal(first.split('export function createFirstMissionOwner').length,2);
 if(env.HONRO_ACT6_QA_NORMAL51==='1'){
  const normal=await readFile(new URL('./runtime/stage51-entry.inc.js',import.meta.url),'utf8');
  const outsideEncounters=(await readFile(new URL('./act6-mumyeongsa/exterior-encounters.mjs',import.meta.url),'utf8')).replace(/^export /gm,'');
  const thresholdPrep=(await readFile(new URL('./runtime/act6-threshold-prep.mjs',import.meta.url),'utf8')).replace(/^export /gm,'');
  const prepUI=await readFile(new URL('./runtime/stage52-prep.inc.js',import.meta.url),'utf8');
  source=replaceOne(source,'      function enter(app,id,ticket){',outsideEncounters+'\n'+thresholdPrep+'\n'+prepUI+'\n'+normal+'\n      function enter(app,id,ticket){');
  source=replaceOne(source,'          e.checkEnd();app.updateHUD(true);',
    '          e.checkEnd();app.updateHUD(true);if(s.normal51)show52FieldDialogue(app,s,id);');
  source=replaceOne(source,'try{return enter(app,51,null);}finally{restGrants.delete(app);}', 'try{return enterNormal51(app,grant,carried);}finally{restGrants.delete(app);}');
  source=replaceOne(source,'        permits.delete(app);\n        const {packet,compiled,known}=grant','        permits.delete(app);\n        if(id===52&&active.get(app)?.normal51===true)return enterNormal52(app,grant,active.get(app));\n        const {packet,compiled,known}=grant');
  source=replaceOne(source,'terminal?.stage===51&&!s.ordinaryRest','terminal?.stage===51&&(!s.ordinaryRest||s.normal51===true)');
  source=replaceOne(source,"kind:'isolated-authored-engine',incoming:s.previous","kind:s.normal51?'normal-owned-release':'isolated-authored-engine',incoming:s.previous");
  source=replaceOne(source,"Object.defineProperty(e,'stage',{configurable:true,get:()=>rule});","if(!s.normal51)Object.defineProperty(e,'stage',{configurable:true,get:()=>rule});");
  source=replaceOne(source,'active:app=>active.has(app),bind','active:app=>active.has(app),isNormal:app=>active.get(app)?.normal51===true,tickExterior:(a,dt)=>active.get(a)?.exterior?.tick(dt),bind');
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
  const hallSource53=await readFile(new URL('./act6-mumyeongsa/stage53.mjs',import.meta.url),'utf8');
  const railCode=await readFile(new URL('./act6-mumyeongsa/broken-rail.mjs',import.meta.url),'utf8');
  const eaveCode=await readFile(new URL('./act6-mumyeongsa/torn-eave.mjs',import.meta.url),'utf8');
  const railSource=await readFile(new URL('./act6-b-slice/layout.json',import.meta.url),'utf8');
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
  const owner54=(await readFile(new URL('./runtime/stage54-pilot-owner.mjs',import.meta.url),'utf8')).split('\n').slice(1).join('\n').replaceAll('export ','');
  const mount54=await readFile(new URL('./runtime/stage54-entry.inc.js',import.meta.url),'utf8');
  const galleryCode54=await readFile(new URL('./act6-mumyeongsa/stage54.mjs',import.meta.url),'utf8');
  const relaySill54=fourth.charts.L.terrain.find(t=>t.id==='mid-contact');
  assert(relaySill54?.vertices.length);
  const code54='const {createStage54ChartOwner,verifyStage54Relay}=(()=>{'+charts54+owner54+'\nreturn {createStage54ChartOwner,verifyStage54Relay};})();\n'+
   'const relaySill54='+JSON.stringify(relaySill54)+';\nconst {composeGallery54,observatory54}=(()=>{'+galleryCode54.replaceAll('export ','')+'\nreturn {composeGallery54,observatory54};})();\n'+mount54;
  const fifthRaw=await readFile(new URL('./data/act6-qa/fifth.json',import.meta.url));
  assert.equal(hash(fifthRaw),'3ae91543525a09093da52ee1dd2bff8ab8324a7e7858996c363afdd10e066b8f');
  const fifth=JSON.parse(fifthRaw);assert(fifth.id===55&&fifth.authoredId==='stage-55'&&fifth.runtimeReleaseEnabled===false&&fifth.map.units.length===0);
  packets.push({...fifth,schema:'honro-act6-normal-55-source/v1',trace:{stageId:55,authoredId:'stage-55',mapSHA256:hash(JSON.stringify(fifth.map)),assetSHA256:hash(JSON.stringify(fifth.library))}});
  const owner55=await readFile(new URL('./runtime/stage55-pilot-owner.mjs',import.meta.url),'utf8');
  const mount55=await readFile(new URL('./runtime/stage55-entry.inc.js',import.meta.url),'utf8');
  const sodan=await readFile(new URL('./act6-mumyeongsa/sodan-thread.mjs',import.meta.url),'utf8');
  const code55=sodan.replaceAll('export ','')+'\nconst {createNormalBellOwner,D55}=(()=>{'+owner55.replaceAll('export ','')+'\nreturn {createNormalBellOwner:createStage55EmptyBell,D55:STAGE55};})();\n'+mount55;
  const bindRail='const {createBrokenRail,validBrokenRailCrossing,installBrokenRail}=(()=>{'+railCode.replaceAll('export ','')+'\nreturn {createBrokenRail,validBrokenRailCrossing,installBrokenRail};})();\nconst brokenRail=createBrokenRail('+railSource+');\n';
  const eaveExports='tornEave,validTornEave,composeTornEave,swapTornEave,installTornEave';
  const bindEave='const {'+eaveExports+'}=(()=>{'+eaveCode.replaceAll('export ','')+'\nreturn {'+eaveExports+'};})();\n';
  const rock53=JSON.parse(await readFile(new URL('./act6-mumyeongsa/art/stage53-bedrock.json',import.meta.url),'utf8'));
  assert.equal(rock53.id,'m53-grey-bedrock');assert.equal(rock53.collision.length,0);assert.equal(rock53.vector.version,1);
  const bind53=bindRail+bindEave+'const bedrock53='+JSON.stringify(rock53)+';\nconst createInnerMissionOwner=(()=>{'+mission53.replace('export function','function')+'\nreturn createInnerMissionOwner;})();\n'+
    'const createStage53PhysicalActions=(()=>{'+actions53.replace('export function','function')+'\nreturn createStage53PhysicalActions;})();\n'+
    'const {hall53,composeHall53}=(()=>{'+hallSource53.replaceAll('export ','')+'\nreturn {hall53,composeHall53};})();\n'+b53+code54+code55;
  source=replaceOne(source,'      function enter(app,id,ticket){',bind53+'\n      function enter(app,id,ticket){');
  source=replaceOne(source,'const stages=new Set([51,52])','const stages=new Set([51,52,53])');
  source=replaceOne(source,"        return app.screen==='battle'&&!!s&&s.b.honroStage===51", "        if(id===53)return app.screen==='battle'&&s?.normal51&&s.b.honroStage===52&&app.engine===s.engine&&s.b.phase==='won'&&app.done&&s.terminal?.stage===52&&s.terminal.flags['act6.outerSitesPrepared']===true&&s.terminal.flags['act6.darmheoInTemple']===true;\n        return app.screen==='battle'&&!!s&&s.b.honroStage===51");
  source=replaceOne(source,"      check(packet.schema==='honro-act6-app-owner-integrated-packet-r1'", "      if(id===53){\n        check(packet.schema==='honro-act6-normal-53-source/v1'&&packet.trace.stageId===53&&packet.map.id===packet.trace.authoredId&&packet.trace.mapSHA256===pin.mapSHA256&&packet.trace.assetSHA256===pin.assetSHA256&&packet.mission.id===53&&packet.mission.allowCanonical===false,'Unexpected archived 53 origin');\n        const compiled=G.HonroMaps.compile(packet.map,{library:packet.library}),known=[];\n        for(const [k,v] of [['playSHA',compiled.terrain],['worldSHA',compiled.worldTerrain]]){const x=JSON.stringify(v),h=await sha(new TextEncoder().encode(x));check(h===packet.mission[k],'Invalid 53 physical owner');known.push([x,h]);}\n        await prepareHall53(packet);\n        return {packet,compiled,known};\n      }\n      check(packet.schema==='honro-act6-app-owner-integrated-packet-r1'");
  source=replaceOne(source,'        if(id===52&&active.get(app)?.normal51===true)', '        if(id===53&&active.get(app)?.normal51===true)return enterNormal53(app,grant,active.get(app));\n        if(id===52&&active.get(app)?.normal51===true)');
  source=replaceOne(source,'        const source=Object.freeze({kind:s.normal51?', "        if(e.b.honroStage===53&&s.kind==='normal-53-private')return bindNormal53(app,e,s);\n        const source=Object.freeze({kind:s.normal51?");
  source=replaceOne(source,'function goalState(app,e){return owner.project(app,e);}', 'function goalState(app,e){return e?.b?.honroStage===53?indoor53.project(app,e):owner.project(app,e);}');
  source=replaceOne(source,'        const id=owner.project(app,e)?.targets?.[0]?.id;', "        if(e.b.honroStage===53){const a=actions53.usePassage(app,e);if(a.ok&&s.button)s.button.disabled=true;else if(!a.ok)app.notify(a.reason);e.checkEnd();app.updateHUD(true);return true;}\n        const id=owner.project(app,e)?.targets?.[0]?.id;");
  source=replaceOne(source,'        const terminal=owner.terminal(app,s.engine);','        const terminal=s.b.honroStage===53?terminalB53(app,s):owner.terminal(app,s.engine);');
  source=replaceOne(source,'        app.notify(terminal?', "        if(terminal?.stage===52&&s.normal51){const btn=document.createElement('button');btn.type='button';btn.dataset.act6QaNext='53';styleAction(btn);btn.textContent='담허가 문지방을 넘는다';appUI(app)?.append(btn);issue(app,btn,53);}\n        app.notify(terminal?");
  source=replaceOne(source,'const {packet,compiled,known}=await prepareExact(id);','const {packet,compiled,known,chart}=await prepareExact(id);');
  source=replaceOne(source,'permits.set(app,{ticket,id,packet,compiled,known,owns});','permits.set(app,{ticket,id,packet,compiled,known,chart,owns});');
  source=replaceOne(source,'const stages=new Set([51,52,53])','const stages=new Set([51,52,53,54])');
  source=replaceOne(source,"        if(id===53)return app.screen", "        if(id===54)return eligible54(app,s);\n        if(id===53)return app.screen");
  source=replaceOne(source,"      if(id===53){\n        check(packet.schema", "      if(id===54){\n        check(packet.schema==='honro-act6-normal-54-source/v1'&&packet.trace.stageId===54&&packet.map.id==='stage-54'&&packet.runtimeReleaseEnabled===false&&packet.trace.mapSHA256===pin.mapSHA256&&packet.trace.assetSHA256===pin.assetSHA256,'Invalid 54 packet authority');\n        const compiled=G.HonroMaps.compile(packet.map,{library:packet.library}),known=[];\n        for(const [v,pin] of [[compiled.terrain,packet.charts.N.terrain],[compiled.worldTerrain,packet.charts.N.world]]){const src=JSON.stringify(v),hash=await sha(new TextEncoder().encode(src));check(src===JSON.stringify(pin),'Invalid 54 chart projection');known.push([src,hash]);}\n        return await prepareNormal54(packet,known);\n      }\n      if(id===53){\n        check(packet.schema");
  source=replaceOne(source,'        if(id===53&&active.get(app)?.normal51===true)','        if(id===54&&active.get(app)?.normal51===true)return enterNormal54(app,grant,active.get(app));\n        if(id===53&&active.get(app)?.normal51===true)');
  source=replaceOne(source,"        if(e.b.honroStage===53&&s.kind", "        if(e.b.honroStage===54&&s.owner54)return bindNormal54(app,e,s);\n        if(e.b.honroStage===53&&s.kind");
  source=replaceOne(source,'function goalState(app,e){return e?.b?.honroStage===53?', 'function goalState(app,e){if(e?.b?.honroStage===54)return projectNormal54(app,e,active.get(app));return e?.b?.honroStage===53?');
  source=replaceOne(source,'        if(e.b.honroStage===53){const a=actions53', '        if(e.b.honroStage===54){chart54Input(app,s,e);return true;}\n        if(e.b.honroStage===53){const a=actions53');
  source=replaceOne(source,'const terminal=s.b.honroStage===53?', 'const terminal=s.b.honroStage===54?terminalNormal54(app,s):s.b.honroStage===53?');
  source=replaceOne(source,'        if(terminal?.stage===52&&s.normal51)', "        if(terminal?.stage===53&&s.normal51){const btn=document.createElement('button');btn.type='button';btn.dataset.act6QaNext='54';styleAction(btn);btn.textContent='문턱에서 계속';appUI(app)?.append(btn);issue(app,btn,54);if(terminal.bridge)queueMicrotask(()=>advance(app,btn,54));}\n        if(terminal?.stage===52&&s.normal51)");
  source=replaceOne(source,"        return e?.b?.honroStage===53&&e.active===u&&actions53.aim(app,e)", "        if(e?.b?.honroStage===54)return contextualStakeIds(app,e,ids,chart54Aim(app,e,u));\n        return e?.b?.honroStage===53&&e.active===u&&actions53.aim(app,e)");
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
  source=replaceOne(source,'const terminal=s.b.honroStage===54?', 'const terminal=s.b.honroStage===55?terminalNormal55(app,s):s.b.honroStage===54?');
  source=replaceOne(source,'        if(terminal?.stage===53&&s.normal51)',"        if(terminal?.stage===54&&s.normal51){const btn=document.createElement('button');btn.type='button';btn.dataset.act6QaNext='55';styleAction(btn);btn.textContent='빈 종터로 돌아간다';appUI(app)?.append(btn);issue(app,btn,55);}\n        if(terminal?.stage===53&&s.normal51)");
  source=replaceOne(source,'release,keepAction:', 'release,context53,release53,tick54,tick55,keepAction:');

  const sixthRaw=await readFile(new URL('./data/act6-qa/sixth.json',import.meta.url));
  assert.equal(hash(sixthRaw),'73e6de40351e90fc7014ea471cf7739b9444c3e67b5edb80d89f895dc5ae9d61');
  const sixth=JSON.parse(sixthRaw);
  assert(sixth.id===56&&sixth.authoredId==='qa-act6-06'&&sixth.runtimeReleaseEnabled===false&&sixth.map.units.length===0);
  packets.push({...sixth,schema:'honro-act6-normal-56-source/v1',trace:{stageId:56,authoredId:sixth.authoredId,mapSHA256:hash(JSON.stringify(sixth.map)),assetSHA256:hash(JSON.stringify(sixth.library))}});
  const code56=await Promise.all(['normal-scope','stage56-owner','stage56-presentation','stage56-adapter'].map(q=>readFile(new URL('./runtime/'+q+'.mjs',import.meta.url),'utf8')));
  const mod=(src,exports)=>'(()=>{'+src.replace(/^import .*?;\n/gm,'').replace(/^export /gm,'')+'\nreturn {'+exports+'};})();\n';
  source=replaceOne(source,'      const declared53=','      const {createNormalWarmPort,native56Handoff,inNormalStage}='+mod(code56[0],'createNormalWarmPort,native56Handoff,inNormalStage')+'const {createStage56Owner,owner56}='+mod(code56[1],'createStage56Owner,owner56')+'const {stage56Display}='+mod(code56[2],'stage56Display')+'const {stage56Adapter}='+mod(code56[3].replace('owner56 as D','owner56'),'stage56Adapter').replace('const C=G.HONRO_CORE','const D=owner56,C=G.HONRO_CORE')+(await readFile(new URL('./runtime/stage56-entry.inc.js',import.meta.url),'utf8'))+'\n      const declared53=');
  source=replaceOne(source,'const stages=new Set([51,52,53,54,55])','const stages=new Set([51,52,53,54,55,56])');
  source=replaceOne(source,'        if(id===55)return eligible55(app,s);','        if(id===56)return eligible56(app,s);\n        if(id===55)return eligible55(app,s);');
  source=replaceOne(source,"      if(id===55){\n        check(packet.schema", "      if(id===56){\n        check(packet.schema==='honro-act6-normal-56-source/v1'&&packet.trace.stageId===56&&packet.map.id===owner56.authoredId&&packet.authoredId===owner56.authoredId&&packet.runtimeReleaseEnabled===false&&packet.trace.mapSHA256===pin.mapSHA256&&packet.trace.assetSHA256===pin.assetSHA256,'Invalid 56 packet authority');\n        const compiled=G.HonroMaps.compile(packet.map,{library:packet.library}),known=[];\n        for(const [v,h] of [[compiled.terrain,owner56.playSHA],[compiled.worldTerrain,owner56.worldSHA]]){const src=JSON.stringify(v);check(await sha(new TextEncoder().encode(src))===h,'Native 56 source mismatch');known.push([src,h]);}\n        signed56.set(packet,compiled);return {packet,compiled,known};\n      }\n      if(id===55){\n        check(packet.schema");
  source=replaceOne(source,"            check(app.launch(id,false,null,ticket)===true", "            check(await app.launch(id,false,null,ticket)===true");
  source=replaceOne(source,'        if(id===55&&active.get(app)?.normal51===true)','        if(id===56&&active.get(app)?.normal51===true)return enterNormal56(app,grant,active.get(app));\n        if(id===55&&active.get(app)?.normal51===true)');
  source=replaceOne(source,'        if(e.b.honroStage===55&&s.owner55)','        if(e.b.honroStage===56&&s.prepared56)return bindNormal56(app,e,s);\n        if(e.b.honroStage===55&&s.owner55)');
  source=replaceOne(source,'function goalState(app,e){if(e?.b?.honroStage===55)','function goalState(app,e){if(e?.b?.honroStage===56)return projectNormal56(app,e,active.get(app));if(e?.b?.honroStage===55)');
  source=replaceOne(source,'        if(e.b.honroStage===55){bell55UI','        if(e.b.honroStage===56){stage56UI(app,s,e);return true;}\n        if(e.b.honroStage===55){bell55UI');
  source=replaceOne(source,'const terminal=s.b.honroStage===55?', 'const terminal=s.b.honroStage===56?terminalNormal56(app,s):s.b.honroStage===55?');
  source=replaceOne(source,'        if(terminal?.stage===53&&s.normal51)',"        if(terminal?.stage===55&&s.normal51){const btn=document.createElement('button');btn.type='button';btn.dataset.act6QaNext='56';styleAction(btn);btn.textContent='깊은 경계로 들어간다';appUI(app)?.append(btn);issue(app,btn,56); }\n        if(terminal?.stage===53&&s.normal51)");
  source=replaceOne(source,'release,context53,release53,tick54,tick55,keepAction:', 'release,context53,release53,tick54,tick55,tick56,keepAction:');

  const seventhRaw=await readFile(new URL('./data/act6-qa/seventh.json',import.meta.url));
  assert.equal(hash(seventhRaw),'005b77bedf9a6034cb92faa8fc816c5df06fc78b23b295379eab1a00d087dfe4');
  const seventh=JSON.parse(seventhRaw);
  assert(seventh.id===57&&seventh.authoredId==='a6-local-playable-07'&&seventh.runtimeReleaseEnabled===false&&seventh.map.units.length===0);
  packets.push({...seventh,schema:'honro-act6-normal-57-source/v1',trace:{stageId:57,authoredId:seventh.authoredId,mapSHA256:hash(JSON.stringify(seventh.map)),assetSHA256:hash(JSON.stringify(seventh.library))}});
  const code57=await Promise.all(['bridge','owner','emergency','mission','adapter'].map(q=>readFile(new URL('./runtime/stage57-'+q+'.mjs',import.meta.url),'utf8')));
  const hallCode=await readFile(new URL('./act6-mumyeongsa/hall-b.mjs',import.meta.url),'utf8');
  const hallExports='hallSill,hallSillArt,installHallArt,hallLead57,hallB58,installHallAxes,mountHallD56,verifyHallD56,legacyHallExit56';
  const returnCode=await readFile(new URL('./act6-mumyeongsa/return-gate.mjs',import.meta.url),'utf8');
  const returnExports='returnGateArt,verifyReturnGate,watchReturnGate,mountReturnGate';
  const wrap57=(name,i)=>'const {'+name+'}='+mod(code57[i],name);
  source=replaceOne(source,'      const declared53=',
    'const {'+hallExports+'}='+mod(hallCode,hallExports)+'const {'+returnExports+'}='+mod(returnCode,returnExports)+['bindOwnedBridge','createStage57Owner','mountEmergency57','createStage57Mission','stage57Adapter'].map(wrap57).join('')+
    'const descriptor57=Object.freeze('+JSON.stringify(layout57)+');\n'+
    (await readFile(new URL('./runtime/stage57-entry.inc.js',import.meta.url),'utf8'))+'\n      const declared53=');
  source=replaceOne(source,'const stages=new Set([51,52,53,54,55,56])','const stages=new Set([51,52,53,54,55,56,57])');
  source=replaceOne(source,'        if(id===56)return eligible56(app,s);','        if(id===57)return eligible57(app,s);\n        if(id===56)return eligible56(app,s);');
  source=replaceOne(source,"      if(id===56){\n        check(packet.schema", "      if(id===57){\n        check(packet.schema==='honro-act6-normal-57-source/v1'&&packet.trace.stageId===57&&packet.map.id===descriptor57.authoredId&&packet.authoredId===descriptor57.authoredId&&packet.runtimeReleaseEnabled===false&&packet.trace.mapSHA256===pin.mapSHA256&&packet.trace.assetSHA256===pin.assetSHA256,'Invalid 57 packet authority');\n        const compiled=G.HonroMaps.compile(packet.map,{library:packet.library}),known=[];\n        for(const [v,h] of [[compiled.terrain,descriptor57.playSHA],[compiled.worldTerrain,descriptor57.worldSHA]]){const src=JSON.stringify(v);check(await sha(new TextEncoder().encode(src))===h,'Native 57 source mismatch');known.push([src,h]);}\n        signed57.set(packet,compiled);return {packet,compiled,known};\n      }\n      if(id===56){\n        check(packet.schema");
  source=replaceOne(source,'        if(id===56&&active.get(app)?.normal51===true)','        if(id===57&&active.get(app)?.normal51===true)return enterNormal57(app,grant,active.get(app));\n        if(id===56&&active.get(app)?.normal51===true)');
  source=replaceOne(source,'        if(e.b.honroStage===56&&s.prepared56)','        if(e.b.honroStage===57&&s.prepared57)return bindNormal57(app,e,s);\n        if(e.b.honroStage===56&&s.prepared56)');
  source=replaceOne(source,'function goalState(app,e){if(e?.b?.honroStage===56)','function goalState(app,e){if(e?.b?.honroStage===57)return active.get(app)?.owner57?.project();if(e?.b?.honroStage===56)');
  source=replaceOne(source,'        if(e.b.honroStage===56){stage56UI','        if(e.b.honroStage===57){stage57UI(app,s,e);return true;}\n        if(e.b.honroStage===56){stage56UI');
  source=replaceOne(source,'const terminal=s.b.honroStage===56?', 'const terminal=s.b.honroStage===57?terminalNormal57(app,s):s.b.honroStage===56?');
  const normalOutcome='        app.done=true;app.cancelInput();';
  source=replaceOne(source,normalOutcome,normalOutcome+'\n        if(s.b.honroStage===57&&presentNormal57Loss(app,s))return true;');
  source=replaceOne(source,'        if(terminal?.stage===55&&s.normal51)',"        if(terminal?.stage===56&&s.normal51){const btn=document.createElement('button');btn.type='button';btn.dataset.act6QaNext='57';styleAction(btn);btn.textContent='무너지는 세 자리로';appUI(app)?.append(btn);issue(app,btn,57); }\n        if(terminal?.stage===55&&s.normal51)");
  source=replaceOne(source,'release,context53,release53,tick54,tick55,tick56,keepAction:', 'release,context53,release53,tick54,tick55,tick56,tick57,keepAction:');

  const eighthRaw=await readFile(new URL('./data/act6-qa/eighth.json',import.meta.url));
  assert.equal(hash(eighthRaw),'5379e10b5e5490036308ab4e9c8d552f360359365f83106c6e52a57385114297');
  const eighth=JSON.parse(eighthRaw);
  assert(eighth.id===58&&eighth.map.units.length===0&&eighth.roles.length===8);
  packets.push({...eighth,schema:'honro-act6-normal-58-source/v1',trace:{stageId:58,authoredId:eighth.map.id,mapSHA256:hash(JSON.stringify(eighth.map)),assetSHA256:hash(JSON.stringify(eighth.library))}});
  const core58=await readFile(new URL('./runtime/stage58-owner.mjs',import.meta.url),'utf8');
  const normal58=await readFile(new URL('./runtime/stage58-normal-adapter.mjs',import.meta.url),'utf8');
  const slice57=seventh.bridge.additions.terrain.find(t=>t.id==='local-07-08-exact-receiving-slice');
  assert(slice57?.vertices.length);
  source=replaceOne(source,'      const declared53=','const capturedHallSlice='+JSON.stringify(slice57)+';\nconst {createStage58Owner}='+mod(core58,'createStage58Owner')+'const {stage58Adapter}='+mod(normal58,'stage58Adapter')+
    'const descriptor58=Object.freeze('+JSON.stringify(layout58)+');\n'+
    (await readFile(new URL('./runtime/stage58-normal-entry.inc.js',import.meta.url),'utf8'))+'\n      const declared53=');
  source=replaceOne(source,'const stages=new Set([51,52,53,54,55,56,57])','const stages=new Set([51,52,53,54,55,56,57,58])');
  source=replaceOne(source,'        if(id===57)return eligible57(app,s);','        if(id===58)return eligible58(app,s);\n        if(id===57)return eligible57(app,s);');
  source=replaceOne(source,"      if(id===57){\n        check(packet.schema", "      if(id===58){\n        check(packet.schema==='honro-act6-normal-58-source/v1'&&packet.trace.stageId===58&&packet.map.id===packet.trace.authoredId&&packet.trace.mapSHA256===pin.mapSHA256&&packet.trace.assetSHA256===pin.assetSHA256,'Invalid 58 packet authority');\n        const compiled=G.HonroMaps.compile(packet.map,{library:packet.library}),known=[];\n        for(const [v,h] of [[compiled.terrain,descriptor58.playSHA],[compiled.worldTerrain,descriptor58.worldSHA]]){const src=JSON.stringify(v);check(await sha(new TextEncoder().encode(src))===h,'Native 58 source mismatch');known.push([src,h]);}\n        signed58.set(packet,compiled);return {packet,compiled,known};\n      }\n      if(id===57){\n        check(packet.schema");
  source=replaceOne(source,'        if(id===57&&active.get(app)?.normal51===true)','        if(id===58&&active.get(app)?.normal51===true)return enterNormal58(app,grant,active.get(app));\n        if(id===57&&active.get(app)?.normal51===true)');
  source=replaceOne(source,'        if(e.b.honroStage===57&&s.prepared57)','        if(e.b.honroStage===58&&s.prepared58)return bindNormal58(app,e,s);\n        if(e.b.honroStage===57&&s.prepared57)');
  source=replaceOne(source,'function goalState(app,e){if(e?.b?.honroStage===57)','function goalState(app,e){if(e?.b?.honroStage===58)return active.get(app)?.owner58?.project();if(e?.b?.honroStage===57)');
  source=replaceOne(source,'        if(e.b.honroStage===57){stage57UI','        if(e.b.honroStage===58){stage58UI(app,s,e);return true;}\n        if(e.b.honroStage===57){stage57UI');
  source=replaceOne(source,'const terminal=s.b.honroStage===57?', 'const terminal=s.b.honroStage===58?terminalNormal58(app,s):s.b.honroStage===57?');
  source=replaceOne(source,'        if(terminal?.stage===56&&s.normal51)',"        if(terminal?.stage===57&&s.normal51){const btn=document.createElement('button');btn.type='button';btn.dataset.act6QaNext='58';styleAction(btn);btn.textContent='네 사람과 마지막 문턱을 넘는다';appUI(app)?.append(btn);issue(app,btn,58);offerPrep58(app,s); }\n        if(terminal?.stage===56&&s.normal51)");
  source=replaceOne(source,'release,context53,release53,tick54,tick55,tick56,tick57,keepAction:', 'release,context53,release53,tick54,tick55,tick56,tick57,tick58,keepAction:');

  const ninthRaw=await readFile(new URL('./data/act6-qa/ninth.json',import.meta.url));
  assert.equal(hash(ninthRaw),'dd829cb01460592a296b5f8127825260036386a437206928e21cb928cdb8d333');
  const ninth=JSON.parse(ninthRaw);
  assert(ninth.id===59&&ninth.map.id==='stage-59'&&ninth.map.units.length===0);
  packets.push({...ninth,schema:'honro-act6-normal-59-source/v1',trace:{stageId:59,authoredId:ninth.map.id,mapSHA256:hash(JSON.stringify(ninth.map)),assetSHA256:hash(JSON.stringify(ninth.library))}});
  const code59=await Promise.all(['native-bind','strip','wave','role-paint','stage59-owner','stage59-adapter'].map(q=>readFile(new URL('./runtime/'+q+'.mjs',import.meta.url),'utf8')));
  const gen59=(names,i)=>'const {'+names+'}='+mod(i===5?code59[i].replace(/^const crew=/m,'const D=D59;const crew='):code59[i],i===4?'createStage59Owner,D59:STAGE59':names);
  source=replaceOne(source,'      const declared53=',
    ['mountNativeObservation,nativeFacts','buildStrip,contacts','due,commit','createStage59RolePaint','createStage59Owner,D59','stage59Adapter'].map(gen59).join('')+
    (await readFile(new URL('./runtime/stage59-normal-entry.inc.js',import.meta.url),'utf8'))+'\n      const declared53=');
  source=replaceOne(source,'const stages=new Set([51,52,53,54,55,56,57,58])','const stages=new Set([51,52,53,54,55,56,57,58,59])');
  source=replaceOne(source,'        if(id===58)return eligible58(app,s);','        if(id===59)return eligible59(app,s);\n        if(id===58)return eligible58(app,s);');
  source=replaceOne(source,"      if(id===58){\n        check(packet.schema", "      if(id===59){\n        check(packet.schema==='honro-act6-normal-59-source/v1'&&packet.trace.stageId===59&&packet.map.id===D59.authoredId&&packet.trace.mapSHA256===pin.mapSHA256&&packet.trace.assetSHA256===pin.assetSHA256,'Invalid 59 packet authority');\n        const compiled=G.HonroMaps.compile(packet.map,{library:packet.library}),known=[];\n        for(const [v,h] of [[compiled.terrain,D59.playSHA],[compiled.worldTerrain,D59.worldSHA]]){const src=JSON.stringify(v);check(await sha(new TextEncoder().encode(src))===h,'Native 59 source mismatch');known.push([src,h]);}\n        signed59.set(packet,compiled);return {packet,compiled,known};\n      }\n      if(id===58){\n        check(packet.schema");
  source=replaceOne(source,'        if(id===58&&active.get(app)?.normal51===true)','        if(id===59&&active.get(app)?.normal51===true)return enterNormal59(app,grant,active.get(app));\n        if(id===58&&active.get(app)?.normal51===true)');
  source=replaceOne(source,'        if(e.b.honroStage===58&&s.prepared58)','        if(e.b.honroStage===59&&s.prepared59)return bindNormal59(app,e,s);\n        if(e.b.honroStage===58&&s.prepared58)');
  source=replaceOne(source,'function goalState(app,e){if(e?.b?.honroStage===58)','function goalState(app,e){if(e?.b?.honroStage===59)return active.get(app)?.owner59?.project();if(e?.b?.honroStage===58)');
  source=replaceOne(source,'        if(e.b.honroStage===58){stage58UI','        if(e.b.honroStage===59){stage59UI(app,s,e);return true;}\n        if(e.b.honroStage===58){stage58UI');
  source=replaceOne(source,'const terminal=s.b.honroStage===58?', 'const terminal=s.b.honroStage===59?terminalNormal59(app,s):s.b.honroStage===58?');
  source=replaceOne(source,'        if(terminal?.stage===57&&s.normal51)',"        if(terminal?.stage===58&&s.normal51){const btn=document.createElement('button');btn.type='button';btn.dataset.act6QaNext='59';styleAction(btn);btn.textContent='마지막 마당으로 돌아간다';appUI(app)?.append(btn);issue(app,btn,59); }\n        if(terminal?.stage===57&&s.normal51)");
  source=replaceOne(source,'release,context53,release53,tick54,tick55,tick56,tick57,tick58,keepAction:', 'release,context53,release53,tick54,tick55,tick56,tick57,tick58,tick59,keepAction:');

  const tenthRaw=await readFile(new URL('./data/act6-qa/tenth.json',import.meta.url));
  assert.equal(hash(tenthRaw),'1ed264e9415a2757852c7e7274ffdf94696e5fa89ff2b258871773bf920d52e1');
  const registry=await readFile(new URL('./data/act6-qa/tenth-guard.json',import.meta.url));
  assert.equal(hash(registry),'b607ed8b4a7760bfcebf70100effb6d1efc36da04e99513b52e4b052abc7d989');
  const tenth=JSON.parse(tenthRaw),guardRegistry=JSON.parse(registry).cast;
  assert(tenth.id===60&&tenth.map.id==='a6-10-playable-draft-noncampaign'&&tenth.map.units.length===0&&Object.keys(guardRegistry).length===3);
  packets.push({...tenth,guardRegistry,schema:'honro-act6-normal-60-source/v1',trace:{stageId:60,authoredId:tenth.map.id,mapSHA256:hash(JSON.stringify(tenth.map)),assetSHA256:hash(JSON.stringify(tenth.library))}});
  const code60=await Promise.all(['ending','card','owner'].map(q=>readFile(new URL('./runtime/stage60-'+q+'.mjs',import.meta.url),'utf8')));
  const prep=replaceOne(code60[0]," assert(typeof grounded==='function');"," if(typeof grounded!=='function')throw TypeError('native grounded check required');");
  const endingStock=env.HONRO_ACT6_QA_NORMAL_ENDING_STOCK==='1';
  const finalEndingSource=endingStock?await (await import('./act6-normal-ending-qa/emit.mjs')).normal60EndingSource():'';
  source=replaceOne(source,'      const declared53=',
    (endingStock?'const normal60Stock=true;\n'+finalEndingSource:'')+'const {prepareEnding}='+mod(prep,'prepareEnding')+'const {endingCardFor}='+mod(code60[1],'endingCardFor')+'const {createStage60Owner}='+mod(code60[2],'createStage60Owner')+
    'const D60=Object.freeze('+JSON.stringify(layout60)+');\n'+
    (await readFile(new URL(endingStock?'./act6-normal-ending-qa/stage60-entry-stock.inc.js':'./runtime/stage60-normal-entry.inc.js',import.meta.url),'utf8'))+'\n      const declared53=');
  source=replaceOne(source,'const stages=new Set([51,52,53,54,55,56,57,58,59])','const stages=new Set([51,52,53,54,55,56,57,58,59,60])');
  source=replaceOne(source,'        if(id===59)return eligible59(app,s);','        if(id===60)return eligible60(app,s);\n        if(id===59)return eligible59(app,s);');
  source=replaceOne(source,"      if(id===59){\n        check(packet.schema", "      if(id===60){\n        check(packet.schema==='honro-act6-normal-60-source/v1'&&packet.trace.stageId===60&&packet.map.id===D60.authoredId&&packet.trace.mapSHA256===pin.mapSHA256&&packet.trace.assetSHA256===pin.assetSHA256,'Invalid 60 packet authority');\n        const compiled=G.HonroMaps.compile(packet.map,{library:packet.library}),known=[];\n        for(const [v,h] of [[compiled.terrain,D60.playSHA],[compiled.worldTerrain,D60.worldSHA]]){const src=JSON.stringify(v);check(await sha(new TextEncoder().encode(src))===h,'Native 60 source mismatch');known.push([src,h]);}\n        signed60.set(packet,compiled);return {packet,compiled,known};\n      }\n      if(id===59){\n        check(packet.schema");
  source=replaceOne(source,'        if(id===59&&active.get(app)?.normal51===true)','        if(id===60&&active.get(app)?.normal51===true)return enterNormal60(app,grant,active.get(app));\n        if(id===59&&active.get(app)?.normal51===true)');
  source=replaceOne(source,'        if(e.b.honroStage===59&&s.prepared59)','        if(e.b.honroStage===60&&s.quiet60)return bindNormal60(app,e,s);\n        if(e.b.honroStage===59&&s.prepared59)');
  source=replaceOne(source,'function goalState(app,e){if(e?.b?.honroStage===59)','function goalState(app,e){if(e?.b?.honroStage===60)return goal60(app,e);if(e?.b?.honroStage===59)');
  source=replaceOne(source,'        if(e.b.honroStage===59){stage59UI','        if(e.b.honroStage===60){stage60UI(app,s,e);return true;}\n        if(e.b.honroStage===59){stage59UI');
  source=replaceOne(source,'const terminal=s.b.honroStage===59?', 'const terminal=s.b.honroStage===60?terminalNormal60(app,s):s.b.honroStage===59?');
  source=replaceOne(source,'        app.done=true;app.cancelInput();',"        app.done=true;app.cancelInput();\n        if(s.b.honroStage===59&&s.b.phase==='lost')offerRetry59(app,s);");
  if(endingStock){
    const endingOutcome='        app.done=true;app.cancelInput();';
    source=replaceOne(source,endingOutcome,endingOutcome+'\n        if(terminal?.stage===60&&s.normal51)mountEndingNormal60(app,s,terminal);');
    const endingRelease='function release(app){const s=active.get(app);if(!s)return;';
    source=replaceOne(source,endingRelease,endingRelease+'s.closeEnding60?.();');
  }
  source=replaceOne(source,'        if(terminal?.stage===58&&s.normal51)',"        if(terminal?.stage===59&&s.normal51){const btn=document.createElement('button');btn.type='button';btn.dataset.act6QaNext='60';styleAction(btn);btn.textContent='마지막 두 혼과 산문으로';appUI(app)?.append(btn);issue(app,btn,60); }\n        if(terminal?.stage===58&&s.normal51)");
  source=replaceOne(source,'release,context53,release53,tick54,tick55,tick56,tick57,tick58,tick59,keepAction:', 'release,context53,release53,tick54,tick55,tick56,tick57,tick58,tick59,tick60,keepAction:');

 }
 if(env.HONRO_ACT6_QA_NORMAL51==='1'&&env.HONRO_ACT6_QA_NORMAL_FAR==='1'){
  const farRaw=await readFile(new URL('./act6-late-qa/early-far.mjs',import.meta.url),'utf8');
  let farHost=await readFile(new URL('./act6-late-qa/normal-far.inc.js',import.meta.url),'utf8');
  if(env.HONRO_ACT6_QA_NORMAL_FINAL_FAR==='1'){
    const far60=await readFile(new URL('./act6-late-qa/far60.mjs',import.meta.url),'utf8');
    const host60=await readFile(new URL('./act6-late-qa/normal-final-far.inc.js',import.meta.url),'utf8');
    farHost+='\nconst {createPlayableFar60}=(()=>{'+far60.replace('export function createPlayableFar60','function createPlayableFar60')+
      '\nreturn {createPlayableFar60};})();\n'+host60;
    farHost=replaceOne(farHost,'if(!normalFar||id<51||id>57','if(id===60&&scene&&s?.normal51&&s.engine===e&&s.b===b){mountNormalFinalFar(app,e,s);return;}\n        if(!normalFar||id<51||id>57');
    farHost=replaceOne(farHost,'if(!s?.normalFar||!e)return;','s?.normalFinalFar?.dispose();if(!s?.normalFar||!e)return;');
  }
  const lateEnabled=env.HONRO_ACT6_QA_NORMAL_LATE_FAR==='1';
  const lateFar=lateEnabled?await (await import('./act6-late-qa/compose-normal-late-far.mjs')).normalLateFarSource():'';
  source=replaceOne(source,'/* SIGNED_ASSET */;', '/* SIGNED_ASSET */;\n'+farRaw.replace('export function createStageFar','function createStageFar')+'\n'+farHost+'\n'+lateFar);
  if(lateEnabled){
    source=replaceOne(source,'if(!normalFar||id<51||id>57','if((id===58||id===59)&&scene&&s?.normal51&&s.engine===e&&s.b===b){mountNormalLateFar(app,e,s);return;}\n        if(!normalFar||id<51||id>57');
    source=replaceOne(source,'if(!s?.normalFar||!e)return;','s?.normalLateFar?.dispose();if(!s?.normalFar||!e)return;');
  }
  source=replaceOne(source,'active.delete(app);','disposeNormalFar(app);active.delete(app);');
  source=replaceOne(source,'active:app=>active.has(app),','active:app=>active.has(app),mountNormalFar,');
 }
 if(env.HONRO_ACT6_QA_NORMAL_BOUNDARY==='1'){
  assert.equal(env.HONRO_ACT6_QA_NORMAL_ENDING_STOCK,'1','Stock factory needs the paired ending module present');
  const wrap=async(file,fn)=>{
    const module=await readFile(new URL('./act6-boundary/'+file,import.meta.url),'utf8');
    return 'const '+fn+'=(()=>{'+module.replaceAll('export ','')+'\nreturn '+fn+';})();\n';
  };
  const scope=await wrap('chapter-boundary.mjs','createChapterBoundary')+await wrap('boundary-sha256.mjs','sha256Boundary')+
    await readFile(new URL('./act6-boundary/browser.inc.js',import.meta.url),'utf8');
  source=replaceOne(source,'      function eligible(app,id)',scope+'\n      function eligible(app,id)');
  const stageAdv='            if(!owns()||inflight.get(app)!==original)return;';
  source=replaceOne(source,stageAdv,stageAdv+
   "\n            if(!await beforeBoundaryAdvance(app,id,{known},owns)){app.notify('다음 장을 기록하지 못했습니다. 다시 시도해 주십시오.');return;}\n            if(!owns()||inflight.get(app)!==original)return;");
  source=replaceOne(source,'offerRest:app=>fiftyUI.offer(app)','offerRest:app=>offerBoundaryRest(app)||fiftyUI.offer(app)');
 }
 if(source.includes('function mountB53('))source=replaceOne(source,'release,context53,release53,','release,context53,release53,tick53,adjustNativeWallAngle,');
 if(source.includes('function defend59('))source=replaceOne(source,'tickExterior:(a,dt)=>active.get(a)?.exterior?.tick(dt),bind','tickExterior:(a,dt)=>active.get(a)?.exterior?.tick(dt),defend59,bind');
 if(source.includes('function speak51State('))source=replaceOne(source,'tickExterior:(a,dt)=>active.get(a)?.exterior?.tick(dt),',
   'tickExterior:(a,dt)=>{active.get(a)?.exterior?.tick(dt);speak51State(a,active.get(a));},');
 return {source:replaceOne(replaceOne(source,'/* FIRST_OWNER */',first.replace('export function createFirstMissionOwner','function createFirstMissionOwner')),'/* FIFTY_OWNER */','const {createFiftyRestAdmission,buildPartyFromNormalRest,bindOrdinaryFiftyRestUI}=(()=>{'+rest.replaceAll('export function ','function ')+'\nreturn {createFiftyRestAdmission,buildPartyFromNormalRest,bindOrdinaryFiftyRestUI};})();'),packets};
}
function replaceOne(src,old,next){
 assert.equal(src.split(old).length,2,'Unreviewed normal App callsite '+old);
 return src.replace(old,()=>next);
}
export function makeQaMain(main,source,descriptor,terrainArt=null,journeyArt=null,endingReplan=null,debugStages=null){
 const bytes=Buffer.from(main);
 assert.equal(hash(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes]),'sha1'),pinnedMain);
 let proto=source.replace('/* SIGNED_ASSET */',JSON.stringify(descriptor));
 // Art is appended AFTER boundary build identity is computed. Chapter packets,
 // map/library pins, save owner and boundary source are deliberately unchanged.
 if(terrainArt){
  assert(descriptor.boundary&&source.includes('function mountNormalFar('));
  proto=replaceOne(proto,'      function eligible(app,id)',terrainArt+'\n      function eligible(app,id)');
  proto=replaceOne(proto,'disposeNormalFar(app);active.delete(app);','disposeNormalFar(app);active.get(app)?.terrainArt?.dispose();active.delete(app);');
  proto=replaceOne(proto,'active:app=>active.has(app),mountNormalFar,','active:app=>active.has(app),mountNormalFar,mountAct6TerrainArt,');
 }
 if(journeyArt){
  assert(descriptor.releaseEnabled&&descriptor.boundary&&descriptor.journeyMap);
  // Cartography is additive: keep the boundary build/proof bytes stable for existing saves.
  proto=replaceOne(proto,'      function eligible(app,id)',journeyArt+'\n      function eligible(app,id)');
 }
 if(endingReplan)proto=spliceEndingPresentation(proto,endingReplan);
 if(debugStages){
  assert(descriptor.debugFixtures&&descriptor.boundary&&descriptor.releaseEnabled);
  proto=replaceOne(proto,'      function eligible(app,id)',debugStages+'\n      function eligible(app,id)');
  proto=replaceOne(proto,'      function issue(app,button,id){','      function issue(app,button,id){if(stageDebug.has(app)){button.hidden=true;return;}');
  proto=replaceOne(proto,'      function boundarySession(app){','      function boundarySession(app){if(stageDebug.has(app))return null;');
  proto=replaceOne(proto,'      function mountEndingNormal60(a,s,terminal){','      function mountEndingNormal60(a,s,terminal){if(stageDebug.has(a))return false;');
  proto=replaceOne(proto,'active:app=>active.has(app),','active:app=>active.has(app)||stageDebug.has(app),travelDebug,returnDebugStage,debugStageOutcome,restoreDebug,');
  if(descriptor.bProof)proto=replaceOne(proto,'travelDebug,returnDebugStage,','travelDebug,offerBProof,adjustBProofAngle,returnDebugStage,');
 }
 assert.equal(source.split('/* SIGNED_ASSET */').length,2);
 const edits=[
 ['    class App {',proto+'\n    class App {'],
 ['if(this.profileStore.locked&&!this.profileRecoveryShown)','qa51.offer(this); if(this.profileStore.locked&&!this.profileRecoveryShown)'],
 ['G.HonroEquipmentUI.tick(this);return out;}','G.HonroEquipmentUI.tick(this);qa51.offerRest(this);return out;}'],
 ['G.HonroRestJourney.requestRest(this);',(debugStages?'if(qa51.returnDebugStage(this))return;':'')+'G.HonroRestJourney.requestRest(this);qa51.offerRest(this);'],
 ['        persist() {','        persist() { if(qa51.active(this))return false;'],
 ['        flushBattleSave() {','        flushBattleSave() { if(qa51.active(this)){this.dirty=false;return;}'],
 ["if (this.engine && !this.training && !this.done) {","if (!qa51.active(this) && this.engine && !this.training && !this.done) {"],
 ['this.profile=this.customMap.returnProfile;this.stageId=this.customMap.returnStageId;this.customMap=null;}','this.profile=this.customMap.returnProfile;this.stageId=this.customMap.returnStageId;this.customMap=null;} qa51.release(this);'+(debugStages?'qa51.restoreDebug(this);':'')],
 ['        isOpen(st) {','        isOpen(st) { if(st?.id>=51)return false;'],
 ['        launch(id = this.stageId, training = false, skill = null) {','        launch(id = this.stageId, training = false, skill = null, permit) {\n            if(id>=51)return (id===51||id===52)&&!training?qa51.launch(this,id,permit):undefined;'],
 ['        retry() {','        retry() { '+(debugStages?'if(qa51.returnDebugStage(this))return;':'')+'if(qa51.active(this))return this.showTitle();'],
 ['        continue() {','        continue() {\n            if(qa51.active(this)||this.profile.honroBattle?.honroStage>=51||this.profile.honroMapRestart>=51)return;'],
 ['const st=H.stages[this.stageId-1], campaign=', 'const st=qa51.active(this)?this.stage:H.stages[this.stageId-1], campaign='],
 ['            e.checkEnd = () => this.checkMission(e);','            if(!qa51.bind(this,e))e.checkEnd = () => this.checkMission(e);'],
 ['        missionTick(dt){','        missionTick(dt){if(qa51.active(this))return;'],
 ['G.HonroObjectives.state(b,st);','(qa51.goalState(this,e)??G.HonroObjectives.state(b,st));'],
 ['const win=G.HonroObjectives.state(b,st).complete;', 'const win=(qa51.goalState(this,e)??G.HonroObjectives.state(b,st)).complete;'],
 ['            if(this.done||!this.engine)return;','            if(this.done||!this.engine)return;\n            if('+ (debugStages?'qa51.debugStageOutcome(this)||':'') +'qa51.outcome(this))return;'],
 ["if(e.code==='KeyE'&&G.HonroInteractions?.key(this,e))return;", "if(e.code==='KeyE'&&(qa51.action(this,e)||G.HonroInteractions?.key(this,e)))return;"],
 ['const a = el.dataset.action, id = el.dataset.id, sk = el.dataset.skill;','const a = el.dataset.action, id = el.dataset.id, sk = el.dataset.skill; if(!qa51.keepAction(this,a)'+(debugStages?"&&!(this.screen==='battle'&&G.HonroAct6Journey?.debugBattle(this)&&['rest','result-continue'].includes(a))":'')+')return;'],
 ['        async export() {','        async export() { if(qa51.active(this))return;'],
 ["else if (el.id === 'file-import' && el.files[0]) {","else if (el.id === 'file-import' && el.files[0]) {\n                if(qa51.active(this)){el.value='';return;}"]
 ];
 if(debugStages)edits.push(
  ['G.HonroRestJourney.travel(this,id);','if(!(this.debugMode&&this.journeyAct===6)){G.HonroRestJourney.travel(this,id);}else if(!e.isTrusted||performance.now()<(this.journeyInputAfter||0))return;else qa51.travelDebug(this,Number(id),e,el);'],
  ['        resultContinue(){','        resultContinue(){if(qa51.returnDebugStage(this))return;']);
 if(descriptor.bProof)edits.push(['G.HonroRestJourney.selectBook(this,id);','G.HonroRestJourney.selectBook(this,id);qa51.offerBProof(this);']);
 if(source.includes('function adjustNativeWallAngle(')||descriptor.bProof)edits.push(
  ['        adjustAngle(u, v) {','        adjustAngle(u, v) { '+(source.includes('function adjustNativeWallAngle(')?'if(qa51.adjustNativeWallAngle(this,u,v))return; ':'')+(descriptor.bProof?'if(qa51.adjustBProofAngle(this,u,v))return;':'')]);
 if(endingReplan)edits.push(
  ['qa51.offer(this); if(this.profileStore.locked','qa51.offer(this); act6EndingReplan.installDebug(this); if(this.profileStore.locked'],
  ['this.audio?.update(inBattle&&!this.engine.noncombatWalk()', 'if(act6EndingReplan.silenceStock(this)){this.audio?.music?.setPaused(true);this.updateMusicLabel();return;}\n            this.audio?.update(inBattle&&!this.engine.noncombatWalk()']);
 if(source.includes('function enterNormal51('))edits.push(
  ['            G.HonroObjectives.updateSettlement(b,st,state.objectiveReady);','            if(!qa51.isNormal(this))G.HonroObjectives.updateSettlement(b,st,state.objectiveReady);']);
 if(source.includes('function enterNormal53('))edits.push(
  ['(id===51||id===52)&&!training?qa51.launch', '(id===51||id===52||id===53||id===54||id===55||id===56||id===57||id===58||id===59||id===60)&&!training?qa51.launch'],
  ["const combatSkills=u.meleeFollow==='ready'&&!u.loadout.includes('S00')?['S00',...u.loadout]:u.loadout;", "const combatSkills=qa51.context53(this,u,u.meleeFollow==='ready'&&!u.loadout.includes('S00')?['S00',...u.loadout]:u.loadout);"],
  ['G.HonroStakeCrossing.skills(this.engine.b,active).includes(remembered)','qa51.context53(this,active,G.HonroStakeCrossing.skills(this.engine.b,active)).includes(remembered)'],
  ['G.HonroStakeCrossing.skills(b,u).includes(this.selected)','qa51.context53(this,u,G.HonroStakeCrossing.skills(b,u)).includes(this.selected)'],
  ['}else this.engine.fire(this.selected, u.angle, this.power);','}else if(!qa51.release53(this,u))this.engine.fire(this.selected, u.angle, this.power);']);
 if(source.includes('function storyProjection('))edits.push([
  '        speakerUnits(who){return[...',
  '        speakerUnits(who){const echo=qa51.storyProjection(this,who);if(echo)return [echo];return[...'
 ]);
 if(source.includes('function enterNormal54('))edits.push(['missionTick(dt){if(qa51.active(this))return;', 'missionTick(dt){if(qa51.active(this)){qa51.tickExterior(this,dt);qa51.tick53(this);qa51.tick54(this);qa51.tick55(this);qa51.tick56(this);qa51.tick57(this);qa51.tick58(this);qa51.tick59(this);qa51.tick60(this,dt);return;}']);
 if(source.includes('function defend59('))edits.push(['this.engine.finishAction();this.updateHUD(true); }\n        displayAngle(u)',
  'qa51.defend59(this,()=>this.engine.finishAction());this.updateHUD(true); }\n        displayAngle(u)']);
 if(source.includes('function enterNormal58('))edits.push(
  ['if (!heroes.length || objective?.dead || rescuedResidentLost || channelerLost || act2Failure)', 'if (!heroes.length || objective?.dead || rescuedResidentLost || channelerLost || act2Failure || ([55,57,58,59].includes(b.honroStage)&&qa51.goalState(this,e)?.failed===true))'],
  ['b.winnerReason = (act2Failure===', "b.winnerReason = ([55,57,59].includes(b.honroStage)&&qa51.goalState(this,e)?.failed?qa51.goalState(this,e).summary:null) || (act2Failure==="]);
 if(source.includes('function mountNormalFar('))edits.push([
  "this.scene = new G.HonroScene($('battlecanvas')); const u = e.active;",
  "this.scene = new G.HonroScene($('battlecanvas')); "+(terrainArt?'qa51.mountAct6TerrainArt(this,e); ':'')+"qa51.mountNormalFar(this,e); const u = e.active;"]);
 return edits.reduce((code,[a,b])=>replaceOne(code,a,b),main);
}

