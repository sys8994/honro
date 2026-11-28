// The bank tiles include the two receiving decks, gravel shelf and contact
// shadows. Their transparent river opens onto two independently moving surfaces.
const asset=(name,folder='yeonmok')=>new URL('../assets/terrain/'+folder+'/'+name,import.meta.url).href;
export function fieldLandscape(canvas,map,field){
  const {width,height,tile,density:d}=field;
  if(field.revision!==map.meta.revision||width!==map.width*map.tileWidth||height!==map.height*map.tileHeight)
    throw Error('연목 지형 베이크와 지도 판본이 다릅니다.');
  const box=document.createElement('div'),plane=document.createElement('div'),river=document.createElement('div');
  box.className='tv-ground';box.setAttribute('aria-hidden','true');plane.className='tv-ground-map';
  box.append(plane);canvas.before(box);plane.style.width=width*d+'px';plane.style.height=height*d+'px';
  const wet=map.river.flat(2).map(p=>p[0]),x0=Math.max(0,Math.floor(Math.min(...wet))-2),x1=Math.min(width,Math.ceil(Math.max(...wet))+2);
  river.className='tv-current';Object.assign(river.style,{left:x0*d+'px',width:(x1-x0)*d+'px'});plane.append(river);
  for(const [name,sizeX,sizeY] of [['current',240,172],['ripples',155,102]]){
    const sheet=document.createElement('div');
    sheet.className='tv-water-'+name;sheet.style.backgroundImage='url('+asset(name+'.webp')+')';
    sheet.style.setProperty('--tile-x',sizeX*d+'px');sheet.style.setProperty('--tile-y',sizeY*d+'px');river.append(sheet);
  }
  const tiles=[];
  for(let y=0;y<height;y+=tile)for(let x=0;x<width;x+=tile){
    const el=document.createElement('div'),w=Math.min(tile,width-x),h=Math.min(tile,height-y);
    el.className='tv-bank-tile';
    Object.assign(el.style,{left:x*d+'px',top:y*d+'px',width:w*d+'px',height:h*d+'px',
      backgroundImage:'url('+asset('preview.webp',field.folder)+')',backgroundSize:width*d+'px '+height*d+'px',backgroundPosition:-x*d+'px '+-y*d+'px'});
    plane.append(el);tiles.push({el,x,y,w,h,url:asset('bank-'+x/tile+'-'+y/tile+'.webp',field.folder)});
  }
  // Base saturation was baked at the chapter's opening daylight. Native
  // clock multiplication colours land, river and actors in one compositor layer.
  const tint=document.createElement('div');tint.className='tv-light';canvas.after(tint);
  let lastTint='',lastPose='';
  function grade(g){
    const tintColor=g?'rgba('+g.mul[0].map(Math.round).join(',')+','+g.mul[1].toFixed(3)+')':'transparent';
    if(tintColor===lastTint)return;tint.style.backgroundColor=tintColor;lastTint=tintColor;
  }
  function place(cx,cy,k,w,h){
    const x=w/2-cx*k,y=h/2-cy*k,pose=[x,y,k,w,h].join('|');if(pose===lastPose)return;lastPose=pose;
    plane.style.transform='matrix('+[k/d,0,0,k/d,x,y].join(',')+')';
    const halfW=w/(2*k)+60,halfH=h/(2*k)+60;
    for(const t of tiles){
      if(t.requested||t.x>cx+halfW||t.x+t.w<cx-halfW||t.y>cy+halfH||t.y+t.h<cy-halfH)continue;
      t.requested=true;const image=new Image();image.src=t.url;
      image.decode().then(()=>{
        t.el.style.backgroundImage='url('+t.url+')';t.el.style.backgroundSize='100% 100%';t.el.style.backgroundPosition='0 0';
      }).catch(()=>{t.requested=false;});
    }
  }
  return {place,grade};
}
