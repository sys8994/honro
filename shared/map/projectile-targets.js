(function(G){'use strict';
// The waterfall's breakable ring hangs under solid rock. It is not a walking
// platform. Only its exact canonical old flag is repaired on campaign Continue.
const stageId=5,targetId='cliff-cleat',points=[{x:3278,y:2255.529411764706},{x:3362,y:2255.529411764706},{x:3362,y:2403.529411764706},{x:3278,y:2403.529411764706}];
function upgradeBattle(b){
 if(b?.honroStage!==stageId||b.mode!=='campaign'||b.honroMapOrigin!=='campaign'||b.honroCanonical!==true||b.honroCustom!==false||b.honroAuthoredId!=='stage-5')return false;
 const p=G.HONRO_PROJECT,st=p?.stages?.find(s=>s.id==='stage-5'&&s.metadata?.campaign===true),authored=st?.terrains.find(t=>t.id===targetId);
 if(!authored||authored.oneWay!==false||authored.properties?.device!=='ward'||!authored.properties?.honroSeal||JSON.stringify(authored.points)!==JSON.stringify(points))return false;
 if(b.width!==st.width||b.height!==st.height||JSON.stringify(b.honroMapAnchors)!==JSON.stringify(st.anchors)||JSON.stringify(b.honroMap)!==JSON.stringify(st.design))return false;
 if(b.honroTerrainDomainVersion===1&&(!b.honroWorldTerrain||JSON.stringify(b.honroPlayBounds)!==JSON.stringify(st.playBounds)||JSON.stringify(b.honroTerrainBounds)!==JSON.stringify(st.terrainBounds)))return false;
 const expected=G.HonroMaps.compile(st,p),shape=t=>({id:t.id,x:t.x,y:t.y,w:t.w,h:t.h,vertices:t.vertices,mat:t.mat,oneWay:t.id===targetId?false:!!t.oneWay,indestructible:!!t.indestructible,device:t.device,honroSeal:!!t.honroSeal,honroElementId:t.honroElementId,honroElementCollision:!!t.honroElementCollision});
 const matches=(old,current)=>Array.isArray(old)&&Array.isArray(current)&&old.some(t=>t.id===targetId&&typeof t.oneWay==='boolean')&&JSON.stringify(old.map(shape))===JSON.stringify(current.map(shape));
 if(!matches(b.terrain,expected.terrain)||b.honroWorldTerrain&&!matches(b.honroWorldTerrain,expected.worldTerrain))return false;
 let changed=false;for(const terrain of [b.terrain,b.honroWorldTerrain]){const t=terrain?.find(t=>t.id===targetId);if(t?.oneWay){t.oneWay=false;changed=true;}}
 if(changed)b.sceneVersion=(b.sceneVersion||0)+1;
 return changed;
}
G.HonroProjectileTargets={stageId,targetId,upgradeBattle};
})(globalThis);
