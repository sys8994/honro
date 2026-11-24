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
const candidate=process.env.HONRO_STAGE34_SOURCE?fs.readFileSync(process.env.HONRO_STAGE34_SOURCE,'utf8'):null;
let overlays=0;
function code(file) {
 const source=fs.readFileSync(file,'utf8'), i=source.indexOf('toneOnly:"quayStoneDust"');
 if(!candidate||i<0||!source.includes('G.HonroMonsterScale={'))return source;
 const a=source.lastIndexOf('(function(G){"use strict";',i),end='})(globalThis)';
 const j=source.indexOf(end,i)+end.length;
 assert(source.substring(a,j).includes('east-rock-watch'));overlays++;
 return source.slice(0,a)+candidate.trim().replace(/;$/,'')+source.slice(j);
}
function get(file){if(!modules.has(file)){modules.set(file,new vm.SourceTextModule(code(file),{context,identifier:file,initializeImportMeta(m){m.url=pathToFileURL(file).href;}}));}return modules.get(file)}
const link=(spec,m)=>get(path.resolve(path.dirname(m.identifier),spec));
for(const [s,r] of entrySrc.match(/const modules=\[.*?\]\.filter/s)[0].matchAll(/new URL\("([^"]+)",import.meta.url\)/g)){
 const f=path.resolve(path.dirname(entry),r);const m=get(f);
 if(m.status==='unlinked')await m.link(link);
 trust(path.relative(base,f));
 try{if(m.status==='linked')await m.evaluate()}catch(e){if(!(/ordered-game-23\./.test(f)&&String(e)==='ReferenceError: Audio is not defined'))throw e;console.error('VM APP constructor expected Audio-unavailable; browser proof separate');}
}
const G=context,C=G.HONRO_CORE,M=G.HonroMonsterScale;
if(candidate)assert.equal(overlays,1);
const id='a4-34-r-6';
await G.HonroCampaignLoader.ensureStage(34);
const cs=G.HONRO_CONTENT.stages.find(s=>s.id===34);
const built=()=>{const b=G.HonroWorld.build(cs,G.HonroProfileStore.fresh(),false);G.HonroStageRules.sanitizeStageBattle(b);return b;};
const host=built(), e=new C.Engine(host,()=>{},true),u=e.unit(id);
const isNew=u.h===430;
assert.equal(u.r,isNew?60:49);assert.equal(host.honroMonsterScaleRevision,isNew?2:1);
assert(C.validTerrainContactPose(host.terrain,u));assert(!u.honroMonsterWeakPoint&&!u.honroMonsterScaleVariant);
const before={};
for(const k of ['h','r','x','y','hp','maxHp','combatBaseHp','attack','armor','walkSpeed','moveLeft','maxMove','loadout'])before[k]=u[k];
function setup(base=host){const e=new C.Engine(structuredClone(base),()=>{},true),me=e.b.units.find(v=>v.side===0&&v.cls==='archer'),boss=e.unit(id);return {e,me,boss};}
function pose({e,me},support,x){const t=e.b.terrain.find(t=>t.id===support),s=C.terrainSurfaces(t,x)[0];assert(s);
 Object.assign(me,{x,y:s.y,airborne:false,vx:0,vy:0,jumping:false,facing:1});assert(e.grounded(me));}
