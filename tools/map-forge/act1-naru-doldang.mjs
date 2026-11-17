import {readFile} from 'node:fs/promises';
import {preserveCompound} from '../vector-production/preserve-compound.mjs';

const WATER='ferry-ground',SOLE='root-floor';
// Source pixels of the selected walking faces. Props, railings and the
// interior of the rock arches are visual layers only.
const naru={
 [WATER]:[[0,684],[150,687],[190,715],[214,748],[281,758],[428,761],[493,790],[599,811],[680,808],[729,788],[764,749],[798,718],[923,716],[980,701],[1070,702],[1192,731],[1354,729],[1438,695],[1487,660],[1520,644],[1774,638]],
 'naru-bank':[[0,510],[89,510],[175,527],[263,527],[338,545]],
 'naru-west-pier':[[335,481],[433,477],[690,478],[826,482]],
 'naru-east-pier':[[856,539],[1119,540]],
 'naru-shore':[[1102,612],[1130,592],[1194,577],[1236,561],[1318,552],[1401,539],[1450,514],[1470,486],[1548,476],[1774,470]],
 'naru-stone-a':[[503,753],[533,742],[598,745],[620,760]],
 'naru-stone-b':[[647,773],[664,757],[713,754],[736,767]],
 'naru-approach-step':[[1020,696],[1055,675],[1083,668],[1107,671]]
};
const village={
 [SOLE]:[[8,991],[124,1003],[258,1020],[520,1021],[566,1004],[630,985],[1065,981],[1168,977],[1201,950],[1283,912],[1376,899],[1447,884]],
 'lower-yard':[[9,915],[157,910],[375,910],[511,911]],
 'village-arch':[[466,909],[505,863],[556,830],[612,812],[672,807],[727,811],[766,822],[839,839],[937,842]],
 'east-yard':[[840,681],[905,678],[1100,676],[1210,677],[1276,686]],
 'west-landing':[[8,650],[90,645],[163,648],[239,668],[305,701]],
 'upper-yard':[[290,405],[316,367],[350,354],[527,351],[801,349],[1006,351]],
 'right-ridge':[[1165,639],[1211,562],[1250,493],[1299,447],[1393,442],[1448,419]]
};
const stairs={
 'west-caps':[[95,628,68],[145,595,72],[192,555,69],[248,519,68],[340,476,73],[401,443,69],[432,411,70],[501,385,73]],
 'east-caps':[[747,820,74],[800,797,65],[850,767,70],[899,729,68],[944,706,65]],
 'fall-caps':[[1124,967,55],[1068,945,56],[1007,919,58],[953,891,51]]
};
// Added footholds reuse the painted cap samples alongside the existing rock.
const footholds=[
 [191,550,75,24,247,867,75,868],
 [143,589,78,23,289,825,77,826],
 [95,619,76,24,267,783,75,784],
 [246,512,78,24,241,740,77,741],
 [336,471,83,22,206,701,83,702],
 [947,694,63,23,377,975,69,976],
 [143,589,78,23,324,942,72,943],
 [246,512,78,24,890,626,76,627],
 [95,619,76,24,895,581,76,582],
 [947,694,63,23,916,535,67,536],
 [143,589,78,23,894,490,77,491],
 [246,512,78,24,913,445,77,446],
 [401,432,78,25,890,399,75,400]
];
const cap=([x,y,w])=>[[x,y],[x+w,y-1]];
for(const [part,rows] of Object.entries(stairs))for(const [i,row] of rows.entries())village[part+'-'+i]=cap(row);
for(const [i,p] of footholds.entries())village['doldang-cap-'+i]=cap(p.slice(4,7).map((n,j)=>j===1?p[7]:n));

