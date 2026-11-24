// Act6 original native vector art. Empty name slots make this a register, not a reskinned soldier.
// The authority for damage, modes and contact lives in the encounter adapter, not this render asset.
const part=(id,parent,pivot,paths)=>({id,parent,pivot,paths:paths.map(([d,fill,stroke=null,width=0,lod=0])=>({d,fill,stroke,width,lod}))});
const anim=(duration, tracks)=>({duration,tracks:tracks.map(([part,channel,keys])=>({part,channel,keys}))});
export const ledger={
 id:'a6-unsettled-ledger',baseHeight:155,viewBox:[-94,-164,199,188],budget:'monster-handoff',
 palette:{void:'#171823',ink:'#33313e',edge:'#5e576d',paper:'#a8a187',face:'#d8cfaa',light:'#eee1ae',wax:'#9b5649',violet:'#887398',shadow:'#252a37',mote:'#b3a1b9'},
 parts:[
  part('root',null,[0,0],[]),
  part('foldward','root',[2,-91],[
   ['M -54 -110 Q -75 -95 -59 -73 Q -33 -45 -5 -27 Q 43 -42 64 -77 L 51 -109 Q 17 -98 -6 -134 Z','void','edge',1.3],
   ['M -45 -117 L -18 -133 L -6 -148 Q 20 -114 57 -117 L 64 -103 L 52 -91 Q 25 -91 -6 -124 L -23 -110 Z','shadow'],
   ['M -51 -109 Q -34 -109 -26 -121 L -7 -129 Q 21 -107 46 -104 L 42 -95 Q 12 -100 -8 -114 Q -24 -102 -46 -101 Z','edge'],
   ['M -50 -103 L -67 -88 L -62 -73 L -37 -49 L -15 -37 L 5 -44 L -1 -60 L -20 -70 L -25 -81 Z','ink'],
   ['M -57 -89 L -39 -74 L -17 -55 L -6 -57 L -24 -74 L -31 -83 L -47 -97 Z','paper'],
   ['M 22 -100 Q 38 -94 47 -106 L 59 -95 L 61 -80 L 46 -63 L 35 -70 L 42 -84 Z','violet'],
   ['M 48 -89 L 50 -80 L 40 -70 L 36 -69 L 41 -86 Z','light'],
   ['M -10 -104 Q 14 -115 29 -97 Q 42 -82 18 -64 Q 5 -55 -5 -63 Q 7 -88 -10 -104 Z','void'],
  ]),
  part('names','foldward',[-9,-94],[
   ['M -57 -107 Q -33 -106 -9 -97 Q 15 -92 21 -68 L 17 -59 Q 10 -61 0 -64 Q -13 -72 -26 -74 Q -37 -80 -54 -78 L -60 -89 Z','ink','void',1],
   ['M -60 -111 L -58 -86 Q -40 -90 -27 -81 Q -8 -79 14 -64 L 12 -72 Q 3 -90 -7 -93 Q -35 -107 -60 -111 Z','paper'],
   ['M -61 -118 Q -32 -117 -8 -100 Q 1 -94 4 -82 Q -19 -96 -59 -95 L -62 -107 Z','face'],
   ['M -55 -112 Q -41 -108 -32 -106 L -34 -102 Q -48 -108 -54 -107 Z','edge'],
   ['M -28 -104 Q -19 -102 -12 -98 L -13 -94 Q -20 -97 -27 -99 Z','edge'],
   ['M -45 -105 L -46 -100 L -59 -102 L -57 -105 Z','wax'],
   ['M -31 -98 L -33 -95 L -40 -96 L -41 -99 Z','wax'],
   ['M -10 -92 Q 0 -87 4 -82 L 2 -85 L -11 -89 Z','light',null,0,1],
  ]),
  part('rightVacancy','foldward',[42,-91],[
   ['M 22 -112 Q 42 -117 62 -126 L 68 -114 L 64 -98 L 56 -93 L 55 -102 L 62 -115 L 56 -118 Q 41 -109 31 -109 Z','face'],
   ['M 58 -88 L 70 -109 L 72 -134 L 79 -129 L 79 -111 L 69 -89 L 61 -85 Z','edge'],
   ['M 78 -123 L 82 -116 L 78 -107 L 77 -119 Z','mote',null,0,1],
   ['M 19 -101 Q 29 -101 32 -97 L 27 -94 Z','light'],
  ]),
  part('weight','root',[5,-62],[
   ['M 2 -64 Q 18 -51 23 -32 Q 28 -10 13 -6 Q 0 -24 -4 -36 Z','void','edge',1.6],
   ['M 7 -50 Q 18 -36 18 -25 L 15 -17 Q 9 -25 6 -33 Z','ink'],
   ['M 6 -28 L 11 -29 L 17 -18 L 13 -12 Z','violet'],
   ['M 7 -48 L 9 -44 L 11 -48 L 6 -52 Z','mote',null,0,1],
  ]),
  part('lostPaper','root',[-58,-62],[
   ['M -78 -62 Q -63 -68 -54 -60 L -51 -52 L -61 -54 L -68 -49 L -75 -53 Z','edge'],
   ['M -77 -64 L -70 -64 L -63 -59 L -65 -56 L -73 -58 Z','paper'],
   ['M -77 -44 L -68 -41 L -74 -38 Z','violet',null,0,1],
   ['M 69 -56 L 76 -64 L 77 -60 L 74 -52 Z','paper',null,0,1],
  ]),
  part('anchorSmoke','root',[10,-13],[
   ['M 11 -13 Q 35 -7 26 -4 L 12 -6 L 7 -1 L 2 -3 L -9 3 L -18 -1 L -1 -6 Z','ink'],
   ['M -16 5 L -8 3 L -8 6 L -15 8 Z','edge'],
  ])
 ],
 clips:{
  idle:anim(2.5,[['names','rotate',[[0,2],[.42,-4],[1,2]]],['weight','rotate',[[0,-6],[.46,6],[1,-6]]],['lostPaper','y',[[0,0],[.48,-5],[1,0]]]]),
  move:anim(1.15,[['root','scaleX',[[0,1],[.48,.86],[1,1]]],['foldward','rotate',[[0,-5],[.55,4],[1,-5]]]]),
  attack:anim(1.08,[['rightVacancy','rotate',[[0,1],[.36,12],[.62,8],[1,1]]],['weight','rotate',[[0,-8],[.36,28],[.64,-15],[1,-8]]],['names','scaleX',[[0,1],[.38,.8],[.68,1.12],[1,1]]],['lostPaper','x',[[0,1],[.44,-10],[.68,-15],[1,1]]]]),
 }
};
export const assets={[ledger.id]:ledger};
export const marginEcho={
 id:'a6-margin-echo',baseHeight:152,viewBox:[-76,-166,175,184],budget:'monster-handoff',
 palette:{void:'#171923',line:'#575765',split:'#867682',ash:'#b39c86',paper:'#d7c5a1',wax:'#984c44'},
 parts:[
  part('root',null,[0,0],[]),
  part('loop','root',[6,-90],[
   ['M -8 -148 Q 37 -137 41 -111 Q 47 -77 14 -57 Q -3 -46 -17 -68 Q -33 -91 -7 -105 Q 6 -113 17 -106 Q 24 -98 13 -87 Q -2 -82 2 -70 Q 33 -81 31 -103 Q 33 -126 -11 -139 Z','void','line',1.8],
   ['M -11 -139 Q 27 -132 35 -111 L 36 -103 Q 20 -130 -13 -133 Z','ash'],
   ['M 13 -57 Q -2 -51 -11 -69 Q -26 -88 -6 -98 L 5 -95 Q -14 -82 -1 -65 Z','split'],
   ['M 19 -106 L 24 -102 L 18 -96 L 12 -96 Z','paper'],
  ]),
  part('verdict','loop',[11,-78],[
   ['M 20 -105 Q 33 -101 54 -106 L 68 -102 L 57 -96 L 65 -92 L 45 -93 L 27 -87 L 14 -89 Z','void'],
   ['M 21 -100 Q 37 -96 49 -102 L 60 -102 L 53 -98 L 39 -94 L 19 -94 Z','paper'],
   ['M 12 -93 L 24 -94 L 27 -88 L 14 -86 Z','wax'],
   ['M 44 -91 L 57 -92 L 59 -88 L 50 -85 Z','split',null,0,1],
  ]),
  part('ink','root',[8,-53],[
   ['M -3 -66 Q 31 -48 13 -23 L 7 -28 L 4 -39 L -10 -47 Z','void','line',1],
   ['M 5 -51 L 13 -46 L 16 -36 L 7 -40 Z','split'],
   ['M 9 -23 L 11 -14 L 7 -10 L 5 -15 Z','ash'],
   ['M 5 -2 L 16 -4 L 21 0 L 1 3 L -11 3 Z','line'],
  ])
 ],
 clips:{
  idle:anim(2.8,[['loop','rotate',[[0,-3],[.5,6],[1,-3]]],['verdict','x',[[0,0],[.55,5],[1,0]]]]),
  attack:anim(1.01,[['verdict','scaleX',[[0,1],[.32,1.38],[.67,.7],[1,1]]],['loop','rotate',[[0,0],[.33,-15],[.66,12],[1,0]]],['ink','rotate',[[0,0],[.34,23],[.66,-10],[1,0]]]])
 }
};
assets[marginEcho.id]=marginEcho;
