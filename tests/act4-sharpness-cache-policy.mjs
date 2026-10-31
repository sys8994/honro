/** Screen/tile policy only; browser visuals and timing need separate validation. */
import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
const g=vm.createContext({HONRO_CONTENT:{},HONRO_CORE:{},HonroTerrainDomain:{active:()=>true},devicePixelRatio:1,performance});vm.runInContext(readFileSync('shared/runtime/renderer.js','utf8'),g);
function scene(w,h){const c={width:1,height:1,getContext:()=>({}),getBoundingClientRect:()=>({width:w,height:h})};return new g.HonroScene(c);}
const opted={honroStage:31,honroMap:{nativeArt:{version:1,coveredTerrainIds:[]}},width:6912,height:4608,sceneVersion:0};
const legacy={honroStage:21,honroMap:{nativeArt:{version:1,coveredTerrainIds:[]}},width:6912,height:4608};
for(const [w,h]of [[390,714],[1000,569],[1920,1080]])for(const dpr of [1,2,3])for(const zoom of [.15,.65,1.05]){g.devicePixelRatio=dpr;const s=scene(w,h);s.scale=zoom;const n=s.size(opted),rs=s._worldRasterScale(opted,w),limit=w<900?12:24,columns=Math.ceil(w*rs/(Math.max(.05,zoom)*512))+1,rows=Math.ceil(h*rs/(Math.max(.05,zoom)*512))+1;assert(n.d<=dpr&&n.d<=3);assert(n.d===1||w*h*n.d*n.d<=6000000+1e-6);assert(columns*rows<=limit||rs===.05);assert(rs<=2**(Math.ceil(Math.log2(zoom*n.d)*4)/4)+1e-9);assert.equal(s.canvas.width,Math.round(w*n.d));}
{g.devicePixelRatio=3;const s=scene(390,714);s.scale=.65;assert.equal(s.size(opted).d,3);assert.equal(s.size(legacy).d,1.7);assert(s._worldRasterScale(opted,390)>.68);assert.equal(s._worldRasterScale(legacy,390),.68);}
{g.devicePixelRatio=.8;const s=scene(390,714);assert.equal(s.size(legacy).d,.8,'legacy sub-unit DPR preserved');}
{g.devicePixelRatio=1;const s=scene(390,714);s.scale=.65;const a=s._worldCacheKey(opted,390);g.devicePixelRatio=2;const b=s._worldCacheKey(opted,390);assert.notEqual(a,b,'DPR changes tile key when bucket changes');}
console.log('PASS Act4 backing pixel budget, DPR/zoom raster buckets, tile-count bound, DPR invalidation and legacy sizing');
