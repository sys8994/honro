import {historicalStage16Runtime,beforeCurrentStage16Temple} from './stage16-temple-history-helpers.mjs';
// Preserve the original cavern/temple rear-contact recipe at its exact boundary.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const root=process.cwd(),{runtime}=await import(root+'/game/tests/helpers.mjs'),{applyCavernPlaceLayers}=await import(root+'/tools/map-forge/cavern-place-layers.mjs'),{applyAct2SceneComposition}=await import(root+'/tools/environment/act2-scene-composition.mjs'),{applyAct2VectorArt}=await import(root+'/tools/environment/build-act2-art.mjs');
const plain=x=>JSON.parse(JSON.stringify(x)),g=historicalStage16Runtime(await runtime({legacyMaps:false}));
vm.runInContext(await readFile('workshop/recipes/act2-caves.js','utf8'),g);
const regenerated=g.HonroMaps.finalize(applyCavernPlaceLayers(await applyAct2SceneComposition(await applyAct2VectorArt(g.HonroAct2Design.build(plain(g.HONRO_PROJECT))))));
for(const id of [14,16]){
 const current=plain(g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===id)),again=plain(regenerated.stages.find(s=>s.metadata.stageId===id));
 assert.deepEqual(again,current,`stage ${id} canonical recipe`);
 const authored=beforeCurrentStage16Temple(JSON.parse(await readFile('shared/data/campaign.json','utf8'))).stages.find(s=>s.metadata.stageId===id);
 const former=await applyAct2SceneComposition({library:[],stages:[plain(authored)]});
 assert.deepEqual(current.environment.surfaces,former.stages[0].environment.surfaces,`stage ${id} runtime visual output unchanged`);
 console.log('PASS',id,'canonical and runtime visual surfaces unchanged');
}
