/** Actual weather renderer traces; not browser/animation evidence. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createCanvas} from '@napi-rs/canvas';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
vm.runInContext(await readFile('shared/runtime/renderer.js','utf8'),g);
const calls=[],ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)});
const scene=Object.create(g.HonroScene.prototype),core=Object.create(C.Renderer.prototype),rows=[];
const winds=[-30,-12,-7,-1,-.1,0,.1,1,7,12,30],close=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`),wrapDelta=(a,b,span)=>((b-a+span*1.5)%span)-span*.5;
for(const wind of winds){
 const battle={wind,honroEnvironment:{skyVisible:true}},before=JSON.stringify(battle);Object.assign(scene,{time:0,weatherX:0});
 calls.length=0;scene.weatherParticles(ctx,battle,900,600,0);const start=calls.filter(x=>x[0]==='translate');
 scene.time=.1;calls.length=0;scene.weatherParticles(ctx,battle,900,600,.1);const finish=calls.filter(x=>x[0]==='translate'),angles=calls.filter(x=>x[0]==='rotate');
 assert.equal(finish.length,26);assert.equal(angles.length,26);
 for(let i=0;i<26;i++){
  const dx=wrapDelta(start[i][1],finish[i][1],950),dy=wrapDelta(start[i][2],finish[i][2],630),motion=C.weatherParticleMotion(wind,18+i%5*3,1.7);
  close(dx,motion.vx*.1);close(dy,motion.vy*.1);close(angles[i][1],motion.angle);assert.equal(Math.sign(dx),Math.sign(wind));assert(dy>0);
 }
 assert.equal(JSON.stringify(battle),before);rows.push({renderer:'Scene',wind,vx:wind*1.7,firstAngle:angles[0][1],particles:finish.length});
 for(const region of [0,1,2,3,4,5]){
  Object.assign(core,{time:1,weatherX:wind,low:false,cameraX:0});calls.length=0;core.weather(ctx,900,600,region,wind);
  const angles=calls.filter(x=>x[0]==='rotate');
  if([0,4].includes(region))for(let i=0;i<angles.length;i++)close(angles[i][1],C.weatherParticleMotion(wind,20+i%5*3).angle);
  if([1,2,3,5].includes(region)){
   const segments=[];let path=[];for(const call of calls){if(call[0]==='beginPath')path=[];else if(['moveTo','lineTo'].includes(call[0]))path.push(call);else if(call[0]==='stroke'&&path.length===2)segments.push(path);}
   assert(segments.length>0);for(const [i,[a,b]] of segments.entries()){
    const index=region===3?i*4:i,rate=region===1||region===2?150+index%7*8:region===3?-28-index%5*3:20+index%5*3;
    close((b[1]-a[1])/(b[2]-a[2]),wind*2.8/rate);
   }
  }
  rows.push({renderer:'core',region,wind});
 }
}
Object.assign(scene,{time:140,weatherX:73});calls.length=0;scene.weatherParticles(ctx,{wind:12},900,600,0);const before=calls.filter(x=>x[0]==='translate');
scene.time=140.1;calls.length=0;scene.weatherParticles(ctx,{wind:-7},900,600,.1);const after=calls.filter(x=>x[0]==='translate');
for(let i=0;i<26;i++)close(wrapDelta(before[i][1],after[i][1],950),-7*1.7*.1);
calls.length=0;scene.weatherParticles(ctx,{wind:0,honroEnvironment:{skyVisible:false}},900,600,.1);assert.equal(calls.length,0);
const out='_local/reports/aim-wind-audio';await mkdir(out,{recursive:true});
const canvas=createCanvas(1320,840),c=canvas.getContext('2d');c.fillStyle='#142329';c.fillRect(0,0,1320,840);
for(const [col,wind] of [-12,0,12].entries())for(let row=0;row<4;row++){
 c.save();c.translate(col*440,row*210);c.beginPath();c.rect(0,0,440,210);c.clip();c.fillStyle=row%2?'#1e3035':'#172930';c.fillRect(0,0,440,210);
 if(row===0){Object.assign(scene,{time:1,weatherX:0});scene.weatherParticles(c,{wind},440,210,1);}else{Object.assign(core,{time:1,weatherX:wind,low:false,cameraX:0});core.weather(c,440,210,[0,1,0,5][row],wind);}
 c.fillStyle='#e2d5b8';c.font='15px sans-serif';c.fillText(`${['Live leaves / petals','Rain','Falling leaves','Pale motes'][row]} | wind ${wind}`,12,25);c.restore();
}
await writeFile(`${out}/weather-wind.png`,canvas.toBuffer('image/png'));
await writeFile(`${out}/weather-wind.json`,JSON.stringify({passed:true,rows,windChangeContinuity:true,hiddenSky:true,limitations:['Production traces and native Canvas; actual browser animation is separate.']},null,2)+'\n');
console.log('PASS 11 signed winds × 7 render variants, 286 live deltas, reversal continuity, hidden sky');
