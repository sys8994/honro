(function(G){'use strict';
// Chapter21 owns physical evidence only. Existing city escort, finite pressure,
// NPC budgets, protected HP and combat rosters remain authoritative.
const V=G.HonroAct23V4,C=G.HONRO_CORE,City=G.HonroAct23V4City,base=V.plugins.get(21),copy=x=>JSON.parse(JSON.stringify(x));
const unit=(b,id)=>b.units.find(u=>u.id===id),alive=V.alive;
const enabled=()=>G.HonroAct23V4Chapter21Reviewed?.enabled()===true;
const active=b=>enabled()&&V.active(b)&&b.honroStage===21&&b.honroV4Chapter21?.revision===1;
const memory=b=>V.mem(b).chapter21??={version:1,events:{},proof:{},armor:{distance:0},wheel:0};
const grounded=(b,u)=>alive(u)&&C.validTerrainContactPose(b.terrain,u);
const cartStopped=b=>!!G.HonroQuestTargets.records(b).find(t=>t.id==='v4.gate-cart'&&t.broken)&&!alive(unit(b,'v4.gate-cart'));
const residents=b=>[b.honroV4CitySpec.resident];
const threatened=b=>residents(b).some(id=>{const u=unit(b,id);return alive(u)&&!City.memory(b).actors[id]?.safe&&b.units.some(v=>alive(v)&&v.side===1&&!v.honroObjectiveTarget&&V.near(v,u,310));});
const routeBlocked=b=>City.memory(b).started&&residents(b).some(id=>!City.memory(b).actors[id]?.safe&&!!City.memory(b).actors[id]?.blocked);
const rescued=b=>City.complete(b)&&residents(b).every(id=>grounded(b,unit(b,id))&&City.memory(b).actors[id]?.safe)&&alive(unit(b,'v4.gwakjin'));
function author(map,p){base.author(map,p);if(!enabled())return;
 const old=map.units.find(u=>u.id==='a3-21-wagon-cordon-0'),current=map.units.find(u=>u.id==='a3-21-gate-watch-1');
 // Display identities reuse two existing combatants. HP, XP, kind, position,
 // skill and action budgets are unchanged; no additional foe is introduced.
 for(const [u,identity]of [[old,'old-empty'],[current,'current-dead']])u.stageOverrides={...u.stageOverrides,honroVariant:'possessedGuard',honroV4ArmorIdentity:identity};
 map.initialState.honroV4Chapter21={revision:1,old:old.id,current:current.id,gate:{x:2277,y:2560},emblem:'old-sealed-diamond'};
 map.initialState.honroReviewedNarrativeRevision=1;
}
function prepare(b,p){base.prepare(b,p);if(!active(b))return;memory(b);unit(b,'v4.gwakjin').name='곽진';for(const id of ['v4.gate-soldier-1','v4.gate-soldier-2'])unit(b,id).name='수비병';const cart=unit(b,'v4.gate-cart');if(cart)cart.name='들린 수레';unit(b,b.honroV4Chapter21.old).name='빈 갑주';unit(b,b.honroV4Chapter21.current).name=G.HonroWorld.archetypes.possessedGuard.name;
 const resident=unit(b,b.honroV4CitySpec.resident);resident.honroV4Injured=true;
 // A real entry consumes the pre-entry observation. A saved battle cannot
 // reopen pre-rescue camp dialogue merely by returning to the rest UI.
 delete p.honroReviewed21RestObservation;
}
function moveArmor(app,dt,dir){const b=app.engine.b,q=memory(b),u=unit(b,b.honroV4Chapter21.old);if(!grounded(b,u)||q.armor.distance>=20)return;
 const before={x:u.x,y:u.y,facing:u.facing},slice=Math.min(Math.max(dt,0),.025,(20-q.armor.distance)/(u.walkSpeed||170));if(!slice)return;
 const probe={...u,fixed:false,vx:0,vy:0,moveLeft:Math.min(u.moveLeft||0,20-q.armor.distance)};
 app.engine.walk(probe,dir,slice,true);app.engine.integrateBody(probe,slice,true);
 const d=Math.hypot(probe.x-u.x,probe.y-u.y);if(d<=0||d>20.001||!grounded(b,probe))return;
 Object.assign(u,{x:probe.x,y:probe.y,vx:0,vy:0,facing:probe.facing,moveLeft:Math.max(0,u.moveLeft-d),moving:.12,walkPhase:probe.walkPhase});
 q.armor.distance+=d;q.armor.last={actor:u.id,from:before,to:{x:u.x,y:u.y,facing:u.facing},distance:d};app.dirty=true;
}
function observe(app,dt){const b=app.engine.b,q=memory(b),spec=b.honroV4Chapter21,old=unit(b,spec.old),resident=unit(b,b.honroV4CitySpec.resident),a=City.memory(b).actors[resident.id];
 if(!cartStopped(b))q.wheel+=Math.max(0,dt)*3;
 // The brief turn is a swept production walk, never a timer-only assertion.
 // Once stopped, no old threat or pending turn is replayed after its death.
 if(cartStopped(b)&&!q.cartSeen){q.cartSeen=true;q.armor.distance=0;delete q.armor.last;}
 if(cartStopped(b)&&alive(old)&&!q.proof.turn&&V.near(old,resident,430)){
  const before=q.armor.last;moveArmor(app,dt,Math.sign(resident.x-old.x));const last=q.armor.last;
  if(last&&last!==before&&last.to.x!==last.from.x&&(last.to.x-last.from.x)*(resident.x-last.from.x)>0&&last.from.facing!==last.to.facing&&last.to.facing===Math.sign(resident.x-last.from.x))q.proof.turn=copy(last);
 }
 if(old&&!alive(old)&&!q.wreck){const y=C.topAt(b.terrain.find(t=>t.id==='a3-foundation'),old.x);if(Number.isFinite(y))q.wreck={x:old.x,y,id:old.id,h:old.h,r:old.r,identity:'old-empty',emblem:spec.emblem};}
 if(a&&alive(resident)&&!a.safe&&a.distance>80&&V.near(resident,spec.gate,160)&&grounded(b,resident)&&resident.moving>0)q.proof.lastMoving={resident:resident.id,point:{x:resident.x,y:resident.y},distance:a.distance};
 if(rescued(b)&&q.wreck&&!q.proof.emblem){const viewer=V.heroes(b).find(u=>grounded(b,u)&&V.near(u,q.wreck,650));if(viewer)q.proof.emblem={viewer:viewer.id,oldArmor:spec.old,currentArmor:spec.current,emblem:spec.emblem,point:copy(q.wreck)};}
}
function introReady(b){const s=b.honroV4Chapter21;return !cartStopped(b)&&alive(unit(b,'v4.gwakjin'))&&alive(unit(b,b.honroV4CitySpec.resident))&&alive(unit(b,s.old));}
function facts(b,id){if(!active(b))return false;const q=memory(b),resident=unit(b,b.honroV4CitySpec.resident);
 if(id==='EDGE.ARRIVALS_21_0')return true;
 if(id.startsWith('A3.S21.INTRO.'))return introReady(b);
 if(id==='A3.S21.CART_STOP.01')return cartStopped(b)&&!rescued(b);
 if(id==='A3.S21.CART_STOP.02')return cartStopped(b)&&!!q.proof.turn&&alive(unit(b,b.honroV4Chapter21.old))&&threatened(b);
 if(id.startsWith('A3.S21.CIVILIAN_DANGER.'))return cartStopped(b)&&threatened(b);
 if(id==='A3.S21.LAST_ESCORT.01')return !!q.proof.lastMoving&&alive(resident)&&!City.memory(b).actors[resident.id]?.safe&&V.near(resident,b.honroV4Chapter21.gate,160);
 if(id.startsWith('A3.S21.CLEAR.'))return rescued(b)&&!!q.proof.emblem;
 if(id.startsWith('A3.S21.EXIT.'))return rescued(b)&&!!q.proof.emblem;
 if(id==='A3.S21.GUIDE.01')return routeBlocked(b);
 return false;
}
function tick(app,dt){if(!active(app.engine.b)){base.tick(app,dt);return;}if(!V.safe(app))return;const b=app.engine.b;
 // Intro/arrival must precede the rescue's physical simulation.
 const q=memory(b);if(['done','skipped'].includes(q.events.arrival?.status)&&!q.events.intro&&!cartStopped(b)&&alive(unit(b,b.honroV4Chapter21.old))&&q.armor.distance<15){moveArmor(app,dt,1);return;}
 if(!memory(b).events.intro){G.HonroAct23V4Chapter21Reviewed.tick(app,0);if(app.dialogue)return;}
 base.tick(app,dt);observe(app,dt);G.HonroAct23V4Chapter21Reviewed.tick(app,dt);
}
V.register(21,{...base,author,prepare,tick,complete(b){return base.complete(b)&&(!active(b)||G.HonroAct23V4Chapter21Reviewed.complete(b));}});
G.HonroAct23V4Chapter21={enabled,active,memory,observe,facts,introReady,cartStopped,threatened,routeBlocked,rescued,residents};
})(globalThis);
