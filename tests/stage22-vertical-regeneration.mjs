/** Read the actual canonical input before regenerating. No rendering or play. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime} from '../game/tests/helpers.mjs';
import {authorStage22Vertical} from '../tools/map-forge/apply-stage22-vertical.mjs';
import {applyStage22VerticalArt} from '../tools/environment/stage22-vertical-art.mjs';
const g=await runtime({legacyMaps:false}),raw=JSON.parse(await readFile('shared/data/campaign.json'));
// SVG parser dictionaries intentionally have null prototypes; the canonical
// file format is JSON, so compare its serialized data rather than VM prototypes.
const made=JSON.parse(JSON.stringify(applyStage22VerticalArt(await authorStage22Vertical(structuredClone(raw),g))));
const exact=p=>assert.deepEqual(p,made,'Full canonical22 and unchanged project must equal gameplay+art authors');
exact(raw);
const negativeControls=[];
for(const[id,mutate]of [
 ['new-asset-source',p=>p.library.find(a=>a.id==='stage22:vertical-comparison-hall').vector.source+='<!-- drift -->'],
 ['art-element-placement',p=>p.stages[21].elements[0].x++],
 ['paint-plane',p=>p.stages[21].design.space.terrainPlanes[0].fill='#ff0000'],
 ['initial-enemy-placement',p=>p.stages[21].units.find(u=>u.team==='enemy').x++]
]){const changed=structuredClone(raw);mutate(changed);assert.throws(()=>exact(changed),id+' must fail');negativeControls.push(id);}
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
await mkdir('_local/reports/vertical-stages',{recursive:true});
await writeFile('_local/reports/vertical-stages/stage22-regeneration.json',JSON.stringify({passed:true,canonicalProjectSha256:hash(raw),regeneratedProjectSha256:hash(made),stageSha256:hash(raw.stages[21]),assets:raw.library.length,negativeControls,scope:'Current raw canonical and source-author equality, including all visual assets and placement. No browser/render/normal-play approval.'},null,2)+'\n');
console.log('PASS full raw canonical22 gameplay+art regeneration and four negative controls');
