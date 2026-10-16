/** Pinned branch-level merge scope, independent of historical approved deltas. */
import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';
const m=JSON.parse(await readFile('game/docs/ACT3_FINAL_INTEGRATION.json')),p=JSON.parse(await readFile('shared/data/campaign.json'));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
assert.equal(new Set(p.library.map(a=>a.id)).size,p.library.length,'No duplicate asset ids');
for(const r of m.sources){assert.equal(hash(p.stages[r.stage-1]),r.stageSha256,'Exact reviewed stage '+r.stage);for(const[id,h]of Object.entries(r.assetSha256))assert.equal(hash(p.library.find(a=>a.id===id)),h,id);}
for(const r of m.unchangedStages)assert.equal(hash(p.stages[r.stage-1]),r.sha256,'Unrelated stage '+r.stage);
for(const[f,h]of Object.entries(m.protectedFiles))assert.equal(createHash('sha256').update(await readFile(f)).digest('hex'),h,'Protected runtime '+f);
console.log('PASS reviewed stage/asset identities, other stages and protected runtime; no build or play claim');
