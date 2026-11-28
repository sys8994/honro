import {groundProjection} from './space.mjs';
import {terrainSpace,center} from './terrain.mjs';
import {spatialEngine} from './engine.mjs';
import {groundScene} from './scene.mjs';
import {riverPath} from './ground.mjs';
import {animals} from './actors.mjs';
import {bowPlane} from './body.mjs';

const G=globalThis, product=G.HonroTopview;
const base=new URL('../',import.meta.url);
const load=async path=>{const r=await fetch(new URL(path,base));if(!r.ok)throw Error(path+' '+r.status);return r.json();};
const map=await load('data/yeonmok.json'),space=terrainSpace(map);
const textures=[...new Set([...map.grid.materials,'dirt','rock','gravel','water'])].map(n=>[n+'_texture','assets/terrain/'+n+'_texture.png']);
const props=[...new Set(map.objects.map(o=>o.asset))].map(n=>[n,'assets/props/'+n+'.png']);
for(const id of ['bridge_ne-near','bridge_se-near','pine_a-base','pine_a-crown','pine_b-base','pine_b-crown','shrine-base','shrine-roof']){
  props.push([id,'assets/props/'+id+'.png']);
}
const actors=['seolo','seolo-front','seolo-states','seolo-bow','seolo-bow-ne',...animals.map(id=>'turns-'+id),'cart','woodcutter'].map(n=>[n,'assets/actors/'+n+'.webp']);
const images=new Map(await Promise.all([...textures,...props,...actors].map(async ([id,path])=>{
  const image=new Image();image.src=new URL(path,base);await image.decode();return [id,image];
})));
product.projection=groundProjection(space.cell,map.tileWidth,map.tileHeight);
product.Engine=spatialEngine(G.HONRO_CORE,space,product.projection);product.Scene=groundScene(G.HonroScene,space,images,product.projection);
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
  if(b.honroTopview){
    if(b.honroTopview!==1||b.honroStage!==1)throw Error('알 수 없는 탑뷰 지도 판본');
    if(b.tvTerrainRevision!==map.meta.revision){
      for(const u of b.units){
        if(u.dead)continue;delete u.tvPath;
        const flight=!!G.HonroWorld.archetypes[u.honroVariant||u.honroType]?.flying;
        if(space.legal(center(u),u.r,flight))continue;
        const p=space.free(center(u),u.r,flight);if(!p)throw Error('이전 지도의 안전한 발점을 찾지 못했습니다.');
        u.x=p.x;u.y=p.y+u.h*.5;
      }
      b.tvTerrainRevision=map.meta.revision;b.sceneVersion++;
    }
    return;
  }
  if(b.honroStage!==1||b.mode!=='campaign')throw Error('장 배치가 없습니다.');
  b.honroTopview=1;b.tvTerrainRevision=map.meta.revision;
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

