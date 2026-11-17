/** Independent Native alpha coverage; no browser, saves or image files. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createCanvas,Path2D,DOMMatrix} from '@napi-rs/canvas';
import {runtimeParts} from '../../shared/build.mjs';
const g=vm.createContext({console,structuredClone,performance,Path2D,DOMMatrix,setTimeout,clearTimeout});g.window=g;
for(const source of await runtimeParts({vector:true,render:false,productionStory:true}))vm.runInContext(source,g);
const p=g.HONRO_PROJECT,s=p.stages.find(s=>s.metadata?.stageId===10),b=g.HonroMaps.createBattle(s,p);
g.HonroStageRules.sanitizeStageBattle(b);
const l=b.honroLandmarks.find(l=>l.asset?.id==='act1-traced:stage10-tree-v1');assert(l);
const a=l.asset,plain=v=>JSON.parse(JSON.stringify(v));
assert.deepEqual({x:l.x,y:l.y,scale:l.scale},{x:2500,y:2180,scale:1});
assert.deepEqual(plain(a.anchor),{x:0,y:0});
assert.deepEqual(plain(a.bounds),{x:-1040,y:-1660,w:2100,h:1840});
const before=JSON.stringify({stage:s,asset:a,placement:l});
// A 200px margin on every side reveals painted pixels outside registration.
const width=2500,height=2240,ox=1240,oy=1860,cv=createCanvas(width,height),c=cv.getContext('2d');
c.translate(ox,oy);assert(g.HonroVectorArt.draw(c,a,{x:0,y:0,scale:1}));
const rgba=c.getImageData(0,0,width,height).data;
let left=width,top=height,right=-1,bottom=-1;
for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(rgba[(y*width+x)*4+3]>0){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
assert(right>=0,'Tree rendered no pixels');
assert(left>0&&top>0&&right<width-1&&bottom<height-1,'Expanded probe itself clipped artwork');
const local={left:left-ox,top:top-oy,right:right-ox,bottom:bottom-oy},r=a.bounds;
assert(local.left>=r.x&&local.top>=r.y&&local.right<r.x+r.w&&local.bottom<r.y+r.h,'Tree alpha escapes registered bounds');
assert.equal(JSON.stringify({stage:s,asset:a,placement:l}),before,'Read-only render changed source');
console.log(JSON.stringify({asset:a.id,registered:r,alphaLocal:local,alphaWorld:{left:local.left+l.x,top:local.top+l.y,right:local.right+l.x,bottom:local.bottom+l.y},topClearance:local.top-r.y,placementUnchanged:true,scope:'Native alpha coverage only; not browser or combat acceptance.'}));
