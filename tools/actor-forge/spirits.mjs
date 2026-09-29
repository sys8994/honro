import {asset,part,shape,line,oval,track,sway,react} from './shapes.mjs';
// Each summon keeps a distinct outer contour at 64 px, within the original 3x ceiling.
export function spirit(d){
 const a=asset(d,112,[-74,-130,148,148]),kind=d.id.slice(7);Object.assign(a.palette,{cloth:'#526773',shade:'#334954',light:'#829CA3',skin:'#B3C6BF',skinShade:'#708E8D'});part(a,'root',[0,-60]);
 a.brief={reference:'기존 소환 역할을 한국 민속의 수의·탈·장승·행등·창호 형상으로 재해석',silhouette:{stalker:'풀어헤친 머리와 수의, 길게 내려온 손',charger:'눈썹과 코가 큰 목탈, 몽둥이와 넓은 어깨',lantern:'청홍 천을 두른 사각 행등과 혼불',warden:'장승 얼굴과 금줄을 두른 넓은 목주',host:'열리는 창호 문짝과 그 사이의 얼굴'}[kind],identity:[d.name,'먹빛·삼베·목재와 연한 혼빛','수의/목탈/행등/장승/창호의 서로 다른 외곽'],materials:['영체','오래된 천','봉인 목재']};
 if(kind==='lantern'){
  const frame=part(a,'frame',[0,-67],'root');line(frame,'M-12 -97 Q-15 -115 0 -116 Q15 -116 12 -97','woodLight',2,0);shape(frame,'M-26 -99 L26 -99 29 -92 25 -32 -25 -32 -29 -92Z','wood','ink',1);
  shape(frame,'M-23 -91 L22 -91 21 -62 -22 -62Z','red');shape(frame,'M-22 -62 L21 -62 21 -36 -22 -36Z','cloth');shape(frame,'M-9 -90 L9 -90 9 -37 -9 -37Z','linenShade');line(frame,'M-22 -91 L-22 -35 M22 -91 L22 -35 M-26 -94 L26 -94 M-26 -33 L26 -33','woodLight',1.8,0);
  const flame=part(a,'flame',[0,-61],'frame');shape(flame,'M-9 -51 Q-17 -65 -3 -79 L-2 -68 7 -82 Q20 -65 11 -51 L4 -46Z','soul');shape(flame,'M-2 -52 Q-9 -63 3 -68 L6 -61 5 -52Z','glow');
  const tails=part(a,'tails',[0,-32],'frame');shape(tails,'M-16 -33 Q-24 -13 -12 2 L-18 -3 -24 -20 -22 -34Z M10 -32 Q24 -19 13 -5 L18 -10 18 -24 7 -27Z','light');line(tails,'M-4 -30 Q-8 -12 0 5 L6 8','soul',1.2,0);sway(a,'tails',6);sway(a,'frame',3);react(a,'flame',16);
 }else if(kind==='stalker'){
  const back=part(a,'rear-arm',[-15,-77],'root');shape(back,'M-12 -87 Q-40 -87 -44 -56 L-39 -33 -36 -42 -32 -37 -34 -58 -19 -66Z','shade');
  const body=part(a,'body',[0,-60],'root');shape(body,'M-8 -91 L13 -91 26 -77 22 -49 13 -29 17 -5 4 -15 -3 5 -9 -14 -22 -3 -17 -29 -26 -47 -25 -79Z','linenShade');shape(body,'M-11 -87 L3 -74 13 -89 17 -80 2 -65 -3 -42 4 -21 -5 -7 -8 -30 -13 -52Z','linen');
  const head=part(a,'head',[0,-94],'body');shape(head,'M-6 -105 Q4 -112 12 -100 L13 -89 6 -82 -3 -88Z','skin');shape(head,'M-8 -95 Q-20 -115 2 -115 Q20 -115 18 -96 L21 -77 14 -81 12 -96 5 -105 -3 -99 -5 -81 -11 -74Z','hair');shape(head,'M-1 -97 L4 -96 2 -93 -2 -94Z M7 -96 L11 -95 10 -92 7 -92Z','deep');line(head,'M3 -88 L7 -88','feature',1,0);line(head,'M-12 -108 L12 -107','linen',2,0);
  const arm=part(a,'front-arm',[14,-75],'body');shape(arm,'M13 -83 Q36 -82 33 -57 L26 -43 28 -28 23 -34 20 -27 18 -45 23 -63 14 -63Z','linenShade');line(arm,'M26 -67 L23 -48 24 -39','soul',1.2,0);react(a,'front-arm',23);react(a,'head',8);sway(a,'rear-arm',4);
 }else if(kind==='charger'){
  const back=part(a,'rear-arm',[-22,-77],'root');shape(back,'M-12 -91 L-31 -96 -47 -76 -42 -54 -33 -57 -34 -74 -15 -72Z','shade');
  const body=part(a,'body',[0,-57],'root');shape(body,'M-18 -92 L11 -104 26 -89 32 -61 14 -32 20 -9 6 -16 0 3 -7 -14 -22 -4 -14 -33 -31 -62Z','cloth');shape(body,'M-14 -84 L7 -91 20 -75 7 -48 -2 -20 -4 -49 -21 -70Z','light');
  const head=part(a,'head',[9,-89],'body');shape(head,'M-9 -105 Q-13 -120 4 -121 Q23 -124 29 -108 L25 -92 17 -84 1 -86 -9 -95Z','woodLight');shape(head,'M-10 -108 L-4 -117 5 -114 9 -108 17 -116 27 -111 21 -104 12 -105 3 -101Z','wood');line(head,'M-3 -108 L5 -106 M15 -109 L23 -111','glow',1.8,0);shape(head,'M6 -108 Q17 -110 17 -99 L9 -94 3 -99Z','woodLight','wood',.7);line(head,'M0 -91 Q11 -86 22 -95','feature',2,0);line(head,'M6 -91 L7 -88 M13 -91 L14 -89','linen',1.7,0);
  const arm=part(a,'front-arm',[19,-76],'body');shape(arm,'M17 -87 L34 -83 42 -62 37 -40 24 -37 23 -46 29 -51 26 -64 16 -66Z','cloth');shape(arm,'M30 -59 L39 -61 36 -43 28 -42Z','skin');line(arm,'M33 -32 L47 -76','wood',5,0);shape(arm,'M42 -71 L40 -86 45 -97 54 -94 57 -82 51 -68Z','woodLight');line(body,'M-20 -70 L19 -54 M-12 -44 L9 -48','linen',1.7,0);react(a,'front-arm',37);react(a,'head',10);react(a,'body',9);
 }else if(kind==='warden'){
  const wings=part(a,'mantle',[0,-76],'root');shape(wings,'M-18 -75 L-40 -63 -45 -44 -33 -51 -23 -50 -14 -69Z M17 -76 L38 -85 48 -73 37 -74 26 -59 14 -62Z','wood');
  const body=part(a,'body',[0,-60],'root');shape(body,'M-24 -92 L22 -92 25 -25 16 -7 8 -16 0 2 -9 -15 -20 -4 -25 -25Z','wood','soul',.7);shape(body,'M-17 -78 L-9 -85 -10 -19 -16 -25Z M11 -81 L19 -76 17 -22 10 -16Z','woodLight');line(body,'M-25 -59 Q0 -50 25 -60 M-23 -56 Q0 -47 23 -57','linenShade',1.8,0);shape(body,'M-5 -50 L6 -49 5 -15 -4 -20Z','linen');line(body,'M-2 -44 L3 -41 -2 -35 2 -28','red',1.2,0);
  const head=part(a,'head',[0,-91],'body');shape(head,'M-24 -96 L-22 -120 -10 -125 -6 -119 8 -124 21 -118 24 -95 13 -79 -13 -80Z','woodLight');shape(head,'M-20 -108 L-6 -104 0 -109 7 -105 21 -110 17 -99 6 -98 -3 -101 -15 -98Z','shade');shape(head,'M-3 -104 L5 -105 10 -90 1 -86 -6 -91Z','wood');line(head,'M-17 -91 Q0 -78 17 -91','feature',2,0);line(head,'M-9 -86 L-8 -81 M0 -84 L1 -79 M9 -85 L9 -81','linen',1.6,0);react(a,'mantle',7);react(a,'head',5);
 }else{
  for(const side of [-1,1]){const p=part(a,side<0?'left-door':'right-door',[side*10,-79],'root');shape(p,`M${side*8} -104 L${side*31} -117 ${side*43} -105 ${side*41} -38 ${side*28} -11 ${side*16} -22 ${side*9} -44Z`,'wood','ink',1);shape(p,`M${side*17} -96 L${side*30} -103 ${side*32} -45 ${side*25} -29 ${side*19} -43Z`,'linenShade');line(p,`M${side*21} -92 L${side*23} -41 M${side*27} -98 L${side*28} -36 M${side*18} -83 L${side*31} -88 M${side*19} -67 L${side*31} -71 M${side*20} -50 L${side*31} -54`,'wood',1.1,0);sway(a,p.id,side*2);react(a,p.id,side*17);}
  const body=part(a,'body',[0,-61],'root');shape(body,'M-7 -87 L8 -88 17 -57 8 -26 13 -5 3 -12 -2 3 -11 -13 -14 -4 -8 -35 -16 -61Z','cloth');shape(body,'M-2 -77 L5 -79 9 -53 0 -20 -6 -47Z','soul');
  const head=part(a,'head',[0,-93],'root');shape(head,'M-11 -105 L0 -111 12 -103 10 -90 2 -83 -9 -89Z','skin');line(head,'M-7 -98 L-2 -96 M4 -97 L9 -99','feature',1.5,0);line(head,'M-2 -89 L5 -90','feature',.9,0);sway(a,'head',1.6);
 }
 if(kind==='warden'){
  const body=a.parts.find(p=>p.id==='body'),head=a.parts.find(p=>p.id==='head');body.paths[0].stroke='ink';body.paths[0].width=1.1;head.paths[0].stroke='ink';head.paths[0].width=1;
  // Split grain and an uneven carved mouth keep the post from reading as a smiling toy.
  head.paths[3]={d:'M-17 -92 L-4 -88 5 -91 17 -92 13 -83 2 -85 -10 -84Z',fill:'deep',stroke:null,width:.6,lod:0};
  head.paths[4]={d:'M-10 -90 L-9 -85 M-3 -88 L-3 -83 M8 -91 L7 -87 M14 -91 L12 -86',fill:null,stroke:'linenShade',width:1.5,lod:0};
  line(body,'M-18 -87 L-15 -62 -18 -39 M16 -72 L12 -60 15 -42 M-8 -35 L-10 -23','deep',1,1);
  line(head,'M-12 -119 L-9 -110 M15 -115 L11 -108','wood',1,1);
 }else if(kind==='charger'){
  const h=a.parts.find(p=>p.id==='head');h.paths[0].stroke='ink';h.paths[0].width=1;
  h.paths[4].d='M-1 -92 L7 -95 13 -91 23 -95';h.paths[4].stroke='deep';
  line(h,'M-7 -116 L-4 -110 M23 -103 L20 -99','wood',.9,1);
  const arm=a.parts.find(p=>p.id==='front-arm'),club=part(a,'club',[36,-43],'front-arm');club.paths=arm.paths.splice(-2);
  for(const tr of a.clips.attack.tracks)if(tr.part==='front-arm')tr.keys=tr.keys.map(([t,v])=>[t,-v]);
  track(a,'attack','club','rotate',[[0,0],[.22,-12],[.48,58],[.72,20],[1,0]]);
 }
 track(a,'idle','root','y',[[0,0],[.5,-2],[1,0]]);track(a,'move','root','rotate',[[0,0],[.25,4],[.75,-4],[1,0]]);track(a,'attack','root','x',[[0,0],[.2,-3],[.48,5],[1,0]]);track(a,'hit','root','rotate',[[0,-8],[.4,3],[1,0]]);track(a,'jump_fall','root','rotate',[[0,0],[.4,-5],[.7,3],[1,0]]);return a;
}
