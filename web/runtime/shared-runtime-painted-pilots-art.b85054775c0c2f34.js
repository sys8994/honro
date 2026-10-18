(function(G){'use strict';
const S=G.HonroScene.prototype,C=G.HONRO_CORE,E=G.HonroEnvironment,manifest=G.HONRO_PAINTED_PILOTS,images={},tones=new Map(),forestTones=new Map(),patterns=new WeakMap(),shapes=new WeakMap(),structures=new WeakMap();let generation=0;
const stage=b=>manifest?.stages[b?.honroStage],ready=id=>!!(images[id]?.complete&&images[id].naturalWidth);
const active=b=>!!stage(b)&&(b.honroStage===1?b.honroMap?.act1Scene?.version===1:b.honroStage===18?b.honroBellRevision===1:b.honroLandmarks?.some(l=>l.asset?.id?.startsWith('stage27-depot-')));
const dependencies={1:['forestFar','forestRock','forestSoil','pineA','pineB','dead','roots','bark','passGate'],18:['bellRear','stone','beam','underground'],27:['depotRear','stone','beam','underground']};
function ensure(b){if(typeof Image==='undefined')return;for(const id of dependencies[b.honroStage]||[]){if(images[id])continue;const img=images[id]=new Image();img.decoding='async';img.onload=()=>generation++;img.src=manifest.images[id];}}
function path(points){const p=new Path2D();points.forEach((v,i)=>i?p.lineTo(v.x,v.y):p.moveTo(v.x,v.y));p.closePath();return p;}
function shape(t){let q=shapes.get(t);if(q?.vertices===t.vertices)return q.path;const p=path(C.poly(t));shapes.set(t,{vertices:t.vertices,path:p});return p;}
function pattern(c,key){let ps=patterns.get(c);if(!ps){ps={};patterns.set(c,ps);}if(!ps[key]){ps[key]=c.createPattern(images[key],'repeat');ps[key].setTransform(new DOMMatrix([1.1,0,0,1.1,0,0]));}return ps[key];}
function materialsReady(b){if(!active(b))return false;ensure(b);return b.honroStage===1?ready('bark')&&ready('forestRock')&&ready('forestSoil'):ready('stone')&&ready('beam')&&ready('underground')&&G.HonroStage21Painted.ready('bedrock');}
function material(c,p,b,{wood=false,masonry=false}={}){c.save();c.clip(p);
 if(wood||masonry){c.fillStyle=wood?'#443d2e':'#414b45';c.fill(p);c.fillStyle=pattern(c,wood?(b.honroStage===1?'bark':'beam'):'stone');c.fill(p);}else G.HonroStage21Painted.paintRock(c,p,{originY:stage(b).rockOrigin,depth:b.honroStage===1});
 c.fillStyle=b.honroStage===1?'#35443130':wood?'#14202b40':'#0e233580';c.fill(p);c.restore();
}
const interior=new Set(['sb-inner-upper-turn','sb-inner-sound-stone']);
function terrain(c,t,b,liveInterior=false){if(!materialsReady(b))return false;
 if(b.honroStage===18){if(t.honroBellShell||t.honroBellBody||t.mat==='iron')return false;if(interior.has(t.id)&&!liveInterior)return true;}
 if(t.honroElementCollision)return false;
 if(!['earth','soil','rock','stone','wood'].includes(t.mat)||t.honroSeal||t.breakable||t.broken)return false;
 material(c,shape(t),b,{wood:t.mat==='wood'});return true;
}
function toned(b){const n=b.honroStage;if(tones.has(n))return tones.get(n);const img=images[stage(b).rear],cv=document.createElement('canvas');cv.width=n===1?2048:img.naturalWidth;cv.height=n===1?1024:img.naturalHeight;const c=cv.getContext('2d');c.fillStyle=n===1?'#263744':'#1b303c';c.fillRect(0,0,cv.width,cv.height);
 if(n===1){c.filter='saturate(.52) contrast(.78) brightness(.89) blur(.65px)';c.drawImage(img,-2,-1,2052,685);c.filter='none';c.fillStyle='#34465524';c.fillRect(0,0,2048,1024);const g=c.createLinearGradient(0,420,0,678);g.addColorStop(0,'#26374400');g.addColorStop(1,'#263744');c.fillStyle=g;c.fillRect(0,420,2048,604);}
 else {c.filter='saturate(.7) brightness(.74)';c.drawImage(img,0,0);c.filter='none';c.fillStyle='#0c1d2950';c.fillRect(0,0,cv.width,cv.height);}tones.set(n,cv);return cv;}
function picture(c,id,x,y,w,h){if(!ready(id))return false;c.drawImage(images[id],x,y,w,h);return true;}
// Painted forest references use metres and a trunk foot, not the atlas rectangle's root mat.
const forestReference={pineA:{heightM:8.4,foot:[.54,.90]},pineB:{heightM:8.4,foot:[.64,.90]},dead:{heightM:7.2,foot:[.50,.91]}};
function forestImage(id){if(forestTones.has(id))return forestTones.get(id);const img=images[id],cv=document.createElement('canvas');cv.width=img.naturalWidth;cv.height=img.naturalHeight;const c=cv.getContext('2d');c.filter=forestReference[id]?'saturate(.42) contrast(.72) brightness(.74) blur(1.2px)':'saturate(.58) brightness(.78)';c.drawImage(img,0,0);c.filter='none';c.globalCompositeOperation='source-atop';c.fillStyle=forestReference[id]?'#3a4d5b8c':'#26374428';c.fillRect(0,0,cv.width,cv.height);if(forestReference[id]){c.globalCompositeOperation='destination-in';const g=c.createLinearGradient(0,cv.height*.81,0,cv.height);g.addColorStop(0,'#000');g.addColorStop(.5,'#0009');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(0,0,cv.width,cv.height);}forestTones.set(id,cv);return cv;}
function background(c,w,h,b,scene){if(active(b))ensure(b);if(!active(b)||!ready(stage(b).rear))return false;
 const img=toned(b),raw=G.HonroVisualStyle.raw(c),paint=cc=>{cc.fillStyle=b.honroStage===1?'#1b303c':'#091923';cc.fillRect(0,0,w,h);
  if(stage(b).kind==='sky'){const q=E.act1BackdropFrame(scene,w,h,b,img.width,img.height);cc.drawImage(img,q.x,q.y,q.w,q.h);}
  else {const tr=E.groupTransform(scene,w,h,{width:b.width,height:b.height,environment:b.honroEnvironment},{depthLayer:'L1',x:0,y:0});cc.save();cc.translate(tr.x,tr.y);cc.scale(tr.scale,tr.scale);cc.drawImage(img,...stage(b).rect);cc.restore();}
 };
 const key=['pilot',b.honroStage,generation,w,h,scene.x,scene.y,scene.scale].join(':');if(!scene._screenRaster(raw,key,w,h,paint,'_screenBackgroundCache',false))paint(raw);scene.environmentStats={groups:1,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};return true;
}
function localSprite(c,l,id,height,b){if(!ready(id))return false;const ref=forestReference[id],img=forestImage(id);if(ref)height=(l.id.includes('-entry-grove-')?ref.heightM:(l.id.includes('-great-pine-')?12.2:l.asset.reference.heightM))*E.WORLD_UNITS_PER_METER;const width=height*img.width/img.height,foot=ref?.foot||[.5,1],placement=ref&&b.honroMap.act1Scene.scenery.find(p=>p.id===l.id),support=placement&&b.terrain.find(t=>t.id===placement.supportId&&!t.broken),y=support?C.topAt(support,l.x,l.y)+4:l.y;c.save();c.translate(l.x,y);c.rotate(l.rotation||0);c.scale(l.scale??1,l.scale??1);c.drawImage(img,-width*foot[0],-height*foot[1],width,height);c.restore();return true;}
const forestTrees=new Set(['a1-scene-1-entry-grove-west','a1-scene-1-entry-grove-center','a1-scene-1-great-pine-center','a1-scene-1-east-grove-sacred','a1-scene-1-east-grove-pine','a1-scene-1-last-grove-center']);
const forestPlants=new Set(['flora-1','flora-2','flora-10','flora-11','flora-14','flora-15','flora-23']);
function forestLandmark(c,l,b){if(l.id==='old-pass-gate')return localSprite(c,l,'passGate',225*(l.size||1),b);const id=l.asset?.id;if(/^mockup-granite/.test(id||''))return false; // The Stage1 material module paints the exact colliders once ready.

 if(id==='act1-scene:rooted-pine'||id==='act1-scene:rooted-sacred'){if(!forestTrees.has(l.id))return true;return localSprite(c,l,id.endsWith('sacred')?'dead':/center|east-grove-pine/.test(l.id)?'pineB':'pineA',795,b);}
 if(l.id.startsWith('flora-')){if(!forestPlants.has(l.id))return true;return localSprite(c,l,'roots',/10|14/.test(l.id)?34:25,b);}
 return !!b.honroMap.act1Scene.replaced?.includes(l.id);}
function structuralShape(b,l){const ts=G.HonroTerrainDomain.render(b),prior=structures.get(b);let q=prior;if(!q||q.version!==b.sceneVersion||q.source!==ts){q={version:b.sceneVersion,source:ts,items:new Map()};structures.set(b,q);}if(q.items.has(l.id))return q.items.get(l.id);
 const matches=ts.filter(t=>!t.broken&&(t.honroElementId===l.id||l.collisionIds?.includes(t.id)));if(!matches.length)return null;const p=new Path2D();for(const t of matches)p.addPath(shape(t));if(/-roof$/.test(l.id)&&b.honroStage===27)for(const node of l.asset.vector?.root?.children||[])if(node.tag==='path'&&node.fill!=='none')p.addPath(new Path2D(node.d));const box={x:Math.min(...matches.map(t=>t.x)),y:Math.min(...matches.map(t=>t.y)),right:Math.max(...matches.map(t=>t.x+t.w)),bottom:Math.max(...matches.map(t=>t.y+t.h))};const data={path:p,box,matches};q.items.set(l.id,data);return data;
}
function caveLandmark(c,l,b){if(!materialsReady(b))return false;
 if(b.honroStage===18){if(['sb-art-rear-cavern','sb-art-rear-rock-roots'].includes(l.id))return true;if(l.id!=='sb-art-rear-corbels')return false;const ps=new Path2D();for(const node of l.asset.vector.root.children)if(node.tag==='path'&&node.fill!=='none')ps.addPath(new Path2D(node.d));material(c,ps,b,{masonry:true});return true;}
 if(l.id==='vertical-depot-shell')return true;
 if(l.id==='loading-hoist'||l.id.endsWith(':loading-hoist')){const p=new Path2D();for(const node of l.asset.vector.root.children)if(node.tag==='path'&&node.fill!=='none')p.addPath(new Path2D(node.d));material(c,p,b,{wood:true});return true;}
 if(['far-sealed-store','ledger-vault'].includes(l.id)){const q=l.asset.bounds;c.save();c.translate(l.x,l.y);c.drawImage(images.underground,973,197,482,202,q.x,q.y,q.w,q.h);c.restore();return true;}
 const q=structuralShape(b,l);if(!q)return false;const wood=l.asset.material==='wood',large=q.box.bottom-q.box.y>500,ceiling=l.id==='masonry-vault';material(c,q.path,b,{wood,masonry:!wood&&!large&&!ceiling});if(large&&!ceiling){c.save();c.clip(q.path);c.globalAlpha=.55;c.drawImage(images.stone,q.box.x,q.box.y,q.box.right-q.box.x,130);c.restore();}return true;
}
const oldBackground=S.background;S.background=function(c,w,h,b){if(!background(c,w,h,b,this))return oldBackground.call(this,c,w,h,b);};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(!terrain(c,t,this.battle))return oldTerrain.call(this,c,t);};
const oldLandmark=S.landmark;S.landmark=function(c,l){const b=this.battle;if(active(b)&&(b.honroStage===1?forestLandmark(c,l,b):caveLandmark(c,l,b)))return;return oldLandmark.call(this,c,l);};
const oldVisible=S._landmarkVisible;S._landmarkVisible=function(l,view,padding=40){if(this.battle?.honroStage===1&&active(this.battle)&&forestReference[l.asset?.id==='act1-scene:rooted-sacred'?'dead':l.asset?.id==='act1-scene:rooted-pine'?'pineA':'']){
 if(!forestTrees.has(l.id))return false;const id=l.asset.id.endsWith('sacred')?'dead':/center|east-grove-pine/.test(l.id)?'pineB':'pineA';if(ready(id)){const ref=forestReference[id],height=(l.id.includes('-entry-grove-')?ref.heightM:l.id.includes('-great-pine-')?12.2:l.asset.reference.heightM)*E.WORLD_UNITS_PER_METER*(l.scale??1),width=height*images[id].naturalWidth/images[id].naturalHeight;return l.x-width*ref.foot[0]-padding<=view.right&&l.x+width*(1-ref.foot[0])+padding>=view.left&&l.y-height*ref.foot[1]-padding<=view.bottom&&l.y+height*(1-ref.foot[1])+padding>=view.top;}
 }return oldVisible.call(this,l,view,padding);};
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':pilots:'+manifest.revision+':'+generation+':'+(b.honroStage===1?'location2':G.HonroStage21Painted.appearanceKey()):'');};
for(const n of [1,18,27])G.HonroPaintedPresentation.register({id:'pilot-'+n,active:b=>b?.honroStage===n&&active(b),naturalEdges:true,cachedWorld:true});
G.HonroPaintedPilots={active,ready,images,manifest,terrain};
})(globalThis);

