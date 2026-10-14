// Second catalogue pass: painted geometry only. Rig/pivots/aim/clips remain upstream.
export function redesignRecommended(a){
 const ids=['hound','boar','bat','human','possessedGuard','possessedArcher','gateMaster','archerMaster','archiveFiend','kilnFiend'];if(!ids.includes(a.id))return a;
 a.version=3;a.budget='catalog-redesign';a.palette={...a.palette,bone:'#a9aa92',boneShade:'#747d6b',soul:'#9ba88c'};
 const get=id=>a.parts.find(p=>p.id===id),paint=(id,rows)=>{const p=get(id);if(p)p.paths=rows.map(([d,fill,stroke='ink',width=1,lod=0])=>({d,fill,stroke,width,lod}));};
 a.brief={...a.brief,reference:'한국 읍성의 생활·수비 역할을 위한 독자 조형. 실존 유물 복제·신격 악역화 없음. 공식 이미지 서버 접근 제한은 검수 문서에 별도 기록.'};
 if(a.id==='hound'){
  paint('body',[['M-51 -58 Q-58 -77 -36 -85 L-13 -88 7 -94 29 -85 40 -68 28 -45 10 -44 -10 -49 -32 -41 -48 -46Z','shadow'],['M-47 -73 Q-21 -88 5 -82 L25 -79 18 -66 5 -62 -5 -51 -20 -57 -38 -51Z','fur',null],['M-37 -81 L-19 -86 7 -88 19 -82 1 -77 -13 -79 -29 -73Z','light',null]]);
  paint('neck',[['M19 -77 L24 -95 30 -105 33 -99 39 -104 44 -90 52 -78 43 -58 32 -55 26 -66Z','fur'],['M29 -93 L35 -98 40 -86 39 -73 30 -67Z','light',null]]);
  paint('head',[['M30 -95 L29 -115 35 -110 40 -99 49 -101 55 -113 58 -109 55 -95 64 -88 77 -82 80 -75 71 -70 58 -73 49 -69 36 -77Z','fur'],['M39 -94 L51 -97 59 -87 74 -80 73 -75 61 -77 54 -73 46 -78Z','boneShade',null],['M46 -91 L57 -89 53 -86 46 -87Z','ink',null],['M73 -81 L80 -79 81 -75 74 -73Z','ink'],['M32 -109 L36 -99 M54 -106 L53 -98',null,'deep',1.5]]);
  paint('jaw',[['M48 -77 L60 -74 75 -73 72 -68 61 -67 50 -71Z','shadow'],['M56 -72 L69 -71',null,'boneShade',1.2]]);
  a.brief.silhouette='긴 주둥이와 낮은 어깨, 뒤로 접힌 귀의 들린 산개';
 }else if(a.id==='boar'){
  paint('body',[['M-55 -42 Q-66 -74 -40 -94 L-28 -99 -12 -112 5 -116 28 -105 43 -89 53 -62 43 -34 11 -28 -23 -33 -45 -29Z','woodDark'],['M-48 -70 Q-25 -99 4 -98 Q30 -104 40 -80 L34 -48 17 -38 -8 -46 -36 -42Z','wood',null],['M-38 -89 L-19 -104 5 -110 23 -101 14 -94 -7 -92 -18 -82Z','shadow',null]]);
  paint('head',[['M27 -87 L42 -92 49 -102 57 -92 63 -78 68 -67 84 -59 85 -44 73 -38 52 -44 34 -57Z','wood'],['M40 -84 L52 -88 58 -76 59 -63 77 -54 75 -46 58 -49 43 -59Z','woodLight',null],['M44 -75 L55 -75 52 -70 46 -70Z','ink',null],['M72 -60 L84 -57 86 -48 80 -43 70 -45 67 -52Z','woodDark'],['M76 -53 L77 -49 M82 -52 L82 -48',null,'ink',1.8]]);
  paint('tusks',[['M59 -48 Q65 -29 76 -33 L82 -45 77 -39 Q69 -35 67 -47Z','boneShade'],['M44 -53 Q48 -39 56 -42 L58 -47 52 -45 49 -53Z','boneShade']]);
  a.brief.silhouette='쐐기형 머리와 무거운 어깨, 짧은 회색 엄니';
 }else if(a.id==='bat'){
  paint('left-wing',[['M-6 -70 L-30 -99 -61 -111 -85 -91 -63 -84 -51 -66 -37 -73 -25 -48 -14 -54 -6 -43Z','clothDark'],['M-12 -69 L-31 -94 -57 -103 -46 -84 -28 -61Z','cloth',null],['M-8 -66 L-31 -96 -79 -91 M-31 -96 L-49 -69 M-31 -96 L-26 -53',null,'boneShade',1.4]]);
  paint('right-wing',[['M6 -70 L27 -83 61 -82 86 -56 62 -59 48 -42 35 -51 22 -36 12 -44 6 -43Z','clothDark'],['M13 -66 L28 -78 58 -77 43 -61 26 -47Z','cloth',null],['M8 -65 L28 -80 81 -57 M28 -80 L47 -45 M28 -80 L23 -40',null,'boneShade',1.4]]);
  paint('head',[['M-9 -82 L-13 -102 -7 -98 -4 -88 3 -89 10 -99 15 -101 10 -83 7 -75 -5 -76Z','shadow'],['M-7 -83 L-2 -81 M3 -81 L7 -83',null,'boneShade',1.2],['M-3 -76 L3 -76 2 -71 -2 -71Z','ink']]);
  paint('body',[['M-9 -80 L-14 -65 -10 -42 0 -30 10 -42 14 -65 9 -81Z','shadow'],['M-5 -71 L5 -69 6 -51 0 -41 -6 -53Z','fur',null]]);
  a.brief.silhouette='한쪽 접힌 날개막과 작은 머리, 비대칭 비행 자세';
 }else if(a.id==='human'){
  a.palette={...a.palette,cloth:'#4b5350',clothLight:'#808476',clothDark:'#2a3535',red:'#716b57',redDark:'#454c43'};
  paint('head',[['M-7 -137 L1 -141 8 -136 9 -126 5 -117 -1 -114 -7 -122Z','boneShade'],['M-3 -135 L3 -136 6 -130 3 -120 -1 -119 -4 -125Z','bone',null],['M-5 -130 L5 -129',null,'ink',1.8],['M0 -121 L4 -121',null,'clothDark',1]]);
  paint('hat',[['M-25 -138 L-11 -143 -9 -155 3 -157 11 -150 11 -143 25 -137 16 -134 0 -138 -16 -135Z','clothDark'],['M-8 -148 L-6 -153 3 -154 8 -148 8 -144 -8 -143Z','cloth',null],['M-22 -137 L-2 -140 20 -136',null,'boneShade',1],['M-10 -140 L-8 -140 -12 -115 -16 -111 -13 -126Z','redDark',null]]);
  paint('torso',[['M-16 -112 L-6 -116 7 -115 20 -106 23 -87 17 -64 20 -42 9 -35 0 -44 -8 -34 -20 -42 -16 -68 -22 -91Z','cloth'],['M-13 -107 L-3 -98 9 -110 14 -98 3 -79 -3 -60 -15 -64 -13 -80Z','clothLight',null],['M12 -98 L19 -91 14 -71 17 -59 10 -53 7 -70Z','clothDark',null],['M-18 -63 L18 -65 19 -58 -18 -56Z','woodDark']]);
  a.brief.silhouette='낮은 갓과 긴 겹깃, 작은 얼굴의 지친 궁수';
  for(const p of a.parts)for(const v of p.paths)for(const key of ['fill','stroke'])if(v[key]==='red')v[key]='clothLight';else if(v[key]==='redDark')v[key]='clothDark';
 }else{
  const elite=a.id==='gateMaster'||a.id==='archerMaster',paper=a.id==='archiveFiend',kiln=a.id==='kilnFiend',bow=a.id==='possessedArcher'||a.id==='archerMaster';
  a.palette={...a.palette,cloth:paper?'#656651':kiln?'#605e50':elite?'#4f5a52':'#435550',clothLight:'#838774',clothDark:'#283733',metal:'#647266',metalLight:'#a1a28a',red:'#805d49',redDark:'#4c4336',bone:'#aaac94',boneShade:'#727d6b'};
  paint('head',[['M-7 -107 L1 -110 8 -106 9 -97 5 -89 -2 -88 -7 -95Z','boneShade'],['M-3 -106 L3 -107 6 -102 4 -93 0 -91 -4 -96Z','bone',null],['M-5 -101 L5 -100',null,'ink',1.5],['M0 -95 L3 -94',null,'ink',1]]);
  paint('torso',[[paper?'M-17 -92 L-5 -96 12 -92 20 -78 15 -57 22 -17 9 -14 -2 -8 -12 -16 -26 -10 -20 -53 -20 -79Z':kiln?'M-21 -89 L-11 -95 9 -94 22 -77 17 -54 22 -30 7 -24 -2 -35 -11 -27 -25 -31 -20 -57 -25 -75Z':'M-17 -92 L-5 -96 12 -92 20 -78 16 -58 22 -32 7 -26 -1 -39 -10 -28 -24 -33 -17 -60 -21 -78Z','cloth'],['M-14 -88 L-6 -91 11 -69 14 -58 -4 -64 -15 -76Z','clothLight',null],['M11 -88 L17 -82 9 -66 -8 -57 -19 -65Z','clothDark',null],['M-17 -61 L16 -61 17 -55 -18 -55Z','woodDark'],[paper?'M-11 -55 L-4 -57 1 -23 -8 -15 -16 -24Z':kiln?'M-14 -58 L15 -58 18 -29 4 -25 -16 -31Z':'M2 -58 L8 -57 4 -30 -1 -23 -3 -32Z',kiln?'soot':'clothLight',null]]);
  paint('front-arm',[['M12 -89 L23 -85 27 -77 33 -68 38 -70 43 -65 37 -56 25 -60 13 -73 6 -82Z','cloth'],['M14 -86 L21 -81 27 -71 32 -66 28 -63 20 -72 11 -81Z','clothLight',null],['M34 -68 L39 -69 43 -66 41 -61 37 -58 33 -61Z','boneShade']]);
  paint('back-arm',[['M-15 -89 L-24 -87 -29 -72 -31 -54 -24 -45 -18 -50 -21 -64 -10 -80Z','cloth'],['M-30 -54 L-24 -52 -21 -46 -23 -42 -28 -44 -31 -48Z','boneShade']]);
  if(paper){paint('jeonrip',[['M-13 -107 L-10 -118 6 -119 12 -109 10 -105 -12 -104Z','clothDark'],['M-9 -114 L5 -115 8 -108 -10 -107Z','cloth',null],['M-11 -106 L-15 -94 -13 -87 -8 -100Z','clothDark']]);paint('weapon',[['M32 -76 L43 -79 56 -74 57 -52 44 -57 34 -53Z','woodDark'],['M35 -73 L43 -76 43 -60 36 -57Z','paper'],['M45 -76 L53 -72 54 -56 45 -60Z','boneShade'],['M38 -70 L40 -69 M48 -69 L51 -67',null,'woodDark',1,1]]);a.brief.silhouette='작은 방건과 긴 소매, 펼쳐 든 장부';}
  else if(kiln){paint('jeonrip',[['M-9 -106 L-7 -112 4 -113 10 -107 10 -102 -10 -101Z','soot'],['M-11 -105 L10 -106 12 -102 -12 -100Z','clothLight'],['M-10 -102 L-17 -94 -16 -88 -8 -97Z','clothDark']]);paint('weapon',[['M27 -41 L51 -91',null,'wood',4],['M40 -92 L49 -98 64 -91 62 -81 54 -78 40 -85Z','metal'],['M43 -91 L49 -95 60 -90 54 -86Z','metalLight',null]]);a.brief.silhouette='작업 머리띠와 두꺼운 앞치마, 주조 망치와 종틀';}
  else {paint('jeonrip',[['M-12 -107 Q-11 -117 0 -118 Q11 -116 12 -107 L22 -105 21 -102 -21 -102 -23 -105Z','ink'],['M-9 -108 Q-5 -114 1 -115 L7 -112 9 -108Z','cloth',null],['M-20 -104 Q0 -107 20 -104',null,'metal',1],['M9 -108 L12 -109 16 -94 13 -88 10 -97Z','redDark']]);}
  if(elite){const t=get('torso');t.paths.push({d:bow?'M-20 -87 L-12 -94 -5 -86 -9 -73 -21 -75Z':'M-22 -87 L-14 -96 -5 -89 -8 -77 -21 -76Z M10 -93 L21 -89 26 -79 17 -75 10 -81Z',fill:'metal',stroke:'ink',width:1,lod:0});if(!bow)t.paths.push({d:'M-12 -75 L9 -75 11 -64 -12 -64Z',fill:'metal',stroke:'ink',width:1,lod:0});
   if(bow){paint('quiver',[['M-29 -87 L-17 -88 -9 -47 -20 -43Z','woodDark'],['M-26 -83 L-20 -84 -14 -50 -18 -48Z','wood',null],['M-25 -83 L-34 -109 M-20 -85 L-25 -113',null,'boneShade',1.5],['M-35 -110 L-36 -115 -31 -111 -32 -106Z','feather']]);get('jeonrip').paths.push({d:'M8 -115 L16 -119 20 -116 13 -109Z',fill:'feather',stroke:'ink',width:1,lod:0});a.brief.silhouette='한쪽 어깨 보호구와 큰 화살통을 멘 별초 궁수';}
   else{paint('weapon',[['M36 -59 L43 -68',null,'woodDark',4],['M40 -73 L49 -63',null,'woodLight',2],['M44 -71 L64 -103 69 -108 68 -98 50 -66 45 -65Z','metal'],['M47 -71 L67 -104 49 -68Z','metalLight',null],['M36 -59 Q28 -52 32 -44 L26 -48 27 -56 34 -62Z','redDark']]);a.brief.silhouette='양 어깨 철편과 넓은 환도, 무게를 낮춘 수문장';}
  }
 }
 return a;
}
