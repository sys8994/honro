import {authorPlaceEncounters} from './act3-place-encounters-20261017.mjs';
import {SERVICE_COVER_TOP,SERVICE_COVER_BOTTOM,authorStage29ServiceCover} from './stage29-service-cover.mjs';
/** Stage29-only fresh author. Campaign revision discards obsolete battle geography. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {asset,put,P,R,line,pool} from './act3-map-kit.mjs';
import {koreanTownBuilding,koreanArchiveCabinet} from '../environment/korean-town-art.mjs';
export const RECORD29_TOP=[[0,2700],[1150,2700],[1800,2520],[2050,2520],[2580,2220],[3650,2220],[4150,2760],[4260,2960],[5600,2960],[5740,2760],[7200,2760]];
export const RECORD29_SURFACES=[
 ['a3-foundation',RECORD29_TOP,[[7200,3500],[0,3500]],'rock'],
 ['r29-record-vault',[[2370,2050],[2480,2055],[2660,2020],[3320,2020],[3540,2055],[3650,2050]],[[3650,2074],[3540,2079],[3320,2044],[2660,2044],[2480,2079],[2370,2074]],'stone'],
 ['old-door',[[3030,2050],[3074,2050]],[[3074,2220],[3030,2220]],'wood'],
 ['r29-upper-ascent',[[3830,2095],[4250,1840],[4550,1840]],[[4550,1940],[4250,1940],[3830,2195]],'stone'],
 ['r29-high-road',SERVICE_COVER_TOP,SERVICE_COVER_BOTTOM,'stone'],
 ['r29-inspection-roof',[[4420,2560],[5530,2560]],[[5530,2590],[4420,2590]],'stone'],
 ['r29-inspection-deck',[[4150,2760],[5740,2760]],[[5740,2830],[4150,2830]],'stone'],
 ['r29-low-screen',[[5740,2650],[5850,2650]],[[5850,2760],[5740,2760]],'rock']
];
export function record29Y(id,x){const top=RECORD29_SURFACES.find(s=>s[0]===id)?.[1];if(!top)throw Error(id);for(let i=1;i<top.length;i++){const a=top[i-1],b=top[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}throw Error(`${id}@${x}`);}
const pt=(x,y)=>({x,y}),clone=v=>structuredClone(v);
export function authorStage29Record(g,input){
 const p=clone(input),s=p.stages.find(s=>s.metadata?.stageId===29),before=JSON.stringify(p.stages.filter(t=>t!==s));
 s.terrains=RECORD29_SURFACES.map(([id,top,bottom,mat])=>({id,name:id,type:'solid',points:[...top,...bottom].map(([x,y])=>pt(x,y)),baseMaterial:mat,breakable:false,oneWay:['r29-record-vault','r29-inspection-roof'].includes(id),layer:'terrain',properties:{honroRecordCourt:true,honroSpaceSurfaceId:id,honroSurfaceRole:id==='old-door'?'wall':'floor',honroWalkEdges:id==='old-door'?[]:top.slice(1).map((_,i)=>i),surfaceKind:mat==='wood'?'wood':'granite',hp:99999,maxHp:99999},detail:{spacing:24,roughness:0,seed:29,optimizeEpsilon:0}}));
 s.elements=[];s.materials=[];pool(s,'r29-sluice-water',4260,5600,2870,2960);s.initialState.honroRecordCourtRevision=2;
 for(const key of ['terrainBounds','playBounds','terrainDomainVersion','detailStats'])delete s[key];
 const poses={'old-seal':[2780,2220],'wave-old-seal':[3500,2220],'hyeonmuk-letter':[2830,2220],'wave-flight-hold':[6330,2760],'route-upper-exit':[6350,2190],'route-lower-exit':[6500,2760],'route-exit':[3690,2263.2]};
 for(const m of s.markers)Object.assign(m,pt(...poses[m.id]));
 const roster={
 'sealed-store-response':[[1390,'a3-foundation'],[1590,'a3-foundation'],[1870,'a3-foundation'],[1990,'a3-foundation']],
 'letter-store-guard':[[2630,'a3-foundation'],[2790,'a3-foundation'],[2940,'a3-foundation'],[3390,'a3-foundation'],[3500,'a3-foundation']],
 'underwater-bridge-watch':[[4290,'r29-inspection-deck'],[4450,'r29-inspection-deck'],[4900,'r29-inspection-deck'],[5120,'r29-inspection-deck']],
 'dark-lock-approach':[[4720,'r29-high-road'],[4870,'r29-high-road'],[5260,'r29-high-road'],[5430,'r29-high-road']],
 'moonlit-exit-watch':[[5990,'a3-foundation'],[6120,'a3-foundation'],[5980,'r29-high-road'],[6150,'r29-high-road'],[6290,'a3-foundation']]};
 const n={};for(const u of s.units){if(u.team==='player'){u.x=250+(['archer','mage','knight','occultist'].indexOf(u.kind))*110;u.y=2700;continue;}const group=u.encounterGroup,pose=roster[group]?.[n[group]||0];if(!pose)continue;const [x,support]=pose;n[group]=(n[group]||0)+1;Object.assign(u,{x,y:record29Y(support,x)});u.stageOverrides.honroEncounterSupport=support;}
 const entries=[[2350,record29Y('a3-foundation',2350)],[4710,1840],[6100,2760]];
 s.events.forEach((ev,i)=>{Object.assign(ev.entry,pt(...entries[i]));Object.assign(ev.action,pt(...entries[i]));});
 s.anchors={...s.anchors,spawn:pt(250,2700),start:pt(250,2700),exit:pt(6500,2760)};
 const a=[[3650,2220],[3850,2082.857142857143],[4250,1840],[4550,1840],[5550,1840],[6100,2190],[6350,2190]],b=[[3650,2220],[4150,2760],[5590,2760],[5700,2760],[5810,2650],[5940,2760],[6500,2760]],common=[[250,2700],[1150,2700],[1800,2520],[2050,2520],[2580,2220],poses['old-seal'],[3220,2220],[3650,2220]];
 s.design.act3={...s.design.act3,kind:'retaining-wall-record-court',mainBuildings:['r29-letter-room'],bridges:['r29-high-road','r29-inspection-roof'],primaryContour:clone(RECORD29_TOP),requiredRoute:common.map(([x,y])=>pt(x,y)),optionalRoutes:[],refinement:undefined,koreanTown:undefined,recordCourt:{revision:1,scope:'Fresh Stage29 only; exact existing goal/roster/finite wave identities preserved; image approval pending.',places:['western approach','sealed document chamber','exposed upper sluice road','covered lower maintenance passage'],routeA:a,routeB:b}};
 s.design.questRoutes.traversal={A:a.map(([x,y])=>pt(x,y)),B:b.map(([x,y])=>pt(x,y))};s.design.questRoutes.traversal.A[0].jumpTo={x:3850,support:'r29-upper-ascent'};s.routes=[...common,...b].map(([x,y])=>pt(x,y));
 authorPlaceEncounters(p,s);
 applyStage29RecordArt(g,p);
 const out=g.HonroTerrainDomain.author(authorStage29ServiceCover(p));if(JSON.stringify(out.stages.filter(t=>t.metadata?.stageId!==29))!==before)throw Error('Other stages changed');return out;
}
/** Art-only refresh for an existing campaign; never reauthors quest or collision state. */
export function applyStage29RecordArt(g,p){
 const s=p.stages.find(s=>s.metadata?.stageId===29);
 s.elements=s.elements.filter(e=>!e.id.startsWith('r29-'));
 p.library=p.library.filter(a=>!a.id.startsWith('stage29:record-'));
 const add=(key,svg,box,layer='back')=>{const v=asset('stage29:record-'+key,key,svg,[],box,'stone');v.params={collisionSource:'none',rearOnly:true};return put(p,s,v,'r29-'+key,0,0,1,layer);};
 // The opposite river embankment is one recessed silhouette tied to the channel.
 // Its quiet contour is landscape, with no door-like openings or walkable rim.
 let river='<defs><linearGradient id="r29-distance" x1="0" y1="1660" x2="0" y2="2900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#354c59"/><stop offset="1" stop-color="#283f48"/></linearGradient></defs>';
 river+=`<path fill="url(#r29-distance)" d="M-1800 2430Q-700 2310 0 2280L350 2250 570 2110 720 2150 960 2050 1210 2160 1420 2110 1630 2190 1880 2060 2150 2030 2350 2090 2610 1990 2850 2040 3420 2140 3800 2040 4150 2090 4520 2160 4930 2090 5270 2180 5680 2130 6010 2020 6240 2080 6480 2050 6720 2190 6990 2140 7210 2230 9000 2110V3200H-1800Z"/>`;
 river+=`<path fill="#304752" d="M-1800 2540Q500 2380 1810 2440L3480 2370Q4810 2260 5910 2400L9000 2320V3040H-1800Z"/><path fill="#344c55" d="M-1800 2670Q1200 2510 3200 2560Q5900 2450 9000 2590V3070H-1800Z"/>`;
 // Old flood-bank revetments are low, closed stone masses embedded in the far bank.
 river+=P([[240,2360],[240,2280],[490,2250],[490,2220],[780,2210],[780,2360]],'#3b5159')+P([[490,2220],[780,2210],[780,2360],[721,2360],[711,2240],[490,2250]],'#2b434d')+P([[6190,2330],[6190,2180],[6410,2190],[6410,2240],[6680,2250],[6680,2370]],'#3c5259')+P([[6410,2240],[6680,2250],[6680,2370],[6625,2370],[6610,2270],[6410,2260]],'#2a424c');
 add('far-river-bank',river,[-1800,1660,10800,1540]);
 // A long earth-retaining wall with deep rectangular drainage mouths: rear
 // structure, never an extra bright walkable rim or a floating backdrop.
 let wall=P([[1170,2520],[1990,2110],[2350,2035],[3670,2115],[4160,2450],[5580,2450],[5580,2760],[4150,2760],[3650,2220],[2580,2220],[2050,2520],[1800,2520],[1150,2700]],'#344a50');
 for(const [x,y,w,h]of [[1610,2390,190,150],[2150,2180,210,180],[4710,2490,230,240],[5220,2510,190,210]]){
  wall+=P([[x-20,y-20],[x+w+15,y-12],[x+w+8,y+h],[x-20,y+h]],'#405356')+R(x,y,w,h,'#192f38')+P([[x,y],[x+w,y],[x+w-25,y+25],[x+18,y+25],[x+18,y+h],[x,y+h]],'#283f47')+R(x-10,y+h-12,w+24,12,'#52605a');
 }
 add('rear-retaining-work',wall,[1100,1800,4520,980]);
 // Letter room: broad wall planes, restrained joinery, bound books; no facts
 // about the author's present location or purpose are introduced by this art.
 let room=R(2490,2050,1050,170,'#555d53')+R(2500,2065,1020,22,'#293d41');
 for(const x of [2510,2800,3160,3510])room+=R(x,2050,19,170,'#4b4539')+R(x+3,2060,4,150,'#9d8b68');
 for(const x of [2620,3320]){const cab=koreanArchiveCabinet('r29cab'+x,{width:160,height:128});room+=`<g transform="translate(${x} 2070)">${cab.vector.source.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</g>`;}
 room+=R(2740,2160,150,14,'#aa9870')+R(2755,2174,12,46,'#554a36')+R(2860,2174,12,46,'#554a36')+R(2790,2145,64,15,'#c3b58e');
 room+=R(2495,2055,1035,17,'#8a7958');
 add('letter-room',room,[2480,1930,1080,300]);
 let bearings='';
 for(const [x,top,foot,w]of [[4310,1940,2760,150],[4520,1940,2760,138],[5500,1930,2760,180],[6070,2250,2760,162]]){
  bearings+=P([[x-w/2,top],[x+w/2,top],[x+w/2+12,foot-65],[x+w/2+38,foot],[x-w/2-38,foot],[x-w/2-12,foot-65]],'#41575a');
  bearings+=P([[x+w/2-26,top],[x+w/2,top],[x+w/2+12,foot-65],[x+w/2+38,foot],[x+w/2-15,foot]],'#293f46');
  for(let y=top+90,row=0;y<foot-55;y+=180,row++)bearings+=P([[x-w/2-2,y],[x+w/2+4,y-5],[x+w/2+4,y+2],[x-w/2-2,y+7]],'#293d43')+R(x+(row%2?17:-21),y+5,5,160,'#33494e');
  bearings+=R(x-w/2-16,top, w+32,27,'#7a8378');
 }
 bearings+=`<path fill="#3b5055" d="M4520 1940H5530V2760H5445V2240Q5020 1980 4605 2240V2760H4520Z"/><path fill="#788074" d="M4605 2240Q5020 1980 5445 2240L5420 2208Q5020 1928 4630 2208Z"/><path fill="#253a42" d="M4605 2240Q5020 1980 5445 2240V2272Q5020 2040 4605 2272Z"/>`;
 for(const [x,y,dx,dy]of [[4640,2190,15,28],[4750,2118,10,30],[4870,2074,6,33],[5015,2050,0,34],[5160,2074,-6,33],[5290,2120,-10,30],[5400,2190,-15,28]])bearings+=P([[x-3,y],[x+3,y],[x+dx+3,y+dy],[x+dx-3,y+dy]],'#2e444a');
 // Lower inspection passage: pegged lintels, round posts on padstones and raised sluice leaves.
 for(const x of [4460,5470])bearings+=R(x-30,2718,78,42,'#69756d')+P([[x,2590],[x+23,2590],[x+20,2718],[x+3,2718]],'#746044')+R(x+16,2594,7,124,'#3d3b31')+R(x-20,2600,64,17,'#a28c61');
 bearings+=R(4410,2590,1140,19,'#867253')+R(4410,2609,1140,10,'#403f35');
 for(const x of [4690,5120]){bearings+=R(x,2610,20,150,'#3d453e')+R(x+235,2610,20,150,'#3d453e')+R(x+20,2620,215,60,'#65583f');for(let y=2630;y<2670;y+=24)bearings+=R(x+25,y,205,5,'#393c32');bearings+=R(x+107,2580,9,100,'#a18d61')+R(x+72,2680,80,12,'#514834');}
 bearings+=P([[4310,2140],[4350,2130],[4370,2700],[4410,2760],[4270,2760],[4260,2690]],'#4d605e')+P([[5490,2240],[5570,2210],[5590,2710],[5630,2760],[5455,2760]],'#2a4148');
 // Two small shielded lanterns cast warm light within the timber passage.
 for(const [x,y]of [[4495,2638],[5410,2638]]){bearings+=R(x-4,y-25,8,21,'#322e25')+P([[x-19,y],[x+18,y],[x+14,y+46],[x-14,y+46]],'#8c7852')+R(x-10,y+7,20,27,'#d3ad68')+R(x-23,y-3,46,8,'#373b31')+R(x-19,y+43,38,7,'#36392c');}
 add('sluice-bearing',bearings,[4200,1850,1950,950]);
 // A single humble keeper hut sits behind the outer court, not a repeated palace.
 let roof=P([[2370,2050],[2480,2055],[2660,2020],[3320,2020],[3540,2055],[3650,2050],[3650,2074],[3540,2079],[3320,2044],[2660,2044],[2480,2079],[2370,2074]],'#42565a');
 roof+=P([[2650,2017],[3330,2017],[3330,2026],[2650,2026]],'#929582')+P([[2370,2065],[2480,2070],[2660,2035],[3320,2035],[3540,2070],[3650,2065],[3650,2075],[3540,2080],[3320,2045],[2660,2045],[2480,2080],[2370,2075]],'#a08b65');
 for(let x=2410;x<3620;x+=58){const y=record29Y('r29-record-vault',x);roof+=P([[x,y+3],[x+8,y+3],[x+2,y+17],[x-5,y+17]],'#263e45');}
 for(const x of [2510,2800,3160,3510])roof+=R(x-19,2080,56,14,'#a18b61')+R(x-8,2094,34,15,'#635137');
 add('archive-eaves',roof,[2340,2010,1340,140],'front');
 const hut=koreanTownBuilding('stage29:record-keeper-hut',{width:380,role:'house',roofType:'gable',collision:false});put(p,s,hut,'r29-keeper-hut',6760,2760);
 let parapet='';for(const [x1,y1,x2,y2]of [[4590,1840,5510,1840],[5610,1878,6050,2158]]){parapet+=line([[x1,y1-66],[x2,y2-66]],'#4e5c57',12);for(let x=x1;x<=x2;x+=150){const y=y1+(y2-y1)*(x-x1)/(x2-x1);parapet+=R(x,y-72,12,72,'#6b7464');}}
 add('upper-rear-rail',parapet,[4530,1750,1580,440]);
 // Large silt/bedrock planes follow the authored floor contour and continue
 // through the existing outer terrain. No tiled foreground or new floor rim.
 const terrainTop=s.terrains.find(t=>t.id==='a3-foundation').points.filter(v=>v.y<7000).map(v=>[v.x,v.y]).sort((a,b)=>a[0]-b[0]);
 let face=P([...terrainTop,[13200,7000],[-6000,7000]],'#263b40');
 const band=(points,upper,lower,fill)=>P([...points.map(([x,y])=>[x,y+upper]),...points.slice().reverse().map(([x,y],i)=>[x,y+lower+(i%3)*37])],fill);
 face+=band(terrainTop,18,190,'#34484b');
 face+=P([[-2000,2880],[1190,2890],[1830,2730],[2110,2690],[2620,2425],[3060,2470],[3490,2380],[3670,2470],[4070,2870],[4260,3130],[5610,3120],[5790,2940],[9200,2930],[9200,7000],[-2000,7000]],'#263b40');
 face+=P([[-2000,2970],[760,2950],[1200,3060],[2030,2850],[2510,2820],[2970,2670],[3410,2700],[3870,2930],[4210,3300],[5680,3290],[6060,3070],[9200,3130],[9200,7000],[-2000,7000]],'#304449');
 face+=P([[350,3150],[1140,3050],[1740,3180],[2390,2920],[2800,3020],[3450,2810],[3780,3030],[4200,3430],[3360,3410],[2310,3320],[1410,3460],[-2000,3360],[-2000,3270]],'#394b4b');
 // Unequal, hand-set masonry sits only under the record court. Each large
 // block has one bevel and a shaded return; joints drift with the load and slope.
 const blocks=[
 [[1850,2595],[2115,2570],[2235,2505],[2260,2602],[2100,2690],[1845,2730]],
 [[2150,2515],[2390,2372],[2518,2348],[2480,2472],[2282,2590]],
 [[2537,2348],[2775,2336],[2780,2465],[2510,2490]],
 [[2795,2338],[3050,2330],[3160,2357],[3134,2468],[2810,2481]],
 [[3180,2355],[3380,2350],[3374,2492],[3160,2470]],
 [[3405,2350],[3628,2345],[3690,2440],[3660,2520],[3400,2490]],
 [[2310,2610],[2490,2508],[2650,2500],[2658,2640],[2440,2700],[2250,2735]],
 [[2680,2500],[2890,2502],[2900,2640],[2700,2680]],
 [[2920,2500],[3130,2490],[3300,2518],[3295,2655],[3115,2680],[2922,2657]],
 [[3330,2520],[3650,2545],[3715,2632],[3670,2725],[3320,2660]]
 ];
 for(const [i,ps]of blocks.entries()){const a=ps[0],z=ps[1],br=ps.at(-2),last=ps.at(-1);face+=P(ps,['#46585a','#4c5c5b','#405358'][i%3]);face+=P([a,z,[z[0]-9,z[1]+15],[a[0]+8,a[1]+17]],'#65716a');face+=P([ps.at(-3),br,last,[last[0]+9,last[1]-15],[br[0]-12,br[1]-15]],'#2b4249');}
 // Broad strata and one broken shelf give the native ground a material scale.
 face+=P([[210,3020],[810,2935],[1120,2980],[1550,2885],[1930,2920],[2190,2830],[2020,2910],[1560,2960],[1120,3030],[810,2990]],'#405250');
 face+=P([[1770,3150],[2310,2960],[2680,3010],[2990,2880],[3230,2910],[3000,2960],[2700,3090],[2320,3030]],'#263e44');
 face+=P([[5770,3050],[6110,2990],[6380,3030],[6880,2940],[7200,2985],[6950,3000],[6420,3080],[6130,3045]],'#455653');
 face+=P([[4450,3100],[4830,3135],[5300,3110],[5600,3135],[5520,3190],[5130,3165],[4780,3200]],'#344a4d');
 // Road fascia stays exactly inside its authored solid profile.
 for(const [id,top,bottom]of RECORD29_SURFACES.filter(v=>['r29-upper-ascent','r29-high-road','r29-inspection-deck'].includes(v[0]))){face+=P([...top.map(([x,y])=>[x,y+12]),...bottom],'#43575a');face+=line(top.map(([x,y])=>[x,y+16]),'#65716a',7);}
 face+=R(4160,2775,1570,37,'#5d5b46')+R(4160,2802,1570,16,'#343f38');
 for(const [x,w]of [[4170,270],[4450,350],[4815,285],[5110,345],[5465,250]])face+=R(x,2778,w,5,'#817b59')+R(x+w-7,2781,7,29,'#2b3d37');
 add('actual-stone-faces',face,[-6000,1750,19200,6000],'front');
 let canopy=R(4420,2560,1110,13,'#7c8171')+R(4420,2573,1110,17,'#34494c')+R(4420,2585,1110,10,'#897859');for(let x=4460;x<5510;x+=90)canopy+=line([[x,2562],[x-9,2582]],'#536361',4);add('inspection-eaves',canopy,[4420,2560,1110,40],'front');
 s.environment.atmosphere.overrides={...s.environment.atmosphere.overrides,skyTop:'#172a36',skyBottom:'#425962',hazeStrength:.2,mistStrength:.04};
 return p;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const {runtime}=await import('../../game/tests/helpers.mjs');const g=await runtime({legacyMaps:false});const p=authorStage29Record(g,JSON.parse(await readFile('shared/data/campaign.json','utf8')));await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');console.log('Stage29 record court authored; other29 exact');}
