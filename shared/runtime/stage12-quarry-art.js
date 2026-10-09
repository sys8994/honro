(function(G){'use strict';
// Stage-local painting over the exact physical granite union. No independent
// collision, event clock, actor movement, or save writes live in this module.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,cache=new WeakMap(),skyCache=new WeakMap();
const active=b=>b?.honroStage===12&&b.honroQuarryRevision===1;
const path=ps=>{const p=new Path2D();ps.forEach((v,i)=>i?p.lineTo(v.x??v[0],v.y??v[1]):p.moveTo(v.x??v[0],v.y??v[1]));p.closePath();return p;};
const forms=[
 ['M-30-30H615L567 150 445 285 178 309-30 455Z','M770-30H1030V1030H595L532 765 695 514 608 341Z','M-30 643L155 547 402 611 545 526 720 648 1030 562V1030H-30Z'],
 ['M-30-30H358L583 108 539 316 235 417-30 365Z','M650-30H1030V1030H709L620 736 788 507 678 321Z','M-30 640L203 541 456 664 634 593 799 711 1030 692V1030H-30Z'],
 ['M-30-30H540L650 217 394 363 229 345-30 535Z','M851-30H1030V1030H619L581 846 727 636 666 428Z','M-30 745L282 643 521 751 705 626 1030 744V1030H-30Z']
].map(xs=>xs.map(d=>new Path2D(d)));
function prepare(t,b){let q=cache.get(t);if(q?.source===t.vertices&&q.version===b.sceneVersion)return q;const ps=C.poly(t),indices=t.honroWalkEdges||[],edges=indices.map(i=>[ps[i],ps[(i+1)%ps.length]]).filter(([a,z])=>a&&z&&Math.abs(a.x-z.x)>.001),rim=new Path2D();for(const[a,z]of edges){rim.moveTo(a.x,a.y+7);rim.lineTo(z.x,z.y+7);}let key=0;for(const ch of t.id)key+=ch.charCodeAt(0);q={source:t.vertices,version:b.sceneVersion,shape:path(ps),edges,rim,forms:forms[key%forms.length]};cache.set(t,q);return q;}
function terrain(c,t,b){if(!active(b)||!t.honroQuarry)return false;const q=prepare(t,b);c.save();c.clip(q.shape);const gradient=c.createLinearGradient(t.x,t.y,t.x+t.w*.16,t.y+Math.min(t.h,2400));gradient.addColorStop(0,t.honroCeiling?'#586a6c':'#98a397');gradient.addColorStop(.27,'#72898a');gradient.addColorStop(.64,'#45666d');gradient.addColorStop(1,'#203c4e');c.fillStyle=gradient;c.fill(q.shape);
 if(t.honroQuarryVeil){c.fillStyle='#28484e';c.fill(q.shape);c.strokeStyle='#a2af9388';c.lineWidth=4;c.beginPath();c.moveTo(t.x+t.w*.3,t.y+70);c.lineTo(t.x+t.w*.65,t.y+t.h*.31);c.lineTo(t.x+t.w*.35,t.y+t.h*.64);c.lineTo(t.x+t.w*.68,t.y+t.h-48);c.stroke();}
 else{c.save();c.translate(t.x,t.y);c.scale(t.w/1000,Math.min(t.h,2300)/1000);for(const[i,color]of ['#c1c2a92f','#17384789','#1838475c'].entries()){c.fillStyle=color;c.fill(q.forms[i]);}c.restore();c.strokeStyle='#d0d2b16f';c.lineWidth=15;c.stroke(q.rim);
  // Three authored broad faces distinguish the work areas. No repeated
  // rectangular tile/stamp detail: the rock's cut and shadow have a direction.
  const panels=t.id==='sq-north-quarry'?[
   [[5350,3762],[5800,3715],[6260,3560],[6400,3650],[6250,3900],[6000,4020],[5590,3910]],
   [[6740,3550],[7130,3390],[7510,3320],[7790,3410],[7730,3720],[7500,4030],[7290,4170],[7000,3990]],
   [[7900,3500],[8270,3720],[8610,3980],[8550,4140],[8220,4190],[7990,3990]]
  ]:t.id==='sq-west-quarry'?[
   [[3320,4395],[3720,4310],[4090,4135],[4260,4190],[4210,4410],[3890,4510],[3470,4480]],
   [[4520,4070],[4850,3935],[5180,3910],[5330,4080],[5160,4270],[4920,4580],[4680,4530]],
   [[5410,4180],[5730,4410],[5900,4530],[5630,4660],[5400,4560],[5240,4370]]
  ]:[];
  for(const [i,ps] of panels.entries()){c.fillStyle=['#bec3a736','#aebaa837','#213f5066'][i];c.fill(path(ps));}
  const seams=t.id==='sq-north-quarry'?[[[7560,3350],[7520,3600],[7680,3800],[7560,4050],[7310,4210]],[[6190,3590],[6090,3750],[6200,3920],[6030,4030]]]:t.id==='sq-west-quarry'?[[[4850,3935],[4780,4150],[4870,4330],[4700,4570]],[[4080,4140],[3980,4320],[4070,4480]]]:[];
  for(const ps of seams){c.lineWidth=13;c.strokeStyle='#1a3b4977';c.beginPath();ps.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.save();c.translate(-7,-9);c.lineWidth=3;c.strokeStyle='#c3c5a43d';c.stroke();c.restore();}
  if(t.id==='sq-lower-ground'){c.fillStyle='#b2ae8138';c.fill(path([[6060,4822],[6210,4805],[6510,4805],[6930,4805],[6990,4825],[6560,4835],[6250,4830],[6060,4850]]));}

 }c.restore();return true;}
const baseTerrain=S.terrain;S.terrain=function(c,t){if(terrain(c,t,this.battle))return;return baseTerrain.call(this,c,t);};
const skyAsset=b=>b.honroMap?.quarryArt?.backdropAsset;
function skyRaster(asset){let q=skyCache.get(asset);if(q)return q;const cv=G.document.createElement('canvas'),[x,y,w,h]=asset.vector.viewBox;cv.width=1800;cv.height=1080;const c=cv.getContext('2d');c.scale(cv.width/w,cv.height/h);c.translate(-x,-y);G.HonroVectorArt.draw(c,asset,{x:0,y:0,scale:1,rotation:0});skyCache.set(asset,cv);return cv;}
const background=S.background;S.background=function(c,w,h,b){if(!active(b)||!skyAsset(b))return background.call(this,c,w,h,b);const cv=skyRaster(skyAsset(b)),frame=G.HonroEnvironment.act1BackdropFrame(this,w,h,b,cv.width,cv.height);c.drawImage(cv,frame.x,frame.y,frame.w,frame.h);this.environmentStats={groups:0,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};};
const shoe=new Path2D('M-26-3Q-20-17-2-19Q18-17 25-6L20 0Q-1 6-24 2Z'),lace=new Path2D('M-16-12L-9 1M-5-17L0 3M7-15L11 2');
function storyProp(c,b){if(!active(b)||!b.honroState?.quarry?.shoePlaced)return;const m=b.honroMarkers.find(m=>m.id==='sign');if(!m)return;c.save();c.translate(m.x+44,m.y-9);c.fillStyle='#ac9b6c';c.fill(shoe);c.strokeStyle='#574f38';c.lineWidth=2;c.stroke(shoe);c.stroke(lace);c.restore();}
const live=S.liveWater;S.liveWater=function(c,b){const out=live?.call(this,c,b);storyProp(c,b);return out;};
// Shared exposed-edge generation still owns every walkable edge and union.
const omitReadability=(group,b)=>active(b)&&group.id==='sq-turning-veil'&&!!group.broken;
G.HonroStage12QuarryArt={active,prepare,terrain,skyAsset,skyRaster,storyProp,omitReadability};
})(globalThis);
