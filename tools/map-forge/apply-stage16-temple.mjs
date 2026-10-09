import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {applyStage16Temple} from './stage16-temple.mjs';
import {runtime} from '../../game/tests/helpers.mjs';
export async function authorStage16Temple(project,g,{art=true}={}) {
 const before=JSON.stringify(project.stages.filter(s=>s.metadata?.stageId!==16));
 applyStage16Temple(project);
 const st=project.stages[15];
 st.environment=g.HonroEnvironment.makeEnvironment(st,{preset:'enclosed'});
 st.environment.skyVisible=false;
 const result=g.HonroTerrainDomain.author(project);
 if(art){const {applyStage16TempleArt}=await import('../environment/stage16-temple-art.mjs');applyStage16TempleArt(result);const {applyStage16TempleBuddha}=await import('../environment/stage16-temple-buddha-art.mjs');applyStage16TempleBuddha(result);}
 const errors=g.HonroSpaceLayout.validate(result.stages[15]);
 if(errors.length)throw Error(errors.join('\n'));
 if(JSON.stringify(result.stages.filter(s=>s.metadata?.stageId!==16))!==before)throw Error('Stage16 author changed another map');
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const g=await runtime({legacyMaps:false});
 const p=await authorStage16Temple(JSON.parse(await readFile('shared/data/campaign.json','utf8')),g,{art:!process.argv.includes('--no-art')});
 await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');
 console.log('Authored Stage16 temple; unrelated29 exact.');
}
