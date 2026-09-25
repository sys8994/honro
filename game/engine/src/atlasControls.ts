import {clamp} from './math';
import {ATLAS_WIDTH,ATLAS_HEIGHT} from './atlasLayout';
export interface AtlasView {x:number;y:number;zoom:number;}
/** One gesture owner for the atlas. World motion never zooms the HUD or the page. */
export class AtlasController{
 x=0;y=0;zoom=.6;
 private pointers=new Map<number,{x:number;y:number}>();
 private start:{x:number;y:number;target:HTMLElement|null}|null=null;
 private moved=false;private multi=false;private pair:{x:number;y:number;distance:number}|null=null;
 private abort=new AbortController();private observer:ResizeObserver;
 constructor(readonly viewport:HTMLElement,readonly board:HTMLElement,state?:AtlasView){
  if(state)Object.assign(this,state);
  const opts={signal:this.abort.signal};
  viewport.addEventListener('pointerdown',this.down,opts);viewport.addEventListener('pointermove',this.move,opts);
  viewport.addEventListener('pointerup',this.up,opts);viewport.addEventListener('pointercancel',this.cancel,opts);
  viewport.addEventListener('lostpointercapture',this.cancel,opts);
  viewport.addEventListener('wheel',this.wheel,{...opts,passive:false});
  viewport.addEventListener('contextmenu',e=>e.preventDefault(),opts);
  // Pointer taps are dispatched once by the gesture owner; keyboard click/detail=0 remains native.
  viewport.addEventListener('click',e=>{if(e.isTrusted&&e.detail>0){e.preventDefault();e.stopImmediatePropagation();}}, {...opts,capture:true});
  viewport.addEventListener('keydown',e=>{const el=e.target as HTMLElement;if(['INPUT','SELECT'].includes(el.tagName))return;if(e.key==='+'||e.key==='='){this.zoomAt(this.zoom*1.25,viewport.clientWidth/2,viewport.clientHeight/2);e.preventDefault();}if(e.key==='-'){this.zoomAt(this.zoom/1.25,viewport.clientWidth/2,viewport.clientHeight/2);e.preventDefault();}},opts);
  viewport.addEventListener('focusin',e=>{const el=(e.target as HTMLElement).closest<HTMLElement>('[data-map-x]');if(!el)return;const r=el.getBoundingClientRect(),v=viewport.getBoundingClientRect();if(r.left<v.left||r.right>v.right||r.top<v.top||r.bottom>v.bottom)this.focus(Number(el.dataset.mapX),Number(el.dataset.mapY));},opts);
  this.observer=new ResizeObserver(()=>{this.zoom=clamp(this.zoom,this.minZoom(),1.3);this.apply();});this.observer.observe(viewport);
  this.apply();
 }
 private boardWidth(){return Number.parseFloat(this.board.style.width)||this.board.offsetWidth||ATLAS_WIDTH;}
 private boardHeight(){return Number.parseFloat(this.board.style.height)||this.board.offsetHeight||ATLAS_HEIGHT;}
 minZoom(){const bw=this.boardWidth(),bh=this.boardHeight();return Math.max(.075,Math.min(this.viewport.clientWidth/bw,this.viewport.clientHeight/bh)*.94);}
 state():AtlasView{return{x:this.x,y:this.y,zoom:this.zoom};}
 destroy(){this.abort.abort();this.observer.disconnect();this.pointers.clear();}
 focus(wx:number,wy:number,zoom=this.zoom){this.zoom=clamp(zoom,this.minZoom(),1.3);this.x=this.viewport.clientWidth*.5-wx*this.zoom;this.y=this.viewport.clientHeight*.5-wy*this.zoom;this.apply();}
 fit(){this.focus(this.boardWidth()/2,this.boardHeight()/2,this.minZoom());}
 zoomAt(z:number,sx:number,sy:number){const wx=(sx-this.x)/this.zoom,wy=(sy-this.y)/this.zoom;this.zoom=clamp(z,this.minZoom(),1.3);this.x=sx-wx*this.zoom;this.y=sy-wy*this.zoom;this.apply();}
 apply(){
  const w=this.viewport.clientWidth,h=this.viewport.clientHeight,sw=this.boardWidth()*this.zoom,sh=this.boardHeight()*this.zoom;
  this.x=sw<w?(w-sw)/2:clamp(this.x,w-sw-60,60);this.y=sh<h?(h-sh)/2:clamp(this.y,h-sh-60,60);
  this.board.style.transform=`translate(${this.x}px,${this.y}px) scale(${this.zoom})`;
  this.board.style.setProperty('--atlas-scale',String(this.zoom));
  this.board.style.setProperty('--atlas-inverse',String(1/this.zoom));
  this.board.dataset.detail=this.zoom<.16?'continental':this.zoom<.28?'overview':this.zoom<.54?'regional':'local';
  this.viewport.setAttribute('aria-label','원정 지도 · 두 손가락 확대 및 축소');
  const read=document.getElementById('atlas-zoom');if(read)read.textContent=Math.round(this.zoom*100)+'%';
 }
 private point(e:PointerEvent){const r=this.viewport.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
 private two(){const ps=[...this.pointers.values()];if(ps.length<2)return null;return{x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2,distance:Math.max(1,Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y))};}
 private down=(e:PointerEvent)=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();const p=this.point(e);this.pointers.set(e.pointerId,p);
  try{this.viewport.setPointerCapture(e.pointerId);}catch{}
  if(this.pointers.size===1){this.start={...p,target:(e.target as HTMLElement).closest?.<HTMLElement>('[data-action]')||null};this.moved=false;this.multi=false;}
  if(this.pointers.size>=2){this.multi=true;this.moved=true;this.pair=this.two();}
 };
 private move=(e:PointerEvent)=>{
  if(!this.pointers.has(e.pointerId))return;e.preventDefault();const prev=this.pointers.get(e.pointerId)!,p=this.point(e);this.pointers.set(e.pointerId,p);
  if(this.pointers.size>=2){const next=this.two();if(next&&this.pair){this.zoomAt(this.zoom*next.distance/this.pair.distance,this.pair.x,this.pair.y);this.x+=next.x-this.pair.x;this.y+=next.y-this.pair.y;this.apply();}this.pair=next;return;}
  if(this.multi)return;
  if(this.start&&Math.hypot(p.x-this.start.x,p.y-this.start.y)>7)this.moved=true;
  if(this.moved){this.x+=p.x-prev.x;this.y+=p.y-prev.y;this.apply();}
 };
 private end(e:PointerEvent,cancelled:boolean){
  if(!this.pointers.has(e.pointerId))return;
  const tap=!cancelled&&!this.moved&&!this.multi&&this.pointers.size===1?this.start?.target:null;
  this.pointers.delete(e.pointerId);
  if(this.pointers.size<2)this.pair=null;
  if(!this.pointers.size){this.start=null;this.multi=false;this.moved=false;}
  try{if(this.viewport.hasPointerCapture(e.pointerId))this.viewport.releasePointerCapture(e.pointerId);}catch{}
  if(tap?.isConnected){tap.focus({preventScroll:true});tap.click();}
 }
 private up=(e:PointerEvent)=>this.end(e,false);
 private cancel=(e:PointerEvent)=>this.end(e,true);
 private wheel=(e:WheelEvent)=>{e.preventDefault();const r=this.viewport.getBoundingClientRect();this.zoomAt(this.zoom*Math.exp(-clamp(e.deltaY,-160,160)*.0018),e.clientX-r.left,e.clientY-r.top);};
}
