/** Production Engine on the candidate's real water/bank geometry. Enemy death
 * and hero positions below are explicit fixtures, not normal combat/UI QA. */
import assert from 'node:assert/strict';
import {runtimeCandidate,battlefield} from './act23-v4-helpers.mjs';

const g=await runtimeCandidate(),P=g.HonroAct23V4Stage30,V=g.HonroAct23V4,C=g.HONRO_CORE;
const plain=x=>JSON.parse(JSON.stringify(x)),ids=[...P.ids.crew,...P.ids.residents],checks=[];
const actor=(q,id)=>q.b.units.find(u=>u.id===id);
function check(name,fn){fn();checks.push(name);console.log('PASS',name);}
function make(){const q=battlefield(g,30);for(const u of q.b.units)if(u.side===1){u.dead=true;u.hp=0;}q.b.side=0;q.b.phase='aim';P.attach(q.app,q.e);return q;}
function ready(q){P.memory(q.b).ready=true;const u=q.e.active,pose={x:u.x,y:u.y};Object.assign(u,{x:6400,y:6426.666666666667});P.evacuation(q.app,.025);Object.assign(u,pose);return q;}
function run(q,until,max=12000){for(let i=0;i<max;i++){if(until(q))return i;P.evacuation(q.app,.025);}assert(until(q),JSON.stringify(P.memory(q.b)));}
function resume(q){const b=plain(q.b),e=new C.Engine(b,()=>{},false),app={...q.app,engine:e};P.attach(app,e);return{...q,b,e,app};}
const evidence=q=>plain({transport:P.memory(q.b),actors:ids.map(id=>actor(q,id)),deck:q.b.terrain.find(t=>t.id===P.ids.boat),world:q.b.honroWorldTerrain?.find(t=>t.id===P.ids.boat)});

check('authored docks meet existing banks and transport stays in actual water',()=>{
 const q=make(),water=q.b.waters.find(w=>w.x===6460),spec=q.b.honroV4Stage30;
 assert(water&&water.w===750&&water.y===6580);assert.equal(spec.waterId,'sf-main-river');
 for(const id of ids)assert(C.validTerrainContactPose(q.b.terrain,actor(q,id)),id+' starts supported');
 assert.equal(P.failure(q.b),null);assert.equal(P.complete(q.b),false);
 assert.equal(new Set(q.b.units.map(u=>u.id)).size,q.b.units.length);
 assert(q.b.honroMarkers.some(m=>m.id==='old-road'));
 assert.equal(spec.responses.reduce((n,w)=>n+w.action.n,0),13);
 assert.equal(spec.entries['act3-ferry-hold'].members.length,3);
});

check('idle clock and interaction alone provide no rescue or defense proof',()=>{
 const q=make();for(let i=0;i<80;i++)P.tick(q.app,.05);
 assert.equal(P.memory(q.b).boat.status,'west');assert.equal(P.memory(q.b).hold.progress,0);assert.equal(P.memory(q.b).rescued.length,0);
 const at=q.b.honroMarkers.find(m=>m.id==='s30-route-ready');Object.assign(q.e.active,{x:at.x,y:at.y});
 assert.equal(P.use(q.app,at),true);assert(P.memory(q.b).ready);assert.equal(P.memory(q.b).rescued.length,0);assert.equal(P.complete(q.b),false);
 q.b.phase='aim';for(let i=0;i<30;i++)P.evacuation(q.app,.025);assert.equal(P.memory(q.b).boat.status,'west','initial boarding waits for a hero at the source dock');
});

check('boat moves continuously with exact passenger offsets and live contact bins',()=>{
 const q=ready(make());run(q,q=>P.memory(q.b).boat.status==='outbound');
 const m=P.memory(q.b),manifest=m.boat.manifest.slice(),before=m.boat.x;
 assert.equal(manifest.filter(id=>P.ids.residents.includes(id)).length,2);
 assert.equal(m.rescued.length,0);for(let i=0;i<100;i++){
  const x=m.boat.x;P.evacuation(q.app,.025);assert(m.boat.x>x&&m.boat.x-x<=2.251);
  for(const id of manifest){const u=actor(q,id);assert.equal(u.carriedBy,P.ids.boat);assert.equal(u.x,m.boat.x+m.actors[id].offset);assert.equal(u.y,m.boat.y);}
  assert.equal(P.complete(q.b),false);
 }
 assert(m.boat.x>before&&m.boat.x<7040);assert.equal(m.rescued.length,0);
 run(q,q=>P.memory(q.b).boat.status==='unboarding');
 const u=actor(q,'s30-gwakjin');assert(q.e.contactSurface(u.x,u.y-4,u.y+5),'engine broad phase follows moving deck');
 assert.equal(m.rescued.length,0);assert(m.boat.manifest.every(id=>actor(q,id).carriedBy===undefined));
});

check('two crossings physically disembark every resident and Gwakjin walks the shore',()=>{
 const q=ready(make()),initial=ids.map(id=>({id,x:actor(q,id).x,y:actor(q,id).y}));
 run(q,q=>P.memory(q.b).rescued.length===4);const m=P.memory(q.b);
 assert.equal(m.boat.status,'east');assert.equal(m.boat.leg,2);assert.equal(m.boat.distance,1230);
 assert.equal(m.rescued.length,new Set(m.rescued).size);assert.equal(P.convoySafe(q.b),true);
 for(const id of P.ids.residents){const u=actor(q,id),a=m.actors[id];assert(a.distance>600);assert(a.disembarked&&a.crossedLeg>0);assert(u.x>=7580);assert(C.validTerrainContactPose(q.b.terrain,u));assert.equal(u.carriedBy,undefined);assert(u.honroResolved);}
 assert(m.actors['s30-gwakjin'].distance>1000);assert(actor(q,'s30-gwakjin').x>initial.find(u=>u.id==='s30-gwakjin').x+1000);
 assert.equal(P.complete(q.b),false,'transport cannot replace defense');
 for(let i=0;i<100;i++)P.evacuation(q.app,.025);assert.equal(m.rescued.length,4);assert.equal(m.boat.leg,2);
});

