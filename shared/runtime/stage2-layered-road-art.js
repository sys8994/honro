(function(G){'use strict';
// Stage2 composes approved shared assets/materials. The rear contour is scene
// geometry only; no bespoke color planes, cloned rock grid or added collision.
const S=G.HonroScene.prototype,cache=new WeakMap(),active=b=>G.HonroStage2LayeredRoad.active(b);
function prepare(b){const data=b.honroMap.stage2LayeredRoad;let q=cache.get(data);if(q)return q;
 const cliffs=data.rearCliffs.map(p=>G.HonroMapEngine.solid(p.id,p.points.map(p=>[p.x,p.y]),{mat:'rock',surfaceKind:'cliff',indestructible:true}));
 q={cliffs};cache.set(data,q);return q;
}
function rear(c,b){if(!active(b))return;for(const t of prepare(b).cliffs)G.HonroAct1SpatialArt.drawTerrainMaterial(c,t,b,{walkRim:false});G.HonroGeologyArt.draw(this,c,b);}
const layer=S._landmarkLayer;S._landmarkLayer=function(c,ls,name){if(name==='back'&&active(this.battle))rear.call(this,c,this.battle);return layer.call(this,c,ls,name);};
// Older Continue snapshots keep their own landmarks and poses. Resolve only the
// obsolete painted pine asset through the same approved Stage1 asset at draw.
const legacyPines=new Set(['left-pine-upper','left-pine-lower','right-pine']),pineViews=new WeakMap(),landmark=S.landmark;
S.landmark=function(c,l){if(active(this.battle)&&legacyPines.has(l.id)&&l.kind==='ravinePine'){
 let view=pineViews.get(l);if(!view){const asset=G.HONRO_PROJECT.library.find(a=>a.id==='act1-scene:rooted-pine');view=asset?{...l,kind:'canonical-element',asset,scale:l.size??l.scale??1}:l;pineViews.set(l,view);}return landmark.call(this,c,view);
 }return landmark.call(this,c,l);};
G.HonroStage2LayeredRoadArt={active,prepare,rear};
})(globalThis);
