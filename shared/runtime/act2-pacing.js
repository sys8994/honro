(function(G){'use strict';
// Explicit campaign overlay. Live snapshots keep bodies, HP, geometry, ledgers
// and completed flags; only recognized unfinished objective contracts migrate.
const A=G.HonroAct2,H=G.HONRO_CONTENT,clone=v=>JSON.parse(JSON.stringify(v));
const ids=[11];
const supported=(id,b)=>id===11&&b.honroStage11EncounterRevision===2;
const active=b=>ids.includes(b?.honroStage)&&!b.honroCustom&&b.honroAct2PacingRevision===1;
function reviseSteps(list,id){return list.map(s=>id===11&&s.id==='clear-west'?{...s,kind:'pacing-event',afterPacing:'knot-west',label:'서쪽 혼매듭 해체 확인'}:clone(s));}
function content(st,id){if(!st)return st;const out=clone(st);if(out.steps)out.steps=reviseSteps(out.steps,id);if(out.act2Plan?.sequence)out.act2Plan.sequence=reviseSteps(out.act2Plan.sequence.map(s=>typeof s==='string'?{id:s}:s),id).map(s=>Object.keys(s).length===1?s.id:s);
 if(id===11){out.guide='소단으로 서쪽 혼매듭 주변의 수비를 제압하고 매듭을 푸세요. 중앙 매듭 해체를 4라운드 지킨 뒤 하부 주민을 구조하세요. 피난처 동쪽 오름길 초입의 혼 흔적을 조사하면 완료됩니다. 높은 고목과 동쪽 사격턱은 선택 접근로입니다.';out.beats??={};out.beats['clear-west']=[['소단','서쪽 매듭은 풀렸어요. 뒤쪽 기척은 남아 있지만 중앙으로 이어진 혼줄부터 끊어야 해요.']];}
 return out;
}
function upgradeBattle(b){if(!ids.includes(b?.honroStage)||b.honroCustom||b.mode!=='campaign'||b.honroMapOrigin!=='campaign'||['won','lost'].includes(b.phase)||b.honroAct2PacingRevision!==undefined||!supported(b.honroStage,b))return false;
 const list=b.honroAct2Steps;if(!Array.isArray(list)||list.map(s=>s.id).join(',')!=='knot-west,clear-west,knot-east,hold-knots,resident,trace')return false;
 b.honroAct2Steps=reviseSteps(list,11);b.honroNarrativeContent=content(b.honroNarrativeContent,11);b.honroAct2PacingRevision=1;return true;
}
function satisfied(b,s){if(!active(b))return null;const a=A.memory(b);
 if(s.kind==='pacing-event')return !!a.done[s.afterPacing];
 // The protected interval is the event. Blocked optional entry mouths may not
 // turn a completed four-round defense into an unbounded admission wait.
 if(b.honroStage===11&&s.id==='hold-knots')return (a.holds?.[s.id]?.progress||0)>=s.rounds;
 return null;
}
const removedRoles=new Set(['entry-pair','knot-pair','knot-retainer-shot','low-bough-crossfire','ritual-close-pair','ritual-second-line','inner-front-pair','inner-front-command','mouth-entry-pack','refuge-exit-pair']);
function author(project,only=ids){return{...project,stages:project.stages.map(original=>{const id=original.metadata?.stageId;if(!only.includes(id)||!ids.includes(id)||!original.metadata?.campaign||!supported(id,original.initialState||{}))return original;
 const st=clone(original),b=st.initialState;b.honroAct2PacingRevision=1;b.honroAct2Steps=reviseSteps(b.honroAct2Steps,id);for(const key of ['honroNarrativeContent','honroVerticalStage14Content'])if(b[key])b[key]=content(b[key],id);
 st.units=st.units.filter(u=>!removedRoles.has(u.stageOverrides?.honroEncounterRole));const alive=new Set(st.units.map(u=>u.id));for(const group of st.encounters||[])group.unitIds=group.unitIds.filter(id=>alive.has(id));
 st.events=st.events.filter(ev=>!['ravine-response-ritual-west-pursuit','ravine-response-ritual-east-turn'].includes(ev.id));
 const trace={x:11900,y:8000,surfaceId:'rv-north-trace'};Object.assign(st.markers.find(m=>m.id==='trace'),trace);for(const e of st.elements||[])if(e.id==='rv-goal-trace')Object.assign(e,{x:trace.x,y:trace.y});
 for(const key of ['exit','northTrace'])Object.assign(st.anchors[key],trace);
 const space=st.design.space;space.sites.trace={...space.sites.trace,...trace,standing:clone(trace)};const main=space.routes.find(r=>r.id==='main');if(main){const end=main.anchors.findLastIndex(p=>p.x===11000);if(end>=0)main.anchors=[...main.anchors.slice(0,end+1),clone(trace)];st.routes=main.anchors.map(({x,y})=>({x,y}));}
 if(st.design.ravine?.objectiveSites)st.design.ravine.objectiveSites.trace=clone(trace);
 space.encounterSites=space.encounterSites.filter(p=>alive.has(p.unitId));const roster=st.units.filter(u=>u.team==='enemy'&&!u.id.startsWith('resident-spirit-'));Object.assign(st.design.ravine.encounters,{initial:roster.length,initialElites:roster.filter(u=>u.stageOverrides?.honroAct2Elite).length,responseCount:8,responses:3,responseElites:1,totalEnemyBudget:roster.length+15});for(const group of st.design.ravine.encounters.groups){const members=roster.filter(u=>u.stageOverrides?.honroRavinePlace===group.id);group.count=members.length;group.elites=members.filter(u=>u.stageOverrides?.honroAct2Elite).length;}st.design.pacing={revision:1,scope:'Local knot clearance, four protected intervals, lower exit trace; optional high routes and all terrain/art retained.',initialEnemies:st.units.filter(u=>u.team==='enemy').length};
 return st;
})};}
H.stages[10]=content(H.stages[10],11);
const attach=A.attach;A.attach=function(app,e){if(upgradeBattle(e.b))app.dirty=true;return attach(app,e);};
G.HonroAct2Pacing={active,author,upgradeBattle,satisfied,reviseSteps};
})(globalThis);
