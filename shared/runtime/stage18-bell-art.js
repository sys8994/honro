(function(G){'use strict';
// Opt-in material and event cues for the one authored hollow bell. The source
// terrain and saved descent state remain the authority. No physics lives here.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,cache=new WeakMap();
const active=b=>[18,19].includes(b?.honroStage)&&b.honroBellRevision===1;
const lowering=b=>active(b)&&b.honroState?.bellDescent?.status==='lowering';
const shellIds=new Set(['sb-bell-crown','sb-bell-west-wall','sb-bell-east-wall','sb-bell-east-yoke']);
const omitReadability=(group,b)=>active(b)&&shellIds.has(group.id);
function prepare(t,b){let q=cache.get(t);if(q?.vertices===t.vertices&&q.version===b.sceneVersion)return q;
 const shape=new Path2D(),ps=C.poly(t);ps.forEach((p,i)=>i?shape.lineTo(p.x,p.y):shape.moveTo(p.x,p.y));shape.closePath();
 q={shape,vertices:t.vertices,version:b.sceneVersion};cache.set(t,q);return q;
}
function shell(c,t,b){if(!active(b)||!(t.honroBellShell||t.honroBellBody))return false;const q=prepare(t,b);c.save();
 const g=c.createLinearGradient(t.x,t.y,t.x+t.w,t.y+t.h*.22);g.addColorStop(0,'#867957');g.addColorStop(.42,'#59634d');g.addColorStop(1,'#304b40');c.fillStyle=g;c.fill(q.shape);
 c.strokeStyle='#192f2c';c.lineWidth=9;c.lineJoin='round';c.stroke(q.shape);c.restore();return true;
}
const stoneProxies=new WeakMap();
const terrain=S.terrain;S.terrain=function(c,t){const b=this.battle;if(lowering(b)&&shellIds.has(t.id))return;if(shell(c,t,b))return;
 // Old generic optional shelves are timber. These two named new rock ramps
 // retain their actual material without mutating the playable one-way flag.
 if(active(b)&&t.honroBell&&t.mat==='rock'&&t.oneWay&&t.optional){let q=stoneProxies.get(t);if(!q||q.source!==t.vertices||q.version!==b.sceneVersion){q={source:t.vertices,version:b.sceneVersion,view:{...t,optional:false}};stoneProxies.set(t,q);}return G.HonroAct2SpatialArt.terrain(c,q.view,b);}
 return terrain.call(this,c,t);
};
// The 0.9-second safe descent reuses the still cavern tiles. Only this one
// retained SVG is drawn live, with the position already moved by the runtime.
const landmarks=S._landmarkLayer;S._landmarkLayer=function(c,list,layer){return landmarks.call(this,c,lowering(this.battle)?list.filter(l=>l.id!=='sb-bell-body'):list,layer);};
function movingBody(c,b){if(!lowering(b))return false;const body=b.honroLandmarks?.find(l=>l.id==='sb-bell-body');if(!body?.asset)return false;G.HonroVectorArt.draw(c,body.asset,body);return true;}
function rect(zone){if(!zone)return null;const z=zone.bounds||zone;if([z.x,z.y,z.w,z.h].every(Number.isFinite))return z;if(Number.isFinite(z.x)&&Number.isFinite(z.y)&&Number.isFinite(z.radius))return{x:z.x-z.radius,y:z.y-110,w:z.radius*2,h:110};return null;}
const guideCache=new WeakMap();
function sweepArt(b){const spec=b.honroBellDescent,shapes=G.HonroStage18Bell?.sweepGeometry(b)||[];let q=guideCache.get(spec);if(q?.source===shapes)return q;
 const fill=new Path2D();for(const shape of shapes){const ps=shape.vertices;let area=0;for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];area+=a.x*z.y-z.x*a.y;}const ordered=area<0?ps.slice().reverse():ps;ordered.forEach((p,i)=>i?fill.lineTo(p.x,p.y):fill.moveTo(p.x,p.y));fill.closePath();}
 // Reuse the common exposed-edge builder for the union outline. This scratch
 // geometry is read-only and never replaces any live terrain or saved state.
 const union={terrain:shapes,sceneVersion:0,honroLandmarks:[]},rim=new Path2D();for(const group of G.HonroTerrainReadability.prepare(union).groups)rim.addPath(group.edge);
 q={source:shapes,fill,rim};guideCache.set(spec,q);return q;
}
function descentGuide(c,b,scene){if(!active(b)||b.honroStage!==18)return false;const m=b.honroState?.bellDescent,spec=b.honroBellDescent;if(!m||!spec||!['warning','waiting','lowering'].includes(m.status))return false;
 const z=Math.max(.05,scene.scale||1),time=G.HonroEnvironmentArt?.time?.(scene)||0,pulse=.74+Math.sin(time*2.3)*.08;c.save();c.lineJoin='round';
 // Safe floor cues are intentionally quieter than the amber moving edge.
 for(const zone of spec.safeZones||[]){const r=rect(zone);if(!r)continue;c.fillStyle='#8cc7c811';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle='#8ebfc991';c.lineWidth=1.25/z;c.beginPath();c.moveTo(r.x,r.y+r.h);c.lineTo(r.x+r.w,r.y+r.h);c.stroke();}
 const q=sweepArt(b);c.fillStyle='#e4a96025';c.fill(q.fill,'nonzero');c.strokeStyle=`rgba(222,170,98,${pulse})`;c.lineWidth=1.45/z;c.setLineDash([7/z,6/z]);c.stroke(q.rim);c.setLineDash([]);
 for(const id of ['sb-bell-west-wall','sb-bell-east-wall','sb-bell-east-yoke']){const t=b.terrain.find(t=>t.id===id);if(!t)continue;const ps=C.poly(t),bottom=Math.max(...ps.map(p=>p.y)),feet=ps.filter(p=>Math.abs(p.y-bottom)<.5),xx=feet.reduce((sum,p)=>sum+p.x,0)/feet.length,yy=bottom+(spec.distance-(m.offset||0))-23/z,size=6/z;c.beginPath();c.moveTo(xx-size,yy-size);c.lineTo(xx,yy);c.lineTo(xx+size,yy-size);c.moveTo(xx-size,yy+5/z);c.lineTo(xx,yy+5/z+size);c.lineTo(xx+size,yy+5/z);c.stroke();}
 c.restore();return true;
}
const water=S.liveWater;S.liveWater=function(c,b){const result=water?.call(this,c,b);movingBody(c,b);descentGuide(c,b,this);return result;};
G.HonroStage18BellArt={active,lowering,prepare,shell,omitReadability,movingBody,sweepArt,descentGuide};
})(globalThis);
