// v012 readability pass (2026-11). Runs last in createParty.
// At play scale (~110-150 px tall) the four companions lost their silhouette
// against mid-value backgrounds (green 1막 hills, dark caves, blue coast) and
// sat in a different rendering language from the outlined monsters. This pass
// keeps every anchor, joint, height and face shape; it only:
//  1. outlines the silhouette-defining fills (body, limbs, face, props); the
//     already-dark hair/hat and boots stay unstroked so the painted crown and
//     sole (height and ground contact contracts) do not move,
//  2. lifts the value separation of each costume's light/shade planes,
//  3. enlarges the hands slightly around their pivots so grips read.
const OUTLINE=/^(?:rear_|front_)?(?:trouser|trouser_lower|leg|lower_leg|coat_tail|coat|sleeve|forearm|hand_shape)$|^(?:torso|torso_outer|robe_back|robe_skirt|robe_outer_back|robe_outer_front|face_plane|quiver_body|scabbard|staff|gourd_large|hand_bell|bow_body)$/;
export const INK={seol_o:'#141a16',damheo:'#151614',hwigyeom:'#101419',sodan:'#2a2433'};
const WIDTH={seol_o:3.2,damheo:3.2,hwigyeom:3.2,sodan:2.8};
// Costume value lifts: brighter light planes, clearer base, deeper shade.
export const PALETTE={
 seol_o:{pine:'#3d4d3c',olive:'#5a5b48',clothLight:'#6d7a5c',clothShade:'#253025',hemp:'#cfc3a8'},
 damheo:{charcoal:'#3b3c37',ash:'#5d5d55',clothLight:'#80806f',clothShade:'#33352f',paper:'#cbc3b4'},
 hwigyeom:{navy:'#2f3b4a',iron:'#4f5450',clothLight:'#5c6875',clothShade:'#1d2530',jade:'#ccc8b6'},
 sodan:{indigo:'#8f7aa3',clothShade:'#ab9abd'}
};
const HAND=1.18;
function scalePath(d,[cx,cy],k){
 let i=0;return d.replace(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi,v=>{const n=+v,out=(i++%2===0)?cx+(n-cx)*k:cy+(n-cy)*k;return String(Math.round(out*100)/100);});
}
export function refineReadability(a){
 const id=a.character_id;
 Object.assign(a.palette,PALETTE[id]||{},{outline:INK[id]||'#141618'});
 for(const p of a.paths){
  if(p.fill&&!p.stroke&&OUTLINE.test(p.id)){p.stroke='outline';p.strokeWidth=WIDTH[id]||3;}
 }
 for(const side of ['rear','front']){
  const part=a.rig.parts.find(p=>p.id===side+'_hand');if(!part)continue;
  for(const p of a.paths)if(p.part===part.id)p.d=scalePath(p.d,part.pivot,HAND);
 }
 a.readabilityRevision=1;
}
