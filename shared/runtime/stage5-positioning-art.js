(function(G){'use strict';
// Compose the shared approved granite material on the three real Stage5 masses.
// Collision, saved state and the actual contact rim are never derived from art.
const S=G.HonroScene.prototype,ids=new Set(['valley-floor','stage5-west-shoulder','stage5-ritual-stone']),active=b=>G.HonroStage5Positioning.active(b);
const terrain=S.terrain;S.terrain=function(c,t){if(active(this.battle)&&ids.has(t.id)&&!t.broken){
 const b=this.battle,A=G.HonroAct1SpatialArt,q=A.prepareTerrain(t,b),scale=this._staticCacheBuild?this._worldRasterScale(b,this.canvas.clientWidth):this.scale;
 // Reuse the original broad weathered faces beneath a few native-size shared
 // shoulder/foundation modules. Only the actual solid is painted: the undercut
 // stays empty, and the same canonical contact rim is drawn last.
 A.drawTerrainMaterial(c,t,b,{walkRim:false});c.save();c.clip(q.shape);
 G.HonroGeologyArt.draw(this,c,b,v=>v.asset.category==='rock'&&v.attachment.terrainId===t.id);c.restore();
 c.save();c.strokeStyle=G.HonroGeologyArt.PALETTE.rim;c.lineWidth=1.05/Math.max(.05,scale);c.lineJoin='round';c.stroke(q.rim);c.restore();return;
 }return terrain.call(this,c,t);};
const omitReadability=(group,b)=>active(b)&&ids.has(group.id);
G.HonroStage5PositioningArt={active,omitReadability};
})(globalThis);
