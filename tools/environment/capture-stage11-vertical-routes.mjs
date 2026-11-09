/** Offline visual evidence using the production compiler, Engine and HonroScene.
 * This is deliberately not a browser, HUD/input check or normal combat run. */
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {runtimeParts,root} from '../../shared/build.mjs';
const require=createRequire(import.meta.url),native=require('@napi-rs/canvas');
const tag=process.argv[2]||'preview-'+Date.now();if(!/^[a-zA-Z0-9_-]+$/.test(tag))throw Error('Invalid capture tag');const out=path.resolve(root,'_local/reports/act2-redesign-20261109/native-preview',tag);
await mkdir(out,{recursive:true});
let seed=3910;const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
function canvas(w=300,h=150){const c=native.createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
const NativeImage=native.Image;
const Image=class extends NativeImage{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}};
const document={createElement(tag){if(tag!=='canvas')throw Error('Unexpected DOM '+tag);return canvas();}};
const g=vm.createContext({console,performance,structuredClone,Math:math,document,Image,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'honro-native-canvas-evidence'},setTimeout,clearTimeout});g.window=g;
process.env.HONRO_STAGE11_COMPACT='1';process.env.HONRO_ACT4_RELEASE='0';
const parts=await runtimeParts({vector:true,render:true,productionStory:true});for(const source of parts){vm.runInContext(source,g);global.gc?.();}
const sha=x=>createHash('sha256').update(x).digest('hex');


const st=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===11),results=[];
const views=[{name:'overview',x:3100,y:2150,scale:.21,width:1440,height:900,overview:true},{name:'north',x:5100,y:1510,scale:.94,width:1440,height:900},{name:'lower',x:2960,y:2360,scale:.94,width:1440,height:900},{name:'north-phone',x:5200,y:1430,scale:.82,width:390,height:844}];
for(const view of views){
 const b=g.HonroMaps.createBattle(st,g.HONRO_PROJECT,undefined,{origin:'campaign'});g.HonroStageRules.sanitizeStageBattle(b);
 if(!view.overview)for(const [i,u] of b.units.filter(u=>u.side===0).entries()){const id=view.name==='lower'?'compact-lower-rock-route':'compact-north-pine-route',support=b.terrain.find(t=>t.id===id),x=(view.name==='lower'?2850:5030)+i*90,y=g.HONRO_CORE.topAt(support,x);Object.assign(u,{x,y,spawnX:x,spawnY:y});assert(g.HONRO_CORE.validTerrainContactPose(b.terrain,u));}
 const e=new g.HONRO_CORE.Engine(b,()=>{},true),cv=canvas(view.width,view.height),scene=new g.HonroScene(cv);Object.assign(scene,{x:view.x,y:view.y,scale:view.scale,manual:true,time:2,editorView:!!view.overview,skillPreview:!!view.overview});const before=JSON.stringify(b);scene.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,30));scene.render(e,0,'',.6,false,0);assert.equal(JSON.stringify(b),before);const file=view.name+'.png';await writeFile(path.join(out,file),cv.toBuffer('image/png'));results.push({file,view,diagnosticInitialHeroPoses:!view.overview,renderPure:true});console.log(file);
}
await writeFile(path.join(out,'manifest.json'),JSON.stringify({scope:'Actual common HonroScene/Engine/asset compiler; diagnostic initial hero poses, not movement/browser/combat proof. Partial artwork, all gaps remain pending.',bundleSha256:sha(parts.join('\n')),results},null,2)+'\n');
