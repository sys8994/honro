// Presentation-only v011 motion authoring, applied after silhouette calibration.
// The bind paths, faces, palette and gameplay dimensions remain unchanged.
const copy=x=>structuredClone(x),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function refinePhysicalMotion(a,rig){
 if(a.character_id!=='hwigyeom')return;
 const clip=a.animation.animations.attack,old=copy(clip.keyframes),idle=old[0];
 // A compact passing weight shift replaces the old 130-unit skating lunge.
 // Feet still articulate, but the actor's engine position owns displacement.
 clip.keyframes=old.map((f,i)=>{
  const p=copy(f);p.weaponUnwrapped=true;if(i===0||i===old.length-1)return p;
  for(const k of ['pelvis','thorax','rearShoulder','frontShoulder','rearHip','frontHip','rearFoot','frontFoot'])p[k]=mix(idle[k],f[k],.32);
  const hands=[null,[332,130],[356,88],[420,173],[388,255]];
  p.frontHand=hands[i];p.rearHand=[[0,0],[197,180],[208,165],[218,187],[230,215]][i];
  p.frontArmPlane=i===4?-.45:.8;p.rearArmPlane=.8;
  p.weapon=[0,140,172,305,347][i];p.frontHandAngle=p.weapon;
  p.frontCloth*=.45;p.rearCloth*=.45;
  // The front shoe is already planted before the cut accelerates.
  if(i>=2){p.frontFoot[1]=idle.frontFoot[1];p.contacts=['rear','front'];}
  const solved=rig.solvePose(a,p);
  for(const side of ['rear','front'])p[side+'Hand']=solved.guide.joints[side+'_hand'];
  return p;
 });
 // Angle tracks use an unwrapped full turn, so the grip cannot spin backwards
 // while the blade takes its short continuous recovery arc.
 clip.keyframes.at(-1).weapon=360;clip.keyframes.at(-1).frontHandAngle=360;
 a.motionRevision=11;
}
