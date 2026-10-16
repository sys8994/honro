/** Stage21 hand-authored architectural masses; editable SVG paths, no raster. */
import {P,R,line} from './act3-map-kit.mjs';
const path=(d,fill,stroke='',w=2)=>`<path d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${w}"`:''}/>`;
export function tiledRoof(x,y,w,rise=80){const l=x-w/2,r=x+w/2,peak=y-rise;let a=path(`M${l-35} ${y-17} Q${l+30} ${y-10} ${x-w*.22} ${peak+9} Q${x} ${peak-4} ${x+w*.22} ${peak+9} Q${r-18} ${y-8} ${r+35} ${y-17} L${r+25} ${y+12} Q${x} ${y+29} ${l-25} ${y+12}Z`,'#354c4c','#233c3c',3);
 a+=path(`M${l-25} ${y-18} Q${l+50} ${y-15} ${x-w*.2} ${peak+14} L${x+w*.21} ${peak+14} Q${r-44} ${y-18} ${r+24} ${y-18} Q${x} ${y+6} ${l-25} ${y-18}Z`,'#74857e');
 a+=path(`M${x-w*.2} ${peak+14} L${x+w*.21} ${peak+14} Q${r-44} ${y-18} ${r+24} ${y-18} Q${x+w*.09} ${y-3} ${x-w*.2} ${peak+14}Z`,'#526e69');
 for(let j=1;j<4;j++){const yy=y-rise+j*rise/4;const half=w*.2+j*w*.085;a+=path(`M${x-half} ${yy} Q${x} ${yy+16} ${x+half} ${yy}`,'none','#425e5b',3);}
 for(let i=0;i<=14;i++){const xx=l+i*w/14,top=peak+16+Math.abs(xx-x)/(w/2)*(rise-18);a+=path(`M${xx} ${top} Q${xx+(xx-x)*.04} ${y-25} ${xx+(xx-x)*.10} ${y+6}`,'none',i%3?'#4b6661':'#8c9987',3);}
 a+=path(`M${l-26} ${y+9} Q${x} ${y+30} ${r+26} ${y+9} L${r+23} ${y+20} Q${x} ${y+41} ${l-23} ${y+20}Z`,'#46574e')+path(`M${l-23} ${y+9} Q${x} ${y+28} ${r+23} ${y+9}`,'none','#adb195',5);
 a+=P([[x-w*.22-10,peak+9],[x-w*.22,peak-2],[x+w*.22,peak-2],[x+w*.22+10,peak+9]],'#8d9984')+line([[x-w*.22,peak+1],[x+w*.22,peak+1]],'#b9b99c',4);return a;}
export function timberBay(x,y,w,h,{open=false,door=false}={}){let a=R(x,y,w,h,'#374c42')+R(x+9,y+12,w-18,h-18,open?'#3e5144':'#b1ac88');if(!open){for(let xx=x+17;xx<x+w-10;xx+=18)a+=R(xx,y+18,4,h-32,'#6c7158');for(let yy=y+26;yy<y+h-15;yy+=23)a+=R(x+12,yy,w-24,3,'#73765b');if(door)a+=R(x+w/2-3,y+9,6,h-12,'#655a43')+R(x+w/2+8,y+h*.6,7,12,'#3a4c40');}return a+R(x-4,y-5,w+8,9,'#a0946c')+R(x-6,y+h-4,w+12,12,'#625c44');}
export function gateArt(){let a='';
 // Dark rear vault, reveal and folded door leaves; actor path is the cutaway plane.
 a+=path('M2100 2560 L2100 2450 Q2100 2318 2277 2315 Q2450 2320 2450 2450 L2450 2560Z','#293f3c');
 a+=path('M2146 2560 L2146 2464 Q2146 2355 2280 2350 Q2396 2356 2396 2464 L2396 2560Z','#41574c');
 a+=P([[2146,2560],[2193,2530],[2193,2436],[2162,2415]],'#6b7056')+P([[2396,2560],[2350,2530],[2350,2436],[2380,2415]],'#263e39');
 for(const [x,flip]of [[2130,1],[2410,-1]]){a+=P([[x,2558],[x+flip*33,2530],[x+flip*33,2423],[x,2420]],'#574e3d');for(let j=1;j<4;j++)a+=line([[x+flip*j*8,2548-j*4],[x+flip*j*8,2428]],'#8b7756',3);a+=line([[x,2473],[x+flip*30,2476]],'#2f4138',9);}
 // Battered masonry wall silhouette, broad cap and foot stones.
 a+=P([[2025,2560],[2040,2260],[2070,2240],[2460,2240],[2510,2260],[2535,2560],[2424,2560],[2424,2466],[2406,2410],[2365,2365],[2315,2338],[2240,2338],[2189,2365],[2148,2410],[2130,2466],[2130,2560]],'#697567','#2d4440',4);
 const shades=['#8e927c','#7c8876','#969981','#818c78'];
 function block(x,y,w,h,i){return P([[x+3,y+3],[x+w-5,y],[x+w,y+h-7],[x+w-7,y+h],[x,y+h-3]],shades[i%4])+line([[x+7,y+7],[x+w-10,y+4]],'#b0ad91',3);}
 for(let row=0;row<5;row++){const y=2270+row*57;if(row===0){let x=2044;for(const [i,w]of [85,112,72,104,81].entries()){a+=block(x,y,w,50,i);x+=w+5;}}else {a+=block(2040-row*3,y,86+row*3,51,row)+block(2435,y,68+row*4,51,row+2);}}
 // Radial arch stones carry the lintel; alternating large voussoirs and keystone.
 const cx=2277,cy=2470,rx=147,ry=132,ox=185,oy=176;
 for(let i=0;i<11;i++){const t=Math.PI+i*Math.PI/11+.012,z=Math.PI+(i+1)*Math.PI/11-.012;a+=P([[cx+rx*Math.cos(t),cy+ry*Math.sin(t)],[cx+ox*Math.cos(t),cy+oy*Math.sin(t)],[cx+ox*Math.cos(z),cy+oy*Math.sin(z)],[cx+rx*Math.cos(z),cy+ry*Math.sin(z)]],i===5?'#b0aa89':shades[(i+1)%4],'#46584c',2);}
 a+=P([[2017,2542],[2134,2542],[2134,2560],[2015,2560]],'#92947b')+P([[2420,2542],[2540,2542],[2543,2560],[2420,2560]],'#92947b');
 a+=P([[2040,2250],[2070,2240],[2460,2240],[2510,2250],[2503,2270],[2040,2270]],'#a6a98c')+line([[2070,2240],[2460,2240]],'#c1b99a',5);
 // Three structural timber bays with visible beams, joinery and bracket sets.
 a+=R(2110,2072,330,161,'#3d5549')+R(2120,2080,310,32,'#6c7859');
 for(const [i,x]of [2120,2225,2330].entries()){a+=timberBay(x+8,2125,82,69,{open:i===1});a+=R(x+7,2199,89,12,'#827a54');for(let xx=x+12;xx<x+90;xx+=22)a+=R(xx,2210,6,25,'#9c8b5d');}
 for(const x of [2115,2220,2325,2430]){a+=P([[x-7,2240],[x-5,2081],[x+10,2081],[x+13,2240]],'#695c43')+R(x-1,2088,4,145,'#a18c60')+R(x-14,2233,32,7,'#b0aa87');
 a+=R(x-25,2076,53,11,'#9e8e65')+R(x-18,2063,38,12,'#526e5c')+P([[x-29,2077],[x-38,2062],[x-17,2064],[x-7,2077]],'#846b50')+P([[x+29,2077],[x+38,2062],[x+17,2064],[x+7,2077]],'#846b50');}
 a+=R(2090,2059,374,12,'#886c50')+R(2090,2072,374,7,'#687d59');for(let x=2085;x<2470;x+=23)a+=P([[x,2050],[x+9,2050],[x+15,2064],[x+4,2064]],'#a59770');a+=tiledRoof(2277,2049,411,78);a+=R(2238,2092,80,25,'#314c43')+R(2246,2099,64,3,'#a89e73');
 // Visible access masonry, not tall floating step rectangles.
 a+=P([[1770,2640],[1900,2500],[1980,2500],[1980,2522],[1907,2522],[1790,2640]],'#71806c')+line([[1770,2640],[1900,2500],[1980,2500]],'#adb196',5)+P([[1970,2500],[1980,2370],[2040,2370],[2040,2390],[1998,2390],[1992,2500]],'#687a68');
 for(let j=0;j<6;j++){const x=1800+j*19,y=2640-(x-1770)*140/130;a+=line([[x,y+3],[x+22,y+3]],'#455e51',4);}return a;}
export function thatch(x,y,w,rise=88){const l=x-w/2,r=x+w/2;let a=path(`M${l-23} ${y} Q${l-12} ${y-rise*.75} ${x-w*.18} ${y-rise} Q${x+w*.08} ${y-rise-21} ${x+w*.27} ${y-rise*.76} Q${r+10} ${y-39} ${r+25} ${y+2} L${r+17} ${y+27} Q${x+17} ${y+47} ${l-18} ${y+24}Z`,'#817650','#384d40',3);
 a+=path(`M${l-20} ${y} Q${l+7} ${y-rise*.76} ${x-w*.18} ${y-rise+3} Q${x+w*.12} ${y-rise-7} ${x+w*.29} ${y-rise*.69} Q${r+9} ${y-27} ${r+20} ${y+2} Q${x} ${y+25} ${l-20} ${y}Z`,'#b5a57a');
 a+=path(`M${l-7} ${y-19} Q${x-w*.21} ${y-8} ${x+w*.1} ${y-13} Q${r-38} ${y-7} ${r+12} ${y-14} L${r+20} ${y+6} Q${x+w*.12} ${y+21} ${l-19} ${y+3}Z`,'#a4956c');
 a+=path(`M${l+16} ${y-42} Q${x-w*.13} ${y-38} ${x+w*.16} ${y-45} Q${r-40} ${y-30} ${r-4} ${y-22}`,'none','#97865e',5);
 for(let i=0;i<19;i++){const xx=l+9+i*(w-18)/18,hh=rise*(.16+.60*(1-Math.abs(xx-x)/(w/2))),shift=(i%3-1)*5;a+=path(`M${xx+shift} ${y-hh} Q${xx-3} ${y-hh*.4} ${xx-10} ${y+9+(i%3)*3}`,'none',i%3?'#95845c':'#c1b087',2.6);}
 a+=path(`M${l-15} ${y+21} Q${x-w*.15} ${y+34} ${x+w*.1} ${y+28} Q${r-23} ${y+34} ${r+16} ${y+21}`,'none','#645f45',9);return a;}
export function houseArt(w,h,kind='home'){const l=-w/2,r=w/2;let a=R(l,-h,w,h,'#9a9b7c')+P([[r-52,-h],[r,-h+12],[r,0],[r-52,-12]],'#6c785e')+R(l,-20,w,20,'#65786a');
 a+=P([[l+16,-h+35],[l+w*.47,-h+42],[l+w*.37,-h+90],[l+21,-h+79]],'#b8b18b')+P([[r-123,-89],[r-21,-103],[r-25,-22],[r-99,-22]],'#858b6a');
 const open=kind==='stable'||kind==='workshop';
 if(open){a+=R(l+17,-h+28,w-48,h-49,'#344d42');for(let i=0;i<3;i++){const x=l+24+i*(w-70)/2;a+=R(x,-h+17,13,h-18,'#736247')+R(x+3,-h+30,4,h-41,'#aa9366');}a+=R(l+16,-h+31,w-38,13,'#8a7a53')+line([[l+30,-h+52],[l+95,-h+6]],'#645a42',10)+line([[r-40,-h+48],[r-98,-h+8]],'#645a42',10);
 if(kind==='stable'){a+=R(l+18,-65,w-45,14,'#7b6f4e');for(let xx=l+24;xx<r-20;xx+=45)a+=R(xx,-65,7,48,'#a59161');a+=R(-59,-46,106,32,'#8b7650')+P([[-55,-47],[-35,-76],[29,-82],[49,-46]],'#ada077');}else{a+=R(l+27,-54,w-78,43,'#706344')+R(l+19,-62,w-62,12,'#a18c5f');for(let i=0;i<4;i++)a+=P([[l+38+i*45,-68],[l+47+i*45,-102],[l+72+i*45,-106],[l+80+i*45,-68]],i%2?'#8a765c':'#afa07b');}}
 else{a+=timberBay(-44,-h+33,82,h-49,{door:true});if(w>270){a+=timberBay(l+25,-h+51,82,75)+timberBay(r-117,-h+51,72,75);}for(const xx of [l+10,-55,50,r-24])a+=R(xx,-h+10,9,h-18,'#756748');a+=R(l,-h+21,w,9,'#98875e');}
 a+=thatch(0,-h,w,kind==='stable'?65:85);a+=R(l-8,-16,w+16,10,'#a2a38a');
 if(kind==='shop'){a+=P([[l-35,-h+75],[r+18,-h+88],[r+62,-h+146],[l-51,-h+131]],'#788366')+P([[l-51,-h+131],[r+62,-h+146],[r+60,-h+161],[l-52,-h+145]],'#535f48');for(const xx of [l-43,r+46])a+=R(xx,-h+134,9,h-134,'#766548');a+=R(l-25,-54,w+52,42,'#7f6d4c')+R(l-31,-61,w+65,10,'#b3a172');for(let j=0;j<3;j++)a+=P([[l+5+j*77,-62],[l+14+j*77,-85],[l+48+j*77,-81],[l+57+j*77,-62]],j%2?'#a69569':'#beb08b');}
 return a;}
export function officeArt(){let a=R(-179,-186,358,186,'#979d80')+R(-173,-177,346,35,'#435d4c');for(const [i,x]of [-164,-53,58].entries())a+=timberBay(x,-144,95,118,{door:i===1});
 for(const x of [-181,-65,51,167]){a+=R(x,-183,13,175,'#796549')+R(x+3,-172,4,158,'#b19a6d')+R(x-7,-11,28,11,'#b0ad90')+R(x-18,-183,49,12,'#9e8d65')+P([[x-20,-181],[x-32,-200],[x-12,-196],[x,-181]],'#6b8061');}
 a+=R(-199,-199,400,14,'#8a7052')+R(-194,-183,390,7,'#6d8261');for(let x=-196;x<200;x+=23)a+=P([[x,-209],[x+10,-209],[x+15,-197],[x+3,-197]],'#b3a079');a+=tiledRoof(0,-213,412,84);
 a+=R(-28,-168,56,21,'#304b42')+R(-17,-162,35,3,'#b4ac7c')+R(-188,-4,376,9,'#a8aa90');
 // Flanking courtyard screens and a deep side store form an office precinct.
 return a;}
export function foundationArt(contour,ground){let a='';
 // Connected load-bearing strata fade into the deep cutaway instead of hanging polygons.
 for(const [left,right,depth]of [[0,620,230],[1320,1780,250],[2010,2890,350],[3480,3750,260],[4060,4520,290],[5230,5500,330],[5740,6400,300]]){const y=ground((left+right)/2),id='soil-'+left;a+=`<defs><linearGradient id="${id}" x1="0" y1="${y}" x2="0" y2="${y+depth}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#536553"/><stop offset="0.45" stop-color="#354e43"/><stop offset="1" stop-color="#253e38" stop-opacity="0"/></linearGradient></defs>`;
 a+=P([[left,y+4],[right,y+4],[right+40,y+depth],[left-30,y+depth]],`url(#${id})`);
 const count=Math.max(2,Math.floor((right-left)/115));for(let row=0;row<(left===2010?3:2);row++){const yy=y+13+row*47,step=(right-left)/count;for(let j=0;j<count;j++){const x=left+j*step+(row%2?15:0),ww=Math.min(step-6,right-x-5);if(ww<10)continue;a+=P([[x+4,yy],[x+ww,yy-3],[x+ww-3,yy+32],[x+7,yy+40],[x,yy+30]],row===0?(j%2?'#69755f':'#5e705b'):'#475f4e')+line([[x+9,yy+4],[x+ww-9,yy+1]],row===0?'#849079':'#60725b',2);}}
 a+=path(`M${left+24} ${y+142} Q${left+(right-left)*.4} ${y+167} ${right-44} ${y+145}`,'none','#28473e',7);}
 // Large natural rock bedding through the connecting slopes, tied to the actual surface.
 for(const [l,r]of [[620,1320],[2890,3480],[3750,4060],[4520,5230],[5500,5740]]){const yl=ground(l),yr=ground(r);a+=P([[l,yl+10],[r,yr+10],[r-25,yr+68],[l+24,yl+80]],'#3c5547');a+=line([[l+35,yl+96],[l+(r-l)*.42,yl+(yr-yl)*.42+115],[r-30,yr+85]],'#304b40',12);}
 a+=path('M3462 2775 L3480 2775 L3480 2945 Q3508 2967 3553 2952 L3553 2967 Q3500 2985 3462 2952Z','#263f38')+line([[3470,2790],[3470,2944],[3505,2962],[3552,2959]],'#5e7158',5);
 a+=P([[3800,2835],[3895,2770],[4030,2760],[4100,2830],[4062,2916],[3958,2943],[3860,2913]],'#354f43')+P([[3800,2835],[3895,2770],[4030,2760],[3960,2830],[3860,2913]],'#465d4b')+line([[3910,2833],[4017,2805],[4060,2825]],'#5e7058',4);return a;}
