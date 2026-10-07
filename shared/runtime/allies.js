(function(G){'use strict';
const C=G.HONRO_CORE,W=G.HonroWorld,clamp=C.clamp;
const aiming=new WeakMap();
/** A non-player coalition, not a fifth selectable hero and not an immortal prop.
 * Turn schedule: heroes -> summons -> allied NPCs -> enemies. All queue state is serialized. */
function attach(app,e){const b=e.b,baseTransition=e.completeTeamTransition.bind(e),baseTick=e.tick.bind(e);
 recoverFixedRescueTargets(e);
 e.completeTeamTransition=function(){if(e.checkEnd())return;const hs=b.honroState;const list=b.units.filter(u=>u.honroAlly&&!u.dead&&u.hp>0&&u.allyRole!=='channeler');if(b.honroStage===2&&list.length&&!list.some(u=>u.allyRole==='porter')){const bearer=list.find(u=>u.allyRole==='guard')||list[0];bearer.allyOriginalRole??=bearer.allyRole;bearer.allyRole='porter';app.event('남은 호위가 상여채를 이어받았다.');}if(b.side===0&&list.length&&hs.allyDoneRound!==b.round){hs.allyDoneRound=b.round;hs.allyQueue={ids:list.map(u=>u.id),index:0,returnActive:b.active,phase:'begin',elapsed:0,started:false};b.phase='ally';b.turnAge=0;e.emit('save');return;}if(b.side===0&&b.honroStage===2&&!list.length){const car=e.unit('objective'),nearHero=e.heroesAlive().find(u=>car&&Math.hypot(u.x-car.x,u.y-car.y)<820),clear=!e.alive(1).length;if(car&&(nearHero||clear)){const block=b.terrain.find(t=>t.honroBlocker&&!t.broken&&t.x>car.x-35&&t.x<car.x+720);const lead=nearHero?.x??car.x+900;car.x=Math.max(car.x,Math.min(car.x+(clear?420:240),lead+180,block?block.x-105:(b.honroEscortGoalX??b.width-180)));car.y=W.top(b,car.x,car.y);}}baseTransition();};
 e.tick=function(dt=C.STEP){if(b.phase==='ally'){tick(app,e,dt,baseTransition);C.tickRedesign(e,dt);return;}baseTick(dt);};
}
// Older builds let fixed rescue residents walk off ledges without gravity.
// Recover only those stationary rescue targets, using the actual body sweep
// on a probe. Keep supported saves exactly as-is and never reset them to a
// marker/spawn, rewrite terrain, or charge the player for this invalid state.
function recoverFixedRescueTargets(e){const b=e.b;
 const ids=new Set((b.honroMarkers||[]).filter(m=>m.action==='rescue').map(m=>m.target));
 for(const u of b.units){
  if(!ids.has(u.id)||!u.fixed||!u.honroAlly||!u.honroCivilian||u.dead||u.hp<=0||!Number.isFinite(u.x)||!Number.isFinite(u.y)||u.airborne||u.carriedBy!==undefined||e.contactSurface(u.x,u.y-4,u.y+5))continue;
  const probe={...u,vx:0,vy:0,jumping:false,fallApexY:undefined};
  for(let n=0;n<2400;n++){
   if(!e.integrateBody(probe,C.STEP,true))break;
   if(e.grounded(probe)&&C.validTerrainContactPose(b.terrain,probe)){
    b.honroContactRecoveries??=[];b.honroContactRecoveries.push({id:u.id,reason:'fixed-rescue-airwalk',from:{x:u.x,y:u.y},to:{x:probe.x,y:probe.y}});
    Object.assign(u,{x:probe.x,y:probe.y,vx:0,vy:0,jumping:false,fallApexY:undefined});break;
   }
  }
 }
}
function coalition(e){return e.b.units.filter(u=>!u.dead&&u.hp>0&&(u.side===0||u.honroAlly||u.honroCivilian));}
function safeAllyAim(e,u,skill,target){return C.finishPlanning(safeAllyAimSteps(e,u,skill,target));}
function* safeAllyAimSteps(e,u,skill,target){
 const maxRange=u.allyRole==='daoist'?1550:u.allyRole==='medium'?1320:1100;
 if(Math.hypot(target.x-u.x,(target.y-u.y)*.75)>maxRange)return null;
 const base=yield* e.searchShot(u,skill,target,false,.82);
 const a={...base,angle:clamp(base.angle,-85,265),power:clamp(base.power,.08,.82)};
 const result=C.shotViable(e,u,skill,target,a.angle,a.power);yield;if(result.ok)return a;
 return null;
}
function* allyShot(e,u,skill,targets){for(const target of targets){const aim=yield* safeAllyAimSteps(e,u,skill,target);if(aim)return{aim,targetId:target.id};}return null;}
function log(e,u,action,target){const b=e.b;b.honroCounters.allyActions++;b.honroState.combatLog.push({round:b.round,actor:u.id,action,target});b.honroState.combatLog=b.honroState.combatLog.slice(-120);}
function finish(e,q){q.index++;q.phase='begin';q.elapsed=0;q.started=false;e.b.projectiles=[];e.b.volley=undefined;}
function tick(app,e,dt,transition){const b=e.b,hs=b.honroState,q=hs.allyQueue;if(!q){transition();return;}if(e.checkEnd())return;
 q.elapsed+=dt;b.turnAge+=dt;const id=q.ids[q.index],u=e.unit(id);
 if(q.index>=q.ids.length){b.active=q.returnActive;hs.allyQueue=null;transition();e.emit('save');return;}
 if(!u||u.dead||u.allyRole==='channeler'){finish(e,q);return;}b.active=u.id;
 if(q.phase==='begin'){
  b.reviewDamage={};b.reviewFocus=undefined;
  q.phase='move';q.elapsed=0;q.started=false;const support=u.allyRole==='daoist'||u.allyRole==='medium';u.moveLeft=u.maxMove=u.allyRole==='guard'?1400:support?1250:1180;u.walkSpeed=u.allyRole==='guard'?700:support?630:560;u.focus=u.maxFocus=180;
  const own=coalition(e),hero=e.heroesAlive().sort((a,c)=>c.x-a.x)[0],car=e.unit('objective'),foes=e.alive(1);
  const nearest=foes.slice().sort((a,c)=>Math.hypot(a.x-u.x,(a.y-u.y)*.8)-Math.hypot(c.x-u.x,(c.y-u.y)*.8))[0];q.targetId=nearest?.id;
  q.anchor=hero?.x||u.x;
  if(u.allyRole==='porter'){const threat=foes.filter(v=>car&&Math.abs(v.x-car.x)<1150&&Math.abs(v.y-car.y)<650).length;const block=b.terrain.find(t=>t.honroBlocker&&!t.broken&&car&&t.x>car.x-35&&t.x<car.x+900);q.blockerId=block?.id;const paused=(hs.carriagePauseUntilRound||-1)>=b.round;const escortFront=Math.max(car?.x||0,...own.filter(v=>v.honroAlly&&!v.honroCivilian&&v.allyRole!=='porter').map(v=>v.x));const pace=b.honroStage===2?escortFront+80:(hero?.x||escortFront)+120;q.carTarget=car?(paused||threat?car.x:Math.max(car.x,Math.min(car.x+560,pace+60,block?block.x-105:(b.honroEscortGoalX??b.width-180)))):u.x;q.dest=car?Math.max(45,Math.min(q.carTarget-95,car.x+420)):u.x;}
  else if(u.allyRole==='healer'||u.allyRole==='ritualist'){const hurt=own.filter(v=>!v.honroCivilian||v.hp<v.maxHp*.7).sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];q.targetId=hurt?.id;q.dest=(hurt?.x||hero?.x||u.x)-100;}else if(u.allyRole==='daoist'||u.allyRole==='medium'){q.targetId=nearest?.id;q.dest=nearest?nearest.x-Math.sign(nearest.x-u.x||1)*980:(car?.x||hero?.x||u.x)-180;}
  else if(nearest&&Math.abs(nearest.x-u.x)<1800){q.dest=nearest.x-Math.sign(nearest.x-u.x||1)*(u.allyRole==='guard'?150:730);}
  else q.dest=(car?.x||hero?.x||u.x)+(u.allyRole==='guard'?310:-230);
  q.dest=clamp(q.dest,45,b.width-100);e.emit('change');
 }
 // A stationary actor may still heal/guard, but must not walk out of its
 // support while Engine.stepUnits intentionally excludes fixed bodies. Also
 // handle a save made midway through the old invalid movement phase.
 if(q.phase==='move'&&u.fixed){q.phase='act';q.elapsed=0;u.vx=u.vy=0;delete u.moveTarget;delete u.aiMove;}
 if(q.phase==='move'){
  const target=e.unit(q.targetId),distance=q.dest-u.x,old=u.x;e.walk(u,Math.sign(distance),dt);e.stepUnits(dt);
  if(Math.abs(u.x-old)<.01&&Math.abs(distance)>30&&e.grounded(u)&&u.moveLeft>80)e.jump(u);
  const car=e.unit('objective');if(u.allyRole==='porter'&&car&&!car.dead&&q.carTarget>car.x){car.x=Math.min(q.carTarget,car.x+dt*480);car.y=W.top(b,car.x,car.y);}
  // Porter and carriage are one convoy action: reaching the porter waypoint must not end the action
  // while the carriage is still catching up. This prevents the escort from creeping a few pixels per round.
  const carriageDone=u.allyRole!=='porter'||!car||q.carTarget<=car.x+2;
  const moveDone=Math.abs(distance)<28&&carriageDone;
  if(moveDone||(u.allyRole!=='porter'&&u.moveLeft<5)||q.elapsed>1.7){q.phase='act';q.elapsed=0;u.vx=0;}
 }
 if(q.phase==='act'&&!q.started){q.started=true;let target=e.unit(q.targetId);if(!target||target.dead)target=e.alive(1).sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y))[0];
  if(u.allyRole==='porter'){const car=e.unit('objective'),block=q.blockerId&&b.terrain.find(t=>t.id===q.blockerId&&!t.broken);if(block&&car&&block.x-car.x<260){e.damageTerrain(block,145+u.attack*35,0,u.id);log(e,u,'clear-road',block.id);e.fx('slash',block.x+block.w*.5,block.y+block.h*.4,'#c1b18c',70);if(block.broken)app.event('호위대가 길을 막은 뿌리를 잘라냈다.');}else if(car){car.shield=Math.max(car.shield,38);log(e,u,'escort',car.id);e.fx('ring',car.x,car.y-45,'#b6c1a2',40);}q.phase='after';q.elapsed=0;}
  else if(u.allyRole==='healer'||u.allyRole==='ritualist'){const near=coalition(e).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<1350).sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];if(near){if(u.allyRole==='healer'){const heal=Math.min(near.maxHp-near.hp,Math.round(near.maxHp*.11));near.hp+=heal;e.fx('text',near.x,near.y-near.h-10,'#b9c6a8',16,'+'+heal);log(e,u,'heal',near.id);}else{near.shield=Math.max(near.shield,75);log(e,u,'ward',near.id);}e.fx('line',u.x,u.y-55,'#91b9ad',2,undefined);e.fx('ring',near.x,near.y-45,'#9cb7a4',45);}q.phase='after';q.elapsed=0;}
  else if((u.allyRole==='daoist'||u.allyRole==='medium')&&target&&!target.dead){const nearby=e.alive(1).filter(v=>Math.hypot(v.x-target.x,(v.y-target.y)*.8)<260).length,skill=u.allyRole==='daoist'?(nearby>=2?'M06':'M01'):(nearby>=2?'LO10':'LO09');u.loadout=[skill];u.ranks[skill]=Math.max(1,u.ranks[skill]||1);u.focus=999;let aim=null;
   const targets=[target,...e.alive(1).filter(v=>v!==target).sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y)).slice(0,2)];
   const key=e.planningKey()+'|'+q.index+'|'+skill+'|'+targets.map(t=>t.id).join(',');let work=aiming.get(e);
   if(!work||work.key!==key){work={key,steps:allyShot(e,u,C.SKILLS[skill],targets)};aiming.set(e,work);}
   const ready=e.continuePlanning(work.steps);if(!ready){q.started=false;return;}aiming.delete(e);
   if(ready.value){aim=ready.value.aim;target=e.unit(ready.value.targetId);q.targetId=target.id;}
   if(aim&&e.fire(skill,aim.angle,aim.power,true)){b.phase='ally';log(e,u,u.allyRole==='daoist'?'daoist-shot':'curse-shot',target.id);q.phase='flight';q.elapsed=0;}else{u.shield=Math.max(u.shield,28);log(e,u,'hold-fire',target.id);q.phase='after';q.elapsed=0;}}
  else if(target&&!target.dead){const d=Math.hypot(target.x-u.x,(target.y-u.y)*.8);if((u.allyRole==='guard'||u.allyRole==='scout')&&d<320){e.hurt(target,54+u.attack*38,u.id,true);e.impulse(target,Math.sign(target.x-u.x)*120,-45);e.fx('slash',target.x,target.y-target.h*.5,'#c1b18c',62);e.emit('sound',{name:'sword'});log(e,u,'sword',target.id);q.phase='after';q.elapsed=0;}
   else if((u.allyRole==='guard'||u.allyRole==='scout')&&d<720){e.hurt(target,31+u.attack*25,u.id,true);e.fx('line',u.x,u.y-u.h*.48,'#c9b98f',3,target.x,target.y-target.h*.5);e.fx('slash',target.x,target.y-target.h*.5,'#b5a781',48);log(e,u,'sword-wave',target.id);q.phase='after';q.elapsed=0;}
   else {u.shield=Math.max(u.shield,34);log(e,u,'guard',u.id);q.phase='after';q.elapsed=0;}}
  else {log(e,u,'advance',u.id);q.phase='after';q.elapsed=0;}
 }
 if(q.phase==='flight'){for(const shot of [...b.projectiles])if(b.projectiles.includes(shot))e.stepProjectile(shot,dt);e.stepUnits(dt);if(!b.projectiles.length&&!e.settleBusy()){q.phase='after';q.elapsed=0;}}
 if(q.phase==='after'){e.stepUnits(dt);if(q.elapsed>=e.actionReviewSeconds())finish(e,q);}
}
function missionTick(app,dt){G.HonroMission.tick(app,dt);}
function restore(e,f){for(const u of coalition(e)){u.hp=Math.min(u.maxHp,u.hp+Math.round(u.maxHp*f));if(!u.honroCivilian)u.focus=Math.min(u.maxFocus,u.focus+Math.round(u.maxFocus*(f+.10)));e.fx('ring',u.x,u.y-u.h*.5,'#a9b892',40);}}
function execute(app,a){const e=app.engine,b=e.b,st=app.stage,hero=e.heroesAlive()[0];if(!a)return true;
 if(a.type==='multi'){
   // Reserve all spawn positions before mutating the world: a blocked second group
   // must not duplicate the first group every retry.
   const pending=[];const shadow={...b,units:[...b.units],nextId:b.nextId};
   for(const q of a.actions||[])if(q.type==='spawn'||q.type==='sniperAmbush'){const list=prepareSpawn(shadow,st,q,hero);if(!list)return false;pending.push(...list);shadow.units.push(...list);}
   b.nextId=shadow.nextId;b.units.push(...pending);b.honroCounters.spawned+=pending.length;
   for(const q of a.actions||[])if(q.type!=='spawn'&&q.type!=='sniperAmbush')execute(app,q);
   return true;
 }
 if(a.type==='carriagePause'){b.honroState.carriagePauseUntilRound=Math.max(b.honroState.carriagePauseUntilRound??-1,b.round+Math.max(0,(a.rounds||1)-1));return true;}
 if(a.type==='sniperAmbush'||a.type==='spawn'){
   const shadow={...b,units:[...b.units],nextId:b.nextId},list=prepareSpawn(shadow,st,a,hero);if(!list)return false;
   b.nextId=shadow.nextId;b.units.push(...list);b.honroCounters.spawned+=list.length;return true;
 }
 if(a.type==='ally'){const x=clamp(a.x,50,b.width-60),y=st.id===7&&!b.honroLayoutRevision?(hero?.y||3500):undefined;const u=W.ally(b,st,'ally-'+b.nextId,a.role,x,y),p=G.HonroTerrain.place(b,u,{flying:false,maxDistance:1600});if(!p)return false;Object.assign(u,p,{spawnX:p.x,spawnY:p.y});b.nextId++;b.units.push(u);}
 if(a.type==='convoyWard'){if(a.actor&&!e.b.units.some(u=>u.id===a.actor&&!u.dead&&u.hp>0))return false;const car=e.unit('objective');for(const u of coalition(e).filter(v=>!car||Math.abs(v.x-car.x)<1200)){u.shield=Math.max(u.shield,90);e.fx('ring',u.x,u.y-u.h*.5,'#9ebaa8',48);}return;}
 if(a.type==='wind')b.wind=a.value;if(a.type==='fog')e.setEnvironment({dragScale:a.drag});if(a.type==='rest')restore(e,a.fraction);if(a.type==='break'){const t=b.terrain.find(t=>t.id===a.terrain);if(t){t.broken=true;t.hp=0;b.sceneVersion++;}}
}
function prepareSpawn(b,st,a,hero){
 const archer=b.units.find(u=>u.side===0&&u.cls==='archer'&&!u.dead)||hero;
 if(a.type==='sniperAmbush'&&!archer)return null;
 const list=[];
 for(let i=0;i<(a.n||1);i++){
   const ambush=a.type==='sniperAmbush',id=b.nextId++,x=clamp(ambush?archer.x+420+(i%3)*160:a.x+(i-(a.n-1)/2)*(a.spacing??115),90,b.width-100);
   const y=ambush?Math.max(120,archer.y-100-(i%2)*120):a.y!==undefined?W.top(b,x,a.y,a.support):st.id===7&&!b.honroLayoutRevision?hero?.y:undefined;
     const kind=ambush?'crow':a.kind,u=W.createEnemy(b,st,x,kind,id,y);
     if(a.act3Authored){u.honroAct3Encounter=1;u.honroAct3Elite=!!a.elite&&i===0;u.honroCohort='reinforcement';G.HonroAct3Encounters.tune(b,u,st);G.HonroProgression.enemyXP(b,u);}
   if(b.honroEncounterRevision){u.combatBaseHp*=.6;u.hp=u.maxHp=Math.max(1,Math.round(u.maxHp*.6));}
   if(ambush)u.y=y;
   const position=G.HonroTerrain.place({...b,units:[...b.units,...list]},u,{flying:!!W.archetypes[kind]?.flying,maxDistance:a.maxDistance??1600,clearance:a.clearance??18});
   if(!position)return null;
   Object.assign(u,position,{id:(ambush?'sniper-crow-':'event-')+id,awake:true,aggroUntil:b.round+(ambush?6:3),spawnX:position.x,spawnY:position.y});
   if(a.source)u.honroSpawnSource=a.source;
   if(ambush){u.group=-2;u.honroTargetId=archer.id;u.honroTargetUntil=b.round+5;}
   list.push(u);
 }
 return list;
}
G.HonroAllies={attach,tick,missionTick,execute,coalition,safeAllyAim};
})(globalThis);
