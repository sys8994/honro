(function(G){'use strict';
// Any chapter can compose shared native-scale geology by support + socket.
// These are draw views; no collider, actor, saved position or source is edited.
const cache=new WeakMap();
function composition(b){if(b.honroMap?.geologyComposition)return b.honroMap.geologyComposition;if(b.honroCustom||!b.honroCanonical||b.honroCampaignMapRevision!==G.HonroCampaignMapRevision.current(b.honroStage))return null;return G.HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===b.honroStage)?.design?.geologyComposition||null;}
function prepare(b){const source=composition(b);if(!source)return{views:[]};const old=cache.get(b);if(old?.source===source&&old.version===b.sceneVersion&&old.terrain===b.terrain)return old;const views=[];
 for(const i of source.instances){const asset=G.HONRO_PROJECT.library.find(a=>a.id===i.assetId),t=b.terrain.find(t=>t.id===i.support.terrainId&&!t.broken),datum=source.rearDatums?.find(d=>d.id===i.support.datumId);if(!asset||(!t&&!datum))continue;const scale=i.scale??1,[lo,hi]=asset.reference.scaleRange;if(scale<lo||scale>hi)throw Error('Geology scale outside native contract: '+i.id);const socket=i.socket?asset.sockets.find(s=>s.id===i.socket):asset.reference.foot;if(!socket)throw Error('Missing geology socket: '+i.id);const contactX=datum?datum.x:t.x+t.w*i.support.at,contactY=datum?datum.y:G.HONRO_CORE.topAt(t,contactX,t.y),x=contactX-socket.x*scale,y=contactY+(i.support.offsetY||0)-socket.y*scale;
  views.push({id:i.id,kind:'canonical-element',asset,assetId:asset.id,x,y,scale,rotation:0,layer:'back',depthLayer:'L1',attachment:{terrainId:t?.id,datumId:datum?.id,contactX,contactY,socket:i.socket||'foot'}});
 }
 const q={source,version:b.sceneVersion,terrain:b.terrain,views};cache.set(b,q);return q;
}
function draw(scene,c,b){for(const view of prepare(b).views)scene.landmark(c,view);}
G.HonroGeologyArt={composition,prepare,draw};
})(globalThis);
