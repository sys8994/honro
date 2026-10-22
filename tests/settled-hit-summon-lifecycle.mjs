/** Display-reference ownership at real Engine summon/hurt/newRound/prune boundaries.
 * Round boundaries are explicit fixtures, not a continuous gameplay/latency test.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {buildCore} from '../game/engine/build.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);
// Only the display-state contract is under test; no substitute body artwork.
vm.runInContext(`class Scene {constructor(){this.effects=[];this.arcFx={fxs:[]};}event(){}render(){}unitBody(){}};globalThis.HonroScene=Scene;`,g);
vm.runInContext(await readFile('shared/runtime/combat-feedback.js','utf8'),g);
const C=g.HONRO_CORE,scene=new g.HonroScene(),profile=C.defaults(),b=C.createBattle(1,profile,'skirmish',{party:['occultist'],wind:0});
const e=new C.Engine(b,ev=>scene.event(ev)),owner=e.heroesAlive().find(u=>u.cls==='occultist'),foe=e.alive(1)[0];
assert(owner&&foe,'Real battle has a summon owner and a damage source');
const expectStale=process.argv.includes('--expect-stale'),cycles=[];
for(let i=0;i<12;i++){
 const summon=e.spawnSummon(owner,'echo',owner.x+80,owner.y-80,1,1,false,undefined,'O08');
 while(b.round<summon.summonExpires)e.newRound();
 e.hurt(summon,1,foe.id);assert(summon.hurt>0&&!summon.dead);
 scene.settleHitFeedback(e,true);assert.equal(scene.hitFlashVisible(summon),false);
 scene.settleHitFeedback(e,false);assert(scene.settledHits.has(summon.id),'Resuming does not replay settled hurt');
 // The actual production round boundary expires and prunes the summon before
 // another physics substep consumes its remaining hurt presentation timer.
 e.newRound();assert(summon.dead&&summon.hurt>0);assert(!b.units.includes(summon),'Engine prune removed the actual object');
 const unchanged=JSON.stringify(b);scene.settleHitFeedback(e,false);assert.equal(JSON.stringify(b),unchanged,'Display cleanup never edits battle state');
 const stale=[...scene.settledHits.values()].filter(hit=>!b.units.includes(hit.unit));
 cycles.push({id:summon.id,round:b.round,hurt:summon.hurt,units:b.units.length,settledHits:scene.settledHits.size,orphanReferences:stale.length});
 assert.equal(stale.length,expectStale?i+1:0);
}
// Current live unit, repeated pause, resumed hurt decay, fresh damage, and
// subsequent pause/dialogue use the unchanged production event contract.
e.hurt(owner,1,foe.id);scene.settleHitFeedback(e,true);const hp=owner.hp;
assert.equal(scene.hitFlashVisible(owner),false);scene.settleHitFeedback(e,true);assert.equal(owner.hp,hp);
e.tick(C.STEP);scene.settleHitFeedback(e,false);assert.equal(scene.hitFlashVisible(owner),false);
e.hurt(owner,1,foe.id);assert.equal(scene.hitFlashVisible(owner),true,'New hit clears only its settled display entry');
scene.settleHitFeedback(e,false);assert.equal(scene.hitFlashVisible(owner),true);
scene.settleHitFeedback(e,true);assert.equal(scene.hitFlashVisible(owner),false,'Pause/dialogue settles the new hit');
for(let i=0;i<120;i++)e.tick(C.STEP);scene.settleHitFeedback(e,false);assert(!scene.settledHits.has(owner.id),'Finished live hurt is released');
e.hurt(owner,1,foe.id);scene.settleHitFeedback(e,true);
const restored=new C.Engine(JSON.parse(JSON.stringify(b))),again=restored.unit(owner.id);
scene.settleHitFeedback(restored,false);assert(!scene.settledHits.has(owner.id),'Replaced unit identity cannot retain the old object');
scene.settleHitFeedback(restored,true);assert.equal(scene.settledHits.get(owner.id).unit,again);assert.equal(scene.hitFlashVisible(again),false);
const result={expectStale,cycles,currentUnitPauseResumeNewHitPreserved:true,restoredIdentityPreserved:true,scope:'Real production Engine lifecycle and production display-state function. Explicit round-boundary fixtures; no Canvas pixel or gameplay-performance claim.'};
await mkdir('_local/reports/battle-runtime/settled-hits',{recursive:true});await writeFile('_local/reports/battle-runtime/settled-hits/'+(expectStale?'before':'after')+'.json',JSON.stringify(result,null,2));
console.log('PASS',expectStale?'reproduced 12 removed summons retained by settledHits':'12 summon lifecycles without orphan display references','and live pause/resume/new-hit/identity invariants');
