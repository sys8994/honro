(function(G){'use strict';
// Stage11 quest-only migration. Never regenerate a live battlefield or grant a
// completion: the ordinary rescue/E and automatic evidence tick own success.
const A=G.HonroAct2,clone=v=>JSON.parse(JSON.stringify(v));
const retired=new Set(['knot-west','clear-west','knot-east','hold-knots','clear-road']);
const known=[['knot-west','clear-west','knot-east','hold-knots','resident','trace'],['knot-west','clear-west','knot-east','hold-knots','resident','clear-road','trace'],['resident','trace']];
const campaign=b=>b?.honroStage===11&&!b.honroCustom&&b.mode==='campaign'&&b.honroMapOrigin==='campaign'&&b.honroAct2Revision>=2&&b.honroStage11EncounterRevision===2;
const active=b=>campaign(b)&&b.honroStage11QuestRevision===1;
const supported=list=>Array.isArray(list)&&known.some(ids=>ids.join(',')===list.map(s=>s.id).join(','));
const steps=()=>[{id:'resident',kind:'rescue',label:'하부 피난처 주민에게 붙은 혼 분리'},{id:'trace',kind:'pacing-event',afterPacing:'resident',label:'구조한 자리에서 북쪽 단서 기록'}];
function content(original){if(!original)return original;const st=clone(original),approved=G.HonroNarrativeCatalogue.data.stages[11];st.steps=steps();
 // This module owns quest migration, never a second current prose/row identity.
 for(const key of ['goal','guide','narration','story','outro','storySummary'])st[key]=clone(approved[key]);
 st.summary=st.storySummary;if(st.act2Plan)st.act2Plan.sequence=steps();return st;}

const retiredResponse=(b,ev)=>active(b)&&ev?.honroStage11Response===1&&retired.has(ev.honroRavineTrigger?.objectiveDone);
function apply(b){b.honroAct2Steps=steps();for(const key of ['honroNarrativeContent','honroVerticalStage14Content'])if(b[key])b[key]=content(b[key]);b.honroStage11QuestRevision=1;
 for(const m of b.honroMarkers||[])if(retired.has(m.id)||m.id==='trace')delete m.action;
 // Cancel only unadmitted requests whose mandatory quest was removed. Existing
 // enemies, event flags, warnings/history and all earned state remain present.
 const cancelled=new Set((b.honroEvents||[]).filter(ev=>retiredResponse(b,ev)).map(ev=>ev.id));
 if(b.honroState?.pendingEvents)b.honroState.pendingEvents=b.honroState.pendingEvents.filter(id=>!cancelled.has(id));
 for(const key of ['ravineComposition','encounterDensity']){const mem=b.honroState?.[key];for(const [id,w]of Object.entries(mem?.existingWarnings||mem?.warnings||{}))if(/^hold-knots-/.test(id)&&!mem.entries?.[id]){w.cancelled='stage11-quest-simplification';w.status='cancelled';}}
}
function upgradeBattle(b){if(!campaign(b)||['won','lost'].includes(b.phase)||b.honroStage11QuestRevision!==undefined||![undefined,1].includes(b.honroAct2PacingRevision)||![undefined,1].includes(b.honroStage11TraceExitRevision)||!supported(b.honroAct2Steps))return false;G.HonroStage11TraceExit.upgradeBattle(b);G.HonroAct2Pacing.upgradeBattle(b);apply(b);return true;}
function author(project){return{...project,stages:project.stages.map(original=>{if(original.metadata?.stageId!==11||!original.metadata.campaign||!supported(original.initialState?.honroAct2Steps)||![undefined,1].includes(original.initialState.honroStage11QuestRevision))return original;const st=clone(original);st.initialState.honroAct2Steps=steps();st.initialState.honroStage11QuestRevision=1;st.initialState.honroStage11TraceExitRevision=1;st.initialState.honroAct2PacingRevision=1;for(const key of ['honroNarrativeContent'])if(st.initialState[key])st.initialState[key]=content(st.initialState[key]);for(const m of st.markers||[])if(retired.has(m.id)||m.id==='trace')delete m.action;st.design.stage11Quest={revision:1,required:'resident rescue',evidence:'trace committed automatically after rescue',retired:[...retired]};return st;})};}
G.HONRO_CONTENT.stages[10]=content(G.HONRO_CONTENT.stages[10]);
G.HonroAct2Plan.stages[0]=G.HONRO_CONTENT.stages[10].act2Plan;
const attach=A.attach;A.attach=function(app,e){if(upgradeBattle(e.b))app.dirty=true;return attach(app,e);};
// Wait for production completeStep to commit the existing trace dialogue and
// checkpoint before the ordinary mission/outcome path can award the chapter.
const state=A.state;A.state=function(b){const out=state(b);if(active(b)&&!A.memory(b).done.trace)return{...out,...(A.memory(b).done.resident?{summary:'주민 구조 완료 · 북쪽 단서 자동 기록',targets:[]}:{}),complete:false,objectiveReady:false};return out;};
G.HonroStage11Quest={active,author,upgradeBattle,retiredResponse,content};
})(globalThis);
