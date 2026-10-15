/** Stage29-only fresh author. Saves retain serialized terrain and story state. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {asset,put,P,R,line,pool} from './act3-map-kit.mjs';
import {koreanTownBuilding,koreanArchiveCabinet} from '../environment/korean-town-art.mjs';
export const RECORD29_TOP=[[0,2700],[1150,2700],[1800,2520],[2050,2520],[2580,2220],[3650,2220],[4150,2760],[4260,2960],[5600,2960],[5740,2760],[7200,2760]];
export const RECORD29_SURFACES=[
 ['a3-foundation',RECORD29_TOP,[[7200,3500],[0,3500]],'rock'],
 ['r29-record-vault',[[2370,1780],[3520,1780],[3650,1860]],[[3650,1940],[2370,1940]],'stone'],
 ['old-door',[[3030,1940],[3074,1940]],[[3074,2220],[3030,2220]],'wood'],
 ['r29-upper-ascent',[[3830,2095],[4250,1840],[4550,1840]],[[4550,1940],[4250,1940],[3830,2195]],'stone'],
 ['r29-high-road',[[4550,1840],[5550,1840],[6100,2190],[6500,2190]],[[6500,2270],[6100,2270],[5550,1930],[4550,1930]],'stone'],
 ['r29-inspection-roof',[[4420,2330],[5530,2330]],[[5530,2430],[4420,2430]],'stone'],
 ['r29-inspection-deck',[[4150,2760],[5740,2760]],[[5740,2830],[4150,2830]],'stone'],
 ['r29-low-screen',[[5740,2650],[5850,2650]],[[5850,2760],[5740,2760]],'rock']
];
export function record29Y(id,x){const top=RECORD29_SURFACES.find(s=>s[0]===id)?.[1];if(!top)throw Error(id);for(let i=1;i<top.length;i++){const a=top[i-1],b=top[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}throw Error(`${id}@${x}`);}
const pt=(x,y)=>({x,y}),clone=v=>structuredClone(v);
export function authorStage29Record(g,input){
 const p=clone(input),s=p.stages.find(s=>s.metadata?.stageId===29),before=JSON.stringify(p.stages.filter(t=>t!==s));
 s.terrains=RECORD29_SURFACES.map(([id,top,bottom,mat])=>({id,name:id,type:'solid',points:[...top,...bottom].map(([x,y])=>pt(x,y)),baseMaterial:mat,breakable:false,oneWay:false,layer:'terrain',properties:{honroRecordCourt:true,honroSpaceSurfaceId:id,honroSurfaceRole:id==='old-door'?'wall':'floor',honroWalkEdges:id==='old-door'?[]:top.slice(1).map((_,i)=>i),surfaceKind:mat==='wood'?'wood':'granite',hp:99999,maxHp:99999},detail:{spacing:24,roughness:0,seed:29,optimizeEpsilon:0}}));
 s.elements=[];s.materials=[];pool(s,'r29-sluice-water',4260,5600,2870,2960);s.initialState.honroRecordCourtRevision=1;
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
 let wall=P([[1170,2520],[1990,2110],[2350,1870],[3670,1870],[4160,2450],[5580,2450],[5580,2760],[4150,2760],[3650,2220],[2580,2220],[2050,2520],[1800,2520],[1150,2700]],'#344a50');
 for(const [x,y,w,h]of [[1340,2480,200,100],[1880,2180,240,260],[2650,1950,230,270],[3030,1950,240,270],[4640,2480,260,280],[5150,2480,230,280]])wall+=R(x,y,w,h,'#253a41')+R(x+16,y+12,w-32,18,'#4f605c')+R(x+12,y+h-15,w-24,15,'#56645f');
 add('rear-retaining-work',wall,[1100,1800,4520,980]);
 // Letter room: broad wall planes, restrained joinery, bound books; no facts
 // about the author's present location or purpose are introduced by this art.
 let room=R(2490,1950,1050,270,'#555d53')+R(2500,1965,1020,42,'#293d41');
 for(const x of [2510,2800,3160,3510])room+=R(x,1940,19,280,'#4b4539')+R(x+3,1950,4,260,'#9d8b68');
 for(const x of [2620,3320]){const cab=koreanArchiveCabinet('r29cab'+x,{width:160,height:168});room+=`<g transform="translate(${x} 2030)">${cab.vector.source.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</g>`;}
 room+=R(2740,2160,150,14,'#aa9870')+R(2755,2174,12,46,'#554a36')+R(2860,2174,12,46,'#554a36')+R(2790,2145,64,15,'#c3b58e');
 room+=P([[2515,1980],[2534,1980],[2610,2050],[2590,2065]],'#7d6a4c')+P([[3500,1980],[3480,1980],[3400,2050],[3420,2065]],'#7d6a4c')+R(2495,2010,1035,13,'#8a7958');
 add('letter-room',room,[2480,1930,1080,300]);
 let bearings='';for(const [x,top,foot]of [[4310,1940,2760],[4520,1940,2330],[5500,1930,2330],[6070,2250,2760]])bearings+=P([[x-43,top],[x+43,top],[x+67,foot],[x-67,foot]],'#394f54')+P([[x-43,top],[x-15,top],[x-27,foot],[x-67,foot]],'#657370');
 bearings+=`<path fill="#3b5055" d="M4520 1940H5530V2330H5445V2240Q5020 1980 4605 2240V2330H4520Z"/><path fill="#63716c" d="M4605 2240Q5020 1980 5445 2240L5420 2218Q5020 1940 4630 2218Z"/><path fill="#263e46" d="M4605 2240Q5020 1980 5445 2240V2272Q5020 2040 4605 2272Z"/>`;
 for(const [x,y,w]of [[4580,2060,100],[4720,2000,130],[4880,1965,140],[5080,1965,140],[5270,2010,120],[5420,2080,90]])bearings+=R(x,y,w,8,'#788078');
 bearings+=R(4400,2440,1160,22,'#33494c');add('sluice-bearing',bearings,[4200,1850,1950,950]);
 // A single humble keeper hut sits behind the outer court, not a repeated palace.
 const archive=koreanTownBuilding('stage29:record-roof-store',{width:630,role:'archive',roofType:'gable',collision:false});put(p,s,archive,'r29-roof-store',2930,1780);
 const hut=koreanTownBuilding('stage29:record-keeper-hut',{width:380,role:'house',roofType:'gable',collision:false});put(p,s,hut,'r29-keeper-hut',6760,2760);
 let parapet='';for(const [x1,y1,x2,y2]of [[4590,1840,5510,1840],[5610,1878,6050,2158]]){parapet+=line([[x1,y1-66],[x2,y2-66]],'#4e5c57',12);for(let x=x1;x<=x2;x+=150){const y=y1+(y2-y1)*(x-x1)/(x2-x1);parapet+=R(x,y-72,12,72,'#6b7464');}}
 add('upper-rear-rail',parapet,[4530,1750,1580,440]);
 // Foreground masonry uses clipped polygons inside the existing solids, so
 // the visible load-bearing faces and real collision share the same contour.
 let face='';for(const [id,top,bottom,mat]of RECORD29_SURFACES){if(mat==='wood')continue;const poly=[...top,...bottom].map(([x,y])=>({x,y})),xs=top.map(p=>p[0]),ys=top.map(p=>p[1]),left=id==='a3-foundation'?1400:Math.min(...xs),right=id==='a3-foundation'?3650:Math.max(...xs),y0=Math.min(...ys),y1=Math.min(id==='a3-foundation'?2840:3350,Math.max(...bottom.map(p=>p[1])));
  for(let y=y0+16,row=0;y<y1;row++){const h=[68,85,74,61][row%4];let x=left-[60,130,22][row%3],col=0;while(x<right){const w=[183,247,159,219,277][(row*2+col)%5],l=Math.max(left+4,x+3),r=Math.min(right-4,x+w-4),t=y+3,bt=Math.min(y+h-4,y1-4);if(r>l&&bt>t){const cell=g.HonroTerrainDomain.clip(poly,{left:l,right:r,top:t,bottom:bt});if(cell.length>=3){face+=P(cell.map(v=>[v.x,v.y]),['#485b5d','#526263','#3f5358','#48585c'][(row+col)%4]);const shade=g.HonroTerrainDomain.clip(poly,{left:Math.max(l,r-18),right:r,top:t+5,bottom:bt});if(shade.length>=3)face+=P(shade.map(v=>[v.x,v.y]),'#30474e');const lip=g.HonroTerrainDomain.clip(poly,{left:l+5,right:Math.max(l+6,r-7),top:t,bottom:Math.min(t+5,bt)});if(lip.length>=3)face+=P(lip.map(v=>[v.x,v.y]),'#79827b');}}x+=w;col++;}y+=h;}
 }
 add('actual-stone-faces',face,[0,1750,7200,1650],'front');
 s.environment.atmosphere.overrides={...s.environment.atmosphere.overrides,skyTop:'#172a36',skyBottom:'#425962',hazeStrength:.2,mistStrength:.04};
 const out=g.HonroTerrainDomain.author(p);if(JSON.stringify(out.stages.filter(t=>t.metadata?.stageId!==29))!==before)throw Error('Other stages changed');return out;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const {runtime}=await import('../../game/tests/helpers.mjs');const g=await runtime({legacyMaps:false});const p=authorStage29Record(g,JSON.parse(await readFile('shared/data/campaign.json','utf8')));await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');console.log('Stage29 record court authored; other29 exact');}
