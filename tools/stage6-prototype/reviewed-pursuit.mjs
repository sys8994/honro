/** Restore the Stage6 pursuit contract exercised by the reviewed DEV runtime. */
export function applyStage6ReviewedPursuit(project){
 const s=project.stages.find(s=>s.metadata?.stageId===6);if(!s)throw Error('Stage6 missing');
 Object.assign(s.initialState,{honroStage6PursuitRevision:1,honroEncounterDensityRevision:1,honroDensityQueueReserve:1});
 const event=s.events.find(e=>e.id==='pursuit');if(!event?.action)throw Error('Stage6 pursuit missing');
 Object.assign(event,{honroTacticalWarning:1,warning:'아군 턴이 끝나면 산개가 운반대 뒤쪽 길로 따라붙는다. 뒤를 살피자.'});
 // Trade two repetitive front boars for the already-authored rear pressure.
 // The Act1 author doubles each source count below to two live members.
 // Do not raise the 22-member cap or add a pursuit-kill victory requirement.
 const front=s.events.find(e=>e.id==='bridge-boars');if(!front?.action)throw Error('Stage6 front wave missing');
 front.action.n=1;event.action.n=1;return project;
}
