import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {supportPoint} from '../shared/act4-finale-revision.mjs';

process.env.HONRO_ACT4_RELEASE = '1';
const g = await runtime({legacyMaps:false, productionStory:true});
const C = g.HONRO_CORE;
const world = JSON.parse(await readFile('shared/data/act4/world.json','utf8'));
const before = world.stages.find(s => s.metadata.stageId === 37);
const after = g.HONRO_PROJECT.stages.find(s => s.metadata.stageId === 37);

function battle(stage) {
 const p = g.HonroMaps.profileFor(stage);
 p.settings.difficulty = 'story';
 g.HonroEquipment.migrate(p);
 const b = g.HonroMaps.createBattle(stage, g.HONRO_PROJECT, p, {origin:'campaign'});
 return new C.Engine(b, () => {});
}
function roster(e) {
 return e.b.units.map(u => [u.id, u.side, u.hp, u.attack, u.armor, [...u.loadout]]);
}
const oldEngine = battle(before), newEngine = battle(after);
assert.equal(JSON.stringify(roster(newEngine)), JSON.stringify(roster(oldEngine)));
assert.equal(JSON.stringify(newEngine.b.terrain), JSON.stringify(oldEngine.b.terrain));
assert.equal(newEngine.b.enemyLimit, oldEngine.b.enemyLimit);
assert.equal(JSON.stringify(newEngine.b.honroAct4Design), JSON.stringify(oldEngine.b.honroAct4Design));
assert(newEngine.b.units.every(u => C.validTerrainContactPose(newEngine.b.terrain, u)));

// Both copies use the same ordinary rest point on the climbing route.
// Isolate the existing hound's action at this specific enemy-turn boundary.
function houndTurn(e, stage) {
 const target = e.unit('archer'), hound = e.unit('a4-37-a-1');
 Object.assign(target, supportPoint(stage, 'approved37-lower-diagonal', 1225));
 hound.awake = true;
 hound.acted = false;
 Object.assign(e.b, {side:1, phase:'enemy', queue:[hound.id], active:hound.id});
 const hp = target.hp;
 const tier = C.rankEnemyQueue(e, [hound])[0].tier;
 for (let i = 0; i < 2000 && e.b.side === 1; i++) e.tick(C.STEP);
 assert.equal(e.b.side, 0);
 return {tier, damage:hp-target.hp};
}
const oldTurn = houndTurn(oldEngine, before), newTurn = houndTurn(newEngine, after);
assert.equal(oldTurn.damage, 0);
assert.equal(newTurn.tier, 2);
assert(newTurn.damage > 0);
console.log('Stage 37 approach, existing hound action:', oldTurn, '→', newTurn);
