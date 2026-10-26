/** Real candidate framework + production App stop/save/Continue, with DOM,
 * Canvas/audio/storage doubles from the existing harness. Prior work completion,
 * enemy deaths and supported hero poses are explicit fixtures; no normal combat,
 * traversal, browser or art acceptance claim. Pickups, hero death, recovery,
 * mesh work, checkpoint accounting and contribution credit use production code.
 */
import assert from 'node:assert/strict';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h,V=g.HonroAct23V4,P=g.HonroAct23V4Act2;
g.HONRO_ACT23_V4_PHASE_A=true;g.HONRO_PROJECT=V.author(g.HONRO_PROJECT,{enabled:true});
const partId='17.hoist-part',token='goal:interact:17.parts';
const site=(app,id)=>V.marker(app.engine.b,id),memory=app=>P.memory(app.engine.b);
const root=app=>V.mem(app.engine.b),contribution=app=>g.HonroProgression.contributionState(app.engine.b);
function combatFixture(app){for(const u of app.engine.b.units)if(u.side===1){u.hp=0;u.dead=true;}}
function actor(app,id,socket){const e=app.engine,b=e.b,u=e.unit(id),p=site(app,socket),surface=socket==='17.parts'?'ws-east-hoist-buttress':'act2-floor',x=socket==='17.parts'?p.x-70:p.x-60,y=g.HonroMapEngine.surfaceY(b.terrain,x,p.y,surface)?.y;assert(Number.isFinite(y));Object.assign(u,{x,y,vx:0,vy:0,airborne:false,jumping:false,acted:false});b.active=u.id;b.side=0;b.phase='aim';delete b.reviewFocus;assert(C.validTerrainContactPose(b.terrain,u));assert(e.grounded(u));assert(V.safe(app));return u;}
// Clear the hero from the workers' lane after an actual nearby handoff.
// Worker poses are never set by the fixture; only ordinary walk/body integration.
function advanceWorkers(app,owner){actor(app,owner,'17.mesh');let parked=false;for(let i=0;i<4000;i++){const w=P.worksite(app.engine.b),part=memory(app).proof['17.parts'];if(part.workerCarrier==='17.gilchan'&&!parked){Object.assign(app.engine.unit(owner),{x:9000,y:4580,vx:0,vy:0});parked=true;}if(w.delivery?.delivered&&w.actors['17.mason:join']?.arrived){actor(app,owner,'17.mesh');return;}V.tick(app,C.STEP);app.engine.stepUnits(C.STEP);}assert.fail('actual worker handoff/haul did not arrive');}
function finishReview(app){if(app.engine.b.phase==='review')app.engine.finishAction(true);}
function fresh(){const app=h.load(h.profileThrough(16));app.launch(17);h.finish(app);assert(V.active(app.engine.b));combatFixture(app);for(const id of ['17.work-threat','17.brace','17.hoist'])root(app).done[id]=true;return app;}
function snapshot(app){app.stopBattle();return plain(app.profile);}
function resume(profile){const app=h.load(plain(profile));app.continue();h.finish(app);assert(app.engine&&V.active(app.engine.b));return app;}
function audit(app){return plain({part:memory(app).proof['17.parts'],checkpoint:root(app).checkpoints.filter(q=>q.id==='17.parts'),slot:root(app).slots['objective:17.parts'],credit:contribution(app).objectives[token]});}
function assertOnce(app,baseline){assert.equal(root(app).checkpoints.filter(q=>q.id==='17.parts').length,1);assert.deepEqual(plain(contribution(app).objectives[token]),baseline.credit);assert.deepEqual(plain(root(app).slots['objective:17.parts']),baseline.slot);assert.equal(memory(app).proof['17.parts'].partId,partId);}
function kill(app,id){const u=app.engine.unit(id);app.engine.hurt(u,u.maxHp*100,undefined,false,undefined,undefined,'normal');assert(u.dead&&u.hp===0);assert.equal(V.failure(app.engine.b),null,'Other living heroes may recover the part');}
function pickup(app,id){actor(app,id,'17.parts');assert(V.eligibility(app,site(app,'17.parts')).ok);assert.equal(V.use(app,site(app,'17.parts')),true);finishReview(app);}

let app=fresh();const first=app.engine.heroesAlive().find(u=>u.cls==='archer').id;
pickup(app,first);assert.equal(V.current(app.engine.b).id,'17.mesh');const baseline=audit(app);assert(baseline.credit&&Object.values(baseline.credit).reduce((n,v)=>n+v,0)===5);assert.equal(baseline.checkpoint.length,1);assert.equal(baseline.part.carrier,first);assert.equal(baseline.part.returns,0);const terrain=plain(app.engine.b.terrain),alivePickup=snapshot(app);

