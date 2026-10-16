/** Fresh-map-only narrow repair; never imported by runtime or Continue. */
import {ferryY,FERRY_LAYOUT} from './stage30-ferry.mjs';
import {applyStage30FerryArt} from '../environment/stage30-ferry-art.mjs';
const ID='sf-quay-west-loft';
export function refineStage30RoofAccess(p){
 const s=p.stages.find(s=>s.metadata?.stageId===30),t=s.terrains.find(t=>t.id===ID),desired=FERRY_LAYOUT.surfaces.find(t=>t.id===ID),dy=desired.top[0][1]-t.points[0].y;
 if(dy!==0&&dy!==40)throw Error('Unexpected Stage30 roof source; do not move an unknown layout');
 if(dy){for(const point of t.points)point.y+=dy;for(const u of s.units)if(u.stageOverrides?.honroEncounterSupport===ID)u.y+=dy;
  const visit=o=>{if(!o||typeof o!=='object')return;if(o.support===ID&&Number.isFinite(o.y))o.y+=dy;for(const v of Object.values(o))visit(v);};visit(s.initialState.honroFerrySpec.entries);
 }
 applyStage30FerryArt(p);return p;
}
if(process.argv[1]?.endsWith('refine-stage30-roof-access.mjs')){const{readFileSync,writeFileSync}=await import('node:fs');const p=JSON.parse(readFileSync('shared/data/campaign.json'));refineStage30RoofAccess(p);writeFileSync('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');console.log('Stage30 west roof lowered to basic-jump height; only supported entries and art follow.');}
