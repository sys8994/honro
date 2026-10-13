/** Explicit objective/roster fixtures, not normal Stage9 traversal or combat.
 * Real wait/ticks and App Continue exercise the existing Act1 spawn path. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h,D=g.HonroEncounterDensity,project=plain(g.HONRO_PROJECT),checks=[];
let now=10000;g.performance={now:()=>now};
const base=JSON.parse(execFileSync('git',['show','25ae85c:shared/data/campaign.json'],{encoding:'utf8',maxBuffer:50e6})),old=g.HonroMaps.createBattle(base.stages[8],base,undefined,{origin:'campaign'});assert(!D.active(old));
const s=project.stages[8],legacy=base.stages[8];for(const id of ['evac-beasts','evac-crows']){const a=s.events.find(e=>e.id===id),b=legacy.events.find(e=>e.id===id);assert.deepEqual(a.action,b.action);assert.deepEqual(a.when,b.when);assert(a.warning&&a.honroTacticalWarning===1);}
function fixture(id){g.HONRO_PROJECT=plain(project);const app=h.load(h.profileThrough(8));app.launch(9);h.finish(app);now+=10000;const e=app.engine,b=e.b;for(const u of e.alive(1)){u.hp=0;u.dead=true;}e.checkEnd=()=>false;for(const ev of b.honroEvents)b.honroState.flags['event:'+ev.id]=true;delete b.honroState.flags['event:'+id];b.honroState.pendingEvents=[];return{app,e,b,ev:b.honroEvents.find(e=>e.id===id)};}
const born=q=>q.b.units.filter(u=>u.honroSpawnSource===q.ev.id);
function warn(q){g.HonroEncounters.update(q.app,0,{progress:2000});D.prepare(q.app);return D.memory(q.b).existingWarnings[q.ev.id];}
function drive(q,p){for(let i=0;i<5000&&!p();i++){if(q.e.canAct())q.e.wait();now+=C.STEP*1000;q.e.tick(C.STEP);if(q.app.dialogue)h.finish(q.app);q.app.missionTick(C.STEP);}assert(p(),'Finite wait boundary admits '+q.ev.id);}
for(const id of ['evac-beasts','evac-crows']){
 const q=fixture(id),w=warn(q);assert(w);assert.equal(q.ev.action.n,6);assert.equal(born(q).length,0);q.app.actorBoundary='fixture-enemy';q.b.honroState.actorTurnSerial++;assert.equal(g.HonroAllies.execute(q.app,{...q.ev.action,source:id}),false);q.app.actorBoundary=null;assert(!w.opportunity);
 const saved=plain({units:q.b.units,state:q.b.honroState,events:q.b.honroEvents});q.app.export();await h.import(await h.exported());q.app.continue();h.finish(q.app);q.e=q.app.engine;q.b=q.e.b;q.e.checkEnd=()=>false;assert.deepEqual(plain(q.b.units),saved.units);assert.deepEqual(plain(q.b.honroState),saved.state);assert.deepEqual(plain(q.b.honroEvents),saved.events);
 drive(q,()=>born(q).length===6);const warning=D.memory(q.b).existingWarnings[id];assert(warning.opportunity&&warning.opportunity.serial>warning.serial);assert.deepEqual(plain(born(q).map(u=>u.honroContributionId)),Array.from({length:6},(_,i)=>'wave:'+id+':'+i));
 const lb=plain(q.b);lb.units=[];lb.nextId=Number(born(q)[0].id.replace('event-',''));delete lb.honroEncounterDensityRevision;const le=new C.Engine(lb,()=>{},false);assert.notEqual(g.HonroAllies.execute({...q.app,engine:le},{...q.ev.action,source:'legacy-strength'}),false);const strength=u=>Object.fromEntries(['honroVariant','elite','maxHp','attack','armor','combatBaseHp','combatBaseAttack','xpBudget'].map(k=>[k,u[k]]));assert.deepEqual(plain(born(q).map(strength)),plain(lb.units.map(strength)));assert.equal(q.b.enemyLimit,lb.enemyLimit);
 const ids=plain(born(q).map(u=>u.id));for(let i=0;i<4;i++){D.prepare(q.app);g.HonroEncounters.flush(q.app);}assert.deepEqual(plain(born(q).map(u=>u.id)),ids);
 const lost=fixture(id);warn(lost);lost.b.phase='lost';D.prepare(lost.app);assert.equal(born(lost).length,0);assert.equal(lost.b.honroState.flags['event:'+id],'cancelled:battle-ended');
 checks.push(id+' six original Act1 bodies/strength/XP; warning→real wait→safe spawn, pending Continue, no duplicate, defeat cancellation');
}
await report('tactical-stage9-warning',checks,{scope:'Explicit setup fixtures. Old9 remains unopted; no geometry, population, kind, strength, cap or objective change.'});console.log('PASS',checks);
