import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {applyStage11Ravine} from './stage11-ravine.mjs';
import {authorStage11RavineEncounters} from './stage11-ravine-encounters.mjs';
import {applyStage11RavineArt} from '../environment/stage11-ravine-art.mjs';
import {runtime} from '../../game/tests/helpers.mjs';
export async function authorStage11Ravine(project,g){
 const other=JSON.stringify(project.stages.filter(s=>s.metadata?.stageId!==11));
 applyStage11Ravine(project);const st=project.stages.find(s=>s.metadata.stageId===11);
 // The dedicated geometry/art replaces the old transition composition.
 // Its retained opt-in would reapply old room planes during the bundle pass.
 delete st.design.cavernTransitions;
 st.environment=g.HonroEnvironment.makeEnvironment(st,{preset:'forest'});
 applyStage11RavineArt(project);
 authorStage11RavineEncounters(g,project);
 st.initialState.honroStage11CompletionRevision=1;
 st.design.ravine.completionRevision=1;
 let result=g.HonroTerrainDomain.author(project);
 const errors=g.HonroSpaceLayout.validate(result.stages.find(s=>s.metadata.stageId===11));if(errors.length)throw Error(errors.join('\n'));
 if(JSON.stringify(result.stages.filter(s=>s.metadata?.stageId!==11))!==other)throw Error('Stage 11 author touched another stage');
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const g=await runtime({legacyMaps:false}),p=await authorStage11Ravine(JSON.parse(await readFile('shared/data/campaign.json','utf8')),g);
 await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');console.log('Authored expanded Stage 11; other 29 maps unchanged.');
}
