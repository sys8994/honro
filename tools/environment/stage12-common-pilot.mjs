/** Narrow, visual-only comparison. Existing asset definitions remain exact. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export const COMMON_PILOT={revision:1,bounds:{left:5700,top:4250,right:7100,bottom:6800},terrainIds:['sq-lower-ground','sq-inner-joint'],assets:{'sq-art-bent-waymark-pine':{assetId:'builtin:ravinePine',scale:.48},'sq-art-natural-stone-3':{assetId:'act2:rock-bank',scale:1}}};
export function applyStage12CommonPilot(project){
 const s=project.stages.find(s=>s.metadata?.stageId===12);
 for(const [id,spec] of Object.entries(COMMON_PILOT.assets)){
  const asset=project.library.find(a=>a.id===spec.assetId),e=s.elements.find(e=>e.id===id);
  if(!asset||!e||asset.collision?.length)throw Error('Missing or collidable pilot asset '+spec.assetId);
  Object.assign(e,spec);e.y=e.stage12Support.y-((asset.reference?.foot?.y||0)-(asset.anchor?.y||0))*e.scale;
 }
 s.design.quarryArt.commonPilot=structuredClone(COMMON_PILOT);s.design.quarryArt.artAssetIds=s.elements.map(e=>e.assetId);return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file='shared/data/campaign.json',input=JSON.parse(await readFile(file,'utf8')),out=applyStage12CommonPilot(input);await writeFile(file,JSON.stringify(out)+'\n');}
