(function(G){'use strict';
// Last presentation hook: stage-specific landmark overrides obey the same
// semantic contract as common elements. Terrain/actors/mission overlays never
// enter a decorative context. Depth changes replace, rather than stack, tone.
const S=G.HonroScene.prototype,V=G.HonroVisualStyle;
for(const name of ['terrain','unitBody']){const draw=S[name];S[name]=function(c,...args){const palette=name==='terrain'?G.HonroEnvironment.act3Palette(this.battle,args[0]?.mat):null,cc=V.context(c,'gameplay',palette),out=draw.call(this,cc,...args);if(name==='terrain')G.HonroTerrainAttachments?.draw(cc,args[0],this.battle,this);return out;};}
const landmark=S.landmark;S.landmark=function(c,l){const role=V.classify(l,this.battle),id=l.asset?.id||'',terrain=l.honroTerrainMaterialClip||l.asset?.category==='terrain'&&l.asset?.environmentRole!=='water'||/foundations|inner-earth|retaining-earth/.test(id),material=/wood/.test(id)?'wood':/earth|ground|foundation|bank/.test(id)?'earth':'stone',palette=terrain?G.HonroEnvironment.act3Palette(this.battle,material):null;return landmark.call(this,V.context(c,role==='gameplay'?'gameplay':V.depth(l),palette),l);};
const background=S.background;S.background=function(c,w,h,b){return background.call(this,V.context(c,'L2'),w,h,b);};
const key=S._worldCacheKey;S._worldCacheKey=function(b,w){return key.call(this,b,w)+':'+V.key()+(G.HonroEnvironment.act3Outdoor(b)?':act3-overcast-1':'');};
// Saturation is now applied to individual background paints at their actual
// distance. The old screen-wide pass would flatten that distance hierarchy.
S.backgroundReadability=function(){};
G.HonroVisualHierarchy={classify:V.classify,style:V.STYLE};
})(globalThis);
