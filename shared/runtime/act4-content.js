(function(G){'use strict';
const C=G.HONRO_CORE,copy=v=>JSON.parse(JSON.stringify(v)),enabled=G.HONRO_ACT4_RELEASE===true;
const active=b=>enabled&&b?.honroAct4Official===1&&!b.honroCustom&&b.honroStage>=31&&b.honroStage<=40;
function state(p){const runId=p.equipment.runId;if(!p.honroAct4||p.honroAct4.version!==1||p.honroAct4.runId!==runId)p.honroAct4={version:1,runId,completed:{},factEvents:{}};p.honroAct4.completed??={};p.honroAct4.factEvents??={};return p.honroAct4;}
function prepare(b,p){if(!active(b))return;const q=state(p),n=b.honroStage;if(b.honroAct4PreparedRunId===q.runId)return;b.honroAct4PreparedRunId=q.runId;b.honroAct4ReviewRunId=q.runId;b.honroAct4Design??=copy(b.honroMap.act4);b.honroPreviewFar??={key:[31,35,36].includes(n)?'act4Dawn':'act4Sea'};
 const previous=q.completed[n-1];if(previous?.residents&&[39,40].includes(n))for(const u of b.units.filter(u=>u.honroAct4Resident)){const v=previous.residents.find(v=>v.id===u.id);if(v){u.hp=Math.min(u.maxHp,v.hp);u.dead=v.dead;}}
 b.honroAct4EntryResidents=copy(b.units.filter(u=>u.honroAct4Resident).map(u=>({id:u.id,hp:u.hp,dead:u.dead})));
 if(n===40&&q.rescued?.sourceRun&&q.completed[39]?.sourceRun===q.rescued.sourceRun)b.honroAct4EntryProof={fromStage:39,targetStage:40,sourceRun:q.rescued.sourceRun,runId:q.runId};
}
G.HonroAct4Content={enabled,active,state,prepare,revision:3};if(!enabled)return;
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
