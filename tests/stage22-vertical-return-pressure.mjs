/** Conditional FE return-role regression, not a normal branch playthrough.
 * Requires two preserved attempt-003 raw files (SHA checked). Supply --source-dir
 * when replaying from an immutable packet. No production or raw-source writes.
 * Basic movement is isolated; one reached pose is then injected into exact R20.
 * All recorded enemies, resources, AI and the normal 3-slot selection survive.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {v22Routes} from '../tools/map-forge/stage22-vertical-geometry.mjs';
import {followVerticalRoute} from './vertical-route-helpers.mjs';
const arg=(name,fallback)=>process.argv.find(a=>a.startsWith(name+'='))?.slice(name.length+1)||fallback;
const sourceDir=arg('--source-dir','_local/reports/vertical-stages/stage22-fullplay/attempt-003-local-activation');
const out=arg('--out-dir','_local/reports/vertical-stages/stage22-melee-placement-review/return-pressure');
const plain=x=>JSON.parse(JSON.stringify(x)),hash=x=>createHash('sha256').update(x).digest('hex');
const sourceHashes={
 'register-continue.json':'244db4dd24ba3ee2fbab321fcc05b5ee736aec88866c34628163d7297bbbdd26',
 'trace.json':'3fd018eb01250c0cf609633cb5b8047b9eeecab0f39645f793c7a3001e084222'
};
const sources={};for(const[file,sha]of Object.entries(sourceHashes)){const bytes=await readFile(sourceDir+'/'+file);assert.equal(hash(bytes),sha,'Immutable original '+file);sources[file]=JSON.parse(bytes);}
const original=sources['register-continue.json'].profile.honroBattle,trace=sources['trace.json'];
assert.equal(original.round,20);assert.equal(original.phase,'aim');assert.equal(original.projectiles.length,0);
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,A=g.HonroAct3,S=g.HonroStage22Vertical,checks=[];
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
const productionFiles=['tools/map-forge/apply-stage22-vertical.mjs','tools/map-forge/stage22-vertical-geometry.mjs','shared/runtime/stage22-vertical.js','shared/engine/src/engine.ts','shared/engine/src/enemyAI.ts'];
const productionHashes={};for(const file of productionFiles)productionHashes[file]=hash(await readFile(file));
const mainRouteCounterexample=['v22-e3','v22-e4'].map(id=>({id,actions:trace.enemyActions.filter(a=>a.id===id),fires:trace.enemyFires.filter(a=>a.id===id),received:trace.damage.filter(a=>a.target===id)}));
check('actual attempt003 main route still records no E3/E4 action or shot',()=>{
 for(const row of mainRouteCounterexample){assert.equal(row.actions.length,0);assert.equal(row.fires.length,0);}
 assert.equal(mainRouteCounterexample[0].received.length,0);
 assert.equal(mainRouteCounterexample[1].received.length,1);const d=mainRouteCounterexample[1].received[0];assert.equal(d.amount,74);assert.equal(d.round,20);assert.equal(d.skill,'M04');assert.equal(d.direct,false);
});
const route=v22Routes().find(r=>r.id==='FE'),walk=battlefield(g,22),traveller=walk.e.heroesAlive().find(u=>u.cls==='occultist');
const currentRoster=plain(g.HONRO_PROJECT.stages[21].units);
check('original placement, original count/XP/cap/finite budget and local E limits retained',()=>{
 assert.equal(walk.e.alive(1).length,26);assert.equal(walk.e.alive(1).filter(u=>u.elite).length,6);assert.equal(walk.b.enemyLimit,3);assert.equal(g.HonroEncounters.populationCap(walk.b),35);assert.equal(walk.b.honroGrowth.limit.combat,2890);assert(Math.abs(walk.b.honroGrowth.weight-38.2)<1e-9);
 assert.deepEqual(plain(S.sources.map(s=>walk.b.honroVerticalStage22Spec.entries[s].members.length)),[2,3,2,2]);
 for(const[id,x,y]of [['v22-e1',1910,2409.285714285714],['v22-e2',1990,2512.1428571428573],['v22-e3',2075,2621.4285714285716],['v22-e4',2180,2705]]){const u=walk.e.unit(id);assert.equal(u.x,x);assert.equal(u.y,y);assert.equal(u.honroEncounterSupport,'v22-east-register-rise');}
 const spec=walk.b.honroVerticalStage22Activation['register-rise'];assert.equal(spec.maxHeight,600);assert.equal(spec.radius,1100);assert.deepEqual(plain(spec.crossCover),[{targetSupport:'v22-west-gallery',kinds:['possessedArcher','archiveFiend'],direction:'down',radius:1100,maxHeight:1000}]);
});
// One explicitly prepared starting pose and removal of other actors isolate the
// basic connection. There is no pose/resource/terrain write after this setup.
walk.b.units=[traveller];Object.assign(traveller,{x:route.anchors[0].x,y:route.anchors[0].y,vx:0,vy:0,acted:false,airborne:false,jumping:false});
walk.b.active=traveller.id;walk.b.side=0;walk.b.phase='aim';walk.e.checkEnd=()=>false;
const basicStart={x:traveller.x,y:traveller.y,hp:traveller.hp,focus:traveller.focus,moveLeft:traveller.moveLeft,maxMove:traveller.maxMove,loadout:plain(traveller.loadout),ranks:plain(traveller.ranks),items:plain(walk.b.items),jumpCost:walk.e.jumpCost(traveller)};
const basicJumps=[],basicJump=walk.e.jump.bind(walk.e);walk.e.jump=(actor=walk.e.active)=>{const before=actor.moveLeft,ok=basicJump(actor);if(ok)basicJumps.push({x:actor.x,y:actor.y,vy:actor.vy,cost:before-actor.moveLeft});return ok;};
let playerShots=0;const playerFire=walk.e.fire.bind(walk.e);walk.e.fire=(...args)=>{playerShots++;return playerFire(...args);};
const routeResult=followVerticalRoute(g,walk,traveller,route),reached={x:traveller.x,y:traveller.y};
check('basic FE move/jump/wait reaches C with no damage, recovery, technique or item use',()=>{
 assert(routeResult.passed,JSON.stringify(routeResult.failed));assert.equal(routeResult.jumps,2);assert.deepEqual(basicJumps.map(j=>j.vy),[-660,-660]);assert.deepEqual(basicJumps.map(j=>j.cost),[75,75]);assert.equal(playerShots,0);assert.equal(routeResult.damage,0);assert.equal(routeResult.recoveries,0);assert.deepEqual(plain(walk.b.items),basicStart.items);assert.equal(traveller.hp,basicStart.hp);assert.equal(walk.e.contactSurface(traveller.x,traveller.y-8,traveller.y+10)?.t.id,'v22-report-crossing');assert(Math.abs(traveller.x-2390)<1);assert.equal(traveller.y,2850);
});
// The only saved actor-field changes are this hero's reached x/y. No resources,
// alert, lastAct, HP, original enemy pose or saved queue are rewritten at mount.
const b=plain(original),hero=b.units.find(u=>u.id==='p-occultist');
const injectedFields=[{path:'units[p-occultist].x',before:hero.x,after:reached.x},{path:'units[p-occultist].y',before:hero.y,after:reached.y}];Object.assign(hero,reached);
const priorMount=plain(b),e=new C.Engine(b,()=>{},false),app={engine:e,stage:g.HONRO_CONTENT.stages[21],event(){},sayLines(){},checkMission(){return false;}};
g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);A.attach(app,e);e.checkEnd=()=>false;
check('mount preserves whole conditioned snapshot and every recorded enemy exactly',()=>{
 assert.deepEqual(plain(b),priorMount);assert.deepEqual(plain(b.units.filter(u=>u.side!==0||u.id!=='p-occultist')),original.units.filter(u=>u.side!==0||u.id!=='p-occultist'));
 const expected=plain(original);Object.assign(expected.units.find(u=>u.id==='p-occultist'),reached);assert.deepEqual(plain(b),expected);
 assert.deepEqual(plain(b.queue),original.queue);assert.equal(b.enemyLimit,3);assert.equal(g.HonroEncounters.populationCap(b),35);assert.deepEqual(plain(b.honroGrowth),original.honroGrowth);assert.deepEqual(plain(b.honroState),original.honroState);
});
const overlaps=e.alive(1).filter(u=>Math.abs(u.x-hero.x)<u.r+hero.r&&hero.y>u.y-u.h&&u.y>hero.y-hero.h).map(u=>u.id);
const nearbyBodies=e.alive(1).filter(u=>Math.abs(u.x-hero.x)<180&&Math.abs(u.y-hero.y)<150).map(u=>({id:u.id,x:u.x,y:u.y,r:u.r,h:u.h,horizontalBodyGap:Math.abs(u.x-hero.x)-u.r-hero.r}));
check('the arrived full hero body is terrain-valid and overlaps no existing enemy',()=>{
 assert(C.validTerrainContactPose(b.terrain,hero));assert.equal(g.HonroStage8Bier.terrainBlockers(e,hero).length,0);assert.equal(overlaps.length,0);
});
const beforeActors=plain(b.units),beforeTeam=plain({items:b.items,growth:b.honroGrowth,steps:b.honroAct3Steps,events:b.honroEvents});
// A conditional next enemy boundary is requested with the unmodified selector.
// This is not Continue rewriting the existing queue and not a fourth action.
injectedFields.push({path:'phase',before:b.phase,after:'transition'});b.phase='transition';e.switchTeam();
const queue=plain(b.queue),actionStarts=new Map(e.alive(1).map(u=>[u.id,{x:u.x,y:u.y,hp:u.hp,focus:u.focus,lastAct:u.lastAct}])),actions=[],fires=[],damage=[],impacts=[];let ticks=0;
check('existing selector admits both E guards with exactly three ordinary slots',()=>{assert.deepEqual(queue,['v22-e3','v22-e4','event-54']);assert.equal(b.enemyLimit,3);assert.equal(b.units.length,original.units.length);});
const fire=e.fire.bind(e);e.fire=function(skill,angle,power,ai=false){const u=e.active,before=u.focus,from={x:u.x,y:u.y,support:e.contactSurface(u.x,u.y-8,u.y+10)?.t.id},ok=fire(skill,angle,power,ai);if(ok)fires.push({frame:ticks,id:u.id,skill,angle,power,shot:b.shot,from,focusBefore:before,focusAfter:u.focus});return ok;};
const hurt=e.hurt.bind(e);e.hurt=function(u,...args){const hp=u.hp,result=hurt(u,...args);if(u.hp<hp)damage.push({frame:ticks,target:u.id,side:u.side,targetPosition:{x:u.x,y:u.y,r:u.r,h:u.h},targetSupport:e.contactSurface(u.x,u.y-8,u.y+10)?.t.id,owner:args[1],amount:hp-u.hp,remaining:u.hp,direct:!!args[2],skill:args[3]?.skill,shot:args[3]?.shot,projectileId:args[3]?.id,impactPoint:args[4]?{x:args[4].x,y:args[4].y}:null});return result;};
const impact=e.impact.bind(e);e.impact=function(p,h){impacts.push({frame:ticks,owner:p.owner,skill:p.skill,shot:p.shot,projectileId:p.id,x:h.x,y:h.y,unitId:h.unit?.id,terrainId:h.terrain?.id,normal:h.normal?plain(h.normal):null});return impact(p,h);};
const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,result=finish(...args);if(u?.side===1&&u.acted&&!actions.some(a=>a.id===u.id))actions.push({frame:ticks,id:u.id,from:actionStarts.get(u.id),to:{x:u.x,y:u.y,support:e.contactSurface(u.x,u.y-8,u.y+10)?.t.id},intent:u.intent,moveLeft:u.moveLeft,maxMove:u.maxMove});return result;};
for(;ticks<2800&&b.side===1;ticks++){assert(b.queue.length<=3);e.tick(C.STEP);}
check('both original guards produce actual return-path damage within one bounded enemy team',()=>{
 assert.notEqual(b.side,1,'bounded team finished');assert.deepEqual(actions.map(a=>a.id),queue);
 for(const[id,expected]of [['v22-e3',20],['v22-e4',35]]){assert(fires.some(f=>f.id===id&&f.skill==='LS09'));assert.equal(damage.filter(d=>d.owner===id&&d.target==='p-occultist').reduce((n,d)=>n+d.amount,0),expected);assert(impacts.some(i=>i.owner===id));}
 assert.equal(b.units.length,original.units.length);assert.deepEqual(plain(b.items),beforeTeam.items);assert.deepEqual(plain(b.honroAct3Steps),beforeTeam.steps);assert.deepEqual(plain(b.honroEvents),beforeTeam.events);assert.equal(b.honroGrowth.limit.combat,2890);
});
check('the source snapshots and all production author/AI/geometry files remain untouched',()=>{assert.deepEqual(plain(g.HONRO_PROJECT.stages[21].units),currentRoster);assert.deepEqual(sources['register-continue.json'].profile.honroBattle,original);});
for(const[file,sha]of Object.entries(sourceHashes))assert.equal(hash(await readFile(sourceDir+'/'+file)),sha);
for(const[file,sha]of Object.entries(productionHashes))assert.equal(hash(await readFile(file)),sha);
await mkdir(out,{recursive:true});await writeFile(out+'/result.json',JSON.stringify({passed:true,checks,createdAt:new Date().toISOString(),scope:'Basic connection plus conditional one-enemy-team production JS fixture, not normal branch completion, Native execution, rendering or browser verification.',sourceDir,sourceHashes,productionHashes,mainRouteCounterexample,basicReturn:{start:basicStart,basicJumps,finish:{...reached,hp:traveller.hp,focus:traveller.focus,moveLeft:traveller.moveLeft},isolatedOtherActorsRemoved:true,...routeResult},conditionedR20:{injectedFields,allOtherActorsExactAtMount:true,savedQueueBefore:original.queue,originalActorCount:original.units.length,actorBeforeSHA256:hash(JSON.stringify(beforeActors)),bodyClearance:{overlaps,nearbyBodies},queue},enemyTeam:{ticks,actions,fires,impacts,damage},limits:['The basic route removes other actors to isolate terrain. Body non-overlap is checked separately at the conditional return endpoint.','The reached hero coordinates replace only R20 p-occultist x/y; HP, focus, movement and every enemy retain their saved values.','The phase boundary is a fixture injection; no original player decision or normal branch continuation is claimed.','App mission/story/finite-entry scheduling is not replayed; e.checkEnd is suppressed in these isolated fixtures.', 'Unchanged main-route zero-action evidence remains true. Optional retreat pressure is the only role claim.']},null,2)+'\n');
console.log('WROTE',out+'/result.json');
