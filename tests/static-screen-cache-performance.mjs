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


await mkdir('_local/reports/render-lag',{recursive:true});
const results=[],samples=12,warmups=4;
const cases=[...[1,1.25,1.5,1.7].map(dpr=>({id:11,dpr})),...[1,8,12,14,16,17,18,22,23,30].map(id=>({id,dpr:1}))];
for(const {id,dpr} of cases){
 g.devicePixelRatio=dpr;
 const profile=g.HONRO_CORE.defaults();profile.recruited=['archer','mage','knight','occultist'];
 const b=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[id-1],g.HONRO_PROJECT,profile,{origin:'campaign'});g.HonroStageRules.sanitizeStageBattle(b);g.HonroEncounters.configure(b);g.HonroProgression.initialize(b,profile);
 const e=new g.HONRO_CORE.Engine(b,()=>{},false),app={engine:e,stage:g.HONRO_CONTENT.stages[id-1],profile,training:false,done:false,dirty:false,event(){},sayLines(){},checkMission(){return false;}};
 for(const name of ['HonroAllies','HonroEncounters','HonroAct2','HonroAct3','HonroSplitCampaign','HonroStakeCrossing'])g[name].attach(app,e);
 const u=e.active;if(id===11)Object.assign(u,{x:2670,y:6137,angle:44,ranks:{...u.ranks,A08:8}});
 const cv=canvas(1910,1018),scene=new g.HonroScene(cv);Object.assign(scene,{x:id===11?2790:u.x+140,y:id===11?5970:u.y-150,scale:.82,manual:true,time:2});
 const method=scene._screenRaster,rows=[];let reference;
 for(const mode of ['baseline','candidate','baseline','candidate']){
  scene._screenRaster=mode==='baseline'?()=>false:method;const times=[];
  for(let i=0;i<samples+warmups;i++){
   const start=performance.now();scene.render(e,0,id===11?'A08':'',1,id===11,0);
   // Force Native deferred raster work to finish; no GPU/browser timing claim.
   cv.getContext('2d').getImageData(0,0,1,1);if(i>=warmups)times.push(performance.now()-start);
   await new Promise(r=>setTimeout(r,0));
  }
  const pixels=Buffer.from(cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data);if(!reference)reference=pixels;else assert(reference.equals(pixels),'Pixel-exact paired '+id+' DPR '+dpr);
  if(id===11)await writeFile('_local/reports/render-lag/stage11-'+mode+'-dpr'+dpr+'.png',cv.toBuffer('image/png'));
  const sorted=times.slice().sort((a,z)=>a-z);rows.push({mode,medianMs:sorted[Math.floor(sorted.length/2)],p95Ms:sorted[Math.ceil(sorted.length*.95)-1],rawMs:times,cache:scene.renderCacheStats()});
 }
 const result={id,dpr,viewport:{w:1910,h:1018},backing:{w:cv.width,h:cv.height},camera:{x:scene.x,y:scene.y,scale:scene.scale},pixelExact:true,rows};results.push(result);console.log(JSON.stringify({id,dpr,pixelExact:true,rows:rows.map(r=>({mode:r.mode,medianMs:r.medianMs,p95Ms:r.p95Ms}))}));
 for(const t of scene._domainTiles?.tiles?.values()||[])t.canvas.width=1;for(const name of ['_screenWorldCache','_screenBackgroundCache','_staticWorldCache','_backgroundCache'])if(scene[name]?.canvas)scene[name].canvas.width=1;cv.width=1;global.gc?.();
 await writeFile('_local/reports/render-lag/performance.json',JSON.stringify({source:loaded,modelSha256:hash(model.join('\n')),samples,warmups,results,limits:['Native Canvas CPU raster only. Every sample flushes deferred raster work; no browser FPS claim.','Same live Scene and battle, frozen effects, alternating baseline/candidate; baseline disables only the added screen raster.','Stage11 camera approximates supplied screenshot; other stages use entry cameras. No input-only combat or AI-turn benchmark.']},null,2));
}
