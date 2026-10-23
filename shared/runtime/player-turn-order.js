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
 let gesture=null,suppressUntil=0,observer,modalObserver,disposed=false;
 const animations=new Map(),holdMs=500;
 function stopAnimations(){for(const a of animations.values())a.cancel();animations.clear();}
 nav.setAttribute('aria-label','동행 선택 및 행동 순서');
 // Placeholder identities remain hidden/disabled. Recruited cards lead in the
 // same filtered priority used by the Engine; no unit/party arrays are sorted.
 function display(visible=known(app.profile)){
  const ids=[...visible,...C.DEFAULT_PLAYER_TURN_ORDER.filter(c=>!visible.includes(c))];
  for(const cls of ids){const card=cards.find(c=>c.dataset.class===cls);if(card)nav.appendChild(card);}
  for(const card of cards){const index=visible.indexOf(card.dataset.class);let badge=card.querySelector('.camp-turn-index');
   if(index<0){badge?.remove();continue;}
   if(!badge){badge=document.createElement('i');badge.className='camp-turn-index';badge.setAttribute('aria-hidden','true');card.appendChild(badge);}
   badge.textContent=String(index+1);card.setAttribute('aria-label',`${name(card.dataset.class)} · 행동 순서 ${index+1} · 짧게 눌러 선택, 길게 눌러 이동`);
   card.setAttribute('aria-keyshortcuts','Alt+ArrowLeft Alt+ArrowRight');
  }
 }
 display();
 nav.insertAdjacentHTML('afterend','<p class="camp-card-order-hint" data-card-order-hint>길게 눌러 순서 변경</p><span class="camp-card-order-status" role="status" aria-live="polite" data-card-order-status></span>');
 const status=app.root.querySelector('[data-card-order-status]');
 function clearVisual(){stopAnimations();nav.classList.remove('order-active');for(const card of cards){card.classList.remove('order-dragging');card.style.removeProperty('transform');}}
 function preview(s,index){
  const next=s.visible.filter(c=>c!==s.cls);next.splice(index,0,s.cls);if(next.join()===s.preview.join())return;
  const before=new Map(cards.map(c=>[c,c.getBoundingClientRect()]));stopAnimations();s.preview=next;display(next);
  if(!G.matchMedia?.('(prefers-reduced-motion: reduce)').matches)for(const card of cards){if(card===s.card||card.disabled)continue;const r=card.getBoundingClientRect(),old=before.get(card),dx=old.left-r.left,dy=old.top-r.top;if(Math.abs(dx)+Math.abs(dy)<1||!card.animate)continue;const a=card.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],{duration:180,easing:'cubic-bezier(.2,.8,.2,1)'});animations.set(card,a);a.onfinish=()=>{if(animations.get(card)===a)animations.delete(card);};}
  if(status)status.textContent=`${name(s.cls)} ${index+1}번째 자리 · 놓으면 저장`;
 }
 function end(cancel=false){
  const s=gesture;if(!s)return;gesture=null;clearTimeout(s.timer);
  if(s.armed||cancel)suppressUntil=performance.now()+700;
  const r=nav.getBoundingClientRect(),inside=s.x>=r.left&&s.x<=r.right&&s.y>=r.top&&s.y<=r.bottom;
  const valid=!cancel&&s.armed&&inside&&app.screen==='camp'&&nav.isConnected&&app.profile===s.profile&&JSON.stringify(known(app.profile))===JSON.stringify(s.visible)&&!app.modal?.classList.contains('open');
  const tapped=!cancel&&!s.armed&&inside&&s.pointerType==='touch'&&performance.now()-s.started<holdMs&&Math.hypot(s.x-s.x0,s.y-s.y0)<10&&app.screen==='camp'&&nav.isConnected;
  const saved=valid&&commit(app,[...s.preview,...order(app.profile).filter(c=>!s.preview.includes(c))]);
  clearVisual();if(s.armed)display();if(nav.hasPointerCapture?.(s.id))nav.releasePointerCapture(s.id);
  if(s.armed&&status)status.textContent=saved?`${name(s.cls)} ${known(app.profile).indexOf(s.cls)+1}번째 · 저장됨`:valid?'순서 유지':'이동 취소 · 원래 순서 유지';
  // Touch browsers can omit the next compatibility click after a long drag.
  // Select once at pointer-up; the document hook consumes only its duplicate.
  if(tapped){app.playerTurnOrderTap={cls:s.cls,until:performance.now()+700};app.showCamp(s.cls);}
 }
 function arm(s){
  if(gesture!==s||contacts.size!==1||!nav.isConnected||app.screen!=='camp')return;
  clearTimeout(s.timer);s.armed=true;suppressUntil=performance.now()+700;
  s.preview=[...s.visible];s.slots=s.visible.map(cls=>cards.find(c=>c.dataset.class===cls).getBoundingClientRect());s.left=s.card.getBoundingClientRect().left;
  nav.setPointerCapture(s.id);nav.classList.add('order-active');s.card.classList.add('order-dragging');
  if(status)status.textContent=`${name(s.cls)} 이동 중 · 놓으면 저장, 밖으로 옮기거나 Escape로 취소`;
 }
 function down(e){
  if(e.button!==0||e.pointerType==='touch'&&!e.isPrimary||contacts.size!==1||app.screen!=='camp'||app.modal?.classList.contains('open'))return;
  const card=e.target.closest('.hero-tab');if(!card||card.disabled||!known(app.profile).includes(card.dataset.class))return;
  // A fresh pointer gesture must remain a normal tap even just after a drag.
  suppressUntil=0;
  const s={id:e.pointerId,card,cls:card.dataset.class,profile:app.profile,visible:known(app.profile),x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,armed:false,started:performance.now(),pointerType:e.pointerType};
  gesture=s;s.timer=setTimeout(()=>arm(s),holdMs);
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
  e.preventDefault();
  let index=0,distance=Infinity;for(let i=0;i<s.slots.length;i++){const r=s.slots[i],d=Math.abs(s.x-(r.left+r.width/2));if(d<distance){index=i;distance=d;}}
  preview(s,index);s.card.style.transform=`translateX(${dx+s.left-s.slots[index].left}px)`;

 }
 function pointerDown(e){contacts.add(e.pointerId);if(gesture&&gesture.id!==e.pointerId){suppressUntil=performance.now()+700;end(true);}}
 function pointerUp(e){if(gesture?.id===e.pointerId){gesture.x=e.clientX;gesture.y=e.clientY;end(e.type==='pointercancel');}contacts.delete(e.pointerId);}
 const listen=(node,type,fn,options={})=>node.addEventListener(type,fn,{...options,signal});
 listen(document,'pointerdown',pointerDown,{capture:true});
 listen(nav,'pointerdown',down);listen(document,'pointermove',move,{passive:false});
 listen(document,'pointerup',pointerUp,{capture:true});listen(document,'pointercancel',pointerUp,{capture:true});
 listen(nav,'lostpointercapture',()=>end(true));
 listen(nav,'click',e=>{if(performance.now()<suppressUntil&&(e.detail>0||e.pointerType)){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
 listen(nav,'touchmove',e=>{if(gesture?.armed)e.preventDefault();},{passive:false});
 listen(app.root,'scroll',()=>end(true),{capture:true,passive:true});
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
 const cleanup=()=>{if(disposed)return;disposed=true;observer?.disconnect();modalObserver?.disconnect();end(true);contacts.clear();controller.abort();app.root.querySelectorAll('[data-card-order-hint],[data-card-order-status]').forEach(n=>n.remove());};
 app.playerTurnOrderCleanup=cleanup;observer=new MutationObserver(()=>{if(!nav.isConnected)cleanup();});observer.observe(app.root,{childList:true,subtree:true});if(app.modal){modalObserver=new MutationObserver(()=>{end(true);contacts.clear();});modalObserver.observe(app.modal,{attributes:true,attributeFilter:['class']});}
}
// Consume stale former editor actions from old DOM; there is no second editor.
function handle(app,el,e){if(el.dataset.action?.startsWith('player-order-'))return true;const tap=app.playerTurnOrderTap;return el.dataset.action==='hero'&&!!e&&e.detail>0&&tap?.cls===el.dataset.class&&performance.now()<tap.until;}
G.HonroPlayerTurnOrder={camp,handle,known,order,reordered,commit};
})(globalThis);
