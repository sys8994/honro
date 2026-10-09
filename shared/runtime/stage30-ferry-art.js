(function(G){'use strict';
// The authored river has one physical source. This opt-in pass paints its exact
// live polygons; it never owns movement, event timing, collision or a camera.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,E=G.HonroEnvironment,cache=new WeakMap(),skyCache=new WeakMap();
const reducedMotion=G.matchMedia?.('(prefers-reduced-motion: reduce)');
const active=b=>b?.honroStage===30&&b.honroFerryRevision===1;
const state=b=>b.honroState?.ferry||{};
const P=ps=>{const p=new Path2D();ps.forEach((v,i)=>i?p.lineTo(v.x??v[0],v.y??v[1]):p.moveTo(v.x??v[0],v.y??v[1]));p.closePath();return p;};
const gradient=(c,x,y,xx,yy,stops)=>{const g=c.createLinearGradient(x,y,xx,yy);for(const[u,k]of stops)g.addColorStop(u,k);return g;};
const hash=s=>{let h=17;for(const ch of s)h=(h*31+ch.charCodeAt(0))>>>0;return h;};
const ROCK_FORMS=[
 ['M-80-40Q165-115 470-9L676 88Q675 182 559 277L336 350 176 523-80 568Z','M669-110L1120-40V1110H638L527 829 617 616 565 472 695 298Z','M-90 630Q118 515 268 594L462 558 567 695 776 609 1090 790V1150H-90Z','M-30 154Q133 210 266 163L414 180 352 222 189 231 22 218Z','M524 19L559 50 537 229 463 349 492 470 470 500 432 347 506 218Z'],
 ['M-90-90H641L696 175 548 284 274 306 154 471-90 496Z','M850-60L1110-60V1120H714L755 848 661 600 793 450 753 308Z','M-80 650L162 557 420 660 636 557 776 653 1070 567V1130H-90Z','M122 455Q309 363 431 406L635 374 648 400 437 445 280 433 148 487Z','M702 56L734 87 790 287 716 382 649 499 648 666 618 690 615 494 681 373 755 281Z'],
 ['M-100-60L422-60 652 106 593 267 487 330 168 288-70 454Z','M639-60H1130V1100H567L493 908 632 743 731 589 649 439 783 288Z','M-70 662Q151 550 359 687L543 701 697 592 912 704 1110 681V1130H-100Z','M33 193L262 232 383 189 553 208 494 244 358 226 282 264 53 222Z','M505 34L540 43 616 241 539 337 479 478 378 624 394 768 365 788 344 617 445 466 503 332 582 237Z']
].map(v=>v.map(d=>new Path2D(d)));
function surfaceEdges(t,b){const ps=C.poly(t),indices=t.honroWalkEdges||b.honroMap?.space?.surfaces?.find(s=>s.terrainId===t.id)?.edgeIndices||[];return indices.map(i=>[ps[i],ps[(i+1)%ps.length]]).filter(([a,z])=>a&&z&&Math.abs(a.x-z.x)>.001);}
function prepare(t,b){let q=cache.get(t);if(q?.source===t.vertices&&q.version===b.sceneVersion)return q;const ps=C.poly(t),shape=P(ps),edges=surfaceEdges(t,b),rim=new Path2D(),caps=[],strata=[],joints=new Path2D();
 for(const[a,z]of edges){rim.moveTo(a.x,a.y);rim.lineTo(z.x,z.y);caps.push(P([[a.x,a.y],[z.x,z.y],[z.x,z.y+20],[a.x,a.y+20]]));if(t.h>190&&t.mat!=='wood')strata.push(P([[a.x,a.y+30],[z.x,z.y+30],[z.x,z.y+83],[a.x,a.y+83]]));}
 const at=x=>{const edge=edges.find(([a,z])=>x>=Math.min(a.x,z.x)&&x<=Math.max(a.x,z.x));return edge?edge[0].y+(edge[1].y-edge[0].y)*(x-edge[0].x)/(edge[1].x-edge[0].x):t.y;};
 if(t.mat==='wood'){for(const u of [.17,.43,.78]){const x=t.x+t.w*u,y=at(x);joints.moveTo(x,y+10);joints.lineTo(x+7,Math.min(y+49,t.y+t.h));}}
 const ledges=[];if(/granite-cape|bank-inner/.test(t.id)&&t.h>230&&t.w>450&&edges.length){
  const left=Math.max(t.x,-600),right=Math.min(t.x+t.w,b.width+600),span=right-left;
  const configs=/granite-cape/.test(t.id)?[[.03,.55,.72],[.36,.61,.90]]:/bank-inner|outer-grade|old-road-west-rise/.test(t.id)?[[.02,.56,.62],[.48,.50,.86]]:/map-rock|west-ford|recovery-shore/.test(t.id)?[[.02,.42,.35],[.39,.47,.48],[.73,.35,.64]]:[[.02,.96,.84]];
  for(const [i,[u,uw,dh]]of configs.entries()){const x=left+span*u,w=span*uw,y=at(x),z=at(Math.min(right,x+w)),depth=Math.min(t.h*.92,1120)*dh,points=[[x,y+48],[x+w*.26,at(Math.min(right,x+w*.26))+65],[x+w*.66,at(Math.min(right,x+w*.66))+84],[Math.min(right,x+w),z+90],[x+w*.83,z+depth*.71],[x+w*.47,y+depth],[x+w*.11,y+depth*.83]],lit=P(points);
   const seam=new Path2D();seam.moveTo(x+w*.09,y+depth*.76);seam.lineTo(x+w*.29,y+depth*.82);seam.lineTo(x+w*.51,y+depth*.68);seam.lineTo(x+w*.68,z+depth*.62);seam.lineTo(x+w*.85,z+depth*.65);
   ledges.push({lit,seam,x,y,w,depth,i});
  }
 }
 const masonry=[];if(/ferry-court|reflector/.test(t.id)){for(const [i,f]of [0,.38,.71].entries()){const top=t.y+t.h*f,hh=t.h*(i===2?.29:.34),cuts=i===0?[0,.28,.66,1]:i===1?[0,.17,.57,.84,1]:[0,.38,.72,1];for(let j=1;j<cuts.length;j++){const x=t.x+t.w*cuts[j-1],xx=t.x+t.w*cuts[j],pad=Math.min(12,(xx-x)*.07);masonry.push({body:P([[x+pad,top+8],[xx-8,top+3],[xx-4,top+hh-9],[x+8,top+hh-4]]),top:P([[x+pad,top+8],[xx-8,top+3],[xx-11,top+20],[x+pad,top+24]]),light:(i+j)%3});}}}
 q={source:t.vertices,version:b.sceneVersion,shape,edges,rim,caps,strata,joints,masonry,ledges,forms:ROCK_FORMS[hash(t.id)%3]};cache.set(t,q);return q;}
function terrain(c,t,b,live=false){if(!active(b)||!t.id?.startsWith('sf-'))return false;if(t.id==='sf-settled-barge')return true;if(t.id==='sf-outbank-screen'&&state(b).status==='settling'&&!live)return true;const q=prepare(t,b),wood=t.mat==='wood',earth=t.mat==='earth',depth=Math.min(t.h,2600);c.save();c.clip(q.shape);
 c.fillStyle=gradient(c,t.x,t.y,t.x+t.w*.18,t.y+depth,wood?[[0,'#a1966b'],[.2,'#776c4d'],[.45,'#4d523e'],[1,'#263c38']]:earth?[[0,'#7e886d'],[.18,'#5b7264'],[.55,'#405c5b'],[1,'#1d3a49']]:[[0,'#93a18d'],[.24,'#748b82'],[.58,'#4b6b70'],[1,'#243f50']]);c.fill(q.shape);
 if(wood){c.strokeStyle='#253c34';c.lineWidth=5;c.stroke(q.joints);for(const[a,z]of q.edges){c.beginPath();c.moveTo(a.x,a.y+29);c.lineTo(z.x,z.y+29);c.stroke();}}
 else{c.save();c.translate(t.x,t.y);c.scale(t.w/1000,depth/1000);for(const[i,col]of ['#b9bca83d','#173847aa','#223e4f79','#c6c6a448','#19394588'].entries()){c.fillStyle=col;c.fill(q.forms[i]);}c.restore();for(const p of q.ledges){c.fillStyle=gradient(c,p.x,p.y,p.x+p.w*.45,p.y+p.depth,[[0,p.i%2?'#aeb6a529':'#bbc3a72e'],[.55,'#8da79419'],[1,'#172f404f']]);c.fill(p.lit);c.lineWidth=14;c.strokeStyle='#18384763';c.stroke(p.seam);c.save();c.translate(-7,-12);c.lineWidth=4;c.strokeStyle='#b5c0a533';c.stroke(p.seam);c.restore();}for(const p of q.strata){c.fillStyle=earth?'#a3a48237':'#b7bba749';c.fill(p);}for(const p of q.masonry){c.fillStyle=['#748b83','#586f70','#819289'][p.light];c.fill(p.body);c.fillStyle='#b7bba67a';c.fill(p.top);}}
 for(const p of q.caps){c.fillStyle=wood?'#c5b88988':earth?'#bac09869':'#d0d1b578';c.fill(p);}c.restore();return true;}
const originalTerrain=S.terrain;S.terrain=function(c,t){if(terrain(c,t,this.battle))return;return originalTerrain.call(this,c,t);};
function skyAsset(b){return b.honroMap?.ferryArt?.backdropAsset;}
function skyRaster(asset){let q=skyCache.get(asset);if(q)return q;const cv=G.document.createElement('canvas'),[x,y,w,h]=asset.vector.viewBox;cv.width=1800;cv.height=1050;const c=cv.getContext('2d');c.scale(cv.width/w,cv.height/h);c.translate(-x,-y);G.HonroVectorArt.draw(c,asset,{x:0,y:0,scale:1,rotation:0});q=cv;skyCache.set(asset,q);return q;}
const background=S.background;S.background=function(c,w,h,b){if(!active(b)||!skyAsset(b))return background.call(this,c,w,h,b);const cv=skyRaster(skyAsset(b)),r=E.act1BackdropFrame(this,w,h,b,cv.width,cv.height);c.drawImage(cv,r.x,r.y,r.w,r.h);this.environmentStats={groups:0,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};};
function body(b){return b.honroLandmarks?.find(l=>l.id==='sf-art-settled-barge');}
const initialMotion=b=>b.honroFerrySpec?.artFrom||{x:80,y:-145,rotation:.008};
function motion(b){const s=state(b),u=s.status==='settling'?Math.max(0,Math.min(1,(s.elapsed||0)/(s.duration||1))):s.status==='settled'?1:0,v=u*u*(3-2*u),from=initialMotion(b);return{x:from.x*(1-v),y:from.y*(1-v),rotation:from.rotation*(1-v),progress:u};}
function transformPoint(l,m,p){const last=l.asset.params.topPoints.at(-1),x=p[0]-last[0],y=p[1]-last[1],cs=Math.cos(m.rotation),sn=Math.sin(m.rotation);return{x:last[0]+m.x+x*cs-y*sn,y:last[1]+m.y+x*sn+y*cs};}
function drawBody(c,l,m){const last=l.asset.params.topPoints.at(-1);c.save();c.translate(last[0]+m.x,last[1]+m.y);c.rotate(m.rotation);c.translate(-last[0],-last[1]);G.HonroVectorArt.draw(c,l.asset,l);c.restore();return true;}
const landmarks=S._landmarkLayer;S._landmarkLayer=function(c,list,layer){const b=this.battle;if(!active(b))return landmarks.call(this,c,list,layer);const s=state(b).status,l=list.find(l=>l.id==='sf-art-settled-barge'),result=landmarks.call(this,c,s==='settled'?list:list.filter(l=>l.id!=='sf-art-settled-barge'),layer);
 // Before the event, the very same boat is moored behind the surviving bank.
 // The event owns sceneVersion on entry/abort, so its cached and live images
 // never coexist. Actors and physical surfaces are unchanged by this painting.
 if(l&&layer==='back'&&!['settling','settled'].includes(s))drawBody(c,l,motion(b));return result;};
function movingBody(c,b){if(!active(b)||state(b).status!=='settling')return false;const l=body(b);if(!l?.asset)return false;return drawBody(c,l,reducedMotion?.matches?{...initialMotion(b),progress:0}:motion(b));}
const ropePath=new Path2D('M0 0Q.5 .08 1 0');
function mooring(c,b){if(!active(b)||state(b).status==='settled')return false;const court=b.terrain.find(t=>t.id==='sf-ferry-court'),l=body(b);if(!court||!l?.asset)return false;const a={x:court.x+court.w*.88,y:court.y-42},ps=l.asset.params.topPoints,first=ps[0],next=ps[1],f=.1,p=[first[0]+(next[0]-first[0])*f,first[1]+(next[1]-first[1])*f-23],m=reducedMotion?.matches&&state(b).status==='settling'?initialMotion(b):motion(b),z=transformPoint(l,m,p),dx=z.x-a.x,dy=z.y-a.y,len=Math.hypot(dx,dy);if(len<1)return false;c.save();c.transform(dx,dy,-dy,dx,a.x,a.y);c.strokeStyle='#192f34';c.lineWidth=7/len;c.stroke(ropePath);c.strokeStyle='#aea078a6';c.lineWidth=2.5/len;c.stroke(ropePath);c.restore();return true;}
const collapseCrack=new Path2D('M510 45L489 201 560 327 480 437 517 573 451 692 478 895M555 326L719 386 786 507M481 438L327 494 252 645');
const collapseChips=[new Path2D('M315 470L343 483 332 512 303 502Z'),new Path2D('M700 376L727 389 713 411 690 401Z'),new Path2D('M477 663L499 676 489 702 466 686Z')];
const omitReadability=(group,b)=>active(b)&&group.id==='sf-outbank-screen'&&state(b).status==='settling';
function collapsingScreen(c,b){if(!active(b)||state(b).status!=='settling')return false;const t=(G.HonroTerrainDomain?.render(b)||b.terrain).find(t=>t.id==='sf-outbank-screen'&&!t.broken);if(!t)return false;const q=prepare(t,b),u=motion(b).progress,smooth=u*u*(3-2*u);c.save();c.globalAlpha*=reducedMotion?.matches?1:1-smooth*.94;terrain(c,t,b,true);c.clip(q.shape);c.translate(t.x,t.y);c.scale(t.w/1000,t.h/1000);c.strokeStyle='#c8b991';c.lineWidth=4+u*4;c.globalAlpha*=.35+u*.5;c.stroke(collapseCrack);c.strokeStyle='#132f3e';c.lineWidth=9;c.stroke(collapseCrack);if(!reducedMotion?.matches){c.translate(0,u*32);for(const p of collapseChips){c.fillStyle='#b1b497';c.fill(p);}}c.restore();return true;}
const water=S.liveWater;S.liveWater=function(c,b){const result=water?.call(this,c,b);movingBody(c,b);collapsingScreen(c,b);mooring(c,b);return result;};
G.HonroStage30FerryArt={active,prepare,terrain,surfaceEdges,skyAsset,skyRaster,body,initialMotion,motion,transformPoint,drawBody,movingBody,mooring,collapsingScreen,omitReadability};
})(globalThis);
