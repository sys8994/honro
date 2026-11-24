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
const C=G.HONRO_CORE;
await G.HonroCampaignLoader.ensureStage(6);
const cs=G.HONRO_CONTENT.stages.find(s=>s.id===6),f=G.HonroProfileStore.fresh();
const host=G.HonroWorld.build(cs,f,false);G.HonroStageRules.sanitizeStageBattle(host);
assert.equal(host.honroStage,6);
const authored=host.units.find(x=>x.id==='foe-7');assert(authored&&authored.honroType==='bat');
if(mode==='B')assert.deepEqual(JSON.parse(JSON.stringify(authored.honroSmallRoost)),{v:1,kind:'east-rock-watch',revealed:false});
const session=(from=host)=>{const e=new C.Engine(structuredClone(from),()=>{},true);return {e,bat:e.unit(authored.id),hero:e.unit('p-archer')}};
function pose(session,id,x){
 const {e,bat,hero}=session;
 const t=e.b.terrain.find(t=>t.id===id);
 const surface=C.terrainSurfaces(t,x).at(0);assert(surface);
 Object.assign(hero,{x,y:surface.y,airborne:false,vx:0,vy:0,jumping:false});
 const from={x:bat.x,y:bat.y-bat.h*.5},to={x:hero.x,y:hero.y-hero.h*.5};
 const obstruction=e.projectileCollision(from,to,2,bat.id,[],false)?.terrain?.id??null;
 const contact=e.contactSurface(x,hero.y-4,hero.y+5)?.t.id;
 assert(e.grounded(hero));
 e.refreshActivation();
 return {id,x,y:hero.y,contact,obstruction,active:e.combatEnemies().some(u=>u.id===bat.id),stockAwake:bat.awake,revealed:bat.honroSmallRoost?.revealed??null};
}
const x=session(),lowerCovered=pose(x,'lower-lookout',4950),lowerExposed=pose(x,'lower-lookout',4820),lowerRoad=pose(x,'lower-road',5430),upperFar=pose(x,'bridge-east',4470);
function persisted(battle){
 fakeStore.clear();const profile=G.HonroProfileStore.fresh(),h=G.HonroProfileStore.create();profile.honroBattle=battle;
 assert(h.save(profile),'native profile write failed');
 const next=G.HonroProfileStore.create();
 assert(!next.locked&&next.initial.honroBattle,'native profile parse failed');
 assert(G.HonroProfileStore.restoreBattleArt(next.initial.honroBattle),'native art restore failed');
 return next.initial.honroBattle;
}
const resumed=session(persisted(x.e.b));
if(mode==='B')assert.equal(resumed.bat.honroSmallRoost.revealed,false);
const upperReveal=pose(resumed,'bridge-east',4830),upperRetreat=pose(resumed,'lower-lookout',4950);
const held=session();pose(held,'lower-lookout',4950);
const beforeDot=held.bat.hp;
held.e.hurt(held.bat,30,held.hero.id,false,undefined,undefined,'normal','O15',{skill:'O15'});
const dot={loss:beforeDot-held.bat.hp,revealed:held.bat.honroSmallRoost?.revealed??null};
const before=held.bat.hp;
Object.assign(held.e.b,{active:held.hero.id,side:0,phase:'aim',projectiles:[],volley:undefined});
Object.assign(held.hero,{loadout:['A01'],focus:1000,maxFocus:1000,acted:false,cooldowns:{}});held.hero.ranks.AP01=0;
held.e.canAct=()=>true;assert(held.e.fire('A01',0,.8,false));
const p=held.e.b.projectiles[0],y=held.bat.y-held.bat.h*.5;
Object.assign(p,{x:held.bat.x-104,y,vx:1120,vy:0,damage:50,damageRoll:1});
const collision=held.e.projectileCollision(p,{x:held.bat.x,y},p.radius,held.hero.id,[],true,[],true,p);assert.equal(collision.unit?.id,held.bat.id);
held.e.impact(p,collision);
const hitWake={loss:before-held.bat.hp,revealed:held.bat.honroSmallRoost?.revealed??null,active:held.e.combatEnemies().some(u=>u.id===held.bat.id)};
const cold=session(persisted(resumed.e.b));
const watchTurn=session();pose(watchTurn,'lower-lookout',4950);
watchTurn.e.b.side=0;watchTurn.e.b.phase='transition';watchTurn.e.b.enemyLimit=1;
const heldFrom={x:watchTurn.bat.x,y:watchTurn.bat.y};
for(let n=0;n<72;n++)watchTurn.e.tick(1/120);
const holdTurn={from:heldFrom,to:{x:watchTurn.bat.x,y:watchTurn.bat.y},queued:watchTurn.e.b.queue.includes(watchTurn.bat.id),planned:!!watchTurn.bat.aiMove};
const attack=session();pose(attack,'bridge-east',4830);
attack.e.b.side=1;attack.e.b.phase='enemy';attack.e.b.active=attack.bat.id;attack.e.b.queue=[attack.bat.id];attack.bat.acted=false;
const initial={x:attack.bat.x,y:attack.bat.y,hp:attack.bat.hp};
let aimAge,firstAimAt,launched,hits;
const dt=1/120;const beforeHero=attack.e.heroesAlive().map(u=>u.hp);
for(let n=0;n<1200;n++){
 const preAim=attack.bat.aiAim?.age;
 attack.e.tick(dt);
 if(attack.bat.aiAim&&firstAimAt===undefined)firstAimAt=n;
 const active=attack.e.b.projectiles.find(v=>v.owner===attack.bat.id);
 if(active&&!launched){aimAge=preAim+dt;launched={skill:active.skill,phase:attack.e.b.phase,step:n,from:{x:attack.bat.x,y:attack.bat.y}};}
 if(launched&&!active){hits=attack.e.heroesAlive().map((u,i)=>beforeHero[i]-u.hp);break;}
}
const revealAction={initial,firstAimAt,aimAge,launched,hits};
const checks={holdTurn,revealAction,lowerCovered,lowerExposed,lowerRoad,upperFar,upperReveal,upperRetreat,dot,hitWake,coldReveal:cold.bat.honroSmallRoost?.revealed??null};
if(mode==='B'){
 for(const k of ['lowerCovered','lowerExposed','lowerRoad','upperFar']){assert.equal(checks[k].revealed,false,JSON.stringify(checks));assert.equal(checks[k].active,false);}
 assert.equal(lowerCovered.obstruction,'place6-east-rock:collision:0');assert.equal(lowerRoad.obstruction,null);
 assert.equal(upperReveal.contact,'bridge-east');assert.equal(upperReveal.obstruction,null);
 assert.equal(upperReveal.revealed,true);assert.equal(upperReveal.active,true);assert.equal(upperRetreat.revealed,true);assert.equal(cold.bat.honroSmallRoost.revealed,true);
 assert(dot.loss>0&&!dot.revealed);assert(hitWake.loss>0&&hitWake.revealed&&hitWake.active);
 assert.equal(lowerCovered.stockAwake,true);
 assert.deepEqual(holdTurn.to,holdTurn.from,'held actor must remain at roost through a native enemy transition');
 assert(!holdTurn.queued&&!holdTurn.planned);
 assert(['HBT01','HBT02'].includes(revealAction.launched?.skill),JSON.stringify(revealAction));
 assert(revealAction.aimAge>=.45&&revealAction.aimAge<=.47,JSON.stringify(revealAction));
}
const result={status:'PASS',mode,manifest:fact(local('web/manifest.json')),stage:6,actor:authored.id,asset:{h:authored.h,r:authored.r,hp:authored.hp,loadout:authored.loadout},checks,limits:'Actual compiled game support/LoS/damage and combat eligibility at controlled fixtures + native ProfileStore save/parse/art restore; not full player traversal nor App Continue UI.'};
fs.writeFileSync(path.join(folder,'STAGE6-BAT.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));process.exit(0);
