/** Reuse the genuine19-round terminal export/outcome assertions, then follow
 * production result/rest/entry APIs. No new16 combat run or prepared17 arrival. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {h,app} from './stage16-current-outcome-flow.mjs';
import {plain} from './app-regression-helpers.mjs';
const earned=plain(app.profile.heroes);assert(app.done);assert.equal(app.profile.cleared[16].visits,1);
h.click('result-continue');h.finish(app);if(app.screen==='rest')h.click('journey-enter',{id:'17'});h.finish(app);
assert.equal(app.engine.b.honroStage,17);assert.deepEqual(plain(app.engine.b.heroes),earned,'Actual17 arrival preserves earned growth');
app.export();const profile=await h.exported(),before=plain(app.engine.b),again=h.load(profile);again.continue();assert.deepEqual(plain(again.engine.b),before,'Actual17 whole-battle Continue exact');
const report={checkedCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),arrivedStage:17,earnedGrowthExact:true,wholeBattleContinueExact:true,single16Reward:true,entryHeroes:before.units.filter(u=>u.side===0),scope:'Final art source; production outcome of actual old R19 export -> result/rest/17 launch and export/Continue. Previous16 normal combat reused by byte-exact nonvisual contract; no new16 fullplay.'};
await mkdir('_local/reports/stage16-art-release-20261022',{recursive:true});await writeFile('_local/reports/stage16-art-release-20261022/handoff.json',JSON.stringify(report,null,2));console.log('PASS actual R19 outcome ->17 arrival/growth ->17 whole-battle export/Continue exact');
