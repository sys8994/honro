// Pencil-and-vector development, not a gameplay registry change.
// Existing positioning/auras must be supplied by the owning encounter separately.
const p=(id,parent,pivot,paths)=>({id,parent,pivot,paths:paths.map(([d,fill,stroke=null,width=0,lod=0])=>({d,fill,stroke,width,lod}))});
const clip=(duration,tracks=[])=>({duration,tracks:tracks.map(([part,channel,keys])=>({part,channel,keys}))});
const root=()=>p('root',null,[0,0],[]);

export const retraceMourner={
 id:'a6-retrace-mourner',baseHeight:148,viewBox:[-98,-160,214,168],budget:'monster-handoff',
 palette:{char:'#1c2429',void:'#252934',shadow:'#343b49',rim:'#718078',cloth:'#ab9d87',light:'#d4c6a9',mark:'#d1ae7d',edge:'#4d595c'},
 parts:[
 root(),
 p('last-print','root',[-59,-1],[
  ['M-83 -6 C-76 -11 -64 -11 -58 -7 L-64 -3 L-80 -3 Z','edge'],
  ['M-56 -7 C-53 -10 -49 -10 -47 -7 L-49 -4 L-56 -4 Z','edge'],
  ['M-46 -5 C-43 -8 -39 -8 -38 -5 L-40 -2 L-46 -2 Z','edge'],
 ]),
 p('trailing-leg','root',[-11,-69],[
  ['M-15 -74 C-22 -60 -20 -44 -29 -33 L-38 -13 L-58 -8 L-62 -2 L-39 -1 L-24 -7 L-21 -18 L-13 -27 L-7 -46 L1 -58 Z','char','rim',1.15],
  ['M-33 -12 L-25 -9 L-17 -17 L-13 -29 L-22 -24 Z','shadow'],
 ]),
 p('front-leg','root',[5,-69],[
  ['M-2 -71 C15 -73 23 -60 20 -48 L8 -28 L6 -20 L21 -5 L47 -5 L51 -2 L44 0 L19 0 L3 -9 L-1 -20 L-1 -31 L8 -46 L3 -58 Z','void','rim',1.05],
  ['M-2 -24 L0 -14 L13 -4 L20 -2 L14 -9 L4 -20 L5 -28 Z','edge'],
 ]),
 p('folded-trunk','root',[-5,-67],[
  ['M-19 -57 C-28 -63 -36 -74 -32 -86 C-28 -101 -14 -113 5 -116 L21 -112 L24 -105 L10 -99 L2 -90 L-3 -76 L10 -62 L2 -55 L-10 -52 Z','char','rim',1.25],
  ['M-25 -88 C-17 -101 -9 -108 4 -111 L15 -109 L8 -103 L-6 -94 L-12 -82 L-20 -77 Z','shadow'],
  ['M-21 -83 C-17 -93 -11 -99 -5 -105 L3 -106 L-4 -100 L-10 -91 L-13 -80 Z','edge',null,0,1],
 ]),
 p('mourning-cloth','folded-trunk',[8,-105],[
  ['M-8 -105 L2 -113 L16 -114 L30 -107 L42 -96 L63 -90 L78 -78 L64 -80 L48 -78 L33 -88 L19 -93 L7 -98 L-3 -94 Z','cloth'],
  ['M-5 -106 L5 -111 L15 -110 L28 -103 L42 -93 L57 -88 L38 -89 L27 -96 L16 -100 L4 -104 Z','light'],
  ['M31 -96 L46 -102 L67 -104 L90 -99 L107 -96 L112 -87 L101 -90 L91 -88 L70 -93 L55 -90 L42 -90 Z','cloth'],
  ['M52 -97 L69 -101 L91 -98 L103 -94 L90 -94 L68 -95 Z','light',null,0,1],
 ]),
 p('bowed-head','folded-trunk',[20,-115],[
  ['M11 -113 L13 -129 L23 -138 L33 -136 L39 -129 L38 -118 L36 -111 L27 -107 L22 -107 Z','char','rim',.95],
  ['M11 -121 L18 -130 L25 -132 L36 -132 L40 -124 L36 -119 L26 -124 L17 -119 Z','cloth'],
  ['M24 -138 L28 -143 L32 -141 L34 -135 L25 -134 Z','shadow'],
  ['M16 -126 L27 -130 L35 -128 L38 -125 L27 -126 Z','light',null,0,1],
 ]),
 p('low-hand','folded-trunk',[-19,-86],[
  ['M-19 -88 L-12 -87 L-7 -73 L-9 -57 L3 -43 L2 -39 L-9 -40 L-17 -52 L-17 -64 L-24 -78 Z','shadow'],
  ['M-10 -42 L-6 -39 L2 -39 L8 -34 L4 -33 L-4 -35 L-8 -36 Z','rim'],
 ]),
 ],
 clips:{
   idle:clip(2.2,[['mourning-cloth','rotate',[[0,0],[.48,-7],[1,0]]],['bowed-head','rotate',[[0,0],[.6,4],[1,0]]]]),
   move:clip(.86,[['trailing-leg','scaleX',[[0,1],[.5,.7],[1,1]]],['front-leg','scaleX',[[0,.9],[.5,1.12],[1,.9]]]]),
   attack:clip(1,[['last-print','scaleX',[[0,1],[.45,1.65],[.62,1.7],[1,1]]],['folded-trunk','rotate',[[0,0],[.43,-9],[.65,12],[1,0]]],['mourning-cloth','rotate',[[0,0],[.44,-9],[.67,6],[1,0]]]])
 }
};
export const ferryman={
 id:'a6-boatless-oar',baseHeight:105,viewBox:[-202,-115,389,125],budget:'monster-handoff',
 palette:{night:'#152025',wood:'#3f3730',rim:'#7c6e58',cloth:'#8c9283',paper:'#c0c0a5',shade:'#464f49',wake:'#8fb2a1',water:'#647d82'},
 parts:[
 root(),
 p('wake','root',[0,-5],[
  ['M-191 -1 L-151 -11 L-135 -6 L-105 -12 L-86 -5 L-47 -10 L-34 -4 L-7 -6 L13 -1 L-32 -1 L-80 -2 L-117 -3 Z','water'],
  ['M-172 -5 L-149 -11 L-135 -8 L-151 -5 Z','wake'],
  ['M-111 -6 L-91 -12 L-78 -9 L-86 -6 Z','wake',null,0,1],
 ]),
 p('bent-oar','root',[4,-53],[
  ['M-177 -48 L-161 -55 L-123 -72 L-106 -71 L-80 -66 L-49 -65 L-11 -63 L31 -68 L66 -70 L95 -63 L120 -65 L132 -59 L143 -52 L169 -49 L178 -35 L169 -20 L149 -29 L131 -39 L123 -50 L93 -52 L58 -58 L28 -56 L1 -52 L-36 -54 L-76 -55 L-110 -60 L-126 -55 L-166 -43 Z','night'],
  ['M-167 -48 L-126 -66 L-109 -68 L-79 -62 L-43 -61 L-4 -59 L30 -64 L63 -66 L91 -59 L119 -60 L130 -54 L140 -47 L165 -44 L173 -35 L166 -28 L151 -34 L135 -42 L125 -52 L92 -54 L64 -61 L27 -59 L-6 -54 L-52 -55 L-82 -57 L-109 -62 L-127 -61 Z','wood'],
  ['M-172 -49 L-127 -67 L-108 -69 L-64 -62 L-27 -61 L0 -60 L63 -66 L94 -60 L120 -62 L137 -52 L134 -49 L117 -58 L95 -56 L62 -63 L21 -59 L-26 -58 L-68 -59 L-109 -65 L-127 -64 Z','rim'],
  ['M137 -48 L153 -44 L167 -43 L171 -35 L164 -31 L151 -35 L141 -41 Z','shade',null,0,1]
 ]),
 p('shroud','root',[-106,-73],[
  ['M-171 -63 L-155 -86 L-139 -95 L-115 -103 L-99 -97 L-93 -89 L-80 -89 L-68 -81 L-59 -78 L-42 -79 L-25 -73 L-41 -65 L-66 -66 L-58 -56 L-82 -58 L-74 -44 L-97 -48 L-93 -32 L-114 -39 L-122 -23 L-136 -32 L-147 -24 L-154 -38 L-166 -33 L-160 -48 L-174 -45 Z','shade'],
  ['M-164 -63 L-152 -84 L-136 -94 L-115 -99 L-103 -95 L-94 -85 L-79 -85 L-69 -77 L-58 -75 L-42 -75 L-28 -73 L-44 -67 L-68 -69 L-83 -68 L-75 -58 L-100 -62 L-97 -46 L-115 -48 L-124 -37 L-130 -51 L-147 -47 L-143 -61 L-155 -55 Z','cloth'],
  ['M-163 -61 L-150 -85 L-134 -94 L-117 -99 L-106 -94 L-122 -93 L-136 -85 L-143 -72 L-149 -58 L-151 -64 Z','paper'],
  ['M-117 -82 L-108 -92 L-96 -85 L-85 -86 L-78 -82 L-102 -83 L-111 -73 Z','paper',null,0,1],
  ['M-139 -48 L-132 -56 L-121 -52 L-119 -44 L-124 -39 L-132 -50 Z','rim',null,0,1]
 ]),
 p('side-drip','root',[-116,-30],[
  ['M-120 -22 L-106 -24 L-100 -20 L-111 -18 L-121 -19 Z','wake'],
  ['M-137 -22 L-134 -23 L-125 -20 L-127 -17 L-137 -18 Z','wake'],
 ]),
 ],
 clips:{
  idle:clip(2.1,[['shroud','rotate',[[0,0],[.45,-4],[1,0]]],['side-drip','x',[[0,0],[.5,5],[1,0]]]]),
  move:clip(1.17,[['bent-oar','rotate',[[0,0],[.48,2],[1,0]]],['wake','scaleX',[[0,1],[.55,1.07],[1,1]]]]),
  attack:clip(1,[['bent-oar','rotate',[[0,0],[.34,-7],[.64,7],[1,0]]],['side-drip','scaleX',[[0,1],[.36,1.7],[.63,1.9],[1,1]]],['shroud','rotate',[[0,0],[.4,3],[.64,-7],[1,0]]]])
 }
};
export const assets=Object.fromEntries([retraceMourner,ferryman].map(a=>[a.id,a]));
