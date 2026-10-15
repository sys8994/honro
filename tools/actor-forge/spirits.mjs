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
  a.brief.silhouette='비어 있는 수의 깃과 아래로 길게 꺾인 소매, 한쪽으로 흐르는 검은 머리';
  a.brief.identity=[d.name,'교차한 수의 앞섶과 빈 목둘레','얼굴의 눈·입 없이 처진 천과 긴 손'];
  const back=part(a,'rear-arm',[-15,-77],'root');shape(back,'M-17 -88 L-32 -83 -42 -63 -42 -34 -33 -42 -29 -63 -12 -68Z','shade','ink',1.1);shape(back,'M-41 -38 L-35 -39 -35 -26 -38 -17 -40 -28 -44 -24Z','skinShade','ink',.8);
  const body=part(a,'body',[0,-60],'root');shape(body,'M-14 -92 L9 -94 25 -81 21 -54 14 -31 20 -2 6 -13 -2 5 -9 -13 -24 -5 -19 -31 -25 -57 -27 -80Z','linenShade','ink',1.3);shape(body,'M-14 -91 L-3 -89 13 -72 4 -57 -9 -40 -6 -20 -13 -10 -15 -38 -13 -59 -21 -78Z','linen');shape(body,'M10 -91 L20 -82 6 -65 -9 -49 -13 -57 0 -74Z','light','ink',.7);shape(body,'M-8 -89 L4 -91 8 -81 0 -73 -9 -80Z','deep');line(body,'M-15 -43 L10 -46','linen',2,0);shape(body,'M8 -44 L15 -43 11 -19 8 -25 4 -15Z','shade');
  const head=part(a,'head',[0,-94],'body');shape(head,'M-11 -93 L-15 -110 -6 -121 7 -120 17 -110 19 -92 27 -74 17 -79 11 -95 7 -108 -3 -111 -5 -99 -10 -83 -17 -77Z','hair','ink',1.2);shape(head,'M-8 -108 L4 -112 11 -105 9 -94 1 -87 -6 -93Z','deep');shape(head,'M-8 -112 L8 -114 10 -110 -6 -108Z','linenShade');line(head,'M-12 -104 L-13 -91 M14 -107 L17 -88','hairLight',1,1);
  const arm=part(a,'front-arm',[14,-75],'body');shape(arm,'M15 -85 L30 -79 35 -62 28 -39 19 -35 21 -52 24 -64 13 -65Z','linenShade','ink',1.2);shape(arm,'M20 -40 L28 -42 28 -26 24 -14 23 -27 19 -20 18 -29Z','skinShade','ink',.9);shape(arm,'M21 -78 L28 -70 28 -59 23 -48 23 -64Z','linen');react(a,'front-arm',23);react(a,'head',8);breathe(a,'rear-arm',4);
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
  a.brief.reference='장승의 목주·금줄 구조를 참고한 아군 수호 영체; 장승을 악한 존재로 해석하지 않음';
  a.brief.silhouette='갈라진 굵은 목주와 아래로 처진 짧은 곁가지, 무거운 수직 얼굴';
  a.brief.identity=[d.name,'과장된 웃음 대신 닫힌 깊은 입홈','거친 절단면과 한 겹 금줄, 큰 목재 면'];
  const wings=part(a,'mantle',[0,-76],'root');shape(wings,'M-20 -79 L-38 -75 -43 -49 -34 -55 -32 -66 -19 -61Z M18 -79 L37 -71 43 -50 34 -56 29 -65 18 -61Z','wood','ink',1.3);shape(wings,'M-35 -72 L-38 -57 M32 -69 L37 -57',null,'woodLight',1.5);
  const body=part(a,'body',[0,-60],'root');shape(body,'M-26 -94 L23 -93 28 -32 21 -12 9 -15 3 2 -8 -12 -21 -7 -29 -30Z','wood','ink',1.6);shape(body,'M-18 -85 L-7 -89 -8 -36 -14 -19 -19 -27Z','woodLight');shape(body,'M11 -87 L20 -82 22 -33 15 -23 9 -28Z','shade');line(body,'M-28 -59 L-7 -54 25 -59 M-27 -55 L-7 -50 25 -55','linenShade',2.3,0);shape(body,'M-5 -49 L6 -49 8 -21 2 -16 -5 -23Z','linenShade','ink',.7);line(body,'M-2 -43 L3 -39 -1 -33 3 -27','red',1.1,1);line(body,'M-18 -82 L-15 -62 M16 -46 L12 -28','deep',1.2,1);
  const head=part(a,'head',[0,-91],'body');shape(head,'M-23 -98 L-24 -122 -13 -131 1 -127 12 -131 23 -122 24 -99 16 -81 -12 -81Z','wood','ink',1.5);shape(head,'M-17 -122 L-5 -124 -7 -109 -11 -91 -5 -84 -15 -86 -20 -99Z','woodLight');shape(head,'M4 -121 L16 -122 18 -109 11 -91 5 -86 8 -109Z','woodLight');shape(head,'M-19 -110 L-4 -107 -6 -102 -18 -104Z M4 -107 L20 -111 18 -105 6 -102Z','deep');shape(head,'M-3 -110 L3 -111 7 -94 1 -90 -5 -94Z','wood','ink',.9);shape(head,'M-13 -87 L11 -89 10 -84 -11 -82Z','deep');line(head,'M-14 -122 L-10 -115 M13 -123 L10 -117','linenShade',1,1);react(a,'mantle',7);react(a,'head',5);
 }else if(kind==='eater'){
  a.viewBox=[-118,-160,236,186];Object.assign(a.palette,{cloth:'#303736',shade:'#1b2928',deep:'#101817',skin:'#897f6a',soul:'#8fa69a',glow:'#d0d8bc'});
  a.parts[0].pivot=[0,16];
  a.brief.silhouette='넓은 귀면, 비틀린 광대 아래로 탈구된 턱과 압박된 배, 땅을 움켜쥔 발';
  a.brief.identity=[d.name,'비대칭 눈구멍과 찢긴 저작근','길고 엇갈린 이빨과 복부 안의 포획 혼'];
  const feet=part(a,'ground-feet',[0,16],'root');shape(feet,'M-39 -20 L-24 -17 -23 3 -15 10 -16 15 -43 16 -49 12 -38 5Z M24 -18 L40 -21 39 4 50 11 48 16 19 15 17 10 26 3Z','shade','ink',1.4);line(feet,'M-43 12 L-35 11 M-29 10 L-25 14 M30 12 L35 11 M41 11 L44 14','skin',1.5,0);
  const shroud=part(a,'shroud',[0,-75],'root');shape(shroud,'M-48 -111 Q-78 -98 -83 -63 L-69 -37 -86 -11 -48 -25 -35 -4 -16 -17 0 6 19 -18 43 -2 55 -27 86 -13 69 -43 83 -68 Q63 -105 43 -112Z','cloth','ink',2);shape(shroud,'M-68 -59 Q-53 -80 -43 -79 L-50 -44 -70 -31Z M45 -81 Q67 -75 72 -54 L61 -32 47 -43Z','shade');shape(shroud,'M-71 -44 L-103 -22 -86 -21 -109 -6 -79 -14 -92 1 -62 -19Z M69 -39 L101 -28 83 -16 109 -9 82 -9 93 4 61 -19Z','shade','ink',1.3);line(shroud,'M-72 -51 L-82 -37 M-58 -38 L-64 -18 M70 -51 L78 -36 M55 -29 L59 -14','soul',1.3,1);
  const face=part(a,'face',[0,-88],'shroud');shape(face,'M-54 -119 L-36 -142 -12 -139 1 -128 25 -140 48 -123 57 -99 53 -77 39 -59 9 -38 -23 -47 -58 -79Z','skin','ink',2.1);shape(face,'M-49 -112 L-37 -122 -20 -112 -12 -103 -30 -88 -52 -96Z M49 -110 L38 -118 22 -113 9 -100 25 -94 51 -100Z','deep','ink',1.1);shape(face,'M-46 -89 Q-8 -102 41 -85 L49 -64 33 -43 11 -23 -14 -29 -40 -46 -51 -65Z','deep','ink',1.5);shape(face,'M-40 -85 L-34 -64 -27 -86 -21 -70 -12 -90 -4 -63 4 -88 13 -72 20 -85 27 -60 36 -82 41 -70 M-33 -49 L-26 -64 -20 -40 -10 -58 -4 -33 7 -55 14 -31 25 -51 30 -43','linen','ink',.8);oval(face,0,-66,11,14,'ink');line(face,'M-51 -88 L-62 -81 M52 -88 L63 -81 M-27 -130 L-23 -138 M27 -130 L23 -138 M-37 -119 L-40 -103 M-5 -132 L-14 -115 0 -108 M40 -119 L32 -108','woodLight',2,0);
  // Large structural planes: temples, torn masseter and hanging lower jaw.
  shape(face,'M-52 -115 L-37 -131 -23 -129 -31 -116 -46 -105 -49 -91 -57 -82Z','skinShade','ink',1.2);
  shape(face,'M18 -132 L39 -122 49 -104 34 -110 25 -119Z','linenShade');
  shape(face,'M-53 -89 L-43 -82 -46 -64 -34 -47 -23 -36 -30 -33 -48 -49 -59 -72Z M47 -94 L56 -82 52 -62 34 -39 21 -23 9 -19 -12 -25 -21 -34 8 -29 28 -44 43 -64Z','wood','ink',1.7);
  shape(face,'M-50 -77 L-46 -68 -41 -61 -38 -51 -46 -57 -53 -70Z M45 -76 L49 -70 42 -55 36 -50 40 -62Z','skinShade');
  // An off-centre distended abdominal sack presses down between the grounded feet.
  shape(shroud,'M-38 -48 Q-12 -57 29 -42 L43 -20 29 -2 7 9 -21 1 -37 -17Z','skinShade','ink',1.5);
  shape(shroud,'M-29 -36 Q-11 -43 1 -24 L7 -4 -9 -8 -19 -23 -31 -22Z','skin');
  shape(shroud,'M15 -34 L29 -29 33 -17 22 -6 8 0 15 -14Z','shade');
  const maw=part(a,'maw',[0,-55],'face');shape(maw,'M-13 -64 Q-6 -71 2 -67 L11 -65 14 -57 8 -51 -1 -50 -11 -54Z','deep','skinShade',.7);shape(maw,'M-10 -63 L-7 -59 -4 -65 0 -60 4 -64 7 -59 10 -62 M-7 -54 L-4 -58 -1 -53 3 -57 7 -54','linenShade',null,.6);line(maw,'M-3 -61 Q4 -64 5 -59 Q2 -56 -2 -58','soul',.7,0);react(a,'face',5);breathe(a,'shroud',4);breathe(a,'face',3,-1);breathe(a,'maw',7,-1);
  // The mouth tears open vertically while the mask remains recognizable.
  track(a,'attack','maw','scaleY',[[0,1],[.18,.55],[.46,3.4],[.7,1.8],[1,1]]);
  track(a,'attack','maw','scaleX',[[0,1],[.18,1.25],[.46,1.7],[.7,.65],[1,1]]);
  track(a,'attack','face','scaleY',[[0,1],[.18,.93],[.46,1.13],[.7,.96],[1,1]]);
  track(a,'attack','shroud','scaleX',[[0,1],[.18,1.05],[.46,.87],[.7,1.09],[1,1]]);
 }else if(kind==='echo'){
  a.viewBox=[-82,-156,164,173];Object.assign(a.palette,{linen:'#c6c0a9',cloth:'#67767b',shade:'#3d4d52'});
  a.brief.silhouette='서로 어긋난 빈 소매와 길게 접힌 종이 수의, 텅 빈 두건';
  a.brief.identity=[d.name,'웃는 종이 얼굴 대신 검은 두건 안쪽','좌우 다른 길이의 빈 소매와 큰 접힘면'];
  for(const side of [-1,1]){const wing=part(a,side<0?'left-paper':'right-paper',[side*9,-73],'root');shape(wing,side<0?'M-9 -117 L-31 -115 -50 -98 -57 -56 -39 -48 -26 -65 -22 -85 -12 -73Z':'M8 -113 L31 -105 52 -78 55 -36 34 -32 25 -52 28 -71 13 -82Z','linenShade','ink',1.2);shape(wing,side<0?'M-48 -67 L-34 -61 -39 -49 -55 -55Z':'M33 -47 L52 -46 54 -36 35 -32Z','deep','ink',1);shape(wing,side<0?'M-28 -109 L-38 -96 -45 -70 -36 -66 -27 -87Z':'M29 -100 L40 -78 44 -51 34 -51 32 -73Z','linen');line(wing,side<0?'M-23 -105 L-24 -92 -19 -86':'M24 -95 L29 -80 25 -72','red',1.2,1);breathe(a,wing.id,7,side);react(a,wing.id,side*25);}
  const body=part(a,'body',[0,-73],'root');shape(body,'M-11 -115 L10 -114 20 -84 14 -48 19 -17 4 -6 -2 2 -14 -15 -17 -45 -20 -82Z','shade','ink',1.2);shape(body,'M-10 -106 L1 -95 9 -107 13 -94 1 -79 -5 -52 4 -22 -4 -11 -13 -43 -12 -78Z','linenShade');shape(body,'M2 -81 L11 -91 9 -53 13 -24 6 -16 1 -46Z','cloth');line(body,'M-12 -52 L11 -55','linenShade',1.5,0);
  const head=part(a,'head',[0,-112],'body');shape(head,'M-15 -130 L-6 -143 9 -140 19 -128 14 -109 4 -99 -12 -108Z','linenShade','ink',1.3);shape(head,'M-7 -132 L6 -134 12 -125 7 -109 0 -105 -9 -115Z','deep');shape(head,'M-15 -128 L-9 -119 -11 -108 -4 -101 -13 -106 -19 -119Z','linen');line(head,'M9 -137 L15 -128 11 -117','linen',1.1,1);react(a,'head',7);
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
 if(kind==='charger'){
  const arm=a.parts.find(p=>p.id==='front-arm'),club=part(a,'club',[36,-43],'front-arm');club.paths=arm.paths.splice(-4);
  for(const tr of a.clips.attack.tracks)if(tr.part==='front-arm')tr.keys=tr.keys.map(([t,v])=>[t,-v]);
  track(a,'attack','club','rotate',[[0,0],[.22,-12],[.48,58],[.72,20],[1,0]]);
 }
 if(kind!=='eater')breathe(a,'root',3);track(a,'move','root','rotate',[[0,0],[.25,4],[.75,-4],[1,0]]);track(a,'attack','root','x',[[0,0],[.2,-3],[.48,5],[1,0]]);track(a,'hit','root','rotate',[[0,-8],[.4,3],[1,0]]);track(a,'jump_fall','root','rotate',[[0,0],[.4,-5],[.7,3],[1,0]]);return a;
}
