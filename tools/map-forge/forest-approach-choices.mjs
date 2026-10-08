/** Small, place-specific ACT1 choices. Do not turn every location into a tree
 * village: docks, the waterfall and broken bridge retain their main structure. */
const plans={
 1:{x:2101,floor:'forest-floor',name:'low-pine-root',role:'A first low bough connects the ground to the existing unequal pine branches.'},
 3:{x:4107.5,floor:'ferry-ground',name:'warehouse-side-pine',role:'A single tree at the warehouse approach supplements the existing docks and roof.'},
 4:{x:3027.4,floor:'gate-basin',name:'gate-flank-pine',role:'A short flank perch beside the east slope leaves the gate and refugee courtyard dominant.'},
 5:{x:787.6,floor:'valley-floor',name:'waterfall-approach-pine',role:'A low approach-tree angle faces the waterfall without replacing its seven climbing ledges.'},
 6:{x:5797.2,floor:'lower-road',name:'bridge-exit-pine',role:'One exit-bank branch supplements the broken bridge and lower rescue road.'},
 8:{x:6835.6,floor:'bier-road',name:'procession-end-pine',role:'A quiet end-of-procession tree angle contrasts with the long architectural eaves.'},
};
function top(st,id,x){const t=st.terrains.find(t=>t.id===id);for(let i=0;i<t.points.length;i++){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}throw Error(st.id+' missing floor '+id);}
export function applyForestApproachChoices(project){for(const st of project.stages){const n=st.metadata?.stageId,p=plans[n];if(n===9){st.terrains=st.terrains.filter(t=>!t.id.startsWith('fc-choice-'));delete st.design.forestChoice;}if(!p)continue;const id=`fc-choice-${n}-${p.name}`;st.terrains=st.terrains.filter(t=>!t.id.startsWith('fc-choice-'));const y=top(st,p.floor,p.x)-165;
 const shape=[[-120,12],[-38,3],[38,-6],[148,-12],[235,-30],[240,-8],[152,18],[66,34],[-13,29],[-93,36],[-129,29]];
 const points=shape.map(([dx,dy])=>({x:p.x+dx,y:y+dy}));
 st.terrains.push({id,name:p.name,type:'solid',points,baseMaterial:'wood',oneWay:true,breakable:false,properties:{hp:99999,maxHp:99999,route:false,surfaceKind:'wood',artSeed:n},layer:'terrain',detail:{spacing:18,roughness:0,seed:n,optimizeEpsilon:0}});
 const from={x:p.x,y:top(st,p.floor,p.x)},to={x:p.x,y:y-1.5};
 st.design.forestChoice={version:1,role:p.role,supportId:id,from,to,treeX:p.x,required:false};
 }return project;}
