// v012 authored prop silhouettes and anatomical wrist/palm sockets.
// This overlay is deliberately separate from the preserved face/costume artwork.
const r=n=>Math.round(n*1e4)/1e4;
function path(a,id,d){const p=a.paths.find(p=>p.id===id);if(!p)throw Error(id);p.d=d;}
const offset=([x,y],d)=>d.replace(/([MLQCZ])([^MLQCZ]*)/g,(_,c,s)=>{let n=(s.match(/[-+]?(?:\d*\.)?\d+/g)||[]).map(Number);return c+n.map((v,i)=>r(v+(i%2?y:x))).join(' ');});
export function refineAnatomy(a,rig){
 if(!['seol_o','hwigyeom'].includes(a.character_id))return;
 const by=Object.fromEntries(a.rig.parts.map(p=>[p.id,p]));
 a.rig.handSockets={front:[by.front_hand.pivot[0]+1,by.front_hand.pivot[1]+8],rear:[by.rear_hand.pivot[0]+2,by.rear_hand.pivot[1]+7]};
 for(const side of ['front','rear']){
  const at=by[side+'_hand'].pivot;
  path(a,side+'_hand_shape',offset(at,'M-6 -3 Q-3 -5 2 -3 L7 2 Q10 5 8 10 L5 17 Q1 20 -4 17 L-8 11 Q-9 6 -6 -3Z'));
  path(a,side+'_thumb',offset(at,'M-5 1 Q0 -1 5 3 L7 7 Q6 10 3 9 L0 6 -4 7Z'));
  path(a,side+'_knuckles',offset(at,'M-5 10 Q0 8 6 10 M-4 14 Q0 12 4 14'));
 }
 by.weapon.pivot=[...a.rig.handSockets.front];
 if(a.character_id==='hwigyeom')sword(a,rig);else bow(a,rig);
 a.anatomyRevision=12;
}
function sword(a,rig){
 const at=a.rig.parts.find(p=>p.id==='weapon').pivot;
 // Hwando: one spine and one continuous convex cutting edge. The handle is
 // crosswise in the palm rather than an extension of the wrist silhouette.
 path(a,'hwandao_blade',offset(at,'M14 -5 Q84 -2 141 -7 Q169 -10 188 -16 L181 -5 Q148 6 112 8 Q62 10 14 7Z'));
 path(a,'blade_spine',offset(at,'M14 -5 Q84 -2 141 -7 Q169 -10 188 -16 L180 -10 Q161 -4 141 -3 Q82 2 14 -1Z'));
 path(a,'blade_edge',offset(at,'M15 6 Q64 9 112 7 Q151 5 181 -5 L188 -16'));
 path(a,'sword_grip',offset(at,'M-20 -5 Q-4 -7 13 -5 L13 6 Q-5 8 -20 5Z'));
 path(a,'sword_guard',offset(at,'M11 -15 Q18 -17 20 -12 L19 15 Q16 18 10 15Z'));
 path(a,'grip_wrap',offset(at,'M-17 -4 L-11 5 M-10 -5 L-4 6 M-3 -5 L3 6 M4 -5 L10 5'));
 const attack=a.animation.animations.attack;
 for(const clip of Object.values(a.animation.animations))for(const p of clip.keyframes)p.weapon=(p.weapon||0)+74;
 const angles=[65,-80,-100,15,72,65],hands=[null,[365,160],[360,122],[410,170],[390,246]],planes=[null,.5,0,.5,.35];
 for(let i=0;i<attack.keyframes.length;i++){
  const p=attack.keyframes[i];p.weapon=angles[i];
  if(hands[i]){p.frontHand=hands[i];p.frontArmPlane=planes[i];}
 }
 for(const clip of Object.values(a.animation.animations))for(const p of clip.keyframes){const s=rig.solvePose(a,p),e=s.guide.joints.front_forearm,w=s.guide.joints.front_hand;const forearm=Math.atan2(w[1]-e[1],w[0]-e[0])*180/Math.PI;p.frontHandAngle=forearm-90+(clip===attack?[0,18,-12,20,8,0][clip.keyframes.indexOf(p)]:8);}
}
function bow(a,rig){
 const at=a.rig.parts.find(p=>p.id==='weapon').pivot;
 // Grip-relative paired limbs; the two tips and string share this geometry.
 // Recurved tips are authored as continuous curves, not a kinked extra hook.
 path(a,'bow_body',offset(at,'M-4 -15 Q10 -36 10 -57 Q8 -77 -13 -94 Q-29 -105 -27 -111 L-17 -128 -12 -125 Q-20 -113 -20 -108 Q-18 -103 -8 -98 Q19 -78 18 -56 Q17 -33 4 -14 L4 14 Q17 33 18 56 Q19 78 -8 98 Q-18 103 -20 108 Q-20 113 -12 125 L-17 128 -27 111 Q-29 105 -13 94 Q8 77 10 57 Q10 36 -4 15Z'));
 path(a,'bow_grip',offset(at,'M-5 -16 Q0 -18 5 -15 L5 16 Q0 19 -5 16Z'));
 path(a,'bow_laminate',offset(at,'M-15 -126 L-24 -110 Q-24 -104 -10 -96 Q14 -77 14 -57 Q13 -36 2 -17 M2 17 Q13 36 14 57 Q14 77 -10 96 Q-24 104 -24 110 L-15 126'));
 path(a,'bow_wrap',offset(at,'M-4 -11 L4 -8 M-4 -5 L4 -2 M-4 2 L4 5 M-4 9 L4 12'));
 const c=a.constraints;c.bowstring.tips=[[-26,-106],[-26,106]].map(p=>p.map((v,i)=>v+at[i]));c.bowstring.restNock=[at[0]-26,at[1]];c.bowstring.drawPoint=[...a.rig.handSockets.rear];c.arrow.grip=[...at];c.bowFlex={pivot:[...at],maxSweep:28,shortening:.08};
 for(const p of a.animation.animations.attack.keyframes){
  if(p.t>0&&p.t<1){p.rearArmLayer=1;p.weapon=0;p.rearHand=[258,110];p.rearShoulder=[265,130];p.frontHand=[438,110];p.frontArmPlane=.65;p.rearArmPlane=-1;
   if(p.t>=.49){p.rearHand=[237,108];p.draw=0;p.arrow=0;}
  }
  const s=rig.solvePose(a,p);for(const side of ['front','rear']){const e=s.guide.joints[side+'_forearm'],w=s.guide.joints[side+'_hand'];p[side+'HandAngle']=Math.atan2(w[1]-e[1],w[0]-e[0])*180/Math.PI-90;}
 }
}
