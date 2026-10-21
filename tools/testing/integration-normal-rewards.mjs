/** Verify genuine integration-victory saves; terminal import is not a new playthrough. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {appHarness,plain} from '../../tests/app-regression-helpers.mjs';
const h=await appHarness(),rows=[];
const inputs=[{stage:2,file:'_local/reports/integration-20261021/stage2-normal/profile-terminal.json'}, {stage:5,file:'_local/reports/stage5-positioning/fullplay.json',key:'profile'}];
const view=p=>plain(Object.fromEntries(['heroes','loadouts','cleared','honroGrowth','recruited','party','record'].map(k=>[k,p[k]??null])));
for(const q of inputs){const raw=JSON.parse(await readFile(q.file,'utf8')),profile=q.key?raw[q.key]:raw;let a=h.load(profile);a.continue();h.finish(a);a.outcome();h.finish(a);
 const after=view(a.profile);assert(a.profile.cleared[q.stage]);
 for(let n=0;n<2;n++){a.outcome();assert(!a.dialogue,'Completed outcome must not replay its outro');h.finish(a);assert.equal(a.profile.honroBattle,null,'Completed outcome must not recreate a terminal save');assert.deepEqual(view(a.profile),after,'Repeated outcome cannot duplicate rewards');a.export();const saved=await h.exported();await h.import(saved);if(a.profile.honroBattle){assert.equal(a.profile.honroBattle.phase,'won');a.continue();h.finish(a);a.outcome();h.finish(a);}assert.deepEqual(view(a.profile),after,'Normal-victory import preserves SP/loadouts/XP and exact reward ledger');}
 rows.push({stage:q.stage,source:q.file,repeat:2,profile:after});console.log('PASS stage',q.stage,'real normal win import/outcome2, XP/SP/loadout/reward preservation');
}
await writeFile('_local/reports/integration-20261021/normal-reward-contracts.json',JSON.stringify({scope:'Actual integration win files, production App save path with DOM/storage doubles; not another combat run',rows},null,2));
