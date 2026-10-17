/** Stage 26 only: grounded ruined artisans' yard and smoke-dark settlement. */
import {P,R,asset} from '../map-forge/act3-map-kit.mjs';
const PREFIX='stage26-witness:';
const beam=(points,c,w)=>points.slice(1).map((b,i)=>{const a=points[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=-(b[1]-a[1])*w/(2*d),ny=(b[0]-a[0])*w/(2*d);return P([[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]],c);}).join('');
export function witnessYardRear(){
 let v=P([[2080,2525],[2130,2370],[2190,2350],[2190,2210],[2250,2230],[2320,2180],[2390,2270],[2470,2260],[2470,2700],[2310,2700]],'#655f4c')+P([[2130,2370],[2190,2350],[2190,2240],[2250,2260],[2320,2220],[2370,2310],[2370,2630],[2310,2600],[2270,2520]],'#83785e')+P([[2390,2270],[2470,2260],[2470,2700],[2400,2694]],'#41473b');
 v+=P([[3120,2700],[3120,2280],[3190,2270],[3230,2185],[3270,2210],[3320,2160],[3370,2190],[3370,2290],[3470,2280],[3560,2380],[3630,2375],[3630,2632]],'#686651')+P([[3140,2690],[3140,2320],[3220,2310],[3250,2240],[3320,2210],[3320,2540],[3260,2600]],'#82785e')+P([[3380,2320],[3470,2310],[3540,2400],[3600,2400],[3600,2635],[3430,2690]],'#4a5142');
 // Charred roof truss: four grounded posts and broken rafter ends.
 for(const [x,top,bottom]of [[2350,2170,2700],[2670,2115,2700],[3040,2140,2700],[3370,2180,2700]])v+=P([[x-17,top],[x+12,top-13],[x+20,bottom-12],[x-22,bottom-12]],'#343c33')+R(x-10,top+20,6,bottom-top-50,'#716449')+P([[x-36,bottom],[x-31,bottom-20],[x+27,bottom-25],[x+38,bottom]],'#8b846a');
 v+=beam([[2324,2190],[2620,2110],[2875,2070],[3140,2120],[3400,2190]],'#454534',27)+beam([[2340,2183],[2610,2102],[2875,2062],[3125,2110]],'#887556',7);
 for(const [a,b]of [[[2420,2158],[2520,2270]],[[2610,2110],[2770,2270]],[[2860,2070],[3010,2255]],[[3120,2120],[3260,2265]],[[3280,2160],[3450,2260]]])v+=beam([a,b],'#4a4634',18)+beam([[a[0]+4,a[1]],[b[0]+4,b[1]-7]],'#897154',4);
 // Generic kiln and cooling trough, never bell-shaped molds.
 v+=P([[2170,2610],[2190,2480],[2245,2440],[2310,2460],[2350,2605],[2335,2640]],'#8b7959')+P([[2190,2615],[2205,2530],[2240,2500],[2270,2510],[2290,2615]],'#343e34')+P([[2210,2480],[2245,2455],[2300,2475],[2308,2500],[2240,2490]],'#b29a6c');
 return v+R(3450,2594,120,45,'#556358')+P([[3445,2594],[3480,2580],[3575,2580],[3570,2595]],'#8c9581');
}
export function witnessLoftSupports(){
 let v='';for(const [x,y]of [[2460,2700],[2935,2700],[3380,2696]])v+=P([[x-19,2320],[x+17,2320],[x+21,y-17],[x-23,y-17]],'#4b4935')+R(x-11,2330,7,y-2355,'#93815a')+P([[x-39,y],[x-33,y-20],[x+30,y-22],[x+41,y]],'#8b8d73');
 for(const [x,dir]of [[2460,1],[2935,-1],[3380,-1]])v+=P([[x,2445],[x+dir*130,2320],[x+dir*155,2320],[x+12,2470]],'#77664a');
 return v+R(2405,2320,1040,28,'#463f30')+R(2410,2320,1030,8,'#a38b5b')+beam([[1945,2475],[2010,2524],[2090,2475]],'#60543d',13)+R(2070,2480,19,46,'#65553d');
}
export function witnessRefugeYard(){
 let v=P([[4400,2211],[4435,2080],[4490,2065],[4550,2085],[4560,2150]],'#7b7c60')+P([[4400,2211],[4435,2080],[4485,2080],[4470,2180]],'#a29a76')+P([[5210,2150],[5220,2020],[5270,1995],[5305,2030],[5380,2040],[5420,2147]],'#74785e')+P([[5220,2020],[5270,1995],[5310,2045],[5280,2125],[5220,2130]],'#a59a73');
 v+=P([[4490,2150],[4475,2095],[4495,2072],[4530,2070],[4550,2095],[4536,2150]],'#4d503b')+R(4490,2063,43,11,'#a99569')+P([[5390,2150],[5380,2115],[5395,2090],[5425,2090],[5440,2118],[5430,2150]],'#66503a')+R(5393,2081,34,9,'#a28b60');
 v+=R(5310,2110,68,40,'#5e513b')+beam([[5315,2118],[5368,2118]],'#a68a5c',8)+beam([[5322,2134],[5372,2134]],'#967d53',8)+R(4530,2150,820,12,'#b0a17b')+R(4530,2162,820,18,'#454e3c');
 return v+P([[4540,2180],[4780,2179],[4760,2240],[4570,2234]],'#7a8267')+P([[4790,2180],[5060,2180],[5050,2232],[4810,2240]],'#6c795f')+P([[5075,2180],[5350,2180],[5320,2240],[5090,2230]],'#7d8064');
}
export function witnessLandscape(project,stage){
 const env={version:4,preset:'forest',skyVisible:false,atmosphere:{preset:'burned',overrides:{skyTop:'#202c31',skyBottom:'#636c62',ambientTint:'#586153',hazeColor:'#697365',hazeStrength:.58,nearFogColor:'#6d7866',farFogColor:'#748071',shadowTint:'#263b37',mistStrength:.13,lightStrength:.08}},zones:[{id:'witness-world',from:0,to:stage.height,blend:220}],groups:[],surfaces:[],placements:[]};
 const support=(id,depth,y,points,kind)=>{env.groups.push({id,depthLayer:depth,verticalMode:'WORLD',zoneId:'witness-world',x:0,y});const sf={id:id+'-earth',groupId:id,kind,points:points.map(([x,y])=>({x,y})),bottom:18000};env.surfaces.push(sf);return sf;};
 const hill=support('witness-distant-hill','L4',2250,[[-30000,0],[32000,0]],'rear-ground');
 // A single ink-painted landform, with irregular rounded shoulders and recessed washes.
 const hillSvg='<defs><linearGradient id="witness-hill-wash" x1="0" y1="-1700" x2="0" y2="1200" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4d5950"/><stop offset=".5" stop-color="#404f48"/><stop offset="1" stop-color="#58665c" stop-opacity="0"/></linearGradient></defs>'+
 '<path fill="url(#witness-hill-wash)" d="M-16000 -550 C-12900 -500 -10600 -1000 -8900 -1030 C-7700 -1070 -7180 -1490 -6380 -1500 C-5840 -1510 -5340 -1890 -4850 -1840 C-4450 -1800 -4330 -1690 -3880 -1710 C-2990 -1760 -2770 -1390 -2050 -1320 C-1440 -1250 -810 -690 -120 -850 C730 -1010 1280 -1050 1930 -1210 C2600 -1380 3090 -1360 3580 -1190 C3950 -1060 4200 -1090 4640 -1010 C5620 -820 5910 -900 6740 -710 C8500 -300 11500 -850 16000 -520 L16000 2200 L-16000 2200 Z"/>'+
 '<path fill="#657064" opacity=".13" d="M-10600 -1000 C-7700 -1070 -7180 -1490 -6380 -1500 C-5840 -1510 -5340 -1890 -4850 -1840 C-4330 -1690 -3880 -1710 -2770 -1390 C-4780 -1480 -5020 -1110 -6600 -1000 C-7700 -920 -9100 -750 -10600 -730 Z"/>'+
 '<path fill="#263d38" opacity=".16" d="M-4850 -1840 C-3880 -1710 -2990 -1760 -2050 -1320 C-1440 -1250 -810 -690 -120 -850 C-1360 -400 -2200 -760 -2880 -1030 C-3610 -1330 -4100 -1190 -4850 -1840 Z"/>';
 const mountain=asset(PREFIX+'smoke-hillside','연무에 잠긴 공방 뒤 산기슭',hillSvg,[],[-16000,-2100,32000,4300]);mountain.environmentRole='ridge';mountain.params.rearOnly=true;project.library.push(mountain);env.placements.push({id:'witness-hillside-mass',assetId:mountain.id,depthLayer:'L4',groupId:hill.groupId,supportId:hill.id,x:3500,y:0,scale:1,rotation:0});
 const sf=support('witness-smoky-settlement','L3',2110,[[-18000,130],[-4000,50],[0,5],[1900,-40],[3900,35],[5700,-15],[9000,100],[25000,140]],'rear-ground');
 // Seven distant houses in separated hamlets: shallow walls, dark swept eaves, no windows.
 const clusters=[{x:-350,w:1370,parts:[[0,340,145],[500,490,170]]},{x:2820,w:1730,parts:[[0,380,130],[510,530,175],[1200,330,110]]},{x:6600,w:1100,parts:[[0,400,155],[620,390,120]]}];
 for(const [i,c]of clusters.entries()){let svg='';for(const [x,w,h]of c.parts){svg+=P([[x+15,-h+8],[x+w-12,-h+8],[x+w-22,0],[x+21,0]],'#46564b');svg+=`<path fill="#34483f" d="M${x-35} ${-h-1} Q${x+w*.14} ${-h+8} ${x+w*.27} ${-h-47} Q${x+w*.49} ${-h-75} ${x+w*.66} ${-h-42} Q${x+w*.86} ${-h+8} ${x+w+35} ${-h-1} L${x+w+17} ${-h+18} Q${x+w*.50} ${-h+4} ${x-18} ${-h+18} Z"/>`;svg+=P([[x+w*.66,-h+21],[x+w-20,-h+18],[x+w-22,0],[x+w*.68,0]],'#3b4d43');}
  const a=asset(PREFIX+'settlement-roofs-'+i,'연무 너머 낮은 공방마을',svg,[],[-40,-280,c.w+80,280]);a.environmentRole='building';a.params.rearOnly=true;project.library.push(a);env.placements.push({id:'witness-settlement-'+i,assetId:a.id,depthLayer:'L3',groupId:sf.groupId,supportId:sf.id,x:c.x,y:0,scale:1,rotation:0});}
 stage.environment=env;
}
