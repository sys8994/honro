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
  // Preserve the rooted timber, branch reach, seals and bind hierarchy. Cut
  // planes turn into sockets/nose/mouth; splitting follows the grain of one log.
  a.brief={silhouette:'갈라진 관모 아래 긴 목주와 한쪽으로 뻗은 가지',identity:['깊이 파낸 안와와 쐐기 코','입홈 안쪽 절삭면','심재를 따라 벌어진 목재'],materials:['도끼로 깎은 목재','바랜 삼베','그을린 심재'],reference:'국립민속박물관 장승동산·순창 추령장승촌 사진 출처 조사. 본래 마을 수호의 의미와 게임의 들림은 구별. 접근 제한으로 원본 사진 픽셀 관찰은 미완료.'};
  paint('trunk',[
   ['M-24 -14 L-28 -65 -24 -109 -26 -144 -17 -158 9 -160 25 -145 25 -108 20 -73 27 -22 18 -10 1 -14 -11 -9Z','wood'],
   ['M-21 -139 L-12 -151 -9 -102 Q-17 -74 -15 -62 L-10 -14 -21 -18 -23 -66Z','woodLight',null],
   ['M11 -151 L22 -139 18 -104 21 -77 17 -50 22 -22 11 -17 8 -61 12 -101Z','woodDark',null],
   ['M-5 -83 L1 -78 -3 -63 2 -51 -2 -31 -7 -17 -6 -42 -10 -56 -6 -68Z','ink',null],
   ['M-7 -64 L-4 -56 -4 -43 -7 -29 -9 -25 -8 -45 -11 -53Z','wood',null],
   ['M-20 -42 Q-18 -34 -17 -22 M15 -64 L12 -56 14 -49',null,'woodLight',.8,1]
  ]);
  paint('face',[
   ['M-22 -137 L-11 -147 10 -147 22 -135 20 -107 13 -91 -5 -87 -20 -102Z','woodLight','woodDark',.9],
   ['M-22 -132 L-12 -139 -4 -135 -2 -128 -10 -122 -20 -123Z M5 -133 L14 -140 22 -134 20 -125 9 -120 5 -124Z','wood',null],
   ['M-20 -129 Q-13 -133 -5 -126 L-6 -118 -12 -115 -19 -120Z M6 -126 Q12 -135 20 -132 L18 -120 10 -116 5 -120Z','woodDark',null],
   ['M-18 -126 L-12 -128 -6 -124 -9 -119 -16 -120Z M8 -124 L17 -129 16 -121 10 -119Z','ink',null],
   ['M-18 -119 L-12 -116 -7 -118 -9 -113 -16 -114Z M10 -116 L17 -120 15 -113 11 -111Z','wood',null],
   ['M-17 -129 L-12 -132 -7 -129 M10 -131 L16 -135 19 -134',null,'boneShade',.8],
   ['M-5 -135 L2 -136 5 -118 11 -111 10 -106 -5 -104 -11 -110 -7 -117Z','woodDark','ink',.6],
   ['M-4 -133 L0 -134 1 -118 6 -112 -4 -109 -7 -112Z','woodLight',null],
   ['M-3 -111 L5 -113 8 -110 7 -108 -2 -107Z','wood',null],
   ['M-17 -104 L-5 -106 11 -105 16 -101 12 -93 -2 -94 -14 -96Z','woodDark',null],
   ['M-14 -102 L-4 -103 12 -102 11 -97 -4 -98 -12 -96Z','ink',null],
   ['M-12 -102 L-6 -102 -7 -99 -12 -98Z M-3 -103 L2 -103 2 -100 -3 -100Z M5 -102 L10 -102 9 -99 5 -99Z','boneShade',null],
   ['M-12 -94 L-3 -92 10 -94 5 -89 -4 -88Z','wood',null],
   ['M-21 -115 L-19 -110 -17 -109 M18 -111 L17 -106 14 -104',null,'woodDark',.9,1]
  ]);
  paint('crown',[
   ['M-27 -140 L-26 -153 -20 -154 -21 -164 -10 -167 -3 -164 0 -158 4 -167 17 -166 21 -155 27 -151 27 -140 10 -143 -9 -141Z','woodDark'],
   ['M-19 -161 L-10 -164 -5 -159 -3 -153 -18 -152Z M3 -158 L7 -164 15 -163 17 -154 3 -153Z','wood',null],
   ['M-24 -150 L-9 -148 9 -150 23 -147 22 -143 7 -146 -10 -144 -24 -146Z','woodLight',null],
   ['M-2 -160 L1 -156 -1 -148 -4 -143 -5 -148Z','ink',null]
  ]);
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
