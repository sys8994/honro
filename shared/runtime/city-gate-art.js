(function(G){'use strict';
// Stage21 presentation only. Keep the canonical arch, stair silhouettes,
// walkable roof and all battle fields; replace the upper timber pavilion.
const compiled=new Map(),originals=new WeakMap(),lower=new Path2D('M1700 2240H2600V2700H1700Z');
function draw(c,l,b){
 if(b?.honroStage!==21||l.asset?.id!=='eup21:gate')return false;
 const K=G.HonroEnvironmentVectorKit;if(!K?.ASSETS['hanok.gatehouse.front'])return false;
 let q=compiled.get(K.REGISTRY_VERSION);
 if(!q){q=K.compileScene({instances:[{id:'eup21-timber-pavilion',assetId:'hanok.gatehouse.front',palette:'city',transform:{x:2277,y:2240,scale:1}}]});compiled.set(K.REGISTRY_VERSION,q);}
 let original=originals.get(l.asset);if(!original){original={...l.asset,anchor:{x:0,y:0}};originals.set(l.asset,original);}
 c.save();c.translate(l.x||0,l.y||0);c.rotate(l.rotation||0);c.scale(l.scale??1,l.scale??1);c.translate(-(l.asset.anchor?.x||0),-(l.asset.anchor?.y||0));
 c.save();c.clip(lower);G.HonroVectorArt.draw(c,original,{x:0,y:0,scale:1});c.restore();
 K.drawCanvas(c,q);c.restore();return true;
}
G.HonroCityGateArt={draw,revision:'city-gate-structure-1'};
})(globalThis);
