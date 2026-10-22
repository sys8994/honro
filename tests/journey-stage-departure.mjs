/** Production navigation/save regressions with DOM/storage doubles. Terminal
 * wins are fixtures; separate Chromium checks cover actual button input. */
import assert from 'node:assert/strict';
import {appHarness,plain,report,KEY} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,click,finish,load,reload,profileThrough}=h,R=g.HonroRestJourney,D=g.HonroJourneyContent,checks=[];
let app;
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
function departure(){const tag=app.root.innerHTML.match(/<button class="primary rest-next"[^>]*>/)?.[0];assert(tag);return {action:/data-action="([^"]+)"/.exec(tag)?.[1],id:/data-id="([^"]+)"/.exec(tag)?.[1]};}
function depart(){const {action,id}=departure();click(action,{id});}
function rest(){click('rest');if(app.pendingJourneyLaunch)click('confirm-journey-launch');finish(app);assert.equal(app.screen,'rest');}
function start(id){app=load(profileThrough(id-1));app.showRest();finish(app);assert.deepEqual(departure(),{action:'journey-enter',id:String(id)});depart();finish(app);assert.equal(app.engine.b.honroStage,id);}
function select(id){click('journey-book');click('journey-act',{id:String(R.actOf(id))});const layer=D.at(id).layer;click('journey-layer',{layer});click('journey-select',{id:String(id)});}
function progress(){return plain({heroes:app.profile.heroes,loadouts:app.profile.loadouts,cleared:app.profile.cleared});}
check('Completed 7 → book old pin/history → current rest 8 → actual new 8, including reload',()=>{
 start(7);app.engine.b.phase='won';app.outcome(true);click('result-continue');finish(app);const earned=progress();
 for(let n=0;n<3;n++){select(7);click('journal');click('close');assert.equal(app.screen,'journey');assert.equal(app.profile.honroBattle,null);rest();assert.deepEqual(departure(),{action:'journey-enter',id:'8'});app=reload();click('continue');finish(app);}
 depart();assert.equal(app.engine.b.honroStage,8);assert.deepEqual(progress(),earned);
});
check('Replay snapshot cancellation and intro Continue remain exact; confirmed hub then departure starts fresh',()=>{
 app=load(profileThrough(7));rest();select(7);click('journey-travel',{id:'7'});depart();finish(app);app.engine.b.round=6;app.stopBattle();const replay=plain(app.profile.honroBattle),earned=progress();
 app=reload();click('rest');assert(app.pendingJourneyLaunch);click('cancel-journey-launch');assert.deepEqual(plain(app.profile.honroBattle),replay);click('continue');assert.deepEqual(plain(app.engine.b),replay);rest();assert.equal(app.profile.honroBattle,null);depart();finish(app);assert.equal(app.engine.b.honroStage,7);assert.equal(app.engine.b.round,1);assert.deepEqual(progress(),earned);
});
check('Legacy markerless replay preserves campaign destination and permanent progress',()=>{
 app=load(profileThrough(7));app.launch(7);finish(app);app.stopBattle();const old=plain(app.profile);delete old.honroBattle.honroJourneyReplay;delete old.honroJourney;app=load(old);const before=plain(app.profile.honroBattle),earned=progress();click('rest');click('cancel-journey-launch');assert.deepEqual(plain(app.profile.honroBattle),before);assert.equal(D.next(app.profile).stageId,8);rest();assert.equal(app.profile.honroBattle,null);assert.deepEqual(progress(),earned);
});
check('Debug selection waits for explicit camp CTA and keeps the normal save untouched',()=>{
 start(7);app.stopBattle();app.setDebugMode(true);finish(app);const normal=h.storage.get(KEY),before=plain(app.profile.honroBattle);select(8);assert.equal(app.screen,'journey');assert(!app.debugRestStage);assert.deepEqual(plain(app.profile.honroBattle),before);click('journey-travel',{id:'8'});click('cancel-journey-launch');assert.deepEqual(plain(app.profile.honroBattle),before);click('journey-travel',{id:'8'});click('confirm-journey-launch');finish(app);assert.equal(app.debugRestStage,8);assert.deepEqual(departure(),{action:'journey-enter',id:'8'});click('camp');rest();depart();finish(app);assert.equal(app.engine.b.honroStage,8);assert.equal(h.storage.get(KEY),normal);
});
check('Explicit departures, including the same saved chapter, never render Continue',()=>{
 for(const id of [7,8,10,11,18,19,20,21,30]){start(id);app.engine.b.round=8;rest();const target=R.restNext(app).stageId;assert.deepEqual(departure(),{action:'journey-enter',id:String(target)});assert(!app.root.innerHTML.includes('data-action="continue"'));app=reload();click('continue');finish(app);depart();finish(app);assert.equal(app.engine.b.honroStage,target);assert.equal(app.engine.b.round,1);}
});
check('Act/direct boundaries and replay results retain automatic routing',()=>{
 for(const id of [7,9,10,18,20,29]){start(id);app.engine.b.phase='won';app.outcome(true);click('result-continue');finish(app);const next=id+1;assert.equal(D.next(app.profile).stageId,next);if(app.screen==='rest')depart();assert.equal(app.engine.b.honroStage,next);}
 app=load(profileThrough(7));rest();select(7);click('journey-travel',{id:'7'});depart();finish(app);app.engine.b.phase='won';app.outcome(true);click('result-continue');assert.equal(app.screen,'journey');assert.equal(app.profile.honroBattle,null);assert.equal(D.next(app.profile).stageId,8);
});
await report('journey-stage-departure',checks,{scope:'Production App actions/save doubles. No real user storage or normal-play completion claim.'});
