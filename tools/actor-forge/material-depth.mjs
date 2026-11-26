// Role-specific structural planes. All original joints and clip keys are retained.
export function actorDepth(a){
 const p=id=>a.parts.find(p=>p.id===id),add=(id,d,fill,stroke=null,width=.8,lod=0)=>p(id).paths.push({d,fill,stroke,width,lod});
 if(a.id==='summon_eater')return a;
 if(!['summon_stalker','summon_charger','summon_warden','summon_eater','summon_echo','bier_boss','colossus'].includes(a.id))return a;
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
 }else if(a.id==='colossus'){
  colossusConstruction(a,add);
 }else{
  Object.assign(a.palette,{wood:'#634330',woodLight:'#9d7d56',linen:'#b2a284',linenShade:'#7b6d59'});
  // Real mortise rails, deep sill and cloth bending over the beam.
  add('box','M-43 -26 L39 -26 48 -22 37 -18 -42 -18Z','wood','ink');
  add('roof','M-48 -64 L-29 -68 29 -68 48 -64 40 -60 -39 -60Z','deep');
  add('cloth','M-49 -55 Q-38 -60 -29 -55 M29 -55 Q39 -60 49 -55',null,'linen',2);
  add('poles','M-62 -11 L-61 -4 M60 -11 L61 -4',null,'deep',2);
  bierConstruction(a,add);
 }
 return a;
}

