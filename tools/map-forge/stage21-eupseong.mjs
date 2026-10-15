/** Stage21 only. Fresh canonical authoring; no live-battle upgrade. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {asset,put,P,R,line,terrain} from './act3-map-kit.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
export const contour=[[0,2810],[620,2810],[920,2730],[1120,2730],[1320,2640],[1780,2640],[2010,2560],[2890,2560],[3180,2670],[3480,2760],[3750,2760],[4060,2660],[4520,2660],[4770,2530],[4970,2530],[5230,2370],[5500,2370],[5740,2220],[6400,2220]];
export function ground(x){for(let i=1;i<contour.length;i++){const a=contour[i-1],b=contour[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return x<0?2810:2220;}
function hut(p,s,id,x,w,h,{tile=false,wall='#9a9777'}={}){
 const y=ground(x),l=-w/2,r=w/2,e=-h,roof=[[l-22,e+10],[l-6,e-28],[-w*.22,e-84],[w*.23,e-79],[r+8,e-27],[r+25,e+14],[r-10,e+31],[l+4,e+28]];
 let art=R(l,-h,w,h,wall)+R(r-47,e,47,h,'#686e59')+R(l,-18,w,18,'#646f65')+R(l+20,e+27,15,h-45,'#5b5544')+R(r-34,e+27,13,h-45,'#5b5544');
 art+=R(-32,-125,64,107,'#3b4743')+R(-26,-117,52,96,'#675e45')+line([[-1,-115],[-1,-23]],'#99866a',3);
 for(const a of [l+55,r-110])art+=R(a,-126,62,68,'#444d40')+R(a+6,-120,50,56,'#b5af8b')+line([[a+31,-120],[a+31,-64]],'#6b6650',3);
 art+=P(roof,tile?'#4d6260':'#928969','#263c3c',4)+P([[l-10,e+3],[-w*.2,e-65],[w*.22,e-61],[r+9,e+5],[r-12,e+17],[l+8,e+16]],tile?'#72817a':'#b1a27b');
 if(!tile)for(const t of [.18,.42,.67,.85]){const xx=l+w*t;art+=line([[xx,e-52+Math.abs(t-.5)*70],[xx-7,e+20]],'#756d51',3);}
 const a=asset('eup21:'+id,id,art,[],[l-30,e-95,w+60,h+100],'wood');a.params.rearOnly=true;a.oneWay=true;put(p,s,a,id,x,y);
 return {x,y,roofY:y-h-70};
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
 let gate=P([[2040,2560],[2040,2250],[2090,2200],[2460,2200],[2510,2250],[2510,2560],[2420,2560],[2420,2440],[2370,2375],[2190,2375],[2130,2440],[2130,2560]],'#7b8170','#263c3c',5);
 gate+=P([[2040,2250],[2090,2200],[2460,2200],[2510,2250],[2485,2280],[2070,2280]],'#aaa88a')+R(2040,2538,90,22,'#606f63')+R(2420,2538,90,22,'#606f63');
 for(let yy=2300;yy<2550;yy+=72){gate+=line([[2045,yy],[2120,yy]],'#515f55',3)+line([[2430,yy],[2505,yy]],'#515f55',3);}
 gate+=R(2100,2050,350,145,'#6b7359')+R(2115,2060,320,18,'#a39d77');for(const x of [2115,2220,2330,2430])gate+=R(x,2068,12,132,'#604f3d');
 gate+=P([[2055,2055],[2120,2023],[2220,1980],[2340,1980],[2440,2023],[2490,2055],[2465,2070],[2078,2070]],'#425c5b','#263c3c',4)+P([[2090,2044],[2225,1993],[2337,1993],[2460,2044]],'#75837b')+R(2250,2087,48,30,'#344d48');
 put(p,s,asset('eup21:gate','두꺼운 석축과 낮은 단층 문루',gate,[crown],[2010,1960,530,610],'stone'),'gate',0,0);
 // Grounded rear embankment ends beside the gate, never an endless elevated highway.
 let earth=P([[2490,2270],[2630,2350],[2780,2460],[2910,2565],[2490,2560]],'#68725b')+line([[2490,2270],[2630,2350],[2780,2460],[2910,2565]],'#a09f7a',5);
 put(p,s,asset('eup21:inner-earth','성벽 뒤 흙비탈',earth,[],[2490,2270,430,310],'earth'),'inner-earth',0,0);
 for(const row of [['outside-stall',690,390,155,{}],['cloth-shelter',1470,430,170,{}],['inner-home',3400,380,165,{}],['potter-home',3970,430,190,{}],['stable',4500,400,170,{}],['office-entry',5400,470,230,{tile:true}],['office-watch',5970,350,190,{tile:true}]])hut(p,s,...row);
 for(const [id,x,kind]of [['entry-jars',990,'pots'],['shelter-wood',1830,'wood'],['inner-jars',3650,'pots'],['market-wood',4270,'wood'],['office-jars',5650,'pots']])prop(p,s,id,x,kind);
 // Low rear courtyard walls sit behind actors; tactical cover is the continuous ground contour.
 for(const [id,x,w,h]of [['rescue-cover',1135,110,90],['street-cover',4240,120,95],['office-cover',5050,95,105]]){const y=ground(x),poly=[[x-w,y],[x-w/2,y-h],[x+w/2,y-h],[x+w,y]];put(p,s,asset('eup21:'+id,id,P(poly,'#847e60','#293f3c',3)+R(x-w/2-5,y-h-7,w+10,12,'#aaa17b'),[],[x-w/2-6,y-h-8,w+12,h+10]),id,0,0);}
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
