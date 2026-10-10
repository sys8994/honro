/** Current production render chain immediately before/after the new Stage8
 * module. Existing tracked assets are read, never rebuilt. No historical code
 * is evaluated. This is fallback isolation, not new8 art/browser/FPS approval. */
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
const g=vm.createContext({console,performance:{now:()=>2000},structuredClone,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,Image,document:{createElement:()=>canvas(),querySelector:()=>null,getElementById:()=>null},navigator:{userAgent:'honro-native-stage8-render-isolation'},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout,clearTimeout});g.window=g;
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
const renderNames=[...match[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);assert.equal(new Set(renderNames).size,renderNames.length);assert(renderNames.includes('stage8-bier-art'));assert(renderNames.indexOf('stage23-escort-art')<renderNames.indexOf('stage8-bier-art'),'Accepted23 renderer precedes both comparison sides');
let previous,wrapped,changed;const methods=['terrain','background','terrainHealth'];
for(const name of renderNames){const source=await text('shared/runtime/'+name+'.js');if(name==='stage8-bier-art')previous=Object.getOwnPropertyDescriptors(g.HonroScene.prototype);vm.runInContext(source,g);if(name==='stage8-bier-art'){wrapped=Object.getOwnPropertyDescriptors(g.HonroScene.prototype);changed=Object.keys(wrapped).filter(k=>wrapped[k].value!==previous[k]?.value);}}
assert(previous&&wrapped);assert(changed.includes('terrain')&&changed.includes('background'));assert(changed.every(k=>methods.includes(k)),'Every new8 Scene wrapper has an explicit comparison adapter');
const stone=await text('shared/runtime/stage23-escort-art.js');assert.equal(hash(stone),'309607319dde8b97ca6b8acc95ce87fab925c794e9322c0699bb004713dc4970','Both sides use accepted23 stone-scale render source');
await new Promise(resolve=>setTimeout(resolve,20));assert(images.length>0&&images.every(i=>i.complete&&i.naturalWidth>0),'Current background images decode before either paint');
const original8=JSON.parse(await text('tests/fixtures/stage8-bier/before-stage8.json')).battle,cases=[{id:'old8-unrevisioned',b:structuredClone(original8)}];
for(const id of [11,12,16,17,18,23,30]){const profile=g.HONRO_CORE.defaults();profile.recruited=g.HonroStageRules.stageParty(id);const stage=g.HONRO_PROJECT.stages[id-1],b=g.HonroMaps.createBattle(stage,g.HONRO_PROJECT,profile,{origin:'campaign'});g.HonroStageRules.sanitizeStageBattle(b);cases.push({id:'other'+id,b});}
cases.push({id:'custom8-revision1',b:{...structuredClone(original8),honroCustom:true,honroStage8BierRevision:1}},{id:'old8-unknown-revision2',b:{...structuredClone(original8),honroStage8BierRevision:2}});
const contextState=c=>{const m=c.getTransform();return{transform:[m.a,m.b,m.c,m.d,m.e,m.f],alpha:c.globalAlpha,composite:c.globalCompositeOperation,lineWidth:c.lineWidth,lineCap:c.lineCap,lineJoin:c.lineJoin,dash:Array.from(c.getLineDash()),dashOffset:c.lineDashOffset,shadowBlur:c.shadowBlur,shadowOffsetX:c.shadowOffsetX,shadowOffsetY:c.shadowOffsetY,imageSmoothingEnabled:c.imageSmoothingEnabled};};
function paint(fn,method,b,{w,h},pass=0){const cv=canvas(w,h),c=cv.getContext('2d'),scene=new g.HonroScene(cv),z=Math.min(w/(b.width+300),h/(b.height+300));Object.assign(scene,{battle:b,x:b.width/2,y:b.height/2,scale:z,time:2,manual:true,theme:b.honroBackdrop||'forest',editorView:false});
 c.globalAlpha=.87;c.lineWidth=2.75;c.setLineDash([3,5]);if(method!=='background'){c.translate(w/2,h/2);c.scale(z,z);c.translate(-scene.x,-scene.y);}const entry=contextState(c),saved=JSON.stringify(b);
 if(method==='terrain')for(const t of b.terrain.filter(t=>!t.broken))fn.call(scene,c,t);else fn.call(scene,c,w,h,b);
 // terrainHealth has a different production signature from background.
 assert.equal(JSON.stringify(b),saved,'Every complete battle field remains unchanged during '+method+' pass'+pass);const exit=contextState(c),pixels=Buffer.from(c.getImageData(0,0,w,h).data);c.save();c.resetTransform();c.globalAlpha=1;c.fillStyle='#ff00ff';c.fillRect(1,1,4,4);c.restore();assert.deepEqual(Array.from(c.getImageData(2,2,1,1).data),[255,0,255,255],'Production method releases its clipping region');cv.width=1;return{pixels,entry,exit};}
// Signature adapters use actual production methods, not drawing substitutes.
// The earlier readability wrapper looks up this optional global at draw time.
// Hide only the new export while invoking the pre-module function reference,
// otherwise both sides would accidentally use the new omitReadability hook.
function paintPrevious(...args){const art=g.HonroStage8BierArt;try{delete g.HonroStage8BierArt;return paint(...args);}finally{g.HonroStage8BierArt=art;}}
const adapter=(fn,name)=>name==='terrainHealth'?function(c,w,h,b){return fn.call(this,c,b,w,h);}:fn;
const rows=[];for(const item of cases){assert.equal(g.HonroStage8BierArt.active(item.b),false,'Explicit fallback '+item.id);const saved=JSON.stringify(item.b);
 for(const viewport of [{id:'landscape',w:800,h:500},{id:'portrait',w:390,h:640}])for(const method of methods){assert.equal(typeof previous[method]?.value,'function');assert.equal(typeof wrapped[method]?.value,'function');
  for(let pass=0;pass<2;pass++){const a=paintPrevious(adapter(previous[method].value,method),method,item.b,viewport,pass),z=paint(adapter(wrapped[method].value,method),method,item.b,viewport,pass);if(item.id==='old8-unrevisioned')assert(a.pixels.some((v,i)=>i%4===3&&v),'Old8 '+method+' control draws visible pixels');assert(a.pixels.equals(z.pixels),'Native RGBA pixel-exact fallback '+item.id+' '+viewport.id+' '+method+' pass'+pass);assert.deepEqual(z.exit,a.exit,'No added Canvas context leakage '+item.id+' '+method);assert.deepEqual(z.entry,a.entry);rows.push({case:item.id,viewport:viewport.id,method,hooked:changed.includes(method),pass,rgbaSha256:hash(a.pixels),pixelExact:true,contextExact:true,originalRestoresTransformAndAlpha:JSON.stringify(a.entry.transform)===JSON.stringify(a.exit.transform)&&a.entry.alpha===a.exit.alpha});}
 }assert.equal(JSON.stringify(item.b),saved,'Repeated cached passes preserve whole saved battle '+item.id);
}
// Positive material control is deliberately synthetic and makes no claim about
// the still-changing new8 geography or approved visual composition.
const probe=structuredClone(original8);probe.honroStage8BierRevision=1;const t=probe.terrain.find(t=>!t.broken&&!t.oneWay);assert(t);t.id='s8-renderer-positive-probe';probe.terrain=[t];const control={id:'positive',w:800,h:500},a=paintPrevious(adapter(previous.terrain.value,'terrain'),'terrain',probe,control),z=paint(adapter(wrapped.terrain.value,'terrain'),'terrain',probe,control);assert(!a.pixels.equals(z.pixels),'Active new8 material branch actually changes visible pixels');assert.deepEqual(z.exit.transform,z.entry.transform);assert.equal(z.exit.alpha,z.entry.alpha,'New8 material restores incoming alpha');
for(const[path,digest]of Object.entries(loaded))assert.equal(hash(await readFile(path)),digest,'Every read production/input source remains unchanged throughout capture');assert.equal(hash((await runtimeParts({vector:false,render:false})).join('\n')),hash(model.join('\n')),'Current model/project unchanged during comparison');
const result={passed:true,source:loaded,modelSha256:hash(model.join('\n')),wrappedMethods:changed,fallbackCases:cases.map(c=>c.id),comparisons:rows.length,wholeBattleExact:true,positiveMaterialControl:true,rows,limits:['Direct Native production terrain/background/terrainHealth methods, including accepted23 stone renderer on both sides. Current tracked assets read without regeneration.','RGBA and Canvas fallback-context equality plus complete serialized battle purity, including repeated cached calls and landscape/portrait.','Unknown/custom8 and positive8 are explicit gate/material probes. No normal gameplay, final new8 composition, browser, complete host rendering or FPS acceptance.']};await mkdir('_local/reports/stage8-bier/renderer-isolation',{recursive:true});await writeFile('_local/reports/stage8-bier/renderer-isolation/summary.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:true,wrappedMethods:changed,fallbackCases:result.fallbackCases,comparisons:rows.length,wholeBattleExact:true,positiveMaterialControl:true},null,2));
