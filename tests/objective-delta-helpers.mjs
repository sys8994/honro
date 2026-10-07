import {readFileSync} from 'node:fs';
const delta=JSON.parse(readFileSync(new URL('./fixtures/objective-revision-delta.json',import.meta.url),'utf8'));
const clone=x=>JSON.parse(JSON.stringify(x)),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// Reverse only the exact approved field value. Any unrelated or later mutation
// remains visible to the original frozen semantic contract and must fail.
export function beforeObjectiveRevision(project,content){const p=clone(project),c=clone(content);for(const q of delta.changes){const map=p.stages.find(s=>s.metadata.stageId===q.id);if(map)for(const [key,change] of Object.entries(q.fields))if(equal(map[key],change.after))map[key]=clone(change.before);const stage=c.stages[q.id-1];if(q.steps&&equal(stage?.steps,q.steps.after))stage.steps=clone(q.steps.before);}return{project:p,content:c};}
