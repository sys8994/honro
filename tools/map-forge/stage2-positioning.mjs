/** Keep the canyon/convoy encounter; reconnect its existing boughs to their supports. */
export function applyStage2Positioning(project){
 const s=project.stages.find(s=>s.metadata?.stageId===2);if(!s)return project;
 const smooth=ps=>ps.flatMap((p,i)=>Array.from({length:5},(_,j)=>{const a=ps[(i+ps.length-1)%ps.length],b=ps[(i+1)%ps.length],c=ps[(i+2)%ps.length],u=j/5;return Object.fromEntries(['x','y'].map(k=>[k,.5*((2*p[k])+(-a[k]+b[k])*u+(2*a[k]-5*p[k]+4*b[k]-c[k])*u*u+(-a[k]+3*p[k]-3*b[k]+c[k])*u*u*u)]));}));
 const branches={
  'left-tree-branch-upper':[[510,622],[650,650],[860,701],[1100,738],[1430,769],[1690,789],[1690,801],[1430,800],[1100,782],[860,747],[650,702],[520,659]],
  'left-tree-branch-middle':[[770,1002],[960,987],[1080,1047],[1260,1074],[1500,1131],[1500,1149],[1260,1126],[1080,1093],[950,1040],[780,1045]],
  'left-tree-branch-lower':[[1120,1854],[1280,1818],[1450,1830],[1600,1843],[1700,1882],[1698,1898],[1597,1877],[1454,1870],[1280,1875],[1120,1910]],
  'right-tree-branch-lower':[[2980,1501],[3140,1483],[3340,1460],[3550,1480],[3770,1550],[3780,1598],[3550,1528],[3340,1500],[3140,1517],[2980,1519]],
  'right-tree-branch-upper':[[3305,1229],[3480,1180],[3690,1160],[3880,1190],[4040,1200],[4040,1260],[3870,1240],[3690,1203],[3480,1221],[3315,1251]]
 };
 for(const t of s.terrains)if(branches[t.id])t.points=smooth(branches[t.id].map(([x,y])=>({x,y})));
 const floor=s.terrains.find(t=>t.id==='canyon-ground');
 const top=x=>{for(let i=0;i<floor.points.length-1;i++){const a=floor.points[i],b=floor.points[i+1];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}};
 s.design.positioning={version:1,question:'상단 가지에서 공중 적을 견제할까, 중하단 엄호턱으로 내려가 상여 앞을 먼저 비울까?',preserved:['procession-seen','road-pressure','sniper-seen','right-cliff','last-flight','escortGoalX:3340','stage2Airborne'],clusterPositions:{
  'foe-0-cluster':{x:2240,y:top(2240)},'foe-3-cluster':{x:2460,y:top(2460)},'foe-2-cluster':{x:2780,y:top(2780)},'foe-5-cluster':{x:3090,y:top(3090)}
 },roles:['서쪽 전위1850/2010','물길 우회 압박2240/2460','동쪽 멧돼지 차단2780/2940','출구 산개3090/3200','기존 공중 경고/대응 기회 보존']};
 return project;
}
