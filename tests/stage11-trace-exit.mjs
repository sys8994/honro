// Approved objective migration: exact normal turn-54 save, production App
// Continue/retry/E/outcome, and explicit spatial/failure/pending-wave fixtures.
// Teleporting the actor only in the final-E fixture is not normal traversal proof.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h,X=g.HonroStage11TraceExit,A=g.HonroAct2,checks=[];
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const profile=JSON.parse(await readFile('tests/fixtures/stage11-trace-exit-save.json','utf8'));
const ids=['knot-west','clear-west','knot-east','hold-knots','resident','trace'];
const without=steps=>steps.filter(s=>(typeof s==='string'?s:s.id)!=='clear-road');
function expected(old){const out=plain(old);out.honroAct2Steps=without(out.honroAct2Steps);out.honroStage11TraceExitRevision=1;
 if(out.honroNarrativeContent){const p=out.honroNarrativeContent;if(p.steps)p.steps=without(p.steps);if(p.act2Plan?.sequence)p.act2Plan.sequence=without(p.act2Plan.sequence);}return out;}
function check(name,fn){fn();checks.push(name);console.log('PASS',name);}
check('exact turn54 migration changes only the authorized pinned plan and revision metadata',()=>{
 const b=plain(profile.honroBattle),before=plain(b);assert.equal(b.round,54);assert.equal(b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length,37);
 assert(X.upgradeBattle(b));assert.deepEqual(b,expected(before));assert.equal(A.current(b).id,'trace');assert.equal(A.state(b).complete,false);
 assert.equal(X.upgradeBattle(b),false);assert.deepEqual(b,expected(before));
 const snapshot=plain(before);snapshot.honroNarrativeRevision=1;snapshot.honroNarrativeContent={steps:plain(before.honroAct2Steps),act2Plan:{sequence:plain(before.honroAct2Steps)},beats:{trace:[['설오','북쪽 흔적을 조사한다.']]},outro:[['소단','기존 결말']]};snapshot.honroStory={lines:[['주민','이미 기록된 대사']],index:0};
 const old=plain(snapshot);assert(X.upgradeBattle(snapshot));assert.deepEqual(snapshot,expected(old));
});
check('legacy, custom, workshop, other-stage, terminal, future and unrecognized saved plans are untouched',()=>{
 for(const alter of [b=>b.honroStage11EncounterRevision=1,b=>b.honroCustom=true,b=>b.honroMapOrigin='workshop',b=>delete b.honroMapOrigin,b=>b.mode='practice',b=>b.honroStage=12,b=>b.phase='won',b=>b.phase='lost',b=>b.honroStage11TraceExitRevision=2,b=>b.honroAct2Steps.push({id:'custom-step',kind:'interact'})]){
  const b=plain(profile.honroBattle);alter(b);const before=plain(b);assert.equal(X.upgradeBattle(b),false);assert.deepEqual(b,before);
 }
});
check('non-opted-in cleanup readers retain the old final hostiles and pending-response gate',()=>{
 const b=plain(profile.honroBattle);for(const step of b.honroAct2Steps)A.memory(b).done[step.id]=true;
 assert.equal(A.state(b).complete,false);assert.equal(A.state(b).targets[0].id,'clear-road');
 for(const u of b.units.filter(u=>u.side===1)){u.hp=0;u.dead=true;}
 const ev=b.honroEvents.find(ev=>ev.honroStage11Response===1);delete b.honroState.flags['event:'+ev.id];b.honroState.pendingEvents=[ev.id];
 assert.equal(A.state(b).complete,false);assert.equal(A.state(b).targets[0].id,'clear-road');
 b.honroState.flags['event:'+ev.id]=true;b.honroState.pendingEvents=[];assert.equal(A.state(b).complete,true);
});
check('authoring is a pure objective overlay; all original geometry, enemies, events and other maps remain exact',()=>{
 const map=plain(g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===11));map.initialState.honroAct2Steps=plain(profile.honroBattle.honroAct2Steps);delete map.initialState.honroStage11TraceExitRevision;
 const others=g.HONRO_PROJECT.stages.filter(s=>s.metadata.stageId!==11),input={stages:[map,...others]},before=plain(map),out=X.author(input);
 assert.deepEqual(map,before);for(let i=0;i<others.length;i++)assert.equal(out.stages[i+1],others[i]);const wanted=plain(map);wanted.initialState.honroAct2Steps=without(wanted.initialState.honroAct2Steps);wanted.initialState.honroStage11TraceExitRevision=1;
 assert.deepEqual(plain(out.stages[0]),wanted);assert.deepEqual(plain(X.author(out)),plain(out));
 assert.deepEqual(plain(g.HONRO_CONTENT.stages[10].steps.map(s=>s.id)),ids);
 const future=plain(map);future.initialState.honroStage11TraceExitRevision=2;assert.equal(X.author({stages:[future]}).stages[0],future);
 const compiled=g.HonroMaps.createBattle(out.stages[0],g.HONRO_PROJECT);assert.equal(compiled.honroStage11TraceExitRevision,1);assert.deepEqual(plain(compiled.honroAct2Steps.map(s=>s.id)),ids,'Shared map compiler supplies the same Stage View/Playtest plan');
});
let app=h.load(profile);app.continue();const migrated=plain(app.engine.b);
assert.deepEqual(plain(app.engine.b.honroAct2Steps.map(s=>s.id)),ids);assert.equal(A.current(app.engine.b).id,'trace');
// The earlier approved flying-body recovery still runs on Continue. Compare
// migration against a control mount with that same preexisting behavior enabled.
const controlProfile=plain(profile);controlProfile.honroBattle.honroStage11TraceExitRevision=1;
let control=h.load(controlProfile);control.continue();const baseline=plain(control.engine.b);delete baseline.honroStage11TraceExitRevision;
assert.deepEqual(migrated,expected(baseline),'New migration adds no unrelated Continue mutations');
app=h.load({...plain(profile),honroBattle:migrated});app.continue();assert.deepEqual(plain(app.engine.b),migrated);
app.export();app=h.load(await h.exported());app.continue();assert.deepEqual(plain(app.engine.b),migrated);
checks.push('production Continue/export/repeated Continue preserves the migrated battle exactly');console.log('PASS',checks.at(-1));
// Production Retry must construct the new plan, not resurrect the old cleanup.
h.click('retry');h.finish(app);let b=app.engine.b;
assert(X.active(b));assert.deepEqual(plain(b.honroAct2Steps.map(s=>s.id)),ids);assert.deepEqual(plain(b.honroNarrativeContent.steps.map(s=>s.id)),ids);assert.equal(A.current(b).id,'knot-west');
const fresh=plain(b);for(const id of ids){const q=plain(fresh);for(const step of ids)if(step!==id)A.memory(q).done[step]=true;assert.equal(A.state(q).complete,false,'Retained prerequisite '+id);}
for(const [progress,spawned,ready]of [[3,6,false],[4,3,false],[4,6,true]]){const q=plain(fresh);for(const id of ['knot-west','clear-west','knot-east'])A.memory(q).done[id]=true;A.memory(q).holds={'hold-knots':{progress,spawned}};assert.equal(A.satisfied(q,A.steps(q).find(s=>s.id==='hold-knots')),ready);}
checks.push('fresh/retry keeps both knots, west clearance, 4 rounds and 6 echo admissions, rescue and final trace');console.log('PASS',checks.at(-1));
check('pending optional responses neither vanish on migration nor reinstate global cleanup; terminal flush cannot spawn them',()=>{
 const b=plain(profile.honroBattle),ev=b.honroEvents.find(ev=>ev.honroStage11Response===1);delete b.honroState.flags['event:'+ev.id];b.honroState.pendingEvents=[ev.id];const old=plain(b);
 assert(X.upgradeBattle(b));assert.deepEqual(b,expected(old));assert.equal(A.current(b).id,'trace');assert.equal(g.HonroStage11RavineEncounters.blockedClear(b),null);
 A.memory(b).done.trace=true;assert.equal(A.state(b).complete,true,'Pending optional encounters are not an undisclosed final objective');
 const e=new C.Engine(b);b.phase='won';const before=plain(b);g.HonroEncounters.flush({engine:e,actorBoundary:b.active});assert.deepEqual(plain(b),before);
});
// Final investigation: actual interaction/outcome, with one explicitly placed
// actor at the untouched trace marker. The 37 living optional foes stay alive.
app=h.load(profile);app.continue();b=app.engine.b;const e=app.engine,trace=b.honroMarkers.find(m=>m.id==='trace'),actor=e.active;
assert.equal(app.checkMission(e),false);assert.equal(app.isOpen(g.HONRO_CONTENT.stages[11]),false);
assert.equal(g.HonroInteractions.eligibility(app,trace).ok,false);Object.assign(actor,{x:trace.x,y:trace.y,vx:0,vy:0});
const near=b.units.find(u=>u.side===1&&!u.dead&&!u.honroAct2Boss&&!u.honroSubdued),pose={x:near.x,y:near.y};Object.assign(near,{x:trace.x+100,y:trace.y});assert.equal(g.HonroInteractions.eligibility(app,trace).ok,false,'The local interaction-safety gate still applies');Object.assign(near,pose);
const enemyHP=plain(b.units.filter(u=>u.side===1&&!u.dead).map(u=>[u.id,u.hp])),limit=b.honroGrowth.limit.end;
assert(g.HonroInteractions.eligibility(app,trace).ok);assert(g.HonroInteractions.use(app,trace));assert.equal(b.phase,'won');assert(A.memory(b).done.trace);
const clue=(g.HonroObjectiveRevision.contentFor(b,app.stage)||app.stage).beats.trace.map(row=>row[1]);
assert(clue.length);for(const text of clue)assert(b.honroState.storyQueue.some(row=>row[1]===text),'Retained trace discovery is actually queued');
assert.deepEqual(plain(b.units.filter(u=>u.side===1&&!u.dead).map(u=>[u.id,u.hp])),enemyHP);
app.outcome();for(const text of clue)assert(app.dialogue?.lines.some(row=>row[1]===text),'Final investigation survives the outcome queue merge');h.finish(app);if(!app.done)app.outcome(true);
assert(app.profile.cleared[11]);assert(app.isOpen(g.HONRO_CONTENT.stages[11]));for(const cls of ['archer','mage','knight','occultist'])assert.equal(app.profile.heroes[cls].xp,limit);
const xp=plain(b.heroes);g.HonroProgression.complete(b);assert.deepEqual(plain(b.heroes),xp,'First-clear top-up remains exactly once');
checks.push('real trace E wins with 37 survivors, retains northern clue/outro, preserves first-clear XP and unlocks chapter12');console.log('PASS',checks.at(-1));
app=h.load(profile);app.continue();b=app.engine.b;const resident=b.units.find(u=>u.honroProtected);resident.hp=0;resident.dead=true;A.memory(b).done.trace=true;
assert(app.checkMission(app.engine));assert.equal(b.phase,'lost');assert(b.winnerReason.includes('보호하던 주민'));
checks.push('rescued resident protection still takes precedence over victory');console.log('PASS',checks.at(-1));
await report('stage11-trace-exit',checks,{scope:'Authorized objective-only migration; controlled final-E spatial fixture, not normal trace-route completion or browser proof.'});
