(function(G){'use strict';
// Opt-in L1 rear geology uses the owned common composition and asset painter.
// No solid union clip, collision, walk rim or chapter-specific branch.
function draw(scene,c,b){
 const art=G.HonroGeologyArt,source=art?.composition(b);
 if(source?.renderLayer!=='back')return;
 const brightness=source.brightness??1,depth=source.visualDepth||'L2';
 if(!Number.isFinite(brightness)||brightness<.5||brightness>1||!['L1','L2','L3'].includes(depth))throw Error('Invalid rear geology presentation');
 c.save();try{
  c.filter=(c.filter&&c.filter!=='none'?c.filter+' ':'')+`brightness(${brightness})`;
  art.draw({landmark:(cc,view)=>scene.landmark(cc,{...view,visualRole:'decoration',visualDepth:depth})},c,b);
 }finally{c.restore();}
}
const S=G.HonroScene.prototype,layer=S._landmarkLayer;
S._landmarkLayer=function(c,landmarks,name){if(name==='back')draw(this,c,this.battle);return layer.call(this,c,landmarks,name);};
const cacheKey=S._worldCacheKey;
S._worldCacheKey=function(b,w){const source=G.HonroGeologyArt?.composition(b);return cacheKey.call(this,b,w)+(source?.renderLayer==='back'?`:rear-geology-${source.version}-${source.brightness??1}-${source.visualDepth||'L2'}`:'');};
G.HonroGeologyRearSupport={draw};
})(globalThis);
