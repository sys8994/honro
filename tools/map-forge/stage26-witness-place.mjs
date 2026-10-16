/** Stage 26: one open work hollow, an earth-covered record room and an inhabited refuge.
 * Existing testimony and physical cargo ownership remain runtime policy. */
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {authorEncounters} from './act3-encounters.mjs';
import {P,R,line,asset,put,terrain,gate,settle} from './act3-map-kit.mjs';
import {koreanFoundry} from '../environment/korean-late-town-art.mjs';
import {koreanTownBuilding,koreanArchiveCabinet} from '../environment/korean-town-art.mjs';
const clone=x=>JSON.parse(JSON.stringify(x)),PREFIX='stage26-witness:';
export function rebuildWitnessPlace(g,p,input){
 const s=clone(input);s.width=7000;s.height=3300;
 const oldTrees=s.elements.filter(e=>/pine/.test(e.id));
 s.elements=[];s.terrains=[];s.materials=[];delete s.terrainBounds;
 s.design.act3={...s.design.act3,kind:'burial-room-work-hollow-refuge',placeRevision:1,mainBuildings:[],bridges:[],requiredRoute:[],optionalRoutes:[],primaryContour:[],shotSamples:[],scope:'Stage26 only. Finite normal-resource combat remains a separate acceptance check.'};
 const floor=[[0,2300],[520,2300],[800,2400],[1750,2400],[2250,2700],[3370,2700],[3700,2580],[4020,2340],[4580,2150],[5260,2150],[5620,2410],[6100,2410],[6550,2250],[7000,2250]];
 s.design.act3.primaryContour=floor;
 terrain(s,'a3-foundation',[...floor,[7000,3300],[0,3300]],'earth');
 // The burial roof is finite; the open mouths and the real floor remain distinct.
 terrain(s,'burial-record-earth-roof',[[720,2090],[960,1955],[1320,1900],[1630,1970],[1810,2120],[1960,2210],[1750,2150],[850,2150],[720,2190]],'earth',{honroCeiling:true});
 gate(s,'hidden-door',940,2400,250);
 const art=(id,svg,bounds,collision=[],material='wood')=>{const a=asset(PREFIX+id,id,svg,collision,bounds,material);a.params.rearOnly=!collision.length;put(p,s,a,id,0,0);return a;};
 const contour=(id,ps,c='#6a7162')=>art(id,P(ps,c,'#172d30',5)+line(ps.slice(0,2),'#a2a68c',5),[Math.min(...ps.map(q=>q[0]))-5,Math.min(...ps.map(q=>q[1]))-5,Math.max(...ps.map(q=>q[0]))-Math.min(...ps.map(q=>q[0]))+10,Math.max(...ps.map(q=>q[1]))-Math.min(...ps.map(q=>q[1]))+10],[ps],'stone');
 art('record-room-rear',P([[800,2150],[1750,2150],[1870,2310],[1750,2400],[800,2400]],'#354744')+R(910,2160,730,240,'#596052')+R(960,2170,25,230,'#303e36')+R(1630,2160,29,240,'#303e36')+R(950,2150,720,23,'#817960')+R(990,2181,610,13,'#273c35')+R(1190,2255,220,145,'#3d4b40'),[780,2140,1110,270]);
 const cabinet=koreanArchiveCabinet(PREFIX+'record-cabinet',{width:190,height:150});put(p,s,cabinet,'ancestor-record-cabinet',1380,2250);
 // A low ruined kiln retaining wall and an open work loft create a local upper route,
 // approached from both banks; no stacked full-width floors and no impassable chimney.
 contour('west-work-ramp',[[2050,2400],[2420,2300],[2420,2322],[2050,2422]]);
 contour('work-loft',[[2420,2300],[3430,2300],[3430,2322],[2420,2322]],'#675e47');
 contour('east-work-ramp',[[3430,2300],[3750,2360],[3750,2382],[3430,2322]]);
 let frame=R(2480,2340,27,360,'#383b32')+R(3340,2340,29,360,'#343b33')+P([[2480,2470],[2507,2445],[2680,2690],[2660,2700]],'#615a43')+P([[3170,2700],[3190,2690],[3369,2440],[3369,2480]],'#5f5b45');

 frame+=line([[2507,2345],[3340,2345]],'#877b59',7)+R(2520,2660,130,40,'#6c6550')+R(2528,2650,114,12,'#b2a583')+R(3190,2620,98,80,'#5e604e');
 // Generic small furnace, trough and tools: no bell-shaped mold or historical conclusion.
 frame+=P([[2780,2700],[2760,2600],[2795,2500],[2860,2475],[2935,2520],[2970,2700]],'#776d58','#263932',5)+P([[2780,2700],[2800,2600],[2850,2580],[2900,2600],[2920,2700]],'#293a35')+P([[2795,2500],[2860,2475],[2935,2520],[2870,2540]],'#9c8b6a')+R(3000,2670,135,30,'#4b615c')+line([[3030,2672],[3105,2672]],'#809388',6);
 frame+=line([[2425,2310],[3425,2310]],'#a09370',3);
 for(const x of [2470,2580,2700,2790,2925,3040,3160,3280,3370])frame+=line([[x,2303],[x+3,2318]],'#393d32',3);
 frame+=R(2460,2195,12,105,'#6c6146')+R(2600,2200,12,100,'#5a513d')+line([[2462,2210],[2605,2220],[2700,2250]],'#8f8162',8);
 art('burnt-workshop-frame',frame,[2360,2180,1200,540]);
 const forge=koreanFoundry(PREFIX+'work-hollow-forge',{width:720,baseDepth:0,supports:[],variant:0});put(p,s,forge,'work-hollow-forge',2870,2700);
 // Refuge has a modest thatched roof, an open front and an actual usable porch.
 const home=koreanTownBuilding(PREFIX+'refuge-house',{width:650,role:'house',roofType:'thatch'});put(p,s,home,'artisan-refuge-house',4910,2150);
 art('refuge-yard',P([[4460,2150],[4510,2040],[4560,2035],[4610,2150]],'#676959','#263932',4)+P([[5160,2150],[5160,2060],[5350,2075],[5380,2150]],'#636758','#263932',4)+R(4590,2090,105,60,'#706248')+R(4585,2080,115,13,'#a59670'),[4440,2020,970,145]);
 // Smaller banks divide the return approach; empty slopes are deliberate maneuver space.
 art('return-bank-stones',P([[5740,2410],[5770,2320],[5850,2300],[5935,2340],[5960,2410]],'#5b6b62','#263b38',4)+P([[5770,2320],[5850,2300],[5905,2330],[5820,2370]],'#839184')+P([[6350,2321],[6400,2220],[6500,2200],[6545,2252]],'#647363','#263b38',4),[5720,2190,850,240]);
 const floorY=x=>{let i=floor.findIndex((q,j)=>j<floor.length-1&&x>=q[0]&&x<=floor[j+1][0]);if(i<0)i=0;const a=floor[i],b=floor[i+1];return a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0]);};
 for(const [i,x]of [100,590,4300,6820].entries()){const t=clone(oldTrees[i%oldTrees.length]);if(t){t.id='witness-pine-'+i;t.x=x;t.y=floorY(x);t.scale=[.58,.40,.50,.62][i];s.elements.push(t);}}
 // Surface material lies wholly inside the authored terrain: broad rock/earth planes,
 // local masonry under occupied buildings, and contact shadows instead of black mass.
 let skin='<defs><linearGradient id="witness-earth" x1="0" y1="2300" x2="0" y2="3100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#667164"/><stop offset=".55" stop-color="#3c504a"/><stop offset="1" stop-color="#1b3032"/></linearGradient></defs>';
 const skinLower=floor.slice().reverse().map(([x,y])=>[x,y+210]);skin+=P([...floor,...skinLower],'url(#witness-earth)');
 for(const [left,right,depth]of [[40,480,120],[1810,2260,190],[3530,4020,210],[4130,4520,170],[5340,5630,200],[6200,6490,165]]){const a=floorY(left),b=floorY(right),mid=(left+right)/2;skin+=P([[left,a+7],[right,b+8],[right-45,b+depth*.65],[mid,a+(b-a)*.5+depth],[left+45,a+depth*.45]],'#4d6058')+P([[left,a+7],[mid,a+(b-a)*.5+15],[mid-25,a+(b-a)*.5+depth*.65],[left+45,a+depth*.45]],'#788174');}
 for(const [left,right,y]of [[910,1700,2400],[4580,5260,2150]]){skin+=R(left,y,right-left,9,'#a2a18a')+R(left,y+9,right-left,15,'#263c38');let x=left;for(const w of [180,215,157,239]){const end=Math.min(right,x+w);if(end<=x)break;skin+=P([[x+2,y+28],[end-5,y+24],[end-11,y+93],[x+10,y+88]],'#687566')+line([[x+7,y+30],[end-11,y+28]],'#919982',3);x=end;}}
 art('earth-and-footing-planes',skin,[0,1900,7000,1100]);s.elements.at(-1).layer='front';
 const roofSkin=P([[720,2090],[960,1955],[1320,1900],[1630,1970],[1810,2120],[1750,2100],[1450,2030],[1130,1995],[910,2055],[720,2145]],'#667465')+P([[960,1955],[1320,1900],[1520,1945],[1270,1965],[1110,2015],[910,2055]],'#8a8f76')+P([[1530,2000],[1630,1970],[1810,2120],[1960,2210],[1750,2150]],'#42594f');
 art('burial-roof-earth-planes',roofSkin,[700,1880,1280,350]);s.elements.at(-1).layer='front';
 const sites={'hidden-latch':[780,2393],'investigation-record':[1440,2400],'artisan-resident':[4760,2150],'casting-tally':[4860,2150],'workshop-exit':[6680,2250]};
 for(const m of s.markers){[m.x,m.y]=sites[m.id];}
 for(const u of s.units){if(u.team==='player'){u.x=u.kind==='knight'?260:400;u.y=2300;}if(u.id==='act3-resident'){u.x=4760;u.y=2150;}}
 const positions={
 'record-room-remnants':[[1210,2400],[1610,2400]],
 'casting-yard-tools':[[2540,2700],[3050,2700],[3290,2300]],
 'tally-store-remnants':[[4090,2316],[4380,2218],[5220,2150]],
 'surface-exit-remnants':[[5810,2410],[6250,2356]]};
 for(const group of s.design.act3.encounterPlan.groups){group.members.forEach((m,i)=>{[m.x,m.y]=positions[group.id][i];});}
 const count={};for(const u of s.units.filter(u=>u.team==='enemy')){const id=u.encounterGroup,i=count[id]||0;count[id]=i+1;[u.x,u.y]=positions[id][i];delete u.stageOverrides.honroEncounterSupport;}
 s.design.act3.requiredRoute=[260,780,1050,1440,1770,2020,2250,2540,3050,3370,3700,4020,4500,4760,5260,5620,6100,6500,6680].map(x=>({x,y:floorY(x)}));
 s.design.act3.optionalRoutes=[{id:'open-work-loft-loop',points:[[2050,2400],[2420,2300],[2800,2300],[3430,2300],[3750,2360]].map(([x,y])=>({x,y}))}];
 s.design.act3.mainBuildings=['ancestor-record-cabinet','burnt-workshop-frame','artisan-refuge-house'];s.design.act3.bridges=['work-loft'];
 delete s.design.act3.refinement;delete s.design.act3.koreanTown;
 s.design.act3.artContract={setting:'묘역 기록실과 주민의 불탄 공방',forms:['묘역 비탈','낮은 기록실','열린 작업마당','불탄 골조','작은 화덕','초가 퇴칸'],not:'무명사의 대종 주조 현장 또는 종 거푸집'};
 s.anchors.start={x:260,y:2300};settle(g,p,s);s.initialState.honroStage26PlaceRevision=1;authorEncounters(g,p,s);
 return s;
}
export function applyWitnessPlace(g,input){const p=clone(input),i=p.stages.findIndex(s=>s.id==='stage-26');p.library=p.library.filter(a=>!a.id.startsWith(PREFIX));p.stages[i]=rebuildWitnessPlace(g,p,p.stages[i]);const one=g.HonroTerrainDomain.author({...p,stages:[p.stages[i]]});p.stages[i]=one.stages[0];return g.HonroMaps.finalize(p);}
if(process.argv[1]===fileURLToPath(import.meta.url)){const {runtime}=await import('../../game/tests/helpers.mjs');const g=await runtime({legacyMaps:false}),file=process.argv[2]||'shared/data/campaign.json',p=applyWitnessPlace(g,JSON.parse(await readFile(file,'utf8')));await writeFile(file,JSON.stringify(p,null,2)+'\n');}