const artPath=new URL('../../shared/assets/environment/act1-sites/',import.meta.url);
const outline=node=>{
 const {sourcePath,children,...keep}=node;
 if(sourcePath)return {...keep,...preserveCompound(sourcePath)};
 return children?{...keep,children:children.map(outline)}:keep;
};
function rect([x,y,w,h]){return 'M'+x+' '+y+'H'+(x+w)+'V'+(y+h)+'H'+x+'Z';}
export function collage(vector,layout,viewBox,base=false,edges=[]){
 const clips={...vector.clips},parts=base?[{tag:'use',symbol:'source'}]:[];
 for(const [i,r] of layout.entries()){
  const [x,y,w,h,dx,dy,dw,dh]=r,scale=dw/w,clipPath='site-crop-'+i;
  clips[clipPath]=[rect(r)];
  parts.push({tag:'g',transform:[scale,0,0,scale,dx-x*scale,dy+dh-h*scale-y*scale],clipPath,
   children:[{tag:'use',symbol:'source'}]});
 }
 for(const [i,r] of edges.entries()){
  const [x,y,w,h,dx,dy,dw,dh]=r,clipPath='site-edge-'+i;
  clips[clipPath]=[rect(r)];
  const sx=dw/w,sy=dh/h;
  parts.push({tag:'g',transform:[sx,0,0,sy,dx-x*sx,dy-y*sy],clipPath,children:[{tag:'use',symbol:'source'}]});
 }
 return {version:1,viewBox,root:{tag:'g',children:parts},clips,symbols:{source:outline(vector.root)}};
}
// Keep the reviewed core exact and append adjoining edge samples. Compose
// transforms directly against the source to stay within vector depth limits.
export function extendNaruBody(core){
 const clips={...core.clips},parts=core.root.children.map(n=>{
  if(!n.clipPath)return n;const q={...n,pixelSnapClip:true,transform:[...n.transform]};
  // The imported base has an antialiased edge. Underlap only its off-map
  // adjoining strips by less than one source pixel, without moving source art.
  if(n.clipPath==='site-edge-0')q.transform[4]+=.75;
  if(n.clipPath==='site-edge-1')q.transform[4]-=.75;
  if(n.clipPath==='site-edge-2')q.transform[5]-=.75;
  return q;
 });
 function strip(key,x,y,w,h,dx,dy,dw,dh){
  clips[key]=[rect([x,y,w,h])];const sx=dw/w,sy=dh/h;
  parts.push({tag:'g',clipPath:key,pixelSnapClip:true,transform:[sx,0,0,sy,dx-x*sx,dy-y*sy],children:[{tag:'use',symbol:'source'}]});
 }
 strip('naru-outer-left',27-27/390,506,27/390,381,-1200,506,810.25,381);
 strip('naru-outer-right',1752,470,22/400,417,2173.75,470,800.25,417);
 strip('naru-lower-left',1,858,1,28,-1200,886.75,1200,380.5);
 strip('naru-lower-right',1771,858,1,28,1774,886.75,1200,380.5);
 strip('naru-core-bottom-join',0,858.1,1774,.1,0,886.75,1774,.5);
 const y=885,h=1;
 strip('naru-bottom-left',1,y,1,h,-1200,1266,1200,3621);
 strip('naru-bottom-middle',0,y,1774,h,0,1266,1774,3621);
 strip('naru-bottom-right',1771,y,1,h,1774,1266,1200,3621);
 return {...core,viewBox:[-1200,0,4174,4887],clips,root:{tag:'g',children:parts}};
}
function artAsset(project,id,name,vector,sha,foot={x:0,y:0}){
 const [x,y,w,h]=vector.viewBox,bounds={x,y,w,h};
 project.library.push({id,name,category:'rock',visual:[],collision:[],sockets:[],tags:['act1-site'],anchor:{x:0,y:0},params:{
  sourceSha256:sha,semanticLayer:'BODY',silhouetteUnderpaint:false},bounds,
 reference:{bounds,foot,heightM:h/60,scaleRange:[.1,8],backgroundRange:[1,8]},vector});
}
function authorStage(project,s,data){
 const n=s.metadata.stageId,shore=n===3,scale=shore?3.23:3.13,lines=shore?naru:village;
 const site=shore?'서낭나루':'돌당골',floor=shore?WATER:SOLE,body=data.art.body;
 const [, ,sourceWidth,sourceHeight]=body.vector.viewBox;
 const world=(x,y)=>({x:Math.round(x*scale*100)/100,y:Math.round(y*scale*100)/100});
 function stand(support,x){
  const line=lines[support];
  for(let i=1;i<line.length;i++){
   const [a,b]=line.slice(i-1,i+1);
   if(x>=a[0]&&x<=b[0])return {...world(x,a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])),support};
  }
  throw Error('Missing Act 1 site support '+support+' at '+x);
 }
 const pos=(key,x)=>stand(key,x),air=(x,y)=>world(x,y);
 s.name=site;s.width=world(sourceWidth,0).x;s.height=world(0,sourceHeight).y+170;
 s.playBounds={left:0,top:0,right:s.width,bottom:s.height};
 s.terrainBounds={left:-1200,top:-900,right:s.width+1200,bottom:s.height+1500};
 s.terrainDomainVersion=1;
 s.camera={focusBounds:{left:0,top:0,right:s.width,bottom:s.height},minScale:shore?.44:.39};
 s.terrains=Object.entries(lines).map(([id,points])=>{
  const ground=id===floor,wood=id.includes('pier');
  return {id,name:id,type:ground?'ground':'platform',layer:'terrain',
   control:(ground?[[-1200/scale,points[0][1]],...points,[sourceWidth+1200/scale,points.at(-1)[1]]]:points).map(p=>world(...p)),
   baseMaterial:wood?'wood':'rock',oneWay:!ground,breakable:false,thickness:32,floor:s.height+1500,
   detail:{interpolation:'linear',roughness:0,spacing:25},properties:{honroAct1SitePainted:true,route:true}};
 });
 const bodyId='act1-site:'+n+':body',sheetId='act1-site:'+n+':landmarks';
 const edges=shore?[[0,506,27,381,0,506,-390,381],[1752,470,22,417,2174,470,-400,417],
  [0,858,1774,29,0,887,1774,380]]:[[9,908,30,157,9,908,-390,157],[1421,882,13,181,1834,882,-400,181],
  [16,1049,1402,19,16,1068,1402,380]];
 const faces=shore?[]:footholds.map(([x,y,w,h,dx,dy,dw])=>[x,y,w,h,dx,dy,dw,h*dw/w]);
 const bodyCollage=collage(body.vector,faces,[-390,0,sourceWidth+790,sourceHeight+380],true,edges);
 artAsset(project,bodyId,site+' 지형',shore?extendNaruBody(bodyCollage):bodyCollage,body.sha256);
 artAsset(project,sheetId,site+' 랜드마크',collage(data.art.landmarks.vector,data.layout,body.vector.viewBox),data.art.landmarks.sha256);
 const placement=(id,assetId,x=0,y=0,z=1,layer='structural-back')=>({id,assetId,...world(x,y),scale:z*scale,layer,depthLayer:'L1',visualRole:'scenery'});
 s.elements=[placement('site-body-'+n,bodyId),placement('site-landmarks-'+n,sheetId,0,0,1,'prop')];
 if(shore){
  for(const [key,name,foot] of [['ferry','나룻배',{x:120,y:107}],['lantern','잔교의 등불',{x:13,y:125}],['spirit-flame','나루 혼불',{x:24,y:85}]]){
   const row=data.art[key];artAsset(project,'act1-site:3:'+key,name,{...row.vector,root:outline(row.vector.root)},row.sha256,foot);
  }
  s.elements.push(placement('naru-skiff','act1-site:3:ferry',578,633,.91,'mid'),
   placement('naru-lamp','act1-site:3:lantern',775,401,.62,'prop'),
   placement('naru-left-flame','act1-site:3:spirit-flame',233,479,.5,'prop'),
   placement('naru-right-flame','act1-site:3:spirit-flame',1402,478,.54,'prop'));
 }
 s.materials=shore?[{id:'naru-shallows',kind:'shallow-water',terrainId:floor,conductive:true,
  x1:air(454,0).x,x2:air(757,0).x,surfaceY:air(0,784).y,reference:air(0,800).y,depth:60,alpha:.25}]:[];
 s.environment={version:4,preset:'forest',atmosphere:{preset:shore?'valley':'forest'},skyVisible:true,
  groups:[],surfaces:[],placements:[],zones:[{id:'site-atmosphere',from:0,to:s.height,blend:0}]};
 s.design={title:'연목 · '+site,act1Scene:{version:2,scenery:[],rocks:[],replaced:[]},
  act1Site:{revision:1,far:'act1Site'+n,sourceSha256:body.sha256}};
 s.initialState.honroAct1SiteRevision=1;
 delete s.initialState.honroStage7VillageRevision;
 delete s.initialState.honroStage7ReentryRevision;
 const originals=new Map(s.units.map(u=>[u.id,u]));
 const actors=shore?{
  'p-archer':pos('naru-bank',58),'p-mage':pos('naru-bank',93),'npc-hwigyeom':pos('naru-east-pier',895),
  'midboss-stage3':pos(WATER,625)
 }:{'p-archer':pos('lower-yard',26),'p-mage':pos('lower-yard',55),'p-knight':pos('lower-yard',84),
  'resident-1':pos('lower-yard',179),'resident-2':pos('east-yard',1032),'resident-3':pos('upper-yard',827)};
 s.units=Object.entries(actors).map(([id,p])=>({...originals.get(id),...p,spawnX:p.x,spawnY:p.y}));
 const packs=shore?[
  [['hound',pos('naru-bank',252)],['hound',pos(WATER,321)],['boar',pos('naru-west-pier',437)]],
  [['hound',pos(WATER,520)],['crow',air(691,424)],['bat',air(812,602)]],
  [['human',pos('naru-east-pier',972)]],
  [['human',pos('naru-shore',1248)],['human',pos('naru-shore',1472),true],['hound',pos('naru-shore',1325)],['boar',pos('naru-shore',1532)],['crow',air(1412,412)]]
 ]:[
  [['hound',pos('lower-yard',252)],['hound',pos('village-arch',507)],['human',pos('lower-yard',378)],['bat',air(443,847)],['crow',air(572,746)]],
  [['hound',pos('east-yard',928)],['hound',pos('east-yard',1228)],['stag',pos('village-arch',819)],['human',pos('east-yard',1178),true],['shade',pos('village-arch',731)],['bat',air(1086,628)]],
  [['hound',pos('upper-yard',687)],['human',pos('upper-yard',931),true],['shade',pos('upper-yard',737)],['bat',air(694,281)],['crow',air(878,240)]],
  [['hound',pos(SOLE,817)],['human',pos('right-ridge',1324)],['stag',pos(SOLE,1218)],['crow',air(1319,817)]]
 ];
 s.encounters=packs.map((pack,i)=>{
  const id='site-'+n+'-patrol-'+i,unitIds=pack.map(([kind,p,elite],j)=>{
   const unitId=id+'-'+j;
   s.units.push({id:unitId,kind,team:'enemy',x:p.x,y:p.y,spawnIndex:i*6+j,encounterGroup:id,behavior:'guard',
    ...(elite?{stageOverrides:{elite:true}}:{})});
   return unitId;
  });
  return {id,key:id,behavior:'guard',unitIds};
 });
 const start=actors['p-archer'];
 s.anchors=shore?{start,ferry:pos('naru-west-pier',520),mudflat:pos(WATER,633),cargo:pos('naru-shore',1210),
  ledger:pos('naru-shore',1635),roof:pos('naru-shore',1690),exit:pos('naru-shore',1747)}:
  {start,resident1:actors['resident-1'],knot1:pos('lower-yard',342),turn1:pos('village-arch',720),resident2:actors['resident-2'],
   hollow:pos('east-yard',923),resident3:actors['resident-3'],upperShrine:pos('upper-yard',860),exit:pos('upper-yard',968)};
 s.routes=shore?[start,pos('naru-bank',299),pos('naru-west-pier',503),pos('naru-east-pier',934),pos('naru-shore',1190),s.anchors.ledger,s.anchors.exit]:
  [start,s.anchors.resident1,pos('village-arch',612),pos('village-arch',833),s.anchors.resident2,s.anchors.upperShrine,s.anchors.exit];
 s.initialState.routePoints=s.routes;
 const markers=shore?[
  ['젖은 버들 제방',pos('naru-bank',128)],['서낭나루 잔교',pos('naru-west-pier',493)],['불씨',pos('naru-west-pier',604)],
  ['물가 갈림길',pos('naru-east-pier',936)],['불씨',pos('naru-shore',1168)],['홍만의 움막',s.anchors.ledger],['불씨',pos('naru-shore',1730)]
 ]:[
  ['돌당골 아랫골목',s.anchors.resident1],['돌축대 오름길',s.anchors.turn1],['불씨',pos('village-arch',600)],
  ['중간 마당',s.anchors.resident2],['불씨',pos('east-yard',1095)],['당산나무 곁 당집',s.anchors.upperShrine],['불씨',pos('upper-yard',728)]
 ];
 const guards=[['site-7-patrol-0-0','site-7-patrol-0-2'],
  ['site-7-patrol-1-0','site-7-patrol-1-3','site-7-patrol-1-5'],
  ['site-7-patrol-2-0','site-7-patrol-2-1']];
 s.markers=s.markers.filter(m=>m.type!=='hauntHabitat').map(m=>{
  if(m.id==='ledger')return {...m,...s.anchors.ledger};
  const resident=m.target&&actors[m.target];if(resident)return {...m,...resident,y:resident.y-75,
   rescueGuards:guards[Number(m.target.at(-1))-1]};
  const slot=markers[Number(m.id.replace('marker-',''))];return slot?{...m,label:slot[0],...slot[1]}:m;
 });
 const inscription=shore?pos('naru-bank',233):pos('upper-yard',802);
 s.markers.push({id:'site-inscription-'+n,type:'inscription',action:'readSite',label:shore?'서낭터 살피기':'당집 살피기',
  ...inscription,text:shore?'서낭나루. 강을 건너는 이들의 무사함을 빌던 자리다.':'돌당골. 바위 곁 당집 아래로 집과 골목이 모였다.'});
 if(!shore){
  const passages=[
   ['마당으로 오르는 돌계단',pos('village-arch',762),pos('east-yard',953)],
   ['당집으로 오르는 돌계단',pos('east-yard',927),pos('upper-yard',929)]
  ];
  for(const [i,[label,from,to]] of passages.entries()){
   s.markers.push({id:'site-stairs-'+i,type:'stairs',action:'climbSite',label,...from,to},
    {id:'site-down-'+i,type:'stairs',action:'climbSite',label:'돌계단으로 내려가기',...to,to:from});
  }
 }
 const spawn=(kind,count,where)=>({type:'spawn',kind,n:count,...where,spacing:138,maxDistance:430,
  ...(['crow','bat'].includes(kind)?{airY:where.y,requireFlightClearance:true}:{})});
 function updateEvent(id,change){const e=s.events.find(v=>v.id===id);if(!e)throw Error('Missing Act 1 event '+id);Object.assign(e,change);}
 if(shore){
  updateEvent('midboss-stage3-seen',{when:{progress:world(500,0).x}});
  updateEvent('transfer',{when:{progress:world(1170,0).x}});
  updateEvent('dock-beasts',{when:{ledger:true},warning:'움막 건너편에서 발소리와 날갯짓이 들린다.',action:{type:'multi',actions:[
   spawn('hound',2,pos('naru-shore',1374)),spawn('crow',1,air(1395,394))
  ]}});
 }else{
  updateEvent('yard-hounds',{when:{rescues:2},warning:'아랫골목 돌축대 아래에서 짐승이 따라오고 있다.',action:{type:'multi',actions:[
   spawn('hound',2,pos('lower-yard',303)),spawn('bat',1,air(550,778))
  ]}});
  updateEvent('upper-crows',{when:{rescues:3},warning:'당집 서쪽 돌계단에 또 다른 무리가 올라온다.',action:{type:'multi',actions:[
   spawn('hound',1,pos('upper-yard',420)),spawn('human',1,pos('upper-yard',497)),spawn('crow',1,air(534,275))
  ]}});
 }
 s.objectives[0].label=shore?'서낭나루의 홍만 움막에서 장부 회수':'돌당골에 남은 주민 셋을 죽이지 않고 구조';
 return s;
}

export async function applyAct1Sites(project){
 for(const id of [3,7]){
  const s=project.stages.find(x=>x.metadata?.stageId===id);
  if(!s)throw Error('Missing Act 1 site chapter '+id);
  const source=JSON.parse(await readFile(new URL('stage0'+id+'.json',artPath),'utf8'));
  authorStage(project,s,source);
 }
 return project;
}
