import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,load,profileThrough,reload,click,finish}=h,checks=[];
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
let now=1000;
function tick(a,n=300){for(let i=0;i<n;i++)g.HonroStory.tick(a,now+=50);}
function witness(){const a=load(profileThrough(0));a.launch(1);finish(a);a.turnNotice=null;const u=a.engine.active;Object.assign(u,{x:3105,y:1200});a.actorBoundary=u.id;g.HonroMission.tick(a,1/120);g.HonroStory.drain(a);assert(a.dialogue);return a;}
check('Actual witness trigger holds scene narration until input; exactly one next opens first speech',()=>{
 const a=witness(),b=a.engine.b;assert(a.dialogue.lines[0][1].includes('수레 뒤'));assert.equal(a.dialogue.index,0);const before=plain({round:b.round,phase:b.phase,hp:b.units.map(u=>[u.id,u.hp]),terrain:b.terrain});tick(a,600);assert.equal(a.dialogue.index,0);assert.equal(a.dialogue.lines[0][0],'서술');assert(b.units.some(u=>u.id==='npc-woodcutter'));assert.deepEqual(plain({round:b.round,phase:b.phase,hp:b.units.filter(u=>u.id!=='npc-woodcutter').map(u=>[u.id,u.hp]),terrain:b.terrain}),before);g.HonroStory.next(a);assert.equal(a.dialogue.index,1);assert.equal(a.dialogue.lines[1][1],'사람이오? 아직 길에 짐승이 남았소?');const x=b.units.find(u=>u.id==='npc-woodcutter').x;g.HonroStory.previous(a);tick(a);assert.equal(a.dialogue.index,0);assert.equal(b.units.find(u=>u.id==='npc-woodcutter').x,x);g.HonroStory.next(a);assert.equal(a.dialogue.index,1);
});
check('Continue preserves caption page and cue progress; skip settles once and combat resumes',()=>{
 let a=witness();tick(a,20);g.HonroStory.save(a);const d=plain(a.dialogue);a=reload();click('continue');assert.deepEqual(plain(a.dialogue),d);tick(a,400);assert.equal(a.dialogue.index,0);g.HonroStory.finish(a);assert(!a.dialogue);assert(a.canInput());assert.equal(a.engine.b.units.filter(u=>u.id==='npc-woodcutter').length,1);assert.equal(a.engine.b.honroState.eventLog.filter(e=>e.id==='witness').length,1);g.HonroMission.tick(a,1/120);assert(!a.dialogue);a.engine.tick(1/120);
});
check('All registered before/after caption steps share manual pages and retain authored cues',()=>{
 for(const stage of [9,24]){const a=load(profileThrough(stage-1));a.launch(stage);finish(a);const id=stage===9?'act1-sodan-first-receiver-v1':'act3-split-departure-v2',def=g.HonroStoryStaging.describe(id),lines=[['설오','본문']];const opened=g.HonroStoryStaging.opening(a,lines,{staging:undefined});const compiled=g.HonroStoryStaging.reader(lines,{staging:{id,steps:def.steps,position:def.position||'before',complete:def.position==='after',waitForDialogue:def.position==='after',cues:[[]],context:{},applied:{},results:{}}});assert(compiled.lines.some(l=>l[0]==='서술'));assert(compiled.options.staging.complete);assert(!compiled.options.staging.waitForDialogue);assert.equal(compiled.lines[stage===24?0:compiled.lines.length-1][1],'본문');assert.equal(compiled.options.staging.cues.flat().length,def.steps.length-1);}
});
await report('manual-scene-captions',checks,{limits:['Actual App/Engine with DOM and canvas doubles. Browser captures separately verify native controls and pixels.']});
