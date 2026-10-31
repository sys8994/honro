// Focused original-raster/selection/cache contracts; not actual App GUI acceptance.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createCanvas,Image,loadImage} from '@napi-rs/canvas';
import {assertExactBytes} from './exact-byte-check.mjs';
const read=p=>fs.readFile(new URL('../'+p,import.meta.url));
const code=String(await read('shared/runtime/authored-far-art.js'));
const manifest=JSON.parse(await read('shared/assets/environment/campaign-far/manifest.json'));
assert.equal(manifest.images.act4Estuary,'act4-estuary.webp','cache must load the quality-checked operational asset');
const webp=await read('shared/assets/environment/campaign-far/'+manifest.images.act4Estuary);
// Original-to-operational quality and identity are checked separately by act4-estuary-quality.mjs.
const requestCode=code.slice(code.indexOf('function request('),code.indexOf('function layers('));
const g=vm.createContext({Image,document:{createElement:()=>createCanvas(1,1)},manifest:{images:{act4Estuary:webp,act4Dawn:webp,act4Sea:webp,forest:webp}},cache:new Map(),MAX:3});
vm.runInContext(requestCode+';globalThis.requestForTest=request;',g);
const item=g.requestForTest('act4Estuary','blue-sea-mist-day-v1');
assert.equal(item,g.requestForTest('act4Estuary'),'obsolete mood cannot fork or recolor the source');
async function decoded(item){for(let i=0;i<200&&!item.canvas;i++)await new Promise(r=>setTimeout(r,5));assert(item.canvas,'image decoded');return item.canvas;}
const cv=await decoded(item),expected=createCanvas(cv.width,cv.height);
expected.getContext('2d').drawImage(await loadImage(webp),0,0,cv.width,cv.height);
assert.equal(cv.width,2048,'existing decode width cap');assert.equal(cv.height,682);
assertExactBytes(Buffer.from(cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data),Buffer.from(expected.getContext('2d').getImageData(0,0,cv.width,cv.height).data),'authored palette receives no filter, recolor or wash');
for(const key of ['act4Dawn','act4Sea','forest'])await decoded(g.requestForTest(key));
assert.equal(g.cache.size,3,'existing LRU cap');assert(!g.cache.has('act4Estuary:'),'least recent decode evicted');
// Use the production opt-in validator, not a second test-only definition.
const h=vm.createContext({});vm.runInContext(String(await read('shared/runtime/act4-pilot-art.js')),h);
let fallback=0,scenery=0;
class Scene{};Object.assign(Scene.prototype,{background(){fallback++;},landmark(){},_worldCacheKey(){return 'base';},_screenRaster(){return false;}});
Object.assign(h,{Image,document:{createElement:()=>createCanvas(1,1)},HonroScene:Scene,HONRO_AUTHORED_FAR:{...manifest,images:Object.fromEntries(Object.keys(manifest.images).map(k=>[k,webp]))},HonroEnvironment:{act1BackdropFrame:(scene,w,hh,b,iw,ih)=>({x:-scene.x*.1,y:-scene.y*.1,w:iw,h:ih})},HonroVisualStyle:{raw:c=>c},HonroEnvironmentRenderer:{customSpatialScenery(){scenery++;}}});
vm.runInContext(code,h);
const api=h.HonroAuthoredFarArt,scene=new Scene();scene.x=0;scene.y=0;
const native={honroStage:31,honroCustom:true,honroAct4Preview:31,honroPreviewFar:{key:'act4Sea',mood:'blue-sea-mist-day-v1',frameZoom:1.5},honroMap:{nativeArt:{version:1,coveredTerrainIds:[],preservePalette:true}}};
const before=JSON.stringify(native);
assert.equal(api.frames(scene,800,600,native)[0].key,'act4Estuary');
assert.equal(api.ready(31,native.honroPreviewFar,native),false,'pause cannot freeze before actual estuary decode');
for(let i=0;i<200&&!api.ready(31,native.honroPreviewFar,native);i++)await new Promise(r=>setTimeout(r,5));
assert(api.ready(31,native.honroPreviewFar,native));
const a=api.frames(scene,800,600,native)[0];scene.x=100;scene.y=50;const b=api.frames(scene,800,600,native)[0];
assert.equal(b.frame.x-a.frame.x,-10);assert.equal(b.frame.y-a.frame.y,-5);assert.equal(b.frame.w,2048,'old preview zoom does not crop new authored composition');assert.equal(b.mood,'');
scene.background(createCanvas(800,600).getContext('2d'),800,600,native);assert.equal(fallback,0);assert.equal(scenery,1,'existing dynamic scenery path retained');
assert.equal(JSON.stringify(native),before,'world, boat and event data not mutated');
for(const stage of [31,32,35,40]){
 const ordinary={honroStage:stage,honroCustom:true,honroAct4Preview:stage,honroPreviewFar:{key:'act4Dawn',mood:'blue-sea-mist-day-v1'}};
 assert.equal(api.frames(scene,800,600,ordinary)[0].key,'act4Dawn');
 // Native-Art opt-in now supports every Act 4 stage (47cf9558): an
 // explicit registered far key wins; an omitted/unknown key falls back to estuary.
 const configured={...ordinary,honroMap:{nativeArt:{...native.honroMap.nativeArt,far:'act4FarHarbor'}}};
 assert.equal(api.frames(scene,800,600,configured)[0].key,'act4FarHarbor');
 assert.equal(api.frames(scene,800,600,{...ordinary,honroMap:native.honroMap})[0].key,'act4Estuary');
 assert.equal(api.frames(scene,800,600,{...ordinary,honroMap:{nativeArt:{...native.honroMap.nativeArt,far:'unknown'}}})[0].key,'act4Estuary');
}
for(const q of [{version:2,coveredTerrainIds:[]},{version:1}])assert.equal(api.frames(scene,800,600,{...native,honroMap:{nativeArt:q}})[0].key,'act4Sea');
assert.equal(api.keyFor(31),manifest.stages[31]?.key||null,'campaign stage default unchanged');
console.log('PASS: operational WebP cache pixel parity, authored palette, opt-in isolation, parallax, decode readiness, LRU and no world mutation (not App GUI acceptance)');
