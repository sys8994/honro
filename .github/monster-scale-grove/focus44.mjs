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

const C=G.HONRO_CORE, S=44, st=await G.HonroCampaignLoader.ensureStage(S), p=C.defaults(), cs=G.HONRO_CONTENT.stages.find(s=>s.id===S), P=G.HonroProgression;
p.recruited=G.HonroStageRules.stageParty(S);
for(const cls of p.recruited){p.heroes[cls].xp=P.rewardXpAt(P.plan(S).entryLevel);C.autoTrain(p.heroes[cls],cls);C.sanitizeLoadout(p,cls)}
const b=G.HonroWorld.build(cs,p,false);b.seed=b.rng=20261124;G.HonroStageRules.sanitizeStageBattle(b);
const events=[],e=new C.Engine(b,x=>{if(x.type==='damage'||x.type==='fx'||x.type==='win'||x.type==='lose')events.push(x)},true),q=e.b;
const boss=e.unit('a5-foe-5'),payload=e.unit('p-archer'),samples=[];
assert.equal(q.honroStage,44);assert.equal(boss.h,460);
q.honroState.act5.step=1;
// Start at an existing upper-route encounter checkpoint rather than fighting
// the whole chapter. No HP, enemy positions, attacks, or physics are altered.
for(const [i,u] of e.heroesAlive().entries()){
 const x=[3644,3510,2950,3380][i]??4100;
 const floors=q.terrain.flatMap(t=>(C.terrainSurfaces(t,x)||[]).filter(s=>s.y>1050&&s.y<1580&&C.validTerrainContactPose(q.terrain,{...u,x,y:s.y})).map(s=>s.y));
 assert(floors.length,'no existing foothold '+u.id+' x'+x);
 const y=Math.min(...floors);Object.assign(u,{x,y,airborne:false,vx:0,vy:0});
}
const a5=G.HonroAct5;
const fixture={engine:e,profile:p,stage:cs,settings:{debug:false},screen:'battle',dirty:false,modal:{classList:{contains(){return false}}},event(){},notify(){}};
assert(a5.wakeEligible(q,boss,e.heroesAlive(),1600),'upper checkpoint did not afford native encounter');
a5.tick(fixture,.05);
const scratchRounds=[],MAX=Number(process.env.WARDEN_ROUNDS??5);
const initial={boss:{id:boss.id,x:boss.x,y:boss.y,h:boss.h,r:boss.r,hp:boss.hp},skills:e.heroesAlive().map(u=>({id:u.id,level:u.level,loadout:u.loadout,ranks:u.ranks,attack:u.attack})),stageLevel:P.plan(S).entryLevel,targetRounds:P.plan(S).targetRounds};
const emit=(obj)=>{samples.push(obj);console.error(JSON.stringify(obj));fs.writeFileSync(path.join(folder,'focused-route.json'),JSON.stringify({scope:'Real Engine; ordinary walk/jump/contact/fire/guard/enemy ticks; legal auto-trained Stage6 party; prepared upper route positions, no enemy/HP/damage editing, real attacks/turns; not full chapter; single seed',initial,samples,remaining:{h:boss.hp,payload:payload.hp,phase:q.phase,round:q.round}},null,2))};
function advance(spin=5000){let n=0;while(!e.canAct()&&!['won','lost'].includes(q.phase)&&n++<spin){e.tick(1/60);if(q.phase==='aim'&&q.side===0&&e.active?.dead){const next=e.heroesAlive().find(u=>!u.acted);if(next)e.select(next.id)}}return e.canAct()}
function move(u,tx){let stuck=0;for(let j=0;j<650&&e.canAct()&&u.moveLeft>10&&Math.abs(u.x-tx)>20;j++){
 const x=u.x;e.move(Math.sign(tx-u.x),1/60);e.tick(1/60);
 if(Math.abs(x-u.x)<.08){if(++stuck>8&&e.grounded(u)){e.jump(u);stuck=0;}}else stuck=0;
 }for(let j=0;j<140&&!e.grounded(u)&&!u.dead;j++)e.tick(1/60);}
