/** Actual App/mission/story with DOM/storage doubles; resources and terminal
 * states below are explicit fixtures, not normal campaign play evidence. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h;
const saved=JSON.parse(gunzipSync(await readFile('tests/fixtures/encounter-density/ember/round-30.json.gz'))).profile;
const notice=['서술','불씨를 지켰다. 동행이 숨을 고른다.',{kind:'narration',eventSource:'campfire-kept'}];
const speech=(text,source='relic-found')=>['서술',text,{kind:'narration',eventSource:source}];
function load(profile=saved){const a=h.load(plain(profile));a.continue();return a;}
// Pinned Stage8 marker/threat geometry, with only resources varied explicitly.
for(const kind of ['hp','focus','full']){
 const a=load(),b=a.engine.b,e=a.engine,heroes=e.heroesAlive(),marker=b.honroMarkers.find(m=>m.id==='marker-4');
 for(const u of g.HonroAllies.coalition(e)){u.hp=u.maxHp;u.focus=u.maxFocus;}
 const target=heroes[0];if(kind==='hp')target.hp--;if(kind==='focus')target.focus--;
 const rings=[],heals=[],events=[],realHeal=g.HonroProgression.recordHeal;e.fx=(...args)=>rings.push(args);a.event=(...args)=>events.push(args);
 g.HonroProgression.recordHeal=(...args)=>{heals.push(args.slice(1).map(v=>typeof v==='object'?v.id:v));return realHeal(...args);};
 const before=plain(b.heroes);a.missionTick(C.STEP);g.HonroProgression.recordHeal=realHeal;
 assert(marker.collected);assert.equal(target.hp,target.maxHp);assert.equal(target.focus,target.maxFocus);
 const actual=rings.filter(v=>v[0]==='ring'&&v[3]==='#a9b892');assert.equal(actual.length,kind==='full'?0:1);
 if(actual.length){assert.equal(actual[0][1],target.x);assert.equal(actual[0][2],target.y-target.h*.5);}
 assert(!events.some(v=>v[1]?.source==='campfire-kept'));assert.equal(heals.find(v=>v[0]===target.id)[2],kind==='hp'?1:0);
 assert.deepEqual(plain(b.heroes),before,'recovery does not grant XP or alter hero allocations');
 const once=JSON.stringify(b.units.map(u=>[u.id,u.hp,u.focus]));rings.length=0;a.missionTick(C.STEP);assert.equal(JSON.stringify(b.units.map(u=>[u.id,u.hp,u.focus])),once);assert(!rings.some(v=>v[3]==='#a9b892'));
 console.log('PASS recovery',kind,'actual-only ring, unchanged heal ledger and one-shot marker');
}
{
 const a=load(),hs=a.engine.b.honroState;hs.storyQueue=[notice];hs.deferredStory=[{round:99,lines:[notice,speech('보존할 다음 대사')]}];hs.storyBanter=[[notice]];hs.banterLine={line:notice};
 g.HonroStory.drain(a);assert(!a.dialogue);assert.equal(hs.storyQueue.length,0);assert.equal(hs.deferredStory.length,1);assert.deepEqual(plain(hs.deferredStory[0].lines),[speech('보존할 다음 대사')]);
 g.HonroStory.event(a,notice[1],{source:'campfire-kept'});assert.equal(hs.storyQueue.length,0);
 const lines=[notice,speech('이미 읽은 대사'),notice,speech('현재 대사')];g.HonroStory.start(a,lines,{index:3});assert.equal(a.dialogue.index,1);assert.equal(a.dialogue.lines[1][1],'현재 대사');h.finish(a);
 g.HonroStory.start(a,[speech('같은 문구는 출처가 다르면 보존'),speech(notice[1],'other-event')],{index:1});assert.equal(a.dialogue.lines[1][1],notice[1]);h.finish(a);
 g.HonroStory.start(a,[speech('이미 읽은 마지막 대사'),notice],{index:1});assert(!a.dialogue,'removed trailing notice must finish instead of replaying previous speech');
 console.log('PASS exact source cleanup, deferred mixed bundle, saved dialogue index and other speech retained');
}
{
 const p=plain(saved);p.honroBattle.honroStory={lines:[notice],index:0,after:'outcome'};p.honroBattle.phase='won';p.honroBattle.rewardGranted=true;
 const a=load(p);assert(!a.dialogue);assert(a.done);assert(a.profile.cleared[8]);assert.equal(a.profile.honroBattle,null);
 console.log('PASS notice-only saved outcome resumes reward completion and chapter handoff');
}
{
 const a=load(),hs=a.engine.b.honroState;a.engine.b.phase='won';a.engine.b.rewardGranted=true;
 hs.storyQueue=[notice,speech('남겨야 하는 종료 사건')];hs.deferredStory=[{round:99,lines:[notice,speech('남겨야 하는 지연 사건')]}];
 a.outcome();assert(a.dialogue);const text=a.dialogue.lines.map(l=>l[1]);assert(!a.dialogue.lines.some(l=>l[2]?.eventSource==='campfire-kept'));assert(text.includes('남겨야 하는 종료 사건'));assert(text.includes('남겨야 하는 지연 사건'));
 h.finish(a);assert(a.done);assert(a.profile.cleared[8]);assert.equal(a.profile.honroBattle,null);
 const earned=plain(a.profile.heroes);h.click('result-continue');h.finish(a);assert.equal(a.screen,'rest');assert.equal(g.HonroJourneyContent.next(a.profile).stageId,9);h.click('journey-enter',{id:'9'});h.finish(a);assert.equal(a.stage.id,9);assert.deepEqual(plain(a.profile.heroes),earned);
 console.log('PASS outcome retains other speech, rewards and next-rest/Stage9 transition');
}
