/** Fresh Stage24 only. Ancestral compound with a sunken garden and two real departure courts. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {asset,put,P,R,line,terrain,pool} from './act3-map-kit.mjs';
import {koreanTownBuilding,koreanCourtyardWall} from '../environment/korean-town-art.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
export const PROFILE=[[0,2700],[1050,2700],[1390,2620],[1720,2460],[2670,2460],[3020,2630],[3300,2850],[3900,2850],[4340,2570],[4700,2260],[5220,2260],[5590,2720],[6040,2720],[6410,2440],[7000,2440]];
export function ground(x){for(let i=1;i<PROFILE.length;i++){const a=PROFILE[i-1],b=PROFILE[i];if(x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return PROFILE.at(-1)[1];}
const prefix='family24:';
export function authorFamily24(project,g){
 const p=clone(project),s=p.stages.find(s=>s.metadata.stageId===24);
 const original=clone(s),oldAssets=new Set(s.elements.map(e=>e.assetId));
 s.elements=[];s.terrains=[];s.materials=[];s.width=7000;s.height=3300;
 delete s.design.cityTactical;delete s.design.space;delete s.terrainDomain;delete s.terrainBounds;delete s.terrainDomainVersion;delete s.playBounds;
 p.library=p.library.filter(a=>!a.id.startsWith(prefix));
 terrain(s,'a3-foundation',[...PROFILE,[7000,3300],[0,3300]],'earth');
 const rear=(id,svg,bounds)=>{const a=asset(prefix+id,id,svg,[],bounds);a.params.rearOnly=true;put(p,s,a,id,0,0);};
 const building=(id,x,w,role='house',roofType='gable',variant=1)=>{const a=koreanTownBuilding(prefix+id,{width:w,role,roofType,variant});a.oneWay=true;put(p,s,a,id,x,ground(x));};
 building('outer-servant-wing',680,600,'house','gable',2);
 building('ancestral-family-hall',2170,900,'office','hip');
 building('garden-study',3580,480,'pavilion','hip');
 building('family-ancestral-shrine',4920,600,'archive','hip');
 building('ground-record-entry',6610,430,'storehouse');
 // Low side wings make a compound rather than a row of unrelated houses. Their
 // pitched roofs join the hall's local approach, with open earth between courts.
 building('hall-west-side-wing',1450,360,'house','gable',2);
 building('hall-east-side-wing',2690,240,'house','gable',3);
 // Restrained rear walls frame the courts. Actual traversable earth is never covered by a fake building base.
 for(const [id,x,w]of [['outer-wall',900,230],['inner-wall',2570,160],['shrine-enclosure',5110,180]])put(p,s,koreanCourtyardWall(prefix+id,{width:w,height:100,cap:'tile'}),id,x,ground(x));
 // Low side eaves give the broad hall roof two ordinary-jump access/return points.
 // The roof itself uses the exact sampled Korean roof silhouette, one-way like existing buildings.
 for(const [id,x1,x2,y]of [['hall-west-step',1615,1780,2350],['hall-east-step',2590,2760,2325]]){
  const slab=[[x1,y],[x2,y],[x2,y+24],[x1,y+24]];terrain(s,'family24-'+id,slab,'wood');s.terrains.at(-1).oneWay=true;
  rear(id+'-bearing',P(slab,'#675840','#1d302d',3)+line([[x1,y],[x2,y]],'#b19e76',5)+R(x1+18,y+24,16,Math.max(0,ground(x1+18)-y-24),'#4f4b38')+R(x2-30,y+24,16,Math.max(0,ground(x2-30)-y-24),'#4f4b38'),[x1,y,x2-x1,240]);
 }
 // Shrine porches are deliberately east of the sealed doorway. Both are real
 // one-way awnings, borne by posts; the original gate and ground approach stay open.
 for(const [id,x1,x2,y]of [['shrine-west-porch',4520,4690,2205],['shrine-east-porch',5190,5350,2175]]){
  const slab=[[x1,y],[x2,y],[x2,y+20],[x1,y+20]];
  terrain(s,'family24-'+id,slab,'wood');s.terrains.at(-1).oneWay=true;
  rear(id+'-bearing',P(slab,'#63583f')+line([[x1,y],[x2,y]],'#a69672',4)+R(x1+22,y+20,15,Math.max(0,ground(x1+22)-y-20),'#594c36')+R(x2-32,y+20,15,Math.max(0,ground(x2-32)-y-20),'#594c36')+line([[x1+28,y+76],[x1+86,y+23]],'#8e7a53',8),[x1,y,x2-x1,Math.max(260,ground(x2)-y)]);
 }
 // One short garden flank route. Both ends return to the courtyard with ordinary movement.
 const gallery=[[2860,2440],[3120,2510],[3960,2510],[4210,2540]],solid=[...gallery,...gallery.slice().reverse().map(([x,y])=>[x,y+30])];
 terrain(s,'family24-garden-gallery',solid,'wood');s.terrains.at(-1).oneWay=true;
 let structure=P(solid,'#665943','#1d302d',4)+line(gallery,'#b7a381',6);
 for(const [x,top]of [[2890,2478],[3135,2540],[3940,2540],[4190,2568]])structure+=R(x-11,top,22,ground(x)-top,'#514c3b')+R(x-6,top,4,ground(x)-top,'#968164');
 rear('garden-gallery-bearing',structure,[2820,2480,1450,400]);
 // The sunken garden is framed by a rear wall and crooked pine, leaving a broad
 // unoccupied centre beneath the gallery. Basin water uses the common live-water
 // material; stone rims and planting remain rear scenery, never fake walk ledges.
 let garden=R(3220,2695,735,155,'#606c58')+P([[3220,2695],[3955,2695],[3970,2711],[3210,2711]],'#354d47')+R(3236,2718,704,85,'#82846b')+P([[3236,2803],[3420,2787],[3660,2800],[3940,2778],[3940,2850],[3236,2850]],'#465c48');
 garden+=P([[3260,2828],[3300,2789],[3380,2784],[3440,2804],[3430,2850],[3268,2850]],'#7b8270')+P([[3270,2821],[3300,2793],[3363,2790],[3338,2816]],'#a1a18a')+P([[3800,2830],[3840,2782],[3914,2772],[3960,2808],[3955,2850],[3805,2850]],'#687763')+P([[3840,2782],[3914,2772],[3945,2805],[3898,2798]],'#969c82');
 garden+=P([[3310,2834],[3370,2810],[3440,2817],[3443,2850],[3300,2850]],'#4f6358')+P([[3720,2820],[3808,2805],[3880,2829],[3880,2850],[3715,2850]],'#647466')+line([[3310,2834],[3370,2810],[3440,2817]],'#a5a18a',7)+line([[3720,2820],[3808,2805],[3880,2829]],'#9d9e85',7);
 rear('recessed-garden-wall-and-stones',garden,[3200,2680,800,180]);
 pool(s,'family24-garden-water-west',3334,3422,2820,2847);s.materials.at(-1).conductive=false;
 pool(s,'family24-garden-water-east',3735,3830,2820,2847);s.materials.at(-1).conductive=false;
 const gardenWall=s.elements.splice(s.elements.findIndex(e=>e.id==='recessed-garden-wall-and-stones'),1)[0];s.elements.unshift(gardenWall);
 // Broad foundation shadows and irregular masonry faces express weight under
 // the compound terraces, all wholly below the existing collision contour.
 let masonry='';for(const [x1,x2,deep]of [[1720,2670,180],[4700,5220,225],[6410,7000,170]]){
  const y=ground(x1);masonry+=P([[x1,y+16],[x2,y+16],[x2-20,y+deep],[x1+32,y+deep-15]],'#3b5148');
  for(const [a,b,d,c]of [[0,.28,.62,'#7a7e68'],[.29,.63,.86,'#5d6c59'],[.64,1,.72,'#68745f']])masonry+=P([[x1+(x2-x1)*a+12,y+25],[x1+(x2-x1)*b-8,y+23],[x1+(x2-x1)*b-22,y+deep*d],[x1+(x2-x1)*a+25,y+deep*(d+.06)]],c);
 }
 rear('deep-foundation-masonry',masonry,[1700,2260,5300,550]);
 // Large earthen and stone faces distinguish the retaining terraces without repeated horizontal masonry bands.
 let faces='';for(const [x,y,w,h]of [[1720,2460,950,155],[4700,2260,520,210],[6410,2440,590,150]]){
 faces+=P([[x,y+12],[x+w,y+12],[x+w-23,y+h],[x+43,y+h-18]],'#5b6756')+P([[x+18,y+21],[x+w*.57,y+21],[x+w*.41,y+h-27],[x+53,y+h-23]],'#7c8069')+line([[x,y+4],[x+w,y+4]],'#afa68a',7);
 }
 // These shallow material faces lie below the real collision contour. Draw them
 // over the earth fill, with no independent platform edge or collision surface.
 const faceAsset=asset(prefix+'retaining-earth-faces','얕은 종택 기단',faces,[],[1680,2260,5360,410],'stone');
 put(p,s,faceAsset,'retaining-earth-faces',0,0,1,'front');
 let earth='<defs><linearGradient id="family24-earth" x1="0" y1="2300" x2="0" y2="3300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#45584b"/><stop offset="1" stop-color="#182729"/></linearGradient></defs>';
 const upper=PROFILE.map(([x,y])=>[x,y+18]);earth+=P([...upper,[7000,3300],[0,3300]],'url(#family24-earth)');
 // Four broad, irregular shoulder planes, each derived from this site's slope.
 for(const [from,to,color,depth]of [[1080,1710,'#58624e',230],[2700,3290,'#4d5a49',240],[3950,4670,'#52644f',260],[5250,5570,'#485b4a',230],[6070,6390,'#53624e',200]]){
  const mid=(from+to)/2;earth+=P([[from,ground(from)+25],[mid,ground(mid)+22],[to,ground(to)+28],[to-35,ground(to)+depth*.76],[mid+27,ground(mid)+depth],[from+58,ground(from)+depth*.63]],color);
  earth+=P([[from+30,ground(from+30)+35],[mid-20,ground(mid-20)+36],[mid+27,ground(mid)+depth],[from+58,ground(from)+depth*.63]],'#344b40');
 }
 // Broken rock shoulders belong to the soil face, never to an implied walkway.
 earth+=P([[3160,2748],[3240,2800],[3330,2900],[3470,3020],[3330,3090],[3210,2940]],'#5a6553')+P([[3160,2748],[3240,2800],[3330,2900],[3290,2950],[3210,2850]],'#77806a');
 earth+=P([[3990,2820],[4110,2725],[4270,2640],[4220,2820],[4120,2980],[3980,3060]],'#586754')+P([[4110,2725],[4270,2640],[4220,2820],[4130,2870]],'#78816a');
 const earthAsset=asset(prefix+'terrain-material','후원 흙과 암반의 큰 명암면',earth,[],[0,2260,7000,1040],'earth');put(p,s,earthAsset,'terrain-material',0,0,1,'front');
 // Place shallow plinth faces above soil treatment; all their tops remain below feet.
 const face=s.elements.find(e=>e.id==='retaining-earth-faces');s.elements=s.elements.filter(e=>e!==face);s.elements.push(face,s.elements.splice(s.elements.findIndex(e=>e.id==='deep-foundation-masonry'),1)[0]);
 // Distinct human-scale entries: a dark water stair mouth and a boarded ground records doorway.
 rear('water-route-mouth',P([[5625,2720],[5650,2585],[5700,2545],[5890,2545],[5940,2585],[5960,2720]],'#566655')+P([[5670,2720],[5670,2600],[5720,2575],[5870,2575],[5910,2600],[5910,2720]],'#1a3030')+line([[5650,2585],[5700,2545],[5890,2545],[5940,2585]],'#9a9b80',9),[5600,2530,380,200]);
 const pine=p.library.find(a=>a.id==='act1-scene:rooted-pine');if(pine)for(const [i,x,sc]of [[0,1110,.7],[1,3275,.62],[2,5390,.5],[3,6940,.64]])put(p,s,pine,'family24-pine-'+i,x,ground(x),sc);
 const poses={'family-crest':[2070,2460],'shrine-seal':[4370,ground(4370)],'land-register':[4920,2260],'split-route-a':[5780,2720],'split-route-b':[6550,2440],'garden-exit':[6810,2440]};
 for(const m of s.markers)if(poses[m.id])Object.assign(m,{x:poses[m.id][0],y:poses[m.id][1]});
 const door=clone(original.terrains.find(t=>t.id==='shrine-door')),x=4500,y=ground(x);door.points=[{x:x-22,y:y-350},{x:x+22,y:y-350},{x:x+22,y},{x:x-22,y}];s.terrains.push(door);
 rear('shrine-gate-frame',R(x-43,y-362,16,362,'#66513d')+R(x+28,y-362,16,362,'#66513d')+R(x-39,y-354,4,346,'#a18d62')+P([[x-70,y-357],[x-42,y-381],[x+40,y-381],[x+70,y-357],[x+61,y-343],[x-62,y-343]],'#35453e')+line([[x-65,y-358],[x+65,y-358]],'#9a9d81',5),[x-75,y-390,150,395]);
 const groupPos={'empty-court-watch':[1430,1580,1770,1850],'crest-room-watch':[2040,2230,2450,2580],'abandoned-garden-watch':[3300,3590,3800],'shrine-approach':[4470,4630,4800],'land-register-watch':[6010,6240,6430,6650]};
 const count={};for(const u of s.units){if(u.team==='player'){u.y=ground(u.x);continue;}const q=groupPos[u.encounterGroup];if(q){const i=count[u.encounterGroup]||0;count[u.encounterGroup]=i+1;u.x=q[i];u.y=ground(u.x)-(u.kind==='lantern'?32:0);u.stageOverrides.honroEncounterSupport='a3-foundation';}}
 // Preserve response IDs, counts, trigger sequence and the existing warning/opportunity runtime.
 const spawnRows=[[['act3-response-24-0'],[3100,3250],[3060,3210]],[['act3-response-24-1'],[5020,5105,5190],[4720,5040,5170]],[['act3-response-24-2'],[6200,6350],[6160,6310]]];
 for(const [[id],xs,alt]of spawnRows){const ev=s.events.find(e=>e.id===id);if(!ev)throw Error('Missing response '+id);const rewrite=(old,xx)=>old.map((a,i)=>({...a,x:xx[i],y:ground(xx[i]),support:'a3-foundation'}));ev.action.actions=rewrite(ev.action.actions,xs);ev.honroDensityAlternatives=[rewrite(ev.action.actions,alt)];ev.entry={...ev.entry,x:xs[0],y:ground(xs[0])};if(ev.honroDensityTrigger.region)ev.honroDensityTrigger.region={x:5450,y:2300,width:1400,height:750};}
 s.events.find(e=>e.id==='act3-response-24-2').warning='사당 동쪽 갈림마당에서 경비가 일어납니다. 다음 행동 동안 물길 입구와 지상 기록실 사이의 퇴로를 살피세요.';
 s.events.find(e=>e.id==='act3-response-24-2').text='증원 진입 · '+s.events.find(e=>e.id==='act3-response-24-2').warning;
 s.routes=PROFILE.map(([x,y])=>({x,y}));s.anchors.exit={x:6810,y:2440};s.design.act3.kind='ancestral-family-compound';delete s.design.act3.refinement;s.design.act3.koreanTown.mainStructures=['outer-servant-wing','ancestral-family-hall','family-ancestral-shrine','ground-record-entry'];
 s.design.act3.primaryContour=clone(PROFILE);s.design.act3.requiredRoute=PROFILE.map(([x,y])=>({x,y,support:'a3-foundation'}));s.design.act3.optionalRoutes=[{id:'garden-flank-return',points:gallery.map(([x,y])=>({x,y,support:'family24-garden-gallery'}))}];s.design.act3.mainBuildings=['outer-servant-wing','ancestral-family-hall','garden-study','family-ancestral-shrine','ground-record-entry'];
 s.design.family24={revision:2,status:'art-review-candidate',identity:'Korean ancestral compound; outer court, family hall, recessed garden, rear shrine and two separate exit courts',entranceClearance:{water:[5590,6040,2720],ground:[6410,7000,2440]},source:'tools/map-forge/stage24-family-compound.mjs',scope:'Stage24 fresh maps only. Goals, flags, party split, resource policy, population and finite response counts preserved. Normal combat approval pending.'};
 s.initialState.honroFamilyCompound24Revision=1;
 // Keep the existing unoutlined far landscape; replace only local, grounded scenery.
 s.environment.placements=s.environment.placements.filter(e=>e.depthLayer!=='L1');
 const used=new Set(p.stages.flatMap(t=>[...t.elements.map(e=>e.assetId),...t.environment.placements.map(e=>e.assetId)]));p.library=p.library.filter(a=>!oldAssets.has(a.id)||used.has(a.id));
 const authored=g.HonroMaps.finalize(g.HonroTerrainDomain.author({...p,activeStageId:s.id,stages:[s]}));
 const final={...p,library:authored.library,stages:p.stages.map(t=>t.metadata.stageId===24?authored.stages[0]:t)};
 if(JSON.stringify(final.stages.filter(t=>t.metadata.stageId!==24))!==JSON.stringify(project.stages.filter(t=>t.metadata.stageId!==24)))throw Error('Other stage changed');
 if(JSON.stringify(final.stages.find(t=>t.metadata.stageId===24).initialState.honroAct3Steps)!==JSON.stringify(original.initialState.honroAct3Steps))throw Error('Goal contract changed');return final;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const{runtime}=await import('../../game/tests/helpers.mjs');const g=await runtime({legacyMaps:false});const p=authorFamily24(JSON.parse(await readFile('shared/data/campaign.json','utf8')),g);await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');console.log('Stage24 family compound authored; other 29 stages unchanged.');}
