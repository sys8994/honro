import assert from 'node:assert/strict';
export const MARKER='act4-sideview:33:exterior-v3:composite',FIELD='act4-sideview:33:exterior-v3:field';
export const SOURCES=['act4-sideview:33:coastal-v2:west-continuous-geology','act4-sideview:33:coastal-v2:lowland'];
export function applyStage33ExteriorCandidate(project,field){
 const stage=project.stages.find(s=>s.metadata?.stageId===33);if(!stage)return project;
 if(stage.elements.some(e=>e.assetId===MARKER))return project;
 assert.equal(field.id,FIELD);assert.equal(field.params?.stage33ExteriorField,1);assert.equal(field.collision.length,0);
 const indices=SOURCES.map(id=>stage.elements.findIndex(e=>e.assetId===id));assert(indices[0]>=0&&indices[1]>indices[0]);
 const originals=SOURCES.map(id=>project.library.find(a=>a.id===id));assert(originals.every(a=>a?.vector&&!a.collision?.length));
 for(const e of stage.elements.slice(indices[0]+1,indices[1])){const a=project.library.find(a=>a.id===e.assetId);assert.equal(a?.vector?.root?.children?.length,0,'Interleaved visible provider would change order');}
 for(const i of indices){const e=stage.elements[i];assert.equal(e.x,0);assert.equal(e.y,0);assert.equal(e.scale??1,1);assert.equal(e.rotation??0,0);assert.equal(e.opacity??1,1);}
 const marker={...originals[0],id:MARKER,name:'Stage 33 exterior isolated composite (candidate)',bounds:{x:-4500,y:-800,w:15200,h:7600},reference:{...originals[0].reference,bounds:{x:-4500,y:-800,w:15200,h:7600}},vector:{version:1,viewBox:[-4500,-800,15200,7600],root:{tag:'g',children:[]}},params:{stage33ExteriorComposite:{version:1,sourceIds:SOURCES,fieldId:FIELD,originalDesign:structuredClone(stage.design),hadDesign:Object.hasOwn(stage,'design'),originalElements:indices.map(index=>({index,element:structuredClone(stage.elements[index])}))}}};
 assert(!project.library.some(a=>a.id===MARKER||a.id===FIELD));
 const elements=stage.elements.flatMap((e,i)=>i===indices[1]?[]:[i===indices[0]?{...e,id:MARKER,assetId:MARKER}:e]);
 const compatibilityAssetIds=[...new Set([...(stage.design?.nativeArt?.compatibilityAssetIds||[]),...SOURCES,FIELD])];
 const next={...stage,elements,design:{...stage.design,nativeArt:{...stage.design?.nativeArt,compatibilityAssetIds}}};
 assert.deepEqual({...next,elements:stage.elements,...(Object.hasOwn(stage,'design')?{design:stage.design}:{})},Object.hasOwn(stage,'design')?stage:{...stage,design:next.design});
 return {...project,library:[...project.library,field,marker],stages:project.stages.map(s=>s===stage?next:s)};
}
export function restoreStage33Exterior(project){
 const stage=project.stages.find(s=>s.metadata?.stageId===33),marker=project.library.find(a=>a.id===MARKER),backup=marker?.params?.stage33ExteriorComposite?.originalElements;
 if(!stage?.elements.some(e=>e.assetId===MARKER))return project;
 assert(Array.isArray(backup)&&backup.length===2,'Missing exact original element records');
 let elements=stage.elements.filter(e=>e.assetId!==MARKER);for(const {index,element}of backup)elements.splice(index,0,structuredClone(element));
 const restored={...stage,elements};const cfg=marker.params.stage33ExteriorComposite;if(cfg.hadDesign)restored.design=structuredClone(cfg.originalDesign);else delete restored.design;
 return {...project,library:project.library.filter(a=>a.id!==MARKER&&a.id!==FIELD),stages:project.stages.map(s=>s===stage?restored:s)};
}
