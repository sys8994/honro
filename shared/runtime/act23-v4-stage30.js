(function(G){'use strict';
const V=G.HonroAct23V4,C=G.HONRO_CORE;
if(!V)return;
const ID='s30-boat',CREW=['s30-yeonsil','s30-gwakjin'],RESIDENTS=['s30-resident-1','s30-resident-2','s30-resident-3','s30-resident-4'];
const SOLDIERS=['v4.gate-soldier-1','v4.gate-soldier-2'],INJURED=RESIDENTS[0],SEAMAN=RESIDENTS[3];
const SOURCES=['act3-response-30-0','act3-response-30-1','act3-ferry-hold','act3-response-30-2'];
const TESTIMONY='s30-seaman-testimony',COMPARISON='s30-map-comparison';
const upperSupports=new Set(['sf-granite-cape','sf-cape-east-descent','sf-cape-bank-link','sf-bank-inner','sf-high-response-ledge','sf-east-outer-grade','sf-old-road-west-rise','sf-old-road-west-bridge','sf-old-road-gather','sf-old-road-return-flight','sf-old-road-upper-flight']);
const active=b=>b?.honroStage===30&&!b.honroCustom&&b.honroAct23V4Revision===1;
const alive=u=>!!u&&!u.dead&&u.hp>0;
const unit=(b,id)=>b.units.find(u=>u.id===id);
const heroes=b=>b.units.filter(u=>alive(u)&&u.side===0&&!u.summoned&&!u.enthrall);
const copy=x=>JSON.parse(JSON.stringify(x));
const serial=b=>b.honroState.actorTurnSerial||0;
function memory(b){const m=V.mem(b).stage30??={version:2,ready:false,boat:{id:ID,status:'west',x:6630,y:6560,leg:0,manifest:[],distance:0},actors:{},rescued:[],waves:{},hold:{progress:0},blocked:[]};m.consumedActions??={};return m;}
function ramp(id,points){return{id,type:'solid',name:id,points:points.map(([x,y])=>({x,y})),baseMaterial:'wood',breakable:false,layer:'terrain',oneWay:true,properties:{hp:99999,maxHp:99999,honroWalkEdges:[0],honroV4Transport:true}};}
function authoredY(map,support,x){const t=map.terrains.find(t=>t.id===support);for(const edge of t?.properties?.honroWalkEdges||[]){const a=t.points[edge],z=t.points[(edge+1)%t.points.length];if(z.x>a.x&&x>=a.x&&x<=z.x)return a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);}throw Error('s30-support:'+support+':'+x);}
function author(map){
 const initial=map.initialState??={};
 initial.honroV4Stage30={version:2,waterId:'sf-main-river',sourceDock:'s30-west-dock',targetDock:'s30-east-dock',deck:ID,source:{x:6630,y:6560},target:{x:7040,y:6560},capacity:2,residents:RESIDENTS,crew:CREW,soldiers:SOLDIERS,injured:INJURED,seaman:SEAMAN,
  responses:(map.events||[]).filter(e=>/^act3-response-30-[012]$/.test(e.id)).map(e=>({id:e.id,action:copy(e.action)})),entries:copy(initial.honroFerrySpec?.entries||{})};
 // Keep the existing finite source budgets, kinds and elite roles. The entry
 // supports now guard the actual boarding corridor; unrelated map enemies
 // remain outside the convoy's required threat set.
 const waveXs=[[5530,5650,5780,5910],[5500,5610,5720,5830,5960],[5320,5430,5550],[5520,5650,5790,5940]];
 for(const [i,id]of SOURCES.entries()){
  const old=initial.honroV4Stage30.entries[id],support='sf-west-ford';if(!old)continue;
  const make=shift=>{const members=(old.members||[]).map((u,j)=>({...u,x:waveXs[i][j]+shift,y:authoredY(map,support,waveXs[i][j]+shift),support}));return{...old,x:members[0]?.x,y:members[0]?.y,support,members,alternates:[]};};
  initial.honroV4Stage30.entries[id]={...make(0),alternates:[make(-190)]};
 }
 const west=ramp('s30-west-dock',[[6400,6426.666666666667],[6460,6440],[6550,6560],[6550,6580],[6460,6460],[6400,6446.666666666667]]);west.properties.honroWalkEdges=[0,1];
 const east=ramp('s30-east-dock',[[7120,6560],[7210,6440],[7250,6440],[7250,6460],[7210,6460],[7120,6580]]);east.properties.honroWalkEdges=[0,1];
 const add=[west,east,ramp(ID,[[6550,6560],[6710,6560],[6710,6580],[6550,6580]])];
 map.terrains=map.terrains.filter(t=>!add.some(a=>a.id===t.id)).concat(add);
 map.units=map.units.filter(u=>!RESIDENTS.includes(u.id)&&!CREW.includes(u.id)&&!SOLDIERS.includes(u.id));
 for(const [i,id]of RESIDENTS.entries()){
  const x=6250-i*62,y=x>=6140?6260+(x-6140)*160/230:6110+(x-6020)*150/120;
  map.units.push({id,kind:'object:civilian',team:'npc',x,y,label:id,stageOverrides:{name:id,honroProtected:true,honroCivilian:true,honroAlly:false,fixed:true,r:17,h:86,maxMove:0,moveLeft:0,walkSpeed:id===INJURED?110:125,honroV4RescueRole:id===INJURED?'injured':id===SEAMAN?'seaman':'resident',...(i<2?{honroV4OriginActor:'v4.fire-resident-'+(i+1)}:{})}});
 }
 map.units.push({id:CREW[0],kind:'object:civilian',team:'npc',x:6570,y:6560,label:CREW[0],stageOverrides:{name:CREW[0],honroProtected:true,honroCivilian:true,honroAlly:false,fixed:true,r:17,h:86,carriedBy:ID}},
  {id:CREW[1],kind:'ally:guard',team:'npc',x:6320,y:6385.22,label:CREW[1],stageOverrides:{name:CREW[1],honroProtected:true,honroCivilian:false,honroAlly:false,fixed:true,r:17,h:90,walkSpeed:145}});
 for(const [i,id]of SOLDIERS.entries()){const x=i?7980:5250,support=i?'sf-east-recovery-shore':'sf-west-ford';map.units.push({id,kind:'ally:guard',team:'ally',x,y:authoredY(map,support,x),label:id,stageOverrides:{name:id,fixed:true,allyRole:'channeler',honroV4CurrentMilitary:true,honroProtected:false,honroCivilian:false}});}
 initial.honroV4Steps=[{id:'s30-route-ready',kind:'evidence',label:'s30-route-ready'},
  {id:'ferry-hold',kind:'evidence',label:'ferry-hold'},{id:'s30-evacuate',kind:'evidence',label:'s30-evacuate'},
  {id:TESTIMONY,kind:'v4-slot',slot:TESTIMONY,target:SEAMAN,label:TESTIMONY},{id:COMPARISON,kind:'v4-slot',slot:COMPARISON,target:SEAMAN,label:COMPARISON},
  {id:'old-road',kind:'reach',label:'old-road',allHeroes:true,radius:440}];
 map.markers=map.markers.filter(m=>m.id!=='transport-map'&&!['s30-route-ready','s30-evacuate',TESTIMONY,COMPARISON].includes(m.id));
 map.markers.push({id:'s30-route-ready',type:'act3',x:5900,y:authoredY(map,'sf-west-ford',5900),label:'s30-route-ready'},
  {id:'s30-evacuate',type:'act3',x:6410,y:6435.56,label:'s30-evacuate'},
  ...[TESTIMONY,COMPARISON].map(id=>({id,type:'act3',action:'act3',target:SEAMAN,x:7620,y:authoredY(map,'sf-east-recovery-shore',7620),label:id})));
 const defense=map.markers.find(m=>m.id==='ferry-hold');if(defense)Object.assign(defense,{x:5960,y:authoredY(map,'sf-west-ford',5960)});
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
function blocked(b,u,p){return b.units.some(v=>v!==u&&alive(v)&&!v.honroObjectiveTarget&&v.carriedBy!==ID&&!(u.id===CREW[1]&&memory(b).actors[u.id]?.status==='returning-to-boat'&&RESIDENTS.includes(v.id)&&memory(b).actors[v.id]?.status==='safe')&&Math.abs(v.x-p.x)<u.r+v.r+3&&p.y>v.y-v.h+2&&p.y-u.h<v.y-2);}
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
function residentRoute(index){return[{x:6400},{x:6550},{x:6650-index*40}];}
function shoreRoute(b,id){const i=RESIDENTS.indexOf(id),refuges=[7800,7740,7645,7585];return[{x:7120},{x:7230},{x:7400},{x:i<0?(memory(b).boat.leg===1?7890:7700):refuges[i]}];}
function moveBoat(app,to,dt){const b=app.engine.b,m=memory(b),boat=m.boat;
 const dx=Math.sign(to-boat.x)*Math.min(Math.abs(to-boat.x),(boat.status==='returning'?180:90)*Math.min(dt,.05)),next=boat.x+dx;
 // The authored hull remains in the existing water. Other actors or shots in
 // its swept body stop motion; they cannot be carried accidentally.
 const left=Math.min(boat.x,next)-80,right=Math.max(boat.x,next)+80;
 if(b.units.some(u=>alive(u)&&u.carriedBy!==ID&&u.x+u.r>left&&u.x-u.r<right&&u.y>boat.y-95&&u.y-u.h<boat.y+20))return false;
 boat.x=next;boat.distance+=Math.abs(dx);positionDeck(b);syncPassengers(b);app.dirty=true;return Math.abs(to-boat.x)<.001;
}
function begin(app,status){const b=app.engine.b,m=memory(b);m.boat.status=status;app.dirty=true;app.engine.emit?.('save');}
function evacuation(app,dt){const e=app.engine,b=e.b,m=memory(b),boat=m.boat;if(!m.ready||!safe(app)||dt<=0||failure(b))return;
 const g=unit(b,CREW[1]),ga=m.actors[CREW[1]],slice=Math.min(dt,.05);
 // Gwakjin escorts the first landing before physically walking back onto the
 // same deck, returning with Yeonsil and rejoining the remaining west group.
 if(ga.status==='disembarking'||ga.status==='escort'){
  const front=unit(b,boat.boarding?.[0]),frontState=m.actors[front?.id];ga.status='escort';
  if((frontState?.status==='safe'||front&&g.x-front.x<65)&&follow(app,g.id,shoreRoute(b,g.id),slice))ga.status='safe';
 }
 if(ga.status==='returning-to-boat'){
  if(follow(app,g.id,[{x:7400},{x:7230},{x:7120},{x:7100}],slice)&&aboard(b,g.id,60))begin(app,'returning');
 }else if(ga.status==='rejoining'){
  const remaining=RESIDENTS.find(id=>m.actors[id].status==='waiting'),last=unit(b,remaining);
  if(last&&follow(app,g.id,[{x:6550},{x:6460},{x:6400},{x:last.x+44}],slice)&&Math.abs(g.y-last.y)<150&&supported(b,g)){
   m.secondGroupRejoined={actorId:g.id,residents:RESIDENTS.filter(id=>m.actors[id].status==='waiting'),x:g.x,y:g.y,trip:boat.leg};ga.status='waiting';ga.route=0;begin(app,'west');
  }
 }
 for(const id of RESIDENTS){const a=m.actors[id],u=unit(b,id);if(!['disembarking','escort'].includes(a.status))continue;
  if(!alive(g)||g.x-u.x<45||Math.abs(g.y-u.y)>700)continue;
  a.status='escort';const route=shoreRoute(b,id);if(follow(app,id,route,slice)&&supported(b,u)&&!blocked(b,u,u)&&!threatened(b,u,280)){
   a.status='safe';a.disembarked=true;u.honroResolved=true;if(!m.rescued.includes(id))m.rescued.push(id);V.slot(app,'s30-resident-safe:'+id,{actor:id,dock:'s30-east-dock'});e.emit?.('save');
  }
 }
 if(boat.status==='west'){
  if(!boardingCorridorSafe(b))return;
  if(boat.leg===0&&!heroes(b).some(u=>supported(b,u)&&Math.abs(u.y-6426.666666666667)<=250&&Math.hypot(u.x-6400,(u.y-6426.666666666667)*.75)<=700))return;
  if(boat.leg===1&&!m.secondGroupRejoined)return;
  const next=RESIDENTS.filter(id=>m.actors[id].status==='waiting').slice(0,2);
  if(!next.length)return;boat.boarding=next;boat.manifest=[];if(boat.leg===1)m.secondBoardingStarted=true;begin(app,'boarding');
 }
 if(boat.status==='boarding'){
  if(ga.status==='waiting'){
   ga.status='approaching-group';ga.route=0;
  }
  const frontId=boat.boarding[0],front=unit(b,frontId),frontState=m.actors[frontId];
  if(ga.status==='approaching-group'){
   if(!follow(app,g.id,[{x:front.x+44}],slice))return;
   ga.status='boarding';ga.route=0;ga.assisting=frontId;
  }
  if(ga.status==='boarding'&&(frontState.status==='aboard'||g.x-front.x<55)){
   if(follow(app,g.id,crewRoute(),slice))aboard(b,g.id,60);
  }
  for(const [i,id]of boat.boarding.entries()){
   const a=m.actors[id];if(a.status==='aboard')continue;
   if(i===0&&g.x-unit(b,id).x<38)return;
   if(a.status==='waiting'){a.status='boarding';a.route=0;}
   if(follow(app,id,residentRoute(i),slice))aboard(b,id,20-i*40);return;
  }
  if(ga.status==='aboard'&&boat.boarding.every(id=>m.actors[id].status==='aboard')&&boardingCorridorSafe(b)){boat.leg++;begin(app,'outbound');V.slot(app,'s30-crossing-start:'+boat.leg,{passengers:boat.boarding.slice(),source:'s30-west-dock',target:'s30-east-dock'});}
 }else if(boat.status==='outbound'&&moveBoat(app,7040,slice)){
  for(const id of boat.manifest){const u=unit(b,id),a=m.actors[id];if(id===CREW[0])continue;delete u.carriedBy;a.status='disembarking';a.route=0;a.crossedLeg=boat.leg;}
  boat.landing=boat.manifest.slice();boat.manifest=[];begin(app,'unboarding');
 }else if(boat.status==='unboarding'){
  if(boat.boarding.every(id=>m.actors[id].status==='safe')&&ga.status==='safe'){
   if(RESIDENTS.some(id=>m.actors[id].status==='waiting')){ga.status='returning-to-boat';ga.route=0;begin(app,'collecting-escort');}
   else begin(app,'east');
  }
 }else if(boat.status==='returning'&&moveBoat(app,6630,slice)){
  delete g.carriedBy;boat.manifest=[];ga.status='rejoining';ga.route=0;begin(app,'west-rejoin');
 }
}
function boardingCorridorSafe(b){return[{x:6020,y:6110},{x:6180,y:6287.83},{x:6400,y:6426.67},{x:6550,y:6560}].every(p=>!threatened(b,p,280));}
function waveResolved(b,id){const m=memory(b),w=m.waves[id],expected=b.honroV4Stage30?.entries?.[id]?.members?.length;return !!w?.admitted&&expected>0&&w.ids?.length===expected&&w.ids.every(id=>{const u=unit(b,id);return !!u&&(!alive(u)||u.side!==1||u.honroSubdued===true);});}
function allWavesResolved(b){return SOURCES.every(id=>waveResolved(b,id));}
function hold(app){const b=app.engine.b,m=memory(b);m.hold.resolved=SOURCES.filter(id=>waveResolved(b,id));m.hold.progress=m.hold.resolved.length;m.hold.contested=!boardingCorridorSafe(b);if(waveResolved(b,SOURCES[0])&&!m.hold.contested)m.ready=true;}
function offer(app){const e=app.engine,b=e.b,u=e.active;if(!safe(app)||!alive(u)||u.side!==0||u.summoned||u.enthrall||u.acted)return;
 for(const w of Object.values(memory(b).waves))if(!w.admitted){w.offered??={};w.offered[u.id]=serial(b);}
}
function endedAction(app){const b=app.engine.b,m=memory(b),action=m.actionInFlight,u=action&&unit(b,action.id);if(!action||!u?.acted)return;
 const token=action.id+':'+action.round+':'+action.startSerial;
 for(const id of action.sources){const w=m.waves[id];if(w&&!w.admitted)w.opportunity={token,actorId:action.id,round:action.round,serial:serial(b)};}
 delete m.actionInFlight;app.engine.emit?.('save');
}
function pressure(app){const e=app.engine,b=e.b,m=memory(b),spec=b.honroV4Stage30;if(paused(app))return;endedAction(app);
 const eligible=new Set();
 if(heroes(b).some(u=>u.x>4600))eligible.add(SOURCES[0]);
 if(m.boat.leg>=1){eligible.add(SOURCES[1]);eligible.add(SOURCES[2]);}
 if(m.secondBoardingStarted||m.boat.leg>=2)eligible.add(SOURCES[3]);
 const holdEntry=spec.entries['act3-ferry-hold'],actions=[...spec.responses,{id:'act3-ferry-hold',action:{type:'spawn',source:'act3-ferry-hold',kind:'hound',n:holdEntry?.members?.length||3,act3Authored:true}}];
 for(const row of actions){if(!eligible.has(row.id))continue;const w=m.waves[row.id]??={warnSerial:serial(b),admitted:false,offered:{}};if(w.admitted)continue;
  V.slot(app,'s30-pressure:'+row.id,{source:row.id});offer(app);const opportunity=w.opportunity;
  // A real offered hero action is remembered across review, summons and team
  // transitions. Admission consumes it at the next safe aim, without relying
  // on actorBoundary still being on the stack (including one surviving hero).
  if(!opportunity||m.consumedActions[opportunity.token]||!safe(app))continue;
  const at=spec.entries[row.id];if(!at)continue;
  const choices=[at,...(at.alternates||[])],action={...row.action,source:row.id};
  if(e.alive(1).length+(action.n||3)>G.HonroEncounters.populationCap(b))continue;
  for(const spot of choices){const before=b.units.length;
   const ok=spot.members&&G.HonroEncounterDensity?.active(b)?G.HonroEncounterDensity.spawnMembers(app,{...action,n:spot.members.length},spot):G.HonroAllies.execute(app,{...action,source:'v4:'+row.id,x:spot.x,y:spot.y,support:spot.support,maxDistance:0});
   if(ok===false)continue;w.admitted=true;w.ids=b.units.slice(before).map(u=>u.id);w.serial=serial(b);w.actionToken=opportunity.token;m.consumedActions[opportunity.token]=row.id;app.dirty=true;e.emit?.('save');break;
  }
  // Preserve the shared one-event-per-actor-boundary response cadence.
  if(w.admitted)return;
 }
}
function defenseReady(b){return memory(b).ready&&allWavesResolved(b)&&boardingCorridorSafe(b);}
function convoySafe(b){const m=memory(b),g=unit(b,CREW[1]);return m.rescued.length===RESIDENTS.length&&RESIDENTS.every(id=>{const u=unit(b,id),a=m.actors[id];return alive(u)&&a.status==='safe'&&a.disembarked&&a.crossedLeg>0&&u.carriedBy===undefined&&u.x>=7580&&supported(b,u)&&!threatened(b,u,280);})&&alive(g)&&g.carriedBy===undefined&&g.x>=7580&&supported(b,g)&&!threatened(b,g,280)&&m.actors[CREW[1]].status==='safe';}
function failure(b){if(!active(b))return null;if(b.honroV4Stage30?.version!==2)return's30-transport-restart-required';if([...CREW,...RESIDENTS].some(id=>!alive(unit(b,id))))return's30-protected-lost';const m=memory(b);if(!deck(b))return's30-transport-source-missing';if(m.boat.x<6550||m.boat.x>7130)return's30-transport-invalid';return null;}
function rescueComplete(b){const m=memory(b),y=unit(b,CREW[0]);return !failure(b)&&defenseReady(b)&&convoySafe(b)&&m.boat.status==='east'&&Math.abs(m.boat.x-7040)<.01&&m.boat.y===6560&&!m.boat.manifest.length&&alive(y)&&y.carriedBy===ID&&Math.abs(y.x-(m.boat.x-60))<.01&&y.y===m.boat.y&&m.secondGroupRejoined?.trip===1;}
function complete(b){return active(b)&&rescueComplete(b)&&memory(b).testimony===true&&memory(b).comparison===true&&V.mem(b).sceneDone[TESTIMONY]===true&&V.mem(b).sceneDone[COMPARISON]===true;}
function postRescue(app){const b=app.engine.b;if(!rescueComplete(b))return;const m=memory(b),sailor=unit(b,SEAMAN);if(!alive(sailor)||sailor.honroV4RescueRole!=='seaman')return;
 V.slot(app,TESTIMONY,{actorId:SEAMAN,source:'s30-rescue-complete',factIds:['past-west-estuary-thirteen','two-children','present-status-unknown']});
 if(m.testimony&&V.mem(b).sceneDone[TESTIMONY])V.slot(app,COMPARISON,{actorId:SEAMAN,source:TESTIMONY,evidenceIds:['existing-transport-map','existing-hongman-ledger','present-waterway']});
}
function use(app,marker){const b=app.engine.b;if(![TESTIMONY,COMPARISON].includes(marker.id))return marker.id==='s30-route-ready'?false:undefined;
 const m=memory(b),u=app.engine.active,sailor=unit(b,SEAMAN),root=V.mem(b);if(!safe(app)||!rescueComplete(b)||!alive(u)||u.side!==0||!alive(sailor)||sailor.honroV4RescueRole!=='seaman'||!V.near(u,sailor,260)||root.slots[marker.id]?.status!=='pending'||(marker.id===COMPARISON&&!m.testimony))return false;
 if(!V.ackSlot(b,marker.id,{phaseA:true,actorId:sailor.id,leg:m.actors[SEAMAN].crossedLeg,disembarked:m.actors[SEAMAN].disembarked,allWavesResolved:true}))return false;
 m[marker.id===TESTIMONY?'testimony':'comparison']=true;const step=(b.honroV4Steps||[]).find(s=>s.id===marker.id);if(step)V.completeStep(app,step,u);app.engine.finishAction?.();return true;
}
function stepSatisfied(b,step){if(step.id==='s30-route-ready')return memory(b).ready;if(step.id==='ferry-hold')return defenseReady(b);if(step.id==='s30-evacuate')return rescueComplete(b);if(step.id===TESTIMONY)return memory(b).testimony===true&&V.mem(b).sceneDone[TESTIMONY]===true;if(step.id===COMPARISON)return memory(b).comparison===true&&V.mem(b).sceneDone[COMPARISON]===true;return null;}
function state(b){const m=memory(b);return{transport:{...m.boat},rescued:m.rescued.slice(),defense:{...m.hold},convoySafe:convoySafe(b)};}
const attached=new WeakSet();
function attach(app,e){if(!active(e.b)||attached.has(e))return;attached.add(e);prepare(e.b);
 const can=e.canAct.bind(e);e.canAct=function(){const ok=can();if(ok)offer(app);return ok;};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const b=e.b,m=memory(b),u=e.active;
  if(alive(u)&&u.side===0&&!u.summoned&&!u.enthrall&&!u.acted&&!m.actionInFlight){const sources=Object.entries(m.waves).filter(([,w])=>!w.admitted&&w.offered?.[u.id]!==undefined).map(([id])=>id);if(sources.length)m.actionInFlight={id:u.id,round:b.round,startSerial:serial(b),sources};}
  const result=finish(...args);endedAction(app);return result;
 };
 const S=G.HonroScene?.prototype;if(S&&!S.honroV4TransportTerrain){S.honroV4TransportTerrain=true;const terrain=S.terrain;S.terrain=function(c,t){if(active(this.battle)&&t.id===ID)return;return terrain.call(this,c,t);};}
 // Passenger damage remains real; only their unsupported ordinary gravity is
 // suppressed by the engine's established carriedBy contract.
 if(G.HonroStage30Ferry?.active(e.b)&&e.combatEnemies){const combat=e.combatEnemies.bind(e);e.combatEnemies=()=>{const all=combat(),rear=e.alive(1).filter(u=>u.honroFerryCell==='bank-rearguard'),engaged=rear.some(u=>u.aggroUntil>0&&u.aggroUntil>=e.b.round)||heroes(e.b).some(u=>u.y<5150&&!u.airborne&&!u.jumping&&upperSupports.has(e.contactSurface(u.x,u.y-4,u.y+5)?.t.id)&&rear.some(v=>Math.hypot(u.x-v.x,u.y-v.y)<1800));return engaged?all:all.filter(u=>u.honroFerryCell!=='bank-rearguard');};}
}
function tick(app,dt){const b=app.engine.b;if(!active(b)||paused(app))return;prepare(b);pressure(app);hold(app);evacuation(app,dt);postRescue(app);}
function draw(scene,c,b){if(!active(b))return;const m=b.honroState?.act23v4?.stage30;if(!m)return;scene.landmark(c,{id:ID,kind:'ferry',x:m.boat.x,y:m.boat.y+22.5,size:1.25});
 for(const[id,w]of Object.entries(m.waves)){if(w.admitted)continue;const at=b.honroV4Stage30.entries[id];if(!at)continue;c.save();c.strokeStyle='#c9b18a';c.lineWidth=3;c.globalAlpha=.55+Math.sin((scene.time||0)*4)*.2;c.beginPath();c.ellipse(at.x,at.y-32,52,25,0,0,Math.PI*2);c.stroke();c.restore();}
}
const plugin={author,prepare,attach,tick,state,failure,complete,use,stepSatisfied,stepTick(){},draw,active,memory,evacuation,defenseReady,convoySafe,rescueComplete,boardingCorridorSafe,allWavesResolved,waveResolved,ids:{boat:ID,residents:RESIDENTS,crew:CREW,soldiers:SOLDIERS,injured:INJURED,seaman:SEAMAN,sources:SOURCES,testimony:TESTIMONY,comparison:COMPARISON}};
G.HonroAct23V4Stage30=plugin;V.register(30,plugin);
})(globalThis);
