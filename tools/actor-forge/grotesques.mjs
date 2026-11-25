import {asset,part,shape,line,oval,track,react,sway} from './shapes.mjs';
// Act 6 grotesques, revision 2: dark-fantasy bodies of the overlapped temple (6-8) and of the
// dead that knotted into flesh (6-9). Emaciated anatomy, torn hemp, wet ink shadow and hollow
// faces carry the dread; no cartoon outlines, no Western horns, sigils or tentacles.
const pal={void:'#08090A',wet:'#111416',rot:'#2B2925',rotShade:'#1A1917',flesh:'#7A7265',fleshShade:'#4A443C',fleshLight:'#A39A88',pale:'#C8C1AD',bone:'#D9D2BF',boneShade:'#9C9583',hemp:'#857A5F',hempShade:'#544B3A',hempLight:'#A99D7E',blood:'#4E2621',rust:'#6A4335',iron:'#3D4442',ironLight:'#6E7774',moss:'#344037',mist:'#8C9F99',mistShade:'#566661',glint:'#E9E3CC',talisman:'#B8A877',cord:'#7A3029',danGreen:'#4C6656',danRed:'#7A3B2F',indigo:'#2E3847',straw:'#94845A',strawShade:'#6A5D3E',shroud:'#BDB6A1',shroudShade:'#8E8876',lacquer:'#3A2622',paint:'#B9AE92'};
// Deterministic jitter so torn edges are irregular but stable between builds.
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const n=v=>Math.round(v*10)/10;
function torn(x0,y0,x1,y1,steps,amp){let d='';for(let i=1;i<=steps;i++){const t=i/steps,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t,o=(i%2?1:-.4)*amp*(.4+rnd()*.9);d+=` L${n(x+(y1-y0?o*.3:0))} ${n(y+o)}`;}return d;}
// Long jointed finger: three bones with knuckle bulges and a dark nail.
function finger(p,x,y,ang,len,fill='flesh',w=1.6){let cx=x,cy=y,a=ang;const pts=[];for(let j=0;j<3;j++){const l=len*[.42,.33,.25][j];a+=(j?.28:.05);const nx=cx+Math.cos(a)*l,ny=cy+Math.sin(a)*l;pts.push([cx,cy,nx,ny]);cx=nx;cy=ny;}
 for(const [ax,ay,bx,by] of pts)line(p,`M${n(ax)} ${n(ay)} L${n(bx)} ${n(by)}`,fill,w,0);for(const [ax,ay] of pts.slice(1))oval(p,n(ax),n(ay),w*.7,w*.7,fill);
 line(p,`M${n(cx)} ${n(cy)} L${n(cx+Math.cos(a)*3)} ${n(cy+Math.sin(a)*3)}`,'void',w*.9,0);}
function hand(p,x,y,ang,len,fill){for(let f=-2;f<=2;f++)finger(p,x+Math.cos(ang+Math.PI/2)*f*1.6,y+Math.sin(ang+Math.PI/2)*f*1.6,ang+f*.16,len*(f===-2?.6:1-Math.abs(f)*.08),fill,1.2);}
function strands(p,x,y,count,len,spread,color='void',w=.9,drift=0){for(let i=0;i<count;i++){const sx=x+(i/(count-1||1)-.5)*spread,l=len*(.7+rnd()*.45),c1=sx+(rnd()-.5)*8+drift*.5;line(p,`M${n(sx)} ${n(y)} Q${n(c1)} ${n(y+l*.5)} ${n(sx+drift+(rnd()-.5)*6)} ${n(y+l)}`,color,w,0);}}
function ribs(p,cx,top,count,w,gap,color='fleshShade'){for(let i=0;i<count;i++){const y=top+i*gap,ww=w*(1-i*.08);line(p,`M${n(cx-1)} ${n(y)} Q${n(cx-ww*.6)} ${n(y-2)} ${n(cx-ww)} ${n(y+3)} M${n(cx+1)} ${n(y)} Q${n(cx+ww*.6)} ${n(y-2)} ${n(cx+ww)} ${n(y+3)}`,color,.8,1);}}
function hollowFace(p,x,y,s,{mouth=1.6,tilt=0}={}){
 shape(p,`M${n(x-6*s)} ${n(y-8*s)} Q${n(x)} ${n(y-11*s)} ${n(x+6*s)} ${n(y-8*s)} Q${n(x+7.5*s)} ${n(y+1*s)} ${n(x+3*s)} ${n(y+9*s)} Q${n(x)} ${n(y+11*s)} ${n(x-3*s)} ${n(y+9*s)} Q${n(x-7.5*s)} ${n(y+1*s)} ${n(x-6*s)} ${n(y-8*s)}Z`,'pale','void',.5);
 shape(p,`M${n(x-6*s)} ${n(y-2*s)} Q${n(x-4*s)} ${n(y+6*s)} ${n(x-1*s)} ${n(y+9*s)} L${n(x-3*s)} ${n(y+9*s)} Q${n(x-7*s)} ${n(y+2*s)} ${n(x-6*s)} ${n(y-2*s)}Z`,'boneShade');
 for(const sx of [-1,1]){shape(p,`M${n(x+sx*1*s)} ${n(y-4*s)} Q${n(x+sx*3.6*s)} ${n(y-6.2*s+tilt*sx)} ${n(x+sx*5.2*s)} ${n(y-3*s)} Q${n(x+sx*3.6*s)} ${n(y+.6*s)} ${n(x+sx*1*s)} ${n(y-4*s)}Z`,'void');oval(p,n(x+sx*3.3*s),n(y-3.4*s),.45*s,.45*s,'glint');}
 shape(p,`M${n(x-1.6*s)} ${n(y+2.4*s)} Q${n(x)} ${n(y+(2+mouth*3)*s)} ${n(x+1.6*s)} ${n(y+2.4*s)} Q${n(x)} ${n(y+(3.6+mouth*3.6)*s)} ${n(x-1.6*s)} ${n(y+2.4*s)}Z`,'void');
 line(p,`M${n(x-.6*s)} ${n(y-1*s)} L${n(x-.2*s)} ${n(y+1.4*s)}`,'boneShade',.5,1);}
