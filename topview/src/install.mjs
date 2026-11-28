import {groundProjection} from './space.mjs';
import {terrainSpace,center} from './terrain.mjs';
import {spatialEngine} from './engine.mjs';
import {groundScene} from './scene.mjs';

const G=globalThis, product=G.HonroTopview;
const base=new URL('../',import.meta.url);
const load=async path=>{const r=await fetch(new URL(path,base));if(!r.ok)throw Error(path+' '+r.status);return r.json();};
const map=await load('data/yeonmok.json'),space=terrainSpace(map);
const textures=[...new Set(map.terrain)].map(n=>[n+'_texture','assets/terrain/'+n+'_texture.png']);
const props=[...new Set(map.objects.map(o=>o.asset))].map(n=>[n,'assets/props/'+n+'.png']);
const actors=['seolo','hound','boar','stag','crow','bat','ghost','cart','woodcutter'].map(n=>[n,'assets/actors/'+n+'.webp']);
const images=new Map(await Promise.all([...textures,...props,...actors].map(async ([id,path])=>{
  const image=new Image();image.src=new URL(path,base);await image.decode();return [id,image];
})));
product.projection=groundProjection(space.cell,map.tileWidth,map.tileHeight);
product.Engine=spatialEngine(G.HONRO_CORE,space);product.Scene=groundScene(G.HonroScene,space,images,product.projection);
product.controls={x:0,y:0};
product.atExit=(b,u,m)=>Math.hypot(u.x-m.x,center(u).y-m.y)<=120;

const rules=G.HonroStageRules, sanitize=rules.sanitizeStageBattle;
rules.sanitizeStageBattle=b=>b?.honroTopview?b:sanitize(b);
const place=G.HonroTerrain.place;
G.HonroTerrain.place=function(b,u,options){
  if(!b.honroTopview)return place.call(this,b,u,options);
  const p=space.free(center(u),u.r,options?.flying,b.units.filter(v=>v.id!==u.id));
  return p?{x:p.x,y:p.y+u.h*.5}:null;
};
const top=G.HonroWorld.top;
G.HonroWorld.top=function(b,x,y,...args){return b.honroTopview?(Number.isFinite(y)?y:space.point('cart-wave').y):top.call(this,b,x,y,...args);};
const loader=G.HonroCampaignLoader;
G.HonroCampaignLoader={...loader,destination:()=>1,prewarmNext(){},ensureStage(id){if(id!==1)return Promise.reject(Error('이 데모는 연목 고갯길까지입니다.'));return loader.ensureStage(id);}};

function prepare(b) {
  if(b.honroTopview){if(b.honroTopview!==1||b.honroStage!==1)throw Error('알 수 없는 탑뷰 지도 판본');return;}
  if(b.honroStage!==1||b.mode!=='campaign')throw Error('장 배치가 없습니다.');
  b.honroTopview=1;b.width=space.width;b.height=space.height;b.vertical=false;
  b.honroPlayBounds={x:0,y:0,w:b.width,h:b.height};b.honroTerrainBounds={...b.honroPlayBounds};
  for(const key of ['terrain','waters','drafts','fields','decor','honroElements','honroWorldTerrain','honroLandmarks','honroSurfaceZones','routePoints'])b[key]=[];
  b.wind=0;const cross=space.point('crosswind');
  b.physics=G.HONRO_CORE.makePhysics({gravity:{x:0,y:0},regions:[{id:'개울 횡풍',x:cross.x-330,y:cross.y-280,w:660,h:560,gravity:{x:-65,y:115},projectileOnly:true}]});
  const placed=[];
  for(const u of b.units){
    if(!map.anchors[u.id])throw Error('배치 누락 '+u.id);
    const fl=!!G.HonroWorld.archetypes[u.honroVariant||u.honroType]?.flying;
    const p=space.free(space.point(u.id),u.r,fl,placed);if(!p)throw Error('막힌 배치 '+u.id);
    Object.assign(u,{x:p.x,y:p.y+u.h*.5,spawnX:p.x,spawnY:p.y+u.h*.5,vx:0,vy:0,angle:0,tvHeading:{x:1,y:0}});placed.push(u);
  }
  for(const m of b.honroMarkers)Object.assign(m,space.point(m.id));
  for(const ev of b.honroEvents){
    ev.when.progress=space.point(ev.id).x;
    if(ev.action?.type==='spawn')Object.assign(ev.action,space.point('cart-wave'));
  }
  const originalAnchors={start:'p-archer',cart:'cart',shrine:'marker-4',lookout:'more',ridge:'ridge',woodcutter:'witness',exit:'marker-7'};
  for(const [id,source] of Object.entries(originalAnchors))b.honroMapAnchors[id]=space.point(source);
  const witness=b.honroStaging?.hidden?.['npc-woodcutter'];
  if(witness){const p=space.point('witness');Object.assign(witness,{x:p.x,y:p.y+witness.h/2,spawnX:p.x,spawnY:p.y+witness.h/2});}
  b.sceneVersion++;
}

