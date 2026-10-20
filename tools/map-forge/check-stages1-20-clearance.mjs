/** Opt-in check for named repaired chapters, not a campaign sweep/fullplay. */
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../../game/tests/helpers.mjs';
import {CLEARANCE_PATCHES,applyChapterClearancePatch} from './stages1-20-clearance-patch.mjs';
import {STAGE3_FERRY_FLOCK,applyStage3FerryFlock} from './stage3-image-first.mjs';
const ids=process.argv.slice(2).map(Number);
if(!ids.length||ids.some(n=>n!==3&&!CLEARANCE_PATCHES[n]))throw Error('Pass explicit repaired chapters: 3 11 13 15 16 17 18');
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
for(const id of ids){
 const {b,e}=battlefield(g,id),authored=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===id);
 const changed=id===3?Object.entries(STAGE3_FERRY_FLOCK).map(([id,p])=>({id,...p})):CLEARANCE_PATCHES[id];
 for(const row of changed){const u=e.unit(row.id);assert(u,row.id);assert(Math.abs(u.x-row.x)<.01&&Math.abs(u.y-row.y)<.01,row.id+' must not require constructor relocation');assert(C.flightClear(e,u,u),row.id+' full body clearance');}
 const before=b.units.filter(C.flyingEnemy).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp}));
 for(let tick=0;tick<120;tick++)e.stepUnits(1/60);
 for(const p of before){const u=e.unit(p.id);assert(C.flightClear(e,u,u),p.id+' all initial flying bodies');assert.deepEqual({id:u.id,x:u.x,y:u.y,hp:u.hp},p,p.id+' two seconds natural physics');}
 const project=structuredClone(g.HONRO_PROJECT),stage=JSON.stringify(authored);
 if(id===3)applyStage3FerryFlock(project);else applyChapterClearancePatch(project,id);
 assert.equal(JSON.stringify(project.stages.find(s=>s.metadata.stageId===id)),stage,'idempotent pose patch');
 console.log('PASS chapter',id,'full-body air clearance, no spawn fallback, 2s stable physics; enemies',e.alive(1).length,'action cap',b.enemyLimit);
}
