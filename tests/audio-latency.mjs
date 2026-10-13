// Production SFX in a deterministic WebAudio double. Not physical-device/listening evidence.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from '../game/node_modules/typescript/lib/typescript.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const source=await readFile('shared/engine/src/sound-design.ts','utf8');
function harness(code=source){
 let now=0,resolveResume,rejectResume,contexts=0,resumes=0;const idle=[],created=[],synthesis=[];
 class Context{
  state='suspended';sampleRate=48000;currentTime=0;destination={};
  constructor(options){contexts++;assert.equal(options.latencyHint,'interactive');}
  createGain(){return {gain:{value:0,setTargetAtTime(){}},connect(){}};}
  createDynamicsCompressor(){return {threshold:{},knee:{},ratio:{},attack:{},release:{},connect(){}};}
  createBuffer(channels,length,rate){synthesis.push({length,rate});return {copyToChannel(){}};}
  createBufferSource(){const s={connect(){},disconnect(){},start(){this.started=now;},stop(){this.stopped=true;this.onended?.();}};created.push(s);return s;}
  resume(){resumes++;return new Promise((resolve,reject)=>{resolveResume=()=>{this.state='running';resolve();};rejectResume=reject;});}
  close(){this.state='closed';}
 }
 const context=vm.createContext({module:{exports:{}},exports:{},require:()=>({BgmPlayer:class{configure(){}unlock(){}setPaused(){}select(){}tick(){}dispose(){}}}),performance:{now:()=>now},AudioContext:Context,requestIdleCallback:fn=>idle.push(fn),Float32Array,Map,Set,Promise,Math,console});context.exports=context.module.exports;
 vm.runInContext(ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,context);
 const a=new context.module.exports.AudioEngine();
 return {a,created,idle,synthesis,get contexts(){return contexts;},get resumes(){return resumes;},time:n=>now=n,resolve:()=>resolveResume(),reject:()=>rejectResume(new Error('NotAllowedError')),samples:context.module.exports.soundSamples};
}
const checks=[];const check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS',name);};
await check('Prepares fixed-rate PCM in bounded 256-sample idle tasks before any device or autoplay request',()=>{
 const h=harness();assert.equal(h.contexts,0);assert.equal(h.idle.length,1);assert.equal(h.a.pcm.size,0);
 while(h.idle.length){const n=h.a.pcm.size;h.idle.shift()();assert(h.a.pcm.size===n||h.a.pcm.size===n+1);}
 assert.equal(h.a.pcm.size,26);assert.equal(h.contexts,0);assert.equal(h.synthesis.length,0);
});
await check('Concurrent unlocks share one resume; only the latest page plays within 80 ms',async()=>{
 const h=harness();const p=h.a.wake();assert.equal(h.a.wake(),p);assert.equal(h.resumes,1);
 for(let i=0;i<100;i++)h.a.play('dialogue');assert.equal(h.a.pending.length,1);h.time(30);h.resolve();await p;
 assert.equal(h.created.length,1);assert.equal(h.created[0].started,30);assert.equal(h.synthesis[0].rate,24000);assert.equal(h.a.pending.length,0);
});
await check('Slow resume drops old SFX rather than sounding late; later gesture cannot replay locked events',async()=>{
 for(const name of ['dialogue','arrow','hit']){const h=harness();h.a.play(name);assert.equal(h.a.pending.length,0);const p=h.a.wake();h.a.play(name);h.time(81);h.resolve();await p;assert.equal(h.created.length,0);h.a.play(name);assert.equal(h.created.length,1);}
});
await check('Skip/close, mute, zero, hidden and disposal cancel pending cues through asynchronous resume',async()=>{
 for(const cancel of [a=>a.stop('dialogue'),a=>a.pause(),a=>a.configure({sound:false,volume:.55}),a=>a.configure({sound:true,volume:0}),a=>a.update('main',true),a=>a.dispose()]){
  const h=harness();const p=h.a.wake();h.a.play('dialogue');cancel(h.a);h.resolve();await p;assert.equal(h.created.length,0);assert.equal(h.a.pending.length,0);
 }
});
await check('Rapid previous/next replaces the one dialogue voice without stopping combat SFX',async()=>{
 const h=harness();const p=h.a.wake();h.resolve();await p;h.a.play('hit');
 for(let i=0;i<100;i++)h.a.play('dialogue');assert.equal(h.a.voices.size,2);assert(!h.created[0].stopped);assert.equal(h.created.filter(s=>!s.stopped).length,2);
 h.a.stop('dialogue');assert.equal(h.a.voices.size,1);h.a.pause();assert.equal(h.a.voices.size,0);
});
await check('Autoplay denial clears pending audio; next permitted gesture has no replay',async()=>{
 const h=harness();const p=h.a.wake();h.a.play('dialogue');h.reject();assert.equal(await p,false);assert.equal(h.a.pending.length,0);
 const q=h.a.wake();h.resolve();await q;assert.equal(h.created.length,0);
});
await check('Hidden playback is suppressed and return does not revive old cues',async()=>{
 const h=harness();let p=h.a.wake();h.resolve();await p;h.a.play('dialogue');h.a.update('main',true);h.a.play('dialogue');assert.equal(h.a.voices.size,0);assert.equal(h.a.pending.length,0);h.a.update('main',false);await h.a.wake();assert.equal(h.created.length,1);h.time(100);h.a.play('dialogue');assert.equal(h.created.length,2);
});
const baseline=execFileSync('git',['show','28b829abb3a108f522be9f35aceca4795de637bd:shared/engine/src/sound-design.ts'],{encoding:'utf8'});
const old=harness(baseline),current=harness();
await check('Existing combat waveforms remain byte-identical at 24 and 48 kHz',()=>{for(const name of ['arrow','arrowhit','hit','sword','qiHit','break','down','fire','boom','qiWave','ricochet','split','ceramic','heal','turn','jump','charge','spiritCast','spiritImpact','spiritSummon','meteor','qiRebound','win','lose','sodanBell'])for(const sr of [24000,48000])assert.deepEqual(current.samples(name,sr),old.samples(name,sr));});
function metrics(samples){const sr=24000;let peak=0,peakIndex=0,sum=0,early=0;for(let i=0;i<samples.length;i++){sum+=samples[i]**2;if(i<sr*.02)early+=samples[i]**2;if(Math.abs(samples[i])>peak){peak=Math.abs(samples[i]);peakIndex=i;}}return {peak,peakMs:peakIndex/sr*1000,rms:Math.sqrt(sum/samples.length),first20msRms:Math.sqrt(early/(sr*.02)),onsetMs:samples.findIndex(x=>Math.abs(x)>.01)/sr*1000};}
const before=metrics(old.samples('dialogue')),after=metrics(current.samples('dialogue'));
await check('Dialogue has earlier onset and stronger first 20 ms without a loud/clipped peak',()=>{assert(after.onsetMs<before.onsetMs);assert(after.first20msRms>before.first20msRms*2);assert(after.peak<.22);assert(after.peakMs<10);assert(after.rms<.05);});
const preparation=[];while(current.idle.length){const t=performance.now();current.idle.shift()();preparation.push(performance.now()-t);}
const story=await readFile('shared/runtime/story.js','utf8');assert(story.includes("if(!d){app.audio?.stop?.('dialogue');"));
await mkdir('_local/reports/audio-latency',{recursive:true});await writeFile('_local/reports/audio-latency/results.json',JSON.stringify({checks,before,after,preparation:{tasks:preparation.length,maxMs:Math.max(...preparation),p95Ms:[...preparation].sort((a,b)=>a-b)[Math.floor(preparation.length*.95)],totalMs:preparation.reduce((a,b)=>a+b,0)},limits:['WebAudio doubles and PCM analysis; no speaker, Bluetooth, OS output latency or listening claim.']},null,2));
console.log(JSON.stringify({before,after,preparationMaxMs:Math.max(...preparation)},null,2));
