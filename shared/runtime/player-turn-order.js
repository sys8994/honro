(function(G){'use strict';
const C=G.HONRO_CORE,H=G.HONRO_CONTENT;
const order=p=>C.normalizePlayerTurnOrder(p.playerTurnOrder);
const known=(p,list=order(p))=>list.filter(c=>p.recruited.includes(c));
const name=c=>H.hero[c].name;
function reordered(profile,cls,target){
 const visible=known(profile),from=visible.indexOf(cls),to=visible.indexOf(target);
 if(from<0||to<0||from===to)return null;
 visible.splice(from,1);visible.splice(to,0,cls);
 return [...visible,...order(profile).filter(c=>!visible.includes(c))];
}
function commit(app,next){
 if(app.screen!=='camp'||!next||JSON.stringify(next)===JSON.stringify(order(app.profile)))return false;
 app.profile.playerTurnOrder=C.normalizePlayerTurnOrder(next);app.persist();app.notify('카드 순서를 저장했습니다.');return true;
}
function camp(app){
 app.playerTurnOrderCleanup?.();
 const nav=app.root.querySelector('.hero-tabs'),cards=nav?[...nav.querySelectorAll('.hero-tab')]:[];
 if(!cards.length)return;
 const controller=new AbortController(),signal=controller.signal,contacts=new Set();
 let gesture=null,suppressUntil=0,observer,disposed=false;
 nav.setAttribute('aria-label','동행 선택 및 행동 순서');
 // Placeholder identities remain hidden/disabled. Recruited cards lead in the
 // same filtered priority used by the Engine; no unit/party arrays are sorted.
 function display(){
  const visible=known(app.profile),ids=[...visible,...C.DEFAULT_PLAYER_TURN_ORDER.filter(c=>!visible.includes(c))];
  for(const cls of ids){const card=cards.find(c=>c.dataset.class===cls);if(card)nav.appendChild(card);}
  for(const card of cards){const index=visible.indexOf(card.dataset.class);let badge=card.querySelector('.camp-turn-index');
   if(index<0){badge?.remove();continue;}
   if(!badge){badge=document.createElement('i');badge.className='camp-turn-index';badge.setAttribute('aria-hidden','true');card.appendChild(badge);}
   badge.textContent=String(index+1);card.setAttribute('aria-label',`${name(card.dataset.class)} · 행동 순서 ${index+1} · 짧게 눌러 선택, 길게 눌러 이동`);
   card.setAttribute('aria-keyshortcuts','Alt+ArrowLeft Alt+ArrowRight');
  }
 }
 display();
 nav.insertAdjacentHTML('afterend','<p class="camp-card-order-hint" data-card-order-hint>카드 순서 = 행동 순서 · 짧게 눌러 선택<span>길게 누르고 좌우로 이동 · 놓으면 저장 · Alt + ← / →</span></p><span class="camp-card-order-status" role="status" aria-live="polite" data-card-order-status></span>');
 const status=app.root.querySelector('[data-card-order-status]');
 function clearVisual(){for(const card of cards){card.classList.remove('order-dragging','order-drop-target');card.style.removeProperty('transform');}}
 function end(cancel=false){
  const s=gesture;if(!s)return;gesture=null;clearTimeout(s.timer);
  if(s.armed)suppressUntil=performance.now()+700;
  const r=nav.getBoundingClientRect(),inside=s.x>=r.left&&s.x<=r.right&&s.y>=r.top&&s.y<=r.bottom;
  const valid=!cancel&&s.armed&&inside&&app.screen==='camp'&&nav.isConnected&&app.profile===s.profile&&JSON.stringify(known(app.profile))===JSON.stringify(s.visible);
  clearVisual();if(cancel&&s.armed&&status)status.textContent='이동 취소 · 원래 순서 유지';if(nav.hasPointerCapture?.(s.id))nav.releasePointerCapture(s.id);
  if(valid&&commit(app,reordered(app.profile,s.cls,s.target))){display();if(status)status.textContent=`${name(s.cls)} ${known(app.profile).indexOf(s.cls)+1}번째 · 저장됨`;}
 }
 function arm(s){
  if(gesture!==s||contacts.size!==1||!nav.isConnected||app.screen!=='camp')return;
  clearTimeout(s.timer);s.armed=true;suppressUntil=performance.now()+700;
  nav.setPointerCapture(s.id);s.card.classList.add('order-dragging');
  if(status)status.textContent=`${name(s.cls)} 이동 중 · 놓으면 저장, 밖으로 옮기거나 Escape로 취소`;
 }
 function down(e){
  if(e.button!==0||e.pointerType==='touch'&&!e.isPrimary||contacts.size!==1||app.screen!=='camp')return;
  const card=e.target.closest('.hero-tab');if(!card||card.disabled||!known(app.profile).includes(card.dataset.class))return;
  // A fresh pointer gesture must remain a normal tap even just after a drag.
  suppressUntil=0;
  const s={id:e.pointerId,card,cls:card.dataset.class,target:card.dataset.class,profile:app.profile,visible:known(app.profile),x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,armed:false,center:card.getBoundingClientRect().left+card.offsetWidth/2,pointerType:e.pointerType};
  gesture=s;s.timer=setTimeout(()=>arm(s),420);
 }
 function move(e){
  const s=gesture;if(!s||s.id!==e.pointerId)return;
  s.x=e.clientX;s.y=e.clientY;const dx=s.x-s.x0,dy=s.y-s.y0,r=nav.getBoundingClientRect();
  if(s.x<r.left-16||s.x>r.right+16||s.y<r.top-16||s.y>r.bottom+16){suppressUntil=performance.now()+700;end(true);return;}
  if(!s.armed){
   if(s.pointerType==='mouse'&&Math.abs(dx)>6&&Math.abs(dx)>Math.abs(dy))arm(s);
   else if(Math.abs(dx)>10||Math.abs(dy)>8){suppressUntil=performance.now()+700;end(true);return;}
  }
  if(!s.armed)return;
  e.preventDefault();s.card.style.transform=`translateX(${dx}px)`;
  // Layout stays stable during the gesture, so cancelled drags restore exactly.
  let closest=null,distance=Infinity;
  for(const card of cards.filter(c=>s.visible.includes(c.dataset.class))){
   const rect=card===s.card?{left:s.center-(s.card.offsetWidth/2),width:s.card.offsetWidth}:card.getBoundingClientRect();
   const d=Math.abs(s.x-(rect.left+rect.width/2));if(d<distance){closest=card;distance=d;}
  }
  s.target=closest?.dataset.class||s.cls;
  for(const card of cards)card.classList.toggle('order-drop-target',card===closest&&card!==s.card);
 }
 function pointerDown(e){contacts.add(e.pointerId);if(gesture&&gesture.id!==e.pointerId){suppressUntil=performance.now()+700;end(true);}}
 function pointerUp(e){if(gesture?.id===e.pointerId){gesture.x=e.clientX;gesture.y=e.clientY;end(e.type==='pointercancel');}contacts.delete(e.pointerId);}
 const listen=(node,type,fn,options={})=>node.addEventListener(type,fn,{...options,signal});
 listen(document,'pointerdown',pointerDown,{capture:true});
 listen(nav,'pointerdown',down);listen(document,'pointermove',move,{passive:false});
 listen(document,'pointerup',pointerUp,{capture:true});listen(document,'pointercancel',pointerUp,{capture:true});
 listen(nav,'lostpointercapture',()=>end(true));
 listen(nav,'click',e=>{if(performance.now()<suppressUntil&&(e.detail>0||e.pointerType)){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
 listen(nav,'contextmenu',e=>{if(gesture)e.preventDefault();});
 listen(document,'keydown',e=>{if(e.key==='Escape'&&gesture){e.preventDefault();end(true);}});
 listen(nav,'keydown',e=>{
  if(!e.altKey||!['ArrowLeft','ArrowRight'].includes(e.key)||e.ctrlKey||e.metaKey)return;
  const card=e.target.closest('.hero-tab'),visible=known(app.profile),index=visible.indexOf(card?.dataset.class),target=visible[index+(e.key==='ArrowLeft'?-1:1)];
  if(index<0)return;e.preventDefault();end(true);
  if(target&&commit(app,reordered(app.profile,card.dataset.class,target))){display();card.focus();if(status)status.textContent=`${name(card.dataset.class)} ${known(app.profile).indexOf(card.dataset.class)+1}번째 · 저장됨`;}
 });
 listen(G,'blur',()=>{end(true);contacts.clear();});listen(G,'resize',()=>end(true));
 listen(document,'visibilitychange',()=>{if(document.hidden){end(true);contacts.clear();}});
 const cleanup=()=>{if(disposed)return;disposed=true;observer?.disconnect();end(true);controller.abort();app.root.querySelectorAll('[data-card-order-hint],[data-card-order-status]').forEach(n=>n.remove());};
 app.playerTurnOrderCleanup=cleanup;observer=new MutationObserver(()=>{if(!nav.isConnected)cleanup();});observer.observe(app.root,{childList:true,subtree:true});
}
// Consume stale former editor actions from old DOM; there is no second editor.
function handle(app,el){return !!el.dataset.action?.startsWith('player-order-');}
G.HonroPlayerTurnOrder={camp,handle,known,order,reordered,commit};
})(globalThis);
