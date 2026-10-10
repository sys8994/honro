import {applyOpenStructures} from './open-structure-policy.mjs';
import {authorStage8Bier} from './stage8-bier.mjs';
import {runtime} from '../../game/tests/helpers.mjs';
/** Reapply ACT1 scene composition without touching later acts or live saves. */
import {applyForestApproachChoices} from './forest-approach-choices.mjs';
import {applyForestCavernTopology} from './forest-cavern-topology.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {applyAct1SceneComposition} from '../environment/act1-scene-composition.mjs';
const file='shared/data/campaign.json',source=JSON.parse(await readFile(file,'utf8')),later=JSON.stringify(source.stages.slice(10));
let project=applyForestApproachChoices(applyForestCavernTopology(await applyAct1SceneComposition(source),{stages:[7]}));
applyOpenStructures(project,{minStage:1,maxStage:10});
if(JSON.stringify(project.stages.slice(10))!==later)throw Error('ACT1 authoring changed ACT2 stages');
project=await authorStage8Bier(project,await runtime({legacyMaps:false}),{art:true});
await writeFile(file,JSON.stringify(project,null,2)+'\n');
console.log('Authored all 10 ACT1 outdoor scene compositions; ACT2 preserved.');
