(function(G){'use strict';
const S=G.HonroScene.prototype,terrain=S.terrain;
S.terrain=function(c,t){if(this.battle?.honroNarrativeRevision===1&&t.honroBinding)return;return terrain.call(this,c,t);};
const unit=S.unit;S.unit=function(c,u,active,charge){if(G.HonroNarrativeRevision.bodyBound(this.battle,u)||u.honroVisualOnly){this.unitBody(c,{...u,side:2},charge||0);c.save();c.font=`600 ${12/this.scale}px sans-serif`;c.textAlign='center';c.fillStyle='#dccbac';c.fillText(u.name||'',u.x,u.y-u.h-18);c.restore();return;}return unit.call(this,c,u,active,charge);};
const markers=S.tacticalUnitMarkers;S.tacticalUnitMarkers=function(c,b,units){return markers.call(this,c,b,units.filter(u=>!G.HonroNarrativeRevision.bodyBound(b,u)&&!u.honroVisualOnly));};
function draw(scene,e){const b=e.b;if(b.honroNarrativeRevision!==1||b.honroCustom)return;
 // These are members of the existing protected procession, not extra combat
 // bodies or independently invulnerable civilians. The convoy owns their fate.
 for(const u of b.honroConvoyActors||[])scene.unit(scene.ctx,u,false,0);
}
G.HonroNarrativeArt={draw};
})(globalThis);

