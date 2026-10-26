/** Production Engine + unchanged campaign geography. Enemy deaths and hero
 * placements below are explicit combat/placement fixtures, not a normal
 * campaign run or browser/art acceptance. NPC travel always uses Engine.walk
 * and integrateBody; the runner advances rounds only to admit a new budget. */
import assert from 'node:assert/strict';
import {runtime,battlefield as originalBattlefield} from '../game/tests/helpers.mjs';
import {battlefield,plain} from './act23-v4-helpers.mjs';

const g=await runtime({legacyMaps:false}),V=g.HonroAct23V4,P=g.HonroAct23V4City,C=g.HONRO_CORE;
assert(P,'city wrapper must be included in the shared production runtime');
const source=plain(g.HONRO_PROJECT),baseline=originalBattlefield(g,21);
g.HONRO_ACT23_V4_PHASE_A=true;g.HONRO_PROJECT=V.author(g.HONRO_PROJECT,{enabled:true});
const checks=[],actor=(q,id)=>q.b.units.find(u=>u.id===id),site=(q,id)=>V.marker(q.b,id);
function check(name,fn){fn();checks.push(name);console.log('PASS',name);}
function fixture(n,{clear=true}={}){const q=battlefield(g,n);if(clear)for(const u of q.b.units)if(u.side===1&&!u.honroObjectiveTarget){u.hp=0;u.dead=true;}q.b.phase='aim';q.b.side=0;return q;}
function hero(q,cls){const u=V.heroes(q.b).find(u=>u.cls===cls);assert(u,cls);q.b.active=u.id;q.b.phase='aim';q.b.side=0;u.acted=false;return u;}
function pose(q,u,x,y){const floor=q.b.terrain.find(t=>t.id==='a3-foundation');Object.assign(u,{x,y:y??C.topAt(floor,x),vx:0,vy:0,airborne:false,jumping:false});assert(C.validTerrainContactPose(q.b.terrain,u),u.id+' fixture support');}
function park(q){for(const [i,u]of V.heroes(q.b).entries())pose(q,u,200+i*80);}
function use(q,id,cls){const p=site(q,id),u=hero(q,cls);pose(q,u,p.x-190,q.b.terrain.some(t=>t.id==='a3-foundation')?undefined:p.y);assert.equal(V.use(q.app,p),true,id);q.b.phase='aim';q.b.side=0;u.acted=false;return u;}
function run(q,until,{max=10000,roundEvery=500}={}){for(let i=0;i<max;i++){if(until(q))return i;if(i&&i%roundEvery===0)q.b.round++;P.tick(q.app,.025);}assert(until(q),JSON.stringify(P.memory(q.b)));}
function resume(q){const b=plain(q.b),e=new C.Engine(b,()=>{},false),app={...q.app,profile:plain(q.app.profile),engine:e};V.prepare(b,app.profile);V.bindApp(app,e);return{...q,b,e,app};}
const evidence=q=>plain({city:P.memory(q.b),root:V.mem(q.b),actors:q.b.units.filter(u=>u.honroProtected||u.id==='v4.workshop-spirit'),round:q.b.round});
function clearDevices(q){const root=V.mem(q.b);for(const id of ['fire-screen','water-release','party-reunion'])root.done[id]=true;for(const list of [q.b.terrain,q.b.honroWorldTerrain])for(const t of list||[])if(['fire-door','water-gate'].includes(t.id))t.broken=true;}
function gateStart(){const q=fixture(21),cart=actor(q,'v4.gate-cart'),before=plain(q.b.heroes),growth=plain(q.b.honroGrowth.ledger.stages['21']);q.e.hurt(cart,999999,q.e.active.id);assert(cart.dead);assert.equal(cart.xpBudget,0);for(const cls of Object.keys(before)){assert.equal(q.b.heroes[cls].xp,before[cls].xp);assert.equal(q.b.heroes[cls].kills,before[cls].kills);}assert.deepEqual(plain(q.b.honroGrowth.ledger.stages['21'].combat),growth.combat);assert.equal(q.b.honroGrowth.ledger.stages['21'].contribution.total,growth.contribution.total);V.tick(q.app,0);use(q,'gate-resident','archer');park(q);return q;}
function workshopStart(){const q=fixture(26);use(q,'hidden-latch','knight');use(q,'artisan-resident','occultist');park(q);pose(q,hero(q,'knight'),5280);return q;}
function courtyard(){const q=fixture(28);clearDevices(q);park(q);return q;}