// Stage 8's empty interior is its visual tell. Keep the black cavity clear;
// detail belongs on the construction surrounding it, never floating inside it.
function bierConstruction(a,add){
 add('poles','M-94 -9 L-87 -10 -72 -9 -61 -10 -50 -9 -38 -10 -27 -10 -9 -9 1 -10 13 -9 22 -10 37 -9 43 -10 61 -9 70 -10 90 -9 93 -7 71 -7 58 -8 45 -7 28 -8 16 -7 1 -8 -11 -7 -28 -8 -38 -7 -52 -8 -64 -7 -78 -8 -92 -7Z','woodLight');
 add('poles','M-93 -6 L-81 -6 -78 -5 -67 -5 -65 -6 -51 -6 -46 -5 -27 -6 -23 -5 -10 -6 8 -5 21 -6 27 -5 44 -6 51 -5 65 -6 72 -5 91 -6 87 -4 74 -4 65 -5 52 -4 35 -4 22 -5 8 -4 -19 -4 -31 -5 -47 -4 -63 -4 -81 -5 -90 -4Z','deep');
 for(const [x,y,w] of [[-70,-12,4],[-58,-12,5],[55,-12,5],[67,-12,3]]){
  add('poles',`M${x} ${y} L${x+w} ${y+1} ${x+w-1} ${y+4} ${x+w+1} ${y+6} ${x+w} ${y+9} ${x-1} ${y+8} ${x} ${y+5} ${x-2} ${y+3}Z`,'linenShade','deep',.5);
 }
 add('box','M-61 -25 L-51 -23 -40 -23 -33 -24 -21 -23 -9 -24 3 -23 15 -24 23 -23 38 -24 50 -23 60 -25 56 -21 50 -19 -49 -19 -58 -22Z','woodLight');
 add('box','M-57 -20 L-47 -18 47 -18 55 -20 52 -16 37 -14 20 -15 17 -14 -17 -14 -29 -15 -48 -14 -54 -16Z','wood');
 add('box','M-46 -22 L-41 -22 -37 -21 -29 -22 -19 -21 -13 -22 -1 -21 8 -22 18 -21 24 -22 33 -21 46 -22 39 -20 -38 -20Z','linenShade');
 add('box','M-31 -17 L-24 -16 -18 -17 -9 -16 M-3 -16 L3 -17 11 -16 19 -17 M26 -17 L30 -16 36 -17 43 -16',null,'deep',.8);
 add('box','M-52 -57 L-47 -57 -46 -51 -48 -47 -46 -42 -47 -33 -46 -25 -48 -22 -52 -24 -50 -33 -51 -42 -50 -50Z M47 -57 L51 -57 50 -49 52 -45 51 -37 52 -27 49 -22 47 -24 48 -33 47 -41 48 -49Z','woodLight');
 add('box','M-56 -56 L-51 -56 -50 -53 -52 -51 -57 -51 -57 -54Z M50 -56 L56 -56 58 -53 55 -50 50 -51 49 -54Z M-56 -28 L-52 -30 -47 -27 -49 -23 -55 -22 -57 -25Z M47 -28 L52 -30 57 -27 56 -24 51 -22 48 -24Z','metal','deep',.6);
 add('cloth','M-49 -54 Q-43 -49 -43 -43 Q-43 -37 -46 -30 Q-47 -24 -43 -18 L-46 -13 Q-52 -18 -51 -25 Q-49 -35 -49 -43 L-51 -50Z M-38 -53 Q-36 -48 -38 -41 Q-42 -33 -39 -28 L-34 -18 -33 -12 -37 -11 -40 -19 Q-44 -26 -43 -33 Q-40 -42 -40 -47Z M-32 -53 L-27 -52 -29 -46 Q-30 -41 -28 -34 L-30 -30 -32 -34 Q-34 -43 -32 -49Z','wood');
 add('cloth','M27 -53 Q30 -48 33 -46 L34 -40 Q32 -34 36 -26 L33 -17 34 -12 30 -17 Q28 -27 30 -31 Q31 -38 29 -42 L25 -50Z M42 -54 L47 -54 Q47 -47 45 -43 Q43 -38 46 -32 L48 -25 46 -18 43 -17 44 -23 Q40 -30 41 -36 L43 -44Z M50 -54 L52 -50 51 -43 Q49 -37 52 -29 L52 -23 50 -21 Q46 -30 48 -37 L48 -47Z','wood');
 add('cloth','M-47 -51 L-43 -48 -46 -41 -46 -34 -47 -31 Q-49 -39 -48 -46Z M-38 -36 Q-40 -29 -37 -24 L-34 -17 -36 -17 -38 -23 Q-42 -30 -38 -36Z M32 -48 Q34 -44 35 -39 L34 -34 Q34 -28 37 -25 L35 -21 Q32 -28 32 -35Z M41 -29 Q41 -24 44 -18 L44 -15 41 -18 Q39 -21 39 -26Z M47 -49 L48 -46 46 -41 46 -37 44 -38 44 -43Z','linenShade');
 add('cloth','M-50 -10 L-49 -14 -47 -12 -46 -16 -44 -15 M-41 -15 L-40 -19 -38 -15 -36 -14 -34 -10 M-34 -9 L-32 -12 -30 -14 -29 -17 -25 -17 M34 -7 L35 -11 37 -11 37 -14 39 -12 M43 -17 L44 -20 46 -16 49 -15 50 -10',null,'linen',.68);
 add('cloth','M-47 -54 Q-42 -56 -39 -53 M-36 -52 Q-32 -54 -28 -52 M28 -52 Q31 -54 35 -51 M39 -51 Q44 -55 49 -52',null,'linen',1.2);
 // The short cover is a timber ridge with laid-and-overlapped cloth panels,
 // not a temple roof. Broad alternating planes taper from ridge to eave.
 add('roof','M-65 -66 L-54 -71 -42 -81 -32 -88 -15 -92 -8 -92 0 -98 8 -92 20 -91 35 -87 47 -77 57 -70 67 -65 59 -63 51 -66 36 -78 28 -84 15 -88 7 -88 1 -93 -6 -89 -17 -88 -29 -84 -42 -74 -55 -65Z','woodLight');
 const bands=[
  [[-33,-85],[-25,-87],[-44,-68],[-55,-67],[8,12,11,12]],
  [[-23,-87],[-17,-89],[-32,-68],[-42,-67],[6,16,12,13]],
  [[-15,-89],[-8,-90],[-19,-68],[-29,-68],[7,14,11,12]],
  [[-6,-90],[0,-94],[-6,-69],[-17,-68],[7,11,13,11]],
  [[2,-93],[8,-89],[6,-69],[-4,-69],[8,14,11,12]],
  [[10,-89],[17,-88],[19,-69],[8,-68],[9,16,15,9]],
  [[19,-88],[25,-86],[32,-67],[21,-69],[4,10,13,11]],
  [[27,-86],[34,-84],[45,-67],[34,-67],[6,12,15,12]],
  [[36,-82],[43,-78],[56,-67],[47,-66],[8,14,9,10]]
 ];
 // Asymmetric breakpoints are the overlaps of the cloth strips.
 for(const [i,[tl,tr,br,bl,breaks]] of bands.entries()){
  const v=(p,q,n)=>[Math.round((p[0]*(20-n)+q[0]*n)/2)/10,Math.round((p[1]*(20-n)+q[1]*n)/2)/10];
  const m0=v(tl,bl,breaks[0]),m1=v(tr,br,breaks[1]),n1=v(tr,br,breaks[2]),n0=v(tl,bl,breaks[3]),p0=v(tl,bl,16),p1=v(tr,br,17);
  add('roof',`M${tl.join(' ')} L${tr.join(' ')} ${m1.join(' ')} ${m0.join(' ')}Z`,i%3===1?'woodLight':'linenShade');
  add('roof',`M${m0.join(' ')} L${m1.join(' ')} ${n1.join(' ')} ${p1.join(' ')} ${p0.join(' ')}Z`,i%3===2?'wood':'linen');
  add('roof',`M${p0.join(' ')} L${p1.join(' ')} ${br.join(' ')} ${bl.join(' ')} ${n0.join(' ')}Z`,i%3===0?'woodLight':'linenShade');
 }
 add('roof','M-62 -64 L-52 -64 -41 -65 -34 -64 -22 -65 -10 -64 2 -65 11 -65 23 -64 35 -64 50 -64 61 -63 65 -62 59 -60 -59 -59 -64 -61Z','wood');
 for(const [x,w] of [[-56,7],[-45,8],[-33,8],[-20,9],[-7,8],[6,9],[19,8],[32,7],[43,7],[54,5]]){
  add('roof',`M${x} -64 L${x+w} -64 ${x+w-1} -62 ${x+w-2} -60 ${x+1} -60 ${x-1} -62Z`,'woodLight');
 }
 add('roof','M-58 -59 L-48 -59 -41 -60 -32 -59 -23 -60 -16 -59 -5 -59 3 -60 13 -59 24 -60 31 -59 44 -60 56 -59 58 -58 -60 -58Z','deep');
}
function colossusConstruction(a,add){
 a.brief.materials=['무거운 목판','오래된 먹색 철물','낡은 삼베 봉인'];
 add('roots','M-34 -56 L-28 -57 -27 -45 -34 -32 -34 -23 -42 -17 -39 -31 -41 -35Z M-23 -42 L-17 -37 -19 -26 -20 -18 -28 -10 -26 -19 -25 -30Z M3 -49 L12 -51 17 -39 16 -29 21 -18 12 -12 7 -20 10 -31Z M24 -56 L29 -57 30 -44 36 -31 34 -23 44 -10 33 -15 29 -28 24 -36Z','woodLight');
 add('roots','M-47 -17 L-48 -21 -42 -29 M-13 -25 L-11 -17 -9 -10 M10 -18 L6 -11 5 -3 M28 -22 L35 -15 38 -10',null,'deep',1.5);
 add('body','M-31 -149 L-21 -153 -19 -142 -25 -123 -24 -107 -21 -90 -25 -75 -21 -57 -28 -51 -32 -66 -32 -85 -36 -109 -33 -132Z M25 -157 L32 -152 33 -136 39 -126 35 -109 39 -91 33 -74 31 -61 24 -52 22 -60 24 -79 27 -100 22 -118 26 -135Z','woodLight');
 add('body','M-49 -137 L-37 -145 -38 -127 -44 -117 -43 -100 -50 -105 -60 -115 -56 -126Z M38 -153 L50 -147 58 -134 58 -123 50 -116 43 -123 47 -136Z','deep');
 add('body','M-43 -132 L-40 -128 -45 -120 -45 -111 M47 -141 L50 -134 49 -129 53 -124 M-11 -143 L-7 -136 -9 -121 -5 -114 -8 -103 M9 -110 L12 -100 10 -91 15 -88 13 -78 12 -70 M-10 -94 L-15 -85 -12 -79 -15 -64',null,'shade',2.2);
 add('head','M-21 -223 L-14 -226 -11 -222 -4 -222 -7 -214 -14 -218 -17 -214 -20 -209Z M12 -222 L19 -225 21 -219 20 -214 15 -211 11 -215Z M-16 -193 L-9 -189 -9 -184 -4 -182 -4 -176 -11 -179 -16 -187Z M11 -195 L19 -202 20 -197 17 -190 14 -186 11 -188Z','wood');
 add('head','M-26 -242 L-26 -246 -19 -249 -14 -248 -17 -243 -13 -240 -20 -239Z M0 -254 L5 -256 12 -254 15 -248 23 -245 24 -240 18 -239 15 -243 7 -247 4 -250Z','woodLight');
 add('head','M-16 -191 L-14 -197 -16 -201 M13 -224 L10 -219 13 -215 M-10 -215 L-7 -217 -4 -216 M4 -194 L5 -190 3 -188',null,'deep',1.4);
 add('left-arm','M-68 -157 L-61 -143 -56 -142 -54 -136 -57 -131 -63 -138 -67 -145 -71 -151Z M-93 -202 L-88 -200 -83 -196 -85 -192 -91 -194 -95 -197 -100 -194 -101 -197Z','woodLight');
 add('left-arm','M-108 -185 L-100 -187 -94 -185 -88 -187 -85 -183 -94 -181 -106 -181Z M-81 -188 L-76 -191 -70 -188 -67 -184 -73 -182 -78 -185Z','deep');
 add('right-arm','M39 -143 L48 -143 52 -135 54 -123 51 -114 45 -122 44 -133Z M58 -101 L63 -98 67 -92 72 -91 70 -85 64 -87 60 -93Z','woodLight');
 add('right-arm','M72 -36 L100 -43 105 -40 103 -33 99 -29 95 -30 92 -26 80 -24 76 -21 73 -26Z','shade');
 add('right-arm','M72 -31 L81 -34 87 -35 89 -32 96 -35 104 -36 M79 -26 L85 -27 90 -32 M72 -80 L75 -82 76 -86',null,'metalLight',1.3);
}
