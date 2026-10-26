/** Actual candidate geometry/Engine/root V.tick. Initial enemies and admitted
 * casualties, plus hero poses, are explicit fixtures; not normal combat QA. */
import assert from 'node:assert/strict';
import {runtimeCandidate,battlefield} from './act23-v4-helpers.mjs';
const g=await runtimeCandidate(),P=g.HonroAct23V4Stage30,V=g.HonroAct23V4,C=g.HONRO_CORE,I=P.ids;
const plain=x=>JSON.parse(JSON.stringify(x)),ids=[...I.crew,...I.residents,...I.soldiers],checks=[];
const actor=(q,id)=>q.b.units.find(u=>u.id===id),down=u=>{u.dead=true;u.hp=0;};
function check(name,fn){const filter=process.argv.find(a=>a.startsWith('--filter='))?.slice(9);if(filter&&!name.includes(filter))return;fn();checks.push(name);console.log('PASS',name);}
function make(count=4){const q=battlefield(g,30);for(const u of q.b.units)if(u.side===1)down(u);for(const u of q.e.heroesAlive().slice(count))down(u);q.e.checkEnd=()=>false;return q;}
function pose(q,id,x,y){return Object.assign(actor(q,id),{x,y,vx:0,vy:0,jumping:false,airborne:false});}
function settle(q,until,max=2500){for(let i=0;i<max;i++){if(until())return;q.e.tick(C.STEP);V.tick(q.app,0);}assert(until(),'Engine did not settle: '+q.b.phase+'/'+q.b.side);}
function action(q){assert(q.e.canAct(),'real player action available');const u=q.e.active,round=q.b.round;q.e.wait();settle(q,()=>q.b.side===0&&q.b.phase==='aim'&&q.e.canAct()&&(u.acted||q.b.round>round));}
function killWaves(q){for(const w of Object.values(P.memory(q.b).waves))for(const id of w.ids||[])down(actor(q,id));}
const pending=q=>Object.values(P.memory(q.b).waves).some(w=>!w.admitted);
function start(q=make()){const h=q.e.active;pose(q,h.id,6400,6426.666666666667);V.tick(q.app,0);assert(!P.memory(q.b).ready);action(q);assert(P.memory(q.b).waves[I.sources[0]].admitted);killWaves(q);V.tick(q.app,.025);assert(P.memory(q.b).ready);assert.equal(P.memory(q.b).boat.status,'boarding');pose(q,h.id,1320,5400);return q;}
function run(q,until,{combat=true,max=18000}={}){for(let i=0;i<max;i++){if(until(q))return i;V.tick(q.app,.025);if(combat&&pending(q)){action(q);killWaves(q);V.tick(q.app,0);}}assert(until(q),JSON.stringify(P.memory(q.b)));}
function resume(q){const b=plain(q.b),e=new C.Engine(b,()=>{},false),app={...q.app,engine:e};app.canInput=()=>e.canAct();app.checkMission=()=>false;g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);g.HonroAct3.attach(app,e);e.checkEnd=()=>false;return{...q,b,e,app};}
const evidence=q=>plain({transport:P.memory(q.b),actors:ids.map(id=>actor(q,id)),deck:q.b.terrain.find(t=>t.id===I.boat),world:q.b.honroWorldTerrain?.find(t=>t.id===I.boat)});
function acknowledge(q,id){V.tick(q.app,0);const s=actor(q,I.seaman),u=q.e.active;pose(q,u.id,s.x-75,C.topAt(q.b.terrain.find(t=>t.id==='sf-east-recovery-shore'),s.x-75));const p=V.marker(q.b,id);assert(V.eligibility(q.app,p).ok,id+' physical interaction');assert(V.use(q.app,p));settle(q,()=>q.b.side===0&&q.b.phase==='aim'&&q.e.canAct());}

