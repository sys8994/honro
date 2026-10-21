(function(G){'use strict';
// Compose the shared approved granite material on the two real Stage5 masses.
// Collision, saved state and the actual contact rim are never derived from art.
const S=G.HonroScene.prototype,ids=new Set(['stage5-west-shoulder','stage5-ritual-stone']),active=b=>G.HonroStage5Positioning.active(b);
const terrain=S.terrain;S.terrain=function(c,t){if(active(this.battle)&&ids.has(t.id)&&!t.broken){const scale=this._staticCacheBuild?this._worldRasterScale(this.battle,this.canvas.clientWidth):this.scale;G.HonroGeologyArt.drawSurface(this,c,t,this.battle,1/Math.max(.05,scale));return;}return terrain.call(this,c,t);};
const omitReadability=(group,b)=>active(b)&&ids.has(group.id);
G.HonroStage5PositioningArt={active,omitReadability};
})(globalThis);
