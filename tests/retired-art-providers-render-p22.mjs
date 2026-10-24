/** P2.2 differential using the existing static-screen-cache production Canvas setup. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const baseline=process.env.HONRO_PROVIDER_BASELINE;
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtimeParts} from '../shared/build.mjs';
const native=createRequire(import.meta.url)('@napi-rs/canvas'),hash=v=>createHash('sha256').update(v).digest('hex'),loaded={};
const changed=new Set(['renderer','environment-renderer','terrain-readability','stage18-bell-art','act1-spatial-art'].map(n=>'shared/runtime/'+n+'.js'));
const read=async path=>{const bytes=baseline&&changed.has(path)?execFileSync('git',['show',baseline+':'+path],{maxBuffer:8e6}):await readFile(path);loaded[path]=hash(bytes);return bytes;};
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
const manifest=await text('shared/build.mjs'),match=manifest.match(/for\(const name of (\['renderer'[^\]]+\])\)await file\(`shared\/runtime\/\$\{name\}\.js`\);/);assert(match,'Production render manifest is explicit');
const renderNames=[...match[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);assert.equal(new Set(renderNames).size,renderNames.length);
g.HONRO_AUTHORED_FAR=JSON.parse(await text('shared/assets/environment/campaign-far/manifest.json'));for(const [key,file]of Object.entries(g.HONRO_AUTHORED_FAR.images))g.HONRO_AUTHORED_FAR.images[key]='data:image/webp;base64,'+(await read('shared/assets/environment/campaign-far/'+file)).toString('base64');
for(const name of renderNames)vm.runInContext(await text('shared/runtime/'+name+'.js'),g);
assert(manifest.includes("if(render)await file('shared/runtime/authored-far-art.js')"));vm.runInContext(await text('shared/runtime/authored-far-art.js'),g);
g.HonroAct1Background.ready();g.HonroAct2SpatialArt.ready();g.HonroAuthoredFarArt.ready(1);g.HonroAuthoredFarArt.ready(18);
for(let n=0;n<100&&(!g.HonroAuthoredFarArt.ready(1)||!g.HonroAuthoredFarArt.ready(18)||!g.HonroAct1Background.ready()||!g.HonroAct2SpatialArt.ready());n++)await new Promise(resolve=>setTimeout(resolve,20));
assert(g.HonroAuthoredFarArt.ready(1)&&g.HonroAuthoredFarArt.ready(18),'Current raster far images demand-decode before either paint');

vm.runInContext('Date.now=()=>1792819000000;Math.random=()=>.246813579;',g);
if(baseline)assert.equal(g.HonroPaintedPresentation.providers.length,0);else assert.equal(g.HonroPaintedPresentation,undefined);
const rows=[];
for(const id of [1,18,0])for(const view of [{w:960,h:640,z:.65},{w:390,h:844,z:.48},{w:960,h:640,z:1.2}]){
 const profile=g.HONRO_CORE.defaults();profile.recruited=['archer','mage','knight','occultist'];
 const b=id?g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[id-1],g.HONRO_PROJECT,profile,{origin:'campaign'}):g.HONRO_CORE.createBattle(1,profile,'practice',{party:['archer']});
 if(!id){b.honroCustom=true;b.honroStage=0;b.honroBackdrop='forest';assert(!g.HonroTerrainDomain.active(b));}
 else {g.HonroStageRules.sanitizeStageBattle(b);g.HonroEncounters.configure(b);g.HonroProgression.initialize(b,profile);}
 const e=new g.HONRO_CORE.Engine(b,()=>{},false),app={engine:e,stage:g.HONRO_CONTENT.stages[Math.max(0,id-1)],profile,training:!id,done:false,dirty:false,event(){},sayLines(){},checkMission(){return false;}};
 if(id)for(const name of ['HonroAllies','HonroEncounters','HonroAct2','HonroAct3','HonroSplitCampaign','HonroStakeCrossing'])g[name].attach(app,e);
 const cv=canvas(view.w,view.h),scene=new g.HonroScene(cv),u=e.active,body=b.honroLandmarks?.find(l=>l.id==='sb-bell-body');
 if(id===18)assert.equal(body.asset.params.approvedArtRevision,8);
 Object.assign(scene,{x:body?.x??u.x+140,y:body?body.y-350:u.y-150,scale:view.z,manual:true,time:2});
 const before=JSON.stringify(b);scene.render(e,0,'',.6,false,0);scene.render(e,0,'',.6,false,0);const pixels=hash(Buffer.from(cv.getContext('2d').getImageData(0,0,view.w,view.h).data));
 assert.equal(JSON.stringify(b),before);assert((scene._domainTiles?.tiles.size||0)<=(view.w<900?12:24));
 rows.push({id,view,pixels,raster:scene._worldRasterScale(b,view.w),tiles:scene._domainTiles?.tiles.size||0});
 for(const t of scene._domainTiles?.tiles?.values()||[])t.canvas.width=1;for(const name of ['_screenWorldCache','_screenBackgroundCache','_staticWorldCache','_backgroundCache'])if(scene[name]?.canvas)scene[name].canvas.width=1;cv.width=1;
}
// Legacy non-pilot soundWindow stays live, with exact clipping and overlay selection.
const asset={bounds:{x:0,y:0,w:100,h:100},params:{soundWindow:{interiorReveal:'M20 20h30v30h-30Z',overlays:['front']}},vector:{root:{children:[{id:'back'},{id:'front'}]}}};
const art=g.HonroStage18BellArt,q=art.bellPaint(asset,{honroStage:18});assert.equal(q.paint,asset);assert.equal(art.bellPaint(asset,{}),q);assert.deepEqual(q.overlays.vector.root.children,asset.vector.root.children.filter(n=>n.id==='front'));assert.equal(art.bellPaint({...asset,params:{...asset.params,approvedArtRevision:8}},{}),null);
const result={rows,soundWindow:{clip:q.clip.toSVGString(),overlays:JSON.parse(JSON.stringify(q.overlays)),cacheRetained:true}};
await mkdir('_local/reports/retired-art-providers-p22',{recursive:true});
if(!baseline)assert.deepEqual(result,JSON.parse(await readFile('_local/reports/retired-art-providers-p22/baseline.json','utf8')));
await writeFile('_local/reports/retired-art-providers-p22/'+(baseline?'baseline':'current')+'.json',JSON.stringify(result,null,2));console.log('PASS '+(baseline?'baseline capture':'exact baseline/current')+' 9 native render outputs (TerrainDomain/approved18/custom, desktop/mobile/close), tile cap/scale/state, legacy soundWindow');
