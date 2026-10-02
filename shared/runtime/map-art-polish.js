(function(G){'use strict';
// Scenery only: no terrain, collision, interaction, or save-state mutations.
const Scene=G.HonroScene,D=G.honroDraw,{P,L,E}=D;
const oldLandmark=Scene.prototype.landmark;
function line(c,pts,color,width=1){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function fill(c,pts,color,edge){const ys=pts.map(p=>p[1]),top=Math.min(...ys),bottom=Math.max(...ys);if(bottom-top>60&&/^#[0-9a-f]{6}$/i.test(color)&&G.HonroEnvironmentArt){const E=G.HonroEnvironment;color=G.HonroEnvironmentArt.gradient(c,0,top,0,bottom,[[0,E.mixColor(color,'#c9c3a5',.06)],[.55,color],[1,E.mixColor(color,'#14262c',.19)]]);}P(c,pts,color,edge||null,edge?1:0);}
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
  // A leaning Korean pine: the trunk and boughs carry five uneven ink masses.
  // The broad light/shadow planes remain visible when the map zooms out.
  c.save();
  fill(c,[[-29,5],[-23,-83],[-8,-218],[12,-365],[31,-487],[45,-532],[49,-514],[35,-401],[17,-254],[20,-93],[31,5]],'#3a3930');
  fill(c,[[-11,-216],[7,-352],[31,-487],[45,-532],[35,-415],[17,-278],[7,-171]],'#706750');
  c.lineCap='round';c.lineJoin='round';
  for(const [pts,width] of [
    [[-1,-116,-97,-138,-164,-117,-248,-95],17],
    [[5,-236,-70,-277,-149,-262,-220,-239],14],
    [[28,-414,106,-464,168,-447,236,-413],16],
    [[27,-474,-42,-507,-86,-493,-123,-474],10]
  ]){c.beginPath();c.moveTo(pts[0],pts[1]);c.bezierCurveTo(...pts.slice(2));c.strokeStyle='#414137';c.lineWidth=width;c.stroke();}
  const crowns=[[-199,-119,78,39],[-132,-273,104,46],[46,-506,91,42],[135,-445,93,43],[219,-413,69,32]];
  for(const [x,y,w,h] of crowns){
    c.save();c.translate(x,y);c.beginPath();c.moveTo(-w,-1);
    c.bezierCurveTo(-w*.94,-h*.58,-w*.72,-h*.60,-w*.54,-h*.69);
    c.bezierCurveTo(-w*.36,-h*1.03,-w*.16,-h*.72,0,-h*.88);
    c.bezierCurveTo(w*.24,-h*1.16,w*.38,-h*.61,w*.58,-h*.63);
    c.bezierCurveTo(w*.83,-h*.55,w*.97,-h*.24,w,0);
    c.bezierCurveTo(w*.62,h*.28,w*.18,h*.18,-w*.13,h*.27);
    c.bezierCurveTo(-w*.49,h*.26,-w*.80,h*.21,-w,-1);c.closePath();
    c.fillStyle='#263c34';c.fill();c.clip();
    c.fillStyle='#4c6150';c.beginPath();c.moveTo(-w,-2);c.bezierCurveTo(-w*.68,-h*.65,-w*.26,-h*.55,0,-h*.68);c.bezierCurveTo(w*.34,-h*.82,w*.71,-h*.45,w,0);c.lineTo(w*.46,-h*.08);c.bezierCurveTo(w*.12,-h*.18,-w*.35,-h*.18,-w,-2);c.fill();
    c.fillStyle='#1d302c';c.beginPath();c.moveTo(-w,h*.05);c.quadraticCurveTo(0,-h*.13,w,h*.03);c.lineTo(w,h*.33);c.lineTo(-w,h*.33);c.fill();
    c.restore();
  }
  for(const side of[-1,1])line(c,[[side*11,-4],[side*67,14],[side*122,20]],'#423e32',10);
  c.restore();
}
function ravinePineInk(c,l){
 c.save();c.scale((l.lean||1)<0?-1:1,1);
 // A crooked trunk grows out of the cliff. Its weight is carried by three
 // lateral boughs; foliage is painted in flat, irregular needle banks.
 c.beginPath();c.moveTo(-43,8);c.bezierCurveTo(21,-208,84,-389,152,-592);c.bezierCurveTo(213,-776,270,-949,292,-1090);c.lineTo(322,-1074);c.bezierCurveTo(286,-887,246,-745,190,-567);c.bezierCurveTo(118,-356,65,-159,38,11);c.closePath();c.fillStyle='#352f29';c.fill();
 c.beginPath();c.moveTo(-14,0);c.bezierCurveTo(48,-238,108,-411,174,-600);c.bezierCurveTo(233,-777,282,-980,300,-1084);c.lineTo(308,-1063);c.bezierCurveTo(275,-887,238,-727,181,-555);c.bezierCurveTo(102,-337,56,-141,15,1);c.closePath();c.fillStyle='#79684b';c.fill();
 c.lineCap='round';c.lineJoin='round';
 for(const [pts,width] of [
  [[91,-369,-9,-379,-151,-352,-261,-316],21],
  [[132,-529,24,-563,-128,-538,-254,-496],22],
  [[199,-712,289,-728,435,-702,541,-657],20],
  [[243,-872,134,-916,39,-906,-89,-858],17],
  [[284,-1002,348,-1006,437,-990,499,-959],12]
 ]){c.beginPath();c.moveTo(pts[0],pts[1]);c.bezierCurveTo(...pts.slice(2));c.strokeStyle='#40382c';c.lineWidth=width;c.stroke();c.strokeStyle='#a18a5e70';c.lineWidth=Math.max(2,width*.12);c.stroke();}
 const crown=(x,y,w,h,tilt)=>{c.save();c.translate(x,y);c.rotate(tilt);
  c.beginPath();c.moveTo(-w,0);c.lineTo(-w*.83,-h*.42);c.quadraticCurveTo(-w*.68,-h*.76,-w*.51,-h*.65);c.quadraticCurveTo(-w*.31,-h*1.06,-w*.11,-h*.77);c.quadraticCurveTo(w*.09,-h*1.10,w*.28,-h*.74);c.quadraticCurveTo(w*.61,-h*.94,w*.79,-h*.43);c.lineTo(w,1);c.quadraticCurveTo(w*.5,h*.14,0,h*.08);c.quadraticCurveTo(-w*.43,h*.22,-w,0);c.closePath();c.fillStyle='#20392f';c.fill();
  c.beginPath();c.moveTo(-w*.88,-h*.06);c.quadraticCurveTo(-w*.35,-h*.66,-w*.02,-h*.61);c.quadraticCurveTo(w*.47,-h*.68,w*.87,-h*.09);c.lineTo(w*.47,-h*.15);c.quadraticCurveTo(0,-h*.28,-w*.39,-h*.13);c.closePath();c.fillStyle='#52674c';c.fill();
  for(const [ax,ay,bx,by] of [[-.75,-.44,-.30,-.65],[-.12,-.71,.29,-.76],[.32,-.52,.78,-.33]]){c.beginPath();c.moveTo(w*ax,h*ay);c.quadraticCurveTo(w*(ax+bx)*.5,h*(ay+by)*.5-5,w*bx,h*by);c.strokeStyle='#9ba77a70';c.lineWidth=6;c.stroke();}
  for(const [ax,bx,yy] of [[-.78,-.41,.08],[-.17,.30,.13],[.39,.79,.04]]){c.beginPath();c.moveTo(w*ax,h*yy);c.lineTo(w*bx,h*yy+3);c.strokeStyle='#122920';c.lineWidth=9;c.stroke();}
  // Short broken needle marks and drooping tips replace a smooth cap.
  for(let i=0;i<7;i++){const px=w*(-.76+i*.24),py=-h*(.34+.17*Math.sin(i*2.3));c.beginPath();c.moveTo(px,py);c.lineTo(px+w*(.16+.035*(i%3)),py-h*(.03+.06*(i%2)));c.strokeStyle=i%3?'#9baa7f9c':'#142c23bb';c.lineWidth=i%3?3.1:4.5;c.stroke();}
  for(const [u,v] of [[-.78,-.60],[.57,.76]])fill(c,[[w*u,h*.05],[w*v,h*.08],[w*(u+v)*.5,h*.28]],'#172d25');
  c.restore();};
 crown(-236,-332,141,65,-.11);crown(-202,-511,181,83,-.06);crown(-55,-877,144,70,-.15);crown(454,-665,172,76,.12);crown(454,-970,132,62,.12);crown(300,-1097,142,73,.05);
 line(c,[[-17,3],[-87,20],[-132,28]],'#3d342a',17);line(c,[[23,4],[87,15],[139,16]],'#3d342a',13);
 c.restore();
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
  const types=['oldGate','funeralGate','royalGate','oldHall','upperShrine','cliffShrine','warehouse','burnedHouses','watchtower','receiverStone','ritualDais','incenseYard','gravePosts','bierRest','rootHut','hollowRoot','rootShrine','waterShrine','spiritKnot','waterfall','brokenBridge','bridgePillar','giantPine','ancientPine','ravinePine'];
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
  else if(k==='waterfall'){const h=(l.drop||196*(l.size||1))/(l.size||1);fill(c,[[-95,0],[-71,-h*.47],[-50,-h*.87],[-29,-h],[30,-h],[62,-h*.80],[82,-h*.37],[105,0]],'#3b4b49','#78847b');fill(c,[[-95,0],[-71,-h*.47],[-50,-h*.87],[-29,-h],[-38,-h*.35],[-52,0]],'#465850');fill(c,[[30,-h],[62,-h*.80],[82,-h*.37],[105,0],[56,0],[42,-h*.66]],'#263d40');}
  else if(k==='brokenBridge'){fill(c,[[-140,-13],[-60,-20],[-26,-10],[-12,0],[-139,0]],'#4d4b3d','#8a8067');fill(c,[[21,-7],[49,-19],[140,-14],[140,0],[23,0]],'#4d4b3d','#8a8067');for(const x of[-120,-70,62,119])L(c,x,0,x,45,'#5b503e',5);}
  else if(k==='bridgePillar'){fill(c,[[-22,0],[-25,-90],[-15,-110],[16,-110],[25,-90],[22,0]],'#505e59','#899184');line(c,[[-17,-86],[13,-86]],'#263631',1.6);line(c,[[-11,-47],[18,-51]],'#263631',1.3);}
  else if(k==='giantPine')pine(c);
  else if(k==='ancientPine'){c.save();c.scale(.48,.48);pine(c);c.restore();}
  else if(k==='ravinePine')ravinePineInk(c,l);
  c.restore();return true;
}
Scene.prototype.landmark=function(c,l){if(!drawSpecial(c,l))oldLandmark.call(this,c,l);};
const oldTerrain=Scene.prototype.terrain,cliffPaths=new WeakMap();
function cliffInk(c,t){let clip=cliffPaths.get(t);if(!clip){clip=new Path2D();G.HONRO_CORE.poly(t).forEach((p,i)=>i?clip.lineTo(p.x,p.y):clip.moveTo(p.x,p.y));clip.closePath();cliffPaths.set(t,clip);}c.save();c.clip(clip);
 const left=t.id==='left-high-ground',broad=new Path2D(),marks=left?[
  [[585,730],[612,1030],[710,1230],[737,1590],[714,1870]],
  [[930,1210],[924,1500],[1050,1780],[1080,2100]],
  [[1130,2150],[1080,2350],[972,2590],[860,2770]]
 ]:[
  [[4050,570],[4010,810],[3970,1110],[3910,1320]],
  [[3730,1540],[3650,1770],[3560,2100],[3520,2420]],
  [[3980,1370],[3860,1680],[3800,1890],[3690,2130]]
 ];
 if(left){broad.moveTo(435,665);broad.bezierCurveTo(610,760,625,1110,683,1430);broad.bezierCurveTo(800,1820,878,2200,712,2640);broad.bezierCurveTo(600,2230,530,1560,435,665);}else{broad.moveTo(4160,580);broad.bezierCurveTo(3960,940,3990,1400,3740,1820);broad.bezierCurveTo(3650,2260,3550,2650,3480,2900);broad.bezierCurveTo(3650,1920,3850,960,4160,580);}broad.closePath();
 c.fillStyle=G.HonroEnvironmentArt.gradient(c,0,left?650:550,0,left?2630:2850,[[0,'#8290843d'],[.45,'#61756d2d'],[1,'#50675c00']]);c.fill(broad);
 for(const [i,coords] of marks.entries()){c.beginPath();c.moveTo(...coords[0]);c.bezierCurveTo(...coords[1],...coords[2],...coords[3]);c.strokeStyle=i===1?'#a1a9922b':'#0a1b203d';c.lineWidth=i===1?45:70;c.lineCap='round';c.stroke();}
 const ledges=left?[[[600,1010],[721,1030]],[[810,1630],[970,1600]],[[1000,2250],[1160,2220]]]:[[[3890,1010],[4060,1040]],[[3680,1730],[3860,1710]],[[3460,2460],[3640,2430]]];
 for(const [a,b] of ledges){line(c,[a,b],'#9aa69635',10);line(c,[[a[0]+17,a[1]+18],[b[0]-12,b[1]+25]],'#0e20245c',16);}
 c.restore();}
Scene.prototype.terrain=function(c,t){oldTerrain.call(this,c,t);if(t.id==='left-high-ground'||t.id==='right-cliff-ground')cliffInk(c,t);};
// Dynamic pools and waterfall ribbons are drawn by environment-renderer.js.
})(globalThis);
