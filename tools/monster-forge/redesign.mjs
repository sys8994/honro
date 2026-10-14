// 2026 catalogue revision. Replace painted planes; retain bind pivots and all clips.
// These are fictional possessed objects, not claims that guardian/funerary forms are evil.
export function redesign(a){
 if(!['ghost','shade','warden','lantern'].includes(a.id))return a;
 a.version=3;a.budget='catalog-redesign';a.palette={...a.palette,cloth:'#777969',clothLight:'#c0baa1',clothDark:'#383f39'};
 const get=id=>a.parts.find(p=>p.id===id);
 const paint=(id,rows)=>{const p=get(id);if(!p)return;p.paths=rows.map(([d,fill,stroke='ink',width=1,lod=0])=>({d,fill,stroke,width,lod}));};
 if(a.id==='ghost'||a.id==='shade'){
  const bound=a.id==='shade';
  a.brief={silhouette:bound?'접힌 수의와 한쪽으로 무너진 결박':'얼굴을 가린 머리카락, 빈 소매와 긴 맞깃 수의',identity:bound?['비대칭 어깨','두 넓은 결박','닫힌 얼굴']:['앞으로 떨어진 머리','빈 소매','넓은 삼베 옷면'],materials:['바랜 삼베','먹빛 머리','마른 매듭'],reference:'한국 수의의 맞깃과 삼베를 창작적으로 구성. 장례 문화 자체의 악함을 뜻하지 않음'};
  paint('body',[[bound?'M-10 -124 L8 -121 21 -98 25 -73 14 -48 16 -17 5 -7 -2 -18 -12 1 -18 -32 -30 -62 -28 -96Z':'M-11 -118 L9 -121 23 -100 22 -69 13 -37 16 -9 4 -18 -7 2 -13 -18 -24 -7 -20 -45 -29 -79 -23 -103Z','cloth'],['M-17 -101 L-5 -91 10 -106 13 -95 -1 -73 -4 -38 -12 -16 -15 -50 -21 -79Z','clothLight',null],['M14 -95 L22 -79 12 -47 10 -24 2 -30 5 -63Z','clothDark',null],['M-17 -107 L-5 -92 9 -108','paper',null,2]]);
  paint('head',[[bound?'M-12 -124 L1 -130 12 -123 14 -108 5 -94 -8 -100 -16 -112Z':'M-10 -127 Q7 -135 16 -120 L14 -103 6 -93 -8 -100 -17 -115Z','clothDark'],[bound?'M-13 -120 L10 -119 11 -109 -8 -108Z':'M-3 -123 L9 -119 10 -108 3 -100 -5 -108Z','boneShade'],[bound?'M-12 -114 L12 -113 6 -103 -9 -106Z':'M-14 -122 L-5 -128 -7 -109 -4 -95 -10 -83 -12 -100 -18 -91 -17 -113Z','clothDark'],[bound?'M-9 -109 L6 -106':'M2 -114 L8 -113','ink',null,1]]);
  paint('rear-sleeve',[[bound?'M-20 -99 L-39 -86 -35 -54 -24 -42 -26 -64 -16 -77Z':'M-20 -101 Q-40 -101 -45 -74 L-49 -41 -34 -50 -28 -76 -11 -87Z','clothDark'],['M-39 -73 L-43 -49 -35 -54 -31 -76Z','boneShade',null]]);
  paint('front-sleeve',[[bound?'M12 -101 L30 -90 34 -65 23 -48 16 -57 21 -78 8 -84Z':'M12 -101 L29 -95 34 -77 45 -66 42 -47 29 -52 23 -69 9 -80Z','cloth'],[bound?'M23 -71 L31 -67 24 -53 20 -58Z':'M33 -65 L43 -61 40 -51 31 -55Z','ink'],['M19 -91 L25 -82 28 -73','clothLight',null,2]]);
  if(bound){paint('bindings',[['M-27 -96 L21 -86 23 -75 -27 -86Z','boneShade'],['M-25 -63 L19 -77 19 -65 -20 -53Z','paper'],['M-24 -91 L19 -81 M-20 -58 L16 -70',null,'woodDark',1,1]]);paint('knot',[['M12 -68 L23 -75 28 -70 23 -63 17 -63 29 -35 20 -42 11 -61 1 -49 -4 -54 6 -65Z','redDark'],['M14 -65 L22 -41',null,'red',1,1]]);}
 }
 if(a.id==='warden'){
  a.brief={silhouette:'긴 목주 얼굴과 낮은 관모, 한쪽으로 뻗은 부러진 가지',identity:['길게 돌출한 코','수직 조각면','넓은 금줄'],materials:['깎은 목재','바랜 삼베','그을음'],reference:'한국 장승의 수호·경계 역할과 목주 조각 구조를 참고한 들린 장승. 장승 본래를 악으로 묘사하지 않음'};
  paint('trunk',[['M-24 -14 L-28 -65 -24 -109 -26 -144 -17 -158 9 -160 25 -145 25 -108 20 -73 27 -22 18 -10 1 -14 -11 -9Z','wood'],['M-21 -139 L-12 -151 -9 -99 -15 -63 -10 -14 -21 -18 -23 -66Z','woodLight',null],['M11 -151 L22 -139 18 -104 21 -77 17 -50 22 -22 11 -17 8 -61 12 -101Z','woodDark',null],['M-3 -71 L-7 -50 -2 -35 -4 -18',null,'woodDark',1.5,1]]);
  paint('face',[['M-22 -137 L-11 -147 10 -147 22 -135 20 -107 13 -91 -5 -87 -20 -102Z','woodLight'],['M-20 -130 L-10 -133 -2 -126 4 -126 14 -134 21 -131 17 -122 7 -119 -8 -120 -19 -123Z','woodDark',null],['M-17 -125 L-8 -123 M9 -123 L17 -126',null,'bone',1.5],['M-5 -134 L3 -134 5 -114 13 -109 10 -103 -8 -103 -11 -110 -5 -115Z','wood'],['M-16 -102 L-4 -103 12 -103 14 -95 -1 -96 -14 -95Z','ink'],['M-12 -101 L10 -101 10 -98 -11 -98Z','boneShade',null]]);
  paint('crown',[['M-27 -140 L-26 -153 -20 -154 -20 -166 17 -166 21 -155 27 -151 27 -140 10 -143 -9 -141Z','woodDark'],['M-18 -162 L14 -162 17 -153 -19 -152Z','wood'],['M-24 -146 L22 -146',null,'woodLight',1.5]]);
  paint('rope',[['M-27 -82 Q0 -70 26 -83',null,'ink',6],['M-27 -82 Q0 -70 26 -83',null,'boneShade',3.5],['M-3 -79 L4 -80 8 -73 1 -69 -5 -73Z','redDark']]);
  for(const [i,x] of [-18,-5,10].entries())paint('paper-'+i,[[`M${x} -75 L${x+9} -74 ${x+7} -48 ${x+2} -44 ${x-1} -49Z`,'paper'],[`M${x+3} -68 L${x+6} -65 ${x+3} -56`,null,'redDark',1,1]]);
  paint('moss',[['M-23 -56 L-13 -58 -16 -48 -22 -42Z','shadow',null]]);
 }
 if(a.id==='lantern'){
  a.brief={silhouette:'기울어진 사각 초롱과 비어 있는 찢긴 창',identity:['나무 상하테','비대칭 한지 창','가늘게 솟는 혼불'],materials:['바랜 한지','그을린 나무','금속 고리'],reference:'한국 초롱의 틀·한지 구조를 참고한 창작. 얼굴 표정을 없애 사물의 불길함으로 표현'};
  paint('handle',[['M-16 -106 L-17 -120 Q-16 -132 0 -132 Q17 -132 17 -119 L16 -106',null,'ink',4],['M-16 -106 L-17 -120 Q-16 -132 0 -132 Q17 -132 17 -119 L16 -106',null,'metal',2]]);
  paint('shell',[['M-28 -106 L22 -110 32 -98 28 -46 -19 -38 -33 -49Z','woodDark'],['M-26 -101 L-11 -102 -10 -48 -24 -45 -29 -51Z','boneShade'],['M-8 -103 L20 -106 25 -98 22 -50 -7 -45 -4 -65 -11 -77 -2 -88Z','paper'],['M-1 -97 L13 -100 10 -86 18 -78 13 -57 -4 -51 1 -68 -7 -78Z','ink',null]]);
  paint('flame',[['M2 -54 Q-9 -62 -3 -74 Q6 -83 4 -94 Q17 -82 9 -72 Q20 -59 2 -54Z','soul'],['M3 -58 Q-1 -66 5 -76 Q3 -65 8 -62Z','hot',null]]);
  paint('frame',[['M-29 -107 L22 -111 33 -100 30 -95 -27 -101Z','wood'],['M-29 -51 L27 -56 29 -45 -18 -37 -31 -45Z','wood'],['M-28 -100 L-26 -49 M23 -104 L23 -51 M-10 -102 L-8 -46',null,'ink',3],['M-27 -100 L-25 -50 M24 -102 L24 -52',null,'woodLight',1]]);
  paint('knot',[['M-2 -39 L3 -36 9 -37 11 -31 4 -29 -1 -34 -9 -30 -13 -35 -9 -39Z','redDark']]);
  paint('seal',[['M-24 -99 L-17 -100 -15 -78 -21 -73 -24 -79Z','boneShade'],['M-21 -94 L-19 -89 -21 -82',null,'redDark',1,1]]);
 }
 return a;
}
