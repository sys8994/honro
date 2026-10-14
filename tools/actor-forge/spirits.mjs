import {asset,part,shape,line,oval,track,react} from './shapes.mjs';
// Uneven compression changes the contour without rocking a whole spirit like a toy.
function breathe(a,id,strength=1,phase=1){
 const amount=Math.min(.055,Math.max(.012,Math.abs(strength)*.0045));
 track(a,'idle',id,'scaleX',[[0,1],[.29,1+amount*phase],[.68,1-amount*.7*phase],[1,1]]);
 track(a,'idle',id,'scaleY',[[0,1],[.29,1-amount*.55*phase],[.68,1+amount*.45*phase],[1,1]]);
}
// Each summon keeps a distinct outer contour at 64 px, within the original 3x ceiling.
export function spirit(d){
 const a=asset(d,112,[-74,-130,148,148]),kind=d.id.slice(7);Object.assign(a.palette,{cloth:'#526773',shade:'#334954',light:'#829CA3',skin:'#B3C6BF',skinShade:'#708E8D'});part(a,'root',[0,-60]);
 a.brief={reference:'국립민속박물관 신들이 사는 마을의 장승·도깨비·저승사자와 국가유산 귀면와 도상에서 소재를 취해 새로 그린 벡터',silhouette:{stalker:'풀어헤친 머리와 수의, 길게 내려온 손',charger:'눈썹과 코가 큰 목탈, 몽둥이와 넓은 어깨',lantern:'청홍 천을 두른 사각 행등과 혼불',warden:'장승 얼굴과 금줄을 두른 넓은 목주',host:'열리는 창호 문짝과 그 사이의 얼굴',eater:'기와 귀면처럼 넓게 벌어진 입과 검은 포식의 소용돌이',echo:'좌우로 벌어진 두 겹의 종이 인형',earthbound:'땅에 박힌 제의 기둥과 뿌리 금줄'}[kind],identity:[d.name,'먹빛·삼베·목재와 연한 혼빛','서로 다른 외곽과 얼굴·도구'],materials:['영체','오래된 천','봉인 목재']};
 if(kind==='lantern'){
  const frame=part(a,'frame',[0,-67],'root');line(frame,'M-12 -97 Q-15 -115 0 -116 Q15 -116 12 -97','woodLight',2,0);shape(frame,'M-26 -99 L26 -99 29 -92 25 -32 -25 -32 -29 -92Z','wood','ink',1);
  shape(frame,'M-23 -91 L22 -91 21 -62 -22 -62Z','red');shape(frame,'M-22 -62 L21 -62 21 -36 -22 -36Z','cloth');shape(frame,'M-9 -90 L9 -90 9 -37 -9 -37Z','linenShade');line(frame,'M-22 -91 L-22 -35 M22 -91 L22 -35 M-26 -94 L26 -94 M-26 -33 L26 -33','woodLight',1.8,0);
  const flame=part(a,'flame',[0,-61],'frame');shape(flame,'M-9 -51 Q-17 -65 -3 -79 L-2 -68 7 -82 Q20 -65 11 -51 L4 -46Z','soul');shape(flame,'M-2 -52 Q-9 -63 3 -68 L6 -61 5 -52Z','glow');
  const tails=part(a,'tails',[0,-32],'frame');shape(tails,'M-16 -33 Q-24 -13 -12 2 L-18 -3 -24 -20 -22 -34Z M10 -32 Q24 -19 13 -5 L18 -10 18 -24 7 -27Z','light');line(tails,'M-4 -30 Q-8 -12 0 5 L6 8','soul',1.2,0);breathe(a,'tails',6);breathe(a,'frame',3);react(a,'flame',16);
 }else if(kind==='stalker'){
  const back=part(a,'rear-arm',[-15,-77],'root');shape(back,'M-12 -87 Q-40 -87 -44 -56 L-39 -33 -36 -42 -32 -37 -34 -58 -19 -66Z','shade');
  const body=part(a,'body',[0,-60],'root');shape(body,'M-8 -91 L13 -91 26 -77 22 -49 13 -29 17 -5 4 -15 -3 5 -9 -14 -22 -3 -17 -29 -26 -47 -25 -79Z','linenShade');shape(body,'M-11 -87 L3 -74 13 -89 17 -80 2 -65 -3 -42 4 -21 -5 -7 -8 -30 -13 -52Z','linen');
  const head=part(a,'head',[0,-94],'body');shape(head,'M-6 -105 Q4 -112 12 -100 L13 -89 6 -82 -3 -88Z','skin');shape(head,'M-8 -95 Q-20 -115 2 -115 Q20 -115 18 -96 L21 -77 14 -81 12 -96 5 -105 -3 -99 -5 -81 -11 -74Z','hair');shape(head,'M-1 -97 L4 -96 2 -93 -2 -94Z M7 -96 L11 -95 10 -92 7 -92Z','deep');line(head,'M3 -88 L7 -88','feature',1,0);line(head,'M-12 -108 L12 -107','linen',2,0);
  const arm=part(a,'front-arm',[14,-75],'body');shape(arm,'M13 -83 Q36 -82 33 -57 L26 -43 28 -28 23 -34 20 -27 18 -45 23 -63 14 -63Z','linenShade');line(arm,'M26 -67 L23 -48 24 -39','soul',1.2,0);react(a,'front-arm',23);react(a,'head',8);breathe(a,'rear-arm',4);
 }else if(kind==='charger'){
  // A heavy carved timber bearer: blunt crown, long jaw and a working mallet.
  // Keep the old limb pivots and clip contract so lunges and recoil stay anchored.
  a.brief.silhouette='깎아 세운 긴 목면과 내려앉은 어깨, 무거운 나무 메';
  a.brief.identity=[d.name,'웃는 탈 대신 깊이 팬 눈과 닫힌 턱','삼베 어깨띠와 큰 메의 넓은 타격면'];
  const back=part(a,'rear-arm',[-22,-77],'root');shape(back,'M-15 -92 L-34 -90 -44 -73 -43 -49 -33 -46 -31 -69 -13 -73Z','shade','ink',1.2);
  const body=part(a,'body',[0,-57],'root');shape(body,'M-18 -94 L10 -100 27 -89 31 -62 20 -40 13 -25 17 -3 5 -10 -1 3 -10 -6 -17 -3 -15 -28 -28 -52 -31 -76Z','cloth','ink',1.3);shape(body,'M-17 -89 L-4 -89 7 -65 2 -40 -6 -17 -10 -41 -21 -63Z','light');shape(body,'M9 -92 L22 -83 24 -63 11 -43 6 -29 7 -58Z','shade');shape(body,'M-22 -82 L-17 -88 19 -60 15 -54Z','linenShade','ink',.8);line(body,'M-18 -41 L8 -44','linenShade',2.3,0);
  const head=part(a,'head',[9,-89],'body');shape(head,'M-5 -124 L17 -127 27 -119 25 -103 19 -87 6 -80 -5 -91 -8 -111Z','wood','ink',1.5);shape(head,'M-2 -120 L12 -122 16 -113 11 -101 13 -87 6 -84 -2 -94Z','woodLight');shape(head,'M-5 -113 L7 -110 6 -104 -4 -106Z M14 -111 L24 -116 23 -108 15 -105Z','deep');line(head,'M-2 -109 L4 -108 M17 -109 L22 -111','soul',1,0);shape(head,'M8 -113 L13 -112 17 -98 11 -95 6 -99Z','woodLight','ink',.8);shape(head,'M2 -93 L17 -96 16 -90 6 -88Z','deep');line(head,'M-1 -119 L1 -115 M20 -101 L17 -98','linenShade',1,1);
  const arm=part(a,'front-arm',[19,-76],'body');shape(arm,'M18 -88 L34 -82 40 -63 37 -42 26 -37 22 -45 28 -53 25 -65 16 -68Z','cloth','ink',1.3);shape(arm,'M28 -57 L38 -58 37 -44 29 -41 25 -47Z','woodLight','ink',1);line(arm,'M32 -32 L46 -79','wood',5,0);shape(arm,'M32 -89 L51 -98 62 -84 54 -69 36 -72Z','wood','ink',1.5);shape(arm,'M35 -86 L49 -93 55 -84 49 -76 38 -78Z','woodLight');line(arm,'M52 -95 L58 -83 51 -72','linenShade',2.1,0);react(a,'front-arm',37);react(a,'head',10);react(a,'body',9);
 }else if(kind==='warden'){
  const wings=part(a,'mantle',[0,-76],'root');shape(wings,'M-18 -75 L-40 -63 -45 -44 -33 -51 -23 -50 -14 -69Z M17 -76 L38 -85 48 -73 37 -74 26 -59 14 -62Z','wood');
  const body=part(a,'body',[0,-60],'root');shape(body,'M-24 -92 L22 -92 25 -25 16 -7 8 -16 0 2 -9 -15 -20 -4 -25 -25Z','wood','soul',.7);shape(body,'M-17 -78 L-9 -85 -10 -19 -16 -25Z M11 -81 L19 -76 17 -22 10 -16Z','woodLight');line(body,'M-25 -59 Q0 -50 25 -60 M-23 -56 Q0 -47 23 -57','linenShade',1.8,0);shape(body,'M-5 -50 L6 -49 5 -15 -4 -20Z','linen');line(body,'M-2 -44 L3 -41 -2 -35 2 -28','red',1.2,0);
  const head=part(a,'head',[0,-91],'body');shape(head,'M-24 -96 L-22 -120 -10 -125 -6 -119 8 -124 21 -118 24 -95 13 -79 -13 -80Z','woodLight');shape(head,'M-20 -108 L-6 -104 0 -109 7 -105 21 -110 17 -99 6 -98 -3 -101 -15 -98Z','shade');shape(head,'M-3 -104 L5 -105 10 -90 1 -86 -6 -91Z','wood');line(head,'M-17 -91 Q0 -78 17 -91','feature',2,0);line(head,'M-9 -86 L-8 -81 M0 -84 L1 -79 M9 -85 L9 -81','linen',1.6,0);react(a,'mantle',7);react(a,'head',5);
 }else if(kind==='eater'){
  a.viewBox=[-118,-160,236,186];Object.assign(a.palette,{cloth:'#303736',shade:'#1b2928',deep:'#101817',skin:'#897f6a',soul:'#8fa69a',glow:'#d0d8bc'});
  a.parts[0].pivot=[0,16];
  a.brief.reference='한국민족문화대백과 불가사리의 식철 설화: 정형 복원이 아닌 먹귀의 독자적 포식 구조';
  a.brief.silhouette='한쪽으로 솟은 등과 철갑이 갈라진 세로 포식강, 낮게 웅크린 무거운 몸';
  a.brief.identity=[d.name,'얼굴 대신 한쪽 어깨의 작은 눈틈과 비대칭 철갑','엇갈린 파쇄면과 깊은 세로 포식강, 접지한 넓은 발'];
  const feet=part(a,'ground-feet',[0,16],'root');shape(feet,'M-44 -25 L-24 -19 -25 4 -15 10 -17 15 -47 16 -51 10 -42 2Z M23 -20 L45 -24 43 3 54 10 51 16 19 15 17 9 27 2Z','shade','ink',1.6);line(feet,'M-43 10 L-38 14 M-31 9 L-29 14 M32 10 L35 14 M43 10 L46 14','skinShade',1.8,0);
  const shroud=part(a,'shroud',[0,-75],'root');shape(shroud,'M-29 -130 L-61 -119 -82 -92 -87 -56 -72 -30 -75 -7 -51 -17 -34 -4 -15 -11 0 3 22 -14 44 -3 57 -21 79 -10 66 -42 73 -67 56 -96 19 -112Z','cloth','ink',2);shape(shroud,'M-58 -113 L-77 -86 -77 -57 -55 -35 -50 -16 -32 -27 -38 -63 -30 -99Z','skinShade','ink',1.5);shape(shroud,'M-62 -103 L-70 -82 -58 -59 -46 -48 -50 -76 -42 -97Z','skin');shape(shroud,'M46 -88 L65 -68 62 -44 48 -20 33 -34 35 -61Z','shade','ink',1);shape(shroud,'M-67 -49 L-91 -35 -103 -9 -83 -15 -77 -3 -60 -24Z M60 -38 L89 -29 102 -8 78 -13 69 -4 54 -21Z','skinShade','ink',1.4);line(shroud,'M-89 -26 L-96 -14 M85 -23 L94 -13','skin',1.7,0);
  const face=part(a,'face',[0,-88],'shroud');
  // A split mineral/iron carapace and a displaced crushing throat, not a mask face.
  shape(face,'M-43 -116 L-25 -142 1 -147 27 -134 39 -111 31 -91 46 -72 38 -47 11 -32 -19 -38 -43 -66 -51 -93Z','skinShade','ink',2.2);
  shape(face,'M-40 -114 L-22 -136 0 -140 14 -130 2 -118 -8 -92 -32 -78 -42 -85Z','skin','ink',1.1);
  shape(face,'M16 -129 L29 -126 33 -112 24 -96 38 -74 31 -52 18 -45 24 -72 12 -92Z','wood','ink',1.1);
  shape(face,'M-10 -121 L5 -133 17 -125 11 -104 23 -82 17 -57 3 -40 -17 -46 -27 -63 -21 -85Z','deep','ink',1.5);
  shape(face,'M-12 -112 L-4 -119 -8 -96 -17 -86Z','linenShade','ink',1.1);
  shape(face,'M15 -80 L21 -72 14 -56 7 -51 12 -69Z','metal','ink',1);
  shape(face,'M-35 -62 L-25 -55 -16 -42 3 -35 23 -41 34 -52 33 -38 12 -26 -13 -30 -34 -45Z','wood','ink',1.5);
  // A single occluded slit is displaced into the shoulder plate.
  shape(face,'M-37 -103 L-21 -108 -25 -101 -36 -99Z','deep');line(face,'M-33 -102 L-27 -104','soul',1.1,0);
  line(face,'M-25 -129 L-30 -116 M21 -120 L25 -110','woodLight',1.5,1);
  const maw=part(a,'maw',[0,-55],'face');shape(maw,'M-13 -70 L-3 -75 6 -68 11 -57 3 -46 -8 -48 -16 -60Z','deep','skinShade',.8);shape(maw,'M-13 -67 L-7 -70 -9 -60 -14 -56Z M6 -57 L9 -53 2 -47 -1 -49Z','metal',null,.6);line(maw,'M-3 -65 L2 -61 -1 -55','soul',.8,0);react(a,'face',5);breathe(a,'shroud',4);breathe(a,'face',3,-1);breathe(a,'maw',7,-1);
  // The mouth tears open vertically while the mask remains recognizable.
  track(a,'attack','maw','scaleY',[[0,1],[.18,.55],[.46,3.4],[.7,1.8],[1,1]]);
  track(a,'attack','maw','scaleX',[[0,1],[.18,1.25],[.46,1.7],[.7,.65],[1,1]]);
  track(a,'attack','face','scaleY',[[0,1],[.18,.93],[.46,1.13],[.7,.96],[1,1]]);
  track(a,'attack','shroud','scaleX',[[0,1],[.18,1.05],[.46,.87],[.7,1.09],[1,1]]);
 }else if(kind==='echo'){
  a.viewBox=[-82,-156,164,173];Object.assign(a.palette,{linen:'#c6c0a9',cloth:'#67767b',shade:'#3d4d52'});
  for(const side of [-1,1]){const wing=part(a,side<0?'left-paper':'right-paper',[side*9,-73],'root');shape(wing,`M${side*8} -124 L${side*38} -115 ${side*54} -96 ${side*43} -52 ${side*59} -16 ${side*25} -34 ${side*7} -9Z`,'linen','ink',1.1);shape(wing,`M${side*13} -109 L${side*31} -103 ${side*34} -66 ${side*21} -40Z`,'cloth');line(wing,`M${side*13} -104 L${side*25} -94 ${side*16} -84 ${side*30} -70 M${side*31} -100 L${side*19} -65`,'red',1.5,0);breathe(a,wing.id,7,side);react(a,wing.id,side*25);}
  const body=part(a,'body',[0,-73],'root');shape(body,'M-9 -113 L9 -113 20 -83 15 -32 0 1 -15 -32 -20 -83Z','shade','ink',1);shape(body,'M-9 -98 L0 -89 9 -98 9 -52 0 -31 -9 -52Z','soul');
  const head=part(a,'head',[0,-112],'body');shape(head,'M-18 -130 Q0 -145 18 -130 L15 -103 0 -94 -15 -103Z','linen','ink',1.2);line(head,'M-11 -116 L-2 -113 M3 -113 L12 -116 M-3 -104 L3 -104','red',1.5,0);react(a,'head',7);
 }else if(kind==='earthbound'){
  a.viewBox=[-79,-159,158,180];Object.assign(a.palette,{wood:'#514437',woodLight:'#958269',linen:'#c5b996',red:'#9c655a'});
  const roots=part(a,'roots',[0,-24],'root');shape(roots,'M-14 -34 L-37 -3 -59 3 -42 -10 -32 -24 -20 -20 -30 16 -12 2 0 -11 10 4 28 16 20 -20 34 -25 43 -7 59 3 39 -3 14 -35Z','wood','ink',1.1);
  const pole=part(a,'pole',[0,-68],'root');shape(pole,'M-17 -132 L13 -132 18 -44 11 -14 -12 -14 -20 -44Z','wood','ink',1.5);shape(pole,'M-11 -112 L8 -112 10 -53 -8 -53Z','woodLight');line(pole,'M-18 -73 Q0 -65 18 -74 M-18 -69 Q0 -62 18 -70','linen',2,0);shape(pole,'M-14 -100 L-2 -97 -9 -88Z M14 -100 L2 -97 9 -88Z','deep');line(pole,'M-7 -83 Q0 -78 7 -83 M-5 -53 L-5 -32 M5 -53 L5 -32','ink',1.6,0);
  const seal=part(a,'seal',[0,-81],'pole');shape(seal,'M-7 -107 L7 -107 8 -70 0 -64 -8 -70Z','linen','red',.8);line(seal,'M-4 -99 L4 -99 M-4 -94 L4 -91 -3 -87 4 -83 M0 -81 L0 -71','red',1.3,0);breathe(a,'seal',4);react(a,'pole',7);
 }else{
  for(const side of [-1,1]){const p=part(a,side<0?'left-door':'right-door',[side*10,-79],'root');shape(p,`M${side*8} -104 L${side*31} -117 ${side*43} -105 ${side*41} -38 ${side*28} -11 ${side*16} -22 ${side*9} -44Z`,'wood','ink',1);shape(p,`M${side*17} -96 L${side*30} -103 ${side*32} -45 ${side*25} -29 ${side*19} -43Z`,'linenShade');line(p,`M${side*21} -92 L${side*23} -41 M${side*27} -98 L${side*28} -36 M${side*18} -83 L${side*31} -88 M${side*19} -67 L${side*31} -71 M${side*20} -50 L${side*31} -54`,'wood',1.1,0);breathe(a,p.id,2,side);react(a,p.id,side*17);}
  const body=part(a,'body',[0,-61],'root');shape(body,'M-7 -87 L8 -88 17 -57 8 -26 13 -5 3 -12 -2 3 -11 -13 -14 -4 -8 -35 -16 -61Z','cloth');shape(body,'M-2 -77 L5 -79 9 -53 0 -20 -6 -47Z','soul');
  const head=part(a,'head',[0,-93],'root');shape(head,'M-11 -105 L0 -111 12 -103 10 -90 2 -83 -9 -89Z','skin');line(head,'M-7 -98 L-2 -96 M4 -97 L9 -99','feature',1.5,0);line(head,'M-2 -89 L5 -90','feature',.9,0);breathe(a,'head',1.6);
 }
 if(kind==='warden'){
  const body=a.parts.find(p=>p.id==='body'),head=a.parts.find(p=>p.id==='head');body.paths[0].stroke='ink';body.paths[0].width=1.1;head.paths[0].stroke='ink';head.paths[0].width=1;
  // Split grain and an uneven carved mouth keep the post from reading as a smiling toy.
  head.paths[3]={d:'M-17 -92 L-4 -88 5 -91 17 -92 13 -83 2 -85 -10 -84Z',fill:'deep',stroke:null,width:.6,lod:0};
  head.paths[4]={d:'M-10 -90 L-9 -85 M-3 -88 L-3 -83 M8 -91 L7 -87 M14 -91 L12 -86',fill:null,stroke:'linenShade',width:1.5,lod:0};
  line(body,'M-18 -87 L-15 -62 -18 -39 M16 -72 L12 -60 15 -42 M-8 -35 L-10 -23','deep',1,1);
  line(head,'M-12 -119 L-9 -110 M15 -115 L11 -108','wood',1,1);
 }else if(kind==='charger'){
  const arm=a.parts.find(p=>p.id==='front-arm'),club=part(a,'club',[36,-43],'front-arm');club.paths=arm.paths.splice(-4);
  for(const tr of a.clips.attack.tracks)if(tr.part==='front-arm')tr.keys=tr.keys.map(([t,v])=>[t,-v]);
  track(a,'attack','club','rotate',[[0,0],[.22,-12],[.48,58],[.72,20],[1,0]]);
 }
 if(kind!=='eater')breathe(a,'root',3);track(a,'move','root','rotate',[[0,0],[.25,4],[.75,-4],[1,0]]);track(a,'attack','root','x',[[0,0],[.2,-3],[.48,5],[1,0]]);track(a,'hit','root','rotate',[[0,-8],[.4,3],[1,0]]);track(a,'jump_fall','root','rotate',[[0,0],[.4,-5],[.7,3],[1,0]]);return a;
}
