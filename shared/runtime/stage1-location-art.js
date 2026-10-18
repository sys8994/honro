(function(G){'use strict';
// Stage1 presentation only. Every painted edge comes from the live solid;
// no scenery silhouette, collision, save revision or gameplay state is authored here.
let earthCard,rockCards,branchBark;
const S=G.HonroScene.prototype,C=G.HONRO_CORE,P=G.HonroPaintedPilots,geometry=new WeakMap(),fields=new WeakMap();
const active=b=>b?.honroStage===1&&P.active(b),ready=()=>P.ready('forestRock')&&P.ready('forestSoil')&&P.ready('bark')&&P.ready('pineA');
function closed(points){const p=new Path2D();points.forEach((v,i)=>i?p.lineTo(v.x,v.y):p.moveTo(v.x,v.y));p.closePath();return p;}
function prepare(t){let q=geometry.get(t);if(q?.source===t.vertices)return q;const points=C.poly(t),edges=[];
 for(let i=0;i<points.length;i++){const a=points[i],z=points[(i+1)%points.length];if(z.x>a.x+.01)edges.push([a,z]);}
 const top=x=>{const e=edges.find(([a,z])=>x>=a.x-.01&&x<=z.x+.01);return e?e[0].y+(e[1].y-e[0].y)*(x-e[0].x)/(e[1].x-e[0].x):t.y;};
 q={source:t.vertices,path:closed(points),edges,top};geometry.set(t,q);return q;
}
function field(c,id){let q=fields.get(c);if(!q){q={};fields.set(c,q);}return q[id]||(q[id]=c.createPattern(P.images[id],'repeat'));}
const soilDepth=x=>7+3*Math.sin(x*.007)+2*Math.sin(x*.019+1.4);
const earthDepth=x=>28+110*Math.exp(-(((x-220)/420)**2))+90*Math.exp(-(((x-2220)/730)**2))+58*Math.exp(-(((x-4560)/300)**2));
function band(c,a,z,upper,lower,color){c.fillStyle=color;c.fill(closed([{x:a.x,y:a.y+upper(a.x)},{x:z.x,y:z.y+upper(z.x)},{x:z.x,y:z.y+lower(z.x)},{x:a.x,y:a.y+lower(a.x)}]));}
function soilPattern(c){
 if(!earthCard){earthCard=document.createElement('canvas');earthCard.width=1024;earthCard.height=320;const ec=earthCard.getContext('2d');ec.drawImage(P.images.forestSoil,0,0);ec.globalCompositeOperation='destination-in';const mask=ec.createLinearGradient(0,0,0,320);mask.addColorStop(0,'#000');mask.addColorStop(.35,'#000');mask.addColorStop(1,'#0000');ec.fillStyle=mask;ec.fillRect(0,0,1024,320);}
 let fs=fields.get(c);if(!fs){fs={};fields.set(c,fs);}return fs.earth||(fs.earth=c.createPattern(earthCard,'repeat-x'));
}
function cards(){
 if(rockCards)return rockCards;rockCards=[];
 for(const rect of [[0,0,1100,900],[320,80,1216,944],[80,280,1400,744]]){
  const cv=document.createElement('canvas');cv.width=768;cv.height=640;const c=cv.getContext('2d');c.drawImage(P.images.forestRock,...rect,0,0,768,640);c.globalCompositeOperation='destination-in';const g=c.createLinearGradient(0,0,768,0);g.addColorStop(0,'#0000');g.addColorStop(.2,'#000');g.addColorStop(.8,'#000');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(0,0,768,640);const v=c.createLinearGradient(0,0,0,640);v.addColorStop(0,'#0000');v.addColorStop(.08,'#000');v.addColorStop(.72,'#000');v.addColorStop(1,'#0000');c.fillStyle=v;c.fillRect(0,0,768,640);rockCards.push(cv);
 }return rockCards;
}
const random=n=>{const v=Math.sin(n*12.9898+78.233)*43758.5453;return v-Math.floor(v);};
function geologyTop(b,x){const ground=G.HonroTerrainDomain.render(b).filter(t=>!t.oneWay&&!t.honroElementCollision&&!t.broken&&x>=t.x&&x<=t.x+t.w);return ground.length?Math.min(...ground.map(t=>prepare(t).top(x))):1200;}
function rock(c,t,b){const q=prepare(t),m=c.getTransform(),left=Math.max(t.x,-m.e/m.a-4),right=Math.min(t.x+t.w,(c.canvas.width-m.e)/m.a+4),small=t.honroElementCollision;
 c.save();c.clip(q.path);c.fillStyle='#303633';c.fill(q.path);
 if(small){
  // A single mineral face, not the earth/moss ledge above it. Cover-crop keeps
  // the source proportions; this solid never enters the ground's strip fade.
  const img=P.images.forestRock,rect=t.id.includes('boulder-b')?[1160,610,280,330]:[440,570,480,300];let [sx,sy,sw,sh]=rect;const aspect=t.w/t.h;
  if(sw/sh>aspect){const w=sh*aspect;sx+=(sw-w)/2;sw=w;}else{const h=sw/aspect;sy+=(sh-h)/2;sh=h;}
  c.drawImage(img,sx,sy,sw,sh,t.x,t.y,t.w,t.h);
  const shade=c.createLinearGradient(t.x,t.y,t.x+t.w*.8,t.y+t.h);shade.addColorStop(0,'#c8b9970c');shade.addColorStop(.45,'#20241f00');shade.addColorStop(1,'#18201e48');c.fillStyle=shade;c.fill(q.path);c.restore();return true;
 }
 else {
  // Unequal local outcrops overlap with soft material joins. Every world tile
  // visits the same cards in the same order; the two soil terrains share one
  // geological field across their boundary. No huge repeated cliff wallpaper.
  const textures=cards();for(let i=Math.floor((left-1300)/760);i<=Math.ceil(right/760);i++){
   const x=i*760+(random(i)-.5)*170,w=1080+random(i+7)*180,h=720+random(i+11)*130,y=geologyTop(b,x+w*.5)-120;
   c.drawImage(textures[Math.floor(random(i+23)*3)],x,y,w,h);
  }
 }
 const step=96;
 for(let x=Math.floor(left/step)*step;x<right;x+=step){const x0=Math.max(x,t.x),x1=Math.min(x+step,t.x+t.w);if(x1<=x0)continue;
  const y0=q.top(x0),y1=q.top(x1),slope=(y1-y0)/(x1-x0),depth=810;
  c.save();c.transform(1,slope,0,1,x0,y0);if(!small){const d=earthDepth((x0+x1)/2),soil=soilPattern(c);soil.setTransform(new DOMMatrix([.57,0,0,d/320,-x0,0]));c.fillStyle=soil;c.fillRect(0,0,x1-x0+.3,d);}const fade=c.createLinearGradient(0,0,0,depth);fade.addColorStop(0,'#19242800');fade.addColorStop(.28,'#19242826');fade.addColorStop(.68,'#1b272ad8');fade.addColorStop(1,'#20292a');c.fillStyle=fade;c.fillRect(0,-32,x1-x0+.3,Math.max(depth+32,t.y+t.h-y0));c.restore();
 }
 if(!small)for(const [a,z]of q.edges){
  // Thin wet earth and broken moss follow the exact playable contour. Their
  // transparency retains painted mineral detail instead of a flat green ribbon.
  band(c,a,z,()=>0,soilDepth,'#53473799');band(c,a,z,x=>soilDepth(x)*.5,x=>soilDepth(x)+10,'#342e2980');
  const moss=(a.x+z.x)*.5;if((moss>120&&moss<530)||(moss>1810&&moss<2220)||(moss>3030&&moss<3320)||(moss>4260&&moss<4480))band(c,a,z,()=>0,x=>4+2*Math.sin(x*.034),'#797b4b7a');
 }
 c.restore();return true;
}
function prepareBark(){
 if(!branchBark){
  // Sample clean trunk bark already loaded for Stage1. Rotate its lengthwise
  // grain onto the bough axis; the old roots/moss atlas strip read as planking.
  const img=P.images.pineA,cv=branchBark=document.createElement('canvas');cv.width=288;cv.height=72;const cc=cv.getContext('2d');cc.translate(0,72);cc.rotate(-Math.PI/2);cc.filter='saturate(.60) contrast(.94) brightness(.86)';cc.drawImage(img,img.naturalWidth*.34,img.naturalHeight*.45,img.naturalWidth*.13,img.naturalHeight*.16,0,0,72,288);cc.setTransform(1,0,0,1,0,0);cc.filter='none';cc.globalCompositeOperation='source-atop';cc.fillStyle='#65594f26';cc.fillRect(0,0,288,72);
 }
 return branchBark;
}
function branchSection(t,q,baseRight){if(q.branch)return q.branch;const ps=C.poly(t),underside=[];
 for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];if(z.x<a.x)underside.push([z,a]);}
 const bottom=x=>{const edge=underside.find(([a,z])=>x>=a.x&&x<=z.x);return edge?edge[0].y+(edge[1].y-edge[0].y)*(x-edge[0].x)/(edge[1].x-edge[0].x):q.top(x)+8;},west=baseRight??(t.id==='pine-branch-west'),baseX=west?t.x+t.w-10:t.x+10,baseY=(q.top(baseX)+bottom(baseX))/2,grain=[];
 for(const f of [.18,.38,.61,.81]){const p=new Path2D();for(let i=0;i<=12;i++){const u=i/12,x=t.x+8+(t.w-16)*u,top=q.top(x),thickness=Math.max(4,bottom(x)-top),taper=west?u:1-u,y=top+thickness*(.48+(f-.5)*(.46+.54*taper));i?p.lineTo(x,y):p.moveTo(x,y);}grain.push(p);}
 return q.branch={bottom,west,baseX,baseY,grain};
}
function branch(c,t,options={}){const q=prepare(t),section=branchSection(t,q,options.baseRight),dir=section.west?1:-1;c.save();
 // A short descending attachment sits inside the tree silhouette. Its upper
 // edge is curved and below the real top, so it never suggests another step.
 c.beginPath();c.moveTo(section.baseX+dir*35,section.baseY+17);c.quadraticCurveTo(section.baseX+dir*10,section.baseY+11,section.baseX-dir*12,section.baseY+3);const join=c.createLinearGradient(section.baseX+dir*35,section.baseY+17,section.baseX-dir*12,section.baseY+3);join.addColorStop(0,'#5a514600');join.addColorStop(.45,'#5a514666');join.addColorStop(1,'#3f392fc0');c.strokeStyle=join;c.lineWidth=10;c.lineCap='round';c.stroke();
 c.clip(q.path);c.fillStyle='#484036';c.fill(q.path);prepareBark();const m=c.getTransform(),left=Math.max(t.x,-m.e/m.a-4),right=Math.min(t.x+t.w,(c.canvas.width-m.e)/m.a+4);
 // The texture and round lower volume follow the actual bough contour. Every
 // span samples one continuous bough-length image, with no repeated end seam.
 for(let x=Math.floor(left/64)*64;x<right;x+=64){const x0=Math.max(x,t.x),x1=Math.min(x+64,t.x+t.w);if(x1<=x0)continue;const y0=q.top(x0),y1=q.top(x1),thickness=Math.max(10,(section.bottom((x0+x1)/2)-q.top((x0+x1)/2)));
  c.save();c.transform(1,(y1-y0)/(x1-x0),0,1,x0,y0);const sx=(x0-t.x)/t.w*branchBark.width,sw=(x1-x0)/t.w*branchBark.width;c.drawImage(branchBark,sx,0,sw,branchBark.height,0,0,x1-x0+.3,thickness+4);
  const g=c.createLinearGradient(0,0,0,thickness);g.addColorStop(0,'#b6a18b22');g.addColorStop(.28,'#76604c20');g.addColorStop(.7,'#30272288');g.addColorStop(1,'#21221dd4');c.fillStyle=g;c.fillRect(0,-8,x1-x0+.3,thickness+40);c.restore();
 }
 for(const [i,p]of section.grain.entries()){c.strokeStyle=i===1?'#b4a48c55':'#211f1ba0';c.lineWidth=i===1?1.2:1.6;c.lineCap='round';c.stroke(p);}
 for(const [a,z]of q.edges)band(c,a,z,()=>0,()=>1.5,'#c0b18a77');c.restore();return true;
}
function terrain(c,t,b){if(!active(b)||!ready()||t.broken||t.honroSeal)return false;if(t.honroElementCollision)return false;if(t.mat==='wood')return branch(c,t);if(['earth','soil','rock','stone'].includes(t.mat))return rock(c,t,b);return false;}
const oldTerrain=S.terrain;S.terrain=function(c,t){if(!terrain(c,t,this.battle))return oldTerrain.call(this,c,t);};
const oldLandmark=S.landmark;S.landmark=function(c,l){if(active(this.battle)&&ready()&&/^mockup-granite/.test(l.asset?.id||'')){
 for(const t of G.HonroTerrainDomain.render(this.battle))if(!t.broken&&(t.honroElementId===l.id||l.collisionIds?.includes(t.id)))rock(c,t,this.battle);return;
 }return oldLandmark.call(this,c,l);};
const oldZones=S.surfaceZones;S.surfaceZones=function(c,b){if(!active(b)||!ready())return oldZones.call(this,c,b);
 // Existing water and live-water remain owned by the common renderer.
 return oldZones.call(this,c,{...b,honroSurfaceZones:(b.honroSurfaceZones||[]).filter(z=>/water|current/.test(z.kind))});};
G.HonroStage1LocationArt={active,ready,terrain,prepare,paintRock:rock,paintBranch:branch,rockCards:cards,soilPattern};
})(globalThis);
