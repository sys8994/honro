import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {applyStage17Worksite} from './stage17-worksite.mjs';
import {runtime} from '../../game/tests/helpers.mjs';
export async function authorStage17Worksite(project,g,{art=true}={}){
 const before=JSON.stringify(project.stages.filter(s=>s.metadata?.stageId!==17));
 applyStage17Worksite(project);const st=project.stages.find(s=>s.metadata.stageId===17);
 st.environment=g.HonroEnvironment.makeEnvironment(st,{preset:'enclosed'});st.environment.skyVisible=false;
 const result=g.HonroTerrainDomain.author(project);
 if(art){const{applyStage17WorksiteArt}=await import('../environment/stage17-worksite-art.mjs');applyStage17WorksiteArt(result);}
 const errors=g.HonroSpaceLayout.validate(result.stages.find(s=>s.metadata.stageId===17));
 if(errors.length)throw Error(errors.join('\n'));
 if(JSON.stringify(result.stages.filter(s=>s.metadata?.stageId!==17))!==before)throw Error('Stage17 author changed another map');
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const g=await runtime({legacyMaps:false}),p=await authorStage17Worksite(JSON.parse(await readFile('shared/data/campaign.json','utf8')),g,{art:!process.argv.includes('--no-art')});await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');console.log('Authored Stage17 worksite; unrelated29 exact.');}
