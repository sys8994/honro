(function(G){'use strict';
const C=G.HONRO_CORE,H=G.HONRO_CONTENT;
const active=b=>!!b&&!b.honroCustom&&b.honroStage>=21&&b.honroStage<=30;
const marker=(b,id)=>b.honroMarkers?.find(m=>m.id===id||m.id==='marker-'+id);
const steps=b=>(b.honroAct3Steps||G.HonroObjectiveRevision?.storedSteps(b,3)||H.stages[b.honroStage-1]?.steps||[]).filter(s=>!s.splitOnly||[1,2].includes(b.honroSplit?.version));
const alive=u=>!!u&&!u.dead&&u.hp>0;
const heroes=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall&&alive(u));
function memory(b){b.honroState??={flags:{},collected:[]};const a=b.honroState.act3??={version:1};a.done??={};a.holds??={};a.events??={};a.checkpoints??=[];a.escorts??={};return a;}
const sameFloor=(u,p,r=260)=>!!p&&Math.abs(u.y-p.y)<=150&&Math.hypot(u.x-p.x,(u.y-p.y)*.75)<=r;
function initialize(b){if(!active(b))return;G.HonroObjectiveRevision?.registerScenes();memory(b);b.honroAct3Steps??=structuredClone(G.HonroObjectiveRevision?.storedSteps(b,3)||H.stages[b.honroStage-1].steps);
 for(const u of b.units)if(u.honroProtected)u.honroCivilian=true;
}
function sourceIssue(b){const routeIssue=G.HonroRouteBranches?.sourceIssue(b);if(routeIssue)return routeIssue;const list=steps(b);if(!list.length)return'이 장의 목표 자료가 준비되지 않았습니다.';
 for(const s of list){if(!marker(b,s.id))return'목표 위치가 준비되지 않았습니다: '+s.id;if(s.kind==='destroy'&&!G.HonroQuestTargets.records(b).some(t=>t.id===s.id))return'파괴 장치가 준비되지 않았습니다: '+s.id;if(s.target&&!b.units.some(u=>u.id===s.target))return'동행 대상이 준비되지 않았습니다: '+s.target;if(s.opens&&!G.HonroQuestTargets.records(b).some(t=>t.id===s.opens))return'통로가 준비되지 않았습니다: '+s.opens;if(s.wave&&!marker(b,'wave-'+s.id))return'방어 경로가 준비되지 않았습니다: '+s.id;}return null;
}
function satisfied(b,s){const a=memory(b);if(a.done[s.id])return true;const evidence=G.HonroEvidenceQuests?.satisfied(b,s);if(evidence!==null&&evidence!==undefined)return evidence;
 if(s.kind==='route')return !!b.honroRouteChoice?.selectedRoute;
 if(s.kind==='destroy')return !!G.HonroQuestTargets.records(b).find(t=>t.id===s.id)?.broken;
 if(s.kind==='hold'){const h=a.holds[s.id];return !!h&&h.progress>=s.rounds&&h.spawned>=(s.wave?.count||0);}
 return false;
}
const current=b=>steps(b).find(s=>!s.optional&&!memory(b).done[s.id]);
const readySteps=b=>{const s=current(b);return !s?[]:s.parallelGroup?steps(b).filter(q=>q.parallelGroup===s.parallelGroup&&!memory(b).done[q.id]):[s];};
const reunionStage=b=>b.honroSplit?.version===2?28:27;
const fireScenario=b=>b.honroStage===reunionStage(b)&&steps(b).some(s=>s.id==='water-release')&&steps(b).some(s=>s.id==='fire-screen');
const firesStopped=b=>!!memory(b).done['water-release']&&!!memory(b).done['fire-screen'];
function target(b,s){const m=marker(b,s.id),t=s.kind==='destroy'&&G.HonroQuestTargets.records(b).find(t=>t.id===s.id),u=s.target&&b.units.find(u=>u.id===s.target),liveUnit=['rescue','interact'].includes(s.kind)&&u;
 return{id:s.id,kind:t?'seal':['reach','escort'].includes(s.kind)?'exit':'interact',x:liveUnit?u.x:t?t.x+t.w/2:m?.x,y:liveUnit?u.y-u.h:t?t.y:m?.y,label:s.label,...(t?{box:t}:{}),...(liveUnit?{unitId:u.id}:{})};
}
function state(b){const list=steps(b),s=current(b),a=memory(b),issue=sourceIssue(b),all=list.map(q=>({...target(b,q),done:!!a.done[q.id]}));let detail='';
 if(s?.kind==='hold'){const h=a.holds[s.id];detail=` · ${h?.progress||0}/${s.rounds}턴${h?.contested?' · 가까운 적을 밀어내세요':h?.guarded?' · 지키는 중':' · 같은 층의 표시 범위에서 유지'}`;}
 if(s?.id==='compare-ledgers'&&G.HonroEvidenceQuests?.pairReady(b)===false)detail+=' · 두 기록함을 든 동행이 같은 층에서 서로 가까이 모이세요';
 if(fireScenario(b)&&!firesStopped(b))detail+=` · 소각까지 ${Math.max(0,12-(a.fireTurns||0))} 적 턴`;
 const targets=G.HonroEvidenceQuests?.targets(b,s)||G.HonroRouteBranches?.targets(b,s)||readySteps(b).map(q=>target(b,q));
 if(s?.kind==='escort'){const u=b.units.find(u=>u.id===s.target);if(alive(u))targets.push({id:u.id,kind:'objective',x:u.x,y:u.y-u.h,unitId:u.id,label:'기록 운반자 · 가까이 동행'});}
 const complete=!issue&&!s;return{complete,objectiveReady:complete,minimumRound:1,settleRounds:0,summary:issue||`${list.filter(q=>a.done[q.id]).length}/${list.length} · ${s?.parallelGroup==='fire-control'?'불길 진압 '+list.filter(q=>q.parallelGroup==='fire-control'&&a.done[q.id]).length+'/2 · 설오 수문 / 휘겸 차단막'+detail:s?s.label+detail:'모든 목표 완료'}`,targets:targets.filter(t=>Number.isFinite(t.x)&&Number.isFinite(t.y)),allTargets:all};
}
function interactionTarget(b,m){if(!active(b)||m?.action!=='act3'||!m.target)return m;const s=steps(b).find(s=>s.id===m.id);if(!s||!['rescue','interact'].includes(s.kind))return m;const u=b.units.find(u=>u.id===m.target);return alive(u)&&!m.collected?u:null;}
function eligibility(app,m){const b=app.engine?.b,u=app.engine?.active,next=b&&current(b),s=b&&readySteps(b).find(q=>q.id===m.id);if(!active(b)||!alive(u)||u.side!==0||u.summoned||u.enthrall||m.collected)return{ok:false,reason:'상호작용할 수 없음'};
 if(!s)return{ok:false,reason:next?'먼저 '+next.label:'목표 완료'};
 if(!['interact','rescue'].includes(s.kind))return{ok:false,reason:s.label};
 if(s.requiredClass&&u.cls!==s.requiredClass)return{ok:false,reason:H.hero[s.requiredClass].name+' 필요'};
 const point=interactionTarget(b,m);if(!point)return{ok:false,reason:'보호할 주민을 찾을 수 없음'};
 if(!sameFloor(u,point))return{ok:false,reason:Math.abs(u.y-point.y)>150?'같은 층으로 이동':'더 가까이 이동'};
 if(app.canInput&&!app.canInput())return{ok:false,reason:'현재 행동이 끝난 뒤'};
 // Only the immediate working space must be clear. Distant fiends and other
 // storeys never turn a retrieval objective into an extermination objective.
 if(b.units.some(v=>v.side===1&&!v.honroObjectiveTarget&&v.summonKind!=='eater'&&!v.eaterCapturedBy&&alive(v)&&sameFloor(v,point,220)))return{ok:false,reason:'작업 지점 가까운 악귀부터 처치'};
 return{ok:true,reason:s.label};
}
function openGate(b,id){if(!id)return;const t=G.HonroQuestTargets.records(b).find(t=>t.id===id);if(t&&!t.broken){t.hp=0;t.broken=true;b.sceneVersion++;}}
function completeStep(app,s,actor){const b=app.engine.b,a=memory(b);if(a.done[s.id])return true;if(G.HonroEvidenceQuests?.prepareComplete(app,s,actor)===false)return false;a.done[s.id]=true;a.checkpoints.push({id:s.id,round:b.round,enemyEnd:b.teamEnds?.[1]||0});const m=marker(b,s.id);if(m)m.collected=true;openGate(b,s.opens);
 const lines=(G.HonroObjectiveRevision?.contentFor(b,app.stage)||app.stage).beats?.[s.id];if(lines?.length&&!G.HonroObjectiveRevision?.stageScene(app,s))app.sayLines(G.HonroAct3Content.scene(`act3-${b.honroStage}-${s.id}`,app.stage.name,lines.map(([who,text,meta={}])=>[who,text,{...meta,evidenceGoal:s.id}])));if(!lines?.length)app.event(s.label+' · 완료',{kind:'narration',source:'objective:'+s.id});app.dirty=true;return true;
}
function use(app,m){if(!eligibility(app,m).ok)return false;const e=app.engine,b=e.b,s=readySteps(b).find(q=>q.id===m.id),a=memory(b),u=s.target&&e.unit(s.target);
 if(G.HonroEvidenceQuests?.prepareComplete(app,s,e.active)===false)return false;
 if(s.kind==='rescue'){G.HonroObjectiveContributions?.approach(b,s.id,heroes(b),u,220);u.honroResolved=true;u.shield=Math.max(u.shield||0,Math.round(u.maxHp*.3));}
 if(s.startsEscort){a.escorts[s.target]={started:true};u.fixed=false;u.maxMove=u.moveLeft=900;u.walkSpeed=Math.min(u.walkSpeed||280,320);}
 G.HonroObjectiveContributions?.interact(b,s.id,e.active,{rescue:s.kind==='rescue',progress:steps(b).some(q=>['hold','destroy','escort','reach'].includes(q.kind)&&a.done[q.id])});
 completeStep(app,s,e.active);if(!app.checkMission(e))e.finishAction();app.dirty=true;return true;
}
function attach(app,e){if(!active(e.b))return;initialize(e.b);G.HonroEvidenceQuests?.repairMissing(app);if(e.honroAct3Attached)return;e.honroAct3Attached=true;
 const hurt=e.hurt.bind(e);e.hurt=function(u,amount,...args){const source=e.unit(args[0]);if(u.honroProtected&&source?.side===0&&!e.projectileDamage(args[2]))return;return hurt(u,amount,...args);};
 const damage=e.damageTerrain.bind(e);e.damageTerrain=function(t,amount,depth=0,owner=e.b.active){const s=steps(e.b).find(q=>q.id===t.id),actor=e.unit(owner);
  if(s?.kind==='destroy'&&s.requiredClass&&(!actor||actor.side!==0||actor.summoned||actor.enthrall||actor.cls!==s.requiredClass)){e.message(H.hero[s.requiredClass].name+'의 사격이 필요하다.');return;}
  // Closed passages only open as the ordered objective is committed; direct
  // splash damage cannot skip a sealed archive or create an inconsistent save.
  if(steps(e.b).some(q=>q.opens===t.id)&&!t.broken)return;
  return damage(t,amount,depth,owner);
 };
}
function spawnHold(app,s,h){if(!s.wave||h.spawned>=s.wave.count)return true;const e=app.engine,b=e.b,m=marker(b,'wave-'+s.id);if(!m)return false;
 const before=new Set(b.units.map(u=>u.id)),key='act3-'+s.id,n=s.wave.count-h.spawned;
 // Fresh city defence reuses the density gate; old battle snapshots stay unchanged.
 if(b.honroStage===21&&G.HonroEncounterDensity?.active(b)){const mem=G.HonroEncounterDensity.memory(b);mem.existingWarnings??={};if(!mem.existingWarnings[key]){mem.existingWarnings[key]={serial:b.honroState.actorTurnSerial||0,round:b.round,offered:{}};app.event('성문 동쪽에서 산개 둘이 다가옵니다. 다음 행동 동안 주민 곁 방어 위치를 살피세요.');app.dirty=true;} }
 if(G.HonroAllies.execute(app,{type:'spawn',kind:s.wave.kind,n,x:m.x,y:m.y,spacing:145,maxDistance:580,source:key})===false)return false;
 for(const u of b.units)if(!before.has(u.id)&&u.side===1)u.honroCohort='reinforcement';
 h.spawned+=n;memory(b).events[key]=true;app.event('길목에 '+n+'명의 위협이 다가온다.');app.dirty=true;return true;
}
function holdTick(app,s,m){const b=app.engine.b,a=memory(b),end=b.teamEnds?.[1]||0,h=a.holds[s.id]??={progress:0,spawned:0,lastEnemyEnd:end,continuous:false};
 const guards=heroes(b).filter(u=>(!s.requiredClass||u.cls===s.requiredClass)&&sameFloor(u,m,s.radius)),guarded=guards.length>0&&(s.id!=='compare-ledgers'||G.HonroEvidenceQuests?.pairReady(b)!==false),priorProgress=h.progress,intervalEnded=end>h.lastEnemyEnd,contested=b.units.some(u=>u.side===1&&!u.honroObjectiveTarget&&u.summonKind!=='eater'&&!u.eaterCapturedBy&&alive(u)&&sameFloor(u,m,s.contestRadius||230));
 if(!guarded||contested)h.continuous=false;
 else if(end===h.lastEnemyEnd&&b.side!==1)h.continuous=true;
 if(end>h.lastEnemyEnd){if(h.continuous&&guarded&&!contested)h.progress++;h.lastEnemyEnd=end;h.continuous=guarded&&!contested;app.dirty=true;}
 if(h.guarded===undefined)h.continuous=guarded&&!contested;
 G.HonroObjectiveContributions?.maintain(b,s.id,h,guards,h.progress>priorProgress,s.rounds,h.continuous,intervalEnded);
 h.guarded=guarded;h.contested=contested;
 if(app.actorBoundary&&guarded)spawnHold(app,s,h);
}
function escortTick(app,s,m,dt){const e=app.engine,b=e.b,a=memory(b),npc=e.unit(s.target),escort=a.escorts[s.target];if(!escort?.started||!alive(npc))return;
 const route=(b.honroMarkers||[]).filter(q=>q.id.startsWith('route:'+s.id+':')).sort((a,b)=>Number(a.id.split(':').at(-1))-Number(b.id.split(':').at(-1)));
 escort.waypoints??={};let index=escort.waypoints[s.id]||0;while(route[index]&&sameFloor(npc,route[index],90))index++;escort.waypoints[s.id]=index;
 const goal=route[index]||m,dir=Math.sign(goal.x-npc.x),leaders=heroes(b).filter(u=>sameFloor(u,npc,950)&&(u.x-npc.x)*dir>65),lead=leaders.length>0;
 if(dt>0&&dir&&lead&&!app.dialogue){const before={x:npc.x,y:npc.y};npc.fixed=false;npc.moveLeft=900;e.walk(npc,dir,Math.min(dt,.05));G.HonroObjectiveContributions?.escort(b,s.id,npc,m,[leaders.slice().sort((u,v)=>Math.hypot(u.x-before.x,u.y-before.y)-Math.hypot(v.x-before.x,v.y-before.y))[0]],before);}
 if(sameFloor(npc,m,170)&&heroes(b).some(u=>sameFloor(u,npc,540))){G.HonroObjectiveContributions?.finishEscort(b,s.id);completeStep(app,s);}
}
function failure(b){if(!active(b))return null;const a=memory(b);if(b.honroStage===reunionStage(b)&&[1,2].includes(b.honroSplit?.version)&&!a.done['party-reunion']&&G.HonroSplitCampaign?.allPresent(b)===false)return'합류하기 전에 동행을 잃어 두 조사팀이 모일 수 없다. 이 장을 다시 시작하자.';if(b.units.some(u=>u.honroProtected&&!alive(u)))return'지켜야 할 주민을 잃었다. 이 장을 다시 시작할 수 있다.';
 for(const s of steps(b))if(!satisfied(b,s)&&s.requiredClass&&!heroes(b).some(u=>u.cls===s.requiredClass))return H.hero[s.requiredClass].name+'이 쓰러져 남은 목표를 이어갈 수 없다. 이 장을 다시 시작하자.';
 if(fireScenario(b)&&!firesStopped(b)&&(a.fireTurns||0)>=12)return'불길이 핵심 기록에 닿았다. 수문과 차단막부터 다시 확보하자.';return null;
}
function tick(app,dt){const e=app.engine,b=e.b;if(!active(b)||app.dialogue||app.modal?.classList.contains('open')||['won','lost'].includes(b.phase))return;initialize(b);const a=memory(b);
 if(sourceIssue(b))return;G.HonroEvidenceQuests?.observe(app); // Missing authoring is never a completed stage.
 if(fireScenario(b)&&!firesStopped(b)){const end=b.teamEnds?.[1]||0;a.fireStartEnd??=end;a.fireTurns=Math.max(0,end-a.fireStartEnd);}
 let s=current(b);while(s&&satisfied(b,s)){if(completeStep(app,s)===false)break;s=current(b);}
 // Commit the reunion at the same actor boundary that opens its Story lock.
 // A dash crossing the circle earlier in the action is not a completed meeting.
 if(s){const m=marker(b,s.id);if(s.kind==='route')G.HonroRouteBranches?.commit(app,s);else if(s.kind==='hold')holdTick(app,s,m);else if(s.kind==='reach'){const group=heroes(b),r=s.radius||180;const reunion=s.id==='party-reunion'&&[1,2].includes(b.honroSplit?.version),pairedExit=['waterworks-exit','workshop-exit','deep-depot-exit'].includes(s.id),present=!(reunion||pairedExit&&[1,2].includes(b.honroSplit?.version))||G.HonroSplitCampaign?.allPresent(b)===true,safeBoundary=!reunion||!!app.actorBoundary&&!app.modal?.classList.contains('open')&&!app.done;const crossing=G.HonroStakeCrossing?.active(b)&&G.HonroStakeCrossing.crossings(b).some(c=>c.markerId===s.id);const fieldArrival=crossing&&b.honroStage===25&&G.HonroEvidenceQuests?.fieldActive(b);if(G.HonroStakeCrossing?.allowsStep(b,s.id)!==false&&(!fieldArrival||group.every(u=>sameFloor(u,m,210)))&&safeBoundary&&present&&group.length&&(crossing||(s.allHeroes||pairedExit?group.every(u=>sameFloor(u,m,r)):group.some(u=>sameFloor(u,m,r))))){if(!crossing){const arrived=group.filter(u=>sameFloor(u,m,r));G.HonroObjectiveContributions?.arrive(b,s.id,s.allHeroes?arrived:[arrived.find(u=>u.id===b.active)||arrived[0]],p=>sameFloor(p,m,r));}completeStep(app,s);}}else if(s.kind==='escort')escortTick(app,s,m,dt);}
 s=current(b);while(s&&satisfied(b,s)){if(completeStep(app,s)===false)break;s=current(b);}
 const group=heroes(b);
 for(const step of readySteps(b))if(step.kind==='rescue'){const point=b.units.find(u=>u.id===step.target)||marker(b,step.id);G.HonroObjectiveContributions?.approach(b,step.id,group,point,220,!b.units.some(v=>v.side===1&&!v.honroObjectiveTarget&&v.summonKind!=='eater'&&!v.eaterCapturedBy&&alive(v)&&sameFloor(v,point,220)));}
 G.HonroObjectiveContributions?.observe(b,group);
 G.HonroEncounters.update(app,dt,{progress:Math.max(0,...group.map(u=>u.x)),height:Math.min(b.height,...group.map(u=>u.y)),broken:G.HonroQuestTargets.records(b).filter(t=>t.broken).length,collected:b.honroMarkers.filter(m=>m.collected).length});
 app.checkMission(e);
}
function entry(app,options={}){return [...(options.interlude===false?[]:app.stage.narration).map(text=>['서술',text,{kind:'narration',presentation:'inline'}]),...G.HonroRouteBranches?.entryLines(app.engine?.b)||[],...app.stage.story,['안내',app.stage.guide,{kind:'guide',storyId:'act3-guide-'+app.stage.id,storyTitle:app.stage.name,focus:state(app.engine?.b||{honroStage:app.stage.id,honroState:{},honroMarkers:[],terrain:[],units:[]}).targets[0]?.kind||'interact'}]];}
G.HonroAct3={active,initialize,marker,steps,memory,current,state,sourceIssue,interactionTarget,eligibility,use,attach,tick,failure,entry,satisfied,heroes,sameFloor,readySteps,fireScenario,firesStopped};
})(globalThis);

