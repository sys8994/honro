// Objective-state fixtures, not normal-input play or a balance assessment.
// Keep the stage-14 defense gate observable independently of the gameplay bot.
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),{b,e,app}=battlefield(g,14);
g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);
const a=g.HonroAct2.memory(b),steps=g.HonroAct2.steps(b),s=steps.find(s=>s.id==='hold-refuge'),m=b.honroMarkers.find(m=>m.id===s.id);
assert.equal(s.rounds,6);assert.equal(s.wave.count,12);
for(const q of steps){if(q.id===s.id)break;a.done[q.id]=true;}
for(const u of e.heroesAlive()){u.x=m.x;u.y=m.y;}
for(const u of e.alive(1)){u.x=100;u.y=100;}
const blocker=e.alive(1)[0];blocker.x=m.x;blocker.y=m.y;
app.actorBoundary=e.active.id;
g.HonroAct2.tick(app,0);const h=a.holds[s.id];
assert(h.guarded);assert(h.contested);
for(let i=0;i<5;i++){b.round++;g.HonroAct2.tick(app,0);assert.equal(h.progress,0,'a live enemy contesting the refuge prevents progress');for(const u of e.alive(1))if(u!==blocker){u.x=100;u.y=100;}}
assert.equal(h.spawned,12,'waves are finite even when defense is contested');
for(const u of e.alive(1)){u.x=100;u.y=100;}
g.HonroAct2.tick(app,0);assert(!h.contested);
// The interruption must not count as a complete guarded round.
b.round++;g.HonroAct2.tick(app,0);assert.equal(h.progress,0);
for(let i=1;i<=6;i++){b.round++;g.HonroAct2.tick(app,0);assert.equal(h.progress,i);}
g.HonroAct2.tick(app,0);
assert(a.done[s.id]);assert.equal(h.spawned,12);assert.equal(g.HonroAct2.current(b).id,'clear-village');
assert.equal(e.unit('objective').maxHp,1900,'test never makes the protected resident stronger');
assert.equal(g.HonroAct2.failure(b),null);
e.unit('objective').hp=0;assert.match(g.HonroAct2.failure(b),/주민/,'resident loss remains a real failure');
console.log('PASS Stage 14 defense: contested zero, six full clear rounds, twelve finite reinforcements and resident-loss gate (fixtures only)');
