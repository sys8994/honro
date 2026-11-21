/* Factory body inserted beside exact pinned class method clone in isolated browser only. */
function makeNeutralProbe(spec){
 const scene=HonroApp.scene, proto=HonroScene.prototype, stock=proto._drawTerrainDomainTiles;
 if(scene._drawTerrainDomainTiles!==stock||Object.hasOwn(scene,'_drawTerrainDomainTiles')||Function.prototype.toString.call(stock)!==spec.stockOuter)throw Error('native outer method mismatch after verified preflight');
 const rows=[],saved=new Map(),opened=new Set(),targets=new Map(Object.entries(spec.targets));
 if(![1,6].includes(targets.size)||!['O','Q'].includes(spec.mode))throw Error('bad exact full baseline');
 const masks=spec.runs??{};
 if(spec.mode==='Q'&&(Object.keys(masks).length!==targets.size||[...targets.keys()].some(k=>!masks[k]?.runs?.length)||!Array.isArray(spec.authored)||spec.authored.length!==14||spec.authored.some(a=>a.tag!=='path'||typeof a.d!=='string'||!/^#[0-9a-f]{6}$/.test(a.fill)||Object.keys(a).sort().join()!=='d,fill,tag')))throw Error('missing exact independently signed Q plan');
 const registry=HONRO_PROJECT.library,registered=registry.filter(q=>q.id==='act1-site:7:body');
 if(registered.length!==1)throw Error('expected exactly one original BODY provider');
 const body=registered[0],stable=JSON.stringify(body);
 const immutableWitness=()=>HONRO_PROJECT.library===registry&&registry.filter(q=>q.id===body.id).length===1&&registry.find(q=>q.id===body.id)===body&&JSON.stringify(body)===stable;
 function drawListForScratch(list,pick,pure,q=false){
  if(!['O','Q'].includes(spec.mode)||!immutableWitness()||JSON.stringify(pick.asset)!==stable)throw Error('active owner differs from exact original provider');
  const asset=pick.asset,v=asset.vector,children=v.root.children;
  if(children.length!==17||children[16].clipPath!=='site-edge-2'||JSON.stringify(v.clips['site-edge-2'])!=='["M16 1049H1418V1068H16Z"]'
    ||JSON.stringify(children[16].children)!=='[{"tag":"use","symbol":"source"}]')throw Error('not the exact old-only child16');
  const tail=q?{tag:'g',children:spec.authored}:pure?children[16]:{tag:'g',children:[]};
  // Pure J has no use nodes: stock rejects unused symbols, so strip only this scratch clone's dead symbol table.
  const pureAuthored=pure&&q;
  const symbols=pureAuthored?{}:v.symbols;
  const replacement={...asset,vector:{...v,symbols,root:{...v.root,children:pure?[tail]:[...children.slice(0,16),tail]}}};
  if(q){
   const errs=HonroVectorArt.validate(replacement.vector);
   if(errs.length)throw Error('authored source fails stock vector validation ['+(pureAuthored?'J':'D')+']: '+JSON.stringify(errs));
  }
  if(replacement.vector.clips!==v.clips||replacement.vector.symbols!==symbols||(pureAuthored?Object.keys(symbols).length!==0:symbols!==v.symbols)||HONRO_PROJECT.library.includes(replacement))throw Error('scratch isolation lost');
  if(pure)return [{...pick,asset:replacement}];
  if(JSON.stringify(replacement.vector.root.children.slice(0,16))!==JSON.stringify(children.slice(0,16)))throw Error('original children drift');
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
     !rect.every(Number.isInteger)||x<0||y<0||x+w>516||y+h>516||w<3||h<3)
      throw Error('target no longer isolated in exact native tile placement');
   const screenMatrix=screen.getTransform(),screenWitness={matrix:[screenMatrix.a,screenMatrix.b,screenMatrix.c,screenMatrix.d,screenMatrix.e,screenMatrix.f],
      quality:screen.imageSmoothingQuality,smoothing:screen.imageSmoothingEnabled,filter:screen.filter,cssTransform:getComputedStyle(owner.canvas).transform};
   {
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
   return {owner,cc,s,landmarks,site:sites[0],id,rs,rect,matrix,screenWitness,attr:attrs(cc)};
  },
  close(w){
   if(!w)return;
   const {owner,cc,s,landmarks,site,rect,id,rs,matrix,screenWitness,attr}=w;
   const prior=scratch(owner,cc);
   blit(prior,cc.canvas,[0,0,516,516]);
   s.setTransform(...matrix);
   let extra,writes=0;
   if(spec.mode==='O'){
    owner._landmarkLayer(s,drawListForScratch(landmarks,site,false),'structural-back');
    const pure=scratch(owner,cc);pure.setTransform(...matrix);
    owner._landmarkLayer(pure,drawListForScratch(landmarks,site,true),'structural-back');
    extra={O:s.canvas,I:pure.canvas}; // No copy to cc in O.
   }else if(spec.mode==='Q'){
    // Before gated application independently replay pure stock I, omissions O, authored
    // pure J, and the full authored donor D. Neither O nor pure canvases reach live tiles.
    const canvases={};
    for(const [role,pure,q] of [['O',false,false],['I',true,false],['J',true,true],['D',false,true]]){
     const t=scratch(owner,cc);
     if(!pure)blit(t,s.canvas,[0,0,516,516]);
     t.setTransform(...matrix);
     owner._landmarkLayer(t,drawListForScratch(landmarks,site,pure,q),'structural-back');
     canvases[role]=t;
    }
    const buf=Object.fromEntries([['A',prior],...Object.entries(canvases)].map(([k,v])=>[k,v.getImageData(0,0,516,516).data]));
    const plan=masks[id], spans=plan.runs, special=new Map();
    for(const [x,y,...rgba] of plan.removeOnly){
     const ix=(y*516+x)*4;
     if(![x,y,...rgba].every(Number.isInteger)||rgba.length!==4||special.has(ix))throw Error('bad immutable remove-only entry');
     special.set(ix,rgba);
    }
    const [l,t,ww,hh]=rect; let py=-1,pr=-1,matched=0;
    const present=(x,y)=>y>=t&&y<t+hh&&x>=l&&x<l+ww;
    const same=(u,v,i)=>u[i]===v[i]&&u[i+1]===v[i+1]&&u[i+2]===v[i+2]&&u[i+3]===v[i+3];
    const zero=(u,i)=>!(u[i]||u[i+1]||u[i+2]||u[i+3]);
    const change=[];
    for(const [y,x,X] of spans){
     if(![y,x,X].every(Number.isInteger)||!present(x,y)||!present(X-1,y)||x>=X||y<py||y===py&&x<=pr)
       throw Error('unsealed malformed or out-of-support Q span: '+id);
     py=y;pr=X;let start=null;
     for(let j=x;j<X;j++){
      const i=(y*516+j)*4, ex=special.get(i);
      if(!buf.I[i+3]||!same(buf.A,buf.I,i)||!zero(buf.O,i)||!same(buf.D,buf.J,i)||buf.J[i+3]>buf.I[i+3])
       throw Error('Q did not preserve signed old ownership/no new alpha: '+id+':'+j+','+y);
      if(ex){
       if(!ex.every((k,n)=>buf.A[i+n]===k))throw Error('old signed owner RGBA mismatch: '+id+':'+j+','+y);
       if(!zero(buf.J,i)||!zero(buf.D,i))throw Error('remove-only authored alpha not zero: '+id+':'+j+','+y);
       matched++;
      }
      if(!same(buf.A,buf.D,i)){
        if(start===null)start=j;
        writes++;
      }else if(start!==null){change.push([y,start,j]);start=null;}
     }
     if(start!==null)change.push([y,start,X]);
    }
    if(matched!==special.size||!writes)throw Error('Q scope lost, no native change or remove-only point missing');
    // All native checks for this tile precede any copy. No CPU pixels are written.
    for(const [y,x,X] of change)blit(cc,canvases.D.canvas,[x,y,X-x,1]);
    const after=scratch(owner,cc);blit(after,cc.canvas,[0,0,516,516]);
    extra={...Object.fromEntries(Object.entries(canvases).map(([k,t])=>[k,t.canvas])),post:after.canvas};
   }else throw Error('unknown baseline mode');
   if(!immutableWitness())throw Error('registered BODY unexpectedly mutated');
   rows.push({id,rs,rect,matrix,screenWitness,attr,role:'structural-back before unchanged rest',
      mode:spec.mode,originalProviderUnchanged:true,nativeWrittenPixels:writes});
   saved.set(id,{A:prior.canvas,...extra,live:cc.canvas});
  },
  install(clone){Object.defineProperty(scene,'_drawTerrainDomainTiles',{value:clone,writable:true,configurable:true});},
  health(){return {opened:[...opened].sort(),rows:structuredClone(rows),registeredBodyUnchanged:immutableWitness()};},
  snapshots(id){
   if(opened.size!==targets.size||rows.length!==targets.size)throw Error('scope lacks exact selected cold tiles');
   const vals=saved.get(id);
   if(!vals||scene._domainTiles?.tiles.get(id)?.canvas!==vals.live)throw Error('selected actual warm tile lost: '+id);
   const out={};
   for(const [k,v]of Object.entries(vals))if(k!=='live'){
    out[k]=v.toDataURL('image/png').split(',')[1];v.width=1;v.height=1;
   }
   saved.delete(id);return out;
  },
  restore(){
   if(saved.size!==0||!delete scene._drawTerrainDomainTiles||scene._drawTerrainDomainTiles!==stock)throw Error('native teardown failed');
   rows.length=0;saved.clear();opened.clear();return true;
  }
 };return qa;
}
