/** Stage29-only fresh author. Saves retain serialized terrain and story state. */
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
 ['r29-high-road',[[4550,1840],[5550,1840],[6100,2190],[6500,2190]],[[6500,2270],[6100,2270],[5550,1930],[4550,1930]],'stone'],
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
 const n={};for(const u of s.units){if(u.team==='player'){u.x=250+(['archer','mage','knight','occultist'].indexOf(u.kind))*110;u.y=2700;continue;}const group=u.encounterGroup,[x,support]=roster[group][n[group]||0];n[group]=(n[group]||0)+1;Object.assign(u,{x,y:record29Y(support,x)});u.stageOverrides.honroEncounterSupport=support;}
 const entries=[[2350,record29Y('a3-foundation',2350)],[4710,1840],[6100,2760]];
 s.events.forEach((ev,i)=>{Object.assign(ev.entry,pt(...entries[i]));Object.assign(ev.action,pt(...entries[i]));});
 s.anchors={...s.anchors,spawn:pt(250,2700),start:pt(250,2700),exit:pt(6500,2760)};
 const a=[[3650,2220],[3850,2082.857142857143],[4250,1840],[4550,1840],[5550,1840],[6100,2190],[6350,2190]],b=[[3650,2220],[4150,2760],[5590,2760],[5700,2760],[5810,2650],[5940,2760],[6500,2760]],common=[[250,2700],[1150,2700],[1800,2520],[2050,2520],[2580,2220],poses['old-seal'],[3220,2220],[3650,2220]];
 s.design.act3={...s.design.act3,kind:'retaining-wall-record-court',mainBuildings:['r29-letter-room'],bridges:['r29-high-road','r29-inspection-roof'],primaryContour:clone(RECORD29_TOP),requiredRoute:common.map(([x,y])=>pt(x,y)),optionalRoutes:[],refinement:undefined,koreanTown:undefined,recordCourt:{revision:1,scope:'Fresh Stage29 only; exact existing goal/roster/finite wave identities preserved; image approval pending.',places:['western approach','sealed document chamber','exposed upper sluice road','covered lower maintenance passage'],routeA:a,routeB:b}};
 s.design.questRoutes.traversal={A:a.map(([x,y])=>pt(x,y)),B:b.map(([x,y])=>pt(x,y))};s.design.questRoutes.traversal.A[0].jumpTo={x:3850,support:'r29-upper-ascent'};s.routes=[...common,...b].map(([x,y])=>pt(x,y));
 p.library=p.library.filter(a=>!a.id.startsWith('stage29:record-'));
 const add=(key,svg,box,layer='back')=>{const v=asset('stage29:record-'+key,key,svg,[],box,'stone');v.params={collisionSource:'none',rearOnly:true};return put(p,s,v,'r29-'+key,0,0,1,layer);};
 // A long earth-retaining wall with deep rectangular drainage mouths: rear
 // structure, never an extra bright walkable rim or a floating backdrop.
 let wall=P([[1170,2520],[1990,2110],[2350,2035],[3670,2115],[4160,2450],[5580,2450],[5580,2760],[4150,2760],[3650,2220],[2580,2220],[2050,2520],[1800,2520],[1150,2700]],'#344a50');
 for(const [x,y,w,h]of [[1340,2480,200,100],[1880,2180,240,260],[2650,2075,230,145],[3030,2075,240,145],[4640,2480,260,280],[5150,2480,230,280]])wall+=R(x,y,w,h,'#253a41')+R(x+16,y+12,w-32,18,'#4f605c')+R(x+12,y+h-15,w-24,15,'#56645f');
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
 for(const [x,top,foot,w]of [[4310,1940,2760,135],[4520,1940,2760,110],[5500,1930,2760,105],[6070,2250,2760,145]]){
  bearings+=P([[x-w/2,top],[x+w/2,top],[x+w/2+12,foot-65],[x+w/2+38,foot],[x-w/2-38,foot],[x-w/2-12,foot-65]],'#41575a');
  bearings+=P([[x+w/2-26,top],[x+w/2,top],[x+w/2+12,foot-65],[x+w/2+38,foot],[x+w/2-15,foot]],'#293f46');
  for(let y=top+90,row=0;y<foot-55;y+=102,row++)bearings+=P([[x-w/2-2,y],[x+w/2+4,y-5],[x+w/2+4,y+2],[x-w/2-2,y+7]],'#293d43')+R(x+(row%2?17:-21),y+5,5,87,'#33494e');
  bearings+=R(x-w/2-16,top, w+32,27,'#7a8378');
 }
 bearings+=`<path fill="#3b5055" d="M4520 1940H5530V2760H5445V2240Q5020 1980 4605 2240V2760H4520Z"/><path fill="#788074" d="M4605 2240Q5020 1980 5445 2240L5420 2208Q5020 1928 4630 2208Z"/><path fill="#253a42" d="M4605 2240Q5020 1980 5445 2240V2272Q5020 2040 4605 2272Z"/>`;
 for(const [x,y,dx,dy]of [[4640,2190,15,28],[4750,2118,10,30],[4870,2074,6,33],[5015,2050,0,34],[5160,2074,-6,33],[5290,2120,-10,30],[5400,2190,-15,28]])bearings+=P([[x-3,y],[x+3,y],[x+dx+3,y+dy],[x+dx-3,y+dy]],'#2e444a');
 // Lower inspection passage: pegged lintels, round posts on padstones and raised sluice leaves.
 for(const x of [4460,5470])bearings+=R(x-30,2718,78,42,'#69756d')+P([[x,2590],[x+23,2590],[x+20,2718],[x+3,2718]],'#746044')+R(x+16,2594,7,124,'#3d3b31')+R(x-20,2600,64,17,'#a28c61');
 bearings+=R(4410,2590,1140,19,'#867253')+R(4410,2609,1140,10,'#403f35');
 for(const x of [4690,5120]){bearings+=R(x,2610,20,150,'#3d453e')+R(x+235,2610,20,150,'#3d453e')+R(x+20,2620,215,60,'#65583f');for(let y=2630;y<2670;y+=24)bearings+=R(x+25,y,205,5,'#393c32');bearings+=R(x+107,2580,9,100,'#a18d61')+R(x+72,2680,80,12,'#514834');}
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
 // Foreground masonry uses clipped polygons inside the existing solids, so
 // the visible load-bearing faces and real collision share the same contour.
 let face='';for(const [id,top,bottom,mat]of RECORD29_SURFACES){if(mat==='wood'||id==='r29-record-vault'||id==='r29-inspection-roof')continue;const poly=[...top,...bottom].map(([x,y])=>({x,y})),xs=top.map(p=>p[0]),ys=top.map(p=>p[1]),left=id==='a3-foundation'?1400:Math.min(...xs),right=id==='a3-foundation'?3650:Math.max(...xs),y0=Math.min(...ys),y1=Math.min(id==='a3-foundation'?2840:3350,Math.max(...bottom.map(p=>p[1])));
  for(let y=y0+16,row=0;y<y1;row++){const h=[117,162,131,98][row%4];let x=left-[60,130,22][row%3],col=0;while(x<right){const w=[223,347,199,279,377][(row*2+col)%5],l=Math.max(left+4,x+3),r=Math.min(right-4,x+w-4),t=y+3,bt=Math.min(y+h-4,y1-4);if(r>l&&bt>t){const raw=[[l+11,t+6],[r-23,t],[r,t+18],[r-7,bt-14],[r-21,bt],[l+8,bt-5],[l,bt-24],[l+3,t+20]].map(([x,y])=>({x,y}));const cell=raw;const clipped=g.HonroTerrainDomain.clip(poly,{left:l,right:r,top:t,bottom:bt});if(clipped.length<3){x+=w;col++;continue;}const inside=cell.every(v=>g.HonroTerrainDomain.clip(poly,{left:v.x-.1,right:v.x+.1,top:v.y-.1,bottom:v.y+.1}).length>=3);if(!inside)cell.splice(0,cell.length,...clipped);if(cell.length>=3){face+=P(cell.map(v=>[v.x,v.y]),['#485b5d','#526263','#3f5358','#48585c'][(row+col)%4]);const shade=g.HonroTerrainDomain.clip(poly,{left:Math.max(l,r-18),right:r,top:t+5,bottom:bt});if(shade.length>=3)face+=P(shade.map(v=>[v.x,v.y]),'#30474e');const lip=g.HonroTerrainDomain.clip(poly,{left:l+5,right:Math.max(l+6,r-7),top:t,bottom:Math.min(t+5,bt)});if(lip.length>=3)face+=P(lip.map(v=>[v.x,v.y]),'#79827b');}}x+=w;col++;}y+=h;}
 }
 add('actual-stone-faces',face,[0,1750,7200,1650],'front');
 let canopy=R(4420,2560,1110,13,'#7c8171')+R(4420,2573,1110,17,'#34494c')+R(4420,2585,1110,10,'#897859');for(let x=4460;x<5510;x+=90)canopy+=line([[x,2562],[x-9,2582]],'#536361',4);add('inspection-eaves',canopy,[4420,2560,1110,40],'front');
 s.environment.atmosphere.overrides={...s.environment.atmosphere.overrides,skyTop:'#172a36',skyBottom:'#425962',hazeStrength:.2,mistStrength:.04};
 const out=g.HonroTerrainDomain.author(p);if(JSON.stringify(out.stages.filter(t=>t.metadata?.stageId!==29))!==before)throw Error('Other stages changed');return out;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const {runtime}=await import('../../game/tests/helpers.mjs');const g=await runtime({legacyMaps:false});const p=authorStage29Record(g,JSON.parse(await readFile('shared/data/campaign.json','utf8')));await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');console.log('Stage29 record court authored; other29 exact');}
