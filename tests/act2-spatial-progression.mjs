import {historicalStage11Runtime} from './stage11-ravine-history-helpers.mjs';
// Scope: preserve every original Stage11 assertion on its exact public D map;
// new Stage11 has separately required command, encounter and shot coverage.
import {assertReviewedRouteModes,traverseReviewedRoute} from './act2-reviewed-route-helpers.mjs';
// Ordered physical-route fixture. Combat, defense duration and convoy arrival
// are isolated explicitly, but no gate is pre-opened, no hero is teleported,
// and every required interaction is reached through its live state. Exactly
// reviewed 14/15/16 routes use baseline step-off/jumps; others remain walk-only.
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {walkRoute,coordinates} from './act2-spatial-test-helpers.mjs';
const g=historicalStage11Runtime(await runtime({legacyMaps:false})),rows=[],guards=[];
assertReviewedRouteModes(g.HONRO_PROJECT);
const ids=process.argv.slice(2).map(Number),filtered=ids.length>0;if(!ids.length)ids.push(...Array.from({length:10},(_,i)=>i+11));
for(const id of ids){
 const {b,e,app,st}=battlefield(g,id);g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);e.checkEnd=()=>false;
 const space=g.HONRO_PROJECT.stages[id-1].design.space,mainRoute=space.routes.find(r=>r.id==='main'),main=mainRoute.anchors,heroes=e.heroesAlive(),state=g.HonroAct2.memory(b),steps=[];
 let routeCursor=0;
 // Explicit combat-resolution fixture. Do not conflate this with fighting the
 // roster through normal play; the test is about ordered geometry access.
 for(const enemy of e.alive(1))if(!enemy.honroAct2Boss){enemy.dead=true;enemy.hp=0;}
 let failed=null;
 for(const step of st.steps){
  const site=space.sites[step.id],standing=site.standing,actor=heroes.find(u=>u.cls===(step.requiredClass||(step.kind==='rescue'?'occultist':'archer'))),walks=[];
  const goalIndex=mainRoute.defaultJump?main.findIndex(p=>p.x===standing.x&&Math.abs(p.y-standing.y)<.01&&p.surfaceId===standing.surfaceId):-1;
  if(mainRoute.defaultJump)assert(goalIndex>=routeCursor,'Approved cavern objectives must follow the authored route order');
  for(const hero of heroes){
   b.phase='aim';b.side=0;b.active=hero.id;hero.acted=false;hero.vx=hero.vy=0;
   const direction=Math.sign(standing.x-hero.x),min=Math.min(hero.x,standing.x),max=Math.max(hero.x,standing.x);
   const anchors=main.filter(p=>p.x>min+8&&p.x<max-8).sort((a,b)=>direction*(a.x-b.x));
   // The cavern's final descent passes the exit and returns beneath the arch.
   // Preserve authored order and the 7800 turning point instead of sorting by X.
   const route=mainRoute.defaultJump?main.slice(routeCursor+1,goalIndex+1):[...new Map(anchors.map(p=>[p.x,p])).values(),standing];
   const result=traverseReviewedRoute(g,b,e,hero,route,mainRoute);walks.push({hero:hero.cls,passed:result.passed,ticks:result.ticks});
   if(!result.passed){failed={stage:id,objective:step.id,hero:hero.cls,...result.failed,closedGates:b.terrain.filter(t=>!t.broken&&(t.id.startsWith('gate-')||t.id==='water-gate')).map(t=>({id:t.id,x:t.x,y:t.y}))};break;}
  }
  if(failed)break;
  if(mainRoute.defaultJump)routeCursor=goalIndex;
  b.phase='aim';b.side=0;b.active=actor.id;actor.acted=false;actor.vx=actor.vy=0;
  if(['clear','hold','reach','escort'].includes(step.kind)){
   if(step.kind==='hold')state.holds[step.id]={progress:step.rounds,spawned:step.wave.count,lastRound:b.round,continuous:true,guarded:true};
   state.done[step.id]=true;
  }else if(step.kind==='destroy'){
   const target=b.terrain.find(t=>t.id===step.id);e.damageTerrain(target,target.hp+1,0,actor.id);assert(target.broken,`${id}/${step.id}: actual destruction hook did not fire`);
  }else if(step.kind==='defeat'){
   const target=e.unit(step.target);e.hurt(target,1e9,actor.id);assert(target.honroSubdued||target.dead,`${id}/${step.id}: keeper hook did not fire`);
  }else{
   const marker=b.honroMarkers.find(m=>m.id===step.id);
   assert(Math.hypot(actor.x-marker.x,(actor.y-marker.y)*.75)<=250&&Math.abs(actor.y-marker.y)<=150,`${id}/${step.id}: walked site cannot interact with its marker`);
   assert(g.HonroAct2.use(app,marker),`${id}/${step.id}: existing interaction refused at reachable site`);
  }
  steps.push({id:step.id,kind:step.kind,standing:coordinates(standing),walks,closedGates:b.terrain.filter(t=>!t.broken&&(t.id.startsWith('gate-')||t.id==='water-gate')).map(t=>t.id)});
 }
 const row={stage:id,passed:!failed,failed,steps};rows.push(row);console.log(JSON.stringify({...row,steps:steps.length}));
}
if(ids.includes(14)){
 // Mutation guard for the discovered bug: moving the still-closed bridge gate
 // onto the sole descent before family-lower must make this harness fail.
 const {b,e}=battlefield(g,14),hero=e.active,target=g.HONRO_PROJECT.stages[13].design.space.sites['family-lower'].standing,gate=b.terrain.find(t=>t.id==='gate-bridge'),floor=b.terrain.find(t=>t.id==='act2-floor');
 b.units=[hero];e.checkEnd=()=>false;const x=6620,y=g.HONRO_CORE.topAt(floor,x,0);
 Object.assign(gate,{x:x-25,y:y-220,w:50,h:220,broken:false,vertices:[{x:x-25,y:y-220},{x:x+25,y:y-220},{x:x+25,y},{x:x-25,y}]});
 const route=g.HONRO_PROJECT.stages[13].design.space.routes.find(r=>r.id==='main').anchors.filter(p=>p.x>hero.x&&p.x<target.x).sort((a,b)=>a.x-b.x);
 const result=walkRoute(g,b,e,hero,[...new Map(route.map(p=>[p.x,p])).values(),target]);assert(!result.passed&&result.failed.reason==='blocked','ordered route audit failed to detect an early closed bridge gate');
 guards.push({name:'closed bridge before lower-family is rejected',passed:true,blockedAt:coordinates(hero)});console.log('PASS ordered-route mutation guard: early bridge gate blocks lower-family');
}
await mkdir('_local/reports/act2-spatial',{recursive:true});
await writeFile(`_local/reports/act2-spatial/progression${filtered?'-'+ids.join('-'):''}.json`,JSON.stringify({mode:'Ordered closed-gate physical traversal with explicit combat/hold completion fixtures; not a normal-combat clear.',rows,guards},null,2));
if(rows.some(r=>!r.passed))process.exitCode=1;
