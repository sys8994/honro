/** Exact engine-contact regression pixels, not a normal-combat/UI screenshot. */
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runtimeParts} from '../../shared/build.mjs';
const require=createRequire(import.meta.url),native=require('@napi-rs/canvas');
function canvas(w=300,h=150){const c=native.createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
const Image=class extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}};
const g=vm.createContext({console,performance,structuredClone,document:{createElement:()=>canvas()},Image,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),setTimeout,clearTimeout});g.window=g;
for(const source of await runtimeParts({vector:true,render:true}))vm.runInContext(source,g);
const out='_local/reports/act1-spatial/collision';await mkdir(out,{recursive:true});const frames=[];
for(const version of ['before','after']){const b=JSON.parse(await readFile(`_local/reports/act1-spatial/current/collision-state-${version}.json`,'utf8')),e=new g.HONRO_CORE.Engine(b,()=>{},false),cv=canvas(1200,1050),scene=new g.HonroScene(cv);Object.assign(scene,{x:1100,y:2220,scale:1.15,manual:true,skillPreview:true,time:2});const before=JSON.stringify(b);scene.render(e,0,'',.6,false,0);assert.equal(JSON.stringify(b),before);await writeFile(`${out}/stage-3-knight-${version}.png`,cv.toBuffer('image/png'));frames.push({version,hero:b.units.find(u=>u.side===0),camera:{x:scene.x,y:scene.y,scale:scene.scale},renderPure:true});}
await writeFile(out+'/manifest.json',JSON.stringify({source:'Actual move/tick isolated hero regression snapshots; original and repaired canonical boulder instance',limits:['Cleared physics fixture, not normal combat','No browser HUD/input'],frames},null,2)+'\n');
console.log('Captured exact before/after contact regression on production Canvas.');
