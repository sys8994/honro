(function(G){'use strict';
// Scoped armory reconciliation. Keys include action and slot so duplicate stamps
// never steal each other's nodes; ready icon subtrees retain image/decode state.
function key(node){if(node.nodeType!==1)return '';return node.id||[node.tagName,node.dataset.action||'',node.dataset.slot||'',node.dataset.skill||'',node.dataset.id||'',node.dataset.class||'',node.dataset.skillIcon||''].join('|');}
function sync(old,next){if(old.nodeType!==next.nodeType||old.nodeName!==next.nodeName){old.replaceWith(next);return;}if(old.nodeType===3){if(old.data!==next.data)old.data=next.data;return;}if(old.nodeType!==1)return;
 if(G.HonroSkillImages.canRetainHost(old,next))return;
 for(const a of [...old.attributes])if(!next.hasAttribute(a.name))old.removeAttribute(a.name);
 for(const a of next.attributes)if(old.getAttribute(a.name)!==a.value)old.setAttribute(a.name,a.value);
 const pool=[...old.childNodes];let cursor=old.firstChild;
 for(const fresh of [...next.childNodes]){const k=key(fresh);let existing=pool.find(n=>n===cursor&&n.nodeName===fresh.nodeName&&key(n)===k)||pool.find(n=>n.nodeName===fresh.nodeName&&key(n)===k);if(existing){pool.splice(pool.indexOf(existing),1);if(existing!==cursor)old.insertBefore(existing,cursor);sync(existing,fresh);cursor=existing.nextSibling;}else{old.insertBefore(fresh,cursor);}}
 for(const stale of pool)stale.remove();
}
// Keep focus local to the existing camp, including browser blur on retained-node moves.
function captureFocus(root){
 const doc=root.ownerDocument||document,active=doc.activeElement,camp=active?.closest?.('.camp-screen'),selector='button,input,select,textarea,a[href],[tabindex]';
 if(!camp||!root.contains(active)||!active.matches(selector))return()=>{};
 const group=active.closest('.node-stepper,.stat-invest-panel,.branch-tabs,.hero-tabs')||active.parentElement,row=active.closest('.tree-node-wrap');
 const candidates=[...new Set([active,...group.querySelectorAll(selector),...(row?.querySelectorAll(selector)||[])])];
 return()=>{
  if(doc.getElementById('modal')?.classList.contains('open'))return;
  const now=doc.activeElement;if(now!==active&&now!==doc.body&&now!==doc.documentElement&&now!==root)return;
  const target=candidates.find(el=>el.isConnected&&root.contains(el)&&el.closest('.camp-screen')&&!el.matches(':disabled,[aria-disabled="true"]')&&!el.closest('[hidden],[inert]')&&el.getClientRects().length&&getComputedStyle(el).visibility==='visible');
  if(target&&doc.activeElement!==target)target.focus({preventScroll:true});
 };
}
function patch(root,html){const restore=captureFocus(root),template=document.createElement('template');template.innerHTML=html;const shell=root.cloneNode(false);shell.append(template.content);sync(root,shell);G.HonroSkillImages.scan(root);restore();}
G.HonroCampRenderer={patch,captureFocus};
})(globalThis);
