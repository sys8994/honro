import {fieldPalette} from './palette.mjs';
import {groundProjection} from './space.mjs';
import {terrainSpace,center} from './terrain.mjs';
import {spatialEngine} from './engine.mjs';
import {groundScene} from './scene.mjs';
import {riverPath} from './ground.mjs';
import {animals} from './actors.mjs';
import {projectBattle} from './campaign-field.mjs';
import {installChapterMotion} from './chapter-motion.mjs';
import {bowPlane,actorBody} from './body.mjs';

const G=globalThis, product=G.HonroTopview;
const base=new URL('../',import.meta.url);
const load=async path=>{const r=await fetch(new URL(path,base));if(!r.ok)throw Error(path+' '+r.status);return r.json();};
const loaded=new Map(),loading=new Map(),bitmaps=new Map();
let map,space,field,miniGround,viewW,viewH;
const extraActors=['damheo','hwigyeom','sodan','porter','medium','villager','villager_woman','possessed','mourner','shade','lantern','warden','ferry_warden','pier_warden','empty_bier'];
const tallIds=new Set(['pine_a','pine_b','shrine','ruin_gate','hut','shed','lookout','guardtree']);
function bitmap(path,id){
  if(!bitmaps.has(path))bitmaps.set(path,(async()=>{const image=new Image();image.src=new URL(path,base);await image.decode();return fieldPalette(id,image,.88);})().catch(err=>{bitmaps.delete(path);throw err;}));
  return bitmaps.get(path);
}
async function loadField(id){
  if(loaded.has(id))return loaded.get(id);
  if(loading.has(id))return loading.get(id);
  const promise=(async()=>{
    const folder=id===1?'yeonmok':'act1-'+String(id).padStart(2,'0');
    const [m,f]=await Promise.all([load('data/'+folder+'.json'),load('assets/terrain/'+folder+'/field.json')]);
    const files=new Map();
    for(const o of m.objects){
      if(tallIds.has(o.asset)){for(const part of ['base',o.asset.startsWith('pine')?'crown':'roof'])files.set(o.asset+'-'+part,'props/'+o.asset+'-'+part+'.png');}
      else if(o.deck)files.set(o.asset+'-near','props/'+o.asset+'-near.png');
      else files.set(o.asset,'props/'+o.asset+'.png');
    }
    for(const name of ['seolo','seolo-front','seolo-states','seolo-bow','seolo-bow-ne','woodcutter',...animals.map(n=>'turns-'+n),...(id===1?[]:extraActors)])files.set(name,'actors/'+name+'.webp');
    if(id>1)for(const key of ['binding','litter','funeral_bier','ruin_gate'])files.set(key,'props/'+key+'.png');
    const images=new Map(await Promise.all([...files].map(async ([key,path])=>[key,await bitmap('assets/'+path,key)])));
    const terrain=terrainSpace(m),projection=groundProjection(terrain.cell,m.tileWidth,m.tileHeight);
    const item={map:m,space:terrain,field:f,projection,Engine:spatialEngine(G.HONRO_CORE,terrain,projection),Scene:groundScene(G.HonroScene,terrain,images,projection,f)};
    loaded.set(id,item);return item;
  })();
  loading.set(id,promise);try{return await promise;}finally{loading.delete(id);}
}
function selectField(id){
  const chapter=loaded.get(id);if(!chapter)throw Error('아직 불러오지 않은 전장 '+id);
  ({map,space,field}=chapter);Object.assign(product,{space,projection:chapter.projection,Engine:chapter.Engine,Scene:chapter.Scene});
  viewW=map.width*map.tileWidth;viewH=map.height*map.tileHeight;
  miniGround=chapter.mini??=minimapGround();
}
await loadField(1);selectField(1);
product.controls={x:0,y:0};
product.atExit=(b,u,m)=>Math.hypot(u.x-m.x,center(u).y-m.y)<=120;