// Saving while the original carrier is alive does not reopen the completed step.
app=resume(alivePickup);assert.deepEqual(audit(app),baseline);assert.equal(site(app,'17.parts').collected,true);assert.equal(root(app).done['17.parts'],true);
kill(app,first);const beforeDrop=snapshot(app);assert.equal(beforeDrop.honroBattle.honroState.act23v4.earlyAct2.proof['17.parts'].carrier,first,'Snapshot precedes recovery');
app=resume(beforeDrop);let part=memory(app).proof['17.parts'];assert.equal(part.carrier,null);assert.equal(part.lastCarrier,first);assert.equal(part.location,'socket');assert.equal(part.returns,1);assert.deepEqual(plain(part.socket),{x:6140,y:4718});assert.equal(root(app).done['17.parts'],false);assert.equal(site(app,'17.parts').collected,false);assert.equal(V.current(app.engine.b).id,'17.parts');assertOnce(app,baseline);const dropped=audit(app);
for(let i=0;i<3;i++)P.prepare(app.engine.b);assert.deepEqual(audit(app),dropped,'Repeated prepare cannot duplicate returns or credits');

// The already returned part remains exactly the same socket object on Continue.
const afterDrop=snapshot(app);app=resume(afterDrop);assert.deepEqual(audit(app),dropped);const second=app.engine.heroesAlive().find(u=>u.cls==='mage').id;
pickup(app,second);part=memory(app).proof['17.parts'];assert.equal(part.carrier,second);assert.equal(part.location,'carried');assert.equal(part.returns,1);assert.equal(part.reclaims,1);assert.deepEqual(plain(part.firstPickup),baseline.part.firstPickup);assert.equal(root(app).done['17.parts'],true);assert.equal(site(app,'17.parts').collected,true);assert.equal(V.current(app.engine.b).id,'17.mesh');assertOnce(app,baseline);
actor(app,second,'17.parts');assert.equal(V.use(app,site(app,'17.parts')),false,'A carried part cannot be duplicated by another click');assert.equal(part.reclaims,1);assertOnce(app,baseline);
const afterReclaim=snapshot(app);app=resume(afterReclaim);assert.equal(memory(app).proof['17.parts'].carrier,second);assert.equal(memory(app).proof['17.parts'].reclaims,1);assertOnce(app,baseline);

// Explicit supported destination pose isolates mesh work from route/combat QA.
combatFixture(app);advanceWorkers(app,second);actor(app,second,'17.mesh');assert(V.eligibility(app,site(app,'17.mesh')).ok);assert.equal(V.use(app,site(app,'17.mesh')),true);finishReview(app);actor(app,second,'17.mesh');for(let i=0;i<40&&!root(app).done['17.mesh'];i++)V.tick(app,.05);
assert(root(app).done['17.mesh']);assert.equal(root(app).checkpoints.filter(q=>q.id==='17.mesh').length,1);assert.equal(memory(app).proof['17.mesh'].parts.carrier,second);assert.equal(memory(app).proof['17.mesh'].parts.partId,partId);assertOnce(app,baseline);
kill(app,second);const installed=audit(app);for(let i=0;i<3;i++)P.prepare(app.engine.b);assert.deepEqual(audit(app),installed,'Committed mesh consumes the delivery and cannot reopen parts');assert.equal(root(app).done['17.parts'],true);assert.equal(site(app,'17.parts').collected,true);
app=resume(snapshot(app));assert.deepEqual(audit(app),installed);assert.equal(root(app).done['17.parts'],true);assert.equal(root(app).done['17.mesh'],true);assert.equal(site(app,'17.parts').collected,true);assertOnce(app,baseline);
console.log('PASS original pickup → carrier death → pre-drop Continue → same socket → post-drop Continue → new hero reclaim → reclaim Continue → mesh commit; one part, one parts checkpoint/slot/credit, no post-install reopening.');

// Losing a carrier during unfinished mesh work must not leave stale work active.
app=resume(alivePickup);combatFixture(app);advanceWorkers(app,first);actor(app,first,'17.mesh');assert(V.use(app,site(app,'17.mesh')));finishReview(app);actor(app,first,'17.mesh');for(let i=0;i<8;i++)V.tick(app,.05);assert(memory(app).work['17.mesh'].elapsed>0&&!memory(app).proof['17.mesh']);kill(app,first);P.tick(app,0);assert.equal(memory(app).work['17.mesh'],undefined);assert.equal(app.engine.unit('17.gilchan').honroV4Working,false);assert.equal(V.current(app.engine.b).id,'17.parts');assert.equal(memory(app).proof['17.parts'].returns,1);assertOnce(app,baseline);
console.log('PASS carrier loss also clears uncommitted mesh work without duplicating pickup progress or reward.');
// Compatibility fixture: previous candidate saves stored only carrier/pickup/serial.
const old=plain(beforeDrop),oldPart=old.honroBattle.honroState.act23v4.earlyAct2.proof['17.parts'];for(const key of ['partId','firstPickup','location','returns','reclaims'])delete oldPart[key];app=resume(old);assert.equal(memory(app).proof['17.parts'].partId,partId);assert.equal(memory(app).proof['17.parts'].returns,1);assert.equal(V.current(app.engine.b).id,'17.parts');pickup(app,app.engine.heroesAlive().find(u=>u.cls==='mage').id);assertOnce(app,baseline);
console.log('PASS previous candidate carrier/pickup/serial-only snapshot recovers the same part without replaying credit. Production App/model fixtures only.');
