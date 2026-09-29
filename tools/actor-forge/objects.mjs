import {asset,part,shape,line,oval,track,sway,react,paper} from './shapes.mjs';
import {transformParts} from './anatomy.mjs';
export function object(d){
 const a=asset(d,108,[-105,-129,210,143]);part(a,'root');a.brief={reference:'동일 목표물/보스의 기존 게임 그림과 캠페인 역할',silhouette:d.name,identity:[],materials:['목재','삼베','낡은 금속']};
 if(d.id==='bier'||d.id==='bier_boss'){
  const boss=d.id==='bier_boss';a.brief.identity=[boss?'열린 관과 안쪽의 혼':'닫힌 상여 덮개','긴 상여채와 묶음','늘어진 천과 목조 지붕'];
  const poles=part(a,'poles',[0,-6],'root');shape(poles,'M-91 -11 L90 -11 94 -7 90 -4 -91 -4 -94 -7Z','wood');line(poles,'M-86 -9 L88 -8','woodLight',1.3,1);
  const box=part(a,'box',[0,-39],'root');shape(box,'M-58 -51 L57 -51 62 -20 49 -13 -51 -13 -62 -21Z','wood');shape(box,'M-53 -47 L51 -47 54 -23 45 -18 -47 -18 -55 -25Z',boss?'deep':'linen');line(box,'M-56 -18 L55 -18','woodLight',1.3,0);
  const cloth=part(a,'cloth',[0,-49],'box');
  if(boss){shape(cloth,'M-54 -47 L-31 -47 -30 -22 -38 -13 -40 -20 -53 -17Z M30 -47 L52 -47 51 -15 41 -20 36 -12 28 -23Z','linenShade');const soul=part(a,'soul',[0,-42],'box');shape(soul,'M-12 -31 Q-26 -54 -8 -72 L0 -84 12 -68 16 -47 8 -29 0 -34 -7 -26Z','light');shape(soul,'M-4 -64 L7 -62 6 -51 -3 -48 -8 -54Z','linen');line(soul,'M-3 -58 L2 -56 6 -58','red',1.4,0);sway(a,'soul',4);}
  else{shape(cloth,'M-51 -47 L50 -47 50 -23 37 -27 22 -22 6 -26 -11 -21 -29 -25 -49 -22Z','linen');line(cloth,'M-33 -44 L-30 -26 M-8 -44 L-7 -25 M16 -44 L17 -26 M39 -44 L38 -28','linenShade',1,1);}
  const roof=part(a,'roof',[0,-57],'root');shape(roof,boss?'M-68 -65 Q-53 -70 -35 -86 L-5 -89 0 -98 8 -88 36 -84 Q54 -69 69 -66 L59 -59 -56 -60Z':'M-66 -58 Q-48 -72 -33 -88 L32 -88 Q47 -73 66 -58 L58 -54 -58 -54Z','linenShade','wood',1.2);shape(roof,'M-31 -86 L30 -86 51 -61 -51 -61Z','linen');line(roof,'M-58 -57 L58 -57','woodLight',2,0);line(roof,'M-22 -83 L-40 -64 M0 -83 L0 -64 M22 -83 L40 -64','linenShade',.8,1);
  for(const x of [-50,50])line(box,`M${x} -58 L${x} -14`,'woodLight',3,0);
  if(!boss){paper(cloth,-4,-43,8,19);for(const x of [-42,39]){shape(roof,`M${x} -71 L${x-3} -84 ${x+3} -90 ${x+7} -84 ${x+4} -77 ${x+9} -74Z`,'red');shape(cloth,`M${x} -51 L${x+5} -51 ${x+4} -27 ${x} -31Z`,'red');}line(box,'M-42 -18 L-42 -8 M42 -18 L42 -8','gold',1.6,1);}
  else{const p=a.parts.find(p=>p.id==='soul');p.paths=p.paths.map(p=>({...p,d:p.d.replace(/[-+]?(?:\d*\.)?\d+/g,(()=>{let i=0;return v=>String(Number(v)+(i++%2?13:0));})())}));shape(cloth,'M-29 -34 L-40 -25 -47 -9 -41 -12 -35 -8 -35 -18 -24 -23Z M28 -32 L40 -28 50 -12 44 -15 40 -9 38 -21 25 -22Z','shade');line(cloth,'M-43 -19 L-40 -14 M42 -21 L45 -16','soul',.8,1);}
  sway(a,'cloth',1.8);react(a,'roof',3);track(a,'move','root','rotate',[[0,0],[.25,.8],[.75,-.8],[1,0]]);track(a,'hit','root','rotate',[[0,-2],[.5,1],[1,0]]);
 }else if(d.id==='stretcher'){
  a.brief.identity=['누운 부상자','붕대와 삼베 이불','운반대 양쪽의 손잡이'];
  const frame=part(a,'frame',[0,-21],'root');shape(frame,'M-86 -25 L85 -25 86 -20 -86 -20Z','wood');line(frame,'M-61 -21 L-60 -7 M57 -21 L57 -7','wood',4,0);shape(frame,'M-63 -38 L57 -38 66 -23 -68 -23Z','linenShade');line(frame,'M-78 -23 L-66 -23 M65 -23 L78 -23','woodLight',1.3,1);
  const patient=part(a,'patient',[-29,-40],'frame');shape(patient,'M-40 -47 Q-27 -60 -13 -56 L11 -48 37 -46 54 -36 57 -26 -36 -26 -45 -34Z','cloth');shape(patient,'M-33 -47 Q-22 -54 -7 -49 L15 -40 38 -41 48 -29 -28 -30Z','linen');line(patient,'M-16 -47 L-8 -34 M9 -42 L17 -31 M29 -38 L37 -30','linenShade',1.2,1);
  const head=part(a,'head',[-44,-46],'patient');shape(head,'M-59 -49 Q-59 -60 -48 -59 L-39 -56 -36 -48 -40 -41 -50 -40 -58 -43Z','skin');shape(head,'M-60 -49 Q-65 -59 -54 -62 L-43 -60 -38 -55 -46 -55 -52 -58 -54 -49Z','hair');shape(head,'M-58 -57 L-39 -55 -37 -51 -58 -53Z','linen');line(head,'M-50 -48 L-45 -47 M-41 -43 L-46 -43','feature',.6,0);
  shape(patient,'M-20 -43 Q-16 -47 -9 -44 L0 -37 19 -36 22 -32 18 -30 -4 -32 -13 -37Z','skin');shape(patient,'M-8 -40 L-4 -34 7 -33 8 -37Z','linen');
  track(a,'idle','patient','y',[[0,0],[.5,-.45],[1,0]]);track(a,'move','frame','rotate',[[0,0],[.25,.8],[.75,-.8],[1,0]]);react(a,'patient',2);
 }else if(d.id==='gate'){
  a.baseHeight=122;a.viewBox=[-100,-149,200,160];a.brief.identity=['겹친 기와 처마','굵은 문기둥과 판문','걸쇠·문살·피란 봉인'];
  const base=part(a,'base');shape(base,'M-63 -9 L63 -9 73 0 -74 0Z','metal');shape(base,'M-68 -2 L69 -2 77 4 -78 4Z','shade');
  const frame=part(a,'frame',[0,-58]);for(const x of [-54,46]){shape(frame,`M${x} -107 L${x+8} -107 ${x+8} -8 ${x} -8Z`,'wood');line(frame,`M${x+2} -100 L${x+2} -12`,'woodLight',1,1);}shape(frame,'M-55 -111 L55 -111 55 -96 -55 -96Z','wood');line(frame,'M-51 -99 L51 -99','gold',1.3,1);
  for(const side of [-1,1]){const door=part(a,side<0?'left-door':'right-door',[side*43,-55],'frame');shape(door,`M${side*43} -93 L${side*2} -93 ${side*2} -9 ${side*43} -9Z`,'shade');shape(door,`M${side*38} -87 L${side*7} -87 ${side*7} -54 ${side*38} -54Z`,'deep');for(let i=1;i<4;i++)line(door,`M${side*(7+i*8)} -86 L${side*(7+i*8)} -55`,'woodLight',1,1);line(door,`M${side*38} -74 L${side*8} -74 M${side*38} -63 L${side*8} -63 M${side*35} -47 L${side*35} -13 M${side*15} -47 L${side*15} -13`,'wood',1.2,1);oval(door,side*9,-44,3,4,null,'gold',1,0);react(a,door.id,side*1.4);}
  const roof=part(a,'roof',[0,-106]);shape(roof,'M-89 -107 Q-63 -115 -36 -137 L0 -143 36 -137 Q64 -115 89 -107 L77 -100 -77 -100Z','shade','metal',1);shape(roof,'M-32 -134 L0 -140 32 -134 62 -111 -62 -111Z','metal');for(let i=-3;i<=3;i++)line(roof,`M${i*8} ${-136+Math.abs(i)*2} Q${i*13} -119 ${i*20} -110`,'shade',1.3,1);line(roof,'M-79 -105 Q0 -114 79 -105','gold',1.5,0);paper(frame,-4,-71,8,20);track(a,'move','root','rotate',[[0,0],[1,0]]);
 }else{
  a.baseHeight=238;a.viewBox=[-127,-270,254,284];a.brief.identity=['뿌리로 갈라진 거대한 몸','봉인 목판 얼굴','지붕 지팡이와 망치'];
  const legs=part(a,'roots',[0,-20]);shape(legs,'M-34 -65 L-48 -27 -63 -10 -44 -15 -56 2 -33 -7 -19 -28 -9 -7 4 2 17 -14 31 -3 49 3 40 -8 63 -5 43 -26 33 -65Z','wood');line(legs,'M-28 -44 L-38 -19 -43 -12 M22 -42 L29 -19 43 -8','woodLight',2,1);
  const body=part(a,'body',[0,-64]);shape(body,'M-32 -155 L-60 -141 -67 -116 -44 -86 -34 -47 -11 -35 12 -36 39 -45 45 -89 66 -124 48 -151 26 -164Z','shade','ink',1.4);shape(body,'M-22 -153 L23 -153 32 -76 17 -50 -19 -53 -29 -81Z','wood');for(let i=0;i<6;i++){const y=-139+i*13;line(body,`M-20 ${y} L24 ${y-2}`,'woodLight',2,1);line(body,`M-17 ${y+5} L21 ${y+2}`,'shade',1.6,1);}
  shape(body,'M-10 -179 L13 -180 18 -148 -16 -147Z','wood');const head=part(a,'head',[0,-161],'body');shape(head,'M-19 -204 L-17 -228 0 -243 22 -227 26 -202 18 -177 3 -166 -15 -179Z','linenShade');shape(head,'M-13 -220 L0 -234 16 -222 18 -199 10 -180 0 -176 -12 -189Z','linen');shape(head,'M-15 -209 L-1 -206 -7 -199 -15 -201Z M7 -207 L20 -213 17 -202 9 -199Z','deep');shape(head,'M-1 -204 L5 -206 10 -189 3 -186 -4 -190Z','woodLight');line(head,'M-10 -182 L0 -186 13 -181','red',2,0);shape(head,'M-27 -228 L-30 -248 -13 -252 -11 -260 14 -258 18 -250 29 -246 26 -229Z','wood');line(head,'M-23 -239 L24 -239 M-17 -249 L16 -247','woodLight',1.5,1);shape(head,'M-8 -184 L12 -184 12 -176 -7 -177Z','deep');for(const x of [-4,2,8])line(head,`M${x} -184 L${x} -177`,'linen',2,1);
  const l=part(a,'left-arm',[-35,-136],'body');shape(l,'M-33 -151 L-58 -141 -77 -178 -87 -174 -68 -117 -50 -104 -31 -122Z','wood');line(l,'M-51 -134 L-68 -159','woodLight',2,1);line(l,'M-82 -187 L-93 -72','wood',5,0);shape(l,'M-116 -187 L-93 -208 -69 -193 -57 -181 -112 -178Z','shade','metal',1);line(l,'M-103 -198 L-94 -184 -83 -196 M-109 -183 L-65 -184','woodLight',1.3,1);
  const r=part(a,'right-arm',[34,-134],'body');shape(r,'M31 -151 L56 -143 61 -113 76 -90 68 -75 54 -83 44 -110 28 -125Z','wood');shape(r,'M62 -90 L77 -93 84 -78 76 -66 64 -69 57 -78Z','linenShade');line(r,'M72 -88 L89 -30','wood',5,0);shape(r,'M63 -45 L105 -50 114 -23 70 -14Z','metal','ink',1.2);shape(r,'M68 -41 L101 -44 105 -36 73 -28Z','metalLight');
  const ties=part(a,'seals',[0,-137],'body');for(const x of [-26,-10,8,24])paper(ties,x,-137,9,60);sway(a,'seals',1.5);react(a,'right-arm',22);react(a,'left-arm',8);react(a,'head',5);sway(a,'body',.7);track(a,'move','body','rotate',[[0,0],[.25,2],[.75,-2],[1,0]]);track(a,'jump_fall','body','rotate',[[0,0],[.4,-4],[1,0]]);
 }
 // Objects respond only by presentation transforms; pivots never change world collision geometry.
 if(!a.clips.hit.tracks.length)react(a,'root',1.5);
 if(d.id==='stretcher')transformParts(a,new Set(['head']),([x,y])=>[-44+(x+44)*.7,-46+(y+46)*.7],.8);
 return a;
}
