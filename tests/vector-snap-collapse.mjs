import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import vm from 'node:vm';
const s=await readFile('shared/map/vector-art.js','utf8'),a=s.indexOf('function applyClip('),z=s.indexOf('// Long imported compounds',a);assert(a>=0&&z>a);const apply=vm.runInNewContext('('+s.slice(a,z).trim()+')');
const original={},unit={};function run(m,r,snap=true){const calls=[],ctx={getTransform:()=>({...m}),setTransform:(...v)=>calls.push(['transform',...v]),clip:p=>calls.push(['clip',p])};apply(ctx,{clip:original,...(snap?{snapRect:r,snapPath:unit}:{})});return calls;}
const M={a:1,b:0,c:0,d:1,e:.1,f:.1};
for(const r of [[0,0,10,.1],[0,0,.1,10],[0,0,.1,.1]]){const c=run(M,r);assert.equal(c.length,1);assert.equal(c[0][1],original);}
for(const m of [M,{...M,a:-1,d:-1,e:10.1,f:10.1}]){const c=run(m,[0,0,10,10]);assert.equal(c.length,3);assert.equal(c[1][1],unit);assert.equal(c[0][1],10);assert.equal(c[0][4],10);}
for(const [m,snap] of [[{...M,b:.2},true],[M,false]]){const c=run(m,[0,0,10,10],snap);assert.equal(c.length,1);assert.equal(c[0][1],original);}
for(const [H,y,z]of [[763,3035.01,1331/6800],[696,3035.01,390/6800]]){const sy=5*3.23*z,ty=H/2+(886.75-858.1*5)*3.23*z-y*z;const c=run({a:3.23*z,b:0,c:0,d:sy,e:0,f:ty},[0,858.1,1774,858.2]);assert.equal(c.length,1);assert.equal(c[0][1],original);}
console.log(JSON.stringify({collapsedHeightWidthFallback:true,normalSnap:true,negativeScale:true,shear:true,nonSnap:true,stage3ObservedCameras:true}));
