// Real production App/interaction/queue/walk/save; DOM/Canvas/audio are doubles.
// Position and terminal-state edits below are explicit fixtures, not playthroughs.
import assert from 'node:assert/strict';
import vm from 'node:vm';import {readFile}from'node:fs/promises';
import {appHarness,plain,report}from'./app-regression-helpers.mjs';
const h=await appHarness(),{g,load,reload,profileThrough,click,finish,nodes}=h;
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const S=g.HonroStoryStaging,ID=S.ID,checks=[];let now=1000;
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
function fresh(){const a=load(profileThrough(8));a.launch(9);finish(a);a.turnNotice=null;return a;}
function trigger(a,index=0){const b=a.engine.b,m=b.honroMarkers.filter(m=>m.action==='receiver')[index],u=a.engine.active;Object.assign(u,{x:m.x,y:m.y,acted:false});b.phase='aim';a.turnNotice=null;assert(g.HonroInteractions.use(a,m));assert.equal(b.honroState.receivers,1);assert(!a.dialogue,'must wait for actor boundary');for(let i=0;i<600&&!a.dialogue;i++){a.engine.tick(1/120);g.HonroStory.tick(a,now+=8.334);}assert(a.dialogue?.staging);return m;}
function tick(a,ms=50){g.HonroStory.tick(a,now+=ms);}
function motion(a){for(let i=0;i<160&&!a.dialogue.staging.complete;i++)tick(a);assert(a.dialogue.staging.complete);}
const npc=a=>a.engine.b.units.find(u=>u.id==='npc-sodan');
const stable=b=>plain({round:b.round,phase:b.phase,teamEnds:b.teamEnds,active:b.active,receivers:b.honroState.receivers,units:b.units.filter(u=>u.id!=='npc-sodan'),terrain:b.terrain});
check('New 9 hides Sodan from roster, minimap/target source and speech; old saved battles remain untouched',()=>{
 const a=fresh(),b=a.engine.b;assert(!npc(a));assert(b.honroStaging.hidden['npc-sodan']);assert(!a.canSpeak('소단'));assert(!g.HonroStory.allowed(a,'소단'));assert(!a.stage.story.some(l=>l[0]==='소단'));assert(!g.HonroJourneyContent.interlude(9).some(l=>/손에 붉은 실/.test(l[1])));
 const legacy=plain(b);legacy.units.push(legacy.honroStaging.hidden['npc-sodan']);delete legacy.honroStaging;const p=profileThrough(8);p.honroBattle=legacy;let old=load(p);click('continue');assert(npc(old));assert(!old.engine.b.honroStaging);assert.equal(npc(old).x,3350);assert.equal(S.request(old,'not-registered'),false);
});
check('Either first receiver queues exactly once at the actor boundary, then bell/look/move/hand/dialogue',()=>{
 for(const index of [0,1]){const a=fresh(),sounds=[],focus=[];a.audio.play=s=>sounds.push(s);a.scene.storyFocusPoint=(x,y)=>focus.push({x,y});const m=trigger(a,index),b=a.engine.b,unrelated=stable(b);assert.equal(a.dialogue.staging.context.marker,m.id);assert(!npc(a));assert(!a.canInput());assert.equal(S.request(a,ID,{marker:m.id}),false);motion(a);assert(npc(a));assert.equal(npc(a).x,3274);assert.equal(npc(a).y,g.HonroMapEngine.surfaceY(b.terrain,3274,2390).y);assert.equal(sounds.filter(s=>s==='sodanBell').length,1);assert(focus.some(p=>p.x===3350));assert.deepEqual(stable(b),unrelated);assert(!npc(a).honroScenePose);assert.equal(a.dialogue.lines[0][0],'소단');assert(nodes.get('dialogue-root').innerHTML.includes('거기, 줄에 손대지 마요'));finish(a);assert.equal(b.honroStaging.once[ID],'done');assert.equal(S.request(a,ID),false);}
});
check('Skip at every visual step has one identical final state and preserves full dialogue in the journal',()=>{
 for(const cursor of [0,1,2,3]){const a=fresh();trigger(a);for(let i=0;i<100&&a.dialogue.staging.cursor<cursor;i++)tick(a);assert.equal(a.dialogue.staging.cursor,cursor);const text=plain(a.dialogue.lines);g.HonroStory.finish(a);assert.equal(npc(a).x,3274);assert.equal(a.engine.b.units.filter(u=>u.id==='npc-sodan').length,1);assert.equal(a.engine.b.honroStaging.once[ID],'done');assert.deepEqual(plain(a.profile.honroNarrative.find(x=>x.id===ID).lines),text);g.HonroStory.finish(a);assert.equal(a.engine.b.units.filter(u=>u.id==='npc-sodan').length,1);}
});
check('Middle-move save/reload resumes its exact cursor, elapsed time, coordinates and original camera',()=>{
 let a=fresh();a.scene.x=432;a.scene.y=2100;a.scene.scale=.8;a.scene.manual=true;trigger(a);for(let i=0;i<100&&!(a.dialogue.staging.cursor===2&&a.dialogue.staging.elapsed>=200);i++)tick(a);a.scene.x=3110;a.scene.y=2290;a.scene.scale=.86;g.HonroStory.save(a);const d=plain(a.dialogue),u=plain(npc(a));assert(u.x<3350&&u.x>3274);a=reload();click('continue');assert.deepEqual(plain(a.dialogue),d);assert.equal(npc(a).x,u.x);assert.equal(npc(a).y,u.y);assert.equal(a.scene.x,3110);assert.equal(a.scene.y,2290);assert.equal(a.scene.scale,.86);tick(a);assert.equal(a.dialogue.staging.cursor,2,'zero-dt resume must not treat movement as blocked');motion(a);let restored; a.scene.storyRelease=c=>restored=c;finish(a);assert.deepEqual(plain(restored),d.staging.camera);assert.equal(npc(a).x,3274);
});
check('Space fast-forwards motion only, repeated next/history rendering cannot duplicate the entrance',()=>{
 const a=fresh();trigger(a);g.document.activeElement={dataset:{action:'dialogue-next'}};g.HonroStory.key(a,{code:'Space',repeat:false,preventDefault(){}});assert(a.dialogue.staging.complete);assert.equal(a.dialogue.index,0);const x=npc(a).x;g.HonroStory.draw(a);g.HonroStory.next(a);assert.equal(a.dialogue.index,1);assert.equal(npc(a).x,x);assert.equal(a.engine.b.units.filter(u=>u.id==='npc-sodan').length,1);a.storyHistoryOpen=true;g.HonroStory.next(a);assert.equal(a.dialogue.index,1);a.storyHistoryOpen=false;finish(a);
});
check('Missing anchor, blocked path and dead stored actor never teleport, revive or strand input',()=>{
 for(const kind of ['anchor','wall','dead']){const a=fresh(),b=a.engine.b;trigger(a);if(kind==='anchor')delete b.honroMapAnchors.sodan;if(kind==='wall'){const u=b.honroStaging.hidden['npc-sodan'];b.terrain.push({id:'scene-test-wall',x:u.x-44,y:u.y-180,w:16,h:185,hp:9999,indestructible:true,mat:'rock'});}if(kind==='dead'){b.honroStaging.hidden['npc-sodan'].dead=true;b.honroStaging.hidden['npc-sodan'].hp=0;}g.HonroStory.finish(a);assert(!a.dialogue);assert.equal(b.honroStaging.once[ID],'done');if(kind==='dead')assert(!npc(a));else {assert(npc(a).x<=3350&&npc(a).x>3274);assert(Number.isFinite(npc(a).y));}}
});
check('Crow warning does not leak Sodan before entrance; 9→10 facts and cooperation constraints stay present',()=>{
 const a=fresh(),before=g.HonroStoryContent.eventLines(a,{id:'evac-crows'});assert(before.every(l=>l[0]!=='소단'));trigger(a);motion(a);const after=g.HonroStoryContent.eventLines(a,{id:'evac-crows'});assert(after.some(l=>l[0]==='소단'));const speech=JSON.stringify(a.dialogue.lines);for(const token of ['덕수','걸어서','담허','혼을 떼어','다른 빈자리','가운데','피가','쏟아','영매'])assert(speech.includes(token),token);assert(JSON.stringify(g.HONRO_CONTENT.stages[9].story).includes('아래 세운 두 진을 이 윗마당 양옆과'));assert(JSON.stringify(g.HonroStoryContent.outros[9]).includes('폭포'));assert(JSON.stringify(g.HonroStoryContent.cooperation()).includes('바깥에서 들어오는'));
});
check('Retry creates a fresh hidden actor and no stale scene flags; Workshop uses the same fresh-battle contract',()=>{
 const a=fresh();trigger(a);motion(a);finish(a);a.launch(9);assert(!npc(a));assert.deepEqual(plain(a.engine.b.honroStaging.once),{});const m=g.HONRO_PROJECT.stages[8],b=g.HonroMaps.createBattle(m,g.HONRO_PROJECT,profileThrough(8));assert(!b.units.some(u=>u.id==='npc-sodan'));assert(b.honroStaging.hidden['npc-sodan']);const custom=plain(m);custom.metadata.campaign=false;const authored=g.HonroMaps.createBattle(custom,g.HONRO_PROJECT,profileThrough(8));assert(!authored.honroStaging);assert(authored.units.some(u=>u.id==='npc-sodan'));
});
check('Small registered descriptors resolve current actor/anchor/marker positions and do not create another clock',()=>{
 const a=fresh();S.register({id:'test-short-stage',stage:9,title:'검사',steps:[{type:'look',at:{actor:'knight'},duration:10},{type:'dialogue',lines:[['휘겸','여기 있소.']]}]});assert(S.point(a.engine.b,{actor:'knight'}));assert.equal(S.point(a.engine.b,{anchor:'missing'}),null);a.actorBoundary=a.engine.b.active;assert(S.request(a,'test-short-stage'));assert(a.dialogue.staging);motion(a);finish(a);assert.equal(a.engine.b.honroStaging.once['test-short-stage'],'done');
});
{
 let a=fresh();trigger(a);for(let i=0;i<100&&!(a.dialogue.staging.cursor===2&&a.dialogue.staging.elapsed>=100);i++)tick(a);
 const before=plain(a.dialogue),position=plain(npc(a)),battle=plain(a.engine.b);a.export();const exported=await h.exported();assert.deepEqual(exported.honroBattle.honroStory,before);
 await h.import(exported);click('continue');assert.deepEqual(plain(a.dialogue),before);assert.equal(npc(a).x,position.x);assert.equal(npc(a).y,position.y);assert.deepEqual(plain(a.engine.b.terrain),battle.terrain);motion(a);finish(a);
 checks.push('Mid-scene export/import preserves the same story cursor, actor and terrain');console.log('PASS',checks.at(-1));
}
await report('story-staging',checks,{limits:['DOM/Canvas/audio doubles; sound waveform generation and real rendered movement require separate checks.','Fixture positions, wall and dead-actor state are explicit negative tests.','No new combat, objective, spawn-wave or cooperation predicate.']});
