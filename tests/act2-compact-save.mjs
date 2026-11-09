/** Real App save lifecycle with DOM/storage doubles; no browser/play claim. */
import assert from 'node:assert/strict';
import {appHarness,plain} from './app-regression-helpers.mjs';
const id=Number(process.argv[2]||12),spec={12:[6400,5000,24],13:[5200,4600,23],14:[4800,5400,24],15:[5800,4200,22]}[id];assert(spec);
process.env.HONRO_ACT2_COMPACT='0';
const old=await appHarness({productionStory:true}),a=old.load(old.profileThrough(id-1));a.launch(id);a.flushBattleSave();const profile=plain(a.profile);assert.equal(profile.honroBattle.honroCampaignMapRevision,500+id);
delete process.env.HONRO_ACT2_COMPACT;
const current=await appHarness({productionStory:true}),app=current.load(profile);
assert(!current.g.HonroCampaignMapRevision.obsolete(app.profile.honroBattle));
app.continue();
const projection=b=>({width:b.width,height:b.height,revision:b.honroCampaignMapRevision,terrain:b.terrain,units:b.units.map(u=>Object.fromEntries(['id','x','y','hp','focus','acted','moveLeft'].map(k=>[k,u[k]]))),state:b.honroState,story:b.honroStory,growth:b.honroGrowth});
assert.deepEqual(plain(projection(app.engine.b)),projection(profile.honroBattle));assert.deepEqual(plain(app.profile.heroes),profile.heroes);
app.stopBattle();app.profile.honroBattle=null;app.launch(id);const b=app.engine.b;
assert.deepEqual([b.width,b.height,b.honroCampaignMapRevision],[spec[0],spec[1],600+id]);assert.equal(b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget).length,spec[2]);
assert.equal(b.honroReviewedSceneRevision,500+id);
console.log('PASS chapter'+id+' existing geography/actors/resources/progress/dialogue/growth retained; fresh compact entry');
