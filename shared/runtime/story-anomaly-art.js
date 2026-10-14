(function(G){'use strict';
// Local, read-only scenery. The episode runtimes own projectile motion and the
// solo fall. None of these shapes are substitute platforms or body collisions.
const clamp=v=>Math.max(0,Math.min(1,v));
function active(b){return !b?.honroCustom&&b?.honroStoryAnomalyRevision===1&&b.honroStoryAnomalyEnvironment?.revision===1;}
function time(scene){return G.HonroEnvironmentArt?.time?.(scene)??scene.time??0;}
function visible(scene,q,pad=300){const {w,h}=scene.size(),z=Math.max(.05,scene.scale);return q.x+pad>=scene.x-w/z/2&&q.x-pad<=scene.x+w/z/2&&q.y+pad>=scene.y-h/z/2&&q.y-pad<=scene.y+h/z/2;}
function path(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function stroke(c,points,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
// Shift a small authored, empty background window of the actual transport
// pier. We reuse the current canvas, so it remains the same masonry/material
// rather than introducing unsupported floating scenery or fake platforms.
function recess(c,scene,q,deep=false){if(!q||!visible(scene,q)||!Number.isFinite(c.canvas?.width))return;const {x,y,w,h}=q,shift=deep?76:22,view=scene.size(),z=Math.max(.05,scene.scale),d=view.d||1,left=x-w/2;
 const sx=(left-scene.x)*z*d+view.w*d/2,sy=(y-scene.y)*z*d+view.h*d/2;
 c.save();c.beginPath();c.moveTo(left,y+10);c.lineTo(left+w,y);c.lineTo(left+w,y+h-8);c.lineTo(left,y+h);c.closePath();c.clip();
 c.drawImage(c.canvas,sx,sy,w*z*d,h*z*d,left+shift,y,w,h);c.restore();
}
// One water bead follows a visible bend. The source and lower lip are always
// present; the brief sideways motion is a background warning, never damage.
function drip(c,scene,q,deep=false){if(!q||!visible(scene,q))return;const z=Math.max(.05,scene.scale),t=time(scene),phase=(t%5.8)/5.8,p=clamp(phase*2.7),bend=.58,down=q.height*Math.min(p,bend),side=q.turn*clamp((p-bend)/(1-bend)),x=q.x+side,y=q.y+down+(p>bend?(p-bend)*q.height*.13:0);
 stroke(c,[[q.x-18,q.y-5],[q.x+8,q.y],[q.x+24,q.y-8]],'#6d81706b',3);
 if(phase>.49)return;
 const alpha=Math.sin(Math.min(1,phase/.49)*Math.PI),tail=Math.max(6,2.2/z);c.save();c.globalAlpha=alpha;
 stroke(c,p>bend?[[x-tail*2,y-1],[x,y]]:[[x,y-tail*2],[x,y]],deep?'#b7d3bfc7':'#a0bfb6b0',Math.max(3,1.7/z));c.restore();
}
function bell(c,scene,b){const a=G.HonroBellAnomaly,zone=a?.zone?.(b);if(!zone||a?.active&&!a.active(b))return;const q=zone.bounds||zone,w=q.w||q.width||q.rx*2,h=q.h||q.height||q.ry*2,x=q.rx?q.x-q.rx:q.x,y=q.ry?q.y-q.ry:q.y;if(![x,y,w,h].every(Number.isFinite))return;if(!visible(scene,{x:x+w/2,y:y+h/2},Math.max(w,h)))return;
 const z=Math.max(.05,scene.scale),pulse=.5+.12*Math.sin(time(scene)*1.2);c.save();c.globalAlpha=pulse;c.strokeStyle='#a7d2c0';c.lineWidth=1.25/z;
 // Two incomplete arcs follow the actual ellipse boundary. They show a local
 // disturbance, with no sealed circle, glyph or invented collision surface.
 for(const start of [-.88,Math.PI-.88]){c.beginPath();c.ellipse(x+w/2,y+h/2,w/2,h/2,0,start,start+1.76);c.stroke();}
 c.strokeStyle='#9fc3b066';c.lineWidth=1/z;for(let i=0;i<3;i++){const yy=y+h*(.27+i*.22);c.beginPath();c.moveTo(x+w*.17,yy);c.quadraticCurveTo(x+w*.5,yy-h*.07,x+w*.83,yy-h*.02);c.stroke();}c.restore();
}
function seam(c,scene,b){const authored=b.honroMap?.act3?.voidEncounter?.seam;if(!authored||b.honroAct3Void?.state!=='FALLING')return;const visual=G.HonroAct3Void?.visual?.(b),q=visual?.origin?{...authored,...visual.origin}:authored;if(!visible(scene,q))return;const p=clamp(visual?.progress??b.honroAct3Void?.fallProgress??.5),x=q.x-q.w/2,y=q.y,w=q.w,dx=p*76,dy=p*112;
 // This is the visual face of the episode's temporary scripted transition.
 // The episode freezes ordinary physics and restores the original support.
 path(c,[[x,y-2],[x+w,y-2],[x+w,y+100],[x,y+100]],'#081922');
 path(c,[[x+dx,y+dy],[x+w+dx,y+dy+17],[x+w+dx,y+dy+64],[x+dx,y+dy+53]],'#49625e');
 stroke(c,[[x+dx,y+dy],[x+w+dx,y+dy+17]],'#c5c2a0',Math.max(4,1.8/Math.max(.05,scene.scale)));
}
function draw(c,scene,b){if(!active(b))return;const q=b.honroStoryAnomalyEnvironment;c.save();
 if(q.kind==='waterworks-first-sign'||q.kind==='waterworks-deep'){recess(c,scene,q.recess,q.kind==='waterworks-deep');recess(c,scene,q.deepRecess,true);drip(c,scene,q.drip,q.kind==='waterworks-deep');if(q.kind==='waterworks-deep')seam(c,scene,b);}
 else if(q.kind==='bell-approach'){recess(c,scene,q.recess,false);}
 else if(q.kind==='bell-projectiles')bell(c,scene,b);
 else if(q.kind==='funeral-echo'&&time(scene)<4.5&&visible(scene,q.echo)){const p=clamp(time(scene)/4.5),{x,y,w}=q.echo;c.globalAlpha=Math.sin(p*Math.PI)*.24;stroke(c,[[x-w*.5,y],[x-w*.1,y-19],[x+w*.5,y-7]],'#c7d9bf',2/Math.max(.05,scene.scale));}
 c.restore();}
G.HonroStoryAnomalyArt={active,draw,recess,drip,seam,bell,time};
})(globalThis);
