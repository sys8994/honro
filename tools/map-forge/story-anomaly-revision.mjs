/** Additive story-environment authoring. Never regenerate a campaign map here:
 * current collision, open roofs, actors, free stake routes and saved payloads
 * remain owned by their existing authors. Only fresh entries receive this data. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export const STORY_ANOMALY_ENVIRONMENTS={
 17:{revision:1,kind:'bell-approach',recess:{x:9340,y:4240,w:390,h:180}},
 18:{revision:1,kind:'bell-projectiles'},
 19:{revision:1,kind:'funeral-echo',echo:{x:7140,y:6950,w:180,h:50}},
 25:{revision:1,kind:'waterworks-first-sign',drip:{x:1790,y:3270,height:240,turn:62},recess:{x:3020,y:3300,w:260,h:210}},
 27:{revision:1,kind:'waterworks-deep',drip:{x:5850,y:4190,height:235,turn:145},recess:{x:5740,y:4260,w:260,h:265},deepRecess:{x:3910,y:2350,w:350,h:270}}
};
export const VOID_ENCOUNTER_TERRAIN={revision:1,trigger:{left:3370,right:4230,y:3050},seam:{x:3850,y:3050,w:150},supportId:'gallery-6:collision:0'};
export function applyStoryAnomalyEnvironment(project){
 const out=structuredClone(project);
 for(const s of out.stages||[]){const id=s.metadata?.stageId,config=STORY_ANOMALY_ENVIRONMENTS[id];if(!config)continue;
  s.initialState??={};s.initialState.honroStoryAnomalyRevision=1;s.initialState.honroStoryAnomalyEnvironment=structuredClone(config);
  if(id===27){s.initialState.honroAct3Void={revision:1,state:'READY'};s.design??={};s.design.act3??={};s.design.act3.voidEncounter=structuredClone(VOID_ENCOUNTER_TERRAIN);}
 }
 return out;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const source=process.argv[2]||'shared/data/campaign.json',target=process.argv[3]||source;
 const project=JSON.parse(await readFile(source,'utf8'));await writeFile(target,JSON.stringify(applyStoryAnomalyEnvironment(project),null,2)+'\n');
 console.log('Authored opt-in story environment on stages 17/18/19/25/27; existing map geometry and gameplay payloads preserved.');
}
