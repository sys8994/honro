/** Reapply ACT1 scene composition without touching later acts or live saves. */
import {readFile,writeFile} from 'node:fs/promises';
import {applyAct1SceneComposition} from '../environment/act1-scene-composition.mjs';
const file='shared/data/campaign.json',source=JSON.parse(await readFile(file,'utf8')),later=JSON.stringify(source.stages.slice(10));
const project=await applyAct1SceneComposition(source);
if(JSON.stringify(project.stages.slice(10))!==later)throw Error('ACT1 authoring changed ACT2 stages');
await writeFile(file,JSON.stringify(project,null,2)+'\n');
console.log('Authored all 10 ACT1 outdoor scene compositions; ACT2 preserved.');
