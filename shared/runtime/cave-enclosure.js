(function(G){'use strict';
const C=G.HONRO_CORE,B=G.HonroBounds,cache=new WeakMap();
const backdropCache=new WeakMap();
const formCache=new WeakMap();
function polygon(ps){const p=new Path2D();ps.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;}
function rock(c,b){const g=c.createLinearGradient(0,0,0,b.height+1800);g.addColorStop(0,'#303136');g.addColorStop(.38,'#414247');g.addColorStop(.70,'#38393e');g.addColorStop(1,'#292a2f');return g;}
function prepare(t,b){const source=t.vertices||t;let q=cache.get(t);if(q?.source===source)return q;
 const pts=C.poly(t).map(p=>[p.x,p.y]),shape=polygon(pts),contour=pts.filter(([x,y])=>y>1&&y<b.height&&x>=0&&x<=b.width),edge=new Path2D();
 contour.forEach(([x,y],i)=>i?edge.lineTo(x,y):edge.moveTo(x,y));
 // A village shelf has a top and an underside. Its strata follow only the
 // walkable top; drawing short polygons around both faces made floating tiles.
 const surface=t.id.startsWith('village-')?contour.slice(0,Math.ceil(contour.length/2)):contour;
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
 q.bands.forEach((p,i)=>{c.fillStyle=i?'#17181b40':'#77787d27';c.fill(p);});
 c.strokeStyle=t.honroCeiling?'#7071766b':'#999a9e8a';c.lineWidth=t.honroCeiling?3:4;c.lineJoin='round';c.stroke(q.edge);c.restore();
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
 const wash=c.createLinearGradient(0,b.height*.35,0,b.height);wash.addColorStop(0,'#0c0d0f');wash.addColorStop(.55,'#131416');wash.addColorStop(1,'#0c0d0f');
 c.fillStyle=wash;c.globalAlpha=.45;c.fill(q.ridge);
 c.fillStyle='#303136';c.globalAlpha=.06;for(const p of q.planes)c.fill(p);
 c.strokeStyle='#303136';c.globalAlpha=.08;c.lineWidth=8;c.stroke(q.ridge);
 let forms=formCache.get(b);
 if(!forms||forms.source!==b.honroCaveForms){
  const paths=[];
  const spike=(x,root,tip,width,down)=>{
   const p=new Path2D(),s=down?1:-1;
   p.moveTo(x-width,root-s*12);p.lineTo(x-width*.68,root+s*42);
   p.lineTo(x-width*.38,root+s*Math.abs(tip-root)*.55);
   p.lineTo(x+width*.08,tip);p.lineTo(x+width*.36,root+s*Math.abs(tip-root)*.62);
   p.lineTo(x+width*.72,root+s*35);p.lineTo(x+width,root-s*12);p.closePath();paths.push(p);
  };
  for(const f of b.honroCaveForms||[]){
   if(f.type==='column'){
    const p=new Path2D(),r=f.width,t=f.top-15,d=f.bottom+15;
    p.moveTo(f.x-r,t);p.lineTo(f.x-r*.74,t+(d-t)*.25);p.lineTo(f.x-r*.53,t+(d-t)*.52);
    p.lineTo(f.x-r*.87,d);p.lineTo(f.x+r*.83,d);p.lineTo(f.x+r*.57,t+(d-t)*.55);
    p.lineTo(f.x+r*.72,t+(d-t)*.23);p.lineTo(f.x+r,t);p.closePath();paths.push(p);
   }else if(f.type==='stalagmite')spike(f.x,f.bottom,f.bottom-f.length,f.width,false);
   else if(f.type==='stalactite')spike(f.x,f.top,f.top+f.length,f.width,true);
   else{
    spike(f.x-f.width*.62,f.top,f.top+f.length*.78,f.width*.68,true);
    spike(f.x+f.width*.65,f.top,f.top+f.length*1.14,f.width*.53,true);
    spike(f.x+f.width*.1,f.bottom,f.bottom-f.length*.55,f.width*.55,false);
   }
  }
  forms={source:b.honroCaveForms,paths};formCache.set(b,forms);
 }
 c.globalAlpha=.74;c.fillStyle='#242529';for(const p of forms.paths)c.fill(p);
 c.globalAlpha=.38;c.strokeStyle='#34353a';c.lineWidth=3;for(const p of forms.paths)c.stroke(p);
 if(b.honroCaveHangingTarget){const t=b.honroCaveHangingTarget;
  c.globalAlpha=.7;c.strokeStyle='#756f60';c.lineWidth=4;c.beginPath();
  c.moveTo(t.x,t.roofY-5);c.lineTo(t.x+5,t.roofY+80);c.lineTo(t.x,t.targetY+4);c.stroke();
 }
 c.restore();
}
function approach(c,b,scene,w,h){const a=b.honroCaveApproach;if(!a)return;
 c.save();c.translate(w/2,h/2);c.scale(scene.scale,scene.scale);c.translate(-scene.x,-scene.y);
 const v=B.visual(b,w,h,scene.scale);
 const g=c.createLinearGradient(a.start,0,a.end,0);g.addColorStop(0,'#07080a00');g.addColorStop(.45,'#07080abc');g.addColorStop(.78,'#07080af5');g.addColorStop(1,'#07080a');
 c.fillStyle=g;c.fillRect(a.start,v.top,v.right-a.start,v.bottom-v.top);
 if(v.right>b.width){const upper=new Path2D(),lower=new Path2D();
  upper.moveTo(b.width-12,v.top);upper.lineTo(v.right,v.top);upper.lineTo(v.right,a.roofEnd+75);upper.lineTo(b.width+700,a.roofEnd+40);upper.lineTo(b.width-12,a.roofEnd-1);upper.closePath();
  lower.moveTo(b.width-12,a.floorEnd-1);lower.lineTo(b.width+700,a.floorEnd+55);lower.lineTo(v.right,a.floorEnd+105);lower.lineTo(v.right,v.bottom);lower.lineTo(b.width-12,v.bottom);lower.closePath();
  c.fillStyle=rock(c,b);c.fill(upper);c.fill(lower);
 }
 c.restore();
}
function exit(c,b,scene,w,h){const roof=b.terrain.find(t=>t.id==='exit-overhang');if(!roof)return;
 const v=B.visual(b,w,h,scene.scale);
 const lip=Math.max(...C.poly(roof).filter(p=>p.x===0).map(p=>p.y)),left=v.left;
 c.save();c.translate(w/2,h/2);c.scale(scene.scale,scene.scale);c.translate(-scene.x,-scene.y);
 // The last stage starts inside the cave. Continue the existing roof and dark
 // hollow outside Play Bounds so its edge is never a vertical painted wall.
 const dark=c.createLinearGradient(left,0,1100,0);dark.addColorStop(0,'#08090b');dark.addColorStop(.6,'#08090b');dark.addColorStop(1,'#08090b00');
 c.fillStyle=dark;c.fillRect(left,v.top,1100-left,Math.max(0,v.bottom-v.top));
 const p=new Path2D();p.moveTo(left,v.top);p.lineTo(10,v.top);p.lineTo(10,lip+4);
 p.bezierCurveTo(-220,lip-35,-560,lip-105,left,lip-Math.min(300,Math.abs(left)*.08));p.closePath();
 c.fillStyle=rock(c,b);c.fill(p);
 c.strokeStyle='#7071766b';c.lineWidth=3;c.beginPath();c.moveTo(10,lip+4);
 c.bezierCurveTo(-220,lip-35,-560,lip-105,left,lip-Math.min(300,Math.abs(left)*.08));c.stroke();
 // The generic floor skirt supplies the matching lower rock mass.
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
 q.strata.forEach((p,i)=>{c.strokeStyle=i%2?'#77787d36':'#1a1b1f4d';c.lineWidth=i%2?75:130;c.stroke(p);c.strokeStyle='#8b8c9220';c.lineWidth=5;c.stroke(p);});
 c.restore();
 for(const p of q.tunnels){const g=c.createLinearGradient(p.x,0,p.far,0);g.addColorStop(0,'#08090b');g.addColorStop(.45,'#0a0b0d');g.addColorStop(1,'#34353a');c.fillStyle=g;c.fill(p.path);
  c.strokeStyle='#76777b38';c.lineWidth=3;c.stroke(p.rim);}
 c.restore();this.overscanStats={bounds:v,paths:1+q.tunnels.length,builds:this._skirtBuilds,cave:true,portals:q.tunnels.length};
}
G.HonroCaveRock={terrain,enclosure,background,approach,exit,prepare,rock};
})(globalThis);
