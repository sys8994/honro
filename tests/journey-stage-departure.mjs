/** Real production App click/serialization regression. Profiles and terminal
 * victories are explicit fixtures; DOM/storage are doubles, not browser or
 * normal-combat completion evidence. Never reads a user's actual storage. */
import assert from 'node:assert/strict';
import {appHarness,plain,report,KEY} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,click,finish,load,reload,profileThrough}=h,R=g.HonroRestJourney,D=g.HonroJourneyContent,checks=[];
let app;
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
// Dispatch exactly the action/id in the rendered primary control, rather than
// directly launching the expected stage and missing navigation regressions.
function departure(){const tag=app.root.innerHTML.match(/<button class="primary rest-next"[^>]*>/)?.[0];assert(tag,'A visible primary departure exists');return {action:/data-action="([^"]+)"/.exec(tag)?.[1],id:/data-id="([^"]+)"/.exec(tag)?.[1]};}
function depart(){const {action,id}=departure();click(action,id?{id}:{});}
function rest(){click('rest');finish(app);assert.equal(app.screen,'rest');}
function start(id){app=load(profileThrough(id-1));rest();assert.deepEqual(departure(),{action:'journey-enter',id:String(id)});depart();finish(app);assert.equal(app.engine.b.honroStage,id);}
function browse(id){click('journey-book');click('journey-select',{id:String(id)});if(app.screen==='journey')click('rest');finish(app);}
function progress(){return plain({heroes:app.profile.heroes,loadouts:app.profile.loadouts,cleared:app.profile.cleared});}
check('Normal completed 7 → journal old pin/history → rest 8 → actual 8, including reload',()=>{
 start(7);app.engine.b.phase='won';app.outcome(true);click('result-continue');finish(app);assert.equal(D.next(app.profile).stageId,8);const earned=progress();
 for(let n=0;n<3;n++){browse(7);click('journal');click('close');assert.equal(R.currentId(app.profile),8);assert.equal(app.profile.honroBattle,null);assert.deepEqual(departure(),{action:'journey-enter',id:'8'});app.persist();app=reload();rest();}
 depart();assert.equal(app.stage.id,8);assert.equal(app.engine.b.honroStage,8);assert.deepEqual(progress(),earned);
});
check('Normal replay 7 cannot silently hijack rest 8; cancel/Continue preserve snapshot and confirmed departure starts 8',()=>{
 app=load(profileThrough(7));rest();click('journey-book');click('journey-select',{id:'7'});click('journey-replay',{id:'7'});finish(app);rest();const replay=plain(app.profile.honroBattle),earned=progress();
 assert.match(app.root.innerHTML,/rest-location"><span>1막 8장/);assert.deepEqual(departure(),{action:'journey-enter',id:'8'});
 depart();assert.equal(app.engine,null);assert.equal(app.pendingJourneyLaunch.id,8);assert.deepEqual(plain(app.profile.honroBattle),replay);click('cancel-journey-launch');assert.deepEqual(plain(app.profile.honroBattle),replay);
 click('journey-book');click('journey-select',{id:'7'});assert.match(app.root.innerHTML,/data-action="continue"/);click('continue');assert.equal(app.engine.b.honroStage,7);assert.deepEqual(plain(app.engine.b),replay);rest();
 app.persist();app=reload();rest();assert.deepEqual(departure(),{action:'journey-enter',id:'8'});depart();click('confirm-journey-launch');assert.equal(app.engine.b.honroStage,8);assert.equal(app.stage.id,8);assert.equal(app.engine.b.honroJourneyReplay,false);assert.deepEqual(progress(),earned);
});
check('Legacy replay snapshot without replay marker keeps progress and offers the current destination',()=>{
 app=load(profileThrough(7));rest();click('journey-book');click('journey-replay',{id:'7'});finish(app);rest();const old=plain(app.profile);delete old.honroBattle.honroJourneyReplay;delete old.honroJourney;app=load(old);rest();const before=plain(app.profile.honroBattle),earned=progress();
 assert.deepEqual(departure(),{action:'journey-enter',id:'8'});browse(7);assert.deepEqual(plain(app.profile.honroBattle),before);depart();click('cancel-journey-launch');assert.deepEqual(plain(app.profile.honroBattle),before);depart();click('confirm-journey-launch');assert.equal(app.engine.b.honroStage,8);assert.deepEqual(progress(),earned);
});
check('Debug map selection 8 with suspended 7 renders departure 8 and leaves normal save untouched',()=>{
 start(7);rest();app.setDebugMode(true);finish(app);const normal=h.storage.get(KEY),suspended=plain(app.profile.honroBattle);browse(8);assert.equal(app.debugRestStage,8);assert.deepEqual(departure(),{action:'journey-enter',id:'8'});
 click('camp');rest();click('title');rest();depart();assert.equal(app.pendingJourneyLaunch.id,8);click('cancel-journey-launch');assert.deepEqual(plain(app.profile.honroBattle),suspended);depart();click('confirm-journey-launch');assert.equal(app.engine.b.honroStage,8);assert.equal(app.stage.id,8);assert.equal(h.storage.get(KEY),normal);
});
check('Every explicit debug destination, including the suspended chapter, uses its visible departure and confirmation',()=>{
 start(7);rest();app.setDebugMode(true);finish(app);const suspended=plain(app.profile.honroBattle);
 for(let id=1;id<=30;id++){browse(id);assert.equal(app.debugRestStage,id);assert.deepEqual(departure(),{action:'journey-enter',id:String(id)});depart();assert.equal(app.pendingJourneyLaunch.id,id);click('cancel-journey-launch');assert.deepEqual(plain(app.profile.honroBattle),suspended);}
});
check('Matching in-progress chapter retains exact Continue through book/back, history and reload',()=>{
 for(const id of [7,8,10,11,18,19,20,21,30]){start(id);rest();const before=plain(app.profile.honroBattle),earned=progress();browse(Math.max(1,id-1));click('journal');click('close');assert.deepEqual(departure(),{action:'continue',id:undefined});app.persist();app=reload();rest();depart();assert.equal(app.engine.b.honroStage,id);assert.deepEqual(plain(app.engine.b),before);assert.deepEqual(progress(),earned);}
});
check('Act/direct boundaries and replay results retain their established next destinations',()=>{
 for(const id of [7,9,10,18,20,29]){start(id);app.engine.b.phase='won';app.outcome(true);click('result-continue');finish(app);const next=id+1;assert.equal(D.next(app.profile).stageId,next);if(app.screen==='rest'){browse(id);depart();}assert.equal(app.engine.b.honroStage,next);}
 app=load(profileThrough(7));rest();click('journey-book');click('journey-replay',{id:'7'});finish(app);app.engine.b.phase='won';app.outcome(true);click('result-continue');assert.equal(app.screen,'journey');assert.equal(app.profile.honroBattle,null);rest();depart();assert.equal(app.engine.b.honroStage,8);
});
await report('journey-stage-departure',checks,{scope:'Production App button actions and saves. No real-user storage, no direct stage-selection mutation, no combat completion claim.'});
