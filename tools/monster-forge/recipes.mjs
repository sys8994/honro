// Authoring source. Coordinates are bind-pose coordinates, +x faces right, y=0 is ground.
// Curves describe anatomy/material boundaries; repeated marks follow specific surfaces.
import {createExtras} from './species.mjs';
import {createAct3} from './act3-species.mjs';
const palette={ink:'#111d20',deep:'#233330',shadow:'#354940',fur:'#5c7160',light:'#91a18a',bone:'#d4c8a7',boneShade:'#918d73',wood:'#766044',woodLight:'#b29665',woodDark:'#493e30',paper:'#cfc299',red:'#995747',redDark:'#603d35',soul:'#afd8bd',hot:'#e4efd1',metal:'#667b74',cloth:'#574d60',clothLight:'#90818d',clothDark:'#302f3d',feather:'#334750',featherLight:'#657b80'};
function asset(id,name,baseHeight,viewBox,brief){return{id,name,version:1,baseHeight,viewBox,palette,brief,parts:[],clips:{idle:{duration:3,loop:true,tracks:[]},move:{duration:.72,loop:true,tracks:[]},attack:{duration:.56,loop:false,tracks:[]},hit:{duration:.3,loop:false,tracks:[]}}};}
function part(a,id,pivot,parent=null){const p={id,pivot,parent,paths:[]};a.parts.push(p);return p;}
function path(p,d,fill,stroke='ink',width=.8,lod=0){p.paths.push({d,fill,stroke,width,lod});}
function line(p,d,stroke='light',width=.65,lod=1){path(p,d,null,stroke,width,lod);}
function oval(p,x,y,rx,ry,fill,stroke=null,width=.6,lod=0){path(p,`M${x-rx} ${y} C${x-rx} ${y-ry*1.333} ${x+rx} ${y-ry*1.333} ${x+rx} ${y} C${x+rx} ${y+ry*1.333} ${x-rx} ${y+ry*1.333} ${x-rx} ${y}Z`,fill,stroke,width,lod);}
function track(a,clip,part,channel,values){a.clips[clip].tracks.push({part,channel,keys:values});}
function sway(a,p,amount=2){track(a,'idle',p,'rotate',[[0,0],[.25,amount],[.75,-amount],[1,0]]);}
function talisman(p,x,y,w,h){path(p,`M${x} ${y} L${x+w} ${y+1} ${x+w-1} ${y+h-3} ${x+w*.6} ${y+h} ${x+w*.3} ${y+h-2} ${x-1} ${y+h+1}Z`,'paper','woodDark',.5);line(p,`M${x+2} ${y+3}L${x+w-2} ${y+3} M${x+w/2} ${y+3}L${x+w/2} ${y+h-4} M${x+2} ${y+7}L${x+w-2} ${y+9} ${x+2} ${y+12} ${x+w-2} ${y+14} M${x+2} ${y+h-5}L${x+w-2} ${y+h-7}`,'red',.75,1);}