const nativeCapacity=G.HonroEncounters.populationCap;
G.HonroEncounters.populationCap=b=>b.honroTopview&&Number.isInteger(b.tvPopulation)?b.tvPopulation:nativeCapacity(b);
const rules=G.HonroStageRules, sanitize=rules.sanitizeStageBattle;
rules.sanitizeStageBattle=b=>b?.honroTopview?b:sanitize(b);
const place=G.HonroTerrain.place;
G.HonroTerrain.place=function(b,u,options){
  if(!b.honroTopview)return place.call(this,b,u,options);
  const pos=Number.isFinite(options?.x)&&Number.isFinite(options?.y)?{x:options.x,y:options.y}:center(u);
  const others=b.units.filter(v=>v.id!==u.id),free=space.free(pos,u.r,options?.flying,others);
  const p=free&&(!Number.isFinite(options?.maxDistance)||Math.hypot(free.x-pos.x,free.y-pos.y)<=options.maxDistance)?free:null;
  return p?{x:p.x,y:p.y+u.h*.5}:null;
};
const top=G.HonroWorld.top;
G.HonroWorld.top=function(b,x,y,...args){return b.honroTopview?(Number.isFinite(y)?y:space.point(map.meta.stage?'start':'cart-wave').y):top.call(this,b,x,y,...args);};
const loader=G.HonroCampaignLoader;
const inAct=id=>Number.isInteger(id)&&id>=1&&id<=10;
G.HonroCampaignLoader={...loader,destination:profile=>Math.min(10,loader.destination(profile)),has:id=>inAct(id)&&loaded.has(id)&&loader.has(id),
  prewarmNext(id){if(id<10)loader.ensureStage(id+1).catch(()=>{});},
  async ensureStage(id){if(!inAct(id))throw Error('탑뷰 1막의 마지막 장은 소단 — 놓지 못한 밤입니다.');await Promise.all([loadField(id),loader.ensureStage(id)]);}
};
installChapterMotion(product);
function prepare(b) {
  if(b.honroTopview){
    if(b.honroTopview!==1||!inAct(b.honroStage))throw Error('알 수 없는 탑뷰 지도 판본');
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
  if(b.honroStage>1&&inAct(b.honroStage)&&b.mode==='campaign'){projectBattle(b,space);return;}
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

function minimapGround(){
const miniGround=document.createElement('canvas');
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
for(const ring of map.cliffs||[]){miniPaint.beginPath();ring.forEach(([x,y],i)=>i?miniPaint.lineTo(x,y):miniPaint.moveTo(x,y));miniPaint.closePath();miniPaint.fillStyle='#303b38';miniPaint.fill();}
return miniGround;
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
  if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)||cv.style.width!==w+'px'){
    cv.style.setProperty('width',w+'px','important');cv.style.setProperty('height',h+'px','important');
    cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
  }
  const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingEnabled=false;c.drawImage(miniGround,0,0,w,h);
  const sx=w/space.width,sy=h/space.height;
  for(const a of app.engine.b.units){if(a.dead)continue;const p=center(a);c.fillStyle=a.side===0?'#f7e4a2':a.side===2?'#e3ceac':a.awake?'#ef8579':'#a88178';c.beginPath();c.arc(p.x*sx,p.y*sy,a.side===0?3:1.8,0,Math.PI*2);c.fill();}
  const exit=space.point(map.meta.stage?'exit':'marker-7');c.strokeStyle='#ffda87';c.strokeRect(exit.x*sx-2.5,exit.y*sy-2.5,5,5);
  if(map.meta.stage)for(const t of app.scene.missionTargets||[]){if(t.done||!Number.isFinite(t.x)||!Number.isFinite(t.y))continue;c.fillStyle='#e4bc70';c.fillRect(t.x*sx-1.6,t.y*sy-1.6,3.2,3.2);}
  const scene=app.scene;if(!scene.viewport||!Number.isFinite(scene.cx))return;
  const width=scene.viewport.w/scene.zoomLevel,height=scene.viewport.h/scene.zoomLevel;
  c.strokeStyle='#e1d3b2';c.lineWidth=.8;
  c.strokeRect((scene.cx-width/2)*w/viewW,(scene.cy-height/2)*h/viewH,width*w/viewW,height*h/viewH);
};
const tickUnitInfo=G.HonroUnitInfo.tick;
G.HonroUnitInfo.tick=function(app){
  tickUnitInfo(app);
  const scene=app.scene,panel=document.getElementById('unit-info');
  if(innerWidth<=600||!scene?.pickScreenUnit||!panel||panel.hidden)return;
  const u=app.engine.unit(scene.inspectUnitId);if(!u)return;
  const foot=center(u),pt=scene.screenPoint(foot.x,foot.y),body=actorBody(u),z=scene.zoomLevel;
  const bounds=scene.canvas.getBoundingClientRect(),r=panel.getBoundingClientRect();
  const roof=Math.max(76,bounds.top+8),floor=Math.min(bounds.bottom,document.querySelector('.honro-compact-hud').getBoundingClientRect().top)-10;
  const x=bounds.left+pt.x,y=bounds.top+pt.y-(body.size+body.lift)*z,offset=body.rx*z+12;
  panel.style.left=Math.max(12,Math.min(innerWidth-r.width-12,x+offset+r.width>innerWidth-12?x-offset-r.width:x+offset))+'px';
  panel.style.top=Math.max(roof,Math.min(floor-r.height,y))+'px';
};
product.configure=function(App) {
  const P=App.prototype,mount=P.mount,launch=P.launch,cancel=P.cancelInput,charge=P.beginCharge,help=P.battleHelp,rest=P.showRest;
  P.showRest=function(...args){
    if(this.profile.cleared[10]&&this.profile.seen?.['act-ending-v1:10']&&!this.profile.honroBattle&&!this.profile.honroActEnding&&!this.debugRestStage&&!this.profile.honroJourney?.restStageId){return this.showTitle();}
    return rest.apply(this,args);
  };
  P.cancelInput=function(){product.resetFieldInput?.();return cancel.call(this);};
  P.beginCharge=function(){const ok=charge.call(this);if(ok&&this.engine?.active)delete this.engine.active.tvPath;return ok;};
  P.mount=function(b,opts){selectField(b.honroStage);prepare(b);const result=mount.call(this,b,opts);bindField(this);return result;};
  P.launch=function(id=1,training=false,skill=null){
    if(!inAct(id)||training){this.notify('탑뷰 1막은 소단의 동쪽 외문까지 이어집니다.');return;}
    if(G.HonroCampaignEntry.defer(this,id,()=>this.launch(id,false,skill)))return;
    return launch.call(this,id,false,skill);
  };
  P.startTraining=function(){this.notify('탑뷰에서는 1막의 열 장을 진행할 수 있습니다.');};
  P.displayAngle=function(u){const a=u.angle*Math.PI/180,v=product.projection.forward(Math.cos(a),-Math.sin(a));return (Math.atan2(v.x,-v.y)*180/Math.PI+360)%360;};
  P.battleHelp=function(){if(this.stageId>1)return help.call(this);this.open('<h2>연목 고갯길</h2><p>개울을 건너 나무꾼을 만나고 북동쪽 고개 끝에 닿으세요. 전장에서 마우스 왼쪽 버튼을 누르고 끌거나 미니맵을 끌면 전장을 둘러볼 수 있습니다. 적에게 마우스를 올리면 윤곽이 보이고 클릭하면 정보를 엽니다. 동행을 클릭하면 선택합니다.</p><p>원하는 지면을 마우스 오른쪽 버튼으로 클릭하면 그곳까지 걷습니다. 터치 화면에서는 지면을 짧게 누르세요. 방향키·WASD와 터치 스틱으로도 이동합니다. Shift를 누른 채 방향키를 누르면 제자리에서 천천히 돌아섭니다. Shift+클릭은 그 지점을 즉시 겨눕니다. 터치에서는 발사 옆 이동 잠금 버튼을 쓰세요. 활을 당기는 중에도 스틱으로 조준할 수 있습니다. 발사를 길게 눌렀다 놓으세요.</p><p>화살은 개울을 건너고 바위에 막힙니다. 예상 궤적은 북쪽 다리의 횡풍을 반영합니다. 방어하면 턴을 넘기며 기력을 회복합니다.</p><button data-action="close">전장으로</button>','battle-help');};

}
function bindField(app){
  const scene=app.scene,canvas=scene.canvas,control=product.controls,stick=document.getElementById('joystick');
  control.x=control.y=0;
  const hud=document.querySelector('.battle');hud.classList.add('tv-field');
  const mini=document.getElementById('minimap');
  const miniDock=mini.parentElement,pointers=new Map();
  let miniPointer=null,initialPinch=null,dragged=false,start=null;
  scene.uiBlocked=()=>app.screen!=='battle'||app.done||app.dialogue||app.modal.classList.contains('open');
  function seekMini(ev){
    const r=mini.getBoundingClientRect(),limit=n=>Math.max(0,Math.min(1,n));
    scene.centerAt(limit((ev.clientX-r.left)/r.width)*space.width,limit((ev.clientY-r.top)/r.height)*space.height);
  }
  for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture']){
    miniDock.addEventListener(type,ev=>{
      if(type==='pointerdown'&&!scene.uiBlocked()&&ev.button===0&&miniPointer===null){
        miniPointer=ev.pointerId;miniDock.setPointerCapture(miniPointer);scene.mousePoint=null;
      }
      if(ev.pointerId!==miniPointer)return;
      ev.preventDefault();ev.stopImmediatePropagation();
      if(type!=='pointercancel'&&type!=='lostpointercapture'&&!scene.uiBlocked())seekMini(ev);
      if(type!=='pointerdown'&&type!=='pointermove')miniPointer=null;
    },{capture:true,passive:false});
  }
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
  const xy=ev=>{const r=canvas.getBoundingClientRect();return{x:ev.clientX-r.left,y:ev.clientY-r.top};};
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function tap(point,shift,select){
    if(scene.uiBlocked())return;const e=app.engine,u=e.active,z=scene.world(point.x,point.y);
    if(app.canInput()&&(battle.tvMoveLocked||control.shift||shift||app.charging)){
      const raised=scene.world(point.x,point.y+bowPlane*scene.zoomLevel),a=e.damageAim(u);
      const targets=e.b.units.filter(v=>v.side===1&&!v.dead).map(v=>e.damageAim(v));
      const target=targets.filter(t=>((raised.x-t.x)/t.rx)**2+((raised.y-t.y)/t.ry)**2<=1).sort((v,w)=>dist(v,raised)-dist(w,raised))[0]||raised;
      delete u.tvPath;e.face(u,target.x-a.x,target.y-a.y);app.dirty=true;return;
    }
    if(select){
      const hit=scene.pickScreenUnit(point);
      if(hit){
        if(hit.side===0&&!hit.summoned)app.selectHero(hit.id);
        G.HonroUnitInfo.show(app,hit);return;
      }
      G.HonroUnitInfo.close(app);return;
    }
    if(!app.canInput())return;
    const path=space.route(center(u),z,u.r);if(path.length){u.tvPath=path;app.dirty=true;}else app.notify('발을 디딜 길이 없습니다.');
  }
  // Replace gestures on the field alone. Native HUD charge/release, defend and
  // modal controls keep their original handlers.
  function handle(type,fn){canvas.addEventListener(type,ev=>{ev.preventDefault();ev.stopImmediatePropagation();fn(ev);},{capture:true,passive:false});}
  canvas.addEventListener('contextmenu',ev=>ev.preventDefault());
  handle('pointerdown',ev=>{
    const mouse=ev.pointerType==='mouse';
    if(scene.uiBlocked()||ev.button!==0&&!(mouse&&ev.button===2))return;
    scene.mousePoint=null;const p=xy(ev);
    canvas.setPointerCapture(ev.pointerId);pointers.set(ev.pointerId,{...p,button:ev.button});
    if(pointers.size===1){start=p;dragged=false;}
    else if(pointers.size===2){
      const [a,b]=[...pointers.values()];initialPinch={dist:dist(a,b),zoom:scene.zoomLevel};dragged=true;
    }
  });
  handle('pointermove',ev=>{
    const p=xy(ev),prev=pointers.get(ev.pointerId);
    if(!prev){if(ev.pointerType==='mouse'&&!ev.buttons&&!scene.uiBlocked())scene.mousePoint=p;return;}
    pointers.set(ev.pointerId,{...p,button:prev.button});
    if(scene.uiBlocked()){dragged=true;return;}
    if(initialPinch){
      if(pointers.size===2){const [a,b]=[...pointers.values()];
        scene.zoom(initialPinch.zoom*dist(a,b)/(Math.max(1,initialPinch.dist)*scene.zoomLevel),(a.x+b.x)/2,(a.y+b.y)/2);}
      return;
    }
    if(!start)return;
    const origin=dragged?prev:start;
    if(dist(start,p)>(ev.pointerType==='mouse'?5:8))dragged=true;
    if(dragged&&prev.button===0)scene.pan((origin.x-p.x)/scene.zoomLevel,(origin.y-p.y)/scene.zoomLevel);
  });
  function release(ev){
    const down=pointers.get(ev.pointerId);if(!down)return;
    pointers.delete(ev.pointerId);
    if(ev.type==='pointerup'&&ev.button===down.button&&!dragged&&!initialPinch)
      tap(xy(ev),ev.shiftKey,ev.pointerType==='mouse'&&down.button===0);
    if(!pointers.size){start=null;initialPinch=null;dragged=false;}
    else dragged=true;
  }
  handle('pointerup',release);handle('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);
  canvas.addEventListener('pointerleave',()=>{scene.mousePoint=null;});
  handle('wheel',ev=>{const p=xy(ev);scene.zoom(Math.exp(-ev.deltaY*.001),p.x,p.y);});
  let sid=null;
  product.resetFieldInput=()=>{held.clear();shiftKeys.clear();control.shift=false;showLock();sid=null;miniPointer=null;scene.mousePoint=null;pointers.clear();initialPinch=null;start=null;control.x=control.y=0;if(app.engine?.active)delete app.engine.active.tvPath;};
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
