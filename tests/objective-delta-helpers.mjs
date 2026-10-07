import {readFileSync} from 'node:fs';
const delta=JSON.parse(readFileSync(new URL('./fixtures/objective-revision-delta.json',import.meta.url),'utf8'));
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x)),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const semantic=v=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).filter(([k])=>!['x','y','label','points','detail','fireSite'].includes(k))):v;
// Reverse only changed leaves of this approved revision, preserving independent
// encounter/geometry/split changes. Unexpected identities or action/class edits
// remain visible to the original frozen contract and must still be rejected.
function undo(current,before,after,spatial=false){
 if(equal(before,after))return current;
 if(equal(current,after))return clone(before);
 if(Array.isArray(before)&&Array.isArray(after)&&Array.isArray(current)&&[...before,...after].every(v=>v&&typeof v==='object'&&v.id)){
  const old=new Map(before.map(v=>[v.id,v])),next=new Map(after.map(v=>[v.id,v]));
  const kept=current.filter(v=>old.has(v.id)||!next.has(v.id)||!equal(spatial?semantic(v):v,spatial?semantic(next.get(v.id)):next.get(v.id)));
  const result=kept.map(v=>old.has(v.id)&&next.has(v.id)?undo(v,old.get(v.id),next.get(v.id),spatial):v);
  for(let i=0;i<before.length;i++){const v=before[i];if(next.has(v.id)||result.some(x=>x.id===v.id))continue;let at=result.length;for(let j=i+1;j<before.length;j++){const found=result.findIndex(x=>x.id===before[j].id);if(found>=0){at=found;break;}}result.splice(at,0,clone(v));}
  return result;
 }
 if(before&&after&&current&&typeof before==='object'&&typeof after==='object'&&typeof current==='object'&&!Array.isArray(before)&&!Array.isArray(after)&&!Array.isArray(current)){
  const out={...current};for(const key of new Set([...Object.keys(before),...Object.keys(after)])){if(equal(before[key],after[key]))continue;const v=undo(current[key],before[key],after[key],spatial);if(v===undefined)delete out[key];else out[key]=v;}return out;
 }
 return current;
}
export function beforeObjectiveRevision(project,content){const p=clone(project),c=clone(content);for(const q of delta.changes){const map=p.stages.find(s=>s.metadata.stageId===q.id);if(map)for(const [key,change] of Object.entries(q.fields))map[key]=undo(map[key],change.before,change.after,q.id>=21);const stage=c.stages[q.id-1];if(q.steps&&stage)stage.steps=undo(stage.steps,q.steps.before,q.steps.after);if(stage)for(const [key,change] of Object.entries(q.contentFields||{}))stage[key]=undo(stage[key],change.before,change.after);}return{project:p,content:c};}

export function beforeObjectiveContent(stage){const content={stages:Array.from({length:30},()=>({}))};content.stages[stage.id-1]=stage;return beforeObjectiveRevision({stages:[]},content).content.stages[stage.id-1];}
