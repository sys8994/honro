// Baked from the same projected escarpments used by movement. Lower trees are
// smaller only inside inaccessible ravines, where they depict the far valley floor.
export function paintRelief(ground,map,images,density){
  const c=ground.getContext('2d'),stage=map.meta.stage;
  let seed=stage*911;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const loop=points=>{const p=new Path2D();points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;};
  const stroke=(points,color,width)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();};
  c.save();c.setTransform(density,0,0,density,0,0);
  for(const ring of map.cliffs){
    const edge=loop(ring),xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    const depth=Math.min(54,(y1-y0)*.28);
    c.save();c.clip(edge);const fog=c.createLinearGradient(0,y0,0,y1);
    fog.addColorStop(0,'#354b4b');fog.addColorStop(.53,'#61726a');fog.addColorStop(1,'#3f504b');
    c.fillStyle=fog;c.fillRect(x0,y0,x1-x0,y1-y0);
    // Crop without distorting the distant conifers. The same negative space and
    // contour that stop a walking unit clip the unplayable lower valley.
    const plate=images.get('valley-depth'),ww=x1-x0,hh=y1-y0;
    const scale=Math.max(ww/plate.width,hh/plate.height,.38),sw=ww/scale,sh=hh/scale;
    const left=rand()*(plate.width-sw),top=(.22+rand()*.52)*(plate.height-sh);
    c.drawImage(plate,left,top,sw,sh,x0,y0,ww,hh);
    const haze=c.createLinearGradient(0,y0,0,y1);
    haze.addColorStop(0,'rgba(24,44,42,.19)');haze.addColorStop(.55,'rgba(48,73,69,.10)');haze.addColorStop(1,'rgba(33,53,49,.29)');
    c.fillStyle=haze;c.fillRect(x0,y0,ww,hh);
    // Shallow overhang and tall, lit fractured rock are at the back of the hollow.
    const pattern=c.createPattern(plate,'repeat');
    pattern.setTransform(new DOMMatrix([.36,.03,-.06,.51,x0-90,y0-120]));
    const facets=[];
    for(let i=0;i<ring.length;i++){
      const [x,y]=ring[i],[z,w]=ring[(i+1)%ring.length],mid=(y+w)*.5;
      const h=depth*(.85+.15*Math.sin((x+z)*.01)),dx=8+4*Math.sin(x*.037);
      facets.push({mid,poly:[[x,y],[z,w],[z+dx,w+h],[x+dx,y+h]],x,y,z,w,h,dx});
    }
    facets.sort((a,b)=>a.mid-b.mid);
    for(const q of facets){
      const p=loop(q.poly);c.fillStyle=pattern;c.fill(p);
      const shade=c.createLinearGradient(0,q.mid-3,0,q.mid+q.h);
      shade.addColorStop(0,'rgba(68,71,55,.08)');shade.addColorStop(.7,'rgba(30,41,36,.24)');shade.addColorStop(1,'rgba(29,44,41,.42)');
      c.fillStyle=shade;c.fill(p);const col=(q.z-q.x)*.16+(q.w-q.y)*.54;
      c.fillStyle=col>0?'rgba(40,43,39,.20)':'rgba(179,177,150,.12)';c.fill(p);
      if(rand()<.19)stroke([[q.x+2,q.y+4],[q.x+q.dx*.53,q.y+q.h*.44],[q.x+q.dx+3,q.y+q.h*.79]],'#23302d63',1+rand()*1.8);
      if(rand()<.41)stroke([[q.x,q.y+2],[q.z,q.w+2]],'#98977c72',1.2+rand()*2);
    }
    c.restore();
  }
  // Plank rows end exactly at the walk mask. A snapped end has open space
  // beyond its splinters, while the ferry's intact loading deck has a sill.
  for(const deck of map.decks||[]){
    const [x,y]=deck.start,[z,w]=deck.end,len=Math.hypot(z-x,w-y);
    const tx=(z-x)/len,ty=(w-y)/len,nx=-ty,ny=tx,half=deck.width/2;
    const at=(d,l,down=0)=>[x+tx*d+nx*l,y+ty*d+ny*l+down];
    const span=(a,b,far,near,color)=>{const face=loop([a,b,far,near]);c.fillStyle=color;c.fill(face);};
    span(at(3,-half,9),at(len,-half,9),at(len,half,12),at(3,half,12),'#1e2a26a6');
    for(const side of [-1,1]){
      const l=side*(half-2);span(at(0,l),at(len,l),at(len,l,7),at(0,l,7),'#3e3930');
      for(let d=20;d<len-9;d+=69){
        stroke([at(d,l,5),at(d,l,24)],'#393930',6);
        stroke([at(d,l,6),at(d+16,l,19)],'#51483a',3);
      }
    }
    const timber=images.get('deck-grain'),boards=Math.ceil(len/8.2);
    if(deck.broken){
      const sill=images.get('broken_sill');
      c.save();c.translate(z,w+4);c.rotate(Math.atan2(ty,tx));
      if(tx<0)c.scale(1,-1);
      c.drawImage(sill,-37,-half*.82,55,half*1.64);c.restore();
    }
    for(let i=0;i<boards;i++){
      const a=i*len/boards,b=(i+1)*len/boards-.5;
      const split=deck.broken&&i===boards-1?2+rand()*3:0;
      span(at(a,-half),at(b-split,-half),at(b,half),at(a,half),['#776c54','#706650','#85775d','#7a7059'][Math.floor(rand()*4)]);
      // Grain follows each individual plank, across the walking direction.
      c.save();c.clip(loop([at(a,-half),at(b-split,-half),at(b,half),at(a,half)]));
      c.transform(nx,ny,tx,ty,x,y);c.globalAlpha=.88;
      const sw=timber.width*(.55+rand()*.4),sh=timber.height*.07;
      c.drawImage(timber,rand()*(timber.width-sw),rand()*(timber.height-sh),sw,sh,-half,a,half*2,b-a);
      c.restore();
      stroke([at(a,-half+1),at(a,half-1)],'#a5997957',.67);
      for(const edge of [-1,1]){const nail=at((a+b)*.5,edge*(half-4));c.fillStyle='#262c27bd';c.fillRect(nail[0],nail[1],1.4,1.1);}
    }
    for(let d=10;d<len-12;d+=65){const l=-half+2;
      stroke([at(d,l),at(d,l,-12)],'#4b4638',4);
      stroke([at(d,l,-10),at(Math.min(d+65,len-9),l,-10)],'#898064',2);}
  }
  for(const steps of map.stairs){
    for(let j=1;j<steps.length;j++){
      const [x,y]=steps[j-1],[z,w]=steps[j],dx=z-x,dy=w-y,len=Math.hypot(dx,dy),n=Math.floor(len/12),nx=-dy/len,ny=dx/len;
      for(let i=0;i<n;i++){
        const t=(i+.5)/n,px=x+dx*t,py=y+dy*t,half=14+2*Math.sin(i*.93);
        const a=[px+nx*half,py+ny*half],b=[px-nx*half,py-ny*half];
        stroke([a,b],'#323b32a8',3.8);stroke([[a[0],a[1]-1.8],[b[0],b[1]-1.8]],'#a9a78a99',1.9);
      }
    }
  }
  c.restore();
}
