/** Production App lifecycle regressions in explicit objective/occupancy setup.
 * This is not a claim of normal arrival or chapter completion. Only the named
 * setup stages remove foes, mark prior goals, and place supported test actors.
 * Warning, player wait, actor-end admission, export and Continue are production. */
import assert from 'node:assert/strict';
import {runtimeParts} from '../shared/build.mjs';
import {authorEncounterDensity} from '../tools/map-forge/apply-encounter-density.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h,D=g.HonroEncounterDensity,rows=[];
let project=JSON.parse(await readFile('shared/data/campaign.json','utf8'));project=plain(await authorEncounterDensity(project,g,{stages:[16,17,18]}));g.HONRO_PROJECT=project;
const runtimeSha256=createHash('sha256').update((await runtimeParts({vector:false,render:false})).join('\n')).digest('hex'),stageSha256=Object.fromEntries([16,17,18].map(n=>[n,createHash('sha256').update(JSON.stringify(project.stages[n-1])).digest('hex')]));
let now=10000;g.performance={now:()=>now};
const specs=[{n:16,goal:'hold-hall',source:'hold-hall-0',memory:'templeDefense',kind:'stoneLantern',support:'tm-great-hall-plinth',xs:[6000,6120,6240,6360]},
 {n:17,goal:'hold-hoist',source:'hold-hoist-0',memory:'worksiteDefense',kind:'minecart',support:'ws-axle-footing',xs:[8410,8530,8650,8770]},
 {n:18,goal:'hold-silence',source:'hold-silence-0',memory:'bellDescent',kind:'bellCluster',support:'sb-suppression-court',xs:[2820,2940,3060,3180]}];
