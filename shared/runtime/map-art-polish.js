(function(G){'use strict';
// Scenery only: no terrain, collision, interaction, or save-state mutations.
const Scene=G.HonroScene,D=G.honroDraw,{P,L,E}=D;
const oldBackground=Scene.prototype.background,oldLandmark=Scene.prototype.landmark;
function line(c,pts,color,width=1){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function fill(c,pts,color,edge){P(c,pts,color,edge||null,edge?1:0);}
function roof(c,w,y,depth,broken=false){
  // Restrained Korean giwa eaves: a long ridge and shallow, weighty overhang.
  fill(c,[[-w*.58,y+8],[-w*.47,y-4],[-w*.27,y-depth*.73],[0,y-depth],[w*.27,y-depth*.73],[w*.47,y-4],[w*.58,y+8],[w*.43,y+3],[0,y-depth*.68],[-w*.43,y+3]],broken?'#343936':'#283638','#65746d');
  line(c,[[-w*.58,y+8],[-w*.40,y+5],[0,y-depth*.67],[w*.40,y+5],[w*.58,y+8]],'#9a947c',2.4);
  line(c,[[-w*.23,y-depth*.78],[0,y-depth*.95],[w*.23,y-depth*.78]],'#8b8c78',1.4);
  for(let i=-4;i<=4;i++){const x=i*w*.104;line(c,[[x,y-depth*(.61-.19*Math.abs(i)/4)],[x*1.08,y+1]],i%2?'#71807899':'#9b9c8666',.85);}
  if(broken)for(const x of[-w*.28,w*.36])line(c,[[x,y-depth*.47],[x+7,y-depth*.25],[x-1,y-depth*.13]],'#191f20',2);
}
function hall(c,w=220,h=170,kind='hall'){
  const burned=kind==='burned',store=kind==='store',shrine=kind==='shrine';
  fill(c,[[-w*.51,0],[w*.51,0],[w*.56,9],[-w*.56,9]],'#505951','#8e8f79');
  fill(c,[[-w*.47,-h*.62],[w*.47,-h*.62],[w*.45,0],[-w*.45,0]],burned?'#282e2c':'#3a4741','#222d2d');
  fill(c,[[-w*.36,-h*.53],[w*.36,-h*.53],[w*.36,-7],[-w*.36,-7]],burned?'#1b2525':'#202f31');
  for(const i of[-2,-1,0,1,2]){const x=i*w*.20;L(c,x,-h*.61,x,0,burned?'#4d433b':'#6d6653',i%2?5:7);L(c,x+2,-h*.55,x+2,-4,'#9a8b6b55',1);}
  for(const i of[-1,0,1]){const x=i*w*.205;fill(c,[[x-w*.078,-h*.49],[x+w*.078,-h*.49],[x+w*.078,-9],[x-w*.078,-9]],burned?'#1c2424':store?'#4a493a':'#4c5a53');
    for(const yy of[-h*.37,-h*.25,-h*.13])L(c,x-w*.078,yy,x+w*.078,yy,'#a19b806a',1.2);
    L(c,x,-h*.49,x,-9,'#a4997566',1);}
  L(c,-w*.44,-h*.60,w*.44,-h*.60,'#8a8066',4);
  roof(c,w,-h*.62,h*.35,burned);
  if(shrine){fill(c,[[-w*.13,-h*.58],[w*.13,-h*.58],[w*.11,-h*.48],[-w*.11,-h*.48]],'#514936','#9f8b67');line(c,[[-w*.08,-h*.53],[w*.08,-h*.53]],'#b3a07a',1.3);}
  if(burned){for(const x of[-w*.37,w*.27])line(c,[[x,-h*.58],[x+10,-h*.82],[x+7,-h*.98]],'#4b4038',3);}
}
function gate(c,kind){
  const royal=kind==='royalGate',funeral=kind==='funeralGate',wide=royal?290:240;
  fill(c,[[-wide*.57,0],[wide*.57,0],[wide*.60,10],[-wide*.60,10]],'#535b51','#9c9b83');
  for(const side of[-1,1]){
    const x=side*wide*.37;
    fill(c,[[x-side*25,0],[x-side*24,-138],[x+side*18,-143],[x+side*25,0]],'#4d574f','#252f2c');
    for(const yy of[-27,-63,-99])L(c,x-side*18,yy,x+side*18,yy,'#9a9a8170',1.3);
    L(c,x-side*25,-145,x+side*25,-145,'#857b62',4);
  }
  fill(c,[[-wide*.20,0],[-wide*.20,-123],[wide*.20,-123],[wide*.20,0]],'#111e22','#647066');
  for(const side of[-1,1]){const x=side*wide*.13;L(c,x,-118,x,-4,'#564e3e',4);for(const yy of[-27,-62,-97])L(c,x-side*wide*.07,yy,x+side*wide*.04,yy,'#897f6688',1);}
  roof(c,wide,-145,66);
  fill(c,[[-46,-149],[46,-149],[42,-132],[-42,-132]],'#342d2a','#a39771');
  if(funeral){for(const x of[-94,94]){fill(c,[[x-9,-128],[x+9,-128],[x+6,-43],[x-7,-48]],'#8c81717a');line(c,[[x,-117],[x,-65]],'#a3937766');}}
  if(royal)for(const x of[-108,108])line(c,[[x,-150],[x,-12]],'#957d624d',2);
  if(!royal){
    // Village boundary guardians and a bird pole, kept stern and weathered.
    for(const side of[-1,1]){
      const x=side*wide*.66;
      fill(c,[[x-10,0],[x-12,-79],[x-7,-110],[x+8,-114],[x+12,-78],[x+10,0]],'#514b3b','#a59673');
      line(c,[[x-8,-91],[x-2,-95]],'#222b29',2.2);
      line(c,[[x+2,-95],[x+9,-91]],'#222b29',2.2);
      line(c,[[x,-88],[x-3,-75],[x+3,-74]],'#252d29',1.5);
      line(c,[[x-4,-66],[x+4,-66]],'#292c28',1.8);
      line(c,[[x-8,-43],[x+7,-43]],'#b6a98066',1.2);
    }
    const sx=wide*.86;L(c,sx,0,sx,-173,'#554d3a',3.5);
    fill(c,[[sx-16,-172],[sx+8,-176],[sx+22,-169],[sx+9,-164],[sx-10,-165]],'#5e5b4b');
    line(c,[[sx+17,-169],[sx+29,-166]],'#a49878',1);
  }
}
function stone(c,kind){
  const receiver=kind==='receiverStone';
  fill(c,[[-56,0],[-49,-94],[-35,-132],[19,-139],[46,-105],[54,0]],receiver?'#4d5d58':'#4d5652','#242e30');
  fill(c,[[-35,-126],[17,-131],[36,-96],[23,-25],[-30,-32]],'#69736a88');
  line(c,[[-31,-23],[-24,-58],[-28,-87],[-18,-109]],'#242e2d',2.5);
  line(c,[[14,-128],[3,-93],[9,-72],[-2,-42]],'#b2ae8966',1.3);
  if(receiver){line(c,[[-18,-84],[14,-86],[21,-69],[10,-57],[-13,-58],[-18,-84]],'#b6a98688',2);line(c,[[-13,-69],[10,-70]],'#a4966e',1.4);}
}
function dais(c){
  fill(c,[[-175,0],[-146,-27],[145,-27],[175,0]],'#4c5651','#8c8e77');
  fill(c,[[-147,-27],[-115,-51],[115,-51],[147,-27]],'#687066','#9b9d83');
  fill(c,[[-115,-51],[-80,-65],[80,-65],[115,-51]],'#464f4b','#92947b');
  for(const x of[-110,-55,0,55,110])line(c,[[x,-50],[x*.75,-29]],'#273532',1.3);
  for(const x of[-132,-67,67,132]){line(c,[[x,-27],[x+8,-5]],'#252f2f',1.5);}
  fill(c,[[-32,-65],[-20,-91],[20,-91],[32,-65]],'#65685d','#b0aa87');
  line(c,[[-15,-78],[15,-78]],'#292d2a',2);
  for(const x of[-116,116]){
    fill(c,[[x-12,-51],[x-10,-85],[x-4,-94],[x+9,-89],[x+13,-51]],'#4d5650','#a2a187');
    line(c,[[x-5,-71],[x+6,-71]],'#242f2c',1.4);
  }
  c.beginPath();c.ellipse(0,-53,58,9,0,0,Math.PI*2);c.strokeStyle='#b5aa8355';c.lineWidth=2;c.stroke();
}
function incense(c){
  fill(c,[[-105,0],[-88,-25],[88,-25],[105,0]],'#4a514b','#93947b');
  for(const x of[-72,72])stonePost(c,x,-25,68);
  fill(c,[[-40,-25],[-35,-45],[35,-45],[40,-25]],'#494439','#9a8d6c');
  for(const x of[-12,0,12]){L(c,x,-45,x,-79,'#786a4e',2);line(c,[[x,-80],[x+7,-93],[x+2,-103]],'#b6ac8d66',1.5);}
}
function stonePost(c,x,y,h){fill(c,[[x-11,y],[x-13,y-h*.7],[x-6,y-h],[x+9,y-h*.91],[x+13,y]],'#555b54','#93917b');line(c,[[x-6,y-h*.58],[x+6,y-h*.60]],'#262e2b',1.3);}
function rootHut(c){
  fill(c,[[-102,0],[-92,-68],[-68,-91],[69,-91],[91,-69],[102,0]],'#3e443b','#202c2b');
  fill(c,[[-64,-13],[-61,-70],[61,-70],[63,-13]],'#1c292a');
  for(const x of[-42,0,42])L(c,x,-70,x,-14,'#736950',4);
  fill(c,[[-123,-72],[-84,-110],[-21,-122],[77,-112],[123,-72],[70,-81],[0,-96],[-74,-81]],'#574d3b','#83785b');
  for(const x of[-91,-62,-33,-4,25,54,83])L(c,x,-83,x+12,-108,'#9b89665c',1.2);
  line(c,[[-101,-6],[-126,6],[-150,10]],'#3b3f34',9);
}
function pine(c){
  fill(c,[[-25,5],[-18,-112],[-7,-249],[18,-414],[34,-515],[43,-528],[31,-416],[18,-251],[25,5]],'#423f34','#81745a');
  line(c,[[4,-95],[-102,-122],[-186,-108],[-245,-91]],'#464537',15);
  line(c,[[11,-245],[-93,-281],[-167,-267],[-219,-250]],'#464537',13);
  line(c,[[27,-425],[111,-451],[176,-439],[236,-410]],'#464537',13);
  for(const [x,y,w] of[[-204,-121,62],[-158,-273,70],[-87,-290,87],[118,-450,86],[205,-424,63],[37,-512,87],[-25,-485,61]]){
    fill(c,[[x-w,y+12],[x-w*.88,y-3],[x-w*.56,y-12],[x-w*.42,y-26],[x-w*.16,y-20],[x+w*.08,y-32],[x+w*.40,y-17],[x+w*.73,y-13],[x+w,y+7],[x+w*.54,y+18],[x-w*.22,y+17]],'#2d4135','#586e5a');
    line(c,[[x-w*.71,y+3],[x-w*.20,y-5],[x+w*.61,y+6]],'#82907663',1.1);
  }
  for(const side of[-1,1])line(c,[[side*11,-4],[side*74,17],[side*125,23]],'#413d31',11);
  line(c,[[-8,-22],[-3,-155],[8,-292],[29,-449]],'#95846177',2);
}
function placeDetail(c,l){
  c.save();c.translate(l.x,l.y);const w=l.width||180,h=l.height||120;
  if(l.feature==='terrace'){
    fill(c,[[-w*.52,-8],[w*.52,-8],[w*.49,h*.76],[w*.43,h],[-w*.43,h],[-w*.49,h*.76]],'#303b38','#526359');
    line(c,[[-w*.53,-12],[w*.53,-12]],'#777d6d',2);
    for(let x=-w*.44;x<w*.46;x+=Math.max(45,w/8))line(c,[[x,4],[x+8,h*.43],[x-5,h*.83]],'#25342f89',1.2);
    line(c,[[-w*.49,h*.47],[w*.49,h*.47]],'#9c9a804a',1);
  }else if(l.feature==='buttress'){
    fill(c,[[-w*.33,-h],[-w*.49,-h*.92],[-w*.53,-h*.39],[-w*.73,0],[w*.72,0],[w*.49,-h*.41],[w*.47,-h*.91],[w*.33,-h]],'#414b46','#27332f');
    fill(c,[[-w*.25,-h*.93],[-w*.12,-h*.14],[w*.35,0],[w*.11,-h*.88]],'#67716555');
    const course=Math.max(54,h/13);
    for(let row=0,y=-h*.93;y<0;y+=course,row++){
      const spread=w*(.35+.15*(y+h)/h),offset=row%2?spread*.38:0;
      line(c,[[-spread,y],[spread,y+4]],'#a5a58b73',1.4);
      for(let x=-spread+offset;x<spread;x+=w*.40)line(c,[[x,y],[x+3,y+course*.67]],'#273731b0',1.2);
    }
    line(c,[[-w*.5,-h*.42],[w*.51,-h*.49]],'#283831',2);
    line(c,[[-w*.3,-h*.89],[-w*.12,-h*.79],[-w*.18,-h*.64]],'#a1a18a62',1.1);
  }else if(l.feature==='trestle'){
    for(const x of[-w*.32,w*.32]){L(c,x,-h,x,0,'#524b3b',9);line(c,[[x-4,-h],[x+3,0]],'#92826788',1.3);}
    line(c,[[-w*.42,-h],[w*.43,-h]],'#8c7b5f',8);
    line(c,[[-w*.33,-h*.79],[w*.33,-h*.17]],'#6b5d47',6);
    line(c,[[w*.33,-h*.79],[-w*.33,-h*.17]],'#6b5d47',6);
  }else if(l.feature==='ferryWalk'){
    const deck=-h;
    for(const x of[-w*.38,w*.38]){
      line(c,[[x,0],[x,deck-42]],'#3b3e35',10);
      line(c,[[x-3,-8],[x-3,deck-42]],'#887b6070',1.3);
      line(c,[[x,deck-25],[x*.23,deck+20]],'#625844',5);
    }
    line(c,[[-w*.47,deck+12],[w*.47,deck+17]],'#73674c',6);
    line(c,[[-w*.47,deck-18],[-w*.16,deck-5],[w*.18,deck-10],[w*.47,deck-22]],'#8f826454',2);
    for(const x of[-w*.38,0,w*.38])line(c,[[x,deck+10],[x+7,deck-48]],'#5a5141',3);
    line(c,[[-w*.40,deck-45],[0,deck-54],[w*.40,deck-44]],'#7970578a',2);
  }else if(l.feature==='charredGallery'){
    for(const x of[-w*.36,w*.34]){
      line(c,[[x,0],[x-8,-h-31]],'#312e2b',13);
      line(c,[[x+3,-9],[x-5,-h-29]],'#81705a52',1.4);
      line(c,[[x,-h*.30],[x*.18,-h*.86]],'#494039',6);
    }
    line(c,[[-w*.46,-h+13],[w*.47,-h+17]],'#463b31',7);
    line(c,[[-w*.43,-h-14],[-w*.06,-h-25],[w*.22,-h-20],[w*.45,-h-31]],'#8069518f',2);
    for(const x of[-w*.43,w*.45])line(c,[[x,-h-14],[x+(x<0?-8:10),-h-48],[x+(x<0?-5:13),-h-70]],'#3c342e',3);
  }else if(l.feature==='rockFace'){
    const p=l.vertices||[];if(p.length>2){fill(c,p,'#263936','#596c60');
      for(let i=1;i<p.length-2;i+=2){const [x,y]=p[i];
        fill(c,[[x,y],[x+46,y+67],[x+29,y+194],[x-28,y+131]],'#45584b59');
        line(c,[[x,y],[x+35,y+75],[x+15,y+145]],'#8a938066',1.4);
      }
      for(let i=2;i<p.length-2;i+=3){const [x,y]=p[i];line(c,[[x-35,y+62],[x+21,y+49],[x+9,y+124]],'#182d2b75',2);}
    }
  }else if(l.feature==='waterRun'){
    const p=l.trace||[];if(p.length>1){line(c,p,'#263f45',w*.69);line(c,p,'#5e888982',w*.42);line(c,p.map(([x,y])=>[x,y-4]),'#b9cebf87',2);}
  }else if(l.feature==='bridgeRigging'){
    const p=l.trace||[];if(p.length>1){line(c,p,'#403d31',6);line(c,p.map(([x,y])=>[x,y-5]),'#99876a91',1.4);
      for(let i=1;i<p.length-1;i++){const[x,y]=p[i];line(c,[[x,y],[x+16,y+140]],'#655943',2.5);}}
  }
  c.restore();
}
function drawSpecial(c,l){const k=l.kind;if(!k)return false;
  if(k==='placeDetail'){placeDetail(c,l);return true;}
  const types=['oldGate','funeralGate','royalGate','oldHall','upperShrine','cliffShrine','warehouse','burnedHouses','watchtower','receiverStone','ritualDais','incenseYard','gravePosts','bierRest','rootHut','hollowRoot','rootShrine','waterShrine','spiritKnot','waterfall','brokenBridge','bridgePillar','giantPine'];
  if(!types.includes(k))return false;
  c.save();c.translate(l.x,l.y);c.scale(l.size||1,l.size||1);
  if(k.endsWith('Gate'))gate(c,k);
  else if(k==='oldHall'||k==='upperShrine'||k==='cliffShrine')hall(c,k==='upperShrine'?310:240,k==='upperShrine'?205:175,'shrine');
  else if(k==='warehouse')hall(c,290,190,'store');
  else if(k==='burnedHouses'){c.save();c.translate(-90,0);hall(c,170,135,'burned');c.restore();c.save();c.translate(95,6);hall(c,150,125,'burned');c.restore();}
  else if(k==='watchtower'){for(const x of[-53,53])L(c,x,0,x,-181,'#554e3d',8);line(c,[[-53,-18],[53,-159]],'#6b5f49',5);line(c,[[53,-18],[-53,-159]],'#6b5f49',5);fill(c,[[-75,-171],[75,-171],[68,-212],[-68,-212]],'#343c36','#887e62');for(const x of[-48,-16,16,48])L(c,x,-172,x,-206,'#887759',3);roof(c,200,-210,62);}
  else if(k==='receiverStone')stone(c,k);
  else if(k==='ritualDais')dais(c);
  else if(k==='incenseYard')incense(c);
  else if(k==='gravePosts'){for(const x of[-84,-28,30,88])stonePost(c,x,(x%3)*3,75+(x%4)*8);}
  else if(k==='bierRest'){dais(c);fill(c,[[-77,-70],[-57,-108],[57,-108],[77,-70]],'#4d453b','#8c8066');for(const x of[-70,70])L(c,x,-70,x,-11,'#6d5c46',5);}
  else if(k==='rootHut')rootHut(c);
  else if(k==='hollowRoot'){line(c,[[-118,5],[-79,-111],[-48,-174],[-10,-211],[41,-188],[81,-124],[119,5]],'#3d3f32',36);line(c,[[-74,-27],[-45,-87],[-9,-125],[29,-108],[72,-18]],'#191f20',19);for(const x of[-70,70])line(c,[[x,0],[x*1.6,18]],'#4d4837',12);}
  else if(k==='rootShrine'){pine(c);c.save();c.translate(-4,0);hall(c,138,108,'shrine');c.restore();}
  else if(k==='waterShrine'){fill(c,[[-72,0],[72,0],[62,-18],[-62,-18]],'#586159','#9e9f83');for(const x of[-42,42])stonePost(c,x,-18,55);fill(c,[[-31,-18],[-25,-64],[25,-64],[31,-18]],'#293b3a','#9a9b7f');roof(c,145,-68,43);line(c,[[-18,-36],[18,-36]],'#8fa59b',2);}
  else if(k==='spiritKnot'){stone(c,k);for(const x of[-34,34])line(c,[[x,-40],[x*.5,-85],[x*.2,-132]],'#665c54',3);line(c,[[-21,-93],[18,-105],[36,-90]],'#986660',3);}
  else if(k==='waterfall'){const h=(l.drop||196*(l.size||1))/(l.size||1);fill(c,[[-95,0],[-71,-h*.47],[-50,-h*.87],[-29,-h],[30,-h],[62,-h*.80],[82,-h*.37],[105,0]],'#3b4b49','#78847b');fill(c,[[-38,-h],[9,-h],[28,-h*.62],[38,-h*.28],[53,0],[-48,0],[-41,-h*.42]],'#506f7188');for(const x of[-25,-4,17,38])line(c,[[x,-h*.97],[x+4,-h*.52],[x-4,-10]],'#c1d1c163',2);for(const x of[-32,0,32])line(c,[[x-17,-4],[x,-10],[x+18,-3]],'#afc5b683',1.2);}
  else if(k==='brokenBridge'){fill(c,[[-140,-13],[-60,-20],[-26,-10],[-12,0],[-139,0]],'#4d4b3d','#8a8067');fill(c,[[21,-7],[49,-19],[140,-14],[140,0],[23,0]],'#4d4b3d','#8a8067');for(const x of[-120,-70,62,119])L(c,x,0,x,45,'#5b503e',5);}
  else if(k==='bridgePillar'){fill(c,[[-22,0],[-25,-90],[-15,-110],[16,-110],[25,-90],[22,0]],'#505e59','#899184');line(c,[[-17,-86],[13,-86]],'#263631',1.6);line(c,[[-11,-47],[18,-51]],'#263631',1.3);}
  else if(k==='giantPine')pine(c);
  c.restore();return true;
}
Scene.prototype.landmark=function(c,l){if(!drawSpecial(c,l))oldLandmark.call(this,c,l);};
function ridge(c,w,h,seed,level,color,edge){
  const points=[[-80,h+30]];const step=150;
  for(let i=-1;i<=Math.ceil(w/step)+1;i++){const x=i*step-(this.x*(.012+level*.017))%step;
    const n=Math.sin((i+seed)*1.63)*.55+Math.sin((i+seed)*.73)*.34;
    const y=h*(.30+level*.105)+n*h*(.035+level*.006);
    points.push([x-53,y+18],[x-24,y-7],[x+19,y-15],[x+66,y+8]);
  }
  points.push([w+80,h+30]);fill(c,points,color);
  for(let i=0;i<6;i++){const x=(i*269+seed*71)%w,y=h*(.36+level*.10);line(c,[[x,y],[x+44,y-8],[x+75,y-6]],edge,1.1);}
}
const forestNoise=n=>{const v=Math.sin(n*12.9898+37.719)*43758.5453;return v-Math.floor(v);};
// distance=0 shares the playable world's zoom; Infinity is fixed to the sky.
// A nearby backdrop tree has a smaller distance than a far ridge or cloud.
function depthZoom(zoom,distance){const ratio=Math.max(.16,Math.min(1.65,zoom))/.66;return 1+(ratio-1)/(1+distance);}
function depthPan(camera,distance){return camera*.055/(1+distance*.22);}
function forestTree(c,x,ground,height,seed,trunk,crown,near=false){
  const lean=(forestNoise(seed+11)-.5)*height*.11,tw=near?Math.max(6,height*.018):Math.max(3,height*.012);
  fill(c,[[x-tw,ground],[x-tw*.8+lean*.36,ground-height*.58],[x+lean-tw*.28,ground-height],[x+lean+tw*.25,ground-height],[x+tw*.85+lean*.36,ground-height*.58],[x+tw,ground]],trunk);
  if(near)line(c,[[x-tw*.5,ground-height*.06],[x+lean*.47-tw*.4,ground-height*.61],[x+lean,ground-height*.93]],'#7d89713d',1.2);
  const branches=near?9:7;
  for(let j=0;j<branches;j++){
    const t=.31+j*(near?.074:.087),by=ground-height*t,bx=x+lean*t,side=j%2?-1:1;
    const reach=height*(.16+forestNoise(seed+j*17)*.11)*(1-t*.39),tip=bx+side*reach,ty=by-height*(.035+forestNoise(seed+j*19)*.04);
    line(c,[[bx,by],[bx+side*reach*.48,by-height*.025],[tip,ty]],trunk,Math.max(3,tw*(.48-t*.22)));
    const branchSpread=height*(near?.042:.037);
    for(let k=0;k<3;k++){
      const p=.48+k*.23,cx=bx+side*reach*p;
      const spread=branchSpread*(.78+forestNoise(seed+j*31+k*7)*.45);
      const cy=by+(ty-by)*p-height*.014+(forestNoise(seed+j*13+k*19)-.5)*height*.014;
      fill(c,[[cx-spread*.95,cy+height*.008],[cx-spread*.69,cy-height*.015],[cx-spread*.42,cy-height*.026],[cx-spread*.13,cy-height*.037],[cx+spread*.20,cy-height*.031],[cx+spread*.59,cy-height*.018],[cx+spread*.89,cy+height*.005],[cx+spread*.30,cy+height*.022],[cx-spread*.49,cy+height*.017]],crown);
      if(near&&k===2)line(c,[[cx-spread*.62,cy-height*.012],[cx+spread*.12,cy-height*.029]],'#7787731f',.8);
    }
  }
  const tipX=x+lean,tipY=ground-height,spread=height*(near?.13:.11);
  line(c,[[tipX,tipY+height*.035],[tipX-spread*.50,tipY-height*.006],[tipX-spread*.82,tipY+height*.004]],trunk,Math.max(2,tw*.28));
  line(c,[[tipX,tipY+height*.031],[tipX+spread*.55,tipY-height*.003],[tipX+spread*.90,tipY+height*.010]],trunk,Math.max(2,tw*.25));
  fill(c,[[tipX-spread*.93,tipY+height*.023],[tipX-spread*.79,tipY-height*.003],[tipX-spread*.47,tipY-height*.022],[tipX-spread*.12,tipY-height*.030],[tipX+spread*.24,tipY-height*.019],[tipX+spread*.59,tipY-height*.020],[tipX+spread*.90,tipY+height*.011],[tipX+spread*.54,tipY+height*.039],[tipX-spread*.40,tipY+height*.045]],crown);
}
function forestBareTree(c,x,ground,height,seed,trunk){
  const lean=(forestNoise(seed+11)-.5)*height*.12,tw=Math.max(3,height*.013);
  fill(c,[[x-tw,ground],[x-tw*.8+lean*.55,ground-height*.58],[x+lean-tw*.30,ground-height],[x+lean+tw*.25,ground-height],[x+tw*.8+lean*.55,ground-height*.58],[x+tw,ground]],trunk);
  for(let j=0;j<7;j++){
    const t=.30+j*.095,side=j%2?-1:1,bx=x+lean*t,by=ground-height*t;
    const reach=height*(.14+forestNoise(seed+j*13)*.12)*(1-t*.42),tip=bx+side*reach,ty=by-height*(.07+forestNoise(seed+j*7)*.07);
    line(c,[[bx,by],[bx+side*reach*.44,by-height*.025],[tip,ty]],trunk,Math.max(1.4,tw*(.56-t*.31)));
    line(c,[[bx+side*reach*.57,by-height*.046],[bx+side*reach*.68,by-height*.10],[bx+side*reach*.72,by-height*.17]],trunk,Math.max(1,tw*.19));
    line(c,[[bx+side*reach*.75,by-height*.072],[bx+side*reach*.97,by-height*.13]],trunk,Math.max(1,tw*.14));
  }
  if(height>170)line(c,[[x,ground-height*.18],[x+lean*.58,ground-height*.67],[x+lean,ground-height*.96]],'#79736732',1.1);
}
function forestBackground(c,w,h,stage,camera){
  const gate=stage===4,g=c.createLinearGradient(0,0,0,h);
  g.addColorStop(0,gate?'#091118':'#07151b');g.addColorStop(.53,gate?'#182329':'#142a2d');g.addColorStop(1,gate?'#26302c':'#20352f');c.fillStyle=g;c.fillRect(0,0,w,h);
  // A muted moon belongs behind the canopy and passing cloud bands.
  // Match the renderer's cached-background shift so bucket changes cannot
  // make trunks, clouds or the moon jump by a different parallax amount.
  const moonDistance=Infinity,mx=w*.75-depthPan(camera,moonDistance),my=h*.18;
  const halo=c.createRadialGradient(mx,my,5,mx,my,h*.24);halo.addColorStop(0,'#acb3a01c');halo.addColorStop(1,'#acb3a000');c.fillStyle=halo;c.fillRect(mx-h*.24,my-h*.24,h*.48,h*.48);
  const moonSize=h*.034*depthZoom(this.scale,moonDistance);E(c,mx,my,moonSize,moonSize,'#b2b6a432');
  for(let k=0;k<3;k++){
    const drift=depthPan(camera,24),cy=h*(.15+k*.095);
    for(let i=Math.floor(drift/360)-2;i<Math.ceil((drift+w)/360)+2;i++){
      const x=i*360-drift+forestNoise(i*7+k*31)*55;
      fill(c,[[x-95,cy+15],[x-38,cy-10],[x+33,cy-21],[x+132,cy-7],[x+255,cy-2],[x+335,cy+19],[x+197,cy+28],[x+54,cy+24]],k===0?'#101d249c':'#17252a77');
    }
  }
  const layers=[
    {distance:1.9,step:68,base:.91,lo:.36,hi:.25,opacity:.43,trunk:'#474642',crown:'#444c48'},
    {distance:.95,step:100,base:1.03,lo:.48,hi:.24,opacity:.57,trunk:'#413f3a',crown:gate?'#41433e':'#3d4a43'},
    {distance:.48,step:142,base:1.13,lo:.57,hi:.27,opacity:.69,trunk:gate?'#383633':'#3c3a35',crown:gate?'#353b35':'#34443b'}
  ];
  for(let layer=0;layer<layers.length;layer++){
    const q=layers[layer],size=depthZoom(this.scale,q.distance),step=q.step*size,pan=depthPan(camera,q.distance),start=Math.floor(pan/step)-2,end=Math.ceil((pan+w)/step)+2;
    c.save();c.globalAlpha=q.opacity;
    for(let i=start;i<=end;i++){
      const seed=i*23+layer*109+stage*7,x=i*step-pan+(forestNoise(seed+1)-.5)*step*.5;
      const height=h*(q.lo+forestNoise(seed+3)*q.hi)*size,base=h*q.base+(forestNoise(seed+5)-.5)*h*.09;
      const bare=forestNoise(seed+8)<(gate?(layer===2 ? .47 : .27):(layer===2 ? .24 : .13));
      if(bare)forestBareTree(c,x,base,height,seed,gate?'#55504a':'#4e4b44');
      else forestTree(c,x,base,height,seed,q.trunk,q.crown,layer===2);
    }
    c.restore();
  }
  const mist=c.createLinearGradient(0,h*.55,0,h);mist.addColorStop(0,'#a0aea000');mist.addColorStop(.60,gate?'#817d7222':'#829c9b20');mist.addColorStop(1,'#14262463');c.fillStyle=mist;c.fillRect(0,h*.55,w,h*.45);
}
Scene.prototype.background=function(c,w,h,b){
  const stage=b?.honroStage||0,kind=this.theme;
  if(stage===3||stage===4){forestBackground.call(this,c,w,h,stage,this.x);return;}
  oldBackground.call(this,c,w,h,b);
  // A shallow second set of fractured Korean mountain ridges breaks up the
  // repeated rounded horizon without competing with readable combat terrain.
  c.save();c.globalAlpha=(stage===5||stage===6)?.57:.50;
  ridge.call(this,c,w,h,stage+5,0,'#243439','#677d7860');
  if(stage!==5&&stage!==6){ridge.call(this,c,w,h,stage+17,1,kind==='shrine'?'#303337':'#293b3b','#82918a54');ridge.call(this,c,w,h,stage+29,2,'#213331','#627d7350');}
  c.restore();
  if(stage===5||stage===6){c.save();c.globalAlpha=.20;for(let i=0;i<3;i++){const x=w*(.14+i*.33)-(this.x*.035)%55;line(c,[[x,h*.75],[x+37,h*.66],[x+76,h*.68],[x+130,h*.57]],'#9baaa0',2);}c.restore();}
};
Scene.prototype.liveWater=function(c,b){
  if(b?.honroStage!==3)return;
  const z=b.honroSurfaceZones?.find(q=>q.id==='ferry-water'&&q.kind==='water-pool');
  if(!z?.surface?.length||!z.points?.length)return;
  const left=z.surface[0][0],right=z.surface.at(-1)[0],top=z.surface[0][1];
  const visible=this.canvas.clientWidth/Math.max(.16,this.scale),lo=this.x-visible*.5-120,hi=this.x+visible*.5+120;
  if(right<lo||left>hi)return;
  const reduced=G.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const t=reduced?1.2:this.time,phase=t*78*(z.flowDirection===-1?-1:1);
  c.save();
  c.beginPath();c.moveTo(left,top+2);
  for(let x=left+36;x<right;x+=36){
    const u=(x-left)/(right-left),envelope=Math.sin(Math.PI*u)**2;
    const lift=envelope*(Math.sin(x*.026-t*2.7)*2.8+Math.sin(x*.061+t*1.4)*1.1);
    c.lineTo(x,top+1+lift);
  }
  c.lineTo(right,top+2);c.lineTo(right,top+9);c.lineTo(left,top+9);c.closePath();
  c.fillStyle='#376369a9';c.fill();
  c.beginPath();c.moveTo(left,top+2);
  for(let x=left+36;x<right;x+=36){const u=(x-left)/(right-left),envelope=Math.sin(Math.PI*u)**2;
    c.lineTo(x,top+1+envelope*(Math.sin(x*.026-t*2.7)*2.8+Math.sin(x*.061+t*1.4)*1.1));}
  c.lineTo(right,top+2);c.strokeStyle='#a7bdac7c';c.lineWidth=1.5;c.stroke();
  c.beginPath();z.points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.clip();
  // Long, broken strokes reveal direction without redrawing the whole pool.
  for(let band=0;band<3;band++){
    const y=top+6+band*13,flow=band===0?1:.78;
    c.beginPath();c.moveTo(left+10,y+2);
    for(let x=left+10;x<right+120;x+=90){
      const bend=Math.sin(x*.017+band*1.7)*2.7+Math.sin(x*.031+band)*1.2;
      c.quadraticCurveTo(x+43,y+bend-3,x+90,y+bend*.55+1);
    }
    c.setLineDash(band===0?[48,72,12,53]:[86,95,22,77]);c.lineDashOffset=-phase*flow-band*47;
    c.strokeStyle=band===0?'#c0cdb07d':band===1?'#96b8ad69':'#709f9c63';c.lineWidth=band===0?2.4:band===1?3.4:4.2;c.stroke();
  }
  c.setLineDash([]);
  for(let i=0;i<8;i++){
    const span=right-left+180,x=left-90+((i*181+phase*(.75+(i%3)*.12))%span);
    const y=top+9+(i%3)*12,len=60+(i%4)*22;
    c.beginPath();c.moveTo(x,y);
    c.quadraticCurveTo(x+len*.38,y-4,x+len,y-1);
    c.quadraticCurveTo(x+len*.76,y+2,x+len*.50,y+4);
    c.quadraticCurveTo(x+len*.22,y+3,x,y);c.closePath();
    c.fillStyle=i%3?'#91b5ad38':'#b7c6ad4a';c.fill();
  }
  // Current parts around the two dock piles, then joins again downstream.
  for(const [i,x] of[2250,2890].entries()){
    const breathe=Math.sin(t*2.4+i*1.7)*3;
    c.beginPath();c.ellipse(x-21,top+11,31+breathe,5.6,-.12,Math.PI*.15,Math.PI*1.35);
    c.strokeStyle='#c1d1b480';c.lineWidth=2.3;c.stroke();
    c.beginPath();c.ellipse(x+29,top+21,43,7.5,.08,-Math.PI*.35,Math.PI*.52);
    c.strokeStyle='#a5c4b96e';c.lineWidth=2.2;c.stroke();
  }
  // Individual moonlit flecks drift at different rates instead of forming a tiled wave.
  for(let i=0;i<14;i++){
    const span=right-left-60,x=left+30+((i*173+phase*(.62+(i%3)*.17))%span),y=top+7+(i%4)*10+Math.sin(t*1.6+i)*1.5;
    line(c,[[x-9,y],[x+6,y-2],[x+16,y]],i%3?'#b6d0bf70':'#d0d5b981',i%3?1.25:1.8);
  }
  const contactKey=`${b.honroStage}:${b.session}`;
  if(this._waterContactKey!==contactKey){this._waterContactKey=contactKey;this._waterContacts=new Map();this._waterRipples=[];}
  const seen=new Set();
  for(const u of b.units||[]){
    if(u.dead)continue;
    seen.add(u.id);
    const touching=u.x>=left&&u.x<=right&&u.y>=top-3&&u.y<top+85;
    const previous=this._waterContacts.get(u.id);
    if(previous===false&&touching&&!reduced)this._waterRipples.push({x:u.x,born:t});
    this._waterContacts.set(u.id,touching);
  }
  for(const id of this._waterContacts.keys())if(!seen.has(id))this._waterContacts.delete(id);
  this._waterRipples=this._waterRipples.filter(r=>t-r.born<1.25);
  for(const r of this._waterRipples){const age=t-r.born,spread=12+age*53;
    c.beginPath();c.ellipse(r.x,top+6,spread,3+age*4,0,Math.PI*.06,Math.PI*.94);
    c.strokeStyle=`rgba(194,213,196,${Math.max(0,.48-age*.35)})`;c.lineWidth=2;c.stroke();
  }
  c.restore();
};
})(globalThis);
