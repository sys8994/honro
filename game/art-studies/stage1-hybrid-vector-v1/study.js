/* Standalone authoring camera. No game state, motion loop or full-map raster cache. */
import {compileScene,drawCanvas,HUMAN_H} from '../../../shared/runtime/environment-vector-kit.mjs';
import {STAGE1} from './shared-kit/stage1.scene.mjs';
const canvas=document.querySelector('#scene'),viewport=document.querySelector('#viewport'),ctx=canvas.getContext('2d');
const compiled=compileScene(STAGE1),state={x:2200,y:1735,scale:.6,mode:'closeup'},pointers=new Map();
const actor=new Image();actor.src='seol-o-scale.svg';actor.onload=()=>render();
let lastGesture=null,outline=false;
function size(){return{w:viewport.clientWidth,h:viewport.clientHeight};}
function minimum(){const {w,h}=size();return Math.min(w/6240,h/3200);}
function render(){
 const {w,h}=size(),dpr=Math.min(2,devicePixelRatio||1);state.scale=Math.max(minimum(),Math.min(2,state.scale));state.x=Math.max(-650,Math.min(6650,state.x));state.y=Math.max(600,Math.min(2700,state.y));
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.translate(w/2,h/2);ctx.scale(state.scale,state.scale);ctx.translate(-state.x,-state.y);
 drawCanvas(ctx,compiled,{viewBounds:{x:state.x-w/state.scale/2,y:state.y-h/state.scale/2,w:w/state.scale,h:h/state.scale}});
 if(actor.complete&&actor.naturalWidth){const s=HUMAN_H/467.0240478515625;ctx.drawImage(actor,2025-340*s,2101-619*s,880*s,680*s);}
 if(outline){ctx.save();ctx.strokeStyle='#e5d68b';ctx.lineWidth=2/state.scale;ctx.setLineDash([8/state.scale,7/state.scale]);ctx.stroke(new Path2D(compiled.terrain.profileD));ctx.restore();}
 canvas.dataset.actorReady=String(actor.complete&&actor.naturalWidth>0);canvas.dataset.ready='true';canvas.dataset.actorPixels=(HUMAN_H*state.scale).toFixed(2);canvas.dataset.instanceCount=compiled.nodes.length;
 document.querySelector('#overview').setAttribute('aria-pressed',String(state.mode==='overview'));document.querySelector('#closeup').setAttribute('aria-pressed',String(state.mode==='closeup'));
}
function preset(mode){state.mode=mode;const {w,h}=size();if(mode==='overview'){state.x=3000;state.y=1500;state.scale=minimum();}else{state.scale=Math.min(1.25,Math.min(w,h)*.12/HUMAN_H);state.x=2025+(.5-.36)*w/state.scale;state.y=2101-(.7-.5)*h/state.scale;}render();}
function zoom(f,x,y){const {w,h}=size(),old=state.scale,next=Math.max(minimum(),Math.min(2,old*f));state.x+=(x-w/2)*(1/old-1/next);state.y+=(y-h/2)*(1/old-1/next);state.scale=next;state.mode='manual';render();}
function gesture(){const p=[...pointers.values()];return!p.length?null:p.length===1?{...p[0],d:0}:{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)};}
viewport.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.0015),e.clientX,e.clientY);},{passive:false});
viewport.addEventListener('pointerdown',e=>{viewport.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});lastGesture=gesture();});
viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const g=gesture();if(lastGesture){state.x-=(g.x-lastGesture.x)/state.scale;state.y-=(g.y-lastGesture.y)/state.scale;if(g.d&&lastGesture.d)zoom(g.d/lastGesture.d,g.x,g.y);state.mode='manual';render();}lastGesture=g;});
for(const type of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(type,e=>{pointers.delete(e.pointerId);lastGesture=gesture();});
viewport.addEventListener('keydown',e=>{const step=100/state.scale;if(e.key==='ArrowLeft')state.x-=step;else if(e.key==='ArrowRight')state.x+=step;else if(e.key==='ArrowUp')state.y-=step;else if(e.key==='ArrowDown')state.y+=step;else if(e.key==='+'||e.key==='='){zoom(1.2,size().w/2,size().h/2);e.preventDefault();return;}else if(e.key==='-'){zoom(1/1.2,size().w/2,size().h/2);e.preventDefault();return;}else return;e.preventDefault();state.mode='manual';render();});
document.querySelector('#overview').onclick=()=>preset('overview');document.querySelector('#closeup').onclick=()=>preset('closeup');document.querySelector('#outline').onclick=()=>{outline=!outline;document.querySelector('#outline').setAttribute('aria-pressed',String(outline));render();};
new ResizeObserver(()=>state.mode==='manual'?render():preset(state.mode)).observe(viewport);preset(new URLSearchParams(location.search).get('view')==='overview'?'overview':'closeup');
// Authoring evidence exposes immutable source references, not game integration hooks.
globalThis.HonroKitStudy={compiled,render};
