(function(G){'use strict';
// ACT1 outdoor art uses the same Canvas scene and live canonical terrain as
// gameplay. The authored support references are visual-only; old saves keep
// their own landscape, and ACT2 never enters this renderer.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,A=G.HonroEnvironmentArt,terrainCache=new WeakMap(),sceneCache=new WeakMap();
const active=b=>b?.honroStage>=1&&b.honroStage<=10&&b.honroMap?.act1Scene?.version===1;
const guardianBranch=(b,t)=>b.honroStage===10&&b.honroMap?.act1Scene?.guardianTree?.branches?.includes(t.id);
function poly(points){const p=new Path2D();points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;}
function line(points){const p=new Path2D();points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));return p;}
function liveTop(b,id,x,fallback){const t=b.terrain.find(t=>t.id===id&&!t.broken);return t?C.topAt(t,x,fallback):fallback;}
function pointIn(x,y,ps){let inside=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],z=ps[j];if((a.y>y)!==(z.y>y)&&x<(z.x-a.x)*(y-a.y)/(z.y-a.y)+a.x)inside=!inside;}return inside;}
function prepareTerrain(t,b){let q=terrainCache.get(t);if(q?.version===b.sceneVersion&&q.source===t.vertices)return q;const ps=C.poly(t),shape=poly(ps.map(p=>[p.x,p.y])),rim=new Path2D(),caps=[],planes=[],joints=[],edges=[],cliffPlanes=[];
 const peers=G.HonroTerrainDomain.render(b).filter(o=>o.id!==t.id&&!o.broken&&!o.oneWay&&!o.honroElementCollision),exposed=(x,y)=>!peers.some(o=>x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h&&pointIn(x,y,C.poly(o)));
 for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];if(z.x<=a.x||Math.abs((z.y-a.y)/(z.x-a.x))>1.36||!exposed((a.x+z.x)/2,(a.y+z.y)/2-3))continue;edges.push([a,z]);rim.moveTo(a.x,a.y);rim.lineTo(z.x,z.y);}
 const at=x=>{const e=edges.find(([a,z])=>x>=a.x&&x<=z.x);return e?e[0].y+(e[1].y-e[0].y)*(x-e[0].x)/(e[1].x-e[0].x):C.topAt(t,x,t.y);};
 // Material strata and large cut faces stay clipped inside each actual solid.
 // Unequal authored sites, rather than a fixed polygon tiling, divide masses.
 const features=(b.honroMap.act1Scene.rocks||[]).filter(r=>r.supportId===t.id);
 const anchors=features.length?features.map(r=>({x:r.x,w:Math.min(r.width,t.w*.65),depth:Math.min(r.height*.64,t.h*.75)})):[{x:t.x+t.w*.30,w:t.w*.56,depth:Math.min(760,t.h*.76)},{x:t.x+t.w*.77,w:t.w*.39,depth:Math.min(580,t.h*.6)}];
 for(const [i,r]of anchors.entries()){const l=Math.max(t.x,r.x-r.w*.52),rr=Math.min(t.x+t.w,r.x+r.w*.48),m=l+(rr-l)*(.57-i%2*.16),y=at(l),ry=at(rr),my=at(m),d=r.depth;
  if(rr-l<45||d<18)continue;planes.push({lit:poly([[l,y],[m,my],[m-(rr-l)*.08,my+d*.24],[m-(rr-l)*.11,my+d*.59],[l+(rr-l)*.27,y+d*.72],[l+(rr-l)*.08,y+d*.43]]),shadow:poly([[m,my],[rr,ry],[rr-(rr-l)*.08,ry+d*.21],[rr-(rr-l)*.13,ry+d*.51],[m+(rr-l)*.12,my+d*.74],[m-(rr-l)*.05,my+d]]),contact:line([[m,my+9],[m-(rr-l)*.1,my+d*.58],[m-(rr-l)*.05,my+d]])});
 }
 // A subdued weathered soil/stone cap describes the route itself. It follows
 // every compiled edge, including tiny original roughness and slope breaks.
 for(const [a,z]of edges)caps.push(poly([[a.x,a.y],[z.x,z.y],[z.x,z.y+24],[a.x,a.y+24]]));
 // The canyon is a real tall collision mass. Four unequal fracture planes
 // span its entire face instead of ending in a shallow band at the crest.
 if(b.honroStage===2&&/^(left-high-ground|right-cliff-ground)$/.test(t.id)){
  const mirror=t.id==='right-cliff-ground',map=ps=>poly(ps.map(([u,v])=>[t.x+(mirror?1-u:u)*t.w,t.y+v*t.h]));
  for(const ps of [ [[.05,.01],[.45,.02],[.35,.24],[.23,.37],[.26,.67],[.07,.91]], [[.45,.02],[.70,.11],[.65,.35],[.42,.52],[.31,.82],[.22,.94],[.26,.67],[.23,.37],[.35,.24]], [[.71,.11],[.94,.23],[.90,.54],[.75,.63],[.68,.94],[.36,.98],[.47,.68],[.66,.43]], [[.06,.45],[.22,.39],[.26,.67],[.16,.92],[.03,.99]] ])cliffPlanes.push(map(ps));
 }
 const wood=t.mat==='wood';if(wood){const n=Math.max(1,Math.min(12,Math.floor(t.w/90)));for(let i=1;i<n;i++){const x=t.x+t.w*i/n,y=at(x);joints.push(line([[x,y+6],[x-4,Math.min(t.y+t.h,y+80)]]));}}
 q={source:t.vertices,version:b.sceneVersion,shape,rim,caps,planes,joints,edges,cliffPlanes,wood};terrainCache.set(t,q);return q;
}
function groundGradient(c,t,b){const earth=t.mat==='earth'||t.surfaceKind==='soil',tall=t.h>500,top=tall?Math.min(...b.terrain.filter(q=>!q.oneWay&&!q.broken&&q.mat===t.mat).map(q=>q.y)):t.y,bottom=tall?b.height+30:t.y+t.h;
 const g=c.createLinearGradient(0,top,0,Math.max(top+60,bottom));g.addColorStop(0,earth?'#5a655e':'#62707a');g.addColorStop(.3,earth?'#3b4b47':'#43545e');g.addColorStop(.68,earth?'#283c3d':'#2e414b');g.addColorStop(1,earth?'#18282a':'#17282b');return g;}
