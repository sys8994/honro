/** Native production Scene capture. Not browser or gameplay acceptance. */
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as native from '@napi-rs/canvas';
import {runtimeParts} from '../../shared/build.mjs';
import {loadPilotRuntime} from '../stage31/pilot-runtime.mjs';
const [file,out]=process.argv.slice(2);if(!file||!out)throw Error('candidate and output directory required');process.env.HONRO_ACT4_RELEASE='1';await mkdir(out,{recursive:true});
function canvas(w=64,h=64){const c=native.createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
class Image extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
const g=vm.createContext({console,performance,structuredClone,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,Image,document:{createElement:()=>canvas(),querySelector:()=>null,getElementById:()=>null},navigator:{userAgent:'honro-native-candidate'},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout,clearTimeout});g.window=g;
for(const source of await runtimeParts({vector:true,render:true,productionStory:true}))vm.runInContext(source,g);await loadPilotRuntime(g);
const p=JSON.parse(await readFile(file,'utf8'));g.HONRO_PROJECT=p;const s=p.stages.find(s=>s.metadata?.stageId===40),profile=g.HonroMaps.profileFor(s);g.HonroEquipment.fresh(profile);
const b=g.HonroMaps.createBattle(s,p,profile),e=new g.HONRO_CORE.Engine(b,()=>{},false);g.HonroAct4PilotCombat.attach({engine:e});
const rows=[];for(const v of [{id:'overview',x:3328,y:2100,z:.2,w:1440,h:900},{id:'west-entry',x:2000,y:1950,z:.65,w:1440,h:900},{id:'inlet-blockade',x:4200,y:2100,z:.65,w:1440,h:900},{id:'upper-route',x:5000,y:1320,z:.65,w:1440,h:900}]){
 const c=canvas(v.w,v.h),scene=new g.HonroScene(c);Object.assign(scene,{x:v.x,y:v.y,scale:v.z,manual:true,time:0,editorView:v.id==='overview',skillPreview:v.id==='overview'});
 scene.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,100));scene.render(e,0,'',.6,false,0);const bytes=c.toBuffer('image/png');await writeFile(out+'/'+v.id+'.png',bytes);rows.push({view:v,pngSha256:createHash('sha256').update(bytes).digest('hex')});console.log(v.id);for(const tile of scene._domainTiles?.tiles?.values()||[])tile.canvas.width=1;scene._domainTiles?.tiles.clear();c.width=1;global.gc?.();
}
await writeFile(out+'/capture.json',JSON.stringify({scope:'Native production renderer; initial enemy layout only. No HUD/browser/complete-play claim.',candidateSha256:createHash('sha256').update(await readFile(file)).digest('hex'),rows},null,2));
