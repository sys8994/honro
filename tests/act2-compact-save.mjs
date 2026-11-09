/** Real App save lifecycle with DOM/storage doubles; no browser/play claim. */
import assert from 'node:assert/strict';
import {appHarness,plain} from './app-regression-helpers.mjs';
process.env.HONRO_ACT2_COMPACT='0';
const old=await appHarness({productionStory:true}),a=old.load(old.profileThrough(11));a.launch(12);a.flushBattleSave();const profile=plain(a.profile);assert.equal(profile.honroBattle.honroCampaignMapRevision,512);
delete process.env.HONRO_ACT2_COMPACT;
const current=await appHarness({productionStory:true}),app=current.load(profile);
assert(!current.g.HonroCampaignMapRevision.obsolete(app.profile.honroBattle));
app.continue();
const projection=b=>({width:b.width,height:b.height,revision:b.honroCampaignMapRevision,terrain:b.terrain,units:b.units.map(u=>Object.fromEntries(['id','x','y','hp','focus','acted','moveLeft'].map(k=>[k,u[k]]))),state:b.honroState,story:b.honroStory,growth:b.honroGrowth});
assert.deepEqual(plain(projection(app.engine.b)),projection(profile.honroBattle));assert.deepEqual(plain(app.profile.heroes),profile.heroes);
app.stopBattle();app.profile.honroBattle=null;app.launch(12);const b=app.engine.b;
assert.deepEqual([b.width,b.height,b.honroCampaignMapRevision],[6400,5000,612]);assert.equal(b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget).length,24);
assert.equal(b.honroReviewedSceneRevision,512);
console.log('PASS old512 full geography/actors/resources/progress/dialogue/growth retained; new entry612 compact24');
