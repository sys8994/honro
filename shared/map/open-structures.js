(function(G){'use strict';
const rows=G.HONRO_OPEN_STRUCTURES.rows,clone=v=>JSON.parse(JSON.stringify(v));
const stageRows=id=>rows.filter(r=>r.stage===id),assetRows=rows.filter(r=>r.kind==='asset');
const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
function flags(t){t.oneWay=true;delete t.honroCeiling;delete t.honroLocationCeiling;}
function authoredStage(s){const q=clone(s);for(const r of stageRows(s.metadata?.stageId).filter(r=>r.kind==='terrain')){const t=q.terrains.find(t=>t.id===r.id);if(t){t.oneWay=true;delete t.properties.honroCeiling;delete t.properties.honroLocationCeiling;}}return q;}
function upgradeProject(project){
 const current=G.HONRO_PROJECT;if(!project||!current||project===current)return false;
 // Only exact unedited canonical stage+asset copies in an existing autosave.
 // A shared asset used by even one modified/custom stage is left untouched.
 const sameStage=s=>{const e=current.stages.find(q=>q.id===s.id);return e&&s.metadata?.campaign===true&&stable(authoredStage(s))===stable(authoredStage(e));};
 let changed=false;
 for(const r of assetRows){const a=project.library?.find(a=>a.id===r.id),e=current.library.find(a=>a.id===r.id);if(!a||!e||a.oneWay!==false)continue;const users=project.stages.filter(s=>s.elements.some(v=>v.assetId===a.id));if(!users.length||!users.every(sameStage)||stable({...a,oneWay:true})!==stable(e))continue;a.oneWay=true;changed=true;}
 for(const s of project.stages||[]){if(!sameStage(s))continue;for(const r of stageRows(s.metadata.stageId).filter(r=>r.kind==='terrain')){const t=s.terrains.find(t=>t.id===r.id);if(t&&!t.oneWay){t.oneWay=true;delete t.properties.honroCeiling;delete t.properties.honroLocationCeiling;changed=true;}}}
 return changed;
}
function upgradeBattle(b){
 const sid=b?.honroStage,selected=stageRows(sid);
 if(!selected.length||b.mode!=='campaign'||b.honroMapOrigin!=='campaign'||b.honroCanonical!==true||b.honroCustom!==false||b.honroAuthoredId!=='stage-'+sid)return false;
 const p=G.HONRO_PROJECT,s=p.stages.find(s=>s.id===b.honroAuthoredId&&s.metadata?.campaign===true);if(!s||b.width!==s.width||b.height!==s.height||stable(b.honroMapAnchors)!==stable(s.anchors)||stable(b.honroMap)!==stable(s.design))return false;
 if(b.honroTerrainDomainVersion===1&&(!b.honroWorldTerrain||stable(b.honroPlayBounds)!==stable(s.playBounds)||stable(b.honroTerrainBounds)!==stable(s.terrainBounds)))return false;
 const expected=G.HonroMaps.compile(s,p),ids=new Set(selected.flatMap(r=>r.kind==='terrain'?[r.id]:expected.terrain.filter(t=>t.honroElementId===r.elementId).map(t=>t.id)));
 const shape=t=>{const q={id:t.id,x:t.x,y:t.y,w:t.w,h:t.h,vertices:t.vertices,mat:t.mat,indestructible:!!t.indestructible,oneWay:!!t.oneWay,slope:t.slope,honroElementId:t.honroElementId,honroElementCollision:!!t.honroElementCollision,honroCeiling:!!t.honroCeiling,honroLocationCeiling:!!t.honroLocationCeiling};if(ids.has(t.id)){q.oneWay=true;q.honroCeiling=false;q.honroLocationCeiling=false;}return q;};
 const matches=(a,z)=>Array.isArray(a)&&Array.isArray(z)&&stable(a.map(shape))===stable(z.map(shape));
 if(!matches(b.terrain,expected.terrain)||b.honroWorldTerrain&&!matches(b.honroWorldTerrain,expected.worldTerrain))return false;
 let changed=false;for(const list of [b.terrain,b.honroWorldTerrain])for(const t of list||[])if(ids.has(t.id)&&!t.oneWay){flags(t);changed=true;}
 if(changed){for(const e of [...b.honroElements||[],...b.honroLandmarks||[]])if(e.asset&&selected.some(r=>r.kind==='asset'&&r.id===e.asset.id))e.asset.oneWay=true;b.honroOpenStructureRevision=1;b.sceneVersion=(b.sceneVersion||0)+1;}
 return changed;
}
G.HonroOpenStructures={rows,upgradeProject,upgradeBattle};
})(globalThis);
