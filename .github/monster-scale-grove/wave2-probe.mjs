import {stage18Runtime} from './stage18-native.mjs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {act5Probe} from './act5-probe.mjs';
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
function get(file){if(!modules.has(file)){
 let src=fs.readFileSync(file,'utf8');
 if(process.env.STAGE16_GROWTH==='yes'&&file.endsWith('ordered-common-11.d1d10627f25fc67c.js')){
  const rule='else if(GROWTH[key])m=GROWTH[key]';assert.equal(src.split(rule).length,2);
  src=src.replace(rule,'else if(GROWTH[key])m=(b.honroStage===16&&u.id==="tm-lower-point"?[1.6,3.51,8.09]:GROWTH[key])');
 }
 modules.set(file,new vm.SourceTextModule(src,{context,identifier:file,initializeImportMeta(m){m.url=pathToFileURL(file).href;}}));}return modules.get(file)}
const link=(spec,m)=>get(path.resolve(path.dirname(m.identifier),spec));
for(const [s,r] of entrySrc.match(/const modules=\[.*?\]\.filter/s)[0].matchAll(/new URL\("([^"]+)",import.meta.url\)/g)){
 const f=path.resolve(path.dirname(entry),r);const m=get(f);
 if(m.status==='unlinked')await m.link(link);
 trust(path.relative(base,f));
 try{if(m.status==='linked')await m.evaluate()}catch(e){if(!(/ordered-game-23\./.test(f)&&String(e)==='ReferenceError: Audio is not defined'))throw e;console.error('VM APP constructor expected Audio-unavailable; browser proof separate');}
}
const G=context;console.error('GLOBALS',Boolean(G.HonroScene),Boolean(G.HonroCampaignLoader),Boolean(G.HonroStageRules),Boolean(G.HonroMaps),G.HONRO_PROJECT?.stages.length);

