(function(G){'use strict';
// Exact Stage8 collision polygons, with material-scale painting only. Never
// reads animation time to move geometry or writes saved battle/actor state.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,cache=new WeakMap(),skyCache=new WeakMap();
const active=b=>b?.honroStage===8&&!b.honroCustom&&b.honroStage8BierRevision===1;
function path(ps){const p=new Path2D();ps.forEach((v,i)=>i?p.lineTo(v.x??v[0],v.y??v[1]):p.moveTo(v.x??v[0],v.y??v[1]));p.closePath();return p;}
// Large connected bedding shelves and offset vertical faces. Authored per mass,
// cached once; no rock stamps, triangulation, or new collision surfaces.
const beds={
 's8-west-shoulder':[
 ['#6f7c70',[[3190,3630],[3490,3370],[3820,3100],[4160,2910],[4580,2680],[4520,2870],[4190,3070],[3850,3220],[3550,3470],[3400,3640]]],
 ['#4b605c',[[3400,3640],[3550,3470],[3850,3220],[4190,3070],[4520,2870],[4490,3150],[4210,3330],[3960,3390],[3800,3620],[3510,3780]]],
 ['#7b8373',[[3850,3220],[4190,3070],[4490,3150],[4210,3200],[3970,3310],[3830,3340]]],
 ['#5e7068',[[4210,3330],[4490,3150],[4690,2910],[4740,3290],[4580,3520],[4600,3770],[4350,3870],[4150,3740],[3960,3760],[3960,3390]]],
 ['#354f4e',[[4740,3290],[4890,3140],[4950,3450],[4840,3690],[4930,4030],[4820,4340],[4610,4440],[4630,4100],[4600,3770],[4580,3520]]],
 ['#718074',[[3960,3760],[4150,3740],[4350,3870],[4600,3770],[4560,3840],[4350,3960],[4150,3840],[4000,3870]]],
 ['#526760',[[4150,3840],[4350,3960],[4560,3840],[4630,4100],[4500,4330],[4250,4440],[4020,4240]]],
 ['#7a8577',[[4250,4440],[4500,4330],[4820,4340],[4770,4420],[4500,4400],[4310,4510]]]],
 's8-east-shoulder':[
 ['#758075',[[5430,2630],[5610,2710],[5830,2920],[6040,3240],[5880,3290],[5690,3080],[5510,2980]]],
 ['#526962',[[5510,2980],[5690,3080],[5880,3290],[6040,3240],[6110,3420],[5900,3510],[5650,3280],[5530,3340]]],
 ['#829082',[[5650,3280],[5900,3510],[6110,3420],[6080,3490],[5880,3590],[5650,3360]]],
 ['#3c5652',[[5430,3000],[5510,2980],[5530,3340],[5650,3360],[5580,3560],[5610,3910],[5540,4210],[5420,4390],[5440,3980],[5390,3620]]],
 ['#687c70',[[5480,3580],[5580,3560],[5610,3910],[5520,3860],[5490,4040],[5440,3980]]]],
 's8-ground':[
 ['#55695f',[[950,4280],[1610,4130],[2280,3920],[2670,3930],[2800,4230],[2520,4340],[2170,4280],[1750,4450],[1370,4490]]],
 ['#738171',[[1610,4130],[2280,3920],[2670,3930],[2610,4000],[2310,4020],[1770,4230],[1450,4310]]],
 ['#3c5651',[[2170,4280],[2520,4340],[2800,4230],[3020,4550],[2880,4820],[2510,4770],[2330,4530]]],
 ['#687b6e',[[6720,4390],[7190,4050],[7600,3790],[7860,3490],[8070,3280],[8330,3300],[8200,3470],[7890,3640],[7630,3950],[7260,4210],[7020,4500]]],
 ['#3c5652',[[7020,4500],[7260,4210],[7630,3950],[7890,3640],[8200,3470],[8130,3790],[7810,4050],[7660,4390],[7310,4690],[7000,4830]]],
 ['#7d8977',[[7260,4210],[7630,3950],[7810,4050],[7660,4100],[7430,4330],[7210,4380]]],
 ['#617368',[[8130,3790],[8200,3470],[8330,3300],[8680,3170],[9140,3200],[9240,3380],[8990,3450],[8650,3380],[8480,3630]]],
 ['#425c55',[[8480,3630],[8650,3380],[8990,3450],[9240,3380],[9390,3690],[9130,3920],[8770,3850],[8550,4050]]]],
 's8-court':[
 ['#728477',[[6200,4250],[6600,3890],[6990,3580],[7420,3111],[7600,3000],[7800,3000],[7730,3090],[7520,3180],[7170,3590],[6790,3840],[6550,4080],[6370,4200]]],
 ['#3e5753',[[6370,4200],[6550,4080],[6790,3840],[7170,3590],[7520,3180],[7730,3090],[7680,3280],[7300,3520],[6870,3880],[6540,4110]]]]
};
const seams={
 's8-west-shoulder':[
 [[4485,2875],[4450,3030],[4490,3150],[4445,3310],[4580,3520],[4540,3670],[4600,3770]],
 [[3960,3390],[4090,3420],[4250,3390],[4445,3310]],
 [[4150,3740],[4210,3620],[4250,3390]],
 [[4600,3770],[4510,3950],[4530,4110],[4500,4330]],
 [[4250,4440],[4290,4260],[4230,4090],[4350,3960]],
 [[4530,4110],[4700,4070],[4800,4140]],
 [[3530,3500],[3660,3520],[3800,3450],[3950,3460]]],
 's8-east-shoulder':[
 [[5610,2730],[5580,2900],[5690,3080],[5650,3280],[5700,3430]],
 [[5690,3080],[5810,3070],[5910,3190]],
 [[5480,3580],[5530,3690],[5520,3860],[5490,4040]],
 [[5520,3860],[5570,3830]]],
 's8-ground':[
 [[2280,4020],[2250,4150],[2170,4280],[2260,4420]],
 [[1750,4320],[1940,4300],[2170,4280]],
 [[7890,3640],[7950,3800],[7810,4050],[7800,4230]],
 [[7430,4330],[7530,4430],[7540,4580]],
 [[8650,3380],[8580,3530],[8610,3660],[8550,4050]],
 [[8610,3660],[8830,3700],[9000,3640]]]
};
const seamPaths=new Map();
function rockSeams(c,id){let p=seamPaths.get(id);if(!p){p=new Path2D();for(const ps of seams[id]||[])ps.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));seamPaths.set(id,p);}c.strokeStyle='#203d3b70';c.lineWidth=5;c.lineJoin='round';c.stroke(p);}
const bedPaths=new Map();
function rockBeds(c,id){let rows=bedPaths.get(id);if(!rows){rows=(beds[id]||[]).map(([color,points])=>({color,p:path(points)}));bedPaths.set(id,rows);}for(const row of rows){c.fillStyle=row.color;c.fill(row.p);}}
function shape(t,b){let q=cache.get(t);if(q?.source===t.vertices&&q.version===b.sceneVersion)return q;const ps=C.poly(t),contour=t.id==='s8-ground'?b.honroMap?.bier?.primaryContour:null,pairs=contour?contour.slice(1).map((z,i)=>[contour[i],z].map(p=>({x:p[0],y:p[1]}))):(t.honroWalkEdges||[]).map(i=>[ps[i],ps[(i+1)%ps.length]]),edges=pairs.filter(([a,z])=>a&&z&&Math.abs(a.x-z.x)>.001),rim=new Path2D();for(const[a,z]of edges){rim.moveTo(a.x,a.y+5);rim.lineTo(z.x,z.y+5);}q={source:t.vertices,version:b.sceneVersion,body:path(ps),edges,rim};cache.set(t,q);return q;}
function terrain(c,t,b){if(!active(b)||!t.id?.startsWith('s8-'))return false;const q=shape(t,b),earth=t.id==='s8-ground',wood=t.mat==='wood',branch=/branch/.test(t.id),stone=/reflector|cover|stone/.test(t.id),top=earth?2600:t.y,depth=earth?3000:Math.min(800,Math.max(40,t.h));c.save();c.clip(q.body);const gr=c.createLinearGradient(0,top,0,top+depth);gr.addColorStop(0,wood?'#908367':earth?'#6c7868':'#7a877c');gr.addColorStop(.42,wood?'#605d47':earth?'#4d6357':'#536c64');gr.addColorStop(1,wood?'#35483c':earth?'#2a4440':'#304a46');c.fillStyle=gr;c.fill(q.body);
 if(earth){
  // Broad asymmetrical sediment faces, not repeated geometric stamps. The
  // exposed earth mass and a dressed human-sized stone stay distinct scales.
  for(const[ps,col]of[[[[0,4290],[1720,4110],[2420,4090],[3050,4610],[3240,5500],[0,5500]],'#adab7b19'],[[[3550,4870],[5000,4890],[5810,4670],[5520,5300],[3890,5500]],'#173f3c44'],[[[6730,4480],[7240,3970],[7610,3510],[8180,3070],[8130,3660],[7450,4450],[7110,5060]],'#99a07126'],[[[8660,2770],[9600,2770],[9600,3890],[9100,3490]],'#afac791c']]){c.fillStyle=col;c.fill(path(ps));}
  for(const[a,z]of q.edges){c.fillStyle='#8a9177';c.fill(path([[a.x,a.y],[z.x,z.y],[z.x,z.y+31],[a.x,a.y+31]]));c.fillStyle='#5d735b';c.fill(path([[a.x,a.y+31],[z.x,z.y+31],[z.x,z.y+78],[a.x,a.y+78]]));}
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
 if(!wood){rockBeds(c,t.id);rockSeams(c,t.id);}
 c.strokeStyle=wood?'#d2bf8e99':'#d0c8a494';c.lineWidth=earth?8:6;c.stroke(q.rim);c.restore();return true;}
const oldTerrain=S.terrain;S.terrain=function(c,t){if(terrain(c,t,this.battle))return;return oldTerrain.call(this,c,t);};
let bracketPaths;
const landmarkLayer=S._landmarkLayer;
S._landmarkLayer=function(c,list,layer){const out=landmarkLayer.call(this,c,list,layer),b=this.battle;if(!active(b)||layer!=='structural-back')return out;
 const beams=[[[5590,4430],[5680,4412]],[[5590,4350],[5680,4276]],[[5590,4465],[5780,4412]],[[7810,3135],[7940,3027]],[[8320,3135],[8230,3027]]];
 if(!bracketPaths)bracketPaths=beams.map(([a,z])=>{const dx=z[0]-a[0],dy=z[1]-a[1],len=Math.hypot(dx,dy),nx=-dy/len*10,ny=dx/len*10;return {a,z,p:path([[a[0]-nx,a[1]-ny],[z[0]-nx,z[1]-ny],[z[0]+nx,z[1]+ny],[a[0]+nx,a[1]+ny]])};});c.save();for(const {a,z,p}of bracketPaths){c.fillStyle='#384b40';c.fill(p);c.strokeStyle='#7a8060';c.lineWidth=3;c.beginPath();c.moveTo(...a);c.lineTo(...z);c.stroke();}c.restore();return out;};
// Preserve the quiet compact names of the two bindings without durability UI.
const sealId=id=>id==='bier-knot-0'||id==='bier-knot-1',oldHealth=S.terrainHealth;
S.terrainHealth=function(c,b,w,h){
 if(!active(b))return oldHealth.call(this,c,b,w,h);
 const targets=this.terrainHealthTargets(b),other=targets.filter(t=>!sealId(t.id));
 if(other.length)oldHealth.call(this,c,{...b,terrain:b.terrain.filter(t=>!sealId(t.id))},w,h);
 const z=1/Math.max(.01,this.scale),left=this.x-w*z/2,right=this.x+w*z/2,top=this.y-h*z/2,bottom=this.y+h*z/2;
 for(const t of targets.filter(t=>sealId(t.id))){
  if(t.x<left-100*z||t.x>right+100*z||t.y<top-70*z||t.y>bottom+70*z)continue;
  c.save();c.translate(t.x,t.y);c.scale(z,z);c.textAlign='center';c.textBaseline='middle';c.font='600 10px sans-serif';
  c.strokeStyle='#17352ed9';c.lineWidth=3;c.strokeText(t.label,0,-10,180);c.fillStyle='#f0e4c9';c.fillText(t.label,0,-10,180);
  c.restore();
 }
};
const skyAsset=b=>b.honroMap?.bierArt?.backdropAsset;
function skyRaster(asset){let q=skyCache.get(asset);if(q)return q;const cv=G.document.createElement('canvas'),[x,y,w,h]=asset.vector.viewBox;cv.width=1800;cv.height=1100;const c=G.HonroVisualStyle?.context(cv.getContext('2d'),'SKY')||cv.getContext('2d');c.scale(cv.width/w,cv.height/h);c.translate(-x,-y);G.HonroVectorArt.draw(c,asset,{x:0,y:0,scale:1,rotation:0});skyCache.set(asset,cv);return cv;}
const background=S.background;S.background=function(c,w,h,b){if(!active(b)||b.honroMap?.stage8LocationPaint?.revision===1||!skyAsset(b))return background.call(this,c,w,h,b);const cv=skyRaster(skyAsset(b)),frame=G.HonroEnvironment.act1BackdropFrame(this,w,h,b,cv.width,cv.height);c.drawImage(cv,frame.x,frame.y,frame.w,frame.h);this.environmentStats={groups:0,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};};
G.HonroStage8BierArt={active,shape,terrain,skyAsset,skyRaster,omitReadability:()=>false};
})(globalThis);
