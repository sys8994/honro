/** State fixtures for parallel goals / safe descent only.
 * This is not normal-input route or combat evidence. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,A=g.HonroAct2,S=g.HonroStage18Bell,plain=x=>JSON.parse(JSON.stringify(x)),checks=[];
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
const original=JSON.parse(await readFile('tests/fixtures/stage18-bell-before.json','utf8')).stages[0];
function fixture(){const q=battlefield(g,18);q.b.honroBellRevision=1;q.b.honroAct2Steps=plain(S.steps);q.b.honroBellDescent={distance:200,terrainIds:['runtime-moving-mass'],elementIds:['runtime-bell-art'],sweep:[{x:9000,y:1500,w:120,h:500}],safeZones:[{x:8100,y:7200,w:1200,h:180}],resting:{x:7200,y:7300},entries:{hold:[{side:'west',x:2000,y:6160}],keeper:[{side:'east',x:9700,y:6150}]}};
 q.b.terrain.push({id:'runtime-moving-mass',x:9000,y:1500,w:120,h:300,vertices:[{x:9000,y:1500},{x:9120,y:1500},{x:9120,y:1800},{x:9000,y:1800}],indestructible:true});q.b.honroWorldTerrain??=[];q.b.honroWorldTerrain.push(plain(q.b.terrain.at(-1)));q.b.honroEnvironment.placements.push({id:'runtime-bell-art',x:9000,y:1800});
 g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);A.attach(q.app,q.e);
 q.e.settleBusy=()=>false;return q;
}
function qualify(q,{hold=true,anchor=true}={}){const a=A.memory(q.b);a.done['clear-wards']=a.done.silence=true;a.silenced=true;a.holds={'hold-silence':{progress:hold?4:0,spawned:8,lastRound:q.b.round,guarded:true,continuous:true}};q.b.terrain.find(t=>t.id==='upper-chain').broken=anchor;}
function boundary(q,id){q.app.actorBoundary=id;q.b.honroState.actorTurnSerial=(q.b.honroState.actorTurnSerial||0)+1;S.transition(q.app);q.app.actorBoundary=null;}
function allOpportunities(q){for(const u of q.e.heroesAlive().filter(u=>!u.summoned&&!u.enthrall))boundary(q,u.id);}
function resume(q){const b=plain(q.b),e=new C.Engine(b,()=>{},true),app={...q.app,engine:e};g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);A.attach(app,e);e.settleBusy=()=>false;return{...q,b,e,app};}
check('fresh steps remove lower E and fixture class; old snapshot remains ordered',()=>{
 assert.deepEqual(plain(S.steps.map(s=>s.id)),['clear-wards','silence','hold-silence','upper-chain','bell-descent','leak','keeper','clear-bell']);assert(!S.steps.find(s=>s.id==='upper-chain').requiredClass);assert.equal(S.steps.find(s=>s.id==='hold-silence').parallelGroup,'bell-stabilize');
 const old=g.HonroMaps.createBattle(original,{...g.HONRO_PROJECT,stages:[original]},C.defaults(),{origin:'campaign'});assert(!S.active(old));assert.deepEqual(plain(A.steps(old)),original.initialState.honroAct2Steps);assert.equal(g.HonroObjectiveRevision.contentFor(old,g.HONRO_CONTENT.stages[17]).guide,S.legacy.guide);
});
check('anchor-first and hold-first both require the second condition',()=>{
 for(const anchorFirst of [true,false]){const q=fixture();qualify(q,{hold:!anchorFirst,anchor:anchorFirst});S.transition(q.app);assert.equal(S.memory(q.b).status,'suspended');qualify(q);S.transition(q.app);assert.equal(S.memory(q.b).status,'warning');assert.equal(S.memory(q.b).count,0);assert(!A.satisfied(q.b,{kind:'bell-descent',id:'bell-descent'}));}
});
check('all four surviving companions receive a later normal action opportunity',()=>{
 const q=fixture();qualify(q);S.transition(q.app);const ids=q.e.heroesAlive().map(u=>u.id);for(const id of ids.slice(0,-1)){boundary(q,id);assert.equal(S.memory(q.b).status,'warning');}boundary(q,ids.at(-1));assert.equal(S.memory(q.b).status,'lowering');assert(!q.e.canAct());
 q.e.tick(.45);assert(S.memory(q.b).offset>0&&S.memory(q.b).offset<200);assert.equal(S.memory(q.b).count,0);q.e.tick(.45);assert.equal(S.memory(q.b).status,'settled');assert.equal(S.memory(q.b).offset,200);assert.equal(S.memory(q.b).count,1);assert(A.satisfied(q.b,{kind:'bell-descent',id:'bell-descent'}));
 assert.equal(q.b.terrain.at(-1).y,1700);assert.equal(q.b.honroWorldTerrain.at(-1).y,1700);assert.equal(q.b.honroEnvironment.placements.at(-1).y,2000);for(let i=0;i<6;i++)boundary(q,ids[0]);assert.equal(q.b.terrain.at(-1).y,1700);
});
check('unit, enemy, summoned spirit and stake occupancy wait with input open',()=>{
 for(const kind of ['hero','enemy','summon','stake']){const q=fixture();qualify(q);const place={x:9060,y:1700};let blocker;
  if(kind==='stake'){blocker={id:997,skill:'M09',...place,active:true,expires:10};(q.b.stakes??=[]).push(blocker);}else{blocker=kind==='hero'?q.e.heroesAlive()[1]:kind==='enemy'?q.e.alive(1)[0]:{...plain(q.e.heroesAlive()[1]),id:'fixture-summon',summoned:true};Object.assign(blocker,place);if(kind==='summon')q.b.units.push(blocker);}
  S.transition(q.app);allOpportunities(q);assert.equal(S.memory(q.b).status,'waiting',kind);assert(S.memory(q.b).reason.includes('하강 대기'));assert.equal(S.memory(q.b).offset,0);assert.equal(q.e.canAct(),true,kind+' normal input');assert.equal(blocker.x,place.x);assert.equal(blocker.y,place.y);
  blocker.x=10000;boundary(q,q.e.active.id);assert.equal(S.memory(q.b).status,'lowering');
 }
});
check('projectiles, volley, melee, summon and unstable physics cannot be interrupted',()=>{
 for(const kind of ['projectile','volley','melee','summon','physics','dialogue']){const q=fixture();qualify(q);S.transition(q.app);
  if(kind==='projectile')q.b.projectiles.push({id:998,x:500,y:500,radius:5});if(kind==='volley')q.b.volley={remaining:1};if(kind==='melee')q.e.active.meleeAction={};if(kind==='summon')q.b.summonTurn={};if(kind==='physics')q.e.settleBusy=()=>true;if(kind==='dialogue')q.app.dialogue={};
  allOpportunities(q);assert.equal(S.memory(q.b).status,'waiting',kind);assert.equal(S.memory(q.b).offset,0);
 }
});
check('warning, occupied wait and mid-descent save resume once with exact displacement',()=>{
 for(const status of ['warning','waiting','lowering']){let q=fixture();qualify(q);S.transition(q.app);if(status!=='warning'){if(status==='waiting')(q.b.stakes??=[]).push({id:71,skill:'M09',x:9060,y:1700,active:true,expires:10});allOpportunities(q);}if(status==='lowering')q.e.tick(.32);assert.equal(S.memory(q.b).status,status);
  const before=plain({terrain:q.b.terrain,world:q.b.honroWorldTerrain,state:q.b.honroState.bellDescent,placements:q.b.honroEnvironment.placements,heroes:q.e.heroesAlive()});q=resume(q);assert.deepEqual(plain({terrain:q.b.terrain,world:q.b.honroWorldTerrain,state:q.b.honroState.bellDescent,placements:q.b.honroEnvironment.placements,heroes:q.e.heroesAlive()}),before);
  q.b.stakes=[];allOpportunities(q);q.e.tick(1);assert.equal(S.memory(q.b).count,1);assert.equal(S.memory(q.b).offset,200);assert.equal(q.b.terrain.at(-1).y,1700);
 }
});
check('early HP1 subdued keeper survives lowering without resurrection or reset',()=>{
 const q=fixture(),boss=q.e.unit('act2-keeper');Object.assign(boss,{hp:1,dead:false,honroSubdued:true,side:2,fixed:true,x:10000,y:6200});qualify(q);S.transition(q.app);allOpportunities(q);q.e.tick(1);assert.equal(boss.hp,1);assert(!boss.dead);assert(boss.honroSubdued);assert.equal(boss.side,2);assert(boss.fixed);
});
check('hostile keeper actually falls through Engine physics, reaches HP1 and completes defeat without dying',()=>{
 let q=fixture();const boss=q.e.unit('act2-keeper');A.memory(q.b).done.leak=true;
 // State fixture starts the hostile actor falling outside the play bounds.
 // Damage is a real hurt call; physics invokes recover without a test call.
 q.e.hurt(boss,boss.hp-Math.ceil(boss.maxHp*.1),q.e.active.id);assert(boss.hp>1);assert(!boss.honroSubdued);assert.equal(boss.side,1);
 Object.assign(boss,{x:q.b.width-150,y:q.b.height+350,vx:0,vy:420,airborne:false,jumping:false,fixed:false});const hp=boss.hp;let recoverCalls=0;const recover=q.e.recover.bind(q.e);q.e.recover=u=>{recoverCalls++;return recover(u);};
 for(let i=0;i<120&&!boss.honroSubdued;i++)q.e.tick(C.STEP);
 assert.equal(recoverCalls,1);assert(hp>boss.hp);assert.equal(boss.hp,1);assert(!boss.dead);assert(boss.honroSubdued);assert.equal(boss.side,2);assert(boss.fixed);assert(A.satisfied(q.b,{id:'keeper',kind:'defeat',target:boss.id}));assert(!q.b.queue.includes(boss.id));
 const before=plain(boss);q=resume(q);assert.deepEqual(plain(q.e.unit(boss.id)),before);assert(A.satisfied(q.b,{id:'keeper',kind:'defeat',target:boss.id}));
});
await mkdir('_local/reports/stage18-bell',{recursive:true});await writeFile('_local/reports/stage18-bell/runtime-contracts.json',JSON.stringify({checks,scope:'Synthetic transition state fixtures; no route, art, normal combat or browser claim.'},null,2));
