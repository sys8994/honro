/** Stage 1: the existing pine offers an early optional firing route, not more platforms. */
export function applyStage1Positioning(project){
 const s=project.stages.find(s=>s.metadata?.stageId===1);if(!s)return project;
 const t=s.terrains.find(t=>t.id==='pine-branch-west');
 // A low tip before the first encounter rises into the existing trunk at x1682.
 t.points=[[1030,1394],[1110,1390],[1190,1378],[1310,1348],[1430,1320],[1550,1292],[1682,1270],[1760,1279],[1875,1300],[1960,1321],[2032,1335],[2028,1356],[1870,1334],[1680,1342],[1540,1350],[1435,1351],[1195,1399],[1030,1403]].map(([x,y])=>({x,y}));
 // Smooth the authored bends into a living tapered bough; collision and visible outline share these points.
 const smooth=ps=>ps.flatMap((p,i)=>Array.from({length:5},(_,j)=>{const a=ps[(i+ps.length-1)%ps.length],b=ps[(i+1)%ps.length],c=ps[(i+2)%ps.length],u=j/5;return Object.fromEntries(['x','y'].map(k=>[k,.5*((2*p[k])+(-a[k]+b[k])*u+(2*a[k]-5*p[k]+4*b[k]-c[k])*u*u+(-a[k]+3*p[k]-3*b[k]+c[k])*u*u*u)]));}));
 t.points=smooth(t.points);
 const east=s.terrains.find(t=>t.id==='pine-branch-east');east.points=smooth(east.points);
 const boulder=s.elements.find(e=>e.id==='forest-boulder-a');boulder.scale=.55;boulder.y=1460;
 const rootStone=s.elements.find(e=>e.id==='forest-boulder-b');Object.assign(rootStone,{x:1760,y:1540,scale:.55});
 const top=x=>{for(let i=0;i<t.points.length-1;i++){const a=t.points[i],b=t.points[i+1];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}};
 // Keep the original combat budgets and encounter IDs; separate lower pursuit and bough guard.
 const guard=s.units.find(u=>u.id==='foe-3');guard.x=1810;guard.y=top(guard.x);
 const rest=s.markers.find(m=>m.id==='marker-4');rest.x=1850;rest.y=1507;rest.label='고목 아래 쉼터';
 const sector=s.markers.find(m=>m.id==='marker-3');sector.label='고목 위 사격 자리';sector.y=top(sector.x);
 s.design.positioning={version:1,question:'산개가 있는 아래 길로 접근할까, 먼저 낮은 가지 끝을 올라 내려다보며 쏠까?',entry:{x:1060,y:1391},perch:{x:1620,y:top(1620)},merge:{x:2101,y:1573},preserved:['cart','more','witness','ridge','campaign-goal','marker-7'],optional:true};
 // The eastern climb has two broad firing shelves with a retreat pocket, not a continuous ramp.
 const floor=s.terrains.find(t=>t.id==='forest-floor'),old=structuredClone(floor.points);
 const height=(ps,x)=>{for(let i=0;i<ps.length-1;i++){const a=ps[i],b=ps[i+1];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}return 0;};
 const crest=[[3190,height(old,3190)],[3320,1300],[3500,1300],[3620,1160],[3820,1160],[3980,1000],[4100,900],[4200,860]];
 const before=old.findIndex(p=>p.x>=3190),after=old.findIndex((p,i)=>i>before&&p.x>=4200);
 floor.points=[...old.slice(0,before),...crest.map(([x,y])=>({x,y})),...old.slice(after+1)];
 const dy=x=>x>=3190&&x<=4200?height(floor.points,x)-height(old,x):0;
 for(const e of s.elements){if(e.x>=3190&&e.x<4200)e.y+=dy(e.x);}
 for(const e of s.design.act1Scene.scenery||[]){if(e.x>=3190&&e.x<4200){e.y+=dy(e.x);for(const c of e.rootContacts||[])c.y+=dy(c.x);}}
 for(const e of [...s.units,...s.markers,...(s.routes||[])])if(e.x>=3190&&e.x<4200&&Math.abs(e.y-height(old,e.x))<180)e.y+=dy(e.x);
 // Replace the broad painted grass slab with the existing narrow surface rim and geological faces.
 s.materials=s.materials.filter(m=>m.id!=='green-ridge');
 s.design.positioning.ridge={lower:{x:3430,y:1300},upper:{x:3760,y:1160},crest:{x:4010,y:975},question:'Lower shelf closes on the ridge guard; the exposed upper shelf opens the airborne angle.'};
 s.design.positioning.clusterPositions={
  'foe-0-cluster':{x:1950,y:height(floor.points,1950)},
  'foe-3-cluster':{x:3050,y:height(floor.points,3050)},
  'foe-1-cluster':{x:3910,y:820},
  'foe-2-cluster':{x:4300,y:890}
 };
 s.metadata.designRevision=3;

 return project;
}
