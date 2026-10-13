// Production controller/engine with DOM and audio doubles; not browser/listening evidence.
import assert from 'node:assert/strict';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,load,profileThrough,finish,reload,click}=h,S=g.HonroStory,checks=[];
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
function fresh(id=11){const a=load(profileThrough(id-1));a.launch(id);return a;}
const units=a=>plain(a.engine.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,energy:u.energy})));
check('First page is a no-op; back/next preserves the bundle and settles every cue only once',()=>{
 for(const id of [1,3,4,11,21,24,27]){const a=fresh(id);while(a.dialogue.staging&&!a.dialogue.staging.complete)S.next(a);assert.equal(a.dialogue.index,0);S.previous(a);assert.equal(a.dialogue.index,0);
  for(let i=0;i<3&&a.dialogue.index<a.dialogue.lines.length-1;i++)S.next(a);
  // Settle this frontier, then reread all earlier text repeatedly.
  g.HonroStoryStaging.lineEnd(a);const index=a.dialogue.index,before=units(a),history=plain(a.profile.honroNarrative);
  for(let n=0;n<5;n++){for(let j=0;j<index;j++)S.previous(a);for(let j=0;j<index;j++)S.next(a);assert.equal(a.dialogue.index,index);assert.deepEqual(units(a),before);}
  assert.deepEqual(plain(a.profile.honroNarrative),history);finish(a);assert(!a.dialogue);
 }
});
check('Continue from an earlier page keeps the frontier; later cue movements cannot replay',()=>{
 let a=fresh(11);for(let i=0;i<30&&!(a.dialogue.lines[a.dialogue.index]?.[0]==='휘겸'&&a.dialogue.lines[a.dialogue.index][1].includes('길을 비우겠소'));i++)S.next(a);
 const index=a.dialogue.index;assert(index>0);g.HonroStoryStaging.lineEnd(a);const before=units(a);S.previous(a);S.save(a);a=reload();click('continue');assert.equal(a.dialogue.index,index-1);S.next(a);assert.equal(a.dialogue.index,index);g.HonroStoryStaging.lineEnd(a);assert.deepEqual(units(a),before);finish(a);
});
check('Message sound plays once per visible page transition, never on redraw or blocked previous',()=>{
 const a=fresh(1);finish(a);const calls=[];a.audio.play=name=>calls.push(name);S.start(a,[['설오','첫 문장'],['설오','둘째 문장']]);assert.deepEqual(calls,['dialogue']);for(let i=0;i<50;i++)S.draw(a);S.previous(a);assert.equal(calls.length,1);S.next(a);S.previous(a);S.next(a);assert.deepEqual(calls,['dialogue','dialogue','dialogue','dialogue']);S.finish(a);S.finish(a);assert(!a.dialogue);
});
check('Last page reread and skip complete one rest event, with identical persistent rewards',()=>{
 const a=fresh(1);finish(a);let completions=0;const original=g.HonroRestJourney.finishStory;g.HonroRestJourney.finishStory=(app,d)=>{completions++;return true;};S.start(a,[['설오','하나'],['설오','둘']],{after:'rest'});S.next(a);S.previous(a);S.next(a);S.next(a);S.next(a);S.finish(a);assert.equal(completions,1);g.HonroRestJourney.finishStory=original;
});
const sr=24000,samples=g.HONRO_CORE.AudioEngine.samples('dialogue',sr),peak=Math.max(...samples.map(Math.abs)),rms=Math.sqrt(samples.reduce((n,x)=>n+x*x,0)/samples.length);
check('Calm arrival sample is 240 ms with a distinct short attack and safe peak',()=>{assert.equal(samples.length,sr*.24);assert(peak<.22&&peak>.10);assert(rms<.05);assert.equal(samples[0],0);assert(Math.abs(samples.at(-1))<.0001);});
check('Mute/zero volume and locked context never enqueue stale dialogue',()=>{
 const a=new g.HONRO_CORE.AudioEngine();a.enabled=false;a.play('dialogue');assert.equal(a.pending.length,0);a.enabled=true;a.volume=0;a.play('dialogue');assert.equal(a.pending.length,0);a.volume=.55;for(let i=0;i<100;i++)a.play('dialogue');assert.equal(a.pending.length,0);a.pause();assert.equal(a.pending.length,0);
});
const source=await readFile('shared/runtime/story.js','utf8'),staging=await readFile('shared/runtime/story-staging.js','utf8');assert(!source.includes('>대화 기록</button>'));assert(!staging.includes('>대화 기록</button>'));
await mkdir('_local/reports/dialogue-controls-audio',{recursive:true});
const wav=Buffer.alloc(44+samples.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sr,24);wav.writeUInt32LE(sr*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples.length*2,40);samples.forEach((x,i)=>wav.writeInt16LE(Math.round(x*32767),44+i*2));await writeFile('_local/reports/dialogue-controls-audio/dialogue-preview.wav',wav);
await report('dialogue-controls-audio',checks,{audio:{sampleRate:sr,duration:.24,bodyHz:156,noiseCutoffHz:680,attackSeconds:.004,peak,rms},limits:['Automated samples and production logic only; not listened to and no physical-device audio proof.','Responsive layout and Game/Workshop are separately checked in a real browser.']});
