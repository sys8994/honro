/** Isolated phase/occupancy/Continue fixtures, not normal-play evidence. */
import assert from'node:assert/strict';import{runtime,battlefield}from'../game/tests/helpers.mjs';import{appHarness,plain}from'./app-regression-helpers.mjs';import{mkdir,writeFile}from'node:fs/promises';
const g=await runtime({legacyMaps:false}),R=g.HonroStage2Airborne,C=g.HONRO_CORE,rows=[];
function setup(source){const q=battlefield(g,2);g.HonroAllies.attach(q.app,q.e);const ev=q.b.honroEvents.find(ev=>ev.id===source),action={...plain(ev.action),source};return{...q,ev,action};}
for(const source of ['road-pressure','sniper-seen']){
 const q=setup(source),{b,e,app,action}=q;assert.equal(g.HonroEncounters.populationCap(b),12);for(const id of ['foe-0','foe-3'])Object.assign(e.unit(id),{dead:true,hp:0});const count=b.units.length,next=b.nextId;app.actorBoundary='npc-damheo';b.phase='ally';
 assert.equal(g.HonroAllies.execute(app,action),false);assert.equal(b.units.length,count);assert.equal(b.nextId,next);const w=b.honroState.stage2Airborne.waves[source];assert(w.warning.inProgress);assert.equal(app.notices.length,1);
 g.HonroAllies.execute(app,action);assert.equal(app.notices.length,1,'No repeated warning while pending');
 b.phase='aim';b.active='p-archer';b.side=0;e.active.acted=false;delete app.actorBoundary;
 e.canAct();assert(!w.offered,'Readiness/renderer call is not an input');e.wait();assert(!w.released,'Already-running actor serial cannot answer a warning');
 b.phase='aim';e.active.acted=false;b.round++;b.honroState.actorTurnSerial=(b.honroState.actorTurnSerial||0)+1;e.wait();assert(w.released&&w.offered&&w.response);
 assert.equal(g.HonroAllies.execute(app,action),false,'No entry outside an actual actor boundary');
 b.phase='transition';app.actorBoundary='p-archer';
 // Full-height fixed non-enemy fixture bodies occupy every candidate air/ground
 // lane without changing enemy capacity. The real placement code must wait.
 const blockers=[500,1500,2500,3500].map((x,i)=>({...plain(e.unit('objective')),id:'occupancy-fixture-'+i,x,y:3300,r:600,h:3300,honroAlly:false,honroCivilian:false}));b.units.push(...blockers);
 assert.equal(g.HonroAllies.execute(app,action),false);assert.equal(b.nextId,next);assert.equal(b.honroCounters.spawned,0);assert.equal(b.units.length,count+blockers.length);assert(w.blocked,'Real occupied placement reports a wait');
 assert.equal(g.HonroAllies.execute(app,action),false);assert.equal(b.nextId,next);assert.equal(app.notices.length,1);
 b.units=b.units.filter(u=>!u.id.startsWith('occupancy-fixture-'));assert.equal(g.HonroAllies.execute(app,action),true);const born=b.units.slice(count);assert.equal(born.length,2);assert.equal(b.honroCounters.spawned,2);assert.equal(b.nextId,next+2);assert.equal(w.entry.ids.length,2);assert(w.entry.serial>w.warning.serial);for(const u of born.filter(C.flyingEnemy))assert(C.flightClear(e,u,u));
 const after=JSON.stringify(b);assert.equal(g.HonroAllies.execute(app,action),true);assert.equal(JSON.stringify(b),after,'Repeated safe boundary cannot duplicate entry');
 rows.push({source,warning:plain(w.warning),response:plain(w.response),entry:plain(w.entry),born:born.map(u=>({id:u.id,kind:u.honroType,x:u.x,y:u.y,hp:u.hp,attack:u.attack}))});
}
console.log('PASS Both original2+2 waves: warning, genuinely new input, safe boundary, occupied wait, atomic resume, full-body air clearance and one-time entry');
for(const source of ['road-pressure','sniper-seen'])for(const phase of ['won','lost']){const {b,e,app,action}=setup(source);app.actorBoundary='fixture';assert.equal(g.HonroAllies.execute(app,action),false);const count=b.units.length,next=b.nextId;b.phase=phase;e.tick(C.STEP);assert.equal(b.honroState.stage2Airborne.waves[source].cancelled,phase);assert.equal(g.HonroAllies.execute(app,action),false);assert.equal(b.units.length,count);assert.equal(b.nextId,next);}
console.log('PASS Death/victory cancel pending warnings without publishing or consuming any wave');
for(const source of ['road-pressure','sniper-seen']){const q=setup(source);q.b.honroState.flags['event:'+source]=true;const before=JSON.stringify(q.b);assert.equal(g.HonroAllies.execute(q.app,q.action),true);assert.equal(JSON.stringify(q.b),before,'Already completed legacy event is never rewarned or respawned');}
console.log('PASS Legacy completed events are exact no-ops');
const h=await appHarness(),p=plain(h.g.AppRegression.fresh());p.cleared[1]={visits:1,rounds:5};let app=h.load(p);app.launch(2);h.finish(app);const event=app.engine.b.honroEvents.find(ev=>ev.id==='sniper-seen'),a={...plain(event.action),source:event.id};app.actorBoundary='fixture';assert.equal(h.g.HonroAllies.execute(app,a),false);delete app.actorBoundary;app.export();let data=await h.exported(),before=plain(data.honroBattle);app=h.load(data);app.continue();assert.deepEqual(plain(app.engine.b),before,'Pending warning survives real App export/load/Continue exactly');app.export();data=await h.exported();app=h.load(data);app.continue();assert.deepEqual(plain(app.engine.b),before);assert.equal(h.g.HonroAllies.execute(app,a),false,'Continue alone does not offer input or spawn');
console.log('PASS Pending warning remains pending and unchanged across repeated production App export/Continue');
await mkdir('_local/reports/stage2-airborne',{recursive:true});await writeFile('_local/reports/stage2-airborne/wave-contracts.json',JSON.stringify({method:'isolated-fixture',rows},null,2));
