/** Focused production App ownership/policy regression. Damage is an explicit
 * fixture; this is not the normal-input continuous campaign proof. */
import assert from 'node:assert/strict';
import {appHarness,plain,report,KEY} from './app-regression-helpers.mjs';
import {projectilePlatformProject} from './fixtures/projectile-platform-arena.mjs';
const h=await appHarness(),{g,click,finish}=h,checks=[];let app,original,normalOriginal;
const project=projectilePlatformProject(g);
function setup(debug=false){app=h.load(h.profileThrough(24));app.launch(25);finish(app);const u=app.engine.b.units.find(u=>u.cls==='mage'&&u.side===0);u.hp-=91;u.focus-=19;app.engine.b.items.heal=1;app.stopBattle();normalOriginal=plain(app.profile);if(debug){app.setDebugMode(true);finish(app);}original=plain(app.profile);app.launchMap(project,project.activeStageId,{story:false});assert(app.customMap);}
const check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS',name);};
await check('Custom → chapter/training cannot bypass the protected split campaign launch policy',()=>{
 for(const debug of [false])for(const [id,training] of [[23,false],[1,true]]){setup(debug);const custom=app.customMap,engine=app.engine;app.launch(id,training);assert(app.customMap===custom,'Blocked launch must retain the temporary map and protected owner');assert(app.engine===engine,'Blocked launch must not replace the active engine');assert.deepEqual(plain(custom.returnProfile),original);assert.match(app.lastNotice,/합류/);}
});
await check('Custom → Rest/Camp restores the saved split battle without revealing a recovery or allocation screen',()=>{
 for(const debug of [false,true])for(const destination of ['showRest','showCamp']){setup(debug);app[destination]();assert.equal(app.customMap,null);assert.equal(app.screen,'battle');assert.equal(app.stageId,25);assert.deepEqual(plain(app.engine.b.units),original.honroBattle.units);assert.deepEqual(plain(app.engine.b.items),original.honroBattle.items);assert.deepEqual(plain(app.profile.heroes),original.heroes);}
});
await check('Custom result return resumes the protected split battle and cannot enter a free rest',()=>{
 setup();app.engine.b.phase='won';app.outcome(true);click('result-continue');assert.equal(app.customMap,null);assert.equal(app.stageId,25);assert.equal(app.screen,'battle');assert.deepEqual(plain(app.engine.b.units),original.honroBattle.units);assert.equal(app.engine.b.items.heal,1);assert.deepEqual(JSON.parse(h.storage.get(KEY)).honroBattle.units,original.honroBattle.units);
});

await check('Debug can select any chapter from a split or custom map while disabling restores the original damaged campaign',()=>{
 for(const custom of [false,true])for(const id of [1,23,26,30]){setup(true);if(!custom)app.showRest();const normal=plain(app.normalProfile);g.HonroRestJourney.requestLaunch(app,id,'next');if(app.pendingJourneyLaunch)g.HonroRestJourney.confirmLaunch(app);finish(app);assert.equal(app.stageId,id);assert.equal(app.engine.b.honroStage,id);assert.deepEqual(plain(app.normalProfile),normal);if(id===26)assert.equal(app.engine.b.honroSplit.mode,'replay');app.setDebugMode(false);finish(app);assert.equal(app.stageId,25);assert.equal(app.screen,'battle');assert.deepEqual(plain(app.engine.b.units),normalOriginal.honroBattle.units);assert.deepEqual(plain(app.engine.b.items),normalOriginal.honroBattle.items);}
});

await report('split-custom-return-boundary',checks);
