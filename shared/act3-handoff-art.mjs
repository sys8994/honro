
import {readFile} from 'node:fs/promises';

// Only dress confirmed solid faces. Existing routes and platforms stay authoritative.
const pieces={
 21:'bedrock',
 22:'lower-court',
 23:'quay-west',
 24:'garden-foundation',
 25:'entry-masonry',
 26:'kiln-foundation',
 27:'west-quay-masonry',
 28:'office-foundation',
 29:'west-bank',
 30:'granite-cape'
};
function elementCollision(element,terrainId,library){
 const asset=library.find(a=>a.id===element.assetId);
 const index=Number(terrainId.split(':collision:')[1]),scale=element.scale??1,angle=element.rotation||0;
 if(element.snap)return null;
 const cos=Math.cos(angle),sin=Math.sin(angle);
 return asset?.collision?.[index]?.map(p=>{
  const x=(p.x-(asset.anchor?.x||0))*scale,y=(p.y-(asset.anchor?.y||0))*scale;
  return {x:element.x+x*cos-y*sin,y:element.y+x*sin+y*cos};
 });
}

export async function applyAct3HandoffArt(project,ids=Object.keys(pieces).map(Number)){
 if(!ids.length)return project;
 const assets=new Map(await Promise.all(ids.map(async id=>{
  const piece=pieces[id];
  if(!Number.isInteger(id)||!piece)throw Error('Unknown Act 3 terrain stage '+id);
  const asset=JSON.parse(await readFile(new URL('./assets/environment/act3-handoff/stage'+id+'-'+piece+'.json',import.meta.url),'utf8'));
  return [id,asset];
 })));
 return {...project,library:[...project.library,...assets.values()],stages:project.stages.map(stage=>{
  const id=stage.metadata?.stageId,asset=assets.get(id);
  if(!stage.metadata?.campaign||!asset)return stage;
  const terrainId=asset.params.terrainId||'a3-foundation';
  const floor=stage.terrains.find(t=>t.id===terrainId);
  // Some underground floors come from a placed collision asset.
  const placementId=terrainId.split(':collision:')[0];
  const floorElement=!floor&&stage.elements.find(e=>e.id===placementId);
  const points=floor?.points||(floorElement&&elementCollision(floorElement,terrainId,project.library));
  const mapping=asset.params.contactMapping;
  if(!points||mapping.length<2||mapping.some(([u,v,x,y],i)=>![u,v,x,y].every(Number.isFinite)
   ||i&&(u<=mapping[i-1][0]||x<=mapping[i-1][2])
   ||!points.some(p=>p.x===x&&p.y===y)))throw Error('Stage '+id+' vector no longer matches the canonical road');
  return {...stage,design:{...stage.design,act3HandoffArt:asset.id}};
 })};
}
