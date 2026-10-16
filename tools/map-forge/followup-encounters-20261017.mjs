/** Small fresh-entry additions on the production support geometry. Saved battles never run this author. */
export const FOLLOWUP_ENCOUNTERS={
25:[{id:'maintenance-window-pressure',anchor:'stake-arrival-1',purpose:'정비실 도착창은 비우고 창 바깥 공중과 동쪽 끝에서 접근을 견제한다.',members:[['crow',1880,4650],['lantern',2910,4230],['picks',3470,4950]]}],
26:[{id:'work-hollow-crossfire',anchor:'investigation-record',purpose:'낮은 작업장과 오를 수 있는 작업다락의 서로 다른 사선.',members:[['picks',2790,2700],['possessedArcher',2850,2300]]},{id:'return-bank-spirit',anchor:'workshop-exit',purpose:'주민의 퇴칸과 출구 집결면을 비운 강둑 복귀길 공중 위협.',members:[['crow',6030,2220]]}],
27:[{id:'loading-return-pressure',anchor:'stake-arrival-2',purpose:'진목 도착면 대신 하역장 접근과 되돌아오는 회랑 바깥 공중을 견제한다.',members:[['crow',4070,3950],['lantern',5730,4510]]}]
};
export function appendFollowupEncounters(s){
 const plans=FOLLOWUP_ENCOUNTERS[s.metadata.stageId]||[];
 for(const plan of plans){if(s.encounters.some(e=>e.id===plan.id))continue;const ids=[];
  for(const [i,[kind,x,y]]of plan.members.entries()){const id=`a3-${s.metadata.stageId}-${plan.id}-${i}`;ids.push(id);s.units.push({id,kind,team:'enemy',x,y,facing:-1,spawnIndex:s.units.filter(u=>u.team==='enemy').length,behavior:'patrol',encounterGroup:plan.id,stageOverrides:{honroCohort:plan.id,honroAct3Encounter:1,honroAct3Elite:false,honroEncounterRole:kind==='lantern'||kind==='possessedArcher'?'ranged':'frontline'}});}
  s.encounters.push({id:plan.id,key:plan.id,behavior:'patrol',unitIds:ids});s.design.act3.encounterPlan.groups.push({id:plan.id,purpose:plan.purpose,anchor:plan.anchor,members:plan.members.map(([kind,x,y])=>({kind,x,y,airborne:['crow','lantern'].includes(kind),elite:false,role:kind==='lantern'||kind==='possessedArcher'?'ranged':'frontline'}))});
 }
 const enemies=s.units.filter(u=>u.team==='enemy');Object.assign(s.design.act3.encounterPlan,{initial:enemies.length,elites:enemies.filter(u=>u.stageOverrides?.honroAct3Elite).length});return s;
}
