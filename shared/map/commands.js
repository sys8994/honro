(function(G){'use strict';
const M=G.HonroMaps,Q=G.HonroGeometry,clone=M.clone;
const uid=prefix=>prefix+'-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
const aliases={createTerrain:'terrain.add',editTerrain:'terrain.moveNode',simplifyTerrain:'terrain.optimize',roughenTerrain:'terrain.roughen',paintMaterial:'material.paint',placeElement:'element.place',scatterElements:'element.scatter',placeUnit:'unit.place',createEncounter:'encounter.add',createTrigger:'event.place',createObjective:'objective.add'};
const points=arr=>(arr||[]).map(p=>Array.isArray(p)?{x:p[0],y:p[1]}:{...p});
const collections=['terrains','materials','elements','units','events','encounters','objectives','markers'];
function target(st,id){for(const key of collections){const o=st[key]?.find(x=>x.id===id);if(o)return{key,o};}for(const key of ['placements','surfaces','groups','zones']){const o=st.environment?.[key]?.find(x=>x.id===id);if(o)return{key:key==='placements'?'scenery':key,o};}throw Error('Object not found '+id);}
function apply(input,commands){
 const p=clone(input);
 for(const original of commands){const c={...original,op:aliases[original.op]||original.op},st=p.stages.find(s=>s.id===(c.stageId||p.activeStageId));if(!st)throw Error('Stage not found');
  switch(c.op){
  case'world.set':{const changed=['width','height','backdrop'].some(k=>c[k]!==undefined&&c[k]!==st[k]);for(const k of ['width','height','backdrop','name'])if(c[k]!==undefined)st[k]=c[k];if(changed)G.HonroEnvironment.resize(st);break;}
  case'stage.update':for(const k of ['metadata','anchors','routes','design','detailStats','initialState','meta','environment','camera'])if(c.values?.[k]!==undefined)st[k]=clone(c.values[k]);break;
  case'object.update':{const {o}=target(st,c.id);for(const [k,v] of Object.entries(c.values||{})){if(k==='id')throw Error('Use rename to change an ID');o[k]=clone(v);}break;}
  case'asset.add':if(p.library.some(a=>a.id===c.asset?.id))throw Error('Duplicate asset '+c.asset.id);p.library.push(clone(c.asset));break;
  case'terrain.add':case'terrain.addSolid':{
   const solid=c.op==='terrain.addSolid'||c.type==='solid',t={id:c.id||uid('terrain'),name:c.name||'Terrain',type:solid?'solid':c.type||'ground',baseMaterial:c.material||'soil',breakable:!!c.breakable,oneWay:!!c.oneWay,layer:'terrain',detail:{spacing:c.spacing??18,roughness:c.roughness??0,seed:c.seed??42,optimizeEpsilon:c.optimizeEpsilon??0}};
   if(c.properties)t.properties=clone(c.properties);
   if(solid)t.points=points(c.points);else{t.control=points(c.control);t.floor=c.floor??st.height+180;t.thickness=c.thickness??80;}st.terrains.push(t);break;
  }
  case'terrain.moveNode':{const t=target(st,c.id).o,ps=t.type==='solid'?t.points:t.control;if(!ps?.[c.index])throw Error('Terrain node not found');for(const k of ['x','y'])if(c[k]!==undefined)ps[c.index][k]=c[k];break;}
  case'terrain.optimize':{const t=target(st,c.id).o;if(t.type==='solid')t.points=Q.simplifyClosed(t.points,c.epsilon??0);else{t.detail??={};t.detail.optimizeEpsilon=c.epsilon??0;}break;}
  case'terrain.roughen':{const t=target(st,c.id).o;if(t.type==='solid'){const r=Q.seeded(c.seed??1);t.points=t.points.map(v=>({x:v.x,y:v.y+(r()-.5)*2*(c.roughness??0)}));}else{t.detail??={};t.detail.roughness=c.roughness??0;t.detail.seed=c.seed??1;}break;}
  case'material.paint':st.materials.push({id:c.id||uid('material'),terrainId:c.terrainId,x1:c.x1,x2:c.x2,reference:c.reference,kind:c.kind||'grass',depth:c.depth??25,alpha:c.alpha??.9,...(c.points?{points:clone(c.points)}:{})});break;
  case'element.place':{
   const a=p.library.find(a=>a.id===c.assetId);if(!a)throw Error('Unknown asset '+c.assetId);
   const e={id:c.id||uid('element'),assetId:a.id,x:c.x,y:c.y??0,rotation:(c.rotation||0)*Math.PI/180,scale:c.scale??1,layer:c.layer||a.layer||(a.collision.length?'interactive':'back'),depthLayer:'L1',snap:c.snap!==false};
   if(e.snap){const sf=Q.nearest(st,e.x,c.y);if(sf)e.y=sf.y;}st.elements.push(e);break;
  }
  case'scenery.place':{
   const a=p.library.find(a=>a.id===c.assetId);if(!a)throw Error('Unknown scenery asset '+c.assetId);
   st.environment.placements.push(G.HonroEnvironment.place(st,a,{...c,id:c.id||uid('scenery')}));break;
  }
  case'environment.set':st.environment.atmosphere=clone(c.atmosphere);break;
  case'scenic.add':st.environment.groups.push(clone(c.group));break;
  case'support.add':st.environment.surfaces.push(clone(c.surface));break;
  case'zone.update':{const z=st.environment.zones.find(z=>z.id===c.id);if(!z)throw Error('Zone not found');Object.assign(z,clone(c.values));break;}
  case'scenery.attach':{const e=target(st,c.id).o,a=p.library.find(a=>a.id===e.assetId),old=G.HonroEnvironment.groupOf(st,e),group=c.groupId?st.environment.groups.find(g=>g.id===c.groupId):st.environment.groups.find(g=>g.depthLayer===(c.depthLayer||e.depthLayer)&&g.zoneId===(c.zoneId||old?.zoneId));if(!group)throw Error('Scenic group not found');const next=G.HonroEnvironment.place(st,a,{id:e.id,scale:e.scale,depthLayer:group.depthLayer,groupId:group.id,supportId:c.supportId,localX:c.localX??e.x,offsetY:c.offsetY??0,rotation:e.rotation*180/Math.PI});Object.assign(e,next);break;}
  case'element.scatter':{
   const r=Q.seeded(c.seed??1),ids=c.assetIds||[c.assetId];
   for(let i=0;i<(c.count??8);i++){const a=p.library.find(a=>a.id===ids[i%ids.length]);if(!a)throw Error('Unknown scatter asset');const x=(c.x1??0)+r()*((c.x2??st.width)-(c.x1??0)),sf=Q.nearest(st,x,c.y??st.height/2);if(!sf)continue;
    st.elements.push({id:uid('element'),assetId:a.id,x,y:sf.y,rotation:(r()-.5)*(c.rotationVariance??.3),scale:(c.minScale??.7)+r()*((c.maxScale??1.4)-(c.minScale??.7)),layer:c.layer||a.layer||(a.collision.length?'interactive':'back'),depthLayer:'L1',snap:true,scatter:true});}
   break;
  }
  case'unit.place':{
   const u=G.HonroUnits.record(c.kind||'hound',c.id||uid('unit'),c.x,c.y??0,c.team);
   if(c.snap!==false){const sf=Q.nearest(st,c.x,c.y);if(sf)u.y=sf.y;}
   for(const k of ['facing','rank','levelOverride','encounterGroup','behavior','boss','miniboss','stageOverrides','label'])if(c[k]!==undefined)u[k]=clone(c[k]);
   st.units.push(u);break;
  }
  case'unit.update':{
   const {o:u}=target(st,c.id),kind=c.kind||c.values?.kind;if(kind&&kind!==u.kind){const fresh=G.HonroUnits.record(kind,u.id,u.x,u.y,c.team||c.values?.team||u.team);for(const k of Object.keys(u))delete u[k];Object.assign(u,fresh);}
   for(const [k,v] of Object.entries(c.values||{}))u[k]=clone(v);break;
  }
  case'element.move':case'unit.move':case'move':{
   const {o,key}=target(st,c.id);const dx=c.dx??(c.x!==undefined?c.x-(o.x??0):0),dy=c.dy??(c.y!==undefined?c.y-(o.y??0):0);
   if(o.points||o.control){for(const q of o.points||o.control){q.x+=dx;q.y+=dy;}if(o.floor!==undefined)o.floor+=dy;}
   else{if(c.x!==undefined)o.x=c.x;else if(o.x!==undefined)o.x+=dx;if(c.y!==undefined)o.y=c.y;else if(o.y!==undefined)o.y+=dy;}
   if(c.rotation!==undefined)o.rotation=c.rotation*Math.PI/180;if(c.scale!==undefined)o.scale=c.scale;
   if(key==='scenery'&&o.supportId)o.y=c.offsetY??0;
   if(c.snap&&o.x!==undefined){const sf=Q.nearest(st,o.x,o.y);if(sf)o.y=sf.y;}break;
  }
  case'rotate':case'scale':{const {key,o}=target(st,c.id);if(key!=='elements')throw Error('rotate/scale require an element instance');if(c.op==='rotate')o.rotation=(c.degrees??c.rotation??0)*Math.PI/180;else o.scale=c.factor??c.scale??1;break;}
  case'event.place':st.events.push({id:c.id||uid('event'),type:c.type||'trigger',x:c.x,y:c.y,label:c.label||c.type||'Trigger',radius:c.radius??160,...(c.when?{when:clone(c.when)}:{}),...(c.action?{action:clone(c.action)}:{}),...(c.lines?{lines:clone(c.lines)}:{}),...(c.unit?{unit:clone(c.unit)}:{})});break;
  case'objective.add':st.objectives.push({id:c.id||uid('objective'),type:c.type||'clear',label:c.label||'목표',x:c.x,y:c.y,radius:c.radius??160,targetId:c.targetId,flag:c.flag,required:c.required!==false});break;
  case'encounter.add':st.encounters.push({id:c.id||uid('encounter'),key:c.key||c.id,unitIds:clone(c.unitIds||[]),behavior:c.behavior||'guard'});break;
  case'asset.optimize':{const a=p.library.find(a=>a.id===c.id);if(!a)throw Error('Missing asset');if(a.vector)throw Error('SVG path assets must be edited in their original source; polygon optimization is not supported');a.visual=a.visual.map(sh=>({...sh,points:Q.simplifyClosed(sh.points,c.epsilon??2)}));if(a.collisionMode!=='independent'&&a.collision.length)a.collision=clone(a.visual.map(sh=>sh.points));break;}
  case'asset.update':{const a=p.library.find(a=>a.id===c.id);if(!a)throw Error('Missing asset');Object.assign(a,clone(c.values));break;}
  case'rename':{
   target(st,c.id);if(!c.newId||collections.some(k=>st[k].some(o=>o.id===c.newId))||['placements','groups','surfaces','zones'].some(k=>st.environment[k].some(o=>o.id===c.newId)))throw Error('ID must be nonempty and unique');
   const visit=o=>{if(!o||typeof o!=='object')return;for(const k of Object.keys(o)){if(o[k]===c.id)o[k]=c.newId;else visit(o[k]);}};visit(st);break;
  }
  case'element.delete':case'delete':{
   target(st,c.id);for(const k of collections)st[k]=st[k].filter(o=>o.id!==c.id);for(const k of ['placements','surfaces','groups','zones'])st.environment[k]=st.environment[k].filter(o=>o.id!==c.id);
   st.materials=st.materials.filter(m=>(m.terrainId||m.support)!==c.id);for(const e of st.encounters)e.unitIds=e.unitIds.filter(id=>id!==c.id);break;
  }
  default:throw Error('Unknown command '+c.op);
  }
 }
 return M.finalize(p);
}
G.HonroCommands={apply,aliases};
})(globalThis);
