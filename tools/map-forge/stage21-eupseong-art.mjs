/** Stage21 editable vector architecture and structural joinery.
 * The retired painted trial is historical; current geometry uses these vectors. */
import {P,R,line} from './act3-map-kit.mjs';
const path=(d,fill,stroke='',w=2)=>`<path d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${w}"`:''}/>`;
export function tiledRoof(x,y,w,rise=80){const l=x-w/2,r=x+w/2,peak=y-rise;let a=path(`M${l-35} ${y-17} Q${l+30} ${y-10} ${x-w*.22} ${peak+9} Q${x} ${peak-4} ${x+w*.22} ${peak+9} Q${r-18} ${y-8} ${r+35} ${y-17} L${r+25} ${y+12} Q${x} ${y+29} ${l-25} ${y+12}Z`,'#354c4c','#233c3c',3);
 a+=path(`M${l-25} ${y-18} Q${l+50} ${y-15} ${x-w*.2} ${peak+14} L${x+w*.21} ${peak+14} Q${r-44} ${y-18} ${r+24} ${y-18} Q${x} ${y+6} ${l-25} ${y-18}Z`,'#74857e');
 a+=path(`M${x-w*.2} ${peak+14} L${x+w*.21} ${peak+14} Q${r-44} ${y-18} ${r+24} ${y-18} Q${x+w*.09} ${y-3} ${x-w*.2} ${peak+14}Z`,'#526e69');
 // Broad filled tile courses survive the common rear-art stroke suppression.
 for(let j=1;j<4;j++){const yy=y-rise+j*rise/4,half=w*.2+j*w*.085;a+=path(`M${x-half} ${yy} Q${x} ${yy+16} ${x+half} ${yy} L${x+half+4} ${yy+5} Q${x} ${yy+23} ${x-half-4} ${yy+5}Z`,'#425e5b');}
 for(let i=1;i<12;i++){const xx=l+i*w/12,top=peak+16+Math.abs(xx-x)/(w/2)*(rise-18),end=xx+(xx-x)*.10;a+=path(`M${xx} ${top} Q${xx+(xx-x)*.04} ${y-25} ${end} ${y+6} L${end+3} ${y+6} Q${xx+3+(xx-x)*.04} ${y-25} ${xx+3} ${top}Z`,i%3?'#4b6661':'#8c9987');}
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
 // Six broad tied thatch bundles, filled rather than fine line texture.
 for(let i=0;i<6;i++){const xx=l+25+i*(w-50)/5,hh=rise*(.25+.60*(1-Math.abs(xx-x)/(w/2)));a+=path(`M${xx} ${y-hh} Q${xx-3} ${y-hh*.4} ${xx-10} ${y+9} L${xx-4} ${y+10} Q${xx+5} ${y-hh*.4} ${xx+5} ${y-hh}Z`,i%2?'#a19168':'#96855d');}
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
// Low rear walls, occupation-specific awnings and broad bedding are scenery;
// their walkable tops are authored separately as thin one-way terrain.
export function supportedAwningArt(top,ground,{cloth=false,tone='#879276'}={}){
 const [[l,y],[r,z]]=top;let a='';
 // Two short masonry feet and diagonal knee braces explain every landing.
 for(const x of [l+17,r-25]){const yy=y+(z-y)*(x-l)/(r-l),g=ground(x);a+=P([[x-11,g],[x-8,g-19],[x+21,g-20],[x+26,g]],'#7a856b')+R(x,yy+13,11,g-yy-26,'#635e46')+R(x+2,yy+20,3,g-yy-43,'#958363');}
 a+=P([[l+20,y+29],[l+29,y+22],[l+68,y+66],[l+61,y+73]],'#74684c')+P([[r-22,z+29],[r-31,z+22],[r-71,z+66],[r-63,z+73]],'#74684c');
 if(cloth)a+=P([[l+9,y-27],[r-31,z-48],[r,z],[l,y]],tone)+P([[l,y],[r,z],[r-1,z+16],[l-3,y+13]],'#626e55')+P([[l+20,y-22],[l+67,y-27],[l+87,y+3],[l+41,y+3]],'#a5a180');
 else a+=P([[l+6,y-12],[r-7,z-12],[r,z],[l,y]],tone);
 a+=P([[l,y],[r,z],[r,z+17],[l,y+17]],'#70654b')+P([[l,y],[r,z],[r,z+5],[l,y+5]],'#b0a17a')+P([[l,y+17],[r,z+17],[r,z+23],[l,y+23]],'#4e5944');
 return a;
}
export function alleyArt(ground){let a='';
 // Joined back-of-lot walls follow the same lane; open gates interrupt the run.
 for(const [l,r,h]of [[3260,3460,87],[3740,4050,106],[4450,4700,74],[4960,5150,88],[5550,5890,82]]){const yl=ground(l),yr=ground(r);a+=P([[l,yl],[l,yl-h],[r,yr-h],[r,yr],[r-25,yr-13],[l+20,yl-12]],'#7e886e')+P([[l,yl-h],[r,yr-h],[r+8,yr-h+13],[l-7,yl-h+14]],'#a3a587')+P([[r-24,yr-h+13],[r,yr-h+13],[r,yr],[r-24,yr-11]],'#647960');}
 // A potter's open side bay binds the home and loading terrace together.
 a+=P([[3763,ground(3763)-185],[3910,ground(3910)-178],[3910,ground(3910)],[3763,ground(3763)]],'#8b9072')+P([[3780,ground(3780)-155],[3895,ground(3895)-145],[3895,ground(3895)-18],[3780,ground(3780)-18]],'#51604a');
 a+=R(3791,ground(3791)-65,92,13,'#9e8c62')+P([[3805,ground(3805)-67],[3814,ground(3814)-98],[3837,ground(3837)-95],[3845,ground(3845)-67]],'#ae9f79');
 // Rear foundations are broad, irregular plinths rather than tiny brick rows.
 for(const [l,r]of [[3405,3773],[4040,4495],[5175,5580]]){const yl=ground(l),yr=ground(r);a+=P([[l-11,yl],[l,yl-30],[l+(r-l)*.35,yl-24],[r-8,yr-28],[r+13,yr],[r,yr+16],[l+12,yl+13]],'#697b65')+P([[l,yl-30],[l+(r-l)*.35,yl-24],[r-8,yr-28],[r,yr-17],[l+4,yl-17]],'#a0a38a');}
 return a;
}
export function foundationArt(contour,ground){let a='<defs><linearGradient id="deep-soil" x1="0" y1="2400" x2="0" y2="3650" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4b6250"/><stop offset="1" stop-color="#29463b"/></linearGradient></defs>'+P([...contour,[6400,3650],[0,3650]],'url(#deep-soil)');
 const profile=(l,r,offset)=>[[l,ground(l)+offset],...contour.filter(([x])=>x>l&&x<r).map(([x,y])=>[x,y+offset]),[r,ground(r)+offset]];
 // Large geological lenses attach to the real contour, with unequal depth.
 const beds=[{l:0,r:1170,d:240,c:'#4f6350',b:[[1140,3020],[850,3080],[470,3025],[80,3115]]},{l:1080,r:3020,d:370,c:'#465f4e',b:[[2960,2880],[2570,3070],[2120,2980],[1650,3110],[1145,3030]]},{l:2940,r:4680,d:410,c:'#50644e',b:[[4610,3015],[4260,3100],[3870,3025],[3540,3185],[3000,2990]]},{l:4660,r:6400,d:530,c:'#465e4d',b:[[6400,2775],[6050,2720],[5650,2830],[5240,2915],[4710,2870]]}];
 for(const [i,b]of beds.entries()){const top=profile(b.l,b.r,8);a+=P([...top,...b.b],b.c);const inner=profile(b.l+35,b.r-40,65+i*7);a+=P([...inner,...b.b.slice(1).map(([x,y])=>[x,y-44])],'#3c5647');}
 // Distinct outcrops: broad light plane, folded dark side and buried foot.
 for(const [l,r,d]of [[650,1265,180],[1820,2370,245],[3100,3540,190],[3770,4120,265],[4630,5100,230],[5520,5880,350]]){const m=l+(r-l)*.47,yl=ground(l),ym=ground(m),yr=ground(r);a+=P([[l,yl+43],[m,ym+24],[r,yr+62],[r-33,yr+d*.7],[m+37,ym+d],[l+53,yl+d*.82]],'#405c4b')+P([[l,yl+43],[m,ym+24],[m+37,ym+d],[l+53,yl+d*.82]],'#60715a')+P([[m,ym+24],[r,yr+62],[r-33,yr+d*.7],[m+37,ym+d],[m-14,ym+d*.46]],'#4c6551');}
 // Connected roadside drain, stepped stone lip and a single deeper outlet.
 const drain=profile(3265,4615,17);a+=P([...drain,...profile(3265,4615,38).reverse()],'#293f37')+P([...profile(3270,4610,13),...profile(3270,4610,20).reverse()],'#8a9478');
 a+=path('M3855 2730 L3873 2724 L3873 2855 Q3898 2884 3968 2868 L3973 2885 Q3897 2910 3855 2871Z','#2c453a')+path('M3861 2736 L3861 2862 Q3895 2894 3966 2878','none','#75866a',7);
 // Soft buried lower planes vary the relief without noise or isolated wedges.
 a+=path('M60 3060 Q700 2980 1150 3115 T2340 3110 L2590 3200 H0Z','#334e42')+path('M2840 3130 Q3330 3010 3710 3160 Q4180 3030 4600 3175 L4730 3200 H2840Z','#344f42')+path('M4760 2940 Q5220 2790 5550 2935 Q6050 2800 6400 2860 V3200 H4760Z','#314d41');
 return a;}
