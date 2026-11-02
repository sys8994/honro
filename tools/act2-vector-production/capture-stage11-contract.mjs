import {runtimeEntries} from '../../shared/build.mjs';
import {writeFile} from 'node:fs/promises';
process.env.HONRO_ACT2_STAGE11_CANDIDATE='0';
const project=(await runtimeEntries({vector:false,render:false,productionStory:true})).find(e=>e.name==='campaign').project;
const stage=project.stages.find(s=>s.metadata?.stageId===11);
await writeFile(new URL('./stage11-art-source.json',import.meta.url),JSON.stringify({stage:11,source:Object.fromEntries(['width','height','playBounds','terrainBounds','terrains'].map(k=>[k,stage[k]])),preservedElements:stage.elements,assets:[]},null,2));
console.log({terrains:stage.terrains.length,elements:stage.elements.length,scope:'PRE-runtime-author-hook raw campaign project'});
