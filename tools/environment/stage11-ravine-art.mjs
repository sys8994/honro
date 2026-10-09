import {compileSVG} from './build-act2-art.mjs';
import {readFileSync} from 'node:fs';

// Stage-local art. There are no renderer changes, shared asset mutations or
// inferred solids here: the author supplies every collision surface separately.
export const STAGE11_ART_PREFIX='stage11:ravine-';
const n=v=>Math.round(v*100)/100;
const path=(d,fill,stroke='',width=1)=>`<path d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`:''}/>`;
const poly=(p,fill)=>path('M'+p.map(q=>q.map(n).join(' ')).join('L')+'Z',fill);
const line=(p,color,width)=>path('M'+p.map(q=>q.map(n).join(' ')).join('L'),'none',color,width);
const inkPoly=(ps,fill,bend=.16)=>{const q=ps.map((p,i)=>{const a=ps[(i+ps.length-1)%ps.length],z=ps[(i+1)%ps.length];return{p,a:[n(p[0]+(a[0]-p[0])*bend),n(p[1]+(a[1]-p[1])*bend)],z:[n(p[0]+(z[0]-p[0])*bend),n(p[1]+(z[1]-p[1])*bend)]};});return path(`M${q[0].z.join(' ')} `+q.slice(1).concat(q[0]).map(v=>`L${v.a.join(' ')}Q${v.p.map(n).join(' ')} ${v.z.join(' ')}`).join(' ')+'Z',fill);};
const group=(x,y,sx,sy,body)=>`<g transform="matrix(${sx} 0 0 ${sy} ${x} ${y})">${body}</g>`;
const nodes=t=>1+(t.children||[]).reduce((k,v)=>k+nodes(v),0);
function makeAsset(key,name,body,bounds,{category='tree',role='tree'}={}){
 const vector=compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.join(' ')}">${body}</svg>`);
 if(nodes(vector.root)>420)throw Error(`Stage 11 art budget exceeded: ${key}`);
 const [x,y,w,h]=bounds;
 return{id:STAGE11_ART_PREFIX+key,name,category,environmentRole:role,visual:[],vector,collision:[],anchor:{x:0,y:0},sockets:[],tags:['stage11-ravine','visual-only','editable-native-vector'],params:{artRevision:1,collisionSource:'authored-stage-terrain',nodeCount:nodes(vector.root)},bounds:{x,y,w,h},reference:{heightM:h/60,bounds:{x,y,w,h},foot:{x:0,y:0},scaleRange:[.35,4],backgroundRange:[.35,4]}};
}
function add(project,st,a,key,x,y,{layer='back',scale=1}={}){
 const ai=project.library.findIndex(v=>v.id===a.id);if(ai<0)project.library.push(a);else project.library[ai]=a;
 const e={id:'s11-art-'+key,assetId:a.id,x,y,scale,rotation:0,snap:false,depthLayer:'L1',layer};st.elements.push(e);return e;
}

// Needle crowns have a broken, wind-cut rim and a heavy underside. Large
// asymmetrical needle sprays are batched by ink value, not repeated leaf dots.
function crown(cx,cy,w,h,variant=0){
 let b=path('M-1 .22Q-.94-.04-.79-.07L-.82-.18Q-.68-.24-.58-.19Q-.54-.59-.30-.51L-.29-.65Q-.12-.77 .03-.53Q.15-.7 .31-.49L.42-.52Q.63-.46 .67-.22Q.91-.2 1 .16Q.90 .39 .71 .35Q.63 .58 .37 .45Q.12 .68-.08 .5Q-.28 .67-.46 .45Q-.71 .57-.81 .37Q-.96 .4-1 .22Z','#19352d');
 b+=path('M-.95 .16Q-.67 .27-.5 .2Q-.4 .43-.16 .29Q.06 .46 .29 .28Q.58 .40 .77 .22L.97 .18Q.86 .44 .68 .35Q.46 .64 .25 .44Q.04 .62-.16 .48Q-.41 .68-.59 .44Q-.85 .49-.95 .16Z','#0e2724');
 b+=path('M-.83-.12Q-.64-.28-.51-.14Q-.51-.46-.28-.45Q-.18-.66 .02-.42Q.17-.52 .31-.35Q.43-.44 .62-.21L.74-.15Q.6-.05 .38-.1Q.27 .02 .12-.08Q-.03 .04-.2-.05Q-.39 .1-.53-.02Q-.69 .04-.83-.12Z','#3a5840');
 b+=path('M-.53-.22Q-.37-.42-.25-.34Q-.12-.53 .05-.31L.28-.3Q.08-.2-.04-.25Q-.21-.12-.34-.18L-.53-.11Z','#667350');
 b+=path('M-.8 .15Q-.62 .02-.42 .12M-.33 .24Q-.13 .05 .04 .14M.15 .21Q.34 .02 .54 .12M.61 .17Q.76 .01 .89 .08','none','#416046',.023);
 return group(cx,cy,w/2,h,b);
}

