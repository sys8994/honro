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
let far,cliffCards;const placements=new WeakMap(),surfaces=new WeakMap();
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
function surface(t,b){let q=surfaces.get(t);if(q?.source===t.vertices)return q;const geometry=M.prepare(t),walk=G.HonroAct1SpatialArt.prepareTerrain(t,b).edges;
 q={source:t.vertices,path:geometry.path,walk};surfaces.set(t,q);return q;
}
function soilBand(c,a,z,d,color){const p=new Path2D();p.moveTo(a.x,a.y);p.lineTo(z.x,z.y);p.lineTo(z.x,z.y+d);p.lineTo(a.x,a.y+d);p.closePath();c.fillStyle=color;c.fill(p);}
function terrain(c,t,b){if(!ready(b)||t.broken||t.honroSeal||t.honroElementCollision)return false;
 if(t.mat==='wood')return M.paintBranch(c,t,{baseRight:t.id.startsWith('right-')});
 if(!['earth','soil','rock','stone'].includes(t.mat))return false;
 const q=surface(t,b),cliff=t.id!=='canyon-ground',m=c.getTransform(),left=Math.max(t.x,-m.e/m.a-4),right=Math.min(t.x+t.w,(c.canvas.width-m.e)/m.a+4),top=Math.max(t.y,-m.f/m.d-4),bottom=Math.min(t.y+t.h,(c.canvas.height-m.f)/m.d+4),cards=cliff?verticalCards():M.rockCards();
 c.save();c.clip(q.path);c.fillStyle=cliff?'#3b423e':'#343c36';c.fill(q.path);
 // Large vertical mineral masses cross world tiles. Unequal, feathered cards
 // retain detail down the cliff; no opaque horizontal depth cut is applied.
 const row=cliff?1080:570,col=cliff?670:780;
 for(let iy=Math.floor((top-1750)/row);iy<=Math.floor(bottom/row);iy++)for(let ix=Math.floor((left-1300)/col);ix<=Math.floor(right/col);ix++){
  const seed=ix*137+iy*971,x=ix*col+(random(seed)-.5)*190,y=iy*row+(random(seed+1)-.5)*260,w=cliff?930+random(seed+2)*160:1120+random(seed+2)*160,h=cliff?1560+random(seed+3)*260:830+random(seed+3)*130;
  c.drawImage(cards[Math.floor(random(seed+4)*3)],x,y,w,h);
 }
 const shade=c.createLinearGradient(t.x,0,t.x+Math.min(t.w,1800),0);shade.addColorStop(0,'#263b4022');shade.addColorStop(.48,'#172a302c');shade.addColorStop(1,'#48514a0c');c.fillStyle=shade;c.fill(q.path);
 // Soil follows exposed real walking faces. Its depth comes from the local
 // material, incline and remaining play depth, not Stage1's x-specific masks.
 for(const [a,z]of q.walk){if(z.x<left||a.x>right)continue;const len=z.x-a.x;if(len<.01)continue;const slope=(z.y-a.y)/len,mid=(a.y+z.y)/2,d=cliff?Math.max(10,22-Math.abs(slope)*8):Math.max(38,Math.min(130,(b.height-mid)*.18+45));
  c.save();c.transform(1,slope,0,1,a.x,a.y);const earth=M.soilPattern(c);earth.setTransform(new DOMMatrix([.57,0,0,d/320,-a.x,0]));c.fillStyle=earth;c.fillRect(0,0,len+.3,d);c.restore();soilBand(c,a,z,cliff?3:6,'#867d5555');
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
 if(/^mockup-granite/.test(l.asset?.id||'')){for(const t of G.HonroTerrainDomain.render(b))if(!t.broken&&(t.honroElementId===l.id||l.collisionIds?.includes(t.id)))M.paintRock(c,t,b);return true;}
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
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':stage2-location:'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage2-location',active,naturalEdges:true,cachedWorld:true});
G.HonroStage2LocationArt={active,ready,placement,treeSpecs};
})(globalThis);

