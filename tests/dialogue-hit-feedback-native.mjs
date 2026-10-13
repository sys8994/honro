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
for(const path of ['shared/assets/monsters/monsters.runtime.js','shared/assets/actors/actors.runtime.js'])vm.runInContext(await text(path),g);
// Read the current single production manifest; do not invent another renderer
// bundle or call runtimeParts(render:true), which regenerates asset files.
const manifest=await text('shared/build.mjs'),match=manifest.match(/for\(const name of (\['renderer'[^\]]+\])\)parts\.push\(await read\(`shared\/runtime\/\$\{name\}\.js`\)\);/);assert(match,'Production render manifest is explicit');
const renderNames=[...match[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);assert.equal(new Set(renderNames).size,renderNames.length);
for(const name of renderNames)vm.runInContext(await text('shared/runtime/'+name+'.js'),g);
await new Promise(resolve=>setTimeout(resolve,20));assert(images.length>0&&images.every(i=>i.complete&&i.naturalWidth>0),'Current background images decode before painting');



const out='_local/reports/dialogue-hit-feedback-native';await mkdir(out,{recursive:true});
const profile=g.HONRO_CORE.defaults();profile.recruited=['archer','mage','knight','occultist'];
const b=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[3],g.HONRO_PROJECT,profile,{origin:'campaign'});
g.HonroStageRules.sanitizeStageBattle(b);g.HonroEncounters.configure(b);g.HonroProgression.initialize(b,profile);
let scene;const e=new g.HONRO_CORE.Engine(b,ev=>scene?.event(ev),true),cv=canvas(720,1180);scene=new g.HonroScene(cv);
const u=e.active;Object.assign(scene,{x:u.x+110,y:u.y-230,scale:.8,manual:true,time:2});
e.hurt(u,15,'');scene.event({type:'fx',name:'inkLine',x:u.x-150,y:u.y+20,x2:u.x+180,y2:u.y-35,color:'#cb766b',size:3});
const snapshot=JSON.stringify(b),files=[];
for(const paused of [false,true]){
 scene.render(e,0,'',.6,false,0,paused);await new Promise(r=>setTimeout(r,20));scene.render(e,0,'',.6,false,0,paused);
 assert.equal(JSON.stringify(b),snapshot);const name=paused?'after-pause':'before-pause',bytes=cv.toBuffer('image/png');await writeFile(`${out}/${name}.png`,bytes);files.push({name,sha256:hash(bytes)});
 if(paused){assert(!scene.hitFlashVisible(u));assert.equal(scene.damageNumbers.size,0);assert(!scene.arcFx.fxs.some(f=>f.kind==='inkLine'));}
}
assert.notEqual(files[0].sha256,files[1].sha256);
scene.render(e,0,'',.6,false,0,false);assert(!scene.hitFlashVisible(u));assert.equal(JSON.stringify(b),snapshot);
e.hurt(u,15,'');scene.render(e,0,'',.6,false,0,false);assert(scene.hitFlashVisible(u));await writeFile(`${out}/new-hit-after-resume.png`,cv.toBuffer('image/png'));
// Renderer purity and tint behavior include side 0 party, side 1 enemies and side 2 NPCs.
const sides=[...new Set(b.units.map(u=>u.side))];for(const v of b.units)v.hurt=.7;const all=JSON.stringify(b);scene.render(e,0,'',.6,false,0,true);assert.equal(JSON.stringify(b),all);for(const v of b.units)assert(!scene.hitFlashVisible(v));
await writeFile(`${out}/report.json`,JSON.stringify({source:loaded,files,sides,renderPure:true,newHitVisible:true,limits:['Reconstructed stage-4 fixture, real Engine hurt and actual production Scene on native Canvas.','No browser DOM/dialogue overlay, physical-device or normal-play completion evidence.']},null,2));console.log('PASS native Scene before/after, resumed new hit, all-side tint and serialized battle invariance');
