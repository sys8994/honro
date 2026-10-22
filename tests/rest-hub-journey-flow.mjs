/** Production App/serialization checks. DOM/storage and terminal victories are
 * fixtures; actual Chromium input and screenshots are checked separately. */
import assert from 'node:assert/strict';
import {appHarness,plain,report,KEY} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,click,finish,load,reload,profileThrough}=h,R=g.HonroRestJourney,checks=[];
let app;
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
const permanent=()=>plain(Object.fromEntries(['heroes','loadouts','cleared','honroGrowth','recruited','party','record','items'].map(k=>[k,app.profile[k]??null])));
function start(id){app=load(profileThrough(id-1));app.launch(id);finish(app);}
function hub(){click('rest');if(app.pendingJourneyLaunch)click('confirm-journey-launch');finish(app);assert.equal(app.screen,'rest');}
function book(id){click('journey-book');if(id){click('journey-act',{id:String(R.actOf(id))});click('journey-layer',{layer:g.HonroJourneyContent.at(id).layer});click('journey-select',{id:String(id)});}}
check('Pause exposes one rest-hub action; cancel changes neither live battle nor serialized save',()=>{
 start(5);app.engine.b.round=7;app.engine.active.hp-=17;app.engine.b.items.heal=0;app.pause();assert.match(app.modal.innerHTML,/휴식터로 가기/);assert.doesNotMatch(app.modal.innerHTML,/여정첩/);
 const b=plain(app.engine.b),p=plain(app.profile),saved=h.storage.get(KEY),engine=app.engine;click('rest');assert(app.pendingJourneyLaunch);assert.equal(app.engine,engine);assert.deepEqual(plain(app.engine.b),b);assert.deepEqual(plain(app.profile),p);assert.equal(h.storage.get(KEY),saved);click('cancel-journey-launch');assert.equal(app.engine,engine);assert.deepEqual(plain(app.profile),p);assert.equal(h.storage.get(KEY),saved);
});
check('Confirmed hub return discards combat in memory/autosave/reload and preserves earned permanent progress',()=>{
 g.HonroProgression.awardCombat(app.engine,app.engine.active,21);app.stopBattle();const savedBattle=plain(app.profile.honroBattle),earned=permanent();app.continue();click('rest');click('confirm-journey-launch');finish(app);assert.equal(app.engine,null);assert.equal(app.profile.honroBattle,null);assert.equal(JSON.parse(h.storage.get(KEY)).honroBattle,null);assert.deepEqual(permanent(),earned);app=reload();assert.equal(app.profile.honroBattle,null);click('continue');finish(app);assert.equal(app.screen,'rest');assert.deepEqual(permanent(),earned);assert.equal(savedBattle.round,7);
});
check('Act unlock follows canonical act endpoints and invalid actions never expose a locked atlas',()=>{
 for(const [cleared,open] of [[0,1],[9,1],[10,2],[19,2],[20,3],[30,3]]){
  app=load(profileThrough(cleared));app.showRest();finish(app);book();for(let n=1;n<=6;n++)assert.equal(R.actOpen(app.profile,n),n<=open);
  for(let n=open+1;n<=6;n++){const before=app.root.innerHTML;click('journey-act',{id:String(n)});assert.equal(app.root.innerHTML,before);}
  for(let n=1;n<=open;n++){click('journey-act',{id:String(n)});assert.equal(app.journeyAct,n);assert([...app.root.innerHTML.matchAll(/data-action="journey-select" data-id="(\d+)"/g)].every(m=>R.actOf(+m[1])===n));}
  assert.match(app.root.innerHTML,/6막 · 준비 중/);
 }
 app=load(profileThrough(0));R.showBook(app,21,'city');assert.equal(app.journeyAct,1);assert.doesNotMatch(app.root.innerHTML,/journey-city|data-journey-atlas="city"/);
});
check('Act 2 unifies surface 11/12 and underground 13–20 without act-1 pins',()=>{
 app=load(profileThrough(20));app.showRest();finish(app);book(12);assert.equal(app.journeyAct,2);assert(!app.root.innerHTML.includes('data-action="journey-layer"'));for(let id=11;id<=20;id++)assert(app.root.innerHTML.includes(`data-action="journey-select" data-id="${id}"`));assert(!app.root.innerHTML.includes('data-action="journey-select" data-id="1"'));

});
check('Spot selection is inert; explicit CTA branches to authored rest or a fresh direct stage',()=>{
 for(const id of [1,2,9,10,18,19,24,25,26,27,28,29]){
  app=load(profileThrough(30));app.showRest();finish(app);book(id);const before=plain(app.profile),save=h.storage.get(KEY);click('journey-select',{id:String(id)});assert.equal(app.screen,'journey');assert.equal(app.engine,null);assert.deepEqual(plain(app.profile),before);assert.equal(h.storage.get(KEY),save);assert.match(app.root.innerHTML,new RegExp(`data-action="journey-travel" data-id="${id}">${R.hasRest(id)?'휴식터로 진입':'스테이지 진입'}`));
  click('journey-travel',{id:String(id)});if(R.hasRest(id)){assert.equal(app.screen,'rest');assert.equal(R.restNext(app).stageId,id);assert.match(app.root.innerHTML,/스테이지 진입/);click('journey-enter',{id:String(id)});}finish(app);assert.equal(app.engine.b.honroStage,id);assert.equal(app.engine.b.honroJourneyReplay,true);assert.equal(app.engine.b.round,1);
 }
});
check('Legacy suspended snapshot stays exact until approval, including same-stage explicit restart',()=>{
 for(const id of [5,12,18]){
  start(id);app.engine.b.round=8;app.engine.b.items.heal=0;app.stopBattle();const p=plain(app.profile),before=plain(app.profile.honroBattle),earned=permanent();app=load(p);app.showRest();finish(app);book(id);click('journey-travel',{id:String(id)});assert(app.pendingJourneyLaunch);assert.deepEqual(plain(app.profile.honroBattle),before);click('cancel-journey-launch');assert.deepEqual(plain(app.profile.honroBattle),before);app=reload();assert.deepEqual(plain(app.profile.honroBattle),before);
  app.showRest();finish(app);book(id);click('journey-travel',{id:String(id)});click('confirm-journey-launch');finish(app);if(R.hasRest(id)){assert.equal(app.profile.honroBattle,null);click('journey-enter',{id:String(id)});}finish(app);assert.equal(app.engine.b.honroStage,id);assert.equal(app.engine.b.round,1);assert.notEqual(app.engine.b.session,before.session);assert.deepEqual(permanent(),earned);
 }
});
check('Explicit split return uses a hub and same-stage entry creates a new battle with the original checkpoint',()=>{
 start(25);app.engine.b.round=8;app.engine.active.hp-=12;app.stopBattle();const old=plain(app.profile.honroBattle),earned=permanent();app=reload();click('rest');assert(app.pendingJourneyLaunch);click('cancel-journey-launch');assert.deepEqual(plain(app.profile.honroBattle),old);hub();assert.equal(R.restNext(app).stageId,24);assert.equal(app.profile.honroBattle,null);book(25);click('journey-travel',{id:'25'});finish(app);assert.equal(app.engine.b.honroStage,25);assert.equal(app.engine.b.round,1);assert.notEqual(app.engine.b.session,old.session);assert.deepEqual(permanent(),earned);
});
check('Finished journey CTA returns to the terminal riverside rest, including after replay-camp selection',()=>{
 app=load(profileThrough(30));app.showRest();finish(app);book(7);click('journey-travel',{id:'7'});assert.equal(R.restNext(app).stageId,7);click('journey-book');click('journey-act',{id:'3'});click('journey-select',{id:'end'});click('journey-travel',{id:'end'});finish(app);assert.equal(app.screen,'rest');assert.equal(R.restNext(app),null);assert.match(app.root.innerHTML,/강변 쉼터/);
});
check('Stale approval and repeated approvals cannot discard a different session',()=>{
 start(5);click('rest');app.engine.b.session+='changed';const before=plain(app.engine.b),saved=h.storage.get(KEY);click('confirm-journey-launch');assert.deepEqual(plain(app.engine.b),before);assert.equal(h.storage.get(KEY),saved);assert.match(app.lastNotice,/바뀌었습니다/);click('confirm-journey-launch');assert.deepEqual(plain(app.engine.b),before);
});
check('Intro Continue still restores exact old battle, while explicit hub and camp stage entry restart',()=>{
 start(5);app.engine.b.round=9;app.stopBattle();const battle=plain(app.profile.honroBattle);app=reload();click('continue');assert.deepEqual(plain(app.engine.b),battle);hub();click('camp');assert.equal(app.screen,'camp');click('rest');finish(app);click('journey-enter',{id:'5'});finish(app);assert.equal(app.engine.b.round,1);
});
check('Debug selection is inert, launches only a temporary new fight, and never overwrites normal storage',()=>{
 start(7);app.stopBattle();app.setDebugMode(true);finish(app);const normal=h.storage.get(KEY);book(12);click('journey-select',{id:'12'});assert.equal(app.screen,'journey');assert(!app.debugRestStage);click('journey-travel',{id:'12'});click('confirm-journey-launch');finish(app);assert.equal(app.debugRestStage,12);click('journey-enter',{id:'12'});finish(app);assert.equal(app.engine.b.honroStage,12);assert.equal(h.storage.get(KEY),normal);app=reload();assert.equal(app.profile.honroBattle.honroStage,7);
});
check('Practice return protects its suspended campaign until the explicit stage-entry approval',()=>{
 start(5);app.engine.b.round=7;app.stopBattle();const before=plain(app.profile.honroBattle),earned=permanent();click('training');assert(app.training);click('rest');finish(app);assert.equal(app.screen,'rest');assert.deepEqual(plain(app.profile.honroBattle),before);assert.deepEqual(permanent(),earned);click('journey-enter',{id:'5'});assert(app.pendingJourneyLaunch);click('cancel-journey-launch');assert.deepEqual(plain(app.profile.honroBattle),before);click('journey-enter',{id:'5'});click('confirm-journey-launch');finish(app);assert.equal(app.engine.b.round,1);assert.deepEqual(permanent(),earned);
});
check('New journey drops an old camp destination and shows only the first act',()=>{
 app=load(profileThrough(30));app.showRest();finish(app);book(12);click('journey-travel',{id:'12'});click('confirm-newgame');assert.equal(app.screen,'title');assert.deepEqual(plain(app.profile.cleared),{});assert(!app.profile.honroJourney?.restStageId);click('continue');finish(app);book();assert.equal(app.journeyAct,1);assert.equal(R.actOpen(app.profile,2),false);
});
check('Replay win cannot duplicate XP, first-clear reward or act ending; normal direct links persist',()=>{
 app=load(profileThrough(7));app.showRest();finish(app);book(7);click('journey-travel',{id:'7'});click('journey-enter',{id:'7'});finish(app);const xp=app.profile.heroes.archer.xp,ledger=plain(app.profile.honroGrowth);app.engine.b.phase='won';app.outcome(true);assert.equal(app.profile.heroes.archer.xp,xp);assert.deepEqual(plain(app.profile.honroGrowth),ledger);assert(!app.profile.honroActEnding);click('result-continue');assert.equal(app.screen,'journey');
 for(const id of [1,9,18]){start(id);app.engine.b.phase='won';app.outcome(true);assert.equal(app.profile.honroJourney.pendingDirect,id+1);app=reload();app.showRest();assert.equal(app.engine.b.honroStage,id+1);}
});
await report('rest-hub-journey-flow',checks);
