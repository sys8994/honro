(function(G){'use strict';
// Any chapter can compose shared native-scale geology by support + socket.
// These are draw views; no collider, actor, saved position or source is edited.
const cache=new WeakMap();
function composition(b){if(b.honroMap?.geologyComposition)return b.honroMap.geologyComposition;if(b.honroCustom||!b.honroCanonical||b.honroCampaignMapRevision!==G.HonroCampaignMapRevision.current(b.honroStage))return null;return G.HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===b.honroStage)?.design?.geologyComposition||null;}
function prepare(b){const source=composition(b);if(!source)return{views:[]};const old=cache.get(b);if(old?.source===source&&old.version===b.sceneVersion&&old.terrain===b.terrain)return old;const views=[];
 for(const i of source.instances){const asset=G.HONRO_PROJECT.library.find(a=>a.id===i.assetId),t=b.terrain.find(t=>t.id===i.support.terrainId&&!t.broken),datum=source.rearDatums?.find(d=>d.id===i.support.datumId);if(!asset||(!t&&!datum))continue;const scale=i.scale??1,[lo,hi]=asset.reference.scaleRange;if(scale<lo||scale>hi)throw Error('Geology scale outside native contract: '+i.id);const socket=i.socket?asset.sockets.find(s=>s.id===i.socket):asset.reference.foot;if(!socket)throw Error('Missing geology socket: '+i.id);const contactX=datum?datum.x:t.x+t.w*i.support.at,contactY=datum?datum.y:G.HONRO_CORE.topAt(t,contactX,t.y),x=contactX-socket.x*scale*(i.mirrorX?-1:1),y=contactY+(i.support.offsetY||0)-socket.y*scale;
  views.push({id:i.id,kind:'canonical-element',asset,assetId:asset.id,x,y,scale,mirrorX:!!i.mirrorX,rotation:0,layer:'back',depthLayer:'L1',attachment:{terrainId:t?.id,datumId:datum?.id,contactX,contactY,socket:i.socket||'foot'}});
 }
 const q={source,version:b.sceneVersion,terrain:b.terrain,views};cache.set(b,q);return q;
}
function draw(scene,c,b,accept){for(const view of prepare(b).views){if(accept&&!accept(view))continue;if(view.mirrorX){c.save();c.translate(view.x*2,0);c.scale(-1,1);scene.landmark(c,view);c.restore();}else scene.landmark(c,view);}}
const faceCache=new WeakMap(),PALETTE=Object.freeze({front:'#5e727c',side:'#344d5a',light:'#687b84',rim:'#9ba89e',wood:'#3c463b',woodLight:'#6d7060'});
function surfacePaths(t,b){const q=G.HonroAct1SpatialArt.prepareTerrain(t,b),old=faceCache.get(t);if(old?.source===q)return old;const native=b.terrain.find(p=>p.id===t.id)||t,{x,y,w,h}=native,p=new Path2D(),light=new Path2D();
 // Broad wood faces use the actual source cap, never a camera-expanded bbox.
 p.moveTo(x+w*.73,y);p.lineTo(x+w,y);p.lineTo(x+w,y+h);p.lineTo(x+w*.57,y+h);p.quadraticCurveTo(x+w*.75,y+h*.55,x+w*.73,y);p.closePath();
 light.moveTo(x,y);light.lineTo(x+w*.37,y);light.quadraticCurveTo(x+w*.28,y+h*.17,x+w*.11,y+h*.31);light.lineTo(x,y+h*.48);light.closePath();
 const v={source:q,side:p,light};faceCache.set(t,v);return v;}
// Paint the actual solid ledge; joined rear geology remains unclipped.
// A camera-domain extension must not turn into a new flat cap/skirt.
function drawSurface(scene,c,t,b,unit=1){const p=surfacePaths(t,b),q=p.source,native=b.terrain.find(v=>v.id===t.id)||t,body=G.HonroAct1SpatialArt.prepareTerrain(native,b),wood=t.mat==='wood';c.save();c.fillStyle=wood?PALETTE.wood:PALETTE.front;c.fill(body.shape);c.clip(body.shape);
 if(wood){c.fillStyle='#26342e';c.fill(p.side);c.fillStyle=PALETTE.woodLight;c.fill(p.light);}else draw(scene,c,b,v=>v.asset.category==='rock'&&v.attachment.terrainId===t.id&&v.asset.params.geologyModule==='granite-ledge-neck');
 c.restore();c.save();c.strokeStyle=wood?'#a5a583':PALETTE.rim;c.lineWidth=1.05*unit;c.lineJoin='round';c.stroke(q.rim);c.restore();}
G.HonroGeologyArt={composition,prepare,draw,drawSurface,PALETTE};
})(globalThis);
