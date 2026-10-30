(function(G){'use strict';
const C=G.HONRO_CORE,copy=v=>JSON.parse(JSON.stringify(v)),enabled=G.HONRO_ACT4_RELEASE===true;
const active=b=>enabled&&b?.honroAct4Official===1&&!b.honroCustom&&b.honroStage>=31&&b.honroStage<=40;
function state(p){const runId=p.equipment.runId;if(!p.honroAct4||p.honroAct4.version!==1||p.honroAct4.runId!==runId)p.honroAct4={version:1,runId,completed:{},factEvents:{}};p.honroAct4.completed??={};p.honroAct4.factEvents??={};return p.honroAct4;}
function prepare(b,p){if(!active(b))return;const q=state(p),n=b.honroStage;if(b.honroAct4PreparedRunId===q.runId)return;b.honroAct4PreparedRunId=q.runId;b.honroAct4ReviewRunId=q.runId;b.honroAct4Design??=copy(b.honroMap.act4);b.honroPreviewFar??={key:[31,35,36].includes(n)?'act4Dawn':'act4Sea'};
 const previous=q.completed[n-1];if(previous?.residents&&[39,40].includes(n))for(const u of b.units.filter(u=>u.honroAct4Resident)){const v=previous.residents.find(v=>v.id===u.id);if(v){u.hp=Math.min(u.maxHp,v.hp);u.dead=v.dead;}}
 b.honroAct4EntryResidents=copy(b.units.filter(u=>u.honroAct4Resident).map(u=>({id:u.id,hp:u.hp,dead:u.dead})));
 if(n===40&&q.rescued?.sourceRun&&q.completed[39]?.sourceRun===q.rescued.sourceRun)b.honroAct4EntryProof={fromStage:39,targetStage:40,sourceRun:q.rescued.sourceRun,runId:q.runId};
}
// Presentation reads the same saved event state as checkMission. Never infer
// Act4 completion from an empty enemy roster or mutate event receipts here.
function objectiveState(b){
 const q=b.honroAct4PreviewState||{},n=b.honroStage,foes=b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length;
 const complete=!!q.complete,failed=!!q.failure||b.phase==='lost'||!b.units.some(u=>u.side===0&&!u.summoned&&!u.enthrall&&!u.dead&&u.hp>0),closed=key=>!!q.events?.[key]?.terminal;
 let text;
 if(complete)text='목표 완료';
 else if(failed)text='임무 실패 · 다시 시작하세요';
 else if(q.reader)text='대화를 마친 뒤 남은 목표를 확인하세요';
 else if([31,32,35,36,40].includes(n)&&foes)text='주변 위협을 제압하세요 · 남은 적 '+foes+'명';
 else switch(n){
  case 31:text=q.boat?.phase==='docked'?'살아 있는 동행 전원을 배 갑판에 모은 뒤 상호작용하세요':'선착장으로 이동하며 배가 도착하기를 기다리세요';break;
  case 32:text=q.safeSeven&&closed('missing_four')?'살아 있는 동행 전원을 포구 동쪽 출구에 모은 뒤 상호작용하세요':'설오를 포구 안쪽 집 앞으로 보내 주민과 재회하고 보고를 들으세요';break;
  case 33:text='물때를 살피며 살아 있는 동행 전원을 동쪽 높은 바위 출구에 모은 뒤 상호작용하세요';break;
  case 34:text='살아 있는 동행 전원을 절벽 위 동쪽 출구에 모은 뒤 상호작용하세요';break;
  case 35:text='살아 있는 동행 전원을 대숲 동쪽 끝에 모은 뒤 상호작용하세요';break;
  case 36:text=q.door?.phase==='standing'||!q.door?'휘겸을 마을의 문 가까이 보내 상호작용하세요':q.door.phase==='falling'?'문이 넘어지는 장면을 지켜보세요':!['A4.S36.DOOR.01','A4.S36.DOOR.02'].every(id=>q.receipts?.includes(id))?'넘어진 문 곁에서 휘겸의 대화를 확인하세요':!closed('leave')?'동쪽 마을 끝으로 이동해 이탈 대화를 확인하세요':'살아 있는 동행 전원을 마을 동쪽 끝에 모은 뒤 상호작용하세요';break;
  case 37:text=closed('signal')?'살아 있는 동행 전원을 곶 동쪽 출구에 모은 뒤 상호작용하세요':'동쪽 곶으로 접근해 먼 구조 신호와 몸짓을 확인하세요';break;
  case 38:text=q.connected?'연결된 길을 건너 살아 있는 동행 전원을 동쪽 출구에 모은 뒤 상호작용하세요':'담허로 연결 지점을 조사하거나 아래 비상 턱으로 건너세요 · 동행 전원 동쪽 출구 집결 후 상호작용';break;
  case 39:text=!q.exitStable?'구조 구역 동쪽의 출구 고정 지점에서 상호작용하세요':!q.netOpen?'주민을 붙잡은 그물 가까이에서 상호작용하세요':q.rescued?.ids?.length!==4?'주민 네 명이 동쪽 높은 안전 지대로 이동하도록 길을 열어 주세요':'주민 네 명의 안전을 지키며 동행 전원을 동쪽 출구에 모은 뒤 상호작용하세요';break;
  case 40:text=q.returnEscort?.phase!=='safe'?'주민들과 배·높은 길을 따라 동쪽 안전 지대로 이동하세요':!closed('next')?'안전 지대에서 재회와 귀환 대화를 확인하세요':'살아 있는 동행 전원을 동쪽 안전 지대에 모은 뒤 상호작용하세요';break;
  default:text='남은 사건을 확인하세요';
 }
 const row={id:'act4-'+n,text,done:complete,current:!complete&&!failed};
 return{complete,objectiveReady:complete,minimumRound:1,settleRounds:0,summary:text,currentInstruction:text,currentObjectiveId:row.id,targets:[],allTargets:[],checklist:[row],visibleChecklist:[row],failureText:failed?text:'',completionText:complete?text:''};
}
G.HonroAct4Content={enabled,active,state,prepare,objectiveState,revision:4};if(!enabled)return;
for(const st of G.HONRO_ACT4_CONTENT)if(!G.HONRO_CONTENT.stages.some(s=>s.id===st.id))G.HONRO_CONTENT.stages.push(copy(st));
G.HONRO_CONTENT.acts.push({id:4,name:'끊긴 옛길',first:31,last:40});G.HONRO_CONTENT.nextAct={id:5,available:false,requires:[40]};
// Use the existing future Act4 level plan; its terminal plateau is unchanged.
const balance=G.HONRO_BALANCE,exits=balance.futureActs.find(a=>a.act===4).stageExitLevels;let entry=balance.stages[29].exitLevel;
for(let n=31;n<=40;n++){const exit=exits[Math.min(n-31,exits.length-1)];if(!balance.stages[n-1])balance.stages.push({...balance.stages[29],id:n,act:4,entryLevel:entry,exitLevel:exit,initialEnemies:G.HONRO_ACT4_CONTENT[n-31].enemies,maxAlive:G.HONRO_ACT4_CONTENT[n-31].enemies,activeEnemies:3});entry=exit;}
const J=G.HonroJourneyContent;
for(const st of G.HONRO_ACT4_CONTENT)if(!J.at(st.id))J.places.push({stageId:st.id,region:'끊긴 옛길',place:st.place,event:st.name,layer:[35,36].includes(st.id)?'mountain':'city',variant:[35,36].includes(st.id)?'forest':'river',restName:st.name,restDescription:'',map:[150+(st.id-31)*145,650]});
const required=J.required;J.required=(p,id)=>id>=31||id==null&&p.cleared[40]?[]:required(p,id);
const optional=J.optional;J.optional=(p,id,...args)=>id>=31||id==null&&p.cleared[40]?[]:optional(p,id,...args);
const transition=J.transitionAfter;J.transitionAfter=id=>id>=31&&id<40?'direct':transition(id);
Object.defineProperty(J,'ending',{configurable:true,value:{stageId:40,region:'끊긴 옛길',place:'돌아가는 배',event:'돌아가는 배',layer:'city',variant:'river',restName:'돌아가는 배',restDescription:'',endingTitle:G.HONRO_ACT4_REVIEWED.ui.find(r=>r[0]==='A4.S40.ROSTER')[1],nextText:'다음 여정은 준비 중입니다.'}});
})(globalThis);
