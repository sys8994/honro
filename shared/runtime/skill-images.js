(function(G){'use strict';
// At most 84 decoded 256px originals (~21 MiB); four foreground/background jobs.
// Visible surfaces lead. Idle warming starts only after a visible icon request.
const cache=new Map(),queue=[];let active=0,warming=false;
const MAX=84,RETRY_MS=30000;
function pump(){while(active<4&&queue.length){const entry=queue.shift();active++;entry.state='loading';entry.attempts++;const image=new Image();image.decoding='async';
 const finish=ok=>{image.onload=image.onerror=null;entry.image=ok?image:null;entry.state=ok?'ready':'error';entry.failedAt=Date.now();entry.resolve(entry.image);active--;pump();};
 image.onload=async()=>{try{await image.decode?.();finish(true);}catch{finish(false);}};image.onerror=()=>finish(false);image.src=entry.url;
}}
function request(url,priority=false){let entry=cache.get(url),attempts=entry?.attempts||0;
 if(entry?.state==='error'&&entry.attempts<3&&Date.now()-entry.failedAt>=RETRY_MS){cache.delete(url);entry=null;}
 if(!entry){entry={url,state:'queued',attempts};entry.promise=new Promise(resolve=>entry.resolve=resolve);cache.set(url,entry);priority?queue.unshift(entry):queue.push(entry);
  while(cache.size>MAX){const old=[...cache].find(([key,value])=>key!==url&&!['loading','queued'].includes(value.state));if(!old)break;cache.delete(old[0]);}pump();
 }else if(priority&&entry.state==='queued'){queue.splice(queue.indexOf(entry),1);queue.unshift(entry);}
 return entry;
}
function readyURL(id){const item=G.HONRO_SKILL_ICON_MANIFEST?.icons?.[id];return item&&cache.get(item.url)?.state==='ready'?item.url:'';}
function warm(){if(warming)return;warming=true;const idle=G.requestIdleCallback||((fn)=>setTimeout(fn,250));idle(()=>{for(const item of Object.values(G.HONRO_SKILL_ICON_MANIFEST?.icons||{}))if(item.status==='ready'&&item.url)request(item.url);});}
async function load(el){const item=G.HONRO_SKILL_ICON_MANIFEST?.icons?.[el.dataset.skillIcon];if(!item||item.status!=='ready'||!item.url)return;
 const entry=request(item.url,true);warm();if(entry.state!=='ready')el.dataset.imageState='loading';
 const image=entry.state==='ready'?entry.image:await entry.promise;if(!el.isConnected)return;
 if(!image){el.dataset.imageState='error';return;}const target=el.querySelector('img');if(!target)return;if(target.getAttribute('src')!==item.url)target.src=item.url;el.dataset.imageState='ready';
}
const intersection=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){intersection.unobserve(e.target);load(e.target);}},{rootMargin:'80px'}):null;
function scan(root){if(root.nodeType!==1)return;for(const el of [...(root.matches('[data-skill-icon]')?[root]:[]),...root.querySelectorAll('[data-skill-icon]')])if(el.dataset.imageState==='available'){if(readyURL(el.dataset.skillIcon))load(el);else{el.dataset.imageState='observed';intersection?intersection.observe(el):load(el);}}}
// Scoped armory reconciliation. Keys include action and slot so duplicate stamps
// never steal each other's nodes; ready icon subtrees retain image/decode state.
function key(node){if(node.nodeType!==1)return '';return node.id||[node.tagName,node.dataset.action||'',node.dataset.slot||'',node.dataset.skill||'',node.dataset.id||'',node.dataset.class||'',node.dataset.skillIcon||''].join('|');}
function sync(old,next){if(old.nodeType!==next.nodeType||old.nodeName!==next.nodeName){old.replaceWith(next);return;}if(old.nodeType===3){if(old.data!==next.data)old.data=next.data;return;}if(old.nodeType!==1)return;
 if(old.matches('[data-skill-icon]')&&old.dataset.skillIcon===next.dataset.skillIcon)return;
 for(const a of [...old.attributes])if(!next.hasAttribute(a.name))old.removeAttribute(a.name);
 for(const a of next.attributes)if(old.getAttribute(a.name)!==a.value)old.setAttribute(a.name,a.value);
 const pool=[...old.childNodes];let cursor=old.firstChild;
 for(const fresh of [...next.childNodes]){const k=key(fresh);let existing=pool.find(n=>n===cursor&&n.nodeName===fresh.nodeName&&key(n)===k)||pool.find(n=>n.nodeName===fresh.nodeName&&key(n)===k);if(existing){pool.splice(pool.indexOf(existing),1);if(existing!==cursor)old.insertBefore(existing,cursor);sync(existing,fresh);cursor=existing.nextSibling;}else{old.insertBefore(fresh,cursor);}}
 for(const stale of pool)stale.remove();
}
function patch(root,html){const template=document.createElement('template');template.innerHTML=html;const shell=root.cloneNode(false);shell.append(template.content);sync(root,shell);}
function retry(){for(const [url,e] of cache)if(e.state==='error')cache.delete(url);for(const el of document.querySelectorAll('[data-image-state=error]'))load(el);}
function start(){new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)scan(n);for(const r of records)for(const n of r.removedNodes)if(n.nodeType===1){intersection?.unobserve(n);for(const c of n.querySelectorAll('[data-skill-icon]'))intersection?.unobserve(c);}}).observe(document.body,{childList:true,subtree:true});scan(document.body);G.addEventListener('online',retry);}
if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
G.HonroSkillImages={readyURL,patch,retry,status:()=>({complete:!!G.HONRO_SKILL_ICON_MANIFEST?.complete,cached:cache.size,failed:[...cache.values()].filter(e=>e.state==='error').length,active,queued:queue.length})};
})(globalThis);
