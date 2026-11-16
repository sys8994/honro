import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// Paint-only revision: old IDs remain unchanged for suspended battle snapshots.
// Hidden current-stage providers retain coverage metadata without duplicating SVG paths.
export function applyStage33CoastalPack(project,pack){
 const stage=project.stages.find(s=>s.metadata?.stageId===33);if(!stage)return project;
 const prefix='act4-sideview:33:coastal-v2:';
 if(stage.elements.some(e=>e.id===pack.assets[0].id))return project;
 assert.deepEqual(pack.worldSize,[stage.width,stage.height],'Stale stage33 registration');
 const library=[...project.library],ids=new Set(library.map(a=>a.id)),eligible=new Set(pack.replaceElementIds);
 let body=false;const elements=[];
 for(const e of stage.elements){
  if(!eligible.has(e.id)){elements.push(e);continue;}
  const old=library.find(a=>a.id===e.assetId);assert(old?.vector,'Missing stage33 artwork '+e.id);
  const id=prefix+'retained-'+e.id;assert(!ids.has(id));ids.add(id);
  library.push({...old,id,name:'Stage33 former coverage only: '+e.id,vector:{...old.vector,clips:{},root:{tag:'g',children:[]}},params:{...old.params,coastalV2CoverageOnly:true}});
  elements.push({...e,assetId:id});
  if(e.id==='approved33-body'){
   body=true;
   for(const asset of pack.assets){
    assert(asset.id.startsWith(prefix)&&!ids.has(asset.id));assert.equal(asset.collision?.length,0);assert(!asset.interactionType);ids.add(asset.id);library.push(asset);
    elements.push({id:asset.id,assetId:asset.id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',nativeArtLayer:'surface',layer:'mid'});
   }
  }
 }
 assert(body,'Missing stage33 BODY insertion anchor');
 const next={...stage,elements};assert.deepEqual({...next,elements:stage.elements},stage,'Stage33 gameplay changed');
 return {...project,library,stages:project.stages.map(s=>s===stage?next:s)};
}
export async function applyStage33CoastalArt(project){
 const pack=JSON.parse(await readFile(new URL('./data/act4/sideview-art/33-coastal-v2.json',import.meta.url),'utf8'));
 return applyStage33CoastalPack(project,pack);
}
