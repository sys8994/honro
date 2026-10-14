/** Native Canvas source evidence only. Does not replace real Game/Workshop browser QA. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {canvas,guidanceRuntime} from './act2-guidance-helpers.mjs';
const native=createRequire(import.meta.url)('@napi-rs/canvas'),out='_local/reports/quest-hostile-targets';await mkdir(out,{recursive:true});
async function baseline(dir){const Image=class extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}};
 const g=vm.createContext({console,performance,structuredClone,document:{createElement:()=>canvas(),querySelector:()=>null,getElementById:()=>null},Image,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),setTimeout,clearTimeout});g.window=g;
 const {runtimeParts}=await import(pathToFileURL(resolve(dir,'shared/build.mjs')));for(const s of await runtimeParts({vector:true,render:true}))vm.runInContext(s,g);return g;
}
const pairs=[['after',await guidanceRuntime()]];if(process.argv[2])pairs.unshift(['before',await baseline(process.argv[2])]);
const rows=[];
for(const [version,g]of pairs)for(const stage of [5,8,10,18]){
 const map=g.HONRO_PROJECT.stages[stage-1],b=g.HonroMaps.createBattle(map,g.HONRO_PROJECT),e=new g.HONRO_CORE.Engine(b),records=g.HonroQuestTargets?.records(b)||b.terrain,t=records.find(t=>t.id===({5:'cliff-cleat',8:'bier-knot-0',10:'sodan-binding',18:'upper-chain'})[stage]),u=b.units.find(u=>u.id===t.id);
 if(u){const mask=canvas(400,400),scene=new g.HonroScene(mask);Object.assign(scene,{battle:b,scale:1,time:2});const c=mask.getContext('2d');c.translate(200-u.x,250-u.y);scene.unitBody(c,u);const alpha=mask.getContext('2d').getImageData(0,0,400,400).data.filter((n,i)=>i%4===3&&n>0).length;assert(alpha>150,'Objective has a real body mask for hit flash and hover outline');}
 for(const [width,height,scale,kind]of [[1440,960,.85,'landscape'],[390,844,.56,'portrait']]){
  const cv=canvas(width,height),scene=new g.HonroScene(cv);Object.assign(scene,{x:t.x+t.w/2,y:t.y+t.h/2,scale,manual:true,time:2,missionTargets:g.HonroObjectives.state(b,g.HONRO_CONTENT.stages[stage-1]).targets});
  const state=JSON.stringify(b);scene.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,35));scene.render(e,0,'',.6,false,0);assert.equal(JSON.stringify(b),state,'render is read-only');const path=`${out}/${version}-stage${stage}-${kind}.png`;await writeFile(path,cv.toBuffer('image/png'));rows.push({version,stage,kind,path,hp:u?.hp??t.hp,unit:!!u,terrain:b.terrain.some(v=>v.id===t.id)});
 }
}
await writeFile(`${out}/captures.json`,JSON.stringify({scope:'Native Canvas production source. Not browser acceptance.',rows},null,2));console.log(JSON.stringify(rows));
