(function(G){'use strict';
// Candidate city mechanics. Baseline geography, enemy rosters and split
// resources remain owned by the existing Act3 author.
const V=G.HonroAct23V4,C=G.HONRO_CORE,base=V.plugins.get(21),copy=x=>JSON.parse(JSON.stringify(x));
const IDS=[21,22,25,26,27,28],alive=V.alive,unit=(b,id)=>b.units.find(u=>u.id===id),mark=V.marker;
const memory=b=>V.mem(b).city??={version:1,actors:{},arrivals:{},pressure:{},proof:{}};
const serial=b=>b.honroState.actorTurnSerial||0;
const step=(id,kind,extra={})=>({id,label:id,kind,...extra});
function marker(map,id,p,extra={}){const q={id,type:'act3',action:'act3',label:id,...p,...extra},old=map.markers.find(q=>q.id===id);if(old)Object.assign(old,q);else map.markers.push(q);}
function steps(map,list){map.initialState.honroV4Steps=list;const keep=new Set(list.map(s=>s.id));for(const p of map.markers)if(p.action==='act3'&&!keep.has(p.id))delete p.action;}
function point(map,id){const p=map.markers.find(p=>p.id===id);if(!p)throw Error('v4.city.marker:'+id);return{x:p.x,y:p.y};}
function npc(map,id,p,extra={}){map.units.push({id,kind:'ally:guard',team:'npc',label:id,...p,stageOverrides:{fixed:true,honroV4Actor:true,honroProtected:true,honroAlly:true,honroCivilian:false,r:22,h:92,maxMove:600,moveLeft:600,walkSpeed:170,...extra}});}
function author(map,project){base.author(map,project);const n=map.metadata.stageId,init=map.initialState;
 if(n===21){
  // The old wagon-cordon roster contains no cart. This zero-XP work target
  // adds the missing cart without replacing any of the 26 combatants.
  const id='v4.gate-cart',p={x:1740,y:2640};marker(map,id,p);
  map.terrains.push({id,type:'solid',name:id,points:[{x:1710,y:2520},{x:1770,y:2520},{x:1770,y:2640},{x:1710,y:2640}],baseMaterial:'wood',breakable:true,layer:'terrain',properties:{hp:680,maxHp:680,honroV4Cart:true}});
  steps(map,[step(id,'destroy'),step('gate-resident','v4-city-rescue',{target:'act3-resident'}),step('refuge-hold','v4-city-safe'),step('city-exit','reach')]);
  init.honroV4CitySpec={resident:'act3-resident',guard:'v4.gwakjin',destination:{x:2600,y:2560},cart:id,localIds:map.units.filter(u=>u.team==='enemy'&&/^a3-21-(wagon-cordon|gate-watch)-/.test(u.id)).map(u=>u.id)};
 }
 if(n===22)init.honroV4CitySpec={cache:'v4.record-bundle',approachRadius:390};
 if(n===25||n===27){const list=init.honroV4Steps.filter(s=>n!==27||!['depot-route-ledger','family-manifest'].includes(s.id));for(const s of list)if(/^stake-arrival-/.test(s.id))Object.assign(s,{kind:'v4-city-arrival',allHeroes:true,radius:150,parallelGroup:'city-arrivals'});steps(map,list);if(n===27)init.honroV4MaterialEvidence=[];}
 if(n===26){const safe={x:5110,y:2150},resident=map.units.find(u=>u.id==='act3-resident');
  resident.stageOverrides={...resident.stageOverrides,fixed:true,honroProtected:true,honroHypnotized:true,maxMove:600,moveLeft:600,walkSpeed:170};
  // An attached visual/extraction actor owns no combat or XP budget. The
  // existing workshop enemies keep their original HP, position and rewards.
  map.units.push({id:'v4.workshop-spirit',kind:'resonance',team:'npc',x:resident.x+18,y:resident.y-105,label:'v4.workshop-spirit',stageOverrides:{fixed:true,honroVisualOnly:true,honroObjectiveTarget:true,honroAlly:false,honroCivilian:false,honroProtected:false,xpBudget:0,xpGranted:0,hp:1,maxHp:1,r:17,h:55,maxMove:0,moveLeft:0,walkSpeed:0,loadout:[]}});
  marker(map,'v4.workshop-safe',safe);marker(map,'artisan-resident',point(map,'artisan-resident'),{target:resident.id,spiritId:'v4.workshop-spirit'});
  steps(map,[step('hidden-latch','interact',{requiredClass:'knight',opens:'hidden-door'}),step('artisan-resident','v4-city-rescue',{target:resident.id,requiredClass:'occultist'}),step('v4.ancestor-testimony','evidence'),step('workshop-exit','reach',{allHeroes:true})]);
  delete map.markers.find(p=>p.id==='v4.ancestor-testimony').action;
  init.honroV4CitySpec={resident:resident.id,spirit:'v4.workshop-spirit',destination:safe,approachRadius:300,localIds:map.units.filter(u=>u.team==='enemy'&&/^a3-26-tally-store-remnants-/.test(u.id)).map(u=>u.id)};
 }
 if(n===28){const list=init.honroV4Steps;Object.assign(list.find(s=>s.id==='petition-record'),{requiredClass:'knight'});steps(map,list);
  // Put the injured resident behind Gwakjin's approach, so the escort never
  // has to pass through a civilian body to take the lead.
  const guard=map.units.find(u=>u.id==='v4.gwakjin');Object.assign(guard,{x:4350,y:2431.9444444444443});
  Object.assign(map.units.find(u=>u.id==='v4.fire-resident-2'),{x:3940,y:2380});
  npc(map,'v4.court-soldier-1',{x:6820,y:2590},{honroProtected:false});npc(map,'v4.court-soldier-2',{x:6900,y:2590},{honroProtected:false});
  init.honroV4CitySpec={residents:['v4.fire-resident-1','v4.fire-resident-2'],guard:'v4.gwakjin',destination:{x:6650,y:2590},cache:'petition-record',approachRadius:390};
 }
}
function prepare(b,profile){base.prepare(b,profile);memory(b);const spec=b.honroV4CitySpec;
 if(spec)for(const id of [spec.resident,spec.guard,...(spec.residents||[])].filter(Boolean)){const u=unit(b,id);if(!u)continue;u.fixed=true;u.honroProtected=true;u.maxMove=600;u.walkSpeed=u.walkSpeed||170;}
 if(spec?.guard&&unit(b,spec.guard))unit(b,spec.guard).honroCivilian=false;
}
function supported(b,u){return !!C.validTerrainContactPose(b.terrain,u);}
function threats(b,p,r=300){return b.units.filter(u=>alive(u)&&u.side===1&&!u.honroObjectiveTarget&&V.near(u,p,r));}
function overlap(u,p,v){return Math.max(0,Math.min(p.x+u.r,v.x+v.r)-Math.max(p.x-u.r,v.x-v.r))*Math.max(0,Math.min(p.y,v.y)-Math.max(p.y-u.h,v.y-v.h));}
function bodyBlocked(b,u,p){return b.units.some(v=>v!==u&&alive(v)&&!v.honroObjectiveTarget&&!v.honroVisualOnly&&overlap(u,p,v)>Math.max(.000001,overlap(u,u,v)));}
// A probe uses the production swept walk and gravity, then commits the legal
// pose. Serialized per-round travel prevents unlimited movement from ticks or
// from the ordinary ally scheduler refreshing a unit's moveLeft.
function walk(app,u,goal,dt){const e=app.engine,b=e.b;if(!alive(u)||!goal||!V.safe(app)||b.side!==0||b.phase!=='aim'||dt<=0)return false;
 const a=memory(b).actors[u.id]??={distance:0,spent:0,round:b.round,start:{x:u.x,y:u.y}};
 if(a.round!==b.round){a.round=b.round;a.spent=0;}
 if(V.near(u,goal,5)&&supported(b,u))return true;
 if(threats(b,u,240).length){a.blocked='threat';return false;}
 const dx=goal.x-u.x,budget=Math.max(0,600-a.spent);if(Math.abs(dx)<.01||budget<=.001)return false;
 const probe={...u,fixed:false,vx:0,vy:0,maxMove:600,moveLeft:budget,walkSpeed:170},slice=Math.min(dt,.025,Math.abs(dx)/170);
 e.walk(probe,Math.sign(dx),slice,true);e.integrateBody(probe,slice,true);
 const d=Math.hypot(probe.x-u.x,probe.y-u.y);
 if(!Number.isFinite(d)||d>budget+.001||!supported(b,probe)||bodyBlocked(b,u,probe)){a.blocked='body-or-terrain';return false;}
 if(d<.00001){a.blocked='terrain';return false;}
 Object.assign(u,{x:probe.x,y:probe.y,vx:0,vy:0,fixed:true,moveLeft:probe.moveLeft,facing:probe.facing,moving:.12,walkPhase:probe.walkPhase});
 a.distance+=d;a.spent+=d;delete a.blocked;app.dirty=true;return V.near(u,goal,5)&&supported(b,u);
}
function safeResident(b,id,goal){const a=memory(b).actors[id],u=unit(b,id);return alive(u)&&!!a?.safe&&a.distance>80&&V.near(u,goal,100)&&supported(b,u)&&!threats(b,u,240).length;}
function localClear(b){return (b.honroV4CitySpec?.localIds||[]).every(id=>!!unit(b,id)&&!alive(unit(b,id)));}
function cacheSafe(b){const q=b.honroV4CitySpec,p=mark(b,q?.cache);return !!p&&!threats(b,p,q.approachRadius||390).length;}
function eligibility(app,p,s){const b=app.engine.b,a=memory(b),q=b.honroV4CitySpec;
 if(b.honroStage===22&&s.id==='v4.record-bundle'&&!cacheSafe(b))return{ok:false,reason:'v4.city.cache-approach'};
 if(b.honroStage===28&&s.id==='petition-record'&&(!evacuationSafe(b)||!cacheSafe(b)))return{ok:false,reason:'v4.city.cache-approach'};
 if(s.kind==='v4-city-rescue'&&(!alive(unit(b,q.resident))||a.started))return{ok:false,reason:s.id};
 return base.eligibility?.(app,p,s);
}
function use(app,p,s){const b=app.engine.b,a=memory(b),q=b.honroV4CitySpec;
 if(b.honroStage===26&&p.id==='v4.ancestor-testimony')return false;
 if(s?.kind==='v4-city-rescue'){
  const resident=unit(b,q.resident);if(!alive(resident)||a.started)return false;
  if(q.spirit){const spirit=unit(b,q.spirit);if(app.engine.active.cls!=='occultist'||!spirit)return false;
   spirit.hp=0;spirit.dead=true;spirit.honroReleased=true;resident.honroHypnotized=false;
   a.proof.separation={actor:app.engine.active.id,spirit:spirit.id,resident:resident.id,serial:serial(b),at:{x:resident.x,y:resident.y}};
   V.slot(app,'26.spirit-separated',copy(a.proof.separation));
  }
  a.started=true;a.startedSerial=serial(b);app.engine.finishAction();app.dirty=true;return true;
 }
 return base.use(app,p,s);
}
function escort(app,dt){const b=app.engine.b,a=memory(b),q=b.honroV4CitySpec,root=V.mem(b),n=b.honroStage;
 if(n===28&&!(root.done['fire-screen']&&root.done['water-release']&&root.done['party-reunion']))return;
 if(n!==28&&!a.started)return;
 const ids=q.residents||[q.resident],resident=unit(b,ids[0]),guard=q.guard&&unit(b,q.guard);if(!alive(resident)||q.guard&&!alive(guard))return;
 if(guard&&!a.proof.pickup){
  const p={x:resident.x+75,y:resident.y};walk(app,guard,p,dt);
  if(V.near(guard,p,10)&&supported(b,guard)&&!threats(b,resident,240).length)a.proof.pickup={guard:guard.id,resident:resident.id,serial:serial(b),at:{x:guard.x,y:guard.y}};
  return;
 }
 const lead=guard||V.heroes(b).find(h=>V.near(h,resident,700));if(!lead)return;
 if(guard)walk(app,guard,{x:q.destination.x+90,y:q.destination.y},dt);
 for(const [i,id]of ids.entries()){
  const u=unit(b,id),goal={x:q.destination.x-i*75,y:q.destination.y},ahead=i?unit(b,ids[i-1]):guard;
  if(ahead&&(ahead.x-u.x<65||Math.abs(ahead.y-u.y)>220))continue;
  if(walk(app,u,goal,dt)){const actor=a.actors[id];actor.safe=true;u.honroResolved=true;}
 }
 if(n===28){root.evacuationSafe=evacuationSafe(b);return;}
 if(safeResident(b,q.resident,q.destination)&&(n!==26||localClear(b))){
  V.completeStep(app,V.steps(b).find(s=>s.id===(n===21?'gate-resident':'artisan-resident')));
  const reader=n===26&&V.heroes(b).find(u=>u.cls==='knight'&&V.near(u,resident,360));
  if(reader&&!a.proof.testimony){a.proof.testimony={actorId:reader.id,source:'v4.ancestor-testimony',resident:q.resident,separation:copy(a.proof.separation),safe:{x:resident.x,y:resident.y},distance:a.actors[resident.id].distance};V.slot(app,'26.ancestor-testimony',copy(a.proof.testimony));}
 }
}
function evacuationSafe(b){const q=b.honroV4CitySpec,a=memory(b);return !!q&&!!a.proof.pickup&&q.residents?.every((id,i)=>safeResident(b,id,{x:q.destination.x-i*75,y:q.destination.y}))&&alive(unit(b,q.guard))&&(a.actors[q.guard]?.distance||0)>100&&V.near(unit(b,q.guard),{x:q.destination.x+90,y:q.destination.y},100);}
function pressure(app){const b=app.engine.b,a=memory(b),p=a.pressure;if(!a.started||p.admitted)return;
 if(p.warnSerial===undefined){p.warnSerial=serial(b);V.slot(app,'21.refuge-pressure',{source:'v4.city.refuge-pressure',count:2});return;}
 if(!app.actorBoundary||serial(b)<=p.warnSerial)return;
 const at=mark(b,'wave-refuge-hold'),before=new Set(b.units.map(u=>u.id));if(!at)return;
 if(G.HonroAllies.execute(app,{type:'spawn',kind:'hound',n:2,x:at.x,y:at.y,spacing:130,maxDistance:500,source:'v4.city.refuge-pressure'})===false)return;
 p.ids=b.units.filter(u=>!before.has(u.id)).map(u=>u.id);if(p.ids.length===2){p.admitted=true;p.serial=serial(b);}
}
function arrivals(app){const b=app.engine.b,a=memory(b),team=V.heroes(b),list=V.steps(b),first=list.findIndex(s=>s.kind==='v4-city-arrival');if(team.length!==2||!list.slice(0,first).every(s=>V.satisfied(b,s)))return;
 let changed=false;for(const s of list.filter(s=>s.kind==='v4-city-arrival')){
  const p=mark(b,s.id);if(a.arrivals[s.id]||!team.every(u=>supported(b,u)&&V.near(u,p,150)))continue;
  a.arrivals[s.id]={actors:team.map(u=>({id:u.id,cls:u.cls,x:u.x,y:u.y})),round:b.round,serial:serial(b)};
  V.completeStep(app,s);changed=true;app.dirty=true;
 }
 // The existing shared safe checkpoint also owns this destination's actual
 // receipt; a retry must not replace it with the monotonic traversal index.
 if(changed)G.HonroStakeCrossing.takeCheckpoint(b);
}
function tick(app,dt){const b=app.engine.b,n=b.honroStage;
 // Stage28's baseline tick moves the same actors with an unlimited legacy
 // escort. Keep its fire clock here, and use exactly one physical mover.
 if(n!==28)base.tick(app,dt);
 else {const root=V.mem(b);if(!(root.done['fire-screen']&&root.done['water-release']))root.fireTurns=Math.max(0,(b.teamEnds?.[1]||0)-root.fireStartEnd);}
 if(!V.safe(app)||b.side!==0||b.phase!=='aim')return;
 if(n===25||n===27){arrivals(app);return;}
 if(n===21){escort(app,dt);pressure(app);}
 if(n===26)escort(app,dt);
 if(n===28)escort(app,dt);
}
function stepSatisfied(b,s){const n=b.honroStage,a=memory(b),q=b.honroV4CitySpec;
 if(s.kind==='v4-city-arrival')return !!a.arrivals[s.id];
 if(n===25&&s.id==='household-tally')return V.steps(b).filter(q=>q.kind==='v4-city-arrival').every(q=>!!a.arrivals[q.id]);
 if(s.kind==='v4-city-rescue')return safeResident(b,q.resident,q.destination)&&(!q.spirit||!!a.proof.separation&&localClear(b));
 if(n===21&&s.id==='refuge-hold')return safeResident(b,q.resident,q.destination)&&!!a.pressure.admitted&&(a.pressure.ids||[]).every(id=>!!unit(b,id)&&!alive(unit(b,id)))&&localClear(b);
 if(n===26&&s.id==='v4.ancestor-testimony')return !!a.proof.testimony;
 return base.stepSatisfied(b,s);
}
function failure(b){const q=b.honroV4CitySpec;if(q&&[q.resident,...(q.residents||[])].filter(Boolean).some(id=>!alive(unit(b,id))))return 'v4.city.resident-lost';if(b.honroStage===28){const root=V.mem(b);if(!(root.done['fire-screen']&&root.done['water-release'])&&(b.teamEnds?.[1]||0)-root.fireStartEnd>=12)return 'v4.28.fire';}return base.failure(b);}
function complete(b){if(b.honroStage===21)return stepSatisfied(b,{id:'refuge-hold'});if(b.honroStage===26)return !!memory(b).proof.testimony&&safeResident(b,b.honroV4CitySpec.resident,b.honroV4CitySpec.destination);if(b.honroStage===28)return evacuationSafe(b);return base.complete(b);}
function state(b){if(V.current(b)?.kind==='v4-city-arrival')return{targets:V.steps(b).filter(s=>s.kind==='v4-city-arrival'&&!V.mem(b).done[s.id]).map(s=>({...mark(b,s.id),kind:'exit',label:s.id}))};return base.state?.(b)||{};}
const plugin={...base,author,prepare,eligibility,use,tick,stepSatisfied,failure,complete,state};for(const id of IDS)V.register(id,plugin);
G.HonroAct23V4City={...plugin,base,memory,walk,escort,arrivals,cacheSafe,evacuationSafe,ids:IDS};
})(globalThis);
