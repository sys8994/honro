// Original editable vector rig. Its open hoop is not a collider or a separate weakpoint.
const p=(id,parent,pivot,paths)=>({id,parent,pivot,paths:paths.map(([d,fill,stroke=null,width=0,lod=0])=>({d,fill,stroke,width,lod}))});
const clip=(duration,tracks)=>({duration,tracks:tracks.map(([part,channel,keys])=>({part,channel,keys}))});
export const emptyBell={
 id:'a6-empty-bell-gate',baseHeight:101,viewBox:[-49,-104,99,110],budget:'monster-handoff',
 palette:{wood:'#283037',face:'#51473e',thin:'#7e6250',rust:'#795044',gold:'#c9a86e',edge:'#97794f',hemp:'#e0c7a3',red:'#a46457',cinnabar:'#c47c64',dust:'#a6a297',pitch:'#1c242a'},
 parts:[
  p('root',null,[0,0],[]),
  p('left-stilt','root',[-29,-73],[
   ['M -30 -80 L -19 -78 -23 -54 -26 -35 -27 -15 -29 -4 -40 0 -44 -2 -38 -12 -38 -42 Z','wood','pitch',1.7],
   ['M -31 -63 L -27 -61 -31 -24 -33 -20 -34 -43 Z','face'],
   ['M -37 -23 L -29 -25 -29 -20 -37 -17 Z','red'],
   ['M -42 -5 L -34 -10 -35 -6 -41 -2 Z','thin',null,0,1]
  ]),
  p('right-stilt','root',[30,-73],[
   ['M 21 -80 L 31 -84 34 -67 36 -49 37 -34 39 -13 46 -2 35 1 27 -8 25 -17 23 -50 Z','pitch','wood',1.5],
   ['M 26 -81 L 32 -78 33 -60 30 -49 28 -53 28 -68 Z','face'],
   ['M 30 -31 L 37 -33 38 -28 31 -25 Z','red'],
   ['M 35 -17 L 39 -13 44 -4 38 -5 Z','thin',null,0,1]
  ]),
  p('split-arch','root',[0,-79],[
   ['M -45 -82 L -35 -95 -28 -95 -29 -91 -12 -99 -4 -91 -23 -87 -35 -78 -43 -76 Z','wood','pitch',1.4],
   ['M 0 -92 L 22 -96 38 -91 48 -80 43 -76 27 -83 7 -84 Z','wood','pitch',1.5],
   ['M -38 -86 L -23 -91 -20 -88 -34 -82 Z M 9 -89 L 26 -91 38 -87 42 -83 30 -86 11 -86 Z','face'],
   ['M -23 -89 L -20 -91 -17 -83 -20 -82 Z M 28 -90 L 31 -90 31 -84 28 -84 Z','red']
  ]),
  p('suspension','root',[0,-76],[
   ['M -25 -86 L -17 -73 -12 -66 -16 -63 -22 -72 Z M 28 -85 L 16 -67 11 -66 24 -86 Z','thin'],
   ['M -27 -85 L -22 -89 -17 -85 -22 -82 Z M 21 -86 L 25 -91 30 -86 26 -83 Z','edge']
  ]),
  p('hoop','suspension',[0,-50],[
   // Two separate curved metal branches leave both the central opening and bottom gap truly unpainted.
   ['M -4 -76 C -20 -78 -28 -64 -28 -49 C -30 -37 -26 -28 -15 -22 L -10 -27 C -20 -32 -22 -40 -20 -50 C -20 -59 -14 -68 -5 -69 L 1 -72 Z','edge','pitch',1.2],
   ['M 4 -75 C 18 -76 28 -63 28 -49 C 30 -35 23 -24 13 -20 L 10 -26 C 19 -31 22 -39 20 -49 C 20 -58 14 -66 6 -68 Z','edge','pitch',1.2],
   ['M -27 -52 C -25 -66 -17 -75 -7 -75 L -8 -71 C -17 -69 -22 -61 -23 -54 Z M 8 -74 C 18 -73 24 -67 27 -56 L 23 -55 C 19 -64 14 -69 8 -70 Z','gold'],
   ['M -14 -24 L -11 -27 -8 -24 -13 -18 Z M 9 -25 L 13 -21 11 -15 7 -20 Z','rust'],
   ['M -26 -46 L -22 -46 -22 -43 -26 -42 Z M 23 -57 L 26 -56 26 -52 23 -53 Z','hemp',null,0,1]
  ]),
  p('left-paper','left-stilt',[-35,-58],[
   ['M -37 -56 L -31 -55 -32 -45 -41 -37 -40 -47 Z','hemp'],
   ['M -37 -51 L -35 -52 -36 -45 -39 -44 Z','cinnabar']
  ]),
  p('right-paper','right-stilt',[35,-67],[
   ['M 33 -66 L 39 -65 43 -49 38 -52 36 -47 34 -58 Z','dust'],
   ['M 37 -63 L 39 -62 41 -55 38 -56 Z','red']
  ])
 ],
 clips:{
  idle:clip(4.1,[['hoop','rotate',[[0,-.9],[.49,1.3],[1,-.9]]],['right-paper','rotate',[[0,0],[.35,6],[.68,-3],[1,0]]]]),
  move:clip(.86,[['left-stilt','rotate',[[0,6],[.5,-6],[1,6]]],['right-stilt','rotate',[[0,-6],[.50,7],[1,-6]]]]),
  attack:clip(1.2,[['hoop','rotate',[[0,0],[.29,-12],[.58,12],[.78,-4],[1,0]]],['suspension','scaleY',[[0,1],[.33,1.14],[.60,.89],[1,1]]],['left-paper','rotate',[[0,0],[.58,-20],[1,0]]]])
 }
};
export const assets={[emptyBell.id]:emptyBell};
