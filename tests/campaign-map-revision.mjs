/** Focused save compatibility: production App with DOM/storage doubles. */
import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g}=h,checks=[];
function launch(id){const app=h.load(h.profileThrough(id-1));app.launch(id);h.finish(app);return app;}
function saved(app){app.stopBattle();return plain(app.profile);}
// Same-revision Continue keeps projectiles, geometry, actor positions and story.
let app=launch(21),p=saved(app),expected=plain(p.honroBattle);assert.equal(expected.honroCampaignMapRevision,1);
app=h.load(p);app.continue();assert.deepEqual(plain(app.engine.b),expected);checks.push('same revision exact Continue');
// Missing revision discards only the battle and resumes this chapter.
p=saved(app);delete p.honroBattle.honroCampaignMapRevision;const hero=plain(p.heroes),cleared=plain(p.cleared),loadouts=plain(p.loadouts),settings=plain(p.settings);
p.honroBattle.terrain[0].x=-999999;p.honroBattle.projectiles.push({id:'obsolete-shot'});
app=h.load(p);assert.equal(app.profile.honroBattle,null);assert.equal(app.profile.honroMapRestart,21);app.continue();h.finish(app);
assert.equal(app.engine.b.honroStage,21);assert.equal(app.engine.b.honroCampaignMapRevision,1);assert(!app.engine.b.projectiles.length);assert.notEqual(app.engine.b.terrain[0].x,-999999);
for(const[key,value]of Object.entries({heroes:hero,cleared,loadouts,settings}))assert.deepEqual(plain(app.profile[key]),value,key+' preserved');checks.push('missing revision fresh same chapter, profile preserved');
// A newer battle export can own paid XP that its outer profile has not synced.
p=saved(app);p.honroBattle.honroCampaignMapRevision=0;p.honroBattle.heroes.archer.xp+=17;
const earned=p.honroBattle.heroes.archer.xp,paid=plain(p.honroBattle.honroGrowth.ledger);
app=h.load(p);assert.equal(app.profile.heroes.archer.xp,earned);assert.deepEqual(plain(app.profile.honroGrowth),paid);app.continue();h.finish(app);assert.equal(app.profile.heroes.archer.xp,earned);
p=saved(app);app=h.load(p);app.continue();h.finish(app);assert.equal(app.profile.heroes.archer.xp,earned);checks.push('paid snapshot XP/ledger recovered once without retry grant');
// V2 retries checkpoint resources, while earned XP/ledger stay spent.
app=launch(25);let b=app.engine.b;const cls=b.honroSplit.activeRoster[0],start=plain(b.honroSplit.starts[25]);
b.units.find(u=>u.cls===cls&&u.side===0).hp=0;b.units.find(u=>u.cls===cls&&u.side===0).dead=true;
g.HonroSplitCampaign.persist(app);p=saved(app);p.honroBattle.honroCampaignMapRevision=0;
const ledger=plain(p.honroGrowth);app=h.load(p);app.continue();h.finish(app);b=app.engine.b;
assert.deepEqual(plain(b.activeRoster),['archer','mage']);assert.equal(b.honroStage,25);for(const u of b.units.filter(g.HonroSplitCampaign.hero)){assert.equal(u.dead,!!start.vitals[u.cls].dead);assert.equal(u.hp,start.vitals[u.cls].hp);}assert.deepEqual(plain(app.profile.honroGrowth),ledger);checks.push('v2 stage25 checkpoint retry, ledger preserved');
// A V1 snapshot must not revive V1 party or content on the rebuilt stage.
p=saved(app);delete p.honroBattle.honroCampaignMapRevision;p.honroSplitCampaign.version=1;p.honroSplitCampaign.activeRoster=['knight','mage'];p.honroBattle.honroSplit=plain(p.honroSplitCampaign);
app=h.load(p);assert.equal(app.profile.honroSplitCampaign.version,2);assert.equal(g.HonroSplitCampaign.content(app.profile,25),null);app.continue();h.finish(app);assert.equal(app.engine.b.honroStage,25);assert.deepEqual(plain(app.engine.b.activeRoster),['archer','mage']);checks.push('v1 stage25 converted to v2 same chapter and party');
app=launch(26);p=saved(app);delete p.honroBattle.honroCampaignMapRevision;p.honroSplitCampaign.version=1;p.honroSplitCampaign.activeRoster=['archer','occultist'];p.honroBattle.honroSplit=plain(p.honroSplitCampaign);
app=h.load(p);app.continue();h.finish(app);assert.equal(app.engine.b.honroStage,26);assert.deepEqual(plain(app.engine.b.activeRoster),['knight','occultist']);checks.push('v1 stage26 converted to current workshop team');
// File import uses exactly the same contract, including a later split chapter.
app=launch(27);p=saved(app);p.honroBattle.honroCampaignMapRevision=0;app=h.load(h.profileThrough(26));await h.import(p);assert.equal(app.profile.honroMapRestart,27);app.continue();h.finish(app);assert.equal(app.engine.b.honroStage,27);assert.deepEqual(plain(app.engine.b.activeRoster),['archer','mage']);checks.push('file import restarts stage27 with correct team');
const custom=plain(app.engine.b);custom.honroMapOrigin='workshop';custom.honroCustom=true;delete custom.honroCampaignMapRevision;assert.equal(g.HonroCampaignMapRevision.obsolete(custom),false);checks.push('Workshop snapshot excluded');
await report('campaign-map-revision',checks);console.log('PASS',checks);
