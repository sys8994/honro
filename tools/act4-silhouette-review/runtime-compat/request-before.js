function request(key,mood=""){
 const cacheKey=key+":"+mood;
 if(cache.has(cacheKey)){const item=cache.get(cacheKey);cache.delete(cacheKey);cache.set(cacheKey,item);return item;}
 const src=manifest?.images[key];if(!src||typeof Image==='undefined')return null;
 while(cache.size>=MAX){const first=cache.keys().next().value,old=cache.get(first);if(old.canvas)old.canvas.width=1;if(old.image){old.image.onload=null;old.image.onerror=null;old.image.src='';}cache.delete(first);}
 const item={image:new Image(),canvas:null,error:false};cache.set(cacheKey,item);item.image.decoding='async';
 item.image.onerror=()=>{item.error=true;};
 item.image.onload=()=>{
  if(cache.get(cacheKey)!==item)return;
  const image=item.image,cv=document.createElement('canvas'),c=cv.getContext('2d');
  cv.width=Math.min(2048,image.naturalWidth);cv.height=Math.round(cv.width*image.naturalHeight/image.naturalWidth);
  const dark=['bellRear','depotRear'].includes(key),interior=key.endsWith('-interior'),overcast=['townSky','town-river','town-wall','workshop-yard'].includes(key);
  c.filter=['act4Dawn','act4Sea'].includes(key)?'saturate(.48) contrast(.80) brightness(1.10)':overcast?'none':dark?'saturate(.55) contrast(.65) brightness(.66)':interior?'saturate(.42) contrast(.58) brightness(.68)':'saturate(.50) contrast(.76) brightness(.80)';
  c.drawImage(image,0,0,cv.width,cv.height);c.filter='none';
  if(key==='act4Sea'){const horizon=cv.height*.46,sea=c.createLinearGradient(0,horizon,0,cv.height);sea.addColorStop(0,'#92aeb9');sea.addColorStop(.35,'#6c8c9f');sea.addColorStop(1,'#3d6078');c.fillStyle=sea;c.fillRect(0,horizon,cv.width,cv.height-horizon);c.fillStyle='#b6c7c23d';for(const [x,y,w]of [[.02,.64,.28],[.44,.69,.38],[.13,.79,.42],[.64,.85,.3]]){c.beginPath();c.moveTo(cv.width*x,cv.height*y);c.quadraticCurveTo(cv.width*(x+w*.5),cv.height*(y-.004),cv.width*(x+w),cv.height*y);c.lineTo(cv.width*(x+w*.72),cv.height*(y+.004));c.closePath();c.fill();}}
  if(mood==='blue-sea-mist-day-v1'){
   const pixels=c.getImageData(0,0,cv.width,cv.height),p=pixels.data,low=[48,76,96],high=[173,192,201];
   for(let i=0;i<p.length;i+=4){const y=p[i]*.2126+p[i+1]*.7152+p[i+2]*.0722,t=Math.pow(y/255,.72);for(let j=0;j<3;j++)p[i+j]=Math.round(low[j]+(high[j]-low[j])*t+(p[i+j]-y)*.10);}
   c.putImageData(pixels,0,0);c.fillStyle='#a4bac629';c.fillRect(0,0,cv.width,cv.height);
  }else if(overcast){
   // Preserve the source's irregular cloud/forest/mist separations. The daylight
   // town source has no moon; no opaque upper-sky wash erases its cloud detail.
   const pixels=c.getImageData(0,0,cv.width,cv.height),p=pixels.data,low=[77,79,76],high=[205,200,186];
   for(let i=0;i<p.length;i+=4){const y=p[i]*.2126+p[i+1]*.7152+p[i+2]*.0722,t=Math.pow(y/255,.72);for(let j=0;j<3;j++)p[i+j]=Math.round(low[j]+(high[j]-low[j])*t+(p[i+j]-y)*.16);}
   c.putImageData(pixels,0,0);
  }else {c.fillStyle=dark||interior?'#152a3b44':'#263c4524';c.fillRect(0,0,cv.width,cv.height);}
  item.canvas=cv;image.onload=null;image.onerror=null;item.image=null;
 };
 item.image.src=src;return item;
}
