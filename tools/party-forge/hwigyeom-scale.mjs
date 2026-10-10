import {mapPath} from './proportions.mjs';
import {paintedBounds} from './shape-bounds.mjs';

// v013 is a final visual-only adjustment to the reviewed v012 artwork. The
// canvas anchor is the painted sole, not the ankle. Keeping that anchor and
// visualHeight fixed preserves ground contact and the game's draw calibration.
export const HWIGYEOM_SCALE=Object.freeze({body:1.05,head:.95});
const round=n=>Math.round(n*1e6)/1e6;
const headPart=id=>id==='head'||id==='hair_tail';

export function refineHwigyeomScale(asset,api){
 if(asset.character_id!=='hwigyeom')return;
 if(asset.proportions?.hwigyeomScale)throw Error('Hwigyeom proportions must be applied exactly once');
 const old=structuredClone(asset),by=Object.fromEntries(old.rig.parts.map(p=>[p.id,p]));
 const anchor=[...old.canvas.anchor],pivot=by.head.pivot;
 const body=p=>p.map((v,i)=>anchor[i]+(v-anchor[i])*HWIGYEOM_SCALE.body);
 const nextHead=body(pivot),head=p=>p.map((v,i)=>nextHead[i]+(v-pivot[i])*HWIGYEOM_SCALE.head);
 const nextGrip=body(old.rig.handSockets.front),weaponDelta=nextGrip.map((v,i)=>v-by.weapon.pivot[i]);
 const weapon=p=>p.map((v,i)=>v+weaponDelta[i]);
 const mapFor=id=>headPart(id)?head:id==='weapon'?weapon:body;
 const standingBefore=paintedBounds(old,api);

 for(const p of asset.paths){
  p.d=mapPath(p.d,mapFor(p.part));
  if(p.strokeWidth)p.strokeWidth*=headPart(p.part)?HWIGYEOM_SCALE.head:p.part==='weapon'?1:HWIGYEOM_SCALE.body;
 }
 for(const p of asset.rig.parts)p.pivot=mapFor(p.id)(p.pivot).map(round);
 asset.rig.bindThorax=body(old.rig.bindThorax).map(round);
 for(const side of ['front','rear'])asset.rig.handSockets[side]=body(old.rig.handSockets[side]).map(round);
 // Use the same rounded coordinate for the sword pivot and palm socket so the
 // production solver retains zero gap at every pose and interpolation sample.
 asset.rig.parts.find(p=>p.id==='weapon').pivot=[...asset.rig.handSockets.front];

 for(const [name,p]of Object.entries(asset.face.landmarks))asset.face.landmarks[name]=head(p).map(round);
 asset.face.authoringMap.to=head(old.face.authoringMap.to).map(round);
 asset.face.authoringMap.scale=old.face.authoringMap.scale*HWIGYEOM_SCALE.head;
 for(const name of ['crown','chin'])asset.face.anatomy[name]=head(old.face.anatomy[name]).map(round);

 // Complete sparse keys against the old rig first. Retarget coordinates only:
 // angles, durations, contact schedules and gameplay release events are kept.
 for(const [name,clip]of Object.entries(asset.animation.animations)){
  clip.keyframes=old.animation.animations[name].keyframes.map(frame=>{
   const p=api.completePose(old,frame);
   for(const [key,value]of Object.entries(p))if(Array.isArray(value)&&value.length===2&&value.every(Number.isFinite))p[key]=body(value).map(round);
   return p;
  });
 }

 const standingAfter=paintedBounds(asset,api),headBounds=paintedBounds(asset,api,{filter:p=>headPart(p.part)});
 const headMatrix=api.rigMatrices(asset,api.sampleAnimation(asset,'idle',0,true).poses).head;
 const crown=api.point(headMatrix,asset.face.anatomy.crown),chin=api.point(headMatrix,asset.face.anatomy.chin);
 const sole=paintedBounds(asset,api,{filter:p=>p.part.endsWith('_foot')})[3];
 asset.portrait={...asset.portrait,headBounds};
 asset.canvas.presentationHeight=Math.max(old.canvas.presentationHeight,anchor[1]-headBounds[1]+8);
 asset.proportions={...old.proportions,
  height:old.proportions.height*HWIGYEOM_SCALE.body,
  width:old.proportions.width*HWIGYEOM_SCALE.body,
  headScale:old.proportions.headScale*HWIGYEOM_SCALE.head,
  headTranslation:old.proportions.headTranslation.map((v,i)=>round(v+nextHead[i]-pivot[i])),
  hwigyeomScale:{revision:13,baselineRevision:12,bodyMultiplier:HWIGYEOM_SCALE.body,headMultiplier:HWIGYEOM_SCALE.head,
   anchor,headPivotBefore:[...pivot],headPivotAfter:nextHead.map(round),weaponTranslation:weaponDelta.map(round),
   standingBoundsBefore:standingBefore,standingBoundsAfter:standingAfter,
   anatomicalHeadUnits:(sole-crown[1])/(chin[1]-crown[1]),
   basis:'Reviewed v012 artwork: entire head, face, hair and gat at 95%; remaining body, hands, feet and costume at 105% about the fixed sole. Sword remains rigid at its original size.'}
 };
 asset.proportionsRevision=13;
}
