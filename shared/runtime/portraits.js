(function(G){'use strict';
// One bounded bust crop for every HONRO portrait. Physical actors continue to
// use Scene.unit / HonroPartyVisual and are never cropped by this UI helper.
const cache=new Map(),images=new Map(),views=new WeakMap(),surfaces=new WeakMap();
const counts={requests:0,decodes:0,paints:0,fallbackPaints:0,vectorBuilds:0};
// Purpose, not screen ID, owns approved-image framing across every consumer.
const framing=Object.freeze({bust:.88,icon:1,dialogue:1,full:1});
function markup(cls,purpose='bust',slot=cls){
 if(!['archer','mage','knight','occultist'].includes(cls))return '';
 return `<span data-portrait-host="${cls}" data-portrait-framing="${purpose}" data-portrait-slot="${slot}" style="display:contents"></span>`;
}
function alphaBounds(data,width,height,limitY=height){
 let left=width,top=height,right=0,bottom=0;
 for(let y=0,end=Math.min(height,Math.ceil(limitY));y<end;y++)for(let x=0,at=(y*width)*4+3;x<width;x++,at+=4)if(data[at]>24){if(x<left)left=x;if(x>=right)right=x+1;if(y<top)top=y;bottom=y+1;}
 return right<=left?null:{left,top,right,bottom,width:right-left,height:bottom-top};
}
function vectorIdentity(u,cls){
 const id=u.summoned?null:typeof G.resolveRebuildCharacter==='function'?G.resolveRebuildCharacter(u):u.side===0?{archer:'seol_o',mage:'damheo',knight:'hwigyeom',occultist:'sodan'}[cls]:null;
 // Only the same resolved, unmodified companion body may cross team/name IDs.
 // Bosses, NPC dispatch and authored visual overrides keep their own identity.
 const shared=id&&['seol_o','damheo','hwigyeom','sodan'].includes(id)&&[0,2].includes(u.side)&&!u.boss&&!u.honroFinalBoss&&!u.honroMidboss&&!u.summoned&&!u.honroType&&!u.honroAct2&&!u.honroSpirit&&!u.honroVisualOnly&&!u.honroObjectiveTarget&&!u.honroScenePose&&!u.eaterCapturedBy;
 const key=shared?'party:'+id:JSON.stringify([cls,u.side,u.id,u.name,u.honroType,u.role,u.allyRole,!!u.boss,!!u.honroFinalBoss,!!u.honroAlly,!!u.honroCivilian,!!u.summoned,u.summonKind]);
 return {id,key};
}
function sourceFor(actor,cls,ratio){
 const u={...(actor||{}),portraitOnly:true,cls,x:0,y:0,h:100,r:22,side:actor?.side??0,dead:false,maxHp:0,angle:25,facing:1,moving:0,hurt:0,anim:0,jumping:false,airborne:false,vy:0};
 const {id,key}=vectorIdentity(u,cls);
 const cached=cache.get(key);if(cached?.ratio>=ratio)return cached;
 counts.vectorBuilds++;const source=document.createElement('canvas');source.width=1200*ratio;source.height=1500*ratio;
 const c=source.getContext('2d'),scene=new G.HonroScene(source),origin=[600*ratio,1420*ratio],scale=7*ratio;
 c.translate(...origin);c.scale(scale,scale);scene.unit(c,u,false,0);
 const pixels=c.getImageData(0,0,source.width,source.height).data;
 const bounds=alphaBounds(pixels,source.width,source.height);if(!bounds)return null;
 const asset=G.HONRO_PARTY?.[id],head=asset?.portrait?.headBounds;
 let protectedBounds;
 if(head){const k=scale*u.h/asset.canvas.visualHeight,[ax,ay]=asset.canvas.anchor;protectedBounds={left:origin[0]+(head[0]-ax)*k,top:origin[1]+(head[1]-ay)*k,right:origin[0]+(head[2]-ax)*k,bottom:origin[1]+(head[3]-ay)*k};}
 else protectedBounds=alphaBounds(pixels,source.width,source.height,bounds.top+bounds.height*.31)||bounds;
 // Retain only the upper body, not a multi-megapixel full-body backing store.
 const padding=bounds.height*.05,left=Math.floor(Math.min(bounds.left,protectedBounds.left)-padding),top=Math.floor(Math.min(bounds.top,protectedBounds.top)-padding),right=Math.ceil(Math.max(bounds.right,protectedBounds.right)+padding),bottom=Math.ceil(Math.max(bounds.top+bounds.height*.7,protectedBounds.bottom+padding));
 const retained=document.createElement('canvas');retained.width=right-left;retained.height=bottom-top;retained.getContext('2d').drawImage(source,left,top,retained.width,retained.height,0,0,retained.width,retained.height);
 const move=b=>({...b,left:b.left-left,right:b.right-left,top:b.top-top,bottom:b.bottom-top});
 const result={source:retained,bounds:move(bounds),head:move(protectedBounds),ratio};if(!cached&&cache.size>=8)cache.delete(cache.keys().next().value);cache.set(key,result);return result;
}
function cropFor(bounds,head,width,height){
 const aspect=width/height,pad=bounds.height*.02,top=Math.min(bounds.top,head.top)-pad;
 // Frame the shoulders more closely, then expand if a wide gat/hairstyle
 // needs more room. Both sides and the very top of the head always remain safe.
 const cropHeight=Math.max(bounds.height*.4+pad,(head.right-head.left+pad*2)/aspect,head.bottom-top+pad);
 const cropWidth=cropHeight*aspect,center=(head.left+head.right)/2;
 return {x:center-cropWidth/2,y:top,width:cropWidth,height:cropHeight};
}
// A story class selects framing/color, not the identity of an absent speaker.
// Live actors retain their authored identity; only the four named companions may
// fall back to their party class when the scene has no corresponding unit.
function storyActor(who,actor,portrait=G.HONRO_STORY_PORTRAITS?.[who]){
 if(actor)return actor;
 const party={'설오':'archer','담허':'mage','휘겸':'knight','소단':'occultist'};
 if(party[who]===portrait?.class)return null;
 if(!portrait?.class||!portrait.actor)return null;
 return {...portrait.actor,id:portrait.actor?.id||`story-npc-${who}`,name:who,cls:portrait.class,side:2};
}
function vectorRatio(canvas){
 const dpr=Math.max(1,G.devicePixelRatio||1),width=Math.max(canvas.width,(canvas.clientWidth||0)*dpr),height=Math.max(canvas.height,(canvas.clientHeight||0)*dpr);
 const ratio=Math.min(1,Math.max(.25,Math.ceil(Math.max(width/250,height/300)*4)/4));
 return ratio;
}
function fallbackKey(canvas,actor,cls){return vectorIdentity({...actor,cls,side:actor?.side??0},cls).key+'|'+vectorRatio(canvas);}
function drawVector(canvas,actor,cls=actor?.cls){
 if(!canvas||!cls)return null;
 // HUD uses an 88x108 backing; dialogue uses 400x440 (up to 240x264 CSS).
 // Size for both the backing and CSS/DPR, in quarter steps to reuse the cache.
 // Large dialogue retains the original source quality and framing budget.
 const ratio=vectorRatio(canvas);
 const item=sourceFor(actor,cls,ratio),c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);if(!item)return null;
 const crop=cropFor(item.bounds,item.head,canvas.width,canvas.height);
 c.drawImage(item.source,crop.x,crop.y,crop.width,crop.height,0,0,canvas.width,canvas.height);
 return {crop,head:item.head,bounds:item.bounds};
}
const people=Object.freeze({'설오':['seoro','archer'],'담허':['damheo','mage'],'휘겸':['hwigyeom','knight'],'소단':['sodan','occultist']});
function select(base,variants={},portraitExpression,options={}){
 const requested=typeof portraitExpression==='string'&&portraitExpression?portraitExpression:'base',known=requested==='base'||Object.hasOwn(G.HONRO_PORTRAIT_VARIANTS?.variants||{},requested),candidate=variants[requested],exact=requested!=='base'&&known&&candidate?.src&&candidate.status!=='pending',identity=options.id||base.id;
 const fallback={...base,id:identity,expression:'base',neutral:!!options.neutral,npc:!!options.npc};
 return {...(exact?candidate:base),id:identity,expression:exact?requested:'base',requestedExpression:requested,fallbackReason:requested==='base'?'base':!known?'unknown-expression':exact?'exact':'unmade',neutral:!!options.neutral,npc:!!options.npc,baseAsset:exact?fallback:null};
}
function approved(actor,cls,options={}){
 // A concrete actor always wins over a speaker/class fallback. A similarly
 // classed NPC, summon or enemy must never inherit an approved protagonist.
 const who=actor?actor.name:options.identity,person=people[who];if(!person||cls!==person[1])return null;
 if(actor&&(actor.summoned||actor.honroVisualOnly||actor.eaterCapturedBy||![0,2].includes(actor.side)&&!(who==='소단'&&actor.side===1&&(actor.id==='boss'||actor.honroFinalBoss))))return null;
 const manifest=G.HONRO_STORY_PORTRAITS?.[who]?.approvedPortrait;if(manifest?.id!==person[0])return null;
 const base=manifest.expressions.base;return base?.src?select(base,manifest.expressions,options.portraitExpression,{id:manifest.id,neutral:Object.hasOwn(options,'portraitExpression')}):null;
}
function state(canvas,value){if(canvas.dataset.portraitState!==value)canvas.dataset.portraitState=value;const busy=value==='loading'?'true':'false';if(canvas.getAttribute('aria-busy')!==busy)canvas.setAttribute('aria-busy',busy);}
function imageCrop(asset,canvas,purpose){
 if(purpose==='full')return {x:0,y:0,width:asset.width,height:asset.height};
 if(purpose==='dialogue'){
  // A large silhouette has a different job from a small face-identification card.
  // Keep the entire source width and head above a padded top; only the lower
  // body may extend behind the reading surface / viewport. Never fill-crop a hat.
  const face=asset.framing?.dialogue?.face||asset.head,aspect=canvas.width/canvas.height,pixelScale=asset.width/1024;
  const height=Math.max(Math.min(face.height*5,asset.framing?.dialogue?.maxHeight||Infinity),(asset.width+64*pixelScale)/aspect),width=height*aspect;
  return {x:(asset.width-width)/2,y:asset.framing?.dialogue?.top??-32*pixelScale,width,height};
 }
 const region=asset.framing?.[purpose]||asset;
 const crop=cropFor(region.bust,region.head,canvas.width,canvas.height);
 const scale=framing[purpose];
 const center=crop.x+crop.width/2;crop.width/=scale;crop.height/=scale;crop.x=center-crop.width/2;
 if(crop.width<=asset.width)crop.x=Math.max(0,Math.min(asset.width-crop.width,crop.x));
 else crop.x=(asset.width-crop.width)/2; // keep the whole wide gat inside the frame
 if(crop.height<=asset.height)crop.y=Math.max(0,Math.min(asset.height-crop.height,crop.y));
 return crop;
}
// Ready decoded pixels are bounded separately from in-flight browser decoding.
// Painted icon canvases retain their pixels after LRU eviction; only the current
// dialogue bitmap and one explicit next line protect decoded source images.
let sequence=0,dialogueEntry=null,nextEntry=null;
const budget=()=>((G.innerWidth||1024)<760?16:32)*1024*1024;
const imageKey=a=>a.src+'|'+(a.revision||a.sourceSha256||'');
const readyBytes=()=>[...images.values()].reduce((n,e)=>n+(e.state==='ready'?e.bytes:0),0);
function trimImages(){
 let bytes=readyBytes();for(const [key,e]of [...images].sort((a,b)=>a[1].used-b[1].used)){
  if(bytes<=budget()&&images.size<=13)break;if(e===dialogueEntry||e===nextEntry||e.state==='loading')continue;
  if(e.state==='ready')bytes-=e.bytes;clearTimeout(e.retryTimer);e.image=null;e.state='evicted';e.waiters.clear();images.delete(key);
 }
}
function liveWaiters(entry){for(const [canvas,v]of entry.waiters)if(!canvas.isConnected||views.get(canvas)!==v||v.entry!==entry&&v.fallbackEntry!==entry)entry.waiters.delete(canvas);return entry.waiters.size;}
function retry(entry,reopen=false){
 if(entry.retryTimer||!liveWaiters(entry)||entry.attempts>=3&&!reopen)return;
 entry.retryTimer=setTimeout(()=>{entry.retryTimer=null;if(entry.state!=='error'||!liveWaiters(entry))return;if(reopen)entry.attempts=0;startImage(entry);},Math.max(0,entry.retryAt-Date.now()));
}
function startImage(entry){
 entry.state='loading';entry.attempts++;entry.image=new Image();counts.requests++;const image=entry.image;image.decoding='async';let timer;
 for(const [canvas,v]of entry.waiters)paint(canvas,v);
 const finish=ok=>{if(entry.image!==image||entry.state!=='loading')return;clearTimeout(timer);image.onload=image.onerror=null;entry.state=ok?'ready':'error';entry.retryAt=Date.now()+750*entry.attempts;if(!ok)entry.image=null;
  liveWaiters(entry);for(const [canvas,v]of entry.waiters)paint(canvas,v);if(ok)entry.waiters.clear();else retry(entry);trimImages();
 };
 image.onerror=()=>finish(false);image.onload=async()=>{try{if(image.decode){counts.decodes++;await image.decode();}finish(true);}catch{finish(false);}};timer=setTimeout(()=>finish(false),8000);image.src=entry.asset.src;
}
function request(asset){const key=imageKey(asset);let entry=images.get(key);if(entry){entry.used=++sequence;return entry;}
 entry={asset,state:'loading',image:null,waiters:new Map(),attempts:0,retryAt:0,retryTimer:null,bytes:asset.width*asset.height*4,used:++sequence};images.set(key,entry);startImage(entry);trimImages();return entry;
}
function blank(canvas,view){if(!view.blank){canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);view.blank=true;view.paintedKey=null;}}
function paint(canvas,view){
 if(views.get(canvas)!==view)return;
 if(view.entry.state==='error'&&view.asset.baseAsset&&(!view.fallbackEntry||view.fallbackEntry.state==='evicted')){view.fallbackEntry=request(view.asset.baseAsset);view.fallbackEntry.waiters.set(canvas,view);if(view.fallbackEntry.state==='error')retry(view.fallbackEntry);}
 const exact=view.entry.state==='ready'&&view.entry.image,fallback=view.fallbackEntry?.state==='ready'&&view.fallbackEntry.image,entry=exact?view.entry:fallback?view.fallbackEntry:null,asset=exact?view.asset:fallback?view.asset.baseAsset:null;
 if(entry){
  const crop=imageCrop(asset,canvas,view.purpose),key=[imageKey(asset),canvas.width,canvas.height,view.purpose,crop.x,crop.y,crop.width,crop.height].join('|');
  if(view.paintedKey!==key){const c=canvas.getContext('2d');c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(entry.image,crop.x,crop.y,crop.width,crop.height,0,0,canvas.width,canvas.height);c.restore();counts.paints++;view.paintedKey=key;view.blank=false;}
  const region=asset.framing?.[view.purpose]||asset;view.info={source:'approved',state:'ready',identity:asset.id,expression:asset.expression,requestedExpression:view.asset.requestedExpression,fallbackReason:exact?view.asset.fallbackReason:'network-variant',framing:view.purpose,crop,head:region.head||asset.head,bounds:region.bust||asset.bust};state(canvas,'ready');if(view.purpose==='dialogue')dialogueEntry=entry;if(exact)view.fallbackEntry?.waiters.delete(canvas);
 }else if(view.entry.state==='error'&&view.fallbackEntry?.state!=='loading'){
  if(view.asset.npc||view.asset.neutral){blank(canvas,view);view.info={...view.info,source:'neutral',state:'error'};}
  else if(view.fallbackKey!==fallbackKey(canvas,view.actor,view.cls)){view.fallbackKey=fallbackKey(canvas,view.actor,view.cls);view.info={...drawVector(canvas,view.actor,view.cls),source:'vector',state:'error'};counts.fallbackPaints++;view.entry.waiters.delete(canvas);}
  state(canvas,'error');
 }else {view.info={...view.info,state:'loading'};state(canvas,'loading');}
}
function draw(canvas,actor,cls=actor?.cls,options={}){
 if(!canvas||!cls&&!options.npcAsset)return null;const asset=options.npcAsset||approved(actor,cls,options),old=views.get(canvas);
 if(asset?.npc&&typeof Image==='undefined')return null;
 if(!asset||typeof Image==='undefined'){old?.entry.waiters.delete(canvas);old?.fallbackEntry?.waiters.delete(canvas);views.delete(canvas);return drawVector(canvas,actor,cls);}
 const purpose=Object.hasOwn(framing,options.framing)?options.framing:'bust',crop=imageCrop(asset,canvas,purpose),key=[imageKey(asset),canvas.width,canvas.height,purpose,crop.x,crop.y,crop.width,crop.height].join('|');
 if(old?.key===key){old.asset=asset;old.info={...old.info,requestedExpression:asset.requestedExpression,fallbackReason:old.fallbackEntry?'network-variant':asset.fallbackReason};if(purpose==='dialogue')dialogueEntry=old.entry.state==='ready'?old.entry:old.fallbackEntry?.state==='ready'?old.fallbackEntry:old.entry;for(const entry of [old.entry,old.fallbackEntry])if(entry&&(entry.state==='loading'||entry.state==='error'&&(asset.npc||asset.neutral))){entry.waiters.set(canvas,old);if(entry.state==='error'&&options.reopen)retry(entry,true);}if(old.info.state==='ready')return old.info;if(old.entry.state==='ready'||old.entry.state==='error'&&!asset.npc&&!asset.neutral){old.actor=actor;paint(canvas,old);}return old.info;}
 old?.entry.waiters.delete(canvas);old?.fallbackEntry?.waiters.delete(canvas);const entry=request(asset),keep=old?.info.identity===asset.id&&old.info.source==='approved'&&old.paintedKey,view={key,entry,asset,actor,cls,purpose,blank:!keep,paintedKey:keep?old.paintedKey:null,info:{source:keep?'approved':'neutral',state:entry.state,identity:asset.id,expression:keep?old.info.expression:asset.expression,requestedExpression:asset.requestedExpression}};views.set(canvas,view);
 if(!keep)canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);if(purpose==='dialogue')dialogueEntry=entry;
 if(entry.state!=='ready')entry.waiters.set(canvas,view);paint(canvas,view);if(entry.state==='error'&&(asset.npc||asset.neutral))retry(entry,options.reopen);trimImages();return view.info;
}
function prepareNext(app,lines,index){
 nextEntry=null;for(const [who,,meta={}]of lines.slice(index+1,index+4)){
  if(!who||['narration','document','guide'].includes(meta.kind)||G.HonroNPCPortraits?.hidden(who,meta))continue;
  const cls=G.HONRO_STORY_PORTRAITS?.[who]?.class,asset=G.HonroNPCPortraits?.resolve(app,who,meta,null)||approved(null,cls,{identity:who,portraitExpression:meta.portraitExpression});if(asset){nextEntry=request(asset);break;}
 }trimImages();
}
function mount(host,actor,cls,options={}){
 const owner=host.closest('#dialogue-root,#hero-switches,#modal,#app')||host.parentElement||host;let pool=surfaces.get(owner);if(!pool)surfaces.set(owner,pool=new Map());
 const slot=options.surface==='dialogue'?'dialogue':options.slot||options.identity||cls;let canvas=pool.get(slot);
 if(!canvas){const bust=options.framing!=='icon';canvas=document.createElement('canvas');canvas.width=options.surface==='dialogue'?400:bust?160:88;canvas.height=options.surface==='dialogue'?440:bust?192:108;canvas.className=bust?'':'portrait';if(options.surface==='dialogue')canvas.id='story-portrait-canvas';pool.set(slot,canvas);}
 const purpose=options.framing||'bust';if(canvas.dataset.portraitFraming!==purpose)canvas.dataset.portraitFraming=purpose;
 const reopen=canvas.parentNode!==host;if(reopen)host.appendChild(canvas);return draw(canvas,actor,cls,{...options,reopen});
}
function release(root){for(const canvas of root.querySelectorAll('canvas')){const view=views.get(canvas);if(!view)continue;for(const entry of [view.entry,view.fallbackEntry])if(entry){entry.waiters.delete(canvas);if(!liveWaiters(entry)){clearTimeout(entry.retryTimer);entry.retryTimer=null;}}}dialogueEntry=nextEntry=null;trimImages();}
G.addEventListener?.('resize',trimImages,{passive:true});
G.HonroPortraits=Object.freeze({draw,mount,release,prepareNext,select,markup,framing,cropFor,storyActor,approved,stats:()=>({...counts,imageEntries:images.size,pending:[...images.values()].filter(v=>v.state==='loading').length,errors:[...images.values()].filter(v=>v.state==='error').length,vectorEntries:cache.size,waiters:[...images.values()].reduce((n,v)=>n+v.waiters.size,0),decodedRgbaBytes:readyBytes(),pendingRgbaBytes:[...images.values()].filter(v=>v.state==='loading').reduce((n,v)=>n+v.bytes,0),budgetBytes:budget(),protectedRgbaBytes:[...new Set([dialogueEntry,nextEntry])].filter(v=>v?.state==='ready').reduce((n,v)=>n+v.bytes,0)})});
})(globalThis);