function best(u){
 const skillList=u.loadout.map(id=>C.SKILLS[id]).filter(s=>s?.damage>0&&!s.passive&&e.cooldownLeft(u,s.id)<=0&&e.canAfford(s,u,1));
 let all=[];const center=(boss.y-boss.h*.77);
 const d=Math.hypot(boss.x-u.x,boss.y-u.y);if(d>2250)return null; 
 for(const skill of skillList){
   if(skill.martial&&skill.branch==='sword'){
     const angle=Math.atan2(u.y-u.h*.58-(boss.y-boss.h*.5),boss.x-u.x)*180/Math.PI;
     for(const power of [1,.7,.3])if(C.meleeContains(e,u,boss,C.meleeRange(u,skill,power),-angle*Math.PI/180,C.meleeSpan(u,skill,power)))all.push({skill:skill.id,angle,power,grade:skill.damage*2,weak:false});
     continue;
   }
   const dir=boss.x>=u.x?1:-1;
   const angle0=Math.atan2(u.y-u.h*.63-center,Math.abs(boss.x-u.x))*180/Math.PI;
   const bin=[-30,-15,0,15,30,50,65,angle0,angle0+10,angle0+22,angle0-10].map(a=>dir===1?a:180-a);
   const seeds=e.shotSeeds(u,skill,boss);const samples=Object.values(Object.fromEntries([...seeds.slice(0,32),...bin.flatMap(angle=>[.70,.9,1].map(power=>({angle,power})))].map(a=>[a.angle.toFixed(2)+':'+a.power.toFixed(2),a])));
   const choices=[];
   for(const aim of samples){
     if(aim.power<=0||aim.power>1)continue;
     const p=e.predict(u,skill,aim.angle,aim.power,boss,false);
     if(p.unit!==boss.id)continue; 
     const rel=(p.y-(boss.y-boss.h))/boss.h,weak=.13<=rel&&rel<=.41;
     const w=boss.honroMonsterWeakPoint;const x={skill:skill.id,...aim,rel,weak,grade:skill.damage*(weak?4:1)*(.8+.2*aim.power)};
     choices.push(x);
   }if(choices.length)all.push(choices.sort((x,y)=>y.grade-x.grade)[0]);
 }
 return all.sort((x,y)=>y.grade-x.grade)[0]??null;
}
for(let turns=0;turns<MAX*4+1&&q.round<=MAX&&boss.hp>0;turns++){
 if(!advance()||q.round>MAX)break;
 const u=e.active,dist={archer:660,mage:490,knight:120}[u.cls]||540,sign=u.x<=boss.x?-1:1,tx=boss.x+dist*sign;
 const round=q.round,s={round,actor:u.id,from:[u.x,u.y],bossStart:[boss.x,boss.y,boss.hp],heroHp:u.hp};
 if(Math.abs(tx-u.x)>45)move(u,tx);
 if(!e.canAct()){emit({...s,ranOut:'no legal action after movement'});continue;}
 s.fromAfter=[u.x,u.y];s.grounded=e.grounded(u);s.bossPos=[boss.x,boss.y];
 if(u.hp<u.maxHp*.30&&u.hp>0&&q.items.heal>0&&e.item('heal')){emit({...s,action:'heal',bossHp:boss.hp});continue;}
 const pick=best(u);
 if(pick){const h=boss.hp,k=events.length, fired=e.fire(pick.skill,pick.angle,pick.power);let n=0;while(['flight','settle'].includes(q.phase)&&n++<2300)e.tick(1/60);
  emit({...s,action:'shot',pick,fired,hpLoss:Math.max(0,h-boss.hp),hpRemaining:boss.hp,weakMessage:events.slice(k).filter(e=>e.type==='fx'&&/(약점|감쇄)/.test(e.text||'')).map(e=>e.text)});if(fired)continue;
 }
 e.wait();emit({...s,action:'guard',bossHp:boss.hp});
}
console.log(JSON.stringify({initial,after:boss.hp,samples},null,2));
process.exit(0); // The browser RAF shim intentionally stays scheduled in this native fixture.
