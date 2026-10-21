/** Stage2: a continuous foreground escort road in front of a finite rear gorge.
 * Rear cliff profiles are scenery; only the named caps/boughs and road collide. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const clone=v=>JSON.parse(JSON.stringify(v));
const ps=a=>a.map(([x,y])=>({x,y}));
export const ESCORT_END=4100;
// Restored from the pre-layered canonical canyon recipe. Broad basins and the
// eastern grade remain traversable, rather than a single horizontal collision.
export const ROAD_PROFILE=[[0,2960],[280,2980],[480,3020],[680,2960],[900,2920],[1170,2960],[1430,2940],[1620,3000],[1810,2950],[2050,2940],[2240,3005],[2490,3005],[2730,2960],[2940,2940],[3070,2900],[3200,2840],[3450,2820],[3660,2740],[3870,2610],[4100,2630],[4300,2490]];
export const roadY=x=>{for(let i=1;i<ROAD_PROFILE.length;i++){const a=ROAD_PROFILE[i-1],z=ROAD_PROFILE[i];if(x>=a[0]&&x<=z[0]){const u=(x-a[0])/(z[0]-a[0]);return a[1]+(z[1]-a[1])*u*u*(3-2*u);}}throw Error('Outside escort road '+x);};
const waterEdge=(a,z)=>{for(let i=0;i<40;i++){const m=(a+z)/2;if((roadY(a)-2970)*(roadY(m)-2970)>0)a=m;else z=m;}return(a+z)/2;};
export const SUPPORTS=[
 ['left-high-ground','rock',false,[[0,540],[280,590],[510,610],[650,650],[650,790],[440,730],[0,690]]],
 ['left-tree-branch-upper','wood',true,[[510,622],[650,650],[860,701],[1100,738],[1430,769],[1690,789],[1690,801],[1430,795],[1240,788],[1100,770],[970,754],[860,735],[740,709],[650,684],[520,650]]],
 ['left-tree-branch-middle','wood',true,[[770,1002],[960,987],[1080,1047],[1260,1074],[1500,1131],[1500,1149],[1260,1126],[1080,1093],[950,1040],[780,1045]]],
 ['left-descent-stone-high','rock',false,[[920,1480],[1130,1510],[1260,1570],[1230,1660],[1040,1650],[920,1580]]],
 ['left-tree-branch-lower','wood',true,[[1120,1854],[1280,1818],[1450,1830],[1600,1843],[1700,1882],[1698,1898],[1597,1877],[1454,1870],[1280,1875],[1120,1910]]],
 ['left-descent-stone-mid','rock',false,[[1110,2110],[1370,2150],[1500,2240],[1430,2350],[1210,2310],[1110,2220]]],
 ['left-descent-stone-low','rock',false,[[940,2550],[1120,2460],[1340,2500],[1320,2600],[1110,2670],[940,2640]]],
 ['right-cliff-ground','rock',false,[[3850,740],[4020,600],[4140,500],[4300,430],[4300,710],[4070,800],[3850,900]]],
 ['right-tree-branch-upper','wood',true,[[3305,1229],[3480,1180],[3690,1160],[3880,1190],[4040,1200],[4040,1260],[3870,1240],[3690,1203],[3480,1221],[3315,1251]]],
 ['right-tree-branch-lower','wood',true,[[2980,1501],[3140,1483],[3340,1460],[3550,1480],[3770,1550],[3780,1598],[3550,1528],[3340,1500],[3140,1517],[2980,1519]]],
 ['right-descent-stone-mid','rock',false,[[3510,1960],[3680,1830],[3830,1850],[3830,1980],[3650,2120],[3510,2070]]],
 ['right-climbing-root','wood',true,[[2970,2790],[3090,2735],[3210,2660],[3320,2620],[3330,2654],[3220,2700],[3100,2770],[2980,2808]]],
 ['right-descent-stone-low','rock',false,[[3380,2510],[3520,2430],[3700,2480],[3700,2610],[3500,2670],[3380,2610]]]
];
const top=(id,x)=>{const row=SUPPORTS.find(r=>r[0]===id);if(!row)throw Error(id);for(let i=1;i<row[3].length;i++){const a=row[3][i-1],z=row[3][i];if(z[0]>a[0]&&x>=a[0]&&x<=z[0])return a[1]+(z[1]-a[1])*(x-a[0])/(z[0]-a[0]);}throw Error('outside '+id+' '+x);};
export function applyStage2LayeredRoad(project,{refresh=false}={}){const s=project.stages.find(s=>s.metadata?.stageId===2);if(s.design.stage2LayeredRoad?.revision===2&&!refresh)return project;
 s.terrains=[{id:'canyon-ground',name:'절벽 전면의 연속된 호위로',type:'solid',points:ps([...ROAD_PROFILE.slice(0,-1).flatMap((a,i)=>{const z=ROAD_PROFILE[i+1],n=Math.ceil((z[0]-a[0])/24);return Array.from({length:n},(_,k)=>{const x=a[0]+(z[0]-a[0])*k/n;return[x,roadY(x)];});}),ROAD_PROFILE.at(-1),[4300,3450],[0,3450]]),baseMaterial:'earth',oneWay:false,breakable:false,layer:'terrain',properties:{surfaceKind:'soil',honroLayeredRoad:true},detail:{spacing:32,roughness:0,seed:2,optimizeEpsilon:0}},...SUPPORTS.map(([id,mat,oneWay,points])=>({id,name:id,type:'solid',points:ps(mat==='wood'?points.flatMap((p,i)=>Array.from({length:5},(_,j)=>{const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length],c=points[(i+2)%points.length],u=j/5;return p.map((v,k)=>.5*((2*v)+(-a[k]+b[k])*u+(2*a[k]-5*v+4*b[k]-c[k])*u*u+(-a[k]+3*v-3*b[k]+c[k])*u*u*u));})):points),baseMaterial:mat,oneWay,breakable:false,layer:'terrain',properties:{surfaceKind:mat==='wood'?'branch':'granite',honroLayeredSupport:true},detail:{spacing:24,roughness:0,seed:2,optimizeEpsilon:0}}))];
 for(const key of ['terrainBounds','playBounds','terrainDomainVersion','detailStats'])delete s[key];
 const poses={'p-archer':[290,top('left-high-ground',290)],objective:[180,roadY(180)],'ally-bokman':[70,roadY(70)],'ally-baeksan':[440,roadY(440)],'npc-damheo':[550,roadY(550)],'npc-yeonsil':[320,roadY(320)],'foe-0':[1180,roadY(1180)],'foe-3':[1340,roadY(1340)],'foe-2':[2880,roadY(2880)],'foe-5':[3680,roadY(3680)],'foe-1':[2200,800],'foe-4':[2440,1220]};
 for(const u of s.units)if(poses[u.id])Object.assign(u,{x:poses[u.id][0],y:poses[u.id][1],spawnX:poses[u.id][0],spawnY:poses[u.id][1]});
 s.elements=s.elements.filter(e=>['left-pine-upper','left-pine-lower','right-pine'].includes(e.id));
 for(const e of s.elements){const [x,support,scale]=({'left-pine-upper':[420,'left-high-ground',.8],'left-pine-lower':[1040,'left-descent-stone-high',.8],'right-pine':[3950,'right-cliff-ground',.95]})[e.id];Object.assign(e,{x,y:top(support,x),scale,layer:'back',depthLayer:'L1'});}
 s.materials=[{id:'basin-water',terrainId:'canyon-ground',support:'canyon-ground',kind:'shallow-water',x1:waterEdge(2050,2240),x2:waterEdge(2490,2730),reference:3000,surfaceY:2970,depth:0,alpha:.9,conductive:true},...[[900,1110,'mud'],[1260,1450,'grass'],[1780,2010,'moss'],[2820,3100,'grass']].map(([x1,x2,kind],i)=>({id:'canyon-patch-'+i,terrainId:'canyon-ground',x1,x2,reference:roadY((x1+x2)/2),kind,depth:28,alpha:.9}))];s.environment.placements=[];s.environment.groups=[];s.environment.surfaces=[];
 s.markers=[{id:'marker-0',type:'sector',x:290,y:top('left-high-ground',290),label:'설오의 뒤쪽 높은 엄호턱',sector:0},{id:'marker-1',type:'sector',x:180,y:roadY(180),label:'왼쪽 전면 호위로의 상여 출발',sector:1},{id:'marker-2',type:'rest',x:1780,y:roadY(1780),label:'불씨',radius:170,sector:1},{id:'marker-3',type:'sector',x:2650,y:roadY(2650),label:'절벽 앞의 연속된 호위로',sector:2},{id:'marker-4',type:'rest',x:2960,y:roadY(2960),label:'불씨',radius:170,sector:2},{id:'marker-5',type:'sector',x:3950,y:top('right-cliff-ground',3950),label:'맞은편 상부 둥지',sector:3},{id:'marker-6',type:'rest',x:3900,y:top('right-cliff-ground',3900),label:'불씨',radius:170,sector:3}];
 s.anchors={start:{x:290,y:top('left-high-ground',290)},archerPerch:{x:290,y:top('left-high-ground',290)},procession:{x:180,y:roadY(180)},leftBasin:{x:1700,y:roadY(1700)},rightBasin:{x:2800,y:roadY(2800)},rightShelf:{x:3500,y:top('right-tree-branch-upper',3500)},exit:{x:ESCORT_END,y:roadY(ESCORT_END)}};
 s.routes=[180,...ROAD_PROFILE.map(p=>p[0]).filter(x=>x>180&&x<ESCORT_END),ESCORT_END].map(x=>({x,y:roadY(x)}));
 s.initialState.honroEscortGoalX=ESCORT_END;s.initialState.honroStage2LayeredRevision=1;
 s.design.act1Scene={version:1,theme:'valley',places:['전면의 연속된 호위로','서쪽 뒤 절벽 엄호턱','서쪽 하강/합류','동쪽 뒤 절벽과 둥지'],replaced:[],scenery:[],rocks:[],lights:[],viewpoints:[]};
 s.design.positioning={version:2,question:'높은 뒤 절벽에서 엄호할까, 하강로를 거쳐 상여 앞 도로에 합류할까?',clusterPositions:{'foe-0-cluster':{x:1510,y:roadY(1510)},'foe-3-cluster':{x:2050,y:roadY(2050)},'foe-2-cluster':{x:2720,y:roadY(2720)},'foe-5-cluster':{x:3100,y:roadY(3100)},'foe-1-cluster':{x:2500,y:840},'foe-4-cluster':{x:2150,y:1350}}};
 s.design.stage2LayeredRoad={revision:2,roadProfile:ps(ROAD_PROFILE),escortStart:180,escortGoalX:ESCORT_END,collisionRoles:{road:'canyon-ground',supports:SUPPORTS.map(r=>r[0]),rear:'visual-only, never collision'},guide:'상여는 왼쪽 굴곡과 얕은 물가가 이어지는 전면 길에서 출발합니다. 뒤 절벽의 고지에서 포물선으로 엄호하거나, 서쪽 가지·암반 하강로를 따라 도로에 합류하세요. 오른쪽 출구까지 상여를 지키세요.',rearCliffs:[{id:'west-rear',points:ps([[-6000,320],[0,540],[280,590],[510,610],[590,670],[640,870],[740,960],[860,1080],[940,1220],[1030,1370],[1160,1490],[1120,1630],[1040,1680],[1100,1850],[1270,1910],[1420,2140],[1500,2240],[1260,2310],[1060,2440],[940,2520],[900,2590],[970,2730],[870,2860],[790,2940],[-6000,2960]])},{id:'east-rear',points:ps([[3440,2810],[3380,2610],[3470,2470],[3450,2260],[3550,2120],[3510,1960],[3690,1830],[3710,1640],[3830,1510],[3970,1500],[4100,1570],[4210,1550],[4270,1500],[4275,1380],[4170,1240],[4050,1230],[3930,1090],[3850,900],[3890,720],[4020,600],[4140,500],[4300,430],[10300,300],[10300,2830]])}],descent:['left-high-ground','left-tree-branch-upper','left-descent-stone-high','left-tree-branch-middle','left-descent-stone-mid','left-tree-branch-lower','left-descent-stone-low','canyon-ground']};
 s.design.flightRegion={left:1880,right:2780,top:220,bottom:2890,reason:'Central open gorge; full animated wings remain outside rear cliff silhouettes. Paid movement and attack cap unchanged.'};
 return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const{runtime}=await import('../../game/tests/helpers.mjs'),{applyAct1SceneComposition}=await import('../environment/act1-scene-composition.mjs'),p=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
 const q=applyStage2LayeredRoad(clone(p),{refresh:process.argv.includes('--refresh')});const g=await runtime({legacyMaps:false}),art=await applyAct1SceneComposition(clone(q));q.stages[1]=art.stages[1];const authored=g.HonroTerrainDomain.author(q);p.stages[1]=authored.stages[1];await writeFile('shared/data/campaign.json',JSON.stringify(p)+'\n');console.log('Authored only Stage2: restored road/water/organic boughs/open flight region');
}
