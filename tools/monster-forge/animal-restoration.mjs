// Review candidate: retain the pre-redesign anatomy, pivots and animation.
// Reference Library transfer failed in this executor; no claimed image inspection.
export function restoreAnimal(a){
 if(!['hound','boar'].includes(a.id))return a;
 a.version=4;a.budget='catalog-redesign';
 const get=id=>a.parts.find(p=>p.id===id);
 const add=(id,d,fill,stroke=null,width=.8,lod=0)=>get(id).paths.push({d,fill,stroke,width,lod});
 a.palette={...a.palette};
 a.brief={...a.brief,reference:'3899a2f anatomy restored and reinforced. Korean reference metadata supplied; Library image transfer blocked, pixel reference review pending.'};
 if(a.id==='hound'){
  Object.assign(a.palette,{deep:'#171c1c',shadow:'#292d2b',fur:'#474941',light:'#8c8974',bone:'#dfd1ad',boneShade:'#9e9277',soul:'#b8bc91'});
  // Tight abdomen rises behind the ribs; back and long hock contours survive.
  get('body').paths[0].d='M-51 -57 Q-55 -74 -42 -84 L-34 -90 -33 -85 -24 -93 -20 -87 -11 -94 -8 -89 1 -96 4 -91 Q19 -96 31 -84 L41 -69 31 -45 Q20 -37 5 -43 L-9 -53 Q-23 -58 -35 -41 L-48 -46Z';
  get('body').paths[2].fill='shadow';
  add('body','M-29 -61 Q-16 -71 3 -73 Q-4 -62 -7 -54 L-19 -57 -29 -49Z','boneShade');
  add('body','M-29 -74 Q-22 -69 -23 -59 M-20 -77 Q-12 -72 -14 -58 M-10 -79 Q-2 -73 -4 -60 M0 -80 Q8 -74 6 -61',null,'deep',1.65);
  add('body','M17 -83 Q29 -82 29 -69 L24 -55 19 -48 21 -64 14 -70Z','light');
  add('body','M18 -79 Q25 -76 23 -67',null,'boneShade',1.2);
  // Occiput to sternum: two tensile planes rather than decorative scratching.
  get('neck').paths[1].d='M28 -91 L34 -96 37 -87 43 -82 37 -70 30 -60 32 -73 27 -77Z';
  add('neck','M35 -88 Q39 -79 32 -65 M28 -85 L30 -77 27 -69',null,'deep',1.8);
  // Torn ear, cheek arch, hollow temple, exposed mandibular hinge.
  get('head').paths[0].d='M29 -96 L25 -119 30 -117 32 -111 33 -115 39 -102 45 -106 54 -121 54 -112 50 -109 53 -106 51 -102 55 -99 Q62 -97 65 -89 L77 -84 78 -77 66 -73 56 -74 52 -68 40 -73 32 -84Z';
  add('head','M38 -93 L44 -94 43 -86 48 -81 56 -83 52 -77 44 -76 38 -83Z','boneShade');
  add('head','M38 -85 L44 -81 43 -76 39 -74 36 -79Z','deep');
  add('head','M45 -81 L52 -79 58 -83',null,'bone',1.1);
  get('jaw').paths[1].d='M54 -77 L57 -76 55 -71Z M63 -76 L65 -76 64 -74Z M70 -77 L72 -77 70 -73Z';
  add('jaw','M44 -77 Q39 -71 48 -70 L56 -68 66 -70',null,'boneShade',1.6);
  // The old paper charm is not the creature's identity; retain rig slot only.
  get('collar').paths=[];
  add('fore-near','M24 -34 L25 -21 25 -9 M25 -4 L25 0 M31 -3 L32 0',null,'deep',1.1);
  add('hind-near','M-34 -31 L-29 -22 -34 -10',null,'deep',1.25);
  a.brief.identity=['뼈빛 광대와 검은 안와','꺼진 복부와 갈비 굴곡','찢긴 귀와 긴 힘줄 다리'];
 }else{
  Object.assign(a.palette,{deep:'#22201f',shadow:'#39332d',woodDark:'#3c3029',wood:'#735943',woodLight:'#ad906b',bone:'#e4d3a7',boneShade:'#99836a',soul:'#c1bb92'});
  // Keep the original high shoulder, bristled outline and long ivory hooks.
  add('body','M7 -101 Q30 -106 37 -85 L34 -70 29 -55 21 -47 25 -68 22 -84Z','woodDark');
  add('body','M10 -96 Q22 -99 27 -88 L28 -73 23 -60',null,'woodLight',2);
  add('body','M-39 -84 L-34 -87 -30 -81 M-23 -93 L-19 -97 -13 -89 M-6 -103 L-3 -107 3 -98',null,'boneShade',1,1);
  // Interlocking cheek/jowl folds follow the jaw and the loaded scapula.
  add('head','M33 -80 Q39 -77 40 -65 L45 -55 53 -51 49 -46 39 -51 33 -64Z','woodDark');
  add('head','M40 -78 Q43 -68 47 -64 L57 -60 M42 -62 Q48 -58 50 -54',null,'boneShade',1.5);
  add('head','M45 -78 L54 -81 59 -77 57 -75 48 -75Z','woodDark');
  add('head','M57 -54 L64 -52 68 -46 64 -41 58 -43 54 -49Z','redDark');
  add('tusks','M60 -49 L65 -48 68 -42 65 -39 62 -43Z','boneShade');
  add('tusks','M68 -37 Q76 -31 81 -42',null,'bone',1.2);
  for(const [id,x] of [['hind-near',-35],['fore-near',26]]){
   add(id,`M${x-11} -7 L${x-2} -6 ${x-3} 0 ${x-12} 0Z M${x} -6 L${x+6} -6 ${x+9} 0 ${x} 0Z`,'deep');
   add(id,`M${x-9} -6 L${x-4} -5 M${x+1} -5 L${x+5} -4`,null,'boneShade',.8);
  }
  get('seal').paths=[];
  a.brief.identity=['높은 어깨와 거친 등갈기','긴 밝은 엄니와 뿌리','겹친 목가죽과 하중 받는 갈라진 발굽'];
 }
 return a;
}