const oldGradient=G.HonroTerrainGradient;G.HonroTerrainGradient=(c,t,b)=>active(b)&&t.mat!=='wood'&&!t.honroSeal?groundGradient(c,t,b):oldGradient(c,t,b);
const oldTerrain=S.terrain;S.terrain=function(c,t){const b=this.battle;if(!active(b)||t.honroElementCollision||t.honroSeal||t.mat==='crystal'||t.surfaceKind==='branch'||!t.indestructible)return oldTerrain.call(this,c,t);const q=prepareTerrain(t,b);c.save();
 if(guardianBranch(b,t)){
  // Retain the real collision silhouette and bright walkable top. Bark is a
  // paint-only substitution: stone resistance and projectile passage stay put.
  c.fillStyle=A.gradient(c,0,t.y,0,t.y+t.h,[[0,'#85846b'],[.22,'#626957'],[.66,'#394940'],[1,'#203633']]);c.fill(q.shape);c.clip(q.shape);
  c.strokeStyle='#253d34';c.lineWidth=6;for(const [a,z]of q.edges){c.beginPath();c.moveTo(a.x+10,a.y+22);c.bezierCurveTo(a.x+(z.x-a.x)*.35,a.y+33,z.x-(z.x-a.x)*.28,z.y+14,z.x-8,z.y+28);c.stroke();}
  c.strokeStyle='#c2c4a0';c.lineWidth=5;c.lineJoin='round';c.stroke(q.rim);c.restore();return;
 }
 const roof=/^(west-eave|east-eave|west-gallery|east-gallery|altar-platform)$/.test(t.id);c.fillStyle=/^climb-/.test(t.id)?'#405460':roof?'#2b3e48':q.wood?A.gradient(c,0,t.y,0,t.y+t.h,[[0,'#6b6d5b'],[.28,'#484d41'],[1,'#26352e']]):groundGradient(c,t,b);c.fill(q.shape);c.clip(q.shape);
 for(const [i,p]of q.cliffPlanes.entries()){c.fillStyle=['#a2b4bb28','#081e294f','#82979f24','#0e27335c'][i];c.fill(p);}
 for(const [i,f]of q.planes.entries()){c.fillStyle=q.wood?'#a5a27e1e':i%2?'#a2b0b71e':'#b0b9ba23';c.fill(f.lit);c.fillStyle=q.wood?'#16292369':'#10243155';c.fill(f.shadow);c.strokeStyle=q.wood?'#20352b50':'#172c3655';c.lineWidth=5;c.stroke(f.contact);}
 for(const cap of q.caps){c.fillStyle=q.wood?'#bdad781d':t.mat==='earth'?'#87927637':'#b9c2bc24';c.fill(cap);}c.strokeStyle='#1a2b2960';c.lineWidth=3;for(const j of q.joints)c.stroke(j);
 c.strokeStyle=q.wood?'#b7b298':/^climb-/.test(t.id)?'#95aaa3':'#b4c6c1';c.lineWidth=/^climb-/.test(t.id)?2:3.5;c.lineJoin='round';c.stroke(q.rim);c.restore();};
