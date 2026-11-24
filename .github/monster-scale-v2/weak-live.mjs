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

const mode=process.env.HONRO_MODE||'B';
const A=await G.HonroCampaignLoader.ensureStage(6), cs=G.HONRO_CONTENT.stages.find(s=>s.id===6);
const clone=x=>structuredClone(x);
const f=G.HonroProfileStore.fresh();
const stock=G.HonroWorld.build(cs,f,false);stock.seed=stock.rng=20261124;G.HonroStageRules.sanitizeStageBattle(stock);
assert.equal(stock.honroStage,6);
assert.equal(stock.honroCanonical,true);assert.equal(stock.honroMapOrigin,'campaign');
const original=stock.units.find(u=>u.id==='midboss-stage6');
assert(original&&original.hp>0);
const held=()=>{const b=clone(stock),targets=b.units.filter(x=>x.side===0&&!x.summoned);
 const archer=targets.find(u=>u.cls==='archer')??targets[0];
 const mage=targets.find(u=>u.cls==='mage')??archer;const boss=b.units.find(x=>x.id===original.id);
 assert(archer&&boss);b.terrain=[];b.units=[archer,...mage===archer?[]:[mage],boss];
 Object.assign(archer,{x:500,y:800,awake:true,facing:1,airborne:false,dead:false});
 Object.assign(mage,{x:530,y:800,awake:true,airborne:false,dead:false});
 Object.assign(boss,{x:1000,y:800,awake:true,armor:0,shield:0,arrivalGuard:undefined,breaks:0,mark:0});
 b.active=archer.id;b.phase='aim';const events=[],e=new G.HONRO_CORE.Engine(b,x=>events.push(x),true);
 e.random=()=>.99;return {e,events,archer:e.unit(archer.id),mage:e.unit(mage.id),boss:e.unit(boss.id)};
};
function shoot(kind,height,revision){
 const k=held(),{e,events,archer,mage,boss}=k;
 if(revision===1)e.b.honroMonsterScaleRevision=1;
 const a=kind==='blast'?mage:archer, y=boss.y-boss.h+boss.h*height;
 const p={id:91991,owner:a.id,side:0,attackSide:0,skill:'',mode:kind==='blast'?'ball':'arrow',radius:4,x:boss.x-boss.r-220,y,vx:1120,vy:0,damage:100,blast:35,damageRoll:1,body:false,child:kind==='child',bounces:0,hit:[],pierces:0,shot:1,age:0,trail:[]};
 const h=e.projectileCollision(p,{x:boss.x,y},p.radius,a.id,[],true,[],true,p);
 assert.equal(h.unit?.id,boss.id);
 const before=boss.hp;
 e.impact(p,h);
 return {loss:before-boss.hp,feedback:events.filter(x=>x.name==='text').map(x=>x.text),contact:{x:h.x,y:h.y}};
}
function simple(kind){
 const {e,events,archer,boss}=held(); const before=boss.hp;
 if(kind==='splash') e.blast(boss.x,boss.y-boss.h*.45,40,100,archer.id,false,undefined);
 if(kind==='melee') e.hurt(boss,100,archer.id,true,undefined,{x:boss.x-80,y:boss.y-50});
 if(kind==='dot') e.hurt(boss,100,archer.id,false,undefined,undefined,'normal',undefined,{skill:'O15'});
 if(kind==='environment') e.hurt(boss,100,'',false,undefined,undefined,'environment');
 return {loss:before-boss.hp,feedback:events.filter(x=>x.name==='text').map(x=>x.text)};
}
const out={mode,manifest:fact(local('web/manifest.json')),stage:6,boss:{x:original.x,y:original.y,h:original.h,r:original.r,hp:original.hp,weak:original.honroMonsterWeakPoint??null},cases:{face:shoot('arrow',.25),body:shoot('arrow',.70),child:shoot('child',.25),blast:shoot('blast',.25),splash:simple('splash'),melee:simple('melee'),dot:simple('dot'),environment:simple('environment'),rev1face:shoot('arrow',.25,1),rev1body:shoot('arrow',.70,1)}};
if(mode==='B'){
 assert(out.boss.weak,'missing pilot weak point');
 const c=out.cases;
 assert(c.face.loss>0&&c.body.loss>0&&Math.abs(c.body.loss/c.face.loss-.2)<.03,JSON.stringify(c));
 assert(c.blast.loss>0&&c.blast.feedback.includes('약점!'),JSON.stringify(c));
 assert(c.face.feedback.includes('약점!')&&c.body.feedback.includes('감쇄')&&c.child.feedback.includes('감쇄'));
 assert(!c.splash.feedback.includes('약점!')&&!c.melee.feedback.includes('약점!'));
 assert.equal(c.rev1face.loss,c.rev1body.loss);
 assert(!c.rev1face.feedback.includes('약점!'));
}
fs.writeFileSync(path.join(folder,'WEAK-LIVE.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify(out));process.exit(0);
