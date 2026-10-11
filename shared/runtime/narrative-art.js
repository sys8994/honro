(function(G){'use strict';
const S=G.HonroScene.prototype,terrain=S.terrain;
S.terrain=function(c,t){if(this.battle?.honroNarrativeRevision===1&&t.honroBinding)return;return terrain.call(this,c,t);};
function draw(scene,e){const b=e.b;if(b.honroNarrativeRevision!==1||b.honroCustom)return;
 // These are members of the existing protected procession, not extra combat
 // bodies or independently invulnerable civilians. The convoy owns their fate.
 for(const u of b.honroConvoyActors||[])scene.unit(scene.ctx,u,false,0);
}
G.HonroNarrativeArt={draw};
})(globalThis);
