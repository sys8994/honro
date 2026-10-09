(function(G){'use strict';
// Opt-in material and event cues for the one authored hollow bell. The source
// terrain and saved descent state remain the authority. No physics lives here.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,cache=new WeakMap();
const active=b=>[18,19].includes(b?.honroStage)&&b.honroBellRevision===1;
function prepare(t,b){let q=cache.get(t);if(q?.vertices===t.vertices&&q.version===b.sceneVersion)return q;
 const shape=new Path2D(),ps=C.poly(t);ps.forEach((p,i)=>i?shape.lineTo(p.x,p.y):shape.moveTo(p.x,p.y));shape.closePath();
 q={shape,vertices:t.vertices,version:b.sceneVersion};cache.set(t,q);return q;
}
function shell(c,t,b){if(!active(b)||!(t.honroBellShell||t.honroBellBody))return false;const q=prepare(t,b);c.save();
 const g=c.createLinearGradient(t.x,t.y,t.x+t.w,t.y+t.h*.22);g.addColorStop(0,'#867957');g.addColorStop(.42,'#59634d');g.addColorStop(1,'#304b40');c.fillStyle=g;c.fill(q.shape);
 c.strokeStyle='#192f2c';c.lineWidth=9;c.lineJoin='round';c.stroke(q.shape);c.restore();return true;
}
const terrain=S.terrain;S.terrain=function(c,t){if(shell(c,t,this.battle))return;return terrain.call(this,c,t);};
function rect(zone){if(!zone)return null;const z=zone.bounds||zone;if([z.x,z.y,z.w,z.h].every(Number.isFinite))return z;if(Number.isFinite(z.x)&&Number.isFinite(z.y)&&Number.isFinite(z.radius))return{x:z.x-z.radius,y:z.y-110,w:z.radius*2,h:110};return null;}
function descentGuide(c,b,scene){if(!active(b)||b.honroStage!==18)return false;const m=b.honroState?.bellDescent,spec=b.honroBellDescent;if(!m||!spec||!['warning','waiting','lowering'].includes(m.status))return false;
 const z=Math.max(.05,scene.scale||1),time=G.HonroEnvironmentArt?.time?.(scene)||0,pulse=.74+Math.sin(time*2.3)*.08;c.save();c.lineJoin='round';
 // Safe floor cues are intentionally quieter than the amber moving edge.
 for(const zone of spec.safeZones||[]){const r=rect(zone);if(!r)continue;c.fillStyle='#8cc7c815';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle='#8ebfc991';c.lineWidth=1.25/z;c.beginPath();c.moveTo(r.x,r.y);c.lineTo(r.x+r.w,r.y);c.stroke();}
 for(const zone of spec.sweep||[]){const r=rect(zone);if(!r)continue;c.fillStyle='#e4a9601e';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle=`rgba(222,170,98,${pulse})`;c.lineWidth=1.65/z;c.setLineDash([7/z,6/z]);c.strokeRect(r.x,r.y,r.w,r.h);c.setLineDash([]);
  const xx=r.x+r.w*.5,yy=r.y+r.h-23/z,size=6/z;c.beginPath();c.moveTo(xx-size,yy-size);c.lineTo(xx,yy);c.lineTo(xx+size,yy-size);c.moveTo(xx-size,yy+5/z);c.lineTo(xx,yy+5/z+size);c.lineTo(xx+size,yy+5/z);c.stroke();
 }
 c.restore();return true;
}
const water=S.liveWater;S.liveWater=function(c,b){const result=water?.call(this,c,b);descentGuide(c,b,this);return result;};
G.HonroStage18BellArt={active,prepare,shell,descentGuide};
})(globalThis);
