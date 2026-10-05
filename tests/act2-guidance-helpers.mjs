/** Production Canvas harness for isolated guidance fixtures, never browser QA. */
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {runtimeParts} from '../shared/build.mjs';
const native=createRequire(import.meta.url)('@napi-rs/canvas');
// Native Canvas does not resolve generic sans-serif CJK fallback like browsers.
// Use the installed Korean family in this evidence harness only.
const fontPath=process.env.HONRO_KOREAN_FONT||'/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';
const korean=existsSync(fontPath)&&native.GlobalFonts.registerFromPath(fontPath,'Honro Evidence Korean');
export function canvas(w=400,h=400){const c=native.createCanvas(w,h);if(korean){const ctx=c.getContext('2d'),font=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ctx),'font');Object.defineProperty(ctx,'font',{get(){return font.get.call(this);},set(v){font.set.call(this,v.replace(/sans-serif/g,'\"Honro Evidence Korean\"'));}});}Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
export async function guidanceRuntime(){
 const Image=class extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}};
 let seed=91283;const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 const g=vm.createContext({console,performance,structuredClone,Math:math,document:{createElement:()=>canvas(),querySelector:()=>null,getElementById:()=>null},Image,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),setTimeout,clearTimeout});g.window=g;
 const overrides=new Map();
 if(process.env.HONRO_GUIDANCE_BASELINE)for(const name of ['act2','act2-art']){const relative=`shared/runtime/${name}.js`;overrides.set((await readFile(relative,'utf8')).replace(/\r\n/g,'\n'),(await readFile(path.join(process.env.HONRO_GUIDANCE_BASELINE,relative),'utf8')).replace(/\r\n/g,'\n'));}
 for(const source of await runtimeParts({vector:true,render:true}))vm.runInContext(overrides.get(source)||source,g);
 return g;
}
export function guidanceFixture(g,id,objectiveId,{contested=false,outside=false}={}){
 const map=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===id),b=g.HonroMaps.createBattle(map,g.HONRO_PROJECT);g.HonroStageRules.sanitizeStageBattle(b);
 const e=new g.HONRO_CORE.Engine(b,()=>{},true),step=g.HonroAct2.steps(b).find(s=>s.id===objectiveId),memory=g.HonroAct2.memory(b);
 for(const s of g.HonroAct2.steps(b)){if(s.id===objectiveId)break;memory.done[s.id]=true;}
 const point=map.design.space.sites[objectiveId].standing,marker=b.honroMarkers.find(m=>m.id===objectiveId);
 const hero=e.heroesAlive().find(u=>u.cls===(step.requiredClass||'archer')),enemy=b.units.find(u=>u.side===1&&!u.honroSpirit);b.units=[hero,...contested&&enemy?[enemy]:[]];b.active=hero.id;
 const hx=step.kind==='hold'?(marker.x+(outside?-780:-420)):point.x;
 Object.assign(hero,{x:hx,y:g.HonroWorld.top(b,hx,point.y),vx:0,vy:0});
 if(contested&&enemy)Object.assign(enemy,{x:marker.x+100,y:g.HonroWorld.top(b,marker.x+100,marker.y),vx:0,vy:0});
 if(step.kind==='hold'){memory.holds??={};memory.holds[step.id]={progress:1,spawned:0,lastRound:b.round,guarded:!outside,contested,continuous:!outside&&!contested};}
 return{map,b,e,step,hero,marker,point};
}
