/** Actual production Scene pixels. Native Canvas; no browser DOM or campaign completion evidence. */
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
g.HONRO_ACT1_FAR_DATA={};for(const[key,name]of[['mountains','act1-far.svg'],['gorge','act1-gorge.svg'],['dawn','act2-dawn.svg'],['act3','act3-far.svg']])g.HONRO_ACT1_FAR_DATA[key]='data:image/svg+xml;base64,'+Buffer.from((await read('shared/assets/environment/'+name)).toString('utf8')).toString('base64');
g.HONRO_ACT2_FAR_DATA={};for(const[key,name]of[['clouded','act2-clouded-granite.svg'],['dawn','act2-dawn.svg'],['stage11-ravine','stage11-ravine-far.svg'],['stage11-ravine-readable','stage11-ravine-far-readable.svg']])g.HONRO_ACT2_FAR_DATA[key]='data:image/svg+xml;base64,'+Buffer.from((await read('shared/assets/environment/'+name)).toString('utf8')).toString('base64');
for(const path of ['shared/assets/monsters/monsters.runtime.js','shared/assets/actors/actors.runtime.js'])vm.runInContext(await text(path.endsWith('actors.runtime.js')&&(process.env.EATER_ART_RUNTIME)?process.env.EATER_ART_RUNTIME:path),g);
// Read the current single production manifest; do not invent another renderer
// bundle or call runtimeParts(render:true), which regenerates asset files.
const manifest=await text('shared/build.mjs'),match=manifest.match(/for\(const name of (\['renderer'[^\]]+\])\)parts\.push\(await read\(`shared\/runtime\/\$\{name\}\.js`\)\);/);assert(match,'Production render manifest is explicit');
const renderNames=[...match[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);assert.equal(new Set(renderNames).size,renderNames.length);
for(const name of renderNames)vm.runInContext(await text('shared/runtime/'+name+'.js'),g);
await new Promise(resolve=>setTimeout(resolve,20));assert(images.length>0&&images.every(i=>i.complete&&i.naturalWidth>0),'Current background images decode before painting');




const out=process.env.EATER_ART_OUT||'_local/reports/ground-eater-native';await mkdir(out,{recursive:true});
const profile=g.HONRO_CORE.defaults();profile.recruited=['archer','mage','knight','occultist'];
const b=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[0],g.HONRO_PROJECT,profile,{origin:'campaign'});
const e=new g.HONRO_CORE.Engine(b,()=>{},true),base=b.units.find(u=>u.side===1),anchor=e.active;
const eater={...base,id:'art-eater',name:'먹귀',cls:'occultist',summoned:true,summonKind:'eater',side:1,x:anchor.x+150,y:anchor.y,h:96,r:36.8,hp:205,maxHp:205,facing:1,dead:false,summonFloating:false,fixed:false};
eater.y=g.HONRO_CORE.groundY(b.terrain,eater.x);
b.units=[anchor,eater];b.phase='aim';const files=[];
const echoes=[-1,1].map((side,i)=>({...base,id:'captured-'+i,dead:false,x:eater.x+side*140,y:eater.y,h:70,r:20,eaterOrigin:{x:eater.x+side*140,y:eater.y},eaterCapturedBy:eater.id}));
for(const [label,count,swallow,facing,width,height,zoom,release] of [
 ['empty',0,0,1,960,640,.9,false],['one-held',1,0,1,960,640,.9,false],['many-held',10,0,1,960,640,.9,false],['swallow-pull',3,.78,1,960,640,.9,false],['swallow-open',3,.48,1,960,640,.9,false],['swallow-close',3,.18,-1,960,640,.9,false],['left-hit',5,0,-1,960,640,.9,false],['small-zoom',10,.48,-1,390,700,.4,false],['release',8,0,1,960,640,.9,true]]){
 Object.assign(eater,{eaterCaptureCount:count,eaterSwallow:swallow,summonGrowthHits:Math.min(5,count),h:96*(1+.14*Math.min(5,count)),r:36.8*(1+.14*Math.min(5,count)),facing,hurt:label==='left-hit'?.65:0,dead:release});
 b.units=[anchor,eater,...(swallow>0?echoes:[])];
 const cv=canvas(width,height),scene=new g.HonroScene(cv);Object.assign(scene,{x:eater.x-30,y:eater.y-130,scale:zoom,manual:true,time:2,skillPreview:true});
 if(release){scene.event({type:'fx',name:'eaterRelease',x:eater.x,y:eater.y-eater.h*.5,size:190});scene.time+=.28;}
 const snapshot=JSON.stringify(b);scene.render(e,0,'',.6,false,0,false);assert.equal(JSON.stringify(b),snapshot,'Renderer is read-only');
 const bytes=cv.toBuffer('image/png');await writeFile(`${out}/${label}.png`,bytes);files.push({label,sha256:hash(bytes),count,width,height,zoom});
}
assert.equal(g.HonroActorVisual.state({...eater,eaterSwallow:.45}).attack,.5);
// Captured records must be silent even through direct unit/body rendering paths.
const hiddenCanvas=canvas(320,320),hiddenScene=new g.HonroScene(hiddenCanvas),ctx=hiddenCanvas.getContext('2d');
const hidden={...eater,x:160,y:240,dead:false,eaterCapturedBy:'another-eater'};
const blank=hash(hiddenCanvas.toBuffer('image/png'));hiddenScene.unit(ctx,hidden,true);hiddenScene.unitBody(ctx,hidden);assert.equal(hash(hiddenCanvas.toBuffer('image/png')),blank,'Captured body and HP bar are hidden');
const asset=g.HonroActorVisual.assets.summon_eater;
assert.equal(asset.baseHeight,142);assert(asset.parts.some(p=>p.id==='ground-feet'));assert(!asset.clips.idle.tracks.some(t=>t.part==='root'),'Idle never lifts the feet');

await writeFile(`${out}/report.json`,JSON.stringify({files,source:loaded,limits:['Native production Scene with reconstructed unit states, not browser play or actual capture lifecycle.']},null,2));console.log('PASS ground eater native Scene: '+files.length+' frames');
