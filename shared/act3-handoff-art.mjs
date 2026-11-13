
import {readFile} from 'node:fs/promises';

// Keep the selected paint on the existing street foundation. The phase-A cart,
// all roofs and their collision remain the campaign author's own objects.
export async function applyAct3HandoffArt(project,enabled){
 if(!enabled)return project;
 const asset=JSON.parse(await readFile(new URL('./assets/environment/act3-handoff/stage21-bedrock.json',import.meta.url),'utf8'));
 const placement={id:'act3-handoff-21-bedrock',assetId:asset.id,x:0,y:0,scale:1,rotation:0,snap:false,layer:'front',depthLayer:'L1'};
 return {...project,library:[...project.library,asset],stages:project.stages.map(stage=>{
  if(!stage.metadata?.campaign||stage.metadata.stageId!==21)return stage;
  const floor=stage.terrains.find(t=>t.id==='a3-foundation');
  if(!floor||asset.params.contactMapping.some(([, ,x,y])=>!floor.points.some(p=>p.x===x&&p.y===y)))throw Error('Stage 21 vector no longer matches the canonical road');
  return {...stage,elements:[...stage.elements,placement]};
 })};
}
