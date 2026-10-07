// Act 3 is additive. Legacy invariants retain every old map/library property;
// only the explicitly namespaced new content is outside their historical scope.
export function act12Project(project){return{...project,stages:project.stages.filter(s=>s.metadata.stageId<=20),library:project.library.filter(a=>!a.id.startsWith('a3-'))};}
export function act12Balance(balance){return{...balance,maxLevel:25,stages:balance.stages.filter(s=>s.id<=20),futureActs:[{act:3,stageExitLevels:[18.5,19,19.5,20,20.5,21,21.5,22]},...balance.futureActs]};}

// Only these explicitly authored Act 3 roles are outside the historical Acts
// 1/2 contract. Their bodies/attacks have a separate exact refinement fixture.
export function act12Archetypes(archetypes){const {possessedGuard,possessedArcher,gateMaster,archerMaster,archiveFiend,kilnFiend,...legacy}=archetypes;return legacy;}
