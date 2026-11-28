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
export function buildGround(map,sourceFor){
  const w=map.width*map.tileWidth,h=map.height*map.tileHeight,base=canvas(w,h),c=base.getContext('2d');
  const noise=random(129045),grid=map.grid,materials={};
  for(const name of ['grass','dirt','rock','path','gravel','water'])materials[name]=surface(c,sourceFor(name),name==='water'?.92:.77);
  c.fillStyle=materials.grass;c.fillRect(0,0,w,h);
  // Adjacent diamonds of the same material are masked and feathered together.
  for(const id of ['dirt','rock','path']){
    const raw=canvas(w,h),mask=raw.getContext('2d');mask.fillStyle='#fff';
    grid.materials.forEach((v,i)=>{
      if(v!==id)return;const row=Math.floor(i/grid.width),col=i%grid.width;
      const x=(col+.5+.5*(row%2))*grid.tileWidth-grid.offsetX,y=(row+1)*grid.tileHeight/2-grid.offsetY;
      const a=grid.tileWidth/2+.7,b=grid.tileHeight/2+.4;
      mask.fill(line([[x-a,y],[x,y-b],[x+a,y],[x,y+b]],true));
    });
    const layer=canvas(w,h),g=layer.getContext('2d');g.filter='blur(6px)';g.drawImage(raw,0,0);g.filter='none';g.globalCompositeOperation='source-in';g.fillStyle=materials[id];g.fillRect(0,0,w,h);
    c.globalAlpha=id==='path'?.53:.83;c.drawImage(layer,0,0);c.globalAlpha=1;
  }
  c.lineCap='round';c.lineJoin='round';
  for(const trail of map.trails){
    const p=line(trail.points);c.save();c.strokeStyle='#665844';c.globalAlpha=.45;c.filter='blur(6px)';c.lineWidth=trail.width+10;c.stroke(p);c.restore();
    c.save();c.strokeStyle=materials.path;c.filter='blur(1.4px)';c.lineWidth=trail.width;c.stroke(p);c.restore();
    c.strokeStyle='#b0a0841e';c.lineWidth=trail.width*.63;c.stroke(p);
  }
  const shore=riverPath(map.river);
  // Blend the gravel bed into dry ground and the deep current into shallows.
  // A blurred alpha ramp replaces painted contour bands at the waterline.
  const bed=canvas(w,h),bc=bed.getContext('2d');bc.filter='blur(6px)';bc.fillStyle='#fff';bc.fill(shore,'evenodd');bc.strokeStyle='#fff';bc.lineWidth=12;bc.stroke(shore);bc.filter='none';
  bc.globalCompositeOperation='source-in';bc.fillStyle=materials.gravel;bc.fillRect(0,0,w,h);c.drawImage(bed,0,0);
  c.save();c.clip(shore,'evenodd');c.fillStyle='#526e6575';c.fillRect(0,0,w,h);
  const deep=canvas(w,h),dc=deep.getContext('2d');dc.fillStyle=materials.water;dc.fillRect(0,0,w,h);dc.fillStyle='#193f4342';dc.fillRect(0,0,w,h);
  dc.globalCompositeOperation='destination-out';dc.filter='blur(8px)';dc.strokeStyle='#fff';dc.lineJoin='round';dc.lineWidth=26;dc.stroke(shore);c.drawImage(deep,0,0);
  c.globalAlpha=1;c.lineCap='round';
  for(let i=0;i<3900;i++){
    const x=noise()*w,y=noise()*h;if(!c.isPointInPath(shore,x,y,'evenodd'))continue;
    const length=3+noise()*15;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+length*.35,y-2,x+length,y-1.6-noise()*1.5);
    c.strokeStyle=noise()>.4?'#adc4b345':'#0e353f80';c.lineWidth=.6+noise()*.6;c.stroke();
  }
  c.restore();
  // Small shoreline cobbles sit on the dry side. Their size follows the water,
  // and the two timber decks cover the continuing stream at the crossings.
  for(const region of map.river)for(const ring of region)for(let i=0;i<ring.length;i++){
    const p=ring[i],q=ring[(i+1)%ring.length],len=Math.hypot(q[0]-p[0],q[1]-p[1]);
    if(len<4||len>105)continue;
    for(let j=noise()*10;j<len;j+=9+noise()*12){
      const t=j/len,x=p[0]+(q[0]-p[0])*t+(noise()-.5)*16,y=p[1]+(q[1]-p[1])*t+(noise()-.5)*9;
      const wet=c.isPointInPath(shore,x,y,'evenodd');const size=.7+noise()*2.9;
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

export function bakePropShadows(ground,props,images,projection){
  const c=ground.getContext('2d'),masks=new Map();
  for(const o of props){
    if(o.deck)continue;
    const im=images.get(o.asset);if(!masks.has(o.asset)){
      const mask=canvas(im.width,im.height),g=mask.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#121e21';g.fillRect(0,0,im.width,im.height);masks.set(o.asset,mask);
    }
    const at=projection.forward(o.x,o.y),tree=o.asset.startsWith('pine'),roof=o.asset==='shrine';
    c.save();c.translate(at.x,at.y);c.globalAlpha=tree?.54:roof?.48:.37;
    c.transform(.65,.08,-.59,-.25,0,0);c.drawImage(masks.get(o.asset),-o.width*o.anchor[0],-o.height*o.anchor[1],o.width,o.height);c.restore();
    c.save();c.translate(at.x,at.y);c.scale(1,.46);const radius=tree?o.width*.19:o.width*.32;
    const dark=c.createRadialGradient(0,0,0,0,0,radius);dark.addColorStop(0,'#0a151b8c');dark.addColorStop(1,'#0a151b00');c.fillStyle=dark;c.fillRect(-radius,-radius,radius*2,radius*2);c.restore();
  }
}
