// Real App/story/engine; DOM, audio and Canvas are doubles. No playthrough claim.
import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,load,profileThrough,finish,click,reload}=h,S=g.HonroStoryStaging,checks=[];let now=1000;
function tick(a,frames=1){for(let i=0;i<frames;i++)g.HonroStory.tick(a,now+=50);}
function fresh(id){const a=load(profileThrough(id-1));a.launch(id);return a;}
function next(a){g.HonroStory.next(a);}
function to(a,who,text){for(let i=0;i<30&&a.dialogue;i++){const l=a.dialogue.lines[a.dialogue.index];if(l?.[0]===who&&l[1].includes(text))return;next(a);}throw Error('missing line '+who+text);}
function check(name,fn){fn();checks.push(name);console.log('PASS',name);}
const resources=b=>plain({round:b.round,phase:b.phase,active:b.active,teamEnds:b.teamEnds,projectiles:b.projectiles,terrain:b.terrain,units:[...b.units,...Object.values(b.honroStaging.hidden)].map(u=>({id:u.id,hp:u.hp,energy:u.energy,moveLeft:u.moveLeft,acted:u.acted,fixed:u.fixed,loadout:u.loadout,ranks:u.ranks})).sort((a,b)=>a.id.localeCompare(b.id))});
check('All 30 campaign entries have authored actions without advancing combat, resources or objectives',()=>{
 for(let id=1;id<=30;id++){const a=fresh(id),b=a.engine.b;assert(a.dialogue?.staging?.cues?.some(xs=>xs.length),'stage '+id);const before=resources(b),text=plain(a.dialogue.lines.map(l=>l.slice(0,2)));
  for(let i=0;i<40&&a.dialogue;i++){tick(a,20);next(a);}assert(!a.dialogue);assert.deepEqual(resources(b),before,'combat paused in '+id);assert(!b.units.some(u=>u.honroScenePose));assert(a.profile.honroNarrative.some(record=>record.lines.some(l=>l[1]===text[0][1])));
 }
});
check('Woodcutter stays hidden until his event reaches the actor boundary; first meetings reveal the same actor once',()=>{
 const a=fresh(1);finish(a);const b=a.engine.b,u=b.honroStaging.hidden['npc-woodcutter'];assert(u);assert(!b.units.includes(u));
 a.actorBoundary=null;g.HonroStory.queue(a,g.HonroStoryContent.eventLines(a,{id:'witness'}));assert(!a.dialogue);a.actorBoundary=b.active;b.honroState.actorTurnSerial=(b.honroState.actorTurnSerial||0)+1;assert(g.HonroStory.drain(a));assert(!b.units.includes(u));tick(a,50);assert(b.units.includes(u));assert.equal(u.x,3178);finish(a);assert.equal(b.units.filter(v=>v.id===u.id).length,1);
 const knight=fresh(3);assert(knight.engine.b.honroStaging.hidden['npc-hwigyeom']);tick(knight,50);assert(knight.engine.b.units.some(u=>u.id==='npc-hwigyeom'&&u.x===1376));finish(knight);
 const gate=fresh(4);assert(gate.engine.b.honroStaging.hidden['npc-chunrye']);to(gate,'춘례','붕대');assert(gate.engine.b.units.some(u=>u.id==='npc-chunrye'));tick(gate,25);const resident=gate.engine.unit('npc-chunrye');assert.equal(resident.x,812);finish(gate);
});
check('Dialogue and walking overlap; page rendering/history cannot restart movement; mid-cue reload keeps its origin',()=>{
 let a=fresh(11);to(a,'휘겸','길을 비우겠소');const u=a.engine.heroesAlive().find(u=>u.cls==='knight'),x=u.x;tick(a,5);assert(u.x>x&&u.x<x+22);assert.equal(u.honroScenePose.kind,'move');const index=a.dialogue.index;
 const before=plain(a.dialogue.staging.cue);g.HonroStory.draw(a);assert.deepEqual(plain(a.dialogue.staging.cue),before);
 const heldX=u.x;a.storyHistoryOpen=true;tick(a,20);assert.equal(u.x,heldX);assert.deepEqual(plain(a.dialogue.staging.cue),before);a.storyHistoryOpen=false;
 g.HonroStory.save(a);const d=plain(a.dialogue),p={x:u.x,y:u.y};a=reload();click('continue');assert.deepEqual(plain(a.dialogue),d);assert.equal(a.dialogue.index,index);assert.equal(a.engine.unit(u.id).x,p.x);tick(a,30);assert.equal(a.engine.unit(u.id).x,x+22);next(a);assert(!a.engine.unit(u.id).honroScenePose);finish(a);
});
check('Skip at different points yields the same entrances, positions, resources, journal and unlocked input',()=>{
 for(const id of [1,3,4,11,21,24,27]){let expected;for(const mode of ['instant','partial','read']){const a=fresh(id);if(mode==='partial'){tick(a,17);next(a);tick(a,7);}if(mode==='read'){for(let i=0;i<35&&a.dialogue;i++){tick(a,25);next(a);}}finish(a);a.turnNotice=null;const final=plain(a.engine.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,energy:u.energy,facing:u.facing})));if(!expected)expected=final;else assert.deepEqual(final,expected,'stage '+id+' '+mode);assert(a.canInput());assert(!a.engine.b.units.some(u=>u.honroScenePose));}}
});
check('Blocked/missing/dead cast fails safely; old dialogue, old battles and custom scripts stay intact',()=>{
 for(const mode of ['dead','missing','wall']){const a=fresh(3),b=a.engine.b,u=b.honroStaging.hidden['npc-hwigyeom'];if(mode==='dead'){u.dead=true;u.hp=0;}if(mode==='missing')delete b.honroStaging.hidden[u.id];if(mode==='wall')b.terrain.push({id:'scene-test-wall',x:1390,y:u.y-200,w:20,h:300,mat:'rock',hp:9999,indestructible:true});tick(a,80);finish(a);assert(!a.dialogue);if(mode==='dead')assert(!b.units.includes(u));if(mode==='wall')assert(u.x>=1410);}
 const a=fresh(12);finish(a);delete a.engine.b.honroStaging;g.HonroStory.start(a,[['설오','옛 저장의 말']],{after:'entry'});assert(!a.dialogue.staging);finish(a);a.engine.b.honroCustom=true;g.HonroStory.start(a,[['설오','바위에 제가 낸 자국입니다.']],{after:'entry'});assert(!a.dialogue.staging);finish(a);
});
check('First-spirit shots use the captured living enemy; presentation never casts a skill or reveals a dead target',()=>{
 const a=fresh(11);finish(a);const b=a.engine.b,spirit=b.units.find(u=>u.honroSpirit&&u.side===1);assert(spirit);const hp=spirit.hp;
 const lines=[['설오','저 혼령입니다.'],['휘겸','그림자가 없소.'],['소단','제 눈에는 보여요.'],['설오','가리켜 주세요.'],['소단','현형부를 붙이면 돼요.']].map(l=>[...l,{storyId:'act2:first-spirit-encounter',sceneTarget:spirit.id}]);g.HonroStory.start(a,lines);assert.equal(a.dialogue.staging.context.spirit,spirit.id);tick(a,20);assert.equal(spirit.hp,hp);assert(!spirit.honroManifest);assert.equal(S.point(b,{actor:'$spirit'},a.dialogue.staging.context).x,spirit.x);spirit.dead=true;spirit.hp=0;assert.equal(S.point(b,{actor:'$spirit'},a.dialogue.staging.context),null);finish(a);
});
await report('story-direction',checks,{limits:['Explicit fixture encounters and blocked paths; no normal 30-stage playthrough.','Actual browser framing, rigs, keyboard and deployed artifacts are checked separately.']});
