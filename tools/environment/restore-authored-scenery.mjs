/** Reconnect the existing authored SVG scenery after the newer map authors.
 * Only decorative records move. Current collision, routes, actors and events
 * remain the output of those authors, including the image-first rosters.
 */
import {surfaceAt} from './act1-scene-composition.mjs';

export function captureAuthoredScenery(project){
 return new Map(project.stages.filter(s=>s.metadata?.stageId<=4).map(s=>[s.id,structuredClone({
  width:s.width,height:s.height,scene:s.design.act1Scene,
  elements:s.elements.filter(e=>e.id.startsWith('a1-scene-'))
 })]));
}

export function restoreAuthoredScenery(project,saved){
 for(const stage of project.stages){
  const source=saved.get(stage.id);if(!source)continue;
  const scene=structuredClone(source.scene),sx=stage.width/source.width,sy=stage.height/source.height;
  const locate=record=>{
   const x=Math.max(1,Math.min(stage.width-1,record.x*sx)),y=record.y*sy;
   // Retain the named support when it still covers this place; otherwise
   // resolve the closest real surface at the same relative map position.
   let hit;try{hit=surfaceAt(stage,x,y,record.supportId);}catch{hit=surfaceAt(stage,x,y);}
   return {...record,...hit};
  };
  scene.scenery=scene.scenery.map(record=>{
   const next=locate(record),rooted=/rooted-(pine|sacred)$/.test(record.assetId);
   next.rootContacts=[];
   if(rooted){
    const reach=(record.assetId.endsWith('sacred')?89:67)*record.scale;
    for(const dx of [-reach,0,reach]){
     const x=Math.max(1,Math.min(stage.width-1,next.x+dx));
     try{next.rootContacts.push(surfaceAt(stage,x,next.y,next.supportId));}
     catch{next.rootContacts.push({x,y:next.y,supportId:next.supportId});}
    }
   }
   next.footOffset=rooted?Math.max(0,...next.rootContacts.map(p=>p.y-next.y))+5*record.scale:0;
   next.y+=next.footOffset;
   return next;
  });
  scene.rocks=scene.rocks.map(record=>({...locate(record),width:record.width*sx,height:record.height*sy}));
  scene.version=1;
  for(const element of source.elements){
   const asset=project.library.find(a=>a.id===element.assetId);
   if(!asset||asset.collision?.length)throw Error('Restoration requires decorative SVG: '+element.id);
   const record=scene.scenery.find(r=>r.id===element.id);
   if(record)stage.elements.push({...element,x:record.x,y:record.y});
  }
  stage.design.act1Scene=scene;
 }
 return project;
}
