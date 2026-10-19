/* Standalone art camera only. No engine, combat, persistence, or idle RAF. */
'use strict';
const scene=document.querySelector('#scene'), viewport=document.querySelector('#viewport');
const state={x:2200,y:1735,scale:.6,mode:'closeup'}, pointers=new Map();
let lastGesture=null, outline=false;
function size(){return {w:viewport.clientWidth,h:viewport.clientHeight};}
function minimum(){const {w,h}=size();return Math.min(w/6240,h/3200);}
function render(){
 const {w,h}=size();state.scale=Math.max(minimum(),Math.min(2,state.scale));
 // The full mountain continues beyond every permitted camera rectangle.
 state.x=Math.max(-650,Math.min(6650,state.x));state.y=Math.max(600,Math.min(2700,state.y));
 scene.setAttribute('viewBox',`${state.x-w/state.scale/2} ${state.y-h/state.scale/2} ${w/state.scale} ${h/state.scale}`);
 document.querySelector('#overview').setAttribute('aria-pressed',String(state.mode==='overview'));
 document.querySelector('#closeup').setAttribute('aria-pressed',String(state.mode==='closeup'));
}
function preset(mode){state.mode=mode;const {w,h}=size();if(mode==='overview'){state.x=3000;state.y=1500;state.scale=minimum();}else{state.x=2200;state.y=1735;state.scale=w<600?Math.min(w/1050,h/1450):Math.min(w/2400,h/1470);}render();}
function zoom(factor,x,y){const {w,h}=size(),old=state.scale,next=Math.max(minimum(),Math.min(2,old*factor));state.x+=(x-w/2)*(1/old-1/next);state.y+=(y-h/2)*(1/old-1/next);state.scale=next;state.mode='manual';render();}
function gesture(){const p=[...pointers.values()];if(!p.length)return null;return p.length===1?{x:p[0].x,y:p[0].y,d:0}:{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)};}
viewport.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.0015),e.clientX,e.clientY);},{passive:false});
viewport.addEventListener('pointerdown',e=>{viewport.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});lastGesture=gesture();});
viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const g=gesture();if(lastGesture){state.x-=(g.x-lastGesture.x)/state.scale;state.y-=(g.y-lastGesture.y)/state.scale;if(g.d&&lastGesture.d)zoom(g.d/lastGesture.d,g.x,g.y);state.mode='manual';render();}lastGesture=g;});
for(const type of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(type,e=>{pointers.delete(e.pointerId);lastGesture=gesture();});
viewport.addEventListener('keydown',e=>{const step=100/state.scale;if(e.key==='ArrowLeft')state.x-=step;else if(e.key==='ArrowRight')state.x+=step;else if(e.key==='ArrowUp')state.y-=step;else if(e.key==='ArrowDown')state.y+=step;else if(e.key==='+'||e.key==='='){zoom(1.2,...[size().w/2,size().h/2]);e.preventDefault();return;}else if(e.key==='-'){zoom(1/1.2,size().w/2,size().h/2);e.preventDefault();return;}else return;e.preventDefault();state.mode='manual';render();});
document.querySelector('#overview').onclick=()=>preset('overview');
document.querySelector('#closeup').onclick=()=>preset('closeup');
document.querySelector('#outline').onclick=()=>{outline=!outline;scene.querySelector('#contact-lines')?.setAttribute('visibility',outline?'visible':'hidden');document.querySelector('#outline').setAttribute('aria-pressed',String(outline));};
new ResizeObserver(()=>{if(state.mode==='manual')render();else preset(state.mode);}).observe(viewport);
preset(new URLSearchParams(location.search).get('view')==='overview'?'overview':'closeup');
// Foreground paths arrive inline in HTML; far image loading cannot gate them.
const actor=document.createElementNS('http://www.w3.org/2000/svg','image');
actor.setAttribute('href','seol-o-scale.svg');
// Browser-measured approved idle rig: visible y 11.97595..479 (467.02405).
const actorScale=103.5/467.0240478515625;
actor.setAttribute('x',2025-340*actorScale);
actor.setAttribute('y',2101-619*actorScale);
actor.setAttribute('width',880*actorScale);actor.setAttribute('height',680*actorScale);
actor.id='scale-actor';scene.append(actor);scene.dataset.ready='true';
