// Role-specific structural planes. All original joints and clip keys are retained.
export function actorDepth(a){
 const p=id=>a.parts.find(p=>p.id===id),add=(id,d,fill,stroke=null,width=.8,lod=0)=>p(id).paths.push({d,fill,stroke,width,lod});
 if(a.id==='summon_eater')return a;
 if(!['summon_stalker','summon_charger','summon_warden','summon_eater','summon_echo','bier_boss'].includes(a.id))return a;
 a.version=4;
 if(a.id==='summon_stalker'){
  // A narrow visible cheek and recessed eye break the blank hood symbol.
  p('head').paths[1].d='M-7 -108 L3 -111 8 -105 6 -98 1 -90 -4 -96Z';p('head').paths[1].fill='skinShade';
  add('head','M-5 -104 L1 -102 5 -105 M1 -99 L3 -96',null,'deep',1.4);
  add('front-arm','M22 -37 L24 -29 23 -23',null,'linen',1.1);
  p('body').paths[1].d='M-14 -91 L-3 -89 13 -72 4 -57 -6 -43 -3 -25 -13 -10 -15 -38 -13 -59 -21 -78Z';
 }else if(a.id==='summon_charger'){
  // Shoulder compression and a bent forearm carry the mallet's weight.
  p('body').paths[1].d='M-17 -89 Q-4 -88 7 -65 L2 -40 -6 -17 -10 -41 -21 -63Z';
  p('front-arm').paths[0].d='M18 -88 Q34 -87 40 -63 L37 -42 26 -37 22 -45 28 -53 25 -65 16 -68Z';
  add('front-arm','M30 -61 L35 -56 32 -48',null,'linenShade',1.5);
  add('head','M2 -98 L5 -95 3 -91',null,'deep',1.2);
 }else if(a.id==='summon_warden'){
  add('body','M-5 -91 L2 -83 -2 -66 3 -45 -2 -18 -7 -22 -5 -47 -9 -68Z','deep');
  add('head','M-17 -103 L-12 -101 -13 -94 -8 -89 M12 -102 L16 -104 14 -94 9 -90',null,'woodLight',1.6);
  add('mantle','M-34 -72 L-31 -66 -35 -61 M31 -66 L35 -63 37 -57',null,'linenShade',1.6);
 }else if(a.id==='summon_echo'){
  // Jaw and neck, carried through two displaced folds rather than blank paper.
  add('head','M-5 -129 L3 -132 8 -125 6 -116 1 -109 -4 -116Z','skinShade');
  add('head','M-4 -123 L2 -121 6 -124 M0 -116 L3 -114',null,'deep',1.3);
  add('body','M-8 -102 L-2 -93 5 -102 7 -95 0 -85 -7 -91Z','skin');
  add('body','M-8 -75 Q-3 -67 -7 -53 L-5 -35 -10 -26 -14 -47Z','deep');
  add('left-paper','M-45 -51 L-37 -49 -38 -38 -43 -29 -42 -40 -48 -35Z','skinShade','ink');
  add('right-paper','M38 -36 L47 -38 48 -27 43 -16 43 -27 38 -20Z','skinShade','ink');
 }else{
  Object.assign(a.palette,{wood:'#634330',woodLight:'#9d7d56',linen:'#b2a284',linenShade:'#7b6d59'});
  // Real mortise rails, deep sill and cloth bending over the beam.
  add('box','M-43 -26 L39 -26 48 -22 37 -18 -42 -18Z','wood','ink');
  add('roof','M-48 -64 L-29 -68 29 -68 48 -64 40 -60 -39 -60Z','deep');
  add('cloth','M-49 -55 Q-38 -60 -29 -55 M29 -55 Q39 -60 49 -55',null,'linen',2);
  add('poles','M-62 -11 L-61 -4 M60 -11 L61 -4',null,'deep',2);
 }
 return a;
}
