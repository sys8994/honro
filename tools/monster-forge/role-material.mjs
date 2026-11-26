// Cut planes, closures and edges are drawn in the original bind pose. Each
// addition belongs to the part that bears it during the existing clips.
export function roleMaterial(a){
 const bow=a.id==='possessedArcher'||a.id==='archerMaster';
 const guard=a.id==='possessedGuard'||a.id==='gateMaster';
 const kiln=a.id==='kilnFiend', elite=a.id.endsWith('Master');
 const add=(id,d,fill,stroke=null,width=1,lod=0)=>a.parts.find(p=>p.id===id).paths.push({d,fill,stroke,width,lod});
 if(bow||guard||kiln){
  if(bow){
   // Short, fitted wrap and leather draw guard. The quiver is worn behind the hip.
   add('torso','M-19 -83 L-13 -87 -2 -72 8 -65 1 -64 -9 -69 -16 -76Z','clothLight');
   add('torso','M-11 -56 L-4 -55 -7 -44 -13 -34 -19 -35 -14 -47Z','clothDark');
   add('torso','M10 -54 L15 -54 18 -45 19 -34 13 -30 13 -40Z','clothLight');
   add('front-arm','M20 -75 L24 -76 32 -67 35 -66 31 -60 26 -62 23 -66Z','woodDark','ink',.75);
   add('front-arm','M23 -73 L26 -69 31 -66 M26 -64 L32 -63',null,'woodLight',1);
   add('weapon','M41 -95 Q48 -86 49 -76 L45 -83 43 -89Z M47 -51 Q49 -44 44 -33 L46 -43Z','boneShade');
   add('weapon','M48 -69 L51 -68 51 -58 47 -56 48 -62Z','woodDark','ink',.65);
   add('quiver',elite?'M-28 -87 L-17 -88 -16 -83 -27 -81Z M-22 -52 L-13 -55 -10 -48 -21 -44Z':'M-25 -78 L-18 -79 -16 -75 -24 -72Z M-20 -51 L-12 -53 -10 -48 -19 -45Z','woodLight','woodDark',.7);
   if(elite){
    add('jeonrip','M13 -114 Q26 -123 34 -116 L28 -114 22 -109 13 -108Z','redDark','ink',.75);
    add('jeonrip','M15 -112 Q25 -116 29 -116',null,'red',1.2);
    add('torso','M-22 -86 L-14 -92 -10 -89 -12 -81 -19 -78Z M-22 -79 L-18 -76 -19 -70 -25 -73Z','boneShade','ink',.75);
   }else{
    add('head','M-6 -92 L-4 -87 -3 -91 -1 -84 1 -90 3 -87 5 -92Z','ink');
    add('jeonrip','M10 -108 L16 -109 19 -105 16 -103 11 -104Z','boneShade','ink',.7);
   }
  }else if(guard){
   // Steel shoulder lames and layered collar distinguish a shield-line fit.
   add('torso',elite?'M-25 -89 L-14 -97 -5 -92 -6 -83 -16 -79 -25 -83Z M12 -93 L23 -91 30 -82 26 -76 16 -77 12 -83Z':'M-22 -85 L-15 -91 -9 -87 -10 -81 -18 -77 -24 -80Z','metal','ink',.85);
   add('torso',elite?'M-23 -87 L-15 -94 -9 -92 -11 -88 -17 -84 -22 -85Z M16 -89 L22 -88 26 -83 22 -81 17 -83Z':'M-20 -85 L-15 -89 -12 -87 -13 -84 -19 -81Z','metalLight');
   add('torso','M-13 -67 L-4 -64 5 -68 11 -63 9 -58 -2 -55 -13 -59Z','metal','ink',.8);
   add('torso','M-11 -62 L-3 -59 5 -62 M-13 -47 L-9 -45 -13 -33 M10 -51 L14 -47 16 -39',null,'metalLight',1);
   add('front-arm','M20 -77 L24 -74 31 -67 29 -62 26 -62 21 -67 18 -72Z','metal','ink',.75);
   add('front-arm','M22 -73 L24 -70 28 -67 M23 -67 L26 -65',null,'metalLight',1.2);
   add('weapon','M38 -63 L41 -66 43 -64 40 -61 36 -58 35 -59Z','woodLight','ink',.65);
   if(elite){
    add('jeonrip','M-9 -108 L-8 -117 -4 -120 0 -120 4 -117 7 -108Z','metal','ink',.75);
    add('jeonrip','M-5 -116 L0 -117 4 -114 4 -110 -4 -110Z','metalLight');
    add('torso','M-16 -52 L-5 -48 -6 -40 -12 -42 -20 -45Z M5 -49 L15 -51 18 -44 13 -41 6 -42Z','metal','ink',.8);
   }else{
    add('head','M0 -106 L3 -106 3 -103 5 -102 3 -99 2 -95 0 -97 1 -101Z','boneShade');
    add('jeonrip','M-9 -111 Q0 -114 9 -111 L10 -107 4 -108 -6 -108 -10 -106Z','metal','ink',.65);
   }
  }else{
   // Dull mould lip, slag seams and a scorched leather apron, not a guard's breastplate.
   add('bell-mould','M-38 -63 Q-31 -59 -24 -59 L-12 -60 -11 -55 Q-26 -51 -39 -58Z','boneShade','ink',.8);
   add('bell-mould','M-35 -85 L-30 -88 -27 -84 -30 -80 -31 -72 -34 -68 -36 -74Z','metalLight');
   add('torso','M-11 -57 L0 -55 9 -58 13 -49 12 -41 7 -33 -4 -33 -7 -39 -11 -44Z','wood','ink',.8);
   add('torso','M-6 -50 L-2 -53 1 -48 0 -42 5 -38 3 -35 -3 -37 -5 -41Z','boneShade');
   add('weapon','M40 -86 L49 -88 56 -83 55 -79 50 -80 47 -84 41 -83Z','boneShade','ink',.6);
   add('weapon','M30 -49 L33 -55 35 -55 34 -51 32 -47Z','woodLight');
  }
 }
 if(a.id==='hound'){
  // Keep the hungry flank open: jaw, spinal mantle and loaded hock carry the light.
  add('body','M-42 -82 L-34 -89 -33 -84 -25 -91 -21 -85 -16 -88 -11 -92 -7 -87 1 -94 6 -90 15 -92 21 -89 27 -85 18 -86 13 -82 1 -84 -7 -80 -19 -81 -24 -77 -32 -79Z','light');
  add('body','M-47 -68 Q-42 -60 -32 -61 L-28 -58 -33 -53 -44 -52 -47 -57Z','shadow');
  add('neck','M29 -100 L33 -97 31 -86 27 -82 28 -76 25 -73 23 -77 25 -88Z','rim');
  add('neck','M37 -85 L43 -89 45 -83 44 -75 39 -66 36 -65 40 -77Z','shadow');
  add('head','M29 -105 L33 -103 35 -99 32 -96 30 -100Z M49 -108 L52 -115 52 -107 48 -102 47 -103Z','boneShade');
  add('head','M52 -98 Q61 -96 62 -91 L59 -89 54 -94 52 -92 48 -93Z','rim');
  add('jaw','M48 -74 L54 -72 57 -71 65 -72 71 -74 68 -71 61 -69 53 -69Z','rim');
  add('fore-near','M21 -39 L25 -35 26 -28 25 -21 23 -24 22 -31Z','light');
 }
 if(a.id==='boar'){
  // Mottled, load-bearing bristle at the shoulder rather than fine fur over the entire body.
  add('body','M-42 -87 L-35 -96 -33 -90 -24 -104 -20 -96 -12 -111 -8 -102 2 -115 5 -105 11 -108 20 -107 24 -104 17 -102 6 -104 -2 -99 -10 -101 -18 -93 -23 -94 -31 -87 -36 -88Z','woodLight');
  add('body','M-23 -57 Q-18 -60 -14 -54 L-11 -46 -16 -41 -23 -46 -30 -46 -33 -51Z','woodDark');
  add('body','M29 -76 L36 -80 39 -74 38 -65 31 -57 28 -53 29 -66Z','boneShade');
  add('head','M41 -84 L46 -90 47 -97 49 -97 51 -88 55 -84 48 -82Z','boneShade');
  add('head','M44 -71 L46 -74 50 -75 55 -72 53 -69 47 -69Z','woodDark');
  add('tusks','M59 -44 Q68 -33 79 -34 L76 -30 Q67 -27 62 -36Z','boneShade');
  add('hind-near','M-44 -28 L-40 -25 -39 -19 -42 -11 -45 -11 -44 -18Z','woodLight');
 }
 if(a.id==='ghost'){
  // A split hem catches light from the sleeve opening, not an outline around the spirit.
  add('body','M-6 -68 Q-2 -56 -4 -45 L-7 -34 -9 -31 -7 -45 Q-7 -59 -9 -64Z','clothMid');
  add('body','M-19 -29 L-16 -29 -17 -24 -21 -21 -20 -26Z M4 -19 L7 -23 10 -15 7 -15Z','clothMid');
  add('front-sleeve','M30 -57 Q35 -55 38 -57 L36 -53 31 -52Z','clothLight');
 }
 if(a.id==='bat'||a.id==='crow'){
  a.budget='catalog-redesign';
  const crow=a.id==='crow';
  for(const [id,sign] of [['left-wing',-1],['right-wing',1]]){
   const wing=(points,fill,stroke=null,width=1,lod=0)=>add(id,points.replace(/@([0-9.]+)/g,(_,x)=>String(Number(x)*sign)),fill,stroke,width,lod);
   if(crow){
    // Individual overlapping primaries; narrow bevel falls off before the wing tip.
    wing('M@33 -88 Q@49 -105 @72 -99 L@74 -97 @61 -94 @47 -91Z','ink');
    wing('M@42 -83 Q@60 -94 @75 -90 L@78 -89 @66 -85 @55 -82Z','deep');
    wing('M@45 -74 Q@58 -84 @74 -76 L@70 -73 @59 -71 @52 -72Z','ink');
    wing('M@38 -66 Q@52 -74 @63 -63 L@59 -60 @45 -61Z','deep');
    wing('M@27 -91 Q@45 -102 @65 -99 M@38 -86 Q@51 -91 @70 -89 M@42 -77 Q@57 -81 @68 -76 M@36 -69 Q@49 -72 @57 -65',null,'featherLight',1.2);
    wing('M@12 -65 Q@23 -82 @32 -87 L@30 -81 @34 -80 @27 -76 @26 -72 @20 -71 @20 -66Z','featherLight');
    wing('M@31 -70 L@33 -64 @40 -61 @47 -56 @40 -53 @32 -54 @25 -57Z','deep');
   }else{
    // Membrane tension: lit ridge around cartilage, torn edge drops into shadow.
    wing('M@31 -94 Q@53 -106 @57 -105 L@78 -90 Q@67 -90 @53 -94 L@43 -90Z','cloth');
    wing('M@32 -90 Q@46 -88 @72 -86 L@63 -83 @57 -82 @52 -70 @49 -71 Q@44 -83 @32 -90Z','clothDark');
    wing('M@30 -89 Q@40 -82 @48 -71 L@40 -75 @37 -71 @32 -68 @28 -57 @26 -56 Q@26 -72 @30 -89Z','cloth');
    wing('M@13 -67 Q@23 -77 @28 -89 Q@28 -72 @24 -59 L@18 -54 @13 -56Z','clothDark');
    wing('M@16 -67 Q@23 -77 @28 -88 M@32 -91 Q@45 -97 @55 -102 M@35 -91 Q@53 -88 @69 -87 M@31 -85 Q@32 -76 @30 -67',null,'clothLight',1.05);
    wing('M@24 -92 Q@28 -97 @33 -97 L@35 -94 @30 -90 @27 -82 @24 -84Z','boneShade','deep',.65);
   }
  }
  if(crow){
   add('body','M-9 -72 L-3 -76 2 -69 7 -71 9 -63 4 -65 2 -60 -2 -64 -6 -59 -5 -66 -10 -65Z','deep');
   add('head','M-6 -92 Q-1 -96 6 -93 L10 -88 5 -89 2 -86 -1 -89 -6 -86Z','feather','ink',.65);
   add('tail','M-5 -36 L-7 -21 -11 -13 -9 -32Z M5 -33 L10 -32 11 -16 7 -20Z','featherLight');
  }else{
   add('body','M-8 -71 L-3 -73 1 -70 5 -74 9 -68 6 -67 6 -59 3 -61 1 -54 -1 -61 -5 -59 -5 -65 -8 -64Z','fur');
   add('head','M-4 -84 L0 -86 5 -84 7 -80 3 -78 1 -75 -3 -76 -7 -79Z','shadow','ink',.85);
   add('head','M-3 -80 L0 -79 3 -80 2 -77 -1 -77Z','boneShade');
  }
 }
 return a;
}