const PINE_FORMS=[
 {name:'능선을 굽어 오른 장수송',trunk:'M-116 12Q-5 -176 -56 -403C-123 -609 -87 -774 -17 -933C78 -1148 105 -1366 47 -1605L94 -1725Q185 -1462 169 -1282C157 -1056 49 -880 54 -701C62 -502 18 -223 173 16L90 25 23 -26 -31 20Z',light:'M-76 -12Q23 -171 -9 -394C-52 -621 -43 -757 23 -918C104 -1118 124 -1379 78 -1604L101 -1644Q153 -1380 131 -1191C100 -1023 11 -835 14 -679Q45 -366 64 -154L128 9 69 -8 20 -62Z',crowns:[[-590,-1160,1160,190,0],[546,-1390,1210,210,1],[20,-1717,1490,230,2],[-935,-795,900,155,1]],boughs:[[-33,-774,-970,-815],[52,-1090,-596,-1161],[100,-1280,587,-1402],[98,-1560,-275,-1718]]},
 {name:'돌마루를 덮는 수평 우산송',trunk:'M-128 15Q-18 -211 -9 -384C-1 -563 138 -776 169 -1032Q193 -1221 150 -1405L188 -1510Q265 -1312 260 -1137C251 -869 117 -655 110 -451Q93 -237 234 22L124 17 70 -26 5 12Z',light:'M-74 -3Q39 -226 33 -407C32 -599 172 -812 199 -1032Q219 -1217 180 -1408L202 -1445Q250 -1246 232 -1081C204 -845 83 -653 71 -447Q69 -228 173 13L104 -14 55 -60Z',crowns:[[-946,-1140,1560,195,1],[835,-1260,1520,210,0],[-150,-1514,1520,210,2],[1170,-832,1070,160,2]],boughs:[[83,-684,1192,-845],[166,-1010,-985,-1155],[197,-1180,855,-1270],[181,-1380,-215,-1510]]},
 {name:'절벽을 움켜쥔 쌍간송',trunk:'M-148 21Q-60 -130 -100 -354C-142 -583 -83 -739 -54 -916Q-40 -1090 -146 -1330L-102 -1435Q58 -1180 34 -937C7 -758 -30 -542 1 -375Q48 -214 150 8L66 13 14 -29 -50 12Z M-10 -298Q122 -483 172 -748Q213 -995 298 -1225L338 -1268Q308 -955 285 -745C258 -532 169 -325 132 -155L63 -189Z',light:'M-99 -9Q-16 -163 -51 -367C-91 -576 -46 -730 -16 -915Q-2 -1095 -116 -1335L-102 -1374Q21 -1158 12 -972C-18 -755 -44 -537 -12 -361Q13 -222 87 7L49 -18 6 -51Z M63 -296Q182 -589 203 -802Q235 -1010 317 -1210L301 -1101Q242 -823 245 -695Q209 -459 106 -235Z',crowns:[[-658,-1110,1230,210,2],[506,-1300,1310,225,1],[-113,-1455,1130,215,0],[725,-765,1130,180,0]],boughs:[[-37,-874,-655,-1127],[236,-920,779,-782],[259,-1124,525,-1309],[-48,-1290,-148,-1450]]},
 {name:'북녘 바람에 기운 벼랑송',trunk:'M-133 16Q-72 -166 -93 -366C-115 -577 -24 -788 93 -958Q261 -1199 212 -1450L262 -1539Q346 -1279 242 -1059C146 -856 53 -698 35 -464Q18 -218 165 15L78 22 10 -21 -50 23Z',light:'M-91 -1Q-21 -206 -42 -376C-65 -581 15 -777 129 -945Q292 -1184 245 -1440L267 -1476Q316 -1243 205 -1031C102 -842 20 -689 -8 -466Q-11 -207 103 11L51 -4 7 -48Z',crowns:[[-700,-1088,1200,172,0],[-35,-1558,1710,200,1],[769,-1298,1260,180,2],[-856,-669,995,166,2]],boughs:[[-62,-555,-887,-682],[80,-918,-728,-1100],[260,-1216,812,-1310],[260,-1410,-6,-1553]]}
];

export function stage11PineAsset(key,{height=2300,variant=0,branchProfiles=[]}={}){
 const reach=branchProfiles.length?Math.max(...branchProfiles.flatMap(p=>(p.points||p).map(q=>-q[1])))+100:height;
 const f=PINE_FORMS[variant%4],sy=reach/1780,sx=sy*(variant===1?1.07:variant===2?.92:1);let b='';
 // Root buttresses, two opposed cambium planes and deep hollows establish age.
 b+=path('M-118 -154Q-220 -53 -479 -21L-603 27Q-315 60 -143 14L-67 26 72 13Q288 69 536 38L621 2Q339 23 188 -91L87 -209Z','#313b32');
 b+=path('M-102 -102Q-266 -28 -512 11L-569 27Q-313 21 -88 -45M91 -148Q233 -17 473 21L544 15','none','#7b7452',20);
 b+=path('M-97 -49Q-6 -204 82 -178Q126 -123 143 -23Q58 -78 -18 13Z','#152b29');
 b+=path(f.trunk,'#564331','#242a23',14)+path(f.light,'#9a794c');
 for(const [i,[x,y,ex,ey]]of (branchProfiles.length?[]:f.boughs).entries()){
  const bend=(ex-x)*.48;b+=path(`M${x-32} ${y+31}Q${x+bend} ${ey+94} ${ex} ${ey+26}L${ex+55} ${ey-2}Q${x+bend} ${ey+32} ${x+20} ${y-27}Z`,'#424a36','#1d322b',9);
  b+=path(`M${x+1} ${y-3}Q${x+bend} ${ey+45} ${ex} ${ey+8}`,'none','#a09565',9);
 }
 // Character-sized trunk plates, never fine bark noise.
 b+=path('M-41 -76Q12 -239 -10 -407M-13 -488Q-47 -660 -2 -803M33 -882Q92 -1034 106 -1148M110 -1201Q139 -1384 104 -1514','none','#283a2e',19);
 b+=path('M-45 -205L-1 -229 -12 -341M-21 -530L20 -585 9 -652M12 -775L50 -811 41 -879M80 -1050L130 -1091 135 -1161','none','#b0a177',6);
 b+=path('M32 -427Q102 -495 63 -565Q9 -559 32 -427Z','#23372d');
 if(!branchProfiles.length)for(const c of f.crowns)b+=crown(...c);
 // The author may supply true branch top edges. Connect them in world-local
 // space after scaling the painted tree, so their landings never drift.
 let svg=group(0,0,sx,sy,b);
 for(const [i,profile]of branchProfiles.entries()){
  const p=profile.points||profile,left=p[0],right=p.at(-1),mx=(left[0]+right[0])/2,my=p.reduce((s,q)=>s+q[1],0)/p.length,tx=height*.018;
  const leafy=[/(?:lower-bough|middle-bough|crown|umbrella|low-bough)$/,/lower-bough|upper-bough|crown$/,/lower-bough|middle-bough|upper-bough/,/lower-bough|middle-bough|crown|windswept-bough|lower-arm$/][variant%4];
  if(leafy.test(profile.id||'')){
   const w=right[0]-left[0],shift=((i+variant)%3-1)*w*.15;
   svg+=crown(mx+shift+(variant===1?-w*.19:variant===3?w*.17:0),my+108,w*(/umbrella/.test(profile.id)?1.20:variant===1?1.82:variant===2?1.25:1.45),Math.min(/umbrella/.test(profile.id)?540:270,w*.23),i+variant);
   svg+=crown((i%2?left[0]:right[0])+(i%2?-130:140),my+74,w*.52,Math.min(142,w*.11),(i+variant+1)%3);
  }
 }
 const pp=branchProfiles.flatMap(q=>q.points||q),minX=Math.min(-2000*sx,...pp.map(p=>p[0]-2300)),maxX=Math.max(2000*sx,...pp.map(p=>p[0]+2300)),minY=Math.min(-1870*sy,...pp.map(p=>p[1]-700)),maxY=Math.max(150*sy,...pp.map(p=>p[1]+420));
 return makeAsset(key,f.name,svg,[minX,minY,maxX-minX,maxY-minY]);
}

