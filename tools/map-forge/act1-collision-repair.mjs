/** Narrow canonical map correction, never a live-save or engine migration.
 * The west stone's low collision tip intersected the sloped ferry bank at the
 * support-exposure tolerance: a knight could lose the floor before wall probes
 * stopped movement. Raise that existing art/collider instance together by 12
 * world units. Its visible foot remains embedded in the bank, and it still
 * blocks ordinary walking while the same default jump clears it.
 */
export const ACT1_STONE_REPAIR=Object.freeze({stageId:3,elementId:'place3-stone-west',assetId:'mockup-granite-small',x:1120,fromY:2015.5568888888888,toY:2003.5568888888888,deltaY:-12});
export function applyAct1CollisionRepair(project){
 const st=project.stages?.find(s=>s.metadata?.stageId===3||s.id==='stage-3'),e=st?.elements?.find(e=>e.id===ACT1_STONE_REPAIR.elementId);
 if(e?.assetId===ACT1_STONE_REPAIR.assetId&&Math.abs(e.x-ACT1_STONE_REPAIR.x)<1e-8&&Math.abs(e.y-ACT1_STONE_REPAIR.fromY)<1e-8)e.y=ACT1_STONE_REPAIR.toY;
 return project;
}
