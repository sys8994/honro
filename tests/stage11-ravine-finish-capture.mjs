/** One explicit final-art layer; never rewrites the frozen 98-path first layer. */
import assert from'node:assert/strict';import{readFile,writeFile,access}from'node:fs/promises';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
assert.equal(process.env.HONRO_CAPTURE_APPROVED_RAVINE_FINISH,'1','Explicit final-art capture required');
const file='tests/fixtures/stage11-ravine-art-finish-delta.json';try{await access(file);throw Error('Refusing to replace existing final-art layer');}catch(error){if(error.code!=='ENOENT')throw error;}
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex'),first=JSON.parse(await readFile('tests/fixtures/stage11-ravine-history-delta.json','utf8'));
const beforeCommit=execFileSync('git',['rev-parse','c543ea5'],{encoding:'utf8'}).trim(),before=JSON.parse(execFileSync('git',['show',beforeCommit+':shared/data/campaign.json'],{encoding:'utf8',maxBuffer:32*1024*1024}));
const source=process.argv[2]||'shared/data/campaign.json',after=JSON.parse(await readFile(source,'utf8')),afterCommit=process.argv[3]||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.equal(hash(before),first.afterProjectSha256,'Final art starts at the frozen first-layer source');
const b=before.stages[10],a=after.stages[10],ids=['stage11:ravine-shoulder-rv-ritual-reflection-ledge','stage11:ravine-shoulder-rv-east-upper-fire-bay'];
const assets=after.library.filter(x=>ids.includes(x.id)),elements=a.elements.filter(x=>ids.includes(x.assetId));assert.equal(assets.length,2);assert.equal(elements.length,2);assert.deepEqual(assets.map(x=>x.id),ids);
for(const asset of assets)assert.deepEqual(asset.collision,[],'Art finish creates no collision');
const reversed=structuredClone(after);reversed.library=reversed.library.filter(x=>!ids.includes(x.id));reversed.stages[10].elements=reversed.stages[10].elements.filter(x=>!ids.includes(x.assetId));reversed.stages[10].design.ravineArt.artAssetIds=reversed.stages[10].design.ravineArt.artAssetIds.filter(x=>!ids.includes(x));
assert.deepEqual(reversed,before,'Exactly two assets, two placements and their art-ID list; no geometry/roster/goals/other fields');
const scope=l=>l.filter(a=>!a.id.startsWith('a3-'));
const delta={schemaVersion:1,beforeSourceCommit:beforeCommit,afterSourceCommit:afterCommit,beforeProjectSha256:hash(before),afterProjectSha256:hash(after),beforeStageSha256:hash(b),afterStageSha256:hash(a),beforeLibrarySha256:hash(before.library),afterLibrarySha256:hash(after.library),beforeAct12LibrarySha256:hash(scope(before.library)),afterAct12LibrarySha256:hash(scope(after.library)),assets,elements,elementOrderBefore:b.elements.map(e=>e.id),elementOrderAfter:a.elements.map(e=>e.id),artOrderBefore:b.design.ravineArt.artAssetIds,artOrderAfter:a.design.ravineArt.artAssetIds};
await writeFile(file,JSON.stringify(delta,null,2)+'\n',{flag:'wx'});console.log('WROTE final art layer: exactly2 noncolliding assets/2 placements; first98-path layer unchanged');