export function stage11BackdropAsset(){
 const source=readFileSync(new URL('../../shared/assets/environment/stage11-ravine-far.svg',import.meta.url),'utf8'),vector=compileSVG(source);
 const a=makeAsset('morning-backdrop','새벽 산맥과 넓은 화강암 병풍','',[0,0,1800,1040],{category:'terrain',role:'mountain'});a.vector=vector;a.params.nodeCount=nodes(vector.root);return a;
}

// Fallen trunks and root arches are shaped by their complete authored solid,
// including the open underside. There is no vertical-tree template here.
export function stage11RootArchitectureAsset(key,spec,terrain){
 if(!terrain)throw Error('Missing main root terrain for '+key);
 const ps=terrain.points.map(p=>[p.x-spec.x,p.y-spec.y]),xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
 const top=ps.slice(0,terrain.properties.honroWalkEdges.length+1),b=[];
 b.push(`<defs><linearGradient id="wood-depth" x1="${n(x)}" y1="${n(y)}" x2="${n(x+w*.35)}" y2="${n(y+h)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#787450"/><stop offset="0.47" stop-color="#555d40"/><stop offset="1" stop-color="#304630"/></linearGradient></defs>`);
 b.push(poly(ps,'url(#wood-depth)'));
 const lowerAt=(xx,yy)=>{const hits=[];for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];if(xx>=Math.min(a[0],z[0])&&xx<=Math.max(a[0],z[0])&&Math.abs(z[0]-a[0])>.01)hits.push(a[1]+(z[1]-a[1])*(xx-a[0])/(z[0]-a[0]));}return Math.max(yy+20,...hits);};
 const samples=[];for(let i=0;i<top.length-1;i++)for(const f of [.02,.31,.68]){const a=top[i],z=top[i+1],xx=a[0]+(z[0]-a[0])*f,yy=a[1]+(z[1]-a[1])*f;samples.push([xx,yy,lowerAt(xx,yy)]);}const end=top.at(-1);samples.push([end[0]-.5,end[1],lowerAt(end[0]-.5,end[1])]);
 const band=(start,end,lo,hi,color)=>{const q=samples.slice(start,end);if(q.length<2)return;const a=q.map(([x,y,b],i)=>[x,y+(b-y)*(lo+.085*Math.sin(i*.84))]),z=q.map(([x,y,b],i)=>[x,y+(b-y)*(hi+.08*Math.sin(i*.71+.4))]).reverse();b.push(inkPoly([...a,...z],color,.17));};
 band(0,samples.length,.65,.94,'#263e2f');band(1,samples.length-1,.17,.47,'#83805a');band(2,samples.length-2,.42,.61,'#3d5035');
 const strip=(d,width,c)=>b.push(poly([...top.map(([x,y])=>[x,y+d]),...top.slice().reverse().map(([x,y])=>[x,y+d+width])],c));
 strip(0,8,'#a3996c');strip(21,28,'#71734e');
 const inner=top.slice(1,-1);
 if(inner.length>1){b.push(path('M'+inner.map(([x,y],i)=>`${n(x)} ${n(y+88+(i%2)*32)}`).join('L'),'none','#2a3e2e',18));}
 for(let i=0;i<top.length-1;i++){
  const a=top[i],z=top[i+1],dx=z[0]-a[0],dy=z[1]-a[1],len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
  if(len<210)continue;const knot=path('M-105 0C-66 -27 1 -19 96 2Q12 28-49 15Z','#34472f')+path('M-83 -4Q-4 -27 78 3Q3 16-39 9','none','#a09363',5);
  b.push(`<g transform="matrix(${n(ux)} ${n(uy)} ${n(-uy)} ${n(ux)} ${n(a[0]+dx*.56)} ${n(a[1]+dy*.56+76)})">${knot}</g>`);
 }
 if(spec.form==='fallen'){
  // A severed end exists only on the named broken side arm. Continuous
  // bough/root joints must not look like assembled timber with ring caps.
  if(terrain.id==='rv-saddle-broken-arm'){const end=top.at(-1);b.push(path(`M${n(end[0]-32)} ${n(end[1]+21)}q-22 18-6 36q25 27 34-9q7-29-28-29`,'none','#9e9364',5));}
 }else{
  // Buttress roots have larger low-chroma cambium sheets, not plank seams.
  for(const [i,p]of inner.entries()){if(i%2)continue;const next=top[Math.min(top.length-1,i+2)];b.push(path(`M${n(p[0]+15)} ${n(p[1]+51)}Q${n((p[0]+next[0])/2)} ${n((p[1]+next[1])/2+112)} ${n(next[0]-25)} ${n(next[1]+53)}`,'none','#778264',12));}
 }
 return makeAsset(key,spec.form==='fallen'?'倒木의 뒤틀린 나이테와 횡단 줄기':'아래로 길을 내어준 노송의 뿌리아치',b.join(''),[x-20,y-20,w+40,h+40],{category:'tree',role:'tree'});
}

