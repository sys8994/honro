(function(G){'use strict';
// Terrain, trees and rock landmarks use the existing shared renderers unchanged.
// This unique narrative shoe is the only chapter-specific drawing retained.
const S=G.HonroScene.prototype,active=b=>b?.honroStage===12&&b.honroQuarryRevision===1;
const shoe=new Path2D('M-26-3Q-20-17-2-19Q18-17 25-6L20 0Q-1 6-24 2Z'),lace=new Path2D('M-16-12L-9 1M-5-17L0 3M7-15L11 2');
function storyProp(c,b){if(!active(b)||!b.honroState?.quarry?.shoePlaced)return;const m=b.honroMarkers.find(m=>m.id==='sign');if(!m)return;c.save();c.translate(m.x+44,m.y-9);c.fillStyle='#ac9b6c';c.fill(shoe);c.strokeStyle='#574f38';c.lineWidth=2;c.stroke(shoe);c.stroke(lace);c.restore();}
const live=S.liveWater;S.liveWater=function(c,b){const out=live?.call(this,c,b);storyProp(c,b);return out;};
G.HonroStage12QuarryArt={active,storyProp,omitReadability:()=>false};
})(globalThis);
