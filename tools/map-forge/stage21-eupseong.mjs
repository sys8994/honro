/** Stage21 only. Fresh canonical authoring; no live-battle upgrade. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {asset,put,P,R,line,terrain} from './act3-map-kit.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
export const contour=[[0,2810],[620,2810],[920,2730],[1120,2730],[1320,2640],[1780,2640],[2010,2560],[2890,2560],[3180,2670],[3480,2760],[3750,2760],[4060,2660],[4520,2660],[4770,2530],[4970,2530],[5230,2370],[5500,2370],[5740,2220],[6400,2220]];
export function ground(x){for(let i=1;i<contour.length;i++){const a=contour[i-1],b=contour[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return x<0?2810:2220;}
function hut(p,s,id,x,w,h,{tile=false,wall='#9a9777'}={}){
 const y=ground(x),l=-w/2,r=w/2,e=-h,open=id==='stable',awn=id==='outside-stall';
 let art=R(l,-h,w,h,wall)+P([[r-65,e+15],[r,e+24],[r,0],[r-65,-8]],'#68715b')+R(l,-18,w,18,'#667668')+R(l-9,-14,w+18,10,'#a1a28a');
 art+=P([[l+22,e+35],[l+w*.48,e+41],[l+w*.39,e+76],[l+29,e+63]],'#b3ad87')+P([[r-97,-71],[r-20,-80],[r-20,-24],[r-83,-24]],'#8a8a6c');
 if(open){art+=R(l+19,e+22,w-60,h-41,'#344a43')+R(l+32,e+30,w-81,24,'#52634e');for(const xx of [l+18,l+w*.48,r-40])art+=R(xx,e+17,15,h-24,'#695c43')+R(xx+3,e+22,4,h-32,'#a18e63');art+=R(l+40,-62,84,44,'#88774f')+R(l+35,-70,95,9,'#b7a273')+R(r-130,-98,68,80,'#786747')+R(r-135,-107,78,10,'#aa9468');}
 else {const door=tile?-w*.19:-26;art+=R(door-9,-148,89,132,'#4a5142')+R(door,-141,71,122,'#706448')+R(door+4,-136,6,112,'#9a8560')+R(door+34,-138,5,117,'#484f3d')+R(door-12,-151,96,10,'#a3946b');
 for(const xx of [l+40,r-111]){if(xx+70>door-5&&xx<door+80)continue;art+=R(xx-6,-137,78,88,'#605e47')+R(xx,-131,66,76,'#bcb592')+R(xx-9,-48,84,8,'#655e45');for(let j=1;j<4;j++)art+=R(xx+j*15,-127,3,69,'#74735a');art+=R(xx+3,-98,59,4,'#74735a');}}
 const roof=tile?`M${l-29} ${e+5} Q${l+25} ${e+12} ${-w*.23} ${e-60} L${w*.2} ${e-62} Q${r-26} ${e+5} ${r+29} ${e+3} L${r+18} ${e+19} Q0 ${e+11} ${l-18} ${e+21}Z`:`M${l-24} ${e+13} Q${l-8} ${e-49} ${-w*.2} ${e-75} Q${w*.05} ${e-97} ${w*.27} ${e-65} Q${r+8} ${e-36} ${r+26} ${e+16} Q${w*.15} ${e+31} ${l-24} ${e+13}Z`;
 art+=`<path d="${roof}" fill="${tile?'#425e5d':'#9a8c65'}"/>`;
 art+=tile?P([[l-12,e+4],[-w*.22,e-47],[w*.21,e-47],[r+13,e+4],[r-8,e+10],[l+9,e+11]],'#71837b'):P([[l-7,e+1],[-w*.2,e-62],[w*.23,e-53],[r+7,e+5],[r-20,e+13],[l+14,e+11]],'#b7a477');
 if(tile){for(let xx=l+16;xx<r-10;xx+=31){const yy=e-47+Math.abs(xx)/(w/2)*47;art+=P([[xx,yy],[xx+4,yy+1],[xx+13,e+8],[xx+9,e+8]],'#415b58');}art+=R(l-18,e+16,w+36,9,'#8b967d')+R(l+5,e+25,w-10,9,'#465d4a');}
 else {for(let xx=l+10;xx<r;xx+=29){const yy=e-58+Math.abs(xx)/(w/2)*48;art+=P([[xx,yy],[xx+3,yy],[xx-6,e+15],[xx-9,e+14]],'#827853');}art+=P([[l-10,e+14],[0,e+24],[r+13,e+15],[r+7,e+24],[0,e+33],[l-8,e+24]],'#756d50');}
 if(awn){art+=P([[l-18,-114],[r+26,-109],[r+69,-66],[l-40,-77]],'#797d5b')+R(l-32,-77,8,77,'#645c43')+R(r+51,-67,8,67,'#645c43')+R(-73,-49,146,36,'#8e7851')+R(-79,-54,159,8,'#b5a174');}
 const a=asset('eup21:'+id,id,art,[],[l-46,e-105,w+125,h+111],'wood');a.params.rearOnly=true;put(p,s,a,id,x,y);return{x,y};
}
function prop(p,s,id,x,kind='pots'){
 const y=ground(x);let art='';if(kind==='wood'){for(let i=0;i<5;i++)art+=R(-50+i*12,-15-i%2*19,65,13,i%2?'#8b7954':'#665d45');}else for(const [xx,sz]of [[-35,30],[8,42],[53,23]])art+=`<path d="M${xx-sz*.5} -${sz*1.4} Q${xx-sz} -${sz} ${xx-sz*.8} -8 Q${xx} 8 ${xx+sz*.8} -8 Q${xx+sz} -${sz} ${xx+sz*.5} -${sz*1.4} Z" fill="#675849" stroke="#253b3a" stroke-width="3"/>`+R(xx-sz*.55,-sz*1.47,sz*1.1,6,'#90806a');
 put(p,s,asset('eup21:'+id,id,art,[],[-100,-100,210,105]),id,x,y,1,'prop');
}
export function authorStage21Eupseong(project,g){
 const p=clone(project),s=p.stages[20],old=clone(s);if(s.metadata.stageId!==21)throw Error('Stage21 required');
 p.library=p.library.filter(a=>!a.id.startsWith('eup21:'));s.elements=[];s.terrains=[];s.materials=[];
 terrain(s,'a3-foundation',[...contour,[6400,3200],[0,3200]],'earth');
 // The actual cutaway gate crown is solid. Its visible underside leaves a 195-unit passage.
 const crown=[[2070,2240],[2460,2240],[2460,2365],[2420,2365],[2380,2335],[2170,2335],[2120,2365],[2070,2365]];
 // Short wall access stairs are open-backed, shown on exactly their collision top.
 const walks=[['west-wall-step',[[1770,2640],[1900,2500],[1980,2500]],true],['west-wall-stair',[[1980,2370],[2040,2370]],true],['east-wall-return',[[2460,2240],[2580,2380],[2660,2380],[2830,2560]],true]];
 for(const[id,top,oneWay]of walks){const poly=[...top,...top.slice().reverse().map(([x,y])=>[x,y+22])];terrain(s,'eup21-'+id,poly,'stone');s.terrains.at(-1).oneWay=oneWay;}
 // Drawn rear-plane masonry is explicitly behind the open traversable arch section.
 let gate=P([[1890,2500],[1980,2500],[1980,2370],[2040,2370],[2040,2560],[1890,2602]],'#687260')+P([[2040,2560],[2040,2250],[2090,2240],[2460,2240],[2510,2250],[2510,2560],[2420,2560],[2420,2440],[2370,2375],[2190,2375],[2130,2440],[2130,2560]],'#7b8170','#263c3c',5);
 gate+=P([[2040,2250],[2090,2240],[2460,2240],[2510,2250],[2485,2270],[2070,2270]],'#aaa88a')+R(2040,2538,90,22,'#606f63')+R(2420,2538,90,22,'#606f63');
 for(let yy=2300;yy<2550;yy+=72){gate+=line([[2045,yy],[2120,yy]],'#515f55',3)+line([[2430,yy],[2505,yy]],'#515f55',3);}
 for(const [xx,yy,ww]of [[2051,2290,65],[2050,2370,59],[2050,2450,65],[2434,2290,60],[2440,2374,58],[2430,2450,66],[2130,2285,93],[2240,2285,105],[2354,2285,79]])gate+=P([[xx,yy],[xx+ww,yy-3],[xx+ww-4,yy+55],[xx+3,yy+60]],'#8c907b')+R(xx+6,yy+5,ww-13,5,'#a3a58b');
 gate+=R(2100,2050,350,190,'#6b7359')+R(2115,2060,320,18,'#a39d77');for(const x of [2115,2220,2330,2430])gate+=R(x,2068,12,172,'#604f3d');
 gate+=P([[2055,2055],[2120,2023],[2220,1980],[2340,1980],[2440,2023],[2490,2055],[2465,2070],[2078,2070]],'#425c5b','#263c3c',4)+P([[2090,2044],[2225,1993],[2337,1993],[2460,2044]],'#75837b')+R(2250,2087,48,30,'#344d48');
 put(p,s,asset('eup21:gate','두꺼운 석축과 낮은 단층 문루',gate,[crown],[2010,1960,530,610],'stone'),'gate',0,0);
 // Grounded rear embankment ends beside the gate, never an endless elevated highway.
 let earth=P([[2490,2270],[2630,2350],[2780,2460],[2910,2565],[2490,2560]],'#68725b')+line([[2490,2270],[2630,2350],[2780,2460],[2910,2565]],'#a09f7a',5);
 put(p,s,asset('eup21:inner-earth','성벽 뒤 흙비탈',earth,[],[2490,2270,430,310],'earth'),'inner-earth',0,0);
 for(const row of [['outside-stall',440,390,155,{}],['cloth-shelter',1550,400,170,{}],['inner-home',3615,270,165,{}],['potter-home',4250,380,190,{}],['stable',4870,200,170,{}],['office-entry',5365,270,230,{tile:true}],['office-watch',5970,350,190,{tile:true}]])hut(p,s,...row);
 for(const [id,x,kind]of [['entry-jars',990,'pots'],['shelter-wood',1830,'wood'],['inner-jars',3650,'pots'],['market-wood',4270,'wood'],['office-jars',5650,'pots']])prop(p,s,id,x,kind);
 // Low rear courtyard walls sit behind actors; tactical cover is the continuous ground contour.
 for(const [id,x,w,h]of [['rescue-yard-wall',1135,110,65],['street-yard-wall',4240,120,65],['office-yard-wall',5050,95,65]]){const y=ground(x),poly=[[x-w,y],[x-w/2,y-h],[x+w/2,y-h],[x+w,y]];put(p,s,asset('eup21:'+id,id,P(poly,'#847e60','#293f3c',3)+R(x-w/2-5,y-h-7,w+10,12,'#aaa17b'),[],[x-w/2-6,y-h-8,w+12,h+10]),id,0,0);}
 for(const u of s.units){u.y=ground(u.x)-(u.kind==='lantern'?32:0);if(u.stageOverrides)u.stageOverrides.honroEncounterSupport='a3-foundation';}
 const air=s.units.filter(u=>u.encounterGroup==='gate-watch'&&u.kind==='lantern');Object.assign(air[0],{x:2200,y:2208});Object.assign(air[1],{x:2780,y:2440});air[0].stageOverrides.honroEncounterSupport='gate:collision:0';air[1].stageOverrides.honroEncounterSupport='eup21-east-wall-return';
 // Keep stable IDs, counts, warning text and trigger/XP contracts; only entry poses follow the new contour.
 for(const ev of s.events){for(const a of [...(ev.action.actions||[]),...(ev.honroDensityAlternatives||[]).flat()]){a.y=ground(a.x);a.support='a3-foundation';}ev.entry.y=ground(ev.entry.x);}
 for(const m of s.markers)m.y=ground(m.x);s.anchors={spawn:{x:240,y:ground(240)},start:{x:240,y:ground(240)},exit:{x:6140,y:ground(6140)}};
 s.initialState.honroStage21EupseongRevision=1;
 let cart=R(-115,-78,210,17,'#8f7955')+line([[-110,-140],[-100,-75],[90,-75],[106,-134]],'#655b45',10)+line([[80,-80],[195,-24]],'#746244',9);for(const x of [-74,62])cart+=P(Array.from({length:12},(_,i)=>[x+31*Math.cos(i*Math.PI/6),-31+31*Math.sin(i*Math.PI/6)]),'#575847','#263c3c',5)+P(Array.from({length:12},(_,i)=>[x+18*Math.cos(i*Math.PI/6),-31+18*Math.sin(i*Math.PI/6)]),'#81765b');put(p,s,asset('eup21:cart','기울어진 장터 수레',cart,[],[-130,-155,340,160]),'rescue-cart',1550,ground(1550),1,'back');
 const main=contour.filter(([x])=>x>240&&x<6140).map(([x,y])=>({x,y,support:'a3-foundation'}));s.design.act3.requiredRoute=[s.anchors.start,...main,s.anchors.exit];s.design.act3.mainBuildings=s.elements.filter(e=>/home|shelter|stable|office|gate$/.test(e.id)).map(e=>e.id);s.design.act3.bridges=[];s.design.act3.optionalRoutes=[{id:'short-wall-cover',points:[{x:1770,y:2640},{x:1900,y:2500},{x:1940,y:2500,jumpTo:{x:2000,support:'eup21-west-wall-stair',speed:.3}},{x:2000,y:2370,jumpTo:{x:2110,support:'gate:collision:0',speed:.3}},{x:2110,y:2240},{x:2400,y:2240},{x:2580,y:2380},{x:2660,y:2380},{x:2830,y:2560}]}];delete s.design.cityTactical;
 s.design.eupseong={revision:1,places:['outer-market-rescue','thick-gate-and-defence','low-living-lanes','ascending-office'],scope:'Stage21 fresh entries only; existing live snapshots retain their own map. Story, objectives, initial budget and finite contribution IDs unchanged.'};
 s.environment.placements=s.environment.placements.filter(e=>!e.id.includes('rear-city-gate')); // remove the misleading second monumental gate
 delete s.terrainBounds;delete s.terrainDomainVersion;
 const authored=g.HonroTerrainDomain.author(p);if(JSON.stringify(authored.stages.filter(v=>v.id!=='stage-21'))!==JSON.stringify(project.stages.filter(v=>v.id!=='stage-21')))throw Error('Unrelated stage changed');return authored;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const {runtime}=await import('../../game/tests/helpers.mjs');const g=await runtime({legacyMaps:false}),p=authorStage21Eupseong(JSON.parse(await readFile('shared/data/campaign.json','utf8')),g);await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');console.log('Authored only Stage21 eupseong');}
