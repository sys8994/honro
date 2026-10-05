(function(G){'use strict';
const C=G.HONRO_CORE,B=G.HonroBounds,cache=new WeakMap();
const backdropCache=new WeakMap();
const formCache=new WeakMap();
function polygon(ps){const p=new Path2D();ps.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;}
function rock(c,b){const g=c.createLinearGradient(0,0,0,b.height+1800);g.addColorStop(0,'#303136');g.addColorStop(.38,'#414247');g.addColorStop(.70,'#38393e');g.addColorStop(1,'#292a2f');return g;}
function prepare(t,b){const source=t.vertices||t;let q=cache.get(t);if(q?.source===source)return q;
 const pts=C.poly(t).map(p=>[p.x,p.y]),shape=polygon(pts),contour=pts.filter(([x,y])=>y>1&&y<b.height&&x>=0&&x<=b.width),edge=new Path2D();
 contour.forEach(([x,y],i)=>i?edge.lineTo(x,y):edge.moveTo(x,y));
 // Each suspended bench has a walkable top and an underside. Bedding follows
 // only the top; folding the band around both faces creates a square cutoff.
 const bench=/^(village-|switchback-|temple-gallery)/.test(t.id);
 const surface=bench?contour.slice(0,Math.ceil(contour.length/2)):contour;
 const sign=t.honroCeiling?-1:1,band=(near,far,phase)=>polygon([
  ...surface.map(([x,y])=>[x,y+sign*(near+17*Math.sin(x/610+phase)+11*Math.sin(x/1870+phase))]),
  ...surface.slice().reverse().map(([x,y])=>[x,y+sign*(far+38*Math.sin(x/970+phase)+19*Math.sin(x/2410+phase))])
 ]);
 // Bedding, a slipped dark seam, and a deeper massive bed follow the carved
 // support. They are quiet broad mineral planes, not repeated short tiles.
 const bands=surface.length>2?[
  band(10,88,.1),band(105,220,1.8),band(245,390,.6),band(430,680,2.9)
 ]:[];
 const joints=[];
 if(surface.length>5)for(let x=650,j=0;x<b.width-380;x+=1200+(j%3)*290,j++){
  const y=C.topAt(t,x,t.honroCeiling?b.height:0),s=sign,p=new Path2D();
  p.moveTo(x-90,y+s*35);p.bezierCurveTo(x-40,y+s*145,x+110,y+s*240,x+45,y+s*430);
  p.bezierCurveTo(x+15,y+s*330,x-90,y+s*220,x-90,y+s*35);p.closePath();joints.push(p);
 }
 q={source,shape,edge,bands,joints};cache.set(t,q);return q;
}
function terrain(c,t,b){if(G.HonroAct2SpatialArt?.active(b))return G.HonroAct2SpatialArt.terrain(c,t,b);const q=prepare(t,b);c.save();c.fillStyle=rock(c,b);c.fill(q.shape);c.clip(q.shape);
 const tones=['#62636a29','#17181d52','#77787e1b','#14151a46'];
 q.bands.forEach((p,i)=>{c.fillStyle=tones[i];c.fill(p);});
 c.fillStyle='#11121655';for(const p of q.joints)c.fill(p);
 c.strokeStyle=t.honroCeiling?'#7071766b':'#999a9e8a';c.lineWidth=t.honroCeiling?3:4;c.lineJoin='round';c.stroke(q.edge);c.restore();
}
function background(c,b,scene,w,h){
 const floor=b.terrain.find(t=>t.id==='act2-floor');if(!floor)return;
 let q=backdropCache.get(b);
 if(!q||q.floor!==floor||q.source!==floor.vertices){
  const ridge=new Path2D(),planes=[],leftY=C.topAt(floor,0,b.height),rightY=C.topAt(floor,b.width,b.height),
   leftSlope=(C.topAt(floor,220,b.height)-leftY)/220,
   rightSlope=(rightY-C.topAt(floor,b.width-220,b.height))/220,
   sample=x=>(x<0?leftY+x*leftSlope:x>b.width?rightY+(x-b.width)*rightSlope:C.topAt(floor,x,b.height))
    -1150-190*Math.sin(x/910)-95*Math.sin(x/325);
  const ridgeXs=[-5000,0,b.width,b.width+5000];
  for(let x=-4940;x<b.width+5000;x+=260)ridgeXs.push(x);
  ridgeXs.sort((a,z)=>a-z).forEach((x,i)=>i?ridge.lineTo(x,sample(x)):ridge.moveTo(x,sample(x)));
  ridge.lineTo(b.width+5000,b.height+500);ridge.lineTo(-5000,b.height+500);ridge.closePath();
  for(const x of [760,2250,3880,5660,7440,9160].filter(x=>x<b.width-300)){
   const y=sample(x),p=new Path2D();p.moveTo(x-240,y+350);p.bezierCurveTo(x-105,y+40,x+65,y-120,x+270,y-55);p.lineTo(x+500,b.height+250);p.lineTo(x-360,b.height+250);p.closePath();planes.push(p);
  }
  q={floor,source:floor.vertices,ridge,planes};backdropCache.set(b,q);
 }
 c.save();c.translate(w/2,h/2);c.scale(scene.scale,scene.scale);c.translate(-scene.x,-scene.y);
 // Fade the rear ridge in after the west portal. The outside tunnel is drawn
 // above this backdrop, so a full-strength ridge at x=0 makes a dark vertical
 // rectangle even though both playable rock edges are connected.
 const wash=c.createLinearGradient(0,0,850,0);
 wash.addColorStop(0,'#13141600');wash.addColorStop(1,'#13141673');
 c.fillStyle=wash;c.globalAlpha=1;c.fill(q.ridge);
 c.fillStyle='#303136';c.globalAlpha=.06;for(const p of q.planes)c.fill(p);
 c.strokeStyle='#303136';c.globalAlpha=.08;c.lineWidth=8;c.stroke(q.ridge);
 let forms=formCache.get(b);
 if(!forms||forms.source!==b.honroCaveForms){
  const paths=[];
  const drip=(x,root,length,width,down,lean=0)=>{
   const s=down?1:-1,tip=root+s*length,body=new Path2D(),shade=new Path2D(),line=new Path2D();
   body.moveTo(x-width*1.12,root-s*15);
   body.bezierCurveTo(x-width*.91,root+s*length*.13,x-width*.60,root+s*length*.18,x-width*.47,root+s*length*.40);
   body.bezierCurveTo(x-width*.31,root+s*length*.68,x+lean-width*.20,tip-s*length*.17,x+lean,tip);
   body.bezierCurveTo(x+lean+width*.11,tip-s*length*.15,x+width*.46,root+s*length*.42,x+width*.65,root+s*length*.23);
   body.bezierCurveTo(x+width*.82,root+s*length*.07,x+width*.92,root+s*12,x+width*1.18,root-s*15);body.closePath();
   shade.moveTo(x-width*.20,root+s*6);shade.bezierCurveTo(x+width*.24,root+s*length*.18,x+width*.17,root+s*length*.60,x+lean,tip);
   shade.bezierCurveTo(x+width*.39,root+s*length*.45,x+width*.53,root+s*length*.19,x+width*.70,root+s*4);shade.closePath();
   line.moveTo(x-width*.72,root+s*9);line.bezierCurveTo(x-width*.43,root+s*length*.17,x-width*.29,root+s*length*.39,x+lean-width*.09,tip-s*length*.22);
   paths.push({body,shade,line});
  };
  const curtain=(f)=>{const {x,top,width:w,length:l}=f,p=new Path2D(),shade=new Path2D(),line=new Path2D();
   p.moveTo(x-w*1.38,top-11);p.bezierCurveTo(x-w*.98,top+l*.26,x-w*.95,top+l*.55,x-w*.68,top+l*.72);
   p.bezierCurveTo(x-w*.43,top+l*.58,x-w*.36,top+l*.88,x-w*.12,top+l*.95);
   p.bezierCurveTo(x+w*.08,top+l*.70,x+w*.18,top+l*.89,x+w*.32,top+l*.76);
   p.bezierCurveTo(x+w*.68,top+l*.55,x+w*.85,top+l*.25,x+w*1.2,top-10);p.closePath();
   shade.moveTo(x-w*.32,top+8);shade.bezierCurveTo(x-w*.35,top+l*.43,x-w*.18,top+l*.69,x-w*.12,top+l*.95);
   shade.bezierCurveTo(x+w*.38,top+l*.67,x+w*.60,top+l*.36,x+w*.55,top+5);shade.closePath();
   line.moveTo(x-w*.83,top+7);line.bezierCurveTo(x-w*.57,top+l*.31,x-w*.53,top+l*.53,x-w*.67,top+l*.71);
   paths.push({body:p,shade,line});
  };
  for(const f of b.honroCaveForms||[]){
   if(f.type==='column'){
    const p=new Path2D(),shade=new Path2D(),line=new Path2D(),r=f.width,t=f.top-24,d=f.bottom+24,h=d-t;
    p.moveTo(f.x-r*1.15,t);p.bezierCurveTo(f.x-r*.72,t+h*.17,f.x-r*.57,t+h*.36,f.x-r*.63,t+h*.54);
    p.bezierCurveTo(f.x-r*.53,t+h*.72,f.x-r*.94,d-h*.08,f.x-r*1.05,d);
    p.lineTo(f.x+r*1.02,d);p.bezierCurveTo(f.x+r*.69,d-h*.16,f.x+r*.55,t+h*.60,f.x+r*.68,t+h*.43);
    p.bezierCurveTo(f.x+r*.60,t+h*.22,f.x+r*.94,t+h*.12,f.x+r*1.1,t);p.closePath();
    shade.moveTo(f.x,t);shade.bezierCurveTo(f.x+r*.44,t+h*.30,f.x+r*.25,t+h*.70,f.x+r*.55,d);
    shade.lineTo(f.x+r,d);shade.bezierCurveTo(f.x+r*.65,t+h*.45,f.x+r*.89,t+h*.22,f.x+r*1.1,t);shade.closePath();
    line.moveTo(f.x-r*.68,t+h*.1);line.bezierCurveTo(f.x-r*.31,t+h*.39,f.x-r*.43,t+h*.62,f.x-r*.72,d-h*.1);
    paths.push({body:p,shade,line});
   }else if(f.type==='stalagmite')drip(f.x,f.bottom,f.length,f.width,false,(f.x%5-2)*8);
   else if(f.type==='stalactite')drip(f.x,f.top,f.length,f.width,true,(f.x%7-3)*6);
   else if(f.type==='drapery')curtain(f);
   else{
    drip(f.x-f.width*.65,f.top,f.length*.68,f.width*.58,true,-f.width*.2);
    drip(f.x+f.width*.45,f.top,f.length*1.07,f.width*.44,true,f.width*.15);
    drip(f.x+f.width*.03,f.bottom,f.length*.61,f.width*.64,false,-f.width*.12);
   }
  }
  forms={source:b.honroCaveForms,paths};formCache.set(b,forms);
 }
 c.globalAlpha=.82;c.fillStyle='#26272c';for(const p of forms.paths)c.fill(p.body);
 c.globalAlpha=.46;c.fillStyle='#111216';for(const p of forms.paths)c.fill(p.shade);
 c.globalAlpha=.19;c.strokeStyle='#686971';c.lineWidth=4;for(const p of forms.paths)c.stroke(p.line);
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
 if(v.right>b.width){const upper=new Path2D(),lower=new Path2D(),start=b.width-12,surface=[];
  for(let x=start;x<v.right+160;x+=160){const d=x-start;
   surface.push([x,a.roofEnd-1+100*(1-Math.exp(-d/400))+12*Math.sin(d/540)]);
  }
  upper.moveTo(start,v.top);upper.lineTo(surface.at(-1)[0],v.top);
  for(let i=surface.length-1;i>=0;i--)upper.lineTo(...surface[i]);upper.closePath();
  lower.moveTo(b.width-12,a.floorEnd-1);lower.lineTo(b.width+700,a.floorEnd+55);lower.lineTo(v.right,a.floorEnd+105);lower.lineTo(v.right,v.bottom);lower.lineTo(b.width-12,v.bottom);lower.closePath();
  c.fillStyle=rock(c,b);c.fill(upper);c.fill(lower);
  c.save();c.clip(upper);
  const tones=['#62636a29','#17181d52','#77787e1b','#14151a46'];
  for(const [i,[near,far,phase]] of [[10,88,.1],[105,220,1.8],[245,390,.6],[430,680,2.9]].entries()){
   const band=polygon([
    ...surface.map(([x,y])=>[x,y-(near+17*Math.sin(x/610+phase)+11*Math.sin(x/1870+phase))]),
    ...surface.slice().reverse().map(([x,y])=>[x,y-(far+38*Math.sin(x/970+phase)+19*Math.sin(x/2410+phase))])
   ]);
   c.fillStyle=tones[i];c.fill(band);
  }
  c.restore();c.strokeStyle='#7071766b';c.lineWidth=3;c.beginPath();
  surface.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
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
function portalLip(b,p,v,foundationOnly=false){
 const side=p.side==='left'?-1:1,x=side<0?0:b.width,
  limit=side<0?v.left:v.right,extent=Math.abs(limit-x)+120,
  roof=b.terrain.find(t=>t.id==='cave-roof'),
  floor=foundationOnly?b.terrain.find(t=>t.id==='act2-floor'):side<0?(b.terrain.find(t=>t.id==='switchback-upper'||t.id==='village-upper')||b.terrain.find(t=>t.id==='act2-floor')):b.terrain.find(t=>t.id==='act2-floor'),
  inside=x-side*220,
  roofInside=roof?C.topAt(roof,inside,b.height):p.top,
  floorInside=floor?C.topAt(floor,inside,0):p.bottom,
  slope=(a,z)=>Math.max(-.28,Math.min(.28,(a-z)/220)),
  bend=(start,m,d,phase)=>start+m*650*(1-Math.exp(-d/650))+52*(Math.sin(d/780+phase)-Math.sin(phase));
 const upper=[],lower=[];
 for(let d=0;d<extent;d+=160){upper.push([x+side*d,bend(p.top,slope(p.top,roofInside),d,.5)]);lower.push([x+side*d,bend(p.bottom,slope(p.bottom,floorInside),d,1.4)]);}
 upper.push([x+side*extent,bend(p.top,slope(p.top,roofInside),extent,.5)]);
 lower.push([x+side*extent,bend(p.bottom,slope(p.bottom,floorInside),extent,1.4)]);
 const shape=(surface,ceiling)=>polygon([...surface,[surface.at(-1)[0],ceiling?v.top-100:v.bottom+100],[surface[0][0],ceiling?v.top-100:v.bottom+100]]);
 const bands=(surface,sign)=>[[10,88,.1,'#62636a29'],[105,220,1.8,'#17181d52'],[245,390,.6,'#77787e1b'],[430,680,2.9,'#14151a46']].map(([near,far,phase,color])=>({color,path:polygon([
   ...surface.map(([px,py])=>[px,py+sign*(near+17*Math.sin(px/610+phase)+11*Math.sin(px/1870+phase))]),
   ...surface.slice().reverse().map(([px,py])=>[px,py+sign*(far+38*Math.sin(px/970+phase)+19*Math.sin(px/2410+phase))])
  ])}));
 const edge=surface=>{const path=new Path2D();surface.forEach(([px,py],i)=>i?path.lineTo(px,py):path.moveTo(px,py));return path;};
 const lips=[
  {shape:shape(upper,true),bands:bands(upper,-1),edge:edge(upper),ceiling:true},
  {shape:shape(lower,false),bands:bands(lower,1),edge:edge(lower),ceiling:false}
 ];
 return foundationOnly?[lips[1]]:lips;
}
function enclosure(c,b,w,h){if(G.HonroAct2SpatialArt?.active(b))return G.HonroAct2SpatialArt.enclosure(c,b,w,h,this);const v=B.visual(b,w,h,this.scale),key=[b.sceneVersion,b.width,b.height,v.left,v.top,v.right,v.bottom].join(':');
 let q=this._caveEnclosure;if(!q||q.key!==key||q.source!==b.honroCaveEnvelope){
  // Overlap the play rectangle by a few world units. Two coincident canvas
  // edges otherwise leave a one-pixel antialias seam at extreme camera pans.
  const fill=new Path2D();fill.rect(v.left,v.top,v.right-v.left,v.bottom-v.top);fill.rect(4,4,b.width-8,b.height-8);
  const tunnels=(b.honroCaveEnvelope.portals||[]).map(p=>{const left=p.side==='left',x=left?0:b.width,sign=left?-1:1,far=x+sign*780;
   const end=left?Math.min(far,v.left-350):Math.max(far,v.right+350),gap=p.bottom-p.top,
    outerTop=p.top-gap*.06,outerBottom=p.bottom+gap*.09,path=new Path2D(),rim=new Path2D();
   path.moveTo(x-sign*6,p.top);path.bezierCurveTo(x+sign*180,p.top-gap*.10,x+sign*440,outerTop-gap*.06,end,outerTop);
   path.lineTo(end,outerBottom);path.bezierCurveTo(x+sign*440,outerBottom+gap*.04,x+sign*150,p.bottom+gap*.08,x-sign*6,p.bottom);path.closePath();
   // The fill closes across the entrance, but the visible rim must not:
   // stroking that closing edge drew a straight wall through the open mouth.
   rim.moveTo(x-sign*6,p.top);rim.bezierCurveTo(x+sign*180,p.top-gap*.10,x+sign*440,outerTop-gap*.06,end,outerTop);
   rim.moveTo(end,outerBottom);rim.bezierCurveTo(x+sign*440,outerBottom+gap*.04,x+sign*150,p.bottom+gap*.08,x-sign*6,p.bottom);
   return{...p,x,far:end,path,rim};});
  const strata=[];
  for(const y of [-1180,-520,b.height+420,b.height+1080]){
   const p=new Path2D();p.moveTo(v.left-100,y+170);
   p.bezierCurveTo(b.width*.22,y-160,b.width*.34,y+120,b.width*.53,y-75);
   p.bezierCurveTo(b.width*.70,y-260,b.width*.83,y+155,v.right+100,y-35);strata.push(p);
  }
  // A folded room returns to the west at a lower elevation. Open a broad
  // visual side chamber there; otherwise the exterior rock ends as a ruler-
  // straight wall at x=0 even though the lower route continues inside.
  const lowerMouths=[],lowerLips=[];
  const foundation=b.terrain.find(t=>t.id==='act2-floor');
  for(const portal of b.honroCaveEnvelope.portals||[])if(portal.side==='left'&&foundation){
   const low=C.topAt(foundation,0,0),gap=low-portal.bottom;if(gap<700)continue;
   const shelf=b.terrain.find(t=>t.id==='switchback-upper'||t.id==='village-upper');
   const edgeYs=shelf?C.poly(shelf).filter(p=>Math.abs(p.x)<1).map(p=>p.y):[];
   const underside=edgeYs.length?Math.max(...edgeYs):portal.bottom+175;
   const far=Math.min(v.left-200,-900),near=160,top=underside-25,path=new Path2D();
   path.moveTo(far,top-180);
   path.bezierCurveTo(far*.57,top-220,-220,top-110,near,top+80);
   path.lineTo(near,v.bottom+160);path.lineTo(far,v.bottom+160);path.closePath();lowerMouths.push(path);
   lowerLips.push(...portalLip(b,{side:'left',top,bottom:low},v,true));
  }
  q={key,source:b.honroCaveEnvelope,fill,tunnels,strata,lips:(b.honroCaveEnvelope.portals||[]).flatMap(p=>portalLip(b,p,v)),lowerMouths,lowerLips};this._caveEnclosure=q;this._skirtBuilds=(this._skirtBuilds||0)+1;
 }
 // The very same world-space color field is used on both sides of all four
 // boundaries. There is no sky cap, vertical seam or outdoor shoulder here.
 c.save();c.fillStyle=rock(c,b);c.fill(q.fill,'evenodd');
 c.save();c.clip(q.fill,'evenodd');
 // Two slow, wide strata make the outer roof read as the same massive rock,
 // including at portrait zoom when the camera sees far above play bounds.
 q.strata.forEach((p,i)=>{c.strokeStyle=i%2?'#77787d36':'#1a1b1f4d';c.lineWidth=i%2?75:130;c.stroke(p);c.strokeStyle='#8b8c9220';c.lineWidth=5;c.stroke(p);});
 c.restore();
 for(const p of q.tunnels){const g=c.createLinearGradient(p.x,0,p.far,0);g.addColorStop(0,'#08090b');g.addColorStop(.55,'#090a0c');g.addColorStop(1,'#101114');c.fillStyle=g;c.fill(p.path);
  c.strokeStyle='#76777b38';c.lineWidth=3;c.stroke(p.rim);}
 const drawLip=lip=>{c.fillStyle=rock(c,b);c.fill(lip.shape);c.save();c.clip(lip.shape);
  for(const band of lip.bands){c.fillStyle=band.color;c.fill(band.path);}c.restore();
  c.strokeStyle=lip.ceiling?'#7071766b':'#999a9e8a';c.lineWidth=lip.ceiling?3:4;c.stroke(lip.edge);
 };
 for(const lip of q.lips)drawLip(lip);
 c.fillStyle='#08090b';for(const mouth of q.lowerMouths)c.fill(mouth);
 for(const lip of q.lowerLips)drawLip(lip);
 c.restore();this.overscanStats={bounds:v,paths:1+q.tunnels.length,builds:this._skirtBuilds,cave:true,portals:q.tunnels.length};
}
G.HonroCaveRock={terrain,enclosure,background,approach,exit,prepare,rock};
})(globalThis);
