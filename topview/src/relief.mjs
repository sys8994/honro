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
    const depth=Math.min(95,(y1-y0)*.43);
    c.save();c.clip(edge);const fog=c.createLinearGradient(0,y0,0,y1);
    fog.addColorStop(0,'#354b4b');fog.addColorStop(.53,'#61726a');fog.addColorStop(1,'#3f504b');
    c.fillStyle=fog;c.fillRect(x0,y0,x1-x0,y1-y0);
    for(let band=0;band<3;band++){
      const y=y0+(y1-y0)*(.28+band*.23),pts=[];
      for(let x=x0-20;x<x1+26;x+=17)pts.push([x,y+13*Math.sin(x*.009+band*3.1)+7*Math.cos(x*.025+band)+rand()*4]);
      c.fillStyle=['#586961','#455851','#364b42'][band];c.fill(loop([...pts,[x1+30,y1],[x0-20,y1]]));
      c.globalAlpha=.36+band*.1;
      for(let i=0;i<pts.length;i+=2){const [x,y]=pts[i],h=(17+rand()*12)*(1+band*.32);c.drawImage(images.get(i%4?'pine_a':'pine_b'),x-h/2,y-h*.7,h,h*.85);}
      c.globalAlpha=1;
    }
    // Shallow overhang and tall, lit fractured rock are at the back of the hollow.
    const stone=images.get('rock'),pattern=c.createPattern(stone,'repeat');pattern.setTransform(new DOMMatrix([.51,.08,.025,.64,0,0]));
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
      shade.addColorStop(0,'rgba(86,95,80,.33)');shade.addColorStop(.72,'rgba(33,48,47,.39)');shade.addColorStop(1,'rgba(40,60,57,.73)');
      c.fillStyle=shade;c.fill(p);const col=(q.z-q.x)*.16+(q.w-q.y)*.54;
      c.fillStyle=col>0?'rgba(40,43,39,.20)':'rgba(179,177,150,.12)';c.fill(p);
      if(rand()<.56)stroke([[q.x+2,q.y+4],[q.x+q.dx*.53,q.y+q.h*.44],[q.x+q.dx+3,q.y+q.h*.79]],'#23302d63',1+rand()*1.8);
      if(rand()<.72)stroke([[q.x,q.y+2],[q.z,q.w+2]],'#98977c72',1.2+rand()*2);
    }
    c.restore();
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
