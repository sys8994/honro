(function(G){'use strict';
// Reviewed authored passages, never a shape/material/name heuristic. Workshop
// edits and unidentified historical layouts keep their own saved collision.
const targets={8:['west-eave','east-eave'],9:['west-gallery','east-gallery'],10:['west-gallery','east-gallery']},links={10:['gallery-link-west','gallery-link-east']},clone=v=>JSON.parse(JSON.stringify(v));
function upgradeBattle(b){
 const sid=b?.honroStage,ids=targets[sid];
 if(!ids||b.mode!=='campaign'||b.honroMapOrigin!=='campaign'||b.honroCanonical!==true||b.honroCustom!==false||b.honroAuthoredId!=='stage-'+sid)return false;
 const p=G.HONRO_PROJECT,st=p?.stages?.find(s=>s.id===b.honroAuthoredId&&s.metadata?.campaign===true);
 if(!st||b.width!==st.width||b.height!==st.height||JSON.stringify(b.honroMapAnchors)!==JSON.stringify(st.anchors)||JSON.stringify(b.honroMap)!==JSON.stringify(st.design))return false;
 if(b.honroTerrainDomainVersion===1&&(!b.honroWorldTerrain||JSON.stringify(b.honroPlayBounds)!==JSON.stringify(st.playBounds)||JSON.stringify(b.honroTerrainBounds)!==JSON.stringify(st.terrainBounds)))return false;
 const expected=G.HonroMaps.compile(st,p),added=new Set(links[sid]||[]);
 const shape=t=>({id:t.id,x:t.x,y:t.y,w:t.w,h:t.h,vertices:t.vertices,mat:t.mat,indestructible:!!t.indestructible,oneWay:ids.includes(t.id)?true:!!t.oneWay,slope:t.slope,honroElementId:t.honroElementId,honroElementCollision:!!t.honroElementCollision});
 const same=(a,z)=>JSON.stringify(shape(a))===JSON.stringify(shape(z));
 function matches(old,current){
  if(!Array.isArray(old)||!Array.isArray(current))return false;
  if(ids.some(id=>{const a=old.find(t=>t.id===id),z=current.find(t=>t.id===id);return !a||!z||typeof a.oneWay!=='boolean'||z.oneWay!==true;}))return false;
  for(const t of old.filter(t=>added.has(t.id))){const ref=current.find(a=>a.id===t.id);if(!ref||!same(t,ref))return false;}
  return JSON.stringify(old.filter(t=>!added.has(t.id)).map(shape))===JSON.stringify(current.filter(t=>!added.has(t.id)).map(shape));
 }
 if(!matches(b.terrain,expected.terrain)||b.honroWorldTerrain&&!matches(b.honroWorldTerrain,expected.worldTerrain))return false;
 let changed=false;
 for(const [old,current]of [[b.terrain,expected.terrain],[b.honroWorldTerrain,expected.worldTerrain]]){
  if(!old)continue;
  for(const id of ids){const t=old.find(t=>t.id===id);if(!t.oneWay){t.oneWay=true;changed=true;}}
  for(const id of added)if(!old.some(t=>t.id===id)){old.push(clone(current.find(t=>t.id===id)));changed=true;}
 }
 if(changed){b.honroPlatformPassageRevision=1;b.sceneVersion=(b.sceneVersion||0)+1;}
 return changed;
}
G.HonroPlatformPassages={targets,links,upgradeBattle};
})(globalThis);