function ritualClearing(){
 let b=path('M-230 7Q-93-17 90-6L211 23Q85 49-149 32Z','#263d31');
 for(const [x,y,w,h,col]of [[-118,-5,100,47,'#768275'],[-28,1,133,51,'#8d9683'],[85,3,85,41,'#6a7c70'],[-63,-45,109,50,'#a2ab95'],[44,-37,90,45,'#81927e'],[-13,-84,87,48,'#b1b69c'],[2,-124,48,44,'#899c86']]){
  b+=path(`M${x-w*.5} ${y}Q${x-w*.58} ${y-h*.65} ${x-w*.16} ${y-h}L${x+w*.33} ${y-h*.87}Q${x+w*.59} ${y-h*.35} ${x+w*.48} ${y}Z`,col,'#314b43',3);
  b+=path(`M${x-w*.42} ${y-h*.23}Q${x} ${y-h*.45} ${x+w*.43} ${y-h*.18}`,'none','#c2c3a080',3);
 }
 b+=path('M-189 3Q-167-99-184-171Q-202-248-163-336L-137-329Q-166-241-147-182Q-126-89-140 2Z','#534631','#252c23',7);
 b+=path('M-171-13Q-150-118-167-180Q-185-249-150-319','none','#a18a59',9);
 b+=path('M-178-285Q-149-297-136-278M-179-266Q-153-279-141-257M-170-244Q-151-257-141-239','none','#c2b489',6);
 b+=path('M-175-284L-210-259-203-179-194-197-183-171-186-236-158-269Z','#b4ad88');
 b+=path('M-139-280L-107-246-115-182-106-199-95-184-91-255-125-289Z','#8b5641');
 b+=path('M-178-243L-187-208-175-145-169-164-156-145-161-215-148-250Z','#9caa8d');
 b+=path('M83 2L83-31Q107-47 132-28L130 1Z','#574b36','#2e3e2c',4)+path('M91-29Q108-34 123-25','none','#c8b77e',4);
 b+=path('M-40 19L-40 1Q-25-15-9 0L-8 17Z','#adac86','#354b39',3);
 b+=path('M-163 5Q-226 19-262-7M-146 8Q-116 25-80 12','none','#746d43',9);
 return makeAsset('ritual-clearing','서낭목과 낮은 돌무더기의 매듭 의식터',b,[-280,-370,560,430],{category:'prop',role:'prop'});
}

function refugeBundle(){
 let b=inkPoly([[-189,0],[-133,-22],[-27,-16],[25,-26],[179,-9],[196,14],[31,32],[-157,20]],'#6f7150',.1);
 b+=path('M-126 -4Q-158 -65-127 -113Q-93 -132-65 -101Q-43 -57-59 -3Z','#5b5b3d','#263d30',6);
 b+=path('M-121 -102Q-93 -68-59 -74M-135 -72Q-102 -30-57 -42M-124 -3Q-87 -20-77 -100','none','#aaa072',6);
 b+=path('M-23 7Q-37 -51-5 -82Q24 -99 58 -66L85 -10 70 17Z','#4f645a','#2b4338',7);
 b+=path('M-1 -76Q17 -27 75 -10M-24 -21Q15 -9 59 -14','none','#89937a',6);
 b+=path('M75 15L85 -59Q112 -75 143 -50L163 12Z','#9b8d67','#3e513c',6);
 b+=path('M87 -42L145 -35M83 -19L151 -11M111 -64L117 13','none','#5d6146',6);
 return makeAsset('refuge-bundle','주민이 내려둔 광주리와 접은 짐',b,[-210,-143,430,190],{category:'prop',role:'prop'});
}

