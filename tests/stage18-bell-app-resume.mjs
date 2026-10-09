/** Production App snapshot/Skip regressions. Prerequisite and occupancy states
 * are synthetic fixtures; this is neither normal fullplay nor browser evidence. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h,A=g.HonroAct2,S=g.HonroStage18Bell,rows=[];
let now=0;g.performance={now:()=>now};
const keep=b=>plain(Object.fromEntries(['units','terrain','honroWorldTerrain','items','round','phase','side','active','honroState','honroGrowth','honroMarkers','honroEvents','honroAuthoredEvents','honroAct2Steps','honroObjectives','honroCounters','honroMap','honroElements','honroEnvironment','honroLandmarks','honroMapAnchors','honroPlayBounds','honroTerrainBounds','honroSurfaceZones','honroCamera','width','height','heroes','projectiles','queue','wind','honroStaging','encounter','enemyLimit','honroActiveLimit','honroStory'].map(k=>[k,b[k]])));
const compact=b=>plain({stakes:b.stakes,projectiles:b.projectiles,units:b.units,stakes:b.stakes,projectiles:b.projectiles,terrain:b.terrain,world:b.honroWorldTerrain,environment:b.honroEnvironment,elements:b.honroElements,landmarks:b.honroLandmarks,descent:b.honroState.bellDescent,phase:b.phase,side:b.side,round:b.round,active:b.active,items:b.items,goals:b.honroState.act2});
for(const status of ['warning','waiting']){
 let app=h.load(h.profileThrough(17));app.launch(18);h.finish(app);now+=1000;
 const b=app.engine.b,a=A.memory(b),e=app.engine;
 a.done['clear-wards']=a.done.silence=true;a.silenced=true;a.holds={'hold-silence':{progress:4,spawned:8,lastRound:b.round,guarded:true,continuous:true}};b.terrain.find(t=>t.id==='upper-chain').broken=true;
 if(status==='waiting'){
  const t=b.terrain.find(t=>t.id==='sb-bell-crown');(b.stakes??=[]).push({id:'skip-test-stake',skill:'M09',x:t.x+t.w/2,y:t.y+t.h/2,active:true,expires:b.round+6});assert(S.occupants(b).some(u=>u.id==='skip-test-stake'));
 }
 S.transition(app);
 const ids=e.heroesAlive().filter(u=>!u.summoned&&!u.enthrall).map(u=>u.id);
 for(const id of status==='waiting'?ids:ids.slice(0,2)){app.actorBoundary=id;b.honroState.actorTurnSerial=(b.honroState.actorTurnSerial||0)+1;S.transition(app);app.actorBoundary=null;}
 assert.equal(S.memory(b).status,status);assert.equal(S.memory(b).count,0);
 const before=compact(b);
 g.HonroStory.start(app,app.stage.beats['upper-chain'],{title:'장력 고정구 해제'});assert(app.dialogue);h.click('dialogue-skip');
 assert.deepEqual(compact(b),before,'Skip preserves '+status+' game state');
 while(app.dialogue)h.click('dialogue-skip');now+=1000;assert(app.canInput(),'Player input restores after '+status+' Skip');
 app.export();const profile=await h.exported();const saved=compact(profile.honroBattle);app=h.load(profile);app.continue();assert.deepEqual(compact(app.engine.b),saved,'Continue preserves post-Skip '+status);now+=1000;
 assert.equal(S.memory(app.engine.b).status,status);assert.equal(S.memory(app.engine.b).offset,0);assert.equal(S.memory(app.engine.b).count,0);assert(app.canInput());if(status==='waiting')assert(S.occupants(app.engine.b).some(u=>u.id==='skip-test-stake'),'Saved blocker remains physically present after Continue');
 rows.push({case:status+' Skip and Continue',passed:true,status:S.memory(app.engine.b).status,warnedHeroes:S.memory(app.engine.b).warnedHeroes,opportunities:S.memory(app.engine.b).opportunities,offset:0,count:0,inputOpen:true});
}
{
 const original=JSON.parse(await readFile('tests/fixtures/stage18-bell-before.json','utf8')).stages[0],currentProject=g.HONRO_PROJECT,currentContent=g.HONRO_CONTENT.stages[17];let profile;
 try{
  g.HONRO_PROJECT={...currentProject,stages:currentProject.stages.map(s=>s.id==='stage-18'?plain(original):s)};g.HONRO_CONTENT.stages[17]=plain(S.legacy);
  let app=h.load(h.profileThrough(17));app.launch(18);h.finish(app);now+=1000;assert(!S.active(app.engine.b));
  // Change no battlefield data: a normal defence is allowed to resolve before
  // the old in-progress story-page snapshot is exported.
  app.defend();for(let i=0;i<200&&app.engine.b.phase==='review';i++)app.engine.tick(C.STEP);
  const lines=S.legacy.beats['upper-chain'];g.HonroStory.start(app,lines,{title:'옛 상부 고정점'});if(app.dialogue.lines.length>1)g.HonroStory.next(app);assert(app.dialogue);app.export();profile=await h.exported();
 }finally{g.HONRO_PROJECT=currentProject;g.HONRO_CONTENT.stages[17]=currentContent;}
 const before=keep(profile.honroBattle),dialogue=plain(profile.honroBattle.honroStory);assert(!profile.honroBattle.honroBellRevision);let app=h.load(profile);app.continue();
 assert.deepEqual(keep(app.engine.b),before,'Old18 complete battle snapshot preserved');assert(!S.active(app.engine.b));assert(!app.engine.b.honroBellRevision);assert.deepEqual(plain(A.steps(app.engine.b)),original.initialState.honroAct2Steps);assert.equal(g.HonroObjectiveRevision.contentFor(app.engine.b,app.stage).guide,S.legacy.guide);assert.deepEqual(plain(app.engine.b.honroStory),dialogue);assert.equal(app.dialogue.index,dialogue.index);assert.deepEqual(plain(app.dialogue.lines),dialogue.lines);
 rows.push({case:'revision-absent old18 production Continue',passed:true,actors:app.engine.b.units.length,terrain:app.engine.b.terrain.length,steps:A.steps(app.engine.b).map(s=>s.id),dialoguePage:app.dialogue.index,checkedSnapshotFields:Object.keys(before).length});
}
{
 const original=JSON.parse(await readFile('tests/fixtures/stage18-bell-before.json','utf8')).stages[1],project=g.HONRO_PROJECT;let profile;
 try{
  g.HONRO_PROJECT={...project,stages:project.stages.map(s=>s.id===original.id?plain(original):s)};
  const app=h.load(h.profileThrough(18));app.launch(19);h.finish(app);now+=1000;assert(!S.active(app.engine.b));assert(!app.engine.b.honroBellRevision);
  app.defend();for(let i=0;i<200&&app.engine.b.phase==='review';i++)app.engine.tick(C.STEP);
  const key=Object.keys(app.stage.beats).find(k=>(app.stage.beats[k]?.length??0)>1);assert(key);g.HonroStory.start(app,app.stage.beats[key],{title:'19장 기존 저장'});g.HonroStory.next(app);assert(app.dialogue);app.export();profile=await h.exported();
 }finally{g.HONRO_PROJECT=project;}
 const before=keep(profile.honroBattle),dialogue=plain(profile.honroBattle.honroStory),app=h.load(profile);app.continue();assert.deepEqual(keep(app.engine.b),before,'Old19 full live snapshot preserved');assert(!S.active(app.engine.b));assert(!app.engine.b.honroBellRevision);assert.deepEqual(plain(A.steps(app.engine.b)),original.initialState.honroAct2Steps);assert.deepEqual(plain(app.engine.b.honroStory),dialogue);assert.equal(app.dialogue.index,dialogue.index);assert.deepEqual(plain(app.dialogue.lines),dialogue.lines);
 rows.push({case:'revision-absent old19 production Continue',passed:true,actors:app.engine.b.units.length,terrain:app.engine.b.terrain.length,steps:A.steps(app.engine.b).map(s=>s.id),dialoguePage:app.dialogue.index,checkedSnapshotFields:Object.keys(before).length});
}
{
 let app=h.load(h.profileThrough(17));app.launch(18);h.finish(app);now+=1000;
 const b=app.engine.b,a=A.memory(b);a.done['clear-wards']=a.done.silence=true;a.silenced=true;a.holds={'hold-silence':{progress:4,spawned:8,lastRound:b.round,guarded:true,continuous:true}};b.terrain.find(t=>t.id==='upper-chain').broken=true;
 assert.equal(S.occupants(b).length,0,'Authored initial actors are outside actual swept shell');S.transition(app);
 for(const u of app.engine.heroesAlive()){app.actorBoundary=u.id;b.honroState.actorTurnSerial=(b.honroState.actorTurnSerial||0)+1;S.transition(app);app.actorBoundary=null;}
 assert.equal(S.memory(b).status,'lowering');app.engine.tick(.32);const before=compact(b);assert(before.descent.offset>0&&before.descent.offset<200);app.export();const exported=await h.exported();await h.import(exported);app.continue();assert.deepEqual(compact(app.engine.b),before,'Actual bell geometry/art and turn resume mid descent');
 app.engine.tick(1);assert.equal(S.memory(app.engine.b).status,'settled');assert.equal(S.memory(app.engine.b).count,1);assert.equal(S.memory(app.engine.b).offset,200);const positions=b=>plain({terrain:b.terrain,world:b.honroWorldTerrain,environment:b.honroEnvironment,elements:b.honroElements,landmarks:b.honroLandmarks,offset:S.memory(b).offset,count:S.memory(b).count});const once=positions(app.engine.b);app.engine.tick(0);assert.deepEqual(positions(app.engine.b),once,'Settled geography does not shift twice');
 rows.push({case:'actual shell mid-descent production export/import/Continue',passed:true,offsetAtSave:before.descent.offset,finalOffset:200,count:1});
}
const hash=s=>createHash('sha256').update(s).digest('hex'),result={projectSha256:hash(JSON.stringify(g.HONRO_PROJECT)),runtimeSha256:hash(await readFile('shared/runtime/stage18-bell.js','utf8')),rows,scope:'Production App, DOM click action dialogue-skip, Story, export/import/Continue. Bell prerequisite/occupancy states are explicit synthetic fixtures; old18/19 snapshots use immutable original maps/content and one real defend. DOM/render/storage/clock are test doubles. Not browser or normal fullplay.'};await mkdir('_local/reports/stage18-bell',{recursive:true});await writeFile('_local/reports/stage18-bell/app-resume.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
