import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex'),js=x=>sha(JSON.stringify(x));
const M='shared/data/terrain-path-optimization.json';
const P='shared/data/act2/stage12-compact-package.json';
const base=fs.readFileSync(M,'utf8');assert.equal(sha(base),'904fec936ecca465a2ee92a87536a5576efc8d0c85e303d9a57eacf1d07d644b');
const source=JSON.parse(fs.readFileSync(process.argv[2]));const candidate=JSON.parse(fs.readFileSync(P));const entries=JSON.parse(base);
for(const k of Object.keys(source))if(!['assets','artStats'].includes(k))assert.deepEqual(candidate[k],source[k]);
assert.deepEqual(candidate.assets.map(x=>x.id),source.assets.map(x=>x.id));
let out=base;const records=[];
for(const a of source.assets){
 const n=candidate.assets.find(x=>x.id===a.id);
 if(!/^act2-compact:stage12-act2-traced-stage12-ground-[12]$/.test(a.id)){assert.deepEqual(a,n);continue;}
 const e=entries.find(v=>v.id===a.id),old=js(a.vector),next=js(n.vector);
 assert.equal(e.original,old);assert.equal(e.paths.length,28);
 for(const [p,key]of e.paths)assert.deepEqual(p.reduce((v,k)=>v[k],a.vector)[key],p.reduce((v,k)=>v[k],n.vector)[key]);
 assert.equal(out.split(old).length,2);out=out.replace(old,next);
 records.push({id:a.id,previous:old,next,paths:28,pathHash:js(e.paths)});
}
assert.equal(records.length,2);
assert.equal(sha(out),'47c3c81fff4c4b0ac18a56ec7dcc736f66001315ab319f7be1b4f735b158c513');
let undo=out;for(const r of records){assert.equal(undo.split(r.next).length,2);undo=undo.replace(r.next,r.previous);}assert.equal(undo,base);
const owner=JSON.parse(out).find(x=>x.id==='approved36:near-slope-join-inland');assert.equal(js(owner),'081620ba95d012005f618b8c6e5842eb4b2d7b6cca5ac9e2c5b1098e10a50387');
assert.equal(owner.original,'15ca937d5aff348e6c173d37c3cca490aa69acd874f317b3a2ba0d4e3e3c5eaf');
fs.writeFileSync(M,out);console.log(JSON.stringify({records,manifest:sha(out),stage36OwnerFingerprint:owner.original,stage36Paths:owner.paths.length,stage36EntryHash:js(owner)}));
