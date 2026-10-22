(function(G){'use strict';
// Explicit campaign overlay. Live snapshots keep bodies, HP, geometry, ledgers
// and completed flags; only recognized unfinished objective contracts migrate.
const A=G.HonroAct2,H=G.HONRO_CONTENT,clone=v=>JSON.parse(JSON.stringify(v));
const ids=[11,14,17,18];
const expected={11:['knot-west,clear-west,knot-east,hold-knots,resident,trace'],14:['clear-upper,family-upper,clear-middle,family-mid,family-lower,bridge,hold-refuge,clear-village'],17:['clear-works,brace,hoist,repair,hold-hoist,clear-lift,notes','clear-works,brace,collapse-pin,hoist,repair,hold-hoist,clear-lift,notes'],18:['clear-wards,silence,hold-silence,upper-chain,bell-descent,leak,keeper,clear-bell']};
const supported=(id,b)=>id===11?b.honroStage11EncounterRevision===2:id===14?b.honroVerticalStage14Revision===1:id===17?b.honroWorksiteVersion===1:id===18&&b.honroBellRevision===1;
const active=b=>ids.includes(b?.honroStage)&&!b.honroCustom&&b.honroAct2PacingRevision===1;
function reviseSteps(list,id){return list.map(original=>{const s=clone(original);
 if(id===11&&s.id==='clear-west')return{...s,kind:'pacing-event',afterPacing:'knot-west',label:'서쪽 혼매듭 해체 확인'};
 if(id===14&&s.id==='clear-upper')return{...s,label:'상층 주민 출입로 확보',defeatIds:['v14-b1','v14-b2','v14-b3','v14-b4','v14-b6']};
 if(id===14&&s.id==='clear-middle')return{...s,label:'장터 구조 접근로 확보',defeatIds:['v14-c1','v14-c2','v14-c3','v14-c4']};
 if(id===14&&s.id==='hold-refuge')return{...s,rounds:4,wave:{...s.wave,count:6}};
 if(id===14&&s.id==='clear-village')return{...s,kind:'pacing-secure',afterPacing:'hold-refuge',sitePacing:'hold-refuge',targetPacing:'objective',radiusPacing:1050,heightPacing:600,label:'피난 다리 곁의 위협 제압'};
 if(id===17&&s.id==='clear-works')return{...s,defeatIds:['a2-enemy-0','a2-enemy-1','ws-west-screen','a2-enemy-2','a2-enemy-3','ws-brace-cart','ws-brace-captain']};
 if(id===17&&s.id==='hold-hoist')return{...s,rounds:3,wave:{...s.wave,count:6}};
 if(id===17&&s.id==='clear-lift'&&s.kind==='clear')return{...s,kind:'pacing-event',afterPacing:'hold-hoist',label:'복구한 인양축 보호 완료'};
 if(id===18&&s.id==='clear-bell')return{...s,kind:'pacing-secure',afterPacing:'keeper',sitePacing:'clear-bell',radiusPacing:720,heightPacing:500,label:'동쪽 퇴로 곁의 위협 제압'};
 return s;
});}
function content(st,id){if(!st)return st;const out=clone(st);if(out.steps)out.steps=reviseSteps(out.steps,id);if(out.act2Plan?.sequence)out.act2Plan.sequence=reviseSteps(out.act2Plan.sequence.map(s=>typeof s==='string'?{id:s}:s),id).map(s=>Object.keys(s).length===1?s.id:s);
 if(id===11){out.guide='소단으로 서쪽 혼매듭 주변의 수비를 제압하고 매듭을 푸세요. 중앙 매듭 해체를 4라운드 지킨 뒤 하부 주민을 구조하세요. 피난처 동쪽 오름길 초입의 혼 흔적을 조사하면 완료됩니다. 높은 고목과 동쪽 사격턱은 선택 접근로입니다.';out.beats??={};out.beats['clear-west']=[['소단','서쪽 매듭은 풀렸어요. 뒤쪽 기척은 남아 있지만 중앙으로 이어진 혼줄부터 끊어야 해요.']];}
 if(id===14){out.goal='세 집의 주민 구조와 피난 다리 보호';out.guide='상층 집과 장터의 구조 접근로를 확보하고 주민 세 집을 구조하세요. 광물길과 동쪽 능선은 다른 사격점으로 이어집니다. 다리 걸쇠를 열고 4라운드 보호한 뒤 등잔집 곁의 위협만 제압하면 완료됩니다.';out.beats??={};out.beats.bridge=[['휘겸','걸쇠를 열었소. 등잔집으로 다가오는 것부터 막읍시다.'],['설오','위층의 들림을 쫓아 돌아갈 필요는 없겠군요. 주민 곁의 길을 지키겠습니다.']];out.beats['hold-refuge:start']=[['담허','피난길이 안정될 때까지 네 차례 지키세. 서쪽과 동쪽 굴의 도구를 살피게.']];}
 if(id===17){out.goal='인양축을 복구하고 3라운드 보호';out.guide='작업장 접근로를 확보하고 버팀목을 세우세요. 들린 인양틀을 제압하고 축을 복원한 뒤 3라운드 보호하면 작업대 일지를 함께 확인합니다. 높은 사격턱과 옛 작업굴의 잔적을 찾아 돌아갈 필요는 없습니다.';}
 if(id===18)out.guide='억제진 진입 수비대를 제압하고 담허로 공명을 억제하세요. 4라운드 유지와 장력 고정구 해제를 병렬로 마친 뒤 쓸림면을 비워 대종을 안전하게 내립니다. 소단으로 누출혼을 나누고 동쪽 종지기를 비살상 제압하세요. 동쪽 퇴로 곁의 위협을 정리하면 완료됩니다. 먼 구역의 잔적은 선택 전투입니다.';
 return out;
}
function upgradeBattle(b){if(!ids.includes(b?.honroStage)||b.honroCustom||b.mode!=='campaign'||b.honroMapOrigin!=='campaign'||['won','lost'].includes(b.phase)||b.honroAct2PacingRevision!==undefined||!supported(b.honroStage,b))return false;
 if(b.honroStage===11)G.HonroStage11TraceExit.upgradeBattle(b);
 const list=b.honroAct2Steps;if(!Array.isArray(list)||!expected[b.honroStage].includes(list.map(s=>s.id).join(',')))return false;
 b.honroAct2Steps=reviseSteps(list,b.honroStage);for(const key of ['honroNarrativeContent','honroVerticalStage14Content'])if(b[key])b[key]=content(b[key],b.honroStage);b.honroAct2PacingRevision=1;return true;
}
function satisfied(b,s){if(!active(b))return null;const a=A.memory(b);
 if(s.kind==='pacing-event')return !!a.done[s.afterPacing];
 if(s.kind==='pacing-secure')return !!a.done[s.afterPacing]&&localThreats(b,s).length===0;
 // The protected interval is the event. Blocked optional entry mouths may not
 // turn a completed four-round defense into an unbounded admission wait.
 if(['hold-knots','hold-refuge','hold-hoist'].includes(s.id))return (a.holds?.[s.id]?.progress||0)>=s.rounds;
 return null;
}
function localThreats(b,s){const site=(s.targetPacing&&b.units.find(u=>u.id===s.targetPacing))||b.honroMarkers.find(m=>m.id===s.sitePacing);if(!site)return [{id:'missing-pacing-site'}];return b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget&&u.summonKind!=='eater'&&!u.eaterCapturedBy&&!u.dead&&u.hp>0&&!u.honroSubdued&&Math.abs(u.y-site.y)<=s.heightPacing&&Math.hypot(u.x-site.x,u.y-site.y)<=s.radiusPacing);}
const removedRoles=new Set(['entry-pair','knot-pair','knot-retainer-shot','low-bough-crossfire','ritual-close-pair','ritual-second-line','inner-front-pair','inner-front-command','mouth-entry-pack','refuge-exit-pair']);
function author(project,only=ids){return{...project,stages:project.stages.map(original=>{const id=original.metadata?.stageId;if(!only.includes(id)||!ids.includes(id)||!original.metadata?.campaign||!supported(id,original.initialState||{})||![undefined,1].includes(original.initialState?.honroAct2PacingRevision))return original;
 const st=clone(original),b=st.initialState;b.honroAct2PacingRevision=1;b.honroAct2Steps=reviseSteps(b.honroAct2Steps,id);for(const key of ['honroNarrativeContent','honroVerticalStage14Content'])if(b[key])b[key]=content(b[key],id);
 if(id!==11){if(id===14&&st.design.vertical14?.encounters)Object.assign(st.design.vertical14.encounters,{finite:6,finiteElites:2});for(const m of st.markers||[]){const s=b.honroAct2Steps.find(s=>s.id===m.id);if(s)m.label=s.label;}st.design.pacing={revision:1,scope:'Event duration and local final threat, original terrain/art/actors retained'};return st;}
 st.units=st.units.filter(u=>!removedRoles.has(u.stageOverrides?.honroEncounterRole));const alive=new Set(st.units.map(u=>u.id));for(const group of st.encounters||[])group.unitIds=group.unitIds.filter(id=>alive.has(id));
 st.events=st.events.filter(ev=>!['ravine-response-ritual-west-pursuit','ravine-response-ritual-east-turn'].includes(ev.id));
 const trace={x:11900,y:8000,surfaceId:'rv-north-trace'};Object.assign(st.markers.find(m=>m.id==='trace'),trace);for(const e of st.elements||[])if(e.id==='rv-goal-trace')Object.assign(e,{x:trace.x,y:trace.y});
 for(const key of ['exit','northTrace'])Object.assign(st.anchors[key],trace);
 const space=st.design.space;space.sites.trace={...space.sites.trace,...trace,standing:clone(trace)};const main=space.routes.find(r=>r.id==='main');if(main){const end=main.anchors.findLastIndex(p=>p.x===11000);if(end>=0)main.anchors=[...main.anchors.slice(0,end+1),clone(trace)];st.routes=main.anchors.map(({x,y})=>({x,y}));}
 if(st.design.ravine?.objectiveSites)st.design.ravine.objectiveSites.trace=clone(trace);
 space.encounterSites=space.encounterSites.filter(p=>alive.has(p.unitId));const roster=st.units.filter(u=>u.team==='enemy'&&!u.id.startsWith('resident-spirit-'));Object.assign(st.design.ravine.encounters,{initial:roster.length,initialElites:roster.filter(u=>u.stageOverrides?.honroAct2Elite).length,responseCount:8,responses:3,responseElites:1,totalEnemyBudget:roster.length+15});for(const group of st.design.ravine.encounters.groups){const members=roster.filter(u=>u.stageOverrides?.honroRavinePlace===group.id);group.count=members.length;group.elites=members.filter(u=>u.stageOverrides?.honroAct2Elite).length;}st.design.pacing={revision:1,scope:'Local knot clearance, four protected intervals, lower exit trace; optional high routes and all terrain/art retained.',initialEnemies:st.units.filter(u=>u.team==='enemy').length};
 return st;
})};}
for(const id of ids)H.stages[id-1]=content(H.stages[id-1],id);
// The dedicated bell author uses its exported step contract.
G.HonroStage18Bell.steps=reviseSteps(G.HonroStage18Bell.steps,18);
const attach=A.attach;A.attach=function(app,e){if(upgradeBattle(e.b))app.dirty=true;return attach(app,e);};
const enemiesFor=A.enemiesFor;A.enemiesFor=function(b,s){return active(b)&&s?.kind==='pacing-secure'?localThreats(b,s):enemiesFor(b,s);};
const state=A.state;A.state=function(b){const out=state(b);if(!active(b))return out;const s=A.current(b);if(s?.kind==='pacing-secure'){const foes=localThreats(b,s),u=foes[0];out.summary=s.label+' · 가까운 위협 '+foes.length+'명';if(u)out.targets=[{id:s.id,kind:'boss',x:u.x,y:u.y-u.h,label:out.summary,unitId:u.id}];}return out;};
const enhance=G.HonroObjectiveGuide.enhance;G.HonroObjectiveGuide.enhance=function(b,st,result){const out=enhance(b,st,result),s=active(b)&&A.current(b);if(s?.kind!=='pacing-secure')return out;const instruction=s.label+' · 가까운 위협 '+localThreats(b,s).length+'명';return{...out,currentInstruction:instruction,summary:instruction,checklist:(out.checklist||[]).map(q=>q.id===s.id?{...q,text:instruction}:q),visibleChecklist:(out.visibleChecklist||[]).map(q=>q.id===s.id?{...q,text:instruction}:q)};};
const tick=A.tick;A.tick=function(app,dt){const out=tick(app,dt),b=app.engine?.b;if(!active(b))return out;const a=A.memory(b);for(const [goal,key]of [['hold-knots','ravineComposition'],['hold-refuge','vertical14'],['hold-hoist','worksiteDefense']]){if(!a.done[goal])continue;const m=b.honroState[key];if(!m)continue;for(const [source,w]of Object.entries(m.warnings||{}))if(!m.entries?.[source]&&!w.cancelled){w.cancelled='protection-complete';w.status='cancelled';}}return out;};
G.HonroAct2Pacing={active,author,upgradeBattle,satisfied,reviseSteps,localThreats};
})(globalThis);
