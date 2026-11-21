/* Factory body inserted beside exact pinned class method clone in isolated browser only. */
function makeNeutralProbe(spec){
 const scene=HonroApp.scene, proto=HonroScene.prototype, stock=proto._drawTerrainDomainTiles;
 if(scene._drawTerrainDomainTiles!==stock||Object.hasOwn(scene,'_drawTerrainDomainTiles')||Function.prototype.toString.call(stock)!==spec.stockOuter)throw Error('native outer method mismatch after verified preflight');
 const rows=[],saved=new Map(),opened=new Set(),targets=new Map(Object.entries(spec.targets));
 if(targets.size!==1||!['N','X'].includes(spec.mode))throw Error('bad exact single perimeter test');
 const registry=HONRO_PROJECT.library,registered=registry.filter(q=>q.id==='act1-site:7:body');
 if(registered.length!==1)throw Error('expected exactly one original BODY provider');
 const body=registered[0],stable=JSON.stringify(body);
 const immutableWitness=()=>HONRO_PROJECT.library===registry&&registry.filter(q=>q.id===body.id).length===1&&registry.find(q=>q.id===body.id)===body&&JSON.stringify(body)===stable;
 function drawListForScratch(list,pick){
  if(spec.mode==='N')return list;
  if(!immutableWitness()||JSON.stringify(pick.asset)!==stable)throw Error('active owner differs from pinned original provider');
  const asset=pick.asset,v=asset.vector,children=v.root.children;
  if(children.length!==17||children[16].clipPath!=='site-edge-2'||JSON.stringify(v.clips['site-edge-2'])!=='["M16 1049H1418V1068H16Z"]'
    ||JSON.stringify(children[16].children)!=='[{"tag":"use","symbol":"source"}]')throw Error('not the exact old-only child16 slot');
  const replacement={...asset,vector:{...v,root:{...v.root,children:[...children.slice(0,16),{tag:'g',children:[]}]}}};
  if(JSON.stringify(replacement.vector.root.children.slice(0,16))!==JSON.stringify(children.slice(0,16))
     ||replacement.vector.clips!==v.clips||replacement.vector.symbols!==v.symbols||HONRO_PROJECT.library.includes(replacement))throw Error('scratch isolation lost');
  return list.map(m=>m===pick?{...m,asset:replacement}:m);
 }
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
  open(owner,b,cc,landmarks,view,rs,id,screen) {
   if(owner!==scene||b!==HonroApp.engine.b||!owner._staticCacheBuild||b.honroStage!==7||b.honroCanonical!==true||b.honroCustom!==false||b.honroMapOrigin!=='campaign')throw Error('wrong stage/cold tile owner');
   if(!targets.has(id))return null;
   if(opened.has(id))throw Error('specific perimeter tile cold-built twice');
   opened.add(id);
   const target=targets.get(id),k=3.13,m=cc.getTransform();
   if(!dom(cc.canvas)||m.a!==rs||m.d!==rs||m.b!==0||m.c!==0||m.e!==2-view.left*rs||m.f!==2-view.top*rs
     ||cc.globalAlpha!==1||cc.globalCompositeOperation!=='source-over'||![.25,.0625].includes(rs))throw Error('unexpected native tile state');
   const sites=landmarks.filter(q=>q.id==='site-body-7'&&q.asset?.id==='act1-site:7:body');
   if(sites.length!==1||sites[0].layer!=='structural-back'||sites[0].x!==0||sites[0].y!==0||sites[0].scale!==k||
     JSON.stringify(sites[0].asset.vector.root.children[16].transform)!=='[1,0,0,20,0,-19912]'||sites[0].asset.vector.root.children.length!==17)throw Error('wrong exact live BODY owner');
   const matrix=[m.a,m.b,m.c,m.d,m.e,m.f],rect=target.rect,[x,y,w,h]=rect;
   if(rs!==target.rs||!equal(matrix,target.matrix)||!equal([view.left,view.top],target.viewOrigin)||
     !rect.every(Number.isInteger)||x<0||y<0||x+w>516||y+h>516||w<3||h<3||w*h>30)
      throw Error('target no longer isolated in exact native tile placement');
   const screenMatrix=screen.getTransform(),screenWitness={matrix:[screenMatrix.a,screenMatrix.b,screenMatrix.c,screenMatrix.d,screenMatrix.e,screenMatrix.f],
      quality:screen.imageSmoothingQuality,smoothing:screen.imageSmoothingEnabled,filter:screen.filter,cssTransform:getComputedStyle(owner.canvas).transform};
   if(spec.mode==='X'){
    const exact=spec.screenWitness;
    if(!exact||!equal(screenWitness.matrix,exact.matrix)||
       Object.keys(screenWitness).length!==Object.keys(exact).length||
       !['quality','smoothing','filter','cssTransform'].every(k=>screenWitness[k]===exact[k])||
       screenWitness.filter!=='none'||screenWitness.smoothing&&screenWitness.quality!=='low'||screenWitness.cssTransform!=='none'||
       screen.globalAlpha!==1||screen.globalCompositeOperation!=='source-over'||window.devicePixelRatio!==1)
       throw Error('exact independently measured native filter/CTM mismatch '+JSON.stringify({was:screenWitness,expected:exact}));
   }
   const s=scratch(owner,cc);
   // Capture the *existing current back* without reading its pixels to CPU.
   blit(s,cc.canvas,[0,0,516,516]);
   return {owner,cc,s,scratchList:drawListForScratch(landmarks,sites[0]),id,rs,rect,matrix,screenWitness,attr:attrs(cc)};
  },
  close(w){
   if(!w)return;
   const {owner,cc,s,scratchList,rect,id,rs,matrix,screenWitness,attr}=w;
   // Take exact canvas-to-canvas witnesses; encode only after the genuine game frames were read.
   const prior=scratch(owner,cc),after=scratch(owner,cc);
   blit(prior,cc.canvas,[0,0,516,516]);
   s.setTransform(...matrix);owner._landmarkLayer(s,scratchList,'structural-back');
   blit(cc,s.canvas,rect);
   blit(after,cc.canvas,[0,0,516,516]);
   if(!immutableWitness())throw Error('registered BODY unexpectedly mutated');
   rows.push({id,rs,rect,matrix,screenWitness,attr,role:'after structural-back before original terrain/surface',
       scratchMode:spec.mode,originalProviderUnchanged:true});
   saved.set(id,{stockBefore:prior.canvas,scratch:s.canvas,stockAfter:after.canvas,live:cc.canvas});
  },
  install(clone){Object.defineProperty(scene,'_drawTerrainDomainTiles',{value:clone,writable:true,configurable:true});},
  health(){return {opened:[...opened].sort(),rows:structuredClone(rows),registeredBodyUnchanged:immutableWitness()};},
  snapshots(){
   if(opened.size!==targets.size||saved.size!==targets.size||rows.length!==targets.size)throw Error('scope did not exercise exact selected cold tiles');
   return Object.fromEntries([...targets.keys()].map(id=>{
    const vals=saved.get(id);
    if(!vals||scene._domainTiles?.tiles.get(id)?.canvas!==vals.live)throw Error('selected actual warm tile lost: '+id);
    return [id,Object.fromEntries(Object.entries(vals).filter(([k])=>k!=='live').map(([k,v])=>[k,v.toDataURL('image/png').split(',')[1]]))];
   }));
  },
  restore(){
   if(!delete scene._drawTerrainDomainTiles||scene._drawTerrainDomainTiles!==stock)throw Error('native teardown failed');
   rows.length=0;saved.clear();opened.clear();return true;
  }
 };return qa;
}
