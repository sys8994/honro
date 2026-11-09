(function(G){'use strict';
// Suppress a collider's diagnostic paint only when its actual, collision-free
// native artwork resolved in this saved compact battle. Geometry is untouched.
function covered(t,b){
 if(!G.HonroStage11Compact?.active(b)||t.broken||t.honroElementCollision)return false;
 return (b.honroLandmarks||[]).some(l=>l.nativeTerrainId===t.id&&l.kind==='canonical-element'&&l.layer==='back'&&(l.opacity??1)===1&&l.asset?.vector&&!l.asset.collision?.length&&!l.collisionIds?.length&&!l.honroElementCollision);
}
const S=G.HonroScene?.prototype;
if(S){const terrain=S.terrain;S.terrain=function(c,t,...args){if(covered(t,this.battle))return;return terrain.call(this,c,t,...args);};}
const bierCovered=b=>{const t=b?.terrain?.find(t=>t.id===b.honroV4Chapter11?.bier?.id);return !!t&&covered(t,b);};
G.HonroStage11CompactArt={covered,bierCovered};
})(globalThis);
