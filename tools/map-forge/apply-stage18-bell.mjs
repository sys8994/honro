import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {applyStage18Bell} from './stage18-bell.mjs';
import {runtime} from '../../game/tests/helpers.mjs';
export async function authorStage18Bell(project,g,{art=true,roster='candidate41'}={}) {
 const before=JSON.stringify(project.stages.filter(s=>![18,19].includes(s.metadata?.stageId)));
 applyStage18Bell(project,{roster,steps:g.HonroStage18Bell?.steps});
 for(const st of project.stages.filter(s=>[18,19].includes(s.metadata?.stageId))){st.environment=g.HonroEnvironment.makeEnvironment(st,{preset:'enclosed'});st.environment.skyVisible=false;}
 const result=g.HonroTerrainDomain.author(project);
 if(art){const {applyStage18BellArt}=await import('../environment/stage18-bell-art.mjs');await applyStage18BellArt(result);}
 for(const st of result.stages.filter(s=>[18,19].includes(s.metadata?.stageId))){const errors=g.HonroSpaceLayout.validate(st);if(errors.length)throw Error(errors.join('\n'));}
 if(JSON.stringify(result.stages.filter(s=>![18,19].includes(s.metadata?.stageId)))!==before)throw Error('Stage18 bell author changed another map');
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const g=await runtime({legacyMaps:false});
 const p=await authorStage18Bell(JSON.parse(await readFile('shared/data/campaign.json','utf8')),g,{art:!process.argv.includes('--no-art'),roster:process.argv.includes('--baseline')?'baseline28':'candidate41'});
 await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');
 console.log('Authored Stage18 hollow bell and Stage19 settled geography; unrelated28 exact.');
}
