/** Current art-only scope: exact all30/data, saved battle and retired writer safety. */
import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{spawnSync}from'node:child_process';
import{runtime}from'../game/tests/helpers.mjs';import{appHarness,plain}from'./app-regression-helpers.mjs';import{currentBierEntryProfile}from'./stage8-current-entry-helper.mjs';import{authorStage8Bier}from'../tools/map-forge/stage8-bier.mjs';
const g=await runtime({legacyMaps:false}),baseline=JSON.parse(await readFile(process.env.HONRO_BASELINE||'/tmp/stage8-master-baseline.json'));
assert.deepEqual(plain(g.HONRO_PROJECT),baseline,'All30 compiled maps/library/globals unchanged');
const bytes=await readFile('shared/data/campaign.json'),raw=JSON.parse(bytes),before=JSON.stringify(raw);
// The historical whole-map author refuses this restored raw input. Its guard
// must remain effective; no current geometry is silently replaced for a replay.
await assert.rejects(authorStage8Bier(raw,g),/Stage8 author changed another map/);assert.equal(JSON.stringify(raw),before);
for(let i=0;i<2;i++){const run=spawnSync(process.execPath,['tools/map-forge/apply-stage8-location-paint.mjs'],{encoding:'utf8'});assert.notEqual(run.status,0);assert.match(run.stderr,/image-terrain author retired/);assert.deepEqual(await readFile('shared/data/campaign.json'),bytes);}
const h=await appHarness();let app=h.load({...plain(h.g.AppRegression.fresh()),...plain(currentBierEntryProfile(h.g).profile)});app.launch(8);h.finish(app);const battle=plain(app.engine.b);app.export();const saved=await h.exported();app=h.load(saved);app.continue();assert.deepEqual(plain(app.engine.b),battle,'Unchanged revision preserves whole battle');assert.deepEqual(plain(app.profile.heroes),saved.heroes);
console.log('PASS all30/library exact, unchanged-revision Continue/growth, historical author guard and retired image CLI no-write twice');
