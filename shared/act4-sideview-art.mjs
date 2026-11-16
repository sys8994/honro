import {readFile} from 'node:fs/promises';
import {applyStage33CoastalArt} from './act4-stage33-coastal-art.mjs';

// Paint-only correction. The existing BODY remains the one coverage owner;
// these additions use the native surface pass without adding collision.
// Old provider IDs and battle snapshots retain their original exact artwork.
export async function applyAct4SideviewArt(project) {
 const library=[...project.library];
 const entries=await Promise.all(project.stages.map(async stage=>{
  const n=stage.metadata?.stageId;
  if(![33,40].includes(n))return {stage,assets:[]};
  const pack=JSON.parse(await readFile(new URL(`./data/act4/sideview-art/${n}.json`,import.meta.url),'utf8'));
  if(pack.stage!==n||pack.worldSize[0]!==stage.width||pack.worldSize[1]!==stage.height)
   throw Error(`Stale side-view artwork registration: ${n}`);
  const ids=new Set(library.map(a=>a.id));
  for(const asset of pack.assets){
   if(!asset.id.startsWith(`act4-sideview:${n}:`)||ids.has(asset.id)||asset.collision.length||asset.interactionType)
    throw Error(`Invalid side-view artwork: ${asset.id}`);
   ids.add(asset.id);
  }
  const elements=[];let inserted=false;
  for(const element of stage.elements){
   elements.push(element);
   if(element.id!==`approved${n}-body`)continue;
   inserted=true;
   for(const asset of pack.assets)elements.push({id:asset.id,assetId:asset.id,x:0,y:0,scale:1,rotation:0,snap:false,
    depthLayer:'L1',layer:'mid',nativeArtLayer:'surface'});
  }
  if(!inserted)throw Error(`Missing original BODY: ${n}`);
  return {stage:{...stage,elements},assets:pack.assets};
 }));
 for(const entry of entries)library.push(...entry.assets);
 return applyStage33CoastalArt({...project,library,stages:entries.map(e=>e.stage)});
}