const selectionIds=selection.split(',').map(Number);
assert(selectionIds.length&&new Set(selectionIds).size===selectionIds.length&&selectionIds.every(k=>Number.isInteger(k)&&k>=1&&k<=50));
const sha=v=>v===undefined?null:fact(Buffer.from(JSON.stringify(v))).sha256;
const keep=(o,ks)=>Object.fromEntries(ks.filter(k=>o[k]!==undefined).map(k=>[k,o[k]]));
const actorKeys='id name side x y w h hp maxHp kind cls boss awake grounded dead reserve hidden vx vy motion groundId flying flight group role'.split(' ');
const enemyAttrs=k=>/honro.*(wave|reserve|optional|darkness|roster|enemy|cluster|role|boss|spawn|target)|phase/i.test(k);
const fields=(o,pattern)=>Object.keys(o).filter(k=>pattern.test(k)).sort();
const pickActors=b=>b.units.map(u=>keep(u,[...new Set(actorKeys.concat(Object.keys(u).filter(enemyAttrs)))]));
const encounterFields=b=>keep(b,fields(b,/^encounter$|^winnerReason$|^phase$|^round$|^side$|^reinforced$|^honro(?:.*(?:escort|objective|mission|prepared|act4.*(?:state|residen|encounter)|spawn|signal|wave|counte|target)|State|Markers|Events|AuthoredEvents)$/i));
const physicalKeys='physics terrain waters drafts width height vertical routePoints honroWorldTerrain honroPlayBounds honroTerrainBounds honroTerrainDomainVersion honroMapAnchors honroSurfaceZones'.split(' ');
function supports(engine,actor){
 const a=actor; if(!Number.isFinite(a.x)||!Number.isFinite(a.y))return {status:'non-finite'};
 if(a.dead||a.hp<=0||a.hidden||a.reserve||a.honroAct4Reserve||a.honroAct5Reserve||a.honroAct5Darkness)return {status:'deferred-or-inactive'};
 const c=engine.contactSurface(a.x,a.y-4,a.y+5);const v=engine.contactSurface(a.x,a.y-64,a.y+64);
 return {status:engine.grounded(a)?'grounded':'not-grounded',nativeContact:c?{y:c.y,id:c.t?.id}:null,nearSurface:v?{y:v.y,id:v.t?.id}:null,nativeFlying:G.HONRO_CORE.flyingEnemy(a),bounds:[a.x>=0&&a.x<=engine.b.width,a.y>=0&&a.y<=engine.b.height]};
}
const route=p=>p?{path:p,...fact(trust(p))}:null;
function makeEngine(b){ return new G.HONRO_CORE.Engine(b,()=>{},true); }
function scripts(){
 return Object.fromEntries(Object.entries(G).filter(([k,v])=>/^Honro(?:Objectives|Act4|Act5|Encounter)/.test(k)&&v&&typeof v==='object').map(([k,v])=>[k,Object.keys(v)]));
}
const result={status:'HOLD',scope:selectionIds,mode:'actual compiled data, VM Engine and NAPI graphics, not app UI',identity:{manifest:fact(local('web/manifest.json')),entry:route(manifest.gameEntry),project:route(manifest.project)},exportedApis:scripts(),stages:{}};
function write(){fs.writeFileSync(path.join(folder,'WAVE2.json'),JSON.stringify(result,null,2));}
for(const id of selectionIds){
 const stage=result.stages[id]={status:'HOLD'};
 try{
   stage.routes={map:route(staged.stages[id-1]),library:route(staged.stageLibraries[id-1]),encoding:staged.assetEncodings?.stageLibraries?.[id-1]};
   assert(stage.routes.map,'missing active map');
   const st=await G.HonroCampaignLoader.ensureStage(id),p=G.HONRO_PROJECT,prof=G.HonroProfileStore.fresh();
   const cs=G.HONRO_CONTENT.stages.find(s=>s.id===id);assert(cs,'missing live stage content');
   fakeStore.clear();const b=G.HonroWorld.build(cs,prof,false);
   assert.equal(b.honroStage,id);assert.equal(b.honroCanonical,true);assert.equal(b.honroCustom,false);
   b.seed=b.rng=20261124;
   G.HonroStageRules.sanitizeStageBattle(b);
   const e=makeEngine(b);assert.equal(e.b.honroStage,id);
   stage.title=st.name; stage.bounds=e.b.honroPlayBounds;
   const C=G.HONRO_CORE,M=G.HonroMonsterScale,A=G.HonroAct5;
   const fit=(b,u,h,r)=>({h,r,headroom:Number.isFinite(M.headroom(b,u,r))?M.headroom(b,u,r):'open',fits:M.headroom(b,u,r)>=h+6&&C.validTerrainContactPose(b.terrain,{...u,h,r})});
   const app={engine:e,stage:cs,profile:prof,done:false,event(){},notify(){},sayLines(){},updateHUD(){},checkMission(){},canInput(){return false;},modal:{classList:{contains(){return false}}}};
   const realHurt=(ev,v,hero)=>ev.hurt(v,10,hero.id,true,undefined,{x:v.x-v.r,y:v.y-v.h*.5},'normal');
   const approach=(ev,u)=>{
    const b=ev.b,hero=ev.heroesAlive()[0],arcHits=[], angles=[];
    // Only physically supported stances, not automatically navigable from a save.
    const sites=new Map;
    for(const off of [-1500,-1200,-950,-720,-500,-340,340,500,720,950,1200,1500]){
     const x=u.x+off;if(x<130||x>b.width-130)continue;
     for(const t of b.terrain)for(const f of C.terrainSurfaces?.(t,x)||[]){
      if(!f||f.y<u.y-720||f.y>u.y+680)continue;
      if(!C.validTerrainContactPose(b.terrain,{...hero,x,y:f.y}))continue;
      for(const harm of [.18,.28,.39,.60]){
       const y0=f.y-hero.h*.63,y1=u.y-u.h+harm*u.h,dx=u.x-x;
       for(const lift of [0,120,260,420,580]){
        const route=(i)=>({x:x+dx*i,y:y0+(y1-y0)*i-4*lift*i*(1-i)});
        let p=route(0),hit,at;
        const arrow={id:99001,owner:hero.id,side:0,attackSide:0,mode:'arrow',radius:4};
        for(let i=1;i<=65;i++){at=route(i/65);hit=ev.projectileCollision(p,at,4,hero.id,[],true,[],true,arrow);if(hit)break;p=at;}
        if(hit?.unit?.id!==u.id)continue;
        const eta=(hit.y-(u.y-u.h))/u.h;
        if(eta<.1||eta>.46)continue;
        arcHits.push({side:Math.sign(off),x:Math.round(x),y:Math.round(f.y),support:t.id,lift,eta:+eta.toFixed(3),aimEta:harm});break;
       }
      }
     }
    }
    const uniq={};for(const r of arcHits){const key=r.side+':'+r.support+':'+r.y; if(!uniq[key]||r.lift<uniq[key].lift)uniq[key]=r;}
    return Object.values(uniq).sort((a,b)=>a.side-b.side||a.y-b.y).slice(0,45);
   };
   if(id===16){
    const enemy=e.unit('tm-lower-point'),hero=e.heroesAlive()[0];assert(enemy&&hero);
    const snap=()=>({level:enemy.honroMonsterGrowth??0,h:enemy.h,awake:enemy.awake,hp:enemy.hp,shot:e.b.shot,rounds:[...e.b.teamEnds],stage:enemy.honroMonsterState?.growthRound??null,art:G.HonroMonsterVisual.species(enemy)});
    stage.realGrowth=[snap()];
    for(let i=1;i<=2;i++){e.b.shot=1900+i;realHurt(e,enemy,hero);M.sync(e.b);stage.realGrowth.push(snap())}
    stage.candidateChecks=[[152,41],[284,53],[400,60],[490,65],[545,68],[606,73]].map(([h,r])=>fit(e.b,enemy,h,r));
    const enemyExpected={...enemy};
    stage.omen=G.HonroMonsterOmen?.[16];
    stage.neighbors=e.b.units.filter(u=>u!==enemy&&!u.dead&&u.hp>0&&Math.abs(u.x-enemy.x)<400&&Math.abs(u.y-enemy.y)<900).map(u=>({name:u.name,id:u.id,x:u.x,y:u.y,h:u.h,side:u.side}));
    stage.routes16=e.b.honroMarkers?.map(u=>({id:u.id,x:u.x,y:u.y})); // do not relocate production markers
    const s=e.b.side;e.b.side=1;for(const n of [1,2,3]){e.b.teamEnds[0]=n;e.completeTeamTransition?.();M.sync(e.b);stage.realGrowth.push(snap());}e.b.side=s;
    stage.method16={transitionHook:typeof e.completeTeamTransition,hero:hero.id,enemy:enemyExpected.id};
   }else if(id===44){
    const u=e.unit('a5-foe-5');assert(u);const map=e.b.honroMap.act5;
    const original={...u};stage.tree44={id:u.id,x:u.x,y:u.y,h:u.h,r:u.r,wake:u.awake,hp:u.hp,tag:u.honroMonsterPattern,phase:e.b.honroState.act5?.step};
    stage.phaseConfigs={required:map.required,sites:map.sites,contest:map.contest,roots:map.passages.roots,groups:Object.entries(map.groups).filter(x=>x[1].includes(u.id)),waves:map.waves.map(x=>({id:x.id,when:x.when,units:x.units}))};
    stage.runs=[];
    for(const [m,h] of [[5.5,298],[7.5,406],[8.5,460],[9.2,498]]){
     const r=Math.round(original.r*Math.pow(h/original.h,.6));Object.assign(u,{h,r});
     const qc=fit(e.b,u,h,r);
     const act={m,...qc,artAboveWorld:u.y-1.08*h<0,showWidth:Math.round(1.14*h),wake:{},routes:{}};
     for(const route of map.passages.roots){
      const b=structuredClone(e.b),ev=new C.Engine(b,()=>{},true),a={...app,engine:ev};
      const boss=ev.unit(u.id),hero=ev.heroesAlive()[0];
      b.honroState.act5={step:1,beats:{}};const seq=[];
      for(const k of route.sites){
       const s=map.sites[k],f=ev.contactSurface(s.x,s.y-1,s.y+1);
       assert(f,'missing existing route support '+k);
       const c=map.contest[k],ids=map.groups[c.group]??[];
       for(const id of ids){const s=ev.unit(id);if(s)s.bound=1;}
       Object.assign(hero,{x:s.x,y:f.y,airborne:false,vx:0,vy:0});
       const w=A.wakeEligible(b,boss,[hero],1600);
       A.tick(a,.05);
       seq.push({key:k,xy:[hero.x,hero.y],support:f.t?.id,wake:w,nativePlacement:C.validTerrainContactPose(b.terrain,hero),bossGap:[Math.abs(hero.x-boss.x)-(hero.r+boss.r),hero.y-(boss.y-boss.h)],step:b.honroState.act5.step});
      }
      act.routes[route.id]=seq;
     }
     act.geometricAim=approach(e,u);act.enginePrediction=[];
     const h0=e.heroesAlive().find(p=>p.id==='p-archer')??e.heroesAlive()[0],skill=C.SKILLS[h0.loadout[0]];
     assert(skill);act.skill=skill.id;
     if(m===8.5||m===9.2){
      const prev=e.b.honroState.act5;e.b.honroState.act5={step:1,beats:{}};act.noncombat=e.noncombatWalk();act.anyHits={};
      for(const [x,y] of [[2104,1497],[1724,1999],[2944,1480],[3394,2014],[3644,1288],[3164,2016]]){
       const f=e.contactSurface(x,y-10,y+10);if(!f||!C.validTerrainContactPose(e.b.terrain,{...h0,x,y:f.y}))continue;
       const prior={x:h0.x,y:h0.y,facing:h0.facing};const actor=h0;Object.assign(actor,{x,y:f.y,facing:x<u.x?1:-1});const hits=[];
       for(const aim of [8,14,20,26,32,38,44,50,56,62,68,74,80])
        for(const power of [.24,.40,.56,.70,.82,.96,1]){
         const angle=x<u.x?aim:180-aim,hit=e.predict(actor,skill,angle,power,u,false,false);act.anyHits[hit?.unit??hit?.terrain??'none']=(act.anyHits[hit?.unit??hit?.terrain??'none']||0)+1;
         if(hit?.unit!==u.id)continue;
         const eta=(hit.y-(u.y-u.h))/u.h;
         if(eta>=.10&&eta<=.46)hits.push({angle,power,eta:+eta.toFixed(3)});
        }
       Object.assign(actor,prior);if(hits.length)act.enginePrediction.push({side:x<u.x?'west':'east',support:f.t.id,x,y:Math.round(f.y),hits});
      }
      e.b.honroState.act5=prev;
     }
     stage.runs.push(act);
    }
    Object.assign(u,original);
   }
   stage.status='PASS'; stage.liveMarkers=e.b.honroMarkers?.map(m=>({id:m.id,x:m.x,y:m.y})); stage.liveSites=e.b.honroV4Stage30??e.b.honroAct4Sites??e.b.honroAct5?.sites; write(); continue;
   stage.saveIdentity=keep(e.b,['honroStage','honroCampaignMapRevision','honroMapOrigin','honroCanonical','honroCustom','honroAuthoredId','honroAct4Official','honroAct5']);
   stage.physics=Object.fromEntries(physicalKeys.map(k=>[k,sha(e.b[k])]));
   stage.static=Object.fromEntries('terrains playBounds terrainBounds terrainDomainVersion materials anchors environment backdrop'.split(' ').map(k=>[k,sha(st[k])]));
   stage.actor=pickActors(e.b);stage.support=e.b.units.map(u=>({id:u.id,side:u.side,...supports(e,u)}));
   stage.objective={authored:st.objectives,events:st.events,stage:keep(cs,['objective','win','fail','goal','requires','target']),live:encounterFields(e.b),runtime:G.HonroObjectives?.state(e.b,cs)};
   // Native ProfileStore write+parse+art expansion, not App-specific autosave/Continue.
   const pre=keep(e.b,physicalKeys);
   const ps=G.HonroProfileStore.create();prof.honroBattle=e.b;
   assert(ps.save(prof),'isolated native ProfileStore refused save');
   const restored=G.HonroProfileStore.create();const rb=restored.initial.honroBattle;
   assert(!restored.locked&&rb,'native profile load rejected active battle');
   assert(G.HonroProfileStore.restoreBattleArt(rb),'native lazy art restore rejected exact own save');
   const checks={physical:sha(keep(rb,physicalKeys))===sha(pre),encounter:sha(encounterFields(rb))===sha(encounterFields(e.b)),actors:sha(pickActors(rb))===sha(pickActors(e.b)),phase:rb.phase===e.b.phase,round:rb.round===e.b.round};
   stage.localSave={storage:restored.state,checks,archiveCount:restored.archives().items?.length,originalBytes:restored.original().text?.length};
   assert(Object.values(checks).every(Boolean),'native in-memory save/restore state drift: '+JSON.stringify(checks));
   if(id===18&&process.env.HONRO_INTENDED?.split(',').includes('18'))stage.act2RescueResponse=stage18Runtime(G,e.b,cs,prof);
   if(id>=41)stage.act5Cases=act5Probe(G,e,cs,makeEngine,supports);
   if(process.env.FRAMES==='yes'&&(!process.env.HONRO_FRAME_IDS||process.env.HONRO_FRAME_IDS.split(',').map(Number).includes(id))){
     const origin=srcLog.length,app={engine:e,profile:prof,settings:{debug:false},modal:{classList:{contains(){return false}}},root:{querySelector(){return null}}};G.HonroApp=app;
     const W=1440,H=900,c=cv(W,H);c.clientWidth=W;c.clientHeight=H;const scene=new G.HonroScene(c);app.scene=scene;
     const active=e.b.units.filter(u=>u.side===1&&!u.dead&&supports(e,u).status!=='deferred-or-inactive');
     const sz=Math.min(W/(st.width*1.02),H/(st.height*1.02)),center=(k)=>active.reduce((s,u)=>s+u[k],0)/active.length;
     const poses=savedCamera?.stages[id]?.frames?.map(f=>[f.file.split('-')[1].replace('.png',''),f.x,f.y,f.scale])??[['overview',st.width/2,st.height/2,sz],...(active.length?[['focus',center('x'),center('y'),Math.max(.30,sz*1.6)]]:[])];
     stage.frames=[];
     for(const [name,x,y,scale] of poses){
       Object.assign(scene,{x,y,scale,manual:true,time:2,editorView:false,skillPreview:false});scene.viewOptions={debugTerrainOutline:false};
       for(let i=0;i<2;i++){scene.render(e,0,'',.6,false,0);await new Promise(v=>setTimeout(v,35));}
       const image=c.toBuffer('image/png'),file=id+'-'+name+'.png';fs.writeFileSync(path.join(folder,file),image);
       stage.frames.push({file,...fact(image),x:scene.x,y:scene.y,scale:scene.scale,W,H});
     }
     stage.imageErrors=srcLog.slice(origin).filter(r=>r.error);
     assert(!stage.imageErrors.length,'one or more native image decode faults');
   }
   stage.status='PASS';
 }catch(e){stage.error=String(e.stack??e);console.error('HOLD',id,stage.error);}
 write();if(global.gc)global.gc();
}
result.requested=Object.fromEntries(fetched);
try {
 for(const [p,m] of fetched){assert.deepEqual(m,fact(trust(p)),'mismatch on loader read '+p);}
}catch(e){result.loaderError=String(e.stack??e);}
if(!result.loaderError&&Object.values(result.stages).every(st=>st.status==='PASS'))result.status='PASS';
write();console.log(result.status,Object.fromEntries(Object.entries(result.stages).map(([k,v])=>[k,v.status])));process.exit(result.status==='PASS'?0:1);process.exit(result.status==='PASS'?0:1);process.exit(result.status==='PASS'?0:1);process.exit(result.status==='PASS'?0:1);process.exit(result.status==='PASS'?0:1);process.exit(result.status==='PASS'?0:1);
process.exit(result.status==='PASS'?0:1);
