// Independent release review: real production class with a deterministic device double.
// Buffer metadata/PCM checks do not assert speaker quality or physical output latency.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from '../game/node_modules/typescript/lib/typescript.js';
import {readFileSync} from 'node:fs';
const source=readFileSync('shared/engine/src/sound-design.ts','utf8');
function harness(rate){
 const buffers=[],voices=[],idle=[];let resume,now=0;
 class Context{state='suspended';sampleRate=rate;currentTime=0;destination={};
  createGain(){return {gain:{value:0,setTargetAtTime(){}},connect(){}};}
  createDynamicsCompressor(){return {threshold:{},knee:{},ratio:{},attack:{},release:{},connect(){}};}
  createBuffer(channels,length,sampleRate){const b={length,sampleRate,duration:length/sampleRate,copyToChannel(pcm){this.pcm=pcm;}};buffers.push(b);return b;}
  createBufferSource(){const v={connect(){},disconnect(){},start(){},stop(){this.stopped=true;this.onended?.();}};voices.push(v);return v;}
  resume(){return new Promise(resolve=>{resume=()=>{this.state='running';resolve();};});}close(){this.state='closed';}
 }
 const g=vm.createContext({exports:{},require:()=>({BgmPlayer:class{configure(){}unlock(){}setPaused(){}select(){}tick(){}dispose(){}clearDucking(){}},SkillAudioPlayer:class{configure(){}prepareWanted(){}stopAll(){}setPaused(){}dispose(){}}}),AudioContext:Context,performance:{now:()=>now},requestIdleCallback:fn=>idle.push(fn),Float32Array,Map,Set,Promise});
 vm.runInContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,g);
 return {a:new g.exports.AudioEngine(),buffers,voices,idle,resolve:()=>resume(),time:n=>now=n,samples:g.exports.soundSamples};
}
const names=['dialogue','arrow','arrowhit','hit','sword','qiHit','break','down','fire','boom','qiWave','ricochet','split','ceramic','heal','turn','jump','charge','spiritCast','spiritImpact','spiritSummon','meteor','qiRebound','win','lose','sodanBell'];
const synthesis=harness(24000),baselines=new Map(names.map(name=>[name,synthesis.samples(name,24000)]));
for(const rate of [24000,44100,48000]){
 const h=harness(rate),p=h.a.wake();h.resolve();await p;
 assert.equal(h.a.context.sampleRate,rate);
 for(const name of names){h.a.play(name);const b=h.a.buffers.get(name),pcm=baselines.get(name);assert(b,name);assert.equal(b.sampleRate,24000);assert.equal(b.duration,pcm.length/24000);assert.deepEqual(b.pcm,pcm,name+' preserves waveform and truthful rate');}
 assert.equal(h.a.buffers.get('dialogue').duration,.24);assert.equal(h.buffers.length,26);
 // Playback receives identical fixed-rate PCM plus its truthful rate, independent
 // of the device rate: the browser, rather than a wrong sample-rate label, resamples.
 console.log('PASS all 26 SFX PCM/rate/duration contracts at device rate',rate);
}
for(const cancel of [a=>{a.update('main',true);a.update('main',false);},a=>{a.configure({sound:false,volume:.55});a.configure({sound:true,volume:.55});},a=>{a.configure({sound:true,volume:0});a.configure({sound:true,volume:.55});}]){
 const h=harness(48000),p=h.a.wake();h.a.play('dialogue');cancel(h.a);h.resolve();await p;assert.equal(h.voices.length,0);assert.equal(h.a.pending.length,0);h.a.play('dialogue');assert.equal(h.voices.length,1);
}
console.log('PASS rapid hide/show and mute/unmute never revive a cancelled pending cue');
{
 const h=harness(44100),p=h.a.wake();h.a.play('dialogue');h.a.update('main',true);h.a.update('main',false);h.time(20);h.a.play('dialogue');h.resolve();await p;assert.equal(h.voices.length,1);assert.equal(h.a.pending.length,0);
}
console.log('PASS only a new visible event may sound after rapid hide/show');
{
 const h=harness(48000);while(h.idle.length)h.idle.shift()({timeRemaining:()=>10});assert.equal(h.a.pcm.size,26);assert.equal(h.buffers.length,0);const p=h.a.wake();h.resolve();await p;h.a.play('dialogue');assert.equal(h.buffers.length,1);h.a.play('dialogue');assert.equal(h.buffers.length,1);assert.equal(h.a.voices.size,1);
}
console.log('PASS completed first warm creates no device buffers, then reuses one dialogue buffer');
const main=readFileSync('shared/runtime/main.js','utf8');assert(main.includes("this.audio?.update(inBattle?'battle':'main',document.hidden||!!G.HonroAct3Void?.blocked(this),session)"));
console.log('PASS production App pause argument is visibility, not dialogue/ESC state');
