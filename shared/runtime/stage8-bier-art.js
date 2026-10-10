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
 }else if(t.id==='s8-west-root'){
  for(const[ps,col]of[[[[430,3930],[740,3540],[1190,3190],[1640,3120],[2070,3100],[1910,3210],[1360,3250],[910,3570],[570,4010]],'#b1ad8938'],[[[2180,3100],[2530,3210],[2780,3440],[2990,3610],[2800,3420],[2510,3340],[2220,3280]],'#193f3c43']]){c.fillStyle=col;c.fill(path(ps));}
 }else if(t.id==='s8-west-shoulder'||t.id==='s8-east-shoulder'){
  const faces=t.id==='s8-west-shoulder'?[
   [[[3180,3640],[3480,3400],[3760,3100],[4240,2840],[4690,2650],[4580,3080],[4370,3400],[3860,3660]],'#b1b49537'],
   [[[4700,2900],[4860,2740],[4960,3200],[5050,3680],[5090,4250],[4820,4450],[4680,4030],[4650,3580]],'#1a3e3e62'],
   [[[3630,3520],[4090,3340],[4370,3470],[4190,3740],[3900,3720]],'#84957535']
  ]:[[[[5520,2720],[5760,2910],[5940,3150],[6100,3410],[5860,3510],[5640,3320]],'#b6b39332'],[[[5440,3070],[5540,3400],[5590,3770],[5530,4150],[5480,4110],[5440,3640]],'#233f3d72']];
  for(const[ps,color]of faces){c.fillStyle=color;c.fill(path(ps));}
  // A few connected fractures divide broad weathered rock faces. They do
  // not pretend the tall natural cliff is masonry made of giant blocks.
  const joints=t.id==='s8-west-shoulder'?[
   [[4580,2880],[4515,3070],[4540,3340],[4680,3500],[4780,3880],[4740,4200],[4840,4420]],
   [[4850,3180],[4720,3310],[4540,3340],[4290,3420]],
   [[5010,3880],[4910,3990],[4780,3880],[4640,3890]],
   [[4860,4420],[5010,4300],[5110,4320]]
  ]:[[[5540,2840],[5520,3120],[5650,3350],[5670,3600]],[[5460,3580],[5530,3770],[5505,4010]],[[5570,3230],[5780,3200],[5910,3310]]];
  c.lineWidth=6;c.lineJoin='round';c.strokeStyle='#244b414f';for(const ps of joints){c.beginPath();ps.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
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
// The two bindings retain the shared target/HP/visibility contract. Their
// display is deliberately small enough to leave the 84-world-unit props and
// nearby actors readable, including in the inspection overview.
const sealId=id=>id==='bier-knot-0'||id==='bier-knot-1',oldHealth=S.terrainHealth;
S.terrainHealth=function(c,b,w,h){
 if(!active(b))return oldHealth.call(this,c,b,w,h);
 const targets=this.terrainHealthTargets(b),other=targets.filter(t=>!sealId(t.id));
 if(other.length)oldHealth.call(this,c,{...b,terrain:b.terrain.filter(t=>!sealId(t.id))},w,h);
 const z=1/Math.max(.01,this.scale),left=this.x-w*z/2,right=this.x+w*z/2,top=this.y-h*z/2,bottom=this.y+h*z/2;
 for(const t of targets.filter(t=>sealId(t.id))){
  if(t.x<left-100*z||t.x>right+100*z||t.y<top-70*z||t.y>bottom+70*z)continue;
  const width=76,ratio=Math.max(0,Math.min(1,t.hp/t.maxHp));
  c.save();c.translate(t.x,t.y);c.scale(z,z);c.textAlign='center';c.textBaseline='middle';c.font='600 10px sans-serif';
  c.fillStyle='#203c3dbb';c.fillRect(-width/2,-22,width,5);c.fillStyle=t.blocked?'#a3adb0':'#d9aa85';c.fillRect(-width/2,-22,width*ratio,5);
  const value=`${Math.ceil(t.hp)} / ${Math.ceil(t.maxHp)}`;c.strokeStyle='#17352ed9';c.lineWidth=3;c.strokeText(value,0,-9);c.fillStyle='#f0e4c9';c.fillText(value,0,-9);
  c.restore();
 }
};
const skyAsset=b=>b.honroMap?.bierArt?.backdropAsset;
function skyRaster(asset){let q=skyCache.get(asset);if(q)return q;const cv=G.document.createElement('canvas'),[x,y,w,h]=asset.vector.viewBox;cv.width=1800;cv.height=1100;const c=cv.getContext('2d');c.scale(cv.width/w,cv.height/h);c.translate(-x,-y);G.HonroVectorArt.draw(c,asset,{x:0,y:0,scale:1,rotation:0});skyCache.set(asset,cv);return cv;}
const background=S.background;S.background=function(c,w,h,b){if(!active(b)||!skyAsset(b))return background.call(this,c,w,h,b);const cv=skyRaster(skyAsset(b)),frame=G.HonroEnvironment.act1BackdropFrame(this,w,h,b,cv.width,cv.height);c.drawImage(cv,frame.x,frame.y,frame.w,frame.h);this.environmentStats={groups:0,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};};
G.HonroStage8BierArt={active,shape,terrain,skyAsset,skyRaster,omitReadability:()=>false};
})(globalThis);
