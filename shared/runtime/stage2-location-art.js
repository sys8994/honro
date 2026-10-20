(function(G){'use strict';
// Stage2 paint only: the canonical cliff solids, bier road and airborne events
// retain their own data. No placement or material operation edits battle state.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,E=G.HonroEnvironment,P=G.HonroPaintedPilots,M=G.HonroStage1LocationArt;
const active=b=>!G.HonroVectorCampaignArt?.active(b)&&b?.honroStage===2&&b.honroMap?.act1Scene?.version===1;
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
