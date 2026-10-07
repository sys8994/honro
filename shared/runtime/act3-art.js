(function(G){'use strict';
// Shared render-only guidance; authored geometry remains the sole collision.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,A=G.HonroAct3;
function guide(b){if(!A.active(b))return null;const s=A.current(b);if(!s)return null;const m=A.marker(b,s.id);if(!m)return null;const h=b.honroState?.act3?.holds?.[s.id];return{step:s,marker:m,hold:h,remaining:b.honroStage===27&&!b.honroState?.act3?.done?.['fire-screen']?Math.max(0,12-(b.honroState?.act3?.fireTurns||0)):null};}
function region(c,x,y,r){
 // Exact same-floor eligibility region: abs(dy)<=150 and dx²+(.75dy)²<=r².
 const half=Math.min(150,r/.75),edge=Math.sqrt(Math.max(0,r*r-(half*.75)**2));c.beginPath();c.moveTo(x-edge,y-half);c.lineTo(x+edge,y-half);
 for(let i=1;i<=18;i++){const yy=-half+2*half*i/18;c.lineTo(x+Math.sqrt(Math.max(0,r*r-(yy*.75)**2)),y+yy);}c.lineTo(x-edge,y+half);
 for(let i=17;i>=0;i--){const yy=-half+2*half*i/18;c.lineTo(x-Math.sqrt(Math.max(0,r*r-(yy*.75)**2)),y+yy);}c.closePath();
}
function draw(c,scene,b){const q=guide(b);if(!q||scene.editorView||scene.skillPreview)return;const {step:s,marker:m,hold:h}=q,z=Math.max(.05,scene.scale),color=h?.contested?'#e8a47b':h?.guarded?'#adcbb8':'#ebd4a0';c.save();
 if(s.kind==='hold'||s.kind==='reach'&&s.allHeroes){region(c,m.x,m.y,s.radius||440);c.fillStyle=color+'12';c.fill();c.strokeStyle=color+'c0';c.lineWidth=1.5/z;c.stroke();if(s.kind==='hold'){region(c,m.x,m.y,s.contestRadius||230);c.setLineDash([5/z,7/z]);c.strokeStyle='#e3b29499';c.stroke();c.setLineDash([]);}}
 if(s.kind==='destroy'){const t=b.terrain.find(t=>t.id===s.id&&!t.broken);if(t){c.beginPath();C.poly(t).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.strokeStyle='#f4d89b';c.lineWidth=2/z;c.stroke();}}
 else{const target=A.interactionTarget(b,m)||m;c.strokeStyle=color;c.lineWidth=2/z;c.beginPath();c.ellipse(target.x,target.y-3,34,9,0,0,Math.PI*2);c.stroke();}
 // Fire symbols are attached to the live control sites; stopping each control
 // visibly removes its pressure. They do not add hidden damage or world rules.
 if(q.remaining!==null)for(const id of ['water-release','fire-screen'])if(!b.honroState?.act3?.done?.[id]){const p=A.marker(b,id);if(!p)continue;c.save();c.translate(p.x,p.y-18);const sway=Math.sin((scene.time||0)*3)*8;c.fillStyle='#bd704566';c.beginPath();c.moveTo(-35,0);c.quadraticCurveTo(-43,-55,-13+sway,-88);c.quadraticCurveTo(-12,-48,7,-60);c.quadraticCurveTo(32,-115,40+sway,-147);c.quadraticCurveTo(64,-54,35,0);c.closePath();c.fill();c.restore();}
 c.restore();
}
const tone=S.environmentTone;S.environmentTone=function(c,w,h,b){tone?.call(this,c,w,h,b);if(!A.active(b))return;c.save();c.translate(w/2,h/2);c.scale(this.scale,this.scale);c.translate(-this.x,-this.y);draw(c,this,b);c.restore();};
G.HonroAct3Art={guide,draw,region};
})(globalThis);
