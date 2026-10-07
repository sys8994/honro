/** Production App logic, with DOM/storage doubles. Terminal states below are
 * explicit navigation fixtures, never evidence of a normal-play stage clear. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain,report,KEY} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C,click,finish,load,reload,profileThrough}=h,R=g.HonroRestJourney,checks=[];
let app;const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
const saved=()=>JSON.parse(h.storage.get(KEY));
const entry=app=>{const b=app.engine.b;return plain({heroes:b.heroes,difficulty:b.difficulty,mode:b.mode,party:b.units.filter(u=>u.side===0&&!u.summoned).map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,focus:u.focus,maxMove:u.maxMove,moveLeft:u.moveLeft,ranks:u.ranks,loadout:u.loadout,attack:u.attack,armor:u.armor})),terrain:b.terrain,events:b.honroEvents,objectives:b.honroObjectives,state:b.honroState,growth:b.honroGrowth,story:app.dialogue?.lines});};
check('Enabling debug keeps the same suspended campaign, growth, choices and story in an independent copy',()=>{
 app=load(profileThrough(4));app.launch(5);finish(app);app.engine.active.hp-=17;app.engine.active.focus-=9;app.engine.b.round=7;app.engine.b.items.heal=0;app.stopBattle();app.showRest();finish(app);app.profile.honroFlags.keep='original';app.persist();
 const before=plain(app.profile);app.setDebugMode(true);assert.equal(app.screen,'rest');assert.notEqual(app.profile,app.normalProfile);before.settings.debugMode=true;assert.deepEqual(plain(app.profile),before);assert.deepEqual(saved(),before);assert.deepEqual(plain(app.normalProfile),before);
 app.profile.honroFlags.keep='qa';app.profile.heroes.archer.xp++;app.persist();assert.deepEqual(saved(),before);assert.deepEqual(plain(app.normalProfile),before);
});
check('All 30 destinations use the real journey book and only debug unlocks unvisited entries',()=>{
 const ids=new Set();for(const layer of ['surface','underground','city']){R.showBook(app,undefined,layer);assert.equal(app.screen,'journey');assert(!app.root.innerHTML.includes('map-board'));for(const m of app.root.innerHTML.matchAll(/data-action="journey-select" data-id="(\d+)"/g))ids.add(+m[1]);}
 assert.equal(ids.size,30);for(const id of ids){R.showBook(app,id);if(id!==app.profile.honroBattle?.honroStage)assert.match(app.root.innerHTML,new RegExp(`data-action="journey-(?:enter|replay)" data-id="${id}"`));assert(app.isOpen(g.HONRO_CONTENT.stages[id-1]));}
});
check('Cancel, close and stale confirmation preserve the saved battle when choosing another chapter',()=>{
 const before=plain(app.profile.honroBattle);R.requestLaunch(app,30);assert(app.pendingJourneyLaunch);click('cancel-journey-launch');assert.deepEqual(plain(app.profile.honroBattle),before);R.requestLaunch(app,30);app.close();assert(!app.pendingJourneyLaunch);assert.deepEqual(plain(app.profile.honroBattle),before);
 R.requestLaunch(app,30);app.profile.honroBattle.session+='-new';click('confirm-journey-launch');assert(!app.engine);assert.match(app.lastNotice,/바뀌었습니다/);
});
check('All 30 chapter entries match ordinary party, growth, map, events, objectives, skills, difficulty and dialogue',()=>{
 for(let id=1;id<=30;id++){
  const p=profileThrough(id-1);p.settings.difficulty=Object.keys(C.DIFFICULTIES).at(-1);p.heroes.archer.ranks={A01:1};
  app=load(p);R.showRest(app);finish(app);R.requestLaunch(app,id);const expected=entry(app);
  app=load(p);app.setDebugMode(true);finish(app);R.showBook(app,id);R.requestLaunch(app,id);assert.equal(app.engine.b.honroStage,id);assert.deepEqual(entry(app),expected,`chapter ${id}`);
 }
});
check('Selecting a locked chapter grants no XP floor, automatic skills, infinite HP or movement',()=>{
 app=load(profileThrough(0));app.profile.heroes.archer.xp=0;app.profile.heroes.archer.ranks={A01:1};app.persist();const before=plain(app.profile.heroes.archer);app.setDebugMode(true);finish(app);R.requestLaunch(app,30);
 assert.equal(app.engine.b.mode,'campaign');assert.deepEqual(plain(app.engine.b.heroes.archer),before);const u=app.engine.b.units.find(u=>u.side===0&&u.cls==='archer'),stats=C.heroStats(before,'archer',app.profile.loadouts.archer);assert.equal(u.maxHp,stats.hp);assert.equal(u.maxMove,stats.move);assert(u.moveLeft<=u.maxMove);assert(!app.training);
});
check('Retry and loss use ordinary battle handling; debug victory stays isolated',()=>{
 finish(app);const before=saved();app.engine.active.hp-=11;click('retry');assert.equal(app.engine.b.honroStage,30);finish(app);app.engine.b.phase='lost';app.outcome(true);assert(app.done);click('result-continue');assert.equal(app.screen,'rest');finish(app);assert.deepEqual(saved(),before);
 R.showBook(app,1);R.requestLaunch(app,1);finish(app);app.engine.b.phase='won';app.outcome(true);assert(app.profile.cleared[1]);assert(!saved().cleared[1]);click('result-continue');assert.equal(app.engine.b.honroStage,2);assert.equal(app.screen,'battle');assert.deepEqual(saved(),before);
});
check('Reload discards QA changes, preserves debug setting, and restores the normal snapshot',()=>{
 const before=saved();app=reload();assert(app.debugMode);assert.deepEqual(plain(app.profile),before);assert.deepEqual(plain(app.normalProfile),before);assert(!app.profile.cleared[1]);assert.equal(app.profile.heroes.archer.xp,0);
});
check('Disable restores original battle and normal locks, including repeated toggles',()=>{
 app=load(profileThrough(4));app.launch(5);finish(app);app.engine.active.hp-=13;app.stopBattle();app.showRest();finish(app);app.persist();const before=plain(app.profile);app.setDebugMode(true);finish(app);R.requestLaunch(app,30);R.confirmLaunch(app);finish(app);app.setDebugMode(false);finish(app);before.settings.debugMode=false;assert.deepEqual(plain(app.profile),before);assert.deepEqual(saved(),before);assert(!app.isOpen(g.HONRO_CONTENT.stages[29]));click('continue');assert.equal(app.engine.b.honroStage,5);assert.equal(app.engine.active.hp,before.honroBattle.units.find(u=>u.id===app.engine.b.active).hp);
 app.setDebugMode(true);finish(app);app.setDebugMode(false);finish(app);assert.equal(app.profile.honroBattle.honroStage,5);
});
app.setDebugMode(true);finish(app);app.profile.honroFlags.exportProbe='qa-only';app.export();const exported=await h.exported();
check('Export in debug contains the protected normal save, never the QA clone',()=>{assert(!exported.honroFlags.exportProbe);assert.deepEqual(exported,saved());});
check('Workshop embedded App cannot enable campaign debug',()=>{const before=h.storage.get(KEY);g.HONRO_EMBEDDED=true;app=reload();assert(!app.debugMode);app.setDebugMode(true);assert(!app.debugMode);assert.equal(h.storage.get(KEY),before);});
const main=await readFile('shared/runtime/main.js','utf8'),build=await readFile('shared/build.mjs','utf8');
check('Active bundle has no obsolete debug atlas or boosted battle constructor',()=>{assert(!build.includes('act2-journey.js'));assert(!build.includes("'journey.js'"));assert(!main.includes('HonroJourney.markup'));assert(!main.includes('mapDock('));assert(!main.includes('if(this.debugMode&&!training)'));});
await report('debug-campaign-parity',checks,{chapters:30});
