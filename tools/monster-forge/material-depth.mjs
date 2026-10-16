// Anatomical and material boundaries, not random wear. Bind rigs remain unchanged.
export function materialDepth(a){
 if(!['ghost','shade','warden','lantern','human','possessedGuard','possessedArcher','gateMaster','archerMaster','archiveFiend','kilnFiend'].includes(a.id))return a;
 a.version=4;const part=id=>a.parts.find(p=>p.id===id),add=(id,d,fill,stroke=null,width=.8,lod=0)=>{if(part(id))part(id).paths.push({d,fill,stroke,width,lod});};
 a.palette={...a.palette};
 if(['ghost','shade'].includes(a.id)){
  Object.assign(a.palette,{cloth:'#71665e',clothLight:'#b6aa91',clothDark:'#302d31',bone:'#cfb899',boneShade:'#8d7465'});
  // Clavicle, sunken temple and tendon hands keep an inhabited body under cloth.
  add('head','M-3 -120 L5 -121 9 -116 7 -108 2 -101 -3 -108Z','boneShade');
  add('head','M-4 -115 L1 -114 0 -111 -4 -112Z M3 -114 L8 -116 7 -112 3 -111Z','ink');
  add('head','M0 -109 L3 -108 1 -105 M-2 -103 L3 -103',null,'clothDark',1);
  add('body','M-10 -102 L-4 -98 0 -91 8 -101 12 -98 2 -84 -7 -90Z','boneShade');
  add('body','M-15 -78 Q-8 -69 -10 -57 L-15 -43 -14 -59 -20 -72Z','clothDark');
  add('body','M3 -64 L9 -70 7 -42 11 -23 4 -29 1 -47Z','clothLight');
  add('front-sleeve','M29 -53 L36 -51 38 -43 35 -32 33 -41 29 -35 29 -43 25 -40Z','boneShade','ink');
  add('rear-sleeve','M-39 -51 L-33 -53 -33 -42 -36 -33 -37 -42 -41 -38Z','boneShade','ink');
  if(a.id==='shade'){add('bindings','M-20 -89 Q-4 -79 18 -81 M-15 -57 Q2 -60 15 -68',null,'clothDark',1.6);add('head','M-10 -120 L-5 -117 -5 -109',null,'clothLight',1.1);}
 }else if(a.id==='warden'){
  Object.assign(a.palette,{wood:'#70513a',woodLight:'#ad8c5f',woodDark:'#382b24',boneShade:'#8f8066'});
  // Branch break exposes end grain; the light ridge follows the existing fork.
  add('right-arm','M49 -125 L54 -132 58 -134 57 -128 53 -122Z','woodLight','woodDark',.6);
  add('left-arm','M-77 -73 L-82 -73 -81 -67 -77 -65Z','woodLight','woodDark',.6);
  add('left-arm','M-24 -79 Q-35 -74 -38 -65 L-44 -59',null,'woodLight',1.2);
 }else if(a.id==='lantern'){
  Object.assign(a.palette,{paper:'#c1a67a',boneShade:'#84745b',wood:'#6f4931',woodLight:'#b18a56'});
  add('shell','M-22 -94 L-13 -97 -13 -56 -21 -51Z','boneShade');
  add('shell','M11 -98 L18 -100 19 -91 16 -84 13 -87Z','paper');
  add('frame','M-27 -96 L-20 -95 -20 -90 -27 -91Z M17 -100 L24 -101 25 -94 18 -93Z M-26 -54 L-19 -55 -18 -48 -25 -47Z','woodLight','ink',.6);
  add('shell','M-9 -96 L-5 -91 -9 -88 M17 -65 L13 -61 16 -55',null,'woodDark',1.2);
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
