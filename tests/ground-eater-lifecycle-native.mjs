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
for(const file of ['shared/engine/src/engine.ts','shared/engine/src/eaterMechanics.ts','shared/engine/src/types.ts','shared/engine/src/store.ts'])await read(file);
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





const out='_local/reports/ground-eater-lifecycle-native';await mkdir(out,{recursive:true});const files=[];const C=g.HONRO_CORE;
function arena(n){const profile=C.defaults(),b=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[0],g.HONRO_PROJECT,profile,{origin:'campaign'});const owner=b.units.find(u=>u.side===0);Object.assign(owner,{x:500,y:800,hp:1000,maxHp:1000,critChance:0});b.units=[owner];b.terrain=[{id:'native-floor',x:0,y:800,w:b.width,h:500,hp:99999,maxHp:99999,mat:'rock',broken:false}];b.waters=[];b.zones=[];b.fields=[];b.projectiles=[];b.active=owner.id;b.phase='aim';
 const foes=[];for(let i=0;i<n;i++){const v=C.makeUnit('archer',1,660+(i%2?-1:1)*(35+i*7),800,{id:'captive-'+i,hp:1000,maxHp:1000,armor:0,shield:0,awake:true,loadout:['LA01']});foes.push(v);b.units.push(v);}
 const cv=canvas(960,640),scene=new g.HonroScene(cv),events=[],e=new C.Engine(b,ev=>{events.push(ev);scene.event(ev);});e.random=()=>.99;Object.assign(scene,{x:660,y:665,scale:1,manual:true,time:1,skillPreview:true});return{b,owner,foes,cv,scene,e,events};}
async function frame(q,name){const before=JSON.stringify(q.b);q.scene.render(q.e,0,'',.6,false,0,false);assert.equal(JSON.stringify(q.b),before);const bytes=q.cv.toBuffer('image/png');await writeFile(`${out}/${name}.png`,bytes);files.push({name,sha256:hash(bytes),units:q.b.units.map(u=>({id:u.id,x:u.x,y:u.y,h:u.h,r:u.r,hp:u.hp,dead:u.dead,capturedBy:u.eaterCapturedBy}))});}
for(const n of [0,1,10]){const q=arena(n),s=q.e.spawnSummon(q.owner,'eater',660,800,1,1);assert.equal(s.eaterCaptureCount,n);assert.equal(s.y,800);assert(Math.abs(s.h-96*(1+.14*Math.min(5,n)))<1e-8);q.e.stepUnits(.12);await frame(q,`capture-${n}`);q.e.stepUnits(.3);await frame(q,`swallow-${n}`);q.e.stepUnits(.6);await frame(q,`held-${n}`);}
for(const mode of ['hp-zero','expiry-rank1','expiry-rank8']){const q=arena(10),rank=mode==='expiry-rank8'?8:1,s=q.e.spawnSummon(q.owner,'eater',660,800,1,rank);q.e.stepUnits(1);await frame(q,`${mode}-before`);if(mode==='hp-zero'){q.e.hurt(s,100,q.owner.id,false,undefined,undefined,'salheun');assert(q.foes.every(v=>v.hp===900));await frame(q,'damage-100-each');q.e.hurt(s,9999,q.owner.id,false,undefined,undefined,'salheun');}else {q.b.round=s.summonExpires+1;assert(q.e.expireSummon(s));}assert(s.dead);assert(q.foes.every(u=>!u.eaterCapturedBy&&!u.dead&&u.y===800));assert(q.events.some(e=>e.type==='fx'&&e.name==='eaterRelease'));assert(new Set(q.foes.map(v=>v.x)).size>1);q.scene.time+=.22;await frame(q,`${mode}-release`);q.e.stepUnits(.1);q.scene.time+=.1;await frame(q,`${mode}-knockback`);}
{const q=arena(10);for(const v of q.foes)v.hp=20;const s=q.e.spawnSummon(q.owner,'eater',660,800,1,1);q.e.stepUnits(1);q.events.length=0;q.e.hurt(s,100,q.owner.id,false,undefined,undefined,'salheun');assert(q.foes.every(v=>v.dead));assert(!q.events.some(ev=>ev.type==='fx'&&q.foes.some(v=>v.id===ev.targetId)),'Captured targets never emit floating damage numbers');const bursts=q.events.filter(ev=>ev.type==='fx'&&ev.name==='burst');assert(bursts.every(ev=>Math.abs(ev.x-s.x)<1),'Captured death bursts must not appear at old locations');await frame(q,'captured-kills');}
await writeFile(`${out}/report.json`,JSON.stringify({files,source:loaded,renderPure:true,coverage:['Actual Engine spawnSummon/stepUnits/hurt/expireSummon and production Scene','0/1/10 captives; .14 growth cap5; foot y800; HP-zero and expiry surviving enemies released; knockback'],limits:['Native fixture arena; no browser DOM or full normal-play completion.']},null,2));console.log('PASS actual Engine eater capture/release native frames: '+files.length);
