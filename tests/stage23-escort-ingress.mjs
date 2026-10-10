/** Real 9800x6200 map and production App/Engine/full-group spawn integration.
 * Supported actor poses, depleted defense resources, and completed prerequisite
 * objectives are SETUP fixtures. This is not normal arrival or a playthrough.
 * All initial enemies remain alive; no live resource/position repair is used. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {battlefield} from '../game/tests/helpers.mjs';
import {escortEntryProfile,ESCORT_ENTRY} from './stage23-escort-entry-helper.mjs';
import {authorStage23LoadingYard,authorYardEncounters} from '../tools/map-forge/stage23-loading-yard.mjs';

const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const stageGeometry=s=>plain({width:s.width,height:s.height,terrains:s.terrains,materials:s.materials,
 units:s.units,events:s.events,markers:s.markers,initialState:s.initialState});
const loadedProject=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
const startGeometry=hash(stageGeometry(loadedProject.stages[22]));
const h=await appHarness(),{g,C}=h,S=g.HonroStage23Escort,A=g.HonroAct3,E=g.HonroEncounters,W=g.HonroAllies;
const profile=escortEntryProfile(g).profile,rows=[],failures=[];
let now=10000;g.performance={now:()=>now};
const originalExecute=W.execute,originalPlace=g.HonroTerrain.place;let traced=null;
W.execute=function(app,action){
 const before=app.engine.b.units.length,result=originalExecute(app,action);
 if(traced?.app===app)traced.calls.push({source:action?.source,result:result!==false,delta:app.engine.b.units.length-before,
  phase:app.engine.b.phase,boundary:app.actorBoundary,serial:app.engine.b.honroState.actorTurnSerial||0});
 return result;
};
g.HonroTerrain.place=function(b,u,options){const result=originalPlace(b,u,options);
 if(traced&&b.honroState===traced.b.honroState)traced.placements.push({id:u.id,x:u.x,y:u.y,
  liveUnits:b.units.length,maxDistance:options?.maxDistance,accepted:!!result,result:result&&plain(result)});
 return result;
};
const actorState=u=>plain({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,move:u.moveLeft,acted:u.acted});
const transaction=b=>plain({units:b.units,nextId:b.nextId,growth:b.honroGrowth,counters:b.honroCounters,
 heroes:b.heroes,entries:S.memory(b).entries,flags:b.honroState.flags});
const enemyResources=q=>q.originalIds.map(id=>actorState(q.e.unit(id)));
const group=(q,source)=>q.b.units.filter(u=>u.honroSpawnSource===source);
const slots=(at,n)=>Array.from({length:n},(_,i)=>at.x+(i-(n-1)/2)*(at.spacing??140));
function fixture({roster='originalBudget22e5'}={}){
 const saved=g.HONRO_PROJECT;
 if(roster!==saved.stages[22].initialState.honroEscortYardRoster){
  const project=plain(saved);authorYardEncounters(g,project,project.stages[22],{roster});g.HONRO_PROJECT=project;
 }
 let app;try{app=h.load({...plain(g.AppRegression.fresh()),...plain(profile)});app.launch(23);h.finish(app);}finally{g.HONRO_PROJECT=saved;}
 now+=2000;const e=app.engine,b=e.b,originalIds=e.alive(1).map(u=>u.id),q={app,e,b,originalIds,calls:[],placements:[],setup:true,writes:0,productionDepth:0};
 assert.equal(b.width,9800);assert.equal(b.height,6200);assert(S.active(b));
 assert.equal(originalIds.length,roster==='candidate28e6'?28:22);assert.equal(b.enemyLimit,3);
 assert.deepEqual(plain(b.honroGrowth.limit),ESCORT_ENTRY.limit);
 for(const u of e.heroesAlive()){assert.equal(u.level,16);assert.equal(b.heroes[u.cls].xp,75748);assert.equal(b.heroes[u.cls].statTraining,6);assert.equal(u.loadout.length,4);}
 // Move only the four existing heroes, during setup, so entry0 can be empty.
 for(const [i,u]of e.heroesAlive().entries())pose(q,u,'sy-ground',9200+i*140);
 const actor=e.active;actor.hp-=100;actor.focus-=100;
 q.production=fn=>{q.productionDepth++;try{return fn();}finally{q.productionDepth--;}};
 q.seal=()=>{assert(q.setup);q.setup=false;for(const u of b.units)for(const key of ['x','y','hp','focus','moveLeft']){
  let value=u[key];Object.defineProperty(u,key,{enumerable:true,configurable:true,get:()=>value,set:next=>{
   assert(q.productionDepth>0,'No external live '+key+' write for '+u.id);value=next;q.writes++;
  }});
 }q.resources=enemyResources(q);q.growth=plain(b.honroGrowth);q.items=plain(b.items);q.geometry=hash({terrain:b.terrain,world:b.honroWorldTerrain});};
 return q;
}
function pose(q,u,support,x){assert(q.setup,'Only setup may set actor coordinates');const t=q.b.terrain.find(t=>t.id===support),y=C.topAt(t,x);
 Object.assign(u,{x,y,vx:0,vy:0,airborne:false,jumping:false});
 assert(C.validTerrainContactPose(q.b.terrain,u),'Clear setup body '+u.id);assert.equal(q.e.contactSurface(x,y-4,y+5)?.t.id,support);
}
function qualify(q,index,{all=false}={}){assert(q.setup);const done=A.memory(q.b).done;
 for(const goal of ['dispatch-bundle','carrier-start','dock-mid'].slice(0,all?3:index+1))done[goal]=true;
 if(!all)for(const source of S.sources.slice(0,index))q.b.honroState.flags['event:'+source]=true;
}
function boundary(q,id,fn){const prior=q.app.actorBoundary;q.app.actorBoundary=id;try{return q.production(fn);}finally{q.app.actorBoundary=prior;}}
function warn(q,source){q.production(()=>A.tick(q.app,0));assert(S.memory(q.b).warnings[source],'Actual prerequisite emits warning '+source);
 assert(q.b.honroState.pendingEvents.includes(source),'Actual event remains pending before a new player action');assert.equal(group(q,source).length,0);
}
function defend(q){assert(q.app.canInput(),'A new real player action is available');const u=q.e.active,before=actorState(u),serial=q.b.honroState.actorTurnSerial||0;
 q.production(()=>q.app.defend());assert.equal(q.b.phase,'review');
 for(let frame=0;q.b.phase==='review'&&frame<360;frame++)q.production(()=>q.e.tick(C.STEP));
 assert.notEqual(q.b.phase,'review','Ordinary review completes');assert(u.acted,'Actual defense ends its actor');
 assert((q.b.honroState.actorTurnSerial||0)>serial);now+=2000;
 const after=actorState(u),delta={hp:after.hp-before.hp,mp:after.focus-before.focus,move:after.move-before.move,x:after.x-before.x,y:after.y-before.y};
 assert.equal(delta.hp,Math.min(u.maxHp-before.hp,Math.round(u.maxHp*.04)));assert.equal(delta.mp,Math.min(u.maxFocus-before.focus,Math.max(u.regen,Math.round(u.maxFocus*.12))));
 assert.equal(delta.move,0);assert.equal(delta.x,0);assert.equal(delta.y,0);
 q.production(()=>h.finish(q.app));now+=2000;return{id:u.id,before,after,delta,serial:q.b.honroState.actorTurnSerial};
}
function unchangedOriginals(q){assert.deepEqual(enemyResources(q),q.resources,'All initial enemies retain identity, HP, MP, position and action resources');
 assert(q.originalIds.every(id=>q.e.unit(id)?.hp>0&&!q.e.unit(id).dead),'No initial enemy is culled');
 assert.deepEqual(plain(q.b.honroGrowth),q.growth,'No spawn or failed reservation awards/loses XP');assert.deepEqual(plain(q.b.items),q.items);
 assert.equal(hash({terrain:q.b.terrain,world:q.b.honroWorldTerrain}),q.geometry,'No substitute terrain or cargo geometry edits');
}
const separated=(a,b)=>Math.abs(a.x-b.x)>=a.r+b.r+18||a.y<=b.y-b.h-18||a.y-a.h>=b.y+18;
function exactGroup(q,source,at){const entry=S.entryFor(q.b,source),action=q.b.honroEvents.find(e=>e.id===source).action,us=group(q,source),xs=slots(at,action.n);
 assert.equal(us.length,action.n,'Whole authored group');assert.equal(S.memory(q.b).entries[source].x,at.x);assert.equal(S.memory(q.b).entries[source].support,at.support);
 for(const [i,u]of us.entries()){
  assert.equal(u.x,xs[i],'No lateral search or opposite-side spawn');assert.equal(u.y,C.topAt(q.b.terrain.find(t=>t.id===at.support),xs[i]));
  assert(C.validTerrainContactPose(q.b.terrain,u),'Exact full body clearance '+u.id);assert.equal(q.e.contactSurface(u.x,u.y-4,u.y+5)?.t.id,at.support);
  assert(q.b.units.every(v=>v===u||v.dead||v.hp<=0||separated(u,v)),'Full body actor clearance '+u.id);
  assert.equal(u.honroEscortYardEntry,entry.side);assert.equal(u.honroEscortYardCell,entry.cell);assert.equal(u.honroEscortYardActivationCell,entry.activationCell);
 }
 return us.map(u=>({id:u.id,x:u.x,y:u.y,support:at.support,side:u.honroEscortYardEntry,hp:u.hp,attack:u.attack,xpWeight:u.honroXpWeight}));
}
async function check(name,fn){try{const row=await fn();rows.push({case:name,passed:true,...row});console.log('PASS',name);}catch(error){failures.push({case:name,error:error.message,stack:error.stack});console.error('FAIL',name,error.message);}finally{traced=null;}}

for(const [index,source]of S.sources.entries())for(const mode of ['main-clear','main-occupied','both-occupied'])await check(source+' '+mode,()=>{
 const q=fixture(),entry=S.entryFor(q.b,source),alternate=entry.alternates[0],action=q.b.honroEvents.find(e=>e.id===source).action,heroes=q.e.heroesAlive();
 qualify(q,index);const mainSlots=slots(entry,action.n),altSlots=slots(alternate,action.n);
 if(mode==='main-occupied')pose(q,heroes[1],entry.support,alternate.x>entry.x?mainSlots[0]:mainSlots.at(-1));
 if(mode==='both-occupied'){pose(q,heroes[1],entry.support,mainSlots.at(-1));pose(q,heroes[2],alternate.support,altSlots.at(-1));}
 q.seal();traced=q;warn(q,source);const warning=plain(S.memory(q.b).warnings[source]);
 assert.equal(warning.opportunity,undefined);const noOpportunity=transaction(q.b);
 assert.equal(boundary(q,heroes[0].id,()=>W.execute(q.app,action)),false,'Manual boundary is not a new player opportunity');
 q.production(()=>E.actorEnd(q.app,q.originalIds[0]));assert(!S.memory(q.b).warnings[source].opportunity,'Enemy action boundary is not a player opportunity');
 assert.deepEqual(transaction(q.b),noOpportunity,'No early group, ID, XP or consumed event');
 const beforeId=q.b.nextId,beforeCount=q.b.units.length,actionResult=defend(q),w=S.memory(q.b).warnings[source];
 assert.equal(w.opportunity.id,actionResult.id);assert(w.opportunity.serial>warning.serial,'Warning preceded the actual completed action');
 let spawned=[];
 if(mode==='both-occupied'){
  assert.equal(group(q,source).length,0);assert(!S.memory(q.b).entries[source]);assert.equal(q.b.nextId,beforeId);assert.equal(q.b.units.length,beforeCount);
  assert(!q.b.honroState.flags['event:'+source]);assert(q.b.honroState.pendingEvents.includes(source),'Blocked event stays pending, never omitted');
  assert(q.placements.some(p=>p.accepted)&&q.placements.some(p=>!p.accepted),'A partially reservable group is atomically rejected');
  const before=transaction(q.b);assert.equal(boundary(q,actionResult.id,()=>W.execute(q.app,action)),false);assert.deepEqual(transaction(q.b),before,'Repeated occupied attempt leaks no actors, IDs or XP');
 }else{
  const expected=mode==='main-clear'?entry:alternate;spawned=exactGroup(q,source,expected);
  assert.equal(q.b.nextId-beforeId,action.n);assert.equal(q.b.units.length-beforeCount,action.n);assert.equal(q.b.honroState.flags['event:'+source],true);
  assert(!q.b.honroState.pendingEvents.includes(source));const before=transaction(q.b);
  assert.notEqual(boundary(q,actionResult.id,()=>W.execute(q.app,action)),false);assert.deepEqual(transaction(q.b),before,'Finite entry cannot duplicate');
 }
 unchangedOriginals(q);return{source,mode,initialEnemies:q.originalIds.length,warning,action:actionResult,
  opportunity:plain(w.opportunity),spawned,placements:q.placements,executeCalls:q.calls,nextIdDelta:q.b.nextId-beforeId,
  deferred:mode==='both-occupied',externalLiveActorWrites:0,scope:'Explicit prerequisite and supported-pose fixture; actual App.defend and whole-group production factory.'};
});

await check('late warning cannot retroactively consume the action already in review',()=>{
 const q=fixture(),source=S.sources[0];qualify(q,0);q.seal();traced=q;const actor=q.e.active;
 q.production(()=>q.app.defend());assert.equal(q.b.phase,'review');q.production(()=>S.prepareWaves(q.app));
 assert(S.memory(q.b).warnings[source]);const serial=S.memory(q.b).warnings[source].serial;
 for(let frame=0;q.b.phase==='review'&&frame<360;frame++)q.production(()=>q.e.tick(C.STEP));
 assert(actor.acted);assert(!S.memory(q.b).warnings[source].opportunity);assert.equal(group(q,source).length,0);
 now+=2000;const action=defend(q);assert(S.memory(q.b).warnings[source].opportunity.serial>serial);const spawned=exactGroup(q,source,S.entryFor(q.b,source));
 unchangedOriginals(q);return{source,reviewActor:actor.id,newAction:action.id,spawned};
});

await check('supported high scout never warns or queues third ingress before dock-mid',()=>{
 const q=fixture();qualify(q,1);q.b.honroState.flags['event:'+S.sources[1]]=true;pose(q,q.e.heroesAlive()[0],'sy-east-upper',8800);q.seal();traced=q;
 q.production(()=>A.tick(q.app,0));assert(!A.memory(q.b).done['dock-mid']);assert(!S.memory(q.b).warnings[S.sources[2]]);
 assert(!(q.b.honroState.pendingEvents||[]).includes(S.sources[2]));const action=defend(q);
 q.production(()=>A.tick(q.app,0));assert(!S.memory(q.b).warnings[S.sources[2]]);assert(!(q.b.honroState.pendingEvents||[]).includes(S.sources[2]));assert.equal(group(q,S.sources[2]).length,0);
 unchangedOriginals(q);return{scout:actorState(q.e.unit(action.id)),dockMidDone:false,thirdWarning:false,thirdQueued:false};
});

for(const [roster,initial,cap]of [['originalBudget22e5',22,30],['candidate28e6',28,36]])await check(roster+' retains all initial enemies plus finite eight at cap'+cap,()=>{
 const q=fixture({roster});qualify(q,0,{all:true});q.seal();traced=q;assert.equal(E.populationCap(q.b),cap);
 const waves=[];for(const source of S.sources){warn(q,source);const before=q.e.alive(1).length,action=defend(q);waves.push({source,action:action.id,spawned:exactGroup(q,source,S.entryFor(q.b,source)),before,after:q.e.alive(1).length});}
 assert.equal(q.e.alive(1).length,initial+8);assert.equal(q.e.alive(1).length,cap);assert.equal(q.b.honroCounters.spawned,8);
 assert.equal(q.b.enemyLimit,3);assert.equal(q.b.honroActiveLimit,3);unchangedOriginals(q);
 return{roster,initial,finite:8,cap,alive:q.e.alive(1).length,activeLimit:3,waves,growthWeight:q.b.honroGrowth.weight,combatBudget:q.b.honroGrowth.limit.combat};
});

await check('same production spawn factory preserves original-map HP attack skills focus and XP weights',async()=>{
 const old=JSON.parse(await readFile('tests/fixtures/stage23-escort-history-stage23.json','utf8')),
  keys=['hp','maxHp','focus','maxFocus','attack','combatBaseHp','combatBaseAttack','loadout','ranks','armor','elite','honroXpWeight','xpBudget','xpGranted','r','h','maxMove'],
  stats=u=>plain(Object.fromEntries(keys.map(k=>[k,u[k]]))),comparisons=[];
 for(const [index,source]of S.sources.entries()){
  const q=fixture();qualify(q,index);q.seal();warn(q,source);defend(q);const current=group(q,source).map(stats),saved={project:g.HONRO_PROJECT,content:g.HONRO_CONTENT.stages[22],balance:g.HONRO_BALANCE.stages[22]};
  let reference;
  try{
   g.HONRO_PROJECT={...saved.project,stages:saved.project.stages.map(s=>s.id==='stage-23'?plain(old.stage):s)};
   g.HONRO_CONTENT.stages[22]=plain(old.content);g.HONRO_BALANCE.stages[22]=plain(old.balance);
   const r=battlefield(g,23,{profile:plain(profile)}),action=r.b.honroEvents.find(ev=>ev.id===source).action;
   assert(!S.active(r.b),'Original map is outside the new ingress wrapper');
   assert.notEqual(W.execute(r.app,action),false,'Original full-group factory succeeds on its original map');
   reference=r.b.units.filter(u=>u.honroSpawnSource===source).map(stats);
  }finally{g.HONRO_PROJECT=saved.project;g.HONRO_CONTENT.stages[22]=saved.content;g.HONRO_BALANCE.stages[22]=saved.balance;}
  assert.equal(current.length,reference.length,'Original/current full group count '+source);
  for(const [i,u]of current.entries())for(const key of keys)assert.deepEqual(plain({value:u[key]}),plain({value:reference[i][key]}),'Original/current factory '+source+' member'+i+' '+key);
  unchangedOriginals(q);comparisons.push({source,fields:keys,units:plain(current)});
 }
 return{comparisons,scope:'Frozen original map data executed by the current production factory; no historical source execution.'};
});

await check('authoring and active-map geometry stay identical through the run',async()=>{
 const generated=await authorStage23LoadingYard(g,loadedProject,{art:false,roster:'originalBudget22e5'}),current=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
 assert.equal(hash(stageGeometry(generated.stages[22])),startGeometry,'Active geometry matches the current no-art authoring source');
 assert.equal(hash(stageGeometry(current.stages[22])),startGeometry,'Geometry changed during the test: rerun against the final source');
 assert.equal(hash(stageGeometry(g.HONRO_PROJECT.stages[22])),startGeometry,'Tests never mutate the loaded production map');
 return{geometrySha256:startGeometry,scope:'Geometry-only consistency. No render, SVG fidelity, art acceptance, or browser claim.'};
});

W.execute=originalExecute;g.HonroTerrain.place=originalPlace;
await mkdir('_local/reports/stage23-escort',{recursive:true});
await writeFile('_local/reports/stage23-escort/ingress.json',JSON.stringify({passed:failures.length===0,completedAt:new Date().toISOString(),
 geometrySha256:startGeometry,entry:ESCORT_ENTRY,rows,failures,
 scope:'Actual fresh Stage23 map, App defense/review/actor boundary, production whole-group spawn. Existing enemy roster retained. Actor coordinates/resources and objective prerequisites are explicit setup fixtures only.',
 limits:['Not normal arrival, combat victory, complete playthrough, native render, browser or Pages verification.','Candidate28e6 is an isolated comparison and is never saved into production.','No runtime, entry helper, map, assets, existing tests or documentation are modified.']},null,2)+'\n');
assert.equal(failures.length,0,JSON.stringify(failures.map(({case:name,error})=>({case:name,error})),null,2));
console.log('PASS Stage23 real-map ingress',rows.length,'checks; report _local/reports/stage23-escort/ingress.json');
