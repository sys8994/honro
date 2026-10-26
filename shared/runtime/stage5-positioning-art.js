(function(G){'use strict';
// Compose the shared approved granite material on the three real Stage5 masses.
// Collision, saved state and the actual contact rim are never derived from art.
const S=G.HonroScene.prototype,ids=new Set(['valley-floor','stage5-west-shoulder','stage5-ritual-stone','stage5-upper-ridge','stage5-cave-brow']),active=b=>G.HonroStage5Positioning.active(b);
const terrain=S.terrain;S.terrain=function(c,t){if(this.battle?.honroStage5DynamicRevision)return terrain.call(this,c,t);if(active(this.battle)&&ids.has(t.id)&&!t.broken){
 const b=this.battle,A=G.HonroAct1SpatialArt,q=A.prepareTerrain(t,b),scale=this._staticCacheBuild?this._worldRasterScale(b,this.canvas.clientWidth):this.scale;
 // Reuse the original broad weathered faces beneath a few native-size shared
 // shoulder/foundation modules. Only the actual solid is painted: the undercut
 // stays empty, and the same canonical contact rim is drawn last.
 A.drawTerrainMaterial(c,t,b,{walkRim:false});c.save();c.clip(q.shape);
 G.HonroGeologyArt.draw(this,c,b,v=>v.asset.category==='rock'&&v.attachment.terrainId===t.id);c.restore();
 c.save();c.strokeStyle=G.HonroGeologyArt.PALETTE.rim;c.lineWidth=1.05/Math.max(.05,scale);c.lineJoin='round';c.stroke(q.rim);c.restore();return;
 }return terrain.call(this,c,t);};
const omitReadability=(group,b)=>active(b)&&ids.has(group.id);

// Revision5 keeps the common pool renderer and adds only the shared fluid body.
// Every ribbon vertex is also consumed by the projectile drag implementation.
const waterPaths=Object.fromEntries(Object.entries(G.HonroStage5WaterGeometry.dynamic).map(([key,ps])=>{const path=new Path2D();ps.forEach((p,i)=>i?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y));path.closePath();return[key,path];}));
const flows={closed:new Path2D('M4310 875C4280 1250 4310 1920 4300 2470Q4280 2810 4210 2890'),opened:new Path2D('M4310 875C4650 840 5450 870 5780 875C5930 980 5960 1360 5900 1625Q5800 2330 4310 2900')};
function water(c,b,base){
 base.call(this,c,{...b,honroLandmarks:b.honroLandmarks.filter(l=>l.kind!=='waterfall')});
 const A=G.HonroEnvironmentArt,time=A.time(this),key=G.HonroQuestTargets.records(b).find(t=>t.id==='waterfall-veil')?.honroWaterOpen?'opened':'closed';
 c.save();c.clip(waterPaths[key]);c.fillStyle=A.gradient(c,4050,0,6100,0,[[0,'#afcfc7c0'],[.45,'#d2dfced9'],[1,'#71a9acc0']]);c.fillRect(3950,800,2200,2160);
 c.strokeStyle='#e2ead46b';c.lineWidth=11;c.setLineDash([230,80,400,65]);c.lineDashOffset=-time*210;
 for(const dx of [-60,0,55]){c.save();c.translate(dx,0);c.stroke(flows[key]);c.restore();}c.restore();
 A.glow(c,4280,2900,300,55,'#a5c8be',.28);
}
G.HonroStage5DynamicArt={water};
G.HonroStage5PositioningArt={active,omitReadability};
})(globalThis);
