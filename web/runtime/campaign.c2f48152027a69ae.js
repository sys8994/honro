import {loadProject,yieldIfNeeded} from "./load-data.9de2b3eabae7de5b.js";
let project=await loadProject("web/data/campaign.c3f5178fcc145236.json");
for(const author of [HonroAct1Roster,HonroObjectiveRevision,HonroNarrativeRevision,HonroStage2Airborne,HonroBellAnomaly,HonroStoryCanonV1]){project=author.author(project);await yieldIfNeeded();}
globalThis.HONRO_PROJECT=project;
