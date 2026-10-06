(function(G){'use strict';
// One bounded bust crop for every HONRO portrait. Physical actors continue to
// use Scene.unit / HonroPartyVisual and are never cropped by this UI helper.
const cache=new Map();
function alphaBounds(canvas,limitY=canvas.height){
 const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
 let left=canvas.width,top=canvas.height,right=-1,bottom=-1;
 for(let y=0;y<Math.min(canvas.height,Math.ceil(limitY));y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>24){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=y;}
 return right<left?null:{left,top,right:right+1,bottom:bottom+1,width:right-left+1,height:bottom-top+1};
}
function sourceFor(actor,cls){
 const u={...(actor||{}),portraitOnly:true,cls,x:0,y:0,h:100,r:22,side:actor?.side??0,dead:false,maxHp:0,angle:25,facing:1,moving:0,hurt:0,anim:0,jumping:false,airborne:false,vy:0};
 const key=JSON.stringify([cls,u.side,u.id,u.name,u.honroType,u.role,!!u.boss,!!u.honroFinalBoss,!!u.honroAlly,!!u.honroCivilian,!!u.summoned]);
 if(cache.has(key))return cache.get(key);
 const source=document.createElement('canvas');source.width=1200;source.height=1500;
 const c=source.getContext('2d'),scene=new G.HonroScene(source),origin=[600,1420],scale=7;
 c.translate(...origin);c.scale(scale,scale);scene.unit(c,u,false,0);
 const bounds=alphaBounds(source);if(!bounds)return null;
 const id=u.summoned?null:typeof G.resolveRebuildCharacter==='function'?G.resolveRebuildCharacter(u):u.side===0?{archer:'seol_o',mage:'damheo',knight:'hwigyeom',occultist:'sodan'}[cls]:null;
 const asset=G.HONRO_PARTY?.[id],head=asset?.portrait?.headBounds;
 let protectedBounds;
 if(head){const k=scale*u.h/asset.canvas.visualHeight,[ax,ay]=asset.canvas.anchor;protectedBounds={left:origin[0]+(head[0]-ax)*k,top:origin[1]+(head[1]-ay)*k,right:origin[0]+(head[2]-ax)*k,bottom:origin[1]+(head[3]-ay)*k};}
 else protectedBounds=alphaBounds(source,bounds.top+bounds.height*.31)||bounds;
 // Retain only the upper body, not a multi-megapixel full-body backing store.
 const padding=bounds.height*.05,left=Math.floor(Math.min(bounds.left,protectedBounds.left)-padding),top=Math.floor(Math.min(bounds.top,protectedBounds.top)-padding),right=Math.ceil(Math.max(bounds.right,protectedBounds.right)+padding),bottom=Math.ceil(Math.max(bounds.top+bounds.height*.7,protectedBounds.bottom+padding));
 const retained=document.createElement('canvas');retained.width=right-left;retained.height=bottom-top;retained.getContext('2d').drawImage(source,left,top,retained.width,retained.height,0,0,retained.width,retained.height);
 const move=b=>({...b,left:b.left-left,right:b.right-left,top:b.top-top,bottom:b.bottom-top});
 const result={source:retained,bounds:move(bounds),head:move(protectedBounds)};if(cache.size>=8)cache.delete(cache.keys().next().value);cache.set(key,result);return result;
}
function cropFor(bounds,head,width,height){
 const aspect=width/height,pad=bounds.height*.035,top=Math.min(bounds.top,head.top)-pad;
 // Start with the existing story bust depth, then expand if a wide gat/hairstyle
 // needs more room. Both sides and the very top of the head always remain safe.
 const cropHeight=Math.max(bounds.height*.46+pad,(head.right-head.left+pad*2)/aspect,head.bottom-top+pad);
 const cropWidth=cropHeight*aspect,center=(head.left+head.right)/2;
 return {x:center-cropWidth/2,y:top,width:cropWidth,height:cropHeight};
}
function draw(canvas,actor,cls=actor?.cls){
 if(!canvas||!cls)return null;const item=sourceFor(actor,cls),c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);if(!item)return null;
 const crop=cropFor(item.bounds,item.head,canvas.width,canvas.height);
 c.drawImage(item.source,crop.x,crop.y,crop.width,crop.height,0,0,canvas.width,canvas.height);
 return {crop,head:item.head,bounds:item.bounds};
}
G.HonroPortraits=Object.freeze({draw,cropFor});
})(globalThis);
