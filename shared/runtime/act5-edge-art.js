(function(G){'use strict';
// Continue the *painted* boundary, not collision boxes. Empty shaft gaps stay
// transparent. This cache is bounded to one stage and contains no game state.
const S=G.HonroScene.prototype,draw=S.landmark,bounds=S._landmarkPaintBounds,stage42Parts=new WeakMap(),stage44Parts=new WeakMap(),stage45Parts=new WeakMap();
function camp(scene,c,l){
 const V=G.HonroVisualStyle;if(V)c=V.context(c,V.classify(l,scene.battle,l.asset)==='gameplay'?'gameplay':V.depth(l,l.asset));
 const scale=l.scale??1,w=l.asset.vector.viewBox[2],h=l.asset.vector.viewBox[3];
 c.save();c.translate(l.x,l.y);c.scale(scale,scale);
 c.save();c.clip(new Path2D('M-1400 -500H300V560L190 650Q200 720 300 750V1200H-1400Z'));
 G.HonroVectorArt.draw(c,l.asset.campExterior.west,{x:-1300,y:-100,scale:1.1});c.restore();
 c.fillStyle='#3a3029';c.fillRect(300,h,w-300,2400-h);
 c.save();c.clip(new Path2D('M1796 350H4000V4400H1902V827L1893 770L1902 710L1887 655L1902 600L1885 557L1902 530H1820V514Q1794 505 1790 488Q1790 476 1820 466Q1841 456 1838 438V428H1796Z'));
 G.HonroVectorArt.draw(c,l.asset.campExterior.east,{x:1700,y:-25,scale:2.4});c.restore();
 c.save();c.clip(new Path2D('M-1400 1000Q-600 1010 300 1000Q900 800 1700 780Q1850 760 2020 645Q2900 655 4010 650V3500H-1400Z'));G.HonroVectorArt.draw(c,l.asset.campExterior.deep,{x:-1400,y:600,scale:3.05});c.restore();c.restore();
}
function active(l){return /^act5:near:4[1-9]$|^act5:near:50$/.test(l.asset?.id||'');}
function prepare(scene,l){
 const a=l.asset,v=a.vector.viewBox,w=v[2],h=v[3],r=Math.min(1,1024/Math.max(w,h)),pw=Math.ceil(w*r),ph=Math.ceil(h*r),pad=Math.ceil(Math.min(w*.28,420)*r);
 if(scene._act5Edge?.asset===a)return scene._act5Edge;
 if(scene._act5Edge)scene._releaseRasterCanvas(scene._act5Edge.canvas);
 const src=scene._makeLayerCanvas(pw,ph),s=src.getContext('2d');
 s.scale(r,r);draw.call(scene,s,{...l,x:0,y:0,scale:1,rotation:0});
 const cv=scene._makeLayerCanvas(pw+2*pad,ph+pad),c=cv.getContext('2d');
 // Sample the canonical boundary once. No reflected/repeated texture and no
 // silhouettes invented across the open centre of a vertical stage.
 for(const side of [-1,1]){
  const x=side<0?2:pw-3;
  for(let d=-2;d<pad;d++){const t=Math.max(0,d/pad),shift=Math.round((Math.sin(t*2.5)*.7+Math.sin(t*6)*.15)*pad*.22),dx=side<0?pad-d-1:pw+pad+d;
   c.drawImage(src,x,0,1,ph,dx,shift,1,ph);
  }
 }
 c.drawImage(src,0,ph-3,pw,1,pad,ph-2,pw,pad+2);
 // Corners continue only pixels actually occupied at the source corners.
 c.drawImage(src,2,ph-3,1,1,0,ph,pad,pad);
 c.drawImage(src,pw-3,ph-3,1,1,pw+pad,ph,pad,pad);
 // Fade chromatic detail rapidly into the deep rock shadow instead of
 // stretching fine source markings into bright horizontal ribbons.
 c.globalCompositeOperation='source-atop';
 for(const side of [-1,1]){const x=side<0?pad:pad+pw,outer=side<0?0:cv.width,g=c.createLinearGradient(x,0,outer,0);g.addColorStop(0,'#151b2000');g.addColorStop(.18,'#151b20cc');g.addColorStop(1,'#151b20f5');c.fillStyle=g;c.fillRect(side<0?0:pw+pad,0,pad,cv.height);}
 const dark=c.createLinearGradient(0,ph,0,ph+pad);dark.addColorStop(0,'#151b2000');dark.addColorStop(.25,'#151b20cc');dark.addColorStop(1,'#151b20f5');c.fillStyle=dark;c.fillRect(0,ph,cv.width,pad);
 c.globalCompositeOperation='destination-in';
 const horizontal=c.createLinearGradient(0,0,cv.width,0);
 horizontal.addColorStop(0,'#0000');horizontal.addColorStop(pad*.7/cv.width,'#000');horizontal.addColorStop(1-pad*.7/cv.width,'#000');horizontal.addColorStop(1,'#0000');
 c.fillStyle=horizontal;c.fillRect(0,0,cv.width,cv.height);
 const vertical=c.createLinearGradient(0,ph,0,ph+pad);vertical.addColorStop(0,'#000');vertical.addColorStop(.25,'#000');vertical.addColorStop(1,'#0000');
 c.fillStyle=vertical;c.fillRect(0,0,cv.width,cv.height);
 scene._releaseRasterCanvas(src);
 return scene._act5Edge={asset:a,canvas:cv,pad:pad/r,w:cv.width/r,h:cv.height/r};
}
S.landmark=function(c,l){
 if(l.asset?.id==='act5:near:45'&&l.asset.continuousBody&&!l.rotation){
  const a=l.asset,z=l.scale??1,V=G.HonroVisualStyle,cc=V?V.context(c,V.classify(l,this.battle,a)==='gameplay'?'gameplay':V.depth(l,a)):c;
  let props=stage45Parts.get(a);if(!props){const part=(index,clip,key)=>({...a,vector:{...a.vector,clips:{...a.vector.clips,[key]:clip},root:{tag:'g',children:[a.vector.root.children[index]]}}});props={main:part(1,a.preservedClips.props,'props-a'),wall:part(0,a.preservedClips.wall,'body-a'),shrub:part(1,a.preservedClips.shrub,'props-a')};stage45Parts.set(a,props);}
  cc.save();cc.translate(l.x,l.y);cc.scale(z,z);G.HonroVectorArt.draw(cc,a.continuousBody,{x:0,y:0,scale:1});G.HonroVectorArt.draw(cc,props.wall,{x:0,y:0,scale:1});G.HonroVectorArt.draw(cc,props.main,{x:0,y:0,scale:1});G.HonroVectorArt.draw(cc,props.shrub,{x:-64.36,y:-112.2,scale:1});cc.restore();return;
 }

 if(l.asset?.id==='act5:near:44'&&l.asset.rootExterior&&!l.rotation){
  const V=G.HonroVisualStyle,cc=V?V.context(c,V.classify(l,this.battle,l.asset)==='gameplay'?'gameplay':V.depth(l,l.asset)):c,z=l.scale??1;
  cc.save();cc.translate(l.x,l.y);cc.scale(z,z);G.HonroVectorArt.draw(cc,l.asset.rootExterior,{x:0,y:0,scale:1});cc.restore();
  cc.save();cc.translate(l.x,l.y);cc.scale(z,z);let upper=stage44Parts.get(l.asset);if(!upper){upper={...l.asset,vector:{...l.asset.vector,clips:{...l.asset.vector.clips,a:l.asset.rootUpperClip}}};stage44Parts.set(l.asset,upper);}G.HonroVectorArt.draw(cc,upper,{x:0,y:0,scale:1});cc.restore();return;
 }

 if(l.asset?.id==='act5:near:42'&&l.asset.edgeWall&&!l.rotation){
  const a=l.asset,z=l.scale??1;
  const V=G.HonroVisualStyle,cc=V?V.context(c,V.classify(l,this.battle,a)==='gameplay'?'gameplay':V.depth(l,a)):c;
  draw.call(this,c,l);
  cc.save();cc.translate(l.x,l.y);cc.scale(z,z);
  // BODY already owns its source-contact and exterior-alpha clips.
  // A redundant concave outer clip produced a flat fill outside the cliff.
  cc.save();
  G.HonroVectorArt.draw(cc,a.edgeWall,{x:0,y:0,scale:1});cc.restore();
  cc.save();cc.clip(new Path2D('M0 0H2022V700H0Z'));G.HonroVectorArt.draw(cc,a.edgeSurface,{x:0,y:0,scale:1});cc.restore();
  let parts=stage42Parts.get(a);
  if(!parts){const props={...a,vector:{...a.vector,root:{tag:'g',children:[a.vector.root.children[1]]}}};
   parts={props,withoutCutShrub:new Path2D('M-10000 -10000H10000V10000H-10000Z '+a.edgeSurface.params.croppedEdgeShrub),wholeShrub:new Path2D(a.edgeSurface.params.wholeShrub)};stage42Parts.set(a,parts);}
  cc.save();cc.clip(parts.withoutCutShrub,'evenodd');G.HonroVectorArt.draw(cc,parts.props,{x:0,y:0,scale:1});cc.restore();
  cc.save();cc.translate(-533,6.7);cc.clip(parts.wholeShrub);G.HonroVectorArt.draw(cc,parts.props,{x:0,y:0,scale:1});cc.restore();
  cc.restore();return;
 }
 if(l.asset?.id==='act5:near:41'&&l.asset.campExterior&&!l.rotation){
 const s=l.scale??1;c.save();c.translate(l.x,l.y);c.scale(s,s);c.beginPath();c.rect(-10000,-10000,20000,20000);c.moveTo(0,0);c.lineTo(300,0);c.lineTo(300,560);c.lineTo(190,650);c.quadraticCurveTo(200,720,300,750);c.lineTo(300,827);c.lineTo(0,827);c.closePath();c.clip('evenodd');c.clip(new Path2D('M0 0H1902V350H1796V428H1838V438Q1841 456 1820 466Q1790 476 1790 488Q1794 505 1820 514V530H1902V827H0Z'));c.scale(1/s,1/s);c.translate(-l.x,-l.y);draw.call(this,c,l);c.restore();camp(this,c,l);
 c.save();c.translate(l.x,l.y);c.scale(s,s);c.clip(new Path2D('M300 428H1838V438H300ZM300 514H1902V529H300ZM0 545Q35 546 70 548L130 555L220 562L280 566L300 557V565L280 574L220 570L130 563L70 556Q35 550 0 545Z'));c.scale(1/s,1/s);c.translate(-l.x,-l.y);draw.call(this,c,l);c.restore();return;}

 if(!active(l)||l.rotation)return draw.call(this,c,l);
 const q=prepare(this,l),scale=l.scale??1;
 draw.call(this,c,l);
 c.save();c.translate(l.x,l.y);c.scale(scale,scale);c.drawImage(q.canvas,-q.pad,0,q.w,q.h);c.restore();
};
S._landmarkPaintBounds=function(l){const q=bounds.call(this,l);if(!q||!active(l)||l.rotation)return q;if(l.asset?.id==='act5:near:45'&&l.asset.continuousBody){const s=l.scale??1,a=l.asset.continuousBody.bounds;return{left:Math.min(q.left,l.x+a.x*s),right:Math.max(q.right,l.x+(a.x+a.w)*s),top:Math.min(q.top,l.y+a.y*s),bottom:Math.max(q.bottom,l.y+(a.y+a.h)*s)};}if(l.asset?.id==='act5:near:44'&&l.asset.rootExterior){const s=l.scale??1;return{left:q.left-400*s,right:q.right+400*s,top:q.top,bottom:q.bottom+300*s};}if(l.asset?.id==='act5:near:42'){const s=l.scale??1;return{left:q.left-900*s,right:q.right+900*s,top:q.top,bottom:q.bottom+468*s};}if(l.asset?.id==='act5:near:41'&&l.asset.campExterior){const s=l.scale??1;return{left:l.x-2500*s,right:l.x+(l.asset.vector.viewBox[2]+2500)*s,top:q.top,bottom:l.y+3500*s};}const p=Math.min(l.asset.vector.viewBox[2]*.28,420)*(l.scale??1);return{left:q.left-p,right:q.right+p,top:q.top,bottom:q.bottom+p};};
// Artwork-only continuation beyond the tile-domain paint rectangle. Physics bounds unchanged.
const domainPaint=S._drawTerrainDomainTiles;
S._drawTerrainDomainTiles=function(c,b,w,h){
 domainPaint.call(this,c,b,w,h);if(![41,42,44,45].includes(b.honroStage))return;
 const v=G.HonroBounds.viewport(this,w,h),d=b.honroTerrainBounds,size=512/this._worldRasterScale(b,w);
 const left=Math.floor(d.left/size)*size,top=Math.floor(d.top/size)*size,right=(Math.floor(d.right/size)+1)*size,bottom=(Math.floor(d.bottom/size)+1)*size;
 if(v.left>=left&&v.right<=right&&v.top>=top&&v.bottom<=bottom)return;
 c.save();c.beginPath();c.rect(v.left-1,v.top-1,v.right-v.left+2,v.bottom-v.top+2);c.rect(left,top,right-left,bottom-top);c.clip('evenodd');
 for(const l of G.HonroTerrainDomain.materialLandmarks(b))if(l.asset?.id==='act5:near:'+b.honroStage)this.landmark(c,l);
 c.restore();
};
const readability=S.terrainReadability;
S.terrainReadability=function(c,b,view){
 if(![41,42,44,45].includes(b.honroStage))return readability.call(this,c,b,view);
 const q=G.HonroTerrainReadability.prepare(b),saved=[],removed=[],keptWalkable=[];
 for(const group of q.groups){const edge=new Path2D();saved.push([group,group.edge]);for(const v of group.segments){const p=v.a,z=v.z,close=!v.walkable&&((Math.abs(p.x-z.x)<.01&&(Math.abs(p.x)<.01||Math.abs(p.x-b.width)<.01))||(Math.abs(p.y-z.y)<.01&&p.y>=b.height-360));if(close)removed.push({id:group.id,...v});if(v.walkable)keptWalkable.push(v);if(!close){edge.moveTo(p.x,p.y);edge.lineTo(z.x,z.y);}}group.edge=edge;}
 G.HonroEdgeClosureQA={removed,keptWalkableCount:keptWalkable.length,walkableRemoved:removed.filter(v=>v.walkable).length};try{return readability.call(this,c,b,view);}finally{for(const [g,e]of saved)g.edge=e;}
};
G.HonroAct5EdgeArt={version:3};
})(globalThis);
