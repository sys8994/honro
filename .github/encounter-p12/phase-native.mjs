import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs'; import fsP from 'node:fs/promises';
import path from 'node:path'; import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);
const {createCanvas,Path2D,Image,DOMMatrix,DOMPoint,ImageData}=req(process.env.HONRO_NAPI_MODULE||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const [site,target,arm,pinnedSha]=process.argv.slice(2);
if(!site||!target||!['A','B'].includes(arm)||!pinnedSha?.match(/^[0-9a-f]{64}$/))throw Error('phase-native.mjs <normal site> <output> <A|B> <exact manifest SHA>');
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
assert.equal(fact(local('web/manifest.json')).sha256,pinnedSha);
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


const A=G.HonroAct5;
assert(A&&typeof A.wakeEligible==='function');
const clone=v=>JSON.parse(JSON.stringify(v));
const unit=(b,i)=>b.units.find(u=>u.id==='a5-foe-'+i);
const snapshot=b=>Object.fromEntries(b.units.filter(u=>u.id.startsWith('a5-foe-')).map(u=>[u.id,{role:u.role,species:u.honroMonsterSpecies??u.honroType,x:u.x,y:u.y,hp:u.hp,skill:u.loadout}]));
async function make(n){
 const exact=await G.HonroCampaignLoader.ensureStage(n), content=G.HONRO_CONTENT.stages.find(s=>s.id===n);
 const f=staged.stages[n-1]; assert.deepEqual(fetched.get(f),fact(trust(f)),'wrong compiled stage wire '+n);
 assert.equal(exact.metadata.stageId,n);
 const b=G.HonroWorld.build(content,G.HonroProfileStore.fresh(),false);
 b.seed=b.rng=20261124;
 assert.equal(b.honroMapOrigin,'campaign'); G.HonroStageRules.sanitizeStageBattle(b);
 const e=new G.HONRO_CORE.Engine(b,()=>{},true), noticed=[];
 const app={engine:e,stage:content,done:false,notice:noticed,notify:s=>noticed.push(s),sayLines(){},canInput(){return false},checkMission(){},updateHUD(){}};
 assert.equal(b.honroCounters.spawned,0);
 return {b,e,app,noticed};
}
const mem=(b,step)=>b.honroState.act5={step,beats:{}};
const tick=(app, dt=.05)=>A.tick(app,dt);
function put(m,x,y,cls='archer'){
 const u=m.b.units.find(u=>u.id==='p-'+cls);
 const floor=m.e.contactSurface(x,y-1,y+1); assert.ok(floor,'real support '+x+','+y);
 Object.assign(u,{x,y:floor.y,airborne:false,vx:0,vy:0});return floor.t.id;
}
function waveState(m,w){return m.b.honroState.act5.waves?.[w.id];}
function waitWave(m,w){
 let prev=m.b.honroCounters.spawned;
 assert.equal(waveState(m,w),'pending');
 tick(m.app,1.00);
 return {arrived:waveState(m,w),spawned:m.b.honroCounters.spawned-prev,units:w.units.map(id=>{
  const u=m.b.units.find(x=>x.id===id); const foot=m.e.contactSurface(u.x,u.y-1,u.y+1);
  return {id:u.id,dead:u.dead,reserve:!!u.honroAct5Reserve,role:u.role,x:u.x,y:u.y,support:foot?.t.id,flying:G.HONRO_CORE.flyingEnemy(u)};
 })};
}
const result={status:'HOLD',arm,manifest:pinnedSha,entry:manifest.gameEntry,method:'normal compiled active map; synthetic scenario entry phase, native support and turn-boundary; no player-input run'};
function receipt(){fs.writeFileSync(path.join(folder,'ACT5-PHASES.json'),JSON.stringify(result,null,2));}
receipt();
try{
const site=(m,k)=>m.b.honroMap.act5.sites[k];
const move=(m,k)=>{const p=site(m,k);return put(m,p.x,p.y);};
const both=(m,w)=>{assert.equal(waveState(m,w),undefined);tick(m.app);return waitWave(m,w);};
const roles=(b,ids)=>ids.map(i=>unit(b,i).role);
const store=G.HonroProfileStore;
const resumeShape=b=>clone({units:b.units,terrain:b.terrain,map:b.honroMap,state:b.honroState});
result.compact={};
for(const n of [41,42,44,50]){
 const a=await make(n);const aSave=clone(store.compactBattleArt(a.b));
 const refs=v=>[...v.honroLandmarks,...v.honroElements].map(x=>x.asset).filter(x=>x?.honroStaticAssetRef);
 const signed=refs(aSave);assert.ok(signed.length);
 assert.equal(store.restoreBattleArt(aSave),true);assert.deepEqual(resumeShape(aSave),resumeShape(a.b));
 result.compact[n]=signed;
}
{
 const out=result.case={};
 // Stock count and origins. Do not infer "awake" from opening budget.
 const m41=await make(41,arm), [camp,guide]=m41.b.honroMap.act5.waves;
 out.roster41=snapshot(m41.b);out.roster42=snapshot((await make(42,arm)).b);
 mem(m41.b,2);const flank=unit(m41.b,21), q={x:flank.x,y:flank.y};
 const early=A.wakeEligible(m41.b,flank,[q],1600);mem(m41.b,3);const late=A.wakeEligible(m41.b,flank,[q],1600);
 if(arm==='B')assert.deepEqual([flank.role,early,late],['leaper',false,true]);
 else assert.equal(flank.role,'fire');
 out.wake41={early,late};
 mem(m41.b,0);move(m41,'camp');out.camp41=both(m41,camp);assert.equal(out.camp41.spawned,3);assert.equal(waveState(m41,guide),undefined);
 const clear=(b,key)=>b.honroMap.act5.required[key].forEach(id=>{const u=b.units.find(q=>q.id===id);u.dead=true;u.hp=0;});
 assert.equal(m41.b.honroState.act5.step,1);clear(m41.b,'campGuard');tick(m41.app);assert.equal(m41.b.honroState.act5.step,2);
 clear(m41.b,'watch');tick(m41.app);assert.equal(m41.b.honroState.act5.step,3);
 move(m41,'guide');out.guide41=both(m41,guide);assert.equal(out.guide41.spawned,3);
 assert.ok(m41.b.units.some(u=>u.id==='a5-guide'&&!u.dead));
 // A/B drum: baseline permissions plus one additional hostile-height test.
 for(const mode of ['alive','destroyed']){
  const m=await make(42,arm), {b,app}=m, [w]=b.honroMap.act5.waves;
  const flank=unit(b,7);mem(b,0);
  const lower=A.wakeEligible(b,flank,[{x:flank.x,y:site(m,'rescue').y}],1600);
  const upper=A.wakeEligible(b,flank,[{x:flank.x,y:flank.y}],1600);
  if(arm==='B')assert.deepEqual([flank.role,lower,upper],['bow',false,true]);
  else assert.equal(flank.role,'bow');
  out.wake42={lower,upper};
  const links=b.honroMap.act5.links;
  assert.equal(links.length,2);assert.ok(links[0].label.includes('사다리'));
  for(const link of links){assert.ok(m.e.contactSurface(link.x,link.y-1,link.y+1));assert.ok(m.e.contactSurface(link.to.x,link.to.y-1,link.to.y+1));}
  const escorts=b.units.filter(u=>u.honroAct5Escort);
  assert.deepEqual(Array.from(escorts,u=>u.id),['a5-gwak','a5-soldier-one','a5-soldier-two']);
  assert.equal(A.failure(b),null); escorts[0].dead=true;assert.ok(A.failure(b));escorts[0].dead=false;
  // Rescue reaches the stock refuge phase through the real tick. Synthetic starting position only.
  mem(b,1);move(m,'rescue');tick(app);assert.equal(b.honroState.act5.step,2);
  const drum=b.units.find(u=>u.id==='a5-device-0');
  assert.ok(drum.honroObjectiveTarget&&!drum.dead);tick(app);assert.equal(waveState(m,w),undefined);
  if(mode==='destroyed'){drum.dead=true;drum.hp=0;}
  b.teamEnds??=[0,0];b.teamEnds[1]=b.honroState.act5.drumStart+1;
  tick(app);
  if(mode==='alive'){out.drum42=waitWave(m,w);assert.equal(out.drum42.spawned,3);}
  else{assert.equal(waveState(m,w),undefined);assert.equal(b.honroCounters.spawned,0);out.noDrum42=0;}
 }
 // Both existing routes remain on native supports and can be used without clearing the map.
 for(const routeId of ['rootsUpper','rootsLower']){
  const m=await make(44,arm), {b,app}=m;
  const route=b.honroMap.act5.passages.roots.find(s=>s.id===routeId);
  const steps=[];
  mem(b,1);
  for(const key of route.sites){
   const c=b.honroMap.act5.contest[key], group=b.honroMap.act5.groups[c.group];
   for(const id of group){const u=b.units.find(q=>q.id===id);if(u)u.bound=1;}
   const surface=move(m,key);steps.push({key,surface});tick(app);
  }
  assert.equal(b.honroState.act5.step,2);out['44'+routeId]=steps;
 }
 for(const fallback of [false,true]){
  const m=await make(44,arm),{b,app}=m,[w]=b.honroMap.act5.waves;
  mem(b,2);tick(app);assert.equal(waveState(m,w),undefined);
  mem(b,3);
  if(fallback)put(m,w.entry.x,w.entry.y);
  const first=both(m,w);let out44=first;
  if(first.spawned===0){const u=unit(b,24);u.dead=true;u.hp=0;out44=waitWave(m,w);}
  console.error('SUMMIT PROBE',arm,fallback,JSON.stringify({first,afterClearingBlockingHound:out44}));
  assert.equal(first.spawned,fallback?0:3);assert.equal(out44.spawned,3);assert.ok(out44.units.every(u=>u.support&&!u.dead));
  out['44'+(fallback?'Fallback':'Primary')]={first,afterClearingBlockingHound:out44};
  const tree=unit(b,5);assert.equal(tree.honroMonsterPattern,'naruWarden');assert.ok(tree.honroMidboss);
  out.tree44={hp:tree.hp,skill:tree.loadout,x:tree.x,y:tree.y,pattern:tree.honroMonsterPattern};
 }
 // Exact no-change Stage50. Prove the two signals are not just duplicate timings.
 const m50=await make(50,arm), {b,app}=m50,[w1,w2]=b.honroMap.act5.waves;
 mem(b,0);move(m50,'saddle');tick(app);assert.equal(waveState(m50,w1),undefined);
 mem(b,2);move(m50,'saddle');out.wave50First=both(m50,w1);assert.equal(out.wave50First.spawned,2);assert.equal(waveState(m50,w2),undefined);
 assert.equal(b.honroState.act5.step,3);move(m50,'bridge');const bstate=b.honroState.act5.step;
 out.wave50Second=both(m50,w2);assert.equal(out.wave50Second.spawned,2);
 assert.notDeepEqual(Array.from(out.wave50First.units,u=>u.role),Array.from(out.wave50Second.units,u=>u.role));
 assert.notEqual(w1.entry.x,w2.entry.x);assert.equal(bstate,3);assert.equal(b.honroState.act5.step,3,'bridge contest still blocks standalone wave');
 const guard=unit(b,17);assert.ok(guard.honroMidboss&&guard.honroMonsterPattern==='vanguard');
 const links=b.honroMap.act5.links, gates=[];
 for(const [id,early,late] of [['a5-cross-0',2,3],['a5-cross-2',5,6]]){
   const marker=links.find(l=>l.id===id); assert.ok(marker);
   put(m50,marker.x,marker.y);b.active='p-archer';
   mem(b,early);const before=A.eligibility(app,marker);
   mem(b,late);const after=A.eligibility(app,marker);
   assert.equal(before.ok,false); assert.equal(after.ok,true);gates.push({id,before,after});
 }
 out.protected50={guard:{id:guard.id,x:guard.x,y:guard.y},waves:clone([w1,w2]),stairs:clone(b.honroMap.act5.links),gates,objectives:clone(b.honroMap.act5.flow)};
}
for(const [p,m] of fetched)assert.deepEqual(m,fact(trust(p)),'shift in verified loader route '+p);
result.maps=Object.fromEntries([41,42,44,50].map(n=>[n,{path:staged.stages[n-1],...fact(trust(staged.stages[n-1]))}]));
result.status='PASS';
}catch(e){result.error=String(e.stack??e);}
receipt();console.log(result.status,arm,result.error??'native Act5 phase fixture completed');process.exit(result.status==='PASS'?0:1);
