(function(G){'use strict';
const C=G.HONRO_CORE,M=G.HonroMaps,Q=G.HonroGeometry,clone=M.clone;
function profileFor(st){const p=C.defaults(),sid=st.metadata?.stageId||1;p.recruited=[...new Set(st.units.filter(u=>u.team==='player').map(u=>G.HONRO_CONTENT.hero[u.kind]?u.kind:u.cls).filter(Boolean))];if(!p.recruited.length)p.recruited=['archer'];for(const c of p.recruited)p.heroes[c].xp=G.HonroProgression.xpAt(G.HonroProgression.plan(sid).entryLevel);return p;}
function compile(st,project){
 const terrain=st.terrains.map(t=>Q.terrain(t,st.height)),elements=[],landmarks=[];
 for(const instance of st.elements){
  const asset=project.library.find(a=>a.id===instance.assetId);if(!asset)throw Error('Missing element '+instance.assetId);
  const e=clone(instance);if(e.snap){const hit=G.HonroMapEngine.surfaceY(terrain,e.x,e.y);if(hit)e.y=hit.y;}
  if(asset.renderer==='landmark'){
   const {assetId,scale,rotation,snap,...native}=e;
   landmarks.push({...native,kind:asset.kind,size:scale??e.size??1,rotation:rotation||0});
  }else{
   const collision=Q.collision(asset,e);for(const t of collision){t.honroElementId=e.id;t.honroElementCollision=true;}terrain.push(...collision);
   elements.push({...e,asset:clone(asset),collisionIds:collision.map(t=>t.id)});
  }
 }
 return{terrain,landmarks,elements,materials:st.materials.map(m=>Q.material(st,m,terrain))};
}
function createBattle(st,project,profile=profileFor(st)){
 const sid=st.metadata?.stageId||1,content=G.HONRO_CONTENT.stages[sid-1],b=C.createBattle(1,clone(profile),'practice',{party:['archer'],distance:900});
 Object.assign(b,clone(st.initialState||{}));
 const map=compile(st,project);
 Object.assign(b,{stage:sid,honroStage:sid,honroRevision:20,honroMapRevision:20,honroLayoutRevision:G.HonroLayouts.revision,
  honroCanonical:true,honroAuthoredId:st.id,honroCustom:st.metadata?.campaign!==true,honroBackdrop:st.backdrop,
  mode:'campaign',width:st.width,height:st.height,vertical:st.height>st.width*1.08,
  difficulty:profile.settings.difficulty,heroes:clone(profile.heroes),startXP:Object.fromEntries(Object.entries(profile.heroes).map(([c,h])=>[c,h.xp])),
  session:'honro-map-'+st.id+'-'+Date.now(),sceneVersion:st.initialState?.sceneVersion??80,
  terrain:map.terrain,honroLandmarks:map.landmarks,honroElements:map.elements,honroSurfaceZones:map.materials,
  honroMapAnchors:clone(st.anchors||{}),honroMap:clone(st.design||{}),honroRoute:clone(st.routes||[]),honroDetailStats:clone(st.detailStats||{}),
  honroMarkers:clone(st.markers||[]),honroEvents:clone(st.events.filter(e=>e.when)),honroAuthoredEvents:clone(st.events.filter(e=>!e.when)),honroObjectives:clone(st.objectives),
  projectiles:[],units:[],events:[],fields:[],drafts:[],waters:[],zones:[],decor:[],queue:[],phase:'aim',round:1,side:0,
  honroState:clone(st.initialState?.honroState||{flags:{},collected:[],hold:0,lastRound:1,rescued:false,combatLog:[]})});
 delete b.volley;delete b.summonTurn;delete b.honroGrowth;
 b.units=st.units.map(u=>G.HonroUnits.create(u,b,profile,content));
 b.active=b.units.find(u=>u.side===0&&!u.summoned)?.id||b.units[0]?.id;
 b.honroActiveLimit=st.initialState?.honroActiveLimit??content.active;b.enemyLimit=b.honroActiveLimit;
 b.honroCounters={initialEnemies:b.units.filter(u=>u.side===1).length,allyActions:0,spawned:0};
 G.HonroProgression.initialize(b,profile);return b;
}
// Imported legacy Workshop projects are normalized once; exported data is always v3.
function importSpec(spec,id='imported-stage'){
 const width=spec.dimensions[0],height=spec.dimensions[1],st=M.emptyStage(id,spec.design?.title||'Imported stage',width,height),map=G.HonroMapEngine.compile({id:1,w:width,h:height},spec);
 st.backdrop=spec.backdrop?.kind||'forest';st.design=clone(spec.design||{});st.anchors=map.anchors;st.routes=map.routes;
 st.terrains=map.terrain.map(t=>{const {vertices,x,y,w,h,id,mat,oneWay,indestructible,...properties}=t;return{id,name:id,type:'solid',points:vertices,baseMaterial:mat,oneWay,breakable:!indestructible,properties,layer:'terrain'};});
 st.materials=map.surfaceZones.map(m=>({...m,terrainId:m.support}));
 st.elements=map.landmarks.map((l,i)=>({...l,id:l.id||`landmark-${i}`,assetId:'builtin:'+l.kind,scale:l.size||1,rotation:0,snap:false}));
 st.units=(spec.editorData?.units||map.enemySpawns.map((s,i)=>G.HonroUnits.record(s.kind,'imported-foe-'+i,s.x,s.y,'enemy')));
 st.events=clone(spec.editorData?.events||[]);return st;
}
Object.assign(M,{compile,createBattle,profileFor,importSpec});
})(globalThis);
