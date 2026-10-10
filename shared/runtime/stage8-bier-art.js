(function(G){'use strict';
// Exact Stage8 collision polygons, with material-scale painting only. Never
// reads animation time to move geometry or writes saved battle/actor state.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,cache=new WeakMap(),skyCache=new WeakMap();
const active=b=>b?.honroStage===8&&!b.honroCustom&&b.honroStage8BierRevision===1;
function path(ps){const p=new Path2D();ps.forEach((v,i)=>i?p.lineTo(v.x??v[0],v.y??v[1]):p.moveTo(v.x??v[0],v.y??v[1]));p.closePath();return p;}
function shape(t,b){let q=cache.get(t);if(q?.source===t.vertices&&q.version===b.sceneVersion)return q;const ps=C.poly(t),contour=t.id==='s8-ground'?b.honroMap?.bier?.primaryContour:null,pairs=contour?contour.slice(1).map((z,i)=>[contour[i],z].map(p=>({x:p[0],y:p[1]}))):(t.honroWalkEdges||[]).map(i=>[ps[i],ps[(i+1)%ps.length]]),edges=pairs.filter(([a,z])=>a&&z&&Math.abs(a.x-z.x)>.001),rim=new Path2D();for(const[a,z]of edges){rim.moveTo(a.x,a.y+5);rim.lineTo(z.x,z.y+5);}q={source:t.vertices,version:b.sceneVersion,body:path(ps),edges,rim};cache.set(t,q);return q;}
function terrain(c,t,b){if(!active(b)||!t.id?.startsWith('s8-'))return false;const q=shape(t,b),earth=t.id==='s8-ground',wood=t.mat==='wood',branch=/branch/.test(t.id),stone=/reflector|cover|stone/.test(t.id),top=earth?2600:t.y,depth=earth?3000:Math.min(800,Math.max(40,t.h));c.save();c.clip(q.body);const gr=c.createLinearGradient(0,top,0,top+depth);gr.addColorStop(0,wood?'#a69b72':earth?'#77836a':'#8d987c');gr.addColorStop(.42,wood?'#6e6849':earth?'#586d54':'#637e62');gr.addColorStop(1,wood?'#3c5039':earth?'#2d4b42':'#354f42');c.fillStyle=gr;c.fill(q.body);
 if(earth){
  // Broad asymmetrical sediment faces, not repeated geometric stamps. The
  // exposed earth mass and a dressed human-sized stone stay distinct scales.
  for(const[ps,col]of[[[[0,4290],[1720,4110],[2420,4090],[3050,4610],[3240,5500],[0,5500]],'#adab7b19'],[[[3550,4870],[5000,4890],[5810,4670],[5520,5300],[3890,5500]],'#173f3c44'],[[[6730,4480],[7240,3970],[7610,3510],[8180,3070],[8130,3660],[7450,4450],[7110,5060]],'#99a07126'],[[[8660,2770],[9600,2770],[9600,3890],[9100,3490]],'#afac791c']]){c.fillStyle=col;c.fill(path(ps));}
  for(const[a,z]of q.edges){c.fillStyle='#a6a282';c.fill(path([[a.x,a.y],[z.x,z.y],[z.x,z.y+31],[a.x,a.y+31]]));c.fillStyle='#697d59';c.fill(path([[a.x,a.y+31],[z.x,z.y+31],[z.x,z.y+78],[a.x,a.y+78]]));}
 }else if(wood){
  if(branch){c.strokeStyle='#b7a67599';c.lineWidth=15;for(const[a,z]of q.edges){c.beginPath();c.moveTo(a.x,a.y+32);c.lineTo(z.x,z.y+32);c.stroke();}c.strokeStyle='#364d3699';c.lineWidth=28;for(const[a,z]of q.edges){c.beginPath();c.moveTo(a.x,a.y+100);c.lineTo(z.x,z.y+126);c.stroke();}}
  else{c.strokeStyle='#344d3bcc';c.lineWidth=4;for(const[a,z]of q.edges){const n=Math.max(1,Math.ceil(Math.hypot(z.x-a.x,z.y-a.y)/110));for(let i=1;i<n;i++){const x=a.x+(z.x-a.x)*i/n,y=a.y+(z.y-a.y)*i/n;c.beginPath();c.moveTo(x,y+9);c.lineTo(x+3,y+33);c.stroke();}}}
 }else if(t.id==='s8-court'){
  // This long object is weathered earth/bedrock under a thin dressed rim,
  // not a single building made of thousand-unit rectangular stone blocks.
  c.fillStyle='#aeb0923d';c.fill(path([[4060,4290],[5380,4290],[5700,4100],[5920,4080],[5440,4440],[4530,4470],[4130,4400]]));c.fillStyle='#183f3e40';c.fill(path([[5900,4190],[6560,3680],[7020,3210],[7360,3030],[6760,3790],[6110,4310]]));
 }else if(stone){
  // Individually dressed blocks roughly knee-to-waist high, at most a few
  // courses on the two tactical covers. No full-world tiling or tiny noise.
  c.strokeStyle='#385643a6';c.lineWidth=3;const rows=Math.max(1,Math.ceil(t.h/58));for(let i=1;i<rows;i++){const y=t.y+t.h*i/rows;c.beginPath();c.moveTo(t.x,y);c.lineTo(t.x+t.w,y+2);c.stroke();if(i%2){c.beginPath();c.moveTo(t.x+t.w*.48,y);c.lineTo(t.x+t.w*.5,y-t.h/rows);c.stroke();}}c.fillStyle='#bbc1a255';c.fill(path([[t.x,t.y],[t.x+12,t.y],[t.x+14,t.y+t.h],[t.x,t.y+t.h]]));
 }
 c.strokeStyle=wood?'#d2bf8e99':'#d0c8a494';c.lineWidth=earth?8:6;c.stroke(q.rim);c.restore();return true;}
const oldTerrain=S.terrain;S.terrain=function(c,t){if(terrain(c,t,this.battle))return;return oldTerrain.call(this,c,t);};
const skyAsset=b=>b.honroMap?.bierArt?.backdropAsset;
function skyRaster(asset){let q=skyCache.get(asset);if(q)return q;const cv=G.document.createElement('canvas'),[x,y,w,h]=asset.vector.viewBox;cv.width=1800;cv.height=1100;const c=cv.getContext('2d');c.scale(cv.width/w,cv.height/h);c.translate(-x,-y);G.HonroVectorArt.draw(c,asset,{x:0,y:0,scale:1,rotation:0});skyCache.set(asset,cv);return cv;}
const background=S.background;S.background=function(c,w,h,b){if(!active(b)||!skyAsset(b))return background.call(this,c,w,h,b);const cv=skyRaster(skyAsset(b)),frame=G.HonroEnvironment.act1BackdropFrame(this,w,h,b,cv.width,cv.height);c.drawImage(cv,frame.x,frame.y,frame.w,frame.h);this.environmentStats={groups:0,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};};
G.HonroStage8BierArt={active,shape,terrain,skyAsset,skyRaster,omitReadability:()=>false};
})(globalThis);
