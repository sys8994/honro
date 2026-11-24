(function(G){'use strict';
// Travel guide (user request 2026-11-24): while the active hero stands ready at a crossing
// link or a 축지진목 pair, a marching dash-dot arc points to where it will land.
// Deliberately unlike the aim prediction (class-colored short dashes, thin, static):
// dash-dot rhythm, a dark underlay, flowing toward the destination, a landing ring and arrow.
const GATE='#8fe6cf',LINK='#f2d48c';
function destinations(app){
 const e=app?.engine,b=e?.b,u=e?.active;if(!b||!u||u.side!==0||u.dead||!e.grounded?.(u))return [];
 let list=[];try{list=G.HonroInteractions?.candidates(app)||[];}catch{return [];}
 const out=[];
 for(const v of list){
  if(!v.ok)continue;const m=v.marker;
  if(m.action==='skillGate'){
   const to=(b.stakes||[]).find(z=>z.skill==='M09'&&z.side===u.side&&z.id!==+String(m.id).replace('skillGate-','')&&(z.expires===undefined||z.expires>b.round));
   if(to)out.push({x:to.x,y:to.y,color:GATE});
  }else{
   const link=b.honroMap?.act5?.links?.find(l=>l.id===m.id),to=link?.to||m.to;
   if(to&&Number.isFinite(to.x)&&Number.isFinite(to.y))out.push({x:to.x,y:to.y,color:LINK});
  }
 }
 return out;
}
function draw(c,scene,u,d){
 const z=Math.max(.12,scene.scale||1),a={x:u.x,y:u.y-u.h*.5},q={x:d.x,y:d.y-34};
 const span=Math.hypot(q.x-a.x,q.y-a.y);if(span<40)return;
 const lift=Math.min(260,span*.28),m={x:(a.x+q.x)/2,y:Math.min(a.y,q.y)-lift};
 const t=(scene.time||performance.now()/1000),base=c.globalAlpha;
 c.save();c.lineCap='round';c.lineJoin='round';
 const path=()=>{c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(m.x,m.y,q.x,q.y);};
 c.globalAlpha=base*.55;c.strokeStyle='#0b1418';c.lineWidth=5.2/z;c.setLineDash([]);path();c.stroke();
 c.globalAlpha=base*.95;c.strokeStyle=d.color;c.lineWidth=2.6/z;c.setLineDash([13/z,6/z,2.5/z,6/z]);c.lineDashOffset=-(t*38%27.5)/z;path();c.stroke();
 // Landing ring and arrowhead along the final tangent.
 c.setLineDash([]);c.globalAlpha=base*.9;c.lineWidth=2.2/z;c.beginPath();c.ellipse(d.x,d.y-4,24/z+10,8/z+4,0,0,Math.PI*2);c.stroke();
 const ang=Math.atan2(q.y-m.y,q.x-m.x),s=11/z;
 c.fillStyle=d.color;c.beginPath();c.moveTo(q.x,q.y);c.lineTo(q.x-Math.cos(ang-.45)*s,q.y-Math.sin(ang-.45)*s);c.lineTo(q.x-Math.cos(ang+.45)*s,q.y-Math.sin(ang+.45)*s);c.closePath();c.fill();
 c.restore();
}
// Drawn by the renderer after units and foreground (world transform), so bodies never cover it.
function drawGuides(c,scene,engine){
 try{const app=G.HonroApp,active=engine?.active;if(app?.engine!==engine||!active)return;
  c.save();c.globalAlpha*=.62;for(const d of destinations(app))draw(c,scene,active,d);c.restore();}catch{}
}
G.HonroLinkGuide={version:2,destinations,draw:drawGuides};
})(globalThis);
