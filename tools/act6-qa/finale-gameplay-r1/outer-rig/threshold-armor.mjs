// Act6 bridge specialization. Separate look, separate stock-contact behavior.
// To be attached only by the 6-9 actor adapter. This asset has no gameplay authority.
const part=(id,parent,pivot,paths)=>({id,parent,pivot,paths:paths.map(([d,fill,stroke=null,width=0,lod=0])=>({d,fill,stroke,width,lod}))});
const clip=(duration,tracks)=>({duration,tracks:tracks.map(([part,channel,keys])=>({part,channel,keys}))});
export const armor={
 id:'a6-threshold-armor',
 baseHeight:167,viewBox:[-102,-179,189,190],budget:'monster-handoff',
 palette:{body:'#27363c',black:'#151d20',rock:'#465560',edge:'#788381',old:'#8d8874',rust:'#83554b',ink:'#342e35',bone:'#bbac8f',pale:'#c9bea0',paper:'#ae9969'},
 parts:[
 part('root',null,[0,0],[]),
 part('rear-stilt','root',[24,-72],[
  ['M 26 -95 L 44 -97 L 51 -73 Q 35 -42 38 -20 L 49 -13 L 48 -4 L 24 -7 L 20 -26 L 26 -53 Z','black'],
  ['M 44 -66 L 31 -39 L 26 -45 L 31 -74 Z','rock'],
  ['M 30 -47 L 27 -26 L 31 -11 L 22 -13 L 21 -29 L 24 -48 Z','edge',null,0,1],
 ]),
 part('case','root',[0,-96],[
  ['M -58 -111 L -42 -145 L -16 -158 L 5 -156 L 24 -140 L 46 -135 L 55 -111 L 47 -66 L 34 -49 L 1 -62 L -24 -42 L -40 -59 Z','black','edge',1.4],
  ['M -58 -110 L -42 -142 L -19 -154 L 0 -151 L -1 -138 L -18 -132 L -29 -107 L -28 -70 L -43 -57 L -52 -75 Z','rock'],
  ['M -52 -107 L -40 -135 L -20 -148 L -14 -143 L -33 -130 L -40 -105 L -39 -81 L -48 -80 Z','edge'],
  ['M 3 -151 L 20 -145 L 31 -134 L 46 -129 L 52 -110 L 44 -74 L 36 -62 L 29 -72 L 36 -103 L 31 -115 L 14 -117 L 3 -135 Z','rock'],
  ['M 20 -134 L 30 -123 L 40 -121 L 44 -113 L 39 -107 L 31 -116 L 17 -116 L 10 -130 Z','old'],
  ['M -24 -53 L 4 -72 L 33 -62 L 39 -70 L 34 -84 L 8 -93 L -11 -78 Z','ink'],
  ['M -14 -127 Q 0 -136 13 -124 L 20 -110 L 14 -82 L 3 -72 L -14 -85 L -19 -114 Z','black'],
  ['M -11 -133 Q -7 -128 -5 -126 L -10 -117 L -15 -120 Z','paper',null,0,1],
  ['M 10 -100 L 12 -97 L 9 -90 L 4 -90 L 8 -94 Z','rust',null,0,1],
  ['M -20 -83 L -10 -77 L -13 -67 L -20 -67 Z','old'],
 ]),
 part('portcullis','root',[-36,-95],[
  ['M -63 -102 L -46 -126 L -32 -119 L -22 -112 L -21 -94 L -30 -72 L -35 -62 L -47 -49 L -68 -73 Z','black','edge',1.5],
  ['M -64 -100 L -52 -115 L -40 -121 L -49 -100 L -63 -87 Z','rock'],
  ['M -41 -115 L -31 -107 L -28 -97 L -38 -69 L -46 -57 L -59 -71 L -63 -84 L -49 -96 Z','body'],
  ['M -61 -90 L -51 -98 L -46 -96 L -49 -82 L -55 -73 L -59 -78 Z','old'],
  ['M -42 -109 L -36 -105 L -37 -93 L -43 -90 L -47 -98 Z','bone'],
  ['M -50 -77 L -40 -82 L -39 -77 L -47 -67 Z','rust'],
  ['M -50 -62 L -45 -59 L -48 -54 L -54 -57 Z','pale',null,0,1]
 ]),
 part('front-stilt','root',[-21,-72],[
  ['M -31 -73 L -7 -80 L -3 -61 L -15 -39 L -10 -25 L -20 -7 L -32 -1 L -48 -2 L -47 -9 L -35 -12 L -26 -39 L -32 -51 Z','black'],
  ['M -30 -65 L -15 -68 L -8 -59 L -16 -43 L -21 -44 L -27 -55 Z','rock'],
  ['M -24 -46 L -18 -46 L -19 -32 L -26 -17 L -31 -15 L -29 -29 Z','edge'],
 ]),
 part('ribbon','case',[37,-132],[
  ['M 36 -140 Q 49 -149 62 -153 L 64 -148 L 51 -140 L 54 -135 L 47 -138 L 39 -130 Z','rust'],
  ['M 44 -147 Q 53 -154 61 -154 L 59 -151 L 48 -144 Z','paper',null,0,1],
 ]),
 part('hoof-silt','root',[0,-3],[
  ['M -58 -2 L -42 -5 L -30 -3 L -17 -7 L -5 -3 L 2 -6 L 20 -4 L 32 -6 L 46 -3 L 57 -5 L 48 1 L 25 2 L -17 2 L -48 1 Z','ink']
 ])
 ],
 clips:{
  idle:clip(2.9,[['ribbon','rotate',[[0,-5],[.34,5],[.71,-1],[1,-5]]],['portcullis','rotate',[[0,-2],[.53,2],[1,-2]]]]),
  move:clip(1.25,[['front-stilt','rotate',[[0,-6],[.45,10],[1,-6]]],['rear-stilt','rotate',[[0,8],[.5,-7],[1,8]]],['case','y',[[0,0],[.5,-3],[1,0]]]]),
  attack:clip(1.4,[['portcullis','rotate',[[0,0],[.3,35],[.61,-26],[1,-2]]],['portcullis','x',[[0,0],[.34,13],[.63,-15],[1,0]]],['case','rotate',[[0,0],[.29,9],[.7,-6],[1,0]]],['ribbon','rotate',[[0,-5],[.34,14],[.64,-15],[1,-5]]]])
 }
};
export const assets={[armor.id]:armor};