function hound(){
 const a=asset('hound','들린 산개',125,[-87,-133,174,143],{silhouette:'낮게 웅크린 사냥개, 긴 주둥이와 뒤로 꺾인 뒷다리',identity:['찢긴 귀','뼈빛 얼굴','짚 금줄과 붉은 봉인'],materials:['거친 털','오래된 뼈','꼬인 짚'],reference:'기존 산개를 기준으로 한 수작업 벡터 재설계; 외부 이미지 없음'});
 const tail=part(a,'tail',[-47,-59]);
 path(tail,'M-44 -66 C-59 -67 -62 -80 -68 -82 C-74 -85 -80 -81 -82 -74 L-76 -75 -78 -69 -70 -72 C-69 -62 -59 -51 -45 -51Z','shadow');
 path(tail,'M-49 -64 Q-63 -66 -68 -78 L-76 -79 Q-66 -71 -67 -65 L-60 -64 -61 -59Z','fur',null);
 line(tail,'M-52 -60 Q-67 -63 -70 -73','light',.7,2);sway(a,'tail',4);
 for(const [id,x,front] of [['hind-far',-36,false],['fore-far',25,true]]){
  const p=part(a,id,[x,-52]);
  path(p,front?'M27 -59 Q42 -57 42 -42 L43 -24 48 -7 Q56 -5 57 -1 L41 -1 38 -7 33 -30 24 -46Z':'M-49 -57 Q-30 -63 -30 -44 L-43 -30 -38 -19 -48 -5 -42 -3 -40 0 -57 0 -57 -6 -48 -19 -55 -31 Q-61 -46 -49 -57Z','deep');
  line(p,front?'M36 -43 L38 -23 44 -8':'M-42 -45 L-49 -30 -43 -19 -51 -6','fur',1.1,0);
 }
 const body=part(a,'body',[-2,-57]);
 path(body,'M-51 -57 Q-55 -74 -42 -84 L-34 -90 -33 -85 -24 -93 -20 -87 -11 -94 -8 -89 1 -96 4 -91 Q19 -96 31 -84 L41 -69 31 -45 Q20 -37 5 -43 L-12 -45 Q-24 -44 -35 -41 L-48 -46Z','shadow','ink',1.2);
 path(body,'M-48 -70 Q-37 -84 -18 -81 Q5 -86 19 -82 L27 -75 Q12 -76 4 -68 L-2 -53 -18 -57 -30 -51 -42 -57Z','fur',null);
 path(body,'M-41 -79 Q-16 -93 11 -85 L2 -82 -4 -77 -18 -79 -28 -72Z','light',null);
 path(body,'M-35 -60 Q-17 -66 0 -70 Q-9 -57 -9 -48 L-21 -50 -34 -45Z','deep',null);
 path(body,'M11 -80 Q26 -85 32 -70 L27 -52 21 -47 15 -50 19 -57 11 -56 15 -63 8 -61Z','fur',null);
 for(let i=0;i<6;i++){const x=-31+i*6;line(body,`M${x} ${-76+i*.5} Q${x+4} -70 ${x+3} ${-63+i*.7}`,'shadow',1.2,1);line(body,`M${x-1} -76 Q${x+1} -72 ${x} -69`,'light',.6,2);}
 for(let i=0;i<7;i++){const x=-40+i*8;line(body,`M${x} -80 l3 -4 -1 5`,'boneShade',.6,2);}
 // An angular shoulder plane and distinct chest tufts, rather than an oval body.
 path(body,'M24 -88 L34 -86 37 -75 33 -68 36 -65 31 -62 34 -57 28 -55 29 -49 20 -46 24 -59 19 -64Z','shadow');
 line(body,'M25 -83 Q32 -76 26 -67 L28 -63 23 -58','light',1,1);
 const neck=part(a,'neck',[25,-72],'body');
 path(neck,'M18 -76 L23 -94 28 -99 29 -91 34 -103 38 -100 39 -92 43 -96 47 -87 51 -73 43 -57 40 -61 37 -52 32 -56 26 -51 28 -63 22 -60 25 -70 19 -68Z','fur');
 path(neck,'M25 -84 L31 -94 33 -86 38 -93 39 -83 45 -82 38 -68 31 -65 32 -73 26 -70Z','light',null);
 line(neck,'M28 -83 L32 -79 29 -73 M36 -85 L39 -80 36 -73 M41 -76 L39 -69','shadow',.9,1);
 const head=part(a,'head',[39,-83],'neck');
 path(head,'M29 -96 L25 -119 31 -116 39 -102 45 -106 54 -121 55 -110 52 -105 55 -99 Q62 -97 65 -89 L77 -84 78 -77 66 -73 56 -74 52 -68 40 -73 32 -84Z','boneShade','ink',1);
 path(head,'M31 -98 L29 -113 36 -102Z','redDark',null);
 path(head,'M47 -104 L53 -115 51 -104Z','deep',null);
 path(head,'M37 -98 Q51 -104 58 -94 L60 -87 72 -83 72 -78 60 -80 53 -76 45 -78 40 -85 35 -87Z','bone',null);
 path(head,'M48 -93 L58 -92 57 -87 49 -84 43 -86Z','ink',null);
 path(head,'M49 -90 L55 -90 52 -87 49 -87Z','soul',null);
 path(head,'M72 -85 L79 -84 79 -79 73 -78 70 -81Z','ink',null);
 line(head,'M61 -84 L65 -82 M39 -96 L43 -92 40 -87 M47 -100 L47 -95 51 -94 M59 -90 L62 -88','woodDark',.75,1);
 oval(head,66,-79,.8,.7,'woodDark',null,.6,2);oval(head,69,-79,.7,.6,'woodDark',null,.6,2);
 const jaw=part(a,'jaw',[47,-77],'head');
 path(jaw,'M46 -77 L58 -75 75 -76 72 -71 Q64 -66 52 -70 L46 -73Z','shadow');
 path(jaw,'M51 -73 Q62 -70 70 -73 L67 -69 57 -68 49 -72Z','boneShade',null);
 for(const [x,y,h] of [[54,-77,4],[61,-76,3],[68,-76,3]])path(jaw,`M${x} ${y}l3 0 -1 ${h}Z`,'bone',null,.6,1);
 const collar=part(a,'collar',[31,-70],'neck');
 line(collar,'M23 -77 Q32 -69 45 -70','woodDark',5,0);line(collar,'M23 -77 Q32 -69 45 -70','woodLight',2.4,0);
 for(let i=0;i<8;i++)line(collar,`M${24+i*2.7} ${-78+Math.min(i,4)*1.2}l-1.5 3`,'woodDark',.7,2);
 talisman(collar,33,-68,8,17);oval(collar,29,-71,2.5,2.6,'red','redDark');
 for(const [id,x,front] of [['hind-near',-33,false],['fore-near',25,true]]){
  const p=part(a,id,[x,-48]);
  path(p,front?'M24 -61 Q35 -59 35 -45 L30 -25 31 -8 38 -5 41 -1 39 1 22 1 20 -3 21 -23 18 -38 18 -51Z':'M-41 -61 Q-22 -64 -19 -49 Q-18 -38 -31 -29 L-22 -20 -30 -6 -28 -3 -21 -1 -21 1 -40 1 -42 -3 -35 -20 -45 -31 Q-50 -48 -41 -61Z','fur','ink',1);
  path(p,front?'M26 -52 L29 -48 25 -25 26 -8 31 -5 24 -5 23 -24 21 -36Z':'M-35 -56 Q-23 -57 -25 -45 L-36 -29 -29 -21 -36 -7 -38 -5 -32 -22 -40 -31Z','light',null);
  path(p,front?'M29 -37 L26 -25 28 -8 24 -5 22 -10 23 -24Z':'M-27 -46 L-34 -31 -27 -21 -32 -12 -30 -23 -38 -31Z','shadow',null);
  line(p,front?'M25 -3 L25 0 M30 -3 L30 0 M35 -2 L36 0':'M-36 -3 L-36 0 M-31 -3 L-31 0 M-26 -2 L-25 0','ink',.8,1);
  line(p,front?'M24 -53 L25 -46 23 -41':'M-40 -52 Q-34 -55 -30 -50','bone',.6,2);
 }
 sway(a,'head',1.3);track(a,'idle','body','y',[[0,0],[.5,-.65],[1,0]]);
 for(const [i,id] of ['hind-far','fore-far','hind-near','fore-near'].entries())track(a,'move',id,'rotate',[[0,0],[.25,i%2?14:-14],[.75,i%2?-14:14],[1,0]]);
 track(a,'attack','head','rotate',[[0,-9],[.16,-12],[.4,12],[.7,5],[1,0]]);track(a,'attack','jaw','rotate',[[0,0],[.18,5],[.4,28],[.75,12],[1,0]]);track(a,'attack','body','x',[[0,-2],[.2,-3],[.42,3],[1,0]]);
 track(a,'hit','head','rotate',[[0,-12],[.4,6],[1,0]]);
 return a;
}

