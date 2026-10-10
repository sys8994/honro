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
 b+=path('M2270 3513Q2310 3524 2350 3513L2338 3650Q2311 3633 2282 3650Z','#b4b39a','#667765',3);b+=path('M2690 3510Q2722 3523 2758 3511L2746 3658Q2723 3640 2700 3658Z','#a5ad98','#667765',3);b+=line([[2365,3667],[2590,3667]],'#b6a276',14)+line([[2390,3692],[2560,3692]],'#5c523a',11)+poly([[2425,3620],[2510,3620],[2530,3660],[2405,3660]],'#606e5b');
 
 return asset('funeral-store','반매몰 상여집·빈 가마채·바랜 소렴천',b,[2050,3300,1100,900],{buildingCount:1,doorHeight:146,groundedSupport:'s8-ground',feet:q});}
function upper(){let b=poly([[7600,2670],[7890,2670],[7860,2960],[7610,2920]],'#6e7964','#354f42',4,'east-low-plinth');b+=poly([[7520,2680],[7800,2680],[7800,2825],[7495,2825]],'#5e715b');b+=roof(7950,2385,650,115);
 for(const x of[7660,7830,8080,8240]){b+=poly([[x-12,2398],[x+14,2398],[x+17,2670],[x-15,2670]],'#5d543b');b+=line([[x-3,2407],[x-4,2652]],'#b1a279',6);b+=poly([[x-32,2649],[x+33,2649],[x+41,2670],[x-39,2670]],'#929c82');}
 b+=rect(7650,2440,603,16,'#627869')+rect(7665,2457,578,11,'#ad9471');b+=path('M7850 2425Q7900 2448 7950 2422L7930 2562Q7892 2550 7860 2569Z','#b7b7a0','#748274',3);
 b+=line([[7530,2657],[8150,2657]],'#a89c71',13);b+=poly([[7620,2620],[7675,2620],[7667,2650],[7616,2650]],'#69745b');
 // Human-scaled stone footing: a few irregular blocks, never enormous panels.
 for(const[x,y,w,h]of[[7560,2720,96,47],[7668,2720,121,48],[7545,2780,112,42],[7670,2780,93,42]]){b+=poly([[x,y],[x+w,y-3],[x+w-5,y+h],[x+3,y+h]],'#829078','#405b49',3);}
 return asset('east-bier-shelter','높은 동상여터의 낮은 석축과 빈 덧집','<g transform="translate(0 330)">'+b+'</g>',[7470,2570,840,750],{buildingCount:1,groundedSupport:'s8-court/s8-east-hatch',columnsFootY:2670});}
function branch(){let b=path('M4815 2680Q4910 2610 4960 2460Q5000 2340 4930 2150L4980 2070Q5110 2300 5070 2470Q5150 2460 5220 2370L5260 2400Q5190 2560 5060 2585L5000 2660Z','#5a634b','#344e3d',7,'short-rooted-pine-trunk');b+=path('M4880 2640Q5040 2480 4990 2220','none','#b1a479',19);b+=path('M5030 2430Q5170 2490 5310 2420L5450 2370 5480 2400Q5320 2530 5070 2510Z','#647253');b+=path('M4905 2460Q4770 2400 4740 2240L4780 2220Q4820 2360 4950 2400Z','#52674e');
 for(const[d,c]of[['M4660 2180Q4730 2070 4840 2140Q4910 2040 5020 2130Q5120 2100 5170 2190Q5030 2225 4900 2200Q4750 2250 4660 2180Z','#4f6552'],['M5180 2330Q5270 2230 5370 2300Q5430 2240 5520 2320L5570 2390Q5440 2420 5350 2380Q5260 2420 5180 2330Z','#657b58'],['M4710 2250Q4790 2190 4880 2250Q4910 2200 4980 2260L5030 2330Q4900 2360 4800 2310Z','#768563']])b+=path(d,c);
 return asset('rooted-branch','암괴 틈에 뿌리내린 짧고 굽은 보조 소나무',b,[4620,2050,1000,660],{groundedSupport:'s8-west-shoulder',foot:{x:4850,y:2600},secondarySilhouette:true});}
