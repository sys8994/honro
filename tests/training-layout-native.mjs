/** Same-camera practice stations, production Canvas. This is not browser QA. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runtimeParts} from '../shared/build.mjs';
const native=createRequire(import.meta.url)('@napi-rs/canvas'),out='_local/reports/training-layout';
await mkdir(out,{recursive:true});
function canvas(w=64,h=64){const c=native.createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
class Image extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
const g=vm.createContext({console,performance,structuredClone,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,Image,document:{createElement:()=>canvas(),querySelector:()=>null,getElementById:()=>null},navigator:{userAgent:'honro-native-training'},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout,clearTimeout});g.window=g;
const parts=await runtimeParts({vector:true,render:true});for(const s of parts)vm.runInContext(s,g);
const current=await readFile('shared/runtime/world.js','utf8'),baseline=execFileSync('git',['show','d00c7bb7341d8dcf66558464c8584e8969e9498c:shared/runtime/world.js'],{encoding:'utf8'}),rows=[];
const views=[{id:'overview',x:3000,y:1100,z:.25,w:1600,h:650},{id:'near',x:950,y:1190,z:.65,w:1200,h:650},{id:'cluster',x:2800,y:1030,z:.7,w:1200,h:750},{id:'east',x:4740,y:1270,z:.5,w:1400,h:650}];
for(const [label,source] of [['before',baseline],['after',current]]){
 vm.runInContext(source,g);const C=g.HONRO_CORE,p=C.defaults(),st=g.HONRO_CONTENT.stages[0],b=g.HonroWorld.build(st,p,true,'mage','M01',()=>C.createBattle(1,p,'practice',{party:['mage']})),e=new C.Engine(b,()=>{},false);
 for(const v of views){const cv=canvas(v.w,v.h),scene=new g.HonroScene(cv);Object.assign(scene,{x:v.x,y:v.y,scale:v.z,manual:true,time:2,editorView:true,skillPreview:true});const state=JSON.stringify(b);scene.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,15));scene.render(e,0,'',.6,false,0);assert.equal(JSON.stringify(b),state);const filename=`${label}-${v.id}.png`;await writeFile(out+'/'+filename,cv.toBuffer('image/png'));rows.push({label,filename,camera:v,units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,station:u.honroTrainingStation})),sourceSha256:createHash('sha256').update(source).digest('hex')});for(const t of scene._domainTiles?.tiles?.values()||[])t.canvas.width=1;scene._domainTiles?.tiles.clear();cv.width=1;global.gc?.();console.log(filename);}
}
await writeFile(out+'/native-report.json',JSON.stringify({scope:'Native production Scene, identical cameras, unmodified fresh practice worlds. Not browser, normal combat, performance or Pages approval.',rows},null,2));