const authored=['approved34-cave-floor',4650];
const skill=C.SKILLS.A01;
const search=setup();pose(search,...authored);
function points(old){
 const prev={h:search.boss.h,r:search.boss.r};if(old)Object.assign(search.boss,{h:298,r:49});
 const hits=[];
 for(let angle=-12;angle<=64;angle+=2)for(let j=4;j<=20;j++){
  const power=j/20,q=search.e.predict(search.me,skill,angle,power,search.boss,false);
  if(q.unit===id)hits.push([angle,power]);
 }
 Object.assign(search.boss,prev);return hits;
}
const stock=points(true),actual=points(false);
const shotArg=process.env.HONRO_STAGE34_SHOT?JSON.parse(process.env.HONRO_STAGE34_SHOT):actual.find(([a,p])=>!stock.some(r=>r[0]===a&&r[1]===p))??actual[0];assert(shotArg);
const a01=setup();pose(a01,...authored);
Object.assign(a01.e.b,{active:a01.me.id,side:0,phase:'aim',projectiles:[],volley:undefined});
Object.assign(a01.me,{loadout:['A01'],focus:1000,maxFocus:1000,acted:false,cooldowns:{}});a01.me.ranks.AP01=0;
assert(a01.e.fire('A01',...shotArg,false),'real A01 native cast');
const impacts=[], orig=a01.e.impact;
a01.e.impact=function(p,h){impacts.push({skill:p.skill,unit:h.unit?.id??null,terrain:h.terrain?.id??null});return orig.call(this,p,h);};
const beforeHp=a01.boss.hp;
for(let n=0;n<800&&a01.e.b.projectiles.length;n++)a01.e.tick(1/120);
const A01={shotArg,stockCount:stock.length,actualCount:actual.length,impacts,hpLoss:beforeHp-a01.boss.hp};
if(isNew&&!process.env.HONRO_STAGE34_SHOT){assert(actual.length>stock.length);assert(impacts.some(h=>h.skill==='A01'&&h.unit===id));assert(A01.hpLoss>0);}
const hwd=setup();pose(hwd,...authored);
hwd.e.refreshActivation();Object.assign(hwd.boss,{awake:true,acted:false});
Object.assign(hwd.e.b,{active:id,side:1,phase:'enemy',queue:[id],projectiles:[]});
const enemy={launch:null,hpLoss:0};const me0=hwd.me.hp;
for(let n=0;n<1500;n++){
 hwd.e.tick(1/120);
 const active=hwd.e.b.projectiles.find(v=>v.owner===id);
 if(active&&!enemy.launch)enemy.launch={skill:active.skill,t:n/120};
 if(enemy.launch&&!active)break;
}
enemy.hpLoss=me0-hwd.me.hp;
assert(['HWD01','HWD02'].includes(enemy.launch?.skill),JSON.stringify(enemy));
const wrong=setup();const cfg=wrong.e.b.honroAct4Design, w=cfg.wrongExit, victim=wrong.e.unit(w.actor);
const app={engine:wrong.e,modal:{classList:{contains:()=>false}},scene:{canvas:{clientWidth:1440,clientHeight:900},x:w.entrance.x,y:w.entrance.y,scale:1},canSpeak:()=>false,dialogue:false};
const P=G.HonroAct4TerrainPreview,A=G.HonroAct4PilotCombat,q=A.memory(wrong.e.b);
const original={id:victim.id,h:victim.h,r:victim.r,x:victim.x,y:victim.y,hp:victim.hp,fixed:victim.fixed},disloc=()=>wrong.e.b.honroAct4PreviewState?.dislocation?.phase??null;
P.coastObserve(app,.05);assert.equal(disloc(),null);
Object.assign(wrong.me,{x:w.entrance.x,y:w.entrance.y});
P.coastObserve(app,.05);
const wrongExit={initial:original,dislocation:disloc(),actorNow:{x:victim.x,y:victim.y,h:victim.h,r:victim.r},definition:w,mainExit:cfg.exit};
assert(['entering','inside'].includes(disloc()),JSON.stringify(wrongExit));
assert.equal(victim.h,original.h);assert.equal(victim.r,original.r);
const old=setup();const oldBody=old.boss;
Object.assign(oldBody,{h:298,r:49});oldBody.honroMonsterScale.rest=298;oldBody.honroMonsterScale.restR=49;old.e.b.honroMonsterScaleRevision=1;
fakeStore.clear();const f=G.HonroProfileStore.fresh(),s=G.HonroProfileStore.create();f.honroBattle=old.e.b;assert(s.save(f));
const resumed=G.HonroProfileStore.create().initial.honroBattle;assert(resumed);
assert(G.HonroProfileStore.restoreBattleArt(resumed));M.prepare(resumed);M.sync(resumed);
const oldRestored=resumed.units.find(x=>x.id===id);assert.equal(resumed.honroMonsterScaleRevision,1);assert.equal(oldRestored.h,298);assert.equal(oldRestored.r,49);
const result={status:'PASS',manifest:fact(local('web/manifest.json')),artifact:candidate?'candidate source overlay into hash-checked official baseline':isNew?'packaged candidate':'packaged official baseline',before,A01,HWD:enemy,wrongExit,oldSaved:[oldRestored.h,oldRestored.r],limitations:'Controlled checkpoints and normal compiled A01/AI simulation; no full stage traversal, full optional cutscene or actual desktop browser.'};
fs.writeFileSync(path.join(folder,'STAGE34-NATIVE.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));process.exit(0);
