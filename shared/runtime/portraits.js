(function(G){'use strict';
// One bounded bust crop for every HONRO portrait. Physical actors continue to
// use Scene.unit / HonroPartyVisual and are never cropped by this UI helper.
const cache=new Map();
function alphaBounds(data,width,height,limitY=height){
 let left=width,top=height,right=0,bottom=0;
 for(let y=0,end=Math.min(height,Math.ceil(limitY));y<end;y++)for(let x=0,at=(y*width)*4+3;x<width;x++,at+=4)if(data[at]>24){if(x<left)left=x;if(x>=right)right=x+1;if(y<top)top=y;bottom=y+1;}
 return right<=left?null:{left,top,right,bottom,width:right-left,height:bottom-top};
}
function sourceFor(actor,cls,ratio){
 const u={...(actor||{}),portraitOnly:true,cls,x:0,y:0,h:100,r:22,side:actor?.side??0,dead:false,maxHp:0,angle:25,facing:1,moving:0,hurt:0,anim:0,jumping:false,airborne:false,vy:0};
 const id=u.summoned?null:typeof G.resolveRebuildCharacter==='function'?G.resolveRebuildCharacter(u):u.side===0?{archer:'seol_o',mage:'damheo',knight:'hwigyeom',occultist:'sodan'}[cls]:null;
 // Only the same resolved, unmodified companion body may cross team/name IDs.
 // Bosses, NPC dispatch and authored visual overrides keep their own identity.
 const shared=id&&['seol_o','damheo','hwigyeom','sodan'].includes(id)&&[0,2].includes(u.side)&&!u.boss&&!u.honroFinalBoss&&!u.honroMidboss&&!u.summoned&&!u.honroType&&!u.honroAct2&&!u.honroSpirit&&!u.honroVisualOnly&&!u.honroObjectiveTarget&&!u.honroScenePose&&!u.eaterCapturedBy;
 const key=shared?'party:'+id:JSON.stringify([cls,u.side,u.id,u.name,u.honroType,u.role,u.allyRole,!!u.boss,!!u.honroFinalBoss,!!u.honroAlly,!!u.honroCivilian,!!u.summoned,u.summonKind]);
 const cached=cache.get(key);if(cached?.ratio>=ratio)return cached;
 const source=document.createElement('canvas');source.width=1200*ratio;source.height=1500*ratio;
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
function draw(canvas,actor,cls=actor?.cls){
 if(!canvas||!cls)return null;
 // HUD uses an 88x108 backing; dialogue uses 400x440 (up to 240x264 CSS).
 // Size for both the backing and CSS/DPR, in quarter steps to reuse the cache.
 // Large dialogue retains the original source quality and framing budget.
 const dpr=Math.max(1,G.devicePixelRatio||1),width=Math.max(canvas.width,(canvas.clientWidth||0)*dpr),height=Math.max(canvas.height,(canvas.clientHeight||0)*dpr);
 const ratio=Math.min(1,Math.max(.25,Math.ceil(Math.max(width/250,height/300)*4)/4));
 const item=sourceFor(actor,cls,ratio),c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);if(!item)return null;
 const crop=cropFor(item.bounds,item.head,canvas.width,canvas.height);
 c.drawImage(item.source,crop.x,crop.y,crop.width,crop.height,0,0,canvas.width,canvas.height);
 return {crop,head:item.head,bounds:item.bounds};
}
G.HonroPortraits=Object.freeze({draw,cropFor,storyActor});
})(globalThis);
