// Body-only v009 retarget. The v008 heads, hands and held implements are rigid
// cutouts; longer limbs are authored once, never scaled by the game unit height.
export const PROPORTIONS={
 seol_o:{height:1.20,width:1.05},
 damheo:{height:1.12,width:1.03},
 hwigyeom:{height:1.26,width:1.30},
 sodan:{height:1.12,width:1.00},
};
const round=n=>Math.round(n*10000)/10000;
export function mapPath(d,map){return d.replace(/([MLQCZ])([^MLQCZ]*)/gi,(_,cmd,args)=>{const ns=(args.match(/[-+]?(?:\d*\.)?\d+/g)||[]).map(Number),out=[];for(let i=0;i<ns.length;i+=2)out.push(...map([ns[i],ns[i+1]]).map(round));return cmd+out.join(' ');});}
export function refineProportions(a,api){
 const spec=PROPORTIONS[a.character_id],old=structuredClone(a),by=Object.fromEntries(old.rig.parts.map(p=>[p.id,p])),floor=by.front_foot.pivot[1];
 const body=([x,y])=>[240+(x-240)*spec.width,floor+(y-floor)*spec.height];
 const headShift=body(by.head.pivot)[1]-by.head.pivot[1],head=([x,y])=>[x,y+headShift];
 const translateAt=origin=>{const next=body(origin);return ([x,y])=>[x+next[0]-origin[0],y+next[1]-origin[1]];};
 const maps={root:p=>p,head,hair_tail:head,spirit:p=>p,qi:p=>p};
 for(const side of ['rear','front'])for(const part of ['hand','foot'])maps[side+'_'+part]=translateAt(by[side+'_'+part].pivot);
 maps.weapon=a.character_id==='damheo'?([x,y])=>[x+body(by.front_hand.pivot)[0]-by.front_hand.pivot[0],body([x,y])[1]]:translateAt(by.front_hand.pivot);
 for(const p of a.paths){
  let map=maps[p.part]||body;
  // A broader swordsman needs a matching grip and boot width. Keep the soles
  // and grip pivots fixed; extend only the blade beyond the existing guard.
  if(a.character_id==='hwigyeom'){
   if(/_(hand|foot)$/.test(p.part)){
    const pivot=by[p.part].pivot,base=map,isHand=p.part.endsWith('_hand');
    map=([x,y])=>base([pivot[0]+(x-pivot[0])*(isHand?1.10:1.12),isHand?pivot[1]+(y-pivot[1])*1.10:y]);
   }else if(['hwandao_blade','blade_spine','blade_edge'].includes(p.id))map=([x,y])=>maps.weapon([324+(x-324)*1.12,306+(y-306)*1.12]);
  }
  p.d=mapPath(p.d,map);
 }
 for(const p of a.rig.parts)p.pivot=(maps[p.id]||body)(p.pivot).map(round);
 a.rig.bindThorax=body([240,185]).map(round);
 for(const [key,point]of Object.entries(a.face.landmarks))a.face.landmarks[key]=head(point).map(round);
 a.face.authoringMap.to=head(a.face.authoringMap.to).map(round);
 if(a.constraints.bowstring){const b=a.constraints.bowstring;b.tips=b.tips.map(maps.weapon);b.restNock=maps.weapon(b.restNock);b.drawPoint=maps.rear_hand(b.drawPoint);a.constraints.arrow.grip=maps.weapon(a.constraints.arrow.grip);}
 // Complete the old sparse frames before retargeting, so unspecified hands and
 // planted feet do not silently fall back to unrelated new bind coordinates.
 for(const [name,clip]of Object.entries(a.animation.animations))clip.keyframes=old.animation.animations[name].keyframes.map(frame=>{
  const p=api.completePose(old,frame);
  for(const [key,value]of Object.entries(p))if(Array.isArray(value)&&value.length===2&&value.every(Number.isFinite))p[key]=body(value).map(round);
  const solved=api.solvePose(a,p);
  for(const side of ['rear','front'])for(const [control,joint]of [['Hand','_hand'],['Foot','_foot']])p[side+control]=solved.guide.joints[side+joint].map(round);
  return p;
 });
 a.version=9;a.asset_id=a.character_id+'.v009';
 // visualHeight is the original renderer calibration: changing it would shrink
 // the preserved head and cancel the requested increase in on-screen height.
 a.proportions={...spec,headTranslation:[0,round(headShift)],baselineVersion:8};
 a.canvas.presentationHeight=a.canvas.visualHeight-headShift;
}
