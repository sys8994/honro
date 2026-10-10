import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {applyStage30Ferry} from './stage30-ferry.mjs';
export async function authorStage30Ferry(project,g,{roster=project.stages.find(s=>s.metadata?.stageId===30)?.initialState?.honroFerryRoster||'candidate26e6',art=true}={}){
 const before=JSON.stringify(project.stages.filter(s=>s.metadata?.stageId!==30));let p=applyStage30Ferry(g,project,{roster});
 if(art){const {applyStage30FerryArt}=await import('../environment/stage30-ferry-art.mjs');await applyStage30FerryArt(p);}
 if(JSON.stringify(p.stages.filter(s=>s.metadata?.stageId!==30))!==before)throw Error('Stage30 author changed another stage');return p;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const {runtime}=await import('../../game/tests/helpers.mjs'),g=await runtime({legacyMaps:false}),roster=process.argv.includes('--baseline')?'originalBudget20e4':process.argv.includes('--count-control')?'countControl20e6':'candidate26e6';const p=await authorStage30Ferry(JSON.parse(await readFile('shared/data/campaign.json','utf8')),g,{roster,art:!process.argv.includes('--no-art')});await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');console.log('Authored Stage30 ferry',roster,'unrelated29 exact');}
