(function(G){'use strict';
// 84 approved 256px images, four scheduled jobs. All consumers share entries;
// a timeout releases the queue but keeps its image listener for a late success.
const cache=new Map(),queue=[],tracked=new WeakMap();let active=0,warming=false;
const MAX=84,TIMEOUT_MS=8000,RETRY_MS=750,MAX_TRIES=3;
const counts={requests:0,decodes:0,timeouts:0,srcWrites:0};
const connected=e=>{for(const el of e.targets)if(!el.isConnected)e.targets.delete(el);return e.targets.size>0;};
function state(el,value){if(el.dataset.imageState!==value)el.dataset.imageState=value;}
function paint(el,e){if(!el.isConnected)return;if(G.HONRO_SKILL_ICON_MANIFEST?.icons?.[el.dataset.skillIcon]?.url!==e.url){e.targets.delete(el);return;}state(el,e.state==='queued'?'loading':e.state);if(e.state==='ready'){const img=el.querySelector('img');if(img&&img.getAttribute('src')!==e.url){img.src=e.url;counts.srcWrites++;}}}
function notify(e){for(const el of e.targets)if(el.isConnected)paint(el,e);else e.targets.delete(el);if(e.state==='ready')e.targets.clear();}
function cancel(e){const job=e.job;if(!job)return;clearTimeout(job.timer);job.image.onload=job.image.onerror=null;job.image.src='';job.release();e.job=null;}
function enqueue(e,priority){clearTimeout(e.retryTimer);e.retryTimer=null;e.state='queued';priority?queue.unshift(e):queue.push(e);notify(e);pump();}
function retryLater(e,newVisit=false){
 if(e.retryTimer||!['error','timeout'].includes(e.state)||!connected(e)||e.state==='timeout'&&!newVisit||e.attempts>=MAX_TRIES&&!newVisit)return;
 e.retryTimer=setTimeout(()=>{e.retryTimer=null;if(!['error','timeout'].includes(e.state)||!connected(e))return;if(e.state==='timeout')cancel(e);if(e.attempts>=MAX_TRIES)e.attempts=0;enqueue(e,true);},Math.max(0,e.retryAt-Date.now()));
}
function pump(){while(active<4&&queue.length){const e=queue.shift();active++;e.state='loading';e.attempts++;counts.requests++;notify(e);
 const image=new Image();image.decoding='async';const job={image,released:false,timer:null,release(){if(this.released)return;this.released=true;active--;pump();}};e.job=job;
 const finish=ok=>{if(e.job!==job)return;clearTimeout(job.timer);image.onload=image.onerror=null;e.job=null;e.image=ok?image:null;e.state=ok?'ready':'error';e.retryAt=Date.now()+RETRY_MS*Math.min(e.attempts,MAX_TRIES);notify(e);job.release();if(!ok)retryLater(e);};
 image.onload=async()=>{try{counts.decodes++;await image.decode?.();finish(true);}catch{finish(false);}};image.onerror=()=>finish(false);
 job.timer=setTimeout(()=>{if(e.job!==job)return;e.state='timeout';e.retryAt=Date.now()+RETRY_MS;counts.timeouts++;notify(e);job.release();},TIMEOUT_MS);image.src=e.url;
}}
function request(url,priority=false){let e=cache.get(url);
 if(!e){
  if(cache.size>=MAX){const old=[...cache].find(([,v])=>!['loading','queued','timeout'].includes(v.state)&&!connected(v));if(old){clearTimeout(old[1].retryTimer);cache.delete(old[0]);}else return null;}
  e={url,state:'queued',attempts:0,retryAt:0,retryTimer:null,image:null,job:null,targets:new Set()};cache.set(url,e);priority?queue.unshift(e):queue.push(e);pump();
 }else if(['error','timeout'].includes(e.state)&&Date.now()>=e.retryAt){cancel(e);if(e.attempts>=MAX_TRIES)e.attempts=0;enqueue(e,priority);}
 else if(priority&&e.state==='queued'){queue.splice(queue.indexOf(e),1);queue.unshift(e);}
 return e;
}
function readyURL(id){const item=G.HONRO_SKILL_ICON_MANIFEST?.icons?.[id];return item&&cache.get(item.url)?.state==='ready'?item.url:'';}
function warm(){if(warming)return;warming=true;const idle=G.requestIdleCallback||((fn)=>setTimeout(fn,250));idle(()=>{for(const item of Object.values(G.HONRO_SKILL_ICON_MANIFEST?.icons||{}))if(item.status==='ready'&&item.url)request(item.url);});}
function load(el){const item=G.HONRO_SKILL_ICON_MANIFEST?.icons?.[el.dataset.skillIcon];if(!item||item.status!=='ready'||!item.url)return;
 const e=request(item.url,true);if(!e)return;const previous=tracked.get(el),newVisit=previous!==e;if(newVisit)previous?.targets.delete(el);tracked.set(el,e);if(e.state!=='ready')e.targets.add(el);paint(el,e);retryLater(e,newVisit);warm();
}
const intersection=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){intersection.unobserve(e.target);load(e.target);}},{rootMargin:'80px'}):null;
function scan(root){if(root.nodeType!==1)return;for(const el of [...(root.matches('[data-skill-icon]')?[root]:[]),...root.querySelectorAll('[data-skill-icon]')])if(!['ready','loading','observed'].includes(el.dataset.imageState)){el.dataset.imageState='observed';intersection?intersection.observe(el):load(el);}}
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
function patch(root,html){const template=document.createElement('template');template.innerHTML=html;const shell=root.cloneNode(false);shell.append(template.content);sync(root,shell);scan(root);}
function retry(){for(const e of cache.values())if(['error','timeout'].includes(e.state)&&connected(e)){cancel(e);e.attempts=0;enqueue(e,true);}scan(document.body);}
function detach(root){if(root.nodeType!==1||root.isConnected)return;for(const el of [...(root.matches('[data-skill-icon]')?[root]:[]),...root.querySelectorAll('[data-skill-icon]')]){intersection?.unobserve(el);const e=tracked.get(el);e?.targets.delete(el);tracked.delete(el);if(e&&!connected(e)){clearTimeout(e.retryTimer);e.retryTimer=null;}}}
function start(){new MutationObserver(records=>{for(const r of records){for(const n of r.addedNodes)scan(n);for(const n of r.removedNodes)detach(n);}}).observe(document.body,{childList:true,subtree:true});scan(document.body);G.addEventListener('online',retry);}
if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
G.HonroSkillImages={readyURL,patch,retry,status:()=>({complete:!!G.HONRO_SKILL_ICON_MANIFEST?.complete,cached:cache.size,failed:[...cache.values()].filter(e=>e.state==='error').length,active,queued:queue.length,timedOut:[...cache.values()].filter(e=>e.state==='timeout').length,targets:[...cache.values()].reduce((n,e)=>n+e.targets.size,0),...counts})};
})(globalThis);
