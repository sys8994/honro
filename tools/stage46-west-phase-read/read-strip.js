({law,pose})=>{
 const a=HonroApp, s=a.scene, b=a.engine.b, rows=[], rejects=[];
 if(b.honroStage!==46||b.honroCanonical!==true||b.honroCustom!==false||b.honroMapOrigin!=="campaign"||b.honroAuthoredId!=="stage-46")
  throw Error("Wrong canonical Stage 46");
 const l=HonroTerrainDomain.materialLandmarks(b).filter(i=>i.asset?.id==="act5:near:46");
 if(l.length!==1||l[0].x!==0||l[0].y!==0||l[0].scale!==4||l[0].rotation!==0||
    l[0].asset.shaftExterior?.id!=="act5:stage46:exterior-body"||l[0].asset.shaftExteriorParts?.length!==5)
  throw Error("Exact stage body placement not found");
 if(window.__honroStage46PhaseReader!==undefined)throw Error("Unexpected prior observer");
 const names=["part0","part1","parts","mask","after_mask","body_out","tree_out","protected_out","interior_out"];
 const [X,Y,W,H]=pose.strip, {left,top}=pose.viewport,z=pose.actual.scale,
       geom=[4*z,0,0,4*z,-left*z,-top*z], [w,h]=pose.backing;
 const near=(u,v)=>Number.isFinite(u)&&Math.abs(u-v)<.1;
 const pixels=(ctx,x=X,y=Y)=>{
  const a=ctx.getImageData(x,y,W,H).data;
  return btoa(String.fromCharCode(...a));
 };
 window.__honroStage46PhaseReader=(k,c,m,dx,dy,tw,th)=>{
  const q=[m.a,m.b,m.c,m.d,m.e,m.f], small=names.indexOf(k)<5;
  if(!q.every((v,i)=>near(v,geom[i]))||dx!==0||dy!==0||tw!==(small?1024:w)||th!==h||
     c.canvas.width!==(small?1024:w)||c.canvas.height!==h){
   if(rejects.length<16)rejects.push({k,q,rect:[dx,dy,tw,th],dims:[c.canvas.width,c.canvas.height]});
   return;
  }
  if(k==="part0")rows.push([]);
  const current=rows.at(-1);
  if(!current||k!==names[current.length])throw Error("Missing/out-of-order native phase "+k);
  current.push({name:k,rgbaBase64:pixels(c,X-dx,Y-dy),transform:q,chunk:[dx,dy,tw,th]});
 };
 let out;
 try{out=law()}finally{delete window.__honroStage46PhaseReader;}
 if(rows.length<1||rows.length>2||rows.some(x=>x.length!==names.length))
  throw Error("Native body pass not bound to exact screen route: "+JSON.stringify({counts:rows.map(x=>x.length),rejects}));
 // This 8×32 strip comes from the live App canvas, not a screenshot or an overlay.
 return{meta:out.meta,reads:rows.at(-1),completePasses:rows.length,ignoredNonDisplayCalls:rejects,
        finalRGBA:pixels(s.canvas.getContext("2d")),compiledBodyID:l[0].asset.shaftExterior.id};
}
