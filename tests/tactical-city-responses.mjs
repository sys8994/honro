/** Explicit lifecycle/occupancy fixtures. Not normal arrival/combat evidence.
 * Prior objectives, enemy removal and test stakes are setup only; warning,
 * player wait, atomic spawn, contribution identity and App Continue are real. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
import {applyTacticalCityResponses} from '../tools/map-forge/tactical-city-responses.mjs';
const h=await appHarness(),{g,C}=h,D=g.HonroEncounterDensity,project=plain(g.HONRO_PROJECT),checks=[];
let now=10000;g.performance={now:()=>now};
assert.deepEqual(applyTacticalCityResponses(project),project,'Author is idempotent after final shared pipeline');
const baseline=JSON.parse(execFileSync('git',['show','25ae85c:shared/data/campaign.json'],{encoding:'utf8',maxBuffer:50e6}));
for(const n of [21,24]){const old=g.HonroMaps.createBattle(baseline.stages[n-1],baseline,undefined,{origin:'campaign'});assert(!D.active(old));assert(!old.honroEncounterDensityRevision);const snap=plain(old),e=new C.Engine(old,()=>{},false);g.HonroEncounters.attach({engine:e},e);assert.deepEqual(plain(old.honroState),snap.honroState);assert.deepEqual(plain(old.units),snap.units);checks.push(n+' old frozen battle does not opt in');}
assert(g.HonroAuthored.inside({x:6350,y:2410},project.stages[23].events.find(e=>e.id==='act3-response-24-2').honroDensityTrigger.region),'Centered region includes actual low document approach');
for(const n of [13,28])assert(!D.active({honroStage:n,honroEncounterDensityRevision:1}));
function fixture(n,id){g.HONRO_PROJECT=plain(project);const app=h.load(h.profileThrough(n-1));app.launch(n);h.finish(app);now+=10000;const e=app.engine,b=e.b;for(const u of e.alive(1)){u.hp=0;u.dead=true;}e.checkEnd=()=>false;
 const ev=b.honroEvents.find(v=>v.id===id);for(const v of b.honroEvents)b.honroState.flags['event:'+v.id]=true;delete b.honroState.flags['event:'+id];b.honroState.pendingEvents=[];
 b.honroState.act3.done[ev.honroDensityTrigger.objectiveDone]=true;
 if(ev.honroDensityTrigger.region){const r=ev.honroDensityTrigger.region,u=e.heroesAlive().at(-1);u.x=r.x+40;u.y=g.HonroMapEngine.surfaceY(b.terrain,u.x,undefined,'a3-foundation').y;}
 return{app,e,b,ev,n};}
function tick(q){now+=C.STEP*1000;q.e.tick(C.STEP);if(q.app.dialogue)h.finish(q.app);q.app.missionTick(C.STEP);}
function until(q,p){for(let i=0;i<5000&&!p();i++){if(q.e.canAct())q.e.wait();tick(q);}assert(p(),'Finite ordinary waits reach expected state '+q.ev.id);}
const born=q=>q.b.units.filter(u=>u.honroSpawnSource===q.ev.id);
for(const n of [21,24])for(const def of project.stages[n-1].events.filter(e=>e.honroDensityResponse)){
 const q=fixture(n,def.id),count=g.HonroEncounters.spawnCount(q.ev.action);D.prepare(q.app);const mem=D.memory(q.b),w=mem.warnings[def.id];assert(w);assert.equal(born(q).length,0);
 q.app.actorBoundary='fixture-enemy';q.b.honroState.actorTurnSerial++;assert.equal(g.HonroAllies.execute(q.app,q.ev.action),false);q.app.actorBoundary=null;assert(!w.opportunity);
 // Block the first member of BOTH whole-entry choices. No partial reservation.
 q.b.stakes=[q.ev.action.actions.at(-1),q.ev.honroDensityAlternatives[0][0]].map((a,i)=>({id:800+i,x:a.x,y:a.y-30,active:true,expires:999}));const next=q.b.nextId;
 until(q,()=>!!w.opportunity);assert.equal(born(q).length,0);assert.equal(q.b.nextId,next);assert.equal(mem.entries[def.id],undefined);
 const saved=plain({units:q.b.units,queue:q.b.queue,state:q.b.honroState});q.app.export();await h.import(await h.exported());q.app.continue();h.finish(q.app);q.e=q.app.engine;q.b=q.e.b;q.e.checkEnd=()=>false;
 assert.deepEqual(plain(q.b.units),saved.units);assert.deepEqual(plain(q.b.queue),saved.queue);assert.deepEqual(plain(q.b.honroState),saved.state);
 // Release only fixture stakes; admission must resume without a duplicate.
 q.b.stakes=[];until(q,()=>born(q).length===count);const m=D.memory(q.b);assert([0,1].includes(m.entries[def.id].choice));assert(m.entries[def.id].serial>=m.warnings[def.id].opportunity.serial);
 const legacyAction=plain(baseline.stages[n-1].events.find(v=>v.id===def.id).action),legacyBattle=plain(q.b);legacyBattle.units=[];delete legacyBattle.honroEncounterDensityRevision;const legacyEngine=new C.Engine(legacyBattle,()=>{},false);assert.notEqual(g.HonroAllies.execute({...q.app,engine:legacyEngine},{...legacyAction,source:'strength-comparison'}),false);assert.equal(legacyBattle.units.length,count);assert.equal(q.b.enemyLimit,legacyBattle.enemyLimit);
 const strength=u=>Object.fromEntries(['honroVariant','honroAct3Elite','maxHp','attack','armor','combatBaseHp','combatBaseAttack','xpBudget'].map(k=>[k,u[k]]));assert.deepEqual(plain(born(q).map(strength)),plain(legacyBattle.units.map(strength)),'Preserve original kind/elite/HP/attack/armor/XP strength');
 assert.deepEqual(plain(born(q).map(u=>u.honroContributionId)),Array.from({length:count},(_,i)=>'wave:'+def.id+':'+i));assert.equal(born(q).filter(u=>u.honroAct3Elite).length,n===24&&def.id.endsWith('-2')?1:0);
 const ids=born(q).map(u=>u.id),budget=born(q).reduce((a,u)=>a+u.xpBudget,0);for(let i=0;i<5;i++){D.prepare(q.app);g.HonroEncounters.flush(q.app);}assert.deepEqual(born(q).map(u=>u.id),ids);assert.equal(born(q).reduce((a,u)=>a+u.xpBudget,0),budget);
 checks.push(def.id+' warning→real wait→occupied atomic wait→Continue→safe entry; stable contribution/elite/XP identity');
 const ended=fixture(n,def.id);D.prepare(ended.app);ended.b.phase='lost';D.prepare(ended.app);assert.equal(born(ended).length,0);assert.equal(ended.b.honroState.flags['event:'+def.id],'cancelled:battle-ended');
}
{
 const q=fixture(24,'act3-response-24-0'),at=q.ev.action.actions.at(-1);q.b.stakes=[{id:955,x:at.x,y:at.y-30,active:true,expires:999}];D.prepare(q.app);until(q,()=>born(q).length===2);assert.equal(D.memory(q.b).entries[q.ev.id].choice,1);checks.push('24 occupied primary selects complete same-side alternate after actual player action');
}
await report('tactical-city-responses',checks,{scope:'Explicit isolated lifecycle fixtures; normal wave effect is independently recorded.',geometry:'Unchanged since 456114c'});console.log('PASS',checks);
