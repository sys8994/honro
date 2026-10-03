(function(G){'use strict';
const C=G.HONRO_CORE,B=G.HonroBounds,cache=new WeakMap();
const backdropCache=new WeakMap();
function polygon(ps){const p=new Path2D();ps.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;}
function rock(c,b){const g=c.createLinearGradient(0,0,0,b.height+1800);g.addColorStop(0,'#293439');g.addColorStop(.38,'#37444a');g.addColorStop(.70,'#303e44');g.addColorStop(1,'#17272e');return g;}
function prepare(t,b){const source=t.vertices||t;let q=cache.get(t);if(q?.source===source)return q;
 const pts=C.poly(t).map(p=>[p.x,p.y]),shape=polygon(pts),contour=pts.filter(([x,y])=>y>1&&y<b.height&&x>=0&&x<=b.width),edge=new Path2D();
 contour.forEach(([x,y],i)=>i?edge.lineTo(x,y):edge.moveTo(x,y));
 // A village shelf has a top and an underside. Its strata follow only the
 // walkable top; drawing short polygons around both faces made floating tiles.
 const surface=t.id==='village-upper'?contour.slice(0,Math.ceil(contour.length/2)):contour;
 const sign=t.honroCeiling?-1:1,taper=x=>Math.min(1,Math.max(0,Math.min(x,b.width-x)/700)),band=(near,far,phase)=>polygon([
  ...surface.map(([x,y])=>[x,y+sign*(near+14*Math.sin(x/760+phase))*taper(x)]),
  ...surface.slice().reverse().map(([x,y])=>[x,y+sign*(far+36*Math.sin(x/1090+phase))*taper(x)])
 ]);
 // Two continuous mineral beds preserve the large cave silhouette without
 // the rectangular seams of the old seven-node chunks.
 const bands=surface.length>2?[band(16,145,0),band(185,365,1.2)]:[];
 q={source,shape,edge,bands};cache.set(t,q);return q;
}
function terrain(c,t,b){const q=prepare(t,b);c.save();c.fillStyle=rock(c,b);c.fill(q.shape);c.clip(q.shape);
 q.bands.forEach((p,i)=>{c.fillStyle=i?'#142a3040':'#81918827';c.fill(p);});
 c.strokeStyle=t.honroCeiling?'#7081836b':'#a2aea38a';c.lineWidth=t.honroCeiling?3:4;c.lineJoin='round';c.stroke(q.edge);c.restore();
}
function background(c,b,scene,w,h){
 const floor=b.terrain.find(t=>t.id==='act2-floor');if(!floor)return;
 let q=backdropCache.get(b);
 if(!q||q.floor!==floor||q.source!==floor.vertices){
  const ridge=new Path2D(),planes=[],sample=x=>C.topAt(floor,x,b.height)-1150-190*Math.sin(x/910)-95*Math.sin(x/325);
  for(let x=0;x<=b.width;x+=260){const y=sample(x);x?ridge.lineTo(x,y):ridge.moveTo(x,y);}
  ridge.lineTo(b.width,b.height+500);ridge.lineTo(0,b.height+500);ridge.closePath();
  for(const x of [760,2250,3880,5660,7440,9160].filter(x=>x<b.width-300)){
   const y=sample(x),p=new Path2D();p.moveTo(x-240,y+350);p.bezierCurveTo(x-105,y+40,x+65,y-120,x+270,y-55);p.lineTo(x+500,b.height+250);p.lineTo(x-360,b.height+250);p.closePath();planes.push(p);
  }
  q={floor,source:floor.vertices,ridge,planes};backdropCache.set(b,q);
 }
 c.save();c.translate(w/2,h/2);c.scale(scene.scale,scene.scale);c.translate(-scene.x,-scene.y);
 const wash=c.createLinearGradient(0,b.height*.35,0,b.height);wash.addColorStop(0,'#26383d');wash.addColorStop(.55,'#34474a');wash.addColorStop(1,'#26383d');
 c.fillStyle=wash;c.globalAlpha=.56;c.fill(q.ridge);
 c.fillStyle='#5b6a67';c.globalAlpha=.095;for(const p of q.planes)c.fill(p);
 c.strokeStyle='#70807b';c.globalAlpha=.15;c.lineWidth=8;c.stroke(q.ridge);
 c.restore();
}
function enclosure(c,b,w,h){const v=B.visual(b,w,h,this.scale),key=[b.sceneVersion,b.width,b.height,v.left,v.top,v.right,v.bottom].join(':');
 let q=this._caveEnclosure;if(!q||q.key!==key||q.source!==b.honroCaveEnvelope){
  // Overlap the play rectangle by a few world units. Two coincident canvas
  // edges otherwise leave a one-pixel antialias seam at extreme camera pans.
  const fill=new Path2D();fill.rect(v.left,v.top,v.right-v.left,v.bottom-v.top);fill.rect(4,4,b.width-8,b.height-8);
  const tunnels=(b.honroCaveEnvelope.portals||[]).map(p=>{const left=p.side==='left',x=left?0:b.width,sign=left?-1:1,far=x+sign*780;
   const end=left?Math.min(far,v.left-350):Math.max(far,v.right+350),mid=(p.top+p.bottom)/2,path=new Path2D(),rim=new Path2D();
   path.moveTo(x-sign*6,p.top);path.bezierCurveTo(x+sign*160,p.top-45,x+sign*300,p.top+25,end,mid-25);
   path.lineTo(end,mid+25);path.bezierCurveTo(x+sign*390,p.bottom+40,x+sign*150,p.bottom+5,x-sign*6,p.bottom);path.closePath();
   // The fill closes across the entrance, but the visible rim must not:
   // stroking that closing edge drew a straight wall through the open mouth.
   rim.moveTo(x-sign*6,p.top);rim.bezierCurveTo(x+sign*160,p.top-45,x+sign*300,p.top+25,end,mid-25);
   rim.moveTo(end,mid+25);rim.bezierCurveTo(x+sign*390,p.bottom+40,x+sign*150,p.bottom+5,x-sign*6,p.bottom);
   return{...p,x,far:end,path,rim};});
  const strata=[];
  for(const y of [-1180,-520,b.height+420,b.height+1080]){
   const p=new Path2D();p.moveTo(v.left-100,y+170);
   p.bezierCurveTo(b.width*.22,y-160,b.width*.34,y+120,b.width*.53,y-75);
   p.bezierCurveTo(b.width*.70,y-260,b.width*.83,y+155,v.right+100,y-35);strata.push(p);
  }
  q={key,source:b.honroCaveEnvelope,fill,tunnels,strata};this._caveEnclosure=q;this._skirtBuilds=(this._skirtBuilds||0)+1;
 }
 // The very same world-space color field is used on both sides of all four
 // boundaries. There is no sky cap, vertical seam or outdoor shoulder here.
 c.save();c.fillStyle=rock(c,b);c.fill(q.fill,'evenodd');
 c.save();c.clip(q.fill,'evenodd');
 // Two slow, wide strata make the outer roof read as the same massive rock,
 // including at portrait zoom when the camera sees far above play bounds.
 q.strata.forEach((p,i)=>{c.strokeStyle=i%2?'#78878236':'#121f254d';c.lineWidth=i%2?75:130;c.stroke(p);c.strokeStyle='#89958c20';c.lineWidth=5;c.stroke(p);});
 c.restore();
 for(const p of q.tunnels){const g=c.createLinearGradient(p.x,0,p.far,0);g.addColorStop(0,'#203035');g.addColorStop(.45,'#172a30');g.addColorStop(1,'#344249');c.fillStyle=g;c.fill(p.path);
  c.strokeStyle='#75867c38';c.lineWidth=3;c.stroke(p.rim);}
 c.restore();this.overscanStats={bounds:v,paths:1+q.tunnels.length,builds:this._skirtBuilds,cave:true,portals:q.tunnels.length};
}
G.HonroCaveRock={terrain,enclosure,background,prepare,rock};
})(globalThis);
