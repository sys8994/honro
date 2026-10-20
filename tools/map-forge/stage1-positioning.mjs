/** Stage 1: the existing pine offers an early optional firing route, not more platforms. */
export function applyStage1Positioning(project){
 const s=project.stages.find(s=>s.metadata?.stageId===1);if(!s)return project;
 const t=s.terrains.find(t=>t.id==='pine-branch-west');
 // A low tip before the first encounter rises into the existing trunk at x1682.
 t.points=[[1030,1394],[1110,1390],[1190,1378],[1310,1348],[1430,1320],[1550,1292],[1682,1270],[1760,1279],[1875,1300],[1960,1321],[2032,1335],[2028,1356],[1870,1334],[1680,1342],[1540,1350],[1435,1351],[1195,1399],[1030,1403]].map(([x,y])=>({x,y}));
 const boulder=s.elements.find(e=>e.id==='forest-boulder-a');boulder.scale=.55;boulder.y=1460;
 const rootStone=s.elements.find(e=>e.id==='forest-boulder-b');Object.assign(rootStone,{x:1760,y:1540,scale:.55});
 const top=x=>{for(let i=0;i<t.points.length-1;i++){const a=t.points[i],b=t.points[i+1];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}};
 // Keep the original combat budgets and encounter IDs; separate lower pursuit and bough guard.
 const guard=s.units.find(u=>u.id==='foe-3');guard.x=1810;guard.y=top(guard.x);
 const rest=s.markers.find(m=>m.id==='marker-4');rest.x=1620;rest.y=top(rest.x);rest.label='고목 가지 쉼터';
 const sector=s.markers.find(m=>m.id==='marker-3');sector.label='고목 위 사격 자리';sector.y=top(sector.x);
 s.design.positioning={version:1,question:'산개가 있는 아래 길로 접근할까, 먼저 낮은 가지 끝을 올라 내려다보며 쏠까?',entry:{x:1060,y:1391},perch:{x:1620,y:top(1620)},merge:{x:2101,y:1573},preserved:['cart','more','witness','ridge','campaign-goal','marker-7'],optional:true};
 s.metadata.designRevision=2;
 return project;
}
