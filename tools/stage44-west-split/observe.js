omit=>{
  const app=window.HonroApp,s=app.scene,b=app.engine.b,V=window.HonroVectorArt;
  if(window.__s44split||b.honroStage!==44||b.honroCanonical!==true||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||b.honroAuthoredId!=='stage-44'||b.phase!=='aim'||b.round!==1||s.canvas!==document.querySelector('#battlecanvas'))throw Error('canonical observer binding');
  const owners=HonroTerrainDomain.materialLandmarks(b).filter(l=>l.asset?.id==='act5:near:44');
  if(owners.length!==1)throw Error('ambiguous registered owner');
  const l=owners[0],root=l.asset.rootExterior,upper=l.asset.upperCanopy;
  if(l.id!=='a5-near'||l.x!==0||l.y!==0||l.scale!==6800/2172||l.rotation||root?.id!=='act5:stage44:root-continuation'||!upper||!l.asset.rootUpperClip||l.asset.params.sourceSha256!=='cac4a99c1203b1a6896b4dfcdeb181ad666511a4c01505f2b4d34f29ad0543e6')throw Error('exact art owner binding');
  const orig=V.draw;
  if(typeof orig!=='function')throw Error('painter bindings');
  const o={omit,draws:0,skips:0,crown:0,ctm:[],undo() {
    if(V.draw!==observeDraw)throw Error('observer lost ownership');
    V.draw=orig;
    delete window.__s44split;
  }};
  function observeDraw(c,asset){
    if(asset===root) {
      if(app.engine.b!==b||!c||typeof c.getTransform!=='function')throw Error('stale observer');
      ++o.draws;
      if(o.ctm.length<64){
        const q=c.getTransform();
        o.ctm.push({matrix:[q.a,q.b,q.c,q.d,q.e,q.f],size:[c.canvas.width,c.canvas.height],main:c.canvas===s.canvas});
      }
      if(omit){++o.skips;return true;}
    }else if(asset===upper){++o.crown;}
    return Reflect.apply(orig,this,arguments);
  }
  V.draw=observeDraw;
  window.__s44split=o;
}