product.configure=function(App) {
  const P=App.prototype, mount=P.mount, launch=P.launch, outcome=P.outcome;
  P.mount=function(b,opts){prepare(b);const result=mount.call(this,b,opts);bindField(this);return result;};
  P.launch=function(id=1,training=false,skill=null){
    if(id!==1||training){this.notify('이번 여정은 연목 고갯길까지입니다.');return;}
    return launch.call(this,1,false,skill);
  };
  P.showTitle=function(){
    this.stopBattle();this.close();this.screen='title';
    const pending=this.profile.honroBattle?.honroTopview===1;
    this.root.innerHTML='<main class="tv-title"><section><p class="tv-act">혼로 &nbsp; / &nbsp; 제1막 제1장</p><h1>연목 고갯길</h1><p>나루로 가는 길에서, 설오는 뒤집힌 수레와 마주쳤다.</p><div class="tv-title-actions"><button id="tv-start" class="primary">'+(pending?'이어서 걷기':this.profile.cleared?.[1]?'고갯길 다시 걷기':'고갯길 들어가기')+'</button><button data-action="settings">설정</button></div></section></main>';
    const artwork=G.HONRO_STAGE_INTRO_ART?.[1];if(artwork)this.root.firstElementChild.style.setProperty('--chapter-art','url("'+artwork+'")');
    this.root.querySelector('#tv-start').onclick=()=>{this.audio?.unlock?.();if(pending)this.continue();else this.launch(1);};
  };
  // Leaving the licensed chapter returns to the demo title. Menus for equipment,
  // skills, reports and settings continue to use the original runtime.
  P.showMap=P.showRest=P.showAtlas=function(){this.showTitle();};
  P.outcome=function(...args){const result=outcome.apply(this,args);
    if(this.done&&this.modal.classList.contains('open')){
      for(const button of this.modal.querySelectorAll('[data-action="rest"],[data-action="map"],[data-action="next"],[data-action="journey-after-result"]')){
        button.dataset.action='title';button.textContent='데모 타이틀';
      }
    }return result;
  };
}
function bindField(app){
  const scene=app.scene,canvas=scene.canvas,control=product.controls,stick=document.getElementById('stick');
  control.x=control.y=0;
  const hud=document.querySelector('.battle');hud.classList.add('tv-field');
  const bar=document.createElement('div');bar.className='tv-toolbar';
  bar.innerHTML='<button type="button" data-mode="walk" aria-pressed="true">이동</button><button type="button" data-mode="aim" aria-pressed="false">조준</button><button type="button" data-zoom="out" aria-label="축소">−</button><button type="button" data-zoom="in" aria-label="확대">＋</button><button type="button" data-map aria-label="전장 전체 보기">전장</button>';
  hud.append(bar);let mode='walk';const pointers=new Map();let initialPinch=null,dragged=false,start=null;
  function setMode(m){mode=m;for(const b of bar.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===mode));}
  bar.onclick=ev=>{const t=ev.target.closest('button');if(!t)return;if(t.dataset.mode)setMode(t.dataset.mode);
    if(t.dataset.zoom){scene.zoomLevel=Math.min(3.2,Math.max(.52,scene.zoomLevel*(t.dataset.zoom==='in'?1.25:.8)));scene.panOffset={x:0,y:0};}
    if(t.hasAttribute('data-map')){
      scene.overview=!scene.overview;const r=canvas.getBoundingClientRect();
      scene.zoomLevel=scene.overview?Math.min(r.width/(groundW()+40),r.height/(groundH()+110)):1.45;
      scene.panOffset={x:0,y:0};
    }};
  const groundW=()=>(map.width+map.height)*map.tileWidth/2,groundH=()=>(map.width+map.height)*map.tileHeight/2;
  const xy=ev=>{const r=canvas.getBoundingClientRect();return{x:ev.clientX-r.left,y:ev.clientY-r.top};};
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const aim=p=>{if(!app.canInput())return;const u=app.engine.active,a=center(u);u.angle=Math.atan2(a.y-p.y,p.x-a.x)*180/Math.PI;u.facing=p.x>=a.x?1:-1;u.tvHeading={x:p.x-a.x,y:p.y-a.y};app.dirty=true;};
  function tap(point){
    if(!app.canInput())return;const e=app.engine,u=e.active,z=scene.world(point.x,point.y);
    const target=e.b.units.find(v=>v.side===1&&!v.dead&&dist(center(v),z)<=Math.max(v.r,58/scene.zoomLevel));
    if(mode==='aim'){aim(target?center(target):z);return;}
    const path=space.route(center(u),z,u.r);if(path.length){u.tvPath=path;app.dirty=true;}else app.notify('발을 디딜 길이 없습니다.');
  }
  // Replace gestures on the field alone. Native HUD charge/release, defend and
  // modal controls keep their original handlers.
  function handle(type,fn){canvas.addEventListener(type,ev=>{ev.preventDefault();ev.stopImmediatePropagation();fn(ev);},{capture:true,passive:false});}
  handle('pointerdown',ev=>{const p=xy(ev);canvas.setPointerCapture(ev.pointerId);pointers.set(ev.pointerId,p);start=p;dragged=false;
    if(pointers.size===2){const [a,b]=[...pointers.values()];initialPinch={dist:dist(a,b),zoom:scene.zoomLevel};dragged=true;}});
  handle('pointermove',ev=>{if(!pointers.has(ev.pointerId))return;const p=xy(ev),prev=pointers.get(ev.pointerId);pointers.set(ev.pointerId,p);
    if(initialPinch&&pointers.size===2){const [a,b]=[...pointers.values()];scene.zoomLevel=Math.max(.52,Math.min(3.2,initialPinch.zoom*dist(a,b)/Math.max(1,initialPinch.dist)));return;}
    if(!start)return;if(dist(start,p)>8)dragged=true;
    if(dragged){scene.panOffset.x-=(p.x-prev.x)/scene.zoomLevel;scene.panOffset.y-=(p.y-prev.y)/scene.zoomLevel;}});
  handle('pointerup',ev=>{if(pointers.size===1&&!dragged&&!initialPinch)tap(xy(ev));pointers.delete(ev.pointerId);if(!pointers.size){initialPinch=null;start=null;}});
  handle('pointercancel',ev=>{pointers.delete(ev.pointerId);dragged=true;initialPinch=null;});
  handle('wheel',ev=>{const p=xy(ev);scene.zoom(Math.exp(-ev.deltaY*.001),p.x,p.y);});
  if(stick){
    let sid=null;const push=ev=>{const r=stick.getBoundingClientRect(),x=ev.clientX-r.left-r.width/2,y=ev.clientY-r.top-r.height/2,m=Math.hypot(x,y);
      control.x=m>5?x/m:0;control.y=m>5?y/m:0;};
    for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,ev=>{
      ev.stopImmediatePropagation();ev.preventDefault();
      if(type==='pointerdown'){sid=ev.pointerId;stick.setPointerCapture(sid);push(ev);}
      else if(sid===ev.pointerId){if(type==='pointermove')push(ev);else{sid=null;control.x=control.y=0;}}
    },{capture:true,passive:false});
  }
}
const held=new Set(),dirs={KeyW:[0,-1],KeyS:[0,1],KeyA:[-1,0],KeyD:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
for(const type of ['keydown','keyup'])window.addEventListener(type,ev=>{
  if(!dirs[ev.code]||G.HonroApp?.screen!=='battle'||G.HonroApp?.dialogue||G.HonroApp?.modal?.classList.contains('open'))return;
  ev.preventDefault();ev.stopImmediatePropagation();if(type==='keydown')held.add(ev.code);else held.delete(ev.code);
  const c=product.controls;c.x=c.y=0;for(const key of held){c.x+=dirs[key][0];c.y+=dirs[key][1];}
},{capture:true});
window.addEventListener('blur',()=>{held.clear();product.controls.x=product.controls.y=0;});