check('existing water, bank-supported docks, injured/seaman roles and exact finite budgets',()=>{
 const q=make(),s=q.b.honroV4Stage30,w=q.b.waters.find(w=>w.x===6460);assert(w&&w.w===750&&w.y===6580);assert.equal(s.waterId,'sf-main-river');
 for(const id of ids)assert(C.validTerrainContactPose(q.b.terrain,actor(q,id)),id+' supported');assert.equal(actor(q,I.injured).honroV4RescueRole,'injured');assert.equal(actor(q,I.seaman).honroV4RescueRole,'seaman');assert.equal(I.residents.length,4);
 assert.equal(new Set(q.b.units.map(u=>u.id)).size,q.b.units.length);assert.equal(s.responses.reduce((n,w)=>n+w.action.n,0),13);assert.equal(s.entries[I.sources[2]].members.length,3);assert.equal(P.failure(q.b),null);assert.equal(P.complete(q.b),false);assert(V.marker(q.b,'old-road'));
});
check('resolved corridor threats open route; idle clocks and old record click do not',()=>{
 const q=make();for(let i=0;i<30;i++)V.tick(q.app,.05);assert(!P.memory(q.b).ready);assert.equal(Object.keys(P.memory(q.b).waves).length,0);assert.equal(P.use(q.app,{id:'s30-route-ready',x:1320,y:5400}),false);
 pose(q,q.e.active.id,6400,6426.666666666667);V.tick(q.app,0);assert(pending(q));for(let i=0;i<30;i++)V.tick(q.app,.05);assert(!P.memory(q.b).waves[I.sources[0]].admitted);
 action(q);assert(P.memory(q.b).waves[I.sources[0]].admitted);assert(!P.memory(q.b).ready);killWaves(q);V.tick(q.app,0);assert(P.memory(q.b).ready);assert.equal(P.memory(q.b).hold.progress,1);assert(!P.complete(q.b));
});
check('finite warnings follow first departure and second boarding, never old hold timer',()=>{
 const q=start(),m=P.memory(q.b);q.b.teamEnds[1]+=20;V.tick(q.app,0);assert.deepEqual(Object.keys(m.waves),[I.sources[0]]);run(q,()=>m.boat.status==='outbound',{combat:false});V.tick(q.app,0);
 assert(m.waves[I.sources[1]]&&!m.waves[I.sources[1]].admitted);assert(m.waves[I.sources[2]]&&!m.waves[I.sources[2]].admitted);assert.equal(m.waves[I.sources[3]],undefined);
 action(q);assert(m.waves[I.sources[1]].admitted);assert(!m.waves[I.sources[2]].admitted,'one action admits one source');killWaves(q);action(q);killWaves(q);run(q,()=>m.secondBoardingStarted,{combat:false});V.tick(q.app,0);assert(m.secondGroupRejoined);assert(m.waves[I.sources[3]]&&!m.waves[I.sources[3]].admitted);
});
check('injured first group walks beside Gwakjin and moves with actual ship/deck',()=>{
 const q=start(),m=P.memory(q.b);assert(actor(q,I.crew[1]).x<6320,'Gwakjin first approaches the injured resident');let escorted=0;run(q,()=>{const a=m.actors[I.injured],r=actor(q,I.injured),h=actor(q,I.crew[1]);if(a.status==='boarding'&&h.carriedBy===undefined){assert(h.x-r.x<62);assert.equal(m.actors[h.id].assisting,I.injured);escorted++;}return m.boat.status==='outbound';},{combat:false});assert(escorted>20);
 const manifest=m.boat.manifest.slice();assert.equal(manifest.filter(id=>I.residents.includes(id)).length,2);assert(manifest.includes(I.injured)&&manifest.includes(I.crew[1]));
 for(let i=0;i<80;i++){const x=m.boat.x;P.evacuation(q.app,.025);assert(m.boat.x>x&&m.boat.x-x<=2.251);for(const id of manifest){const u=actor(q,id);assert.equal(u.carriedBy,I.boat);assert.equal(u.x,m.boat.x+m.actors[id].offset);assert.equal(u.y,m.boat.y);}assert.equal(m.rescued.length,0);}
 run(q,()=>m.boat.status==='unboarding');const h=actor(q,I.crew[1]);assert(q.e.contactSurface(h.x,h.y-4,h.y+5));assert.equal(m.rescued.length,0);
});
check('Gwakjin escorts first landing, walks back, rides return and rejoins remaining group',()=>{
 const q=start(),m=P.memory(q.b);run(q,()=>m.boat.status==='collecting-escort');assert(I.residents.slice(0,2).every(id=>m.actors[id].status==='safe'));const east=actor(q,I.crew[1]).x;
 run(q,()=>m.boat.status==='returning');assert.equal(actor(q,I.crew[1]).carriedBy,I.boat);assert(actor(q,I.crew[1]).x<east-700);const before=m.boat.x;P.evacuation(q.app,.025);assert.equal(before-m.boat.x,4.5);assert.equal(actor(q,I.crew[1]).x,m.boat.x+60);
 run(q,()=>m.boat.status==='west-rejoin');assert.equal(actor(q,I.crew[1]).carriedBy,undefined);const west=actor(q,I.crew[1]).x;assert.equal(m.secondGroupRejoined,undefined);run(q,()=>m.secondGroupRejoined);assert(actor(q,I.crew[1]).x<west-400);
 run(q,()=>m.boat.status==='east');assert.equal(m.boat.leg,2);assert.equal(m.boat.distance,1230);assert(P.rescueComplete(q.b)&&P.convoySafe(q.b));assert(m.actors[I.crew[1]].distance>2500);
 for(const id of I.residents){const u=actor(q,id);assert(m.actors[id].distance>600);assert(m.actors[id].disembarked&&m.actors[id].crossedLeg>0);assert(C.validTerrainContactPose(q.b.terrain,u));assert.equal(u.carriedBy,undefined);}assert.equal(m.rescued.length,new Set(m.rescued).size);assert(!P.complete(q.b),'post-rescue evidence required');
});
for(const status of ['boarding','outbound','unboarding','returning','west-rejoin'])check('save/restore '+status+' preserves phases, actors and unique rescue proof',()=>{
 let q=start(),m=P.memory(q.b);run(q,()=>m.boat.status===status);for(let i=0;i<3;i++)V.tick(q.app,.025);const before=evidence(q),other=resume(q);assert.deepEqual(evidence(other),before);for(let i=0;i<19;i++){V.tick(q.app,.025);V.tick(other.app,.025);}assert.deepEqual(evidence(other),evidence(q));q=other;run(q,()=>P.memory(q.b).boat.status==='east');assert.equal(P.memory(q.b).rescued.length,4);assert.equal(P.memory(q.b).boat.leg,2);
});
check('crowded source or corridor enemy stops progress without timeout success',()=>{
 const q=start(),u=q.e.active;pose(q,u.id,6380,C.topAt(q.b.terrain.find(t=>t.id==='sf-west-ford'),6380));for(let i=0;i<100;i++)P.evacuation(q.app,.025);assert(actor(q,I.crew[1]).x<6380);assert.equal(P.memory(q.b).boat.status,'boarding');pose(q,u.id,1320,5400);run(q,()=>P.memory(q.b).boat.status==='outbound');const e=q.b.units.find(u=>u.side===1);Object.assign(e,{dead:false,hp:10,x:6400,y:6426.666666666667});assert(!P.boardingCorridorSafe(q.b)&&!P.defenseReady(q.b)&&!P.complete(q.b));
});
check('dialogue, projectiles, enemy turn and passenger death cannot advance rescue',()=>{
 const q=start();run(q,()=>P.memory(q.b).boat.status==='outbound');for(const block of [()=>{q.app.dialogue={};},()=>{q.b.phase='flight';},()=>{q.b.side=1;}]){block();const before=evidence(q);for(let i=0;i<10;i++)P.evacuation(q.app,.025);assert.deepEqual(evidence(q),before);q.app.dialogue=null;q.b.phase='aim';q.b.side=0;}down(actor(q,I.injured));assert.equal(P.failure(q.b),'s30-protected-lost');assert(!P.complete(q.b)&&!P.convoySafe(q.b));
});
check('population-delayed source must admit then resolve; reserved warning never counts as finished',()=>{
 const q=start(),m=P.memory(q.b);run(q,()=>m.boat.status==='outbound',{combat:false});V.tick(q.app,0);const cap=g.HonroEncounters.populationCap(q.b);for(const u of q.b.units.filter(u=>u.side===1).slice(0,cap)){u.dead=false;u.hp=10;}const template=q.b.units.find(u=>u.side===1);while(q.b.units.filter(u=>u.side===1&&V.alive(u)).length<cap)q.b.units.push({...plain(template),id:'s30-cap-fixture-'+q.b.units.length,x:200,y:5400,fixed:true,dead:false,hp:10});assert(q.b.units.filter(u=>u.side===1&&V.alive(u)).length>=cap);
 action(q);assert(!m.waves[I.sources[1]].admitted);assert(m.waves[I.sources[1]].opportunity);assert(!P.allWavesResolved(q.b)&&!P.complete(q.b));for(const u of q.b.units)if(u.side===1)down(u);V.tick(q.app,0);assert(m.waves[I.sources[1]].admitted);assert(!P.allWavesResolved(q.b),'living admitted threats unresolved');
});
for(const count of [4,2,1])check('actual finishAction/switchTeam '+count+' heroes keeps offered warning across review save',()=>{
 let q=make(count),h=q.e.active;pose(q,h.id,6400,6426.666666666667);V.tick(q.app,0);for(const u of q.e.heroesAlive())if(u!==h)u.acted=true;assert(q.e.canAct());q.e.wait();assert.equal(q.b.phase,'review');q=resume(q);settle(q,()=>q.b.side===0&&q.b.phase==='aim'&&P.memory(q.b).waves[I.sources[0]].admitted);
 const w=P.memory(q.b).waves[I.sources[0]];assert.equal(w.ids.length,4);assert(w.opportunity&&w.actionToken);assert(q.b.round>=2);const n=q.b.units.length;for(let i=0;i<8;i++)V.tick(q.app,0);assert.equal(q.b.units.length,n);
});
check('summon handoff preserves hero receipt without granting a summon warning eligibility',()=>{
 let q=make(),u=q.e.heroesAlive().find(u=>u.cls==='occultist');for(const h of q.e.heroesAlive())h.acted=h!==u;q.b.active=u.id;pose(q,u.id,6400,6426.666666666667);const enemy=q.b.units.find(u=>u.side===1);Object.assign(enemy,{hp:10,dead:false,fixed:true});q.b.units.push(C.makeUnit('occultist',0,1320,5400,{id:'s30-test-summon',summoned:true,summonOwner:u.id,summonKind:'warden',summonRank:1,summonExpires:5,fixed:false,hp:100,maxHp:100,loadout:[],acted:true,maxMove:100,moveLeft:100,walkSpeed:100}));V.tick(q.app,0);assert(q.e.canAct());q.e.wait();settle(q,()=>q.b.phase==='summon');assert(!P.memory(q.b).waves[I.sources[0]].admitted);q=resume(q);down(actor(q,enemy.id));settle(q,()=>q.b.side===0&&q.b.phase==='aim'&&P.memory(q.b).waves[I.sources[0]].admitted);assert.equal(P.memory(q.b).waves[I.sources[0]].opportunity.actorId,u.id);
});
check('rescued seaman plus ordered testimony/map acknowledgements gate all-hero exit',()=>{
 let q=start(),m=P.memory(q.b);assert.equal(V.mem(q.b).slots[I.testimony],undefined);assert.equal(P.use(q.app,V.marker(q.b,I.testimony)),false);run(q,()=>m.boat.status==='east');assert(P.allWavesResolved(q.b));assert.equal(Object.values(m.waves).flatMap(w=>w.ids||[]).length,16);assert.equal(new Set(Object.values(m.waves).map(w=>w.actionToken)).size,4);assert.equal(m.hold.progress,4);
 assert.equal(V.mem(q.b).slots[I.testimony]?.status,'pending');assert.equal(V.mem(q.b).slots[I.testimony].context.actorId,I.seaman);assert.equal(V.mem(q.b).slots[I.comparison],undefined);assert(!P.complete(q.b));assert.equal(P.use(q.app,V.marker(q.b,I.comparison)),false);q=resume(q);acknowledge(q,I.testimony);assert(!P.complete(q.b));assert.equal(V.mem(q.b).slots[I.comparison]?.status,'pending');acknowledge(q,I.comparison);assert(P.complete(q.b));
 for(const h of q.e.heroesAlive())pose(q,h.id,9450+(q.e.heroesAlive().indexOf(h)-1.5)*50,4300);V.tick(q.app,0);assert(V.state(q.b).complete);assert.equal(Object.keys(q.p.honroV4Cargo||{}).length,0);assert(!V.marker(q.b,'transport-map'));assert.equal(q.app.speeches.length,0);const w=P.memory(q.b).waves[I.sources[3]],enemy=actor(q,w.ids[0]);enemy.dead=false;enemy.hp=10;assert(!P.complete(q.b));
});
check('legacy and other chapters remain outside transport controller',()=>{
 const q=make();delete q.b.honroAct23V4Revision;const before=JSON.stringify(q.b);P.tick(q.app,1);assert.equal(JSON.stringify(q.b),before);assert(!P.active(q.b));q.b.honroAct23V4Revision=1;q.b.honroStage=5;assert(!P.active(q.b));
});
console.log(JSON.stringify({checks:checks.length,scope:'actual convoy physics and saved real action boundaries; explicit hero/combat fixtures; no normal combat/fullplay/browser/art claim'}));
