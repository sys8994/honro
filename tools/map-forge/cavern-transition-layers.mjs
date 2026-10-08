/** Conservative transition pass: existing story contacts and required floor stay
 * canonical. Narrow work decks are explicitly one-way timber, never pretend
 * solid granite. Stages 18/19 share the same physical bell-room additions. */
const selected=new Set([11,12,13,17,18,19]);
const at=(ps,x)=>{for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}throw Error('No floor at '+x);};
const deckPlans={13:[['gallery-work-deck',5700,420,220,'low-gallery']],17:[['notes-work-deck',7510,360,210,'work-notes']],18:[['chain-upper-deck',4050,520,185,'chain-shoulder'],['keeper-upper-deck',7730,380,210,'keeper-ledge']],19:[['chain-upper-deck',4050,520,185,'chain-shoulder'],['keeper-upper-deck',7730,380,210,'keeper-ledge']]};
const compositions={
11:[['east-knot-court','shoulder',.14,1450,800,-1],['resident-bank','buttress',.10,1550,1320,1],['north-trace','quarry',.8,1900,1750,1]],
12:[['rockfall-cut','quarry',.70,2300,1900,1],['sign-yard','shoulder',.7,1800,1150,-1],['outer-mouth','buttress',.95,1500,2500,1]],
13:[['mason-ledge','shoulder',.20,1450,1450,-1],['stone-threshold','quarry',.18,1900,2000,1],['inner-pocket','buttress',.88,1450,1250,1]],
17:[['brace-workyard','buttress',.17,1650,1450,-1],['hoist-bay','quarry',.80,2500,2300,1],['work-notes','shoulder',.94,1450,1050,1]],
18:[['bell-entry','shoulder',.2,1850,1550,-1],['chain-shoulder','buttress',.43,1550,2150,-1],['keeper-ledge','quarry',.68,2850,2700,1]],
19:[['bell-entry','shoulder',.2,1850,1550,-1],['chain-shoulder','buttress',.43,1550,2150,-1],['keeper-ledge','quarry',.68,2850,2700,1]]};
// Broad bedding and offset joint faces, clipped by the real floor polygon.
// Distinct room-scale locations avoid an evenly tiled rock stamp.
const bedding={11:[[2500,3150,410],[4570,5160,610],[6410,7180,750]],12:[[1160,1840,500],[3850,4520,770],[5840,6560,690]],13:[[1870,2790,650],[4630,5410,490],[6700,7560,780]],17:[[1260,2210,520],[3760,4410,860],[7160,8010,620]],18:[[3410,4370,800],[7500,8460,960]],19:[[3410,4370,800],[7500,8460,960]]};
export function applyCavernTransitionLayers(project,{existingOnly=false}={}){
 for(const st of project.stages){const id=st.metadata?.stageId;if(!selected.has(id)||existingOnly&&!st.design?.cavernTransitions)continue;
  const sp=st.design.space,floor=st.terrains.find(t=>t.id==='act2-floor'),ground=x=>at(floor.points,x),prefix='ct-';
  st.terrains=st.terrains.filter(t=>!t.id.startsWith(prefix));sp.surfaces=sp.surfaces.filter(t=>!t.id.startsWith(prefix));sp.routes=sp.routes.filter(t=>!t.id.startsWith(prefix));sp.terrainPlanes=(sp.terrainPlanes||[]).filter(p=>!p.transitionLayer);for(const room of sp.rooms)room.terrainIds=room.terrainIds.filter(t=>!t.startsWith(prefix));
  sp.rockCompositions=compositions[id];const choices=[];
  for(const [name,x,w,lift,roomId]of deckPlans[id]||[]){const key=prefix+name,y=ground(x)-lift,l=x-w/2,r=x+w/2;
   const t={id:key,name:key,type:'solid',points:[[l,y],[r,y],[r,y+25],[l,y+25]].map(([x,y])=>({x,y})),baseMaterial:'wood',oneWay:true,breakable:false,layer:'terrain',properties:{hp:99999,maxHp:99999,optional:true,honroCave:true,surfaceKind:'wood',honroSpaceSurfaceId:key,honroSurfaceRole:'shelf',honroWalkEdges:[0]},detail:{spacing:18,roughness:0,seed:id===19?18:id,optimizeEpsilon:0}};
   st.terrains.push(t);sp.surfaces.push({id:key,terrainId:key,role:'shelf',edgeIndices:[0],roomIds:[roomId]});sp.rooms.find(q=>q.id===roomId).terrainIds.push(key);
   const enterLeft=ground(l+30)<ground(r-30),entryX=enterLeft?l+30:r-30,farX=enterLeft?r-45:l+45,exitX=enterLeft?r+85:l-85,route=[{x:entryX,y:ground(entryX),surfaceId:'floor-main'},{x:entryX,y,surfaceId:key},{x:farX,y,surfaceId:key},{x:exitX,y:ground(exitX),surfaceId:'floor-main'}];
   sp.routes.push({id:key,kind:'optional-jump',anchors:route,requires:[]});choices.push({id:key,x,y,route});
  }
  for(const [l,r,depth]of bedding[id]){const w=r-l,a=ground(l),z=ground(r),mid=l+w*.61,top=ground(mid),push=(fill,points)=>sp.terrainPlanes.push({terrainId:'act2-floor',transitionLayer:true,fill,points});
   push('#64727a',[[l,a],[l+w*.29,ground(l+w*.29)],[mid,top],[mid-w*.10,top+depth*.34],[l+w*.17,a+depth*.58],[l+w*.02,a+depth*.47]]);
   push('#344c5a',[[mid,top],[r,z],[r-w*.11,z+depth*.47],[mid-w*.06,top+depth],[mid-w*.15,top+depth*.38]]);
   push('#829092',[[l+w*.06,a+depth*.28],[l+w*.30,a+depth*.34],[mid-w*.12,top+depth*.26],[mid-w*.15,top+depth*.36],[l+w*.29,a+depth*.44],[l+w*.1,a+depth*.38]]);
   push('#172f3e',[[mid-w*.02,top+8],[mid+w*.025,top+12],[mid-w*.065,top+depth*.42],[mid-w*.04,top+depth*.89],[mid-w*.095,top+depth*.93],[mid-w*.11,top+depth*.40]]);
  }
  st.design.cavernTransitions={version:1,decision:id<=12?'preserve-rising-approach':id===13?'preserve-low-throat':id===17?'preserve-hoist-workbays':'shared-bell-upper-choices',choices,views:choices.flatMap(q=>[{name:q.id+'-default',x:q.x,y:q.y-100,scale:.59,width:1440,height:960},{name:q.id+'-portrait',x:q.x,y:q.y-100,scale:.46,width:720,height:1080}])};
 }
 return project;
}
