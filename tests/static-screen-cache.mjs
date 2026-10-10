/** Static screen-raster correctness and bounded invalidation. Native Canvas only. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtimeParts} from '../shared/build.mjs';
const native=createRequire(import.meta.url)('@napi-rs/canvas'),hash=v=>createHash('sha256').update(v).digest('hex'),loaded={};
const read=async path=>{const bytes=await readFile(path);loaded[path]=hash(bytes);return bytes;};
const text=async path=>(await read(path)).toString('utf8');
function canvas(w=64,h=64){const cv=native.createCanvas(w,h);Object.defineProperties(cv,{clientWidth:{get:()=>w},clientHeight:{get:()=>h}});cv.getBoundingClientRect=()=>({left:0,top:0,width:w,height:h});return cv;}
const images=[];class Image extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;images.push(this);}get src(){return super.src;}}
const g=vm.createContext({console,performance,structuredClone,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,Image,document:{createElement:()=>canvas(),querySelector:()=>null,getElementById:()=>null},navigator:{userAgent:'honro-native-screen-cache'},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout,clearTimeout});g.window=g;
// The model builder transpiles current TypeScript in memory. With vector/render
// false it does not call any party, monster or actor asset-writing generator.
const model=await runtimeParts({vector:false,render:false});for(const src of model)vm.runInContext(src,g);
for(const path of ['shared/runtime/party-rig.js','shared/assets/party/party.runtime.js'])vm.runInContext(await text(path),g);
vm.runInContext((await text('shared/assets/rebuild-game-adapter.mjs')).replace(/^export /gm,'')+'\nglobalThis.HonroArcherVisual=HonroArcherVisual;globalThis.HonroPartyVisual=HonroPartyVisual;',g);
g.HONRO_ACT1_FAR_DATA={};for(const[key,name]of[['mountains','act1-far.svg'],['gorge','act1-gorge.svg'],['dawn','act2-dawn.svg'],['act3','act3-far.svg']])g.HONRO_ACT1_FAR_DATA[key]='data:image/svg+xml;base64,'+(await read('shared/assets/environment/'+name)).toString('base64');
g.HONRO_ACT2_FAR_DATA={};for(const[key,name]of[['clouded','act2-clouded-granite.svg'],['dawn','act2-dawn.svg'],['stage11-ravine','stage11-ravine-far.svg'],['stage11-ravine-readable','stage11-ravine-far-readable.svg']])g.HONRO_ACT2_FAR_DATA[key]='data:image/svg+xml;base64,'+(await read('shared/assets/environment/'+name)).toString('base64');
for(const path of ['shared/assets/monsters/monsters.runtime.js','shared/assets/actors/actors.runtime.js'])vm.runInContext(await text(path),g);
// Read the current single production manifest; do not invent another renderer
// bundle or call runtimeParts(render:true), which regenerates asset files.
const manifest=await text('shared/build.mjs'),match=manifest.match(/for\(const name of (\['renderer'[^\]]+\])\)parts\.push\(await read\(`shared\/runtime\/\$\{name\}\.js`\)\);/);assert(match,'Production render manifest is explicit');
const renderNames=[...match[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);assert.equal(new Set(renderNames).size,renderNames.length);
for(const name of renderNames)vm.runInContext(await text('shared/runtime/'+name+'.js'),g);
await new Promise(resolve=>setTimeout(resolve,20));assert(images.length>0&&images.every(i=>i.complete&&i.naturalWidth>0),'Current background images decode before either paint');


const results=[];
function release(scene,cv){for(const t of scene._domainTiles?.tiles?.values()||[])t.canvas.width=1;for(const name of ['_screenWorldCache','_screenBackgroundCache','_staticWorldCache','_backgroundCache'])if(scene[name]?.canvas)scene[name].canvas.width=1;cv.width=1;global.gc?.();}
for(const id of [1,11,14,22])for(const view of [{w:960,h:640,z:.82},{w:390,h:844,z:.48}]){
 const profile=g.HONRO_CORE.defaults();profile.recruited=['archer','mage','knight','occultist'];
 const b=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[id-1],g.HONRO_PROJECT,profile,{origin:'campaign'});g.HonroStageRules.sanitizeStageBattle(b);g.HonroEncounters.configure(b);g.HonroProgression.initialize(b,profile);
 const e=new g.HONRO_CORE.Engine(b,()=>{},false),app={engine:e,stage:g.HONRO_CONTENT.stages[id-1],profile,training:false,done:false,dirty:false,event(){},sayLines(){},checkMission(){return false;}};
 for(const name of ['HonroAllies','HonroEncounters','HonroAct2','HonroAct3','HonroSplitCampaign','HonroStakeCrossing'])g[name].attach(app,e);
 const cv=canvas(view.w,view.h),scene=new g.HonroScene(cv),u=e.active;Object.assign(scene,{x:id===11?2790:u.x+140,y:id===11?5970:u.y-150,scale:view.z,manual:true,time:2});
 const snapshot=JSON.stringify(b),method=scene._screenRaster,paint=()=>{scene.render(e,0,'',.6,false,0);return Buffer.from(cv.getContext('2d').getImageData(0,0,view.w,view.h).data);};
 scene._screenRaster=()=>false;const reference=paint();scene._screenRaster=method;paint();paint();const cached=paint();assert(reference.equals(cached),'Pixel-exact stationary raster stage '+id+' '+JSON.stringify(view));
 const stats=scene.renderCacheStats();assert(stats.screenWorldBytes<=24000000&&stats.screenBackgroundBytes<=24000000);assert(stats.screenHits>0);
 for(let i=0;i<8;i++){scene.x+=3;scene.scale+=.001;paint();}
 assert.equal(scene.renderCacheStats().screenBuilds,stats.screenBuilds,'Continuous movement/zoom never allocates a screen raster');
 paint();const settled=scene.renderCacheStats();assert(settled.screenBuilds>stats.screenBuilds,'Settling builds once');paint();assert.equal(scene.renderCacheStats().screenBuilds,settled.screenBuilds);
 b.sceneVersion++;paint();assert.equal(scene._screenWorldCache.canvas,undefined,'Scene change evicts raster immediately');paint();assert(scene._screenWorldCache.canvas);b.sceneVersion--;
 assert.equal(JSON.stringify(b),snapshot,'Render and invalidation do not mutate battle');
 results.push({id,view,pixelExact:true,continuousZoomBuilds:0,cache:scene.renderCacheStats()});release(scene,cv);
}
// Synthetic >6M view tests the cap without allocating the oversized target.
const cv=canvas(20,20),scene=new g.HonroScene(cv),c=cv.getContext('2d');scene.scale=1;let calls=0;const draw=()=>calls++;
const large={globalAlpha:1,globalCompositeOperation:'source-over',canvas:{width:3001,height:2000},getTransform:()=>c.getTransform()};
assert.equal(scene._screenRaster(large,'large',3001,2000,draw,'_screenWorldCache'),false);assert.equal(scene._screenRaster(large,'large',3001,2000,draw,'_screenWorldCache'),false);assert.equal(calls,0);assert.equal(scene._screenWorldCache.canvas,undefined);
c.globalAlpha=.5;assert.equal(scene._screenRaster(c,'alpha',20,20,draw,'_screenWorldCache'),false);assert.equal(calls,0);
await mkdir('_local/reports/render-lag',{recursive:true});await writeFile('_local/reports/render-lag/contracts.json',JSON.stringify({passed:true,results,limits:['Native Canvas pixel/cache contracts, not browser frame rate or normal combat.']},null,2));console.log('PASS',results.length,'pixel-exact production views; movement, zoom, scene invalidation and 6M pixel cap');
