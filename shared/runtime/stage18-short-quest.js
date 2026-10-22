(function(G){'use strict';
const A=G.HonroAct2,clone=v=>JSON.parse(JSON.stringify(v)),old='clear-wards,silence,hold-silence,upper-chain,bell-descent,leak,keeper,clear-bell',ids='silence,hold-silence,upper-chain,bell-descent,leak,keeper';
const campaign=b=>b?.honroStage===18&&!b.honroCustom&&b.mode==='campaign'&&b.honroMapOrigin==='campaign'&&b.honroBellRevision===1;
const active=b=>campaign(b)&&b.honroStage18ShortRevision===1;
function revise(list){return list.filter(s=>!['clear-wards','clear-bell'].includes(s.id)).map(s=>s.id==='silence'?{...s,label:'억제진 가동'}:s.id==='hold-silence'?{...s,label:'억제진 유지',rounds:2,contestRadius:0,wave:{kind:'picks',count:2,eliteEvery:99}}:s.id==='upper-chain'?{...s,label:'고정구 해제'}:s.id==='bell-descent'?{...s,label:'종 하강'}:s.id==='leak'?{...s,label:'새는 혼 수습'}:s.id==='keeper'?{...s,label:'종지기 제압'}:s);}
function content(original){if(!original)return original;const st=clone(original);if(st.steps)st.steps=revise(st.steps);st.guide=G.HonroNarrativeCatalogue.data.stages[18].guide;st.goal=G.HonroNarrativeCatalogue.data.stages[18].goal;return st;}
function apply(b){b.honroAct2Steps=revise(b.honroAct2Steps);b.honroStage18ShortRevision=1;for(const key of ['honroNarrativeContent'])if(b[key])b[key]=content(b[key]);
 // Retire unadmitted responses only. Existing units, flags, entries and all
 // pending/active dialogue text/cursors remain the snapshot's own history.
 const cancelled=new Set((b.honroEvents||[]).filter(ev=>ev.id==='bell-descent-answer'&&!b.honroState.flags?.['event:'+ev.id]).map(ev=>ev.id));b.honroEvents=(b.honroEvents||[]).filter(ev=>!cancelled.has(ev.id));if(b.honroState.pendingEvents)b.honroState.pendingEvents=b.honroState.pendingEvents.filter(id=>!cancelled.has(id));
 for(const [source,w]of Object.entries(b.honroState.bellDescent?.warnings||{}))if((source==='keeper-retaliation'||/^hold-silence-/.test(source))&&!b.honroState.bellDescent.entries?.[source]&&(A.memory(b).done['hold-silence']||source==='keeper-retaliation')){w.cancelled='short-quest';w.status='cancelled';}
}
function upgradeBattle(b){if(!campaign(b)||['won','lost'].includes(b.phase)||b.honroStage18ShortRevision!==undefined||!Array.isArray(b.honroAct2Steps)||![old,ids].includes(b.honroAct2Steps.map(s=>s.id).join(',')))return false;apply(b);return true;}
function tune(b){if(!active(b)||!b.honroStage18ShortFresh)return;for(const u of b.units){const hp=u.honroStage18LocalHp||(u.honroSpawnSource==='hold-silence-0'?220:0);if(!hp||u.honroStage18LocalTuned)continue;const d=G.HONRO_CORE.DIFFICULTIES[b.difficulty];u.combatBaseHp=hp/G.HONRO_CORE.DIFFICULTIES.normal.hp;u.hp=u.maxHp=Math.round(u.combatBaseHp*d.hp);u.honroStage18LocalTuned=1;const row=G.HonroProgression.contributionState(b)?.enemies[u.honroContributionId||u.id];if(row&&row.progress===0)row.hp=u.maxHp;}}
const attach=A.attach;A.attach=function(app,e){if(upgradeBattle(e.b))app.dirty=true;const out=attach(app,e);tune(e.b);return out;};
const satisfied=A.satisfied;A.satisfied=function(b,s){return active(b)&&s.id==='hold-silence'?(A.memory(b).holds?.[s.id]?.progress||0)>=2:satisfied(b,s);};
const pacing=G.HonroAct2Pacing.satisfied;G.HonroAct2Pacing.satisfied=function(b,s){return active(b)&&s.id==='hold-silence'?(A.memory(b).holds?.[s.id]?.progress||0)>=2:pacing(b,s);};
const tick=A.tick;A.tick=function(app,dt){const out=tick(app,dt),b=app.engine?.b;if(active(b))tune(b);return out;};
G.HONRO_CONTENT.stages[17]=content(G.HONRO_CONTENT.stages[17]);G.HonroStage18Bell.steps=revise(G.HonroStage18Bell.steps);
const state=A.state;A.state=function(b){const out=state(b);if(!active(b))return out;const hold=A.steps(b).find(s=>s.id==='hold-silence'),h=A.memory(b).holds?.[hold.id],anchor=G.HonroQuestTargets.records(b).find(t=>t.id==='upper-chain');if(A.memory(b).done.silence&&(!A.satisfied(b,hold)||!anchor?.broken))out.summary=`병렬 안정화 · 억제 ${h?.progress||0}/2라운드 · 고정구 ${anchor?.broken?'해제':'남음'}`;if(['warning','waiting','lowering'].includes(G.HonroStage18Bell.memory(b).status))out.summary='종 하강 · '+G.HonroStage18Bell.memory(b).reason;out.targets=out.targets?.map(t=>t.id==='hold-silence'?{...t,label:'담허 · 억제진 2라운드'}:t);if(!A.memory(b).done.keeper){out.complete=false;out.objectiveReady=false;}return out;};
G.HonroStage18Short={freeInteraction:(b,m)=>b?.honroStage===18&&!b.honroCustom&&['silence','leak'].includes(m?.id),active,upgradeBattle,revise,content};
})(globalThis);
