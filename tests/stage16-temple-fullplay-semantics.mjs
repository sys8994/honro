/** Stage16 mission/save fixtures. Explicit synthetic state; never fullplay evidence. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {appHarness, plain} from './app-regression-helpers.mjs';
import {campaignEntryReadiness, prepareCamp} from './stage16-temple-fullplay-helper.mjs';
const h = await appHarness(), {g, C} = h;
let virtualMs = 0; g.performance = {now: () => virtualMs};
vm.runInContext(await readFile('shared/runtime/interactions.js', 'utf8'), g);
const readiness = campaignEntryReadiness(g), profile = plain(g.AppRegression.fresh());
prepareCamp(g, profile, readiness);
const app = h.load(profile); app.launch(16); h.finish(app); virtualMs += 10000;
const e = app.engine, b = e.b, a = g.HonroAct2.memory(b), steps = g.HonroAct2.steps(b);
assert.deepEqual(plain(steps.map(s => s.id)), ['clear-court','monk','hall','hold-hall','record','clear-temple','witness']);
assert.equal(b.honroActiveLimit, 4);
const validPoses = new Map(b.units.map(u => [u.id, {x:u.x, y:u.y, jumping:u.jumping}]));
const rememberNewPoses = () => {for (const u of b.units) if (!validPoses.has(u.id)) validPoses.set(u.id, {x:u.x, y:u.y, jumping:u.jumping});};
const initialRoster = e.alive(1).map(u => u.id), monk = e.unit('resident-1'), civilian = e.unit('objective');
assert.deepEqual(plain(initialRoster), plain(g.HONRO_PROJECT.stages[15].units.filter(u => u.team === 'enemy').map(u => u.id)), 'Exactly the current authored roster');
assert.equal(monk.maxHp, 950); assert.equal(civilian.maxHp, 1900);
const marker = b.honroMarkers.find(m => m.id === 'monk'), spirit = e.unit(marker.spiritId), archer = e.heroesAlive().find(u => u.cls === 'archer'), sodan = e.heroesAlive().find(u => u.cls === 'occultist');
// Scene-fixture separation: only this isolated contract test relocates entities.
a.done['clear-court'] = true;
for (const foe of e.alive(1)) if (foe !== spirit) {foe.x = 100; foe.y = 100;}
sodan.x = archer.x = marker.x; sodan.y = archer.y = marker.y;
b.active = sodan.id;
assert.equal(g.HonroObjectives.interactionTarget(b, marker), marker, 'Act2 rescue distance remains authored-marker based');
assert.match(g.HonroAct2.eligibility(app, marker).reason, /40%/);
spirit.hp = spirit.maxHp * .4;
assert(g.HonroAct2.eligibility(app, marker).ok, 'Exactly 40% is eligible for Sodan');
b.active = archer.id;
assert.match(g.HonroAct2.eligibility(app, marker).reason, /소단/);
b.active = sodan.id;
const hpBefore = monk.hp;
assert(g.HonroInteractions.use(app, marker));
assert.equal(monk.hp, hpBefore); assert.equal(monk.shield, Math.round(monk.maxHp * .3));
assert(monk.honroResolved && spirit.dead && spirit.honroReleased && marker.collected);
assert.deepEqual(plain(a.rescued), ['resident-1']);
assert.equal(g.HonroInteractions.use(app, marker), false, 'Repeat rescue cannot duplicate rewards');
h.finish(app); virtualMs += 10000;
a.done.hall = true;
const hold = steps.find(s => s.id === 'hold-hall'), area = b.honroMarkers.find(m => m.id === hold.id);
assert.equal(hold.rounds, 5); assert.equal(hold.wave.count, 10);
assert.equal(hold.radius, 680); assert.equal(hold.contestRadius, 260);
for (const hero of e.heroesAlive()) {hero.x = area.x; hero.y = area.y;}
for (const foe of e.alive(1)) {foe.x = 100; foe.y = 100;}
const blocker = e.alive(1)[0]; blocker.x = area.x; blocker.y = area.y;
app.actorBoundary = sodan.id;
g.HonroAct2.tick(app, 0); rememberNewPoses();
const defense = a.holds[hold.id];
for (let round = 0; round < 5; round++) {
 b.round++;
 for(let turn=0;turn<2;turn++){b.honroState.actorTurnSerial=(b.honroState.actorTurnSerial||0)+1;g.HonroAct2.tick(app,0);rememberNewPoses();}
 assert.equal(defense.progress, 0, 'Contesting enemy prevents defense progress');
 for (const foe of e.alive(1)) if (foe !== blocker) {foe.x = 100; foe.y = 100;}
}
assert.equal(defense.spawned, 10, 'Finite four waves total exactly ten');
const telegraphs=g.HonroStage16Temple.memory(b);
for(const [source,entry] of Object.entries(telegraphs.entries)) assert(entry.serial>telegraphs.warnings[source].serial, 'Every wave waits for a later actor boundary');
assert.deepEqual(Object.values(telegraphs.entries).map(e=>e.side), ['west','east','west','east']);
for (const foe of e.alive(1)) {foe.x = 100; foe.y = 100;}
g.HonroAct2.tick(app, 0); b.round++; g.HonroAct2.tick(app, 0);
assert.equal(defense.progress, 0, 'Interrupted round does not count');
for (let round = 1; round <= 5; round++) {b.round++; g.HonroAct2.tick(app, 0); assert.equal(defense.progress, round);}
g.HonroAct2.tick(app, 0);
assert(a.done[hold.id]); assert.equal(g.HonroAct2.current(b).id, 'record');
assert.equal(g.HonroAct2.failure(b), null);
monk.hp = 0; assert.match(g.HonroAct2.failure(b), /주민/); monk.hp = hpBefore;
civilian.hp = 0; assert.match(g.HonroAct2.failure(b), /주민/); civilian.hp = civilian.maxHp;
h.finish(app); virtualMs += 10000;
for (const u of b.units) {const p=validPoses.get(u.id); u.x=p.x; u.y=p.y; if(p.jumping===undefined) delete u.jumping; else u.jumping=p.jumping;}
app.export(); const exported = await h.exported();
const keys = ['units','terrain','items','round','phase','side','active','honroState','honroGrowth','honroMarkers','honroEvents'];
const preserve = battle => Object.fromEntries(keys.map(key => [key, battle[key]]));
const restored = h.load(exported); restored.continue();
assert.deepEqual(plain(preserve(restored.engine.b)), plain(preserve(exported.honroBattle)), 'Production Continue preserves complete mission, protected NPC, waves, turn and growth snapshot');
const out = '_local/reports/stage16-temple/semantics'; await mkdir(out, {recursive:true});
await writeFile(`${out}/readiness-ledger.json`, JSON.stringify(readiness, null, 2));
await writeFile(`${out}/summary.json`, JSON.stringify({passed:true,initialEnemies:initialRoster.length,xp:readiness.xp,level:readiness.level,defense:plain(defense),savedKeys:keys,scope:'Synthetic mission contract and save fixtures only. Not normal play or browser evidence.'}, null, 2));
console.log('PASS Stage16 real reward ledger, legal refund/train/4-slot builds, rescue threshold and ownership, protected residents, five uncontested full rounds, ten finite waves and exact Continue (contract fixtures only)');