check('opt-in author preserves original combat rosters, terrain and resource rules',()=>{
 assert.equal(V.active(baseline.b),false);assert.equal(V.plugins.get(19),P.base);assert.equal(V.plugins.get(20),P.base);
 for(const n of [21,22,25,26,27,28]){
  const old=source.stages.find(s=>s.metadata.stageId===n),map=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===n);
  assert.deepEqual(plain(map.units.filter(u=>u.team==='enemy')),old.units.filter(u=>u.team==='enemy'));
  for(const terrain of old.terrains)assert.deepEqual(plain(map.terrains.find(t=>t.id===terrain.id)),terrain);
  assert.equal(new Set(map.units.map(u=>u.id)).size,map.units.length);
 }
 const q=fixture(26),soul=actor(q,'v4.workshop-spirit');assert(soul.honroVisualOnly&&soul.honroObjectiveTarget);assert.equal(soul.side,2);assert.equal(soul.xpBudget,0);assert.equal(actor(q,'act3-resident').honroHypnotized,true);
 assert.equal(site(q,'v4.ancestor-testimony').action,undefined);
 assert.deepEqual(plain(V.author(g.HONRO_PROJECT,{enabled:true})),plain(g.HONRO_PROJECT));
});

check('21 real zero-XP cart destruction precedes rescue; idle time cannot rescue',()=>{
 const q=fixture(21),p=site(q,'gate-resident');pose(q,hero(q,'archer'),p.x-190,p.y);assert.equal(V.use(q.app,p),false);
 for(let i=0;i<100;i++)P.tick(q.app,.025);assert.equal(P.memory(q.b).started,undefined);assert.equal(actor(q,'act3-resident').x,1620);assert.equal(P.complete(q.b),false);
 const other=gateStart();assert.equal(V.mem(other.b).done['v4.gate-cart'],true);assert.equal(V.mem(other.b).done['gate-resident'],undefined);assert.equal(P.complete(other.b),false);
});

check('21 finite round budgets, real pickup and walk replace the old turn timer',()=>{
 const q=gateStart(),u=actor(q,'v4.gwakjin'),start=u.x;
 for(let i=0;i<600;i++)P.tick(q.app,.025);const a=P.memory(q.b);assert(a.actors[u.id].spent<=600.001);assert(u.x<start-500);assert.equal(a.proof.pickup,undefined);
 const x=u.x;u.maxMove=1400;u.moveLeft=1400;u.walkSpeed=700;for(let i=0;i<100;i++)P.tick(q.app,.025);assert.equal(u.x,x,'ordinary ally scheduler cannot enlarge escort budget');assert.equal(P.complete(q.b),false);
 q.b.round++;run(q,q=>!!P.memory(q.b).actors['act3-resident']?.safe);
 assert(a.proof.pickup);assert(a.actors['act3-resident'].distance>900);assert(a.actors['v4.gwakjin'].distance>2000);assert(C.validTerrainContactPose(q.b.terrain,actor(q,'act3-resident')));
 assert.equal(V.mem(q.b).holds['refuge-hold'],undefined);assert.equal(P.complete(q.b),false,'pressure still needs a real admission and defeat');
 q.b.honroState.actorTurnSerial=(a.pressure.warnSerial||0)+1;q.app.actorBoundary=q.e.active.id;P.tick(q.app,0);assert.equal(a.pressure.ids.length,2);assert(a.pressure.admitted);
 for(const id of a.pressure.ids){actor(q,id).hp=0;actor(q,id).dead=true;}P.tick(q.app,0);assert.equal(P.complete(q.b),true);
 const count=q.b.units.length;for(let i=0;i<20;i++)P.tick(q.app,.025);assert.equal(q.b.units.length,count);
});

check('21 moving snapshot resumes the same pose, budget, pickup and rescue once',()=>{
 const q=gateStart();for(let i=0;i<90;i++)P.tick(q.app,.025);const saved=evidence(q),other=resume(q);assert.deepEqual(evidence(other),saved);
 for(let i=0;i<35;i++){P.tick(q.app,.025);P.tick(other.app,.025);}assert.deepEqual(evidence(other),evidence(q));
 run(other,q=>!!P.memory(q.b).actors['act3-resident']?.safe);assert.equal(V.mem(other.b).checkpoints.filter(s=>s.id==='gate-resident').length,1);
});