function warden(){
 const a=asset('warden','들린 장승',160,[-91,-173,182,185],{silhouette:'갈라진 관모, 이빨을 드러낸 장승 얼굴, 뿌리 손',identity:['과장된 조각 코','금줄과 세 장의 부적','비대칭 나뭇가지'],materials:['갈라진 목재','이끼','삼베'],reference:'기존 장승의 목주 구조를 보존한 창작 조각 디자인; 명문은 글자가 아닌 봉인 문양'});
 const roots=part(a,'roots',[0,0]);
 path(roots,'M-24 -26 L-31 -12 -46 -6 -52 1 -45 2 -32 -3 -36 4 -25 1 -17 -8 -11 -6 -8 1 4 2 12 -5 23 -3 31 3 45 4 39 -2 52 0 46 -6 30 -13 22 -29Z','woodDark');
 path(roots,'M-24 -18 L-28 -7 -42 -1 -29 -5 -24 -1 -19 -9 -9 -10 -6 -2 4 -1 11 -10 20 -8 28 -5 39 0 29 -8 22 -20Z','wood',null);
 line(roots,'M-19 -16 L-22 -7 -30 -3 M19 -14 L25 -6 33 -2 M-4 -16 L-2 -5','woodLight',.85,1);
 const left=part(a,'left-arm',[-22,-80]);
 path(left,'M-17 -88 L-37 -82 -45 -62 -58 -66 -64 -83 -69 -87 -70 -82 -67 -65 -77 -73 -82 -73 -81 -67 -70 -55 -57 -49 -42 -51 -31 -69 -17 -72Z','wood','ink',1);
 path(left,'M-35 -77 L-43 -58 -56 -56 -65 -61 -55 -52 -44 -54 -37 -66Z','woodLight',null);
 path(left,'M-57 -53 L-68 -46 -77 -46 -80 -49 -78 -52 -68 -51 -64 -57Z','wood');
 line(left,'M-36 -74 L-42 -55 -53 -53 M-68 -68 L-64 -58 M-76 -69 L-70 -62','woodDark',1,1);
 const right=part(a,'right-arm',[21,-79]);
 path(right,'M16 -91 L34 -92 44 -109 49 -125 54 -132 58 -134 57 -128 53 -119 61 -124 63 -133 67 -135 68 -128 64 -119 75 -123 82 -132 85 -131 83 -124 75 -117 66 -113 56 -111 49 -98 40 -79 25 -69Z','wood');
 path(right,'M28 -86 L38 -90 47 -106 51 -117 47 -98 39 -83 28 -76Z','woodLight',null);
 line(right,'M35 -89 L43 -104 M56 -118 L64 -116 74 -120 M53 -124 L55 -130','woodDark',.9,1);
 const trunk=part(a,'trunk',[0,-70]);
 path(trunk,'M-25 -13 L-29 -42 -25 -65 -29 -87 -23 -112 -26 -137 -18 -153 -7 -161 4 -154 16 -158 27 -141 29 -113 24 -90 29 -69 24 -46 29 -20 21 -9 6 -12 -7 -8Z','wood','ink',1.2);
 path(trunk,'M-21 -140 L-13 -150 -11 -129 -15 -101 -10 -75 -16 -43 -12 -15 -23 -17 -23 -41 -20 -69 -25 -87 -20 -111Z','woodLight',null);
 path(trunk,'M12 -149 L21 -141 22 -114 18 -94 23 -72 17 -48 21 -21 12 -14 8 -30 13 -56 8 -82 14 -113Z','woodDark',null);
 path(trunk,'M-5 -154 L1 -144 -4 -131 2 -117 -1 -97 -6 -78 -2 -58 -7 -39 -4 -17 -8 -12 -11 -42 -7 -65 -11 -86 -5 -110 -8 -133Z','woodDark',null);
 for(let i=0;i<9;i++){const x=-20+i*5;line(trunk,`M${x} -70 Q${x-4} -54 ${x} -45 Q${x+2} -31 ${x-1} -19`,i%3?'woodDark':'woodLight',i%3?.6:1,2);}
 for(const [x,y] of [[-17,-44],[11,-27],[18,-71],[-16,-128]]){oval(trunk,x,y,2.2,5,'woodDark',null,.6,1);line(trunk,`M${x-4} ${y-7}Q${x-7} ${y} ${x-3} ${y+8}`,'woodLight',.7,2);}
 const face=part(a,'face',[0,-119],'trunk');
 path(face,'M-23 -135 L-15 -144 -5 -146 4 -141 17 -144 25 -133 23 -108 18 -91 4 -86 -13 -89 -24 -104Z','woodLight','woodDark',1);
 path(face,'M-24 -131 L-15 -134 -4 -127 2 -128 13 -136 23 -132 24 -124 13 -120 5 -119 -3 -119 -12 -121 -23 -123Z','woodDark',null);
 path(face,'M-20 -127 L-7 -124 -11 -122 -19 -124Z','soul',null);
 path(face,'M7 -125 L21 -129 18 -125 10 -123Z','soul',null);
 path(face,'M-4 -131 L3 -132 6 -116 12 -112 9 -108 -8 -108 -10 -112 -5 -116Z','wood','woodDark',.8);
 path(face,'M-2 -129 L1 -130 2 -115 6 -112 -3 -111Z','boneShade',null);
 path(face,'M-19 -108 L-9 -106 -3 -108 3 -106 11 -109 19 -108 18 -96 10 -95 4 -91 -3 -94 -11 -93 -18 -98Z','ink','woodDark',.7);
 for(let i=0;i<7;i++){const x=-16+i*4.7,y=-104-(i%3);path(face,`M${x} ${y}l3.6 -.4 -.3 ${i%2?7:4} -3 1Z`,'bone',null,.6,0);}
 path(face,'M-15 -98 L-11 -97 -10 -94 -14 -95Z M4 -95 L8 -97 10 -94 6 -92Z','boneShade',null,.6,1);
 line(face,'M-17 -113 L-20 -109 -19 -100 M18 -114 L21 -110 20 -101 M-12 -94 Q0 -88 13 -96','woodDark',1,1);
 line(face,'M-13 -140 L-9 -137 -11 -133 M13 -140 L11 -136 M-21 -118 L-16 -116 -18 -113 M11 -117 L17 -119','wood',.7,2);
 const crown=part(a,'crown',[0,-143],'face');
 path(crown,'M-27 -139 L-26 -151 -20 -156 -23 -166 -13 -162 -7 -169 0 -163 8 -166 13 -158 23 -161 22 -150 29 -144 22 -140 10 -145 -2 -141 -12 -146Z','woodDark');
 path(crown,'M-24 -148 L-18 -152 -18 -159 -12 -154 -8 -163 -3 -153 6 -159 10 -151 19 -155 18 -147 11 -147 2 -146 -9 -149 -16 -147Z','wood',null);
 line(crown,'M-19 -147 L-16 -151 M-8 -149 L-6 -155 M10 -149 L14 -153','woodLight',.8,1);
 const rope=part(a,'rope',[0,-80],'trunk');
 for(const y of [-83,-77]){line(rope,`M-27 ${y} Q-4 ${y+9} 27 ${y-2}`,'woodDark',5,0);line(rope,`M-27 ${y} Q-4 ${y+9} 27 ${y-2}`,'boneShade',2.8,0);for(let i=0;i<17;i++)line(rope,`M${-25+i*3} ${y+Math.sin(i/16*Math.PI)*4-1}l-2 3`,'woodDark',.65,2);}
 oval(rope,0,-77,5,4,'redDark','woodDark');line(rope,'M-4 -80 L4 -74 M4 -80 L-4 -74','red',1,1);
 for(const [i,x] of [-18,-5,10].entries()){const p=part(a,'paper-'+i,[x+5,-76],'trunk');talisman(p,x,-75,10,30-i*3);sway(a,p.id,3+i);}
 const moss=part(a,'moss',[0,-65],'trunk');
 for(const [x,y] of [[-22,-63],[18,-42],[-17,-25],[19,-140],[-21,-146]]){path(moss,`M${x-3} ${y}l-2 -4 3 1 2 -4 2 3 4 -1 -1 4 2 2 -5 2Z`,'shadow',null,.6,1);line(moss,`M${x-2} ${y}l3 -3 2 3`,'fur',.7,2);}
 sway(a,'face',.65);sway(a,'left-arm',1.5);sway(a,'right-arm',1.3);
 track(a,'move','trunk','rotate',[[0,-2],[.5,2],[1,-2]]);
 track(a,'attack','right-arm','rotate',[[0,-6],[.22,-14],[.44,23],[.65,12],[1,0]]);track(a,'attack','face','rotate',[[0,-4],[.3,-7],[.5,5],[1,0]]);track(a,'attack','left-arm','rotate',[[0,3],[.25,9],[.5,-13],[1,0]]);
 track(a,'hit','face','rotate',[[0,-7],[.4,4],[1,0]]);
 return a;
}

