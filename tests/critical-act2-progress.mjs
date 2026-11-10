/** Focused production model probes. Hero poses and progress prerequisites are
 * explicit fixtures; these are neither normal campaign clears nor browser play. */
import assert from 'node:assert/strict';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness({productionStory:true}),g=h.g,V=g.HonroAct23V4,P=g.HonroAct23V4ReviewedChapters,S=g.HonroAct23V4Act2Scenes,B=g.HonroAct23V4Act2;
let app,b;
function launch(n){const p=h.profileThrough(n-1);p.seen['act2:first-spirit-encounter']=true;app=h.load(p);app.launch(n);app.turnNotice=null;b=app.engine.b;h.finish(app);Object.assign(b,{side:0,phase:'aim'});}
function pose(u,p){Object.assign(u,p,{vx:0,vy:0,airborne:false,jumping:false,acted:false});}
function tick(){V.tick(app,.025);if(!app.dialogue)app.engine.stepUnits(.025);}
function resume(){app.stopBattle();app=h.load(plain(app.profile));app.continue();app.turnNotice=null;b=app.engine.b;}
launch(12);const mage=V.heroes(b).find(u=>u.cls==='mage');pose(mage,b.honroV4Recurrence.landmark);tick();h.finish(app);
assert.equal(S.memory(b).loop.actor,mage.id);
assert.match(V.state(b).currentInstruction,/같은 동행으로 왕복/);
assert.equal(V.state(b).targets[0].x,b.honroV4Recurrence.checkpoint.x);
const actor=S.memory(b).loop.actor;resume();assert.equal(S.memory(b).loop.actor,actor);assert.match(V.state(b).currentInstruction,/같은 동행으로 왕복/);
// A different hero at the checkpoint cannot satisfy the bound actor's trip.
pose(V.heroes(b).find(u=>u.cls==='archer'),b.honroV4Recurrence.checkpoint);tick();assert.equal(S.memory(b).loop.phase,'out');assert(!S.memory(b).proof['12.recurrence']);
S.memory(b).loop.phase='return';assert.equal(V.state(b).targets[0].x,b.honroV4Recurrence.landmark.x);
console.log('PASS 12 bound-actor guidance/checkpoint/return and same-revision Continue; return phase is a declared fixture');

launch(14);const plugin=V.plugins.get(14),extract=V.steps(b).find(s=>s.id==='14.extract'),marker=V.marker(b,'14.extract'),q=P.memory(b);
// A late saved battle may already have physical hypnosis proof while the mage
// has not yet spoken. The renderer and use must agree about that state.
q.events.hypnosis={status:'done'};q.events.warning={status:'done'};
assert.equal(plugin.eligibility(app,marker,extract).ok,false);assert.equal(plugin.use(app,marker,extract),false);
q.events.separate={status:'playing'};assert.equal(plugin.eligibility(app,marker,extract).ok,false);
q.events.separate.status='done';
const old=g.HonroAct23V4Reviewed14.separated(b);assert(!old);
assert.notEqual(plugin.eligibility(app,marker,extract)?.ok,false,'dialogue ready still delegates physical eligibility');
resume();assert.equal(P.memory(b).events.separate.status,'done');assert(!g.HonroAct23V4Reviewed14.separated(b),'no extraction or completion is invented by migration');
console.log('PASS 14 pre-dialogue disabled interaction and saved prerequisite preservation; prerequisite states are fixtures');

launch(17);h.finish(app);const workers=['17.mason','17.gilchan'].map(id=>app.engine.unit(id)),w=B.worksite(b),a=B.memory(b);
// Only the load prerequisite is injected. Worker coordinates remain their
// authored initial supported poses; ordinary walk/body integration does the trip.
a.proof['17.load-test']={locksClosed:true,ropeTaut:true};
const gil=workers[1],blocker=V.heroes(b).find(u=>u.cls==='archer');
for(const [i,u]of V.heroes(b).entries())pose(u,{x:5900+i*70,y:2580});
pose(blocker,{x:gil.x-55,y:gil.y});
for(let i=0;i<100;i++){B.advanceWorksite(app,.025);app.engine.stepUnits(.025);}
assert(!a.proof['17.withdraw'],'destination threat prevents false withdrawal');assert(!g.HonroAct23V4Reviewed17.complete(b));
const destination=b.honroV4Worksite.withdraw.gilchan;
const threats=b.units.filter(u=>u.side===1&&V.alive(u)&&V.near(u,destination,200));
assert.deepEqual(plain(threats.map(u=>u.id)),['a2-enemy-18']);
assert.match(V.state(b).currentInstruction,/길찬 철수 대기 · 왼쪽/);
assert.equal(V.state(b).targets[0].x,threats[0].x);
// Declared local combat result; other enemies remain. The destination threat
// legitimately stops withdrawal, even though it is outside the worker radius.
for(const u of threats){u.hp=0;u.dead=true;}
pose(blocker,{x:5900,y:2580});
assert.match(V.state(b).currentInstruction,/석공 철수 통로 · 길찬이 길을 비켜야 함/);
assert.equal(V.state(b).targets[0].x,gil.x);
for(let i=0;i<700&&!a.proof['17.withdraw'];i++){if(i%100===0)b.round++;B.advanceWorksite(app,.025);app.engine.stepUnits(.025);}
assert(a.proof['17.withdraw'],JSON.stringify({actors:w.actors,workers:workers.map(u=>({id:u.id,x:u.x,y:u.y})),dest:b.honroV4Worksite.withdraw}));
for(const u of workers)assert(u.honroV4Withdrawn&&g.HONRO_CORE.validTerrainContactPose(b.terrain,u));
assert(!g.HonroAct23V4Reviewed17.complete(b),'withdrawal alone cannot replace installation, defense, rotation and separation');
const positions=workers.map(u=>({id:u.id,x:u.x,y:u.y}));resume();assert.deepEqual(['17.mason','17.gilchan'].map(id=>{const u=app.engine.unit(id);return{id,x:u.x,y:u.y};}),positions);
console.log('PASS 17 authored initial mount → actual withdrawal, destination enemy blockage/release, no false settlement, Continue; load proof/one local enemy death are fixtures');
