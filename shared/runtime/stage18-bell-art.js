(function(G){'use strict';
// Opt-in material and event cues for the one authored hollow bell. The source
// terrain and saved descent state remain the authority. No physics lives here.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,cache=new WeakMap();
const active=b=>[18,19].includes(b?.honroStage)&&b.honroBellRevision===1;
const lowering=b=>active(b)&&b.honroState?.bellDescent?.status==='lowering';
const shellIds=new Set(['sb-bell-crown','sb-bell-west-wall','sb-bell-east-wall','sb-bell-east-lip','sb-bell-east-yoke']);
const interiorStoneIds=new Set(['sb-inner-upper-turn','sb-inner-sound-stone']);
const omitReadability=(group,b)=>active(b)&&(shellIds.has(group.id)||interiorStoneIds.has(group.id));
function prepare(t,b){let q=cache.get(t);if(q?.vertices===t.vertices&&q.version===b.sceneVersion)return q;
 const shape=new Path2D(),ps=C.poly(t);ps.forEach((p,i)=>i?shape.lineTo(p.x,p.y):shape.moveTo(p.x,p.y));shape.closePath();
 q={shape,vertices:t.vertices,version:b.sceneVersion};cache.set(t,q);return q;
}
function shell(c,t,b){if(!active(b)||!(t.honroBellShell||t.honroBellBody))return false;const q=prepare(t,b);c.save();
 const g=c.createLinearGradient(t.x,t.y,t.x+t.w,t.y+t.h*.22);g.addColorStop(0,'#867957');g.addColorStop(.42,'#59634d');g.addColorStop(1,'#304b40');c.fillStyle=g;c.fill(q.shape);
 c.strokeStyle='#192f2c';c.lineWidth=9;c.lineJoin='round';c.stroke(q.shape);c.restore();return true;
}
// Broad curved mineral planes are clipped to each authored collider. The
// exterior silhouette always comes from the terrain, never decorative rocks.
const rockForms=[
 ['M-90-160H1060V118Q763 18 529 162Q378 324 269 402Q94 509-70 404Z','M657-120Q470 107 576 314Q666 453 533 640Q451 849 548 1100H1080V-100Z','M-100 565Q142 412 308 506Q521 658 659 546Q781 455 1090 580V780Q817 615 636 726Q401 809 204 670Q46 606-100 745Z','M604-20Q533 103 546 245L491 373Q485 544 411 655Q354 779 392 941'],
 ['M-120-150H1040V195Q871 322 641 234Q423 114 311 251Q220 339 71 330L-100 490Z','M745-150Q672 230 535 351Q638 581 515 819L590 1120H1100V-120Z','M-60 494Q121 565 325 441Q517 327 748 426Q948 545 1070 467V664Q888 741 698 598Q527 535 353 647Q157 778-40 665Z','M259 48Q374 194 341 342Q285 476 357 579L348 851'],
 ['M-90-180H1090V93Q930 219 733 190Q520 63 359 185Q236 294 11 231Z','M792-130Q905 154 777 359Q652 576 754 769L722 1110H1120V-130Z','M-70 380Q174 257 337 369Q516 496 659 360Q842 260 1090 402V665Q841 527 648 655Q436 751 292 617Q96 494-70 590Z','M561 138Q649 231 558 349Q484 434 508 579Q552 667 471 874'],
 ['M-100-180H1100V159Q921 313 710 276Q553 304 403 418Q191 463 54 348L-100 455Z','M751-100Q587 33 695 257Q805 463 644 547Q563 719 668 1100H1110V-120Z','M-70 641Q181 469 375 540Q610 629 723 474Q865 377 1080 464V622Q882 548 768 696Q565 862 333 709Q132 639-70 789Z','M385 89Q340 183 419 298Q475 379 402 481L391 708Q357 824 403 947']
].map(a=>a.map(d=>new Path2D(d)));
function rock(c,t,b){if(!active(b)||!t.honroBell||t.mat!=='rock'||t.oneWay||['act2-floor','cave-roof'].includes(t.id)||t.w<170||t.h<170)return false;
 const q=prepare(t,b),index=/crown|court/.test(t.id)?2:/lower|buttress|saddle/.test(t.id)?1:/east|return/.test(t.id)?3:0,forms=rockForms[index];c.save();c.clip(q.shape);const base=c.createLinearGradient(t.x,t.y,t.x+t.w*.47,t.y+t.h);base.addColorStop(0,'#6c817b');base.addColorStop(.48,'#4d676b');base.addColorStop(1,'#263f4d');c.fillStyle=base;c.fill(q.shape);c.translate(t.x,t.y);c.scale(t.w/1000,t.h/1000);
 c.fillStyle='#8f9a822b';c.fill(forms[0]);c.fillStyle='#152f408f';c.fill(forms[1]);c.fillStyle='#91a08a13';c.fill(forms[2]);if(/west-middle|west-crown|maintenance-buttress|east-resonance-mass|east-keeper-mass|return-cave-buttress/.test(t.id)){c.strokeStyle='#203c486a';c.lineWidth=8;c.lineCap='round';c.stroke(forms[3]);c.strokeStyle='#a3ae901c';c.lineWidth=3;c.translate(-8,-5);c.stroke(forms[3]);}c.restore();return true;
}
const stoneProxies=new WeakMap();
const terrain=S.terrain;S.terrain=function(c,t){const b=this.battle;if(active(b)&&interiorStoneIds.has(t.id))return;if(lowering(b)&&shellIds.has(t.id))return;if(shell(c,t,b))return;if(rock(c,t,b))return;
 // Old generic optional shelves are timber. These two named new rock ramps
 // retain their actual material without mutating the playable one-way flag.
 if(active(b)&&t.honroBell&&t.mat==='rock'&&t.oneWay&&t.optional){let q=stoneProxies.get(t);if(!q||q.source!==t.vertices||q.version!==b.sceneVersion){q={source:t.vertices,version:b.sceneVersion,view:{...t,optional:false}};stoneProxies.set(t,q);}return G.HonroAct2SpatialArt.terrain(c,q.view,b);}
 return terrain.call(this,c,t);
};
// The 0.9-second safe descent reuses the still cavern tiles. Only this one
// retained SVG is drawn live, with the position already moved by the runtime.
const bellPaintCache=new WeakMap();
function bellPaint(asset){let q=bellPaintCache.get(asset);if(q)return q;const spec=asset.params?.soundWindow;if(!spec)return null;const box=asset.bounds,clip=new Path2D(`M${box.x-20} ${box.y-20}h${box.w+40}v${box.h+40}h${-box.w-40}Z ${spec.interiorReveal}`);const overlays={...asset,vector:{...asset.vector,root:{...asset.vector.root,children:asset.vector.root.children.filter(node=>spec.overlays.includes(node.id))}}};q={clip,overlays};bellPaintCache.set(asset,q);return q;}
function drawBell(c,body){const q=bellPaint(body.asset);if(!q)return G.HonroVectorArt.draw(c,body.asset,body);
 // The cast side aperture is transparent to the actual gallery and actors.
 // Its physical outer opening is authored in soundWindow.shellOpening; the
 // leftward reveal is the already-empty bell interior viewed through it.
 c.save();c.translate(body.x||0,body.y||0);c.rotate(body.rotation||0);c.scale(body.scale??1,body.scale??1);c.clip(q.clip,'evenodd');G.HonroVectorArt.draw(c,body.asset,{x:0,y:0,scale:1,rotation:0});c.restore();G.HonroVectorArt.draw(c,q.overlays,body);return true;
}
const landmarks=S._landmarkLayer;S._landmarkLayer=function(c,list,layer){const b=this.battle;if(!active(b))return landmarks.call(this,c,list,layer);const body=list.find(l=>l.id==='sb-bell-body');const result=landmarks.call(this,c,list.filter(l=>l.id!=='sb-bell-body'),layer);if(body&&!lowering(b)&&(body.layer||'back')===layer)drawBell(c,body);return result;};
function movingBody(c,b){if(!lowering(b))return false;const body=b.honroLandmarks?.find(l=>l.id==='sb-bell-body');if(!body?.asset)return false;return drawBell(c,body);}
// These two fixed stones stand in the open mouth, in front of its dark
// underside. Paint their actual polygons once, after the bell and before
// actors. They are omitted from the cached terrain/readability passes above.
function interiorStones(c,b,scene){if(!active(b))return false;for(const t of b.terrain||[]){if(!interiorStoneIds.has(t.id))continue;if(rock(c,t,b))continue;let q=stoneProxies.get(t);if(!q||q.source!==t.vertices||q.version!==b.sceneVersion){q={source:t.vertices,version:b.sceneVersion,view:{...t,optional:false}};stoneProxies.set(t,q);}G.HonroAct2SpatialArt.terrain(c,q.view,b);}
 const style=G.HonroTerrainReadability.STYLE,unit=1/Math.max(.05,scene.scale||1);c.save();c.lineJoin='round';c.lineCap='butt';for(const group of G.HonroTerrainReadability.prepare(b).groups){if(!interiorStoneIds.has(group.id))continue;c.strokeStyle=style.edgeInk;c.lineWidth=style.edgePixels*unit;c.stroke(group.edge);c.lineWidth=style.topInkPixels*unit;c.stroke(group.top);c.strokeStyle=style.topLight;c.lineWidth=style.topLightPixels*unit;c.stroke(group.top);}c.restore();return true;
}
function rect(zone){if(!zone)return null;const z=zone.bounds||zone;if([z.x,z.y,z.w,z.h].every(Number.isFinite))return z;if(Number.isFinite(z.x)&&Number.isFinite(z.y)&&Number.isFinite(z.radius))return{x:z.x-z.radius,y:z.y-110,w:z.radius*2,h:110};return null;}
const guideCache=new WeakMap();
function sweepArt(b){const spec=b.honroBellDescent,shapes=G.HonroStage18Bell?.sweepGeometry(b)||[];let q=guideCache.get(spec);if(q?.source===shapes)return q;
 const fill=new Path2D();for(const shape of shapes){const ps=shape.vertices;let area=0;for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];area+=a.x*z.y-z.x*a.y;}const ordered=area<0?ps.slice().reverse():ps;ordered.forEach((p,i)=>i?fill.lineTo(p.x,p.y):fill.moveTo(p.x,p.y));fill.closePath();}
 // Reuse the common exposed-edge builder for the union outline. This scratch
 // geometry is read-only and never replaces any live terrain or saved state.
 const union={terrain:shapes,sceneVersion:0,honroLandmarks:[]},rims=G.HonroTerrainReadability.prepare(union).groups.map(group=>group.edge);
 q={source:shapes,fill,rims};guideCache.set(spec,q);return q;
}
function descentGuide(c,b,scene){if(!active(b)||b.honroStage!==18)return false;const m=b.honroState?.bellDescent,spec=b.honroBellDescent;if(!m||!spec||!['warning','waiting','lowering'].includes(m.status))return false;
 const z=Math.max(.05,scene.scale||1),time=G.HonroEnvironmentArt?.time?.(scene)||0,pulse=.74+Math.sin(time*2.3)*.08;c.save();c.lineJoin='round';
 // Safe floor cues are intentionally quieter than the amber moving edge.
 for(const zone of spec.safeZones||[]){const r=rect(zone);if(!r)continue;c.fillStyle='#8cc7c811';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle='#8ebfc991';c.lineWidth=1.25/z;c.beginPath();c.moveTo(r.x,r.y+r.h);c.lineTo(r.x+r.w,r.y+r.h);c.stroke();}
 const q=sweepArt(b);c.fillStyle='#e4a96025';c.fill(q.fill,'nonzero');c.strokeStyle=`rgba(222,170,98,${pulse})`;c.lineWidth=1.45/z;c.setLineDash([7/z,6/z]);for(const rim of q.rims)c.stroke(rim);c.setLineDash([]);
 for(const id of ['sb-bell-west-wall','sb-bell-east-wall','sb-bell-east-lip','sb-bell-east-yoke']){const t=b.terrain.find(t=>t.id===id);if(!t)continue;const ps=C.poly(t),bottom=Math.max(...ps.map(p=>p.y)),feet=ps.filter(p=>Math.abs(p.y-bottom)<.5),xx=feet.reduce((sum,p)=>sum+p.x,0)/feet.length,yy=bottom+(spec.distance-(m.offset||0))-23/z,size=6/z;c.beginPath();c.moveTo(xx-size,yy-size);c.lineTo(xx,yy);c.lineTo(xx+size,yy-size);c.moveTo(xx-size,yy+5/z);c.lineTo(xx,yy+5/z+size);c.lineTo(xx+size,yy+5/z);c.stroke();}
 c.restore();return true;
}
const water=S.liveWater;S.liveWater=function(c,b){const result=water?.call(this,c,b);movingBody(c,b);interiorStones(c,b,this);descentGuide(c,b,this);return result;};
G.HonroStage18BellArt={active,lowering,prepare,shell,rock,omitReadability,bellPaint,drawBell,movingBody,interiorStones,sweepArt,descentGuide};
})(globalThis);
