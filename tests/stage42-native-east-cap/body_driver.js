({actual,kind})=>{
 const p=kind==='candidate'?HonroWorkshopAPI.getProject():window.__eastStockBeforeOpen;
 const s=p.stages.find(s=>s.id==='stage-42'),a=p.library.find(a=>a.id==='act5:near:42'),place=s.elements.find(e=>e.assetId===a.id);
 if(a.edgeWall.id!=='act5:stage42:registered-body'||place.id!=='a5-near'||place.x!==0||place.y!==0||place.scale!==3.2146389713155292||place.rotation!==0)throw Error('Non-native BODY placement');
 const [x,y,z]=actual,cv=document.createElement('canvas');cv.width=1280;cv.height=800;
 const ctx=cv.getContext('2d',{alpha:true});ctx.setTransform(z,0,0,z,640-x*z,400-y*z);
 if(kind==='clip'){
  ctx.translate(place.x,place.y);ctx.scale(place.scale,place.scale);
  ctx.fill(new Path2D(a.edgeWall.vector.clips['native-source-alpha'].join(' ')),'nonzero');
 }else HonroVectorArt.draw(HonroVisualStyle.context(ctx,'L1'),a.edgeWall,{x:place.x,y:place.y,scale:place.scale});
 return cv.toDataURL('image/png');
}
