import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {battlefield} from '../game/tests/helpers.mjs';
import {ferryRuntime,fixture,qualify,boundary,defend,resume,plain,geometry} from './stage30-ferry-helpers.mjs';
const g=await ferryRuntime(),S=g.HonroStage30Ferry,A=g.HonroAct3,E=g.HonroEncounters,W=g.HonroAllies,checks=[];
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
const old=JSON.parse(await readFile('tests/fixtures/stage30-ferry/before-stage30.json','utf8'));
const manual=(q,fn)=>{q.app.actorBoundary=q.e.active.id;q.b.honroState.actorTurnSerial=(q.b.honroState.actorTurnSerial||0)+1;try{return fn();}finally{q.app.actorBoundary=null;}};
function waiting(){const q=fixture(g);qualify(g,q);S.transition(q.app);defend(g,q);assert.equal(S.memory(q.b).status,'waiting');A.memory(q.b).holds['ferry-hold'].progress=2;return q;}
check('three original goals, hold3/hound3/540/230 and all living companions440 remain exact',()=>{
 const q=fixture(g);assert.deepEqual(plain(A.steps(q.b)),old.stage.initialState.honroAct3Steps);assert.equal(q.b.enemyLimit,3);assert.equal(q.b.honroActiveLimit,3);assert.equal(g.HONRO_CONTENT.nextAct.available,false);
 assert.equal(q.b.honroEvents.filter(ev=>ev.id==='act3-ferry-hold').length,0);assert.equal(q.b.honroEvents.filter(ev=>S.sources.includes(ev.id)).reduce((n,e)=>n+e.action.n,0),7);
});
check('reading a fresh objective HUD never creates ferry progress',()=>{const q=battlefield(g,30),before=JSON.stringify(q.b);A.state(q.b);assert.equal(JSON.stringify(q.b),before);});
check('opt-in is exact and preserves old30 cap30, pre-response cap23 and other stage caps',()=>{
 const q=fixture(g),b=q.b;assert(S.active(b));assert.equal(E.populationCap(b),36);b.honroFerryPopulationCap=30;assert.equal(E.populationCap(b),30);
 delete b.honroFerryRevision;assert(!S.active(b));assert.equal(E.populationCap(b),30);delete b.honroAct3ResponseRevision;assert.equal(E.populationCap(b),23);
 for(const [key,value]of [['honroStage',29],['honroCustom',true],['honroFerryRevision',2]]){const t=plain(fixture(g).b);t[key]=value;assert(!S.active(t));}
});
// Compare the new exported cap hook with the unchanged base implementation,
// including its own legacy response and population accounting.
const reference={...g};vm.runInNewContext(await readFile('shared/runtime/encounters.js','utf8'),reference);const originalCap=reference.HonroEncounters.populationCap;
vm.runInNewContext(await readFile('shared/runtime/allies.js','utf8'),reference);const originalExecute=reference.HonroAllies.execute;
check('ordinary stages and historical18 keep their original population accounting',()=>{
 for(const id of [1,3,4,7,10,11,17,18,19,21,25,29,30]){const b=battlefield(g,id).b;delete b.honroBellRevision;delete b.honroFerryRevision;assert.equal(E.populationCap(b),originalCap(b),'Stage '+id);}
 const b=battlefield(g,18).b;assert.equal(E.populationCap(b),Math.max(originalCap(b),b.honroBellPopulationCap||53));
});
check('enemy, summon, enthralled and serial-only boundaries never satisfy the player opportunity',()=>{
 const q=fixture(g);qualify(g,q,2);S.transition(q.app);const u=q.e.alive(1)[0],summon={...plain(q.e.active),id:'ferry-summon',summoned:true},charmed={...plain(q.e.active),id:'ferry-charmed',enthrall:true};q.b.units.push(summon,charmed);
 for(const actor of [u,summon,charmed,q.e.active]){boundary(g,q,actor.id);assert.equal(S.memory(q.b).status,'warned');assert.equal(S.memory(q.b).playerOpportunity,null);}
 const id=defend(g,q);assert.equal(S.memory(q.b).playerOpportunity.id,id);assert.equal(S.memory(q.b).status,'settling');
});
check('an action already in review when warned cannot count as the new player choice',()=>{const q=fixture(g);q.e.wait();assert.equal(q.b.phase,'review');qualify(g,q,2);S.transition(q.app);for(let i=0;i<180&&q.b.phase==='review';i++)q.e.tick(g.HONRO_CORE.STEP);assert.equal(S.memory(q.b).status,'warned');assert.equal(S.memory(q.b).playerOpportunity,null);defend(g,q);assert.equal(S.memory(q.b).status,'settling');});
check('progress1 warns; one real defend opens an opportunity but progress2 is still required',()=>{
 const q=waiting(),version=q.b.sceneVersion;assert.equal(S.memory(q.b).commitCount,0);manual(q,()=>S.transition(q.app));assert.equal(q.b.sceneVersion,version+1,'Starting the live pose invalidates the moored static cache');assert.equal(S.memory(q.b).status,'settling');assert.equal(q.e.canAct(),false);
 const before=geometry(q.b),actors=plain(q.b.units),round=q.b.round,side=q.b.side,phase=q.b.phase; q.e.tick(.32);assert.deepEqual(geometry(q.b),before);assert.deepEqual(plain(q.b.units),actors);assert.equal(S.memory(q.b).elapsed,.32);
 q.e.tick(.48);assert.equal(q.b.sceneVersion,version+2,'Only the atomic final pose commits the second cache version');assert.equal(S.memory(q.b).status,'settled');assert.equal(S.memory(q.b).commitCount,1);assert.deepEqual(plain(q.b.units),actors);assert.deepEqual([q.b.round,q.b.side,q.b.phase],[round,side,phase]);
 for(const list of [q.b.terrain,q.b.honroWorldTerrain]){assert.equal(list.find(t=>t.id==='ferry-test-final').broken,false);assert.equal(list.find(t=>t.id==='ferry-test-screen').broken,true);}
 const once=geometry(q.b);for(let i=0;i<3;i++)manual(q,()=>S.transition(q.app));assert.deepEqual(geometry(q.b),once);assert.equal(S.memory(q.b).commitCount,1);
});
check('live actors, summons, protected actors, stakes, projectiles, fields and delayed zones block geometry',()=>{
 for(const kind of ['hero','enemy','summon','resident','stake','projectile','field','zone','attached-zone','disappearing-support']){
  const q=waiting(),m=S.memory(q.b);let blocker;
  if(['hero','enemy','summon','resident','disappearing-support'].includes(kind)){blocker=kind==='enemy'?q.e.alive(1)[0]:{...plain(q.e.heroesAlive()[2]),id:'safety-'+kind,summoned:kind==='summon',side:kind==='resident'?2:0,honroProtected:kind==='resident'};if(kind!=='enemy')q.b.units.push(blocker);Object.assign(blocker,{x:kind==='disappearing-support'?4150:3450,y:500});}
  else if(kind==='stake'){blocker={id:91,x:3450,y:500,active:true,expires:q.b.round+2};(q.b.stakes??=[]).push(blocker);}
  else if(kind==='projectile'){blocker={id:92,x:3450,y:500,radius:8};q.b.projectiles.push(blocker);}
  else if(kind==='field'){blocker={id:'ferry-field',kind:'gravity',x:3450,y:500,radius:50,strength:10};q.b.fields.push(blocker);}
  else{blocker={id:93,kind:'delay',x:3450,y:500,radius:50,expires:q.b.round+2};if(kind==='attached-zone'){const u=q.e.heroesAlive()[0];blocker.x=0;blocker.y=0;blocker.attached=u.id;Object.assign(u,{x:3450,y:550});}q.b.zones.push(blocker);}
  const before=geometry(q.b),body=plain(blocker);manual(q,()=>S.transition(q.app));assert.equal(m.status,'waiting',kind);assert.equal(m.commitCount,0,kind);assert(S.occupants(q.b).length,kind);assert.deepEqual(geometry(q.b),before);assert.deepEqual(plain(blocker),body,kind+' is neither moved nor damaged');
 }
});
check('actual polygons avoid empty bounding corners; expired/inactive effects do not block',()=>{
 const q=waiting();q.b.honroFerrySpec.sweepPolygons=[[[100,100],[300,100],[100,300]]];assert.equal(S.swept(q.b,{x:250,y:250,w:10,h:10}),false);assert.equal(S.swept(q.b,{x:150,y:150,w:10,h:10}),true);
 q.b.fields.push({id:'corner',x:265,y:265,radius:10,strength:1});assert(!S.occupants(q.b).some(x=>x.id==='corner'));
 q.b.stakes=[{id:95,x:3450,y:500,active:false},{id:96,x:3450,y:500,expires:q.b.round-1}];q.b.zones.push({id:97,x:3450,y:500,radius:80,expires:q.b.round-1});assert(!S.occupants(q.b).some(x=>[95,96,97].includes(x.id)));
});
check('flight/review/summon/volley/melee/follow/physics/modal/dialogue/charging all defer safely',()=>{
 for(const kind of ['flight','review','summon','ally','volley','melee','follow','physics','modal','dialogue','charging','turn-notice']){const q=waiting(),before=geometry(q.b);
  if(['flight','review','summon','ally'].includes(kind))q.b.phase=kind;if(kind==='volley')q.b.volley={remaining:1};if(kind==='melee')q.e.active.meleeAction={};if(kind==='follow')q.e.active.meleeFollow='ready';if(kind==='physics')q.e.settleBusy=()=>true;
  if(kind==='modal')q.app.modal={classList:{contains:()=>true}};if(kind==='dialogue')q.app.dialogue={};if(kind==='charging')q.app.charging=true;if(kind==='turn-notice'){g.HonroStory??={};const saved=g.HonroStory.turnPaused;g.HonroStory.turnPaused=()=>true;try{manual(q,()=>S.transition(q.app));}finally{g.HonroStory.turnPaused=saved;}assert.equal(S.memory(q.b).status,'waiting');continue;}
  manual(q,()=>S.transition(q.app));assert.equal(S.memory(q.b).status,'waiting',kind);assert.deepEqual(geometry(q.b),before,kind);
 }
});
check('new interruptions during animation return to waiting without moving actors or committing',()=>{
 const q=waiting();manual(q,()=>S.transition(q.app));q.e.tick(.2);const before=geometry(q.b),version=q.b.sceneVersion;q.b.projectiles.push({id:1,x:10,y:10,radius:3});q.e.tick(.7);assert.equal(q.b.sceneVersion,version+1,'Returning to moored waiting invalidates the live-pose cache');assert.equal(S.memory(q.b).status,'waiting');assert.equal(S.memory(q.b).commitCount,0);assert.deepEqual(geometry(q.b),before);assert.equal(q.b.projectiles.length,1);assert.equal(S.skip(q.app),false);
});
check('one authored wave waits in full, uses only its same-side alternate and commits once',()=>{
 const q=fixture(g),source=S.sources[0];qualify(g,q);S.prepareWaves(q.app);const action={...q.b.honroEvents.find(e=>e.id===source).action},entry=S.entryFor(q.b,source),spacing=action.spacing||145;
 q.app.actorBoundary=q.e.active.id;assert.equal(W.execute(q.app,action),false,'Same serial cannot spawn');q.app.actorBoundary=null;
 const main={...plain(q.e.active),id:'occupied-main',x:entry.x+spacing/2,y:600},alternate={...plain(q.e.active),id:'occupied-alternate',x:entry.alternates[0].x+spacing/2,y:600};q.b.units.push(main,alternate);const before=plain({units:q.b.units,nextId:q.b.nextId,counters:q.b.honroCounters});
 assert.equal(manual(q,()=>W.execute(q.app,action)),false);assert.deepEqual(plain({units:q.b.units,nextId:q.b.nextId,counters:q.b.honroCounters}),before,'No partial spawn or ID consumption');
 alternate.x+=600;assert.notEqual(manual(q,()=>W.execute(q.app,action)),false);assert.equal(S.memory(q.b).entries[source].x,entry.alternates[0].x);assert.equal(q.b.units.filter(u=>u.honroSpawnSource===source).length,2);
 const once=plain(q.b.units);manual(q,()=>W.execute(q.app,action));assert.deepEqual(plain(q.b.units),once);
});
check('the original enemy factory keeps every spawned HP, attack, skill, focus and XP value',()=>{
 for(const source of S.sources){const q=fixture(g);qualify(g,q);const action=source==='act3-ferry-hold'?{type:'spawn',source,kind:'hound',n:3,spacing:145}:q.b.honroEvents.find(e=>e.id===source).action;S.memory(q.b).warnings[source]={serial:0,round:q.b.round};const at=S.entryFor(q.b,source),b=plain(q.b),e=new g.HONRO_CORE.Engine(b,()=>{},false),app={...q.app,engine:e};
  const oldIds=new Set(b.units.map(u=>u.id));assert.notEqual(originalExecute(app,{...action,x:at.x,y:at.y,support:at.support,spacing:action.spacing??145,maxDistance:0}),false);assert.notEqual(manual(q,()=>W.execute(q.app,action)),false);
  const actual=q.b.units.filter(u=>!oldIds.has(u.id)).map(u=>{const v=plain(u);delete v.honroFerryEntry;return v;});assert.deepEqual(plain(actual),plain(b.units.filter(u=>!oldIds.has(u.id))),source);assert.deepEqual(plain(q.b.honroGrowth),plain(b.honroGrowth));
 }
});
check('wrong-side alternates and missing support cannot become fallback spawn locations',()=>{
 const q=fixture(g),source=S.sources[0];qualify(g,q);S.prepareWaves(q.app);const entry=S.entryFor(q.b,source),action=q.b.honroEvents.find(e=>e.id===source).action;
 entry.support='missing';entry.alternates[0].side='east';const n=q.b.units.length;assert.equal(manual(q,()=>W.execute(q.app,action)),false);assert.equal(q.b.units.length,n);
});
check('actual Encounters actor-boundary path admits all26+10, one group per boundary, cap36 and action3',()=>{
 const q=fixture(g),a=A.memory(q.b);assert.equal(q.e.alive(1).length,26);for(const [i,source]of S.sources.entries()){
  const x=700+i*2000,id='capacity-entry-'+i,t={...g.HonroMapEngine.solid(id,[[x-450,900],[x+450,900],[x+450,1100],[x-450,1100]]),indestructible:true};q.b.terrain.push(t);q.b.honroWorldTerrain.push(plain(t));q.b.honroFerrySpec.entries[source]={x,y:900,support:id,side:'authored-'+i,alternates:[]};
 }
 a.done['transport-map']=true;const m=A.marker(q.b,'ferry-hold');Object.assign(q.e.active,{x:m.x,y:m.y});let previous=26;
 for(let i=0;i<5;i++){boundary(g,q);const n=q.e.alive(1).length;assert(n-previous<=3,'One group per boundary');previous=n;}
 assert.equal(a.holds['ferry-hold'].spawned,3);assert.equal(q.e.alive(1).length,34);a.holds['ferry-hold'].progress=3;
 for(let i=0;i<4;i++)boundary(g,q);
 assert.equal(q.e.alive(1).length,36);assert.equal(E.populationCap(q.b),36);assert.equal(q.b.enemyLimit,3);q.e.refreshActivation();assert(q.b.queue.length<=3);
 for(const [source,n]of [[S.sources[0],2],[S.sources[1],3],[S.sources[2],3],[S.sources[3],2]]){assert.equal(q.b.units.filter(u=>u.honroSpawnSource===source).length,n,source);assert.equal(S.memory(q.b).entries[source].count,n);}
 assert.equal(q.b.honroEvents.filter(e=>e.id==='act3-ferry-hold').length,0);assert.equal(new Set(Object.values(S.memory(q.b).entries).map(v=>v.serial)).size,4);
 const stable=plain({units:q.b.units,nextId:q.b.nextId,growth:q.b.honroGrowth,entries:S.memory(q.b).entries});for(let i=0;i<5;i++)boundary(g,q);assert.deepEqual(plain({units:q.b.units,nextId:q.b.nextId,growth:q.b.honroGrowth,entries:S.memory(q.b).entries}),stable);
});
check('warning, waiting, and mid-settling engine snapshots resume unchanged and settle exactly once',()=>{
 for(const status of ['warned','waiting','settling']){let q=fixture(g);qualify(g,q);S.transition(q.app);if(status!=='warned')defend(g,q);if(status==='settling'){A.memory(q.b).holds['ferry-hold'].progress=2;manual(q,()=>S.transition(q.app));q.e.tick(.32);}assert.equal(S.memory(q.b).status,status);
  const before=plain({geography:geometry(q.b),ferry:S.memory(q.b),units:q.b.units,goals:A.memory(q.b)});q=resume(g,q);assert.deepEqual(plain({geography:geometry(q.b),ferry:S.memory(q.b),units:q.b.units,goals:A.memory(q.b)}),before);
  if(status!=='settling'){A.memory(q.b).holds['ferry-hold'].progress=2;if(status==='warned')defend(g,q);else manual(q,()=>S.transition(q.app));}q.e.tick(1);assert.equal(S.memory(q.b).commitCount,1);const once=geometry(q.b);q=resume(g,q);manual(q,()=>S.transition(q.app));assert.equal(S.memory(q.b).commitCount,1);assert.deepEqual(geometry(q.b),once);
 }
});
check('Skip respects waiting safety, shortens only a clear animation, and is idempotent',()=>{
 const q=waiting();q.b.stakes=[{id:99,x:3450,y:500,active:true}];manual(q,()=>S.transition(q.app));const before=geometry(q.b);assert.equal(S.skip(q.app),false);assert.deepEqual(geometry(q.b),before);q.b.stakes=[];manual(q,()=>S.transition(q.app));assert.equal(S.skip(q.app),true);assert.equal(S.skip(q.app),false);assert.equal(S.memory(q.b).commitCount,1);
});
check('victory cancels pending settling and waves without a new goal, damage or hidden spawn',()=>{
 const q=waiting();manual(q,()=>S.transition(q.app));q.e.tick(.2);const before=geometry(q.b),actors=plain(q.b.units);q.b.phase='won';q.b.honroState.pendingEvents=[...S.sources];S.cleanup(q.app);assert.equal(S.memory(q.b).status,'cancelled');assert.equal(S.memory(q.b).commitCount,0);assert.deepEqual(q.b.honroState.pendingEvents,[]);assert.deepEqual(geometry(q.b),before);assert.deepEqual(plain(q.b.units),actors);assert.equal(manual(q,()=>W.execute(q.app,q.b.honroEvents.find(e=>e.id===S.sources[0]).action)),false);
});
await mkdir('_local/reports/stage30-ferry',{recursive:true});await writeFile('_local/reports/stage30-ferry/runtime.json',JSON.stringify({checks,scope:'Production Engine/Act3/Encounters with explicit state, position and isolated support fixtures. No normal fullplay, traversal, browser or art claim.'},null,2)+'\n');
