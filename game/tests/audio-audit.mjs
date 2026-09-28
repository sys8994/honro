import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {runtime,gameRoot} from './helpers.mjs';
const g=await runtime(),samples=g.HONRO_CORE.AudioEngine.samples,sr=24000;
const engine=await readFile(gameRoot+'/../shared/engine/src/engine.ts','utf8');
const names=['arrow','arrowhit','sword','fire','charge','meteor','boom','hit','break','ricochet','split','heal','down','win','lose','turn','jump'];
for(const [,name]of engine.matchAll(/emit\('sound',\s*\{\s*name:\s*'([^']+)'/g))assert.ok(names.includes(name),'Unknown sound event: '+name);
// Windowed spectrum of the audible attack/body, independent of recipe metadata.
function spectrum(data){
  const n=4096,power=[];
  for(let k=1;k<n/2;k++){
    const w=2*Math.PI*k/n,co=2*Math.cos(w);let a=0,b=0;
    for(let i=0;i<n;i++){const v=(data[i]||0)*(.5-.5*Math.cos(2*Math.PI*i/(n-1)))+co*a-b;b=a;a=v;}
    power.push({hz:k*sr/n,p:a*a+b*b-co*a*b});
  }
  const total=power.reduce((s,x)=>s+x.p,0),below=power.filter(x=>x.hz<500).reduce((s,x)=>s+x.p,0);
  return {peakHz:power.reduce((a,b)=>a.p>b.p?a:b).hz,energyBelow500Hz:below/total};
}
const checks=[];
for(const name of names){
  const data=samples(name,sr),peak=data.reduce((s,x)=>Math.max(s,Math.abs(x)),0),rms=Math.sqrt(data.reduce((s,x)=>s+x*x,0)/data.length),spec=spectrum(data);
  assert.ok(peak<.85&&rms>.003,`${name} must be audible without clipping`);
  assert.ok(spec.peakHz<400&&spec.energyBelow500Hz>.65,`${name} must keep a low material body`);
  assert.ok(Math.abs(data[0])<.001&&Math.abs(data.at(-1))<.001,`${name} has no abrupt clicks`);
  checks.push({name,seconds:data.length/sr,peak,rms,...spec});
}
assert.equal(samples('click').length,0);assert.equal(samples('unknown').length,0);
// A standalone audition reel: arrow, impact, sword, fire, explosion, turn.
const audition=['arrow','arrowhit','sword','fire','boom','turn'],chunks=audition.map(name=>samples(name,sr)),length=chunks.reduce((n,x)=>n+x.length+sr*.35,0);
const wave=Buffer.alloc(44+length*2);wave.write('RIFF');wave.writeUInt32LE(wave.length-8,4);wave.write('WAVEfmt ',8);wave.writeUInt32LE(16,16);wave.writeUInt16LE(1,20);wave.writeUInt16LE(1,22);wave.writeUInt32LE(sr,24);wave.writeUInt32LE(sr*2,28);wave.writeUInt16LE(2,32);wave.writeUInt16LE(16,34);wave.write('data',36);wave.writeUInt32LE(length*2,40);
let offset=44;for(const data of chunks){for(const x of data){wave.writeInt16LE(Math.round(x*32767),offset);offset+=2;}offset+=sr*.35*2;}
await writeFile(gameRoot+'/../_local/game-reports/sound-audition.wav',wave);
await writeFile(gameRoot+'/../_local/game-reports/audio-audit.json',JSON.stringify({sampleRate:sr,passed:checks.length+2,audition,checks},null,2)+'\n');
console.log(JSON.stringify({passed:checks.length+2,checks},null,2));