function hanging(d){
 // 거꾸로 매달린 상주: hung by the ankles from nothing in mourning hemp. The shroud pours UP,
 // the stretched neck and the long black hair hang DOWN, and its arms are a third too long.
 const a=asset(d,170,[-74,-196,148,202]);Object.assign(a.palette,pal);seed=11;part(a,'root',[0,-100]);
 const rope=part(a,'rope',[0,-190],'root');line(rope,'M-3 -198 Q5 -184 -1 -172 Q-6 -162 1 -152','hempShade',2.6,0);line(rope,'M-2 -196 Q4 -184 0 -172','hempLight',.7,1);
 shape(rope,'M-7 -156 Q0 -162 7 -156 L5 -150 Q0 -153 -5 -150Z','hempShade','void',.4);
 const legs=part(a,'legs',[0,-142],'root');shape(legs,'M-8 -152 Q-10 -146 -9 -134 L-5 -134 Q-4 -146 -3 -152Z M3 -152 Q4 -146 5 -134 L9 -134 Q10 -146 8 -152Z','flesh','void',.5);line(legs,'M-7 -146 L-6 -138 M6 -146 L7 -138','fleshShade',.6,1);for(const y of [-148,-144,-140])line(legs,`M-10 ${y} L-3 ${y} M3 ${y} L10 ${y}`,'hemp',1.2,0);
 const robe=part(a,'robe',[0,-118],'root');
 shape(robe,`M-14 -138 Q0 -142 14 -138 Q20 -122 26 -100${torn(26,-100,-26,-100,9,7)} Q-20 -122 -14 -138Z`,'hemp','void',.6);
 shape(robe,'M-4 -136 Q2 -120 8 -104 L1 -98 Q-4 -116 -9 -133Z','hempShade');shape(robe,'M12 -134 Q18 -118 22 -104 L16 -100 Q14 -118 9 -132Z','hempLight');
 for(const x of [-18,-9,3,15])line(robe,`M${x} -128 Q${x-2} -112 ${x+1} -101`,'hempShade',.6,1);line(robe,'M-15 -132 L15 -132','cord',1,0);
 const torso=part(a,'torso',[0,-84],'robe');shape(torso,'M-10 -100 Q-13 -86 -9 -72 Q-5 -64 0 -62 Q5 -64 9 -72 Q13 -86 10 -100Z','flesh','void',.5);
 ribs(torso,0,-96,5,9,5.5);shape(torso,'M-3 -100 Q0 -96 3 -100 L2 -66 -2 -66Z','fleshShade');shape(torso,'M-10 -80 Q-14 -76 -12 -70 L-9 -72Z','blood');
 const neck=part(a,'neck',[0,-60],'torso');shape(neck,'M-3.5 -64 Q-5 -52 -3 -40 L3 -40 Q5 -52 3.5 -64Z','flesh','void',.4);line(neck,'M-1 -62 Q-2 -52 -1 -42 M1.5 -60 L2 -44','fleshShade',.5,1);
 const head=part(a,'head',[0,-32],'neck');hollowFace(head,0,-28,1.7,{mouth:2.8,tilt:-1.5});
 shape(head,'M-8 -36 Q0 -44 8 -36 Q9 -31 7 -27 Q3 -34 0 -34 Q-3 -34 -7 -27 Q-9 -31 -8 -36Z','void');
 strands(head,0,-22,26,46,24,'void',.9,0);strands(head,0,-20,10,54,16,'rotShade',.6,0);
 shape(head,'M-11 -44 L11 -44 9 -36 -9 -36Z','hemp','void',.5);for(const x of [-6,-2,2,6])line(head,`M${x} -44 L${x} -36`,'hempShade',.6,1);line(head,'M-12 -40 L12 -40','straw',1.2,0);
 const staff=part(a,'staff',[20,-27],'torso');line(staff,'M18 -40 L26 8','lacquer',2,0);for(const y of [-30,-14,0])line(staff,`M${20+((y+40)/48)*6} ${y} l3 1`.replace(/l3 1/,'L'+(23+((y+40)/48)*6)+' '+(y+1)),'hempLight',.6,1);sway(a,'staff',4);
 for(const s of [-1,1]){const arm=part(a,(s<0?'l':'r')+'-arm',[s*10,-96],'torso');
  shape(arm,`M${s*9} -98 Q${s*15} -92 ${s*17} -74 Q${s*19} -52 ${s*21} -28 L${s*18} -27 Q${s*15} -52 ${s*13} -72 Q${s*11} -88 ${s*7} -94Z`,'flesh','void',.4);
  oval(arm,s*16,-70,1.6,2,'fleshLight');line(arm,`M${s*13} -88 Q${s*16} -70 ${s*19} -36`,'fleshShade',.6,1);hand(arm,s*20,-27,Math.PI/2+s*.12,18,'flesh');
  track(a,'idle',arm.id,'rotate',[[0,0],[.3,s*3],[.7,-s*2.5],[1,0]]);track(a,'attack',arm.id,'rotate',[[0,0],[.25,-s*24],[.55,s*48],[.8,s*12],[1,0]]);track(a,'hit',arm.id,'rotate',[[0,s*14],[.5,-s*4],[1,0]]);}
 sway(a,'robe',1.5);sway(a,'rope',2.5);track(a,'idle','neck','rotate',[[0,0],[.5,3],[1,0]]);track(a,'idle','head','rotate',[[0,0],[.35,-4],[.7,3],[1,0]]);
 react(a,'head',10);track(a,'move','root','rotate',[[0,0],[.5,5],[1,0]]);return a;
}
function hands(d){
 // 천수귀: a fused heap of the drowned and the crushed, raised on three jointed stilts.
 // Many arms reach out of it at once; several half-sunk faces still look out.
 const a=asset(d,150,[-90,-176,180,182]);Object.assign(a.palette,pal);seed=23;part(a,'root',[0,-70]);
 [[-20,-1],[3,0],[24,1]].forEach(([x,s],i)=>{const leg=part(a,'leg'+i,[x,-72],'root');
  shape(leg,`M${x-3} -74 Q${x+s*10-2} -50 ${x+s*14-2} -38 L${x+s*14+2} -38 Q${x+s*10+3} -50 ${x+3} -74Z`,'rotShade','void',.4);
  shape(leg,`M${x+s*14-2} -40 Q${x+s*10} -18 ${x+s*6-1} 0 L${x+s*6+2} 0 Q${x+s*12+2} -18 ${x+s*14+2} -40Z`,'flesh','void',.4);oval(leg,x+s*14,-39,2.4,2.4,'fleshShade','void',.4);
  for(let f=-1;f<=1;f++)line(leg,`M${x+s*6} 0 L${x+s*6+f*4} 2`,'void',1,0);
  track(a,'move',leg.id,'rotate',[[0,0],[.25,(i-1)*8+7],[.75,-(i-1)*6-7],[1,0]]);});
 const heap=part(a,'heap',[0,-96],'root');
 shape(heap,`M-40 -74 Q-50 -92 -42 -104 Q-46 -118 -32 -124 Q-28 -138 -12 -134 Q-2 -146 10 -136 Q24 -140 30 -126 Q44 -122 42 -108 Q52 -96 42 -84 Q46 -74 38 -70${torn(38,-70,-40,-74,10,5)}Z`,'rot','void',.7);
 shape(heap,'M-30 -78 Q-36 -104 -20 -120 Q-8 -112 -10 -90 Q-14 -80 -30 -78Z','rotShade');shape(heap,'M14 -128 Q30 -122 36 -104 L28 -100 Q24 -116 12 -122Z','fleshShade');
 for(const [x,y,r] of [[-6,-90,7],[18,-112,5.5],[-24,-112,4.5]])shape(heap,`M${x-r*1.4} ${y} Q${x} ${y-r*1.6} ${x+r*1.4} ${y} Q${x} ${y+r*1.3} ${x-r*1.4} ${y}Z`,'wet');
 const faces=part(a,'faces',[0,-100],'heap');hollowFace(faces,-6,-91,.95,{mouth:2});hollowFace(faces,18,-113,.7,{mouth:1.2,tilt:1});hollowFace(faces,-24,-113,.6,{mouth:1.8,tilt:-1});
 for(let i=0;i<14;i++){const x=-34+rnd()*68,y=-120+rnd()*44;line(heap,`M${n(x)} ${n(y)} Q${n(x+(rnd()-.5)*10)} ${n(y+rnd()*6)} ${n(x+(rnd()-.5)*14)} ${n(y+rnd()*8)}`,'fleshShade',.5,1);}
 const reach=[[-154,64],[-136,58],[-118,70],[-96,62],[-76,56],[-58,66],[-38,52],[-168,48],[-24,44]];
 reach.forEach(([deg,len],i)=>{const r=deg*Math.PI/180,bx=n(Math.cos(r)*30),by=n(-98+Math.sin(r)*24),mx=n(bx+Math.cos(r+.18)*len*.55),my=n(by+Math.sin(r+.18)*len*.55),ex=n(bx+Math.cos(r)*len),ey=n(by+Math.sin(r)*len);
  const arm=part(a,'arm'+i,[bx,by],'heap'),f=i%3===1?'fleshShade':'flesh';
  shape(arm,`M${bx-2.4} ${by} Q${mx-2} ${my} ${ex-1.4} ${ey} L${ex+1.4} ${ey} Q${mx+2.4} ${my+1} ${bx+2.4} ${by+1}Z`,f,'void',.35);oval(arm,mx,my,1.6,1.6,'fleshLight');
  hand(arm,ex,ey,r,10,f);if(i%2===0)shape(arm,`M${mx-2} ${my} L${mx+3} ${my} ${mx+2} ${my+9} ${mx-1} ${my+8}Z`,'talisman','void',.3);
  track(a,'idle',arm.id,'rotate',[[0,0],[.3,(i%2?4:-4)],[.65,(i%2?-3:3)],[1,0]]);track(a,'attack',arm.id,'rotate',[[0,0],[.3,(i%2?-18:18)],[.6,(i%2?12:-12)],[1,0]]);});
 track(a,'idle','heap','scaleY',[[0,1],[.4,1.03],[.75,.985],[1,1]]);react(a,'faces',5);return a;
}
function door(d){
 // 입 벌린 문짝: an old temple lattice door with torn hanji. It splits down the centre stile
 // into a long uneven mouth; an eye watches from a knot hole and fingers grip the edges from inside.
 const a=asset(d,160,[-62,-176,124,180]);Object.assign(a.palette,pal);seed=37;part(a,'root',[0,-50]);
 for(const s of [-1,1])for(const k of [0,1]){const leg=part(a,`leg${s}${k}`,[s*10,-40],'root'),kx=s*(24+k*10);
  shape(leg,`M${s*8} -44 Q${kx-s*4} -46 ${kx} -30 L${kx+s*3} -30 Q${kx-s*2} -44 ${s*12} -40Z`,'flesh','void',.4);oval(leg,kx+s*1.5,-30,2,2,'fleshShade');
  shape(leg,`M${kx} -30 Q${kx+s*3} -14 ${kx+s*1} 0 L${kx+s*4} 0 Q${kx+s*6} -14 ${kx+s*3} -30Z`,'flesh','void',.4);hand(leg,kx+s*2.5,0,Math.PI/2+s*.6,6,'flesh');
  track(a,'move',leg.id,'rotate',[[0,0],[.25,s*(k?10:-10)],[.75,s*(k?-10:10)],[1,0]]);}
 for(const s of [-1,1]){const leaf=part(a,(s<0?'l':'r')+'-leaf',[s*2,-104],'root');
  shape(leaf,`M${s*2} -168 L${s*27} -165 Q${s*29} -110 ${s*27} -46 L${s*3} -44 ${s*5} -60 ${s*2} -74 ${s*6} -92 ${s*2} -108 ${s*6} -126 ${s*2} -144Z`,'rust','void',.8);
  shape(leaf,`M${s*22} -163 L${s*27} -165 Q${s*29} -110 ${s*27} -46 L${s*22} -48Z`,'rotShade');shape(leaf,`M${s*3} -167 L${s*26} -164 ${s*26} -160 ${s*3} -162Z`,'danGreen');for(const x of [7,13,19])oval(leaf,s*x,-163,1.4,1.4,'danRed');
  for(const [y0,y1] of [[-160,-136],[-130,-106],[-100,-76],[-70,-52]]){shape(leaf,`M${s*8} ${y0} L${s*21} ${y0} ${s*21} ${y1} ${s*8} ${y1}Z`,'hempLight','void',.4);
   shape(leaf,`M${s*8} ${y0+(y1-y0)*.4}${torn(s*8,y0+(y1-y0)*.4,s*21,y0+(y1-y0)*.7,5,3)} L${s*21} ${y1} ${s*8} ${y1}Z`,'wet');
   line(leaf,`M${s*14.5} ${y0} L${s*14.5} ${y1} M${s*8} ${(y0+y1)/2} L${s*21} ${(y0+y1)/2}`,'rust',1,1);}
  const teeth=[];for(let i=0;i<12;i++){const y=-138+i*7,l=4+rnd()*5;teeth.push(`M${s*2} ${y} L${n(s*(2+l))} ${n(y+2.5)} L${s*2} ${y+5}Z`);}shape(leaf,teeth.join(' '),'bone','boneShade',.3);
  for(let i=0;i<3;i++){const y=-130+i*26;finger(leaf,s*3,y,s>0?.15:Math.PI-.15,12,'fleshShade',1.1);}
  track(a,'attack',leaf.id,'rotate',[[0,0],[.3,s*16],[.6,-s*3],[1,0]]);track(a,'idle',leaf.id,'rotate',[[0,0],[.5,s*2.2],[1,0]]);}
 shape(a.parts[0],'M-2.5 -140 Q0 -104 -2 -62 L2 -62 Q0 -104 2.5 -140Z','void');shape(a.parts[0],'M-1 -120 Q0 -104 -1 -84','blood');
 const eye=part(a,'eye',[-20,-150],'l-leaf');oval(eye,-18,-150,5.2,3.6,'wet');oval(eye,-18,-150,4,2.6,'pale','void',.4);oval(eye,-18.6,-150,1.7,2.3,'void');oval(eye,-19.2,-151,.55,.55,'glint');line(eye,'M-23 -151 Q-18 -155 -13 -151','void',.7,0);
 const chain=part(a,'chain',[24,-70],'r-leaf');for(let i=0;i<6;i++)oval(chain,25+i*1.6,-66+i*8,2,3.2,null,'iron',1.1);shape(chain,'M27 -22 L33 -22 31 -14 29 -14Z','iron');sway(a,'chain',5);
 const tal=part(a,'talisman',[-14,-60],'l-leaf');shape(tal,'M-20 -66 L-10 -66 -11 -42 -14 -46 -17 -40 -19 -44Z','talisman','void',.3);line(tal,'M-17 -62 L-13 -60 -17 -56 -12 -52 -16 -48','cord',.6,1);sway(a,'talisman',6);
 react(a,'eye',8);return a;
}
function wonhon(d){
 // 넘쳐온 원혼: no object to possess, so the dead knot into a body of their own — a bowed torso
 // with the head sunk into the chest, arms melting into drips, and legs smeared into trailing faces.
 const a=asset(d,124,[-70,-134,140,138]);Object.assign(a.palette,pal);seed=53;part(a,'root',[0,-46]);
 const trail=part(a,'trail',[0,-24],'root');
 shape(trail,`M-18 -46 Q-30 -26 -52 -10 Q-36 -12 -30 -2 Q-20 -12 -14 0 Q-8 -14 -2 0 Q4 -14 10 -2 Q14 -18 18 -46Z`,'mist','mistShade',.5);
 shape(trail,'M-14 -40 Q-24 -24 -40 -12 Q-26 -16 -20 -8 Q-14 -24 -8 -40Z','mistShade');
 for(const [x,y] of [[-34,-14],[-14,-10],[4,-10]]){shape(trail,`M${x-1} ${y-4} Q${x+2} ${y-6} ${x+5} ${y-4} Q${x+6} ${y+4} ${x+2} ${y+9} Q${x-2} ${y+4} ${x-1} ${y-4}Z`,'mistShade');oval(trail,x+.6,y-1.5,.9,2.2,'void');oval(trail,x+3.6,y-1.5,.9,2.2,'void');oval(trail,x+2.1,y+4,1.2,3,'void');}
 track(a,'move','trail','scaleX',[[0,1],[.5,1.14],[1,1]]);track(a,'idle','trail','scaleX',[[0,1],[.5,1.05],[1,1]]);
 const body=part(a,'body',[0,-78],'root');shape(body,'M-22 -48 Q-30 -80 -18 -100 Q-4 -114 12 -104 Q26 -92 22 -48 Q0 -40 -22 -48Z','shroud','void',.6);shape(body,'M-22 -48 Q-28 -78 -18 -96 L-10 -92 Q-16 -70 -12 -48Z','shroudShade');for(const y of [-92,-78,-62])line(body,`M-24 ${y} Q0 ${y+5} 22 ${y}`,'hempShade',1.4,0);for(const y of [-92,-78,-62])shape(body,`M-2 ${y+1} L2 ${y+1} 3 ${y+8} 0 ${y+5} -3 ${y+8}Z`,'hempShade');
 shape(body,'M-14 -52 Q-18 -80 -6 -98 Q4 -86 2 -52Z','rotShade');ribs(body,0,-92,4,12,7,'fleshShade');
 const head=part(a,'head',[-2,-90],'body');shape(head,'M-14 -98 Q-12 -110 -2 -112 Q10 -112 12 -100 Q8 -88 -2 -86 Q-12 -88 -14 -98Z','wet');
 hollowFace(head,-2,-98,1.1,{mouth:3,tilt:1.5});strands(head,-2,-108,10,18,20,'void',.8,-3);
 for(const s of [-1,1]){const arm=part(a,(s<0?'l':'r')+'-arm',[s*18,-92],'body');
  shape(arm,`M${s*16} -96 Q${s*30} -86 ${s*32} -64 Q${s*33} -52 ${s*30} -40 L${s*27} -46 Q${s*26} -60 ${s*21} -78Z`,'flesh','void',.4);
  for(let i=0;i<3;i++)line(arm,`M${s*(28+i*1.5)} -44 Q${s*(29+i*1.6)} -36 ${s*(28+i*2)} ${-30+i*4}`,'fleshShade',1.1-i*.2,0);react(a,arm.id,s*18);}
 track(a,'idle','body','scaleY',[[0,1],[.4,1.04],[.75,.98],[1,1]]);sway(a,'head',2.5);track(a,'move','body','rotate',[[0,0],[.5,-7],[1,0]]);return a;
}
function gateArmor(d){
 // 문턱 꼭두: a funeral bier's wooden guardian figure (무사 꼭두) grown to a man's height and a half.
 // Faded red-and-indigo paint over split wood, a felt 전립 with a red tassel, a carved face with
 // painted eyes, pegged joints, and a hollow back stuffed with paper seals. It guards a threshold
 // the way it once guarded a coffin: by standing in the way.
 const a=asset(d,170,[-74,-190,148,194]);Object.assign(a.palette,pal);seed=71;part(a,'root',[0,-56]);
 const base=part(a,'base',[0,-6],'root');shape(base,'M-26 -10 L26 -10 30 0 -30 0Z','lacquer','void',.6);line(base,'M-24 -6 L24 -6','danRed',1,1);
 for(const s of [-1,1]){const leg=part(a,(s<0?'l':'r')+'-leg',[s*9,-58],'root');
  shape(leg,`M${s*3} -62 L${s*17} -62 Q${s*19} -34 ${s*16} -10 L${s*4} -10 Q${s*2} -34 ${s*3} -62Z`,'indigo','void',.6);
  line(leg,`M${s*5} -40 L${s*16} -40 M${s*5} -24 L${s*16} -24`,'straw',1.1,1);shape(leg,`M${s*2} -14 L${s*19} -14 ${s*20} -10 ${s*1} -10Z`,'lacquer');
  for(let k=0;k<3;k++)line(leg,`M${s*(7+k*3)} -60 Q${s*(8+k*3)} -46 ${s*(7+k*3)} -30`,'void',.4,1);
  track(a,'move',leg.id,'rotate',[[0,0],[.25,s*6],[.75,-s*6],[1,0]]);}
 const body=part(a,'body',[0,-104],'root');
 shape(body,'M-24 -150 Q0 -156 24 -150 Q32 -120 30 -92 Q34 -74 26 -58 L-26 -58 Q-34 -74 -30 -92 Q-32 -120 -24 -150Z','danRed','void',.9);
 shape(body,'M-24 -150 L-8 -150 -12 -58 -26 -58 Q-34 -74 -30 -92 Q-32 -120 -24 -150Z','lacquer');shape(body,'M8 -150 L24 -150 Q32 -120 30 -92 L22 -96 Q22 -124 8 -146Z','paint');
 shape(body,'M-30 -96 L30 -96 30 -88 -30 -88Z','indigo','void',.4);for(const x of [-22,-11,0,11,22])oval(body,x,-92,1.6,1.6,'paint');
 for(const [x,y] of [[-6,-140],[6,-120],[-10,-110],[8,-78]])line(body,`M${x} ${y} Q${x+3} ${y+10} ${x-1} ${y+20}`,'void',.8,1);
 shape(body,'M-4 -130 Q-2 -118 -5 -104 L1 -104 Q3 -118 2 -130Z','void');for(const [x,y,h] of [[-3,-128,10],[0,-116,9]])shape(body,`M${x} ${y} L${x+3} ${y} ${x+3} ${y+h} ${x+1.5} ${y+h-2} ${x} ${y+h}Z`,'talisman');
 line(body,'M-22 -146 Q-26 -120 -28 -96','danGreen',1.4,1);line(body,'M22 -146 Q26 -120 28 -96','danGreen',1.4,1);
 const head=part(a,'head',[0,-160],'body');
 shape(head,'M-11 -170 Q-12 -156 -8 -150 L8 -150 Q12 -156 11 -170 Q0 -176 -11 -170Z','paint','void',.6);
 shape(head,'M-8 -164 Q-4 -167 -1 -164 L-2 -162 -7 -162Z M1 -164 Q4 -167 8 -164 L7 -162 2 -162Z','void');oval(head,-4.5,-163,.6,.6,'glint');oval(head,4.5,-163,.6,.6,'glint');
 line(head,'M-7 -167 L-2 -166 M2 -166 L7 -167','void',.9,0);shape(head,'M-1 -162 L1 -162 1.5 -158 -1.5 -158Z','danRed');
 shape(head,'M-7 -156 Q-4 -153 0 -155 Q4 -153 7 -156 Q4 -151 0 -152 Q-4 -151 -7 -156Z','void');
 line(head,'M-9 -158 L-11 -150 M9 -158 L11 -150','void',.6,1);
 shape(head,'M-18 -170 Q0 -176 18 -170 L14 -168 Q0 -172 -14 -168Z','lacquer','void',.5);shape(head,'M-10 -170 Q-10 -184 0 -186 Q10 -184 10 -170Z','lacquer','void',.6);
 shape(head,'M-3 -186 Q0 -194 3 -186 Q6 -180 2 -176 L-2 -176 Q-6 -180 -3 -186Z','danRed');line(head,'M0 -186 Q4 -178 8 -172 M0 -186 Q-3 -178 -6 -172','cord',.8,0);
 for(const s of [-1,1]){const arm=part(a,(s<0?'l':'r')+'-arm',[s*26,-146],'body');
  shape(arm,`M${s*22} -150 Q${s*38} -146 ${s*40} -124 L${s*42} -98 ${s*32} -96 ${s*30} -124 Q${s*28} -138 ${s*20} -142Z`,s<0?'danRed':'indigo','void',.6);
  oval(arm,s*35,-124,2,2,'paint','void',.4);line(arm,`M${s*33} -108 L${s*41} -108`,'straw',1,1);
  shape(arm,`M${s*31} -98 L${s*43} -98 Q${s*44} -90 ${s*38} -86 L${s*32} -88Z`,'paint','void',.4);react(a,arm.id,s*14);}
 const spear=part(a,'spear',[40,-92],'r-arm');line(spear,'M40 -10 L40 -184','lacquer',2.4,0);shape(spear,'M37 -184 L40 -200 43 -184Z M33 -186 L37 -192 37 -182Z M47 -186 L43 -192 43 -182Z','ironLight','void',.4);
 shape(spear,'M37 -180 L43 -180 44 -172 36 -172Z','danRed');strands(spear,40,-172,5,14,4,'danRed',.7,2);
 track(a,'attack','spear','rotate',[[0,0],[.3,-20],[.55,30],[.8,8],[1,0]]);
 track(a,'idle','body','rotate',[[0,0],[.5,.8],[1,0]]);track(a,'hit','head','rotate',[[0,-8],[.5,3],[1,0]]);return a;
}
function forepaw(d){
 // 혼류의 앞발: one limb longer than the whole shoulder, risen from below. Bone shows through
 // sinew, hair and seals are knotted around it, and the shoulder mass is crowded with eyes and small hands.
 const a=asset(d,180,[-120,-204,240,208]);Object.assign(a.palette,pal);seed=97;part(a,'root',[0,-24]);
 const mass=part(a,'mass',[-36,-46],'root');
 shape(mass,`M-104 0 Q-114 -30 -100 -50 Q-104 -72 -84 -82 Q-74 -100 -54 -96 Q-38 -110 -24 -94 Q-6 -92 -8 -72 Q8 -54 2 -30 Q8 -14 4 0${torn(4,0,-104,0,8,4)}Z`,'rot','void',.9);shape(mass,'M-84 -6 Q-88 -50 -60 -74 Q-40 -50 -48 -8Z','rotShade');
 for(const [x,y,r] of [[-56,-66,4.6],[-40,-56,3.4],[-70,-50,3.8],[-48,-40,2.8],[-28,-70,2.6],[-82,-30,3]]){shape(mass,`M${x-r*1.6} ${y} Q${x} ${y-r*1.5} ${x+r*1.6} ${y} Q${x} ${y+r*1.3} ${x-r*1.6} ${y}Z`,'pale','void',.4);oval(mass,x+r*.2,y,r*.5,r*.75,'void');oval(mass,x,y-r*.3,r*.18,r*.18,'glint');}
 for(const [x,y,ang] of [[-92,-20,-2.2],[-22,-30,-.9],[-60,-90,-1.7]])hand(mass,x,y,ang,12,'fleshShade');
 const arm=part(a,'arm',[-24,-82],'mass');
 shape(arm,'M-30 -86 Q-4 -138 40 -176 Q58 -190 74 -184 L82 -172 Q62 -168 46 -152 Q14 -118 -8 -70Z','flesh','void',1);
 shape(arm,'M-18 -84 Q8 -130 46 -166 L54 -162 Q22 -130 -4 -78Z','fleshShade');line(arm,'M-12 -96 Q16 -138 50 -168','bone',2.4,0);line(arm,'M-6 -90 Q22 -132 56 -162','boneShade',1,1);
 for(const [x,y] of [[0,-112],[18,-134],[34,-152]]){line(arm,`M${x-6} ${y+4} Q${x} ${y-6} ${x+8} ${y-2}`,'void',2.2,0);strands(arm,x,y,5,14,6,'void',.6,4);}
 for(const [x,y] of [[10,-128],[44,-160]]){shape(arm,`M${x} ${y} L${x+7} ${y-2} ${x+8} ${y+16} ${x+4} ${y+13} ${x+1} ${y+17}Z`,'talisman','void',.3);line(arm,`M${x+2} ${y+3} L${x+5} ${y+6} ${x+2} ${y+9}`,'cord',.6,1);}
 for(const [x,y] of [[-2,-104],[26,-142]]){line(arm,`M${x-8} ${y+6} Q${x+2} ${y-4} ${x+12} ${y-2}`,'straw',2.6,0);for(let k=0;k<3;k++)shape(arm,`M${x-4+k*5} ${y+2-k*2} L${x-1+k*5} ${y+2-k*2} ${x-2+k*5} ${y+10-k*2}Z`,'shroud');}
 const paw=part(a,'paw',[74,-180],'arm');shape(paw,'M60 -192 Q80 -202 96 -188 Q100 -176 92 -168 Q78 -172 64 -170Z','flesh','void',.7);
 for(let i=0;i<5;i++){const ang=-1.15+i*.42,bx=88+i*1.5,by=-188+i*5;finger(paw,bx,by,ang,30-i*2,'bone',2.4);}
 track(a,'idle','arm','rotate',[[0,0],[.4,-2.5],[.8,2],[1,0]]);track(a,'attack','arm','rotate',[[0,0],[.3,-16],[.55,24],[.8,7],[1,0]]);track(a,'attack','paw','rotate',[[0,0],[.5,18],[1,0]]);
 track(a,'idle','mass','scaleY',[[0,1],[.45,1.03],[.8,.985],[1,1]]);track(a,'hit','arm','rotate',[[0,8],[.5,-3],[1,0]]);return a;
}
const builders={grot_hanging:hanging,grot_hands:hands,grot_door:door,wonhon:wonhon,gate_armor:gateArmor,forepaw:forepaw};
export function grotesque(d){return builders[d.id](d);}
