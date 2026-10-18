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
function hallBody(c,b){const roof=b.terrain.find(t=>t.id==='warehouse-roof'&&!t.broken),floor=b.terrain.find(t=>t.id==='ferry-ground'&&!t.broken);if(!roof||!floor)return;const q=prepared(roof),img=picture('ferryHall'),meta=P.manifest.architecture3.warehouse,n=meta.roofTop.length,sw=img.width/n,base=C.topAt(floor,5550,1612)+5;
 // A level timber floor on individual short piers follows the earth slope.
 // Leave air between the supports; no massive rock rectangle fills this gap.
 const wallLeft=roof.x+roof.w*.065,wallRight=roof.x+roof.w*.98;
 c.save();const timber=wood(c);timber.setTransform(new DOMMatrix([1.1,0,0,.75,0,base]));c.fillStyle=timber;c.fillRect(wallLeft,base-8,wallRight-wallLeft,14);
 for(const u of [.10,.25,.43,.61,.79,.94]){const x=roof.x+roof.w*u,ground=C.topAt(floor,x,base),height=ground-base;if(height<10)continue;
  const foot=new Path2D();foot.moveTo(x-20,ground-4);foot.lineTo(x-12,ground-12);foot.lineTo(x+13,ground-10);foot.lineTo(x+22,ground+5);foot.lineTo(x-18,ground+7);foot.closePath();c.save();c.clip(foot);c.drawImage(P.images.forestRock,480,590,120,80,x-22,ground-13,46,22);c.restore();
  timber.setTransform(new DOMMatrix([0,1.1,-.45,0,x,base]));c.fillStyle=timber;c.fillRect(x-8,base+2,16,height-6);c.fillStyle='#292c2366';c.fillRect(x+3,base+2,5,height-6);
  if(height>65){c.beginPath();c.moveTo(x,base+Math.min(height*.65,85));c.lineTo(x+45,base+8);c.strokeStyle='#5e5441';c.lineWidth=8;c.stroke();}
 }
 c.restore();
 for(let i=0;i<n;i++){const x=roof.x+roof.w*i/n,w=roof.w/n,top=q.bottom(x+w*.5);if(base<=top)continue;c.drawImage(img,i*sw,meta.roofEave,sw,img.height-meta.roofEave,x,top,w+.3,base-top);}}
function roofPaint(c,t){const q=prepared(t),img=picture('ferryHall'),meta=P.manifest.architecture3.warehouse,n=meta.roofTop.length,sourceLeft=img.width*.18,sourceWidth=img.width*.64,sw=sourceWidth/n,sy=img.height*.19;
 // Keep every point of the real walking contour. Only the underside of each
 // non-walkable eave return tapers into the end tiles, inside the solid roof.
 const lower=x=>{const u=clamp(Math.min((x-t.x)/85,(t.x+t.w-x)/85)),v=u*u*(3-2*u);return q.top(x)+10+(q.bottom(x)-q.top(x)-10)*v;},face=new Path2D();
 for(const [i,[a,z]]of q.edges.entries()){if(i===0)face.moveTo(a.x,a.y);face.lineTo(z.x,z.y);}for(let i=n;i>=0;i--){const x=t.x+t.w*i/n;face.lineTo(x,lower(x));}face.closePath();c.save();c.clip(q.path);c.clip(face);c.fillStyle='#3c403b';c.fill(q.path);
 for(let i=0;i<n;i++){const x=t.x+t.w*i/n,w=t.w/n,top=q.top(x+w*.5),bottom=q.bottom(x+w*.5);c.drawImage(img,sourceLeft+i*sw,sy,sw,meta.roofEave-sy,x,top,w+.3,bottom-top);}
 // Reuse the actual turned end tiles in the narrow return faces, rather than
 // terminating a central roof crop in two vertical image-card edges.
 for(const right of [false,true]){const x=right?t.x+t.w-85:t.x,y=q.top(x+42.5);c.drawImage(img,right?img.width*.82:0,img.height*.25,img.width*.18,meta.roofEave-img.height*.25,x,y,85,96);}
 c.beginPath();for(const [i,[a,z]]of q.edges.entries()){if(i===0)c.moveTo(a.x,a.y);c.lineTo(z.x,z.y);}c.strokeStyle='#a4aaa14a';c.lineWidth=1.2;c.stroke();c.restore();return true;}

function terrain(c,t,b){if(!ready(b)||t.broken||t.honroElementCollision)return false;if(t.id==='ferry-ground')return groundField(c,t,b);if(t.id==='warehouse-roof')return roofPaint(c,t);if(t.id==='fc-choice-3-warehouse-side-pine')return M.paintBranch(c,t);if(t.mat==='wood')return deck(c,t);return false;}
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
 if(l.id==='a1-scene-3-cargo-hall'){hallBody(c,b);return true;}
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
const oldVisible=S._landmarkVisible;S._landmarkVisible=function(l,v,pad=40){if(ready(this.battle)){if(treeSpecs[l.id]){const q=tree(l,this.battle);return !!q&&q.left-pad<=v.right&&q.right+pad>=v.left&&q.top-pad<=v.bottom&&q.bottom+pad>=v.top;}if(l.id==='a1-scene-3-cargo-hall')return 4850-pad<=v.right&&5820+pad>=v.left&&1360-pad<=v.bottom&&1850+pad>=v.top;
 const spec=l.id==='a1-scene-3-ferry-workbay'?['ferryWorkbay',225]:l.id==='a1-scene-3-exit-court'?['passGate',225]:l.id==='landmark-5'?['ferryShrine',145]:null;if(spec){const img=picture(spec[0]),h=spec[1],w=h*img.width/img.height;return l.x-w*.5-pad<=v.right&&l.x+w*.5+pad>=v.left&&l.y-h-pad<=v.bottom&&l.y+pad>=v.top;}
 }return oldVisible.call(this,l,v,pad);};
const oldZones=S.surfaceZones;S.surfaceZones=function(c,b){return oldZones.call(this,c,ready(b)?{...b,honroSurfaceZones:(b.honroSurfaceZones||[]).filter(z=>/water|current/.test(z.kind))}:b);};
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':stage3-eave-footing3:'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage3-location',active,naturalEdges:true,cachedWorld:true});G.HonroStage3LocationArt={active,ready,prepared};
})(globalThis);
