// Presentation-only v011 motion authoring, applied after silhouette calibration.
// The bind paths, faces, palette and gameplay dimensions remain unchanged.
const copy=x=>structuredClone(x),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function refinePhysicalMotion(a,rig){
 for(const clip of Object.values(a.animation.animations))for(const p of clip.keyframes)p.frontHandAngle=p.weapon||0;
 if(a.character_id!=='hwigyeom'){refineCompanions(a,rig);return;}
 const clip=a.animation.animations.attack,old=copy(clip.keyframes),idle=old[0];
 // A compact passing weight shift replaces the old 130-unit skating lunge.
 // Feet still articulate, but the actor's engine position owns displacement.
 clip.keyframes=old.map((f,i)=>{
  const p=copy(f);p.weaponUnwrapped=true;if(i===0||i===old.length-1)return p;
  for(const k of ['pelvis','thorax','rearShoulder','frontShoulder','rearHip','frontHip','rearFoot','frontFoot'])p[k]=mix(idle[k],f[k],.32);
  for(const k of ['pelvis','thorax','rearShoulder','frontShoulder','rearHip','frontHip'])p[k][1]+=4;
  const hands=[null,[380,145],[356,88],[420,173],[388,255]];
  p.frontHand=hands[i];p.rearHand=[[0,0],[197,180],[208,165],[218,187],[230,215]][i];
  p.frontArmPlane=i===4?-.45:.8;p.rearArmPlane=.8;
  p.weapon=[0,-95,-188,-55,-13][i];p.frontHandAngle=p.weapon;
  p.frontCloth*=.45;p.rearCloth*=.45;
  // The front shoe is already planted before the cut accelerates.
  if(i>=2){p.frontFoot[1]=idle.frontFoot[1];p.contacts=['rear','front'];}
  const solved=rig.solvePose(a,p);
  for(const side of ['rear','front'])p[side+'Hand']=solved.guide.joints[side+'_hand'];
  return p;
 });
 // Angle tracks use an authored outward lift, so the grip cannot spin backwards
 // while the blade takes its short continuous recovery arc.
 clip.keyframes.at(-1).weapon=0;clip.keyframes.at(-1).frontHandAngle=0;
 a.motionRevision=11;
}

function refineCompanions(a,rig){
 const clip=a.animation.animations.attack,idle=clip.keyframes[0];
 if(a.character_id==='damheo'||a.character_id==='sodan')for(let i=1;i<clip.keyframes.length-1;i++){
  const p=clip.keyframes[i],mage=a.character_id==='damheo';
  for(const k of ['pelvis','thorax','rearShoulder','frontShoulder','rearHip','frontHip'])p[k]=mix(idle[k],p[k],mage?.35:.55);
  // Stable caster stance; casting does not author a second world-space walk.
  p.rearFoot=copy(idle.rearFoot);p.frontFoot=copy(idle.frontFoot);p.contacts=['rear','front'];
  if(mage){p.frontHand=[null,[350,226],[345,215],[365,230],[356,245]][i];p.rearHand=[null,[236,218],[225,173],[345,165],[330,190]][i];p.weapon=[0,-10,-14,-8,-3][i];p.frontArmPlane=.8;p.rearArmPlane=.65;p.propSwing=[0,-3,-5,3,7][i];}
  else{p.frontHand=[null,[318,198],[302,163],[352,186],[328,209]][i];p.rearHand=[null,[234,225],[260,196],[332,174],[322,190]][i];p.weapon=[0,-6,-18,18,-5][i];p.frontArmPlane=.8;p.rearArmPlane=.75;}
  p.frontHandAngle=p.weapon;p.frontCloth*=.4;p.rearCloth*=.4;
  const solved=rig.solvePose(a,p);for(const side of ['rear','front'])p[side+'Hand']=solved.guide.joints[side+'_hand'];
 }
 if(a.character_id==='seol_o'){
  // Keep the target line through the follow-through: release hand travels back,
  // never toward the arrow, and bow hand cannot rotate independently of grip.
  for(const p of clip.keyframes)p.frontHandAngle=p.weapon;
  clip.keyframes[4].frontHand=copy(clip.keyframes[3].frontHand);
  clip.keyframes[4].weapon=clip.keyframes[3].weapon;
  clip.keyframes[4].frontHandAngle=clip.keyframes[3].weapon;
 }
 a.motionRevision=11;
}
