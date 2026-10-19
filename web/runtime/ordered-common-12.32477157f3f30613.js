import {yieldIfNeeded} from "./load-data.fb768c8f80789aa0.js";
// shared/runtime/painted-pilots-art.js
(()=>{
'use strict';
(function(G){'use strict';
const S=G.HonroScene.prototype,C=G.HONRO_CORE,E=G.HonroEnvironment,manifest=G.HONRO_PAINTED_PILOTS,images={},tones=new Map(),forestTones=new Map(),patterns=new WeakMap(),shapes=new WeakMap(),structures=new WeakMap();let generation=0;
const stage=b=>manifest?.stages[b?.honroStage],ready=id=>!!(images[id]?.complete&&images[id].naturalWidth);
const active=b=>!!stage(b)&&(b.honroStage===1?b.honroMap?.act1Scene?.version===1:b.honroStage===18?b.honroBellRevision===1:b.honroLandmarks?.some(l=>l.asset?.id?.startsWith('stage27-depot-')));
const dependencies={1:['forestFar','forestRock','forestSoil','pineA','pineB','dead','roots','bark','passGate'],18:['bellRear','stone','beam','underground'],27:['depotRear','stone','beam','underground']};
function request(ids){if(typeof Image==='undefined')return;for(const id of ids){if(images[id]||!manifest.images[id])continue;const img=images[id]=new Image();img.decoding='async';img.onload=()=>generation++;img.src=manifest.images[id];}}
function ensure(b){request(dependencies[b.honroStage]||[]);}
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
function forestImage(id,grounded=false){const key=id+(grounded?':grounded':'');if(forestTones.has(key))return forestTones.get(key);const img=images[id],cv=document.createElement('canvas');cv.width=img.naturalWidth;cv.height=img.naturalHeight;const c=cv.getContext('2d');c.filter=forestReference[id]?'saturate(.60) contrast(.90) brightness(.82) blur(.2px)':'saturate(.58) brightness(.78)';c.drawImage(img,0,0);c.filter='none';c.globalCompositeOperation='source-atop';c.fillStyle=forestReference[id]?'#55554b30':'#26374428';c.fillRect(0,0,cv.width,cv.height);if(forestReference[id]){c.globalCompositeOperation='destination-in';const g=c.createLinearGradient(0,cv.height*(grounded?.975:.81),0,cv.height);g.addColorStop(0,'#000');g.addColorStop(.5,'#0009');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(0,0,cv.width,cv.height);}forestTones.set(key,cv);return cv;}
function background(c,w,h,b,scene){if(active(b))ensure(b);if(!active(b)||!ready(stage(b).rear))return false;
 const img=toned(b),raw=G.HonroVisualStyle.raw(c),paint=cc=>{cc.fillStyle=b.honroStage===1?'#1b303c':'#091923';cc.fillRect(0,0,w,h);
  if(stage(b).kind==='sky'){const q=E.act1BackdropFrame(scene,w,h,b,img.width,img.height);cc.drawImage(img,q.x,q.y,q.w,q.h);}
  else {const tr=E.groupTransform(scene,w,h,{width:b.width,height:b.height,environment:b.honroEnvironment},{depthLayer:'L1',x:0,y:0});cc.save();cc.translate(tr.x,tr.y);cc.scale(tr.scale,tr.scale);cc.drawImage(img,...stage(b).rect);cc.restore();}
 };
 const key=['pilot',b.honroStage,generation,w,h,scene.x,scene.y,scene.scale].join(':');if(!scene._screenRaster(raw,key,w,h,paint,'_screenBackgroundCache',false))paint(raw);scene.environmentStats={groups:1,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};return true;
}
// Measured root ridges in the clean source images. Sample the whole root fan,
// including rotation/scale, instead of aligning a single trunk pixel on a slope.
const rootContacts={pineA:[[.24,.935],[.40,.960],[.55,.950],[.72,.963],[.88,.950]],pineB:[[.36,.948],[.52,.965],[.68,.960],[.82,.965],[.95,.951]],dead:[[.23,.943],[.40,.961],[.56,.967],[.73,.953],[.87,.943]]};
const rootPlacements=new WeakMap();
function rootPlacement(l,id,height,width,b){let q=rootPlacements.get(l);if(q)return q;const placement=b.honroMap.act1Scene.scenery.find(p=>p.id===l.id),support=placement&&b.terrain.find(t=>t.id===placement.supportId&&!t.broken),foot=forestReference[id].foot,scale=l.scale??1,angle=l.rotation||0,cs=Math.cos(angle),sn=Math.sin(angle);
 const contacts=(rootContacts[id]||[]).map(([u,v])=>{const dx=(u-foot[0])*width*scale,dy=(v-foot[1])*height*scale,x=l.x+dx*cs-dy*sn,localY=dx*sn+dy*cs;return{x,localY,sourceV:v,ground:support?C.topAt(support,x,l.y):l.y};});
 const y=support?Math.max(...contacts.map(p=>p.ground-p.localY)):l.y;
 q={y,support,contacts};
 if(l.id==='a1-scene-1-great-pine-center'&&support){
  // Preserve the pre-grounding trunk/canopy and all three bough attachments.
  // Only the root collar below .855 of the source can lengthen into the soil.
  const img=images[id],cut=Math.round(img.naturalHeight*.855)/img.naturalHeight,anchorY=C.topAt(support,l.x,l.y)+4,collarY=anchorY+(cut-foot[1])*height*scale;
  q.rootStart=cut;q.rootStretch=Math.max(1,...contacts.map(p=>(p.ground-collarY)/((p.sourceV-cut)*height*scale)));q.rootTargetY=y;q.y=anchorY;
 }
 rootPlacements.set(l,q);return q;
}
function localSprite(c,l,id,height,b){if(!ready(id))return false;const ref=forestReference[id],img=forestImage(id,!!ref);if(ref)height=(l.id.includes('-entry-grove-')?ref.heightM:(l.id.includes('-great-pine-')?12.2:l.asset.reference.heightM))*E.WORLD_UNITS_PER_METER;const width=height*img.width/img.height,foot=ref?.foot||[.5,1],q=ref?rootPlacement(l,id,height,width,b):null,y=q?.y??l.y;c.save();
 // Existing earth occludes the buried root fan. This is a visual clip only;
 // no replacement ground, contact shadow or collision surface is introduced.
 if(q?.support){const outside=new Path2D();outside.rect(l.x-width*2,y-height*2,width*4,height*4);outside.addPath(shape(q.support));c.clip(outside,'evenodd');}
 c.translate(l.x,y);c.rotate(l.rotation||0);c.scale(l.scale??1,l.scale??1);
 if(q?.rootStretch){const cut=q.rootStart,sy=img.height*cut,dy=height*(cut-foot[1]);c.drawImage(img,0,0,img.width,sy,-width*foot[0],-height*foot[1],width,height*cut);c.drawImage(img,0,sy,img.width,img.height-sy,-width*foot[0],dy,width,height*(1-cut)*q.rootStretch);}
 else c.drawImage(img,-width*foot[0],-height*foot[1],width,height);
 c.restore();return true;}
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
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':pilots:'+manifest.revision+':'+generation+':'+(b.honroStage===1?'great-root-collar4':G.HonroStage21Painted.appearanceKey()):'');};
for(const n of [1,18,27])G.HonroPaintedPresentation.register({id:'pilot-'+n,active:b=>b?.honroStage===n&&active(b),naturalEdges:true,cachedWorld:true});
G.HonroPaintedPilots={active,ready,images,manifest,terrain,request,forestImage,rootPlacements,appearanceKey:()=>manifest.revision+':'+generation};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage1-location-art.js
(()=>{
'use strict';
(function(G){'use strict';
// Stage1 presentation only. Every painted edge comes from the live solid;
// no scenery silhouette, collision, save revision or gameplay state is authored here.
let earthCard,rockCards,branchBark;
const S=G.HonroScene.prototype,C=G.HONRO_CORE,P=G.HonroPaintedPilots,geometry=new WeakMap(),fields=new WeakMap();
const active=b=>b?.honroStage===1&&P.active(b),ready=()=>P.ready('forestRock')&&P.ready('forestSoil')&&P.ready('bark')&&P.ready('pineA');
function closed(points){const p=new Path2D();points.forEach((v,i)=>i?p.lineTo(v.x,v.y):p.moveTo(v.x,v.y));p.closePath();return p;}
function prepare(t){let q=geometry.get(t);if(q?.source===t.vertices)return q;const points=C.poly(t),edges=[];
 for(let i=0;i<points.length;i++){const a=points[i],z=points[(i+1)%points.length];if(z.x>a.x+.01)edges.push([a,z]);}
 const top=x=>{const e=edges.find(([a,z])=>x>=a.x-.01&&x<=z.x+.01);return e?e[0].y+(e[1].y-e[0].y)*(x-e[0].x)/(e[1].x-e[0].x):t.y;};
 q={source:t.vertices,path:closed(points),edges,top};geometry.set(t,q);return q;
}
function field(c,id){let q=fields.get(c);if(!q){q={};fields.set(c,q);}return q[id]||(q[id]=c.createPattern(P.images[id],'repeat'));}
const soilDepth=x=>7+3*Math.sin(x*.007)+2*Math.sin(x*.019+1.4);
const earthDepth=x=>28+110*Math.exp(-(((x-220)/420)**2))+90*Math.exp(-(((x-2220)/730)**2))+58*Math.exp(-(((x-4560)/300)**2));
function band(c,a,z,upper,lower,color){c.fillStyle=color;c.fill(closed([{x:a.x,y:a.y+upper(a.x)},{x:z.x,y:z.y+upper(z.x)},{x:z.x,y:z.y+lower(z.x)},{x:a.x,y:a.y+lower(a.x)}]));}
function soilPattern(c){
 if(!earthCard){earthCard=document.createElement('canvas');earthCard.width=1024;earthCard.height=320;const ec=earthCard.getContext('2d');ec.drawImage(P.images.forestSoil,0,0);ec.globalCompositeOperation='destination-in';const mask=ec.createLinearGradient(0,0,0,320);mask.addColorStop(0,'#000');mask.addColorStop(.35,'#000');mask.addColorStop(1,'#0000');ec.fillStyle=mask;ec.fillRect(0,0,1024,320);}
 let fs=fields.get(c);if(!fs){fs={};fields.set(c,fs);}return fs.earth||(fs.earth=c.createPattern(earthCard,'repeat-x'));
}
function cards(){
 if(rockCards)return rockCards;rockCards=[];
 for(const rect of [[0,0,1100,900],[320,80,1216,944],[80,280,1400,744]]){
  const cv=document.createElement('canvas');cv.width=768;cv.height=640;const c=cv.getContext('2d');c.drawImage(P.images.forestRock,...rect,0,0,768,640);c.globalCompositeOperation='destination-in';const g=c.createLinearGradient(0,0,768,0);g.addColorStop(0,'#0000');g.addColorStop(.2,'#000');g.addColorStop(.8,'#000');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(0,0,768,640);const v=c.createLinearGradient(0,0,0,640);v.addColorStop(0,'#0000');v.addColorStop(.08,'#000');v.addColorStop(.72,'#000');v.addColorStop(1,'#0000');c.fillStyle=v;c.fillRect(0,0,768,640);rockCards.push(cv);
 }return rockCards;
}
const random=n=>{const v=Math.sin(n*12.9898+78.233)*43758.5453;return v-Math.floor(v);};
function geologyTop(b,x){const ground=G.HonroTerrainDomain.render(b).filter(t=>!t.oneWay&&!t.honroElementCollision&&!t.broken&&x>=t.x&&x<=t.x+t.w);return ground.length?Math.min(...ground.map(t=>prepare(t).top(x))):1200;}
function rock(c,t,b){const q=prepare(t),m=c.getTransform(),left=Math.max(t.x,-m.e/m.a-4),right=Math.min(t.x+t.w,(c.canvas.width-m.e)/m.a+4),small=t.honroElementCollision;
 c.save();c.clip(q.path);c.fillStyle='#303633';c.fill(q.path);
 if(small){
  // A single mineral face, not the earth/moss ledge above it. Cover-crop keeps
  // the source proportions; this solid never enters the ground's strip fade.
  const img=P.images.forestRock,rect=t.id.includes('boulder-b')?[1160,610,280,330]:[440,570,480,300];let [sx,sy,sw,sh]=rect;const aspect=t.w/t.h;
  if(sw/sh>aspect){const w=sh*aspect;sx+=(sw-w)/2;sw=w;}else{const h=sw/aspect;sy+=(sh-h)/2;sh=h;}
  c.drawImage(img,sx,sy,sw,sh,t.x,t.y,t.w,t.h);
  const shade=c.createLinearGradient(t.x,t.y,t.x+t.w*.8,t.y+t.h);shade.addColorStop(0,'#c8b9970c');shade.addColorStop(.45,'#20241f00');shade.addColorStop(1,'#18201e48');c.fillStyle=shade;c.fill(q.path);c.restore();return true;
 }
 else {
  // Unequal local outcrops overlap with soft material joins. Every world tile
  // visits the same cards in the same order; the two soil terrains share one
  // geological field across their boundary. No huge repeated cliff wallpaper.
  const textures=cards();for(let i=Math.floor((left-1300)/760);i<=Math.ceil(right/760);i++){
   const x=i*760+(random(i)-.5)*170,w=1080+random(i+7)*180,h=720+random(i+11)*130,y=geologyTop(b,x+w*.5)-120;
   c.drawImage(textures[Math.floor(random(i+23)*3)],x,y,w,h);
  }
 }
 const step=96;
 for(let x=Math.floor(left/step)*step;x<right;x+=step){const x0=Math.max(x,t.x),x1=Math.min(x+step,t.x+t.w);if(x1<=x0)continue;
  const y0=q.top(x0),y1=q.top(x1),slope=(y1-y0)/(x1-x0),depth=810;
  c.save();c.transform(1,slope,0,1,x0,y0);if(!small){const d=earthDepth((x0+x1)/2),soil=soilPattern(c);soil.setTransform(new DOMMatrix([.57,0,0,d/320,-x0,0]));c.fillStyle=soil;c.fillRect(0,0,x1-x0+.3,d);}const fade=c.createLinearGradient(0,0,0,depth);fade.addColorStop(0,'#19242800');fade.addColorStop(.28,'#19242826');fade.addColorStop(.68,'#1b272ad8');fade.addColorStop(1,'#20292a');c.fillStyle=fade;c.fillRect(0,-32,x1-x0+.3,Math.max(depth+32,t.y+t.h-y0));c.restore();
 }
 if(!small)for(const [a,z]of q.edges){
  // Thin wet earth and broken moss follow the exact playable contour. Their
  // transparency retains painted mineral detail instead of a flat green ribbon.
  band(c,a,z,()=>0,soilDepth,'#53473799');band(c,a,z,x=>soilDepth(x)*.5,x=>soilDepth(x)+10,'#342e2980');
  const moss=(a.x+z.x)*.5;if((moss>120&&moss<530)||(moss>1810&&moss<2220)||(moss>3030&&moss<3320)||(moss>4260&&moss<4480))band(c,a,z,()=>0,x=>4+2*Math.sin(x*.034),'#797b4b7a');
 }
 c.restore();return true;
}
function prepareBark(){
 if(!branchBark){
  // Sample clean trunk bark already loaded for Stage1. Rotate its lengthwise
  // grain onto the bough axis; the old roots/moss atlas strip read as planking.
  const img=P.images.pineA,cv=branchBark=document.createElement('canvas');cv.width=288;cv.height=72;const cc=cv.getContext('2d');cc.translate(0,72);cc.rotate(-Math.PI/2);cc.filter='saturate(.60) contrast(.94) brightness(.86)';cc.drawImage(img,img.naturalWidth*.34,img.naturalHeight*.45,img.naturalWidth*.13,img.naturalHeight*.16,0,0,72,288);cc.setTransform(1,0,0,1,0,0);cc.filter='none';cc.globalCompositeOperation='source-atop';cc.fillStyle='#65594f26';cc.fillRect(0,0,288,72);
 }
 return branchBark;
}
function branchSection(t,q,baseRight){if(q.branch)return q.branch;const ps=C.poly(t),underside=[];
 for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];if(z.x<a.x)underside.push([z,a]);}
 const bottom=x=>{const edge=underside.find(([a,z])=>x>=a.x&&x<=z.x);return edge?edge[0].y+(edge[1].y-edge[0].y)*(x-edge[0].x)/(edge[1].x-edge[0].x):q.top(x)+8;},west=baseRight??(t.id==='pine-branch-west'),baseX=west?t.x+t.w-10:t.x+10,baseY=(q.top(baseX)+bottom(baseX))/2,grain=[];
 for(const f of [.18,.38,.61,.81]){const p=new Path2D();for(let i=0;i<=12;i++){const u=i/12,x=t.x+8+(t.w-16)*u,top=q.top(x),thickness=Math.max(4,bottom(x)-top),taper=west?u:1-u,y=top+thickness*(.48+(f-.5)*(.46+.54*taper));i?p.lineTo(x,y):p.moveTo(x,y);}grain.push(p);}
 return q.branch={bottom,west,baseX,baseY,grain};
}
function branch(c,t,options={}){const q=prepare(t),section=branchSection(t,q,options.baseRight),dir=section.west?1:-1;c.save();
 // A short descending attachment sits inside the tree silhouette. Its upper
 // edge is curved and below the real top, so it never suggests another step.
 c.beginPath();c.moveTo(section.baseX+dir*35,section.baseY+17);c.quadraticCurveTo(section.baseX+dir*10,section.baseY+11,section.baseX-dir*12,section.baseY+3);const join=c.createLinearGradient(section.baseX+dir*35,section.baseY+17,section.baseX-dir*12,section.baseY+3);join.addColorStop(0,'#5a514600');join.addColorStop(.45,'#5a514666');join.addColorStop(1,'#3f392fc0');c.strokeStyle=join;c.lineWidth=10;c.lineCap='round';c.stroke();
 c.clip(q.path);c.fillStyle='#484036';c.fill(q.path);prepareBark();const m=c.getTransform(),left=Math.max(t.x,-m.e/m.a-4),right=Math.min(t.x+t.w,(c.canvas.width-m.e)/m.a+4);
 // The texture and round lower volume follow the actual bough contour. Every
 // span samples one continuous bough-length image, with no repeated end seam.
 for(let x=Math.floor(left/64)*64;x<right;x+=64){const x0=Math.max(x,t.x),x1=Math.min(x+64,t.x+t.w);if(x1<=x0)continue;const y0=q.top(x0),y1=q.top(x1),thickness=Math.max(10,(section.bottom((x0+x1)/2)-q.top((x0+x1)/2)));
  c.save();c.transform(1,(y1-y0)/(x1-x0),0,1,x0,y0);const sx=(x0-t.x)/t.w*branchBark.width,sw=(x1-x0)/t.w*branchBark.width;c.drawImage(branchBark,sx,0,sw,branchBark.height,0,0,x1-x0+.3,thickness+4);
  const g=c.createLinearGradient(0,0,0,thickness);g.addColorStop(0,'#b6a18b22');g.addColorStop(.28,'#76604c20');g.addColorStop(.7,'#30272288');g.addColorStop(1,'#21221dd4');c.fillStyle=g;c.fillRect(0,-8,x1-x0+.3,thickness+40);c.restore();
 }
 for(const [i,p]of section.grain.entries()){c.strokeStyle=i===1?'#b4a48c55':'#211f1ba0';c.lineWidth=i===1?1.2:1.6;c.lineCap='round';c.stroke(p);}
 for(const [a,z]of q.edges)band(c,a,z,()=>0,()=>1.5,'#c0b18a77');c.restore();return true;
}
function terrain(c,t,b){if(!active(b)||!ready()||t.broken||t.honroSeal)return false;if(t.honroElementCollision)return false;if(t.mat==='wood')return branch(c,t);if(['earth','soil','rock','stone'].includes(t.mat))return rock(c,t,b);return false;}
const oldTerrain=S.terrain;S.terrain=function(c,t){if(!terrain(c,t,this.battle))return oldTerrain.call(this,c,t);};
const oldLandmark=S.landmark;S.landmark=function(c,l){if(active(this.battle)&&ready()&&/^mockup-granite/.test(l.asset?.id||'')){
 for(const t of G.HonroTerrainDomain.render(this.battle))if(!t.broken&&(t.honroElementId===l.id||l.collisionIds?.includes(t.id)))rock(c,t,this.battle);return;
 }return oldLandmark.call(this,c,l);};
const oldZones=S.surfaceZones;S.surfaceZones=function(c,b){if(!active(b)||!ready())return oldZones.call(this,c,b);
 // Existing water and live-water remain owned by the common renderer.
 return oldZones.call(this,c,{...b,honroSurfaceZones:(b.honroSurfaceZones||[]).filter(z=>/water|current/.test(z.kind))});};
G.HonroStage1LocationArt={active,ready,terrain,prepare,paintRock:rock,paintBranch:branch,rockCards:cards,soilPattern};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage2-location-art.js
(()=>{
'use strict';
(function(G){'use strict';
// Stage2 paint only: the canonical cliff solids, bier road and airborne events
// retain their own data. No placement or material operation edits battle state.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,E=G.HonroEnvironment,P=G.HonroPaintedPilots,M=G.HonroStage1LocationArt;
const active=b=>b?.honroStage===2&&b.honroMap?.act1Scene?.version===1;
const ids=['valleyFar','forestRock','forestSoil','pineA','pineB','roots','bark'];
const ready=b=>{if(!active(b))return false;P.request(ids);return ids.every(P.ready);};
const treeSpecs={
 'a1-scene-2-high-grove-west':{support:'left-high-ground',image:'pineA',meters:7.5,foot:.54},
 'left-pine-upper':{support:'left-high-ground',image:'pineB',meters:15,foot:.64,flip:true},
 'left-pine-lower':{support:'left-high-ground',image:'pineB',meters:12,foot:.64},
 'right-pine':{support:'right-cliff-ground',image:'pineB',meters:19,foot:.64}
};
const plants=new Set(['flora-1','flora-2','flora-8','flora-9','flora-12','flora-13']);
const random=n=>{const v=Math.sin(n*12.9898+78.233)*43758.5453;return v-Math.floor(v);};
let far,cliffCards,floorCards;const placements=new WeakMap(),surfaces=new WeakMap();
function backdrop(){if(far)return far;const cv=far=document.createElement('canvas');cv.width=2048;cv.height=1024;const c=cv.getContext('2d');c.fillStyle='#293b44';c.fillRect(0,0,2048,1024);
 c.filter='saturate(.48) contrast(.78) brightness(.86) blur(.65px)';c.drawImage(P.images.valleyFar,-2,-1,2052,685);c.filter='none';c.fillStyle='#344b551f';c.fillRect(0,0,2048,1024);
 const g=c.createLinearGradient(0,435,0,680);g.addColorStop(0,'#293b4400');g.addColorStop(1,'#293b44');c.fillStyle=g;c.fillRect(0,435,2048,589);return cv;
}
function background(c,w,h,b,scene){if(!ready(b))return false;const img=backdrop(),q=E.act1BackdropFrame(scene,w,h,b,img.width,img.height),raw=G.HonroVisualStyle.raw(c),paint=cc=>{cc.fillStyle='#293b44';cc.fillRect(0,0,w,h);cc.drawImage(img,q.x,q.y,q.w,q.h);};
 const key=['location2',P.appearanceKey(),w,h,scene.x,scene.y,scene.scale].join(':');if(!scene._screenRaster(raw,key,w,h,paint,'_screenBackgroundCache',false))paint(raw);scene.environmentStats={groups:1,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};return true;
}
function verticalCards(){if(cliffCards)return cliffCards;cliffCards=[];
 for(const rect of [[0,0,600,1024],[550,0,620,1024],[980,0,550,1024]]){const cv=document.createElement('canvas');cv.width=384;cv.height=704;const c=cv.getContext('2d');c.drawImage(P.images.forestRock,...rect,0,0,384,704);c.globalCompositeOperation='destination-in';const x=c.createLinearGradient(0,0,384,0);x.addColorStop(0,'#0000');x.addColorStop(.18,'#000');x.addColorStop(.82,'#000');x.addColorStop(1,'#0000');c.fillStyle=x;c.fillRect(0,0,384,704);const y=c.createLinearGradient(0,0,0,704);y.addColorStop(0,'#0000');y.addColorStop(.1,'#000');y.addColorStop(.8,'#000');y.addColorStop(1,'#0000');c.fillStyle=y;c.fillRect(0,0,384,704);cliffCards.push(cv);}return cliffCards;
}
function groundCards(){if(floorCards)return floorCards;floorCards=M.rockCards().map(img=>{const cv=document.createElement('canvas');cv.width=img.width;cv.height=img.height;const c=cv.getContext('2d');c.filter='contrast(.90) brightness(.96)';c.drawImage(img,0,0);c.filter='none';c.globalCompositeOperation='source-atop';c.fillStyle='#4e4c400c';c.fillRect(0,0,cv.width,cv.height);return cv;});return floorCards;}
function mineralField(c,t,cliff){const m=c.getTransform(),left=Math.max(t.x,-m.e/m.a-4),right=Math.min(t.x+t.w,(c.canvas.width-m.e)/m.a+4),top=Math.max(t.y,-m.f/m.d-4),bottom=Math.min(t.y+t.h,(c.canvas.height-m.f)/m.d+4),cards=cliff?verticalCards():groundCards();
 c.fillStyle=cliff?'#3b423e':'#343c36';c.fill(M.prepare(t).path);const row=cliff?1080:710,col=cliff?670:930;
 for(let iy=Math.floor((top-2100)/row);iy<=Math.floor((bottom+200)/row);iy++)for(let ix=Math.floor((left-2200)/col);ix<=Math.floor((right+200)/col);ix++){
  const seed=ix*137+iy*971,x=ix*col+(random(seed)-.5)*(cliff?190:440),y=iy*row+(random(seed+1)-.5)*(cliff?260:460),w=cliff?930+random(seed+2)*160:1220+random(seed+2)*440,h=cliff?1560+random(seed+3)*260:880+random(seed+3)*340;
  if(cliff)c.drawImage(cards[Math.floor(random(seed+4)*3)],x,y,w,h);
  else {c.save();c.translate(x+w*.5,y+h*.5);c.rotate((random(seed+7)-.5)*.15);c.drawImage(cards[Math.floor(random(seed+4)*3)],-w*.5,-h*.5,w,h);c.restore();}
 }
}
function mineralShade(c,t,path){const shade=c.createLinearGradient(t.x,0,t.x+Math.min(t.w,1800),0);shade.addColorStop(0,'#263b4022');shade.addColorStop(.48,'#172a302c');shade.addColorStop(1,'#48514a0c');c.fillStyle=shade;c.fill(path);}
function granite(c,t,b){
 const host=b.terrain.find(o=>o.id===(t.honroElementId?.startsWith('basin-')?'canyon-ground':t.x+t.w*.5<b.width*.5?'left-high-ground':'right-cliff-ground'))||t,q=M.prepare(t);
 // The attached solid samples the host's world mineral field and lighting at
 // the same scale. No dark isolated-rock crop or local deep fade is added.
 c.save();c.clip(q.path);mineralField(c,t,host.id!=='canyon-ground');mineralShade(c,host,q.path);
 const face=c.createLinearGradient(t.x,t.y,t.x+t.w,t.y+t.h);face.addColorStop(0,'#d9cdb00c');face.addColorStop(.5,'#26312900');face.addColorStop(1,'#26312918');c.fillStyle=face;c.fill(q.path);c.restore();
}
function surface(t,b){let q=surfaces.get(t);if(q?.source===t.vertices)return q;const geometry=M.prepare(t),walk=G.HonroAct1SpatialArt.prepareTerrain(t,b).edges;
 q={source:t.vertices,path:geometry.path,walk};surfaces.set(t,q);return q;
}
function soilBand(c,a,z,d,color){const p=new Path2D();p.moveTo(a.x,a.y);p.lineTo(z.x,z.y);p.lineTo(z.x,z.y+d);p.lineTo(a.x,a.y+d);p.closePath();c.fillStyle=color;c.fill(p);}
let roadCard,massCards;
function earthCard(){if(roadCard)return roadCard;const cv=roadCard=document.createElement('canvas');cv.width=1024;cv.height=1024;const c=cv.getContext('2d');c.filter='saturate(.68) contrast(.74) brightness(1.12)';c.drawImage(P.images.forestSoil,0,0,1024,1024);c.filter='none';c.fillStyle='#77634b30';c.fillRect(0,0,1024,1024);return cv;}
function massTextures(){if(massCards)return massCards;massCards=[0,680].map((sx,i)=>{const cv=document.createElement('canvas');cv.width=680;cv.height=1024;const c=cv.getContext('2d');c.drawImage(P.images.forestRock,sx,0,i?856:850,1024,0,0,680,1024);c.globalCompositeOperation='destination-in';const g=c.createLinearGradient(0,0,680,0);g.addColorStop(0,'#0000');g.addColorStop(.12,'#000');g.addColorStop(.88,'#000');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(0,0,680,1024);return cv;});return massCards;}
function visibleRange(c,t){const m=c.getTransform();return{left:Math.max(t.x,-m.e/m.a-4),right:Math.min(t.x+t.w,(c.canvas.width-m.e)/m.a+4),top:Math.max(t.y,-m.f/m.d-4),bottom:Math.min(t.y+t.h,(c.canvas.height-m.f)/m.d+4)};}
function earthField(c,t,b){const road=G.HonroTerrainDomain.render(b).find(o=>o.id==='canyon-ground'),rq=M.prepare(road),v=visibleRange(c,t),img=earthCard();
 // One continuous soil stratum beneath the real road. The same world field
 // receives both cliff feet; no invented walking edge crosses a solid wall.
 c.fillStyle='#3e3b32';c.fill(M.prepare(t).path);
 for(let iy=Math.floor(v.top/680);iy<=Math.floor(v.bottom/680);iy++)for(let ix=Math.floor(v.left/840);ix<=Math.floor(v.right/840);ix++)c.drawImage(img,ix*840,iy*680,840,680);
 for(let x=Math.floor(v.left/64)*64;x<v.right;x+=64){const x0=Math.max(x,v.left),x1=Math.min(x+64,v.right);if(x1<=x0)continue;const y0=rq.top(x0),y1=rq.top(x1),slope=(y1-y0)/(x1-x0);
  c.save();c.transform(1,slope,0,1,x0,y0);const depth=c.createLinearGradient(0,0,0,640);depth.addColorStop(0,'#75624612');depth.addColorStop(.24,'#4a443730');depth.addColorStop(.64,'#303831c0');depth.addColorStop(1,'#283333');c.fillStyle=depth;c.fillRect(0,0,x1-x0+.3,Math.max(640,v.bottom-y0+100));c.restore();
 }
}
function rockMass(c,t,b){const west=t.id==='left-high-ground',v=visibleRange(c,t),q=M.prepare(t),road=G.HonroTerrainDomain.render(b).find(o=>o.id==='canyon-ground'),rq=M.prepare(road);
 // Each side is a finite major face and a shaded return, rather than an
 // infinite vertical mineral wallpaper. All painting remains in its solid.
 c.fillStyle=west?'#45483f':'#40473f';c.fill(q.path);
 const img=massTextures()[west?0:1],origin=west?-280:3270;for(let i=Math.floor((v.left-origin-1900)/1500);i<=Math.ceil((v.right-origin)/1500);i++)c.drawImage(img,origin+i*1500,west?400:330,1900,2600);
 const light=c.createLinearGradient(west?200:4300,500,west?1420:3380,2550);light.addColorStop(0,'#b2a48420');light.addColorStop(.53,'#3d453c08');light.addColorStop(1,'#142b3066');c.fillStyle=light;c.fill(q.path);
 const returnFace=new Path2D();if(west){returnFace.moveTo(735,1150);returnFace.lineTo(1200,1650);returnFace.lineTo(1500,2240);returnFace.lineTo(900,2590);returnFace.lineTo(790,3100);returnFace.lineTo(490,3000);returnFace.lineTo(660,2160);}else{returnFace.moveTo(4060,1050);returnFace.lineTo(3850,1500);returnFace.lineTo(3690,1830);returnFace.lineTo(3450,2260);returnFace.lineTo(3440,3000);returnFace.lineTo(3740,3070);returnFace.lineTo(3890,2140);}returnFace.closePath();c.fillStyle=west?'#1d303543':'#182d334d';c.fill(returnFace);
 // The earth foreground receives the buried stone bases. Start below the
 // canonical road surface, so the paint cannot imply a path through the wall.
 const join=(x,d)=>rq.top(x)+d+18*Math.sin(x*.003),strip=(upper,lower)=>{const p=new Path2D(),start=Math.floor(v.left/64)*64,end=Math.ceil(v.right/64)*64;for(let x=start;x<=end;x+=64)x===start?p.moveTo(x,join(x,upper)):p.lineTo(x,join(x,upper));if(lower===Infinity){p.lineTo(end,Math.max(v.bottom,road.y+road.h));p.lineTo(start,Math.max(v.bottom,road.y+road.h));}else for(let x=end;x>=start;x-=64)p.lineTo(x,join(x,lower));p.closePath();return p;};
 for(let i=0;i<7;i++){c.save();c.clip(strip(12+i*16,12+(i+1)*16));c.globalAlpha=(i+.5)/7;earthField(c,t,b);c.restore();}
 c.save();c.clip(strip(124,Infinity));earthField(c,t,b);c.restore();
}
function terrain(c,t,b){if(!ready(b)||t.broken||t.honroSeal||t.honroElementCollision)return false;
 if(t.mat==='wood')return M.paintBranch(c,t,{baseRight:t.id.startsWith('right-')});
 if(!['earth','soil','rock','stone'].includes(t.mat))return false;
 const q=surface(t,b),cliff=t.id!=='canyon-ground',v=visibleRange(c,t);c.save();c.clip(q.path);if(cliff)rockMass(c,t,b);else earthField(c,t,b);
 for(const [a,z]of q.walk){if(z.x<v.left||a.x>v.right)continue;const len=z.x-a.x;if(len<.01)continue;const slope=(z.y-a.y)/len,d=cliff?Math.max(9,20-Math.abs(slope)*8):95;
  c.save();c.transform(1,slope,0,1,a.x,a.y);const earth=M.soilPattern(c);earth.setTransform(new DOMMatrix([.57,0,0,d/320,-a.x,0]));c.fillStyle=earth;c.fillRect(0,0,len+.3,d);c.restore();soilBand(c,a,z,cliff?2:4,cliff?'#79755438':'#9a886144');
 }
 c.restore();return true;
}
function placement(l,b){let q=placements.get(l);if(q)return q;const spec=treeSpecs[l.id];if(!spec)return null;const support=b.terrain.find(t=>t.id===spec.support&&!t.broken);if(!support)return null;
 // Overhangs can have several surfaces at this x. Preserve the authored nearY
 // instead of snapping the foot to the highest unrelated piece of cliff.
 const y=C.topAt(support,l.x,l.y)+4,scale=l.scale??l.size??1,img=P.images[spec.image],h=spec.meters*E.WORLD_UNITS_PER_METER*scale,w=h*img.naturalWidth/img.naturalHeight,foot=spec.flip?1-spec.foot:spec.foot;
 q={spec,y,h,w,left:l.x-w*foot,right:l.x+w*(1-foot),top:y-h*.9,bottom:y+h*.1};placements.set(l,q);return q;
}
function landmark(c,l,b){if(!ready(b))return false;
 if(treeSpecs[l.id]){const q=placement(l,b);if(!q)return true;const img=P.forestImage(q.spec.image);c.save();c.translate(l.x,q.y);c.scale(q.spec.flip?-1:1,1);c.drawImage(img,-q.w*q.spec.foot,-q.h*.9,q.w,q.h);c.restore();return true;}
 if(l.asset?.id?.startsWith('act1-scene:rooted-'))return true;
 if(l.id.startsWith('flora-')){if(plants.has(l.id)){const img=P.forestImage('roots'),h=27*(l.scale??l.size??1),w=h*img.width/img.height;c.drawImage(img,l.x-w*.5,l.y-h,w,h);}return true;}
 if(/^mockup-granite/.test(l.asset?.id||'')){for(const t of G.HonroTerrainDomain.render(b))if(!t.broken&&(t.honroElementId===l.id||l.collisionIds?.includes(t.id)))granite(c,t,b);return true;}
 return false;
}
const oldBackground=S.background;S.background=function(c,w,h,b){if(!active(b)||!background(c,w,h,b,this))return oldBackground.call(this,c,w,h,b);};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(!active(this.battle)||!terrain(c,t,this.battle))return oldTerrain.call(this,c,t);};
const oldLandmark=S.landmark;S.landmark=function(c,l){if(!active(this.battle)||!landmark(c,l,this.battle))return oldLandmark.call(this,c,l);};
const oldVisible=S._landmarkVisible;S._landmarkVisible=function(l,view,pad=40){if(active(this.battle)&&ready(this.battle)){
 if(treeSpecs[l.id]){const q=placement(l,this.battle);return !!q&&q.left-pad<=view.right&&q.right+pad>=view.left&&q.top-pad<=view.bottom&&q.bottom+pad>=view.top;}
 if(l.asset?.id?.startsWith('act1-scene:rooted-'))return false;
 }return oldVisible.call(this,l,view,pad);};
const oldZones=S.surfaceZones;S.surfaceZones=function(c,b){return oldZones.call(this,c,active(b)&&ready(b)?{...b,honroSurfaceZones:(b.honroSurfaceZones||[]).filter(z=>/water|current/.test(z.kind))}:b);};
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':stage2-earth-masses2:'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage2-location',active,naturalEdges:true,cachedWorld:true});
G.HonroStage2LocationArt={active,ready,placement,treeSpecs};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage3-location-art.js
(()=>{
'use strict';
(function(G){'use strict';
const S=G.HonroScene.prototype,C=G.HONRO_CORE,E=G.HonroEnvironment,P=G.HonroPaintedPilots,M=G.HonroStage1LocationArt;
const active=b=>b?.honroStage===3&&b.honroMap?.act1Scene?.version===1;
const ids=['valleyFar','forestSoil','forestRock','pineA','pineB','roots','passGate','ferryHall','ferryShrine','ferryWorkbay'];
const ready=b=>{if(!active(b))return false;P.request(ids);return ids.every(P.ready);};
const paths=new WeakMap(),pictures=new Map(),patterns=new WeakMap(),treeCache=new WeakMap();let far,earthCards,plank,mudCard;
const random=n=>{const q=Math.sin(n*12.9898+78.233)*43758.5453;return q-Math.floor(q);};
const clamp=n=>Math.max(0,Math.min(1,n));
function prepared(t){let q=paths.get(t);if(q?.source===t.vertices)return q;const ps=C.poly(t),top=M.prepare(t).top,unders=[];for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];if(z.x<a.x)unders.push([z,a]);}
 const bottom=x=>{const e=unders.find(([a,z])=>x>=a.x&&x<=z.x);return e?e[0].y+(e[1].y-e[0].y)*(x-e[0].x)/(e[1].x-e[0].x):top(x)+30;};q={source:t.vertices,path:M.prepare(t).path,top,bottom,edges:M.prepare(t).edges};paths.set(t,q);return q;}
function picture(id){if(pictures.has(id))return pictures.get(id);const img=P.images[id],cv=document.createElement('canvas');cv.width=img.naturalWidth;cv.height=img.naturalHeight;const c=cv.getContext('2d');c.filter='saturate(.63) contrast(.96) brightness(.9)';c.drawImage(img,0,0);c.filter='none';c.globalCompositeOperation='source-atop';c.fillStyle='#41463d18';c.fillRect(0,0,cv.width,cv.height);pictures.set(id,cv);return cv;}
function background(c,w,h,b,scene){if(!ready(b))return false;if(!far){far=document.createElement('canvas');far.width=2304;far.height=1024;const cc=far.getContext('2d');cc.fillStyle='#293e45';cc.fillRect(0,0,2304,1024);cc.filter='saturate(.48) contrast(.78) brightness(.86) blur(.65px)';cc.drawImage(P.images.valleyFar,0,16,2304,768);cc.filter='none';cc.fillStyle='#3b51591f';cc.fillRect(0,0,2304,1024);const fade=cc.createLinearGradient(0,550,0,780);fade.addColorStop(0,'#293e4500');fade.addColorStop(1,'#293e45');cc.fillStyle=fade;cc.fillRect(0,550,2304,474);}
 const raw=G.HonroVisualStyle.raw(c),q=E.act1BackdropFrame(scene,w,h,b,far.width,far.height),paint=cc=>{cc.fillStyle='#293e45';cc.fillRect(0,0,w,h);cc.drawImage(far,q.x,q.y,q.w,q.h);};if(!scene._screenRaster(raw,['stage3',P.appearanceKey(),w,h,scene.x,scene.y,scene.scale].join(':'),w,h,paint,'_screenBackgroundCache',false))paint(raw);scene.environmentStats={groups:1,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};return true;}
function soils(){if(earthCards)return earthCards;earthCards=[];for(const rect of [[0,0,1024,1024],[100,150,900,874],[0,260,1024,764]]){const cv=document.createElement('canvas');cv.width=640;cv.height=640;const c=cv.getContext('2d');c.filter='saturate(.72) contrast(.8) brightness(1.10)';c.drawImage(P.images.forestSoil,...rect,0,0,640,640);c.filter='none';c.fillStyle='#675a3e24';c.fillRect(0,0,640,640);c.globalCompositeOperation='destination-in';for(const horizontal of [true,false]){const g=c.createLinearGradient(0,0,horizontal?640:0,horizontal?0:640);g.addColorStop(0,'#0000');g.addColorStop(.18,'#000');g.addColorStop(.82,'#000');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(0,0,640,640);}earthCards.push(cv);}return earthCards;}
function wetMud(c){let ps=patterns.get(c);if(!ps){ps={};patterns.set(c,ps);}if(!mudCard){mudCard=document.createElement('canvas');mudCard.width=1024;mudCard.height=256;const cc=mudCard.getContext('2d');cc.filter='saturate(.58) contrast(.62) brightness(1.16) blur(.55px)';cc.drawImage(P.images.forestSoil,200,180,600,500,0,0,1024,256);cc.filter='none';cc.fillStyle='#6d69514a';cc.fillRect(0,0,1024,256);cc.globalCompositeOperation='destination-in';const g=cc.createLinearGradient(0,0,0,256);g.addColorStop(0,'#000');g.addColorStop(.3,'#000');g.addColorStop(1,'#0000');cc.fillStyle=g;cc.fillRect(0,0,1024,256);}return ps.mud||(ps.mud=c.createPattern(mudCard,'repeat-x'));}
function mineralAt(b,x){let value=0;for(const z of b.honroSurfaceZones||[]){const strength={'scree-mass':.34,scree:.34,'rock-mass':.62,'gravel-mass':.44,'stone-road':.48}[z.kind];if(!strength)continue;const x1=z.x1??Math.min(...(z.surface||z.points||[]).map(p=>p[0])),x2=z.x2??Math.max(...(z.surface||z.points||[]).map(p=>p[0]));if(Number.isFinite(x1)&&Number.isFinite(x2))value=Math.max(value,strength*clamp((x-x1+110)/160)*clamp((x2-x+110)/160));}return value;}
function groundField(c,t,b,stone=false){const q=prepared(t),m=c.getTransform(),left=Math.max(t.x,-m.e/m.a-4),right=Math.min(t.x+t.w,(c.canvas.width-m.e)/m.a+4),top=Math.max(t.y,-m.f/m.d-4),bottom=Math.min(t.y+t.h,(c.canvas.height-m.f)/m.d+4),floor=G.HonroTerrainDomain.render(b).find(o=>o.id==='ferry-ground'),cards=soils();
 c.save();c.clip(q.path);c.fillStyle='#35352d';c.fill(q.path);
 for(let iy=Math.floor((top-1100)/580);iy<=Math.floor(bottom/580);iy++)for(let ix=Math.floor((left-1300)/640);ix<=Math.floor(right/640);ix++){const seed=ix*173+iy*919,x=ix*640+(random(seed)-.5)*190,y=iy*580+(random(seed+1)-.5)*160,w=860+random(seed+2)*200,h=730+random(seed+3)*160;c.drawImage(cards[Math.floor(random(seed+4)*3)],x,y,w,h);}
 // Only the authored eastern scree/rock/gravel/stone-road surfaces receive
 // mineral outcrops. Western roots and central wet mud retain an earth matrix.
 const rock=M.rockCards();for(let i=Math.floor((left-1500)/850);i<=Math.ceil(right/850);i++){const x=i*850+(random(i*83)-.5)*280,w=1120+random(i+3)*220,weight=Math.max(stone ? .48 : 0,mineralAt(b,x+w*.5));if(weight<=.01)continue;const y=C.topAt(floor,x+w*.5,b.height)-60;c.save();c.globalAlpha=weight;c.drawImage(rock[Math.floor(random(i+8)*3)],x,y,w,680);c.restore();}
 // The actual contour controls depth. Small real boulders use only weak local
 // shading; the ground's deep-earth fade never crosses a separate stone.
 if(!stone)for(let x=Math.floor(left/96)*96;x<right;x+=96){const a=Math.max(t.x,x),z=Math.min(t.x+t.w,x+96);if(z<=a)continue;const y0=q.top(a),y1=q.top(z),depth=780;c.save();c.transform(1,(y1-y0)/(z-a),0,1,a,y0);
  const wet=clamp(((a+z)*.5-1550)/450)*clamp((3650-(a+z)*.5)/700),soil=M.soilPattern(c);soil.setTransform(new DOMMatrix([.48,0,0,90/320,-a,0]));c.fillStyle=soil;c.fillRect(0,0,z-a+.3,90);
  if(wet>0){const mud=wetMud(c);mud.setTransform(new DOMMatrix([.62,0,0,185/256,-a,0]));c.globalAlpha=wet;c.fillStyle=mud;c.fillRect(0,0,z-a+.3,185);c.globalAlpha=1;}
  const g=c.createLinearGradient(0,70,0,depth);g.addColorStop(0,'#26352b00');g.addColorStop(.6,'#222e2b66');g.addColorStop(1,'#1f2b2dcc');c.fillStyle=g;c.fillRect(0,-16,z-a+.3,Math.max(depth+16,t.y+t.h-y0));c.restore();}
 else {const g=c.createLinearGradient(t.x,t.y,t.x+t.w,t.y+t.h);g.addColorStop(0,'#aaa78d14');g.addColorStop(1,'#23312c26');c.fillStyle=g;c.fill(q.path);}
 c.restore();return true;}
function wood(c){let fs=patterns.get(c);if(!fs){fs={};patterns.set(c,fs);}if(!plank){plank=document.createElement('canvas');plank.width=288;plank.height=48;const cc=plank.getContext('2d');cc.translate(0,48);cc.rotate(-Math.PI/2);cc.filter='saturate(.65) brightness(.94)';cc.drawImage(P.images.ferryHall,P.images.ferryHall.naturalWidth*.13,P.images.ferryHall.naturalHeight*.61,P.images.ferryHall.naturalWidth*.14,P.images.ferryHall.naturalHeight*.24,0,0,48,288);}return fs.plank||(fs.plank=c.createPattern(plank,'repeat'));}
function deck(c,t){const q=prepared(t);c.save();c.clip(q.path);const p=wood(c);p.setTransform(new DOMMatrix([1.1,0,0,.9,0,t.y]));c.fillStyle=p;c.fill(q.path);for(const [a,z]of q.edges){c.save();c.transform(1,(z.y-a.y)/(z.x-a.x),0,1,a.x,a.y);const g=c.createLinearGradient(0,0,0,64);g.addColorStop(0,'#a5977148');g.addColorStop(.2,'#76644922');g.addColorStop(.25,'#2d2b2270');g.addColorStop(1,'#25251dcc');c.fillStyle=g;c.fillRect(0,0,z.x-a.x+.2,76);c.restore();}
 for(let x=t.x+72,i=0;x<t.x+t.w-14;x+=88+random((i++)+t.x)*43){const y=q.top(x);c.beginPath();c.moveTo(x,y+2);c.lineTo(x+1,Math.min(q.bottom(x)-8,y+17));c.strokeStyle='#15201dc0';c.lineWidth=1.5;c.stroke();}
 c.beginPath();for(let i=0;i<=16;i++){const x=t.x+t.w*i/16,y=q.bottom(x)-9;i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle='#2c291fb0';c.lineWidth=8;c.stroke();c.restore();return true;}
function paintHouse(c,b){const h=b.honroMap.stage3Hanok?.house;if(!h)return false;const img=picture('ferryHall');c.drawImage(img,h.x,h.y,h.width,h.height);return true;}
function terrain(c,t,b){if(!ready(b)||t.broken||t.honroElementCollision)return false;if(t.id==='ferry-ground')return groundField(c,t,b);if(t.id==='warehouse-roof')return !!b.honroMap.stage3Hanok;if(t.id==='fc-choice-3-warehouse-side-pine')return M.paintBranch(c,t);if(t.mat==='wood')return deck(c,t);return false;}
function supports(c,b){const floor=b.terrain.find(t=>t.id==='ferry-ground'&&!t.broken);if(!floor)return;for(const t of b.terrain){if(t.broken||!(/^(dock-|cargo-step-|ferry-side-gangway)/.test(t.id)))continue;const q=prepared(t),positions=t.id.startsWith('dock-')?[.12,.53,.9]:[.18,.82];for(const u of positions){const x=t.x+t.w*u,top=q.bottom(x)-7,bottom=C.topAt(floor,x,b.height)+12;if(bottom-top<12||bottom-top>720)continue;const p=wood(c);p.setTransform(new DOMMatrix([0,1.1,-.45,0,x,top]));c.fillStyle=p;c.fillRect(x-7,top,14,bottom-top);c.fillStyle='#18262388';c.fillRect(x+2,top,5,bottom-top);c.beginPath();c.moveTo(x,top+12);c.lineTo(x+(u>.5?-35:35),top+48);c.strokeStyle='#514a36';c.lineWidth=7;c.stroke();}}}
const treeSpecs={'a1-scene-3-west-grove-west':{id:'pineA',meters:8.4,foot:.54},'a1-scene-3-west-grove-center':{id:'pineB',meters:8.8,foot:.64},'a1-scene-3-ridge-grove-west':{id:'pineB',meters:11,foot:.64}};
function tree(l,b){let q=treeCache.get(l);if(q)return q;const spec=treeSpecs[l.id],support=b.terrain.find(t=>t.id==='ferry-ground'&&!t.broken);if(!spec||!support)return null;const img=P.forestImage(spec.id,true),h=spec.meters*E.WORLD_UNITS_PER_METER*(l.scale??1),w=h*img.width/img.height,y=C.topAt(support,l.x,l.y)+4,cut=Math.round(img.height*.855)/img.height,collar=y+h*(cut-.9),contacts=spec.id==='pineA'?[[.24,.935],[.40,.960],[.55,.950],[.72,.963],[.88,.950]]:[[.36,.948],[.52,.965],[.68,.960],[.82,.965],[.95,.951]],stretch=Math.max(1,...contacts.map(([u,v])=>(C.topAt(support,l.x+(u-spec.foot)*w,l.y)-collar)/((v-cut)*h)));
 // Keep the authored trunk and bough attachment fixed. Only the root collar
 // lengthens to the sampled ground; the actual support hides buried roots.
 q={spec,img,h,w,y,cut,stretch,support,left:l.x-w*spec.foot,right:l.x+w*(1-spec.foot),top:y-h*.9,bottom:collar+h*(1-cut)*stretch};treeCache.set(l,q);return q;}
function paintTree(c,l,b){const q=tree(l,b);if(!q)return;c.save();const outside=new Path2D();outside.rect(q.left-q.w,q.top-q.h,q.w*3,q.h*4);outside.addPath(prepared(q.support).path);c.clip(outside,'evenodd');const sy=q.img.height*q.cut,collar=q.y+q.h*(q.cut-.9);c.drawImage(q.img,0,0,q.img.width,sy,q.left,q.top,q.w,q.h*q.cut);c.drawImage(q.img,0,sy,q.img.width,q.img.height-sy,q.left,collar,q.w,q.h*(1-q.cut)*q.stretch);c.restore();}
const hidden=new Set(['landmark-0','landmark-1','landmark-2','landmark-3','landmark-4','landmark-6','landmark-7','landmark-8','landmark-9','landmark-10','landmark-11','place3-loading-wall','place3-shrine-footing','place3-cargo-trestle','place3-west-dock-posts','place3-mid-dock-posts','place3-east-dock-posts','place3-side-gangway-rig','place3-reed-west','place3-reed-east','place3-pine-ridge','place3-pine-behind-hall','place3-scree-ridge']);
const plants=new Set(['flora-0','flora-3','flora-9','flora-12']);
function sprite(c,id,x,y,h){const img=picture(id),w=h*img.width/img.height;c.drawImage(img,x-w*.5,y-h,w,h);}
function landmark(c,l,b){if(!ready(b))return false;if(treeSpecs[l.id]){paintTree(c,l,b);return true;}
 if(l.id==='a1-scene-3-cargo-hall')return paintHouse(c,b);
 if(l.id==='a1-scene-3-ferry-workbay'){const t=b.terrain.find(t=>t.id==='dock-west'&&!t.broken);if(t)sprite(c,'ferryWorkbay',l.x,C.topAt(t,l.x,l.y)+4,225);return true;}
 if(l.id==='a1-scene-3-exit-court'){sprite(c,'passGate',l.x,C.topAt(b.terrain.find(t=>t.id==='ferry-ground'),l.x,l.y)+4,225);return true;}
 if(l.id==='landmark-5'){sprite(c,'ferryShrine',l.x,l.y+3,145);return true;}
 if(hidden.has(l.id)||l.asset?.id?.startsWith('act1-scene:rooted-'))return true;
 if(l.id.startsWith('flora-')){if(plants.has(l.id)){const img=P.forestImage('roots'),h=26,w=h*img.width/img.height;c.drawImage(img,l.x-w*.5,l.y-h,w,h);}return true;}
 if(/^mockup-granite/.test(l.asset?.id||'')){for(const t of G.HonroTerrainDomain.render(b))if(!t.broken&&(t.honroElementId===l.id||l.collisionIds?.includes(t.id)))M.paintRock(c,t,b);return true;}return false;}
// These are functional enemy habitats, not buildings. Keep their identity
// and emergence logic, and replace only the renderer's generic house glyph.
const oldMarker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(ready(scene.battle)&&m.type==='hauntHabitat'){const c=scene.ctx,b=scene.battle,support=b.terrain.find(t=>t.id===m.support),y=support?C.topAt(support,m.x,m.y)+2:m.y,img=P.forestImage('roots'),h=35,w=h*img.width/img.height;c.save();c.drawImage(img,m.x-w*.5,y-h,w,h);c.restore();return true;}return oldMarker.call(this,scene,m);};
const oldBackground=S.background;S.background=function(c,w,h,b){if(!active(b)||!background(c,w,h,b,this))return oldBackground.call(this,c,w,h,b);};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(!active(this.battle)||!terrain(c,t,this.battle))return oldTerrain.call(this,c,t);};
const oldLandmark=S.landmark;S.landmark=function(c,l){if(!active(this.battle)||!landmark(c,l,this.battle))return oldLandmark.call(this,c,l);};
const oldLayer=S._landmarkLayer;S._landmarkLayer=function(c,ls,layer){oldLayer.call(this,c,ls,layer);if(layer==='structural-back'&&ready(this.battle))supports(c,this.battle);};
const oldVisible=S._landmarkVisible;S._landmarkVisible=function(l,v,pad=40){if(ready(this.battle)){if(treeSpecs[l.id]){const q=tree(l,this.battle);return !!q&&q.left-pad<=v.right&&q.right+pad>=v.left&&q.top-pad<=v.bottom&&q.bottom+pad>=v.top;}if(l.id==='a1-scene-3-cargo-hall'){const h=this.battle.honroMap.stage3Hanok?.house;return !!h&&h.x-pad<=v.right&&h.x+h.width+pad>=v.left&&h.y-pad<=v.bottom&&h.y+h.height+pad>=v.top;}
 const spec=l.id==='a1-scene-3-ferry-workbay'?['ferryWorkbay',225]:l.id==='a1-scene-3-exit-court'?['passGate',225]:l.id==='landmark-5'?['ferryShrine',145]:null;if(spec){const img=picture(spec[0]),h=spec[1],w=h*img.width/img.height;return l.x-w*.5-pad<=v.right&&l.x+w*.5+pad>=v.left&&l.y-h-pad<=v.bottom&&l.y+pad>=v.top;}
 }return oldVisible.call(this,l,v,pad);};
const oldZones=S.surfaceZones;S.surfaceZones=function(c,b){return oldZones.call(this,c,ready(b)?{...b,honroSurfaceZones:(b.honroSurfaceZones||[]).filter(z=>/water|current/.test(z.kind))}:b);};
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':stage3-intact-hanok5:'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage3-location',active,naturalEdges:true,cachedWorld:true});G.HonroStage3LocationArt={active,ready,prepared};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage4-location-art.js
(()=>{
'use strict';
(function(G){'use strict';
const S=G.HonroScene.prototype,C=G.HONRO_CORE,E=G.HonroEnvironment,P=G.HonroPaintedPilots,M=G.HonroStage1LocationArt;
const active=b=>b?.honroStage===4&&b.honroMap?.stage4Gate?.version===1;
const ids=['gateFar','gate4','watch4','burned4','forestSoil','forestRock','pineA','pineB','dead','roots','bark'];
const ready=b=>{if(!active(b))return false;P.request(ids);return ids.every(P.ready);};
const pictures=new Map(),patterns=new WeakMap(),trees=new WeakMap();let far,soilCards,filterPasses=0;
const rand=n=>{const v=Math.sin(n*12.9898+78.233)*43758.5453;return v-Math.floor(v);};
function picture(id){if(pictures.has(id))return pictures.get(id);const im=P.images[id],cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const c=cv.getContext('2d');c.filter=id.startsWith('pine')?'saturate(.55) contrast(.86) brightness(.9)':'saturate(.76) contrast(.96) brightness(.93)';filterPasses++;c.drawImage(im,0,0);c.filter='none';pictures.set(id,cv);return cv;}
function background(c,w,h,b,scene){if(!ready(b))return false;if(!far){far=document.createElement('canvas');far.width=2304;far.height=1024;const cc=far.getContext('2d');cc.fillStyle='#2b3d47';cc.fillRect(0,0,2304,1024);cc.filter='saturate(.46) contrast(.65) brightness(1.12) blur(.65px)';filterPasses++;cc.drawImage(P.images.gateFar,0,16,2304,768);cc.filter='none';cc.fillStyle='#35495815';cc.fillRect(0,0,2304,1024);const fade=cc.createLinearGradient(0,560,0,790);fade.addColorStop(0,'#2b3d4700');fade.addColorStop(1,'#2b3d47');cc.fillStyle=fade;cc.fillRect(0,560,2304,464);}
 const raw=G.HonroVisualStyle.raw(c),q=E.act1BackdropFrame(scene,w,h,b,far.width,far.height),paint=cc=>{cc.fillStyle='#2b3d47';cc.fillRect(0,0,w,h);cc.drawImage(far,q.x,q.y,q.w,q.h);};if(!scene._screenRaster(raw,['stage4',P.appearanceKey(),w,h,scene.x,scene.y,scene.scale].join(':'),w,h,paint,'_screenBackgroundCache',false))paint(raw);scene.environmentStats={groups:1,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};return true;}
function soils(){if(soilCards)return soilCards;soilCards=[];for(const [i,rect]of [[0,[0,0,1024,1024]],[1,[100,150,900,874]],[2,[0,260,1024,764]]]){const cv=document.createElement('canvas');cv.width=cv.height=640;const c=cv.getContext('2d');c.filter='saturate(.64) contrast(.76) brightness(1.08)';filterPasses++;c.drawImage(P.images.forestSoil,...rect,0,0,640,640);c.filter='none';c.fillStyle=i===2?'#2a312b1c':'#7460421e';c.fillRect(0,0,640,640);c.globalCompositeOperation='destination-in';for(const horizontal of [true,false]){const g=c.createLinearGradient(0,0,horizontal?640:0,horizontal?0:640);g.addColorStop(0,'#0000');g.addColorStop(.16,'#000');g.addColorStop(.84,'#000');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(0,0,640,640);}soilCards.push(cv);}return soilCards;}
function pattern(c,id){let row=patterns.get(c);if(!row){row={};patterns.set(c,row);}return row[id]||(row[id]=c.createPattern(P.images[id],'repeat'));}
function ground(c,t){const q=M.prepare(t),m=c.getTransform(),left=Math.max(t.x,-m.e/m.a-4),right=Math.min(t.x+t.w,(c.canvas.width-m.e)/m.a+4),top=Math.max(t.y,-m.f/m.d-4),bottom=Math.min(t.y+t.h,(c.canvas.height-m.f)/m.d+4),cards=soils();c.save();c.clip(q.path);c.fillStyle='#3c3b31';c.fill(q.path);
 for(let iy=Math.floor((top-1000)/610);iy<=Math.floor(bottom/610);iy++)for(let ix=Math.floor((left-1300)/720);ix<=Math.floor(right/720);ix++){const seed=ix*173+iy*919,x=ix*720+(rand(seed)-.5)*200,y=iy*610+(rand(seed+1)-.5)*180;c.drawImage(cards[Math.floor(rand(seed+2)*3)],x,y,900+rand(seed+3)*170,800+rand(seed+4)*130);}
 for(let x=Math.floor(left/80)*80;x<right;x+=80){const a=Math.max(t.x,x),z=Math.min(t.x+t.w,x+80);if(z<=a)continue;const y0=q.top(a),y1=q.top(z),mid=(a+z)*.5,burn=Math.max(0,Math.min(1,(mid-1760)/220,(2880-mid)/250));c.save();c.transform(1,(y1-y0)/(z-a),0,1,a,y0);const cap=M.soilPattern(c);cap.setTransform(new DOMMatrix([.48,0,0,110/320,-a,0]));c.fillStyle=cap;c.fillRect(0,0,z-a+.3,110);
  if(burn>0){const g=c.createLinearGradient(0,0,0,260);g.addColorStop(0,`rgba(16,23,22,${burn*.6})`);g.addColorStop(.5,`rgba(24,29,26,${burn*.35})`);g.addColorStop(1,'#18221e00');c.fillStyle=g;c.fillRect(0,0,z-a+.3,260);}
  // Cover the tile bottom at both ends of a sheared contour span. On a steep
  // uphill edge, using only y0 left exposed triangular soil-card corners.
  const depth=c.createLinearGradient(0,45,0,560);depth.addColorStop(0,'#2b342600');depth.addColorStop(.4,'#252f2a91');depth.addColorStop(1,'#202c2e');c.fillStyle=depth;c.fillRect(0,-8,z-a+.3,Math.max(570,bottom-Math.min(y0,y1)+20));c.restore();}
 c.restore();return true;}
function beam(c,t){const q=M.prepare(t);c.save();c.clip(q.path);const p=pattern(c,'bark');p.setTransform(new DOMMatrix([1.4,0,0,.7,0,t.y]));c.fillStyle=p;c.fill(q.path);c.fillStyle='#151c1b8c';c.fill(q.path);for(const [a,z]of q.edges){c.beginPath();c.moveTo(a.x,a.y+3);c.lineTo(z.x,z.y+3);c.strokeStyle='#8b80604a';c.lineWidth=3;c.stroke();}c.restore();return true;}
function terrain(c,t,b){if(!ready(b)||t.broken)return false;if(['gate-roof','east-watch','east-step-1'].includes(t.id))return true;if(t.id==='gate-basin')return ground(c,t);if(t.id==='west-shoulder'||t.honroElementCollision){M.paintRock(c,t,b);return true;}if(t.id==='fc-choice-4-gate-flank-pine'){M.paintBranch(c,t);return true;}if(t.id==='burned-gallery')return beam(c,t);return false;}
function tree(l,b){let q=trees.get(l);if(q)return q;const flank=l.id==='a1-scene-4-east-grove-center',id=flank?'pineB':'pineA',x=flank?2940:1510,support=b.terrain.find(t=>t.id==='gate-basin'),im=picture(id),h=flank?552:492,w=h*im.width/im.height,foot=flank?.64:.54,y=C.topAt(support,x)+4,cut=.855,collar=y+h*(cut-.9),contacts=flank?[[.36,.948],[.52,.965],[.68,.96],[.82,.965],[.95,.951]]:[[.24,.935],[.4,.96],[.55,.95],[.72,.963],[.88,.95]],stretch=Math.max(1,...contacts.map(([u,v])=>(C.topAt(support,x+(u-foot)*w)-collar)/((v-cut)*h)));
 q={im,h,w,x,y,foot,cut,stretch,support,left:x-w*foot,right:x+w*(1-foot),top:y-h*.9,bottom:collar+h*(1-cut)*stretch};trees.set(l,q);return q;}
function paintTree(c,l,b){const q=tree(l,b);c.save();const outside=new Path2D();outside.rect(q.left-q.w,q.top-q.h,q.w*3,q.h*4);outside.addPath(M.prepare(q.support).path);c.clip(outside,'evenodd');const sy=q.im.height*q.cut,collar=q.y+q.h*(q.cut-.9);c.drawImage(q.im,0,0,q.im.width,sy,q.left,q.top,q.w,q.h*q.cut);c.drawImage(q.im,0,sy,q.im.width,q.im.height-sy,q.left,collar,q.w,q.h*(1-q.cut)*q.stretch);c.restore();}
const structureIds={'a1-scene-4-north-gate':'gate','a1-scene-4-east-watch-court':'watch','a1-scene-4-burned-courtyard':'burned'};
const treeIds=new Set(['a1-scene-4-gate-grove-center','a1-scene-4-east-grove-center']);
function landmark(c,l,b){if(!ready(b))return false;const key=structureIds[l.id];if(key){const h=b.honroMap.stage4Gate[key];c.drawImage(picture(h.image),h.x,h.y,h.width,h.height);return true;}if(treeIds.has(l.id)){paintTree(c,l,b);return true;}
 if(/^mockup-granite/.test(l.asset?.id||'')){for(const t of G.HonroTerrainDomain.render(b))if(!t.broken&&(t.honroElementId===l.id||l.collisionIds?.includes(t.id)))M.paintRock(c,t,b);return true;}
 // These remaining records are retained for IDs/support bookkeeping. Their
 // old vector houses/carts/cliffs, dense groves and habitat glyphs are visual.
 return true;}
function supports(c,b){const floor=b.terrain.find(t=>t.id==='gate-basin'),gallery=b.terrain.find(t=>t.id==='burned-gallery'&&!t.broken);if(!floor||!gallery)return;const p=pattern(c,'bark');p.setTransform(new DOMMatrix([0,1,-.5,0,0,0]));for(const x of [2114,2318]){const y=C.topAt(gallery,x)+14,bottom=C.topAt(floor,x)+8;c.fillStyle=p;c.fillRect(x-8,y,16,bottom-y);c.fillStyle='#131a1aa0';c.fillRect(x-8,y,16,bottom-y);}}
const oldBackground=S.background;S.background=function(c,w,h,b){if(!active(b)||!background(c,w,h,b,this))return oldBackground.call(this,c,w,h,b);};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(!active(this.battle)||!terrain(c,t,this.battle))return oldTerrain.call(this,c,t);};
const oldLandmark=S.landmark;S.landmark=function(c,l){if(!active(this.battle)||!landmark(c,l,this.battle))return oldLandmark.call(this,c,l);};
const oldLayer=S._landmarkLayer;S._landmarkLayer=function(c,ls,layer){oldLayer.call(this,c,ls,layer);if(layer==='structural-back'&&ready(this.battle))supports(c,this.battle);};
const oldVisible=S._landmarkVisible;S._landmarkVisible=function(l,v,pad=40){if(ready(this.battle)){const key=structureIds[l.id],q=key?this.battle.honroMap.stage4Gate[key]:treeIds.has(l.id)?tree(l,this.battle):null;if(q){const x=q.x??q.left,y=q.y,width=q.width??q.w,height=q.height??q.h;if(key)return x-pad<=v.right&&x+width+pad>=v.left&&y-pad<=v.bottom&&y+height+pad>=v.top;return q.left-pad<=v.right&&q.right+pad>=v.left&&q.top-pad<=v.bottom&&q.bottom+pad>=v.top;}}return oldVisible.call(this,l,v,pad);};
const oldZones=S.surfaceZones;S.surfaceZones=function(c,b){return oldZones.call(this,c,ready(b)?{...b,honroSurfaceZones:(b.honroSurfaceZones||[]).filter(z=>/water|current/.test(z.kind))}:b);};
const oldMarker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(ready(scene.battle)&&m.type==='hauntHabitat'){const c=scene.ctx,im=picture('dead'),h=90,w=h*im.width/im.height;c.drawImage(im,m.x-w*.5,m.y-h,w,h);return true;}return oldMarker.call(this,scene,m);};
const oldBody=S.unitBody;S.unitBody=function(c,u,...args){if(ready(this.battle)&&u.id==='objective')return;return oldBody.call(this,c,u,...args);};
const oldUnit=S.unit;S.unit=function(c,u,...args){if(!ready(this.battle)||u.id!=='objective')return oldUnit.call(this,c,u,...args);if(u.dead)return;const z=1/Math.max(.05,this.scale),w=86;c.save();c.translate(u.x,u.y-138);c.scale(z,z);c.fillStyle='#13232a';c.fillRect(-w/2-2,-2,w+4,9);c.fillStyle='#cab47c';c.fillRect(-w/2,0,w*Math.max(0,u.hp/u.maxHp),5);c.restore();};
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':stage4-gate2:'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage4-location',active,naturalEdges:true,cachedWorld:true});
G.HonroStage4LocationArt={active,ready,cacheStats:()=>({pictures:pictures.size,soilCards:soilCards?.length||0,farCanvases:far?1:0,filterPasses})};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage5-location-art.js
(()=>{
'use strict';
(function(G){'use strict';
const S=G.HonroScene.prototype,C=G.HONRO_CORE,E=G.HonroEnvironment,A=G.HonroEnvironmentArt,P=G.HonroPaintedPilots,M=G.HonroStage1LocationArt,W=G.HonroStage5WaterGeometry;
const active=b=>G.HonroStage5Waterfall.active(b)&&b.honroMap?.stage5Paint?.version===1;
const ids=['valleyFar','water5','cliff5','forestRock','forestSoil','pineA','bark'];
const ready=b=>{if(!active(b))return false;P.request(ids);return ids.every(P.ready);};
const pictures=new Map(),trees=new WeakMap(),caves=new WeakMap(),paths=new Map();let far,waterStates,ribbonCard,poolCard,headCard,foamCard,filterPasses=0;
const path=d=>{if(!paths.has(d))paths.set(d,new Path2D(d));return paths.get(d);};
const poly=ps=>{const p=new Path2D();ps.forEach((v,i)=>i?p.lineTo(v.x??v[0],v.y??v[1]):p.moveTo(v.x??v[0],v.y??v[1]));p.closePath();return p;};
const closed=poly(W.closed),opened=poly(W.opened),lineClosed=path('M2990 1220C2940 1630 3020 1900 2970 2230C2940 2600 2960 2910 2990 3310'),lineOpen=path('M2990 1220C2950 1630 3030 1880 3290 2060C3580 2240 3650 2440 3470 2750C3300 3020 3120 3230 2990 3310');
function picture(id){if(pictures.has(id))return pictures.get(id);const im=P.images[id],cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const c=cv.getContext('2d');c.filter=id==='pineA'?'saturate(.6) contrast(.88) brightness(.91)':'saturate(.68) contrast(.94) brightness(.94)';filterPasses++;c.drawImage(im,0,0);c.filter='none';if(id==='cliff5'){c.globalCompositeOperation='destination-in';const right=c.createLinearGradient(0,0,cv.width,0);right.addColorStop(0,'#000');right.addColorStop(.87,'#000');right.addColorStop(1,'#0000');c.fillStyle=right;c.fillRect(0,0,cv.width,cv.height);const bottom=c.createLinearGradient(0,0,0,cv.height);bottom.addColorStop(0,'#000');bottom.addColorStop(.83,'#000');bottom.addColorStop(1,'#0000');c.fillStyle=bottom;c.fillRect(0,0,cv.width,cv.height);}pictures.set(id,cv);return cv;}
function background(c,w,h,b,scene){if(!ready(b))return false;if(!far){far=document.createElement('canvas');far.width=2304;far.height=1024;const cc=far.getContext('2d');cc.fillStyle='#293e45';cc.fillRect(0,0,2304,1024);cc.filter='saturate(.47) contrast(.76) brightness(.87) blur(.65px)';filterPasses++;cc.drawImage(P.images.valleyFar,0,16,2304,768);cc.filter='none';cc.fillStyle='#3b51591f';cc.fillRect(0,0,2304,1024);const g=cc.createLinearGradient(0,550,0,790);g.addColorStop(0,'#293e4500');g.addColorStop(1,'#293e45');cc.fillStyle=g;cc.fillRect(0,550,2304,474);}
 const raw=G.HonroVisualStyle.raw(c),q=E.act1BackdropFrame(scene,w,h,b,far.width,far.height),paint=cc=>{cc.fillStyle='#293e45';cc.fillRect(0,0,w,h);cc.drawImage(far,q.x,q.y,q.w,q.h);cc.save();cc.translate(w/2,h/2);cc.scale(scene.scale,scene.scale);cc.translate(-scene.x,-scene.y);const spec=b.honroMap.stage5Paint;let cave=caves.get(spec);if(!cave){cave=poly(spec.cave);caves.set(spec,cave);}cc.save();cc.clip(cave);cc.fillStyle='#090d0e';cc.fill(cave);cc.globalAlpha=.27;cc.drawImage(picture('cliff5'),3970,1990,640,485);cc.globalAlpha=1;const depth=cc.createRadialGradient(3930,2260,20,4160,2230,440);depth.addColorStop(0,'#302f2945');depth.addColorStop(.46,'#0b0c0bd4');depth.addColorStop(1,'#020507f5');cc.fillStyle=depth;cc.fill(cave);cc.restore();cc.restore();};if(!scene._screenRaster(raw,['stage5',P.appearanceKey(),w,h,scene.x,scene.y,scene.scale].join(':'),w,h,paint,'_screenBackgroundCache',false))paint(raw);scene.environmentStats={groups:1,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};return true;}
// Paint the connected floor and receiver shoulder as one geological field.
// This removes material rectangles at their intersection without changing support.
function ground(c,t,b){const q=M.prepare(t),rock=b.terrain.find(v=>v.id==='ritual-overlook'),rq=M.prepare(rock),combined=new Path2D(q.path);combined.addPath(rq.path);const top=x=>Math.min(q.top(x),x>=rock.x&&x<=rock.x+rock.w?rq.top(x):Infinity),m=c.getTransform(),left=Math.max(t.x,-m.e/m.a-4),right=Math.min(t.x+t.w,(c.canvas.width-m.e)/m.a+4);c.save();c.clip(combined);c.fillStyle='#343831';c.fill(combined);const cards=M.rockCards();
 for(let i=Math.floor((left-1300)/850);i<=Math.ceil(right/850);i++){const x=i*850,w=1250,y=Math.min(...[0,.25,.5,.75,1].map(u=>top(x+w*u)))-220;c.drawImage(cards[(i%3+3)%3],x,y,w,1120);}
 // Short spans follow every real upper face, with one thin soil transition.
 for(let x=Math.floor(left/24)*24;x<right;x+=24){const a=Math.max(t.x,x),z=Math.min(t.x+t.w,x+24);if(z<=a)continue;const y0=top(a),y1=top(z),d=(a+z)*.5<1280?95:29;c.save();c.transform(1,(y1-y0)/(z-a),0,1,a,y0);const soil=M.soilPattern(c);soil.setTransform(new DOMMatrix([.42,0,0,d/320,-a,0]));c.globalAlpha=.78;c.fillStyle=soil;c.fillRect(0,0,z-a+.3,d);c.restore();}
 const fade=c.createLinearGradient(0,2660,0,3700);fade.addColorStop(0,'#152b3000');fade.addColorStop(.38,'#172d3480');fade.addColorStop(.7,'#102a34eb');fade.addColorStop(1,'#0d2733');c.fillStyle=fade;c.fill(combined);c.restore();return true;}

function cliff(c,t,b){const q=M.prepare(t),h=b.honroMap.stage5Paint.cliff;c.save();c.clip(q.path);c.fillStyle=A.gradient(c,0,1200,0,4900,[[0,'#4d5d59'],[.55,'#31454b'],[1,'#1d323a']]);c.fill(q.path);c.drawImage(picture('cliff5'),h.x,h.y,h.width,h.height);c.fillStyle=A.gradient(c,3840,0,4480,0,[[0,'#173d4a44'],[.32,'#122d3940'],[.7,'#223b3a08'],[1,'#17343d00']]);c.fillRect(3800,1200,900,3500);const rim=poly(b.honroMap.stage5Paint.cave);c.strokeStyle='#090e105c';c.lineWidth=46;c.lineJoin='round';c.stroke(rim);c.restore();return true;}
function terrain(c,t,b){if(!ready(b)||t.broken)return false;if(t.id==='waterfall-veil')return true;if(t.id==='valley-floor')return ground(c,t,b);if(t.id==='waterfall-cliff')return cliff(c,t,b);if(t.id==='west-overlook'){M.paintBranch(c,t);return true;}if(t.id==='ritual-overlook')return true;if(t.honroElementCollision){M.paintRock(c,t,b);return true;}return false;}
function tree(l,b){let q=trees.get(l);if(q)return q;const spec=b.honroMap.stage5Paint.tree,im=picture('pineA'),h=spec.height,w=h*im.width/im.height,support=b.terrain.find(t=>t.id==='valley-floor'),x=spec.x,foot=spec.foot,y=C.topAt(support,x)+4,cut=.855,collar=y+h*(cut-.9),contacts=[[.24,.935],[.4,.96],[.55,.95],[.72,.963],[.88,.95]],stretch=Math.max(1,...contacts.map(([u,v])=>(C.topAt(support,x+(u-foot)*w)-collar)/((v-cut)*h)));q={im,h,w,x,y,cut,stretch,support,left:x-w*foot,right:x+w*(1-foot),top:y-h*.9,bottom:collar+h*(1-cut)*stretch};trees.set(l,q);return q;}
function paintTree(c,l,b){const q=tree(l,b);c.save();const outside=new Path2D();outside.rect(q.left-q.w,q.top-q.h,q.w*3,q.h*4);outside.addPath(M.prepare(q.support).path);c.clip(outside,'evenodd');const sy=q.im.height*q.cut,collar=q.y+q.h*(q.cut-.9);c.drawImage(q.im,0,0,q.im.width,sy,q.left,q.top,q.w,q.h*q.cut);c.drawImage(q.im,0,sy,q.im.width,q.im.height-sy,q.left,collar,q.w,q.h*(1-q.cut)*q.stretch);c.restore();}
function cards(){if(ribbonCard)return;const cv=(w,h)=>{const q=document.createElement('canvas');q.width=w;q.height=h;return q;};
 ribbonCard=cv(512,1536);let c=ribbonCard.getContext('2d');c.filter='saturate(.45) brightness(.92)';filterPasses++;c.drawImage(P.images.water5,0,0,512,1536);c.filter='none';let g;
 const spans=(ps,y)=>{const xs=[];for(let i=0;i<ps.length;i++){const a=ps[i],b=ps[(i+1)%ps.length];if((a.y>y)!==(b.y>y))xs.push(a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y));}return [Math.min(...xs),Math.max(...xs)];};
 waterStates=[W.closed,W.opened].map(ps=>{const v=cv(1024,1536),cc=v.getContext('2d');cc.scale(1024/1140,1536/2150);cc.translate(-2650,-1210);cc.clip(poly(ps));for(let i=0;i<384;i++){const y=1220+i*2115/384,h=2115/384,[a,b]=spans(ps,Math.min(3310,y+h*.5));if(!Number.isFinite(a)||!Number.isFinite(b))continue;cc.drawImage(ribbonCard,110,96+i*1440/384,292,1440/384,a-8,y,b-a+16,h+.03);}return v;});
 poolCard=cv(1024,512);c=poolCard.getContext('2d');g=c.createLinearGradient(0,0,0,512);for(const [x,col]of [[0,'#476b73'],[.045,'#355464'],[.16,'#284759'],[.43,'#183444'],[.78,'#0e2936'],[1,'#0d2733']])g.addColorStop(x,col);c.fillStyle=g;c.fillRect(0,0,1024,512);
 // A short reflected fall and unequal horizontal glints remain near the surface.
 g=c.createRadialGradient(586,2,2,586,8,288);g.addColorStop(0,'#c2d4c052');g.addColorStop(.28,'#93b5aa27');g.addColorStop(1,'#718b9400');c.save();c.scale(1,.35);c.fillStyle=g;c.fillRect(0,0,1024,512);c.restore();
 // Shallow reflected water is broken into broad unequal bands, not a flat plate.
 for(const [x,y,w,h,a]of [[278,10,420,4,.12],[445,22,282,7,.16],[393,39,330,8,.1],[491,57,208,9,.11],[435,79,255,10,.07],[506,106,153,11,.065],[478,133,170,9,.04]]){c.globalAlpha=a;c.fillStyle='#a7b7ac';c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+w*.23,y-h*.3,x+w*.56,y+h*.2,x+w,y-h*.3);c.lineTo(x+w*.83,y+h*.6);c.bezierCurveTo(x+w*.57,y+h,x+w*.22,y+h*.4,x-w*.08,y+h*.7);c.closePath();c.fill();}c.globalAlpha=1;
 for(const [x,y,w,h,a]of [[402,5,165,2,.21],[568,12,112,2,.19],[479,23,174,2,.15],[604,37,72,2,.12],[348,50,120,1,.10],[527,64,107,1,.08],[705,17,98,1,.1]]){c.globalAlpha=a;c.fillStyle='#bdc6b1';c.fillRect(x,y,w,h);}c.globalAlpha=1;
 headCard=cv(512,128);c=headCard.getContext('2d');g=c.createLinearGradient(0,0,0,128);g.addColorStop(0,'#9abbbd99');g.addColorStop(1,'#315961d9');c.fillStyle=g;c.fillRect(0,0,512,128);
 foamCard=cv(512,128);c=foamCard.getContext('2d');g=c.createRadialGradient(256,64,4,256,64,256);g.addColorStop(0,'#dce8d9b0');g.addColorStop(.55,'#b1d0c77a');g.addColorStop(1,'#b1d0c700');c.fillStyle=g;c.fillRect(0,0,512,128);c.fillStyle='#e1e9d79e';c.fill(path('M30 71Q70 46 105 66Q142 36 174 59Q201 30 240 55Q275 22 315 58Q351 35 383 63Q427 48 472 73Q391 92 320 83Q240 100 166 83Q95 95 30 71Z'));c.globalCompositeOperation='destination-in';const fade=c.createLinearGradient(0,0,0,128);fade.addColorStop(0,'#0000');fade.addColorStop(.25,'#000');fade.addColorStop(.75,'#000');fade.addColorStop(1,'#0000');c.fillStyle=fade;c.fillRect(0,0,512,128);
}
function liveWater(c,b,scene){cards();const time=A.time(scene),veil=G.HonroQuestTargets.records(b).find(t=>t.id==='waterfall-veil'),open=!!veil?.honroWaterOpen,shape=open?opened:closed,offset=W.offset(b),head=b.honroSurfaceZones.find(z=>z.id==='stage5-headwater'),basin=b.honroSurfaceZones.find(z=>z.id==='stage5-plunge-pool');
 if(head){const q=A.poolData(head);c.save();c.clip(q.clip);c.drawImage(headCard,q.left,1220,q.right-q.left,150);c.strokeStyle='#c5dfd17a';c.lineWidth=4;for(let i=0;i<8;i++){const x=3900+i*240-time*80%240;c.beginPath();c.moveTo(x,1241+i%3*12);c.quadraticCurveTo(x+55,1234+i%3*12,x+140,1243+i%3*12);c.stroke();}c.restore();}
 if(basin){const q=A.poolData(basin);c.save();c.clip(q.clip);c.drawImage(poolCard,q.left,3300,q.right-q.left,Math.max(100,q.bottom-3300));c.strokeStyle='#99c2c377';c.lineWidth=3;for(let i=0;i<5;i++){const x=3520+i*156,y=3313+i*15,shift=Math.sin(time*.8+i)*14;c.beginPath();c.moveTo(x+shift,y);c.quadraticCurveTo(x+45+shift,y-4,x+90+i%3*22+shift,y+1);c.stroke();}c.restore();}
 c.save();c.translate(offset,0);c.save();c.clip(shape);c.drawImage(waterStates[open?1:0],2650,1210,1140,2150);c.setLineDash([53,127,170,230,86,207]);c.lineDashOffset=-time*510;for(const [i,dx]of [-73,-23,37,88].entries()){c.save();c.translate(dx,0);c.lineDashOffset+=i*163;c.lineWidth=i===1?9:4;c.strokeStyle=i%2?'#e8f0e353':'#d4e7df39';c.stroke(open?lineOpen:lineClosed);c.restore();}c.restore();
 c.strokeStyle='#d7e6d3aa';c.lineWidth=6;c.beginPath();c.moveTo(2798,1220);c.bezierCurveTo(2920,1210,3070,1216,3210,1220);c.stroke();
 const pulse=Math.sin(time*2.1)*.045;c.drawImage(foamCard,2655-pulse*180,3255,650+pulse*360,112+pulse*40);c.globalAlpha=.55;c.drawImage(foamCard,2720+Math.sin(time*1.4)*16,3295,550,75);c.globalAlpha=1;c.strokeStyle='#c5dcd0a6';c.lineWidth=4;for(let i=0;i<3;i++){const u=(time*.36+i/3)%1;c.globalAlpha=(1-u)*.55;c.beginPath();c.ellipse(2980,3310,100+u*380,10+u*28,0,0,Math.PI*2);c.stroke();}c.restore();if(scene.environmentStats)Object.assign(scene.environmentStats,{pools:basin?1:0,waterfalls:1,animatedPrimitives:22});
}
const oldBackground=S.background;S.background=function(c,w,h,b){if(!active(b)||!background(c,w,h,b,this))return oldBackground.call(this,c,w,h,b);};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(!active(this.battle)||!terrain(c,t,this.battle))return oldTerrain.call(this,c,t);};
const oldLandmark=S.landmark;S.landmark=function(c,l){if(!ready(this.battle))return oldLandmark.call(this,c,l);if(l.id==='stage5-entry-pine')paintTree(c,l,this.battle);};
const oldVisible=S._landmarkVisible;S._landmarkVisible=function(l,v,pad=40){if(ready(this.battle)&&l.id==='stage5-entry-pine'){const q=tree(l,this.battle);return q.left-pad<=v.right&&q.right+pad>=v.left&&q.top-pad<=v.bottom&&q.bottom+pad>=v.top;}return oldVisible.call(this,l,v,pad);};
const oldWater=S.liveWater;S.liveWater=function(c,b){if(!ready(b))return oldWater.call(this,c,b);oldWater.call(this,c,{...b,honroStage5WaterfallRevision:0,honroLandmarks:b.honroLandmarks.filter(l=>l.kind!=='waterfall'),honroSurfaceZones:b.honroSurfaceZones.filter(z=>!['stage5-downstream','stage5-plunge-pool','stage5-headwater'].includes(z.id))});liveWater(c,b,this);};
// The waterfall evidence pass already draws the functional grass/nest traces.
const oldMarker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(ready(scene.battle)&&m.type==='hauntHabitat')return true;return oldMarker.call(this,scene,m);};
const oldZones=S.surfaceZones;S.surfaceZones=function(c,b){return oldZones.call(this,c,ready(b)?{...b,honroSurfaceZones:[]}:b);};
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':stage5-paint2:'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage5-location',active,naturalEdges:true,cachedWorld:true});G.HonroStage5LocationArt={active,ready,cacheStats:()=>({pictures:pictures.size,paths:paths.size,farCanvases:far?1:0,waterCards:ribbonCard?6:0,filterPasses}),flowOffset:W.offset};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage6-location-art.js
(()=>{
'use strict';
(function(G){'use strict';
const S=G.HonroScene.prototype,C=G.HONRO_CORE,E=G.HonroEnvironment,A=G.HonroEnvironmentArt,P=G.HonroPaintedPilots,M=G.HonroStage1LocationArt;
const active=b=>b?.honroStage===6&&!b.honroCustom&&b.honroMap?.stage6Bridge?.version===1,ids=['valleyFar','bridge6','forestRock','forestSoil','pineA','bark'];
const ready=b=>{if(!active(b))return false;P.request(ids);return ids.every(P.ready);},pictures=new Map(),trees=new WeakMap(),paths=new Map();let far,filterPasses=0;
const path=d=>{if(!paths.has(d))paths.set(d,new Path2D(d));return paths.get(d);};
function picture(id){if(pictures.has(id))return pictures.get(id);const im=P.images[id],cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const c=cv.getContext('2d');c.filter=id==='pineA'?'saturate(.55) contrast(.86) brightness(.88)':'saturate(.65) contrast(.96) brightness(.88)';filterPasses++;c.drawImage(im,0,0);c.filter='none';pictures.set(id,cv);return cv;}
function background(c,w,h,b,scene){if(!ready(b))return false;if(!far){far=document.createElement('canvas');far.width=2304;far.height=1024;const cc=far.getContext('2d');cc.fillStyle='#2a3c43';cc.fillRect(0,0,2304,1024);cc.filter='saturate(.42) contrast(.71) brightness(.86) blur(.65px)';filterPasses++;cc.drawImage(P.images.valleyFar,0,16,2304,768);cc.filter='none';cc.fillStyle='#344c5323';cc.fillRect(0,0,2304,1024);const g=cc.createLinearGradient(0,550,0,790);g.addColorStop(0,'#2a3c4300');g.addColorStop(1,'#2a3c43');cc.fillStyle=g;cc.fillRect(0,550,2304,474);}const raw=G.HonroVisualStyle.raw(c),q=E.act1BackdropFrame(scene,w,h,b,far.width,far.height),paint=cc=>{cc.fillStyle='#2a3c43';cc.fillRect(0,0,w,h);cc.drawImage(far,q.x,q.y,q.w,q.h);};if(!scene._screenRaster(raw,['stage6',P.appearanceKey(),w,h,scene.x,scene.y,scene.scale].join(':'),w,h,paint,'_screenBackgroundCache',false))paint(raw);scene.environmentStats={groups:1,visibleAssets:1,cachedPaths:0,animatedPrimitives:0};return true;}
function ground(c,t){const q=M.prepare(t),m=c.getTransform(),left=Math.max(t.x,-m.e/m.a-4),right=Math.min(t.x+t.w,(c.canvas.width-m.e)/m.a+4),bottom=Math.min(t.y+t.h,(c.canvas.height-m.f)/m.d+4);c.save();c.clip(q.path);c.fillStyle='#363931';c.fill(q.path);
 const cards=M.rockCards();for(const [i,x,w,h]of [[0,850,800,420],[2,2900,900,440],[1,4820,740,390]])if(x+w>left&&x<right)c.drawImage(cards[i],x,q.top(x+w*.5)+150,w,h);
 for(let x=Math.floor(left/48)*48;x<right;x+=48){const a=Math.max(t.x,x),z=Math.min(t.x+t.w,x+48);if(z<=a)continue;const y0=q.top(a),y1=q.top(z),depth=210+38*Math.sin((a+z)*.0017);c.save();c.transform(1,(y1-y0)/(z-a),0,1,a,y0);const soil=M.soilPattern(c);soil.setTransform(new DOMMatrix([.62,0,0,depth/320,-a,0]));c.fillStyle=soil;c.globalAlpha=.94;c.fillRect(0,0,z-a+.3,depth);c.globalAlpha=1;const g=c.createLinearGradient(0,110,0,760);g.addColorStop(0,'#1a2a2900');g.addColorStop(.45,'#1a2c2e80');g.addColorStop(1,'#172c33');c.fillStyle=g;c.fillRect(0,70,z-a+.3,Math.max(800,bottom-Math.min(y0,y1)+30));c.restore();}
 c.restore();return true;}
function beam(c,t,b){const q=M.prepare(t),im=picture('bridge6');c.save();c.clip(q.path);c.fillStyle='#3d332b';c.fill(q.path);
 // A coherent existing longitudinal bridge timber is sampled only as grain;
 // unequal real wreck surfaces determine all walking edges and broken ends.
 c.drawImage(im,150,75,460,35,t.x,t.y,t.w,t.h);const g=c.createLinearGradient(0,t.y,0,t.y+t.h);g.addColorStop(0,'#b4a17a22');g.addColorStop(.5,'#503d2922');g.addColorStop(1,'#1b252cb0');c.fillStyle=g;c.fill(q.path);c.restore();
 c.strokeStyle='#251f1ca8';c.lineWidth=4;c.beginPath();c.moveTo(t.x+t.w*.22,t.y+3);c.lineTo(t.x+t.w*.25,t.y+t.h*.7);c.moveTo(t.x+t.w*.74,t.y+4);c.lineTo(t.x+t.w*.70,t.y+t.h*.5);c.stroke();return true;}
function terrain(c,t,b){if(!ready(b)||t.broken)return false;if(t.id==='lower-road')return ground(c,t);if(t.id.startsWith('bridge-'))return true;if(t.id==='fc-choice-6-bridge-exit-pine'){M.paintBranch(c,t);return true;}if(t.id.startsWith('debris-')||t.id==='lower-lookout')return beam(c,t,b);if(t.honroElementCollision){M.paintRock(c,t,b);return true;}return false;}
function tree(l,b){let q=trees.get(l);if(q)return q;const spec=b.honroMap.stage6Bridge.tree,im=picture('pineA'),h=spec.height,w=h*im.width/im.height,x=spec.x,support=b.terrain.find(t=>t.id==='lower-road'),y=C.topAt(support,x)+4,cut=.855,foot=spec.foot,collar=y+h*(cut-.9),contacts=[[.24,.935],[.4,.96],[.55,.95],[.72,.963],[.88,.95]],stretch=Math.max(1,...contacts.map(([u,v])=>(C.topAt(support,x+(u-foot)*w)-collar)/((v-cut)*h)));q={im,h,w,x,y,cut,stretch,support,left:x-w*foot,right:x+w*(1-foot),top:y-h*.9,bottom:collar+h*(1-cut)*stretch};trees.set(l,q);return q;}
function paintTree(c,l,b){const q=tree(l,b);c.save();const outside=new Path2D();outside.rect(q.left-q.w,q.top-q.h,q.w*3,q.h*4);outside.addPath(M.prepare(q.support).path);c.clip(outside,'evenodd');const sy=q.im.height*q.cut,collar=q.y+q.h*(q.cut-.9);c.drawImage(q.im,0,0,q.im.width,sy,q.left,q.top,q.w,q.h*q.cut);c.drawImage(q.im,0,sy,q.im.width,q.im.height-sy,q.left,collar,q.w,q.h*(1-q.cut)*q.stretch);c.restore();}
function bridge(c,b){const h=b.honroMap.stage6Bridge.bridge;c.drawImage(picture(h.image),h.x,h.y,h.width,h.height);}
function wreckSupports(c,b){const floor=b.terrain.find(t=>t.id==='lower-road');for(const id of ['debris-step-1','debris-step-2','debris-step-3','lower-lookout']){const t=b.terrain.find(t=>t.id===id),x=t.x+t.w*.35,y=C.topAt(t,x)+t.h*.5,foot=C.topAt(floor,x);c.save();c.strokeStyle='#302b24';c.lineWidth=22;c.lineCap='butt';c.beginPath();c.moveTo(x,y);c.lineTo(x-85,foot+8);c.stroke();c.strokeStyle='#7c6c50';c.lineWidth=7;c.beginPath();c.moveTo(x+4,y+5);c.lineTo(x-78,foot);c.stroke();c.restore();}}
const oldBackground=S.background;S.background=function(c,w,h,b){if(!active(b)||!background(c,w,h,b,this))return oldBackground.call(this,c,w,h,b);};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(!active(this.battle)||!terrain(c,t,this.battle))return oldTerrain.call(this,c,t);};
const oldLandmark=S.landmark;S.landmark=function(c,l){if(!ready(this.battle))return oldLandmark.call(this,c,l);if(l.id==='a1-scene-6-exit-grove-center')paintTree(c,l,this.battle);};
const oldLayer=S._landmarkLayer;S._landmarkLayer=function(c,ls,layer){if(layer==='structural-back'&&ready(this.battle)){bridge(c,this.battle);wreckSupports(c,this.battle);}return oldLayer.call(this,c,ls,layer);};
const oldVisible=S._landmarkVisible;S._landmarkVisible=function(l,v,pad=40){if(ready(this.battle)&&l.id==='a1-scene-6-exit-grove-center'){const q=tree(l,this.battle);return q.left-pad<=v.right&&q.right+pad>=v.left&&q.top-pad<=v.bottom&&q.bottom+pad>=v.top;}return oldVisible.call(this,l,v,pad);};
const oldZones=S.surfaceZones;S.surfaceZones=function(c,b){return oldZones.call(this,c,ready(b)?{...b,honroSurfaceZones:(b.honroSurfaceZones||[]).filter(z=>/water|current/.test(z.kind))}:b);};
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':stage6-bridge4:'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage6-location',active,naturalEdges:true,cachedWorld:true});G.HonroStage6LocationArt={active,ready,cacheStats:()=>({pictures:pictures.size,paths:paths.size,farCanvases:far?1:0,filterPasses})};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage7-location-art.js
(()=>{
'use strict';
(function(G){'use strict';
const S=G.HonroScene.prototype,C=G.HONRO_CORE,E=G.HonroEnvironment,A=G.HonroEnvironmentArt,P=G.HonroPaintedPilots,M=G.HonroStage1LocationArt;
const active=b=>b?.honroStage===7&&!b.honroCustom&&b.honroMap?.stage7Village?.version===1,ids=['forestFar','villageTree7','villageHome7','ferryWorkbay','ferryShrine','forestRock','forestSoil'];
const ready=b=>{if(!active(b))return false;P.request(ids);return ids.every(P.ready);};const pictures=new Map(),patterns=new WeakMap();let far,barkCard,filterPasses=0;
function picture(id){if(pictures.has(id))return pictures.get(id);const im=P.images[id],cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const c=cv.getContext('2d');c.filter=id==='villageTree7'?'saturate(.61) contrast(.9) brightness(.88)':'saturate(.69) contrast(.95) brightness(.9)';filterPasses++;c.drawImage(im,0,0);c.filter='none';pictures.set(id,cv);return cv;}
function background(c,w,h,b,scene){if(!ready(b))return false;if(!far){far=document.createElement('canvas');far.width=2304;far.height=1024;const cc=far.getContext('2d');cc.fillStyle='#2a3e43';cc.fillRect(0,0,2304,1024);cc.filter='saturate(.42) contrast(.72) brightness(.85) blur(.65px)';filterPasses++;cc.drawImage(P.images.forestFar,0,0,2304,1024);cc.filter='none';cc.fillStyle='#31485024';cc.fillRect(0,0,2304,1024);const g=cc.createLinearGradient(0,550,0,1024);g.addColorStop(0,'#2a3e4300');g.addColorStop(1,'#2a3e43');cc.fillStyle=g;cc.fillRect(0,550,2304,474);}const raw=G.HonroVisualStyle.raw(c),q=E.act1BackdropFrame(scene,w,h,b,far.width,far.height),paint=cc=>{cc.fillStyle='#2a3e43';cc.fillRect(0,0,w,h);cc.drawImage(far,q.x,q.y,q.w,q.h);};if(!scene._screenRaster(raw,['stage7',P.appearanceKey(),w,h,scene.x,scene.y,scene.scale].join(':'),w,h,paint,'_screenBackgroundCache',false))paint(raw);scene.environmentStats={groups:1,visibleAssets:1,cachedPaths:0,animatedPrimitives:0};return true;}
// One world geology field for both overlapping solids: clipping changes at the
// entry wall, but card positions and deep shading never restart at x420.
function geologyTop(b,x){return Math.min(...G.HonroTerrainDomain.render(b).filter(t=>['root-floor','village-hill'].includes(t.id)&&M.prepare(t).edges.some(([a,z])=>x>=a.x&&x<=z.x)).map(t=>M.prepare(t).top(x)));}
function depthTop(x){const a=[[-1200,4650],[0,4600],[750,4320],[1540,3820],[2100,3500],[2760,3050],[3300,2670],[9600,2600]];let i=0;while(i<a.length-2&&x>a[i+1][0])i++;const p=a[i],q=a[i+1];return p[1]+(q[1]-p[1])*(x-p[0])/(q[0]-p[0]);}
function ground(c,t,b){const q=M.prepare(t),m=c.getTransform(),left=Math.max(t.x,-m.e/m.a-4),right=Math.min(t.x+t.w,(c.canvas.width-m.e)/m.a+4),bottom=Math.min(t.y+t.h,(c.canvas.height-m.f)/m.d+4);c.save();c.clip(q.path);c.fillStyle='#343a32';c.fill(q.path);const cards=M.rockCards();for(const [i,x,w,h]of [[0,220,1050,600],[1,1120,1100,850],[2,2100,780,720],[0,2520,1050,1000],[1,3290,1100,620]])if(x+w>left&&x<right)c.drawImage(cards[i],x,geologyTop(b,x+w*.8)+25,w,h);
 for(let x=Math.floor(left/24)*24;x<right;x+=24){const a=Math.max(t.x,x),z=Math.min(t.x+t.w,x+24);if(z<=a)continue;const y0=geologyTop(b,a),y1=geologyTop(b,z),depth=a<1100?150:a<2400?75:105;if(Math.abs(y1-y0)<(z-a)*2){c.save();c.transform(1,(y1-y0)/(z-a),0,1,a,y0);const soil=M.soilPattern(c);soil.setTransform(new DOMMatrix([.53,0,0,depth/320,-a,0]));c.fillStyle=soil;c.globalAlpha=.9;c.fillRect(0,0,z-a+.3,depth);c.restore();}
  const d0=depthTop(a),d1=depthTop(z);c.save();c.transform(1,(d1-d0)/(z-a),0,1,a,d0);const g=c.createLinearGradient(0,70,0,850);g.addColorStop(0,'#24322c00');g.addColorStop(.4,'#20312d70');g.addColorStop(1,'#1a2d32');c.fillStyle=g;c.fillRect(0,70,z-a+.3,Math.max(850,bottom-Math.min(d0,d1)+32));c.restore();}c.restore();return true;}
function bark(c){if(!barkCard){const im=picture('villageTree7'),cv=barkCard=document.createElement('canvas');cv.width=384;cv.height=96;const cc=cv.getContext('2d');cc.translate(0,96);cc.rotate(-Math.PI/2);cc.drawImage(im,im.width*.43,im.height*.62,im.width*.16,im.height*.17,0,0,96,384);}let p=patterns.get(c);if(!p){p=c.createPattern(barkCard,'repeat');patterns.set(c,p);}return p;}
function root(c,t){const q=M.prepare(t);c.save();c.clip(q.path);c.fillStyle='#4a4336';c.fill(q.path);const p=bark(c);p.setTransform(new DOMMatrix([1,0,0,.55,-t.x,-t.y]));c.fillStyle=p;c.fill(q.path);const g=c.createLinearGradient(0,t.y,0,t.y+t.h);g.addColorStop(0,'#9d8e6f20');g.addColorStop(.55,'#242a2390');g.addColorStop(1,'#1b262aca');c.fillStyle=g;c.fill(q.path);c.restore();return true;}
function terrain(c,t,b){if(!ready(b)||t.broken)return false;if(t.id==='root-floor'||t.id==='village-hill')return ground(c,t,b);if(t.id.startsWith('house7-'))return true;if(t.oneWay)return root(c,t);return false;}
// Short rear work decks have posts planted on the real hill and diagonal
// braces. These explain the one-way deck; they introduce no blocking walls.
function timber(c,ps){const path=new Path2D();ps.forEach(([x,y],i)=>i?path.lineTo(x,y):path.moveTo(x,y));path.closePath();c.save();c.clip(path);c.fillStyle='#4a4336';c.fill(path);const p=bark(c);p.setTransform(new DOMMatrix([.65,0,0,.8,0,0]));c.fillStyle=p;c.fill(path);c.fillStyle='#222b2940';c.fill(path);c.restore();}
function workSupports(c,b){const v=b.honroMap.stage7Village,hill=b.terrain.find(t=>t.id==='village-hill');for(const w of v.workPlatforms||[]){const deck=b.terrain.find(t=>t.id===w.terrainId),q=M.prepare(deck),floor=M.prepare(hill),[a,z]=w.posts;for(const x of w.posts){const y=q.top(x)+16,foot=floor.top(x)+6;timber(c,[[x-8,y],[x+9,y],[x+12,foot],[x-10,foot]]);}const x=deck.x+15,y=q.top(x)+24,foot=floor.top(a)-16;timber(c,[[x,y],[x+15,y-2],[a+7,foot],[a-6,foot+5]]);const y2=q.top(a)+25,foot2=floor.top(z)-22;timber(c,[[a,y2],[a+15,y2],[z+8,foot2],[z-7,foot2+8]]);}}
function scenery(c,b,layer){const v=b.honroMap.stage7Village;if(layer==='structural-back'){const t=v.tree;c.drawImage(picture(t.image),t.x,t.y,t.width,t.height);}if(layer==='prop'){workSupports(c,b);for(const h of v.houses)c.drawImage(picture(h.image),h.x,h.y,h.width,h.height);}}
const oldBackground=S.background;S.background=function(c,w,h,b){if(!active(b)||!background(c,w,h,b,this))return oldBackground.call(this,c,w,h,b);};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(!active(this.battle)||!terrain(c,t,this.battle))return oldTerrain.call(this,c,t);};
const oldLandmark=S.landmark;S.landmark=function(c,l){if(!ready(this.battle))return oldLandmark.call(this,c,l);};
const oldLayer=S._landmarkLayer;S._landmarkLayer=function(c,ls,layer){if(ready(this.battle))scenery(c,this.battle,layer);return oldLayer.call(this,c,ls,layer);};
const oldMarker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(ready(scene.battle)&&['resident','hauntHabitat'].includes(m.type))return true;return oldMarker.call(this,scene,m);};
const oldZones=S.surfaceZones;S.surfaceZones=function(c,b){return oldZones.call(this,c,ready(b)?{...b,honroSurfaceZones:[]}:b);};
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':stage7-village-finish2:'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage7-location',active,naturalEdges:true,cachedWorld:true});G.HonroStage7LocationArt={active,ready,cacheStats:()=>({pictures:pictures.size,farCanvases:far?1:0,barkCanvases:barkCard?1:0,filterPasses})};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage8-location-art.js
(()=>{
'use strict';
(function(G){'use strict';
const S=G.HonroScene.prototype,C=G.HONRO_CORE,E=G.HonroEnvironment,P=G.HonroPaintedPilots,M=G.HonroStage1LocationArt;
const active=b=>b?.honroStage===8&&!b.honroCustom&&b.honroMap?.stage8LocationPaint?.revision===1,ids=['forestFar','forestRock','forestSoil','villageTree7','bierStore8','bierShelter8'];
const ready=b=>{if(!active(b))return false;P.request(ids);return ids.every(P.ready);},pictures=new Map(),patterns=new WeakMap(),depthMasks=new WeakMap();let far,woodCard,rootCard,postCard,cavernCard,filterPasses=0,maskBuilds=0;
function picture(id){if(pictures.has(id))return pictures.get(id);const im=P.images[id],cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const c=cv.getContext('2d');c.filter=id==='villageTree7'?'saturate(.55) contrast(.88) brightness(.84)':'saturate(.65) contrast(.92) brightness(.87)';filterPasses++;c.drawImage(im,0,0);c.filter='none';pictures.set(id,cv);return cv;}
function background(c,w,h,b,scene){if(!ready(b))return false;if(!far){far=document.createElement('canvas');far.width=2304;far.height=1024;const cc=far.getContext('2d');cc.fillStyle='#293d46';cc.fillRect(0,0,2304,1024);cc.filter='saturate(.36) contrast(.65) brightness(.78) blur(.7px)';filterPasses++;cc.drawImage(P.images.forestFar,0,0,2304,1024);cc.filter='none';cc.fillStyle='#2d424b38';cc.fillRect(0,0,2304,1024);const g=cc.createLinearGradient(0,480,0,1024);g.addColorStop(0,'#293d4600');g.addColorStop(1,'#293d46');cc.fillStyle=g;cc.fillRect(0,480,2304,544);}const raw=G.HonroVisualStyle.raw(c),q=E.act1BackdropFrame(scene,w,h,b,2304,1024),paint=cc=>{cc.fillStyle='#293d46';cc.fillRect(0,0,w,h);cc.drawImage(far,q.x,q.y,q.w,q.h);};if(!scene._screenRaster(raw,['stage8-painted',P.appearanceKey(),w,h,scene.x,scene.y,scene.scale].join(':'),w,h,paint,'_screenBackgroundCache',false))paint(raw);scene.environmentStats={groups:1,visibleAssets:1,cachedPaths:0,animatedPrimitives:0};return true;}
function grain(c,root=false){if(!woodCard){woodCard=document.createElement('canvas');woodCard.width=512;woodCard.height=128;const cc=woodCard.getContext('2d'),im=picture('bierStore8');cc.translate(0,128);cc.rotate(-Math.PI/2);cc.drawImage(im,im.width*.08,im.height*.51,im.width*.18,im.height*.29,0,0,128,512);}if(root&&!rootCard){rootCard=document.createElement('canvas');rootCard.width=384;rootCard.height=128;const cc=rootCard.getContext('2d'),im=picture('villageTree7');cc.translate(0,128);cc.rotate(-Math.PI/2);cc.drawImage(im,im.width*.42,im.height*.65,im.width*.18,im.height*.19,0,0,128,384);}let ps=patterns.get(c);if(!ps){ps={};patterns.set(c,ps);}const key=root?'root':'wood';return ps[key]||(ps[key]=c.createPattern(root?rootCard:woodCard,'repeat'));}
function timber(c,t,b){const q=M.prepare(t),root=t.id==='s8-branch';c.save();c.clip(q.path);c.fillStyle='#514b39';c.fill(q.path);if(root){const a=b.honroMap.stage8LocationPaint.tree;c.fillStyle='#2c352e';c.fill(q.path);c.drawImage(picture(a.image),a.x,a.y,a.width,a.height);const shade=c.createLinearGradient(0,t.y,0,t.y+t.h);shade.addColorStop(0,'#22332a00');shade.addColorStop(1,'#1d2c3170');c.fillStyle=shade;c.fill(q.path);c.restore();return true;}const p=grain(c,root);p.setTransform(new DOMMatrix([.8,0,0,.55,-t.x,-t.y]));c.fillStyle=p;c.fill(q.path);const g=c.createLinearGradient(0,t.y,0,t.y+t.h);g.addColorStop(0,'#b09a6815');g.addColorStop(.6,'#27302c60');g.addColorStop(1,'#19282bde');c.fillStyle=g;c.fill(q.path);if(!root){c.strokeStyle='#151f2380';c.lineWidth=2.5;for(let x=Math.ceil(t.x/92)*92;x<t.x+t.w;x+=92){const y=q.top(x);c.beginPath();c.moveTo(x,y+3);c.lineTo(x-3,y+Math.min(32,t.h));c.stroke();}}c.restore();return true;}
// Prepare a single continuous depth field per immutable terrain. Pixel alpha
// is written once, so adjacent slanted strips cannot leave repeated seams.
function depthMask(t,q){let old=depthMasks.get(t);if(old?.source===t.vertices)return old.card;const cv=document.createElement('canvas');cv.width=Math.min(1024,Math.max(48,Math.ceil(t.w/3)));cv.height=Math.min(384,Math.max(48,Math.ceil(t.h/3)));const cc=cv.getContext('2d'),im=cc.createImageData(cv.width,cv.height),ps=C.poly(t);for(let x=0;x<cv.width;x++){const wx=t.x+(x+.5)*t.w/cv.width,top=q.top(wx),ys=[];for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];if((a.x<=wx&&z.x>wx)||(z.x<=wx&&a.x>wx))ys.push(a.y+(z.y-a.y)*(wx-a.x)/(z.x-a.x));}const low=Math.max(top+130,...ys),span=Math.max(130,Math.min(780,(low-top)*.94));for(let y=0;y<cv.height;y++){const distance=t.y+(y+.5)*t.h/cv.height-top,k=Math.max(0,Math.min(1,(distance-65)/(span-65))),i=(y*cv.width+x)*4;im.data[i]=29;im.data[i+1]=48;im.data[i+2]=56;im.data[i+3]=Math.round(k*k*(3-2*k)*245);}}cc.putImageData(im,0,0);maskBuilds++;depthMasks.set(t,{source:t.vertices,card:cv});return cv;}
function earthPattern(c){let ps=patterns.get(c);if(!ps){ps={};patterns.set(c,ps);}return ps.earth||(ps.earth=c.createPattern(P.images.forestSoil,'repeat'));}
const seed={ 's8-west-root':2,'s8-west-shoulder':1,'s8-east-shoulder':0,'s8-court':2,'s8-west-court':1,'s8-east-plinth':0 };
function rock(c,t){const q=M.prepare(t),m=c.getTransform(),left=Math.max(t.x,-m.e/m.a-4),right=Math.min(t.x+t.w,(c.canvas.width-m.e)/m.a+4),bottom=Math.min(t.y+t.h,(c.canvas.height-m.f)/m.d+4),small=t.w<220&&t.h<250,cards=M.rockCards();c.save();c.clip(q.path);c.fillStyle='#293a34';c.fill(q.path);
 if(small){c.drawImage(cards[seed[t.id]||0],t.x-35,t.y-10,Math.max(240,t.w+60),Math.max(190,t.h+30));const g=c.createLinearGradient(t.x,t.y,t.x+t.w,t.y+t.h);g.addColorStop(0,'#b5b6a326');g.addColorStop(.4,'#202e2b00');g.addColorStop(1,'#142329b0');c.fillStyle=g;c.fill(q.path);}else{
 const fixed={
  's8-west-root':[[0,40,4010,600,480]],
  's8-west-shoulder':[[1,3000,3020,1200,900],[2,3850,2590,1250,1080],[0,4270,3390,1000,1150]],
  's8-east-shoulder':[[0,5300,2600,1000,1050],[1,5390,3380,850,1000]],
  's8-court':[[2,5700,4200,1000,500],[0,6350,3510,1100,850],[1,7070,2980,1000,760]],
  's8-west-court':[[1,3990,4255,1050,460]],'s8-east-plinth':[[0,5400,4250,400,420]]
 };
 const groups=t.id==='s8-ground'?[[0,-1600,1750,700],[2,0,1600,650],[1,1400,1600,720],[0,2700,1500,750],[2,3900,1700,640],[1,5400,1500,710],[0,6800,1500,850],[2,8150,1700,640],[1,9800,1800,670]]:[];
 for(const [i,x,y,w,h]of fixed[t.id]||[])if(x+w>left&&x<right)c.drawImage(cards[i],x,y,w,h);
 for(const [i,x,w,h]of groups)if(x+w>left&&x<right)c.drawImage(cards[i],x,q.top(Math.max(t.x,Math.min(t.x+t.w,x+w*.78)))+24,w,h);
 const band=new Path2D(),depth=t.id==='s8-ground'?110:t.id==='s8-court'?48:64;for(const [a,z]of q.edges){if(Math.abs(z.y-a.y)>(z.x-a.x)*1.35)continue;band.moveTo(a.x,a.y);band.lineTo(z.x,z.y);band.lineTo(z.x,z.y+depth);band.lineTo(a.x,a.y+depth);band.closePath();}const earth=earthPattern(c);earth.setTransform(new DOMMatrix([.45,0,0,.45,0,0]));c.globalAlpha=.67;c.fillStyle=earth;c.fill(band);c.globalAlpha=1;const shade=depthMask(t,q);c.drawImage(shade,t.x,t.y,t.w,t.h);}

 c.restore();return true;}
function path(ps){const p=new Path2D();ps.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;}
// A recessed hill interior behind the unchanged front paths. Three broad,
// curved painted planes carry no outline, walking rim, or collision surface.
// The bounded raster is prepared once, including its quiet material treatment.
function cavern(){if(cavernCard)return cavernCard;cavernCard=document.createElement('canvas');cavernCard.width=1536;cavernCard.height=960;const c=cavernCard.getContext('2d');c.scale(1536/4500,960/2600);c.translate(-2550,-2500);
 const shell=new Path2D('M2550 3890C2960 3880 3130 3540 3570 3280C4030 3020 4460 2730 4940 2680Q5280 2520 5540 2690C5910 2940 6160 3430 6520 3710Q6760 3950 7050 4080L7050 5100L2550 5100Z');c.clip(shell);
 const base=c.createLinearGradient(3200,2800,5100,5050);base.addColorStop(0,'#2d4143');base.addColorStop(.45,'#283c40');base.addColorStop(1,'#1c3037');c.fillStyle=base;c.fill(shell);
 const cards=M.rockCards(),planes=[{d:'M2550 3860C3260 3630 3480 3010 4290 2850Q4780 2660 5100 2670C4590 3080 4530 3370 4130 3690Q3750 4100 3620 5100L2550 5100Z',i:1,x:2580,y:2790,w:2600,h:2350},{d:'M4290 5100Q4150 4170 4510 3650C4800 3270 5100 3110 5520 2680Q5880 2990 6050 3340C5540 3450 5350 3850 5410 4410L5660 5100Z',i:0,x:4010,y:2780,w:2270,h:2390},{d:'M5660 5100Q5420 4220 5800 3640Q6150 3460 6520 3710L7050 4080L7050 5100Z',i:2,x:5350,y:3340,w:1850,h:1830}];
 // Shared quiet texture crosses the plane boundaries; no hard texture cutouts.
 c.globalAlpha=.22;for(const r of planes)c.drawImage(cards[r.i],r.x-180,r.y-250,r.w+600,r.h+350);c.globalAlpha=1;c.fillStyle='#243a4055';c.fill(shell);
 for(const r of planes){const p=new Path2D(r.d),g=c.createLinearGradient(r.x,r.y,r.x+r.w,r.y+r.h);g.addColorStop(0,'#3b515b10');g.addColorStop(.55,'#20363b00');g.addColorStop(1,'#102b3525');c.fillStyle=g;c.fill(p);}
 const depth=c.createLinearGradient(0,3400,0,5100);depth.addColorStop(0,'#1b303800');depth.addColorStop(1,'#1b3038b0');c.fillStyle=depth;c.fill(shell);return cavernCard;}
function rear(c,b){c.drawImage(cavern(),2550,2500,4500,2600);const floor=M.prepare(G.HonroTerrainDomain.render(b).find(t=>t.id==='s8-ground')),regions=[
 {a:900,z:1750,d:'M900 4080C1090 3830 1230 3660 1410 3660Q1580 3690 1750 3800',y:3630},
 {a:5790,z:8330,d:'M5790 4278L6200 4278Q6430 4180 6660 3978T7200 3590Q7590 3360 7800 3180L8330 3140',y:3130}
 ];const cards=M.rockCards();for(const [i,r]of regions.entries()){const p=new Path2D(r.d),xs=[r.a,...floor.edges.flatMap(([a,z])=>[a.x,z.x]).filter(x=>x>r.a&&x<r.z),r.z].sort((a,z)=>z-a);for(const x of xs)p.lineTo(x,floor.top(x)+35);p.closePath();c.save();c.clip(p);c.fillStyle='#1d3038';c.fill(p);c.globalAlpha=.52;for(let x=r.a-80;x<r.z;x+=1020)c.drawImage(cards[i%3],x,r.y,1280,Math.max(650,floor.top((r.a+r.z)/2)-r.y+120));c.globalAlpha=1;c.fillStyle='#1c303638';c.fill(p);c.restore();}}
// Only a rear socket joins the reflector's lower corner to the existing beam.
// Its attack/reflection geometry and the traversable beam are untouched.
function reflectorContact(c,b){const stone=b.terrain.find(t=>t.id==='s8-store-reflector'),deck=b.terrain.find(t=>t.id==='s8-west-walk');if(!stone||!deck)return;const x=stone.x+stone.w-7,y=M.prepare(deck).top(x),p=path([[x-29,y-51],[x+3,y-31],[x+9,y+8],[x-34,y+5]]);c.save();c.clip(p);c.fillStyle='#263932';c.fill(p);c.globalAlpha=.55;c.drawImage(M.rockCards()[1],x-95,y-91,180,160);c.restore();}
function postTexture(){if(!postCard){postCard=document.createElement('canvas');postCard.width=64;postCard.height=384;const cc=postCard.getContext('2d'),im=picture('bierStore8');cc.drawImage(im,im.width*.302,im.height*.43,im.width*.025,im.height*.43,0,0,64,384);}return postCard;}
function supports(c,b){const floor=M.prepare(b.terrain.find(t=>t.id==='s8-ground')),places={'s8-west-walk':[.46,.89],'s8-drain-return':[.82],'s8-central-step':[.75],'s8-branch-rise':[.18],'s8-branch-return':[.35,.82],'s8-east-hatch':[.18,.82]},im=postTexture();for(const [id,ks]of Object.entries(places)){const t=b.terrain.find(t=>t.id===id),q=M.prepare(t),posts=[];for(const k of ks){const x=t.x+t.w*k,y=q.top(x)+12,foot=floor.top(x)+3;if(foot-y>25){posts.push({x,y,foot});const width=foot-y>500?42:32,p=path([[x-width*.43,y],[x+width*.43,y],[x+width*.52,foot],[x-width*.5,foot]]);c.save();c.clip(p);c.globalAlpha=.77;c.drawImage(im,x-width*.55,y,width*1.1,foot-y);c.restore();}}if(posts.length===2&&posts.every(p=>p.foot-p.y>250)){const [a,z]=posts,len=Math.hypot(z.x-a.x,z.foot-22-a.y-18);c.save();c.globalAlpha=.64;c.translate(a.x,a.y+18);c.rotate(Math.atan2(z.foot-22-a.y-18,z.x-a.x)-Math.PI/2);c.drawImage(im,-11,0,22,len);c.restore();}}}
// A small rear earth bed closes the cutout's transparent foundation fringe.
// The image, visible roof and every collision/route coordinate stay unchanged.
function storeContact(c,h){const p=path([[h.x-12,h.footY-23],[h.x+h.width*.38,h.footY-27],[h.x+h.width-25,h.footY-25],[h.x+h.width+8,h.footY+24],[h.x-12,h.footY+24]]);c.save();c.clip(p);c.fillStyle='#403e30';c.fill(p);const earth=earthPattern(c);earth.setTransform(new DOMMatrix([.45,0,0,.45,0,0]));c.fillStyle=earth;c.globalAlpha=.75;c.fill(p);c.restore();}
function scenery(c,b,layer){const v=b.honroMap.stage8LocationPaint;if(layer==='structural-back'){rear(c,b);reflectorContact(c,b);const t=v.tree;c.drawImage(picture(t.image),t.x,t.y,t.width,t.height);for(const h of v.structures.filter(h=>h.layer===layer)){if(h.image==='bierStore8')storeContact(c,h);c.drawImage(picture(h.image),h.x,h.y,h.width,h.height);}}if(layer==='prop'){supports(c,b);c.save();const p=path([[7700,2970],[8340,2970],[8390,3000],[7800,3000]]);c.clip(p);c.fillStyle=grain(c);c.fill(p);c.fillStyle='#23332d35';c.fill(p);c.restore();for(const h of v.structures.filter(h=>h.layer===layer))c.drawImage(picture(h.image),h.x,h.y,h.width,h.height);}}
function terrain(c,t,b){if(!ready(b)||t.broken||!t.id?.startsWith('s8-'))return false;if(['s8-store-roof','s8-shelter-roof'].includes(t.id))return true;return t.mat==='wood'?timber(c,t,b):rock(c,t);}
const oldBackground=S.background;S.background=function(c,w,h,b){if(!active(b)||!background(c,w,h,b,this))return oldBackground.call(this,c,w,h,b);};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(!active(this.battle)||!terrain(c,t,this.battle))return oldTerrain.call(this,c,t);};
const oldLandmark=S.landmark;S.landmark=function(c,l){if(!ready(this.battle))return oldLandmark.call(this,c,l);};
const oldLayer=S._landmarkLayer;S._landmarkLayer=function(c,ls,layer){if(ready(this.battle))scenery(c,this.battle,layer);return oldLayer.call(this,c,ls,layer);};
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':stage8-location-finish4:'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage8-location',active,naturalEdges:true,cachedWorld:true});G.HonroStage8LocationArt={active,ready,cacheStats:()=>({pictures:pictures.size,farCanvases:far?1:0,woodCanvases:woodCard?1:0,cavernCanvases:cavernCard?1:0,rootCanvases:rootCard?1:0,filterPasses,depthMaskBuilds:maskBuilds})};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage9-location-art.js
(()=>{
'use strict';
(function(G){'use strict';
const S=G.HonroScene.prototype,C=G.HONRO_CORE,E=G.HonroEnvironment,P=G.HonroPaintedPilots,M=G.HonroStage1LocationArt;
const active=b=>b?.honroStage===9&&!b.honroCustom&&b.honroMap?.stage9LocationPaint?.revision===1,ids=['forestFar','forestRock','forestSoil','villageTree7','ritualCorridor9','ritualGate9','ritualRoots9'];
const ready=b=>{if(!active(b))return false;P.request(ids);return ids.every(P.ready);},pictures=new Map(),patterns=new WeakMap();let far,beam,rootFork,filters=0;
function picture(id){if(pictures.has(id))return pictures.get(id);const im=P.images[id],cv=document.createElement('canvas');cv.width=(im.naturalWidth||im.width);cv.height=(im.naturalHeight||im.height);const c=cv.getContext('2d');c.filter=id==='villageTree7'?'saturate(.52) contrast(.84) brightness(.78)':'saturate(.66) contrast(.92) brightness(.86)';filters++;c.drawImage(im,0,0);c.filter='none';pictures.set(id,cv);return cv;}
function background(c,w,h,b,scene){if(!ready(b))return false;if(!far){far=document.createElement('canvas');far.width=2304;far.height=1024;const cc=far.getContext('2d');cc.fillStyle='#293d46';cc.fillRect(0,0,2304,1024);cc.filter='saturate(.34) contrast(.64) brightness(.77) blur(.65px)';filters++;cc.drawImage(P.images.forestFar,0,0,2304,1024);cc.filter='none';cc.fillStyle='#2d424b35';cc.fillRect(0,0,2304,1024);const g=cc.createLinearGradient(0,480,0,1024);g.addColorStop(0,'#293d4600');g.addColorStop(1,'#293d46');cc.fillStyle=g;cc.fillRect(0,480,2304,544);}const raw=G.HonroVisualStyle.raw(c),q=E.act1BackdropFrame(scene,w,h,b,2304,1024),paint=cc=>{cc.fillStyle='#293d46';cc.fillRect(0,0,w,h);cc.drawImage(far,q.x,q.y,q.w,q.h);};if(!scene._screenRaster(raw,['stage9',P.appearanceKey(),w,h,scene.x,scene.y,scene.scale].join(':'),w,h,paint,'_screenBackgroundCache',false))paint(raw);scene.environmentStats={groups:1,visibleAssets:1,cachedPaths:0,animatedPrimitives:0};return true;}
function path(ps){const p=new Path2D();ps.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;}
function soil(c){let p=patterns.get(c);if(!p){p={};patterns.set(c,p);}return p.soil||(p.soil=c.createPattern(P.images.forestSoil,'repeat'));}
function band(q,a,z,depth){const ps=[[a,q.top(a)]];for(const [p,r]of q.edges){if(r.x>a&&p.x<z){if(p.x>a)ps.push([p.x,p.y]);if(r.x<z)ps.push([r.x,r.y]);}}ps.push([z,q.top(z)]);return path([...ps,...ps.toReversed().map(([x,y])=>[x,y+depth])]);}
function floor(c,t,b){const q=M.prepare(t),m=c.getTransform(),left=Math.max(t.x,-m.e/m.a-5),right=Math.min(t.x+t.w,(c.canvas.width-m.e)/m.a+5),v=b.honroMap.stage9LocationPaint;c.save();c.clip(q.path);c.fillStyle='#303b34';c.fill(q.path);const earth=soil(c);earth.setTransform(new DOMMatrix([.57,0,0,.52,0,0]));c.fillStyle=earth;c.globalAlpha=.82;c.fill(band(q,left,right,220));c.globalAlpha=1;
 // Large distinct gravel/earth/stone areas follow the real top, leaving the
 // central court low and readable instead of tiling a rock cliff over it.
 const cards=M.rockCards();for(const [i,x,w]of [[0,-700,1400],[2,400,1200],[1,1480,1150],[0,2540,1300],[2,3620,1500]]){if(x+w<left||x>right)continue;c.globalAlpha=.58;c.drawImage(cards[i],x,q.top(Math.max(t.x,Math.min(t.x+t.w,x+w*.5)))+90,w,640);}c.globalAlpha=1;
 for(const [i,[a,z]]of v.materials.stonePads.entries()){c.save();c.clip(band(q,a,z,43));c.drawImage(cards[i%3],a-50,q.top(a)-60,z-a+110,225);c.fillStyle='#887f5c20';c.fillRect(a,q.top(a)-5,z-a,80);c.restore();}
 for(const [a,z]of v.materials.grassBanks){c.save();c.clip(band(q,a,z,48));c.fillStyle='#3a503343';c.fillRect(a,q.top(a)-10,z-a,130);c.restore();}
 const depth=c.createLinearGradient(0,2530,0,3300);depth.addColorStop(0,'#1c303600');depth.addColorStop(.5,'#1b2d34a8');depth.addColorStop(1,'#1b2d34');c.fillStyle=depth;c.fill(q.path);c.restore();return true;}
// The root fork is one painted object, with knots, overlapping limbs and a
// root-wrapped boulder already in the source. Project that whole silhouette
// once onto the unchanged joined upper contour. Source columns are consumed
// exactly once: no repeated bark tiles, segment cards or flat glue polygons.
function roots(b){const ts=b.terrain.filter(t=>['tactical-east-root-ascent','tactical-east-stone-shoulder','tactical-east-root-return'].includes(t.id)),key=ts.map(t=>t.id+':'+JSON.stringify(t.vertices)).join('|')+P.appearanceKey();if(rootFork?.key===key)return rootFork;
 const im=picture('ritualRoots9'),w=im.width,h=im.height,source=im.getContext('2d').getImageData(0,0,w,h).data,q=ts.map(t=>({t,q:M.prepare(t)})),x0=2000,y0=1920,width=1510,height=690,cv=document.createElement('canvas');cv.width=w;cv.height=700;const cc=cv.getContext('2d');
 for(let x=0;x<w;x++){let sy=0;while(sy<h&&source[(sy*w+x)*4+3]<40)sy++;if(sy===h)continue;const wx=x0+x*width/(w-1),tops=q.filter(({t})=>wx>=t.x-.01&&wx<=t.x+t.w+.01).map(({q})=>q.top(wx));if(!tops.length)continue;const dy=(Math.min(...tops)-y0)*cv.height/height,dh=(h-sy)*.62*cv.height/height;cc.drawImage(im,x,sy,1,h-sy,x,dy,1,dh);}
 rootFork={key,canvas:cv,x:x0,y:y0,width,height};return rootFork;}
function grain(c){if(!beam){beam=document.createElement('canvas');beam.width=384;beam.height=128;const cc=beam.getContext('2d'),im=picture('ritualCorridor9');cc.drawImage(im,im.width*.055,im.height*.36,im.width*.87,im.height*.08,0,0,384,128);}let p=patterns.get(c);if(!p){p={};patterns.set(c,p);}return p.beam||(p.beam=c.createPattern(beam,'repeat'));}
function timber(c,t){const q=M.prepare(t);c.save();c.clip(q.path);c.fillStyle='#4a4638';c.fill(q.path);const p=grain(c);p.setTransform(new DOMMatrix([.75,0,0,.6,0,0]));c.fillStyle=p;c.fill(q.path);const g=c.createLinearGradient(0,t.y,0,t.y+t.h);g.addColorStop(0,'#80775918');g.addColorStop(1,'#1d2c32c0');c.fillStyle=g;c.fill(q.path);c.restore();return true;}
function stone(c,t){const q=M.prepare(t);c.save();c.clip(q.path);c.fillStyle='#334039';c.fill(q.path);c.drawImage(M.rockCards()[1],t.x-60,t.y-45,t.w+140,t.h+140);const g=c.createLinearGradient(0,t.y,0,t.y+t.h);g.addColorStop(0,'#6c735c16');g.addColorStop(1,'#1c3035d0');c.fillStyle=g;c.fill(q.path);c.restore();return true;}
function well(c,p){c.save();c.translate(p.x,p.y);c.fillStyle='#14272ac0';c.beginPath();c.ellipse(0,0,79,19,0,0,Math.PI*2);c.fill();const ring=new Path2D();ring.ellipse(0,-15,65,27,0,0,Math.PI*2);ring.ellipse(0,-17,43,14,0,0,Math.PI*2);c.save();c.clip(ring,'evenodd');c.drawImage(M.rockCards()[2],-105,-75,220,145);c.fillStyle='#887f5a28';c.fill(ring,'evenodd');c.restore();c.fillStyle='#142529';c.beginPath();c.ellipse(0,-17,42,13,0,0,Math.PI*2);c.fill();c.restore();}
function scenery(c,b,layer){const v=b.honroMap.stage9LocationPaint;if(layer==='structural-back'){const t=v.tree;c.drawImage(picture(t.image),t.x,t.y,t.width,t.height);for(const h of [v.corridor,v.gate])c.drawImage(picture(h.image),h.x,h.y,h.width,h.height);const r=roots(b);c.drawImage(r.canvas,r.x,r.y,r.width,r.height);}if(layer==='prop')well(c,v.well);}
function terrain(c,t,b){if(!ready(b)||t.broken)return false;if(t.id==='yard-floor')return floor(c,t,b);if(['tactical-west-collapsed-gallery','stage9-gate-roof','tactical-east-root-ascent','tactical-east-root-return','tactical-east-stone-shoulder'].includes(t.id))return true;if(t.oneWay)return timber(c,t);return stone(c,t);}
const oldBackground=S.background;S.background=function(c,w,h,b){if(!active(b)||!background(c,w,h,b,this))return oldBackground.call(this,c,w,h,b);};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(!active(this.battle)||!terrain(c,t,this.battle))return oldTerrain.call(this,c,t);};
const oldLayer=S._landmarkLayer;S._landmarkLayer=function(c,ls,layer){if(ready(this.battle)){scenery(c,this.battle,layer);return;}return oldLayer.call(this,c,ls,layer);};
const oldMarker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(ready(scene.battle)&&m.type==='hauntHabitat')return true;return oldMarker.call(this,scene,m);};
const oldZones=S.surfaceZones;S.surfaceZones=function(c,b){return oldZones.call(this,c,ready(b)?{...b,honroSurfaceZones:[]}:b);};
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':stage9-root-finish2:'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage9-location',active,naturalEdges:true,cachedWorld:true});G.HonroStage9LocationArt={active,ready,cacheStats:()=>({pictures:pictures.size,far:far?1:0,rootFork:rootFork?1:0,beam:beam?1:0,filters})};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage10-location-art.js
(()=>{
'use strict';
(function(G){'use strict';
const S=G.HonroScene.prototype,C=G.HONRO_CORE,E=G.HonroEnvironment,P=G.HonroPaintedPilots,M=G.HonroStage1LocationArt;
const active=b=>b?.honroStage===10&&!b.honroCustom&&b.honroMap?.stage10LocationPaint?.revision===1,ids=['forestFar','forestRock','forestSoil','guardianTree10','guardianHall10','ritualCorridor9'];
const ready=b=>{if(!active(b))return false;P.request(ids);return ids.every(P.ready);},pictures=new Map(),patterns=new WeakMap();let far,beam,filters=0;
function picture(id){if(pictures.has(id))return pictures.get(id);const im=P.images[id],cv=document.createElement('canvas');cv.width=(im.naturalWidth||im.width);cv.height=(im.naturalHeight||im.height);const c=cv.getContext('2d');c.filter=id==='guardianTree10'?'saturate(.64) contrast(.93) brightness(.87)':'saturate(.66) contrast(.92) brightness(.86)';filters++;c.drawImage(im,0,0);c.filter='none';pictures.set(id,cv);return cv;}
function background(c,w,h,b,scene){if(!ready(b))return false;if(!far){far=document.createElement('canvas');far.width=2304;far.height=1024;const cc=far.getContext('2d');cc.fillStyle='#293d46';cc.fillRect(0,0,2304,1024);cc.filter='saturate(.34) contrast(.64) brightness(.70) blur(.65px)';filters++;cc.drawImage(P.images.forestFar,0,0,2304,1024);cc.filter='none';cc.fillStyle='#2d424b35';cc.fillRect(0,0,2304,1024);const g=cc.createLinearGradient(0,480,0,1024);g.addColorStop(0,'#293d4600');g.addColorStop(1,'#293d46');cc.fillStyle=g;cc.fillRect(0,480,2304,544);}const raw=G.HonroVisualStyle.raw(c),q=E.act1BackdropFrame(scene,w,h,b,2304,1024),paint=cc=>{cc.fillStyle='#293d46';cc.fillRect(0,0,w,h);cc.drawImage(far,q.x,q.y,q.w,q.h);};if(!scene._screenRaster(raw,['stage10',P.appearanceKey(),w,h,scene.x,scene.y,scene.scale].join(':'),w,h,paint,'_screenBackgroundCache',false))paint(raw);scene.environmentStats={groups:1,visibleAssets:1,cachedPaths:0,animatedPrimitives:0};return true;}
function path(ps){const p=new Path2D();ps.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;}
function soil(c){let p=patterns.get(c);if(!p){p={};patterns.set(c,p);}return p.soil||(p.soil=c.createPattern(P.images.forestSoil,'repeat'));}
function band(q,a,z,depth){const ps=[[a,q.top(a)]];for(const [p,r]of q.edges){if(r.x>a&&p.x<z){if(p.x>a)ps.push([p.x,p.y]);if(r.x<z)ps.push([r.x,r.y]);}}ps.push([z,q.top(z)]);return path([...ps,...ps.toReversed().map(([x,y])=>[x,y+depth])]);}
function floor(c,t,b){const q=M.prepare(t),m=c.getTransform(),left=Math.max(t.x,-m.e/m.a-5),right=Math.min(t.x+t.w,(c.canvas.width-m.e)/m.a+5),v=b.honroMap.stage10LocationPaint;c.save();c.clip(q.path);c.fillStyle='#342f27';c.fill(q.path);const earth=soil(c);earth.setTransform(new DOMMatrix([.57,0,0,.52,0,0]));c.fillStyle=earth;c.globalAlpha=.38;c.fill(q.path);c.globalAlpha=.82;c.fill(band(q,left,right,220));c.globalAlpha=1;
 // Large distinct gravel/earth/stone areas follow the real top, leaving the
 // central court low and readable instead of tiling a rock cliff over it.
 const cards=M.rockCards();for(const [i,x,w]of [[0,-700,1550],[2,500,1500],[1,1770,1200],[0,2750,1300],[2,3890,1550]]){if(x+w<left||x>right)continue;c.globalAlpha=.58;c.drawImage(cards[i],x,q.top(Math.max(t.x,Math.min(t.x+t.w,x+w*.5)))+90,w,640);}c.globalAlpha=1;
 for(const [i,[a,z]]of v.materials.stonePads.entries()){c.save();c.clip(band(q,a,z,43));c.drawImage(cards[i%3],a-50,q.top(a)-60,z-a+110,225);c.fillStyle='#887f5c20';c.fillRect(a,q.top(a)-5,z-a,80);c.restore();}
 for(const [a,z]of v.materials.grassBanks){c.save();c.clip(band(q,a,z,48));c.fillStyle='#3a503343';c.fillRect(a,q.top(a)-10,z-a,130);c.restore();}
 const depth=c.createLinearGradient(0,2470,0,3340);depth.addColorStop(0,'#1c303600');depth.addColorStop(.5,'#1b2d34a8');depth.addColorStop(1,'#1b2d34');c.fillStyle=depth;c.fill(q.path);c.restore();return true;}
function grain(c){if(!beam){beam=document.createElement('canvas');beam.width=384;beam.height=128;const cc=beam.getContext('2d'),im=picture('guardianHall10');cc.drawImage(im,im.width*.16,im.height*.35,im.width*.63,im.height*.09,0,0,384,128);}let p=patterns.get(c);if(!p){p={};patterns.set(c,p);}return p.beam||(p.beam=c.createPattern(beam,'repeat'));}
function timber(c,t){const q=M.prepare(t);c.save();c.clip(q.path);c.fillStyle='#4a4638';c.fill(q.path);const p=grain(c);p.setTransform(new DOMMatrix([.7,0,0,.6,0,0]));c.fillStyle=p;c.fill(q.path);const g=c.createLinearGradient(0,t.y,0,t.y+t.h);g.addColorStop(0,'#80775918');g.addColorStop(1,'#1d2c32c0');c.fillStyle=g;c.fill(q.path);c.restore();return true;}
function supports(c,b){const floor=M.prepare(b.terrain.find(t=>t.id==='outer-yard')),im=picture('guardianHall10');for(const id of ['west-step','east-step']){const t=b.terrain.find(t=>t.id===id),q=M.prepare(t);for(const k of [.25,.8]){const x=t.x+t.w*k,y=q.top(x)+12,foot=floor.top(x)+7;if(foot-y<20)continue;c.drawImage(im,im.width*.475,im.height*.48,im.width*.035,im.height*.46,x-8,y,16,foot-y);}}}
function scenery(c,b,layer){const v=b.honroMap.stage10LocationPaint;if(layer==='structural-back'){const t=v.tree;c.drawImage(picture(t.image),t.x,t.y,t.width,t.height);for(const h of v.halls)c.drawImage(picture(h.image),h.x,h.y,h.width,h.height);}if(layer==='prop')supports(c,b);}
function terrain(c,t,b){if(!ready(b)||t.broken)return false;if(t.id==='outer-yard')return floor(c,t,b);if(t.id==='sodan-binding'||b.honroMap.stage10LocationPaint.branches.includes(t.id)||['west-gallery','east-gallery','gallery-link-west','gallery-link-east'].includes(t.id))return true;if(t.oneWay)return timber(c,t);return false;}
const oldBackground=S.background;S.background=function(c,w,h,b){if(!active(b)||!background(c,w,h,b,this))return oldBackground.call(this,c,w,h,b);};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(!active(this.battle)||!terrain(c,t,this.battle))return oldTerrain.call(this,c,t);};
const oldLayer=S._landmarkLayer;S._landmarkLayer=function(c,ls,layer){if(ready(this.battle)){scenery(c,this.battle,layer);return;}return oldLayer.call(this,c,ls,layer);};
const oldMarker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(ready(scene.battle)&&m.type==='hauntHabitat')return true;return oldMarker.call(this,scene,m);};
const oldZones=S.surfaceZones;S.surfaceZones=function(c,b){return oldZones.call(this,c,ready(b)?{...b,honroSurfaceZones:[]}:b);};
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':stage10-guardian1:'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage10-location',active,naturalEdges:true,cachedWorld:true});G.HonroStage10LocationArt={active,ready,cacheStats:()=>({pictures:pictures.size,far:far?1:0,beam:beam?1:0,filters})};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/quiet-layered-art.js
(()=>{
'use strict';
(function(G){'use strict';
// Shared approved far cache and independent, transparent near caches. Geometry
// never clips a ground texture. No grain, detail synthesis or new animation.
const P=G.HonroPaintedPilots,E=G.HonroEnvironment,pictures=new Map();let filters=0;
const fringes=new Map(),legacySections=new WeakMap(),MAX_FRINGES=8;let fringeBuilds=0,fringeLimit=2;
function trimFringes(limit){while(fringes.size>limit){const oldest=fringes.keys().next().value;fringes.get(oldest).canvas.width=1;fringes.delete(oldest);}}
function ready(near){P.request(['quietFar',near]);return P.ready('quietFar')&&P.ready(near);}
// Old snapshots still describe one image. New maps explicitly author each
// independent image, source-space contact profile and non-colliding margin.
function sections(v){
 if(Array.isArray(v?.sections))return v.sections;
 if(!v?.image)return[];
 if(!legacySections.has(v))legacySections.set(v,[{id:'legacy',image:v.image,tone:v.tone,source:v.source,transform:v.transform,contacts:[],exterior:{mode:'fringe',collision:false,...v.fringe},damageMasks:v.brokenBoughMask?[{terrainId:'pine-branch-east',sourcePoints:v.brokenBoughMask}]:[]}]);
 return legacySections.get(v);
}
function readySections(v){const list=sections(v),ids=[...new Set(['quietFar',...list.map(s=>s.image)])];fringeLimit=Math.min(MAX_FRINGES,Math.max(2,list.length*2));trimFringes(fringeLimit);P.request(ids);return ids.every(id=>P.ready(id));}
function picture(id,tone){const source=tone==='source'||id==='stage1BalancedNear',key=source?id+':source':id;if(pictures.has(key))return pictures.get(key);const im=P.images[id],cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const c=cv.getContext('2d');if(!source){c.filter='brightness('+(id==='quietFar'?.68:.62)+')';filters++;}c.drawImage(im,0,0);c.filter='none';pictures.set(key,cv);return cv;}
function near(id,cutout){const base=picture(id);if(!cutout)return base;const key=id+':broken-bough';if(pictures.has(key))return pictures.get(key);const cv=document.createElement('canvas');cv.width=base.width;cv.height=base.height;const c=cv.getContext('2d');c.drawImage(base,0,0);c.globalCompositeOperation='destination-out';const p=new Path2D();cutout.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();c.fill(p);pictures.set(key,cv);return cv;}
// A finite, non-colliding margin uses the existing edge's broad forms once.
// Only deep foreground fades; the authored walk surfaces remain opaque. Build
// alpha once in source space, never filter or synthesize texture while panning.
function fringe(id,cutout,options={}){
 const cuts=cutout?.length?(typeof cutout[0][0]==='number'?[cutout]:cutout):[],key=JSON.stringify([id,options,cuts]);
 if(fringes.has(key)){const hit=fringes.get(key);fringes.delete(key);fringes.set(key,hit);return hit;}
 const base=picture(id,options.tone),w=base.width,h=base.height,pad=options.mode==='none'?0:Math.max(0,Math.round(options.padding??192)),edges=options.mode==='none'?{left:false,right:false,bottom:false}:options.edges||{};
 const cv=document.createElement('canvas');cv.width=w+pad*2;cv.height=h;
 const c=cv.getContext('2d');
 if(cuts.length){
  c.drawImage(fringe(id,null,options).canvas,0,0);c.save();c.translate(pad,0);c.globalCompositeOperation='destination-out';
  for(const cut of cuts){const p=new Path2D();cut.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();c.fill(p);}c.restore();
 }else{
  const bc=base.getContext('2d');
  const edgeTop=x=>{const d=bc.getImageData(x,0,8,h).data;let run=0;for(let y=Math.floor(h*.35);y<h;y++){let a=0;for(let n=0;n<8;n++)a+=d[(y*8+n)*4+3];run=a>248*8?run+1:0;if(run===8)return y-7;}return h;};
  const left=edgeTop(0),right=edgeTop(w-8);
  c.drawImage(base,pad,0);
  if(pad&&edges.left!==false){c.save();c.translate(pad,0);c.scale(-1,1);c.drawImage(base,0,left,96,h-left,0,left,pad,h-left);c.restore();}
  if(pad&&edges.right!==false){c.save();c.translate(pad+w,0);c.scale(-1,1);c.drawImage(base,w-96,right,96,h-right,-pad,right,pad,h-right);c.restore();}
  const pixels=c.getImageData(0,0,cv.width,cv.height),data=pixels.data,smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const starts=new Float32Array(cv.width),ends=new Float32Array(cv.width);
  for(let x=0;x<cv.width;x++){const phase=(x-pad)/w,v=options.bottomVariation;starts[x]=(options.bottomStart??h-180)+(v??22)*Math.sin(phase*9)+(v===undefined?14:v*.6)*Math.sin(phase*4+1);ends[x]=(options.bottomEnd??h-5)-(v??22)*Math.abs(Math.sin(phase*7+2));}
  for(let y=0;y<cv.height;y++){
   const lp=pad*(.82+.14*Math.sin(y/170)),rp=pad*(.84+.12*Math.sin(y/190+1));
   for(let x=0;x<cv.width;x++){
    const i=(y*cv.width+x)*4+3;if(!data[i])continue;
    const side=x<pad?smooth((x-pad+lp)/lp)*smooth((y-left+1)/Math.max(1,(pad-x)*.45)):x>pad+w?smooth((pad+w+rp-x)/rp)*smooth((y-right+1)/Math.max(1,(x-pad-w)*.45)):1;
    data[i]*=side*(edges.bottom===false?1:smooth((ends[x]-y)/(ends[x]-starts[x])));
   }
  }
  c.putImageData(pixels,0,0);
 }
 const result={canvas:cv,pad};fringeBuilds++;
 trimFringes(fringeLimit-1);
 fringes.set(key,result);return result;
}
function drawNear(c,v,cutout,exterior=false){
 if(exterior&&v.exterior?.mode==='none')return;
 const options=v.tone?{...(v.exterior||v.fringe),tone:v.tone}:v.exterior||v.fringe,f=fringe(v.image,cutout,options),q=v.transform,cv=f.canvas,x=q.x-f.pad*q.scale,y=q.y,w=cv.width*q.scale,h=cv.height*q.scale;
 c.save();if(exterior){c.beginPath();c.rect(x,y,w,h);c.rect(q.x,q.y,v.source.width*q.scale,v.source.height*q.scale);c.clip('evenodd');}
 c.drawImage(cv,x,y,w,h);c.restore();
}
function drawSections(c,v,b,exterior=false){
 const broken=new Set((b?.terrain||[]).filter(t=>t.broken).map(t=>t.id));
 for(const section of sections(v)){
  const cuts=(section.damageMasks||[]).filter(m=>broken.has(m.terrainId)).map(m=>m.sourcePoints);
  drawNear(c,section,cuts,exterior);
 }
}
// Reserve vertical cover so the approved ridges stay in the middle of the
// screen, including tall viewports. Camera zoom never scales this screen layer.
function backdropFrame(scene,w,h,b,iw=1672,ih=941){const base=E.act1BackdropFrame(scene,w,h,b,iw,ih),s=Math.max(base.w/iw,h*1.48/ih),dw=iw*s,dh=ih*s,my=h*E.ACT1_FAR.marginY,y=Math.max(h-dh+my,Math.min(-my,h*.43-dh*.60));return{x:(w-dw)*.5+base.offsetX,y:y+base.offsetY,w:dw,h:dh,offsetX:base.offsetX,offsetY:base.offsetY};}
function background(scene,c,w,h,b){const raw=G.HonroVisualStyle.raw(c);if(!P.ready('quietFar')){raw.fillStyle='#62696e';raw.fillRect(0,0,w,h);return;}const far=picture('quietFar'),q=backdropFrame(scene,w,h,b,far.width,far.height),paint=cc=>cc.drawImage(far,q.x,q.y,q.w,q.h),key=['quiet-far',P.appearanceKey(),w,h,q.x,q.y,q.w,q.h].join(':');if(!scene._screenRaster(raw,key,w,h,paint,'_screenBackgroundCache',false))paint(raw);scene.environmentStats={groups:1,visibleAssets:2,backgroundAnimatedPrimitives:0,animatedPrimitives:0};}
G.HonroQuietLayeredArt={ready,readySections,sections,near,drawNear,drawSections,background,backdropFrame,cacheStats:()=>({pictures:pictures.size,filterPasses:filters,farCanvases:pictures.has('quietFar')?1:0,fringePictures:fringes.size,fringeLimit,fringeBuilds,fringeBytes:[...fringes.values()].reduce((n,f)=>n+f.canvas.width*f.canvas.height*4,0)})};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage1-image-first-art.js
(()=>{
'use strict';
(function(G){'use strict';
// Stage1 approved transparent near + independent screen-space far. The source
// playable near is unchanged; a cached non-colliding fringe joins its cut edges.
const S=G.HonroScene.prototype,P=G.HonroPaintedPilots,L=G.HonroQuietLayeredArt;
const active=b=>b?.honroStage===1&&!b.honroCustom&&b.honroMap?.stage1ImageFirst?.quietLayers===1;
let lastPresentation;
const ready=b=>{if(!active(b))return false;lastPresentation=b.honroMap.stage1ImageFirst;return L.readySections(lastPresentation);},damageKey=b=>b.terrain.filter(t=>t.broken).map(t=>t.id).join(',');
const oldBackground=S.background;S.background=function(c,w,h,b){if(!active(b))return oldBackground.call(this,c,w,h,b);ready(b);L.background(this,c,w,h,b);};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(active(this.battle))return;return oldTerrain.call(this,c,t);};
const oldLayer=S._landmarkLayer;S._landmarkLayer=function(c,ls,layer){const b=this.battle;if(!active(b))return oldLayer.call(this,c,ls,layer);if(layer!=='structural-back'||!ready(b))return;L.drawSections(c,b.honroMap.stage1ImageFirst,b);};
const oldSkirt=S.terrainSkirt;S.terrainSkirt=function(c,b,w,h){if(active(b)){if(ready(b))L.drawSections(c,b.honroMap.stage1ImageFirst,b,true);return;}return oldSkirt.call(this,c,b,w,h);};
const oldZones=S.surfaceZones;S.surfaceZones=function(c,b){if(active(b))return;return oldZones.call(this,c,b);};
const oldWater=S.liveWater;S.liveWater=function(c,b){if(!active(b))return oldWater.call(this,c,b);c.save();c.globalAlpha*=.13;const out=oldWater.call(this,c,b);c.restore();return out;};
const oldTone=S.environmentTone;S.environmentTone=function(c,w,h,b){if(active(b))return;return oldTone?.call(this,c,w,h,b);};
const oldMarker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(active(scene.battle)&&(m.type==='exit'||m.type==='hauntHabitat'))return true;return oldMarker.call(this,scene,m);};
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':stage1-sections1:'+damageKey(b)+':'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage1-quiet-layered',active,naturalEdges:true,cachedWorld:true});
G.HonroStage1ImageFirstArt={active,ready,cacheStats:()=>{const list=L.sections(lastPresentation||{image:'stage1BalancedNear'}),ids=[...new Set(['quietFar',...list.map(s=>s.image)])];return{...L.cacheStats(),sections:list.length,requestedImages:ids.filter(id=>P.images[id]).length,maxImages:ids.length};}};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage2-image-first-art.js
(()=>{
'use strict';
(function(G){'use strict';
// Stage2 uses the same independent approved far and its own transparent near.
const S=G.HonroScene.prototype,P=G.HonroPaintedPilots,L=G.HonroQuietLayeredArt;
const active=b=>b?.honroStage===2&&!b.honroCustom&&b.honroMap?.stage2ImageFirst?.quietLayers===1;
const ready=b=>active(b)&&L.ready('stage2QuietNear');
// While the archer holds the original high perch, keep both his firing edge
// and the procession road in automatic view. Manual pan/zoom, dialogue and
// projectile tracking retain their existing controls.
function overwatch(scene,w,h,b){const v=b.honroMap.stage2ImageFirst,u=b.units.find(u=>u.id===b.active),now=performance.now();if(!v.highCliffs||!v.overwatchView||scene.manual||scene.storyTween||scene.goalFocus||scene.storyFrozen||b.projectiles?.length||u?.id!=='p-archer'||u.y>400||u.x>1100||(scene.focusId&&now<scene.focusUntil)||(scene.speakerId&&now<scene.speakerUntil))return;const q=v.overwatchView;scene.scale=Math.min(scene.scale,h/q.spanY);scene.x=w/h<1?u.x:q.x;scene.y=q.y;}
const background=S.background;S.background=function(c,w,h,b){if(!active(b))return background.call(this,c,w,h,b);ready(b);overwatch(this,w,h,b);L.background(this,c,w,h,b);};
const terrain=S.terrain;S.terrain=function(c,t){if(active(this.battle))return;return terrain.call(this,c,t);};
const layer=S._landmarkLayer;S._landmarkLayer=function(c,ls,name){const b=this.battle;if(!active(b))return layer.call(this,c,ls,name);if(name!=='structural-back'||!ready(b))return;const v=b.honroMap.stage2ImageFirst,q=v.transform;c.drawImage(L.near(v.image),q.x,q.y,v.source.width*q.scale,v.source.height*q.scale);};
const skirt=S.terrainSkirt;S.terrainSkirt=function(c,b,w,h){if(active(b))return;return skirt.call(this,c,b,w,h);};
const zones=S.surfaceZones;S.surfaceZones=function(c,b){if(active(b))return;return zones.call(this,c,b);};
const water=S.liveWater;S.liveWater=function(c,b){if(!active(b))return water.call(this,c,b);c.save();c.globalAlpha*=.13;const out=water.call(this,c,b);c.restore();return out;};
const tone=S.environmentTone;S.environmentTone=function(c,w,h,b){if(active(b))return;return tone?.call(this,c,w,h,b);};
const marker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(active(scene.battle)&&(m.type==='exit'||m.type==='hauntHabitat'))return true;return marker.call(this,scene,m);};
const key=S._worldCacheKey;S._worldCacheKey=function(b,w){return key.call(this,b,w)+(active(b)?':stage2-high-cliffs3:'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage2-quiet-layered',active,naturalEdges:true,cachedWorld:true});
G.HonroStage2ImageFirstArt={active,ready,cacheStats:()=>({...L.cacheStats(),requestedImages:['quietFar','stage2QuietNear'].filter(id=>P.images[id]).length,maxImages:2})};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage3-image-first-art.js
(()=>{
'use strict';
(function(G){'use strict';
const S=G.HonroScene.prototype,P=G.HonroPaintedPilots,L=G.HonroQuietLayeredArt,clips=new WeakMap();
const active=b=>b?.honroStage===3&&!b.honroCustom&&b.honroMap?.stage3ImageFirst?.quietLayers===1;
const ready=b=>active(b)&&L.ready('stage3QuietNear');
const background=S.background;S.background=function(c,w,h,b){if(!active(b))return background.call(this,c,w,h,b);ready(b);L.background(this,c,w,h,b);};
const terrain=S.terrain;S.terrain=function(c,t){if(active(this.battle))return;return terrain.call(this,c,t);};
const layer=S._landmarkLayer;S._landmarkLayer=function(c,ls,name){const b=this.battle;if(!active(b))return layer.call(this,c,ls,name);if(name!=='structural-back'||!ready(b))return;const v=b.honroMap.stage3ImageFirst,q=v.transform;c.drawImage(L.near(v.image),q.x,q.y,v.source.width*q.scale,v.source.height*q.scale);};
const skirt=S.terrainSkirt;S.terrainSkirt=function(c,b,w,h){if(active(b))return;return skirt.call(this,c,b,w,h);};
const zones=S.surfaceZones;S.surfaceZones=function(c,b){if(active(b))return;return zones.call(this,c,b);};
const water=S.liveWater;S.liveWater=function(c,b){if(!active(b))return water.call(this,c,b);const v=b.honroMap.stage3ImageFirst;let p=clips.get(v);if(!p){p=new Path2D();v.waterClip.forEach(({x,y},i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();clips.set(v,p);}c.save();c.clip(p);c.globalAlpha*=.18;const out=water.call(this,c,b);c.restore();return out;};
const tone=S.environmentTone;S.environmentTone=function(c,w,h,b){if(active(b))return;return tone?.call(this,c,w,h,b);};
const marker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(active(scene.battle)&&m.type==='hauntHabitat'){const c=scene.ctx;c.save();c.fillStyle='#332f2b99';c.beginPath();c.ellipse(m.x,m.y-4,24,8,0,0,Math.PI*2);c.fill();c.fillStyle='#9a7964';for(const dx of[-5,5]){c.beginPath();c.arc(m.x+dx,m.y-8,1.5,0,Math.PI*2);c.fill();}c.restore();return true;}return marker.call(this,scene,m);};
const key=S._worldCacheKey;S._worldCacheKey=function(b,w){return key.call(this,b,w)+(active(b)?':stage3-image-first1:'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage3-image-first',active,naturalEdges:true,cachedWorld:true});G.HonroStage3ImageFirstArt={active,ready,cacheStats:()=>({...L.cacheStats(),requestedImages:['quietFar','stage3QuietNear'].filter(id=>P.images[id]).length,maxImages:2})};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage4-image-first-art.js
(()=>{
'use strict';
(function(G){'use strict';
const S=G.HonroScene.prototype,P=G.HonroPaintedPilots,L=G.HonroQuietLayeredArt;
const active=b=>b?.honroStage===4&&!b.honroCustom&&b.honroMap?.stage4ImageFirst?.quietLayers===1;
const ready=b=>active(b)&&L.ready('stage4QuietNear');
const background=S.background;S.background=function(c,w,h,b){if(!active(b))return background.call(this,c,w,h,b);ready(b);L.background(this,c,w,h,b);};
const terrain=S.terrain;S.terrain=function(c,t){if(active(this.battle))return;return terrain.call(this,c,t);};
const layer=S._landmarkLayer;S._landmarkLayer=function(c,ls,name){const b=this.battle;if(!active(b))return layer.call(this,c,ls,name);if(name!=='structural-back'||!ready(b))return;const v=b.honroMap.stage4ImageFirst,q=v.transform,broken=b.terrain.find(t=>t.id==='burned-gallery')?.broken;c.drawImage(L.near(v.image),q.x,q.y,v.source.width*q.scale,v.source.height*q.scale);if(broken){c.save();c.translate(q.x,q.y);c.scale(q.scale,q.scale);c.fillStyle='#21231f';c.beginPath();v.galleryFracture.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.restore();}};
const skirt=S.terrainSkirt;S.terrainSkirt=function(c,b,w,h){if(active(b))return;return skirt.call(this,c,b,w,h);};
const zones=S.surfaceZones;S.surfaceZones=function(c,b){if(active(b))return;return zones.call(this,c,b);};
const tone=S.environmentTone;S.environmentTone=function(c,w,h,b){if(active(b))return;return tone?.call(this,c,w,h,b);};
const marker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(active(scene.battle)&&m.type==='hauntHabitat'){const c=scene.ctx;c.save();c.fillStyle='#332f2b99';c.beginPath();c.ellipse(m.x,m.y-4,24,8,0,0,Math.PI*2);c.fill();c.fillStyle='#9a7964';for(const dx of[-5,5]){c.beginPath();c.arc(m.x+dx,m.y-8,1.5,0,Math.PI*2);c.fill();}c.restore();return true;}return marker.call(this,scene,m);};
// The goal body remains the same fixed damageable unit. Its closed door is
// already in the whole painting; keep only the established durability overlay.
const body=S.unitBody;S.unitBody=function(c,u,...args){if(active(this.battle)&&u.id==='objective')return;return body.call(this,c,u,...args);};
const unit=S.unit;S.unit=function(c,u,...args){if(!active(this.battle)||u.id!=='objective')return unit.call(this,c,u,...args);if(u.dead)return;const z=1/Math.max(.05,this.scale),w=86;c.save();c.translate(u.x,u.y-u.h-18);c.scale(z,z);c.fillStyle='#13232a';c.fillRect(-w/2-2,-2,w+4,9);c.fillStyle='#cab47c';c.fillRect(-w/2,0,w*Math.max(0,u.hp/u.maxHp),5);c.restore();};
const key=S._worldCacheKey;S._worldCacheKey=function(b,w){return key.call(this,b,w)+(active(b)?':stage4-image-first1:'+Number(!!b.terrain.find(t=>t.id==='burned-gallery')?.broken)+':'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage4-image-first',active,naturalEdges:true,cachedWorld:true});G.HonroStage4ImageFirstArt={active,ready,cacheStats:()=>({...L.cacheStats(),requestedImages:['quietFar','stage4QuietNear'].filter(id=>P.images[id]).length,maxImages:2})};
})(globalThis);

})();
await yieldIfNeeded();
