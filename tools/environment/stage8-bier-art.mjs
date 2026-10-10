/** Editable native vector art, grounded in the Stage8 collision source. */
import {readFileSync} from 'node:fs';
import {compileSVG} from './build-act2-art.mjs';
import {BIER_LAYOUT,bierY} from '../map-forge/stage8-bier-geometry.mjs';
const PREFIX='stage8:bier-',N=v=>Math.round(v*100)/100;
const path=(d,fill,stroke='',width=1,id='')=>`<path${id?` id="${id}"`:''} d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`:''}/>`;
const poly=(q,c,stroke='',w=1,id='')=>path('M'+q.map(p=>p.map(N).join(' ')).join('L')+'Z',c,stroke,w,id);
const line=(q,c,w=1)=>path('M'+q.map(p=>p.map(N).join(' ')).join('L'),'none',c,w);
const rect=(x,y,w,h,c)=>path(`M${N(x)} ${N(y)}h${N(w)}v${N(h)}h${N(-w)}Z`,c);
function asset(key,name,body,bounds,extra={}){const vector=compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.join(' ')}">${body}</svg>`),[x,y,w,h]=bounds;return{id:PREFIX+key,name,category:'architecture',environmentRole:'architecture',visual:[],vector,collision:[],anchor:{x:0,y:0},sockets:[],tags:['stage8-bier','visual-only','editable-native-vector'],params:{artRevision:1,noProjectileCover:true,...extra},bounds:{x,y,w,h},reference:{heightM:h/60,bounds:{x,y,w,h},foot:{x:0,y:0},scaleRange:[.35,4],backgroundRange:[.35,4]}};}
const register=(p,a)=>{const i=p.library.findIndex(v=>v.id===a.id);if(i<0)p.library.push(a);else p.library[i]=a;};
function add(p,s,a,id,extra={}){register(p,a);s.elements.push({id:'s8-art-'+id,assetId:a.id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',...extra});}
function roof(x,y,w,rise=120){const l=x-w/2,r=x+w/2;let b=path(`M${l-38} ${y-18}Q${l+65} ${y-11} ${l+145} ${y-rise+31}L${x-w*.20} ${y-rise}Q${x} ${y-rise+14} ${x+w*.20} ${y-rise}L${r-121} ${y-rise+31}Q${r-46} ${y-11} ${r+44} ${y-22}L${r+40} ${y+11}Q${x} ${y+34} ${l-34} ${y+9}Z`,'#253c41','#152f38',5,'bent-korean-tile-eaves');b+=path(`M${l+18} ${y-31}L${l+151} ${y-rise+45}L${x-w*.19} ${y-rise+18}L${x+w*.19} ${y-rise+18}L${r-127} ${y-rise+47}L${r-9} ${y-30}Q${x} ${y+5} ${l+18} ${y-31}Z`,'#68766c');b+=line([[x-w*.22,y-rise-2],[x,y-rise+9],[x+w*.22,y-rise-2]],'#a1a48a',8);b+=path(`M${l-35} ${y+9}Q${x} ${y+39} ${r+40} ${y+11}`,'none','#b7ad82',8);for(const f of[-.35,-.20,0,.21,.37]){const xx=x+w*f;b+=line([[xx,y-rise+29+Math.abs(f)*rise*1.4],[xx+f*18,y+13]],'#455c55',4);}return b;}
function store(){const floor=x=>bierY('s8-ground',x),left=2130,right=2800,wallTop=3470,q=[left,2400,2600,2750,right].map(x=>[x,floor(x)]);let b=poly([[left,wallTop],[right,wallTop],...q.slice().reverse()],'#777b67','#334940',5,'buried-funeral-store-body');b+=poly([[right-115,wallTop],[right,wallTop],...q.slice().reverse().filter(p=>p[0]>=right-115),[right-115,floor(right-115)]],'#44584b');b+=rect(left+10,wallTop+19,right-left-42,45,'#a7a184');
 for(const x of[2160,2340,2540,2740,2790]){const fy=floor(x);b+=poly([[x-9,wallTop],[x+12,wallTop],[x+15,fy],[x-12,fy]],'#504d38');b+=line([[x-2,wallTop+18],[x-2,fy-8]],'#a59262',5);b+=poly([[x-26,fy-20],[x+28,fy-20],[x+32,fy],[x-30,fy]],'#a0a38b');}
 for(const[x,w]of[[2240,100],[2435,136],[2640,108]]){const fy=floor(x),dh=146;b+=rect(x-w/2-7,fy-dh-8,w+14,dh+8,'#263e39');b+=rect(x-w/2,fy-dh,w,dh-8,'#75684d');b+=rect(x-3,fy-dh+4,6,dh-15,'#b29e6e');b+=rect(x-w/2+5,fy-62,w-10,7,'#ae9663');b+=rect(x+9,fy-89,4,15,'#253f35');}
 b+=roof(2470,3460,820,140);
 // Pale funeral cloth and an empty horizontal carrying frame distinguish the
 // store from a market or shrine. These are inert scenery, never extra actors.
 b+=path('M2270 3513Q2310 3524 2350 3513L2338 3650Q2311 3633 2282 3650Z','#b4b39a','#667765',3);b+=path('M2690 3510Q2722 3523 2758 3511L2746 3658Q2723 3640 2700 3658Z','#a5ad98','#667765',3);
 // One empty carrying frame, roughly two people long and knee-high. Its
 // trestles and loose binding rope meet the actual sloping stone threshold.
 const fy=floor(2390);b+=line([[2280,fy-38],[2520,fy-38]],'#b6a276',10)+line([[2300,fy-15],[2500,fy-15]],'#5c523a',8);
 b+=poly([[2328,fy-68],[2438,fy-68],[2464,fy-40],[2312,fy-40]],'#606e5b','#374f42',3);
 for(const x of[2325,2470])b+=line([[x,fy-38],[x-8,floor(x)-4]],'#89784f',7);
 b+=path(`M2360 ${fy-47}q15 16 29 0m-24 -5q10 10 20 0m-8 9q-11 27 10 32`,'none','#b1a27b',3);
 // Folded hemp shroud and a small covered basket: readable beside a person,
 // not a second building or bright prop cluster.
 const cy=floor(2755);b+=poly([[2728,cy-39],[2784,cy-39],[2779,cy-4],[2732,cy-4]],'#675e42','#354c3d',3);
 b+=poly([[2723,cy-40],[2746,cy-58],[2790,cy-52],[2785,cy-35]],'#b1ae92','#687665',2);
 return asset('funeral-store','반매몰 상여집·빈 가마채·바랜 소렴천',b,[2050,3300,1100,900],{buildingCount:1,doorHeight:146,groundedSupport:'s8-ground',feet:q});}
function upper(){let b=poly([[7600,2670],[7890,2670],[7860,2960],[7610,2920]],'#6e7964','#354f42',4,'east-low-plinth');b+=poly([[7520,2680],[7800,2680],[7800,2825],[7495,2825]],'#5e715b');b+=roof(7950,2385,650,115);
 for(const x of[7660,7830,8080,8240]){b+=poly([[x-12,2398],[x+14,2398],[x+17,2670],[x-15,2670]],'#5d543b');b+=line([[x-3,2407],[x-4,2652]],'#b1a279',6);b+=poly([[x-32,2649],[x+33,2649],[x+41,2670],[x-39,2670]],'#929c82');}
 b+=rect(7650,2440,603,16,'#627869')+rect(7665,2457,578,11,'#ad9471');b+=path('M7850 2425Q7900 2448 7950 2422L7930 2562Q7892 2550 7860 2569Z','#b7b7a0','#748274',3);
 b+=line([[7530,2657],[8150,2657]],'#a89c71',13);b+=poly([[7620,2620],[7675,2620],[7667,2650],[7616,2650]],'#69745b');
 // Human-scaled stone footing: a few irregular blocks, never enormous panels.
 for(const[x,y,w,h]of[[7560,2720,96,47],[7668,2720,121,48],[7545,2780,112,42],[7670,2780,93,42]]){b+=poly([[x,y],[x+w,y-3],[x+w-5,y+h],[x+3,y+h]],'#829078','#405b49',3);}
 return asset('east-bier-shelter','높은 동상여터의 낮은 석축과 빈 덧집','<g transform="translate(0 330)">'+b+'</g>',[7470,2570,840,750],{buildingCount:1,groundedSupport:'s8-court/s8-east-hatch',columnsFootY:2670});}
function branch(){let b=path('M4815 2680Q4910 2610 4960 2460Q5000 2340 4930 2150L4980 2070Q5110 2300 5070 2470Q5150 2460 5220 2370L5260 2400Q5190 2560 5060 2585L5000 2660Z','#5a634b','#344e3d',7,'short-rooted-pine-trunk');b+=path('M4880 2640Q5040 2480 4990 2220','none','#b1a479',19);b+=path('M5030 2430Q5170 2490 5310 2420L5450 2370 5480 2400Q5320 2530 5070 2510Z','#647253');b+=path('M4905 2460Q4770 2400 4740 2240L4780 2220Q4820 2360 4950 2400Z','#52674e');
 b+=path('M4935 2220L4820 2160 4750 2040 4775 2030 4860 2130 4970 2160Z M4990 2190L5040 2110 5110 2050 5125 2070 5070 2150 5040 2250Z M5220 2400L5320 2280 5300 2200 5320 2190 5350 2290 5260 2420Z M5400 2410L5490 2310 5540 2320 5505 2340 5440 2440Z','#6f775b');
 b+=path('M4950 2130L4980 2070 5000 2120 5006 2190Z','#b4ad87');b+=path('M5000 2350Q5030 2320 5050 2360Q5040 2400 5010 2400Z','#384d3b');
 return asset('rooted-branch','암괴에 뿌리내린 마른 소나무의 굵은 줄기와 짧은 가지',b,[4620,2050,1000,660],{groundedSupport:'s8-west-shoulder',foot:{x:4850,y:2600},secondarySilhouette:true});}
function supports(){let b='';
 // These are the cave's recessed back walls, not foreground collision or
 // fake supporting posts. Their bases meet the exact real ground profile.
 // Only the two exterior mouths retain distant sky behind the traversable air.
 const floor=BIER_LAYOUT.surfaces.find(t=>t.id==='s8-ground').top;
 function wall(top,left,right,color){const lower=[left,...floor.map(p=>p[0]).filter(x=>x>left&&x<right),right].map(x=>[x,bierY('s8-ground',x)+22]);b+=poly([...top,...lower.reverse()],color);}
 wall([[530,3970],[730,3740],[1080,3420],[1500,3280],[2150,3240],[2620,3270],[2900,3470],[3100,3630],[3500,3550],[3840,3760],[4110,3930],[4450,3860],[4910,4240]],530,4910,'#29473f');
 wall([[3950,4230],[4780,4510],[5130,4510],[5480,4230],[5590,4230],[5790,4260],[6200,4260],[6400,4200],[6660,3960],[7200,3590],[7600,3360],[7800,3160],[8330,3010]],3950,8330,'#244239');
 wall([[4880,2740],[5200,2720],[5500,2780],[5650,3740],[5790,4260]],4880,5790,'#26453b');
 b+=path('M5030 2940L5290 2860 5450 3090 5390 3410 5240 3770 5260 4370 5070 4560 5110 4050 5120 3550Z','#304c3e');
 b+=path('M770 3760Q1120 3500 1610 3450L2110 3390 2470 3450 2120 3570 1470 3580 980 3860Z','#42604d');
 b+=path('M3020 3890Q3360 3750 3740 4020L4070 4310 4300 4450 4190 4520 3720 4210 3340 3980Z','#3d5b49');
 b+=path('M4320 4650Q4790 4500 5280 4610L5620 4550 5500 4680 5070 4760 4580 4740Z','#355441');
 b+=path('M5980 4500L6410 4270 6810 4100 7100 3800 6990 4130 6690 4380 6300 4590Z','#385a47');
 b+=path('M7380 3520L7590 3290 7880 3140 8190 3100 8050 3230 7780 3270 7540 3440Z','#43614b');
 // Store footing is restrained dressed masonry at the real ground, not
 // floor-high giant blocks or a flat façade floating above a sloped triangle.
 for(const[x,w]of[[2130,103],[2244,119],[2375,98],[2480,105],[2598,94],[2705,77]]){const y=bierY('s8-ground',x);b+=poly([[x,y-17],[x+w,y-17],[x+w+4,bierY('s8-ground',x+w)+19],[x-2,y+19]],'#899477','#405b49',3);b+=line([[x+7,y-13],[x+w-5,y-13]],'#b0b294',4);}
 for(const[surface,x]of[['s8-west-walk',3150],['s8-west-walk',3650],['s8-drain-return',3890],['s8-central-step',5520],['s8-east-hatch',8140]]){const y=bierY(surface,x)+10;b+=line([[x-26,y],[x+27,y]],'#b3a16e',9);}
 return asset('grounded-supports','상여집 석축과 큰 기단의 열린 앞회랑',b,[500,3000,8000,1840],{rearOnly:true,noProjectileCover:true});}
function details(){let b='';for(const[surface,x]of[['s8-ground',1120],['s8-ground',1490],['s8-court',5910],['s8-ground',6510],['s8-ground',8790]]){const y=bierY(surface,x);b+=path(`M${x-28} ${y}L${x-19} ${y-61}L${x+5} ${y-73}L${x+28} ${y-60}L${x+31} ${y}Z`,'#70816b','#425b48',3);b+=line([[x-13,y-48],[x+17,y-48]],'#b0b197',5);}
 for(const[surface,x]of[['s8-ground',2040],['s8-ground',4790],['s8-ground',5540],['s8-court',7340],['s8-ground',8700]]){const y=bierY(surface,x);b+=path(`M${x-85} ${y}Q${x-37} ${y-42} ${x} ${y-21}Q${x+51} ${y-35} ${x+76} ${y}Z`,'#607650');b+=path(`M${x-12} ${y-6}Q${x-6} ${y-45} ${x+22} ${y-52}M${x+18} ${y-4}Q${x+28} ${y-30} ${x+51} ${y-27}`,'none','#8e9a6f',5);}
 b+=line([[4670,4235],[4860,4235]],'#beb18e',6)+line([[4740,4218],[4830,4218]],'#8f9976',5);
 return asset('quiet-court-details','낮은 석물·풀과 수습마당 흔적',b,[1000,2590,7920,2250],{grounded:true});}
export async function applyStage8BierArt(p){const s=p.stages.find(s=>s.metadata?.stageId===8);if(s?.initialState?.honroStage8BierRevision!==1)throw Error('Stage8 art requires fresh bier geometry');s.elements=s.elements.filter(e=>!e.id.startsWith('s8-art-'));for(const[a,id]of[[supports(),'supports'],[branch(),'branch'],[store(),'store'],[upper(),'east-shelter'],[details(),'details']])add(p,s,a,id);
 const far=asset('far-mountain','장례창고 너머 한 겹 저녁 먹산','',[0,0,1800,1100],{skyOnly:true});far.vector=compileSVG(readFileSync(new URL('../../shared/assets/environment/stage8-bier-far.svg',import.meta.url),'utf8'));register(p,far);s.design.bierArt={revision:1,backdropAsset:far,assetIds:s.elements.map(e=>e.assetId),scope:'Pure editable SVG. Rear forms are grounded scenery; only authored terrain is collision. Buildings use 146-unit doors, short footing blocks, and broad eroded ground masses.'};s.environment.groups=[];s.environment.surfaces=[];s.environment.placements=[];s.environment.skyVisible=true;s.environment.atmosphere={preset:'forest',overrides:{skyTop:'#283b4b',skyBottom:'#a3aba0',hazeStrength:.20,mistStrength:.04,lightStrength:.06,waterBaseColor:'#36575c',waterHighlightColor:'#94aaa0'}};return p;}
