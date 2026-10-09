/** Production App/Story/interaction/save regression. Cleared prerequisite,
 * nearby defeated threats and a supported starting investigator are explicit
 * setup fixtures, not normal-play arrival. No live-state writes follow setup.
 * DOM, Canvas, storage/download and clock are the existing App test doubles. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {quarryEntryProfile} from './stage12-quarry-entry-helper.mjs';
const out='_local/reports/stage12-quarry/app-resume';await mkdir(out,{recursive:true});
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(stable(v))).digest('hex');
const paths=['shared/data/campaign.json','shared/runtime/stage12-quarry.js','shared/runtime/act2.js','shared/runtime/progression.js','shared/runtime/main.js','shared/runtime/story.js','shared/runtime/story-staging.js','shared/runtime/story-direction.js','shared/runtime/interactions.js','shared/runtime/allies.js','shared/runtime/world.js','shared/map/compiler.js','shared/engine/src/engine.ts','tests/app-regression-helpers.mjs','tests/stage12-quarry-entry-helper.mjs','tests/stage12-quarry-app-resume.mjs'];
const source=Object.fromEntries(await Promise.all(paths.map(async path=>[path,hash(await readFile(path,'utf8'))])));
const h=await appHarness(),{g,C}=h,A=g.HonroAct2,S=g.HonroStage12Quarry;assert(S?.signSceneDone,'Quarry scene-completion guard is required');
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
let now=10000,scenario='',lastApp;g.performance={now:()=>now};
const rows=[],failures=[],checkpoints=[],openEvents=[];
const fields=['units','terrain','honroWorldTerrain','items','round','phase','side','active','honroState','honroGrowth','honroMarkers','honroEvents','honroAuthoredEvents','honroAct2Steps','honroObjectives','honroCounters','honroMap','honroElements','honroEnvironment','honroLandmarks','honroMapAnchors','honroPlayBounds','honroTerrainBounds','honroSurfaceZones','honroCamera','width','height','heroes','projectiles','queue','wind','honroStaging','encounter','enemyLimit','honroActiveLimit','honroStory','honroQuarryRevision','honroQuarryActivation','honroQuarryRoster','honroQuarryPopulationCap','honroQuarrySpec','honroQuarryContent','honroObjectiveRevision','honroAct2Revision','honroAct2GeometryRevision','sceneVersion'];
const keep=b=>plain(Object.fromEntries(fields.map(k=>[k,b[k]])));
// Authored look cues may mirror aim with facing and clear an idle movement flag.
// Continue remains byte-value exact; only Skip/Next gameplay comparisons use
// the facing-relative aim and normalized idle flag, never normalized positions.
const core=b=>plain({units:b.units.map(({honroScenePose,angle,facing,moving,...u})=>({...u,aimFromFacing:facing<0?180-angle:angle,moving:moving||0})),terrain:b.terrain,world:b.honroWorldTerrain,items:b.items,round:b.round,side:b.side,active:b.active,phase:b.phase,quarry:b.honroState.quarry,act2:b.honroState.act2,growth:b.honroGrowth,sceneVersion:b.sceneVersion});
const serial=b=>b.honroState.actorTurnSerial||0;
const isSign=line=>line?.[2]?.storyId?.endsWith('act2-12-sign');
const summary=app=>{const b=app.engine.b,m=b.honroState.quarry;return plain({scenario,gate:m?.gate,openCount:m?.openCount,serial:serial(b),requestSerial:m?.signRequestSerial,openedSerial:m?.openedSerial,storyId:m?.signStoryId,stagingOnce:m?.signStoryId?b.honroStaging?.once?.[m.signStoryId]:null,dialogue:!!app.dialogue,cursor:app.dialogue?.index,phase:b.phase,side:b.side,active:b.active,actorBoundary:app.actorBoundary||null,queuedSign:(b.honroState.storyQueue||[]).filter(isSign).length,sceneVersion:b.sceneVersion});};
function exact(actual,expected,label){
 if(hash(actual)===hash(expected))return;
 const differences=[];function walk(a,e,path){if(differences.length>=20||hash(a??null)===hash(e??null)&&((a===undefined)===(e===undefined)))return;if(a&&e&&typeof a==='object'&&typeof e==='object'){for(const key of new Set([...Object.keys(a),...Object.keys(e)]))walk(a[key],e[key],path+'.'+key);}else differences.push({path,actual:a,expected:e});}walk(actual,expected,'snapshot');
 assert.fail(label+' (complete value/presence/array-order snapshot): '+JSON.stringify(differences));
}
function mark(app,label){lastApp=app;checkpoints.push({...summary(app),label,snapshotSha256:hash(keep(app.engine.b))});}
function gates(app,opened,label){const b=app.engine.b,m=S.memory(b),id=b.honroQuarrySpec.gateTerrainId;assert.equal(m.openCount,opened?1:0,label+' commit count');assert.equal(m.gate,opened?'open':A.memory(b).done.sign?'waiting':'closed',label+' gate state');for(const [name,terrain]of [['collision',b.terrain],['world',b.honroWorldTerrain]]){const rows=terrain.filter(t=>t.id===id);assert.equal(rows.length,1,label+' unique '+name+' gate');assert.equal(!!rows[0].broken,opened,label+' '+name+' gate geometry');}mark(app,label);}
const actualTick=A.tick;A.tick=function(app,dt){const b=app.engine?.b,watch=S.active(b),before=watch?S.memory(b).openCount:null,at=watch?summary(app):null;const result=actualTick(app,dt);if(watch&&S.memory(b).openCount!==before)openEvents.push({...at,after:summary(app),sceneDone:S.signSceneDone(b),safe:S.safe(app)});return result;};
function tick(app){lastApp=app;now+=1000/60;if(!app.dialogue){app.engine.tick(C.STEP);if(!app.dialogue)app.missionTick(C.STEP);}g.HonroStory.tick(app,now);}
async function continued(app,label){app.export();const profile=await h.exported(),before=keep(profile.honroBattle),dialogue=app.dialogue?plain(app.dialogue):null;const next=h.load(profile);next.continue();lastApp=next;exact(keep(next.engine.b),before,label);if(dialogue)exact(plain(next.dialogue),dialogue,label+' exact dialogue and staging cursor');now+=1000;mark(next,label);return next;}
function ready(cls){let app=h.load({...plain(g.AppRegression.fresh()),...plain(quarryEntryProfile(g).profile)});app.launch(12);h.finish(app);now+=1000;const e=app.engine,b=e.b,at=b.honroMarkers.find(m=>m.id==='sign'),u=e.heroesAlive().find(u=>u.cls===cls);A.memory(b).done['clear-approach']=true;for(const foe of e.alive(1))if(Math.hypot(foe.x-at.x,foe.y-at.y)<400){foe.hp=0;foe.dead=true;}Object.assign(u,{x:at.x,y:at.y,acted:false,vx:0,vy:0,grounded:true,airborne:false,jumping:false});b.active=u.id;b.side=0;b.phase='aim';assert(C.validTerrainContactPose(b.terrain,u,u.x,u.y),'Supported fixture investigator');assert(app.canInput());assert(A.eligibility(app,at).ok);lastApp=app;return{app,id:u.id};}
async function sceneCase(cls,completion){
 scenario=cls+'-'+completion;let {app,id}=ready(cls),continues=0;const eventStart=openEvents.length;
 const startingPositions=plain(app.engine.b.units.map(u=>[u.id,u.x,u.y]));gates(app,false,'before sign');app=await continued(app,'closed Continue');continues++;gates(app,false,'closed resumed');
 const requestSerial=serial(app.engine.b);assert.equal(g.HonroInteractions.nearest(app)?.id,'sign');let prevented=0;assert(g.HonroInteractions.key(app,{code:'KeyE',repeat:false,preventDefault(){prevented++;}}),'Production E input accepts sign');assert.equal(prevented,1);assert.equal(S.memory(app.engine.b).signInteractorId,id,'Captured actual investigator');assert.equal(S.memory(app.engine.b).signMageNear,cls==='mage');assert.equal(S.memory(app.engine.b).signRequestSerial,requestSerial);
 assert(!app.dialogue,'Scene is queued behind the actual action');assert((app.engine.b.honroState.storyQueue||[]).some(isSign),'Actual sign lines are queued');gates(app,false,'queued sign');
 app=await continued(app,'queued Continue #1');continues++;app=await continued(app,'queued Continue #2');continues++;gates(app,false,'queued resumed twice');
 for(let i=0;i<400&&!app.dialogue;i++){tick(app);gates(app,false,'queued action tick '+i);}assert(app.dialogue?.lines.some(isSign),'Queued sign scene drains at actual actor end');gates(app,false,'scene began');
 for(let i=0;i<40&&app.dialogue.index<2;i++)h.click('dialogue-next');assert.equal(app.dialogue.index,2,'Real Next reaches the middle of the sign scene');gates(app,false,'middle of scene');
 const lines=plain(app.dialogue.lines),text=lines.map(line=>line[1]).join('\n');assert(text.includes('짚신'));assert.equal(text.includes('담허의 설명을 따라'),cls!=='mage','Spatially accurate mage narration');
 app=await continued(app,'middle Continue #1');continues++;app=await continued(app,'middle Continue #2');continues++;exact(plain(app.dialogue.lines),lines,'Saved original story payload remains exact');gates(app,false,'middle resumed twice');
 const beforeFinish=core(app.engine.b);for(let i=0;i<100&&app.dialogue;i++)h.click(completion==='skip'?'dialogue-skip':'dialogue-next');assert(!app.dialogue,'Production dialogue action completes the scene');exact(core(app.engine.b),beforeFinish,'Dialogue '+completion+' never advances gameplay');assert(S.signSceneDone(app.engine.b),'Sign staging completed and no sign payload remains pending');gates(app,false,'scene finished before the safe checkpoint');
 app=await continued(app,'finished scene Continue #1');continues++;app=await continued(app,'finished scene Continue #2');continues++;gates(app,false,'finished scene resumed twice');
 // The original E action has already ended. Once its scene also completes,
 // the next safe idle checkpoint may commit; no additional defend is required.
 const finishedSerial=serial(app.engine.b),beforeVersion=app.engine.b.sceneVersion;assert(finishedSerial>requestSerial,'The actual E action ended before its scene completed');
 for(let i=0;i<400&&!S.memory(app.engine.b).openCount;i++)tick(app);gates(app,true,'safe checkpoint after E action and scene');assert.equal(serial(app.engine.b),finishedSerial,'Opening requires no extra actor action');assert.equal(app.engine.b.sceneVersion,beforeVersion+1,'One atomic geography invalidation');
 const events=openEvents.slice(eventStart);assert.equal(events.length,1,'Exactly one gate commit');assert(events[0].safe&&events[0].sceneDone&&!events[0].dialogue);assert.equal(events[0].serial,S.memory(app.engine.b).openedSerial);assert.equal(events[0].phase,'aim');
 assert(!A.memory(app.engine.b).done['hold-road']&&!A.memory(app.engine.b).done['clear-quarry']&&!A.memory(app.engine.b).done.exit,'Opening never skips defense, extermination or exit');
 app=await continued(app,'open Continue #1');continues++;app=await continued(app,'open Continue #2');continues++;gates(app,true,'open resumed twice');
 const once=plain({terrain:app.engine.b.terrain,world:app.engine.b.honroWorldTerrain,gate:S.memory(app.engine.b),sceneVersion:app.engine.b.sceneVersion});for(let i=0;i<30;i++)tick(app);exact(plain({terrain:app.engine.b.terrain,world:app.engine.b.honroWorldTerrain,gate:S.memory(app.engine.b),sceneVersion:app.engine.b.sceneVersion}),once,'Repeated idle ticks do not reopen or rewrite geography');
 exact(plain(app.engine.b.units.filter(u=>startingPositions.some(row=>row[0]===u.id)).map(u=>[u.id,u.x,u.y])),startingPositions,'Story, Continue and gate commit never reposition original actors');
 rows.push({case:scenario,passed:true,completion,investigator:id,mageNear:cls==='mage',continueCount:continues,cursor:2,requestSerial,finishedSerial,openedSerial:S.memory(app.engine.b).openedSerial,openCount:1,gateEvents:events});console.log('PASS',scenario);
}
async function oldCase(){scenario='old12';const original=JSON.parse(await readFile('tests/fixtures/stage12-quarry/before-stage12.json','utf8')),project=g.HONRO_PROJECT;let profile;
 try{g.HONRO_PROJECT={...project,stages:project.stages.map(s=>s.id==='stage-12'?plain(original.stage):s)};const app=h.load({...plain(g.AppRegression.fresh()),...plain(quarryEntryProfile(g).profile)});app.launch(12);h.finish(app);now+=1000;assert(!S.active(app.engine.b));app.defend();for(let i=0;i<300&&app.engine.b.phase==='review';i++)app.engine.tick(C.STEP);g.HonroStory.start(app,app.stage.beats.sign,{title:'옛 길표 중간 저장'});for(let i=0;i<40&&app.dialogue.index<2;i++)h.click('dialogue-next');assert.equal(app.dialogue.index,2);app.export();profile=await h.exported();}finally{g.HONRO_PROJECT=project;}
 const before=keep(profile.honroBattle);let app=h.load(profile);app.continue();lastApp=app;exact(keep(app.engine.b),before,'Old12 first Continue');assert(!S.active(app.engine.b));assert(!app.engine.b.honroState.quarry);assert.equal(app.engine.alive(1).length,20);assert.equal(app.engine.alive(1).filter(u=>u.elite).length,5);assert.equal(app.dialogue.index,2);exact(plain(A.steps(app.engine.b)),original.stage.initialState.honroAct2Steps,'Old12 saved original objectives');app=await continued(app,'Old12 second Continue');assert(!app.engine.b.honroState.quarry);rows.push({case:scenario,passed:true,actors:24,enemies:20,elites:5,continueCount:2,cursor:2,checkedSnapshotFields:fields.length});console.log('PASS old12');
}
async function paidGrowthCase(){
 scenario='paid-growth';let app=h.load({...plain(g.AppRegression.fresh()),...plain(quarryEntryProfile(g).profile)});app.launch(12);h.finish(app);now+=1000;lastApp=app;
 const b=app.engine.b,foe=app.engine.alive(1).find(u=>!u.elite),hero=app.engine.heroesAlive()[0],initial=plain(b.honroGrowth);
 assert.equal(initial.quarryWaveWeight,9.2,'Eight finite reinforcements include two elite weights');
 // An explicit terminal-damage fixture uses the production Engine/App reward
 // route. This tests paid XP persistence, not an unaided combat victory.
 app.engine.hurt(foe,foe.maxHp*100,hero.id);assert(foe.dead&&foe.killRewarded&&foe.xpGranted>0,'Production defeat pays and marks the enemy');
 const ledger=b.honroGrowth.ledger.stages[12];assert(Object.values(ledger.combat).some(x=>x>0),'Combat XP reached the saved party ledger');
 const before=keep(b),paid=plain({growth:b.honroGrowth,heroes:b.heroes,enemies:b.units.filter(u=>u.side===1).map(u=>({id:u.id,xpBudget:u.xpBudget,xpGranted:u.xpGranted,killRewarded:u.killRewarded,honroXpWeight:u.honroXpWeight}))});
 for(let n=1;n<=5;n++){app.mount(app.engine.b);lastApp=app;exact(keep(app.engine.b),before,'Paid XP App.mount #'+n);}
 for(let n=1;n<=4;n++)app=await continued(app,'Paid XP Continue #'+n);
 exact(plain({growth:app.engine.b.honroGrowth,heroes:app.engine.b.heroes,enemies:app.engine.b.units.filter(u=>u.side===1).map(u=>({id:u.id,xpBudget:u.xpBudget,xpGranted:u.xpGranted,killRewarded:u.killRewarded,honroXpWeight:u.honroXpWeight}))}),paid,'All growth ceilings, reserve, enemy budgets, granted XP and party ledger remain exact');
 const paidFoe=app.engine.b.units.find(u=>u.id===foe.id);app.engine.rewardKill(paidFoe,app.engine.b.units.find(u=>u.id===hero.id));exact(keep(app.engine.b),before,'Already rewarded defeat cannot pay again after mount and Continue');
 rows.push({case:scenario,passed:true,mountCount:5,continueCount:4,xpGranted:paidFoe.xpGranted,weight:paid.growth.weight,reserve:paid.growth.quarryWaveWeight,enemyCount:paid.enemies.length,checkedSnapshotFields:fields.length});console.log('PASS',scenario);
}
async function attempt(name,fn){try{await fn();}catch(error){const failure={case:name,name:error.name,message:error.message,lastState:lastApp?.engine?summary(lastApp):null};failures.push(failure);if(lastApp?.engine)await writeFile(out+'/'+name+'-failure.json',JSON.stringify({failure,dialogue:plain(lastApp.dialogue||null),snapshot:keep(lastApp.engine.b)},null,2)+'\n');console.error('FAIL',name,error.message);}}
for(const [cls,completion]of [['knight','skip'],['knight','next'],['mage','skip'],['mage','next'],['archer','skip'],['occultist','next']])await attempt(cls+'-'+completion,()=>sceneCase(cls,completion));
await attempt('old12',oldCase);
await attempt('paid-growth',paidGrowthCase);
const after=Object.fromEntries(await Promise.all(paths.map(async path=>[path,hash(await readFile(path,'utf8'))])));if(JSON.stringify(after)!==JSON.stringify(source))failures.push({case:'source-consistency',message:'Relevant sources changed while the test ran',before:source,after});
const result={passed:failures.length===0,sourceCommitLabel:process.env.HONRO_SOURCE_COMMIT||null,source,checkedSnapshotFields:fields.length,rows,failures,openEvents,checkpoints,scope:'Production App, E interaction dispatch, Story Next/Skip, engine actor actions, export/Continue. Explicit prerequisite/threat-defeat/supported-position setup. DOM/render/storage/time are doubles; no normal arrival, fullplay or browser claim.'};
await writeFile(out+'/summary.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:result.passed,sourceCommitLabel:result.sourceCommitLabel,rows:rows.map(row=>({case:row.case,passed:row.passed,continueCount:row.continueCount})),failures},null,2));assert.equal(failures.length,0,'All quarry App gate/save cases must pass');
