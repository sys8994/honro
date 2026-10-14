/** Reverse only the five reviewed runtime-authored dialogue leaves.
 * Unknown prose and all geometry/gameplay remain visible to strict old pins. */
import {currentRuntimeManifest} from './current-runtime-contract-helpers.mjs';
const proof=currentRuntimeManifest.approvedDeltas.find(d=>d.kind==='hostile-quest-targets-and-clear-campaign-dialogue').projectPart;
export function beforeQuestProjectProse(input){
 const out=structuredClone(input);
 for(const c of proof.changes){let parent=out;for(const key of c.path.slice(0,-1))parent=parent?.[key];const key=c.path.at(-1);if(parent&&parent[key]===c.after)parent[key]=c.before;}
 return out;
}
