/** Exact Stage5-only historical projection; new lake behavior is separately exercised. */
import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),prior=JSON.parse(readFileSync(new URL('./fixtures/stage5-waterfall/before-lake.json',import.meta.url),'utf8'));
assert.equal(hash(prior),'d6c7862053913b02942aa3c0d0146c869313707ddb62378993dc75cc85359f8a');
export function beforeStage5Lake(project){const p=structuredClone(project),i=p.stages?.findIndex(s=>s.id==='stage-5');if(i<0||!p.stages?.[i]?.initialState?.honroStage5LakeRevision)return p;assert.equal(hash(p.stages[i]),'2c873772d9667936dcb8988b704758a7bc2a12aec9f22313e2b025bc27160f46','Only exact lake author delta may be reversed');p.stages[i]=structuredClone(prior);return p;}
