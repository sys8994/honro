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
function drawSpecial(c,l){const k=l.kind;if(!k)return false;
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
  else if(k==='waterfall'){fill(c,[[-117,0],[-91,-152],[-37,-183],[23,-196],[97,-143],[125,0]],'#3b4b49','#78847b');fill(c,[[-40,-177],[-13,-177],[31,-143],[49,0],[-62,0]],'#506f7188');for(const x of[-35,-10,16,40])line(c,[[x,-153],[x+6,-95],[x-3,-8]],'#c1d1c163',2);}
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
Scene.prototype.background=function(c,w,h,b){oldBackground.call(this,c,w,h,b);
  const stage=b?.honroStage||0,kind=this.theme;
  // A shallow second set of fractured Korean mountain ridges breaks up the
  // repeated rounded horizon without competing with readable combat terrain.
  c.save();c.globalAlpha=(stage===5||stage===6)?.57:.50;
  ridge.call(this,c,w,h,stage+5,0,'#243439','#677d7860');
  if(stage!==5&&stage!==6){ridge.call(this,c,w,h,stage+17,1,kind==='shrine'?'#303337':'#293b3b','#82918a54');ridge.call(this,c,w,h,stage+29,2,'#213331','#627d7350');}
  c.restore();
  if(stage===5||stage===6){c.save();c.globalAlpha=.20;for(let i=0;i<3;i++){const x=w*(.14+i*.33)-(this.x*.035)%55;line(c,[[x,h*.75],[x+37,h*.66],[x+76,h*.68],[x+130,h*.57]],'#9baaa0',2);}c.restore();}
};
})(globalThis);
