/** Forced terminal-state fixtures for report retention, NOT gameplay evidence. */
import assert from 'node:assert/strict';import {appHarness,plain,KEY} from './app-regression-helpers.mjs';import {loadPilotRuntime} from '../tools/stage31/pilot-runtime.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g;await loadPilotRuntime(g);
for(const id of [31,40]){
 const app=h.load(h.profileThrough(id-1));app.launch(id);h.finish(app);const b=app.engine.b;
 app.profile.honroClearReports={99:{version:1,stage:99}};b.phase='won';app.outcome(true);
 assert.equal(app.profile.honroClearReports[id]?.stage,id,'Act4 report retained after actual outcome path');assert.equal(app.profile.honroClearReports[99],undefined,'Invalid stage report removed');
 assert.equal(b.honroOutcomeSettled?.session,b.session);assert.equal(b.honroOutcomeSettled?.stage,id);assert.equal(b.honroOutcomeSettled?.visits,app.profile.cleared[id].visits);
 const before=plain(app.profile.honroClearReports[id]),stored=JSON.parse(h.storage.get(KEY));assert.deepEqual(stored.honroClearReports[id],before);
 const reloaded=h.reload();assert.deepEqual(plain(reloaded.profile.honroClearReports[id]),before);
 if(id===31){const settled=plain(app.profile);settled.honroBattle=plain(g.HonroProfileStore.compactBattleArt(b));settled.honroBattle.honroCampaignMapRevision=g.HonroCampaignMapRevision.current(id)-1;const loaded=h.load(settled);assert.equal(loaded.profileStore.locked,false,'stale save must remain readable');assert(loaded.profile.honroBattle==null,'committed stale battle retired');assert.equal(loaded.profile.lastStage,id);assert.equal(loaded.profile.honroMapRestart,undefined);assert.equal(loaded.profile.cleared[id].visits,settled.cleared[id].visits);const pending=plain(settled);delete pending.honroBattle.honroOutcomeSettled;pending.honroBattle.session+='-pending-replay';const resumed=h.load(pending);assert.equal(resumed.profile.honroBattle?.session,pending.honroBattle.session);assert.equal(resumed.profile.honroMapRestart,undefined);assert.equal(resumed.profile.cleared[id].visits,pending.cleared[id].visits);}

}
console.log('PASS Stage31/40 outcome report storage and reload, invalid-stage pruning and settlement receipts; synthetic terminal-state fixtures only.');
