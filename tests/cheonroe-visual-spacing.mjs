import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildCore} from '../game/engine/build.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);const C=g.HONRO_CORE;
const rays=[0,17,34,51].map(x=>({kind:'lightningBolt',text:'cheonroe',x,y:0,x2:x,y2:1000,age:0,life:.9,size:3.5}));
const gaps=C.cheonroeVisualGaps(rays);assert.equal(gaps.size,4);for(const gap of gaps.values())assert.equal(gap,17);
const single=C.cheonroeVisualGaps([rays[0]]);assert.equal(single.get(rays[0]),Infinity);
for(const gap of [0,17,38,100,Infinity])for(const phase of [0,1,2]){
 const {trunk,forks}=C.lightningPaths(100,0,100,1000,phase,true,gap);
 assert.equal(forks.length,3);assert.deepEqual(JSON.parse(JSON.stringify(trunk[0])),{x:100,y:0});assert.deepEqual(JSON.parse(JSON.stringify(trunk.at(-1))),{x:100,y:1000});
 assert(trunk.every(p=>Math.abs(p.x-100)<=Math.min(12,Math.max(1.5,gap*.28))+1e-8));
 for(const fork of forks)assert(Math.abs(fork.at(-1).x-fork[0].x)<=Math.min(24,Math.max(4,gap*.6))*1.5+1e-8);
}
assert.equal(C.lightningPaths(0,0,0,1000).forks.length,6); // M04 retains its existing default.
assert.equal(C.cheonroeVisualGaps([{...rays[0],age:1}]).size,0);
assert.equal(C.cheonroeVisualGaps([{...rays[0],text:undefined}]).size,0);
console.log('PASS visual-only spacing: all rays, endpoints, close jitter/fork bounds, isolated strength, default lightning unchanged');
