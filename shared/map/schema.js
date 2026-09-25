(function(G){'use strict';
const VERSION=3,clone=x=>JSON.parse(JSON.stringify(x)),C=G.HONRO_CORE;
const arrays=['terrains','materials','elements','units','events','encounters','objectives','markers','layers'];
function layers(){return['far','mid','back','structural-back','terrain','interactive','prop','units','events','front'].map(id=>({id,name:id,visible:true,locked:false}));}
function emptyStage(id='stage-new',name='새 스테이지',width=5000,height=3200){return{id,name,width,height,backdrop:'forest',metadata:{stageId:1,campaign:false},terrains:[],materials:[],elements:[],units:[],events:[],encounters:[],objectives:[],markers:[],layers:layers(),meta:{notes:'',seed:12031},initialState:{}};}
function normalize(input){
 const p=clone(input);if(!p||!Array.isArray(p.stages)||!Array.isArray(p.library))throw Error('Expected a HONRO project with stages and library');
 if(p.version>VERSION)throw Error('Unsupported future map version '+p.version);
 p.schema='honro-map';p.version=VERSION;p.settings={grid:40,snap:true,autosave:true,adaptiveLOD:true,...p.settings};p.activeStageId??=p.stages[0]?.id;
 for(const a of p.library){a.visual??=[];a.collision??=[];a.anchor??={x:0,y:0};a.sockets??=[];a.tags??=[];a.params??={};}
 for(const st of p.stages){st.metadata??={stageId:1,campaign:false};st.meta??={notes:''};st.initialState??={};for(const a of arrays)st[a]??=a==='layers'?layers():[];for(const t of st.terrains)t.detail??={spacing:18,roughness:0,seed:1,optimizeEpsilon:0};}
 return p;
}
function validate(project){
 const out=[],issue=(level,text)=>out.push({level,text});
 if(project.schema!=='honro-map'||project.version!==VERSION)issue('err','Unsupported canonical map schema');
 const unique=(items,label)=>{const ids=new Set();for(const o of items){if(!o.id||ids.has(o.id))issue('err',`${label}: missing/duplicate ID ${o.id}`);ids.add(o.id);}return ids;};
 const assets=unique(project.library,'library');unique(project.stages,'stages');
 for(const st of project.stages){
  if(!Number.isFinite(st.width)||!Number.isFinite(st.height)||st.width<=0||st.height<=0)issue('err',`${st.id}: invalid dimensions`);
  const ids=unique(arrays.filter(k=>k!=='layers').flatMap(k=>st[k]||[]),st.id),terrainIds=new Set(st.terrains.map(t=>t.id));
  for(const t of st.terrains){const pts=t.type==='solid'?t.points:t.control;if(!pts||pts.length<(t.type==='solid'?3:2)||pts.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))issue('err',`${t.id}: invalid polygon`);}
  for(const e of st.elements){if(!assets.has(e.assetId))issue('err',`${e.id}: missing asset ${e.assetId}`);if(!Number.isFinite(e.x)||!Number.isFinite(e.y))issue('err',`${e.id}: invalid position`);}
  for(const m of st.materials)if((m.terrainId||m.support)&&!terrainIds.has(m.terrainId||m.support))issue('err',`${m.id}: missing support`);
  for(const u of st.units){if(!G.HonroUnits.has(u.kind))issue('err',`${u.id}: unknown unit ${u.kind}`);if(!Number.isFinite(u.x)||!Number.isFinite(u.y))issue('err',`${u.id}: invalid position`);}
  if(!st.units.some(u=>u.team==='player'))issue('warn',`${st.id}: Player start가 없습니다.`);
  for(const e of st.encounters)for(const id of e.unitIds||[])if(!ids.has(id))issue('err',`${e.id}: missing member ${id}`);
 }
 return out.length?out:[{level:'ok',text:'구조 오류 없음'}];
}
function serialize(p){return JSON.stringify(p,null,2);}
G.HonroMaps={VERSION,clone,layers,emptyStage,normalize,validate,serialize};
})(globalThis);
