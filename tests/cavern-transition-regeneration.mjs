import {beforeCurrentStage11Ravine,historicalStage11Runtime} from './stage11-ravine-history-helpers.mjs';
// Original Stage11/17 transition checks remain active after exact reversal;
// current ravine/worksite traversal, shots and combat are independently required.
import {readFile} from 'node:fs/promises';import vm from 'node:vm';import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
import {applyAct2SceneComposition} from '../tools/environment/act2-scene-composition.mjs';import {applyAct2VectorArt} from '../tools/environment/build-act2-art.mjs';import {applyCavernTransitionLayers} from '../tools/map-forge/cavern-transition-layers.mjs';import {applyCavernPlaceLayers} from '../tools/map-forge/cavern-place-layers.mjs';import {applyForestCavernTopology} from '../tools/map-forge/forest-cavern-topology.mjs';
const g=historicalStage11Runtime(await runtime({legacyMaps:false}));vm.runInContext(await readFile('workshop/recipes/act2-caves.js','utf8'),g);
const p=beforeCurrentStage11Ravine(JSON.parse(await readFile('shared/data/campaign.json','utf8')));
const generated=g.HonroMaps.finalize(applyCavernTransitionLayers(applyCavernPlaceLayers(applyForestCavernTopology(await applyAct2SceneComposition(await applyAct2VectorArt(g.HonroAct2Design.build(g.HONRO_PROJECT))),{stages:[15]}))));
for(const id of [11,12,13,17,18,19,20])assert.deepEqual(JSON.parse(JSON.stringify(generated.stages[id-1])),p.stages[id-1],`stage${id} canonical generation`);
console.log('PASS 7 transition stages exactly reproduce from the original recipe, art composition and bounded postprocessor');