function ravineRearWall(){
 // The ledges are actual foreground collision. This finite, low-contrast
 // opposite cliff only explains their rear contacts. Its base is on the
 // canonical lower ground; it has neither bright walkable rims nor solids.
 let b=path('M3650 10750L3830 9340 4090 8020 4280 7040 4580 6500 4730 5700 4930 5050 5230 4670 5640 4610 5920 4860 6280 5340 6740 5550 7070 5960 7630 6250 8110 6980 8570 7080 9080 6560 9410 5840 9700 5280 10040 4720 10670 4760 11380 5200 11760 6200 12030 7190 12340 8380 12540 10750Z','#233940');
 b+=path('M4730 5700L4930 5050 5230 4670 5480 4790 5350 5530 5500 6110 5200 6760 4890 7560 4510 7880 4710 7020 4580 6500Z M9700 5280L10040 4720 10340 4910 10120 5430 10210 6080 9990 6720 10260 7450 9790 8220 9200 8540 9440 7790 9270 7120 9520 6280Z','#30474b');
 b+=path('M5480 4790L5640 4610 5920 4860 6280 5340 6180 6210 5890 6850 5710 8110 5280 9080 5120 8380 5420 7650 5270 6700 5500 6110 5350 5530Z M10670 4760L11380 5200 11760 6200 11340 6740 11510 7230 11180 7880 11380 8620 10880 9620 10450 9260 10620 8260 10170 7590 10480 6860 10400 6050 10730 5530Z','#1e353b');
 b+=path('M4000 9140L4510 8560 4990 8660 5610 8210 6120 8410 6670 7800 7110 7950 7580 7600 8240 8340 8870 8150 9310 8720 9970 8420 10510 8930 11040 8690 11760 9340 12200 9170 12540 10750H3650Z','#213c3f');
 b+=path('M4970 5820L5330 5710 5500 5770 5720 5680 5800 5770 5520 5880 5280 5840 4960 5940Z M9270 7120L9560 6940 9810 7060 10010 6960 10130 7030 9850 7190 9590 7110 9350 7250Z M10480 6860L10830 6580 11020 6680 11290 6590 11340 6740 11030 6830 10820 6740 10560 6960Z','#415149');
 b+=path('M5240 6450Q5510 6110 5740 6500L5950 6400 6150 6560 6290 6770 6120 6950 5630 6860 5450 7160 5040 7250Z M10030 8130Q10240 7690 10560 7900L10800 7790 11180 8020 11260 8280 10960 8490 10650 8430 10360 8600 10010 8520Z','#2f413c');
 return makeAsset('rear-cliff-contact','세 층 선반 뒤로 이어진 맞은편 절벽',b,[3500,4500,9300,6450],{category:'terrain',role:'mountain'});
}
function ledgePine(key,variant=0){
 const mirror=variant===1?-1:1;
 let b=path('M-36 13Q-5 -59-43 -125Q-91 -220-159 -250L-251 -308-240 -326-118 -271Q-27 -217 1 -140L24 -203Q55 -233 123 -247L194 -246 186 -226 125 -225Q47 -209 32 -156L17 -98 48 13 12 -3-10 15Z','#44513b','#223e30',7);
 b+=path('M-24 0Q2 -49-25 -116Q-63 -218-134 -256M-22 -99Q17 -214 126 -236','none','#928760',7);
 b+=path('M-37 6L-136 14-181 2-192 14-123 23-14 12M20 4Q88 19 151 -7L187 -1 143 15 76 24 29 16','none','#687653',9);
 b+=crown(-235,-322,515,89,variant);b+=crown(173,-253,440,80,variant+1);b+=crown(-17,-162,339,62,variant+2);
 return makeAsset(key,variant?'암벽 옆으로 처진 짧은 소나무':'바위턱에 뿌리내린 비틀린 소나무',group(0,0,mirror,1,b),[-560,-440,1110,510]);
}
function supportAt(st,id,x){const t=st.terrains.find(t=>t.id===id);for(const i of t?.properties?.honroWalkEdges||[]){const a=t.points[i],z=t.points[i+1];if(x>=Math.min(a.x,z.x)&&x<=Math.max(a.x,z.x))return a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);}return null;}
function pocketStoneShoulder(st,id){
 const t=st.terrains.find(t=>t.id===id);if(!t)return null;
 const top=t.points.slice(0,t.properties.honroWalkEdges.length+1).map(p=>[p.x,p.y]),left=top[0][0],right=top.at(-1)[0],w=right-left,y=Math.min(...top.map(p=>p[1]));
 const oldBottom=x=>Math.max(...t.points.filter(p=>Math.abs(p.x-x)<.01).map(p=>p.y),supportAt(st,id,x)+35);
 const lower=(x,i)=>{const yy=supportAt(st,id,x),below=st.terrains.filter(q=>q.id!==id).map(q=>supportAt(st,q.id,x)).filter(z=>z!==null&&z>yy+45),floor=below.length?Math.min(...below):Infinity;
  // Never consume existing actor headroom. Additional thickness is limited
  // by the real lower surface minus 130; a legacy 35-unit end is retained.
  const desired=yy+[35,102,91,35][i%4],limit=Math.max(oldBottom(x),floor-130);return[x,Math.min(desired,limit)];};
 const xs=[left,left+w*.23,left+w*.57,right],bottom=xs.map(lower),shape=[...top,...bottom.slice().reverse()],b=[];
 b.push(`<defs><linearGradient id="ledge-stone" x1="${left}" y1="${y}" x2="${right}" y2="${y+140}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#7f9285"/><stop offset="1" stop-color="#34535b"/></linearGradient></defs>`);
 b.push(poly(shape,'url(#ledge-stone)'));
 b.push(poly([top[0],top[1],bottom[1],bottom[0]],'#728b7d'));
 b.push(poly([top[Math.min(2,top.length-1)],top.at(-1),bottom.at(-1),bottom[2],bottom[1]],'#3a5a60'));
 b.push(line(top,'#afbaa0',5));
 b.push(line([[left+w*.46,supportAt(st,id,left+w*.46)+8],[left+w*.49,supportAt(st,id,left+w*.49)+32],[bottom[2][0]-17,bottom[2][1]-3]],'#243f48',8));
 b.push(path(`M${n(left+w*.09)} ${n(supportAt(st,id,left+w*.09)+19)}Q${n(left+w*.20)} ${n(supportAt(st,id,left+w*.2)+31)} ${n(left+w*.32)} ${n(supportAt(st,id,left+w*.32)+18)}`,'none','#a0aa8d',6));
 return makeAsset('shoulder-'+id,'실제 사격턱에 붙은 짧은 암석 어깨',b.join(''),[left-5,y-5,w+10,Math.max(...bottom.map(p=>p[1]))-y+10],{category:'terrain',role:'rock'});
}

