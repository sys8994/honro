/** Candidate roster/activation/reward/save boundary contracts; not a playthrough. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {authorStage5Waterfall} from '../tools/map-forge/stage5-waterfall.mjs';
const h=await appHarness(),{g,C}=h,p=JSON.parse(await readFile('game/docs/stage-review/stage05-diagnosis/evidence/entry-profile.json','utf8')).profile,project=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
const authored=authorStage5Waterfall(project,g);assert.deepEqual(plain(authored),project,'Canonical author is idempotent');
assert.deepEqual(plain(authored.stages.filter(s=>s.id!=='stage-5')),project.stages.filter(s=>s.id!=='stage-5'),'Other29 maps exact');
let a=h.load(plain(p));a.launch(5);h.finish(a);let b=a.engine.b,e=a.engine;
assert.equal(e.alive(1).length,12);assert.equal(e.alive(1).filter(u=>u.elite).length,0);assert(!b.units.some(u=>u.id.endsWith('-cluster')));
assert.equal(b.enemyLimit,4);assert.equal(g.HonroEncounters.populationCap(b),20);assert.equal(b.honroEvents.find(v=>v.id==='lower-beasts').action.n,6);
assert.deepEqual(plain(e.alive(1).filter(u=>u.awake).map(u=>u.honroStage5Cell)),['entry','entry','entry','entry']);
const expected={hound:268,boar:268,human:268,stag:268,bat:182,crow:209};for(const u of e.alive(1))assert.equal(u.maxHp,expected[u.honroVariant],u.id+' keeps old normal HP60% exactly');
const limit=plain(b.honroGrowth.limit),contribution=plain(b.honroGrowth.ledger.stages[5].contribution),loadouts=plain(a.profile.loadouts),heroes=plain(a.profile.heroes),cleared=plain(a.profile.cleared);
const historical=JSON.parse(await readFile('game/docs/stage-review/stage05-diagnosis/evidence/native.json','utf8')).initial;
assert.deepEqual(limit,plain(historical.honroGrowth.limit),'Stage growth budget exact');
for(const key of ['total','combatLimit','actors','factors'])assert.deepEqual(contribution[key],historical.honroGrowth.ledger.stages[5].contribution[key]);
for(const [difficulty,mult]of Object.entries(C.DIFFICULTIES)){const d=plain(p);d.settings.difficulty=difficulty;const battle=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[4],g.HONRO_PROJECT,d,{origin:'campaign'});assert.equal(battle.units.filter(u=>u.side===1&&!u.honroObjectiveTarget).length,12);for(const u of battle.units.filter(u=>u.side===1&&!u.honroObjectiveTarget)){const old=historical.units.find(v=>v.honroVariant===u.honroVariant&&!v.honroObjectiveTarget);assert.equal(u.maxHp,Math.round(Math.round(old.combatBaseHp/.6*mult.hp)*.6),difficulty+' preserves original difficulty→HP60 rounding');}}
// A shot at a dormant cell is allowed and alerts that cell, not the far shore.
const target=e.unit('foe-4');e.hurt(target,1,'p-archer',false);assert(e.alive(1).filter(u=>u.honroStage5Cell==='ritual').every(u=>u.awake));assert(e.alive(1).filter(u=>u.honroStage5Cell==='shore').every(u=>!u.awake));
a.export();const saved=await h.exported(),before=plain(b);a=h.load(saved);a.continue();assert.deepEqual(plain(a.engine.b.units),before.units,'Same revision Continue retains all bodies/resources');assert.deepEqual(plain(a.engine.b.honroState.stage5Positioning),before.honroState.stage5Positioning,'Alerts survive Continue');
const oldProfile=plain(p);oldProfile.honroBattle=historical;oldProfile.lastStage=5;a=h.load(oldProfile);a.continue();h.finish(a);
assert.equal(a.engine.alive(1).length,12);assert.equal(a.engine.b.honroCampaignMapRevision,3);assert.equal(a.engine.b.round,1);
assert.deepEqual(plain(a.profile.heroes),heroes,'Obsolete battle restart preserves growth/SP/ranks');assert.deepEqual(plain(a.profile.loadouts),loadouts);assert.deepEqual(plain(a.profile.cleared),cleared);
for(const sid of [1,2,4,6,12])assert.equal(g.HonroCampaignMapRevision.current(sid),({1:7,2:6,4:4,6:3,12:0})[sid],'Only Stage5 map revision changes');
console.log('PASS Stage5 candidate12/HP60/3 cells/cap4+20/wave6/growth and same+old revision saves');
