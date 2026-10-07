(function(G){'use strict';
// Shared render-only guidance; authored geometry remains the sole collision.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,A=G.HonroAct3;
function guide(b){if(!A.active(b))return null;const s=A.steps(b).find(s=>!b.honroState?.act3?.done?.[s.id]);if(!s)return null;const m=A.marker(b,s.id);if(!m)return null;const h=b.honroState?.act3?.holds?.[s.id];return{step:s,marker:m,hold:h,remaining:b.honroStage===27&&!b.honroState?.act3?.done?.['fire-screen']?Math.max(0,12-(b.honroState?.act3?.fireTurns||0)):null};}
function region(c,x,y,r){
 // Exact same-floor eligibility region: abs(dy)<=150 and dx²+(.75dy)²<=r².
 const half=Math.min(150,r/.75),edge=Math.sqrt(Math.max(0,r*r-(half*.75)**2));c.beginPath();c.moveTo(x-edge,y-half);c.lineTo(x+edge,y-half);
 for(let i=1;i<=18;i++){const yy=-half+2*half*i/18;c.lineTo(x+Math.sqrt(Math.max(0,r*r-(yy*.75)**2)),y+yy);}c.lineTo(x-edge,y+half);
 for(let i=17;i>=0;i--){const yy=-half+2*half*i/18;c.lineTo(x-Math.sqrt(Math.max(0,r*r-(yy*.75)**2)),y+yy);}c.closePath();
}
function draw(c,scene,b){const q=guide(b);if(!q||scene.editorView||scene.skillPreview)return;const {step:s,marker:m,hold:h}=q,z=Math.max(.05,scene.scale),color=h?.contested?'#e8a47b':h?.guarded?'#adcbb8':'#ebd4a0';c.save();
 if(s.kind==='hold'||s.kind==='reach'&&s.allHeroes){region(c,m.x,m.y,s.radius||440);c.fillStyle=color+'12';c.fill();c.strokeStyle=color+'c0';c.lineWidth=1.5/z;c.stroke();if(s.kind==='hold'){region(c,m.x,m.y,s.contestRadius||230);c.setLineDash([5/z,7/z]);c.strokeStyle='#e3b29499';c.stroke();c.setLineDash([]);}}
 if(s.kind==='destroy'){const t=b.terrain.find(t=>t.id===s.id&&!t.broken);if(t){c.beginPath();C.poly(t).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.strokeStyle='#f4d89b';c.lineWidth=2/z;c.stroke();}}
 else{const target=A.interactionTarget(b,m)||m;c.strokeStyle=color;c.lineWidth=2/z;c.beginPath();c.ellipse(target.x,target.y-3,34,9,0,0,Math.PI*2);c.stroke();
  c.save();c.translate(target.x,target.y-(target===m?38:(target.h||92)+24));const scale=Math.max(1,.5/z);c.scale(scale,scale);c.lineWidth=2;
  if(s.kind==='rescue'||s.startsEscort){c.beginPath();c.arc(0,-13,7,0,Math.PI*2);c.moveTo(-13,10);c.quadraticCurveTo(-13,-5,0,-5);c.quadraticCurveTo(13,-5,13,10);c.stroke();}
  else if(s.kind==='reach'||s.kind==='escort'){c.beginPath();c.moveTo(-10,15);c.lineTo(-10,-23);c.lineTo(18,-14);c.lineTo(-10,-5);c.stroke();}
  else if(s.kind!=='hold'){c.fillStyle='#dec99b';c.fillRect(-17,-22,34,34);c.strokeRect(-17,-22,34,34);c.beginPath();c.moveTo(-22,-22);c.lineTo(22,-22);c.moveTo(-22,12);c.lineTo(22,12);c.stroke();c.strokeStyle='#766548';c.lineWidth=1.5;for(let i=0;i<3;i++){c.beginPath();c.moveTo(-10,-13+i*8);c.lineTo(10,-13+i*8);c.stroke();}}
  c.restore();}
 // Fire symbols are attached to the live control sites; stopping each control
 // visibly removes its pressure. They do not add hidden damage or world rules.
 if(q.remaining!==null)for(const [id,site] of [['water-release','fire-west'],['fire-screen','fire-east']])if(!b.honroState?.act3?.done?.[id]){const p=A.marker(b,site)||A.marker(b,id);if(!p)continue;c.save();c.translate(p.x,p.y-8);
  const light=c.createRadialGradient(0,-100,8,0,-100,210);light.addColorStop(0,'#efb86555');light.addColorStop(1,'#e6934100');c.fillStyle=light;c.fillRect(-210,-310,420,420);
  for(const [i,x,scale] of [[0,-47,.8],[1,8,1.12],[2,48,.74]]){c.save();c.translate(x,0);c.scale(scale,scale);const sway=Math.sin((scene.time||0)*3+i*1.7)*14;c.fillStyle=i===1?'#ecb45baa':'#cb773dcc';c.beginPath();c.moveTo(-40,0);c.quadraticCurveTo(-58,-81,-14+sway,-155);c.quadraticCurveTo(-15,-73,8,-96);c.quadraticCurveTo(20,-166,37+sway,-221);c.quadraticCurveTo(72,-71,35,0);c.closePath();c.fill();c.restore();}c.restore();}
 c.restore();
}
const tone=S.environmentTone;S.environmentTone=function(c,w,h,b){tone?.call(this,c,w,h,b);if(!A.active(b))return;c.save();c.translate(w/2,h/2);c.scale(this.scale,this.scale);c.translate(-this.x,-this.y);draw(c,this,b);c.restore();};
G.HonroAct3Art={guide,draw,region};
})(globalThis);
