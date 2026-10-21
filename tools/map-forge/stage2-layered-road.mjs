/** Stage2: a continuous foreground escort road in front of a finite rear gorge.
 * Rear cliff profiles are scenery; only the named caps/boughs and road collide. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const clone=v=>JSON.parse(JSON.stringify(v));
const ps=a=>a.map(([x,y])=>({x,y}));
export const ROAD_Y=2860,ESCORT_END=4100;
export const SUPPORTS=[
 ['left-high-ground','rock',false,[[0,580],[340,590],[650,625],[730,700],[730,860],[600,790],[0,740]]],
 ['left-tree-branch-upper','wood',true,[[560,870],[900,900],[1180,980],[1180,1003],[1080,1010],[980,984],[900,965],[760,961],[620,947],[560,930]]],
 ['left-descent-stone-high','rock',false,[[820,1210],[1120,1250],[1340,1290],[1340,1380],[1250,1365],[1160,1410],[1030,1370],[920,1380],[820,1320]]],
 ['left-tree-branch-middle','wood',true,[[750,1530],[1000,1570],[1460,1630],[1460,1660],[1340,1672],[1200,1648],[1000,1640],[860,1625],[750,1590]]],
 ['left-descent-stone-mid','rock',false,[[1050,1900],[1330,1890],[1610,1950],[1610,2070],[1510,2090],[1350,2020],[1200,2080],[1050,2010]]],
 ['left-tree-branch-lower','wood',true,[[900,2240],[1220,2280],[1520,2310],[1520,2340],[1410,2350],[1320,2330],[1220,2340],[1040,2335],[900,2300]]],
 ['left-descent-stone-low','rock',false,[[1330,2460],[1580,2450],[1770,2520],[1770,2630],[1650,2650],[1500,2580],[1420,2610],[1330,2560]]],
 ['right-cliff-ground','rock',false,[[3540,780],[3770,630],[4030,610],[4300,600],[4300,820],[3900,820],[3610,950],[3540,920]]],
 ['right-tree-branch-upper','wood',true,[[3300,1240],[3510,1180],[3730,1170],[3730,1220],[3510,1225],[3300,1260]]],
 ['right-descent-stone-mid','rock',false,[[3240,1580],[3470,1530],[3630,1550],[3630,1650],[3550,1680],[3420,1650],[3300,1710],[3240,1690]]],
 ['right-tree-branch-lower','wood',true,[[2930,1970],[3170,1920],[3420,1900],[3420,1960],[3170,1970],[2930,1995]]],
 ['right-descent-stone-low','rock',false,[[3000,2360],[3240,2310],[3440,2340],[3440,2460],[3370,2490],[3220,2440],[3090,2500],[3000,2470]]]
];
const top=(id,x)=>{const row=SUPPORTS.find(r=>r[0]===id);if(!row)throw Error(id);for(let i=1;i<row[3].length;i++){const a=row[3][i-1],z=row[3][i];if(z[0]>a[0]&&x>=a[0]&&x<=z[0])return a[1]+(z[1]-a[1])*(x-a[0])/(z[0]-a[0]);}throw Error('outside '+id+' '+x);};
export function applyStage2LayeredRoad(project,{refresh=false}={}){const s=project.stages.find(s=>s.metadata?.stageId===2);if(s.initialState.honroStage2LayeredRevision===1&&!refresh)return project;
 s.terrains=[{id:'canyon-ground',name:'절벽 전면의 연속된 호위로',type:'solid',points:ps([[0,ROAD_Y],[4300,ROAD_Y],[4300,3300],[0,3300]]),baseMaterial:'earth',oneWay:false,breakable:false,layer:'terrain',properties:{surfaceKind:'soil',honroLayeredRoad:true},detail:{spacing:32,roughness:0,seed:2,optimizeEpsilon:0}},...SUPPORTS.map(([id,mat,oneWay,points])=>({id,name:id,type:'solid',points:ps(points),baseMaterial:mat,oneWay,breakable:false,layer:'terrain',properties:{surfaceKind:mat==='wood'?'branch':'granite',honroLayeredSupport:true},detail:{spacing:24,roughness:0,seed:2,optimizeEpsilon:0}}))];
 for(const key of ['terrainBounds','playBounds','terrainDomainVersion','detailStats'])delete s[key];
 const poses={'p-archer':[290,top('left-high-ground',290)],objective:[180,ROAD_Y],'ally-bokman':[70,ROAD_Y],'ally-baeksan':[440,ROAD_Y],'npc-damheo':[550,ROAD_Y],'npc-yeonsil':[320,ROAD_Y],'foe-0':[1180,ROAD_Y],'foe-3':[1340,ROAD_Y],'foe-2':[2880,ROAD_Y],'foe-5':[3680,ROAD_Y]};
 for(const u of s.units)if(poses[u.id])Object.assign(u,{x:poses[u.id][0],y:poses[u.id][1],spawnX:poses[u.id][0],spawnY:poses[u.id][1]});
 s.elements=s.elements.filter(e=>['left-pine-upper','left-pine-lower','right-pine'].includes(e.id));
 for(const e of s.elements){const [x,support,scale]=({'left-pine-upper':[420,'left-high-ground',.8],'left-pine-lower':[1180,'left-descent-stone-high',.65],'right-pine':[3950,'right-cliff-ground',.95]})[e.id];Object.assign(e,{x,y:top(support,x),scale,layer:'back',depthLayer:'L1'});}
 s.materials=[];s.environment.placements=[];s.environment.groups=[];s.environment.surfaces=[];
 s.markers=[{id:'marker-0',type:'sector',x:290,y:top('left-high-ground',290),label:'설오의 뒤쪽 높은 엄호턱',sector:0},{id:'marker-1',type:'sector',x:180,y:ROAD_Y,label:'왼쪽 전면 호위로의 상여 출발',sector:1},{id:'marker-2',type:'rest',x:1780,y:ROAD_Y,label:'불씨',radius:170,sector:1},{id:'marker-3',type:'sector',x:2650,y:ROAD_Y,label:'절벽 앞의 연속된 호위로',sector:2},{id:'marker-4',type:'rest',x:2960,y:ROAD_Y,label:'불씨',radius:170,sector:2},{id:'marker-5',type:'sector',x:3950,y:top('right-cliff-ground',3950),label:'맞은편 상부 둥지',sector:3},{id:'marker-6',type:'rest',x:3900,y:top('right-cliff-ground',3900),label:'불씨',radius:170,sector:3}];
 s.anchors={start:{x:290,y:top('left-high-ground',290)},archerPerch:{x:290,y:top('left-high-ground',290)},procession:{x:180,y:ROAD_Y},leftBasin:{x:1700,y:ROAD_Y},rightBasin:{x:2800,y:ROAD_Y},rightShelf:{x:3500,y:1182},exit:{x:ESCORT_END,y:ROAD_Y}};
 s.routes=[{x:180,y:ROAD_Y},{x:ESCORT_END,y:ROAD_Y}];
 s.initialState.honroEscortGoalX=ESCORT_END;s.initialState.honroStage2LayeredRevision=1;
 s.design.act1Scene={version:1,theme:'valley',places:['전면의 연속된 호위로','서쪽 뒤 절벽 엄호턱','서쪽 하강/합류','동쪽 뒤 절벽과 둥지'],replaced:[],scenery:[],rocks:[],lights:[],viewpoints:[]};
 s.design.positioning={version:2,question:'높은 뒤 절벽에서 엄호할까, 하강로를 거쳐 상여 앞 도로에 합류할까?',clusterPositions:{'foe-0-cluster':{x:1510,y:ROAD_Y},'foe-3-cluster':{x:2050,y:ROAD_Y},'foe-2-cluster':{x:2720,y:ROAD_Y},'foe-5-cluster':{x:3100,y:ROAD_Y},'foe-1-cluster':{x:3060,y:930},'foe-4-cluster':{x:3100,y:1320}}};
 s.design.stage2LayeredRoad={revision:1,roadY:ROAD_Y,escortStart:180,escortGoalX:ESCORT_END,collisionRoles:{road:'canyon-ground',supports:SUPPORTS.map(r=>r[0]),rear:'visual-only, never collision'},guide:'상여는 왼쪽 전면의 평탄한 길에서 출발합니다. 뒤 절벽의 고지에서 포물선으로 엄호하거나, 서쪽 가지·암반 하강로를 따라 도로에 합류하세요. 오른쪽 출구까지 상여를 지키세요.',rearCliffs:[{id:'west-rear',points:ps([[-6000,320],[0,580],[340,590],[650,625],[730,700],[960,800],[1250,1040],[1180,1410],[1380,1650],[1460,2080],[1620,2420],[1800,2780],[-6000,2830]])},{id:'east-rear',points:ps([[3000,2780],[3070,2350],[3120,1910],[3220,1640],[3370,1500],[3480,1130],[3550,840],[3730,650],[4300,560],[10300,300],[10300,2830]])}],descent:['left-high-ground','left-tree-branch-upper','left-descent-stone-high','left-tree-branch-middle','left-descent-stone-mid','left-tree-branch-lower','left-descent-stone-low','canyon-ground']};
 return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const{runtime}=await import('../../game/tests/helpers.mjs'),g=await runtime({legacyMaps:false}),source=await readFile('shared/data/campaign.json','utf8'),p=JSON.parse(source),before=JSON.stringify(p.stages.filter(s=>s.metadata.stageId!==2)),q=g.HonroTerrainDomain.author(applyStage2LayeredRoad(p,{refresh:process.argv.includes('--refresh')}));if(JSON.stringify(q.stages.filter(s=>s.metadata.stageId!==2))!==before)throw Error('Other29 changed');await writeFile('shared/data/campaign.json',JSON.stringify(q)+'\n');console.log('Stage2 layered road authored, other29 preserved');}