const miniGround=document.createElement('canvas'),viewW=map.width*map.tileWidth,viewH=map.height*map.tileHeight;
miniGround.width=240;miniGround.height=Math.round(240*viewH/viewW);
const miniPaint=miniGround.getContext('2d');miniPaint.scale(miniGround.width/viewW,miniGround.height/viewH);
miniPaint.fillStyle='#53604e';miniPaint.fillRect(0,0,viewW,viewH);
for(const o of map.objects.filter(o=>o.asset.startsWith('pine')||o.asset==='rock_large')){
  miniPaint.fillStyle=o.asset==='rock_large'?'#888978':'#394d41';miniPaint.beginPath();miniPaint.ellipse(o.x*map.tileWidth,o.y*map.tileHeight,24,13,0,0,Math.PI*2);miniPaint.fill();
}
for(const t of map.trails){
  miniPaint.beginPath();t.points.forEach(([x,y],i)=>i?miniPaint.lineTo(x,y):miniPaint.moveTo(x,y));miniPaint.strokeStyle='#a49776';miniPaint.lineWidth=t.width;miniPaint.lineJoin='round';miniPaint.stroke();
}
miniPaint.fillStyle='#37616a';miniPaint.fill(riverPath(map.river),'evenodd');
for(const obj of map.objects.filter(o=>o.deck)){
  const [a,b]=obj.deck.points;miniPaint.beginPath();miniPaint.moveTo(...a);miniPaint.lineTo(...b);miniPaint.lineWidth=obj.deck.width;miniPaint.strokeStyle='#c1ad85';miniPaint.stroke();
}
product.windDial=function(app,u){
  const dial=document.querySelector('.tv-wind');if(!dial||!u)return;
  const e=app.engine,sk=G.HONRO_CORE.SKILLS[app.selected]||G.HONRO_CORE.SKILLS.A01;
  const muzzle=e.projectileOrigin(u,sk,u.angle);
  const v=e.forceSample({...muzzle,wind:sk.wind,gravityScale:sk.gravity??1,skill:sk.id,mode:sk.mode});
  const screen=product.projection.forward(v.x,v.y),strength=Math.round(Math.hypot(v.x,v.y));
  const angle=(Math.atan2(screen.x,-screen.y)*180/Math.PI+360)%360;
  const label=strength?['북','북동','동','남동','남','남서','서','북서'][Math.round(angle/45)%8]+' '+strength:'잔잔';
  const sig=label+'|'+Math.round(angle);
  if(dial.dataset.reading===sig)return;
  dial.dataset.reading=sig;dial.dataset.calm=String(!strength);
  dial.style.setProperty('--bearing',angle+'deg');dial.style.setProperty('--reach',Math.min(1,strength/160).toFixed(2));
  dial.querySelector('small').textContent=label;dial.setAttribute('aria-label','바람 '+label);
};
product.minimap=function(app){
  if(!app.minimapVisible||!app.scene)return;
  const cv=document.getElementById('minimap'),w=innerWidth<700?100:145,h=Math.round(w*viewH/viewW),dpr=Math.min(2,devicePixelRatio||1);
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
  const P=App.prototype, title=P.showTitle, mount=P.mount, launch=P.launch, outcome=P.outcome, cancel=P.cancelInput, charge=P.beginCharge;
  P.showTitle=function(...args){
    // A completed demo returns to the native chapter-one rest and replay menu.
    const j=this.profile.honroJourney;
    if(this.profile.cleared[1]&&!this.profile.honroBattle&&j?.pendingDirect===2){
      delete j.pendingDirect;j.restStageId=1;this.persist();
    }
    return title.apply(this,args);
  };
  P.cancelInput=function(){product.resetFieldInput?.();return cancel.call(this);};
  P.beginCharge=function(){const ok=charge.call(this);if(ok&&this.engine?.active)delete this.engine.active.tvPath;return ok;};
  P.mount=function(b,opts){prepare(b);const result=mount.call(this,b,opts);bindField(this);return result;};
  P.launch=function(id=1,training=false,skill=null){
    if(id!==1||training){this.notify('이번 여정은 연목 고갯길까지입니다.');return;}
    return launch.call(this,1,false,skill);
  };
  P.startTraining=function(){this.notify('이번 여정은 연목 고갯길까지입니다.');};
  P.displayAngle=function(u){const a=u.angle*Math.PI/180,v=product.projection.forward(Math.cos(a),-Math.sin(a));return (Math.atan2(v.x,-v.y)*180/Math.PI+360)%360;};
  P.battleHelp=function(){this.open('<h2>연목 고갯길</h2><p>개울을 건너 나무꾼을 만나고 북동쪽 고개 끝에 닿으세요. 미니맵을 누르면 그곳을 볼 수 있습니다.</p><p>원하는 지면을 클릭하면 길을 찾아 걷습니다. 방향키·WASD와 터치 스틱으로도 이동합니다. Shift를 누른 채 방향키를 누르면 제자리에서 천천히 돌아섭니다. Shift+클릭은 그 지점을 즉시 겨눕니다. 터치에서는 발사 옆 이동 잠금 버튼을 쓰세요. 활을 당기는 중에도 스틱으로 조준할 수 있습니다. 발사를 길게 눌렀다 놓으세요.</p><p>화살은 개울을 건너고 바위에 막힙니다. 예상 궤적은 북쪽 다리의 횡풍을 반영합니다. 방어하면 턴을 넘기며 기력을 회복합니다.</p><button data-action="close">전장으로</button>','battle-help');};
  P.outcome=function(...args){
    const result=outcome.apply(this,args);
    if(this.done&&this.engine.b.phase==='won'){
      // The native rest/book can replay chapter one. The next playable map is outside the demo.
      const button=this.modal.querySelector('[data-action="result-continue"]');
      if(button){button.dataset.action='title';button.textContent='타이틀로';}
    }
    return result;
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
  // Mobile hit adjustment can target the dock at the very edge of its canvas.
  mini.parentElement.addEventListener('pointerdown',miniPan,{capture:true});
  const bar=document.createElement('div');bar.className='tv-toolbar';
  bar.innerHTML='<button type="button" data-zoom="out" aria-label="축소">−</button><button type="button" data-zoom="in" aria-label="확대">＋</button><button type="button" data-center aria-label="설오에게 카메라 복귀">설오 보기</button>';
  hud.append(bar);const pointers=new Map();let initialPinch=null,dragged=false,start=null;
  const battle=app.engine.b,lock=document.createElement('button');
  lock.type='button';lock.id='move-lock';lock.className='fire-button movement-button';
  lock.dataset.lock='';lock.dataset.shortcut='Shift';lock.setAttribute('aria-label','이동 잠금');
  lock.setAttribute('aria-keyshortcuts','Shift');lock.dataset.tooltip='제자리 조준 · Shift를 누른 동안에도 발을 고정합니다.';
  lock.innerHTML='<span class="fire-inner">'+G.HonroFA.icon('crosshairs','',18)+'<span>이동 잠금</span></span>';
  document.getElementById('jump').replaceWith(lock);document.getElementById('drop')?.remove();
  const dial=stick.querySelector('.wind-gauge');dial.className='tv-wind';dial.setAttribute('role','img');
  for(const a of ['aria-valuenow','aria-valuemax','aria-valuemin'])dial.removeAttribute(a);
  dial.innerHTML='<i class="wind-compass" aria-hidden="true"><b></b></i><small></small>';
  product.windDial(app,app.engine.active);
  function showLock(){lock.setAttribute('aria-pressed',String(!!(battle.tvMoveLocked||control.shift)));}
  function toggle(){if(!app.canInput())return;battle.tvMoveLocked=!battle.tvMoveLocked;
    if(app.engine.active)delete app.engine.active.tvPath;showLock();app.dirty=true;}
  showLock();product.showLock=showLock;lock.onclick=toggle;
  bar.onclick=ev=>{const t=ev.target.closest('button');if(!t)return;
    if(t.dataset.zoom){const r=canvas.getBoundingClientRect();scene.zoom(t.dataset.zoom==='in'?1.16:1/1.16,r.width/2,r.height/2);}
    if(t.hasAttribute('data-center'))scene.panOffset={x:0,y:0};};
  const xy=ev=>{const r=canvas.getBoundingClientRect();return{x:ev.clientX-r.left,y:ev.clientY-r.top};};
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function tap(point,shift){
    if(!app.canInput())return;const e=app.engine,u=e.active,z=scene.world(point.x,point.y);
    if(battle.tvMoveLocked||control.shift||shift||app.charging){
      const raised=scene.world(point.x,point.y+bowPlane*scene.zoomLevel),a=e.damageAim(u);
      const targets=e.b.units.filter(v=>v.side===1&&!v.dead).map(v=>e.damageAim(v));
      const target=targets.filter(t=>((raised.x-t.x)/t.rx)**2+((raised.y-t.y)/t.ry)**2<=1).sort((v,w)=>dist(v,raised)-dist(w,raised))[0]||raised;
      delete u.tvPath;e.face(u,target.x-a.x,target.y-a.y);app.dirty=true;return;
    }
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
  handle('pointerup',ev=>{if(pointers.size===1&&!dragged&&!initialPinch)tap(xy(ev),ev.shiftKey);pointers.delete(ev.pointerId);if(!pointers.size){initialPinch=null;start=null;}});
  handle('pointercancel',ev=>{pointers.delete(ev.pointerId);dragged=true;initialPinch=null;});
  handle('wheel',ev=>{const p=xy(ev);scene.zoom(Math.exp(-ev.deltaY*.001),p.x,p.y);});
  let sid=null;
  product.resetFieldInput=()=>{held.clear();shiftKeys.clear();control.shift=false;showLock();sid=null;pointers.clear();initialPinch=null;start=null;control.x=control.y=0;if(app.engine?.active)delete app.engine.active.tvPath;};
  document.getElementById('fire')?.addEventListener('pointercancel',ev=>{if(ev.pointerId===app.firePointer)app.cancelInput();},{capture:true});
  if(stick){
    stick.setAttribute('aria-label','자유 방향 이동 및 제자리 조준');
    const knob=stick.querySelector('#stick-knob'),label=stick.querySelector('.stick-mode');if(label)label.textContent='이동';
    const push=ev=>{control.source='stick';const r=stick.getBoundingClientRect(),x=ev.clientX-r.left-r.width/2,y=ev.clientY-r.top-r.height/2,m=Math.hypot(x,y),mag=Math.min(1,Math.max(0,(m-5)/Math.max(1,r.width*.41-5)));
      control.x=m?x/m*mag:0;control.y=m?y/m*mag:0;if(knob)knob.style.transform="translate("+control.x*16+"px,"+control.y*16+"px)";};
    for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,ev=>{
      ev.stopImmediatePropagation();ev.preventDefault();
      if(type==='pointerdown'){if(!app.canInput())return;sid=ev.pointerId;stick.setPointerCapture(sid);push(ev);}
      else if(sid===ev.pointerId){if(type==='pointermove')push(ev);else{sid=null;control.x=control.y=0;if(knob)knob.style.transform="translate(0,0)";}}
    },{capture:true,passive:false});
  }
}
const held=new Set(),shiftKeys=new Set(),dirs={KeyW:[0,-1],KeyS:[0,1],KeyA:[-1,0],KeyD:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
for(const type of ['keydown','keyup'])window.addEventListener(type,ev=>{
  if(ev.target?.matches?.('input,textarea,select,[contenteditable="true"]'))return;
  if(ev.code==='ShiftLeft'||ev.code==='ShiftRight'){
    if(type==='keydown'&&(G.HonroApp?.screen!=='battle'||!G.HonroApp?.canInput()))return;
    if(type==='keyup')shiftKeys.delete(ev.code);else shiftKeys.add(ev.code);
    product.controls.shift=!!shiftKeys.size||ev.shiftKey;product.showLock?.();
    if(product.controls.shift&&G.HonroApp?.engine?.active)delete G.HonroApp.engine.active.tvPath;
    return;
  }
  if(!dirs[ev.code])return;
  if(!(type==='keyup'&&held.has(ev.code))&&(G.HonroApp?.screen!=='battle'||G.HonroApp?.dialogue||G.HonroApp?.modal?.classList.contains('open')))return;
  if(type==='keydown'&&!G.HonroApp.canInput())return;
  ev.preventDefault();ev.stopImmediatePropagation();if(type==='keydown')held.add(ev.code);else held.delete(ev.code);
  const c=product.controls;
  // A new turn or a modal clears transient input. A still-held physical Shift
  // is reported on the next arrow event even without a second Shift keydown.
  c.shift=ev.shiftKey;product.showLock?.();c.source='keyboard';c.x=c.y=0;for(const key of held){c.x+=dirs[key][0];c.y+=dirs[key][1];}
},{capture:true});
function abandonInput(){if(G.HonroApp?.screen==='battle')G.HonroApp.cancelInput();}
window.addEventListener('blur',abandonInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)abandonInput();});
