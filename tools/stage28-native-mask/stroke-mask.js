(f)=>{
 const {z,rs,edgePixels,edgeInk,color}=f;
 const px=512,gutter=2,size=px/rs,dpr=f.dpr;
 const [pw,ph]=f.backing,{w,h}=f.css;
 const tx=dpr*(w/2-z*f.actual.x),ty=dpr*(h/2-z*f.actual.y),m=z*dpr,v=f.viewport;
 const dest=document.createElement('canvas');dest.width=pw;dest.height=ph;
 const c=dest.getContext('2d');c.setTransform(m,0,0,m,tx,ty);
 const {a,z:b}=f.segment;
 for(let y=Math.floor(Math.max(v.top,f.domain.top)/size);y<=Math.floor(Math.min(v.bottom,f.domain.bottom)/size);y++){
  for(let x=Math.floor(Math.max(v.left,f.domain.left)/size);x<=Math.floor(Math.min(v.right,f.domain.right)/size);x++){
   const left=x*size,top=y*size,cv=document.createElement('canvas');
   cv.width=cv.height=px+gutter*2;
   const cc=cv.getContext('2d',{alpha:true});cc.setTransform(rs,0,0,rs,gutter-left*rs,gutter-top*rs);
   cc.lineJoin='round';cc.lineCap='butt';cc.strokeStyle=edgeInk;cc.lineWidth=edgePixels/Math.max(.05,rs);
   const path=new Path2D();path.moveTo(a.x,a.y);path.lineTo(b.x,b.y);cc.stroke(path);
   const sx=Math.round(left*m+tx), sy=Math.round(top*m+ty),ex=Math.round((left+size)*m+tx),ey=Math.round((top+size)*m+ty);
   c.save();c.beginPath();c.rect((sx-tx)/m,(sy-ty)/m,(ex-sx)/m,(ey-sy)/m);c.clip();
   c.drawImage(cv,0,0,px+gutter*2,px+gutter*2,left-gutter/rs,top-gutter/rs,size+gutter*2/rs,size+gutter*2/rs);c.restore();
  }
 }
 const data=c.getImageData(0,0,pw,ph).data,spans=[];
 for(let y=0;y<ph;y++){
  const alpha=[];for(let x=0;x<pw;x++)alpha.push(data[(y*pw+x)*4+3]);
  if(alpha.some(Boolean))spans.push({y,alpha});
 }
 // No baseline nor candidate display pixel, bbox or expected row was supplied.
 return{pw,ph,rs,dpr,widthWu:edgePixels/rs,edgeInk,projectedY:a.y*m+ty,segment:f.segment,spans};
}
