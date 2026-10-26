(function(G){'use strict';
const V=G.HonroAct23V4,C=G.HONRO_CORE;
if(!V)return;
const ID='s30-boat',CREW=['s30-yeonsil','s30-gwakjin'],RESIDENTS=['s30-resident-1','s30-resident-2','s30-resident-3','s30-resident-4'];
const upperSupports=new Set(['sf-granite-cape','sf-cape-east-descent','sf-cape-bank-link','sf-bank-inner','sf-high-response-ledge','sf-east-outer-grade','sf-old-road-west-rise','sf-old-road-west-bridge','sf-old-road-gather','sf-old-road-return-flight','sf-old-road-upper-flight']);
const active=b=>b?.honroStage===30&&!b.honroCustom&&b.honroAct23V4Revision===1;
const alive=u=>!!u&&!u.dead&&u.hp>0;
const unit=(b,id)=>b.units.find(u=>u.id===id);
const heroes=b=>b.units.filter(u=>alive(u)&&u.side===0&&!u.summoned&&!u.enthrall);
const copy=x=>JSON.parse(JSON.stringify(x));
const serial=b=>b.honroState.actorTurnSerial||0;
function memory(b){return V.mem(b).stage30??={version:1,ready:false,boat:{id:ID,status:'west',x:6630,y:6560,leg:0,manifest:[],distance:0},actors:{},rescued:[],waves:{},hold:{progress:0,lastEnemyEnd:b.teamEnds?.[1]||0,continuous:false},blocked:[]};}
function ramp(id,points){return{id,type:'solid',name:id,points:points.map(([x,y])=>({x,y})),baseMaterial:'wood',breakable:false,layer:'terrain',oneWay:true,properties:{hp:99999,maxHp:99999,honroWalkEdges:[0],honroV4Transport:true}};}
function author(map){
 const initial=map.initialState??={};
 initial.honroV4Stage30={version:1,waterId:'sf-main-river',sourceDock:'s30-west-dock',targetDock:'s30-east-dock',deck:ID,source:{x:6630,y:6560},target:{x:7040,y:6560},capacity:2,residents:RESIDENTS,crew:CREW,
  responses:(map.events||[]).filter(e=>/^act3-response-30-[012]$/.test(e.id)).map(e=>({id:e.id,action:copy(e.action)})),entries:copy(initial.honroFerrySpec?.entries||{})};
 const west=ramp('s30-west-dock',[[6400,6426.666666666667],[6460,6440],[6550,6560],[6550,6580],[6460,6460],[6400,6446.666666666667]]);west.properties.honroWalkEdges=[0,1];
 const east=ramp('s30-east-dock',[[7120,6560],[7210,6440],[7250,6440],[7250,6460],[7210,6460],[7120,6580]]);east.properties.honroWalkEdges=[0,1];
 const add=[west,east,ramp(ID,[[6550,6560],[6710,6560],[6710,6580],[6550,6580]])];
 map.terrains=map.terrains.filter(t=>!add.some(a=>a.id===t.id)).concat(add);
 map.units=map.units.filter(u=>!RESIDENTS.includes(u.id)&&!CREW.includes(u.id));
 for(const [i,id]of RESIDENTS.entries()){
  const x=6250-i*62,y=x>=6140?6260+(x-6140)*160/230:6110+(x-6020)*150/120;
  map.units.push({id,kind:'object:civilian',team:'npc',x,y,label:id,stageOverrides:{name:id,honroProtected:true,honroCivilian:true,honroAlly:false,fixed:true,r:17,h:86,maxMove:0,moveLeft:0,walkSpeed:125}});
 }
 map.units.push({id:CREW[0],kind:'object:civilian',team:'npc',x:6570,y:6560,label:CREW[0],stageOverrides:{name:CREW[0],honroProtected:true,honroCivilian:true,honroAlly:false,fixed:true,r:17,h:86,carriedBy:ID}},
  {id:CREW[1],kind:'ally:guard',team:'npc',x:6320,y:6385.22,label:CREW[1],stageOverrides:{name:CREW[1],honroProtected:true,honroCivilian:false,honroAlly:false,fixed:true,r:17,h:90,walkSpeed:145}});
 initial.honroV4Steps=[{id:'s30-route-ready',kind:'interact',label:'s30-route-ready'},
  {id:'ferry-hold',kind:'evidence',label:'ferry-hold'},{id:'s30-evacuate',kind:'evidence',label:'s30-evacuate'},
  {id:'old-road',kind:'reach',label:'old-road',allHeroes:true,radius:440}];
 map.markers=map.markers.filter(m=>m.id!=='transport-map'&&!['s30-route-ready','s30-evacuate'].includes(m.id));
 map.markers.push({id:'s30-route-ready',type:'act3',action:'act3',x:1320,y:5400,label:'s30-route-ready'},
  {id:'s30-evacuate',type:'act3',action:'act3',x:6410,y:6435.56,label:'s30-evacuate'});
 return map;
}
function deck(b){return b.terrain.find(t=>t.id===ID);}
function positionDeck(b){const m=memory(b),x=m.boat.x;
 let reindex=false;for(const list of [b.terrain,b.honroWorldTerrain]){const t=list?.find(t=>t.id===ID);if(!t)continue;const dx=x-(t.x+t.w/2),from=[Math.floor(t.x/320),Math.floor((t.x+t.w)/320)];t.x+=dx;if(t.vertices)for(const p of t.vertices)p.x+=dx;if(list===b.terrain&&(from[0]!==Math.floor(t.x/320)||from[1]!==Math.floor((t.x+t.w)/320)))reindex=true;}
 if(reindex)b.sceneVersion=(b.sceneVersion||0)+1;
}
function prepare(b){if(!active(b))return;const m=memory(b);
 for(const id of [...CREW,...RESIDENTS])m.actors[id]??={status:id===CREW[0]?'aboard':'waiting',route:0,distance:0,...(id===CREW[0]?{offset:-60}:{})};
 // An unchanged snapshot owns its current leg, manifest, offsets and positions.
 // Restore never reauthors a roster or marks a passenger rescued.
 positionDeck(b);
}
function paused(app){const b=app.engine.b;return app.done||app.dialogue||app.modal?.classList?.contains('open')||app.charging||G.HonroStory?.turnPaused?.(app)||['won','lost'].includes(b.phase);}
function safe(app){const b=app.engine.b;return !paused(app)&&b.side===0&&b.phase==='aim'&&!b.projectiles?.length&&!b.volley&&!b.summonTurn&&!b.units.some(u=>alive(u)&&(u.meleeAction||u.airborne||u.jumping));}
function threatened(b,p,r=230){return b.units.some(u=>alive(u)&&u.side===1&&!u.honroObjectiveTarget&&Math.hypot(u.x-p.x,(u.y-p.y)*.75)<r);}
function blocked(b,u,p){return b.units.some(v=>v!==u&&alive(v)&&!v.honroObjectiveTarget&&v.carriedBy!==ID&&Math.abs(v.x-p.x)<u.r+v.r+3&&p.y>v.y-v.h+2&&p.y-u.h<v.y-2);}
function supported(b,u){return !!C.validTerrainContactPose(b.terrain,u);}
// Route actors use the common swept walk and gravity. A probe reserves both
// body clearance and support before the real pose is committed. No y snapping.
function walk(app,u,goal,dt){const e=app.engine,b=e.b;if(!alive(u)||u.carriedBy!==undefined||threatened(b,u))return false;
 const distance=goal.x-u.x;if(Math.abs(distance)<2)return supported(b,u);
 const probe={...u,fixed:false,moveLeft:Math.abs(distance)+4,maxMove:1000,walkSpeed:u.walkSpeed||125,vx:0,vy:0};
 const slice=Math.min(dt,.025,Math.abs(distance)/(probe.walkSpeed||125));
 e.walk(probe,Math.sign(distance),slice);e.integrateBody(probe,slice,true);
 if(!Number.isFinite(probe.x)||!Number.isFinite(probe.y)||!supported(b,probe)||blocked(b,u,probe))return false;
 const d=Math.hypot(probe.x-u.x,probe.y-u.y);Object.assign(u,{x:probe.x,y:probe.y,vx:0,vy:0,fixed:true,jumping:false,airborne:false,facing:Math.sign(distance),moving:.1,walkPhase:probe.walkPhase});
 memory(b).actors[u.id].distance+=d;app.dirty=true;return Math.abs(goal.x-u.x)<2;
}
function follow(app,id,route,dt){const b=app.engine.b,u=unit(b,id),a=memory(b).actors[id];if(!alive(u))return false;
 let p=route[a.route||0];if(!p)return true;
 if(walk(app,u,p,dt)){a.route++;p=route[a.route];}return !p;
}
function aboard(b,id,offset){const m=memory(b),u=unit(b,id);if(!alive(u)||!supported(b,u)||Math.abs(u.x-(m.boat.x+offset))>3||Math.abs(u.y-m.boat.y)>3)return false;
 u.carriedBy=ID;u.fixed=true;u.vx=u.vy=0;m.actors[id].status='aboard';m.actors[id].offset=offset;
 if(!m.boat.manifest.includes(id))m.boat.manifest.push(id);return true;
}
function syncPassengers(b){const m=memory(b);for(const id of [...CREW,...m.boat.manifest]){const u=unit(b,id),a=m.actors[id];if(!alive(u)||u.carriedBy!==ID)continue;u.x=m.boat.x+(a.offset??60);u.y=m.boat.y;u.vx=u.vy=0;u.fixed=true;}}
function crewRoute(){return[{x:6400},{x:6550},{x:6690}];}
function residentRoute(index){return[{x:6400},{x:6550},{x:6610+index*40}];}
function shoreRoute(id){const i=RESIDENTS.indexOf(id),refuges=[7740,7800,7620,7680];return[{x:7120},{x:7230},{x:7400},{x:i<0?7890:refuges[i]}];}
function moveBoat(app,to,dt){const b=app.engine.b,m=memory(b),boat=m.boat;
 const dx=Math.sign(to-boat.x)*Math.min(Math.abs(to-boat.x),90*Math.min(dt,.05)),next=boat.x+dx;
 // The authored hull remains in the existing water. Other actors or shots in
 // its swept body stop motion; they cannot be carried accidentally.
 const left=Math.min(boat.x,next)-80,right=Math.max(boat.x,next)+80;
 if(b.units.some(u=>alive(u)&&u.carriedBy!==ID&&u.x+u.r>left&&u.x-u.r<right&&u.y>boat.y-95&&u.y-u.h<boat.y+20))return false;
 boat.x=next;boat.distance+=Math.abs(dx);positionDeck(b);syncPassengers(b);app.dirty=true;return Math.abs(to-boat.x)<.001;
}
function begin(app,status){const b=app.engine.b,m=memory(b);m.boat.status=status;app.dirty=true;app.engine.emit?.('save');}
function evacuation(app,dt){const e=app.engine,b=e.b,m=memory(b),boat=m.boat;if(!m.ready||!safe(app)||dt<=0||failure(b))return;
 const g=unit(b,CREW[1]),ga=m.actors[CREW[1]],slice=Math.min(dt,.05);
 // Gwakjin walks off first and stays with the arriving residents on the shore.
 if(ga.status==='disembarking'||ga.status==='escort'){
  ga.status='escort';if(follow(app,g.id,shoreRoute(g.id),slice))ga.status='safe';
 }
 for(const id of RESIDENTS){const a=m.actors[id],u=unit(b,id);if(!['disembarking','escort'].includes(a.status))continue;
  if(!alive(g)||g.x-u.x<45||Math.abs(g.y-u.y)>700)continue;
  a.status='escort';const route=shoreRoute(id);if(follow(app,id,route,slice)&&supported(b,u)&&!blocked(b,u,u)&&!threatened(b,u,280)){
   a.status='safe';a.disembarked=true;u.honroResolved=true;if(!m.rescued.includes(id))m.rescued.push(id);V.slot(app,'s30-resident-safe:'+id,{actor:id,dock:'s30-east-dock'});e.emit?.('save');
  }
 }
 if(boat.status==='west'){
  if(boat.leg===0&&!heroes(b).some(u=>supported(b,u)&&Math.abs(u.y-6426.666666666667)<=250&&Math.hypot(u.x-6400,(u.y-6426.666666666667)*.75)<=700))return;
  const next=RESIDENTS.filter(id=>m.actors[id].status==='waiting').slice(0,2);
  if(!next.length)return;boat.boarding=next;boat.manifest=[];begin(app,'boarding');
 }
 if(boat.status==='boarding'){
  if(ga.status==='waiting'){
   ga.status='boarding';ga.route=0;
  }
  if(ga.status==='boarding'){
   if(follow(app,g.id,crewRoute(),slice))aboard(b,g.id,60);return;
  }
  for(const [i,id]of boat.boarding.entries()){
   const a=m.actors[id];if(a.status==='aboard')continue;
   if(a.status==='waiting'){a.status='boarding';a.route=0;}
   if(follow(app,id,residentRoute(i),slice))aboard(b,id,-20+i*40);return;
  }
  if(boat.boarding.every(id=>m.actors[id].status==='aboard')){boat.leg++;begin(app,'outbound');V.slot(app,'s30-crossing-start:'+boat.leg,{passengers:boat.boarding.slice(),source:'s30-west-dock',target:'s30-east-dock'});}
 }else if(boat.status==='outbound'&&moveBoat(app,7040,slice)){
  for(const id of boat.manifest){const u=unit(b,id),a=m.actors[id];if(id===CREW[0])continue;delete u.carriedBy;a.status='disembarking';a.route=0;a.crossedLeg=boat.leg;}
  begin(app,'unboarding');
 }else if(boat.status==='unboarding'){
  const clear=boat.manifest.every(id=>{const u=unit(b,id);return alive(u)&&u.carriedBy!==ID&&u.x-u.r>7120&&supported(b,u);});
  if(clear){boat.manifest=[];begin(app,RESIDENTS.some(id=>m.actors[id].status==='waiting')?'returning':'east');}
 }else if(boat.status==='returning'&&moveBoat(app,6630,slice))begin(app,'west');
}
function hold(app){const b=app.engine.b,m=memory(b),h=m.hold,end=b.teamEnds?.[1]||0,at={x:5550,y:5470};if(!m.ready)return;
 const guarded=heroes(b).some(u=>Math.abs(u.y-at.y)<150&&Math.hypot(u.x-at.x,(u.y-at.y)*.75)<540),contested=threatened(b,at);
 if(!guarded||contested)h.continuous=false;
 if(end>h.lastEnemyEnd){if(h.continuous&&guarded&&!contested)h.progress=Math.min(3,h.progress+1);h.lastEnemyEnd=end;h.continuous=guarded&&!contested;app.dirty=true;}
 else if(b.side!==1&&guarded&&!contested)h.continuous=true;
 h.guarded=guarded;h.contested=contested;
 // A clear guarded interval is the outcome. In-game elapsed seconds alone
 // never advance defense, spawn budget, boarding, or rescue evidence.
}
function pressure(app){const e=app.engine,b=e.b,m=memory(b),spec=b.honroV4Stage30;if(!m.ready||paused(app))return;
 if(m.lastWaveSerial===serial(b))return;
 const eligible=new Set(['act3-response-30-0']);
 if(heroes(b).some(u=>u.x>4700))eligible.add('act3-response-30-1');
 if(m.hold.guarded)eligible.add('act3-ferry-hold');
 if(m.hold.progress>=3)eligible.add('act3-response-30-2');
 const holdEntry=spec.entries['act3-ferry-hold'],actions=[...spec.responses,{id:'act3-ferry-hold',action:{type:'spawn',source:'act3-ferry-hold',kind:'hound',n:holdEntry?.members?.length||3,act3Authored:true}}];
 for(const row of actions){if(!eligible.has(row.id))continue;const w=m.waves[row.id]??={warnSerial:serial(b),admitted:false};if(w.admitted)continue;
  V.slot(app,'s30-pressure:'+row.id,{source:row.id});if(serial(b)<=w.warnSerial||!app.actorBoundary||!safe(app))continue;
  const at=spec.entries[row.id];if(!at)continue;
  const choices=[at,...(at.alternates||[])],action={...row.action,source:row.id};
  if(e.alive(1).length+(action.n||3)>G.HonroEncounters.populationCap(b))continue;
  for(const spot of choices){const before=b.units.length;
   const ok=spot.members&&G.HonroEncounterDensity?.active(b)?G.HonroEncounterDensity.spawnMembers(app,{...action,n:spot.members.length},spot):G.HonroAllies.execute(app,{...action,source:'v4:'+row.id,x:spot.x,y:spot.y,support:spot.support,maxDistance:0});
   if(ok===false)continue;w.admitted=true;w.ids=b.units.slice(before).map(u=>u.id);w.serial=serial(b);m.lastWaveSerial=serial(b);app.dirty=true;e.emit?.('save');break;
  }
  // Preserve the shared one-event-per-actor-boundary response cadence.
  if(w.admitted)return;
 }
}
function defenseReady(b){const m=memory(b);return m.hold.progress>=3&&m.waves['act3-ferry-hold']?.admitted===true;}
function convoySafe(b){const m=memory(b);return m.rescued.length===RESIDENTS.length&&RESIDENTS.every(id=>{const u=unit(b,id),a=m.actors[id];return alive(u)&&a.status==='safe'&&a.disembarked&&a.crossedLeg>0&&u.carriedBy===undefined&&u.x>=7580&&supported(b,u)&&!threatened(b,u,280);})&&alive(unit(b,CREW[1]))&&['safe','escort'].includes(m.actors[CREW[1]].status);}
function failure(b){if(!active(b))return null;if([...CREW,...RESIDENTS].some(id=>!alive(unit(b,id))))return's30-protected-lost';const m=memory(b);if(!b.honroV4Stage30||!deck(b))return's30-transport-source-missing';if(m.boat.x<6550||m.boat.x>7130)return's30-transport-invalid';return null;}
function complete(b){return active(b)&&!failure(b)&&memory(b).ready&&defenseReady(b)&&convoySafe(b)&&memory(b).boat.status==='east';}
function use(app,marker){const b=app.engine.b;if(marker.id!=='s30-route-ready')return undefined;const m=memory(b),u=app.engine.active;if(!safe(app)||!alive(u)||u.side!==0||Math.hypot(u.x-marker.x,(u.y-marker.y)*.75)>260||Math.abs(u.y-marker.y)>150)return false;
 m.ready=true;V.slot(app,'s30-route-ready',{actor:u.id});const step=(b.honroV4Steps||b.honroAct23V4Steps||[]).find(s=>s.id===marker.id);if(step)V.completeStep(app,step,u);app.engine.finishAction?.();return true;
}
function stepSatisfied(b,step){if(step.id==='s30-route-ready')return memory(b).ready;if(step.id==='ferry-hold')return defenseReady(b);if(step.id==='s30-evacuate')return convoySafe(b)&&memory(b).boat.status==='east';return null;}
function state(b){const m=memory(b);return{transport:{...m.boat},rescued:m.rescued.slice(),defense:{...m.hold},convoySafe:convoySafe(b)};}
const attached=new WeakSet();
function attach(app,e){if(!active(e.b)||attached.has(e))return;attached.add(e);prepare(e.b);
 const S=G.HonroScene?.prototype;if(S&&!S.honroV4TransportTerrain){S.honroV4TransportTerrain=true;const terrain=S.terrain;S.terrain=function(c,t){if(active(this.battle)&&t.id===ID)return;return terrain.call(this,c,t);};}
 // Passenger damage remains real; only their unsupported ordinary gravity is
 // suppressed by the engine's established carriedBy contract.
 if(G.HonroStage30Ferry?.active(e.b)&&e.combatEnemies){const combat=e.combatEnemies.bind(e);e.combatEnemies=()=>{const all=combat(),rear=e.alive(1).filter(u=>u.honroFerryCell==='bank-rearguard'),engaged=rear.some(u=>u.aggroUntil>0&&u.aggroUntil>=e.b.round)||heroes(e.b).some(u=>u.y<5150&&!u.airborne&&!u.jumping&&upperSupports.has(e.contactSurface(u.x,u.y-4,u.y+5)?.t.id)&&rear.some(v=>Math.hypot(u.x-v.x,u.y-v.y)<1800));return engaged?all:all.filter(u=>u.honroFerryCell!=='bank-rearguard');};}
}
function tick(app,dt){const b=app.engine.b;if(!active(b)||paused(app))return;prepare(b);hold(app);pressure(app);evacuation(app,dt);}
function draw(scene,c,b){if(!active(b))return;const m=b.honroState?.act23v4?.stage30;if(m)scene.landmark(c,{id:ID,kind:'ferry',x:m.boat.x,y:m.boat.y+24,size:.6});}
const plugin={author,prepare,attach,tick,state,failure,complete,use,stepSatisfied,stepTick(){},draw,active,memory,evacuation,defenseReady,convoySafe,ids:{boat:ID,residents:RESIDENTS,crew:CREW}};
G.HonroAct23V4Stage30=plugin;V.register(30,plugin);
})(globalThis);
