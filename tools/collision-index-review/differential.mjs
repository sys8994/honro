import assert from'node:assert/strict';import{readFile,writeFile}from'node:fs/promises';import{performance}from'node:perf_hooks';import * as old from './fixtures/math-baseline.ts';import * as opt from '../../shared/engine/src/math.ts';
const {terrains}=JSON.parse(await readFile('tools/collision-index-review/geometry-fixtures.json'));
let seed=7393;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;}let count=0;const cases=[];
function test(a,b,t,pad,skip){for(const fn of ['segmentTerrain','segmentProjectileTerrain','segmentPlatformSurface']){assert.deepEqual(opt[fn](a,b,t,pad,skip),old[fn](a,b,t,pad,skip),`${fn} ${t.id} ${JSON.stringify({a,b,pad,skip})}`);count++;}if(cases.length<20000)cases.push([a,b,t,pad,skip]);}
for(const t of terrains){for(let n=0;n<350;n++){const a={x:t.x+(random()*1.4-.2)*t.w,y:t.y+(random()*1.4-.2)*t.h},b={x:a.x+(random()-.5)*100,y:a.y+(random()-.5)*100};test(a,b,t,[0,3,8,22,-.1,-1,-10][n%7],n%5===0?[n%(t.vertices?.length||4)]:undefined);}
const pts=old.poly(t);for(let i=0;i<pts.length;i+=Math.max(1,Math.floor(pts.length/35))){const p=pts[i],q=pts[(i+1)%pts.length];for(const eps of[0,1e-8,-1e-8,1e-7,-1e-7]){test({x:p.x,y:p.y+eps},{x:q.x,y:q.y+eps},t,0);test({x:p.x,y:p.y-30},{x:p.x,y:p.y+30},t,3,[i]);}}
// Mutate same vertices reference then replace/resize. Every cached coordinate matters.
if(t.vertices?.length>=32){test({x:t.x,y:t.y-20},{x:t.x,y:t.y+20},t,0);t.vertices[17].x+=.125;test({x:t.x,y:t.y-20},{x:t.x,y:t.y+20},t,0);t.vertices[17].x-=.125;}
}
// Anchored collision ordering: identical candidates must leave first terrain selected.
for(const [a,b,t,pad,skip]of cases.slice(0,1500)){function collide(m){let best=null;for(const terrain of[t,{...t,id:t.id+'tie'}]){let h=m.segmentTerrain(a,b,terrain,pad,skip);if(h&&(!best||h.t<best.t))best={...h,id:terrain.id};}return best;}assert.deepEqual(collide(old),collide(opt));}
const timings={};for(const [name,m]of[['old',old],['candidate',opt]]){let checksum=0;const start=performance.now();for(const [a,b,t,pad,skip]of cases){const h=m.segmentTerrain(a,b,t,pad,skip);checksum+=h?.t||0;}timings[name]={ms:performance.now()-start,checksum};}
const result={scope:'Pure math differential only; not Native or FPS',terrains:terrains.length,cases:count,anchoredOrdering:1500,timings};await writeFile('_local/collision-index/result.json',JSON.stringify(result,null,2));console.log(result);
