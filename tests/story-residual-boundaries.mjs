// Production App/story/staging and save boundaries, with DOM/Canvas doubles.
// Explicit event/prerequisite fixtures are not normal combat or browser proof.
import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,load,reload,click,finish,profileThrough}=h,checks=[];
let now=1000;
const tick=(a,n=1)=>{for(let i=0;i<n;i++)g.HonroStory.tick(a,now+=50);};
const fresh=id=>{const a=load(profileThrough(id-1));a.launch(id);finish(a);a.turnNotice=null;return a;};
const cast=a=>plain(a.engine.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,energy:u.energy,facing:u.facing})));
const resources=a=>plain({round:a.engine.b.round,phase:a.engine.b.phase,teamEnds:a.engine.b.teamEnds,items:a.engine.b.items,heroes:a.engine.b.heroes,state:a.engine.b.honroState.act2,act3:a.engine.b.honroState.act3});
const cases=[
 {stage:10,key:'cooperation',lines:()=>g.HonroStoryContent.cooperation()},
 {stage:10,key:'finale-midpoint',lines:()=>g.HonroStoryContent.finaleMidpoint()},
 {stage:19,key:'old-soul',lines:a=>g.HonroAct2Content.scene('act2-19-old-soul',a.stage.name,a.stage.beats['old-soul'])},
 {stage:30,key:'transport-map',lines:a=>g.HonroAct3Content.scene('act3-30-transport-map',a.stage.name,a.stage.beats['transport-map'])}
];
function queue(a,c){a.actorBoundary=null;g.HonroStory.queue(a,c.lines(a));assert(!a.dialogue);}
function drain(a){const b=a.engine.b;a.actorBoundary=b.active;b.honroState.actorTurnSerial=(b.honroState.actorTurnSerial||0)+1;assert(g.HonroStory.drain(a));assert(a.dialogue.staging?.cues.some(x=>x.length));}
function nextCue(a){for(let i=0;i<30&&a.dialogue&&!a.dialogue.staging.cues[a.dialogue.index]?.length;i++)g.HonroStory.next(a);assert(a.dialogue);tick(a,4);}
function complete(a,mode){if(mode==='read')for(let i=0;i<40&&a.dialogue;i++){tick(a,24);g.HonroStory.next(a);}else finish(a);assert(!a.dialogue);}
function check(name,fn){fn();checks.push(name);console.log('PASS',name);}
for(const c of cases){
 check(`${c.stage}/${c.key}: queued save waits for actor boundary, retains exact lines and drains once`,()=>{
  let a=fresh(c.stage);queue(a,c);const queued=plain(a.engine.b.honroState.storyQueue);g.HonroStory.save(a);a=reload();click('continue');assert(!a.dialogue);assert.deepEqual(plain(a.engine.b.honroState.storyQueue),queued);drain(a);assert.deepEqual(plain(a.dialogue.lines).map(([who,text,{stagingScene,presentation,...meta}])=>[who,text,meta]),queued);finish(a);assert.equal(g.HonroStory.drain(a),false);
 });
 check(`${c.stage}/${c.key}: history pause, mid-cue reload and skip/read have identical final state`,()=>{
  let expected;
  for(const mode of ['instant','partial','reload','read']){
   let a=fresh(c.stage);queue(a,c);drain(a);const before=resources(a),id=a.dialogue.lines[0][2].storyId;
   if(mode!=='instant')nextCue(a);
   if(mode==='reload'){
    const cue=plain(a.dialogue.staging),units=cast(a);a.storyHistoryOpen=true;tick(a,20);assert.deepEqual(plain(a.dialogue.staging),cue);assert.deepEqual(cast(a),units);a.storyHistoryOpen=false;
    g.HonroStory.save(a);const saved=plain(a.dialogue);a=reload();click('continue');assert.deepEqual(plain(a.dialogue),saved);assert.deepEqual(cast(a),units);
   }
   complete(a,mode);assert.deepEqual(resources(a),before);assert(!a.engine.b.units.some(u=>u.honroScenePose));assert.equal(g.HonroStory.drain(a),false);
   const final={cast:cast(a),journal:plain(a.profile.honroNarrative.filter(x=>x.id===id))};assert.equal(final.journal.length,1);if(!expected)expected=final;else assert.deepEqual(final,expected,mode);
   const snapshot=cast(a);g.HonroStory.finish(a);g.HonroStory.next(a);tick(a,2);assert.deepEqual(cast(a),snapshot);assert(!a.dialogue);
  }
 });
}
check('10: real cooperation and midpoint triggers persist their once-only guard across Continue',()=>{
 let a=fresh(10),b=a.engine.b;b.honroEvents=[];b.honroState.receivers=2;a.engine.unit('boss').hp=a.engine.unit('boss').maxHp*.4;a.actorBoundary=b.active;
 g.HonroMission.finale(a);assert(b.honroState.sodanCoop);assert(a.dialogue?.lines.some(l=>l[2]?.storyId.includes('cooperation')));finish(a);
 b.teamEnds[1]+=3;g.HonroMission.finale(a);assert(a.dialogue?.lines.some(l=>l[2]?.storyId.includes('finale-midpoint')));nextCue(a);g.HonroStory.save(a);a=reload();click('continue');finish(a);b=a.engine.b;a.actorBoundary=b.active;
 const waves=plain(b.honroState.finaleWaves),narrative=plain(a.profile.honroNarrative);g.HonroMission.finale(a);g.HonroMission.finale(a);assert(!a.dialogue);assert.deepEqual(plain(b.honroState.finaleWaves),waves);assert.deepEqual(plain(a.profile.honroNarrative),narrative);
});
for(const [id,key,A]of [[19,'old-soul',g.HonroAct2],[30,'transport-map',g.HonroAct3]])check(`${id}/${key}: actual objective commits once and cannot replay after Continue`,()=>{
 let a=fresh(id),b=a.engine.b;const steps=A.steps(b),memory=A.memory(b),target=steps.find(s=>s.id===key);assert(target);
 for(const s of steps){if(s===target)break;memory.done[s.id]=true;}
 const marker=b.honroMarkers.find(m=>m.id===key),u=a.engine.heroesAlive().find(u=>u.cls===(target.requiredClass||'archer'));b.active=u.id;b.phase='aim';b.side=0;u.acted=false;a.actorBoundary=u.id;Object.assign(u,{x:marker.x,y:marker.y});
 for(const enemy of a.engine.alive(1)){enemy.hp=0;enemy.dead=true;}
 // Suppress terminal outcome only: the event under test is the last stage-19 objective.
 a.checkMission=()=>false;assert(A.eligibility(a,marker).ok);assert(A.use(a,marker));assert(A.memory(b).done[key]);assert(!A.use(a,marker));
 if(!a.dialogue){a.actorBoundary=b.active;b.honroState.actorTurnSerial++;assert(g.HonroStory.drain(a));}
 assert(a.dialogue.lines.some(l=>l[2]?.storyId.includes(key)));g.HonroStory.save(a);a=reload();click('continue');finish(a);b=a.engine.b;
 const checkpoints=plain(A.memory(b).checkpoints);assert(!A.use(a,b.honroMarkers.find(m=>m.id===key)));assert.deepEqual(plain(A.memory(b).checkpoints),checkpoints);assert.equal(g.HonroStory.drain(a),false);
});
await report('story-residual-boundaries',checks,{limits:['Production App with DOM/Canvas/audio doubles; event prerequisites are explicit fixtures.','No normal campaign completion or deployed browser rendering claim.']});