// Sculptural details on the handoff cuts. Keep the original palette keys,
// pivot ownership, action tracks and external species bindings.
export function handoffMaterial(a){
 const add=(id,d,fill,stroke=null,width=1,lod=0)=>a.parts.find(p=>p.id===id).paths.push({d,fill,stroke,width,lod});
 if(a.id==='device'){
   // Oiled bronze drive, carpentry dovetails and a cracked stone rain hood.
   add('housing','M-32 -88 L-23 -87 -24 -57 -32 -47 -36 -54Z M6 -89 L16 -89 21 -79 17 -55 10 -48 6 -60Z','aaa18b','3c403a',.9);
   add('housing','M-30 -53 L-20 -57 -16 -49 9 -48 13 -53 20 -48 19 -38 8 -41 -2 -37 -17 -44 -30 -39Z','a49b84','3c403a',1.1);
   add('housing','M-24 -80 L-14 -83 -7 -76 -5 -61 -13 -56 -23 -63Z','42362e','202726',1);
   add('housing','M-22 -77 L-15 -79 -11 -75 -10 -66 -14 -62 -20 -65Z','a49b84');
   add('housing','M-16 -75 L-13 -74 -13 -68 -16 -67 -17 -71Z','d9a23a');
   add('housing','M-30 -36 L-25 -39 -22 -29 -27 -26 -32 -27Z M10 -39 L17 -40 18 -26 11 -25 7 -31Z','42362e','3c403a',1);
   add('base','M-46 -31 L-33 -28 -29 -30 -18 -28 -13 -30 2 -27 15 -29 27 -26 31 -20 16 -20 10 -23 0 -20 -15 -23 -24 -21 -42 -21Z','3c403a');
   add('base','M-49 -16 L-36 -20 -28 -17 -35 -10 -46 -10 -53 -5 -55 -8Z M18 -16 L29 -17 39 -13 45 -4 36 -4 32 -8 22 -6 17 -10Z','aaa18b','3c403a',1);
   add('base','M-49 -8 L-42 -11 -35 -11 -31 -15 M-25 -4 L-14 -8 -8 -6 0 -9 9 -7 M27 -11 L34 -13 41 -8',null,'42362e',1.3);
   add('cap','M-42 -96 L-27 -104 -20 -111 -12 -110 -5 -99 -2 -92 -20 -94 -32 -91Z','a49b84','3c403a',1);
   add('cap','M-13 -119 L-4 -121 -8 -113 1 -112 6 -105 5 -98 14 -92 M15 -111 L14 -105 26 -102 28 -96 37 -96',null,'3c403a',1.8);
   add('cap','M-40 -96 L-28 -102 -21 -108 -15 -108 M21 -103 L29 -107 34 -103',null,'aaa18b',1.25);
   add('wheel','M30 -70 L38 -83 47 -85 58 -78 61 -71 55 -72 50 -79 42 -78 35 -68Z M63 -66 L66 -51 62 -38 55 -31 53 -34 59 -49 59 -59Z M28 -55 L33 -51 33 -42 41 -31 48 -30 45 -24 36 -27 28 -43Z','a49b84','3c403a',1);
   add('wheel','M39 -73 L46 -76 51 -72 51 -67 46 -64 44 -59 42 -59 42 -66 37 -68Z M55 -50 L58 -47 54 -41 49 -43 48 -51 51 -55 52 -50Z M38 -49 L43 -54 45 -49 43 -46 46 -42 48 -35 43 -35 39 -40 34 -41 34 -46Z','b8963f','202726',1);
   add('wheel','M42 -70 L45 -73 47 -73 M52 -47 L54 -46 53 -44 M39 -43 L41 -42 43 -38',null,'d6b75e',1.35);
   add('spindle','M12 -53 L17 -54 18 -49 16 -45 11 -44 10 -48Z M31 -54 L35 -54 37 -50 35 -46 31 -46 30 -51Z','42362e','a49b84',.9);
   add('spindle','M17 -50 L30 -53 M20 -47 L30 -49 M37 -49 L46 -51',null,'d6b75e',1);
 }
 if(a.id==='gaekgwi'){
   // Hint at living fingers inside the oversized adult-garment silhouette.
   add('neararm','M-32 -48 Q-29 -58 -23 -64 L-19 -60 -24 -51 -26 -43 -20 -38 3 -39 20 -33 26 -26 27 -20 19 -26 4 -30 -12 -32 -26 -29 -34 -36Z','aa8357','65543e',1);
   add('neararm','M13 -44 L29 -41 39 -36 45 -29 45 -25 37 -32 31 -33 27 -37 22 -37Z','e6d7b6');
   add('neararm','M19 -33 Q25 -29 28 -22 M31 -29 L35 -21 34 -16 M42 -25 L46 -19 44 -14 M8 -40 L17 -38',null,'65543e',1.2);
   add('fararm','M42 -73 L53 -80 68 -85 79 -81 83 -76 73 -78 60 -78 54 -73Z','d5c7a7');
   add('torso','M-22 -104 L-15 -110 -1 -106 9 -98 13 -88 6 -84 1 -93 -13 -96 -24 -91 -32 -83 -39 -84Z','65543e','252628',1);
   add('torso','M-37 -84 L-25 -90 -15 -92 -9 -89 -20 -84 -24 -73 -28 -69 -30 -79 -41 -67 -46 -68Z','aa8357');
   add('torso','M-53 -64 Q-42 -57 -37 -65 L-38 -57 -48 -52 -50 -44 -55 -40 -53 -53Z M-33 -51 L-27 -61 -20 -66 -17 -64 -25 -55 -26 -50 -31 -46Z','65543e');
   add('head','M-7 -116 L6 -119 21 -117 13 -110 1 -111 -1 -99 -5 -94Z','65543e');
   add('head','M-5 -114 L5 -117 11 -113 4 -109 -1 -108Z M8 -97 L13 -103 17 -98 17 -89 12 -87Z','877c70');
   add('head','M32 -103 L37 -104 35 -99 31 -98 29 -100Z','252628');
   add('tail','M-68 -73 L-64 -70 -66 -65 -72 -64 -72 -60 -75 -60 -72 -57 -72 -52 -68 -46 -62 -43 -69 -43 -75 -53 -76 -58 -70 -64 -73 -68Z','aa8357');
 }
 if(a.id==='dueoksini'){
   // Sculpt the deltoids, knuckles and knee rather than adding indiscriminate speckle.
   add('body','M-52 -138 L-39 -148 -29 -152 -30 -145 -40 -141 -43 -126 -51 -119 -58 -118Z','d5c7a7','65543e',1.2);
   add('body','M21 -151 Q35 -141 37 -129 L38 -121 32 -119 30 -130 22 -137 15 -135Z','bb9565');
   add('body','M-23 -132 Q-10 -139 -3 -137 L-8 -124 -16 -122 -20 -115 -27 -117 -27 -124Z','bb9565');
   add('body','M-22 -110 Q-4 -98 10 -110 L10 -106 4 -100 -4 -99 -13 -101 -19 -103 -25 -104Z','252628');
   add('body','M-29 -95 L-20 -89 -8 -87 -2 -90 7 -90 10 -86 2 -81 -11 -79 -23 -85 -31 -87Z','bb9565');
   add('neararm','M-76 -72 L-67 -74 -58 -71 -53 -66 -56 -62 -64 -65 -70 -61 -76 -61 -80 -56 -81 -63Z','d5c7a7');
   add('neararm','M-81 -48 L-75 -49 -71 -43 -66 -47 -64 -57 -60 -58 -57 -51 -59 -42 -68 -35 -76 -36 -82 -40Z','65543e');
   add('neararm','M-81 -47 L-76 -44 -75 -40 M-71 -43 L-67 -42 -65 -38 M-65 -49 L-61 -47 -61 -44',null,'bb9565',1.8);
   add('fararm','M47 -52 L52 -55 57 -50 56 -44 53 -40 51 -38 48 -40 47 -47Z','bb9565');
   add('cloth','M-38 -62 L-29 -57 -27 -42 -24 -38 -28 -29 -34 -36 -36 -46 -41 -49Z M-14 -55 L-9 -53 -10 -39 -7 -25 -11 -25 -15 -31 -17 -43Z M9 -57 L18 -61 21 -61 18 -49 13 -39 7 -36 11 -46Z','71676e');
   add('head','M-2 -128 L2 -130 5 -128 3 -124 -1 -123 -2 -120 -4 -122Z M12 -129 L18 -129 20 -124 19 -121 14 -124Z','bb9565');
   add('head','M-2 -103 L4 -99 9 -101 16 -98 21 -100 22 -96 18 -92 8 -92 2 -93 -1 -96Z','65543e');
   add('nearleg','M-47 -37 L-43 -32 -39 -29 -40 -22 -45 -20 -46 -13 -50 -14 -47 -24Z','bb9565');
 }
 return a;
}
