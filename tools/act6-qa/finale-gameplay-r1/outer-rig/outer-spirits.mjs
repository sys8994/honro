// Native VectorParts candidate: scoped isolated drawing only. Never registers a unit or collision.
function part(id,parent,pivot,paths){return {id,parent,pivot,paths:paths.map(([d,fill,stroke=null,width=0,lod=0])=>({d,fill,stroke,width,lod}))}}
const anim=(duration,tracks=[])=>({duration,tracks:tracks.map(([part,channel,keys])=>({part,channel,keys}))});
export const directSpirit={
 id:'a6-ch-embodied-grief',baseHeight:116,viewBox:[-76,-128,164,137],budget:'monster-handoff',
 palette:{far:'#374342',ink:'#15272c',body:'#56716e',hem:'#869b89',light:'#b1b9a2',curse:'#d9c2a2',wear:'#798071'},
 parts:[
 part('root',null,[0,0],[]),
 part('back-tatter','root',[-17,-48],[
  ['M-10 -93 C-22 -89 -47 -74 -45 -61 L-67 -42 L-48 -44 L-58 -26 L-33 -37 L-22 -53 Z','far'],
  ['M-26 -55 L-40 -45 L-45 -32 L-31 -39 Z','wear',null,0,1],
 ]),
 part('trail-legs','root',[-6,-35],[
  ['M-18 -44 L8 -46 L29 -20 L20 -2 L6 0 L-1 -4 L12 -13 L-2 -26 L-13 -10 L-24 -2 L-44 -1 L-45 -7 L-26 -12 L-19 -24 L-32 -19 L-40 -5 L-59 -3 L-60 -8 L-43 -17 Z','ink'],
  ['M-37 -16 L-49 -10 L-57 -8 L-44 -8 Z','hem'],
  ['M13 -12 L20 -23 L23 -19 L17 -6 L9 -4 Z','body']
 ]),
 part('fold','root',[1,-47],[
  ['M-39 -61 C-35 -79 -29 -99 -8 -111 L14 -112 L27 -99 L27 -92 L47 -90 L50 -81 L31 -78 L27 -68 L18 -69 L23 -56 L14 -45 L-5 -39 L-24 -43 Z','ink'],
  ['M-34 -61 C-30 -81 -23 -98 -8 -106 L10 -106 L24 -96 L22 -91 L10 -94 L1 -83 L-12 -79 L-15 -68 L-2 -61 L20 -59 L15 -49 L-3 -44 L-23 -48 Z','body'],
  ['M-20 -84 C-14 -96 -3 -104 8 -103 L21 -96 L14 -99 L0 -93 L-10 -83 Z','hem'],
  ['M-2 -84 C5 -91 13 -91 17 -90 L23 -84 L14 -80 L11 -72 L-1 -69 L-10 -73 Z','ink'],
  ['M-2 -83 L8 -89 L13 -87 L12 -85 L5 -85 Z','light',null,0,1],
  ['M-28 -56 L-17 -58 L-8 -50 L-19 -51 Z','light',null,0,1]
 ]),
 part('leading-arm','fold',[18,-65],[
  ['M16 -76 L34 -67 L42 -70 L49 -63 L63 -66 L75 -59 L61 -57 L72 -53 L70 -50 L57 -53 L63 -47 L56 -44 L43 -49 L36 -55 L26 -55 L18 -62 Z','ink'],
  ['M22 -71 L37 -62 L49 -64 L56 -60 L46 -60 L40 -55 L30 -57 Z','hem'],
 ]),
 part('pulled-thread','leading-arm',[60,-58],[
  ['M64 -65 L74 -72 L80 -72 L83 -69 L76 -68 L72 -65 Z','curse'],
  ['M60 -54 L68 -50 L76 -50 L84 -54','', 'curse',1.5,1]
 ]),
 ],
 clips:{
  idle:anim(2.1,[['fold','y',[[0,0],[0.5,-2],[1,0]]],['leading-arm','rotate',[[0,0],[.5,-4],[1,0]]]]),
  move:anim(.74,[['trail-legs','scaleX',[[0,1],[.3,.84],[.7,1.12],[1,1]]],['back-tatter','rotate',[[0,0],[.42,-14],[1,0]]],['fold','rotate',[[0,0],[.4,8],[.75,-1],[1,0]]]]),
  attack:anim(1,[['fold','rotate',[[0,0],[.38,-15],[.7,16],[1,0]]],['leading-arm','rotate',[[0,0],[.38,-18],[.68,18],[1,0]]],['leading-arm','x',[[0,0],[.4,-5],[.7,13],[1,0]]],['pulled-thread','scaleX',[[0,1],[.4,1],[.66,1.4],[1,1]]]]),
  hit:anim(.35,[])
 }
};
export const departingSpirit={
 id:'a6-departing-soul-far',baseHeight:108,viewBox:[-34,-115,74,118],budget:'a6-non-target-far',
 palette:{ink:'#64706d',mid:'#82958d',cloth:'#a1a79a',top:'#b4b8a9'},
 parts:[
 part('root',null,[0,0],[]),
 part('walk-shade','root',[1,-32],[
  ['M-15 -43 L14 -41 L17 -12 L20 -1 L12 0 L8 -10 L5 -22 L-2 -24 L-8 -10 L-13 -1 L-22 -1 L-20 -7 L-12 -22 Z','ink'],
 ]),
 part('cloth','root',[0,-42],[
  ['M-7 -94 L5 -95 L10 -86 C18 -79 21 -68 25 -52 L18 -45 L13 -46 L19 -36 L12 -30 L-14 -31 L-17 -44 L-21 -45 L-20 -62 L-14 -82 Z','mid'],
  ['M-4 -85 L4 -89 L11 -77 L9 -53 L13 -35 L4 -31 L-5 -37 L-1 -56 Z','cloth'],
  ['M-5 -106 C0 -110 7 -106 8 -101 L7 -91 L0 -89 L-6 -93 L-6 -99 Z','top'],
  ['M4 -89 L12 -79 L19 -57 L16 -50 L13 -54 L10 -70 Z','cloth']
 ]),
 ],
 clips:{idle:anim(3,[['cloth','rotate',[[0,0],[.5,1],[1,0]]]]),
 move:anim(1.2,[['walk-shade','scaleX',[[0,1],[.5,.5],[1,1]]],['cloth','rotate',[[0,-1],[.5,2],[1,-1]]]])}
};
export const assets=Object.fromEntries([directSpirit,departingSpirit].map(a=>[a.id,a]));
