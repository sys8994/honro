import {readFile} from 'node:fs/promises';

// Art overlays apply after the official gameplay authors. Retired provider IDs
// stay in each chapter's lazy asset packet for the previous battle snapshots.
const additions = {
 31:[['estuary-earth','mid'],['boarding-wood','mid']],
 32:[['west-house','structural-back'],['workshop','structural-back'],['shelter','structural-back']],
 33:[['tidal-contact','mid']],
 34:[['cliff-contact','mid']],
 35:[['bedrock','structural-back'],['bamboo','structural-back'],['walls','structural-back']],
 36:[['village','structural-back']],
 37:[['road-props','structural-back'],['railings','prop'],['reeds','front']],
 38:[['cave-contact','mid']],
 39:[['shore-contact','mid']],
 40:[['pier-braces','structural-back']],
};
const replaceBody = new Set([32,35,36,37]);
const retiredPiles = new Set(['approved40-departure-pile-art','approved40-arrival-pile-art',
 'approved40-departure-middle-pile-art','approved40-arrival-middle-pile-art']);
const semantic = {'structural-back':'structure',mid:'surface',prop:'rear',front:'front'};
const assetId = (n,part)=>'act4-handoff:'+n+':'+part;


function stage35Bedrock(stage,source){
 // Reuse the shipped traced rock planes. The walk-edge mask only prevents
 // old vegetation and structures from reappearing above the new clearings.
 const shades={'#4c72a8':'#666659','#31568d':'#55594c','#1d3968':'#494f46','#142845':'#39443f'};
 const id=assetId(35,'bedrock'),asset=structuredClone(source),vector=asset.vector,rock=vector.root.children[0];
 const paths=rock.children.filter(p=>Object.hasOwn(shades,p.fill)).map(p=>({...p,fill:shades[p.fill]}));
 if(paths.length!==Object.keys(shades).length)throw Error('Stage 35 bedrock trace changed');
 const clips=[];
 for(const t of stage.terrains)for(const i of t.properties?.honroWalkEdges??[]){
  const [a,b]=[t.points[i],t.points[(i+1)%t.points.length]].sort((p,q)=>p.x-q.x);
  if(a.x!==b.x)clips.push('M'+a.x+' '+(a.y+22)+'L'+b.x+' '+(b.y+22)+'V'+stage.height+'H'+a.x+'Z');
 }
 if(!clips.length)throw Error('Stage 35 is missing walk edges for its rear rock mask');
 rock.children=paths;
 vector.clips.belowWalk=[clips.join('')];
 vector.root={tag:'g',clipPath:'belowWalk',children:[vector.root]};
 return {...asset,id,name:'Stage 35 rear bedrock',params:{semanticLayer:'REAR',silhouetteUnderpaint:false}};
}

export async function applyAct4HandoffArt(project) {
 const library=[...project.library];
 const entries=await Promise.all(project.stages.map(async stage=>{
  const n=stage.metadata?.stageId;
  if(!Object.hasOwn(additions,n))return {stage,assets:[]};
  const pack=JSON.parse(await readFile(new URL('./data/act4/handoff-art/'+n+'.json',import.meta.url),'utf8'));
  if(pack.worldSize.some((value,index)=>Math.abs(value-[stage.width,stage.height][index])>1e-6))
   throw Error('Act 4 handoff artwork has stale registration: '+n);
  const compatibilityAssetIds=[];
  const terrainIds=new Set(stage.terrains.map(t=>t.id));
  const nativeArt={...stage.design.nativeArt,compatibilityAssetIds};
  const design={...stage.design,nativeArt};
  const elements=stage.elements.flatMap(element=>{
   if(n===40&&retiredPiles.has(element.id)){
    compatibilityAssetIds.push(element.assetId);
    return [];
   }
   if(replaceBody.has(n)&&element.id==='approved'+n+'-body'){
    compatibilityAssetIds.push(element.assetId);
    return [{...element,assetId:assetId(n,'body'),
     nativeTerrainIds:element.nativeTerrainIds.filter(id=>terrainIds.has(id))}];
   }
   return [element];
  });
  if(n===32){
   const door=design.vectorShelterDoor;
   compatibilityAssetIds.push(door.assetId);
   design.vectorShelterDoor={...door,assetId:assetId(n,'door'),bodyAssetId:assetId(n,'body'),standalone:true};
   nativeArt.coveredTerrainIds=nativeArt.coveredTerrainIds.filter(id=>terrainIds.has(id));
  }
  if(n===35){
   nativeArt.far='act4FarBambooHandoff';
   pack.assets.push(stage35Bedrock(stage,project.library.find(a=>a.id==='approved35:body')));
  }
  if(n===36){
   compatibilityAssetIds.push(design.vectorDoorAssetId);
   design.vectorDoorAssetId=assetId(n,'door');
   nativeArt.far='act4FarInlandHandoff';
  }
  for(const [part,layer] of additions[n]){
   elements.push({id:assetId(n,part),assetId:assetId(n,part),x:0,y:0,scale:1,rotation:0,
    snap:false,depthLayer:'L1',layer,nativeArtLayer:semantic[layer]});
  }
  // Preserve the dedicated return boat and all five gameplay walkways.
  // Draw the new braces on the structural pass before the opaque BODY.
  if(!compatibilityAssetIds.length)delete nativeArt.compatibilityAssetIds;
  for(const asset of pack.assets){
   if(!asset.id.startsWith('act4-handoff:'+n+':')||asset.collision.length||asset.interactionType)
    throw Error('Invalid Act 4 handoff art: '+asset.id);
  }
  return {stage:{...stage,design,elements},assets:pack.assets};
 }));
 for(const {assets} of entries)library.push(...assets);
 return {...project,stages:entries.map(({stage})=>stage),library};
}
