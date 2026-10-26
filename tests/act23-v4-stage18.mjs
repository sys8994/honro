/** Focused candidate model/physics fixtures. No browser, normal combat or
 * complete-route claim; explicit placements qualify isolated transitions. */
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';

const g=await runtime({legacyMaps:false}),V=g.HonroAct23V4,S=g.HonroAct23V4Stage18,C=g.HONRO_CORE;
assert(V&&S,'The candidate framework and Stage18 module must be in runtimeParts');
const plain=x=>JSON.parse(JSON.stringify(x)),original=plain(g.HONRO_PROJECT),baseline=battlefield(g,18);
assert.equal(V.active(baseline.b),false);assert.equal(baseline.e.unit('act2-keeper').honroNonlethal,true);
g.HONRO_PROJECT=V.author(g.HONRO_PROJECT,{enabled:true});
const map=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===18),checks=[];
function check(name,fn){fn();checks.push(name);console.log('PASS',name);}
function fixture(saved){const q=battlefield(g,18);if(!q.b.honroState.act23v4?.stage18)V.prepare(q.b,q.p);if(saved){q.b=plain(saved);q.e=new C.Engine(q.b,()=>{},true);q.app.engine=q.e;}
 g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);q.e.settleBusy=()=>false;return q;}
function actor(q,id=q.e.heroesAlive()[0].id){const u=q.e.unit(id);q.b.active=id;q.b.side=0;q.b.phase='aim';u.acted=false;return u;}
function place(q,u,x,support='sb-suppression-court'){Object.assign(u,{x,y:g.HonroMapEngine.surfaceY(q.b.terrain,x,undefined,support).y,vx:0,vy:0,airborne:false,jumping:false});}
function site(q,id){return q.b.honroMarkers.find(m=>m.id===id);}
// A real reviewed finishAction enters the same production actorEnd boundary.
function finish(q,id){actor(q,id);S.tick(q.app,0);q.e.finishAction(true);}
function warningActions(q){const ids=S.memory(q.b).bell.segment.heroes;for(const id of ids)finish(q,id);}
function qualify(q){const m=S.memory(q.b);m.rescued=m.rescueSafe=m.hoistStarted=m.hoistProtected=true;const t=g.HonroQuestTargets.records(q.b).find(t=>t.id==='upper-chain');t.broken=true;g.HonroQuestTargets.sync(q.b,t);V.mem(q.b).silenced=true;return m;}
function kill(q,method='hurt'){const boss=q.e.unit('act2-keeper');if(method==='fall'){boss.hp=1;Object.assign(boss,{x:q.b.width-150,y:q.b.height+350,fixed:false,vx:0,vy:420});q.e.recover(boss);}else q.e.hurt(boss,999999,q.e.active.id,false,undefined,undefined,method==='soul'?'soul':'normal');S.cleanupDeath(q.app);return boss;}
function movingFixture(){const q=fixture();qualify(q);S.begin(q.app,'lift',q.b.honroV4Stage18.liftOffset);warningActions(q);return q;}

