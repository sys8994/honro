(function(G){'use strict';
const VERSION=5,clone=x=>JSON.parse(JSON.stringify(x)),C=G.HONRO_CORE;
const arrays=['terrains','materials','elements','units','events','encounters','objectives','markers','layers'];
function layers(){return['far','mid','back','structural-back','terrain','interactive','prop','units','events','front','L2','L3','L4','L5'].map(id=>({id,name:id,visible:true,locked:false}));}
function emptyStage(id='stage-new',name='새 스테이지',width=5000,height=3200){const st={id,name,width,height,backdrop:'forest',metadata:{stageId:1,campaign:false},terrains:[],materials:[],elements:[],units:[],events:[],encounters:[],objectives:[],markers:[],layers:layers(),meta:{notes:'',seed:12031},initialState:{}};st.environment=G.HonroEnvironment.makeEnvironment(st);return st;}
// ACT1 scenery annotations follow the authoritative editable instances. This
// runs for command edits and direct Workshop drag/property/delete commits alike.
function reconcileAct1Scene(st,library=[]){
 const scene=st.design?.act1Scene;if(!scene||scene.version!==1)return;
 const elements=new Map((st.elements||[]).map(e=>[e.id,e])),colliding=id=>{const e=elements.get(id),a=e&&library.find(a=>a.id===e.assetId);return !!(a?.collision?.length||a?.interactionType);},terrains=new Set((st.terrains||[]).map(t=>t.id));
 if(Array.isArray(scene.scenery))scene.scenery=scene.scenery.filter(r=>!r||typeof r!=='object'||typeof r.id!=='string'||elements.has(r.id)&&!colliding(r.id)&&terrains.has(r.supportId)).map(r=>{
  if(!r||typeof r!=='object')return r;const e=elements.get(r.id);if(!e)return r;
  const changed=e.x!==r.x||e.y!==r.y||(e.scale??1)!==r.scale||e.assetId!==r.assetId;
  if(!changed)return r;const nearest=G.HonroGeometry?.nearest(st,e.x,e.y);
  return{...r,assetId:e.assetId,x:e.x,y:e.y,scale:e.scale??1,supportId:nearest?.terrain?.id||r.supportId,footOffset:0,rootContacts:[]};
 });
 if(Array.isArray(scene.replaced))scene.replaced=scene.replaced.filter(id=>typeof id!=='string'||elements.has(id)&&!colliding(id));
 if(Array.isArray(scene.rocks))scene.rocks=scene.rocks.filter(r=>!r||typeof r!=='object'||!r.supportId||terrains.has(r.supportId));
}
function normalize(input){
 const p=clone(input);if(!p||!Array.isArray(p.stages)||!Array.isArray(p.library))throw Error('Expected a HONRO project with stages and library');
 if(p.version>VERSION)throw Error('Unsupported future map version '+p.version);
 // v4 already has WORLD composition; only v1–v3 need legacy geometry/environment handling.
 const legacy=(p.version||1)<4;
 if(legacy){for(const st of p.stages)st.backdrop=({ravine:'valley',village:'gate'})[st.backdrop]||st.backdrop||'forest';G.HonroEnvironment.upgradeLegacy(p);}
 else if((p.environmentVersion||1)<G.HonroEnvironment.VERSION)G.HonroEnvironment.upgradeComposition(p);
 p.schema='honro-map';p.version=VERSION;p.settings={grid:40,snap:true,autosave:true,adaptiveLOD:true,...p.settings};p.activeStageId??=p.stages[0]?.id;
 for(const a of p.library){a.visual??=[];a.collision??=[];a.anchor??={x:0,y:0};a.sockets??=[];a.tags??=[];a.params??={};}
 for(const st of p.stages){st.metadata??={stageId:1,campaign:false};st.meta??={notes:''};st.initialState??={};for(const a of arrays)st[a]??=a==='layers'?layers():[];if(legacy)for(const l of ['L2','L3','L4','L5'])if(!st.layers.some(x=>x.id===l))st.layers.push({id:l,name:l,visible:true,locked:false});for(const t of st.terrains)t.detail??={spacing:18,roughness:0,seed:1,optimizeEpsilon:0};}
 for(const st of p.stages)reconcileAct1Scene(st,p.library);
 return p;
}
function validate(project){
 const out=[],issue=(level,text)=>out.push({level,text});
 if(project.schema!=='honro-map'||project.version!==VERSION)issue('err','Unsupported canonical map schema');
 const unique=(items,label)=>{const ids=new Set();for(const o of items){if(!o.id||ids.has(o.id))issue('err',`${label}: missing/duplicate ID ${o.id}`);ids.add(o.id);}return ids;};
 const assets=unique(project.library,'library');unique(project.stages,'stages');
 if(!project.stages.length||!project.stages.some(s=>s.id===project.activeStageId))issue('err','Missing active stage');
 for(const a of project.library){
  if(a.vector){if(!G.HonroVectorArt)issue('err',`${a.id}: vector renderer schema unavailable`);else for(const error of G.HonroVectorArt.validate(a.vector))issue('err',`${a.id}: ${error}`);}
  for(const pts of [...(a.visual||[]).map(s=>s.points||[]),...(a.collision||[])])if(pts.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))issue('err',`${a.id}: invalid asset coordinates`);
 }
 for(const st of project.stages){
  if(st.design?.space){if(!G.HonroSpaceLayout)issue('err',`${st.id}: spatial schema unavailable`);else for(const error of G.HonroSpaceLayout.validate(st))issue('err',error);}
  if(st.design?.act1Scene){
   const scene=st.design.act1Scene,terrainIds=new Set((st.terrains||[]).map(t=>t.id)),elements=new Map((st.elements||[]).map(e=>[e.id,e])),label=st.id+': ACT1 scene';
   if(scene.version!==1)issue('err',label+' unsupported version');
   for(const name of ['scenery','rocks','replaced','lights'])if(!Array.isArray(scene[name])||scene[name].length>128)issue('err',label+' invalid '+name);
   for(const r of Array.isArray(scene.rocks)?scene.rocks:[]){if(!r||typeof r!=='object'){issue('err',label+' invalid rock record');continue;}if(!terrainIds.has(r.supportId)||![r.x,r.y,r.width,r.height].every(Number.isFinite)||r.width<=0||r.height<=0||r.width>st.width*4||r.height>st.height*4||!['shoulder','buttress'].includes(r.kind))issue('err',label+' invalid rock/support '+r.id);}
   for(const r of Array.isArray(scene.scenery)?scene.scenery:[]){if(!r||typeof r!=='object'){issue('err',label+' invalid scenery record');continue;}const e=elements.get(r.id),a=e&&project.library.find(a=>a.id===e.assetId);if(!e||!a||a.collision?.length||!terrainIds.has(r.supportId)||![r.x,r.y,r.scale].every(Number.isFinite)||r.scale<=0||r.scale>8||e.x!==r.x||e.y!==r.y||e.assetId!==r.assetId)issue('err',label+' invalid scenery/support '+r.id);}
   for(const id of Array.isArray(scene.replaced)?scene.replaced:[]){const e=elements.get(id),a=e&&project.library.find(a=>a.id===e.assetId);if(!e||a?.collision?.length||a?.interactionType)issue('err',label+' cannot hide missing or interactive/colliding landmark '+id);}
   for(const r of Array.isArray(scene.lights)?scene.lights:[])if(!r||typeof r!=='object'||![r.x,r.y].every(Number.isFinite)||r.radius!==undefined&&(!Number.isFinite(r.radius)||r.radius<=0||r.radius>2000))issue('err',label+' invalid light');
  }
  if(!Number.isFinite(st.width)||!Number.isFinite(st.height)||st.width<=0||st.height<=0)issue('err',`${st.id}: invalid dimensions`);
  out.push(...G.HonroBounds.validate(st));
  if(!['forest','temple','gate','river','valley','bridge','tree','shrine'].includes(st.backdrop))issue('err',`${st.id}: unknown backdrop ${st.backdrop}`);
  // Standalone map/environment tools may load the schema without game content.
  if(!Number.isInteger(st.metadata.stageId)||st.metadata.stageId<1||st.metadata.stageId>(G.HONRO_CONTENT?.stages?.length??20))issue('err',`${st.id}: stageId must reference an implemented campaign stage`);
  const ids=unique(arrays.filter(k=>k!=='layers').flatMap(k=>st[k]||[]),st.id),terrainIds=new Set(st.terrains.map(t=>t.id));
  for(const t of st.terrains){const pts=t.type==='solid'?t.points:t.control;if(!pts||pts.length<(t.type==='solid'?3:2)||pts.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))issue('err',`${t.id}: invalid polygon`);}
  for(const e of st.elements){if(!assets.has(e.assetId))issue('err',`${e.id}: missing asset ${e.assetId}`);if(!Number.isFinite(e.x)||!Number.isFinite(e.y))issue('err',`${e.id}: invalid position`);}
  for(const m of st.materials)if((m.terrainId||m.support)&&!terrainIds.has(m.terrainId||m.support))issue('err',`${m.id}: missing support`);
  for(const u of st.units){if(!G.HonroUnits.has(u.kind))issue('err',`${u.id}: unknown unit ${u.kind}`);if(!Number.isFinite(u.x)||!Number.isFinite(u.y))issue('err',`${u.id}: invalid position`);if(!(u.team in G.HonroUnits.teams))issue('err',`${u.id}: unknown team`);}
  if(!st.units.some(u=>u.team==='player'))issue('warn',`${st.id}: Player start가 없습니다.`);
  for(const e of st.encounters)for(const id of e.unitIds||[])if(!ids.has(id))issue('err',`${e.id}: missing member ${id}`);
 }
 if(project.environmentVersion!==G.HonroEnvironment.VERSION)issue('err','Missing environment schema version');
 out.push(...G.HonroEnvironment.validate(project));
 return out.length?out:[{level:'ok',text:'구조 오류 없음'}];
}
function serialize(p){return JSON.stringify(p,null,2);}
function finalize(input){const p=normalize(input),errors=validate(p).filter(x=>x.level==='err');if(errors.length)throw Error(errors.map(x=>x.text).join('\n'));return p;}
G.HonroMaps={VERSION,clone,layers,emptyStage,normalize,validate,serialize,finalize,reconcileAct1Scene};
})(globalThis);
