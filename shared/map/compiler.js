(function(G){'use strict';
const C=G.HONRO_CORE,M=G.HonroMaps,Q=G.HonroGeometry,clone=M.clone;
const renderLayer=layer=>({far:'back',interactive:'prop',terrain:'prop',units:'front',events:'front'})[layer]||layer||'back';
function profileFor(st){const p=C.defaults(),sid=st.metadata?.stageId||1;p.recruited=[...new Set(st.units.filter(u=>u.team==='player').map(u=>G.HONRO_CONTENT.hero[u.kind]?u.kind:u.cls).filter(Boolean))];if(!p.recruited.length)p.recruited=['archer'];for(const c of p.recruited)p.heroes[c].xp=G.HonroProgression.xpAt(G.HonroProgression.plan(sid).entryLevel);return p;}
function compile(st,project){
 const terrain=st.terrains.map(t=>Q.terrain(t,st.height)),elements=[],landmarks=[];
 for(const instance of st.elements){
  const asset=project.library.find(a=>a.id===instance.assetId);if(!asset)throw Error('Missing element '+instance.assetId);
  const e=clone(instance);if(e.snap){const hit=G.HonroMapEngine.surfaceY(terrain,e.x,e.y);if(hit)e.y=hit.y;}
  if(asset.renderer==='landmark'){
   const {assetId,scale,rotation,snap,depthLayer,...native}=e;
   landmarks.push({...native,layer:renderLayer(native.layer),kind:asset.kind,size:scale??e.size??1,rotation:rotation||0});
  }else{
   const collision=Q.collision(asset,e);for(const t of collision){t.honroElementId=e.id;t.honroElementCollision=true;}terrain.push(...collision);
   const element={...e,kind:'canonical-element',asset:clone(asset),collisionIds:collision.map(t=>t.id)};
   elements.push(element);landmarks.push({...element,layer:renderLayer(e.layer)});
  }
 }
 const worldTerrain=st.terrainBounds?st.terrains.map(t=>({...Q.terrain(t,st.height,true),...(t.playProjection?{honroDomainProjection:clone(t.playProjection)}:{})})):null;
 return{terrain,worldTerrain,landmarks,elements,materials:st.materials.map(m=>Q.material(st,m,terrain))};
}
function createBattle(st,project,profile=profileFor(st),options={}){
 const sid=st.metadata?.stageId||1,content=G.HONRO_CONTENT.stages[sid-1],b=C.createBattle(1,clone(profile),'practice',{party:['archer'],distance:900});
 Object.assign(b,clone(st.initialState||{}));
 const map=compile(st,project);
 Object.assign(b,{stage:sid,honroStage:sid,honroRevision:20,honroMapRevision:20,honroLayoutRevision:G.HonroLayouts.revision,
  honroMapOrigin:options.origin==='campaign'?'campaign':'workshop',honroCanonical:true,honroAuthoredId:st.id,honroCustom:st.metadata?.campaign!==true,honroBackdrop:st.backdrop,
  honroEnvironment:{...clone(st.environment),placements:st.environment.placements.map(e=>({...clone(e),asset:clone(project.library.find(a=>a.id===e.assetId))}))},
  mode:'campaign',width:st.width,height:st.height,vertical:st.height>st.width*1.08,honroCamera:clone(st.camera||{}),
  difficulty:profile.settings.difficulty,heroes:clone(profile.heroes),startXP:Object.fromEntries(Object.entries(profile.heroes).map(([c,h])=>[c,h.xp])),
  session:'honro-map-'+st.id+'-'+Date.now(),sceneVersion:st.initialState?.sceneVersion??80,
  terrain:map.terrain,...(map.worldTerrain?{honroWorldTerrain:map.worldTerrain,honroPlayBounds:clone(st.playBounds),honroTerrainBounds:clone(st.terrainBounds),honroTerrainDomainVersion:1}:{}),honroLandmarks:map.landmarks,honroElements:map.elements,honroSurfaceZones:map.materials,
  honroMapAnchors:clone(st.anchors||{}),honroMap:clone(st.design||{}),honroRoute:clone(st.routes||[]),honroDetailStats:clone(st.detailStats||{}),
  honroMarkers:clone(st.markers||[]),honroEvents:clone(st.events.filter(e=>e.when)),honroAuthoredEvents:clone(st.events.filter(e=>!e.when)),honroObjectives:clone(st.objectives),
  projectiles:[],units:[],events:[],fields:[],drafts:[],waters:map.materials.filter(z=>z.conductive&&z.kind==='water-pool').map(z=>({x:z.surface[0][0],y:z.surface[0][1],w:z.surface[1][0]-z.surface[0][0],depth:Math.max(...z.bottom.map(p=>p[1]))-z.surface[0][1],bottom:z.bottom.map(([x,y])=>({x,y})),frozen:0,kind:'water'})),zones:[],decor:[],queue:[],phase:'aim',round:1,side:0,
  honroState:clone(st.initialState?.honroState||{flags:{},collected:[],hold:0,lastRound:1,rescued:false,combatLog:[]})});
 delete b.volley;delete b.summonTurn;delete b.honroGrowth;
 for(const e of b.honroAuthoredEvents){
  if(e.type==='interaction')b.honroMarkers.push({...clone(e),action:'authored',authoredAction:e.action});
  else if(e.type==='objective')b.honroObjectives.push({...clone(e),type:e.objectiveType||'reach'});
  else b.honroEvents.push({...clone(e),when:{region:{x:e.x,y:e.y,radius:e.radius||160,width:e.width,height:e.height}},action:e.action||(e.type==='spawn'?{type:'spawn',n:e.count||1,x:e.x,kind:e.unit?.kind||'hound'}:null),text:e.label,once:true});
 }
 for(const e of map.elements)if(e.asset.interactionType){
  const sockets=e.asset.sockets.length?e.asset.sockets:[{id:'anchor',x:e.asset.anchor.x,y:e.asset.anchor.y}];
  for(const socket of sockets){const position=Q.transformPoint(socket,e.asset,e);b.honroMarkers.push({id:`${e.id}:socket:${socket.id}`,type:'interaction',action:'authored',label:e.asset.name,elementId:e.id,...position});}
 }
 b.units=st.units.map(u=>G.HonroUnits.create(u,b,profile,content));
 for(const [i,group] of st.encounters.entries())if(group.behavior)for(const id of group.unitIds){const u=b.units.find(u=>u.id===id);if(u){u.group=i+1;u.honroCluster=group.key||group.id;if(group.behavior==='aggressive'){u.awake=true;u.aggroUntil=999;}if(group.behavior==='stationary')u.fixed=true;}}
 if(!options.legacyBalance)G.HonroEncounters.balance(b);
 b.active=b.units.find(u=>u.side===0&&!u.summoned)?.id||b.units[0]?.id;
 b.honroActiveLimit=st.initialState?.honroActiveLimit??content.active;b.enemyLimit=b.honroActiveLimit;
 b.honroCounters={initialEnemies:b.units.filter(u=>u.side===1).length,allyActions:0,spawned:0};
 G.HonroProgression.initialize(b,profile);
 // Compile the same initial elite roster for Game, Stage View and Playtest.
 // attach() remains idempotent for saved battles and later reinforcement waves.
 if(b.honroAct2Revision>=2)for(const u of b.units)if(u.side===1)G.HonroAct2?.tuneEncounter(u,b.honroStage);
 return b;
}
// Imported legacy Workshop projects are normalized once; exported data is always v3.
function importSpec(spec,id='imported-stage',project=G.HONRO_PROJECT){
 const width=spec.dimensions[0],height=spec.dimensions[1],st=M.emptyStage(id,spec.design?.title||'Imported stage',width,height),map=G.HonroMapEngine.compile({id:1,w:width,h:height},spec);
 st.backdrop=({ravine:'valley',village:'gate'})[spec.backdrop?.kind]||spec.backdrop?.kind||'forest';st.design=clone(spec.design||{});st.anchors=map.anchors;st.routes=map.routes;
 st.environment=G.HonroEnvironment.makeEnvironment(st);
 st.terrains=map.terrain.map(t=>{const {vertices,x,y,w,h,id,mat,oneWay,indestructible,...properties}=t;return{id,name:id,type:'solid',points:vertices,baseMaterial:mat,oneWay,breakable:!indestructible,properties,layer:'terrain'};});
 st.materials=map.surfaceZones.map(m=>({...m,terrainId:m.support}));
 st.elements=(spec.editorData?.elements?clone(spec.editorData.elements):map.landmarks.map((l,i)=>({...l,id:l.id||`landmark-scatter-${i}`,assetId:project.library.some(a=>a.id===l.kind)?l.kind:'builtin:'+l.kind,scale:l.size||1,rotation:l.rotation||0,snap:false}))).map(e=>({...e,depthLayer:'L1'}));
 st.units=(spec.editorData?.units||map.enemySpawns.map((s,i)=>G.HonroUnits.record(s.kind,'imported-foe-'+i,s.x,s.y,'enemy')));
 if(!st.units.some(u=>u.team==='player')){const x=map.anchors?.spawn?.x??220,y=G.HonroMapEngine.surfaceY(map.terrain,x)?.y??height/2;st.units.unshift(G.HonroUnits.record('archer','imported-player',x,y));}
 st.events=clone(spec.editorData?.events||[]);return st;
}
Object.assign(M,{compile,createBattle,profileFor,importSpec});
})(globalThis);
