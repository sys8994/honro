/** Continuation of the exact R18 normally settled run. Not a combat replay. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness} from './candidate-harness.mjs';
import {createPlayerOperations} from './player-operations.mjs';
const dir='_local/reports/stage40-finishing-01',raw=await readFile(dir+'/final-profile.json'),saved=JSON.parse(raw);
assert.equal(saved.cleared['40'].rounds,18);assert(saved.honroAct4.completed['40'].success);
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true,productionInputActions:true}),{g,C}=h;g.performance={now:()=>0};
const app=h.load(saved);g.HonroApp=app;app.continue();assert.equal(app.screen,'rest',JSON.stringify({screen:app.screen,locked:app.profileStore.locked,notice:app.lastNotice,dialogue:app.dialogue}));
const ops=createPlayerOperations({app,g,C});for(let n=0;n<1200&&!app.profile.equipment.rewardLedger.eq_so_t3b.notified;n++)ops.frame();assert(app.profile.equipment.rewardLedger.eq_so_t3b.notified);
// Compare all important state, permitting only the observed ordinary UI notification.
const expected=JSON.parse(raw);expected.equipment.rewardLedger.eq_so_t3b.notified=true;
const project=p=>JSON.stringify(Object.fromEntries(['cleared','heroes','equipment','honroAct4','recruited'].map(k=>[k,p[k]])));
assert.equal(project(app.profile),project(expected));const stable=project(app.profile);const next=h.reload();g.HonroApp=next;next.continue();assert.equal(next.screen,'rest');assert.equal(project(next.profile),stable);
const rows=next.profile.honroAct4.completed['40'].rows,reviewed=JSON.parse(await readFile('shared/data/act4/reviewed.json'));const required=reviewed.scenes.filter(s=>s.stage===40).flatMap(s=>s.lines.map(r=>r[0]));assert(required.length);for(const row of required)assert(rows.includes(row));
const result={status:'passed',sourceProfileSha256:createHash('sha256').update(raw).digest('hex'),totalRounds:18,normalReload:true,stableSecondReload:true,storyRows:rows,normalNotificationTransition:true,scope:'Exact normally settled R18 profile reload. Original run remains harness-error after settlement; not a new combat run or browser/fun acceptance.'};await writeFile(dir+'/settled-reload.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