function ritualRockPlanes(at,add){
 const q=(p,c)=>add(p.map(x=>at(...x)),c);
 // The ritual vault has three weathered shoulders. Their joints, hanging
 // vegetation and recessed beds are authored for this one place only.
 q([[0,0],[.3,0],[.33,.14],[.27,.25],[.29,.39],[.22,.48],[.2,.75],[.12,.84],[.02,.66]],'#889a89');
 q([[.26,0],[.60,0],[.63,.14],[.55,.23],[.57,.39],[.48,.50],[.49,.76],[.39,.86],[.27,.63],[.28,.43],[.23,.33],[.29,.18]],'#6f887e');
 q([[.6,0],[1,0],[1,.78],[.88,.82],[.82,.66],[.79,.5],[.7,.44],[.66,.23]],'#405c61');
 q([[.02,.18],[.09,.12],[.16,.14],[.2,.1],[.26,.16],[.23,.24],[.15,.22],[.1,.29],[.045,.28]],'#a3ac95');
 q([[.31,.10],[.38,.08],[.41,.14],[.49,.13],[.54,.18],[.49,.22],[.43,.20],[.39,.25],[.32,.22]],'#93a58e');
 q([[.66,.1],[.76,.14],[.8,.2],[.81,.29],[.74,.28],[.68,.22]],'#6e8980');
 q([[.085,.37],[.14,.32],[.23,.33],[.27,.3],[.3,.35],[.26,.40],[.19,.39],[.13,.44],[.078,.43]],'#4c6965');
 q([[.085,.37],[.14,.32],[.23,.33],[.27,.3],[.295,.317],[.263,.349],[.19,.359],[.131,.398],[.08,.397]],'#adb097');
 q([[.325,.365],[.4,.29],[.465,.3],[.51,.277],[.545,.308],[.516,.359],[.454,.365],[.409,.394],[.353,.443],[.328,.429]],'#3d5e5c');
 q([[.33,.355],[.4,.282],[.466,.291],[.51,.27],[.544,.297],[.513,.319],[.46,.318],[.402,.347],[.345,.40]],'#9fac92');
 q([[.66,.34],[.713,.32],[.77,.345],[.82,.4],[.884,.393],[.92,.42],[.89,.465],[.828,.449],[.77,.409],[.709,.387],[.672,.406]],'#29474e');
 q([[.665,.335],[.713,.316],[.77,.335],[.827,.385],[.883,.38],[.913,.403],[.888,.421],[.824,.416],[.767,.372],[.711,.352],[.671,.375]],'#788b7b');
 q([[.06,.57],[.14,.49],[.2,.52],[.205,.65],[.16,.75],[.13,.8],[.055,.739]],'#667f74');
 q([[.12,.76],[.17,.685],[.2,.692],[.22,.77],[.188,.858],[.13,.91],[.10,.84]],'#3f5d59');
 q([[.34,.54],[.399,.49],[.475,.52],[.478,.64],[.428,.73],[.385,.715],[.33,.64]],'#879a85');
 q([[.39,.56],[.409,.535],[.432,.574],[.439,.619],[.412,.663],[.405,.641]],'#b2b49a');
 q([[.545,.5],[.61,.448],[.657,.475],[.686,.572],[.67,.72],[.612,.814],[.548,.731],[.567,.628]],'#526f69');
 q([[.712,.538],[.771,.5],[.816,.558],[.84,.67],[.807,.753],[.755,.802],[.709,.759]],'#56706b');
 q([[.26,0],[.273,.024],[.298,.174],[.249,.324],[.29,.407],[.262,.519],[.249,.751],[.22,.834],[.205,.822],[.232,.743],[.244,.511],[.27,.41],[.229,.329],[.278,.17]],'#203e44');
 q([[.57,.003],[.587,.017],[.608,.141],[.553,.224],[.581,.389],[.499,.507],[.51,.635],[.478,.788],[.459,.809],[.49,.631],[.479,.499],[.56,.383],[.533,.219],[.589,.137]],'#25454b');
 q([[.72,.015],[.737,.05],[.765,.216],[.758,.338],[.80,.483],[.846,.559],[.843,.729],[.825,.779],[.824,.566],[.78,.49],[.738,.339],[.746,.222]],'#2a474e');
 // Ground cover gathers in protected fractures and on the top shelf.
 q([[.1,.04],[.16,.032],[.185,.055],[.222,.045],[.249,.077],[.232,.118],[.188,.11],[.163,.14],[.134,.111],[.103,.116],[.088,.078]],'#526b49');
 q([[.44,.057],[.47,.04],[.51,.076],[.55,.052],[.574,.085],[.567,.126],[.534,.15],[.512,.14],[.484,.169],[.46,.123],[.437,.128]],'#536c4d');
 q([[.539,.386],[.57,.36],[.604,.385],[.62,.436],[.592,.468],[.579,.442],[.553,.457],[.542,.427]],'#607653');
 q([[.145,.35],[.177,.334],[.203,.358],[.198,.405],[.176,.423],[.161,.40],[.145,.414],[.131,.389]],'#6e8057');
 q([[.732,.594],[.754,.57],[.782,.59],[.793,.635],[.777,.671],[.756,.655],[.747,.68],[.73,.65]],'#4d6b4c');
 q([[.555,.13],[.569,.118],[.573,.21],[.557,.28],[.562,.32],[.548,.349],[.544,.313],[.543,.278],[.559,.205]],'#394f35');
 q([[.17,.111],[.18,.12],[.177,.183],[.191,.24],[.19,.289],[.18,.318],[.175,.285],[.178,.243],[.165,.184]],'#445b3a');
 // Exposed, unequal blocks immediately under the living walking shelf give
 // a human-scale stone vocabulary before the broad arch faces fall away.
 q([[.07,.09],[.108,.062],[.171,.071],[.202,.112],[.19,.164],[.146,.189],[.092,.166],[.061,.139]],'#a2ac95');
 q([[.07,.14],[.114,.132],[.162,.155],[.19,.146],[.176,.195],[.12,.207],[.087,.182]],'#5f7b70');
 q([[.239,.087],[.278,.058],[.325,.065],[.342,.099],[.33,.155],[.299,.167],[.256,.142],[.229,.125]],'#9aaa92');
 q([[.243,.126],[.279,.133],[.319,.119],[.329,.157],[.299,.18],[.268,.163]],'#56726c');
 q([[.367,.026],[.4,.011],[.442,.038],[.457,.087],[.44,.128],[.408,.142],[.378,.113],[.356,.064]],'#a8b09a');
 q([[.376,.1],[.407,.116],[.44,.096],[.437,.128],[.409,.154],[.383,.139]],'#688074');
 q([[.484,.048],[.532,.027],[.562,.058],[.579,.101],[.56,.137],[.523,.13],[.498,.152],[.48,.105]],'#8f9e87');
 q([[.493,.106],[.528,.101],[.565,.105],[.573,.139],[.537,.161],[.51,.146],[.492,.154]],'#526d62');
 q([[.64,.033],[.668,.029],[.715,.056],[.738,.11],[.72,.163],[.687,.175],[.65,.151],[.625,.093]],'#849a88');
 q([[.651,.13],[.687,.135],[.729,.129],[.719,.17],[.689,.193],[.665,.179],[.649,.187]],'#48675e');
 q([[.78,.141],[.819,.153],[.84,.181],[.837,.219],[.812,.249],[.78,.238],[.758,.209],[.764,.17]],'#6f8879');
 q([[.782,.226],[.813,.217],[.836,.225],[.829,.254],[.798,.271],[.777,.248]],'#355751');
 // Two old pine roots enter from the grounded sapling at x6190. Their broad
 // forks follow recessed seams, thinning before the open underside.
 q([[.187,.085],[.197,.095],[.2,.157],[.185,.216],[.196,.266],[.189,.335],[.197,.398],[.183,.459],[.178,.455],[.186,.395],[.179,.335],[.185,.27],[.174,.216],[.188,.157]],'#655f42');
 q([[.194,.112],[.199,.119],[.196,.172],[.182,.218],[.19,.269],[.184,.336],[.187,.375],[.183,.384],[.178,.337],[.184,.27],[.176,.219],[.19,.17]],'#a18f61');
 q([[.186,.27],[.212,.3],[.244,.311],[.252,.352],[.273,.373],[.269,.384],[.243,.357],[.238,.323],[.207,.314],[.181,.284]],'#706848');
 q([[.175,.221],[.151,.245],[.115,.251],[.098,.291],[.074,.314],[.072,.302],[.091,.28],[.11,.24],[.147,.233],[.179,.204]],'#5a5c3f');
 q([[.12,.035],[.136,.04],[.14,.059],[.154,.053],[.168,.066],[.168,.08],[.147,.087],[.138,.078],[.117,.088],[.107,.07]],'#57714c');
 q([[.305,.03],[.321,.036],[.33,.05],[.337,.046],[.35,.068],[.337,.08],[.324,.07],[.309,.083],[.3,.061]],'#63794e');
 q([[.542,.046],[.557,.057],[.57,.045],[.58,.067],[.575,.083],[.56,.088],[.555,.077],[.54,.081],[.53,.064]],'#677a51');
}