check('22 local archive approach gates one bundle and preserves both door openings',()=>{
 const q=fixture(22,{clear:false});const seal=site(q,'archive-seal'),u=hero(q,'knight');pose(q,u,seal.x,seal.y);assert.equal(V.use(q.app,seal),true);q.b.phase='aim';q.b.side=0;u.acted=false;
 assert(q.b.terrain.find(t=>t.id==='archive-door').broken);
 const p=site(q,'v4.record-bundle');pose(q,u,p.x,p.y);assert.equal(V.eligibility(q.app,p).ok,false);assert.equal(V.use(q.app,p),false);assert.equal(V.mem(q.b).slots['22.records-compare'],undefined);
 for(const foe of q.b.units)if(foe.side===1&&V.near(foe,p,390)){foe.hp=0;foe.dead=true;}
 assert.equal(V.use(q.app,p),true);assert(q.b.terrain.find(t=>t.id==='upper-door').broken);
 const slot=V.mem(q.b).slots['22.records-compare'];assert.equal(slot.context.contents.length,3);assert.equal(Object.keys(V.mem(q.b).cargo).length,1);
 assert.equal(V.use(q.app,p),false);assert.equal(Object.keys(V.mem(q.b).cargo).length,1);
});

check('26 occultist separation is local, harmless to resident and does not kill or reward a distant enemy',()=>{
 const q=fixture(26,{clear:false});use(q,'hidden-latch','knight');const p=site(q,'artisan-resident'),resident=actor(q,'act3-resident'),spirit=actor(q,'v4.workshop-spirit'),hp=resident.hp;
 pose(q,hero(q,'knight'),p.x-190);assert.equal(V.use(q.app,p),false);
 const foes=plain(q.b.units.filter(u=>u.side===1).map(u=>({id:u.id,hp:u.hp,xpGranted:u.xpGranted})));use(q,'artisan-resident','occultist');
 assert(spirit.dead&&spirit.honroReleased);assert.equal(resident.hp,hp);assert.equal(resident.honroHypnotized,false);assert.deepEqual(plain(q.b.units.filter(u=>u.side===1).map(u=>({id:u.id,hp:u.hp,xpGranted:u.xpGranted}))),foes);
 assert.equal(V.mem(q.b).done['artisan-resident'],undefined);assert.equal(V.mem(q.b).slots['26.ancestor-testimony'],undefined);assert.equal(P.complete(q.b),false);
});

check('26 walking and local combat both precede automatic testimony, without a document click',()=>{
 const q=workshopStart(),local=actor(q,'a3-26-tally-store-remnants-0');local.dead=false;local.hp=local.maxHp;
 run(q,q=>!!P.memory(q.b).actors['act3-resident']?.safe);assert.equal(P.memory(q.b).proof.testimony,undefined);assert.equal(P.complete(q.b),false);
 local.hp=0;local.dead=true;P.tick(q.app,0);V.tick(q.app,0);
 assert.equal(V.mem(q.b).done['artisan-resident'],true);assert.equal(V.mem(q.b).done['v4.ancestor-testimony'],true);
 const slot=V.mem(q.b).slots['26.ancestor-testimony'];assert.equal(slot.status,'pending');assert.equal(slot.context.actorId,V.heroes(q.b).find(u=>u.cls==='knight').id);assert(slot.context.distance>300);assert.equal(P.complete(q.b),true);
 assert.equal(V.use(q.app,site(q,'v4.ancestor-testimony')),false);assert.equal(V.mem(q.b).checkpoints.filter(s=>s.id==='v4.ancestor-testimony').length,1);
});

check('26 saved separation and mid-walk resume preserve physical proof and exactly one testimony',()=>{
 const q=workshopStart();for(let i=0;i<35;i++)P.tick(q.app,.025);const other=resume(q);assert.deepEqual(evidence(other),evidence(q));
 for(let i=0;i<20;i++){P.tick(q.app,.025);P.tick(other.app,.025);}assert.deepEqual(evidence(other),evidence(q));run(other,q=>!!P.memory(q.b).proof.testimony);V.tick(other.app,0);
 assert.equal(V.mem(other.b).checkpoints.filter(s=>s.id==='artisan-resident').length,1);assert.equal(Object.keys(V.mem(other.b).slots).filter(s=>s==='26.ancestor-testimony').length,1);
});

