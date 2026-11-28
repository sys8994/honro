import {groundProjection} from './space.mjs';
import {terrainSpace,center} from './terrain.mjs';
import {spatialEngine} from './engine.mjs';
import {groundScene} from './scene.mjs';
import {animals} from './actors.mjs';

const G=globalThis, product=G.HonroTopview;
const base=new URL('../',import.meta.url);
const load=async path=>{const r=await fetch(new URL(path,base));if(!r.ok)throw Error(path+' '+r.status);return r.json();};
const map=await load('data/yeonmok.json'),space=terrainSpace(map);
const textures=[...new Set(map.terrain)].map(n=>[n+'_texture','assets/terrain/'+n+'_texture.png']);
const props=[...new Set(map.objects.map(o=>o.asset))].map(n=>[n,'assets/props/'+n+'.png']);
props.push(['bridge-near','assets/props/bridge-near.png']);
const actors=['seolo','seolo-front','seolo-states','seolo-bow',...animals.map(id=>'turns-'+id),'cart','woodcutter'].map(n=>[n,'assets/actors/'+n+'.webp']);
const images=new Map(await Promise.all([...textures,...props,...actors].map(async ([id,path])=>{
  const image=new Image();image.src=new URL(path,base);await image.decode();return [id,image];
})));
product.projection=groundProjection(space.cell,map.tileWidth,map.tileHeight);
product.Engine=spatialEngine(G.HONRO_CORE,space);product.Scene=groundScene(G.HonroScene,space,images,product.projection);
product.controls={x:0,y:0};
product.atExit=(b,u,m)=>Math.hypot(u.x-m.x,center(u).y-m.y)<=120;

const nativeCapacity=G.HonroEncounters.populationCap;
G.HonroEncounters.populationCap=b=>b.honroTopview&&Number.isInteger(b.tvPopulation)?b.tvPopulation:nativeCapacity(b);
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
  b.honroTopview=1;
  b.tvPopulation=b.units.filter(u=>u.side===1).length+b.honroEvents.filter(ev=>ev.once&&ev.action?.type==='spawn').reduce((n,ev)=>n+ev.action.n,0);
  b.width=space.width;b.height=space.height;b.vertical=false;
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