function terrainFaces(st){
 const planes=st.design.space.terrainPlanes||(st.design.space.terrainPlanes=[]);
 for(const t of st.terrains){
  if(!t.properties?.honroRavine)continue;
  const p=t.points.map(q=>[q.x,q.y]),xs=p.map(q=>q[0]),ys=p.map(q=>q[1]),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
  if(w<70||h<16)continue;
  const wood=t.baseMaterial==='wood'||/branch|root/.test(t.id),at=(u,v)=>[n(x+w*u),n(y+h*v)],add=(points,fill)=>planes.push({terrainId:t.id,stage11Art:true,fill,points});
  add(p,wood?'#4f543b':'#566d6d');
  if(t.id==='rv-ritual-buttress'){ritualRockPlanes(at,add);continue;}
  if(t.id==='act2-floor'){
   const top=t.points.slice(0,t.properties.honroWalkEdges.length+1).map(p=>[p.x,p.y]),last=top.length-1,cuts=last<12?top.map((_,i)=>i):[0,2,4,6,8,10,12,14,16,19].filter(i=>i<last).concat(last);
   for(let j=0;j<cuts.length-1;j++){
    const rim=top.slice(cuts[j],cuts[j+1]+1),a=rim[0],z=rim.at(-1),span=z[0]-a[0],depth=[1450,1880,1190,2070,1710,2290,1570,2180,1900][j],mid=a[0]+span*[.37,.65,.46,.57,.34,.69,.41,.62,.47][j];
    const yy=(a[1]+z[1])*.5,foot=[mid+span*.07,yy+depth],left=[a[0]+span*.08,a[1]+depth*.73],right=[z[0]-span*.12,z[1]+depth*.60];
    add([...rim,right,foot,left],j%3===0?'#76877b':j%3===1?'#607772':'#6c8077');
    add([[mid,a[1]],[...z],right,foot,[mid-span*.06,yy+depth*.40]],j%2?'#344f54':'#405c5d');
    add([[mid-16,a[1]+36],[mid+15,a[1]+43],[mid-span*.04,yy+depth*.39],[foot[0]+19,foot[1]],[foot[0]-21,foot[1]],[mid-span*.085,yy+depth*.38]],'#223e44');
    add([[a[0]+span*.1,a[1]+depth*.44],[a[0]+span*.29,a[1]+depth*.36],[a[0]+span*.47,yy+depth*.29],[a[0]+span*.42,yy+depth*.36],[a[0]+span*.23,a[1]+depth*.47]],'#9ca38d');
    add([[a[0]+span*.17,a[1]+depth*.65],[a[0]+span*.32,a[1]+depth*.59],[a[0]+span*.36,a[1]+depth*.66],[a[0]+span*.29,a[1]+depth*.82],[a[0]+span*.19,a[1]+depth*.85]],'#526b59');
    add([...rim,...rim.slice().reverse().map(([x,y],i)=>[x+(i?16:-12),y+22+(i%2)*35])],j%2?'#505f43':'#697153');
   }
   continue;
  }
  if(wood){add([at(0,0),at(1,0),at(.95,.29),at(.64,.4),at(.42,.24),at(.12,.38)],'#8e8862');add([at(0,.74),at(.43,.54),at(.65,.69),at(1,.4),at(1,1),at(0,1)],'#273f32');continue;}
  // Unequal interlocked joint faces remain inside the live collider clip.
  add([at(0,0),at(.32,0),at(.38,.26),at(.27,.47),at(.12,.68),at(-.02,.4)],'#879387');
  add([at(.32,0),at(.6,0),at(.73,.3),at(.56,.55),at(.4,.95),at(.27,.47),at(.38,.26)],'#647d75');
  add([at(.64,0),at(1,0),at(1,.54),at(.77,.95),at(.62,.59),at(.74,.29)],'#3d575b');
  add([at(.18,.57),at(.4,.44),at(.51,.77),at(.76,.56),at(.97,.77),at(.88,1),at(.29,1),at(.08,.86)],'#344c4f');
  add([at(.34,.02),at(.365,.04),at(.40,.25),at(.31,.49),at(.29,.77),at(.27,.81),at(.278,.47),at(.372,.24)],'#203c43');
  add([at(.72,.07),at(.746,.12),at(.714,.32),at(.653,.47),at(.69,.71),at(.67,.75),at(.625,.48),at(.68,.31)],'#263f45');
  add([at(.08,.43),at(.2,.38),at(.31,.41),at(.24,.445),at(.15,.448),at(.067,.48)],'#a0a38a');
  add([at(.43,.58),at(.54,.51),at(.6,.52),at(.57,.56),at(.48,.63),at(.42,.625)],'#8e9b89');
  add([at(.76,.2),at(.86,.14),at(.96,.15),at(.92,.22),at(.8,.255)],'#667e65');
  add([at(.03,.05),at(.24,.025),at(.27,.07),at(.18,.11),at(.07,.095)],'#526448');
  if(w>1100&&h>480){
   const hand=t.id.length%2?-1:1,ax=t.id.length%3===0?.22:.52,du=.065*hand;
   // Wide mineral washes follow rain and joint shelves. These are a handful
   // of large material marks; no noise or uniformly tiled crack texture.
   add([[ax,.07],[ax+.044,.09],[ax+.031,.21],[ax+du,.34],[ax+.038,.46],[ax+du*.6,.65],[ax+.009,.78],[ax-.024,.76],[ax+.013,.63],[ax-.005,.45],[ax+du-.018,.34],[ax+.005,.2]].map(q=>at(...q)),'#b1b39927');
   add([[.11,.27],[.19,.23],[.30,.26],[.35,.24],[.39,.28],[.33,.32],[.24,.305],[.18,.34],[.09,.35]].map(q=>at(...q)),'#adb39724');
   add([[.42,.72],[.46,.66],[.50,.66],[.54,.60],[.60,.62],[.58,.67],[.52,.70],[.48,.77],[.44,.79]].map(q=>at(...q)),'#71856b');
   add([[.83,.38],[.9,.32],[.96,.33],[.94,.39],[.91,.40],[.87,.46],[.81,.47],[.79,.44]].map(q=>at(...q)),'#2b4a4866');
  }
 }
}

