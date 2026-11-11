/** Place the existing net guard where residents actually cross the wreck deck. */
export function authorAct4Stage39(stage,supportPoint){
 if(stage.metadata?.stageId!==39)return stage;
 const guard=stage.units.find(u=>u.id==='a4-39-n-1'&&u.team==='enemy');
 if(guard?.stageOverrides?.honroEncounterSupport!=='approved39-east-deck')return stage;

 const support='approved39-wreck-deck';
 const position=supportPoint(stage,support,4015);
 const moved={...guard,...position,stageOverrides:{...guard.stageOverrides,honroEncounterSupport:support}};
 return {...stage,units:stage.units.map(u=>u===guard?moved:u)};
}