function place(b,u,support,x){const p=g.HonroMapEngine.surfaceY(b.terrain,x,undefined,support);assert(p);Object.assign(u,{x,y:p.y,vx:0,vy:0});assert(C.validTerrainContactPose(b.terrain,u));}
function fixture(s){
 g.HONRO_PROJECT=plain(project);const profile=h.profileThrough(s.n-1),app=h.load(profile);app.launch(s.n);h.finish(app);now+=10000;
 const b=app.engine.b,e=app.engine;
 for(const u of e.alive(1)){u.dead=true;u.hp=0;}e.checkEnd=()=>false;
 const a=g.HonroAct2.memory(b);if(s.n===18)a.events['keeper-retaliation']=true;const steps=g.HonroAct2.steps(b);for(const step of steps){if(step.id===s.goal)break;a.done[step.id]=true;}
 for(const ev of b.honroEvents)b.honroState.flags['event:'+ev.id]=true;b.honroState.pendingEvents=[];
 if(s.n===17)for(const t of b.terrain)if(t.id==='gate-repair')t.broken=true;
 for(const[i,u]of e.heroesAlive().entries())place(b,u,s.support,s.xs[i]);
 // Old intro unit-turn stories are outside this isolated objective window.
 app.profile.seen??={};app.profile.seen['act2:first-spirit-encounter']=true;
 const notices=[],event=app.event.bind(app);app.event=text=>{notices.push({serial:b.honroState.actorTurnSerial||0,round:b.round,text});return event(text);};
 return{app,b,e,notices};
}
const born=(q,s)=>q.b.units.filter(u=>u.honroSpawnSource===s.source);
function step(q){now+=C.STEP*1000;q.e.tick(C.STEP);if(q.app.dialogue)h.finish(q.app);q.app.missionTick(C.STEP);}
function waitFor(q,predicate,limit=2000,drive=false){for(let i=0;i<limit&&!predicate();i++){if(drive&&q.e.canAct())q.e.wait();step(q);}if(!predicate())console.log('TIMEOUT',JSON.stringify({stage:q.b.honroStage,phase:q.b.phase,side:q.b.side,active:q.b.active,dialogue:!!q.app.dialogue,goal:g.HonroAct2.current(q.b),state:q.b.honroState,enemies:q.e.alive(1).map(u=>({id:u.id,source:u.honroSpawnSource,x:u.x,y:u.y}))}));assert(predicate(),'Condition reached through production ticks');}
function warn(q,s){q.app.missionTick(0);h.finish(q.app);q.app.missionTick(0);const w=q.b.honroState[s.memory]?.warnings[s.source];assert(w,s.source+' actual objective warning');assert.equal(born(q,s).length,0);return w;}
function waitAction(q){assert(q.e.canAct());const actor=q.e.active;q.e.wait();assert(actor.acted||q.b.phase!=='aim','Wait accepted as ordinary action');return actor.id;}
function entries(q,s){return s.n===16?q.b.honroTempleDefenseEntries[0]:s.n===17?q.b.honroWorksiteDefenseEntries[0]:q.b.honroBellDescent.entries.hold[0];}
for(const s of specs){
 const q=fixture(s),w=warn(q,s),serial=w.serial;
 // An enemy-side boundary never counts as the response opportunity.
 q.app.actorBoundary='fixture-enemy-boundary';q.b.honroState.actorTurnSerial++;
 assert.equal(g.HonroAllies.execute(q.app,{type:'spawn',source:s.source,kind:s.kind,n:3}),false);
 q.app.actorBoundary=null;assert(!w.opportunity);assert.equal(born(q,s).length,0);
 const actor=waitAction(q);waitFor(q,()=>born(q,s).length===3,2000,true);
 assert(w.opportunity&&w.opportunity.id===actor&&w.opportunity.serial>serial);
 assert(q.b.honroState[s.memory].entries[s.source].serial>=w.opportunity.serial,'Admission follows the first opportunity at a safe boundary');
 assert.equal(g.HonroAct2.memory(q.b).holds[s.goal].spawned,3);
 rows.push({stage:s.n,source:s.source,kind:'actual-objective-warning-player-action-admission',warning:plain(w),entry:plain(q.b.honroState[s.memory].entries[s.source]),spawnedIds:born(q,s).map(u=>u.id),notices:q.notices});
 console.log('PASS lifecycle',s.source,'real warning -> actual hero wait -> admission');
}
for(const s of specs){
 let q=fixture(s);const at=entries(q,s),choices=[at,...(at.alternates||[])];
 const heroes=q.e.heroesAlive();for(const[i,entry]of choices.entries())place(q.b,heroes[i],entry.surfaceId||entry.support,entry.x);
 const guard=heroes.find((_,i)=>i>=choices.length);assert(guard);q.e.select(guard.id);
 const w=warn(q,s),count=q.b.units.length;waitAction(q);waitFor(q,()=>!!w.opportunity);
 assert.equal(q.b.units.length,count,'Occupied entry cannot partially spawn');assert.equal(born(q,s).length,0);assert.equal(g.HonroAct2.memory(q.b).holds[s.goal].spawned,0);
 q.app.export();const exported=await h.exported(),saved=plain(exported.honroBattle),snapshot=plain({units:saved.units,state:saved.honroState,queue:saved.queue,round:saved.round,phase:saved.phase,active:saved.active});
 const app=h.load(exported);app.continue();q={app,e:app.engine,b:app.engine.b,notices:[]};
 assert.deepEqual(plain({units:q.b.units,state:q.b.honroState,queue:q.b.queue,round:q.b.round,phase:q.b.phase,active:q.b.active}),snapshot,'Continue preserves pending occupied entry exactly');q.e.checkEnd=()=>false;h.finish(q.app);
 // Clear only our occupancy fixture. Runtime must not move/delete occupants.
 for(const[i,u]of q.e.heroesAlive().entries())place(q.b,u,s.support,s.xs[i]);
 const originalIds=new Set(q.b.units.map(u=>u.id));
 if(!q.e.canAct())waitFor(q,()=>q.e.canAct());waitAction(q);waitFor(q,()=>born(q,s).length===3,2000,true);
 assert.equal(q.b.units.length,count+3);assert(q.b.units.filter(u=>!originalIds.has(u.id)).every(u=>u.honroSpawnSource===s.source));
 const countAfter=q.b.units.length;q.app.missionTick(0);assert.equal(q.b.units.length,countAfter);
 q.b.phase='won';q.app.actorBoundary=q.e.heroesAlive()[0].id;
 assert.equal(g.HonroAllies.execute(q.app,{type:'spawn',source:s.source,kind:s.kind,n:3}),false);assert.equal(q.b.units.length,countAfter);
 rows.push({stage:s.n,source:s.source,kind:'occupied-primary-and-alternates-export-continue-resume-terminal-no-spawn',entryChoices:choices,warningBeforeExport:plain(w),continuedSnapshotExact:true,spawnedIds:born(q,s).map(u=>u.id),entry:plain(q.b.honroState[s.memory].entries[s.source]),terminalSpawnBlocked:true});
 console.log('PASS lifecycle',s.source,'occupied -> exact Continue -> cleared fixture -> once -> terminal block');
}

