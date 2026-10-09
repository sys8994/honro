/** Save compatibility through the production App/export/import/Continue and
 * DOM Skip route. Fixture prerequisites and positions are explicit, not play. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness} from './app-regression-helpers.mjs';
import {installFerry,installSafetyGeometry,qualify,plain,retained,geometry} from './stage30-ferry-helpers.mjs';
const h=await appHarness(),g=await installFerry(h.g),S=g.HonroStage30Ferry,A=g.HonroAct3,E=g.HonroEncounters,rows=[];let now=1000;g.performance={now:()=>now};
const original=JSON.parse(await readFile('tests/fixtures/stage30-ferry/before-stage30.json','utf8'));
function launch(){const app=h.load(h.profileThrough(29));app.launch(30);h.finish(app);now+=1000;assert(S.active(app.engine.b));installSafetyGeometry(g,app.engine.b);return app;}
function state(app,progress=1){const q={app,b:app.engine.b,e:app.engine};qualify(g,q,progress);return q;}
function defend(app){assert(app.canInput());const id=app.engine.active.id;app.defend();for(let i=0;i<180&&app.engine.b.phase==='review';i++)app.engine.tick(h.C.STEP);assert(app.engine.unit(id).acted);now+=1000;}
function boundary(app){E.actorEnd(app,app.engine.active.id);}
const compact=app=>plain({geography:geometry(app.engine.b),units:app.engine.b.units,ferry:S.memory(app.engine.b),goals:A.memory(app.engine.b),round:app.engine.b.round,side:app.engine.b.side,phase:app.engine.b.phase,active:app.engine.b.active,teamEnds:app.engine.b.teamEnds,items:app.engine.b.items,growth:app.engine.b.honroGrowth,fields:app.engine.b.fields,zones:app.engine.b.zones,stakes:app.engine.b.stakes});
for(const legacyResponse of [true,false]){
 const savedProject=g.HONRO_PROJECT;let profile;
 try{g.HONRO_PROJECT={...savedProject,stages:savedProject.stages.map(s=>s.id==='stage-30'?plain(original.stage):s)};
  const app=h.load(h.profileThrough(29));app.launch(30);h.finish(app);now+=1000;assert(!S.active(app.engine.b));assert.equal(app.engine.alive(1).length,20);if(!legacyResponse)delete app.engine.b.honroAct3ResponseRevision;
  defend(app);A.memory(app.engine.b).done['transport-map']=true;A.tick(app,0);assert(app.engine.b.honroState.pendingEvents.includes('act3-response-30-0'));const lines=[['서술','옛 나루의 기록을 읽는다.'],['설오','이 길을 따라 돌아가자.'],['소단','돌아오는 길도 기억할게요.']];g.HonroStory.start(app,lines,{title:'남겨진 길 · 기존 기록'});g.HonroStory.next(app);assert.equal(app.dialogue.index,1);app.export();profile=await h.exported();
 }finally{g.HONRO_PROJECT=savedProject;}
 const before=retained(profile.honroBattle),story=plain(profile.honroBattle.honroStory);assert(!profile.honroBattle.honroFerryRevision);
 for(let n=0;n<3;n++){const app=h.load(profile);app.continue();now+=1000;assert.deepEqual(retained(app.engine.b),before,'Old30 snapshot remains exact on repeated Continue');assert(!S.active(app.engine.b));assert(!app.engine.b.honroState.ferry);assert.equal(E.populationCap(app.engine.b),legacyResponse?30:23);assert.equal(app.dialogue.index,story.index);assert.deepEqual(plain(app.dialogue.lines),story.lines);app.export();profile=await h.exported();}
 rows.push({case:legacyResponse?'original30 cap30 repeated Continue':'pre-response30 cap23 repeated Continue',passed:true,checks:Object.keys(before).length,actors:before.units.length,dialoguePage:story.index});
}
{
 let app=launch(),b=app.engine.b;A.memory(b).done['transport-map']=true;const source='act3-response-30-0',entry=S.entryFor(b,source),spacing=b.honroEvents.find(e=>e.id===source).action.spacing||145;
 b.units.push({...plain(app.engine.active),id:'save-entry-main',x:entry.x+spacing/2,y:600},{...plain(app.engine.active),id:'save-entry-alternate',x:entry.alternates[0].x+spacing/2,y:600});A.tick(app,0);assert(b.honroState.pendingEvents.includes(source));boundary(app);assert(!b.honroState.flags['event:'+source]);assert.equal(b.units.filter(u=>u.honroSpawnSource===source).length,0);
 app.export();let profile=await h.exported();const before=retained(profile.honroBattle);
 for(let i=0;i<3;i++){app=h.load(profile);app.continue();now+=1000;assert.deepEqual(retained(app.engine.b),before,'Occupied response snapshot and cap are stable');assert.equal(E.populationCap(app.engine.b),36);app.export();profile=await h.exported();}
 b=app.engine.b;app.engine.unit('save-entry-alternate').x+=600;boundary(app);assert.equal(b.units.filter(u=>u.honroSpawnSource===source).length,2);assert.equal(b.honroState.flags['event:'+source],true);assert.equal(S.memory(b).entries[source].x,entry.alternates[0].x);app.export();profile=await h.exported();app=h.load(profile);app.continue();now+=1000;boundary(app);assert.equal(app.engine.b.units.filter(u=>u.honroSpawnSource===source).length,2);rows.push({case:'occupied pending response survives three Continue calls and commits its full same-side alternate once',passed:true,count:2,cap:36});
}
for(const status of ['warned','waiting','settling','settled']){
 let app=launch();state(app);S.transition(app);if(status!=='warned'){defend(app);A.memory(app.engine.b).holds['ferry-hold'].progress=2;}
 if(status==='waiting'){app.engine.b.stakes=[{id:501,skill:'M09',x:3450,y:500,active:true,expires:app.engine.b.round+5}];boundary(app);}
 if(status==='settling'||status==='settled'){boundary(app);assert.equal(S.memory(app.engine.b).status,'settling');app.engine.tick(status==='settling'?.32:1);}
 assert.equal(S.memory(app.engine.b).status,status);const before=compact(app);
 app.export();let profile=await h.exported();await h.import(profile);app.continue();now+=1000;assert.deepEqual(compact(app),before,'Import/Continue '+status);
 for(let n=0;n<2;n++){app.export();profile=await h.exported();app=h.load(profile);app.continue();now+=1000;assert.deepEqual(compact(app),before,'Repeated Continue '+status);}
 if(status==='settling'){assert.equal(S.memory(app.engine.b).elapsed,.32);app.engine.tick(1);assert.equal(S.memory(app.engine.b).status,'settled');assert.equal(S.memory(app.engine.b).commitCount,1);const once=geometry(app.engine.b);app.export();profile=await h.exported();app=h.load(profile);app.continue();now+=1000;boundary(app);assert.equal(S.memory(app.engine.b).commitCount,1);assert.deepEqual(geometry(app.engine.b),once);}
 if(status==='warned'||status==='waiting'){const snapshot=compact(app);g.HonroStory.start(app,[['서술','느슨해진 줄 끝이 물을 스쳤다.'],['담허','원래 길로도 돌아갈 수 있네.']],{title:'나루의 짧은 경고'});assert(app.dialogue);h.click('dialogue-skip');h.finish(app);now+=1000;assert.deepEqual(compact(app),snapshot,'Real DOM Skip leaves '+status+' safety unchanged');assert(app.canInput(),'Input restored after Skip');assert.equal(S.skip(app),false,'Cannot bypass pending safety via cinematic Skip');}
 rows.push({case:'new30 '+status+' export/import/repeated Continue',passed:true,commitCount:S.memory(app.engine.b).commitCount,elapsedAtSave:before.ferry.elapsed});
}
{
 const app=launch(),q=state(app);S.transition(app);defend(app);const b=app.engine.b,a=A.memory(b);a.holds['ferry-hold'].progress=3;a.holds['ferry-hold'].spawned=3;b.stakes=[{id:502,skill:'M09',x:3450,y:500,active:true,expires:b.round+9}];boundary(app);h.finish(app);now+=1000;assert.equal(A.current(b).id,'old-road');
 // Terminal positioning fixture: the unchanged live reach predicate is what
 // commits victory. Surviving enemies remain and geometry remains uncommitted.
 const exit=A.marker(b,'old-road');for(const [i,u]of A.heroes(b).entries())Object.assign(u,{x:exit.x+(i-1.5)*55,y:exit.y});const enemies=app.engine.alive(1).length,before=geometry(b);A.tick(app,0);assert.equal(b.phase,'won');assert(enemies>0);assert.equal(S.memory(b).commitCount,0);assert.equal(S.memory(b).status,'cancelled');assert.deepEqual(geometry(b),before);const n=b.units.length;boundary(app);app.engine.tick(.5);assert.equal(b.units.length,n,'No post-win response');assert.equal(g.HONRO_CONTENT.nextAct.available,false);rows.push({case:'blocked ferry still wins through original all-hero exit with living enemies',passed:true,remainingEnemies:enemies,commitCount:0});
}
{
 const app=launch(),q=state(app);S.transition(app);defend(app);A.memory(q.b).holds['ferry-hold'].progress=2;boundary(app);q.e.tick(.25);assert.equal(S.memory(q.b).status,'settling');const before=geometry(q.b);q.b.phase='won';A.tick(app,0);assert.equal(S.memory(q.b).status,'cancelled');assert.deepEqual(geometry(q.b),before);assert.equal(S.memory(q.b).commitCount,0);rows.push({case:'terminal cleanup during settling preserves moored geography',passed:true});
}
// Persist the opt-in itself, not a recomputed campaign setting. These are
// explicit low/upper placement fixtures using production export and Continue.
for(const version of [undefined,1,2])for(const upper of [false,true]){
 let app=h.load(h.profileThrough(29));app.launch(30);h.finish(app);now+=1000;let b=app.engine.b;b.round=4;
 if(version===undefined)delete b.honroFerrySpec.pressureVersion;else b.honroFerrySpec.pressureVersion=version;
 for(const v of app.engine.alive(1)){v.awake=true;v.aggroUntil=0;}
 for(const u of app.engine.heroesAlive()){const t=b.terrain.find(t=>t.id==='sf-east-landing-planks');Object.assign(u,{x:7760,y:h.C.topAt(t,7760),vx:0,vy:0,airborne:false,jumping:false});assert(h.C.validTerrainContactPose(b.terrain,u));}
 if(upper){const u=app.engine.heroesAlive()[0],t=b.terrain.find(t=>t.id==='sf-bank-inner');Object.assign(u,{x:6750,y:h.C.topAt(t,6750)});assert(h.C.validTerrainContactPose(b.terrain,u));}
 const selected=e=>plain(e.combatEnemies().map(u=>u.id)),expected=selected(app.engine),hasE=expected.some(id=>app.engine.unit(id).honroFerryCell==='bank-rearguard');assert.equal(hasE,version!==2||upper,'Only pressure2 lower-only play filters the upper bank');
 app.export();let profile=await h.exported();const before=retained(profile.honroBattle);await h.import(profile);app.continue();now+=1000;assert.deepEqual(retained(app.engine.b),before);assert.deepEqual(selected(app.engine),expected);
 for(let n=0;n<3;n++){app.export();profile=await h.exported();app=h.load(profile);app.continue();now+=1000;assert.deepEqual(retained(app.engine.b),before,'Pressure spec, HP, actor history, queue and geometry remain exact');assert.deepEqual(selected(app.engine),expected);assert.equal(app.engine.b.honroFerrySpec.pressureVersion,version,'Continue never upgrades a saved pressure version');}
 rows.push({case:'pressure '+(version??'absent')+' '+(upper?'upper-contact':'lower-only')+' import and three Continue calls',passed:true,eligible:expected,upperBankEligible:hasE});
}
{
 let app=h.load(h.profileThrough(29));app.launch(30);h.finish(app);now+=1000;const b=app.engine.b;b.honroFerrySpec.pressureVersion=2;b.round=4;
 const pose=(u,id,x)=>Object.assign(u,{x,y:h.C.topAt(b.terrain.find(t=>t.id===id),x),vx:0,vy:0,airborne:false,jumping:false});for(const v of app.engine.alive(1)){v.awake=true;v.aggroUntil=0;}for(const u of app.engine.heroesAlive())pose(u,'sf-east-landing-planks',7760);const u=app.engine.heroesAlive()[0];pose(u,'sf-bank-inner',7760);
 b.phase='transition';app.engine.switchTeam();assert(b.queue.some(id=>app.engine.unit(id).honroFerryCell==='bank-rearguard'),'Actual original scheduler admitted upper-bank E on upper contact');
 // Explicit interrupted-position fixture: a saved already-admitted actor is
 // never deleted from the current turn when later eligibility changes.
 pose(u,'sf-east-landing-planks',7760);assert(!app.engine.combatEnemies().some(v=>v.honroFerryCell==='bank-rearguard'));app.export();let profile=await h.exported();const before=retained(profile.honroBattle);
 for(let n=0;n<3;n++){app=h.load(profile);app.continue();now+=1000;assert.deepEqual(retained(app.engine.b),before,'Continue keeps an admitted enemy queue, active actor and phase intact');assert(!app.engine.combatEnemies().some(v=>v.honroFerryCell==='bank-rearguard'));app.export();profile=await h.exported();}
 rows.push({case:'pressure2 eligibility change never purges an already-admitted saved enemy queue',passed:true,phase:before.phase,active:before.active,queue:before.queue});
}
const hash=s=>createHash('sha256').update(s).digest('hex'),result={rows,sourceCommit:original.sourceCommit,runtimeSha256:hash(await readFile('shared/runtime/stage30-ferry.js','utf8')),scope:'Production App, save/export/import/Continue, DOM dialogue-skip. Geometry and goal prerequisite states are explicit fixtures. DOM/render/storage/clock are doubles. Not normal play or browser evidence.'};await mkdir('_local/reports/stage30-ferry',{recursive:true});await writeFile('_local/reports/stage30-ferry/history.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