for(const status of ['boarding','outbound','unboarding'])check('save/restore '+status+' preserves current leg, actors and unique rescue proof',()=>{
 let q=ready(make());run(q,q=>P.memory(q.b).boat.status===status);
 for(let i=0;i<7;i++)P.evacuation(q.app,.025);const saved=evidence(q),other=resume(q);
 assert.deepEqual(evidence(other),saved);
 for(let i=0;i<31;i++){P.evacuation(q.app,.025);P.evacuation(other.app,.025);}assert.deepEqual(evidence(other),evidence(q));
 q=other;run(q,q=>P.memory(q.b).rescued.length===4);assert.equal(P.memory(q.b).boat.leg,2);assert.equal(new Set(P.memory(q.b).rescued).size,4);
});

check('a body on the dock blocks physical boarding without a timeout or rescue',()=>{
 const q=ready(make()),u=q.e.active;Object.assign(u,{x:6380,y:g.HONRO_CORE.topAt(q.b.terrain.find(t=>t.id==='sf-west-ford'),6380)});
 for(let i=0;i<160;i++)P.evacuation(q.app,.025);
 assert(actor(q,'s30-gwakjin').x<6380);assert.equal(P.memory(q.b).boat.status,'boarding');assert.equal(P.memory(q.b).rescued.length,0);
 Object.assign(u,{x:1320,y:5400});run(q,q=>P.memory(q.b).boat.status==='outbound');
});

check('dialogue, projectile flight and enemy turns pause crossing at the saved position',()=>{
 const q=ready(make());run(q,q=>P.memory(q.b).boat.status==='outbound');
 for(const apply of [()=>{q.app.dialogue={};},()=>{q.b.phase='flight';},()=>{q.b.side=1;}]){
  apply();const before=evidence(q);for(let i=0;i<20;i++)P.evacuation(q.app,.025);assert.deepEqual(evidence(q),before);q.app.dialogue=null;q.b.phase='aim';q.b.side=0;
 }
});

check('passenger death before landing permanently blocks transport completion',()=>{
 const q=ready(make());run(q,q=>P.memory(q.b).boat.status==='outbound');const u=actor(q,'s30-resident-1');u.dead=true;u.hp=0;
 assert.equal(P.failure(q.b),'s30-protected-lost');assert.equal(P.complete(q.b),false);assert.equal(P.convoySafe(q.b),false);for(let i=0;i<40;i++)P.evacuation(q.app,.025);assert.equal(P.memory(q.b).rescued.length,0);
});

check('forged counters without real disembarkation cannot complete evacuation',()=>{
 const q=ready(make()),m=P.memory(q.b);m.rescued=P.ids.residents.slice();m.boat.status='east';m.hold.progress=3;m.waves['act3-ferry-hold']={admitted:true};
 assert.equal(P.complete(q.b),false);assert.equal(P.convoySafe(q.b),false);
});

check('guarded defense advances on enemy outcomes and exact finite source budget is admitted once',()=>{
 const q=ready(make()),u=q.e.active;Object.assign(u,{x:5550,y:5470});q.app.actorBoundary=u.id;
 P.tick(q.app,0);assert.equal(P.memory(q.b).hold.progress,0);
 for(let n=0;n<8;n++){
  q.b.honroState.actorTurnSerial=(q.b.honroState.actorTurnSerial||0)+1;P.tick(q.app,0);P.tick(q.app,0);
  q.b.teamEnds[1]++;P.tick(q.app,0);
 }
 const m=P.memory(q.b);assert.equal(m.hold.progress,3);assert.equal(P.defenseReady(q.b),true);
 assert.equal(Object.values(m.waves).filter(w=>w.admitted).length,4);
 assert.equal(Object.values(m.waves).flatMap(w=>w.ids||[]).length,16);
 assert.equal(new Set(Object.values(m.waves).map(w=>w.serial)).size,4);
 const n=q.b.units.length;for(let i=0;i<5;i++){q.b.honroState.actorTurnSerial++;P.tick(q.app,0);}assert.equal(q.b.units.length,n);
 assert.equal(P.complete(q.b),false,'a completed defense cannot replace transport');
 run(q,q=>P.memory(q.b).rescued.length===4);assert.equal(P.complete(q.b),true);
 for(const h of q.e.heroesAlive())Object.assign(h,{x:9450+(q.e.heroesAlive().indexOf(h)-1.5)*50,y:4300});
 V.tick(q.app,0);assert.equal(V.state(q.b).complete,true,'generic exit and physical convoy/defense guards agree');
});

check('legacy and other-stage battles remain outside the transport runtime',()=>{
 const q=make();delete q.b.honroAct23V4Revision;const before=JSON.stringify(q.b);P.tick(q.app,1);assert.equal(JSON.stringify(q.b),before);assert.equal(P.active(q.b),false);
 q.b.honroAct23V4Revision=1;q.b.honroStage=5;assert.equal(P.active(q.b),false);
});
console.log(JSON.stringify({checks:checks.length,scope:'candidate Stage30 mechanics, real authored geometry and production movement; explicit combat/state fixtures; no browser, normal combat/fullplay or art acceptance'}));
