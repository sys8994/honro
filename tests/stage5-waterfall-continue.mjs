/** Actual App Continue/retry boundaries using an explicit old-map progress fixture. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g}=h,current=g.HONRO_PROJECT,old=plain(current);old.stages[4]=JSON.parse(await readFile('tests/fixtures/stage5-waterfall/before-lake.json','utf8'));g.HONRO_PROJECT=old;
let app=h.load(h.profileThrough(4));app.launch(5);h.finish(app);assert.equal(app.engine.b.honroStage5LakeRevision,undefined);
// This is a save compatibility fixture, not a played old-stage completion.
g.HonroQuestTargets.records(app.engine.b).find(t=>t.id==='cliff-cleat').hp=311;app.engine.b.units.find(u=>u.id==='cliff-cleat').hp=311;app.engine.b.honroState.flags['stage5-test-old-progress']=true;app.export();const saved=await h.exported(),expected=plain(saved.honroBattle);g.HONRO_PROJECT=current;
for(const imported of [false,true]){app=imported?h.load(h.profileThrough(4)):h.load(saved);if(imported)await h.import(saved);app.continue();assert.deepEqual(plain(app.engine.b),expected,'Old in-progress geometry, state and durability remain exact');assert.equal(app.engine.b.honroStage5LakeRevision,undefined);}
app.pause();h.click('retry');h.finish(app);assert.equal(app.engine.b.honroStage5LakeRevision,1);assert.equal(g.HonroQuestTargets.records(app.engine.b).find(t=>t.id==='cliff-cleat').hp,520);assert.equal(app.engine.b.honroState.flags['stage5-test-old-progress'],undefined);assert(app.engine.b.terrain.some(t=>t.id==='waterfall-cliff'));
await report('stage5-waterfall-continue',['Old stage5 progress survives App Continue and file import without map or state rewrite','Actual retry starts the new cliff/cave/waterfall revision and resets target durability'],{fixture:'Frozen old Stage5 map plus explicit partial target HP/flag. DOM/storage/render doubles; no normal-play claim.'});console.log('PASS old5 Continue/import and new retry boundary');