check('opt-in author retains dimensions, existing enemy roster and immutable source',()=>{
 assert.equal(map.width,13600);assert.equal(map.height,9600);
 const old=original.stages.find(s=>s.metadata.stageId===18);assert.deepEqual(plain(map.units.filter(u=>u.team==='enemy')),old.units.filter(u=>u.team==='enemy'));
 assert.equal(map.units.filter(u=>u.id==='18.survivor').length,1);assert.equal(map.units.filter(u=>u.id==='18.hoist-device').length,1);
 assert.deepEqual(plain(V.author(g.HONRO_PROJECT,{enabled:true})),plain(g.HONRO_PROJECT));
 assert(!old.units.some(u=>u.id==='18.survivor'));assert.equal(map.initialState.honroBellAnomalyRevision,undefined);
 assert(map.initialState.honroV4Steps.every(s=>s.label===s.id));assert.equal(map.events.length,1);assert.equal(map.events[0].id,'18.rescue-response');assert.equal(map.events[0].action.actions.length,3);
});
check('factory tuning preserves880 keeper HP and fresh candidate is lethal only',()=>{
 const q=fixture(),boss=q.e.unit('act2-keeper');assert.equal(boss.hp,880);assert.equal(boss.honroNonlethal,undefined);assert.equal(q.b.honroBellAnomalyRevision,undefined);assert.equal(q.b.honroBellWitness,undefined);
 assert.equal(baseline.e.unit('act2-keeper').honroNonlethal,true);assert.equal(S.complete(q.b),false);
 assert(q.e.unit('18.survivor').honroAlly);assert(q.e.unit('18.hoist-device').honroAlly);assert.equal(q.e.unit('18.hoist-device').allyRole,'channeler');
});
check('rescue requires release then actual supported movement, spending finite movement',()=>{
 const q=fixture(),npc=q.e.unit('18.survivor'),u=actor(q);place(q,u,3050);const start=plain(npc);for(let i=0;i<10;i++)S.tick(q.app,.05);assert.equal(npc.x,start.x);
 assert.equal(V.use(q.app,site(q,'18.rescue')),true);assert.equal(npc.x,start.x);assert.equal(S.memory(q.b).rescueSafe,false);assert.equal(npc.honroHypnotized,false);
 // Explicit fixture leader placement; all survivor movement below is e.walk.
 for(const h of q.e.heroesAlive())place(q,h,2770);actor(q);q.app.dialogue={};for(let i=0;i<20;i++)S.tick(q.app,.05);assert.equal(npc.x,start.x);q.app.dialogue=null;
 const budget=npc.moveLeft;for(let i=0;i<500&&!S.memory(q.b).rescueSafe;i++)S.tick(q.app,C.STEP);
 assert(S.memory(q.b).rescueSafe);assert(S.memory(q.b).rescueDistance>=120);assert(npc.x<start.x-120);assert(npc.moveLeft<budget);assert(C.validTerrainContactPose(q.b.terrain,npc));assert(q.e.grounded(npc));assert(npc.fixed);
});
check('protection requires real nearby hero action boundaries and a clear hoist area',()=>{
 const q=fixture(),m=qualify(q),h=q.e.heroesAlive()[0],device=q.e.unit('18.hoist-device');m.hoistProtected=false;m.hoistStarted=false;
 for(const id of ['18.rescue','18.rescue-safe','18.chain'])V.mem(q.b).done[id]=true;place(q,h,device.x,'act2-floor');actor(q,h.id);
 assert.equal(V.use(q.app,site(q,'18.hoist')),true);q.e.finishAction(true);assert.equal(Object.keys(m.protection).length,1);assert.equal(m.hoistProtected,false);
 const foe=q.e.alive(1).find(u=>!u.honroObjectiveTarget&&u.id!=='act2-keeper'),pose={x:foe.x,y:foe.y};Object.assign(foe,{x:device.x+100,y:device.y});finish(q,h.id);assert.equal(m.hoistProtected,false);Object.assign(foe,pose);finish(q,h.id);assert.equal(m.hoistProtected,true);
});
check('early normal, soul and fall deaths preserve independent rescue/lift/settling invariants',()=>{
 for(const method of ['hurt','soul','fall']){const q=fixture(),boss=q.e.unit('act2-keeper');q.b.keeperRitual={version:1,owner:boss.id,next:0,serial:1,playerActions:0,suppressed:0,cast:{elapsed:.3},zone:{kind:'binding'}};q.b.honroState.mukjongPitchDialogue={first:{status:'pending'}};V.slot(q.app,'18.keeper.voice',{actorId:boss.id});const h=q.e.heroesAlive()[0];h.keeperBinding=boss.id;h.bound=1;
  const before=q.b.kills;kill(q,method);assert(boss.dead);assert.equal(boss.hp,0);assert.equal(S.memory(q.b).bossDeath,true);assert.equal(S.complete(q.b),false);assert.equal(S.memory(q.b).rescueSafe,false);assert.equal(S.memory(q.b).liftDone,false);assert.equal(S.memory(q.b).settled,false);
  assert.equal(q.b.keeperRitual.cast,undefined);assert.equal(q.b.keeperRitual.zone,undefined);assert.equal(h.keeperBinding,undefined);assert.equal(h.bound,0);assert.equal(q.b.honroState.mukjongPitchDialogue.first.status,'discarded');assert.equal(V.mem(q.b).slots['18.keeper.voice'].status,'cancelled');S.cleanupDeath(q.app);assert.equal(q.b.kills,before+1);assert(!q.b.queue.includes(boss.id));
 }
});
check('every surviving hero needs a later offered action before a safe negative lift',()=>{
 const q=fixture(),m=qualify(q),poses=plain(q.b.units);assert(S.begin(q.app,'lift',-180));const ids=m.bell.segment.heroes;
 for(const id of ids.slice(0,-1)){finish(q,id);assert.equal(m.bell.status,'warning');}finish(q,ids.at(-1));assert.equal(m.bell.status,'moving');assert.equal(q.e.canAct(),false);
 const actors=plain(q.b.units),time=q.b.time,round=q.b.round;q.e.tick(.45);assert(m.bell.offset<0&&m.bell.offset>-180);assert.deepEqual(plain(q.b.units),actors);assert.equal(q.b.time,time);assert.equal(q.b.round,round);q.e.tick(.45);assert.equal(m.bell.offset,-180);assert.equal(m.bell.lifts,1);assert.equal(m.liftDone,true);assert.equal(m.settled,false);assert.equal(m.bell.status,'lifted');assert.equal(poses.length,q.b.units.length);
});
check('fresh per-segment polygon sweeps block units, summons, stakes and projectiles',()=>{
 for(const kind of ['hero','enemy','summon','stake','projectile']){const q=fixture(),m=qualify(q);const ps={x:8300,y:6210};let blocker;
  if(kind==='stake'){blocker={id:'fixture-stake',...ps,active:true,expires:100};(q.b.stakes??=[]).push(blocker);}else if(kind==='projectile'){blocker={id:'fixture-projectile',...ps,radius:6};q.b.projectiles.push(blocker);}else{blocker=kind==='hero'?q.e.heroesAlive()[0]:kind==='enemy'?q.e.alive(1).find(u=>!u.honroObjectiveTarget):{...plain(q.e.heroesAlive()[0]),id:'fixture-summon',summoned:true};Object.assign(blocker,ps);if(kind==='summon')q.b.units.push(blocker);}
  assert(S.begin(q.app,'lift',-180));assert(S.occupants(q.b).some(u=>u.id===blocker.id),kind);
  if(kind==='projectile'){
   // A live projectile cannot coexist with a normally completed action:
   // qualify prior opportunities explicitly, then inspect the unsafe boundary.
   for(const id of m.bell.segment.heroes)m.bell.segment.opportunities[id]=1;
   q.app.actorBoundary=q.e.active.id;S.transition(q.app);q.app.actorBoundary=null;
  }else warningActions(q);
  assert.notEqual(m.bell.status,'moving',kind);assert.equal(m.bell.offset,0);assert.equal(blocker.x,ps.x);assert.equal(blocker.y,ps.y);
 }
 const q=movingFixture();q.e.tick(1);const down=S.segmentSweep(q.b,-80),up=S.segmentSweep(q.b,-280);assert.notDeepEqual(plain(down),plain(up));assert(down.every(t=>t.vertices.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))));
});
check('warning and moving saves recover both segments exactly and commit once',()=>{
 for(const kind of ['lift','settle'])for(const mode of ['warning','moving']){let q=fixture();const m0=qualify(q);if(kind==='settle'){g.HonroStage18Bell.shift(q.b,-180);m0.bell.offset=-180;m0.liftDone=m0.supportReady=m0.bossDeath=true;m0.bell.lifts=1;}
  const to=kind==='lift'?-180:-80;S.begin(q.app,kind,to);if(mode==='moving'){warningActions(q);q.e.tick(.32);}const saved=plain(q.b);q=fixture(saved);assert.deepEqual(plain(q.b.terrain),saved.terrain);assert.deepEqual(plain(q.b.honroWorldTerrain),saved.honroWorldTerrain);assert.deepEqual(plain(q.b.honroEnvironment.placements),saved.honroEnvironment.placements);assert.deepEqual(plain(S.memory(q.b)),saved.honroState.act23v4.stage18);
  if(mode==='warning')warningActions(q);q.e.tick(1);const m=S.memory(q.b);assert.equal(m.bell.lifts,1);assert.equal(m.bell.reseats,kind==='settle'?1:0);assert.equal(m.bell.offset,to);const terrain=plain(q.b.terrain);q.e.tick(0);S.tick(q.app,0);assert.deepEqual(plain(q.b.terrain),terrain);assert.equal(m.bell.lifts,1);
 }
});
check('prepared support, independent death and a second warning are required for reseating',()=>{
 const q=movingFixture(),m=S.memory(q.b);q.e.tick(1);kill(q);for(const s of V.steps(q.b).slice(0,6))V.mem(q.b).done[s.id]=true;
 // Support fixture removes only actors that physically occupy its future volume.
 const shapes=q.b.terrain.filter(t=>q.b.honroV4Stage18.supportIds.includes(t.id));for(const o of S.occupants(q.b,shapes.map(t=>({...t,broken:false})))){const u=q.e.unit(o.id);if(u){u.dead=true;u.hp=0;}}
 const h=actor(q);place(q,h,6770,'act2-floor');(q.b.stakes??=[]).push({id:'support-occupied',x:5900,y:7000,active:true,expires:100});assert.equal(V.use(q.app,site(q,'18.support')),true);assert.equal(m.supportReady,false);q.e.finishAction(true);assert.equal(m.supportReady,false);assert(shapes.every(t=>t.broken));q.b.stakes=[];finish(q,h.id);assert(m.supportReady);assert(shapes.every(t=>!t.broken));
 V.mem(q.b).done['18.support']=true;actor(q,h.id);place(q,h,6910,'act2-floor');assert.equal(V.use(q.app,site(q,'18.settle')),true);assert.equal(m.bell.offset,-180);warningActions(q);assert.equal(m.bell.status,'moving');const before=plain(q.b.units);q.e.tick(1);assert.deepEqual(plain(q.b.units),before);assert.equal(m.bell.offset,-80);assert.equal(m.bell.reseats,1);assert(m.settled);assert.equal(S.complete(q.b),false);
 V.mem(q.b).done['18.settle']=true;actor(q,h.id);place(q,h,6770,'act2-floor');assert.equal(V.use(q.app,site(q,'18.souls')),true);assert(S.complete(q.b));m.rescueSafe=false;assert.equal(S.complete(q.b),false);
});
check('survivor or hoist loss fails without altering unrelated stages',()=>{
 for(const id of ['18.survivor','18.hoist-device']){const q=fixture(),u=q.e.unit(id);u.hp=0;u.dead=true;assert(S.failure(q.b));assert.equal(S.complete(q.b),false);}
 const q=battlefield(g,19);assert.equal(q.e.alive(1).filter(u=>!u.honroObjectiveTarget).length,0);assert.equal(S.stepSatisfied(q.b,{id:'18.rescue'}),null);
});
console.log(JSON.stringify({checks:checks.length,scope:'Focused synthetic candidate state fixtures and production Engine movement/damage. No browser or normal-route claim.'}));
