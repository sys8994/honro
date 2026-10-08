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
const roofFaces={
12:[['#586974',[[7200,350],[7470,1200],[7790,1740],[7910,1880],[7660,1640],[7370,1170]]],['#273e4d',[[7550,700],[7730,850],[7850,1430],[8170,1710],[8360,1850],[8090,1840],[7780,1530]]],['#73838a',[[7480,1380],[7690,1550],[7960,1720],[8160,1780],[8050,1825],[7770,1730],[7600,1620]]],['#3d5561',[[7940,400],[8420,750],[8510,1410],[8230,1730],[7960,1440],[8080,1160]]]],
13:[['#526975',[[3960,1350],[4240,1750],[4560,2400],[4730,2940],[4540,3370],[4330,3340],[4410,2890],[4240,2410]]],['#243c4b',[[4810,1550],[5090,1980],[5000,2630],[5240,3220],[5440,3470],[5160,3430],[4840,2890],[4890,2420]]],['#6e8088',[[4270,2840],[4500,3010],[4700,3010],[4600,3140],[4420,3120],[4330,3010]]],['#627882',[[5480,2580],[5820,2770],[5980,3230],[6120,3580],[5910,3600],[5700,3240],[5520,3000]]],['#294351',[[5260,3280],[5540,3280],[5750,3430],[5980,3510],[6100,3660],[5790,3580],[5510,3430],[5290,3400]]]],
17:[['#566c77',[[6840,2720],[7180,2920],[7410,3230],[7520,3700],[7370,3770],[7210,3440],[7020,3280]]],['#243c4a',[[7470,2600],[7730,2830],[7650,3250],[7790,3520],[7790,3860],[7580,3820],[7520,3450],[7610,3050]]],['#6f8289',[[6970,3150],[7200,3250],[7400,3330],[7340,3440],[7170,3390],[7020,3290]]],['#607782',[[7900,2760],[8220,2790],[8360,3090],[8200,3540],[8010,3850],[7900,3800],[8080,3350],[8050,3080]]],['#2d4654',[[7280,3590],[7500,3650],[7750,3730],[8020,3750],[8100,3850],[7790,3880],[7500,3780],[7310,3700]]]]};
export function applyCavernTransitionLayers(project,{existingOnly=false}={}){
 for(const st of project.stages){const id=st.metadata?.stageId;if(!selected.has(id)||existingOnly&&!st.design?.cavernTransitions)continue;
  const sp=st.design.space,floor=st.terrains.find(t=>t.id==='act2-floor'),ground=x=>at(floor.points,x),prefix='ct-';
  st.terrains=st.terrains.filter(t=>!t.id.startsWith(prefix));sp.surfaces=sp.surfaces.filter(t=>!t.id.startsWith(prefix));sp.routes=sp.routes.filter(t=>!t.id.startsWith(prefix));sp.terrainPlanes=(sp.terrainPlanes||[]).filter(p=>!p.transitionLayer);for(const room of sp.rooms)room.terrainIds=room.terrainIds.filter(t=>!t.startsWith(prefix));
  sp.rockCompositions=compositions[id];const choices=[];
  if(id===17){const roof=st.terrains.find(t=>t.id==='cave-roof'),profile=[[6800,2810.112359550562],[7250,3700],[7650,3820],[8000,3850],[8400,3200]].map(([x,y])=>({x,y}));for(const p of roof.points)if(p.x>=6800&&p.x<=8400&&p.y>0)p.y=at(profile,p.x);}

  for(const [name,x,w,lift,roomId]of deckPlans[id]||[]){const key=prefix+name,y=ground(x)-lift,l=x-w/2,r=x+w/2;
   const t={id:key,name:key,type:'solid',points:[[l,y],[r,y],[r,y+25],[l,y+25]].map(([x,y])=>({x,y})),baseMaterial:'wood',oneWay:true,breakable:false,layer:'terrain',properties:{hp:99999,maxHp:99999,optional:true,honroCave:true,surfaceKind:'wood',honroSpaceSurfaceId:key,honroSurfaceRole:'shelf',honroWalkEdges:[0]},detail:{spacing:18,roughness:0,seed:id===19?18:id,optimizeEpsilon:0}};
   st.terrains.push(t);sp.surfaces.push({id:key,terrainId:key,role:'shelf',edgeIndices:[0],roomIds:[roomId]});sp.rooms.find(q=>q.id===roomId).terrainIds.push(key);
   const enterLeft=ground(l+30)<ground(r-30),entryX=enterLeft?l+30:r-30,farX=enterLeft?r-45:l+45,exitX=enterLeft?r+85:l-85,route=[{x:entryX,y:ground(entryX),surfaceId:'floor-main'},{x:entryX,y,surfaceId:key},{x:farX,y,surfaceId:key},{x:exitX,y:ground(exitX),surfaceId:'floor-main'}];
   sp.routes.push({id:key,kind:'optional-jump',anchors:route,requires:[]});choices.push({id:key,x,y,route});
  }
  for(const [index,[l,r,depth]]of bedding[id].entries()){const w=r-l,a=ground(l),z=ground(r),mid=l+w*.61,top=ground(mid),push=(fill,points)=>sp.terrainPlanes.push({terrainId:'act2-floor',transitionLayer:true,fill,points});
   push('#64727a',[[l,a],[l+w*.29,ground(l+w*.29)],[mid,top],[mid-w*.10,top+depth*.34],[l+w*.17,a+depth*.58],[l+w*.02,a+depth*.47]]);
   push('#344c5a',[[mid,top],[r,z],[r-w*.11,z+depth*.47],[mid-w*.06,top+depth],[mid-w*.15,top+depth*.38]]);
   if(index===0)push('#748487',[[l+w*.06,a+depth*.28],[l+w*.28,a+depth*.32],[mid-w*.12,top+depth*.20],[mid-w*.15,top+depth*.28],[l+w*.27,a+depth*.40],[l+w*.1,a+depth*.38]]);
   else if(index===1)push('#73838a',[[l+w*.05,a+depth*.04],[l+w*.22,a+depth*.08],[l+w*.32,a+depth*.27],[l+w*.26,a+depth*.50],[l+w*.14,a+depth*.56],[l+w*.19,a+depth*.31]]);
   else push('#73858c',[[l+w*.11,a+depth*.51],[l+w*.30,a+depth*.55],[mid-w*.16,top+depth*.44],[mid-w*.22,top+depth*.57],[l+w*.25,a+depth*.65],[l+w*.1,a+depth*.6]]);
   push('#172f3e',[[mid-w*.02,top+8],[mid+w*.025,top+12],[mid-w*.065,top+depth*.42],[mid-w*.04,top+depth*.89],[mid-w*.095,top+depth*.93],[mid-w*.11,top+depth*.40]]);
  }
  for(const [fill,points]of roofFaces[id]||[])sp.terrainPlanes.push({terrainId:id===12?'quarry-cave-mouth':'cave-roof',transitionLayer:true,fill,points});
  st.design.cavernTransitions={version:1,decision:id<=12?'preserve-rising-approach':id===13?'preserve-low-throat':id===17?'preserve-hoist-workbays':'shared-bell-upper-choices',choices,views:choices.flatMap(q=>[{name:q.id+'-default',x:q.x,y:q.y-100,scale:.59,width:1440,height:960},{name:q.id+'-portrait',x:q.x,y:q.y-100,scale:.46,width:720,height:1080}])};
 }
 return project;
}
