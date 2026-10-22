/** Inspect the genuine R19 terminal export only, without replaying combat or
 * supplying new progress. Verify production outcome drains queued evidence. */
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {appHarness,plain} from './app-regression-helpers.mjs';
const record=JSON.parse(gunzipSync(await readFile('tests/fixtures/stage16-current-r19-20261022.json.gz'))),h=await appHarness(),app=h.load(record.profile);app.continue();const b=app.engine.b;
assert.deepEqual(plain(b),record.profile.honroBattle);assert.equal(b.phase,'won');assert.equal(b.round,19);assert(h.g.HonroAct2.state(b).complete);
const queued=plain(b.honroState.storyQueue),before=plain({done:app.done,act2:b.honroState.act2,heroes:b.heroes});assert.deepEqual(queued.map(l=>l[2].evidenceGoal),['hall','record']);
app.outcome();assert(app.dialogue);assert.equal(app.dialogue.after,'outcome');assert(!app.done,'Story remains before settlement');const lines=plain(app.dialogue.lines),ids=lines.map(l=>l[2]?.evidenceGoal),hall=ids.indexOf('hall'),evidence=ids.indexOf('record');assert(hall>=0&&evidence>hall);assert(lines.slice(evidence+1).some(l=>l[2]?.storyId?.endsWith('outcome-16')));assert.equal(b.honroState.storyQueue.length,0,'Pending beats merged into production outro');
// The same production finish path as the supported dialogue-skip UI action.
// No direct outcome(true) fallback or done/reward flag injection.
h.finish(app);assert(app.done,'Finishing the production outcome dialogue settles naturally');assert.equal(app.profile.cleared[16].visits,1);const earned=plain(app.profile.heroes);app.outcome();assert.deepEqual(plain(app.profile.heroes),earned);assert.equal(app.profile.cleared[16].visits,1);
const out='_local/reports/stage16-current-pacing-20261022';await mkdir(out,{recursive:true});await writeFile(out+'/outcome-flow.json',JSON.stringify({checkedCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),source:'19d9fc28623d2451e37cf665145cfdc3e2fdd51f',round:19,phaseAtInput:'won',goalCompleteAtInput:true,queuedAtInput:queued,dialogue:lines,hallIndex:hall,recordIndex:evidence,recordBeforeOutro:true,naturalFinishSettledOnce:true,unchangedDoneFacts:plain(b.honroState.act2.done),before,scope:'Real terminal export; production Continue/outcome/dialogue-finish inspected. No combat replay, no invented record-marker walk, no manual reward/done injection.'},null,2));console.log('PASS actual R19 won -> queued hall/record before outro -> production finish -> single settlement');
