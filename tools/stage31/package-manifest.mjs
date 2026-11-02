/** Metadata-only production evidence bound to the actual shipped Stage31.
 * Assets stay in world.json once. This does not approve or relax any gate. */
import {createHash} from 'node:crypto';
export function stagePayload(world){
 const stage=world.stages.find(s=>s.metadata?.stageId===31);
 if(!stage)throw Error('Stage31 is missing');
 const ids=new Set([...(stage.elements||[]),...(stage.environment?.placements||[])].map(v=>v.assetId));
 return {stage,assets:world.library.filter(a=>ids.has(a.id)).sort((a,b)=>a.id.localeCompare(b.id))};
}
export const payloadSha256=world=>createHash('sha256').update(JSON.stringify(stagePayload(world))).digest('hex');
export function createManifest(project){
 const id=stagePayload(project).stage.id;
 if(!project.production?.cards?.[id])throw Error('Production card is missing');
 return {format:'honro-stage31-evidence-v1',stageId:id,payloadSha256:payloadSha256(project),
  production:{version:project.production.version,cards:{[id]:project.production.cards[id]},
   reviews:{[id]:project.production.reviews?.[id]||[]},probeResults:{[id]:project.production.probeResults?.[id]||[]}}};
}
export function resolveManifest(record,world){
 // Preserve the existing full-package format, with its original comparison.
 if(record.format!== 'honro-stage31-evidence-v1')return record;
 const id=stagePayload(world).stage.id;
 if(record.stageId!==id||record.payloadSha256!==payloadSha256(world))throw Error('Production evidence source does not match shipped Stage31');
 if(!record.production?.cards?.[id])throw Error('Production evidence card is missing');
 return {...world,production:record.production};
}