const FORMS={
 shoulder:{outline:[[-.66,.16],[-.61,-.17],[-.47,-.31],[-.30,-.35],[-.29,-.64],[-.14,-.76],[.08,-.78],[.25,-.62],[.31,-.35],[.48,-.27],[.64,.16]],faces:[[[ -.29,-.64],[-.14,-.76],[.02,-.73],[.09,-.52],[-.11,-.21],[-.29,-.30]],[[.09,-.52],[.25,-.62],[.31,-.35],[.48,-.27],[.58,.12],[.12,.15],[-.03,-.1]],[[-.6,-.15],[-.46,-.3],[-.29,-.30],[-.11,-.21],[-.24,.15],[-.57,.15]]]},
 buttress:{outline:[[-.61,.15],[-.58,-.27],[-.47,-.35],[-.40,-.65],[-.25,-.78],[-.20,-.93],[.03,-1],[.21,-.94],[.34,-.77],[.32,-.42],[.48,-.29],[.59,.15]],faces:[[[ -.20,-.93],[.03,-1],[.15,-.86],[.08,-.55],[-.05,-.39],[-.2,-.1],[-.31,-.21],[-.31,-.66]],[[.15,-.86],[.21,-.94],[.34,-.77],[.32,-.42],[.21,-.32],[.08,-.55]],[[-.57,-.23],[-.40,-.65],[-.25,-.78],[-.31,-.21],[-.22,.15],[-.55,.15]],[[.01,-.4],[.21,-.32],[.48,-.29],[.59,.15],[.16,.15],[.14,-.09]]]}
};
function prepareScene(b){let q=sceneCache.get(b);if(q?.source===b.honroMap.act1Scene&&q.version===b.sceneVersion)return q;const art=b.honroMap.act1Scene,rocks=[];
 for(const r of art.rocks||[]){const t=b.terrain.find(t=>t.id===r.supportId&&!t.broken);if(!t)continue;const form=FORMS[r.kind]||FORMS.shoulder,base=liveTop(b,r.supportId,r.x,r.y),foundations=b.terrain.filter(t=>!t.broken&&!t.oneWay&&!t.honroElementCollision&&t.y+t.h>=b.height),foot=px=>{const hits=foundations.filter(t=>px>=t.x&&px<=t.x+t.w).map(t=>C.topAt(t,px,b.height)).filter(Number.isFinite);return hits.length?Math.max(base,Math.min(...hits)):b.height;},map=points=>poly(points.map(([x,y])=>{const px=r.x+x*r.width;return[px,y>=0?foot(px)+y*r.height+55:base+y*r.height];}));rocks.push({...r,shape:map(form.outline),faces:form.faces.map(map)});}
 const shelfNecks=[];
 if(b.honroStage===5){const joins=[['climb-1',2790,205],['climb-2',2990,180],['climb-3',2900,270],['climb-4',3090,160],['climb-5',3010,225],['climb-6',3140,175],['climb-7',3210,210]];
  for(const [id,wall,drop]of joins){const t=b.terrain.find(t=>t.id===id&&!t.broken);if(!t)continue;const x=t.x+t.w*.35,right=t.x+t.w-8,y=C.topAt(t,right,t.y);shelfNecks.push({body:poly([[x,y+24],[right,y+9],[wall,y+35],[wall+70,y+drop],[right-40,y+drop*.65],[x,y+80]]),face:poly([[right,y+9],[wall,y+35],[wall-28,y+83],[right-16,y+93]])});}
 }
 q={source:art,version:b.sceneVersion,rocks,shelfNecks,replaced:new Set(art.replaced||[]),scenery:new Map((art.scenery||[]).map(s=>[s.id,s]))};sceneCache.set(b,q);return q;
}
function supports(c,b){
 // Real optional decks receive visibly open timber trestles. Gaps remain gaps;
 // these narrow, darker members are scenery and never suggest extra floor.
 if(![3,4,6,8,9,10].includes(b.honroStage))return;
 const floors=b.terrain.filter(t=>!t.broken&&!t.oneWay&&!t.honroElementCollision&&t.y+t.h>=b.height);
 for(const t of b.terrain){if(guardianBranch(b,t)||t.broken||t.honroSeal||t.honroElementCollision||(!t.oneWay&&!/gallery|eave|tier-|ramp-|bridge-/.test(t.id))||t.w<190)continue;
  const under=(x,y)=>{const hits=floors.flatMap(f=>C.terrainSurfaces(f,x)).filter(p=>p.y>y+24);return hits.length?Math.min(...hits.map(p=>p.y)):b.height;};
  const pos=[t.x+t.w*.2,t.x+t.w*.8];for(const [i,x]of pos.entries()){const top=C.topAt(t,x,t.y)+t.h*.18,foot=under(x,top),max=b.honroStage===7?500:950,bottom=foot;if(bottom-top<30||bottom-top>max)continue;
   c.strokeStyle=b.honroStage===7?'#263b3299':'#263741';c.lineWidth=b.honroStage===7?32:18;c.lineCap='butt';c.beginPath();c.moveTo(x,top);c.lineTo(x+(i?-22:19),bottom);c.stroke();c.strokeStyle='#7381744f';c.lineWidth=3;c.beginPath();c.moveTo(x-4,top);c.lineTo(x+(i?-26:15),bottom);c.stroke();
   if(bottom-top<900){c.strokeStyle='#3e514b';c.lineWidth=9;c.beginPath();c.moveTo(x,Math.min(bottom,top+40));c.lineTo(x+(i?-100:100),Math.min(bottom,top+240));c.stroke();}
  }
 }
}
const oldBackground=S.background;S.background=function(c,w,h,b){oldBackground.call(this,c,w,h,b);if(!active(b))return;const q=prepareScene(b);c.save();c.translate(w/2,h/2);c.scale(this.scale,this.scale);c.translate(-this.x,-this.y);
 for(const r of q.rocks){if(r.x+r.width<this.x-w/this.scale||r.x-r.width>this.x+w/this.scale)continue;c.save();c.fillStyle=A.gradient(c,0,r.y-r.height,0,r.y+100,[[0,'#344955'],[.6,'#2a4149'],[1,'#22363d']]);c.fill(r.shape);c.clip(r.shape);for(const [i,p]of r.faces.entries()){c.fillStyle=['#7e909d50','#10293577','#233b4388','#a0a79620'][i%4];c.fill(p);}c.restore();}
 // Retained rear shelf fractures leave the bright rim on actual collision only.
 for(const neck of q.shelfNecks){c.fillStyle='#203743';c.fill(neck.body);c.fillStyle='#667f8526';c.fill(neck.face);}
 for(const light of b.honroMap.act1Scene.lights||[])A.glow(c,light.x,light.y,light.radius||200,(light.radius||200)*.8,'#bc9458',.1);c.restore();if(this.environmentStats){this.environmentStats.act1Spatial=true;this.environmentStats.cachedPaths+=q.rocks.length*4+q.shelfNecks.length*2;}
};
const oldLayer=S._landmarkLayer;S._landmarkLayer=function(c,landmarks,layer){oldLayer.call(this,c,landmarks,layer);if(layer==='structural-back'&&active(this.battle))supports(c,this.battle);};
const oldLandmark=S.landmark;S.landmark=function(c,l){if(active(this.battle)){const q=prepareScene(this.battle);if(q.replaced.has(l.id))return;const record=q.scenery.get(l.id);if(record&&!this.battle.terrain.some(t=>t.id===record.supportId&&!t.broken))return;}oldLandmark.call(this,c,l);};
G.HonroAct1SpatialArt={active,prepareTerrain,prepareScene,groundGradient,supports};
})(globalThis);
