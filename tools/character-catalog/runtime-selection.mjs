import assert from 'node:assert/strict';
/** Catalog-only payload selection. Full runtime remains the inventory authority. */
export const catalogImageGlobals=Object.freeze(['HONRO_EQUIPMENT_ICONS','HONRO_ACT1_FAR_DATA','HONRO_ACT2_FAR_DATA','HONRO_REST_BACKDROPS','HONRO_AUTHORED_FAR']);
export function catalogProject(project){return {stages:project.stages.map(s=>({metadata:{stageId:s.metadata.stageId},width:s.width,height:s.height}))};}
export function catalogRuntime(entries,project){
 assert.equal(entries.filter(e=>e.name==='campaign').length,1,'Exactly one campaign source');
 for(const name of catalogImageGlobals)assert.equal(entries.filter(e=>e.global===name).length,1,'Exactly one known image data entry: '+name);
 assert(project.stages.length>0);
 for(const s of project.stages)assert(Number.isFinite(s.metadata?.stageId)&&Number.isFinite(s.width)&&Number.isFinite(s.height),'Valid exact stage dimensions');
 return entries.map(entry=>catalogImageGlobals.includes(entry.global)?'globalThis.'+entry.global+'={};':entry.name==='campaign'?'globalThis.HONRO_PROJECT='+JSON.stringify(catalogProject(project))+';':entry.code).join('\n');
}