for(const n of [25,27])check(n+' every original destination needs its own grounded two-person arrival in free order',()=>{
 const q=fixture(n),list=V.steps(q.b).filter(s=>s.kind==='v4-city-arrival'),team=V.heroes(q.b),home=team.map(u=>({x:u.x,y:u.y}));assert.equal(list.length,n===25?5:4);assert.equal(team.length,2);assert.deepEqual(plain(team.map(u=>u.cls).sort()),['archer','mage']);
 if(n===25)V.mem(q.b).done['depot-entry-seal']=true;
 q.b.honroStakeCrossing.index=list.length;q.b.honroStakeCrossing.checkpointProgress={index:list.length};
 for(const [index,s]of list.slice().reverse().entries()){
  const p=site(q,s.id);pose(q,team[0],p.x-42,p.y);pose(q,team[1],p.x+42,p.y);
  if(index===0){pose(q,team[1],home[1].x,home[1].y);P.tick(q.app,0);assert.equal(V.mem(q.b).done[s.id],undefined);pose(q,team[1],p.x+42,p.y);}
  P.tick(q.app,0);assert.equal(V.mem(q.b).done[s.id],true);assert.equal(Object.keys(P.memory(q.b).arrivals).length,index+1);
  for(const other of list.filter(x=>!list.slice().reverse().slice(0,index+1).includes(x)))assert.equal(V.satisfied(q.b,other),false,'later index cannot fabricate '+other.id);
 }
 assert(list.every(s=>V.satisfied(q.b,s)));
 const other=resume(q);assert.deepEqual(plain(P.memory(other.b).arrivals),plain(P.memory(q.b).arrivals));
 const receipts=plain(P.memory(q.b).arrivals);assert.deepEqual(plain(q.b.honroStakeCrossing.checkpoint.honroState.act23v4.city.arrivals),receipts);
 assert(g.HonroStakeCrossing.retry(q.app,'controlled checkpoint retry'));assert.deepEqual(plain(P.memory(q.b).arrivals),receipts);
 if(n===27){assert(!V.steps(q.b).some(s=>['family-manifest','depot-route-ledger'].includes(s.id)));assert.equal(site(q,'family-manifest').action,undefined);assert.equal(q.b.honroAct3Void.state,'READY');assert.equal(q.b.honroVoidWitness,undefined);assert.equal(V.current(q.b).id,'deep-depot-exit');const exit=site(q,'deep-depot-exit');for(const [i,u]of V.heroes(q.b).entries())pose(q,u,exit.x-42+i*84,exit.y);V.tick(q.app,0);assert.equal(V.state(q.b).complete,true,'optional void witness never locks the exit');assert.equal(q.b.honroVoidWitness,undefined);}
});

check('27 independent Seolo approach freezes outside actors and transient saves recover READY without a witness',()=>{
 const W=g.HonroAct3Void,q=fixture(27),z=q.b.honroMap.act3.voidEncounter.trigger,team=V.heroes(q.b),seolo=team.find(u=>u.cls==='archer'),damheo=team.find(u=>u.cls==='mage');
 pose(q,seolo,(z.left+z.right)/2,z.y);q.b.active=damheo.id;const other=plain(damheo),before=plain(seolo),clock=plain({round:q.b.round,ends:q.b.teamEnds,items:q.b.items});
 assert(W.eligible(q.app));q.e.tick(.025);assert.equal(q.b.honroAct3Void.state,'FALLING');assert.equal(q.b.honroVoidWitness,undefined);
 for(let i=0;i<30;i++){W.frame(q.app,.05);q.e.tick(.05);}assert.equal(q.b.honroAct3Void.state,'VOID');assert.deepEqual(plain(damheo),other);assert.deepEqual(plain({round:q.b.round,ends:q.b.teamEnds,items:q.b.items}),clock);
 for(const phase of ['FALLING','DARKENING','VOID','RETURNING']){const saved=plain(q.b);saved.honroAct3Void.state=phase;assert(W.recover(saved));assert.equal(saved.honroAct3Void.state,'READY');assert.equal(saved.honroAct3Void.recovered,true);assert.deepEqual(plain(saved.units.find(u=>u.id===seolo.id)),before);assert.equal(saved.honroVoidWitness,undefined);}
 assert(W.finish(q.app));assert.equal(q.b.honroAct3Void.state,'RESOLVED');assert.equal(q.b.honroVoidWitness,true);assert.equal(q.app.profile.honroStoryEvents[W.KEY],true);assert.deepEqual(plain(seolo),before);assert.equal(W.eligible(q.app),false);assert.equal(Object.keys(P.memory(q.b).arrivals).length,0,'void witness grants no exploration progress');
});

