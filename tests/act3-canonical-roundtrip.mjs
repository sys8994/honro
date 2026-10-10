import {beforeStage30Ferry} from './stage8-bier-history-helpers.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),plain=x=>JSON.parse(JSON.stringify(x));
const project=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
beforeStage30Ferry(project); // Validate approved delta without replacing current data.
assert.equal(project.stages.length,30);
const restored=plain(g.HonroMaps.finalize(JSON.parse(g.HonroMaps.serialize(project))));
assert.deepEqual(restored,project,'Canonical Game/Workshop data must already include normalization defaults');
for(const stage of project.stages){
 const before=g.HonroMaps.compile(stage,project),after=g.HonroMaps.compile(restored.stages.find(s=>s.id===stage.id),restored);
 for(const key of ['terrain','materials'])assert.deepEqual(plain(after[key]),plain(before[key]),stage.id+' '+key);
}
console.log('PASS 30 canonical stages: lossless export/import and identical compiled terrain/materials');
