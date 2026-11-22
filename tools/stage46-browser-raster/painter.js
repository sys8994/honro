'use strict';
globalThis.HonroScene=class {
  constructor(){this.battle={honroStage:46,honroCanonical:true,mode:'campaign'};}
  landmark(){throw Error('unexpected fallback renderer');}
  _makeLayerCanvas(w,h){const cv=document.createElement('canvas');cv.width=w;cv.height=h;return cv;}
  _releaseRasterCanvas(cv){cv.width=1;cv.height=1;}
  _landmarkPaintBounds(){}
  _drawTerrainDomainTiles(){}
};
globalThis.stage46Attribution=function(provider,part3,pose){
  const parts=part3?provider.shaftExteriorParts.map((p,n)=>n===2?part3:p):provider.shaftExteriorParts;
  const asset=part3?{...provider,shaftExteriorParts:parts}:provider;
  return (()=>{
    if(devicePixelRatio!==1)throw Error('DPR drift');
    const cv=document.createElement('canvas');[cv.width,cv.height]=pose.backing;
    const g=cv.getContext('2d'),z=pose.scale;
    g.setTransform(z,0,0,z,-pose.viewport.left*z,-pose.viewport.top*z);
    const actual=g.getTransform();
    (new HonroScene()).landmark(g,{id:'a5-near',assetId:asset.id,asset,x:0,y:0,scale:4,rotation:0,layer:'structural-back',depthLayer:'L1',visualRole:'scenery'});
    const d=g.getImageData(0,0,cv.width,cv.height);
    if(!(g instanceof CanvasRenderingContext2D)||!(d.data instanceof Uint8ClampedArray)||typeof Path2D!=='function')throw Error('not native Chromium Canvas2d');
    const chunks=[];
    const bytes=d.data,step=16384;
    for(let i=0;i<bytes.length;i+=step)chunks.push(String.fromCharCode(...bytes.subarray(i,i+step)));
    return {ctm:[actual.a,actual.b,actual.c,actual.d,actual.e,actual.f],dpr:devicePixelRatio,backing:[cv.width,cv.height],rgba:btoa(chunks.join(''))};
  })();
};
