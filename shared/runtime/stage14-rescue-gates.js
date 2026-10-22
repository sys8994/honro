(function(G){'use strict';
// Retire only the duplicated clearance gates. Saved rescue facts, bodies,
// dialogue cursors, finite defense and reward ledgers remain their own owners.
const A=G.HonroAct2,clone=v=>JSON.parse(JSON.stringify(v)),retired=new Set(['clear-upper','clear-middle']);
const oldIds='clear-upper,family-upper,clear-middle,family-mid,family-lower,bridge,hold-refuge,clear-village';
const newIds='family-upper,family-mid,family-lower,bridge,hold-refuge,clear-village';
const supported=list=>Array.isArray(list)&&[oldIds,newIds].includes(list.map(s=>s.id).join(','));
const filter=list=>list.filter(s=>!retired.has(typeof s==='string'?s:s.id));
const campaign=b=>b?.honroStage===14&&!b.honroCustom&&b.mode==='campaign'&&b.honroMapOrigin==='campaign'&&b.honroAct2Revision>=2&&b.honroVerticalStage14Revision===1;
const active=b=>campaign(b)&&b.honroStage14RescueRevision===1;
function content(original){if(!original)return original;const out=clone(original);if(supported(out.steps))out.steps=filter(out.steps);if(out.act2Plan?.sequence)out.act2Plan.sequence=filter(out.act2Plan.sequence);out.guide=G.HonroNarrativeCatalogue.data.stages[14].guide;return out;}
function apply(b){b.honroAct2Steps=filter(b.honroAct2Steps);for(const key of ['honroNarrativeContent','honroVerticalStage14Content'])if(b[key])b[key]=content(b[key]);b.honroStage14RescueRevision=1;for(const m of b.honroMarkers||[])if(retired.has(m.id))delete m.action;}
function upgradeBattle(b){if(!campaign(b)||['won','lost'].includes(b.phase)||b.honroStage14RescueRevision!==undefined||![undefined,1].includes(b.honroAct2PacingRevision)||!supported(b.honroAct2Steps))return false;G.HonroAct2Pacing.upgradeBattle(b);apply(b);return true;}
function author(project){return{...project,stages:project.stages.map(original=>{const state=original.initialState;if(original.metadata?.stageId!==14||!original.metadata.campaign||state?.honroVerticalStage14Revision!==1||![undefined,1].includes(state.honroStage14RescueRevision)||!supported(state.honroAct2Steps))return original;const st=clone(original);st.initialState.honroAct2Steps=filter(st.initialState.honroAct2Steps);st.initialState.honroStage14RescueRevision=1;for(const key of ['honroNarrativeContent','honroVerticalStage14Content'])if(st.initialState[key])st.initialState[key]=content(st.initialState[key]);for(const m of st.markers||[])if(retired.has(m.id))delete m.action;st.design.stage14Rescue={revision:1,retired:[...retired],scope:'Only duplicate clearance gates; three ordered rescues and refuge defense retained'};return st;})};}
G.HONRO_CONTENT.stages[13]=content(G.HONRO_CONTENT.stages[13]);G.HonroAct2Plan.stages[3]=G.HONRO_CONTENT.stages[13].act2Plan;
const attach=A.attach;A.attach=function(app,e){if(upgradeBattle(e.b))app.dirty=true;return attach(app,e);};
G.HonroStage14Rescue={active,author,upgradeBattle,content};
})(globalThis);
