// Anatomical and material boundaries, not random wear. Bind rigs remain unchanged.
export function materialDepth(a){
 if(!['ghost','shade','warden','lantern','human','possessedGuard','possessedArcher','gateMaster','archerMaster','archiveFiend','kilnFiend'].includes(a.id))return a;
 a.version=4;const part=id=>a.parts.find(p=>p.id===id),add=(id,d,fill,stroke=null,width=.8,lod=0)=>{if(part(id))part(id).paths.push({d,fill,stroke,width,lod});};
 a.palette={...a.palette};
 if(['ghost','shade'].includes(a.id)){
  const bound=a.id==='shade';
  const paint=(id,rows)=>{part(id).paths=rows.map(([d,fill,stroke=null,width=.8,lod=0])=>({d,fill,stroke,width,lod}));};
  Object.assign(a.palette,{cloth:'#796f61',clothLight:'#b8aa8c',clothDark:'#393735',clothMid:'#948773',clothEdge:'#d0bea0',hair:'#242a2b',bone:'#bda88c',boneShade:'#837566',pressure:'#514b43'});
  // The robe is a stack of roomy garments, not a single cut-out with stripes.
  // Collar roll, sleeve cavity and turned hem each have a lit face and occlusion.
  paint('rear-sleeve',[
   [bound?'M-18 -103 Q-30 -101 -38 -87 Q-41 -73 -35 -57 L-27 -45 -22 -51 -26 -67 -15 -82Z':'M-18 -104 Q-36 -106 -44 -86 Q-49 -69 -47 -47 L-40 -39 -30 -50 -27 -73 -11 -88Z','clothDark','ink',.9],
   [bound?'M-31 -91 Q-36 -75 -31 -60 L-26 -53 -29 -71 -23 -91Z':'M-34 -96 Q-43 -80 -42 -57 L-37 -49 -33 -66 -29 -89Z','cloth',null],
   [bound?'M-35 -61 Q-31 -55 -25 -54 L-24 -47 -29 -43 -36 -52Z':'M-47 -54 Q-40 -49 -32 -54 L-30 -47 -38 -39 -47 -43Z','clothMid','clothDark',.7],
   [bound?'M-33 -55 Q-28 -53 -25 -51 L-28 -46 -32 -48Z':'M-45 -49 Q-38 -45 -33 -50 L-35 -43 -41 -41 -45 -44Z','hair'],
   [bound?'M-29 -48 L-24 -47 -24 -39 -27 -34 -28 -41 -31 -37Z':'M-40 -43 L-35 -45 -33 -35 -35 -27 -37 -35 -40 -30 -40 -37 -43 -34Z','boneShade','hair',.65]
  ]);
  paint('body',[
   [bound?'M-9 -119 Q-23 -115 -27 -101 Q-29 -93 -22 -85 Q-28 -78 -26 -70 L-21 -59 Q-19 -48 -16 -39 L-17 -18 -8 -6 -2 -15 5 -4 15 -15 14 -33 Q11 -47 17 -60 Q24 -70 20 -82 Q22 -95 14 -108 L7 -120Z':'M-10 -118 Q-21 -115 -24 -103 Q-30 -88 -26 -72 L-21 -49 Q-18 -31 -22 -13 L-12 -17 -6 2 2 -11 13 -5 12 -29 Q11 -43 18 -61 Q26 -81 20 -101 L9 -119Z','cloth','ink',1],
   [bound?'M-11 -109 Q-24 -99 -20 -88 L-15 -82 Q-22 -73 -17 -64 L-10 -54 -13 -35 -8 -14 -3 -20 -5 -48 -2 -66Z':'M-15 -108 Q-26 -91 -19 -69 Q-11 -47 -15 -24 L-10 -27 -5 -8 -5 -40 Q-8 -59 -4 -75 L3 -97Z','clothMid'],
   [bound?'M11 -106 Q21 -94 14 -84 L18 -76 13 -65 6 -57 9 -43 7 -21 12 -16 11 -37 16 -58 Q24 -75 17 -92Z':'M13 -107 Q24 -90 14 -64 Q4 -44 8 -20 L12 -17 10 -38 Q21 -62 22 -82Z','clothDark'],
   [bound?'M-15 -105 Q-12 -94 -3 -88 L9 -104 13 -99 Q7 -89 -1 -82 L-14 -91 -20 -100Z':'M-17 -106 Q-14 -99 -5 -93 L8 -110 14 -105 Q8 -91 -2 -82 L-16 -92 -22 -101Z','clothDark'],
   [bound?'M-17 -106 L-13 -111 Q-7 -100 1 -94 L-3 -87 Q-11 -94 -17 -106Z':'M-18 -108 L-13 -113 Q-7 -100 1 -94 L-3 -86 Q-12 -95 -18 -108Z','clothEdge'],
   [bound?'M9 -111 L14 -106 Q7 -95 -2 -85 L-7 -70 -10 -48 -14 -28 Q-14 -46 -12 -61 L-6 -86Z':'M8 -114 L14 -109 Q7 -96 -1 -85 L-8 -61 Q-10 -42 -7 -20 L-10 -14 Q-15 -40 -11 -62 L-5 -87Z','clothLight'],
   [bound?'M-14 -34 Q-10 -29 -4 -29 L-2 -15 -8 -9 -15 -18Z M7 -33 Q9 -24 13 -20 L10 -12 5 -8 0 -17Z':'M-20 -27 Q-16 -25 -10 -30 L-9 -21 -13 -16 -21 -12Z M-6 -19 Q1 -18 7 -24 L11 -11 4 -13 -5 -1Z','clothDark'],
   [bound?'M-18 -99 Q-20 -94 -16 -91 M-12 -52 Q-8 -43 -10 -36 M7 -42 L5 -28':'M-20 -93 Q-23 -82 -19 -71 M-7 -68 Q-3 -58 -5 -47 M7 -49 Q3 -37 5 -28',null,'clothEdge',.65,1]
  ]);
  if(bound){
   // Contact shoulders narrow at the bands; swollen cloth rolls sit beside them.
   add('body','M-25 -98 Q-12 -94 -9 -88 L-18 -88 -24 -92Z M12 -98 Q14 -91 20 -87 L17 -82 9 -89Z M-24 -72 Q-17 -70 -12 -64 L-20 -60 -24 -65Z M8 -61 Q4 -53 6 -45 L1 -49 0 -58Z','clothLight');
   add('body','M-23 -86 Q-15 -81 -8 -80 L-17 -76 -23 -78Z M-18 -56 Q-8 -59 -2 -61 L-6 -53 -13 -49Z M13 -77 L20 -80 18 -72 12 -67Z','pressure');
  }
  paint('head',[
   ['M-10 -124 Q0 -133 10 -126 Q16 -122 16 -113 L12 -101 4 -94 -6 -98 -15 -108 Q-20 -118 -10 -124Z','hair','ink',.9],
   ['M-3 -124 Q5 -125 10 -119 L10 -111 6 -104 0 -101 -6 -108 -8 -116Z','boneShade'],
   ['M-2 -122 Q3 -123 7 -119 L6 -113 9 -111 6 -108 5 -104 0 -104 -3 -109 -4 -116Z','bone'],
   ['M-5 -117 L0 -116 -1 -112 -5 -113Z M3 -115 L8 -117 7 -113 3 -112Z','hair'],
   ['M1 -112 L3 -109 1 -107 M-1 -104 L3 -104',null,'pressure',.7],
   [bound?'M-11 -122 Q-6 -127 -2 -127 L-5 -117 -8 -112 -8 -102 -13 -107 -15 -114Z':'M-11 -124 Q-8 -128 -2 -128 Q-9 -116 -9 -109 L-6 -99 -10 -88 -12 -96 -16 -92 -14 -105 Q-20 -115 -11 -124Z','hair'],
   [bound?'M-12 -116 Q-1 -114 12 -117 L12 -110 Q1 -107 -10 -110Z':'M-9 -124 Q-12 -117 -11 -109 M11 -120 Q14 -110 9 -103',bound?'clothMid':null,bound?'pressure':'clothDark',bound?.7:.6],
   ...(bound?[
    ['M-11 -116 Q0 -112 12 -116 L12 -114 Q1 -110 -10 -113Z','clothLight'],
    ['M-9 -109 Q-3 -106 4 -107 L8 -103 3 -100 -7 -103Z','clothDark']
   ]:[])
  ]);
  paint('front-sleeve',[
   [bound?'M12 -102 Q23 -101 29 -91 L32 -75 Q31 -66 24 -58 L17 -58 18 -71 13 -80 6 -86Z':'M12 -103 Q27 -102 31 -89 L35 -77 Q41 -73 43 -66 L42 -51 32 -47 25 -56 22 -70 Q11 -76 8 -87Z','cloth','ink',.9],
   [bound?'M17 -96 Q26 -92 26 -82 L29 -72 17 -84Z':'M16 -98 Q25 -97 27 -85 L31 -75 37 -70 34 -60 28 -66 25 -78 15 -84Z','clothMid'],
   [bound?'M29 -82 Q29 -69 23 -63 L20 -64 23 -76 19 -84Z':'M29 -78 Q36 -73 39 -66 L35 -59 29 -62 25 -70Z','clothDark'],
   [bound?'M19 -68 Q25 -65 30 -71 L28 -61 22 -56 17 -59Z':'M27 -62 Q33 -60 42 -66 L42 -52 Q35 -47 29 -52Z','clothEdge','clothDark',.7],
   [bound?'M20 -64 Q25 -61 28 -66 L25 -60 21 -59Z':'M29 -59 Q36 -55 41 -62 L40 -53 Q34 -50 30 -54Z','hair'],
   [bound?'M23 -60 L28 -61 30 -54 28 -44 26 -50 24 -45 23 -52 21 -48Z':'M34 -53 L38 -53 40 -46 37 -37 36 -43 33 -39 33 -46 30 -42 31 -49Z','boneShade','hair',.65],
   [bound?'M17 -96 Q21 -91 22 -86':'M17 -97 Q23 -92 24 -85',null,'clothEdge',.7,1]
  ]);
  if(bound){
   paint('bindings',[
    ['M-25 -96 Q-5 -93 21 -86 L23 -76 Q-3 -77 -24 -85 L-27 -92Z','pressure','hair',.8],
    ['M-24 -94 Q-2 -87 21 -85 L21 -79 Q-3 -80 -24 -88Z','clothMid'],
    ['M-24 -93 Q-3 -86 20 -84',null,'clothEdge',1,0],
    ['M-24 -65 Q-7 -64 18 -78 L22 -74 20 -65 Q1 -56 -19 -54 L-25 -59Z','pressure','hair',.8],
    ['M-23 -63 Q-4 -61 19 -75 L19 -68 Q-1 -58 -21 -57Z','clothLight'],
    ['M-21 -60 Q-1 -60 18 -71',null,'clothEdge',.85,0],
    ['M-24 -88 Q-20 -87 -18 -86 M17 -83 L21 -81 M-21 -59 L-17 -59 M15 -69 L19 -71',null,'clothDark',.7,1]
   ]);
   paint('knot',[
    ['M13 -71 Q22 -80 27 -73 Q30 -67 21 -64 L15 -64 Q17 -53 26 -41 L24 -34 17 -41 10 -58 Q4 -47 -2 -48 L-6 -54 3 -65 9 -68Z','redDark','hair',.8],
    ['M13 -69 Q20 -76 24 -72 L22 -68 16 -66Z M9 -64 L3 -54 -1 -53 4 -62Z','red'],
    ['M11 -69 L17 -67 15 -62 10 -62 8 -66Z','pressure','hair',.6],
    ['M14 -60 Q17 -49 23 -40 M11 -68 L14 -65',null,'clothMid',.7,1]
   ]);
  }
  a.version=5;
  a.brief={...a.brief,materials:['겹쳐 입힌 삼베','접힌 안깃과 소매 안감',bound?'눌린 속포와 당겨진 옷감':'처지는 겉옷과 드러난 속옷'],reference:'이화여대박물관 침선 전시의 20세기 모시 두루마기 실물 사진에서 겹깃·포개진 앞섶·접어 박은 소매와 밑단의 두께를 직접 관찰. 국사편찬위원회 우리역사넷 한국문화사 제3장 수의 일습: 넉넉한 겹옷과 포갠 소매, 소렴의 속포 설명 확인. 복원 수의 사진 원본은 접근 제한으로 직접 픽셀 관찰 미완료. 붉은 결박은 게임의 창작 표현이며 전통 장례 의식 자체의 악함을 의미하지 않음.'};
 }else if(a.id==='warden'){
  Object.assign(a.palette,{wood:'#70513a',woodLight:'#ad8c5f',woodDark:'#382b24',boneShade:'#8f8066'});
  // Branch break exposes end grain; the light ridge follows the existing fork.
  add('right-arm','M49 -125 L54 -132 58 -134 57 -128 53 -122Z','woodLight','woodDark',.6);
  add('left-arm','M-77 -73 L-82 -73 -81 -67 -77 -65Z','woodLight','woodDark',.6);
  add('left-arm','M-24 -79 Q-35 -74 -38 -65 L-44 -59',null,'woodLight',1.2);
 }else if(a.id==='lantern'){
  Object.assign(a.palette,{paper:'#c1a67a',boneShade:'#84745b',wood:'#6f4931',woodLight:'#b18a56'});
  // Illumination catches the inward tear, not the whole outer panel.
  add('frame','M16 -84 L19 -81 16 -74 M15 -59 L18 -55 21 -56',null,'hot',.6);
 }else{
  const human=a.id==='human',archive=a.id==='archiveFiend',kiln=a.id==='kilnFiend',master=a.id.includes('Master'),bow=a.id.includes('Archer')||a.id==='archerMaster'||human;
  const colors=archive?['#55483c','#a18b69','#302825']:kiln?['#514b45','#94806a','#282c2c']:bow?['#465764','#83958f','#25323b']:['#694d42','#9a8065','#302d2e'];
  Object.assign(a.palette,{cloth:colors[0],clothLight:colors[1],clothDark:colors[2],bone:'#c8aa88',boneShade:'#987960',metal:'#55656a',metalLight:'#a0acaa'});
  if(part('seal'))part('seal').paths=[];if(part('seals'))part('seals').paths=[];
  const y=human?-28:0;
  add('head',`M-4 ${-103+y} L0 ${-104+y} 4 ${-101+y} 2 ${-97+y} -2 ${-98+y}Z`,'bone');
  add('head',`M-5 ${-101+y} L0 ${-99+y} M2 ${-99+y} L6 ${-101+y} M1 ${-96+y} L4 ${-94+y}`,null,'ink',.85);
  add('torso',human?'M-13 -104 Q-7 -97 -8 -85 L-13 -72 -16 -81Z':'M-15 -86 Q-8 -81 -10 -70 L-15 -62 -18 -71Z','clothDark');
  add('torso',human?'M4 -90 L12 -97 9 -81 3 -73 -1 -75Z':'M4 -75 L12 -82 9 -66 3 -58 -1 -61Z','clothLight');
  add('front-arm',human?'M16 -105 L24 -100 26 -92 22 -94 19 -100Z':'M16 -84 L22 -79 23 -74 19 -76 14 -80Z','clothLight');
  if(!human)add('front-arm','M34 -66 L38 -66 41 -64 39 -60 35 -61Z','bone');
  if(archive){add('torso','M-13 -58 L-8 -54 -9 -29 -15 -18 -17 -35Z','clothDark');add('weapon','M43 -75 L44 -60 53 -56 M36 -69 L41 -70 M46 -68 L51 -66',null,'wood',.9);}
  else if(kiln){add('torso','M-13 -58 L-6 -54 -9 -35 -5 -28 -13 -30Z','woodDark');add('front-arm','M24 -69 L28 -66 31 -63 28 -60 24 -64Z','boneShade');add('weapon','M44 -92 L49 -95 60 -91 54 -88Z','metalLight');}
  else if(master){add('torso','M-11 -74 L-1 -70 9 -74 10 -65 -1 -61 -11 -65Z','metal','ink');add('torso','M-8 -72 L-8 -66 M-3 -70 L-3 -64 M3 -71 L3 -65 M8 -73 L8 -67',null,'metalLight',.7,1);}
  else add('torso',human?'M-17 -62 L-11 -59 -13 -42 -18 -46Z':'M-17 -60 L-11 -57 -13 -40 -18 -44Z','woodDark');
 }
 a.brief={...a.brief,revision:'Anatomy under cloth, material overlap and directional light; no gameplay or rig changes.'};return a;
}
