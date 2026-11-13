
import {readFile} from 'node:fs/promises';

// Preview only. Existing streets, gates and platforms stay authoritative.
const pieces={21:'bedrock',29:'west-bank'};
export async function applyAct3HandoffArt(project,enabled){
 if(!enabled)return project;
 const assets=new Map(await Promise.all(Object.entries(pieces).map(async([id,piece])=>{
  const asset=JSON.parse(await readFile(new URL('./assets/environment/act3-handoff/stage'+id+'-'+piece+'.json',import.meta.url),'utf8'));
  return [Number(id),asset];
 })));
 return {...project,library:[...project.library,...assets.values()],stages:project.stages.map(stage=>{
  const id=stage.metadata?.stageId,asset=assets.get(id);
  if(!stage.metadata?.campaign||!asset)return stage;
  const placement={id:'act3-handoff-'+id+'-'+pieces[id],assetId:asset.id,x:0,y:0,scale:1,rotation:0,snap:false,layer:'front',depthLayer:'L1'};
  const floor=stage.terrains.find(t=>t.id==='a3-foundation');
  if(!floor||asset.params.contactMapping.some(([, ,x,y])=>!floor.points.some(p=>p.x===x&&p.y===y)))throw Error('Stage '+id+' vector no longer matches the canonical road');
  return {...stage,elements:[...stage.elements,placement]};
 })};
}