check('28 either fire-device order retains 12 enemy ends and requires an action boundary for physical reunion',()=>{
 for(const order of [['fire-screen','water-release'],['water-release','fire-screen']]){
  const q=fixture(28),positions=V.heroes(q.b).map(u=>[u.cls,u.x,u.y]),resources=plain(q.b.heroes);
  assert.deepEqual(plain(positions),[['archer',6700,2590],['mage',6540,2590],['knight',300,2700],['occultist',460,2700]]);
  for(const id of order)use(q,id,id==='fire-screen'?'knight':'archer');
  assert.equal(P.failure(q.b),null);assert.deepEqual(plain(q.b.heroes),resources);
  const p=site(q,'party-reunion');for(const [i,u]of V.heroes(q.b).entries())pose(q,u,p.x-150+i*90);
  q.app.actorBoundary=null;V.tick(q.app,0);assert.equal(V.mem(q.b).done['party-reunion'],undefined);q.app.actorBoundary=q.e.active.id;V.tick(q.app,0);assert.equal(V.mem(q.b).done['party-reunion'],true);assert.equal(P.complete(q.b),false);
 }
 const q=fixture(28);q.b.teamEnds[1]=11;P.tick(q.app,0);assert.equal(P.failure(q.b),null);q.b.teamEnds[1]=12;assert.equal(P.failure(q.b),'v4.28.fire');
});

check('28 actual pickup and supported escort, limited budgets, pause, body block and mid-walk reload',()=>{
 const q=courtyard(),resident=actor(q,'v4.fire-resident-1');P.tick(q.app,.025);const first=evidence(q);
 q.app.dialogue={};for(let i=0;i<30;i++)P.tick(q.app,.025);assert.deepEqual(evidence(q),first);q.app.dialogue=null;
 run(q,q=>!!P.memory(q.b).proof.pickup);assert((P.memory(q.b).actors['v4.gwakjin']?.distance||0)>200);
 const h=hero(q,'archer');pose(q,h,4500);for(let i=0;i<350;i++)P.tick(q.app,.025);assert(resident.x<4500);assert.equal(P.evacuationSafe(q.b),false);park(q);
 const other=resume(q);assert.deepEqual(evidence(other),evidence(q));for(let i=0;i<20;i++){P.tick(q.app,.025);P.tick(other.app,.025);}assert.deepEqual(evidence(other),evidence(q));
 run(other,q=>P.evacuationSafe(q.b));assert.equal(P.complete(other.b),true);
 for(const id of other.b.honroV4CitySpec.residents){const u=actor(other,id),a=P.memory(other.b).actors[id];assert(a.distance>2600);assert(a.spent<=600.001);assert(C.validTerrainContactPose(other.b.terrain,u));}
});

check('28 one orders bundle requires Hwigyeom, evacuation and a safe cache approach',()=>{
 const q=courtyard(),p=site(q,'petition-record');park(q);pose(q,hero(q,'knight'),p.x-150,p.y);assert.equal(V.use(q.app,p),false);
 park(q);run(q,q=>P.evacuationSafe(q.b));
 pose(q,hero(q,'archer'),p.x-150,p.y);assert.equal(V.use(q.app,p),false);park(q);pose(q,hero(q,'knight'),p.x-150,p.y);
 const foe=actor(q,'a3-28-court-petition-0');foe.hp=foe.maxHp;foe.dead=false;assert.equal(V.use(q.app,p),false);assert.equal(V.mem(q.b).slots['28.orders-bundle'],undefined);
 foe.hp=0;foe.dead=true;assert.equal(V.use(q.app,p),true);assert.equal(V.mem(q.b).slots['28.orders-bundle'].context.responsibility.length,3);assert.equal(Object.keys(V.mem(q.b).cargo).length,1);
});

check('resident loss and forged evacuation counters never satisfy physical completion',()=>{
 for(const n of [21,26,28]){const q=fixture(n),spec=q.b.honroV4CitySpec,id=spec.resident||spec.residents[0];V.mem(q.b).evacuationSafe=true;P.memory(q.b).proof.pickup={fixture:true};assert.equal(P.complete(q.b),false);actor(q,id).hp=0;actor(q,id).dead=true;assert.equal(P.failure(q.b),'v4.city.resident-lost');}
});

console.log(JSON.stringify({checks:checks.length,scope:'Production model/Engine fixtures; original terrain and real NPC walking. Combat deaths, hero placements and controlled round/boundary advancement are fixtures; browser, art and normal campaign completion untested.'}));