// Every authored new event uses the same real App action boundary. Occupying
// the last member of BOTH entry choices catches partial first-member spawns.
for(const s of specs)for(const source of project.stages[s.n-1].events.filter(ev=>ev.honroDensityResponse).map(ev=>ev.id)){
 let q=fixture(s);const ev=q.b.honroEvents.find(ev=>ev.id===source),a=g.HonroAct2.memory(q.b);
 a.done[ev.honroDensityTrigger.objectiveDone]=true;
 for(const step of g.HonroAct2.steps(q.b).filter(step=>step.wave))a.holds[step.id]={progress:0,spawned:step.wave.count,lastRound:q.b.round,enteredRound:q.b.round,continuous:true,guarded:true,contested:false};
 delete q.b.honroState.flags['event:'+source];
 const choices=[ev.action.actions,...ev.honroDensityAlternatives];
 q.b.stakes=choices.map((members,i)=>{const m=members.at(-1);return{id:'density-occupancy-'+i,x:m.x,y:m.y,active:true,expires:1000};});
 q.app.missionTick(0);h.finish(q.app);q.app.missionTick(0);
 const w=D.memory(q.b).warnings[source];assert(w,source+' actual objective-event warning');
 const before=plain({units:q.b.units,nextId:q.b.nextId,counters:q.b.honroCounters});
 q.app.actorBoundary='fixture-enemy-boundary';q.b.honroState.actorTurnSerial++;
 assert.equal(g.HonroAllies.execute(q.app,ev.action),false);q.app.actorBoundary=null;assert(!w.opportunity);
 waitAction(q);waitFor(q,()=>!!w.opportunity);
 assert.equal(q.b.units.length,before.units.length,'Blocked late member admits nobody');assert.equal(q.b.nextId,before.nextId);assert.deepEqual(plain(q.b.honroCounters),before.counters);
 assert(!D.memory(q.b).entries[source]);assert(q.b.honroState.pendingEvents.includes(source));
 q.app.export();const exported=await h.exported(),saved=plain(exported.honroBattle),snapshot=plain({units:saved.units,state:saved.honroState,queue:saved.queue,round:saved.round,phase:saved.phase,active:saved.active,stakes:saved.stakes});
 const app=h.load(exported);app.continue();q={app,e:app.engine,b:app.engine.b,notices:[]};
 assert.deepEqual(plain({units:q.b.units,state:q.b.honroState,queue:q.b.queue,round:q.b.round,phase:q.b.phase,active:q.b.active,stakes:q.b.stakes}),snapshot,'New-event warning, opportunity, occupancy and queue survive Continue');q.e.checkEnd=()=>false;h.finish(q.app);
 // Clear only the explicitly authored test stakes, never a real occupant.
 q.b.stakes=[];if(!q.e.canAct())waitFor(q,()=>q.e.canAct());waitAction(q);
 waitFor(q,()=>!!D.memory(q.b).entries[source],2000,true);
 const entry=D.memory(q.b).entries[source],members=q.b.units.filter(u=>u.honroSpawnSource===source);assert.equal(members.length,3);assert.equal(entry.ids.length,3);assert.equal(entry.choice,0);
 const after=q.b.units.length;D.prepare(q.app);assert.equal(q.b.units.length,after);assert.equal(q.b.honroState.flags['event:'+source],true);
 // A separately rearmed pending copy exercises terminal cancellation without
 // pretending that a completed event can run twice in production.
 const cancelled={...plain(ev),id:source+'-terminal',action:{...plain(ev.action),source:source+'-terminal'}};q.b.honroEvents.push(cancelled);q.b.honroState.pendingEvents.push(cancelled.id);q.b.phase='won';D.prepare(q.app);
 assert.equal(q.b.honroState.flags['event:'+cancelled.id],'cancelled:battle-ended');assert(!q.b.honroState.pendingEvents.includes(cancelled.id));assert.equal(q.b.units.length,after);
 rows.push({stage:s.n,source,kind:'new-event-real-warning-hero-opportunity-atomic-occupied-continue-resume-once-terminal',trigger:ev.honroDensityTrigger,warning:plain(w),blockedChoices:choices.map(members=>members.at(-1)),continuedSnapshotExact:true,entry:plain(entry),spawnedIds:members.map(u=>u.id),terminalCopyCancelled:true});
 console.log('PASS lifecycle',source,'warning -> hero wait -> atomic blocked choices -> exact Continue -> once');
}
await mkdir('_local/reports/encounter-density',{recursive:true});await writeFile('_local/reports/encounter-density/stage161718-response-lifecycle.json',JSON.stringify({projectSha256:createHash('sha256').update(JSON.stringify(project)).digest('hex'),runtimeSha256,stageSha256,scope:'Explicit production App objective/occupancy regressions, not normal arrival/fullplay. Actual chapter warning, input wait, actor-end admission, export and Continue; initial defeated actors/prior objective flags/hero placements are setup.',rows},null,2)+'\n');
