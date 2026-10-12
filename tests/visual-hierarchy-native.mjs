/** Static screen-raster correctness and bounded invalidation. Native Canvas only. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {runtimeParts} from '../shared/build.mjs';
const native=createRequire(import.meta.url)('@napi-rs/canvas'),hash=v=>createHash('sha256').update(v).digest('hex'),loaded={};
const read=async path=>{const bytes=await readFile(path);loaded[path]=hash(bytes);return bytes;};
const label=process.env.HONRO_VISUAL_LABEL||'after',base='fc7c8eb80b83c35c8c06ddf873753f3db4da4483';
const text=async path=>label==='before'&&(['shared/build.mjs','shared/map/vector-art.js'].includes(path)||path.startsWith('shared/runtime/'))?execFileSync('git',['show',base+':'+path],{encoding:'utf8'}):(await read(path)).toString('utf8');
function canvas(w=64,h=64){const cv=native.createCanvas(w,h);Object.defineProperties(cv,{clientWidth:{get:()=>w},clientHeight:{get:()=>h}});cv.getBoundingClientRect=()=>({left:0,top:0,width:w,height:h});return cv;}
const images=[];class Image extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;images.push(this);}get src(){return super.src;}}
const g=vm.createContext({console,performance,structuredClone,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,Image,document:{createElement:()=>canvas(),querySelector:()=>null,getElementById:()=>null},navigator:{userAgent:'honro-native-screen-cache'},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout,clearTimeout});g.window=g;
// The model builder transpiles current TypeScript in memory. With vector/render
// false it does not call any party, monster or actor asset-writing generator.
const model=await runtimeParts({vector:false,render:false});for(const src of model)vm.runInContext(src,g);if(label==='before')vm.runInContext(await text('shared/map/vector-art.js'),g);
for(const path of ['shared/runtime/party-rig.js','shared/assets/party/party.runtime.js'])vm.runInContext(await text(path),g);
vm.runInContext((await text('shared/assets/rebuild-game-adapter.mjs')).replace(/^export /gm,'')+'\nglobalThis.HonroArcherVisual=HonroArcherVisual;globalThis.HonroPartyVisual=HonroPartyVisual;',g);
g.HONRO_ACT1_FAR_DATA={};for(const[key,name]of[['mountains','act1-far.svg'],['gorge','act1-gorge.svg'],['dawn','act2-dawn.svg'],['act3','act3-far.svg']])g.HONRO_ACT1_FAR_DATA[key]='data:image/svg+xml;base64,'+Buffer.from((await read('shared/assets/environment/'+name)).toString('utf8').replace(label==='after'?/\bstroke="[^"]*"/g:/$^/g,'stroke="none"')).toString('base64');
g.HONRO_ACT2_FAR_DATA={};for(const[key,name]of[['clouded','act2-clouded-granite.svg'],['dawn','act2-dawn.svg'],['stage11-ravine','stage11-ravine-far.svg'],['stage11-ravine-readable','stage11-ravine-far-readable.svg']])g.HONRO_ACT2_FAR_DATA[key]='data:image/svg+xml;base64,'+Buffer.from((await read('shared/assets/environment/'+name)).toString('utf8').replace(label==='after'?/\bstroke="[^"]*"/g:/$^/g,'stroke="none"')).toString('base64');
for(const path of ['shared/assets/monsters/monsters.runtime.js','shared/assets/actors/actors.runtime.js'])vm.runInContext(await text(path),g);
// Read the current single production manifest; do not invent another renderer
// bundle or call runtimeParts(render:true), which regenerates asset files.
const manifest=await text('shared/build.mjs'),match=manifest.match(/for\(const name of (\['renderer'[^\]]+\])\)parts\.push\(await read\(`shared\/runtime\/\$\{name\}\.js`\)\);/);assert(match,'Production render manifest is explicit');
const renderNames=[...match[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);assert.equal(new Set(renderNames).size,renderNames.length);
for(const name of renderNames)vm.runInContext(await text('shared/runtime/'+name+'.js'),g);
await new Promise(resolve=>setTimeout(resolve,20));assert(images.length>0&&images.every(i=>i.complete&&i.naturalWidth>0),'Current background images decode before either paint');



const out='_local/reports/visual-hierarchy';await mkdir(out,{recursive:true});const results=[];
const views=[{id:17,name:'reference-worksite',w:720,h:1180,x:1550,y:3960,z:.44},{id:17,name:'worksite-zoomed-out',w:1200,h:760,x:3400,y:4210,z:.27},{id:1,name:'forest',w:960,h:640,z:.58},{id:8,name:'bier',w:960,h:640,z:.48},{id:14,name:'cave-market',w:960,h:640,x:4730,y:3910,z:.48},{id:18,name:'bell',w:960,h:640,z:.48},{id:23,name:'cargo-yard',w:960,h:640,z:.48},{id:25,name:'town',w:960,h:640,z:.48},{id:30,name:'ferry',w:960,h:640,z:.48}];
for(const view of views){
 const profile=g.HONRO_CORE.defaults();profile.recruited=['archer','mage','knight','occultist'];
 const b=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[view.id-1],g.HONRO_PROJECT,profile,{origin:'campaign'});b.session='visual-hierarchy-'+view.id;g.HonroStageRules.sanitizeStageBattle(b);g.HonroEncounters.configure(b);g.HonroProgression.initialize(b,profile);
 const e=new g.HONRO_CORE.Engine(b,()=>{},false),app={engine:e,stage:g.HONRO_CONTENT.stages[view.id-1],profile,training:false,done:false,dirty:false,event(){},sayLines(){},checkMission(){return false;}};
 for(const name of ['HonroAllies','HonroEncounters','HonroAct2','HonroAct3','HonroSplitCampaign','HonroStakeCrossing'])g[name].attach(app,e);
 const u=e.active,cv=canvas(view.w,view.h),scene=new g.HonroScene(cv);Object.assign(scene,{x:view.x??u.x+180,y:view.y??u.y-120,scale:view.z,manual:true,time:2});
 const snapshot=JSON.stringify(b),times=[];for(let i=0;i<7;i++){const start=performance.now();scene.render(e,0,'',.6,false,0);cv.getContext('2d').getImageData(0,0,1,1);if(i>2)times.push(performance.now()-start);}
 assert.equal(JSON.stringify(b),snapshot,'Presentation is read-only');
 const file=`${label}-${view.id}-${view.name}.png`,bytes=cv.toBuffer('image/png');await writeFile(out+'/'+file,bytes);results.push({view,file,pngSha256:hash(bytes),battleSha256:hash(snapshot),camera:{x:scene.x,y:scene.y,z:scene.scale},times,cache:scene.renderCacheStats()});
 for(const t of scene._domainTiles?.tiles?.values()||[])t.canvas.width=1;for(const k of ['_screenWorldCache','_screenBackgroundCache','_staticWorldCache','_backgroundCache'])if(scene[k]?.canvas)scene[k].canvas.width=1;cv.width=1;global.gc?.();console.log(label,view.id,view.name);
}
await writeFile(out+'/'+label+'-report.json',JSON.stringify({label,base,scope:'Native production Canvas renderer snapshots; same current battle and frozen camera/time before versus after style changes. No browser input or FPS claim.',results,loaded},null,2));
