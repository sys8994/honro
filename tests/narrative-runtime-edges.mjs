import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false});let checks=0;
const yes=(v,m)=>{assert(v,m);checks++;};
{
 const {b,st}=battlefield(g,12);b.honroState.quarry??={};
 b.honroState.quarry.signLines=[['서술','담허의 설명을 따라 겹친 획 하나를 풀었다.']];
 const before=JSON.stringify(b.honroNarrativeContent),effective=g.HonroObjectiveRevision.contentFor(b,st);
 yes(effective.beats.sign[0][1].includes('설명을 따라'),'run-local observed actor overrides fresh frozen prose');
 assert.equal(JSON.stringify(b.honroNarrativeContent),before,'saved canonical prose remains immutable');
 const markers=b.honroRouteSpec.routes.map(r=>r.markerId),p=g.HonroStoryStaging.point(b,{markers});
 yes(p.spanX>=0&&p.spanY>0,'two authored exits produce a camera frame');
}
{
 const {b,st}=battlefield(g,19),A=g.HonroAct2;
 A.memory(b).done.route=true;
 const initial=A.readySteps(b);yes(initial.filter(s=>s.parallelGroup==='farewell').length===3,'three meetings are independently available');
 const third=initial.filter(s=>s.parallelGroup==='farewell').at(-1),m=b.honroMarkers.find(m=>m.id===third.id),u=b.units.find(u=>u.cls===third.requiredClass&&u.side===0);
 b.active=u.id;u.x=m.x;u.y=m.y;
 const before=JSON.stringify(b),raw=A.state(b),ui=g.HonroObjectiveGuide.enhance(b,st,raw);
 yes(raw.targets.length===3,'three available world targets');
 yes(ui.currentObjectiveId===third.id,'nearest compatible meeting is guided');
 yes(ui.visibleChecklist.filter(q=>q.current).length===3,'three choices shown together');
 yes(ui.summary.includes('세 만남은 자유 순서')&&!ui.summary.includes('두 지점'),'correct funeral summary');
 assert.equal(JSON.stringify(b),before,'objective reading does not mutate funeral state');
 A.memory(b).done[third.id]=true;
 const after=A.readySteps(b),send=after.find(s=>s.requiresDone?.includes(third.id));
 yes(!!send,'that meeting unlocks only its own farewell');
 yes(!after.some(s=>s.id===third.id),'completed separation is no longer offered');
 yes(A.state(b).summary.startsWith('2/'),'out-of-order completion counted accurately');
}
console.log(`PASS ${checks} narrative runtime edges; no normal-resource or browser coverage claimed`);
