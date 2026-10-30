// Geometry fixtures are tests only; never production artwork.
import assert from 'node:assert/strict';
import {fitModule} from './fit-module.mjs';
const source={id:'math-fixture',anchor:{x:20,y:10},collision:[],params:{},vector:{version:1,viewBox:[0,0,10,10],root:{tag:'g',children:[{tag:'path',d:'M0 0H10V5H0Z',fill:'#234567'}]}}};
const config={id:'fitted',sourceTop:[[0,0],[10,0]],targetTop:[[100,200],[110,202],[130,198]],depthScale:2,forbiddenPaths:['M150 150H160V160H150Z']},original=JSON.stringify(source);
const {asset,report}=fitModule(source,config);assert.equal(JSON.stringify(source),original);assert.deepEqual(asset.vector.symbols['native-module'],source.vector.root);assert.deepEqual(asset.collision,[]);assert.deepEqual(asset.anchor,{x:0,y:0});assert.equal(report.scaleX,3);assert.equal(report.protectedCorridorsChecked,1);assert.equal(report.outputBounds.x,100);assert.equal(report.outputBounds.w,30);assert.equal(report.outputBounds.y,198);assert.equal(report.outputBounds.h,14);assert.equal(report.mappingErrorAtAnchors,0);assert(report.nodes<=512);assert(report.maxDepth<=24);assert(report.maxPathChars<=60000);
for(const seg of report.segments){const[a,c,,d,b,f]=seg.transform;for(const sx of[(seg.lo-b)/a,(seg.hi-b)/a]){const tx=a*sx+b,ty=c*sx+f;const i=tx<=110?0:1,[x0,y0]=config.targetTop[i],[x1,y1]=config.targetTop[i+1];assert(Math.abs(ty-(y0+(tx-x0)*(y1-y0)/(x1-x0)))<1e-7);assert.equal(d,2);}}
assert.throws(()=>fitModule(source,{...config,forbiddenPaths:['M105 200H115V210H105Z']}),/protected corridor/);
assert.throws(()=>fitModule(source,{...config,sourceTop:[[1,0],[10,0]]}),/span full artwork/);
assert.throws(()=>fitModule({...source,collision:[{}]},config),/Artwork must not supply collision/);
assert.throws(()=>fitModule(source,{...config,targetTop:[[1,1],[0,0]]}),/strictly increase/);
assert.throws(()=>fitModule(source,{...config,depthScale:0}));
const many=Array.from({length:300},(_,i)=>[100+i,200+i%2]);assert.throws(()=>fitModule(source,{...config,targetTop:many}),/budget exceeded/);
console.log('PASS source immutable; exact piecewise contact and depth mapping; tight transformed bounds; no collision; corridor overlap rejected; limits enforced');
const hole=structuredClone(source);hole.vector.root.children[0].d='M0 0H10V10H0ZM3 3H7V7H3Z';hole.vector.root.children[0].fillRule='evenodd';
const hr=fitModule(hole,{id:'hole',sourceTop:[[0,0],[10,0]],targetTop:[[0,0],[10,0]],forbiddenPaths:['M4 4H6V6H4Z']});assert.equal(hr.report.protectedCorridorsChecked,1);
console.log('PASS even-odd hole remains an open protected corridor');
