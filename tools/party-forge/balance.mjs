import {mapPath} from './proportions.mjs';
import {pathBounds,paintedBounds} from './shape-bounds.mjs';
// v010 follows the user's latest proportions. An artist-marked skull crown
// under the hair/hat and the chin define one anatomical head. Stature is crown
// to sole; hairstyles, buns, beards and the gat are excluded from both measures.
// Crown Y is recorded in the original supplied portrait-sheet pixel space.
export const BALANCE={seol_o:{width:1.20,heads:7.5},damheo:{width:1.125,heads:7},hwigyeom:{width:1.125,heads:7.5},sodan:{width:1,heads:7.5}};
const CROWN_Y={seol_o:66,damheo:76,hwigyeom:111,sodan:48};
const round=n=>Math.round(n*1e6)/1e6;
export function balanceSilhouette(asset,api){
 const old=structuredClone(asset),id=old.character_id,spec=BALANCE[id],by=Object.fromEntries(old.rig.parts.map(p=>[p.id,p])),floor=by.front_foot.pivot[1],pivot=by.head.pivot;
 const baseline=paintedBounds(old,api),face=pathBounds(old.paths.find(p=>p.id==='face_plane').d),sheet=old.face.authoringMap,crown=[pivot[0],sheet.to[1]+(CROWN_Y[id]-sheet.from[1])*sheet.scale],chin=[pivot[0],face[3]],idleHead=api.rigMatrices(old,api.sampleAnimation(old,'idle',0,true).poses).head;
 const crownBefore=api.point(idleHead,crown),chinBefore=api.point(idleHead,chin),sole=paintedBounds(old,api,{filter:p=>p.part.endsWith('_foot')})[3],skull=chinBefore[1]-crownBefore[1];
 // The decorated top stays still; enlarging the head lowers the anatomical
 // crown slightly. Account for that instead of dividing hat-to-foot by a face.
 const headScale=(sole-baseline[1])/(spec.heads*skull+crownBefore[1]-baseline[1]);
 function retarget(sy){
  const a=structuredClone(old),body=([x,y])=>[240+(x-240)*spec.width,floor+(y-floor)*sy],headPivot=body(pivot),head=([x,y])=>[headPivot[0]+(x-pivot[0])*headScale,headPivot[1]+(y-pivot[1])*headScale];
  const translateAt=origin=>{const next=body(origin);return ([x,y])=>[x+next[0]-origin[0],y+next[1]-origin[1]];};
  const maps={root:p=>p,head,hair_tail:head,spirit:p=>p,qi:p=>p};
  // Keep sole thickness and planted ankle height. Hands retain a natural rigid
  // grip, and the bow/sword are translated with that grip rather than stretched.
  for(const side of ['rear','front']){maps[side+'_foot']=([x,y])=>[body([x,y])[0],y];maps[side+'_hand']=translateAt(by[side+'_hand'].pivot);}
  maps.weapon=id==='damheo'?([x,y])=>[x+body(by.front_hand.pivot)[0]-by.front_hand.pivot[0],body([x,y])[1]]:translateAt(by.front_hand.pivot);
  for(const p of a.paths){p.d=mapPath(p.d,maps[p.part]||body);if(['head','hair_tail'].includes(p.part)&&p.strokeWidth)p.strokeWidth*=headScale;}
  for(const p of a.rig.parts)p.pivot=(maps[p.id]||body)(p.pivot).map(round);
  a.rig.bindThorax=body(old.rig.bindThorax).map(round);
  for(const [key,p]of Object.entries(a.face.landmarks))a.face.landmarks[key]=head(p).map(round);
  a.face.authoringMap.to=head(a.face.authoringMap.to).map(round);a.face.authoringMap.scale*=headScale;
  a.face.anatomy={crown:head(crown).map(round),chin:head(chin).map(round),sourceCrownY:CROWN_Y[id],basis:'Artist-estimated skull crown under the hair/hat to chin; original sheet coordinates. Decorative hair and gat excluded.'};
  if(a.constraints.bowstring){const b=a.constraints.bowstring;b.tips=b.tips.map(maps.weapon);b.restNock=maps.weapon(b.restNock);b.drawPoint=maps.rear_hand(b.drawPoint);a.constraints.arrow.grip=maps.weapon(a.constraints.arrow.grip);}
  for(const [name,clip]of Object.entries(a.animation.animations))clip.keyframes=old.animation.animations[name].keyframes.map(frame=>{
   const p=api.completePose(old,frame);
   for(const [key,value]of Object.entries(p))if(Array.isArray(value)&&value.length===2&&value.every(Number.isFinite))p[key]=body(value).map(round);
   // Retarget to reachable endpoints while keeping both foot contact schedules.
   const solved=api.solvePose(a,p);for(const side of ['rear','front'])for(const [control,joint]of [['Hand','_hand'],['Foot','_foot']])p[side+control]=solved.guide.joints[side+joint].map(round);
   return p;
  });
  a.proportions={...old.proportions,width:old.proportions.width*spec.width,headScale:old.proportions.headScale*headScale,headTranslation:[0,headPivot[1]-143],headSizeBasis:'Anatomical skull crown to chin, including forehead under hair/hat; divide crown-to-sole stature by this head height.',balance:{baselineVersion:9,widthMultiplier:spec.width,targetHeadUnits:spec.heads,headMultiplier:headScale,bodyHeightMultiplier:sy,standingBoundsBefore:baseline,anatomicalHeadUnitsBefore:(sole-crownBefore[1])/skull}};
  a.version=10;a.asset_id=id+'.v010';return a;
 }
 // Larger heads take space from the existing body height rather than growing
 // the character. Solve against the actual idle rig (including Damheo's lean).
 let lo=.65,hi=1,next;for(let i=0;i<26;i++){const sy=(lo+hi)/2;next=retarget(sy);const top=paintedBounds(next,api)[1];if(top>baseline[1])lo=sy;else hi=sy;}
 next=retarget((lo+hi)/2);const after=paintedBounds(next,api);next.proportions.balance.standingBoundsAfter=after;
 const mat=api.rigMatrices(next,api.sampleAnimation(next,'idle',0,true).poses).head,crownAfter=api.point(mat,next.face.anatomy.crown),chinAfter=api.point(mat,next.face.anatomy.chin),soleAfter=paintedBounds(next,api,{filter:p=>p.part.endsWith('_foot')})[3];
 next.proportions.balance.anatomicalHeadUnitsAfter=(soleAfter-crownAfter[1])/(chinAfter[1]-crownAfter[1]);
 next.portrait={headBounds:paintedBounds(next,api,{filter:p=>['head','hair_tail'].includes(p.part)})};
 Object.assign(asset,next);
}
