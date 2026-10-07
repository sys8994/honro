(function(G){'use strict';
const C=G.HONRO_CORE,H=G.HONRO_CONTENT;
const active=b=>!!b&&!b.honroCustom&&b.honroStage>=21&&b.honroStage<=30;
const marker=(b,id)=>b.honroMarkers?.find(m=>m.id===id||m.id==='marker-'+id);
const steps=b=>b.honroAct3Steps||H.stages[b.honroStage-1]?.steps||[];
const alive=u=>!!u&&!u.dead&&u.hp>0;
const heroes=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall&&alive(u));
function memory(b){b.honroState??={flags:{},collected:[]};const a=b.honroState.act3??={version:1};a.done??={};a.holds??={};a.events??={};a.checkpoints??=[];a.escorts??={};return a;}
const sameFloor=(u,p,r=260)=>!!p&&Math.abs(u.y-p.y)<=150&&Math.hypot(u.x-p.x,(u.y-p.y)*.75)<=r;
function initialize(b){if(!active(b))return;memory(b);b.honroAct3Steps??=structuredClone(H.stages[b.honroStage-1].steps);
 for(const u of b.units){if(G.HonroWorld.archetypes[u.honroVariant]?.act3Human){u.honroAct3Human=true;u.honroNonlethal=true;}if(u.honroProtected)u.honroCivilian=true;}
}
function sourceIssue(b){const list=steps(b);if(!list.length)return'이 장의 목표 자료가 준비되지 않았습니다.';
 for(const s of list){if(!marker(b,s.id))return'목표 위치가 준비되지 않았습니다: '+s.id;if(s.kind==='destroy'&&!b.terrain.some(t=>t.id===s.id))return'파괴 장치가 준비되지 않았습니다: '+s.id;if(s.target&&!b.units.some(u=>u.id===s.target))return'동행 대상이 준비되지 않았습니다: '+s.target;if(s.opens&&!b.terrain.some(t=>t.id===s.opens))return'통로가 준비되지 않았습니다: '+s.opens;if(s.wave&&!marker(b,'wave-'+s.id))return'방어 경로가 준비되지 않았습니다: '+s.id;}return null;
}
function satisfied(b,s){const a=memory(b);if(a.done[s.id])return true;
 if(s.kind==='destroy')return !!b.terrain.find(t=>t.id===s.id)?.broken;
 if(s.kind==='hold'){const h=a.holds[s.id];return !!h&&h.progress>=s.rounds&&h.spawned>=(s.wave?.count||0);}
 return false;
}
const current=b=>steps(b).find(s=>!memory(b).done[s.id]);
function target(b,s){const m=marker(b,s.id),t=s.kind==='destroy'&&b.terrain.find(t=>t.id===s.id),u=s.target&&b.units.find(u=>u.id===s.target),liveUnit=['rescue','interact'].includes(s.kind)&&u;
 return{id:s.id,kind:t?'seal':['reach','escort'].includes(s.kind)?'exit':'interact',x:liveUnit?u.x:t?t.x+t.w/2:m?.x,y:liveUnit?u.y-u.h:t?t.y:m?.y,label:s.label,...(t?{box:t}:{}),...(liveUnit?{unitId:u.id}:{})};
}
function state(b){const list=steps(b),s=current(b),a=memory(b),issue=sourceIssue(b),all=list.map(q=>({...target(b,q),done:!!a.done[q.id]}));let detail='';
 if(s?.kind==='hold'){const h=a.holds[s.id];detail=` · ${h?.progress||0}/${s.rounds}턴${h?.contested?' · 가까운 적을 밀어내세요':h?.guarded?' · 지키는 중':' · 같은 층의 표시 범위에서 유지'}`;}
 if(b.honroStage===27&&!a.done['fire-screen'])detail+=` · 소각까지 ${Math.max(0,12-(a.fireTurns||0))} 적 턴`;
 const targets=s?[target(b,s)]:[];
 if(s?.kind==='escort'){const u=b.units.find(u=>u.id===s.target);if(alive(u))targets.push({id:u.id,kind:'objective',x:u.x,y:u.y-u.h,unitId:u.id,label:'기록 운반자 · 가까이 동행'});}
 const complete=!issue&&!s;return{complete,objectiveReady:complete,minimumRound:1,settleRounds:0,summary:issue||`${list.filter(q=>a.done[q.id]).length}/${list.length} · ${s?s.label+detail:'모든 목표 완료'}`,targets:targets.filter(t=>Number.isFinite(t.x)&&Number.isFinite(t.y)),allTargets:all};
}
function interactionTarget(b,m){if(!active(b)||m?.action!=='act3'||!m.target)return m;const s=steps(b).find(s=>s.id===m.id);if(!s||!['rescue','interact'].includes(s.kind))return m;const u=b.units.find(u=>u.id===m.target);return alive(u)&&!m.collected?u:null;}
function eligibility(app,m){const b=app.engine?.b,u=app.engine?.active,s=b&&current(b);if(!active(b)||!alive(u)||u.side!==0||m.collected)return{ok:false,reason:'상호작용할 수 없음'};
 if(!s||s.id!==m.id)return{ok:false,reason:s?'먼저 '+s.label:'목표 완료'};
 if(!['interact','rescue'].includes(s.kind))return{ok:false,reason:s.label};
 if(s.requiredClass&&u.cls!==s.requiredClass)return{ok:false,reason:H.hero[s.requiredClass].name+' 필요'};
 const point=interactionTarget(b,m);if(!point)return{ok:false,reason:'보호할 주민을 찾을 수 없음'};
 if(!sameFloor(u,point))return{ok:false,reason:Math.abs(u.y-point.y)>150?'같은 층으로 이동':'더 가까이 이동'};
 if(app.canInput&&!app.canInput())return{ok:false,reason:'현재 행동이 끝난 뒤'};
 // Only the immediate working space must be clear. Distant troops and other
 // storeys never turn a retrieval objective into an extermination objective.
 if(b.units.some(v=>v.side===1&&alive(v)&&sameFloor(v,point,220)))return{ok:false,reason:'작업 지점 가까운 적부터 제압'};
 return{ok:true,reason:'E · '+s.label};
}
function openGate(b,id){if(!id)return;const t=b.terrain.find(t=>t.id===id);if(t&&!t.broken){t.hp=0;t.broken=true;b.sceneVersion++;}}
function completeStep(app,s){const b=app.engine.b,a=memory(b);if(a.done[s.id])return;a.done[s.id]=true;a.checkpoints.push({id:s.id,round:b.round,enemyEnd:b.teamEnds?.[1]||0});const m=marker(b,s.id);if(m)m.collected=true;openGate(b,s.opens);
 const lines=app.stage.beats?.[s.id];if(lines?.length)app.sayLines(G.HonroAct3Content.scene(`act3-${b.honroStage}-${s.id}`,app.stage.name,lines));app.event(s.label+' · 완료');app.dirty=true;
}
function use(app,m){if(!eligibility(app,m).ok)return false;const e=app.engine,b=e.b,s=current(b),a=memory(b),u=s.target&&e.unit(s.target);
 if(s.kind==='rescue'){u.honroResolved=true;u.shield=Math.max(u.shield||0,Math.round(u.maxHp*.3));}
 if(s.startsEscort){a.escorts[s.target]={started:true};u.fixed=false;u.maxMove=u.moveLeft=900;u.walkSpeed=Math.min(u.walkSpeed||280,320);}
 completeStep(app,s);if(!app.checkMission(e))e.finishAction();app.dirty=true;return true;
}
// Let an existing enthrall action finish and restore its original side first;
// otherwise its queued release could turn a subdued civilian back into an enemy.
function subdue(app,u){if(!u.honroAct3Human||u.honroSubdued||u.enthrall||u.hp>1||u.dead)return;
 const e=app.engine;G.HonroProgression.defeat(e,u,e.active);Object.assign(u,{hp:1,honroSubdued:true,side:2,fixed:true,acted:true,honroCivilian:true,vx:0,vy:0,loadout:[]});u.honroAlly=false;delete u.aiMove;delete u.moveTarget;delete u.meleeAction;e.b.queue=e.b.queue.filter(id=>id!==u.id);app.event(u.name+'를 전투 불능으로 제압했다.');app.dirty=true;
}
function attach(app,e){if(!active(e.b))return;initialize(e.b);if(e.honroAct3Attached)return;e.honroAct3Attached=true;
 const hurt=e.hurt.bind(e);e.hurt=function(u,amount,...args){const source=e.unit(args[0]);if(u.honroSubdued||u.honroProtected&&source?.side===0)return;const out=hurt(u,amount,...args);subdue(app,u);return out;};
 const damage=e.damageTerrain.bind(e);e.damageTerrain=function(t,amount,depth=0,owner=e.b.active){const s=steps(e.b).find(q=>q.id===t.id),actor=e.unit(owner);
  if(s?.kind==='destroy'&&s.requiredClass&&actor?.cls!==s.requiredClass){e.message(H.hero[s.requiredClass].name+'의 사격이 필요하다.');return;}
  // Closed passages only open as the ordered objective is committed; direct
  // splash damage cannot skip a sealed archive or create an inconsistent save.
  if(steps(e.b).some(q=>q.opens===t.id)&&!t.broken)return;
  return damage(t,amount,depth,owner);
 };
}
function spawnHold(app,s,h){if(!s.wave||h.spawned>=s.wave.count)return true;const e=app.engine,b=e.b,m=marker(b,'wave-'+s.id);if(!m)return false;
 const before=new Set(b.units.map(u=>u.id)),key='act3-'+s.id,n=s.wave.count-h.spawned;
 if(G.HonroAllies.execute(app,{type:'spawn',kind:s.wave.kind,n,x:m.x,y:m.y,spacing:145,maxDistance:580,source:key})===false)return false;
 for(const u of b.units)if(!before.has(u.id)&&u.side===1){u.honroCohort='reinforcement';if(G.HonroWorld.archetypes[u.honroVariant]?.act3Human){u.honroAct3Human=true;u.honroNonlethal=true;}}
 h.spawned+=n;memory(b).events[key]=true;app.event('길목에 '+n+'명의 위협이 다가온다.');app.dirty=true;return true;
}
function holdTick(app,s,m){const b=app.engine.b,a=memory(b),end=b.teamEnds?.[1]||0,h=a.holds[s.id]??={progress:0,spawned:0,lastEnemyEnd:end,continuous:false};
 const guarded=heroes(b).some(u=>(!s.requiredClass||u.cls===s.requiredClass)&&sameFloor(u,m,s.radius)),contested=b.units.some(u=>u.side===1&&alive(u)&&sameFloor(u,m,s.contestRadius||230));
 if(!guarded||contested)h.continuous=false;
 if(end>h.lastEnemyEnd){if(h.continuous&&guarded&&!contested)h.progress++;h.lastEnemyEnd=end;h.continuous=guarded&&!contested;app.dirty=true;}
 if(h.guarded===undefined)h.continuous=guarded&&!contested;
 h.guarded=guarded;h.contested=contested;
 if(app.actorBoundary&&guarded)spawnHold(app,s,h);
}
function escortTick(app,s,m,dt){const e=app.engine,b=e.b,a=memory(b),npc=e.unit(s.target),escort=a.escorts[s.target];if(!escort?.started||!alive(npc))return;
 const route=(b.honroMarkers||[]).filter(q=>q.id.startsWith('route:'+s.id+':')).sort((a,b)=>Number(a.id.split(':').at(-1))-Number(b.id.split(':').at(-1)));
 escort.waypoints??={};let index=escort.waypoints[s.id]||0;while(route[index]&&sameFloor(npc,route[index],90))index++;escort.waypoints[s.id]=index;
 const goal=route[index]||m,dir=Math.sign(goal.x-npc.x),lead=heroes(b).some(u=>sameFloor(u,npc,950)&&(u.x-npc.x)*dir>65);
 if(dt>0&&dir&&lead&&!app.dialogue){npc.fixed=false;npc.moveLeft=900;e.walk(npc,dir,Math.min(dt,.05));}
 if(sameFloor(npc,m,170)&&heroes(b).some(u=>sameFloor(u,npc,540)))completeStep(app,s);
}
function failure(b){if(!active(b))return null;const a=memory(b);if(b.units.some(u=>u.honroProtected&&!alive(u)))return'지켜야 할 주민을 잃었다. 이 장을 다시 시작할 수 있다.';
 for(const s of steps(b))if(!satisfied(b,s)&&s.requiredClass&&!heroes(b).some(u=>u.cls===s.requiredClass))return H.hero[s.requiredClass].name+'이 쓰러져 남은 목표를 이어갈 수 없다. 이 장을 다시 시작하자.';
 if(b.honroStage===27&&!a.done['fire-screen']&&(a.fireTurns||0)>=12)return'불길이 핵심 기록에 닿았다. 수문과 차단막부터 다시 확보하자.';return null;
}
function tick(app,dt){const e=app.engine,b=e.b;if(!active(b)||app.dialogue||['won','lost'].includes(b.phase))return;initialize(b);const a=memory(b);for(const u of b.units)subdue(app,u);
 if(sourceIssue(b))return; // Missing authoring is never a completed stage.
 if(b.honroStage===27&&!a.done['fire-screen']){const end=b.teamEnds?.[1]||0;a.fireStartEnd??=end;a.fireTurns=Math.max(0,end-a.fireStartEnd);}
 let s=current(b);while(s&&satisfied(b,s)){completeStep(app,s);s=current(b);}
 if(s){const m=marker(b,s.id);if(s.kind==='hold')holdTick(app,s,m);else if(s.kind==='reach'){const group=heroes(b),r=s.radius||180;if(group.length&&(s.allHeroes?group.every(u=>sameFloor(u,m,r)):group.some(u=>sameFloor(u,m,r))))completeStep(app,s);}else if(s.kind==='escort')escortTick(app,s,m,dt);}
 s=current(b);while(s&&satisfied(b,s)){completeStep(app,s);s=current(b);}
 app.checkMission(e);
}
function entry(app,options={}){return [...(options.interlude===false?[]:app.stage.narration).map(text=>['설오',text]),...app.stage.story,['안내',app.stage.guide,{kind:'guide',storyId:'act3-guide-'+app.stage.id,storyTitle:app.stage.name,focus:state(app.engine?.b||{honroStage:app.stage.id,honroState:{},honroMarkers:[],terrain:[],units:[]}).targets[0]?.kind||'interact'}]];}
G.HonroAct3={active,initialize,marker,steps,memory,current,state,sourceIssue,interactionTarget,eligibility,use,attach,tick,failure,entry,satisfied,heroes,sameFloor};
})(globalThis);
