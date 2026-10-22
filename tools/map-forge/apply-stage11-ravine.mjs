import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {applyStage11Ravine} from './stage11-ravine.mjs';
import {authorStage11RavineEncounters} from './stage11-ravine-encounters.mjs';
import {applyStage11RavineArt} from '../environment/stage11-ravine-art.mjs';
import {runtime} from '../../game/tests/helpers.mjs';
export async function authorStage11Ravine(project,g){
 const current=project.stages.find(s=>s.metadata?.stageId===11),densityWave=current?.initialState?.honroEncounterDensityRevision===1?structuredClone(current.markers.find(m=>m.id==='wave-hold-knots')):null;
 const other=JSON.stringify(project.stages.filter(s=>s.metadata?.stageId!==11));
 applyStage11Ravine(project);const st=project.stages.find(s=>s.metadata.stageId===11);
 // The dedicated geometry/art replaces the old transition composition.
 // Its retained opt-in would reapply old room planes during the bundle pass.
 delete st.design.cavernTransitions;
 st.environment=g.HonroEnvironment.makeEnvironment(st,{preset:'forest'});
 applyStage11RavineArt(project);
 authorStage11RavineEncounters(g,project);
 // Combat-only density author deliberately preserves this authored entry marker.
 // Do not overwrite its later safe landing with the pre-density encounter default.
 if(densityWave)st.markers[st.markers.findIndex(m=>m.id==='wave-hold-knots')]=densityWave;
 st.initialState.honroStage11CompletionRevision=1;
 st.design.ravine.completionRevision=1;
 let result=g.HonroTerrainDomain.author(project);
 const errors=g.HonroSpaceLayout.validate(result.stages.find(s=>s.metadata.stageId===11));if(errors.length)throw Error(errors.join('\n'));
 if(JSON.stringify(result.stages.filter(s=>s.metadata?.stageId!==11))!==other)throw Error('Stage 11 author touched another stage');
 return g.HonroStage11Quest.author(g.HonroAct2Pacing.author(result,[11]));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const g=await runtime({legacyMaps:false}),source=await readFile('shared/data/campaign.json','utf8'),input=JSON.parse(source),p=await authorStage11Ravine(input,g);
 if(JSON.stringify(p)!==JSON.stringify(JSON.parse(source)))await writeFile('shared/data/campaign.json',JSON.stringify(p,null,source.includes('\n  ')?2:0)+'\n');
 console.log('Authored expanded Stage 11; current data retained when unchanged, other 29 maps unchanged.');
}
