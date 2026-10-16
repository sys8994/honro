/** Stage21 only. Fresh canonical authoring; no live-battle upgrade. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {asset,put,P,R,line,terrain} from './act3-map-kit.mjs';
import {gateArt,houseArt,officeArt,foundationArt,tiledRoof,timberBay} from './stage21-eupseong-art.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
export const contour=[[0,2810],[620,2810],[920,2730],[1120,2730],[1320,2640],[1780,2640],[2010,2560],[2890,2560],[3180,2670],[3480,2760],[3750,2760],[4060,2660],[4520,2660],[4770,2530],[4970,2530],[5230,2370],[5500,2370],[5740,2220],[6400,2220]];
export function ground(x){for(let i=1;i<contour.length;i++){const a=contour[i-1],b=contour[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return x<0?2810:2220;}
// Sample the same quadratic silhouette as the editable roof art (world collision).
function roofTop(x,y,w,rise,tile=false){const l=x-w/2,r=x+w/2,points=[];let a=tile?[l-35,y-17]:[l-23,y];points.push(a);const curves=tile?[[[l+30,y-10],[x-w*.22,y-rise+9]],[[x,y-rise-4],[x+w*.22,y-rise+9]],[[r-18,y-8],[r+35,y-17]]]:[[[l-12,y-rise*.75],[x-w*.18,y-rise]],[[x+w*.08,y-rise-21],[x+w*.27,y-rise*.76]],[[r+10,y-39],[r+25,y+2]]];for(const [c,b]of curves){for(let i=1;i<=8;i++){const t=i/8;points.push([a[0]*(1-t)**2+2*c[0]*t*(1-t)+b[0]*t*t,a[1]*(1-t)**2+2*c[1]*t*(1-t)+b[1]*t*t]);}a=b;}return points;}
function roof(p,s,id,x,y,w,rise,tile=false){const top=roofTop(x,y,w,rise,tile);terrain(s,'eup21-'+id+'-roof',[...top,...top.slice().reverse().map(([x,y])=>[x,y+15])],'wood');s.terrains.at(-1).oneWay=true;}
function hut(p,s,id,x,w,h,{kind='home',y=ground(x)}={}){const a=asset('eup21:'+id,id,houseArt(w,h,kind),[],[-w/2-60,-h-110,w+130,h+155],'wood');a.params.rearOnly=true;put(p,s,a,id,x,y);roof(p,s,id,x,y-h,w,kind==='stable'?65:85);}

function prop(p,s,id,x,kind='pots'){
 const y=ground(x);let art='';if(kind==='wood'){for(let i=0;i<5;i++)art+=R(-50+i*12,-15-i%2*19,65,13,i%2?'#8b7954':'#665d45');}else for(const [xx,sz]of [[-35,30],[8,42],[53,23]])art+=`<path d="M${xx-sz*.5} -${sz*1.4} Q${xx-sz} -${sz} ${xx-sz*.8} -8 Q${xx} 8 ${xx+sz*.8} -8 Q${xx+sz} -${sz} ${xx+sz*.5} -${sz*1.4} Z" fill="#675849" stroke="#253b3a" stroke-width="3"/>`+R(xx-sz*.55,-sz*1.47,sz*1.1,6,'#90806a');
 put(p,s,asset('eup21:'+id,id,art,[],[-100,-100,210,105]),id,x,y,1,'prop');
}
export function authorStage21Eupseong(project,g){
 const p=clone(project),s=p.stages[20],old=clone(s);if(s.metadata.stageId!==21)throw Error('Stage21 required');
 for(const e of s.environment.placements)if(e.assetId.startsWith('eup21:backdrop:'))e.assetId=e.assetId.slice('eup21:backdrop:'.length);
 p.library=p.library.filter(a=>!a.id.startsWith('eup21:'));s.elements=[];s.terrains=[];s.materials=[];
 terrain(s,'a3-foundation',[...contour,[6400,3200],[0,3200]],'earth');
 // The actual cutaway gate crown is solid. Its visible underside leaves a 195-unit passage.
 const crown=[[2070,2240],[2460,2240],[2460,2365],[2420,2365],[2380,2335],[2170,2335],[2120,2365],[2070,2365]];
 // Short wall access stairs are open-backed, shown on exactly their collision top.
 const walks=[['west-wall-step',[[1770,2640],[1900,2500],[1980,2500]],true],['west-wall-stair',[[1980,2370],[2040,2370]],true],['east-wall-return',[[2460,2240],[2580,2380],[2660,2380],[2830,2560]],true]];
 for(const[id,top,oneWay]of walks){const poly=[...top,...top.slice().reverse().map(([x,y])=>[x,y+22])];terrain(s,'eup21-'+id,poly,'stone');s.terrains.at(-1).oneWay=oneWay;}
 // Drawn rear-plane masonry is explicitly behind the open traversable arch section.
 const gate=gateArt();put(p,s,asset('eup21:gate','쐐기돌 홍예·두꺼운 석축·삼칸 목조 문루',gate,[crown],[1750,1940,820,640],'stone'),'gate',0,0);
 roof(p,s,'gate',2277,2049,411,78,true);
 // Grounded rear embankment ends beside the gate, never an endless elevated highway.
 let earth=P([[2490,2270],[2630,2350],[2780,2460],[2910,2565],[2490,2560]],'#68725b')+line([[2490,2270],[2630,2350],[2780,2460],[2910,2565]],'#a09f7a',5);
 put(p,s,asset('eup21:inner-earth','성벽 뒤 흙비탈',earth,[],[2490,2270,430,310],'earth'),'inner-earth',0,0);
 // Two disconnected upper sites: the lower street remains open below their real slabs.
 const localSteps=[['gate-roof-step',[[2025,2130],[2110,2130]]],['market-west-step',[[3960,2550],[4040,2550]]],['market-east-step',[[4490,2540],[4560,2540]]],['office-roof-step',[[5135,2020],[5205,2020]]],['office-west-step',[[5070,2295],[5140,2295]]],['office-east-step',[[5580,2240],[5640,2240]]]];
 for(const[id,top]of localSteps){terrain(s,'eup21-'+id,[...top,...top.slice().reverse().map(([x,y])=>[x,y+22])],'stone');s.terrains.at(-1).oneWay=true;
 const [a,b]=top,foot=id==='gate-roof-step'?2240:id==='office-roof-step'?2130:Math.max(ground(a[0]),ground(b[0]));const art=P([[a[0],a[1]],[b[0],b[1]],[b[0],b[1]+22],[a[0],a[1]+22]],'#8d9176')+R(a[0]+9,a[1]+22,15,foot-a[1]-22,'#4b6355')+R(b[0]-24,b[1]+22,15,foot-b[1]-22,'#4b6355')+line([a,b],'#b7b696',5);put(p,s,asset('eup21:'+id,id,art,[],[a[0],a[1],b[0]-a[0],foot-a[1]+10]),id,0,0);}
 const marketTop=[[4050,2420],[4490,2420],[4490,2464],[4050,2464]];
 let loading=P(marketTop,'#75694c')+R(4050,2420,440,9,'#b4a276')+R(4050,2452,440,12,'#4a5340');for(const x of [4105,4220,4335,4425])loading+=R(x,2464,17,196,'#655f45')+line([[x+8,2471],[x+77,2538]],'#8c7854',11)+R(x-6,2650,30,10,'#9e9c7f');
 loading+=R(4102,2530,333,13,'#56634b');for(let x=4110;x<4490;x+=72)loading+=line([[x,2430],[x,2451]],'#413f32',3);
 put(p,s,asset('eup21:loading-deck','시장 하역 마루와 아래 통로',loading,[marketTop],[4040,2420,470,255],'wood'),'loading-deck',0,0);
 const officeTop=[[5190,2130],[5550,2130],[5550,2174],[5190,2174]];let plinth=P(officeTop,'#7d8b79')+R(5184,2130,372,11,'#b7b79a')+R(5190,2163,360,11,'#445d50');
 // A broad rear retaining face puts the ordinary lane beside the raised office terrace.
 plinth+=P([[5190,2174],[5550,2174],[5550,ground(5550)],[5190,ground(5190)]],'#657963')+P([[5520,2174],[5550,2174],[5572,ground(5550)-16],[5550,ground(5550)]],'#445e4c');
 for(let row=0;row<4;row++)for(let j=0;j<4;j++){const x=5197+j*86+(row%2?7:0),y=2181+row*43;plinth+=P([[x,y],[x+75,y-2],[x+79,y+32],[x+3,y+37]],row%2?'#7a886d':'#879177')+line([[x+5,y+4],[x+67,y+2]],'#a1a68a',3);}
 plinth+=R(5189,2172,362,10,'#465e4c');put(p,s,asset('eup21:office-plinth','관아 석조 기단·앞쪽 낮은 통과 길',plinth,[officeTop],[5180,2130,400,310],'stone'),'office-plinth',0,0);
 const crate=[[4290,2340],[4360,2340],[4360,2420],[4290,2420]];put(p,s,asset('eup21:deck-crate','마루 위 실제 화물 엄폐',P(crate,'#756747','#3d4a3c',3)+R(4286,2337,78,10,'#a49467')+line([[4295,2353],[4355,2409]],'#b0a070',7)+R(4290,2380,70,7,'#46503b'),[crate],[4285,2335,82,88]),'deck-crate',0,0,1,'prop');
 for(const row of [['outside-stall',440,390,175,{kind:'shop'}],['cloth-shelter',1550,400,190,{}],['inner-home',3590,250,180,{}],['potter-home',4260,340,155,{kind:'workshop',y:2420}],['stable',4870,200,180,{kind:'stable'}],['office-store',5990,350,160,{kind:'workshop'}]])hut(p,s,...row);
 put(p,s,asset('eup21:office-hall','관아 삼칸 집무당·목조 창호',officeArt(),[],[-240,-320,500,335],'wood'),'office-hall',5369,2130);
 roof(p,s,'office-hall',5369,1917,412,84,true);
 // Broad market yard and office courtyard walls have clear rear-plane returns.
 for(const [id,x1,x2]of [['market-yard',3290,3420],['office-court',5630,5900]]){const y1=ground(x1),y2=ground(x2),poly=[[x1,y1],[x1,y1-90],[x2,y2-90],[x2,y2]];let art=P(poly,'#78856a')+line([[x1-7,y1-92],[x2+7,y2-92]],'#a4aa88',11)+line([[x1,y1-62],[x2,y2-62]],'#4e6755',4);for(let xx=x1+28;xx<x2;xx+=61){const yy=y1+(y2-y1)*(xx-x1)/(x2-x1);art+=R(xx,yy-83,10,79,'#63785e');}put(p,s,asset('eup21:'+id,id,art,[],[x1-9,Math.min(y1,y2)-105,x2-x1+18,Math.abs(y1-y2)+115]),id,0,0);}
 for(const [id,x,kind]of [['entry-jars',990,'pots'],['shelter-wood',1830,'wood'],['inner-jars',3650,'pots'],['office-jars',5650,'pots']])prop(p,s,id,x,kind);
 put(p,s,asset('eup21:foundations','지반 단면·석축 받침·시장 배수로',foundationArt(contour,ground),[],[0,2220,6400,1000],'earth'),'foundations',0,0,1,'front');
 for(const u of s.units){u.y=ground(u.x)-(u.kind==='lantern'?32:0);if(u.stageOverrides)u.stageOverrides.honroEncounterSupport='a3-foundation';}
 const air=s.units.filter(u=>u.encounterGroup==='gate-watch'&&u.kind==='lantern');Object.assign(air[0],{x:2200,y:2208});Object.assign(air[1],{x:2780,y:2440});air[0].stageOverrides.honroEncounterSupport='gate:collision:0';air[1].stageOverrides.honroEncounterSupport='eup21-east-wall-return';
 for(const [id,x,y,support]of [['a3-21-market-pack-2',4180,2388,'loading-deck:collision:0'],['a3-21-office-rearguard-0',5310,2130,'office-plinth:collision:0'],['a3-21-office-rearguard-2',5480,2098,'office-plinth:collision:0']]){const u=s.units.find(v=>v.id===id);Object.assign(u,{x,y});u.stageOverrides.honroEncounterSupport=support;}
 // Keep stable IDs, counts, warning text and trigger/XP contracts; only entry poses follow the new contour.
 for(const ev of s.events){for(const a of [...(ev.action.actions||[]),...(ev.honroDensityAlternatives||[]).flat()]){a.y=ground(a.x);a.support='a3-foundation';}ev.entry.y=ground(ev.entry.x);}
 for(const m of s.markers)m.y=ground(m.x);s.anchors={spawn:{x:240,y:ground(240)},start:{x:240,y:ground(240)},exit:{x:6140,y:ground(6140)}};
 s.initialState.honroStage21EupseongRevision=1;
 let cart=R(-115,-78,210,17,'#8f7955')+line([[-110,-140],[-100,-75],[90,-75],[106,-134]],'#655b45',10)+line([[80,-80],[195,-24]],'#746244',9);for(const x of [-74,62])cart+=P(Array.from({length:12},(_,i)=>[x+31*Math.cos(i*Math.PI/6),-31+31*Math.sin(i*Math.PI/6)]),'#575847','#263c3c',5)+P(Array.from({length:12},(_,i)=>[x+18*Math.cos(i*Math.PI/6),-31+18*Math.sin(i*Math.PI/6)]),'#81765b');put(p,s,asset('eup21:cart','기울어진 장터 수레',cart,[],[-130,-155,340,160]),'rescue-cart',1550,ground(1550),1,'back');
 const main=contour.filter(([x])=>x>240&&x<6140).map(([x,y])=>({x,y,support:'a3-foundation'}));s.design.act3.requiredRoute=[s.anchors.start,...main,s.anchors.exit];s.design.act3.mainBuildings=s.elements.filter(e=>/home|shelter|stable|office|gate$/.test(e.id)).map(e=>e.id);s.design.act3.bridges=[];s.design.act3.optionalRoutes=[{id:'short-wall-cover',points:[{x:1770,y:2640},{x:1900,y:2500},{x:1940,y:2500,jumpTo:{x:2000,support:'eup21-west-wall-stair',speed:.3}},{x:2000,y:2370,jumpTo:{x:2110,support:'gate:collision:0',speed:.3}},{x:2110,y:2240},{x:2400,y:2240},{x:2580,y:2380},{x:2660,y:2380},{x:2830,y:2560}]}];delete s.design.cityTactical;
 s.design.act3.optionalRoutes.push({id:'market-loading-choice',points:[{x:3910,y:ground(3910),jumpTo:{x:3990,support:'eup21-market-west-step',speed:.35}},{x:4020,y:2550,jumpTo:{x:4120,support:'loading-deck:collision:0',speed:.35}},{x:4180,y:2420}]},{id:'office-side-choice',points:[{x:5030,y:ground(5030),jumpTo:{x:5100,support:'eup21-office-west-step',speed:.35}},{x:5130,y:2295,jumpTo:{x:5220,support:'office-plinth:collision:0',speed:.35}},{x:5500,y:2130}]});
 s.design.eupseong={revision:2,places:['outer-market-rescue','thick-gate-and-defence','low-living-lanes','ascending-office'],scope:'Stage21 fresh entries only; existing live snapshots retain their own map. Story, objectives, initial budget and finite contribution IDs unchanged.'};
 s.environment.placements=s.environment.placements.filter(e=>!e.id.includes('rear-city-gate')); // remove the misleading second monumental gate
 // Stage-owned cloned scenic colors reduce rear architecture contrast without altering any other chapter.
 const mix=c=>{if(!/^#[0-9a-f]{6}$/i.test(c||''))return c;const t='#68766b';return '#'+[1,3,5].map(i=>Math.round(parseInt(c.slice(i,i+2),16)*.38+parseInt(t.slice(i,i+2),16)*.62).toString(16).padStart(2,'0')).join('');};
 const recolor=n=>{if(!n||typeof n!=='object')return;for(const k of ['fill','stroke'])if(typeof n[k]==='string')n[k]=mix(n[k]);for(const v of Object.values(n))if(v&&typeof v==='object')Array.isArray(v)?v.forEach(recolor):recolor(v);};
 const scenic=new Map();for(const e of s.environment.placements){if(e.assetId.includes('bank'))continue;let a=scenic.get(e.assetId);if(!a){const original=p.library.find(a=>a.id===e.assetId);if(!original)continue;a=clone(original);a.id='eup21:backdrop:'+original.id;recolor(a.vector);p.library.push(a);scenic.set(original.id,a);}e.assetId=a.id;}
 delete s.terrainBounds;delete s.terrainDomainVersion;
 const authored=g.HonroTerrainDomain.author(p);if(JSON.stringify(authored.stages.filter(v=>v.id!=='stage-21'))!==JSON.stringify(project.stages.filter(v=>v.id!=='stage-21')))throw Error('Unrelated stage changed');return authored;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const {runtime}=await import('../../game/tests/helpers.mjs');const g=await runtime({legacyMaps:false}),p=authorStage21Eupseong(JSON.parse(await readFile('shared/data/campaign.json','utf8')),g);await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');console.log('Authored only Stage21 eupseong');}
