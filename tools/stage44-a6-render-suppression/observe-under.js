({lane, expected})=>{
  const a=HonroApp,s=a.scene,b=a.engine?.b,V=HonroVectorArt;
  if(window.__s44Under || !s || typeof V.draw!=='function' || b?.honroStage!==44 ||
     b.honroCanonical!==true || b.honroCustom!==false || b.honroMapOrigin!=='campaign' ||
     b.honroAuthoredId!=='stage-44' || b.phase!=='aim' || b.round!==1 ||
     s.canvas!==document.getElementById('battlecanvas'))throw Error('wrong observer target');
  if(!['COUNT_ONLY','UNDER_OMITTED'].includes(lane)||![0,1].includes(expected))throw Error('observer configuration');
  const all=HonroTerrainDomain.materialLandmarks(b);
  const near=all.filter(l=>l.id==='a5-near'&&l.asset?.id==='act5:near:44');
  const under=all.filter(l=>l.id==='a5-under'||l.asset?.id==='act5:under:44');
  if(near.length!==1||under.length!==expected)throw Error('unexpected owner presence');
  const n=near[0],u=under[0];
  if(!n.asset.rootExterior||!n.asset.upperCanopy||n.x!==0||n.y!==0||n.scale!==6800/2172||
     n.asset.params?.sourceSha256!=='cac4a99c1203b1a6896b4dfcdeb181ad666511a4c01505f2b4d34f29ad0543e6')
    throw Error('original root changed');
  if(u&&(u.id!=='a5-under'||u.asset?.id!=='act5:under:44'||u.x!==160||u.y!==586||u.scale!==3.2||u.rotation!==0||
         u.asset?.params?.derivedFrom?.asset!=='stage45-root-body.json'||u.asset.collision.length!==0))
    throw Error('new asset registration changed');
  if(lane==='UNDER_OMITTED'&&!u)throw Error('no underlayer to omit');
  const orig=V.draw,r={under:0,skips:0,root:0,crown:0,ctm:[]},record=c=>{
    if(r.ctm.length>=64)return;
    const t=c.getTransform();
    r.ctm.push({matrix:[t.a,t.b,t.c,t.d,t.e,t.f],size:[c.canvas.width,c.canvas.height],main:c.canvas===s.canvas});
  };
  function observe(c,asset){
    // Match only the exact asset loaded in this canonical battle; none other.
    if(a.engine.b!==b)throw Error('stale observer');
    if(u&&asset===u.asset){
      r.under++;record(c);
      if(lane==='UNDER_OMITTED'){r.skips++;return true;}
    }else if(asset===n.asset.rootExterior)r.root++;
    else if(asset===n.asset.upperCanopy)r.crown++;
    return Reflect.apply(orig,this,arguments);
  }
  V.draw=observe;
  window.__s44Under={receipt:r,undo(){
    if(V.draw!==observe)throw Error('lost observer ownership');
    V.draw=orig;delete window.__s44Under;
    return r;
  }};
  return {landmarkOrder:all.filter(l=>l===n||l===u).map(l=>l.id)};
}