function lantern(){
 const a=asset('lantern','혼을 삼킨 등불',128,[-65,-139,130,151],{silhouette:'구부러진 고리, 찢어진 한지 등, 길게 풀린 꼬리',identity:['찢어진 한지 사이의 얼굴 같은 불꽃','대나무 살','붉은 매듭'],materials:['빛을 머금은 한지','대나무','그을음'],reference:'기존 등불귀의 육각 몸체와 혼불을 확장한 창작 벡터'});
 const root=part(a,'root',[0,-69]);
 const ribbons=[];
 for(let i=0;i<5;i++){const x=-18+i*9,p=part(a,'ribbon-'+i,[x,-36],'root');ribbons.push(p);const bend=i%2?8:-8,end=-4+i%3*4;path(p,`M${x-2} -39 Q${x+bend} -26 ${x+bend/2} -19 Q${x-bend} -8 ${x+4} ${end} L${x-2} ${end-1} Q${x-bend-6} -9 ${x+bend/2-4} -21 L${x-6} -39Z`,i%2?'paper':'woodLight','woodDark',.5);line(p,`M${x-2} -32 Q${x+bend-3} -24 ${x-3} -14`,'redDark',.6,1);sway(a,p.id,6+i*1.2);}
 const handle=part(a,'handle',[0,-104],'root');
 line(handle,'M-15 -104 C-24 -142 25 -145 16 -107','ink',4,0);line(handle,'M-15 -104 C-24 -142 25 -145 16 -107','metal',2,0);line(handle,'M-14 -119 Q-11 -135 3 -133','boneShade',.7,1);
 const shell=part(a,'shell',[0,-70],'root');
 path(shell,'M-21 -109 L19 -109 32 -96 34 -58 20 -39 -17 -39 -34 -57 -33 -93Z','woodDark','ink',1.2);
 path(shell,'M-20 -102 L-10 -103 -14 -83 -12 -58 -17 -45 -28 -60 -29 -91Z','boneShade','woodDark',.6);
 path(shell,'M-10 -103 L10 -103 15 -90 9 -78 13 -71 9 -60 14 -46 -12 -45 -14 -62 -9 -73 -15 -83Z','paper','woodDark',.6);
 path(shell,'M12 -104 L23 -97 29 -90 28 -60 18 -46 15 -58 18 -76 13 -88Z','woodLight','woodDark',.6);
 path(shell,'M-8 -95 L-1 -99 1 -90 7 -94 4 -83 12 -80 7 -73 11 -64 4 -65 4 -51 -3 -56 -9 -52 -7 -65 -14 -68 -8 -74 -12 -84 -5 -84Z','deep',null);
 // Curved paper planes, torn windows and rib shadows produce form without Canvas blur.
 line(shell,'M-21 -99 Q-25 -76 -20 -52 M22 -96 Q26 -74 22 -55','paper',1.1,1);
 for(let i=0;i<7;i++){const y=-97+i*7;line(shell,`M-28 ${y} Q-22 ${y+3} -14 ${y+2} M14 ${y+2} L28 ${y-1}`,'wood',.6,2);}
 path(shell,'M-26 -88 L-20 -84 -24 -78 -19 -74 -25 -70 -22 -67 -28 -65Z','woodDark',null,.5,1);
 path(shell,'M17 -95 L22 -91 19 -88 23 -85 20 -81 18 -83Z','woodDark',null,.5,1);
 const flame=part(a,'flame',[0,-67],'shell');
 path(flame,'M-4 -52 C-16 -58 -13 -68 -8 -76 C-4 -83 -7 -89 -3 -96 Q-2 -85 4 -82 Q13 -90 10 -95 C21 -83 7 -77 12 -70 Q21 -58 6 -52Z','soul',null);
 path(flame,'M-2 -55 C-10 -61 -4 -66 -3 -73 L1 -84 Q1 -73 6 -72 Q4 -66 8 -62 L4 -55Z','hot',null);
 path(flame,'M-7 -73 L-2 -71 -4 -67 -6 -69Z M3 -70 L8 -74 6 -68 4 -66Z','deep',null);
 path(flame,'M-2 -64 L1 -65 2 -62 4 -63 2 -57 1 -60 -1 -57Z','shadow',null);
 const frame=part(a,'frame',[0,-70],'root');
 path(frame,'M-23 -108 Q0 -112 23 -107 L25 -101 Q0 -105 -25 -101Z','wood','ink',.8);
 path(frame,'M-22 -43 Q0 -47 23 -44 L20 -37 Q0 -34 -18 -38Z','wood','ink',.8);
 for(const [x,b] of [[-30,3],[-13,-2],[13,2],[30,-3]]){line(frame,`M${x*.73} -102 Q${x+b} -76 ${x*.65} -43`,'woodDark',2.8,0);line(frame,`M${x*.73-1} -102 Q${x+b-1} -76 ${x*.65-1} -43`,'woodLight',1,0);}
 line(frame,'M-23 -103 Q0 -107 23 -103 M-18 -40 Q0 -38 19 -40','boneShade',.8,1);
 for(const [x,y] of [[-22,-104],[22,-104],[-19,-40],[19,-40]])oval(frame,x,y,1.1,1.2,'metal','ink',.4,1);
 const knot=part(a,'knot',[0,-36],'root');
 path(knot,'M0 -38 Q-12 -44 -11 -35 Q-7 -29 0 -35 Q8 -27 12 -35 Q13 -43 0 -38Z','red','redDark',.7);oval(knot,0,-36,2.4,2.6,'redDark');
 const tag=part(a,'seal',[-17,-103],'root');talisman(tag,-22,-103,8,23);sway(a,'seal',5);
 track(a,'idle','root','y',[[0,0],[.25,-2],[.75,2],[1,0]]);sway(a,'root',1.5);track(a,'idle','flame','scaleY',[[0,1],[.3,1.045],[.6,.96],[1,1]]);
 track(a,'move','root','rotate',[[0,-5],[.5,5],[1,-5]]);
 track(a,'attack','root','rotate',[[0,-5],[.22,-10],[.43,9],[1,0]]);track(a,'attack','flame','scaleY',[[0,1],[.2,.8],[.45,1.45],[1,1]]);track(a,'attack','flame','scaleX',[[0,1],[.2,.85],[.45,1.2],[1,1]]);
 track(a,'hit','root','rotate',[[0,-12],[.4,7],[1,0]]);
 return a;
}
// Explicit art direction for the earlier pilots: preserve anatomy, remove repeated
// hatch marks and tertiary planes. No automatic contour chopping or node padding.
function compact(a){
 const keep={
  hound:{tail:[0,2],'hind-far':[0],'fore-far':[0,1],body:[0,1,2,5,9],neck:[0,1],head:[0,1,3,4,5,6],jaw:[0,2],collar:[1,10,11],'hind-near':[0,1],'fore-near':[0,1]},
  warden:{roots:[0],'left-arm':[0,1],'right-arm':[0,1],trunk:[0,1,2,13],face:[0,1,2,3,4,6,7,8,9,10,11,12,13],crown:[0,1],rope:[0,1,19,20,38],'paper-0':[0,1],'paper-1':[0,1],'paper-2':[0,1],moss:[0]},
  lantern:{root:[],'ribbon-0':[0],'ribbon-2':[0],'ribbon-4':[0],handle:[1],shell:[0,1,2],flame:[0,1,2,3],frame:[0,1,2,4,6,8],knot:[0],seal:[0,1]}
 }[a.id];
 a.parts=a.parts.filter(p=>Object.hasOwn(keep,p.id));
 for(const p of a.parts){p.paths=keep[p.id].map(i=>p.paths[i]);
  if(a.id==='hound'&&p.id==='collar')p.paths.at(-1).d='M35 -64 L38 -62 35 -58 38 -55';
  if(a.id==='warden'&&p.id.startsWith('paper-')){const x=[-18,-5,10][Number(p.id.at(-1))];p.paths.at(-1).d=`M${x+2} -70 L${x+8} -68 ${x+2} -58 ${x+8} -54`;}
  if(a.id==='warden'&&p.id==='trunk')line(p,'M-5 -65 Q-10 -48 -6 -34 L-8 -18 M4 -67 Q0 -53 4 -41','woodDark',1.1,1);
  if(a.id==='lantern'&&p.id==='seal')p.paths.at(-1).d='M-20 -99 L-16 -96 -20 -89 -16 -85';
  if(a.id==='lantern'&&p.id==='frame'){p.paths=p.paths.slice(2);line(p,'M-23 -105 L23 -105 M-18 -40 L19 -40','woodLight',3,0);}
 }
 const ids=new Set(a.parts.map(p=>p.id));for(const clip of Object.values(a.clips))clip.tracks=clip.tracks.filter(t=>ids.has(t.part));a.version=2;return a;
}
function paper(p,x,y,w,h){path(p,`M${x} ${y}l${w} 1 -1 ${h-2} ${-w/2} -2 ${-w/2} 3Z`,'paper','woodDark',.5);line(p,`M${x+2} ${y+4}L${x+w-2} ${y+5} ${x+2} ${y+h*.55} ${x+w-2} ${y+h-4}`,'red',.8,1);}
function react(a,id,n=8){track(a,'attack',id,'rotate',[[0,-n*.4],[.2,-n],[.45,n],[.75,n*.3],[1,0]]);track(a,'hit',id,'rotate',[[0,-n],[.4,n*.3],[1,0]]);}
function walk(a,ids,n=12){ids.forEach((id,i)=>track(a,'move',id,'rotate',[[0,0],[.25,i%2?n:-n],[.75,i%2?-n:n],[1,0]]));}
export const monsters=[...[hound(),warden(),lantern()].map(compact),...createExtras({asset,part,path,line,oval,track,sway,paper,react,walk}),...createAct3({asset,part,path,line,oval,track,sway,paper,react,walk})];
