/* Factory body inserted beside exact pinned class method clone in isolated browser only. */
function makeNeutralProbe(spec){
 const scene=HonroApp.scene, proto=HonroScene.prototype, stock=proto._drawTerrainDomainTiles;
 if(scene._drawTerrainDomainTiles!==stock||Object.hasOwn(scene,'_drawTerrainDomainTiles')||Function.prototype.toString.call(stock)!==spec.stock)throw Error('native method mismatch');
 const rows=[], saved=new Map();
 let opened=0;
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const dom=(cv)=>cv instanceof HTMLCanvasElement&&cv.width===516&&cv.height===516;
 function attrs(c){
  const a=c.getContextAttributes?.();
  if(!a||a.alpha!==true||a.colorSpace!=='srgb'||a.colorType&&a.colorType!=='unorm8')throw Error('unsupported DOM src-over canvas backing');
  return {alpha:a.alpha,colorSpace:a.colorSpace,colorType:a.colorType??null,desynchronized:a.desynchronized??null,willReadFrequently:a.willReadFrequently??null};
 }
 function scratch(owner,ctx){
  const cv=owner._makeLayerCanvas(516,516);
  if(!dom(cv)||cv===ctx.canvas)throw Error('not genuine scratch DOM canvas');
  const c=cv.getContext('2d',{alpha:true});
  if(!equal(attrs(c),attrs(ctx)))throw Error('DOM backing differs');
  return c;
 }
 function blit(out,input,r){
  out.save();out.setTransform(1,0,0,1,0,0);
  out.globalAlpha=1;out.globalCompositeOperation='source-over';out.imageSmoothingEnabled=false;
  out.filter='none';out.shadowColor='transparent';
  out.clearRect(...r);out.drawImage(input,...r,...r);out.restore();
 }
 const qa={
  open(owner,b,cc,landmarks,view,rs,id) {
   if(owner!==scene||b!==HonroApp.engine.b||!owner._staticCacheBuild||b.honroStage!==7||b.honroCanonical!==true||b.honroCustom!==false||b.honroMapOrigin!=='campaign')throw Error('wrong stage/cold tile owner');
   if(id!==spec.tile) return null;
   if(opened++)throw Error('target tile cold-built twice');
   const [l,t,r,d]=spec.rect, k=3.13,m=cc.getTransform();
   if(!dom(cc.canvas)||m.a!==rs||m.d!==rs||m.b!==0||m.c!==0||m.e!==2-view.left*rs||m.f!==2-view.top*rs
     ||cc.globalAlpha!==1||cc.globalCompositeOperation!=='source-over'||![.25,.0625].includes(rs))throw Error('unexpected native tile state');
   const sites=landmarks.filter(q=>q.id==='site-body-7'&&q.asset?.id==='act1-site:7:body');
   if(sites.length!==1||sites[0].layer!=='structural-back'||sites[0].x!==0||sites[0].y!==0||sites[0].scale!==k||
     JSON.stringify(sites[0].asset.vector.root.children[16].transform)!=='[1,0,0,20,0,-19912]'||sites[0].asset.vector.root.children.length!==17)throw Error('wrong exact live BODY owner');
   // Cells fully inside a narrow predeclared region, with generous margins from actual signed boundaries.
   const x=Math.ceil(l*k*rs+m.e),y=Math.ceil(t*k*rs+m.f),X=Math.floor(r*k*rs+m.e),Y=Math.floor(d*k*rs+m.f);
   if(x<4||y<4||X>512||Y>512||X-x<3||Y-y<3)throw Error('target interior cannot be isolated');
   const s=scratch(owner,cc);
   // Capture the *existing current back* without reading its pixels to CPU.
   blit(s,cc.canvas,[0,0,516,516]);
   return {owner,cc,s,landmarks,id,rs,rect:[x,y,X-x,Y-y],matrix:[m.a,m.b,m.c,m.d,m.e,m.f],attr:attrs(cc)};
  },
  close(w){
   if(!w)return;
   const {owner,cc,s,landmarks,rect,id,rs,matrix,attr}=w;
   // Take exact canvas-to-canvas witnesses; encode only after the genuine game frames were read.
   const prior=scratch(owner,cc),after=scratch(owner,cc);
   blit(prior,cc.canvas,[0,0,516,516]);
   s.setTransform(...matrix);owner._landmarkLayer(s,landmarks,'structural-back');
   blit(cc,s.canvas,rect);
   blit(after,cc.canvas,[0,0,516,516]);
   rows.push({id,rs,rect,matrix,attr,role:'after structural-back before original terrain/surface; original and scratch same stock'});
   saved.set(id,{stockBefore:prior.canvas,scratch:s.canvas,stockAfter:after.canvas,live:cc.canvas});
  },
  install(clone){Object.defineProperty(scene,'_drawTerrainDomainTiles',{value:clone,writable:true,configurable:true});},
  health(){return {opened, rows:structuredClone(rows)};},
  snapshots(){
   if(opened!==1||saved.size!==1||rows.length!==1)throw Error('scope did not exercise exact one native cold tile');
   const vals=saved.get(spec.tile);
   if(scene._domainTiles?.tiles.get(spec.tile)?.canvas!==vals.live)throw Error('selected actual native warm tile lost');
   return Object.fromEntries(Object.entries(vals).filter(([k])=>k!=='live').map(([k,v])=>[k,v.toDataURL('image/png').split(',')[1]]));
  },
  restore(){
   if(!delete scene._drawTerrainDomainTiles||scene._drawTerrainDomainTiles!==stock)throw Error('native teardown failed');
   rows.length=0;saved.clear();return true;
  }
 };return qa;
}
