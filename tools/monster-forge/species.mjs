// Anatomical families share helpers, not a recoloured silhouette.
export function createExtras({asset,part,path,line,oval,track,sway,paper,react,walk}){
function make(id,name,h,box,silhouette,identity,materials){const a=asset(id,name,h,box,{silhouette,identity,materials,reference:'같은 종의 기존 게임 그림을 기준으로 한 수작업 벡터; 외부 이미지 없음'});a.version=2;return a;}
function ghost(shade=false){
 const a=make(shade?'shade':'ghost',shade?'매듭진 수의귀':'떠도는 혼',128,[-65,-142,130,154],shade?'묶인 얼굴과 비틀린 수의, 긴 매듭 끈':'텅 빈 소매와 구부러진 목, 갈라지는 수의',['가면 같은 얼굴',shade?'가로로 감긴 수의':'드리워진 긴 소매',shade?'붉은 결박 매듭':'갈라진 옷자락'],['수의','마른 피부','혼기']);
 part(a,'root',[0,-65]);
 const sleeve=part(a,'rear-sleeve',[-16,-85],'root');path(sleeve,shade?'M-13 -88 Q-33 -87 -29 -64 L-27 -45 -20 -49 -19 -29 -12 -48 -17 -64Z':'M-13 -88 Q-37 -91 -42 -65 L-47 -44 -36 -48 -38 -27 -27 -47 -21 -61Z','clothDark');
 const body=part(a,'body',[0,-70],'root');path(body,shade?'M-5 -126 Q-26 -117 -28 -94 L-30 -68 -20 -44 -13 -13 -6 -21 1 3 7 -20 15 -7 17 -36 22 -58 18 -86 11 -117Z':'M-5 -126 Q-22 -116 -24 -90 L-26 -60 -19 -39 -22 -7 -10 -17 -7 3 2 -15 10 -4 15 -30 24 -52 21 -83 11 -117Z','cloth');path(body,'M-12 -108 Q-18 -76 -10 -51 L-14 -26 -5 -36 -2 -7 5 -28 7 -68 3 -107Z','clothLight',null);path(body,'M12 -101 Q21 -79 13 -57 L9 -31 15 -40 20 -60Z','clothDark',null);
 const head=part(a,'head',[0,-108],'body');path(head,'M-9 -115 L-4 -125 5 -123 11 -113 8 -99 1 -93 -7 -100Z','boneShade');path(head,'M-4 -120 L4 -119 7 -111 3 -98 -3 -102Z','bone',null);path(head,'M-6 -111 L-1 -109 -5 -106Z M2 -109 L7 -113 5 -106Z','ink',null);line(head,'M-1 -103 L2 -100','redDark',1.2,0);
 const arm=part(a,'front-sleeve',[14,-83],'body');path(arm,shade?'M14 -91 Q23 -88 26 -73 L25 -61 20 -62 22 -46 14 -53 13 -67 9 -76Z':'M14 -91 Q29 -88 30 -70 L38 -56 33 -58 37 -42 26 -50 21 -66 12 -73Z','cloth');line(arm,shade?'M18 -81 L20 -69 18 -61':'M23 -79 L25 -66 30 -58','clothLight',1.2);
 line(body,'M-18 -75 Q-20 -58 -16 -48 M-3 -58 L-5 -36','clothDark',1);
 if(shade){const wrap=part(a,'bindings',[0,-85],'body');for(let i=0;i<4;i++){const y=-98+i*15;path(wrap,`M-22 ${y}L21 ${y+8} 21 ${y+13} -22 ${y+5}Z`,'boneShade','woodDark',.6);line(wrap,`M-19 ${y+2}L18 ${y+9}`,'paper',.8);}const knot=part(a,'knot',[12,-67],'body');path(knot,'M12 -68 Q28 -80 27 -65 L16 -62 34 -29 22 -37 11 -58 3 -48 0 -57Z','redDark');line(knot,'M13 -65 L28 -36','red',1);sway(a,'knot',4);}
 track(a,'idle','root','y',[[0,0],[.5,-1.5],[1,0]]);sway(a,'rear-sleeve',3);sway(a,'front-sleeve',3);sway(a,'head',1.4);walk(a,['root'],3);react(a,'front-sleeve',18);react(a,'head',7);return a;
}
function boar(){
 const a=make('boar','들린 멧돼지',125,[-89,-133,178,144],'솟은 어깨, 낮은 주둥이와 위로 휘는 엄니',['무거운 앞몸','갈라진 엄니','거친 등갈기'],['두꺼운 가죽','뻣뻣한 털','뼈']);
 const tail=part(a,'tail',[-48,-65]);line(tail,'M-47 -63 C-83 -64 -73 -91 -64 -79 Q-62 -71 -70 -73','wood',4,0);sway(a,'tail',3);
 const legs=['hind-far','fore-far','hind-near','fore-near'];
 for(const [i,x] of [-37,34].entries()){const p=part(a,legs[i],[x,-40]);path(p,`M${x-7} -49 L${x+7} -47 ${x+6} -21 ${x+10} -3 ${x+4} 0 ${x-8} 0 ${x-8} -8 ${x-5} -25Z`,'deep');}
 const body=part(a,'body',[0,-65]);path(body,'M-55 -41 Q-64 -72 -43 -90 L-35 -100 -33 -92 -23 -108 -20 -99 -11 -115 -7 -106 3 -120 7 -109 Q29 -113 42 -91 L53 -62 43 -34 11 -28 -23 -33 -45 -29Z','woodDark','ink',1.3);path(body,'M-48 -70 Q-25 -98 6 -95 Q33 -103 40 -80 L35 -46 18 -37 -8 -46 -36 -42Z','wood',null);path(body,'M-38 -87 Q-16 -105 14 -101 L24 -92 9 -91 -2 -79 -19 -78Z','woodLight',null);path(body,'M12 -89 Q36 -94 35 -68 L30 -49 22 -45 21 -69Z','boneShade',null);line(body,'M-30 -71 Q-24 -61 -28 -48 M-15 -79 Q-6 -65 -11 -50 M2 -80 L8 -62','woodDark',1.6);
 const head=part(a,'head',[36,-69],'body');path(head,'M29 -87 L42 -91 47 -106 54 -91 65 -77 68 -64 81 -59 82 -44 69 -37 49 -40 33 -54Z','wood');path(head,'M41 -84 L53 -86 63 -72 61 -61 71 -56 64 -47 47 -48 39 -63Z','woodLight',null);path(head,'M42 -88 L48 -101 51 -90Z','redDark',null);path(head,'M47 -72 L58 -75 56 -68 48 -67Z','ink',null);line(head,'M50 -71 L54 -71','soul',1.4,0);path(head,'M68 -59 Q82 -64 83 -51 L80 -44 69 -43 65 -49Z','woodDark');line(head,'M72 -52 L74 -49 M78 -53 L79 -50','ink',2,0);
 const tusk=part(a,'tusks',[60,-47],'head');path(tusk,'M58 -49 Q64 -25 77 -28 Q88 -33 86 -49 L79 -38 Q70 -31 68 -47Z','bone','woodDark');path(tusk,'M43 -52 Q45 -33 57 -37 L60 -45 53 -41 49 -51Z','boneShade','woodDark');
 for(const [i,x] of [-35,26].entries()){const p=part(a,legs[i+2],[x,-38]);path(p,`M${x-9} -47 Q${x+10} -53 ${x+10} -34 L${x+4} -15 ${x+8} -3 ${x+5} 1 ${x-12} 1 ${x-13} -6 ${x-7} -25Z`,'wood');path(p,`M${x-4} -39 L${x+2} -38 ${x-1} -18 ${x+1} -7 ${x-7} -7Z`,'woodLight',null);line(p,`M${x-12} -5 L${x+7} -5 M${x-3} -5 L${x-3} 0`,'ink',1.3,0);}
 const seal=part(a,'seal',[7,-64],'body');line(seal,'M-1 -70 L9 -65 1 -59 12 -53','red',1.6);sway(a,'head',1);track(a,'idle','body','y',[[0,0],[.5,-.5],[1,0]]);walk(a,legs,9);react(a,'head',14);return a;
}
function stag(){
 const a=make('stag','들린 숫사슴',150,[-90,-160,180,171],'가지뿔과 길게 선 목, 가는 발굽',['두 갈래 가지뿔','해골 같은 얼굴','긴 다리와 털 목깃'],['짧은 털','마른 뿔','봉인 천']);
 const tail=part(a,'tail',[-42,-56]);path(tail,'M-41 -66 L-59 -77 -62 -69 -52 -56 -41 -54Z','shadow');sway(a,'tail',4);
 const legs=['hind-far','fore-far','hind-near','fore-near'];for(const [i,x] of [-33,26].entries()){const p=part(a,legs[i],[x,-43]);path(p,`M${x-5} -51 L${x+5} -47 ${x+8} -26 ${x+4} -6 ${x+11} 0 ${x-3} 0 ${x-3} -8 ${x+1} -25 ${x-7} -36Z`,'deep');line(p,`M${x+3} -36 L${x+5} -25 ${x+1} -7`,'fur',1);}
 const body=part(a,'body',[0,-55]);path(body,'M-48 -49 Q-54 -67 -39 -78 L-26 -82 -4 -80 20 -89 32 -78 29 -53 17 -42 -3 -44 -27 -39 -43 -39Z','shadow');path(body,'M-45 -66 Q-27 -80 -7 -74 L17 -82 20 -65 9 -53 -7 -57 -31 -48Z','fur',null);line(body,'M-34 -64 Q-25 -57 -29 -48 M-20 -69 L-13 -58 -15 -50','light',1.1);
 const neck=part(a,'neck',[23,-69],'body');path(neck,'M16 -68 L25 -98 31 -116 42 -110 46 -92 42 -74 36 -60 31 -64 26 -55 27 -65 22 -59Z','fur');path(neck,'M30 -103 L35 -110 39 -99 35 -85 29 -74 29 -91Z','light',null);
 const antler=part(a,'antlers',[38,-114],'neck');line(antler,'M34 -113 L25 -127 19 -143 22 -156 M26 -128 L10 -133 4 -144 M19 -142 L9 -150 M43 -113 L49 -132 62 -146 60 -156 M49 -132 L67 -131 76 -143 M61 -144 L75 -150','boneShade',3,0);line(antler,'M34 -115 L26 -128 21 -143 M44 -115 L50 -132 62 -146','bone',1);
 const head=part(a,'head',[38,-105],'neck');path(head,'M30 -115 L42 -119 54 -111 55 -99 69 -91 67 -84 57 -84 47 -91 37 -88 30 -96Z','boneShade');path(head,'M34 -113 L43 -115 49 -110 48 -101 61 -92 55 -90 43 -98 35 -96Z','bone',null);path(head,'M35 -104 L45 -107 44 -100 36 -99Z','ink',null);line(head,'M38 -103 L42 -103','soul',1.3,0);path(head,'M63 -92 L70 -90 68 -84 62 -86Z','ink',null);
 const ears=part(a,'ears',[37,-113],'head');path(ears,'M32 -113 L19 -124 16 -120 23 -111 32 -108Z M45 -115 L57 -125 63 -123 57 -115 47 -111Z','fur');line(ears,'M23 -120 L29 -114 M58 -122 L49 -115','boneShade',1.2);
 const jaw=part(a,'jaw',[46,-93],'head');path(jaw,'M42 -94 L53 -90 64 -85 56 -82 46 -85 41 -89Z','shadow');line(jaw,'M46 -90 L54 -87','bone',1);
 for(const [i,x] of [-30,20].entries()){const p=part(a,legs[i+2],[x,-43]);path(p,`M${x-6} -50 Q${x+7} -55 ${x+8} -40 L${x-1} -25 ${x+5} -6 ${x+11} 0 ${x-4} 0 ${x-4} -6 ${x-8} -26 ${x-1} -39Z`,'fur');line(p,`M${x+1} -43 L${x-4} -26 ${x+1} -8`,'light',1.8);path(p,`M${x-4} -5 L${x+5} -5 ${x+11} 0 ${x-4} 0Z`,'ink',null);}
 const seal=part(a,'seal',[24,-82],'neck');paper(seal,22,-83,7,17);sway(a,'head',1);walk(a,legs,10);react(a,'neck',12);track(a,'attack','jaw','rotate',[[0,0],[.4,12],[1,0]]);return a;
}
function bird(crow=false){
 const a=make(crow?'crow':'bat',crow?'들린 까마귀':'들린 산박쥐',100,[-94,-117,188,132],crow?'갈라진 긴 날개깃과 뼈빛 부리':'긴 손가락뼈에 걸린 날개막과 큰 귀',[crow?'부채 모양 날개깃':'손가락뼈 날개막',crow?'긴 꼬리깃':'찢긴 귀',crow?'뼈빛 부리':'작은 송곳니'],crow?['깃털','뼈','혼기']:['날개막','털','연골']);part(a,'root',[0,-54]);
 for(const side of [-1,1]){const p=part(a,side<0?'left-wing':'right-wing',[side*8,-67],'root');const pts=crow?[[6,-71],[27,-96],[55,-109],[81,-101],[60,-94],[84,-89],[59,-81],[79,-75],[54,-68],[70,-59],[44,-57],[53,-46],[31,-49],[14,-39],[6,-51]]:[[6,-70],[29,-99],[57,-109],[84,-88],[62,-81],[52,-64],[39,-69],[25,-48],[14,-54],[6,-43]];path(p,pts.map(([x,y],i)=>`${i?'L':'M'}${x*side} ${y}`).join(' ')+'Z',crow?'feather':'redDark','ink',1);
  if(crow){for(let j=0;j<4;j++){const x=27+j*7,y=-89+j*8;path(p,`M${x*side} ${y} Q${(x+10)*side} ${y-4} ${(70-j*6)*side} ${y-6} L${(43-j*3)*side} ${y+5}Z`,j%2?'featherLight':'shadow',null,.6,1);}line(p,`M${9*side} -67 Q${28*side} -93 ${55*side} -103`,'metal',1.4,0);}
  else{path(p,`M${13*side} -67 Q${26*side} -93 ${55*side} -101 L${45*side} -82 ${27*side} -61Z`,'cloth',null);line(p,`M${8*side} -65 L${30*side} -94 ${78*side} -89 M${30*side} -94 L${51*side} -68 M${30*side} -94 L${26*side} -53`,'boneShade',1.1,0);line(p,`M${41*side} -83 Q${53*side} -89 ${62*side} -88`,'clothLight',.65,2);}
  track(a,'idle',p.id,'rotate',[[0,0],[.25,side*14],[.75,side*-16],[1,0]]);track(a,'move',p.id,'rotate',[[0,0],[.25,side*9],[.75,side*-9],[1,0]]);react(a,p.id,side*22);
 }
 if(crow){const tail=part(a,'tail',[0,-41],'root');path(tail,'M-8 -43 L-16 -5 -8 -11 -3 1 2 -9 8 0 14 -11 15 -41Z','feather');line(tail,'M-5 -39 L-7 -15 M1 -38 L1 -12 M7 -39 L10 -16','featherLight',1);}
 const body=part(a,'body',[0,-57],'root');path(body,crow?'M-9 -79 Q-18 -65 -10 -47 L-4 -34 7 -39 13 -53 9 -77Z':'M-9 -80 L-14 -65 -10 -42 0 -30 10 -42 14 -65 9 -81Z',crow?'feather':'shadow');path(body,'M-5 -71 Q-8 -54 0 -42 L5 -49 6 -68Z',crow?'featherLight':'fur',null);
 const head=part(a,'head',[0,-80],'body');path(head,crow?'M-7 -79 Q-13 -92 0 -97 Q13 -98 16 -85 L10 -76 1 -73Z':'M-10 -81 L-19 -107 -7 -99 -4 -88 3 -89 10 -103 18 -108 12 -83 7 -74 -5 -75Z',crow?'featherLight':'fur');
 if(crow){path(head,'M9 -89 Q21 -91 32 -79 L24 -76 11 -80Z','boneShade');line(head,'M14 -85 L25 -81','bone',1.3,0);path(head,'M3 -88 L11 -88 8 -83 4 -84Z','ink',null);line(head,'M6 -86 L9 -86','soul',1.1,0);}
 else{path(head,'M-14 -101 L-10 -86 -7 -83Z M13 -101 L8 -85 10 -83Z','redDark',null);path(head,'M-8 -83 L-2 -81 -5 -78Z M3 -81 L8 -83 6 -78Z','soul',null);path(head,'M-4 -75 L4 -75 3 -69 0 -72 -3 -69Z','bone',null);}
 const feet=part(a,'claws',[0,-41],'body');line(feet,'M-5 -42 L-7 -30 -13 -27 M6 -42 L8 -30 14 -27','boneShade',1.3,0);a.clips.idle.duration=crow?1.1:.7;sway(a,'head',2);react(a,'head',9);track(a,'attack','body','y',[[0,0],[.2,-3],[.45,3],[1,0]]);return a;
}
function human(mourner=false){
 const a=make(mourner?'mourner':'human',mourner?'들린 상두꾼':'들린 사람',150,[-80,-166,160,178],mourner?'머리가 사라진 수의와 상여를 메던 들보':'기울어진 갓과 해진 두루마기의 봉인 궁수',[mourner?'텅 빈 목깃':'무너진 갓',mourner?'상여 들보와 방울':'몸에 감긴 봉인 천',mourner?'찢긴 삼베 소매':'굽은 활과 화살통'],['삼베','낡은 가죽','나무']);
 const legs=['left-leg','right-leg'];for(const [i,x] of [-9,9].entries()){const p=part(a,legs[i],[x,-49]);path(p,`M${x-6} -54 L${x+7} -52 ${x+6} -34 ${x+3} -20 ${x+5} -6 ${x+13} -2 ${x+12} 1 ${x-8} 1 ${x-9} -4 ${x-6} -23 ${x-8} -38Z`,i?'shadow':'deep');path(p,`M${x-3} -43 L${x+2} -42 ${x} -25 ${x+1} -10 ${x-4} -7 ${x-4} -25Z`,'fur',null);line(p,`M${x-6} -11 L${x+4} -13 M${x-6} -16 L${x+3} -18`,'boneShade',1);}
 const back=part(a,'back-cloth',[-7,-104]);path(back,'M-8 -117 Q-31 -115 -33 -91 L-37 -68 -33 -39 -25 -17 -20 -32 -12 -23 -7 -48 0 -62 3 -101Z',mourner?'woodDark':'clothDark');path(back,'M-20 -104 L-28 -89 -29 -66 -22 -37 -20 -58 -13 -83Z',mourner?'wood':'cloth',null);line(back,'M-30 -73 L-27 -49 -24 -40 M-21 -104 L-24 -88','boneShade',.7,2);sway(a,'back-cloth',2);
 const torso=part(a,'torso',[0,-82]);path(torso,'M-17 -112 L-7 -117 7 -115 20 -107 25 -88 19 -63 22 -41 9 -34 1 -43 -8 -33 -21 -42 -17 -69 -23 -91Z',mourner?'wood':'redDark');path(torso,'M-15 -108 L-3 -98 10 -111 15 -98 4 -79 -2 -59 -15 -63 -13 -80Z',mourner?'paper':'red',null);path(torso,'M-18 -95 L-15 -77 -19 -62 -10 -57 -5 -77 -8 -87Z',mourner?'woodDark':'clothDark',null);path(torso,'M13 -98 L20 -91 15 -71 18 -59 10 -53 7 -70Z','deep',null);path(torso,'M-18 -63 L19 -65 20 -58 -18 -56Z','woodDark');line(torso,'M-16 -61 L17 -63','woodLight',1.6,0);for(let i=0;i<4;i++){const x=-15+i*8;line(torso,`M${x} -55 Q${x+4} -47 ${x+1} -39`,mourner?'woodLight':'red',1);}
 const rear=part(a,'rear-arm',[-18,-101],'torso');path(rear,'M-16 -109 L-27 -105 -34 -83 -27 -69 -15 -65 -12 -73 -23 -80 -20 -94Z',mourner?'boneShade':'redDark');path(rear,'M-28 -97 L-30 -83 -25 -78 -20 -78 -23 -87Z',mourner?'paper':'red',null);path(rear,'M-18 -75 L-9 -72 -9 -65 -17 -65 -21 -69Z','boneShade');line(rear,'M-17 -69 L-12 -68','woodDark',.8);
 const arm=part(a,'front-arm',[17,-103],'torso');path(arm,'M15 -110 L27 -107 34 -92 42 -88 39 -72 29 -72 23 -87 13 -92Z',mourner?'boneShade':'red');path(arm,'M25 -102 L29 -92 36 -88 34 -78 29 -81 23 -91Z',mourner?'paper':'redDark',null);path(arm,'M36 -88 L43 -87 48 -82 45 -74 38 -76 34 -81Z','boneShade');line(arm,'M39 -84 L43 -82 42 -78','woodDark',.8);
 if(mourner){const neck=part(a,'empty-collar',[0,-112],'torso');path(neck,'M-15 -114 L-8 -121 9 -120 18 -112 12 -103 1 -107 -10 -104Z','paper');path(neck,'M-9 -115 Q0 -121 11 -114 L7 -109 -3 -108Z','ink',null);line(neck,'M-12 -110 L-2 -105 M7 -106 L14 -112','woodDark',1);
  const yoke=part(a,'yoke',[0,-105],'torso');path(yoke,'M-56 -124 L-48 -130 54 -105 58 -98 52 -94 -54 -119Z','woodDark');path(yoke,'M-49 -126 L50 -103 53 -100 -49 -122Z','woodLight',null);line(yoke,'M-45 -123 L-17 -118 M12 -111 L42 -104','wood',1.2);
  for(const [i,x] of [-47,47].entries()){const p=part(a,'bell-'+i,[x,i?-101:-122],'yoke'),y=i?-101:-122;line(p,`M${x} ${y}L${x+2} ${y+20}`,'woodLight',1.4,0);path(p,`M${x-4} ${y+17}Q${x-8} ${y+22} ${x-7} ${y+29}L${x+9} ${y+29}Q${x+9} ${y+20} ${x+5} ${y+17}Z`,'metal','woodDark');line(p,`M${x-5} ${y+27}L${x+7} ${y+27}`,'boneShade',1);oval(p,x+1,y+31,2,2,'woodDark');sway(a,p.id,5);}
  const apron=part(a,'apron',[0,-57],'torso');path(apron,'M-13 -57 L13 -58 18 -17 10 -12 6 -18 -1 -10 -9 -17 -15 -14 -17 -36Z','paper','woodDark');path(apron,'M-9 -50 L-4 -48 -1 -24 -6 -19 -9 -26Z','boneShade',null);path(apron,'M5 -51 L10 -52 13 -24 8 -18 7 -30Z','woodLight',null);line(apron,'M-9 -46 L8 -44 -4 -36 9 -31 -3 -25','redDark',1.2);
  const strips=part(a,'wrist-cloth',[36,-77],'front-arm');for(let i=0;i<2;i++){const x=32+i*8;path(strips,`M${x} -78 L${x+4} -77 ${x+8} -47 ${x+2} -39 ${x+1} -56Z`,'paper','woodDark',.6);line(strips,`M${x+2} -69 L${x+5} -51`,'redDark',.8);}sway(a,'wrist-cloth',4);
 }else{const head=part(a,'head',[0,-119],'torso');path(head,'M-9 -138 L-2 -146 8 -142 12 -132 8 -117 1 -112 -8 -121Z','boneShade');path(head,'M-4 -138 L3 -141 7 -133 4 -126 6 -121 0 -117 -5 -125Z','bone',null);path(head,'M-8 -131 L1 -129 8 -133 7 -126 1 -124 -7 -126Z','ink',null);line(head,'M-4 -129 L-1 -128 M3 -128 L6 -130','soul',1.1,0);line(head,'M-2 -121 L3 -120','redDark',1);
  const hat=part(a,'hat',[0,-139],'head');path(hat,'M-26 -138 L-13 -143 -11 -157 4 -160 13 -150 12 -144 27 -136 18 -132 0 -136 -18 -133Z','clothDark');path(hat,'M-10 -148 L-7 -155 4 -157 9 -149 8 -144 -9 -143Z','cloth',null);line(hat,'M-22 -137 L-3 -140 21 -135','boneShade',1.2);path(hat,'M-11 -140 L-8 -141 -11 -115 -17 -109 -14 -125Z','redDark',null);sway(a,'hat',.8);
  const quiver=part(a,'quiver',[-21,-85]);path(quiver,'M-34 -113 L-22 -109 -19 -71 -26 -64 -34 -72Z','woodDark');line(quiver,'M-30 -106 L-27 -72','woodLight',1.5);for(let i=0;i<3;i++){const x=-32+i*4;line(quiver,`M${x} -105 L${x-5} -139`,'boneShade',1,0);path(quiver,`M${x-5} -139 L${x-10} -145 ${x-8} -136 ${x-4} -133Z`,'featherLight',null,.6,1);}
  const bow=part(a,'bow',[43,-81],'front-arm');line(bow,'M43 -115 C63 -111 62 -93 58 -82 C61 -69 62 -52 43 -48','woodLight',3,0);line(bow,'M43 -115 L37 -81 43 -48','paper',.8,0);line(bow,'M34 -81 L67 -81','bone',1.3,0);path(bow,'M72 -81 L64 -84 64 -78Z','metal',null);line(bow,'M43 -87 L44 -77','redDark',3,1);
  const seals=part(a,'seals',[0,-80],'torso');paper(seals,-9,-91,8,20);paper(seals,4,-85,7,16);sway(a,'seals',1.5);react(a,'head',6);
 }
 sway(a,'torso',.5);sway(a,'rear-arm',1.2);walk(a,legs,9);react(a,'front-arm',mourner?13:5);react(a,'torso',4);return a;
}
function finish(a){const get=id=>a.parts.find(p=>p.id===id);
 if(a.id==='boar'){
  const body=get('body'),head=get('head');
  path(body,'M-48 -74 L-43 -84 -35 -82 -37 -75 -32 -70 -37 -64 -45 -61Z','shadow',null);
  path(body,'M-23 -95 L-16 -102 -12 -94 -5 -102 -2 -93 5 -101 10 -92 17 -96 22 -88 8 -88 -3 -84 -13 -88Z','woodDark',null);
  line(body,'M-39 -57 L-32 -54 -31 -47 M-20 -57 L-14 -52 -15 -46 M0 -68 L5 -62 2 -54','woodLight',1,2);
  path(head,'M33 -88 L30 -104 35 -102 44 -88 40 -82Z','woodDark');
  path(head,'M42 -63 L51 -60 58 -51 54 -47 47 -52 39 -54Z','boneShade',null);
  line(head,'M44 -82 L48 -78 M58 -65 L62 -61 M53 -49 L59 -45','woodDark',.9);
  for(const id of ['hind-near','fore-near']){const p=get(id),x=id==='hind-near'?-35:26;path(p,`M${x-11} -7 L${x+6} -6 ${x+9} 0 ${x-12} 0Z`,'woodDark',null);line(p,`M${x-2} -6 L${x-2} 0`,'boneShade',.8);}
  line(get('tusks'),'M64 -44 Q67 -29 77 -33','boneShade',1);
 }
 if(a.id==='stag'){
  const body=get('body'),neck=get('neck');
  path(body,'M-38 -72 Q-18 -82 -5 -72 L1 -64 -5 -62 -12 -68 -23 -66 -31 -60Z','light',null);
  path(body,'M-29 -47 L-19 -52 -8 -50 0 -53 11 -48 1 -44 -10 -45 -21 -41Z','deep',null);
  path(neck,'M34 -106 L42 -106 40 -92 36 -85 34 -72 30 -68 32 -88Z','boneShade',null);
  line(neck,'M36 -98 L37 -93 33 -86 M33 -83 L31 -76','shadow',.8);
  line(get('antlers'),'M21 -149 L13 -157 M55 -137 L55 -153 M69 -133 L80 -135','boneShade',1.6,0);
  line(get('head'),'M36 -113 L38 -109 M47 -111 L50 -106 M53 -98 L59 -94','woodDark',.8);
  line(body,'M-37 -55 L-34 -51 M-26 -59 L-23 -55 M-15 -63 L-12 -59','boneShade',1,2);
  path(get('jaw'),'M45 -88 L48 -87 47 -80 43 -83Z','fur',null);
 }
 if(a.id==='bat'){
  for(const side of [-1,1]){const p=get(side<0?'left-wing':'right-wing');
   path(p,`M${29*side} -91 L${43*side} -83 ${47*side} -71 ${39*side} -75 ${32*side} -67 ${26*side} -60Z`,'red',null,.6,1);
   line(p,`M${29*side} -89 Q${39*side} -82 ${40*side} -73 M${48*side} -96 L${59*side} -94 ${71*side} -90`,'clothLight',.7,2);
   path(p,`M${27*side} -96 L${30*side} -102 ${34*side} -98Z`,'boneShade',null);
  }
  path(get('body'),'M-8 -65 L-3 -69 0 -65 4 -69 9 -65 4 -58 -4 -58Z','light',null,.6,1);
 }
 if(a.id==='crow'){
  for(const side of [-1,1]){const p=get(side<0?'left-wing':'right-wing');
   path(p,`M${8*side} -72 L${22*side} -88 ${34*side} -94 ${29*side} -86 ${36*side} -85 ${23*side} -75 ${27*side} -72 ${13*side} -60Z`,'featherLight',null);
   line(p,`M${29*side} -86 L${50*side} -95 M${34*side} -75 L${54*side} -83 M${26*side} -65 L${46*side} -72`,'ink',.8,1);
  }
  path(get('body'),'M-7 -65 L-2 -69 0 -65 5 -68 9 -63 4 -58 0 -59 -4 -56Z','shadow',null);
 }
 if(a.id==='ghost'||a.id==='shade'){
  const body=get('body');
  path(body,'M-6 -124 L-14 -116 -19 -99 -14 -91 -11 -97 -12 -111 -5 -118 6 -116 11 -106 13 -96 20 -89 17 -108 6 -125Z','clothDark',null);
  path(body,'M-8 -56 L-3 -45 -6 -30 -4 -11 -9 -19 -13 -6 -11 -32Z','cloth',null);
  line(get('front-sleeve'),a.id==='shade'?'M19 -62 L18 -50 21 -42':'M27 -58 L23 -46 28 -36','boneShade',1.5,0);
  line(get('rear-sleeve'),a.id==='shade'?'M-25 -62 L-24 -50 -21 -42':'M-35 -57 L-38 -48 -41 -39','clothLight',1.1);
  line(get('head'),'M-3 -118 L-2 -113 M3 -116 L4 -112','woodDark',.6,2);
 }
 if(a.id==='human'){
  const torso=get('torso');path(torso,'M-18 -68 L-24 -56 -22 -40 -15 -34 -17 -49 -12 -60Z','clothDark');
  path(torso,'M12 -59 L24 -56 26 -44 19 -34 15 -41 18 -49Z','redDark');
  for(const [i,id] of ['rear-arm','front-arm'].entries()){const p=get(id),x=i?29:-30;path(p,`M${x} -89 L${x+8} -86 ${x+7} -81 ${x-1} -84Z`,'woodDark');line(p,`M${x} -87 L${x+7} -84`,'boneShade',.8);}
  const head=get('head');path(head,'M-8 -126 L-5 -124 -3 -115 -8 -116 -11 -124Z','clothDark',null);line(head,'M6 -139 L8 -135 6 -132','woodDark',.7);
  const bow=get('bow');line(bow,'M45 -110 Q56 -104 55 -94 M55 -70 Q57 -59 47 -53','bone',.7,2);
  const pack=get('quiver');path(pack,'M-32 -104 L-22 -102 -21 -97 -32 -98Z','wood');line(pack,'M-30 -89 L-23 -87 M-30 -82 L-23 -80','woodLight',.7,2);
  line(torso,'M-6 -93 L-4 -87 -7 -81 M5 -76 L2 -70 4 -66','boneShade',.7,2);
  line(get('back-cloth'),'M-26 -89 L-29 -80 -27 -69 M-19 -44 L-16 -35','clothLight',1);
 }
 if(a.id==='mourner'){
  const torso=get('torso');
  // A patched funeral mantle, a bound yoke and a clapper read as tools of the role.
  const mantle=part(a,'mantle',[0,-110],'torso');path(mantle,'M-23 -109 L-9 -113 -2 -106 9 -111 23 -104 28 -89 21 -93 19 -80 13 -87 9 -76 4 -89 -3 -81 -8 -91 -17 -84 -20 -98 -29 -93Z','boneShade','woodDark');path(mantle,'M-20 -105 L-10 -108 -8 -98 -14 -93 -17 -98Z M9 -106 L20 -101 23 -93 16 -97 13 -90Z','paper',null);
  line(mantle,'M-23 -100 L-18 -103 -14 -98 M0 -100 L5 -104 10 -98','woodLight',1.1,2);
  const yoke=get('yoke');for(const x of [-27,24]){const y=-121+(x+49)*.22;path(yoke,`M${x} ${y-2}L${x+7} ${y} ${x+4} ${y+8} ${x-3} ${y+6}Z`,'boneShade');line(yoke,`M${x} ${y+1}L${x+4} ${y+3}`,'woodDark',.9);}
  const clapper=part(a,'clapper',[42,-81],'front-arm');path(clapper,'M42 -82 L46 -81 45 -41 39 -32 35 -34 40 -44Z','woodDark');path(clapper,'M35 -47 L49 -46 51 -23 45 -18 34 -22Z','wood');path(clapper,'M37 -44 L42 -43 44 -24 37 -25Z','woodLight',null);line(clapper,'M48 -41 L48 -26 44 -23','woodDark',1);
  const apron=get('apron');path(apron,'M-15 -39 L-8 -37 -7 -24 -12 -21 -14 -26Z','woodLight',null,.6,1);line(apron,'M-12 -35 L-9 -32 M-12 -29 L-9 -27','woodDark',.8,2);
  for(const [i,id] of ['rear-arm','front-arm'].entries()){const p=get(id),x=i?24:-29;line(p,`M${x} -101 L${x+3} -95 ${x+1} -90 M${x+4} -85 L${x+8} -80 ${x+6} -77`,'woodDark',1);}
  const collar=get('empty-collar');line(collar,'M-10 -118 L-11 -128 -7 -133 M4 -119 L9 -126 7 -137','clothDark',1.3,0);
  line(torso,'M-14 -53 L-11 -46 -14 -39 M12 -52 L14 -44 10 -37','woodDark',1.1);
  const repairs=part(a,'cloth-repairs',[0,-60],'torso');
  path(repairs,'M-21 -76 L-12 -78 -9 -64 -18 -62Z M14 -52 L22 -49 24 -36 16 -35Z','clothDark','woodDark',.6,1);
  line(repairs,'M-19 -73 L-14 -74 M-18 -68 L-12 -69 M16 -47 L21 -45 M17 -41 L22 -40','boneShade',.8,2);
  line(get('back-cloth'),'M-31 -87 L-28 -79 -30 -67 -26 -56 M-23 -48 L-25 -35 -21 -29','paper',.7,2);
  const belt=get('torso');path(belt,'M-3 -62 L4 -62 6 -56 1 -52 -4 -56Z','redDark');
  line(belt,'M0 -55 L-3 -42 2 -39 4 -28','red',1.5,1);
 }
 return a;
}
return[boar(),stag(),bird(),bird(true),ghost(),ghost(true),human(),human(true)].map(finish);
}
