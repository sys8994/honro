import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs'; import fsP from 'node:fs/promises';
import path from 'node:path'; import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);
const {createCanvas,Path2D,Image,DOMMatrix,DOMPoint,ImageData}=req(process.env.HONRO_NAPI_MODULE||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const savedCamera=process.env.HONRO_FRAME_REFERENCE?JSON.parse(fs.readFileSync(process.env.HONRO_FRAME_REFERENCE,'utf8')):null;
const [site,target,selection='31,32,35,36,37,40,43,47,48,49']=process.argv.slice(2);
if(!site||!target)throw Error('usage: node --experimental-vm-modules engine.mjs <normal site> <output> [ids]');
const base=path.resolve(site),folder=path.resolve(target);fs.mkdirSync(folder,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(base,'web/manifest.json'),'utf8'));const entry=path.join(base,manifest.gameEntry),entrySrc=fs.readFileSync(entry,'utf8');
const loc=new URL(pathToFileURL(path.join(base,'HONRO.html')));
let srcLog=[];const fetched=new Map();
class LocalImage extends Image { get src(){return super.src} set src(value){let data=value; try {if(typeof value==='string'&&value.startsWith('file:'))data=fs.readFileSync(fileURLToPath(new URL(value)));else if(typeof value==='string'&&!value.startsWith('data:')&&!/^https?:/.test(value)) data=fs.readFileSync(path.join(base,value)); super.src=data;srcLog.push({value,error:false});}catch(e){srcLog.push({value,error:String(e)});queueMicrotask(()=>this.onerror?.(e));}}}
function cv(W=300,H=150){let c=createCanvas(W,H);c.style={};c.classList={toggle(){},add(){},remove(){}};c.parentElement={classList:c.classList};c.getBoundingClientRect=()=>({left:0,top:0,right:c.clientWidth??c.width,bottom:c.clientHeight??c.height,width:c.clientWidth??c.width,height:c.clientHeight??c.height});return c}
const doc={createElement:n=>n==='canvas'?cv():{style:{},addEventListener(){},append(){},appendChild(){},classList:{add(){},remove(){},toggle(){}}},addEventListener(){},getElementById(){return null;},documentElement:{classList:{add(){},remove(){},toggle(){}}},fonts:{ready:Promise.resolve(),status:'loaded'},currentScript:null};
function storage(){const m=new Map();return {get length(){return m.size},key:i=>[...m.keys()][i]??null,getItem:k=>m.get(String(k))??null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear()};}
const fakeStore=storage();
function fact(data){return {bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')};}
function local(p){if(typeof p!=='string'||!path.resolve(base,p).startsWith(base+'/'))throw Error('path outside offline site: '+p);return fs.readFileSync(path.join(base,p));}
const registry=new Map(manifest.files.map(v=>[v.path,v]));assert.equal(registry.size,manifest.files.length,'duplicate active path');
function trust(p){const d=local(p);const r=registry.get(p);assert(r,'unlisted active path: '+p);assert.deepEqual(fact(d),{bytes:r.bytes,sha256:r.sha256},p);return d;}
trust(manifest.gameEntry);const staged=JSON.parse(trust(manifest.project));
const context=vm.createContext({console,performance,structuredClone,URL,URLSearchParams,TextDecoder,TextEncoder,DOMMatrix,DOMPoint,ImageData,Path2D,Image:LocalImage,setTimeout,clearTimeout,queueMicrotask,requestAnimationFrame:cb=>setTimeout(()=>cb(performance.now()),0),cancelAnimationFrame:clearTimeout,crypto:globalThis.crypto,location:loc,document:doc,navigator:{hardwareConcurrency:4,userAgent:'QA isolated canvas',language:'ko-KR'},innerWidth:1280,innerHeight:720,devicePixelRatio:1,localStorage:fakeStore,sessionStorage:fakeStore,addEventListener(){},fetch:async u=>{const p=fileURLToPath(new URL(u));if(!p.startsWith(base+'/'))throw Error('Path outside offline site');try{const d=await fsP.readFile(p);fetched.set(path.relative(base,p),fact(d));return new Response(d,{headers:{'content-length':String(d.length)}})}catch(e){return new Response(String(e),{status:404})}}});
context.HONRO_APP_READY=new Promise(()=>{});context.window=context;context.self=context;
const modules=new Map();
function get(file){if(!modules.has(file)){modules.set(file,new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file,initializeImportMeta(m){m.url=pathToFileURL(file).href;}}));}return modules.get(file)}
const link=(spec,m)=>get(path.resolve(path.dirname(m.identifier),spec));
for(const [s,r] of entrySrc.match(/const modules=\[.*?\]\.filter/s)[0].matchAll(/new URL\("([^"]+)",import.meta.url\)/g)){
 const f=path.resolve(path.dirname(entry),r);const m=get(f);
 if(m.status==='unlinked')await m.link(link);
 trust(path.relative(base,f));
 try{if(m.status==='linked')await m.evaluate()}catch(e){if(!(/ordered-game-23\./.test(f)&&String(e)==='ReferenceError: Audio is not defined'))throw e;console.error('VM APP constructor expected Audio-unavailable; browser proof separate');}
}
const G=context;console.error('GLOBALS',Boolean(G.HonroScene),Boolean(G.HonroCampaignLoader),Boolean(G.HonroStageRules),Boolean(G.HonroMaps),G.HONRO_PROJECT?.stages.length);



const C=G.HONRO_CORE, report={status:'HOLD',manifest:fact(local('web/manifest.json')),entry:manifest.gameEntry,project:manifest.project,stages:{}};
for(const id of [6,30,40,44]){
 const st=await G.HonroCampaignLoader.ensureStage(id), cs=G.HONRO_CONTENT.stages.find(s=>s.id===id),prof=G.HonroProfileStore.fresh();
 const b=G.HonroWorld.build(cs,prof,false);
 b.seed=b.rng=20261124;G.HonroStageRules.sanitizeStageBattle(b);
 const e=new C.Engine(b,()=>{},true),u=e.unit(({6:'midboss-stage6',30:'sf-dw6',40:'final40-tide-keeper-1',44:'a5-foe-5'})[id]);assert(u);
 const c=cv(900,725);c.clientWidth=900;c.clientHeight=725;const scene=new G.HonroScene(c);scene.battle=e.b;scene.time=2;
 G.HonroMonsterScaleArt.install();
 scene.unitBody(c.getContext('2d'),{...u,x:450,y:620},0);
 const img=c.toBuffer('image/png');fs.writeFileSync(path.join(folder,id+'.png'),img);
 const jsonHash=x=>fact(Buffer.from(JSON.stringify(x??null)));
 report.stages[id]={actor:u.id,usedTone:u.honroMonsterScaleVariant?.tone??null,coords:[u.x,u.y,u.h,u.r,u.hp],
  actors:jsonHash(e.b.units.map(q=>[q.id,q.x,q.y,q.h,q.r,q.hp,q.maxHp,q.awake,q.side])),
  goals:jsonHash([st.objectives,st.encounters,st.events,e.b.honroMarkers,G.HonroObjectives.state(e.b,cs).status]),
  terrain:jsonHash([e.b.terrain,e.b.honroPlayBounds,e.b.physics]),render:fact(img)};
}
report.status='PASS';fs.writeFileSync(path.join(folder,'PALETTES.json'),JSON.stringify(report,null,2));process.exit(0);
