/** Exact, reviewed prose-only projection for historical contracts.
 * Unknown text is left visible to the old strict assertions. No field, scene,
 * speaker, metadata, rule or whole chapter is removed from comparison. */
import {readFileSync} from 'node:fs';
const delta=JSON.parse(readFileSync(new URL('./fixtures/dialogue-clarity-delta.json',import.meta.url),'utf8'));
const clone=v=>JSON.parse(JSON.stringify(v));
export function beforeDialogueClarity(stage){
 const out=clone(stage),rows=delta.changes.filter(r=>['stages','authoredStages'].includes(r.path[0])&&r.path[1]===stage.id-1);
 for(const row of rows){const path=row.path.slice(2);let parent=out;for(const key of path.slice(0,-1)){parent=parent?.[key];if(!parent)break;}const key=path.at(-1);if(parent&&parent[key]===row.after)parent[key]=row.before;}
 return out;
}
