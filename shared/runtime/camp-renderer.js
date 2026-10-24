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
function patch(root,html){const template=document.createElement('template');template.innerHTML=html;const shell=root.cloneNode(false);shell.append(template.content);sync(root,shell);G.HonroSkillImages.scan(root);}
G.HonroCampRenderer={patch};
})(globalThis);
