"""Read-only native tile blit observer for stock/candidate Scene in browser QA."""
def bind_route_trace(source):
 def once(a,b):
  nonlocal source
  if source.count(a)!=1:raise ValueError('Pinned archival driver seam drift: '+a)
  source=source.replace(a,b)
 once('  let inside=false, trace={cache:0,exterior:0}, groupCache=0, activeScene=null;', '''  let inside=false, trace={cache:0,exterior:0}, groupCache=0, activeScene=null;
  let tileRoute=null;
  const proto=HonroScene.prototype, originalRoute=proto._drawTerrainDomainTiles;
  proto._drawTerrainDomainTiles=function(c,b,w,h){
    if(!inside||this!==activeScene)return originalRoute.call(this,c,b,w,h);
    const dst=c.canvas, dpr=this._pixelRatio(w,h,b), m=c.getTransform(), events=[];
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(img,...args){
      if(this.canvas===dst){
        const t=this.getTransform();
        events.push({args,transform:[t.a,t.d,t.e,t.f],size:[img.width,img.height],smoothing:this.imageSmoothingEnabled,quality:this.imageSmoothingQuality,alpha:this.globalAlpha,composite:this.globalCompositeOperation,filter:this.filter??null});
      }
      return draw.call(this,img,...args);
    };
    try {
      const r=originalRoute.call(this,c,b,w,h);
      tileRoute={dpr,rs:this._domainTiles?.rs,tileCount:this._domainTiles?.tiles.size,events,camera:[this.x,this.y,this.scale],matrix:[m.a,m.d,m.e,m.f]};
      return r;
    }finally{CanvasRenderingContext2D.prototype.drawImage=draw}
  };''')
 once('      trace={cache:0,exterior:0};','      trace={cache:0,exterior:0};tileRoute=null;')
 once('      frames.push({routes:{...trace},','      frames.push({tileRoute,routes:{...trace},')
 once('HonroVectorArt.draw=vectorDraw}','HonroVectorArt.draw=vectorDraw;proto._drawTerrainDomainTiles=originalRoute}')
 return source

def require_same_tile_route(observed,isolated):
 if not observed or not observed.get('events'):raise AssertionError('Missing genuine Scene tile route')
 for k in ('dpr','rs','events','camera'):
  if observed.get(k)!=isolated.get(k):raise AssertionError('Cached shadow differed from genuine tile route: '+k)
