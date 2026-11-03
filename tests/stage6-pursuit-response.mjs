/** Prepared Stage 6 event fixture; App response, not natural full-play proof. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness} from './app-regression-helpers.mjs';
const h=await appHarness({productionStory:true,productionInputActions:true}),{g,C}=h;
const profile=JSON.parse(await readFile('game/docs/stage-review/stage06-bridge/evidence/entry-profile.json','utf8')).profile;
const app=h.load(profile);app.launch(6);const e=app.engine,b=e.b;
let now=g.performance.now();g.performance={now:()=>now};
const ops={frame(){now+=C.STEP*1000;if(app.dialogue)g.HonroStory.next(app);app.scene.render=()=>{};app.frame(now);if(app.lastError)throw Error(app.lastError);},ready(limit=30000){for(let i=0;i<limit&&!app.canInput()&&!['won','lost'].includes(b.phase);i++)this.frame();return app.canInput();},defend(){if(!app.canInput())return false;const u=e.active,before=[b.phase,b.side,b.round,u.id,u.acted];app.defend();return before.some((v,i)=>v!==[b.phase,b.side,b.round,e.active?.id,u.acted][i]);}};
assert(ops.ready());const freshSnapshot=structuredClone(b);assert.equal(b.honroStage6PursuitRevision,1);assert.equal(b.honroEvents.find(x=>x.id==='pursuit').action.n,2);
// Explicit fixture makes capacity available; it does not claim natural kills.
for(const u of e.alive(1).slice(0,8)){u.hp=0;u.dead=true;}
for(const ev of b.honroEvents)if(ev.id!=='pursuit')b.honroState.flags['event:'+ev.id]=true;
b.honroState.rescued=true;
for(let i=0;i<10;i++)ops.frame();
assert(b.honroState.pendingEvents.includes('pursuit'),'rescue queues warning');assert.match(app.eventText,/아군 턴이 끝나면.*운반대 뒤쪽/,'warning states timing and relative entry');
assert(!b.units.some(u=>u.honroSpawnSource==='pursuit'),'no entry before actual response');
assert(ops.ready());const place=g.HonroTerrain.place;g.HonroTerrain.place=()=>null;
assert(ops.defend(),'real App defend ends an action');
for(let i=0;i<30000&&!ops.ready(1);i++)ops.frame();
assert(!b.units.some(u=>u.honroSpawnSource==='pursuit'),'blocked atomic entry has no partial actors');
const before=b.nextId;for(let i=0;i<10;i++)ops.frame();assert.equal(b.nextId,before,'blocked retries do not consume ids');
g.HonroTerrain.place=place;
// Even after a genuine hero response, a mid-turn boundary cannot admit the
// pursuit before the rest of the party has had its normal actions.
const event=b.honroEvents.find(x=>x.id==='pursuit'),phase=b.phase;b.phase='aim';app.actorBoundary=e.active?.id;assert.equal(g.HonroAllies.execute(app,{...event.action,source:'pursuit'}),false);assert(!b.units.some(u=>u.honroSpawnSource==='pursuit'));b.phase=phase;
// Prepared-body counterplay fixture: occupying all three rear choices blocks
// the atomic entry; these placements are not claimed as a played manoeuvre.
const heroes=e.heroesAlive(),positions=heroes.map(u=>({u,x:u.x,y:u.y})),carrier=e.unit('objective');for(let i=0;i<heroes.length;i++){heroes[i].x=carrier.x-[450,650,850][i];heroes[i].y=g.HonroWorld.top(b,heroes[i].x,carrier.y,'lower-road');}b.phase='transition';app.actorBoundary=e.active?.id;assert.equal(g.HonroAllies.execute(app,{...event.action,source:'pursuit'}),false,'occupied rear options defer the group');assert(!b.units.some(u=>u.honroSpawnSource==='pursuit'));for(const x of positions){x.u.x=x.x;x.u.y=x.y;}b.phase=phase;
const act2Tune=g.HonroAct2.tuneEncounter;g.HonroAct2.tuneEncounter=()=>{throw Error('Stage 6 must not use Act 2 tuning');};
for(let i=0;i<30000&&!b.honroState.flags['event:pursuit'];i++){if(app.canInput())ops.defend();ops.frame();}
assert.equal(b.honroState.flags['event:pursuit'],true,'entry after a genuine hero response');
g.HonroAct2.tuneEncounter=act2Tune;
const units=b.units.filter(u=>u.honroSpawnSource==='pursuit'),obj=e.unit('objective');assert.equal(units.length,2);for(const u of units){assert(u.x<obj.x-150);assert(C.validTerrainContactPose(b.terrain,u));assert.equal(e.contactSurface(u.x,u.y-4,u.y+5)?.t.id,'lower-road');assert.equal(u.honroTargetId,'objective');}
// Stage 6 reserve considers the pursuit only, even if another density actor is newer.
const others=e.alive(1).filter(u=>u.honroSpawnSource!=='pursuit');assert(others.length>=5);const oldCombat=e.combatEnemies,oldPriority=e.enemyQueuePriority,oldQueue=b.queue,oldLimit=b.enemyLimit;
b.queue=others.slice(0,4).map(u=>u.id);b.enemyLimit=4;const decoy=others[4];decoy.honroDensityBornRound=b.round;decoy.lastAct=0;
e.combatEnemies=()=>[...others,...units].filter(u=>!u.dead&&u.hp>0);e.enemyQueuePriority=u=>({tier:u.honroSpawnSource==='pursuit'?1:2,band:1});const reserved=g.HonroEncounterDensity.reserveQueue(e);assert(units.some(u=>u.id===reserved.at(-1)),'reachable nearby pursuit may reserve one existing Stage 6 slot even behind direct attackers');assert.equal(reserved.length,b.enemyLimit);assert.deepEqual(reserved.slice(0,-1),b.queue.slice(0,-1),'existing defenders retain the other slots');
const priority=e.enemyQueuePriority;e.enemyQueuePriority=u=>({tier:u.honroSpawnSource==='pursuit'?0:2,band:1});assert.deepEqual(g.HonroEncounterDensity.reserveQueue(e),b.queue,'unreachable pursuit cannot reserve a slot');e.enemyQueuePriority=priority;
const originalObjX=obj.x;obj.x+=2000;assert.deepEqual(g.HonroEncounterDensity.reserveQueue(e),b.queue,'distant pursuit cannot reserve a slot');obj.x=originalObjX;
for(const u of units)u.stunnedRound=b.round;assert.deepEqual(g.HonroEncounterDensity.reserveQueue(e),b.queue,'stunned pursuit cannot be reserved');for(const u of units)delete u.stunnedRound;
for(const u of units)u.dead=true;assert.deepEqual(g.HonroEncounterDensity.reserveQueue(e),b.queue,'defeated pursuit cannot be reserved');for(const u of units)u.dead=false;
delete decoy.honroDensityBornRound;const oldStage=b.honroStage;b.honroStage=8;assert.deepEqual(g.HonroEncounterDensity.reserveQueue(e),b.queue,'Stage 8 retains its existing priority comparison');b.honroStage=oldStage;
e.combatEnemies=oldCombat;e.enemyQueuePriority=oldPriority;b.queue=oldQueue;b.enemyLimit=oldLimit;
const goal=structuredClone(b),goalObj=goal.units.find(u=>u.id==='objective'),goalBoss=goal.units.find(u=>u.id==='midboss-stage6');goal.honroState.rescued=true;goalObj.x=6380;goalBoss.dead=true;goalBoss.hp=0;assert(g.HonroObjectives.state(goal,app.stage).complete,'pending pursuit must not delay the authored exit');
const saved=structuredClone(b),count=b.units.length;app.mount(saved);app.actorBoundary=app.engine.active?.id;g.HonroEncounters.update(app,0,{progress:5000,height:2900,broken:0,collected:0});assert.equal(app.engine.b.units.length,count,'mounted saved once flag prevents duplicates');
const legacy=structuredClone(freshSnapshot);delete legacy.honroStage6PursuitRevision;delete legacy.honroEncounterDensityRevision;delete legacy.honroDensityQueueReserve;const oldEvent=legacy.honroEvents.find(x=>x.id==='pursuit');oldEvent.action.n=4;delete oldEvent.warning;delete oldEvent.honroTacticalWarning;app.mount(legacy);assert.equal(g.HonroStage6Pursuit.active(app.engine.b),false,'old save is not upgraded');assert.equal(g.HonroEncounterDensity.active(app.engine.b),false,'old save does not enter density hook');assert.equal(app.engine.b.honroEvents.find(x=>x.id==='pursuit').action.n,4,'old saved event remains unchanged');
console.log(JSON.stringify({status:'pass',scope:'prepared state fixture, App defend/frames, not natural campaign',units:units.map(u=>({x:u.x,y:u.y})),objectiveX:obj.x}));
