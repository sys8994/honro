import {asset,part,shape,line,oval,track,sway,react,paper} from './shapes.mjs';
// Native bind-space anatomy; head width/height and landmark relationships stay consistent.
// NPCs get their own hair, clothing and tools, not renamed companion silhouettes.
export function human(d){
 const a=asset(d),role=d.id.replace('ally_',''),robe=['guard','healer','ritualist','daoist','medium'].includes(role),woman=['healer','medium'].includes(role),old=role==='daoist';
 const colors={porter:['#77735B','#B0A482'],guard:['#455B57','#839486'],archer:['#6B7056','#A0A482'],healer:['#758F83','#BECBBC'],ritualist:['#777463','#B5AF95'],daoist:['#566C6A','#91A29A'],medium:['#756579','#B0A0AC'],scout:['#5C6C57','#91A47F'],woodcutter:['#756347','#B19B72'],civilian:['#817D70','#B7AD96']}[role];Object.assign(a.palette,{cloth:colors[0],light:colors[1],hair:old?'#69695F':'#292C29'});
 a.brief={reference:'기존 역할별 게임 그림; 얼굴은 3/4 구도의 제한된 곡선으로 새로 작성',silhouette:robe?'겹친 긴 옷과 작고 자연스러운 얼굴':'넓은 소매·벌어진 바지·접지한 신발',identity:[d.name,role==='woodcutter'?'도끼와 짚 지게':role==='archer'?'활과 화살통':robe?'옷깃·안감·역할별 의식 도구':'머리띠·일하는 손·역할별 도구','어두운 머리와 절제된 두 눈'],materials:['삼베','낡은 가죽','목재/철']};
 part(a,'root');
 for(const side of ['rear','front']){const x=side==='rear'?-7:7,p=part(a,side+'-leg',[x,-40],'root');shape(p,`M${x-6} -44 L${x+6} -42 ${x+5} -24 ${x+3} -5 ${x-5} -5 ${x-5} -23Z`,side==='rear'?'shade':'cloth');shape(p,`M${x-3} -26 L${x+3} -23 ${x+1} -7 ${x-3} -7Z`,'linenShade');const f=part(a,side+'-foot',[x,-5],side+'-leg');shape(f,`M${x-5} -7 L${x+3} -7 ${x+6} -3 ${x+12} -1 ${x+12} 1 ${x-6} 1Z`,'leather');line(f,`M${x-4} -4 L${x+4} -3`,'gold',.7,1);track(a,'move',p.id,'rotate',[[0,0],[.25,side==='rear'?-13:13],[.75,side==='rear'?13:-13],[1,0]]);track(a,'jump_fall',p.id,'rotate',[[0,0],[.35,side==='rear'?22:-15],[.7,side==='rear'?15:-8],[1,0]]);}
 const body=part(a,'body',[0,-43],'root');
 const rear=part(a,'rear-sleeve',[-11,-75],'body');shape(rear,'M-9 -79 Q-19 -79 -24 -66 L-28 -51 -22 -43 -12 -48 -15 -59 -5 -67Z','shade');line(rear,'M-20 -67 L-23 -53 -18 -50','light');
 const rh=part(a,'rear-hand',[-22,-45],'rear-sleeve');shape(rh,'M-24 -49 L-17 -47 -16 -40 -18 -37 -22 -38 -25 -42Z','skin');line(rh,'M-23 -44 L-19 -42','skinShade',.65,1);
 const hem=part(a,'hem',[0,-47],'body');shape(hem,robe?'M-14 -52 L15 -50 Q16 -32 25 -7 L8 -3 -4 -6 -23 -4 -18 -25Z':'M-14 -52 L15 -50 21 -27 8 -31 3 -42 -3 -27 -23 -21 -18 -39Z','cloth','ink',.7);shape(hem,robe?'M-3 -47 L6 -43 14 -7 4 -5 -5 -8Z':'M-10 -47 L-1 -43 -10 -28 -19 -25Z','light');line(hem,robe?'M-13 -34 L-16 -11 M10 -33 L18 -10':'M-14 -39 L-18 -28 M12 -42 L16 -31','shade',.8,1);
 shape(body,'M-8 -82 Q-15 -81 -17 -74 L-14 -51 -11 -42 13 -43 16 -59 14 -75 6 -82Z','cloth','ink',.7);shape(body,'M-5 -81 L3 -74 -4 -61 -10 -56 -13 -72Z','light');shape(body,'M7 -80 L12 -76 9 -60 13 -44 2 -45 0 -65Z','shade');shape(body,'M-7 -83 L0 -76 8 -83 11 -78 0 -65 -11 -79Z','linen');shape(body,'M-14 -47 L14 -48 14 -43 -13 -42Z','leather');shape(body,'M0 -47 L5 -47 5 -42 0 -42Z','gold');line(body,'M-11 -60 L-7 -52 M10 -70 L7 -55','light',.65,1);
 const neck=part(a,'neck',[0,-82],'body');shape(neck,'M-4 -90 L6 -89 7 -80 1 -74 -6 -82Z','skin');shape(neck,'M-3 -87 L6 -87 5 -80 1 -77Z','skinShade');
 const head=part(a,'head',[0,-85],'neck');
 shape(head,woman?'M-8 -102 Q0 -109 8 -103 L10 -96 8 -88 Q4 -83 1 -83 L-6 -88 -9 -95Z':'M-8 -102 Q1 -109 9 -102 L11 -94 8 -87 Q5 -82 1 -83 L-6 -88 -10 -95Z','skin');shape(head,'M-8 -99 L-5 -97 -4 -89 1 -84 -6 -88 -9 -95Z','skinShade');
 oval(head,-7,-94,2.4,3.6,'skin');line(head,'M-8 -96 L-6 -94 -7 -92','skinShade',.6,1);
 shape(head,'M-3 -98 L2 -97 2 -96 -3 -97Z M5 -97 L9 -97 9 -96 5 -96Z','hair');shape(head,'M-3 -95 L1 -94.5 0 -93 -2 -93.5Z M5 -94.5 L8 -94.5 7 -93 5 -93Z','eye');line(head,'M-3 -95 L1 -94.5 M5 -94.5 L8 -94.5','feature',.65,0);line(head,'M-.5 -94.5 L-.5 -93.5 M6 -94.4 L6 -93.2','feature',1,0);line(head,'M4 -94 L5 -91 3 -90','skinShade',.65,1);line(head,'M0 -87.5 Q2 -88 4 -87.5','feature',.55,0);
 if(woman){const bun=part(a,'hair-bun',[-7,-96],'head');shape(bun,'M-8 -100 Q-16 -102 -16 -95 Q-17 -89 -9 -89 L-6 -93Z','hair');shape(head,'M-10 -95 Q-13 -108 -2 -110 Q8 -112 11 -102 L9 -94 7 -101 4 -103 -1 -99 -6 -96 -7 -91Z','hair');line(head,'M-7 -101 Q-1 -104 3 -107','hairLight',1.1,1);}
 else{shape(head,'M-10 -96 L-11 -104 Q-6 -112 4 -109 L10 -104 12 -100 8 -99 5 -103 1 -101 -3 -103 -6 -97 -6 -91 -9 -92Z','hair');shape(head,'M-6 -108 Q-10 -115 -3 -115 L1 -113 0 -108Z','hair');}
 if(old){shape(head,'M-1 -89 Q3 -91 6 -89 L7 -87 3 -88 -1 -87Z M-3 -86 L1 -85 5 -85 4 -81 0 -79 -4 -83Z','hair');}
 const arm=part(a,'front-sleeve',[11,-75],'body');shape(arm,robe?'M10 -79 Q18 -78 23 -67 L29 -55 21 -43 10 -47 13 -58 7 -68Z':'M10 -79 Q18 -78 20 -70 L26 -59 25 -47 17 -46 16 -57 9 -66Z','cloth','ink',.65);shape(arm,robe?'M17 -67 L23 -58 18 -50 13 -51Z':'M19 -62 L25 -58 24 -49 19 -49Z','linen');line(arm,'M15 -74 L18 -64 16 -60','light',.75,1);
 const hand=part(a,'front-hand',[22,-47],'front-sleeve');shape(hand,'M19 -49 L25 -49 27 -45 25 -39 20 -39 18 -42Z','skin');line(hand,'M20 -45 L24 -43 23 -40','skinShade',.65,1);
 const tool=part(a,'tool',[23,-43],'front-hand');
 if(['guard','scout'].includes(role)){
  shape(tool,'M22 -41 L24 -40 30 -77 29 -86 26 -78Z','metal');shape(tool,'M24 -43 L27 -77 29 -84 28 -77Z','metalLight');line(tool,'M17 -42 L30 -40','gold',2,0);line(tool,'M23 -40 L21 -31','leather',2.5,0);
  // Joseon-style long fabric armour and a broad felt military hat, no plate pauldrons/kite shield.
  if(role==='guard'){
   shape(body,'M-13 -78 L-5 -76 0 -68 7 -78 13 -75 15 -48 -14 -47Z','shade','gold',.55);
   for(let row=0;row<3;row++)for(const x of [-9,8])oval(body,x,-67+row*7,.7,.7,'gold',null,.6,1);
   for(const x of [-13,8]){line(hem,`M${x} -37 L${x+1} -12`,'gold',.65,1);for(const y of [-34,-24,-14])oval(hem,x+3,y,.65,.65,'gold',null,.6,1);}
   shape(head,'M-9 -104 Q-9 -116 1 -116 Q10 -115 10 -104Z','hair');shape(head,'M-19 -103 Q1 -109 21 -103 L17 -100 -15 -100Z','hair','linenShade',.55);shape(head,'M-7 -106 L9 -106 9 -104 -7 -104Z','red');line(head,'M-8 -100 L-6 -83 3 -79 9 -99','leather',.55,1);line(head,'M9 -107 Q17 -117 21 -112','red',1.2,0);
  }else{shape(body,'M-15 -75 L-8 -75 8 -46 4 -44Z','leather');shape(head,'M-11 -105 L10 -104 10 -100 -11 -101Z','linenShade');}
 }else if(role==='archer'){
  a.aimPart='front-sleeve';a.aimScale=.45;shape(tool,'M26 -71 Q44 -52 32 -25 L28 -19 30 -29 Q38 -48 24 -68Z','woodLight');line(tool,'M25 -70 L23 -43 29 -21','linen',.55,0);line(tool,'M22 -43 L44 -43','woodLight',.8,0);shape(tool,'M46 -43 L41 -45 41 -41Z','metalLight');shape(body,'M-15 -77 L-23 -43 -29 -46 -22 -80Z','leather');for(let i=0;i<3;i++){line(body,`M${-21+i*2} -77 L${-27+i*2} -103`,'woodLight',.8,0);line(body,`M${-27+i*2} -103 L${-30+i*2} -106`,'linen',1.5,1);}
 }else if(role==='woodcutter'||role==='porter'){
  if(role==='woodcutter'){line(tool,'M22 -31 L33 -79','wood',3,0);shape(tool,'M30 -78 Q45 -87 48 -74 L42 -65 29 -70Z','metal','ink',.7);line(tool,'M44 -78 L43 -72 39 -68','metalLight',1,1);}
  else{line(tool,'M21 -10 L25 -94','wood',3.5,0);line(tool,'M23 -18 L26 -85','woodLight',.9,1);shape(tool,'M22 -73 L27 -73 29 -57 22 -55Z','linenShade');line(tool,'M23 -69 L28 -67 M23 -64 L29 -62','leather',.7,1);}
  const pack=part(a,'pack',[-15,-62],'body');shape(pack,'M-27 -77 L-18 -81 -17 -47 -30 -45Z','wood');line(pack,'M-29 -73 L-18 -54 M-27 -53 L-17 -76','woodLight',1.4,0);shape(head,'M-10 -102 L9 -101 10 -98 -10 -99Z','linen');
 }else if(role==='healer'||role==='civilian'){
  shape(tool,'M17 -46 Q23 -50 29 -45 L31 -34 17 -33 15 -39Z','leather','ink',.7);shape(tool,'M16 -45 L30 -44 28 -40 18 -40Z','linen');line(tool,'M21 -39 L26 -37','red',1,1);
  if(role==='healer'){shape(head,'M-12 -103 Q-4 -111 5 -107 L9 -103 7 -101 Q0 -106 -9 -99Z','linen');shape(head,'M-10 -100 L-14 -98 -13 -88 -17 -94 -17 -101Z','linenShade');shape(body,'M-9 -73 L-4 -70 -12 -48 -14 -49Z','linen');}
 }else{
  if(role==='ritualist'){
   // Shaven head, jangsam, draped gasa and a small moktak held in the hand.
   head.paths=head.paths.filter(p=>p.fill!=='hair');shape(head,'M-10 -97 Q-12 -109 0 -109 Q9 -109 10 -100 L7 -102 Q0 -106 -7 -99Z','skinShade');
   shape(body,'M-14 -78 L-6 -76 14 -51 8 -44 -12 -63Z','red');shape(hem,'M-7 -48 L8 -49 16 -8 7 -5 -9 -14Z','red');line(hem,'M-3 -37 L11 -34 M-1 -27 L13 -24','gold',.6,1);
   oval(tool,24,-43,7,5,'woodLight','wood',.7);oval(tool,25,-49,3,3,null,'wood',1.4);line(tool,'M20 -43 Q24 -40 29 -44','wood',1.1,0);line(rh,'M-22 -41 L-9 -56','wood',1.5,0);oval(rh,-9,-56,1.8,2,'woodLight');
  }else if(role==='daoist'){
   // Folded cloth headwear, long dopo, whisk and a paper seal; no crystal-topped wand.
   shape(head,'M-11 -102 L-11 -113 -4 -116 1 -114 8 -116 12 -109 10 -102 5 -104 -6 -104Z','shade');line(head,'M-8 -110 L-2 -112 2 -108 7 -111','light',.7,1);
   line(tool,'M23 -40 L30 -72','wood',1.8,0);shape(tool,'M29 -73 Q39 -74 38 -64 Q33 -58 41 -43 L33 -48 29 -62 25 -67Z','linen');line(tool,'M31 -68 Q31 -54 37 -48','linenShade',.7,1);paper(body,-15,-59,5,14);
  }else {
   // Fan and brass bell cluster are separate hand props; trailing cloth shares the head rig.
   shape(tool,'M22 -43 L17 -65 Q32 -78 49 -63 L28 -43Z','linen','red',.7);for(const x of [22,28,34,40,46])line(tool,`M25 -44 L${x} ${x<30?-67:-65}`,'wood',.55,1);line(tool,'M25 -43 L23 -36','wood',1.4,0);
   for(const [x,y]of[[-23,-44],[-19,-42],[-25,-39]])oval(rh,x,y,2,2.5,'gold','wood',.6);line(rh,'M-23 -40 L-29 -29 M-19 -40 L-18 -27','red',1,0);
   shape(body,'M-13 -76 L-9 -79 4 -57 -1 -51Z','red');const ribbon=part(a,'ribbon',[-10,-94],'head');shape(ribbon,'M-11 -98 Q-17 -83 -13 -70 L-18 -78 -17 -88 -16 -96Z','red');sway(a,'ribbon',3);
  }
 }
 if(!['guard','healer','ritualist','daoist'].includes(role))line(head,'M-9 -102 L8 -102','linenShade',1.4,0);
 // Cloth ties, broad lapels and ankle bindings remain visible before tiny surface detail.
 const ties=part(a,'goreum',[2,-63],'body');shape(ties,'M-1 -68 L5 -67 8 -54 4 -55 1 -62 -3 -52 -6 -54Z','linenShade');sway(a,'goreum',2);
 if(role==='civilian'){
  Object.assign(a.palette,{cloth:'#8A8069',light:'#B8AB8C',shade:'#635F4D'});
  hem.paths=[];shape(hem,'M-14 -49 L14 -49 16 -36 5 -33 -1 -36 -16 -34Z','cloth');line(hem,'M-11 -40 L-3 -38 M5 -41 L12 -39','linenShade',.8,1);
  shape(head,'M-11 -104 L8 -104 10 -101 -11 -100Z','linenShade');line(head,'M-11 -101 L-17 -96 -18 -88','linenShade',1.7,0);
 }
 sway(a,'body',.5);sway(a,'head',.55);sway(a,'hem',.7);react(a,'body',3);react(a,'head',4);react(a,'front-sleeve',role==='woodcutter'?-38:role==='archer'?-18:-30);react(a,'rear-sleeve',9);
 if(['guard','scout','woodcutter'].includes(role))track(a,'attack','tool','rotate',[[0,0],[.22,-12],[.48,58],[.72,20],[1,0]]);
 track(a,'move','front-sleeve','rotate',[[0,0],[.25,-7],[.75,7],[1,0]]);track(a,'move','rear-sleeve','rotate',[[0,0],[.25,7],[.75,-7],[1,0]]);track(a,'move','hem','rotate',[[0,0],[.25,-3],[.75,3],[1,0]]);track(a,'jump_fall','front-sleeve','rotate',[[0,0],[.4,-14],[.7,-8],[1,0]]);track(a,'jump_fall','hem','rotate',[[0,0],[.45,-8],[1,0]]);
 return a;
}
