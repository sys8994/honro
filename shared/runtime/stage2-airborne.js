(function(G){'use strict';
// The opposite roost watches the procession. Its authored height puts it outside
// generic proximity activation. Admit this group after a visible response window,
// without changing other groups, action budgets, weapons or the live target AI.
const E=G.HonroEncounters,A=G.HonroAllies,C=G.HONRO_CORE;
const ids=new Set(['foe-1','foe-4','foe-1-cluster','foe-4-cluster']);
const active=b=>b?.honroStage===2&&b.honroCanonical&&(b.honroMapOrigin==='campaign'||b.honroStage2AirborneRevision===1)&&!b.honroCustom&&b.honroLayoutRevision===1&&b.honroEscortGoalX===3340;
const roost=u=>!!u&&ids.has(u.id)&&u.side===1&&u.honroCluster==='shelf-roost'&&u.honroType===(u.id.startsWith('foe-1')?'crow':'bat')&&u.fixed;
function author(project){const s=project.stages?.find(s=>s.metadata?.stageId===2);if(s?.initialState?.honroEscortGoalX===3340&&s.units?.some(u=>u.id==='foe-1'&&u.x===3370&&u.y===1010))s.initialState.honroStage2AirborneRevision=1;return project;}
const alive=u=>u&&!u.dead&&u.hp>0;
const stopped=app=>app.done||['won','lost'].includes(app.engine.b.phase);
function repair(e,u){
 // Exact historical clone placement: retain all legitimate moved/knocked saves.
 if(!active(e.b)||!roost(u)||u.id!=='foe-1-cluster'||!alive(u)||u.x!==3460||u.y!==1010||u.spawnX!==3460||u.spawnY!==1010||C.flightClear(e,u,u))return false;
 const p=G.HonroTerrain.place(e.b,u,{flying:true,maxDistance:128,clearance:18,accept:(x,y)=>C.flightClear(e,u,{x,y})});
 if(!p)return false;
 Object.assign(u,p,{vx:0,vy:0});delete u.aiMove;delete u.moveTarget;return true;
}
const balance=E.balance;E.balance=function(b){const out=balance(b);if(active(b)){for(const u of b.units)repair({b},u);b.honroStage2AirborneRevision=1;}return out;};
function prepare(app){const e=app.engine,b=e.b;if(!active(b)||stopped(app)||app.dialogue)return;
 const flyers=e.alive(1).filter(roost);if(!flyers.length)return;
 const m=b.honroState.stage2Airborne;if(m?.warning)return;
 const engaged=b.units.some(u=>u.side===1&&!roost(u)&&(u.dead||u.hp<u.maxHp))||(e.unit('objective')?.x||0)>=1520;
 if(!engaged)return;
 b.honroState.stage2Airborne={warning:{round:b.round,serial:b.honroState.actorTurnSerial||0,inProgress:b.phase!=='aim'||!!b.projectiles.length},released:false};
 app.event('오른쪽 절벽의 날짐승들이 상여 쪽으로 몸을 돌린다.');app.dirty=true;
}
const update=E.update;E.update=function(app,...args){if(active(app.engine?.b))prepare(app);return update(app,...args);};
const attach=A.attach;A.attach=function(app,e){const out=attach(app,e),b=e.b;if(!active(b)||e.honroStage2AirborneAttached)return out;e.honroStage2AirborneAttached=true;
 // Mounting a Continue must not rewrite the saved turn, actors, alerts or queue.
 const can=e.canAct.bind(e);e.canAct=function(){const ok=can(),m=b.honroState.stage2Airborne;if(ok&&m?.warning&&!m.released&&!stopped(app)&&!app.dialogue&&!app.charging&&!app.modal?.classList.contains('open')&&!G.HonroStory?.turnPaused?.(app)&&!b.projectiles.length&&(!m.warning.inProgress||(b.honroState.actorTurnSerial||0)>m.warning.serial))m.offered={id:e.active.id,round:b.round,serial:b.honroState.actorTurnSerial||0};return ok;};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,m=b.honroState.stage2Airborne;if(!stopped(app)&&!app.dialogue&&alive(u)&&u.side===0&&!u.acted&&m?.offered?.id===u.id&&m.offered.round===b.round&&m.offered.serial===(b.honroState.actorTurnSerial||0)&&!m.released){m.released=true;m.response={id:u.id,round:b.round,serial:b.honroState.actorTurnSerial||0};}return finish(...args);};
 const refresh=e.refreshActivation.bind(e);e.refreshActivation=function(){refresh();if(!stopped(app)&&b.honroState.stage2Airborne?.released)for(const u of e.alive(1).filter(roost))u.awake=true;};
 const combat=e.combatEnemies.bind(e);e.combatEnemies=function(){const list=combat();if(stopped(app)||!b.honroState.stage2Airborne?.released)return list;return [...new Set([...list,...e.alive(1).filter(roost)])];};
 const enemy=e.enemyAction.bind(e);e.enemyAction=function(){if(!stopped(app)&&roost(e.active)&&!e.active.acted)repair(e,e.active);return enemy();};return out;
};
G.HonroStage2Airborne={author,active,roost,repair,prepare};
})(globalThis);