function supports(){let b='';
 // Rear rock joins explain the broad real stone shoulders. The near-side
 // walking tunnels remain dark open air, distinct from the collision faces.
 b+=path('M2840 3690L3130 3570 3490 3320 3770 3030 4230 2770 4700 2580 4930 2620 5200 2910 5460 3280 5620 3820 5530 4520 5060 4780 4310 4790 3880 4720 3480 4490 2990 4170Z','#3f5b4c');
 b+=path('M3280 3520Q3550 3470 3840 3140L4210 2910 4580 2770 4470 3080 4230 3370 3980 3660 3500 3810Z','#657963');
 b+=path('M4540 3460L4790 3180 4940 3080 5160 3360 5300 3950 5120 4460 4760 4700 4530 4560Z','#2e4b44');
 // The open front passage is visibly recessed into the backing rock. Its
 // exact solid ceiling, plank floor and exits come from authored terrain.
 b+=path('M3030 3750Q3320 3680 3570 3790L3970 4090 4150 4200 4180 4350 3910 4280 3510 3980 3150 3920Z','#243f3b');
 b+=path('M3970 4530Q4230 4380 4610 4480L5150 4460 5500 4380 5600 4640 5040 4770 4310 4770 3970 4690Z','#28463e');
 // Eastern back wall meets the lower ground. The near-side corridor is
 // visibly a shallow tunnel under the actual thick hillside ceiling.
 b+=path('M5430 4390L5850 4130 6420 3700 6760 3420 6930 3420 7420 3110 7800 2990 8000 3120 7880 3500 7390 4020 6870 4470 6030 4720Z','#405c4d');
 b+=path('M5910 4410L6240 4290 6660 4110 6860 4140 6500 4460 6150 4580Z','#657b5e');
 b+=path('M5990 4510L6430 4210 6660 4210 7140 3780 7630 3410 8030 3100 8290 3100 8290 3210 8030 3210 7630 3510 7140 3920 6720 4320 6480 4360 6070 4610Z','#29463e');
 // Store footing is restrained dressed masonry at the real ground, not
 // floor-high giant blocks or a flat façade floating above a sloped triangle.
 for(const[x,w]of[[2130,103],[2244,119],[2375,98],[2480,105],[2598,94],[2705,77]]){const y=bierY('s8-ground',x);b+=poly([[x,y-17],[x+w,y-17],[x+w+4,bierY('s8-ground',x+w)+19],[x-2,y+19]],'#899477','#405b49',3);b+=line([[x+7,y-13],[x+w-5,y-13]],'#b0b294',4);}
 for(const[surface,x,base]of[['s8-west-walk',3150,3900],['s8-west-walk',3650,4330],['s8-drain-return',3890,4500],['s8-east-hatch',8140,3104],['s8-east-hatch',8330,3110]]){const top=bierY(surface,x)+22;b+=poly([[x-12,top],[x+13,top],[x+18,base],[x-17,base]],'#5b533a');b+=line([[x-4,top+2],[x-5,base-4]],'#a59363',5);}
 return asset('grounded-supports','상여집 석축과 큰 기단의 열린 앞회랑',b,[2050,3000,6400,1840],{rearOnly:true,noProjectileCover:true});}
function details(){let b='';for(const[surface,x]of[['s8-ground',1120],['s8-ground',1490],['s8-court',5090],['s8-ground',6510],['s8-ground',8790]]){const y=bierY(surface,x);b+=path(`M${x-28} ${y}L${x-19} ${y-61}L${x+5} ${y-73}L${x+28} ${y-60}L${x+31} ${y}Z`,'#70816b','#425b48',3);b+=line([[x-13,y-48],[x+17,y-48]],'#b0b197',5);}
 for(const[surface,x]of[['s8-ground',2040],['s8-ground',4790],['s8-ground',5540],['s8-court',7340],['s8-ground',8700]]){const y=bierY(surface,x);b+=path(`M${x-85} ${y}Q${x-37} ${y-42} ${x} ${y-21}Q${x+51} ${y-35} ${x+76} ${y}Z`,'#607650');b+=path(`M${x-12} ${y-6}Q${x-6} ${y-45} ${x+22} ${y-52}M${x+18} ${y-4}Q${x+28} ${y-30} ${x+51} ${y-27}`,'none','#8e9a6f',5);}
 b+=line([[4670,4235],[4860,4235]],'#beb18e',6)+line([[4740,4218],[4830,4218]],'#8f9976',5);
 return asset('quiet-court-details','낮은 석물·풀과 수습마당 흔적',b,[1000,2590,7920,2250],{grounded:true});}
export async function applyStage8BierArt(p){const s=p.stages.find(s=>s.metadata?.stageId===8);if(s?.initialState?.honroStage8BierRevision!==1)throw Error('Stage8 art requires fresh bier geometry');s.elements=s.elements.filter(e=>!e.id.startsWith('s8-art-'));for(const[a,id]of[[supports(),'supports'],[branch(),'branch'],[store(),'store'],[upper(),'east-shelter'],[details(),'details']])add(p,s,a,id);
 const far=asset('far-mountain','장례창고 너머 한 겹 저녁 먹산','',[0,0,1800,1100],{skyOnly:true});far.vector=compileSVG(readFileSync(new URL('../../shared/assets/environment/stage8-bier-far.svg',import.meta.url),'utf8'));register(p,far);s.design.bierArt={revision:1,backdropAsset:far,assetIds:s.elements.map(e=>e.assetId),scope:'Pure editable SVG. Rear forms are grounded scenery; only authored terrain is collision. Buildings use 146-unit doors, short footing blocks, and broad eroded ground masses.'};s.environment.groups=[];s.environment.surfaces=[];s.environment.placements=[];s.environment.skyVisible=true;s.environment.atmosphere={preset:'forest',overrides:{skyTop:'#283b4b',skyBottom:'#a3aba0',hazeStrength:.20,mistStrength:.04,lightStrength:.06,waterBaseColor:'#36575c',waterHighlightColor:'#94aaa0'}};return p;}
