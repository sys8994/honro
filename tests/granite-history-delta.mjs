import {beforeCurrentStage11Ravine} from './stage11-ravine-history-helpers.mjs';
import {beforeApprovedTopology} from './approved-topology-history-helpers.mjs';
import {beforeGuardianScene} from './guardian-scene-history-helpers.mjs';
import {act12Project} from './campaign-scope-helpers.mjs';
import {beforeObjectiveRevision} from './objective-delta-helpers.mjs';
/** Pure JSON regression of the narrow historical-art comparison helper. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {beforeGraniteVisuals} from './granite-delta-helpers.mjs';
import {beforePlatformPassages} from './platform-passage-delta-helpers.mjs';
import {beforeExistenceRoster} from './existence-delta-helpers.mjs';
import {beforeCaveBatRevision} from './act2-cave-bat-delta-helpers.mjs';
import {hash,mapRules} from './story-canon-contract-helpers.mjs';
import {graniteVisuals} from '../tools/environment/granite-visuals.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const project=await read('shared/data/campaign.json'),baseline=await read('tests/fixtures/granite-visual-baseline.json'),frozen=await read('tests/fixtures/story-canon-v01-baseline.json');
const snapshot=JSON.stringify(project),prior=beforeGraniteVisuals(project),expected=structuredClone(project);
for(const old of baseline.assets)expected.library.find(a=>a.id===old.id).visual=structuredClone(old.visual);
assert.deepEqual(prior,expected,'only the two reviewed visual arrays may be reversed');assert.equal(JSON.stringify(project),snapshot,'current source is never mutated');
const historical=p=>hash(mapRules(act12Project(beforeGraniteVisuals(beforePlatformPassages(beforeCaveBatRevision(beforeExistenceRoster(beforeObjectiveRevision(beforeGuardianScene(beforeApprovedTopology(p)),{stages:[]}).project)))))));
assert.equal(historical(project),frozen.mapRules,'original story fixture remains exact');
// Validate all newer exact maps/art first, then inject old-era granite drift.
// This keeps the original mapRules inequality checks focused on their boundary.
const historicalBoundary=beforeCurrentStage11Ravine(project);
for(const id of baseline.assets.map(a=>a.id))for(const change of [a=>a.visual[0].fill='#ffffff',a=>a.visual[1].points[0].x+=1]){const p=structuredClone(project);change(p.library.find(a=>a.id===id));assert.throws(()=>beforeGraniteVisuals(p),/Unreviewed granite visual change/,'unreviewed visual drift cannot be normalized away');}
for(const change of [
 p=>{const a=p.library.find(a=>a.id===baseline.assets[0].id);a.collision[0][0].x+=1;a.visual=graniteVisuals(a);},
 p=>{p.stages[0].elements.find(e=>e.id==='forest-boulder-a').x+=1;},
 p=>{p.library.find(a=>a.id===baseline.assets[0].id).material='earth';},
 p=>{p.library.find(a=>a.id==='mockup-granite-shelf').visual[0].fill='#ffffff';}
]){const p=structuredClone(historicalBoundary);change(p);assert.notEqual(historical(p),frozen.mapRules,'collider, placement, metadata and unrelated art drift remain detectable');}
console.log('PASS granite historical delta: exact two-array reversal, purity, 4 visual rejections and 4 unrelated-drift controls; no fixture rewrite');
