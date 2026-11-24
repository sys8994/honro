// ORIGINAL ACT6 REVIEW SILHOUETTES. No automatic registration or hit-region authority.
// The Daedosa remains human; the distant architectonic shadow is a separate effect.
const p=(id,parent,pivot,paths)=>({id,parent,pivot,paths:paths.map(([d,fill,stroke=null,width=0,lod=0])=>({d,fill,stroke,width,lod}))});
const animate=(duration,tracks)=>({duration,tracks:tracks.map(([part,channel,keys])=>({part,channel,keys}))});
export const daedosa={
 id:'a6-daedosa-human-study',baseHeight:151,viewBox:[-85,-165,175,172],budget:'monster-handoff',
 palette:{ink:'#191c25',shadow:'#272833',robe:'#3d414a',edge:'#595c60',dust:'#6d635a',hemp:'#bbb19a',skin:'#a48569',nose:'#c8a481',red:'#794942',black:'#171822',staff:'#584738',tip:'#af8771'},
 parts:[
 p('root',null,[0,0],[]),
 p('rearfoot','root',[16,-34],[
  ['M 8 -45 L 27 -41 L 25 -9 L 35 -6 L 30 0 L 7 -1 Z','ink'],
  ['M 16 -30 L 23 -34 L 21 -8 L 15 -7 Z','hemp']
 ]),
 p('forefoot','root',[-13,-34],[
  ['M -22 -43 L -4 -40 L -5 -16 L -8 -6 L -24 1 L -32 -2 L -28 -7 L -20 -12 Z','black'],
  ['M -17 -27 L -11 -29 L -15 -11 L -21 -8 Z','hemp']
 ]),
 p('coat','root',[0,-88],[
  ['M -17 -119 Q -37 -111 -32 -94 L -29 -65 L -32 -35 L -39 -12 L -17 -8 L 1 -12 L 17 -5 L 40 -13 Q 25 -44 26 -65 Q 35 -86 26 -110 L 12 -120 Z','ink','black',1.1],
  ['M -23 -110 Q -27 -96 -17 -86 L -14 -68 L -27 -34 L -35 -16 L -20 -11 L -8 -25 L 1 -62 L -4 -91 L -10 -111 Z','robe'],
  ['M 7 -109 L 2 -85 L 12 -66 L 10 -43 L 17 -14 L 24 -9 L 34 -14 L 26 -41 L 21 -69 L 31 -90 L 23 -108 Z','shadow'],
  ['M -1 -112 Q -10 -98 -9 -79 L -3 -67 L 5 -78 L 15 -111 L 8 -117 Z','hemp'],
  ['M -13 -109 L -7 -115 L 4 -104 L 1 -99 Z','dust'],
  ['M -11 -74 Q 6 -78 23 -77 L 23 -71 Q 10 -69 -11 -68 Z','black'],
  ['M -11 -71 L 11 -76 L 15 -74 L 4 -69 L 2 -58 L -1 -59 L -1 -68 Z','red'],
  ['M -5 -44 Q -14 -22 -14 -14 L -17 -15 L -12 -45 Z','edge',null,0,1],
  ['M 20 -52 L 24 -19 L 21 -21 L 16 -48 Z','edge',null,0,1]
 ]),
 p('head','root',[1,-120],[
  ['M -9 -125 L -10 -139 Q 1 -151 18 -133 L 20 -126 L 18 -122 L 23 -116 L 18 -114 L 16 -108 L 8 -105 L 1 -110 L -7 -116 Z','skin'],
  ['M 2 -126 L 15 -127 L 20 -121 L 17 -115 L 12 -114 L 9 -123 Z','nose'],
  ['M 6 -110 Q 11 -108 15 -112 L 19 -112 Q 18 -105 13 -101 L 6 -94 L 4 -101 Z','black'],
  ['M -25 -137 Q -16 -142 -12 -144 L -10 -153 L 1 -156 L 13 -155 L 15 -144 Q 31 -141 40 -136 L 37 -133 L 16 -135 L -19 -133 L -35 -134 Z','black','edge',.8],
  ['M -10 -146 L 13 -146 L 14 -143 Q 1 -139 -11 -142 Z','dust'],
  ['M -21 -135 L -28 -128 L -23 -120 L -27 -115 L -31 -123 L -27 -132 Z','ink'],
  ['M 10 -125 L 16 -125 L 13 -122 Z','ink',null,0,1]
 ]),
 p('sleeve','root',[8,-109],[
  ['M 13 -113 Q 32 -114 34 -104 L 44 -88 L 35 -72 L 19 -68 L 16 -79 L 25 -87 L 16 -95 Z','shadow'],
  ['M 20 -107 L 31 -104 L 37 -91 L 27 -90 L 18 -97 Z','robe'],
  ['M 25 -83 L 34 -88 L 37 -84 L 32 -74 L 22 -72 Z','hemp'],
  ['M 32 -81 L 44 -82 L 49 -78 L 45 -74 L 35 -76 L 29 -76 Z','skin'],
 ]),
 p('split-staff','sleeve',[44,-76],[
  ['M 45 -4 L 42 -92 L 43 -129 L 50 -134 L 54 -130 L 47 -119 L 47 -82 L 49 -6 Z','staff','black',.9],
  ['M 44 -123 L 42 -129 L 49 -137 L 52 -136 L 50 -129 L 55 -128 L 52 -124 Z','tip'],
  ['M 42 -90 L 48 -91 L 49 -86 L 44 -84 Z','hemp']
 ]),
 p('binding','root',[0,-46],[
  ['M -37 -14 Q -19 -6 5 -9 Q 20 -9 34 -17 L 34 -13 Q 15 -3 0 -5 Q -25 -4 -38 -11 Z','red'],
  ['M -25 -6 L -21 -4 L -17 1 L -24 0 Z','hemp'],
 ]),
 ],
 clips:{
  idle:animate(3.5,[['coat','rotate',[[0,0],[.56,1],[1,0]]],['head','rotate',[[0,0],[.45,-2],[1,0]]]]),
  move:animate(1.42,[['forefoot','rotate',[[0,4],[.5,-5],[1,4]]],['rearfoot','rotate',[[0,-6],[.45,6],[1,-6]]]]),
  attack:animate(1.5,[['sleeve','rotate',[[0,0],[.33,-18],[.58,-39],[.83,8],[1,0]]],['coat','rotate',[[0,0],[.35,-2],[.61,2],[1,0]]]])
 }
};
export const seal={
 id:'a6-expansion-seal-study',baseHeight:120,viewBox:[-65,-129,139,139],budget:'monster-handoff',
 palette:{shade:'#222934',edge:'#646562',rock:'#48525a',pale:'#b5a087',red:'#a76454',hemp:'#d0ba95',ash:'#938679'},
 parts:[
 p('root',null,[0,0],[]),
 p('foundation','root',[0,-5],[
  ['M -56 -6 L -39 -16 L -26 -14 L -17 -21 L 22 -21 L 38 -15 L 51 -7 L 58 -1 L -56 2 Z','shade','edge',1.1],
  ['M -49 -7 L -28 -10 L -19 -16 L 21 -18 L 37 -13 L 45 -7 L 24 -4 L -13 -4 Z','edge'],
  ['M -18 -7 L -2 -11 L 16 -11 L 22 -7 L 16 -5 L -4 -5 Z','ash']
 ]),
 p('opening','root',[5,-56],[
  ['M -24 -7 L -38 -31 Q -42 -59 -23 -81 L -9 -97 L -14 -113 L 14 -121 L 23 -115 L 16 -93 Q 8 -81 13 -65 L 34 -51 L 29 -21 L 10 -8 Z','shade','edge',1.4],
  ['M -26 -18 L -35 -40 Q -39 -58 -27 -72 L -19 -81 L -13 -79 L -20 -58 L -20 -46 L -12 -31 L -6 -16 Z','rock'],
  ['M -11 -40 Q -5 -63 -13 -75 Q -4 -100 8 -102 L 7 -91 Q 1 -74 7 -56 Q 13 -53 16 -46 L 13 -40 L 4 -48 L 1 -52 L -4 -36 Z','red'],
  ['M -13 -109 L 14 -119 L 16 -115 L -10 -106 Z','ash'],
  ['M 20 -47 L 26 -41 L 23 -26 L 14 -19 L 11 -22 L 19 -34 Z','edge'],
  ['M -23 -67 L -27 -59 L -24 -56 L -18 -63 Z','hemp']
 ]),
 p('tags','opening',[18,-73],[
  ['M 11 -72 L 30 -76 L 39 -70 L 37 -65 L 31 -68 L 17 -62 Z','pale'],
  ['M 30 -69 L 33 -67 L 30 -64 L 26 -67 Z','red',null,0,1],
  ['M -13 -86 L -28 -89 L -39 -84 L -36 -79 L -25 -81 L -15 -78 Z','ash'],
 ]),
 ],
 clips:{idle:animate(2.4,[['tags','rotate',[[0,-2],[.52,4],[1,-2]]]]),attack:animate(1,[['opening','rotate',[[0,0],[.45,-6],[1,0]]],['tags','scaleX',[[0,1],[.45,1.14],[1,1]]]])}
};
export const assets={[daedosa.id]:daedosa,[seal.id]:seal};
