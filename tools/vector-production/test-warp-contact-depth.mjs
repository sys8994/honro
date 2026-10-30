/** Mathematical fixtures only, not authored game artwork. */
import assert from 'node:assert/strict';
import {warpContactDepth} from './warp-contact-depth.mjs';
const source={id:'fixture',collision:[],reference:{},params:{},vector:{version:1,viewBox:[0,0,10,10],root:{tag:'path',d:'M0 0H10V10H0Z',fill:'#777777'}}};
const sourceTop=[{x:0,y:0},{x:4,y:2},{x:10,y:1}],targetTop=[{x:0,y:4},{x:3,y:8},{x:12,y:2},{x:25,y:6}],original=JSON.stringify(source);
const {asset,report}=warpContactDepth(source,{id:'fixture-target',sourceTop,targetTop,start:0,end:25,depth:3});
const height=(p,x)=>{for(let i=1;i<p.length;i++)if(x>=p[i-1].x-1e-7&&x<=p[i].x+1e-7){const a=p[i-1],b=p[i];return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}throw Error('No profile');};
for(const s of report.segments){const[a,c,,d,b,f]=s.transform;assert.equal(d,1);assert.equal(Math.abs(a),1);for(const x of[s.lo,(s.lo+s.hi)/2,s.hi])for(const depth of[0,1,3]){const sx=(x-b)/a,sy=height(sourceTop,sx)+depth;assert(Math.abs(c*sx+d*sy+f-height(targetTop,x)-depth)<1e-7);}}
assert.equal(JSON.stringify(source),original);assert.deepEqual(asset.vector.symbols['contact-source'],source.vector.root);assert(report.segments.some(s=>s.mirror));assert.equal(report.segments.at(-1).hi,25);assert(report.expandedNodes<=512&&report.maxDepth<=24&&report.maxPathChars<=60000);assert.deepEqual(asset.collision,[]);
assert.throws(()=>warpContactDepth({...source,collision:[{}]},{id:'bad',sourceTop,targetTop,start:0,end:25}));
console.log('PASS exact source-depth mapping, mirrored/cropped tiles, immutable shared source, empty collision and runtime budgets');

const shallow=warpContactDepth(source,{id:'fixture-shallow',sourceTop,targetTop,start:0,end:25,depth:1.5,depthScale:.5});
for(const s of shallow.report.segments){const[a,c,,d,b,f]=s.transform;assert.equal(d,.5);for(const x of[s.lo,(s.lo+s.hi)/2,s.hi])for(const sourceDepth of[0,1,3]){const sx=(x-b)/a,sy=height(sourceTop,sx)+sourceDepth;assert(Math.abs(c*sx+d*sy+f-height(targetTop,x)-sourceDepth*.5)<1e-7);}}
assert.equal(shallow.asset.bounds.x,asset.bounds.x);assert.equal(shallow.asset.bounds.w,asset.bounds.w);assert.equal(shallow.asset.bounds.y,asset.bounds.y);assert.equal(shallow.asset.bounds.h,asset.bounds.h-1.5);assert.equal(shallow.report.expandedNodes,report.expandedNodes);assert.deepEqual(shallow.asset.collision,[]);assert(shallow.report.artProportionVariant);assert.equal(report.depthScale,1);
assert.throws(()=>warpContactDepth(source,{id:'bad-scale',sourceTop,targetTop,start:0,end:25,depthScale:0}));
console.log('PASS optional .5 depth scale maps depths0/1/3 to0/.5/1.5; unchanged X/top/physics/budgets, intentional art-proportion variant');
