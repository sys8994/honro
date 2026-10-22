(function(G){'use strict';
// No image request until its actual DOM surface is visible. Decoded images are
// shared between HUD/armory/training, with bounded decode concurrency and cache.
const cache=new Map(),queue=[],failed=new Set();let active=0;
function pump(){while(active<4&&queue.length){const job=queue.shift();active++;const image=new Image();image.decoding='async';image.onload=async()=>{try{if(image.decode)await image.decode();job.resolve(image);}catch{job.resolve(null);}finally{active--;pump();}};image.onerror=()=>{failed.add(job.url);job.resolve(null);active--;pump();};image.src=job.url;}}
function request(url){
 if(failed.has(url))return Promise.resolve(null);
 if(!cache.has(url)){
  cache.set(url,new Promise(resolve=>{queue.push({url,resolve});pump();}));
  if(cache.size>96)cache.delete(cache.keys().next().value);
 }
 return cache.get(url);
}
async function load(el){
 const item=G.HONRO_SKILL_ICON_MANIFEST?.icons?.[el.dataset.skillIcon];
 if(!item||item.status!=='ready'||!item.url)return;
 el.dataset.imageState='loading';const image=await request(item.url);
 if(!el.isConnected)return;
 if(!image){el.dataset.imageState='error';return;}
 const target=el.querySelector('img');if(!target)return;
 target.src=image.src;el.dataset.imageState='ready';
}
const intersection=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){intersection.unobserve(e.target);load(e.target);}},{rootMargin:'0px'}):null;
function scan(root){
 if(root.nodeType!==1)return;
 const nodes=[...(root.matches('[data-skill-icon]')?[root]:[]),...root.querySelectorAll('[data-skill-icon]')];
 for(const el of nodes)if(el.dataset.imageState==='available'){el.dataset.imageState='observed';intersection?intersection.observe(el):load(el);}
}
function start(){
 const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)scan(node);for(const record of records)for(const node of record.removedNodes)if(node.nodeType===1){intersection?.unobserve(node);for(const child of node.querySelectorAll('[data-skill-icon]'))intersection?.unobserve(child);}});
 observer.observe(document.body,{childList:true,subtree:true});scan(document.body);
}
if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
G.HonroSkillImages={status:()=>({complete:!!G.HONRO_SKILL_ICON_MANIFEST?.complete,cached:cache.size,failed:failed.size,active,queued:queue.length})};
})(globalThis);
