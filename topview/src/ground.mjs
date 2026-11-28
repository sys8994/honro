// The bitmap is cached per map. Coordinates here are the same projected pixels
// used by Tiled's staggered diamond layer and by the bank/deck compiler.
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function line(points,close=false){
  const path=new Path2D();points.forEach(([x,y],i)=>i?path.lineTo(x,y):path.moveTo(x,y));if(close)path.closePath();return path;
}
export function riverPath(regions){
  const path=new Path2D();for(const rings of regions)for(const ring of rings)path.addPath(line(ring,true));return path;
}
function random(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
function surface(c,image,scale){
  const tile=canvas(image.width*2,image.height*2),g=tile.getContext('2d');
  for(const [sx,sy] of [[1,1],[-1,1],[1,-1],[-1,-1]]){
    g.setTransform(sx,0,0,sy,sx<0?tile.width:0,sy<0?tile.height:0);g.drawImage(image,0,0);
  }
  const p=c.createPattern(tile,'repeat');
  p.setTransform(new DOMMatrix([scale,scale*.5,-scale,scale*.5,0,0]));
  return p;
}
// A compacted trail breaks into grass at different distances on either side.
function trailMargin(points,width,noise){
  const sides=[[],[]];let distance=0;
  for(let i=1;i<points.length;i++){
    const [x,y]=points[i-1],[ex,ey]=points[i],dx=ex-x,dy=ey-y,len=Math.hypot(dx,dy);
    if(!len)continue;
    const steps=Math.max(1,Math.ceil(len/5));
    for(let j=0;j<steps+(i===points.length-1?1:0);j++){
      const t=j/steps,along=distance+len*t;
      for(const side of [0,1]){
        const sign=side?1:-1,offset=sign*(width*.48+2.1*Math.sin(along*.076+side*8)+1.15*Math.cos(along*.021+side)+noise()*2.6);
        sides[side].push([x+t*dx-dy/len*offset,y+t*dy+dx/len*offset]);
      }
    }
    distance+=len;
  }
  return line([...sides[0],...sides[1].reverse()],true);
}
export function buildGround(map,sourceFor,density){
  const w=map.width*map.tileWidth,h=map.height*map.tileHeight,base=canvas(w*density,h*density);
  function paint(layer){const g=layer.getContext('2d');g.scale(density,density);return g;}
  const c=paint(base);
  const noise=random(129045),grid=map.grid,materials={};
  for(const name of ['grass','dirt','rock','path','gravel']){
    const image=sourceFor(name),scale=.77*(name==='dirt'||name==='rock'?1:320/image.width);
    materials[name]=surface(c,image,scale);
  }
  c.fillStyle=materials.grass;c.fillRect(0,0,w,h);
  // Adjacent diamonds of the same material are masked and feathered together.
  for(const id of ['dirt','rock']){
    const raw=canvas(w*density,h*density),mask=paint(raw);mask.fillStyle='#fff';
    grid.materials.forEach((v,i)=>{
      if(v!==id)return;const row=Math.floor(i/grid.width),col=i%grid.width;
      const x=(col+.5+.5*(row%2))*grid.tileWidth-grid.offsetX,y=(row+1)*grid.tileHeight/2-grid.offsetY;
      const a=grid.tileWidth/2+.7,b=grid.tileHeight/2+.4;
      mask.fill(line([[x-a,y],[x,y-b],[x+a,y],[x,y+b]],true));
    });
    const layer=canvas(w*density,h*density),g=paint(layer);g.filter='blur('+6*density+'px)';g.drawImage(raw,0,0,w,h);g.filter='none';g.globalCompositeOperation='source-in';g.fillStyle=materials[id];g.fillRect(0,0,w,h);
    c.globalAlpha=id==='dirt'?.23:.55;c.drawImage(layer,0,0,w,h);c.globalAlpha=1;raw.width=layer.width=0;
  }
  c.lineCap='round';c.lineJoin='round';
  for(const trail of map.trails){
    const p=line(trail.points),width=trail.width;
    const edge=trailMargin(trail.points,width,noise);
    c.save();c.fillStyle=materials.path;c.globalAlpha=.55;c.filter='blur('+3*density+'px)';c.fill(edge);c.restore();
    c.save();c.fillStyle=materials.path;c.globalAlpha=.78;c.fill(edge);c.restore();
    c.save();c.strokeStyle='#bca38332';c.lineWidth=width*.68;c.filter='blur('+2*density+'px)';c.stroke(p);c.restore();
    // Wheel wear and grit follow the centreline. Branches under 30px are foot trails.
    for(let i=1;i<trail.points.length;i++){
      const [x,y]=trail.points[i-1],[x2,y2]=trail.points[i],dx=x2-x,dy=y2-y,len=Math.hypot(dx,dy);
      if(!len)continue;
      for(let d=noise()*2;d<len;d+=2+noise()*3){
        const t=d/len,side=noise()<.5?-1:1,offset=side*width*(.17+noise()*.07);
        const px=x+t*dx-offset*dy/len,py=y+t*dy+offset*dx/len;
        c.strokeStyle=width>=30?'#443e2d79':'#c0ae841c';c.lineWidth=.65+noise()*.65;
        c.beginPath();c.moveTo(px,py);c.lineTo(px+dx/len*(2+noise()*5),py+dy/len*(2+noise()*5));c.stroke();
        const edge=side*width*(.42+noise()*.14);
        c.fillStyle=noise()<.50?'#71755781':'#92856d81';
        c.fillRect(x+t*dx-edge*dy/len,y+t*dy+edge*dx/len,1.2+noise()*2,.8);
      }
    }
  }
  const shore=riverPath(map.river);
  // Blend the gravel bed into dry ground and the deep current into shallows.
  // A blurred alpha ramp replaces painted contour bands at the waterline.
  c.save();c.filter='blur('+5*density+'px)';c.fillStyle=materials.gravel;
  c.fill(shore,'evenodd');c.strokeStyle=materials.gravel;c.lineWidth=11;c.stroke(shore);c.restore();
  // The live current is behind this transparent opening. A feathered shelf
  // leaves gravel showing through the shallow water on both banks.
  c.save();c.globalCompositeOperation='destination-out';c.clip(shore,'evenodd');
  c.fillStyle='#000';c.filter='blur('+4*density+'px)';c.fill(shore,'evenodd');c.restore();
  c.save();c.clip(shore,'evenodd');c.filter='blur('+4*density+'px)';
  c.strokeStyle=materials.gravel;c.lineWidth=9;c.globalAlpha=.72;c.stroke(shore);c.restore();
  // Small shoreline cobbles sit on the dry side. Their size follows the water,
  // and the stone and timber decks cover the continuing stream at the crossings.
  for(const region of map.river)for(const ring of region)for(let i=0;i<ring.length;i++){
    const p=ring[i],q=ring[(i+1)%ring.length],len=Math.hypot(q[0]-p[0],q[1]-p[1]);
    if(len<4||len>105)continue;
    for(let j=noise()*10;j<len;j+=9+noise()*12){
      const t=j/len,x=p[0]+(q[0]-p[0])*t+(noise()-.5)*16,y=p[1]+(q[1]-p[1])*t+(noise()-.5)*9;
      const wet=c.isPointInPath(shore,x*density,y*density,'evenodd');const size=.7+noise()*2.9;
      if(noise()>.55){
        c.fillStyle=wet?'#213c3955':'#1e2b2599';c.beginPath();c.ellipse(x+.7,y+.7,size*1.4,size*.57,-.26,0,Math.PI*2);c.fill();
        c.fillStyle=wet?'#71878380':'#777b66aa';c.fill(line([[x-size,y],[x-.3*size,y-size*.55],[x+.7*size,y-size*.35],[x+size,y+.2*size],[x,y+size*.37]],true));
      }else if(!wet&&Math.sin(x*.051+y*.029)>.12){
        for(let k=0;k<4;k++){
          const dx=(noise()-.5)*8,dy=2+noise()*5;c.strokeStyle=k%2?'#687452a8':'#3d4e3cbd';c.lineWidth=.7+noise()*.45;
          c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+dx*.28,y-dy*.7,x+dx,y-dy);c.stroke();
        }
      }
    }
  }
  return base;
}

