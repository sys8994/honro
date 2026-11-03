/** Restore the Stage6 pursuit contract exercised by the reviewed DEV runtime. */
export function applyStage6ReviewedPursuit(project){
 const s=project.stages.find(s=>s.metadata?.stageId===6);if(!s)throw Error('Stage6 missing');
 Object.assign(s.initialState,{honroStage6PursuitRevision:1,honroEncounterDensityRevision:1,honroDensityQueueReserve:1});
 const event=s.events.find(e=>e.id==='pursuit');if(!event?.action)throw Error('Stage6 pursuit missing');
 Object.assign(event,{honroTacticalWarning:1,warning:'아군 턴이 끝나면 산개가 운반대 뒤쪽 길로 따라붙는다. 뒤를 살피자.'});
 // Existing Act1 population author doubles this one source member to two.
 event.action.n=1;return project;
}
