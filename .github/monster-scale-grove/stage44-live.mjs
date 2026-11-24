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
await G.HonroCampaignLoader.ensureStage(44);
const cs=G.HONRO_CONTENT.stages.find(s=>s.id===44),f=G.HonroProfileStore.fresh();
const host=G.HonroWorld.build(cs,f,false);G.HonroStageRules.sanitizeStageBattle(host);
assert.equal(host.honroStage,44);
const authored=host.units.find(u=>u.id==='a5-foe-5');assert(authored?.hp>0);
assert(host.honroMap.act5.required.rootsUpper.includes(authored.id));
assert(!host.honroMap.act5.required.rootsLower.includes(authored.id));
if(mode==='B')assert.equal(authored.honroMonsterWeakPoint?.discovery,'unknown');
const record=(b)=>b.honroState.scaleTrialObservation44;
function arrange(from=host){
 const b=structuredClone(from),events=[];
 const a=b.units.find(x=>x.id==='p-archer'),m=b.units.find(x=>x.id==='p-mage'),u=b.units.find(x=>x.id===authored.id);
 assert(a&&m&&u);b.terrain=[];b.units=[a,m,u];b.seed=b.rng=20261124;
 Object.assign(a,{x:500,y:800,awake:true,facing:1,airborne:false,dead:false});
 Object.assign(m,{x:500,y:810,awake:true,facing:1,airborne:false,dead:false});
 Object.assign(u,{x:1000,y:800,awake:true,armor:0,shield:0,arrivalGuard:undefined,breaks:0,mark:0,hp:20000,maxHp:20000});
 const e=new G.HONRO_CORE.Engine(b,x=>events.push(x),true);e.random=()=>.99;
 return {e,events};
}
function fire({e,events},skill,eta,{duplicate=false,opts={},shield=0}={}){
 const a=e.unit(skill==='M03'?'p-mage':'p-archer'),boss=e.unit(authored.id);
 e.b.active=a.id;e.b.side=0;e.b.phase='aim';e.b.projectiles=[];e.b.volley=undefined;
 Object.assign(a,{loadout:[skill],focus:1000,maxFocus:1000,acted:false,cooldowns:{},retreat:false});a.ranks.AP01=0;
 e.canAct=()=>true;e.grounded=()=>true;
 assert(e.fire(skill,0,.8,false),'actual native cast requested');
 const p=e.b.projectiles[0],cast=e.b.cast;assert(cast&&cast.owner===p.owner&&p.shot===cast.shot&&p.skill===cast.skill);
 const y=boss.y-boss.h+boss.h*eta, x=boss.x-boss.r-220;
 Object.assign(p,{x,y,vx:1120,vy:0,damage:100,damageRoll:1,blast:30,...opts});
 boss.shield=shield;
 const bang=q=>{const h=e.projectileCollision(q,{x:boss.x,y},q.radius,a.id,[],true,[],true,q);assert.equal(h.unit?.id,boss.id);e.impact(q,h)};
 const before=boss.hp;events.length=0;
 bang(p);if(duplicate)bang({...p,hit:[],pierces:0,x,y});
 return {loss:before-boss.hp,cast:cast.shot,labels:events.filter(x=>x.name==='text').map(x=>x.text),receipt:JSON.parse(JSON.stringify(record(e.b)??null))};
}
let key=arrange();
const primary1=fire(key,'A01',.72,{duplicate:true});
const zero=fire(key,'A01',.72,{shield:1000});
const autonomous=fire(key,'A01',.72,{opts:{autonomous:true}});
const saved=JSON.parse(JSON.stringify(key.e.b));key=arrange(saved);
const primary2=fire(key,'A01',.72);
const head=fire(key,'M03',.25);
const nonrepeat=fire(key,'A01',.25);
const early=arrange(),firstHead=fire(early,'A01',.25),afterHead1=fire(early,'A01',.72),afterHead2=fire(early,'A01',.72);
if(mode==='B'){
 assert.deepEqual(primary1.receipt.bodyShots,[primary1.cast]);assert.equal(primary1.receipt.queue.length,0);
 assert.equal(zero.loss,0);assert.deepEqual(zero.receipt.bodyShots,[primary1.cast]);
 assert.deepEqual(autonomous.receipt.bodyShots,[primary1.cast]);
 assert.equal(primary2.receipt.queue[0].kind,'resisted');assert.equal(primary2.receipt.queue[0].shot,primary2.cast);
 assert.equal(head.receipt.queue.length,1);assert.equal(head.receipt.queue[0].kind,'weak');assert(head.labels.includes('약점!'));
 assert.deepEqual(nonrepeat.receipt.queue,head.receipt.queue);
 assert.equal(firstHead.receipt.queue[0].kind,'weak');assert.deepEqual(afterHead1.receipt.bodyShots,[]);assert.deepEqual(afterHead2.receipt.bodyShots,[]);
}else for(const z of [primary1,zero,autonomous,primary2,head,nonrepeat,firstHead,afterHead1,afterHead2])assert.equal(z.receipt,null);
const summary={status:'PASS',mode,manifest:fact(local('web/manifest.json')),stage:44,actor:authored.id,case:{primary1,zero,autonomous,primary2,head,nonrepeat,firstHead,afterHead1,afterHead2},limits:'Actual compiled native skill/impact and HP; prepared isolated positions and Battle JSON round-trip; not App Continue/browser.'};
fs.writeFileSync(path.join(folder,'STAGE44-DISCOVERY.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));process.exit(0);