const miniGround=document.createElement('canvas');miniGround.width=map.width;miniGround.height=map.height;
const miniPaint=miniGround.getContext('2d'),colors={grass:'#54694c',rock:'#76796c',path:'#ab9777',dirt:'#776b52',water:'#396c74'};
map.terrain.forEach((tile,i)=>{miniPaint.fillStyle=colors[tile];miniPaint.fillRect(i%map.width,Math.floor(i/map.width),1,1);});
product.minimap=function(app){
  const wind=document.getElementById('wind-value'),u=app.engine.active,zone=app.engine.b.physics.regions[0];
  if(wind&&u&&zone){const p=center(u);wind.textContent=p.x>=zone.x&&p.x<=zone.x+zone.w&&p.y>=zone.y&&p.y<=zone.y+zone.h?'개울 횡풍 ↙':'바람 잔잔';}
  if(!app.minimapVisible||!app.scene)return;
  const cv=document.getElementById('minimap'),w=innerWidth<700?100:145,h=Math.round(w*map.height/map.width),dpr=Math.min(2,devicePixelRatio||1);
  cv.style.setProperty('width',w+'px','important');cv.style.setProperty('height',h+'px','important');
  if(cv.width!==w*dpr||cv.height!==h*dpr){cv.width=w*dpr;cv.height=h*dpr;}
  const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingEnabled=false;c.drawImage(miniGround,0,0,w,h);
  const sx=w/space.width,sy=h/space.height;
  for(const a of app.engine.b.units){if(a.dead)continue;const p=center(a);c.fillStyle=a.side===0?'#f7e4a2':a.side===2?'#e3ceac':a.awake?'#ef8579':'#a88178';c.beginPath();c.arc(p.x*sx,p.y*sy,a.side===0?3:1.8,0,Math.PI*2);c.fill();}
  const exit=space.point('marker-7');c.strokeStyle='#ffda87';c.strokeRect(exit.x*sx-2.5,exit.y*sy-2.5,5,5);
  const scene=app.scene,rect=scene.canvas.getBoundingClientRect();
  if(!Number.isFinite(scene.cx))return;
  c.beginPath();for(const [i,[x,y]] of [[0,0],[rect.width,0],[rect.width,rect.height],[0,rect.height]].entries()){const p=scene.world(x,y);if(i)c.lineTo(p.x*sx,p.y*sy);else c.moveTo(p.x*sx,p.y*sy);}
  c.closePath();c.strokeStyle='#e1d3b2';c.lineWidth=.8;c.stroke();
};
product.configure=function(App) {
  const P=App.prototype, mount=P.mount, launch=P.launch, outcome=P.outcome, cancel=P.cancelInput, charge=P.beginCharge;
  P.cancelInput=function(){product.resetFieldInput?.();return cancel.call(this);};
  P.beginCharge=function(){const ok=charge.call(this);if(ok&&this.engine?.active)delete this.engine.active.tvPath;return ok;};
  P.mount=function(b,opts){prepare(b);const result=mount.call(this,b,opts);bindField(this);return result;};
  P.launch=function(id=1,training=false,skill=null){
    if(id!==1||training){this.notify('이번 여정은 연목 고갯길까지입니다.');return;}
    return launch.call(this,1,false,skill);
  };
  P.startTraining=function(){this.notify('이번 여정은 연목 고갯길까지입니다.');};
  P.showTitle=function(){
    this.stopBattle();this.close();this.screen='title';
    const pending=this.profile.honroBattle?.honroTopview===1;
    this.root.innerHTML='<main class="tv-title"><section><p class="tv-act">혼로 &nbsp; / &nbsp; 제1막 제1장</p><h1>연목 고갯길</h1><p>나루로 가는 길에서, 설오는 뒤집힌 수레와 마주쳤다.</p><div class="tv-title-actions"><button id="tv-start" class="primary">'+(pending?'이어서 걷기':this.profile.cleared?.[1]?'고갯길 다시 걷기':'고갯길 들어가기')+'</button><button type="button" id="tv-camp">동행과 장비</button><button data-action="settings">설정</button></div></section></main>';
    const artwork=G.HONRO_STAGE_INTRO_ART?.[1];if(artwork)this.root.firstElementChild.style.setProperty('--chapter-art','url("'+artwork+'")');
    this.root.querySelector('#tv-camp').onclick=()=>this.showCamp('archer');
    this.root.querySelector('#tv-start').onclick=()=>{this.audio?.unlock?.();if(pending)this.continue();else this.launch(1);};
  };
  // Leaving the licensed chapter returns to the demo title. Menus for equipment,
  // skills, reports and settings continue to use the original runtime.
  P.displayAngle=function(u){const a=u.angle*Math.PI/180,v=product.projection.forward(Math.cos(a),-Math.sin(a));return (Math.atan2(v.x,-v.y)*180/Math.PI+360)%360;};
  P.battleHelp=function(){this.open('<h2>연목 고갯길</h2><p>개울을 건너 나무꾼을 만나고 북동쪽 고개 끝에 닿으세요. 미니맵을 누르면 그곳을 볼 수 있습니다.</p><p>방향키·WASD·왼쪽 스틱 또는 지면을 눌러 이동합니다. 이동 잠금(L)을 켜면 발을 멈추고 입력한 방향만 봅니다. 활을 당기는 중에도 스틱으로 조준할 수 있습니다. 발사를 길게 눌렀다 놓으세요.</p><p>화살은 개울을 건너고 바위에 막힙니다. 예상 궤적은 북쪽 다리의 횡풍을 반영합니다. 방어하면 턴을 넘기며 기력을 회복합니다.</p><button data-action="close">전장으로</button>','battle-help');};
  P.showMap=P.showRest=P.showAtlas=function(){this.showTitle();};
  P.outcome=function(...args){const result=outcome.apply(this,args);
    if(this.done&&this.modal.classList.contains('open')){
      const heading=this.modal.querySelector('.result-title');
      if(heading&&this.engine.b.phase==='won')heading.textContent='연목 고갯길 · 1막 1장 데모 완료';
      for(const button of this.modal.querySelectorAll('[data-action="rest"],[data-action="map"],[data-action="next"],[data-action="journey-after-result"],[data-action="result-continue"]')){
        button.dataset.action='title';button.textContent='데모 타이틀';
      }
    }return result;
  };
}
function bindField(app){
  const scene=app.scene,canvas=scene.canvas,control=product.controls,stick=document.getElementById('joystick');
  control.x=control.y=0;
  const hud=document.querySelector('.battle');hud.classList.add('tv-field');
  const mini=document.getElementById('minimap');
  const miniPan=ev=>{ev.stopImmediatePropagation();ev.preventDefault();if(app.dialogue||app.modal.classList.contains('open'))return;
    const r=mini.getBoundingClientRect();scene.centerAt((ev.clientX-r.left)/r.width*space.width,(ev.clientY-r.top)/r.height*space.height);
  };
  mini.addEventListener('pointerdown',miniPan,{capture:true});
  const bar=document.createElement('div');bar.className='tv-toolbar';
  bar.innerHTML='<button type="button" data-lock aria-keyshortcuts="L"></button><button type="button" data-zoom="out" aria-label="축소">−</button><button type="button" data-zoom="in" aria-label="확대">＋</button><button type="button" data-center aria-label="설오에게 카메라 복귀">설오 보기</button>';
  hud.append(bar);const pointers=new Map();let initialPinch=null,dragged=false,start=null;
  const lock=bar.querySelector('[data-lock]'),battle=app.engine.b;
  function showLock(){lock.setAttribute('aria-pressed',String(!!battle.tvMoveLocked));lock.textContent=battle.tvMoveLocked?'이동 잠금 켜짐':'이동 잠금 꺼짐';}
  function toggle(){if(!app.canInput())return;battle.tvMoveLocked=!battle.tvMoveLocked;const u=app.engine.active;if(u)delete u.tvPath;showLock();app.dirty=true;}
  showLock();product.toggleLock=toggle;
  bar.onclick=ev=>{const t=ev.target.closest('button');if(!t)return;if(t.hasAttribute('data-lock'))toggle();
    if(t.dataset.zoom){const r=canvas.getBoundingClientRect();scene.zoom(t.dataset.zoom==='in'?1.16:1/1.16,r.width/2,r.height/2);}
    if(t.hasAttribute('data-center'))scene.panOffset={x:0,y:0};};
  const xy=ev=>{const r=canvas.getBoundingClientRect();return{x:ev.clientX-r.left,y:ev.clientY-r.top};};
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const aim=p=>{const u=app.engine.active,a=center(u);app.engine.face(u,p.x-a.x,p.y-a.y);app.dirty=true;};
  function tap(point){
    if(!app.canInput())return;const e=app.engine,u=e.active,z=scene.world(point.x,point.y);
    const target=e.b.units.find(v=>v.side===1&&!v.dead&&dist(center(v),z)<=Math.max(v.r,58/scene.zoomLevel));
    if(battle.tvMoveLocked||app.charging){aim(target?center(target):z);return;}
    const path=space.route(center(u),z,u.r);if(path.length){u.tvPath=path;app.dirty=true;}else app.notify('발을 디딜 길이 없습니다.');
  }
  // Replace gestures on the field alone. Native HUD charge/release, defend and
  // modal controls keep their original handlers.
  function handle(type,fn){canvas.addEventListener(type,ev=>{ev.preventDefault();ev.stopImmediatePropagation();fn(ev);},{capture:true,passive:false});}
  handle('pointerdown',ev=>{const p=xy(ev);canvas.setPointerCapture(ev.pointerId);pointers.set(ev.pointerId,p);start=p;dragged=false;
    if(pointers.size===2){const [a,b]=[...pointers.values()];initialPinch={dist:dist(a,b),zoom:scene.zoomLevel};dragged=true;}});
  handle('pointermove',ev=>{if(!pointers.has(ev.pointerId))return;const p=xy(ev),prev=pointers.get(ev.pointerId);pointers.set(ev.pointerId,p);
    if(initialPinch&&pointers.size===2){const [a,b]=[...pointers.values()];scene.zoom(initialPinch.zoom*dist(a,b)/(Math.max(1,initialPinch.dist)*scene.zoomLevel),(a.x+b.x)/2,(a.y+b.y)/2);return;}
    if(!start)return;if(dist(start,p)>8)dragged=true;
    if(dragged)scene.pan((prev.x-p.x)/scene.zoomLevel,(prev.y-p.y)/scene.zoomLevel);});
  handle('pointerup',ev=>{if(pointers.size===1&&!dragged&&!initialPinch)tap(xy(ev));pointers.delete(ev.pointerId);if(!pointers.size){initialPinch=null;start=null;}});
  handle('pointercancel',ev=>{pointers.delete(ev.pointerId);dragged=true;initialPinch=null;});
  handle('wheel',ev=>{const p=xy(ev);scene.zoom(Math.exp(-ev.deltaY*.001),p.x,p.y);});
  let sid=null;
  product.resetFieldInput=()=>{held.clear();sid=null;pointers.clear();initialPinch=null;start=null;control.x=control.y=0;if(app.engine?.active)delete app.engine.active.tvPath;};
  document.getElementById('fire')?.addEventListener('pointercancel',ev=>{if(ev.pointerId===app.firePointer)app.cancelInput();},{capture:true});
  if(stick){
    stick.setAttribute('aria-label','여덟 방향 이동');
    const knob=stick.querySelector('#stick-knob'),label=stick.querySelector('.stick-mode');if(label)label.textContent='이동';
    const push=ev=>{const r=stick.getBoundingClientRect(),x=ev.clientX-r.left-r.width/2,y=ev.clientY-r.top-r.height/2,m=Math.hypot(x,y),mag=Math.min(1,Math.max(0,(m-5)/Math.max(1,r.width*.41-5)));
      control.x=m?x/m*mag:0;control.y=m?y/m*mag:0;if(knob)knob.style.transform="translate("+control.x*16+"px,"+control.y*16+"px)";};
    for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,ev=>{
      ev.stopImmediatePropagation();ev.preventDefault();
      if(type==='pointerdown'){if(!app.canInput())return;sid=ev.pointerId;stick.setPointerCapture(sid);push(ev);}
      else if(sid===ev.pointerId){if(type==='pointermove')push(ev);else{sid=null;control.x=control.y=0;if(knob)knob.style.transform="translate(0,0)";}}
    },{capture:true,passive:false});
  }
}
const held=new Set(),dirs={KeyW:[0,-1],KeyS:[0,1],KeyA:[-1,0],KeyD:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
for(const type of ['keydown','keyup'])window.addEventListener(type,ev=>{
  if(ev.target?.matches?.('input,textarea,select,[contenteditable="true"]'))return;
  if(ev.code==='KeyL'&&G.HonroApp?.screen==='battle'&&!G.HonroApp?.dialogue&&!G.HonroApp.modal.classList.contains('open')){ev.preventDefault();ev.stopImmediatePropagation();if(type==='keydown'&&!ev.repeat)product.toggleLock?.();return;}
  if(!dirs[ev.code])return;
  if(!(type==='keyup'&&held.has(ev.code))&&(G.HonroApp?.screen!=='battle'||G.HonroApp?.dialogue||G.HonroApp?.modal?.classList.contains('open')))return;
  if(type==='keydown'&&!G.HonroApp.canInput())return;
  ev.preventDefault();ev.stopImmediatePropagation();if(type==='keydown')held.add(ev.code);else held.delete(ev.code);
  const c=product.controls;c.x=c.y=0;for(const key of held){c.x+=dirs[key][0];c.y+=dirs[key][1];}
},{capture:true});
function abandonInput(){if(G.HonroApp?.screen==='battle')G.HonroApp.cancelInput();}
window.addEventListener('blur',abandonInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)abandonInput();});
