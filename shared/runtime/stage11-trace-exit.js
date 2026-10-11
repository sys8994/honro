(function(G){'use strict';
// Approved Stage 11 pacing revision: the northern trace ends the expedition.
// Preserve the original map/encounters and old audit fixtures; only this explicit
// objective layer removes the global cleanup, including recognized campaign saves.
const A=G.HonroAct2,clone=v=>JSON.parse(JSON.stringify(v));
const oldIds=['knot-west','clear-west','knot-east','hold-knots','resident','clear-road','trace'];
const newIds=oldIds.filter(id=>id!=='clear-road');
const composed=b=>b?.honroStage===11&&!b.honroCustom&&b.honroAct2Revision>=2&&b.honroStage11EncounterRevision===2;
const active=b=>composed(b)&&b.honroStage11TraceExitRevision===1;
const sameIds=(steps,ids)=>Array.isArray(steps)&&steps.length===ids.length&&steps.every((s,i)=>(typeof s==='string'?s:s?.id)===ids[i]);
const withoutCleanup=steps=>steps.filter(s=>(typeof s==='string'?s:s?.id)!=='clear-road');
function trimPlan(owner){if(!owner)return;
 if(Array.isArray(owner.steps)&&owner.steps.some(s=>(typeof s==='string'?s:s?.id)==='clear-road'))owner.steps=withoutCleanup(owner.steps);
 if(Array.isArray(owner.act2Plan?.sequence)&&owner.act2Plan.sequence.some(s=>(typeof s==='string'?s:s?.id)==='clear-road'))owner.act2Plan.sequence=withoutCleanup(owner.act2Plan.sequence);
}
// A saved battle owns its HP, XP, bodies, progression/history, geometry and
// queued dialogue. Do not rebuild it from current content or clear old done flags.
function upgradeBattle(b){
 if(!composed(b)||b.honroMapOrigin!=='campaign'||b.mode!=='campaign'||['won','lost'].includes(b.phase)||b.honroStage11TraceExitRevision!==undefined)return false;
 if(!sameIds(b.honroAct2Steps,oldIds))return false;
 b.honroAct2Steps=withoutCleanup(b.honroAct2Steps);trimPlan(b.honroNarrativeContent);
 b.honroStage11TraceExitRevision=1;return true;
}
function author(project){return {...project,stages:project.stages.map(original=>{
 if(!original.metadata?.campaign||original.metadata.stageId!==11||original.initialState?.honroStage11EncounterRevision!==2||!(original.initialState?.honroAct2Revision>=2))return original;
 if(original.initialState.honroStage11TraceExitRevision!==undefined&&original.initialState.honroStage11TraceExitRevision!==1)return original;
 const steps=original.initialState.honroAct2Steps;if(!sameIds(steps,oldIds)&&!sameIds(steps,newIds))return original;
 const stage=clone(original);stage.initialState.honroAct2Steps=withoutCleanup(stage.initialState.honroAct2Steps);stage.initialState.honroStage11TraceExitRevision=1;return stage;
})};}
const st=G.HONRO_CONTENT.stages[10];trimPlan(st);
st.guide+=' 주민을 구한 뒤 북쪽 혼의 흔적을 조사하면 완료됩니다. 남은 적과의 전투는 선택입니다.';
const narrativeAuthor=G.HonroNarrativeRevision.author;
G.HonroNarrativeRevision.author=project=>author(narrativeAuthor(project));
const attach=A.attach;
A.attach=function(app,e){if(upgradeBattle(e.b))app.dirty=true;return attach(app,e);};
G.HonroStage11TraceExit={active,author,upgradeBattle};
})(globalThis);