// Offline contact and cast shadows. Low piers cast along the span, while
// upright silhouettes project from the registered foot towards the southeast.
export function bakePropShadows(ground,props,images,projection,density){
  const c=ground.getContext('2d'),masks=new Map();c.setTransform(density,0,0,density,0,0);
  function ink(id){
    if(masks.has(id))return masks.get(id);
    const im=images.get(id),mask=canvas(im.width,im.height),g=mask.getContext('2d');
    g.drawImage(im,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#0d191c';g.fillRect(0,0,im.width,im.height);
    masks.set(id,mask);return mask;
  }
  function contact(x,y,rx,ry,alpha){
    c.save();c.translate(x,y);c.scale(rx,ry);
    const shade=c.createRadialGradient(0,0,0,0,0,1);shade.addColorStop(0,'rgba(6,14,16,'+alpha+')');
    shade.addColorStop(.52,'rgba(9,17,19,'+alpha*.67+')');shade.addColorStop(1,'rgba(9,17,19,0)');
    c.fillStyle=shade;c.fillRect(-1,-1,2,2);c.restore();
  }
  for(const o of props){
    const at=projection.forward(o.x,o.y),tree=o.asset.startsWith('pine'),roof=o.asset==='shrine'||o.asset==='ruin_gate';
    const pic=ink(o.asset),left=-o.width*o.anchor[0],top=-o.height*o.anchor[1];
    c.save();c.translate(at.x,at.y);
    if(o.deck){
      c.globalAlpha=.69;c.translate(11,10);c.drawImage(pic,left,top,o.width,o.height);
    }else{
      c.globalAlpha=tree?.71:roof?.72:.63;
      c.transform(.86,.035,-.49,-.25,0,0);c.drawImage(pic,left,top,o.width,o.height);
    }
    c.restore();
    if(o.deck){
      const [a,b]=o.deck.points;for(const t of [0,.5,1])contact(a[0]+(b[0]-a[0])*t+7,a[1]+(b[1]-a[1])*t+12,25,8,.84);
    }else contact(at.x,at.y,Math.max(5,o.width*(tree?.14:.35)),Math.max(2,o.width*(tree?.073:.14)),.86);
  }
  for(const o of props.filter(o=>o.deck)){
    const at=projection.forward(o.x,o.y);
    c.drawImage(images.get(o.asset),at.x-o.width*o.anchor[0],at.y-o.height*o.anchor[1],o.width,o.height);
  }
}
