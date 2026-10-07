// Production App persistence on pre-revision canonical maps. DOM/storage are
// doubles; no position fixture here is claimed as a normal-input playthrough.
import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
import {legacyObjectiveBattle} from './objective-legacy-helpers.mjs';
const h=await appHarness(),g=h.g,A=g.HonroAct3,checks=[];
for(const id of [22,23,27]){
 const p=h.profileThrough(id-1);let app=h.load(p);app.stageId=id;app.stage=g.HONRO_CONTENT.stages[id-1];app.training=false;
 const old=legacyObjectiveBattle(g,id,p);app.mount(old);old.units.find(u=>u.side===0).hp-=17;old.round=3;old.teamEnds[1]=2;
 // An unfinished historical device must stay unfinished across export/import.
 const device=old.terrain.find(t=>t.honroAct3Target);assert(device);device.hp-=13;
 g.HonroProgression.awardCombat(app.engine,app.engine.active,23);app.export();const exported=await h.exported(),before=plain(exported.honroBattle);
 await h.import(exported);app=h.reload();h.click('continue');
 for(const key of ['terrain','honroMarkers','honroAct3Steps','honroState','units','round','teamEnds','heroes','items','honroGrowth'])assert.deepEqual(plain(app.engine.b[key]),before[key],`old ${id}: Continue changed ${key}`);
 assert(!app.engine.b.honroObjectiveRevision);assert(A.steps(app.engine.b).some(s=>s.kind==='destroy'));assert.equal(app.engine.b.terrain.find(t=>t.id===device.id).hp,device.hp);
 const history=g.HonroObjectiveRevision.contentFor(app.engine.b,app.stage),help=g.HonroObjectives.help(app),current=A.current(app.engine.b);assert(history.guide);assert.equal(help.currentObjectiveId,current.id);assert(help.guide.includes(current.label),'short guidance must name the saved historical step');assert.equal(help.checklist.filter(s=>!s.done).length,1);
 const ledger=plain(app.engine.b.honroGrowth.ledger),heroes=plain(app.engine.b.heroes);h.click('retry');h.finish(app);
 assert.equal(app.engine.b.honroObjectiveRevision,2);assert(!A.steps(app.engine.b).some(s=>s.kind==='destroy'));assert(!app.engine.b.terrain.some(t=>t.id===device.id));assert.deepEqual(plain(app.engine.b.heroes),heroes);assert.deepEqual(plain(app.engine.b.honroGrowth.ledger),ledger);
 assert.equal(app.engine.b.round,1);assert.equal(A.memory(app.engine.b).checkpoints.length,0);assert.equal(A.sourceIssue(app.engine.b),null);
 checks.push(`Historical ${id} export/import/Continue exact; Retry selects revised objectives without replaying XP`);console.log('PASS',checks.at(-1));
}
await report('objective-save-compat',checks);