export function applyStage11RavineArt(project){
 const st=project.stages.find(s=>s.metadata?.stageId===11);if(!st)throw Error('Stage 11 missing');
 const spec=st.design?.ravine;if(!Array.isArray(spec?.trees))throw Error('Stage 11 art needs authored tree supports');
 st.initialState={...st.initialState,honroStage11LandscapeRevision:1};
 st.elements=st.elements.filter(e=>!e.id.startsWith('s11-art-')&&!['rv-goal-knot-east','rv-goal-hold-knots'].includes(e.id));
 if(st.design.space)st.design.space.terrainPlanes=(st.design.space.terrainPlanes||[]).filter(p=>!p.stage11Art);
 const backdrop=stage11BackdropAsset();
 if(spec.version>=2)add(project,st,ravineRearWall(),'rear-cliff-contact',0,0);
 for(const [i,authored]of spec.trees.entries()){
  const t={...authored,form:authored.form||authored.shape};
  const branches=(t.branchTerrainIds||t.branches?.map(v=>typeof v==='string'?v:v.terrainId)||[]).map(id=>st.terrains.find(v=>v.id===id)).filter(Boolean);
  const profiles=branches.map(v=>({id:v.id,points:v.points.slice(0,v.properties.honroWalkEdges.length+1).map(p=>[p.x-t.x,p.y-t.y])}));
  if(!['fallen','root-arch'].includes(t.form))add(project,st,stage11PineAsset(t.id||'pine-'+i,{height:t.height||2400,variant:t.variant??i,branchProfiles:profiles}),t.id||'pine-'+i,t.x,t.y);
 }
 // All physical terrain is now shaded inside the exact live collision clip.


 if(spec.version>=2)for(const [key,id,x,v]of [['ritual-ledge-pine','rv-ritual-buttress',6190,0],['cliff-ledge-pine','rv-east-tower',11520,1],['refuge-ledge-pine','rv-lower-refuge-rock',7170,1]]){const y=supportAt(st,id,x);if(y!==null)add(project,st,ledgePine(key,v),key,x,y,{scale:key.startsWith('refuge')?.72:1});}
 const ritual=spec.objectiveSites?.hold||st.anchors.ritual;if(ritual){const x=6850,y=supportAt(st,'rv-ritual-buttress',x);add(project,st,ritualClearing(),'ritual-clearing',x,y??ritual.y);}
 const refuge=spec.objectiveSites?.resident||st.anchors.resident;if(refuge){let y=refuge.y;const x=refuge.x+210,surface=st.terrains.find(t=>t.id===refuge.surfaceId);for(const k of surface?.properties?.honroWalkEdges||[]){const a=surface.points[k],z=surface.points[k+1];if(x>=a.x&&x<=z.x){y=a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);break;}}add(project,st,refugeBundle(),'refuge-bundle',x,y,{scale:.58});}
 st.design.ravineArt={...spec,revision:2,landscapeRevision:1,backdropVariant:'stage11-ravine-readable',backdropAssetId:backdrop.id,artAssetIds:st.elements.filter(e=>e.id.startsWith('s11-art-')).map(e=>e.assetId),nativeVectorOnly:true};
 return project;
}
