/** ACT1 outdoor place composition. Decorative references never become physics.
 * The original mission/terrain/actor data is retained; replacement lists affect
 * only legacy landmark paint. Every new foreground root uses a live map support. */
import vm from 'node:vm';
import {applyGuardianBranches} from '../map-forge/stage10-guardian-tree.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {applyAct1CollisionRepair} from '../map-forge/act1-collision-repair.mjs';
import {applyAct1VectorArt} from './build-act1-art.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const author=vm.createContext({HonroMapEngine:{},HONRO_CORE:{}});
vm.runInContext(await readFile(path.join(root,'shared/map/geometry.js'),'utf8'),author);
vm.runInContext(await readFile(path.join(root,'shared/map/stage7-reentry.js'),'utf8'),author);
const PREFIX='a1-scene-';
export function surfaceAt(st,x,y=Infinity,supportId){
 const hits=[];for(const t of st.terrains){if(supportId&&t.id!==supportId)continue;const pts=author.HonroGeometry.derive(t);for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if(b.x<=a.x||x<a.x||x>b.x)continue;const at=a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);hits.push({x,y:at,supportId:t.id});}}
 if(!hits.length)throw Error('Missing ACT1 scenery support '+st.id+'/'+x+'/'+supportId);
 return hits.sort((a,b)=>Number.isFinite(y)?Math.abs(a.y-y)-Math.abs(b.y-y):a.y-b.y)[0];
}
function place(st,key,assetId,x,y,scale=1,supportId){
 if(assetId==='pine-grove'){const a=place(st,key+'-west','rooted-pine',x-250*scale,y,scale,supportId);place(st,key+'-center','rooted-pine',x+20*scale,y,scale*.89,supportId);place(st,key+'-east','rooted-pine',x+285*scale,y,scale*.65,supportId);return a;}
 if(assetId==='ritual-grove'){const a=place(st,key+'-sacred','rooted-sacred',x-200*scale,y,scale,supportId);place(st,key+'-pine','rooted-pine',x+220*scale,y,scale*.68,supportId);return a;}
 const hit=surfaceAt(st,x,y,supportId),id=PREFIX+st.metadata.stageId+'-'+key;
 const rooted=assetId==='rooted-pine'||assetId==='rooted-sacred',reach=(assetId==='rooted-sacred'?89:67)*scale,rootContacts=rooted?[-reach,0,reach].map(dx=>surfaceAt(st,x+dx,hit.y,supportId)):[];
 const footOffset=rooted?Math.max(0,...rootContacts.map(p=>p.y-hit.y))+5*scale:0;
 const e={id,assetId:'act1-scene:'+assetId,x,y:hit.y+footOffset,scale,rotation:0,snap:false,layer:'back',depthLayer:'L1'};st.elements.push(e);st.design.act1Scene.scenery.push({id,assetId:e.assetId,supportId:hit.supportId,x,y:e.y,scale,footOffset,rootContacts,visualOnly:true});return e;
}
function rock(st,key,x,y,w,h,supportId,kind='shoulder'){const hit=surfaceAt(st,x,y,supportId);st.design.act1Scene.rocks.push({id:key,x,y:hit.y,width:w,height:h,supportId:hit.supportId,kind,visualOnly:true});}
function suppress(st,predicate){st.design.act1Scene.replaced.push(...st.elements.filter(e=>!e.id.startsWith(PREFIX)&&predicate(e)).map(e=>e.id));}
const pine=e=>/pine|Tree/i.test(e.assetId)&&!e.id.startsWith('habitat-');
const PLACES={
 1:['송림 들머리','젖은 개울 수레터','고목 아래 사격터','동쪽 바위 고개'],
 2:['왼쪽 높은 엄호턱','절벽 사이 하강길','상여가 지나는 하부 물길','맞은편 송림'],
 3:['강가 숲길','침수된 나루','진흙 물길','장부가 남은 창고'],
 4:['피난민이 모인 성문','좁은 흙길','불탄 마을 안뜰','동쪽 망루'],
 5:['받이진이 있는 산비탈','폭포 아래 소','노출된 돌턱','폭포 틈 사격 자리'],
 6:['무너진 다리 들머리','남은 교각','다리 밑 운반대','북문으로 오르는 길'],
 7:['아랫뿌리 거처','중간 굽이 피난집','속빈 줄기','윗사당'],
 8:['장례창고','서쪽 결박마당','빈 상여 회랑','동쪽 결박과 상여터'],
 9:['서쪽 받이진','바람 없는 우물마당','동쪽 받이진','사당 진입문'],
 10:['서쪽 외문','서쪽 회랑','언덕 중앙의 당산나무','동쪽 회랑']
};
export async function applyAct1SceneComposition(project){
 author.HonroStage7Reentry.applyProject(project);
 applyAct1CollisionRepair(project);
 applyGuardianBranches(project);
 await applyAct1VectorArt(project);
 for(const st of project.stages){const n=st.metadata?.stageId;if(n<1||n>10)continue;
  st.elements=st.elements.filter(e=>!e.id.startsWith(PREFIX));st.design??={};st.design.act1Scene={version:1,theme:st.backdrop,places:PLACES[n],replaced:[],scenery:[],rocks:[],lights:[],viewpoints:[]};
  const add=(...args)=>place(st,...args),r=(...args)=>rock(st,...args);
  if(n===1){
   suppress(st,pine);add('entry-grove','pine-grove',560,1570,.92,'forest-floor');add('great-pine','pine-grove',2070,1570,1.55,'forest-floor');add('east-grove','ritual-grove',3700,1130,.8,'forest-floor');add('last-grove','pine-grove',5050,759,.7,'ridge-east-extension');
   r('entry-shoulder',240,1520,1100,470,'forest-floor');r('creek-granite',2880,1610,1200,750,'forest-floor');r('ridge-granite',3850,1010,1200,650,'forest-floor');
  }
  if(n===2){
   suppress(st,pine);add('high-grove','pine-grove',560,600,.87,'left-high-ground');add('lower-grove','pine-grove',1040,1740,1.14,'left-high-ground');add('right-grove','pine-grove',3750,1390,1.08,'right-cliff-ground');
   r('high-shoulder',240,600,1600,770,'left-high-ground');r('left-cleft',1180,2200,1100,1550,'left-high-ground','buttress');r('right-buttress',3910,950,1800,800,'right-cliff-ground','buttress');r('valley-toe',3040,2910,1150,850,'canyon-ground');
  }
  if(n===3){
   suppress(st,e=>pine(e)||['builtin:warehouse','builtin:oldHall','builtin:cargoScaffold'].includes(e.assetId));add('west-grove','pine-grove',720,1814,1.2,'ferry-ground');add('ferry-workbay','ferry-house',1500,2000,.72,'dock-west');add('cargo-hall','ferry-house',5550,1612,1.12,'ferry-ground');add('exit-court','refuge-courtyard',6140,1538,.75,'ferry-ground');add('ridge-grove','pine-grove',4320,1950,.85,'ferry-ground');
   r('mudflat-bank',3160,2440,1480,610,'ferry-ground');r('warehouse-shoulder',5910,1580,1300,860,'ferry-ground');
  }
  if(n===4){
   suppress(st,e=>pine(e)||['builtin:villageWall','builtin:oldGate','builtin:burnedHouses','builtin:watchtower','builtin:cliffFace'].includes(e.assetId));add('north-gate','refuge-gate',1030,2270,1.04,'gate-basin');add('burned-courtyard','refuge-courtyard',2200,2705,1.22,'gate-basin');add('east-watch-court','ruined-court',3870,1768,.80,'east-watch');add('gate-grove','pine-grove',530,2290,.68,'gate-basin');add('east-grove','pine-grove',3010,2316,.87,'gate-basin');
   add('left-scarp-granite','valley-granite',1540,2500,1.60,'gate-basin');r('east-scarp',3650,1765,1400,840,'east-watch');
  }
  if(n===5){
   suppress(st,e=>pine(e)||e.id==='place5-cliff-mass');add('approach-grove','pine-grove',770,2346,.88,'valley-floor');add('above-fall-grove','ritual-grove',3010,1690,.73,'upper-roost');
   r('waterfall-granite',2800,3350,2300,1840,'valley-floor','buttress');r('western-shoulder',710,2360,1600,900,'valley-floor');r('mouth-shoulder',3850,3230,1300,1200,'valley-floor');
  }
  if(n===6){
   suppress(st,e=>pine(e)||e.assetId==='builtin:brokenBridge');add('west-bridge-bank','bridge-abutment',1970,2860,1.08,'lower-road');add('east-bridge-bank','bridge-abutment',4560,2840,1,'lower-road');add('transport-shelter','refuge-courtyard',4130,2940,.65,'lower-road');add('exit-grove','pine-grove',5780,2433,.86,'lower-road');
   r('west-ravine',810,2500,1300,830,'lower-road');r('bridge-ravine',3350,3020,1900,1170,'lower-road');r('east-ravine',4910,2730,1400,900,'lower-road');
  }
  if(n===7){
   suppress(st,e=>['builtin:greatTree','builtin:rootHut','builtin:hollowRoot','builtin:rootShrine'].includes(e.assetId));add('ancient-root-village','root-sanctuary',1820,4480,1.38,'root-floor');add('lower-home','refuge-courtyard',1180,3836,.57,'tier-low');add('middle-home','ferry-house',3000,3000,.62,'tier-mid');add('upper-shrine','ritual-hall',1730,1400,.63,'tier-crown');
   r('root-foot-stone',510,4480,1450,1050,'root-floor');
  }
  if(n===8){
   suppress(st,e=>['builtin:warehouse','builtin:funeralGate','builtin:bierRest'].includes(e.assetId));add('funeral-store','ferry-house',1550,2516,.90,'bier-road');add('empty-ceremonial-court','ruined-court',3890,2237,1.28,'bier-road');add('bier-court','ritual-hall',6200,2105,1.02,'bier-road');add('western-grove','ritual-grove',610,2428,.73,'bier-road');add('eastern-grove','pine-grove',6820,2130,.78,'bier-road');
   r('west-eave-mass',2770,2375,1700,640,'bier-road');r('east-eave-mass',5560,2130,1600,760,'bier-road');
  }
  if(n===9){
   suppress(st,e=>['builtin:oldHall','builtin:incenseYard'].includes(e.assetId));add('quiet-court','ruined-court',1820,2478,1.36,'yard-floor');add('east-hall','ritual-hall',3350,2390,1.25,'yard-floor');add('west-grove','ritual-grove',330,2565,.70,'yard-floor');
   r('western-court-shoulder',800,2560,1400,710,'yard-floor');r('eastern-court-shoulder',2920,2390,1400,680,'yard-floor');
  }
  if(n===10){
   suppress(st,e=>['builtin:royalGate','builtin:oldHall','builtin:upperShrine'].includes(e.assetId));add('outer-gate','refuge-gate',330,2996,.83,'outer-yard');add('western-hall','ruined-court',1650,2605,1.0,'outer-yard');add('guardian-tree','guardian-tree',2500,2180,1,'outer-yard');add('eastern-hall','refuge-courtyard',3550,2620,1.14,'outer-yard');add('outer-east-grove','ritual-grove',4540,2893,.77,'outer-yard');
   // Draw the reviewed bough polygons as the same real one-way surfaces.
   // Keep material, damage/ballistic rules and IDs; never migrate live saves.
   st.design.act1Scene.guardianTree={id:'a1-scene-10-guardian-tree',branches:['altar-step-1','altar-step-2','altar-step-3','altar-platform']};
   r('western-foundation',1310,2760,1850,940,'outer-yard');r('eastern-foundation',3860,2745,1700,900,'outer-yard');
  }
  // Broad rear rock masses precede the living/ceremonial architecture within L1-back.
  const rear=st.elements.filter(e=>e.id.startsWith(PREFIX)&&e.assetId==='act1-scene:valley-granite');
  st.elements=[...st.elements.filter(e=>!e.id.startsWith(PREFIX)),...rear,...st.elements.filter(e=>e.id.startsWith(PREFIX)&&!rear.includes(e))];
 }
 return project;
}
