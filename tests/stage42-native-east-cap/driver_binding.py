"""Minimal test adapter for the exact original, archived Scene diagnostic."""
import hashlib
from pathlib import Path

PIN='f3183316ab83edb79570dd66a6750c85acc9b6deb1b5ccd7d8a2dd28f282c05a'
HERE=Path(__file__).parent

def build_driver(path=HERE/'archived-diagnostic.js'):
    src=path.read_bytes()
    assert hashlib.sha256(src).hexdigest()==PIN, 'Historical Scene driver drift'
    s=src.decode()
    def once(old,new):
        nonlocal s
        assert s.count(old)==1, 'Unexpected archive source seam: '+old
        s=s.replace(old,new)
    once('async ({views,w,h,seed})=>{','async ({views,w,h,seed,kind,expected,targets})=>{')
    once('project=api.getProject(), original=',"project=(kind==='stock'?structuredClone(window.__eastStockBeforeOpen):api.getProject()), original=")
    once("await digest(project)!=='135e9a633d311d3b8b03ab2c676a7e94a46601629e0a91d7835988ed96438ddf'", "await digest(project)!==expected")
    once("if(owner.edgeWall.params?.bodyEditorFaces||owner.edgeWall.params?.workshopVisibleJoint42)", "if(owner.edgeWall.params?.bodyEditorFaces||owner.edgeWall.params?.workshopVisibleJoint42||!!owner.edgeWall.params?.authoredEastCapV1!==(kind==='candidate'))")
    once('  const oldRandom=Math.random;', '''  const oldRandom=Math.random, vectorDraw=HonroVectorArt.draw;
  let inside=false, trace={cache:0,exterior:0}, groupCache=0, activeScene=null;
  HonroVectorArt.draw=function(c,asset,...args){
    if(inside&&asset.id==='act5:stage42:registered-body')trace[activeScene?._staticCacheBuild&&c.canvas.width===516&&c.canvas.height===516?'cache':'exterior']++;
    return vectorDraw.call(this,c,asset,...args);
  };''')
    once('),sc=new HonroScene(canvas),frames=[];', '),sc=new HonroScene(canvas),frames=[];activeScene=sc;')
    once("      const draw=()=>{reset();sc.time=2;sc.render(e,0,'',.6,false,0);ctx.getImageData(0,0,1,1)};",'''      trace={cache:0,exterior:0};
      const hits=sc.renderCacheStats().worldHits??0;
      const draw=()=>{reset();sc.time=2;inside=true;try{sc.render(e,0,'',.6,false,0)}finally{inside=false}ctx.getImageData(0,0,1,1)};''')
    once('      frames.push({label:', '''      groupCache+=trace.cache;
      frames.push({routes:{...trace},groupCache,cacheHitDelta:(sc.renderCacheStats().worldHits??0)-hits,
                   actualLOD:sc._domainTiles?.rs??null,terrainBounds:{...b.honroTerrainBounds},label:''')
    once('return {physics:beforeT,units:beforeU,frames};','return {physics:beforeT,units:beforeU,frames:frames.filter(f=>targets.includes(f.label))};')
    once('}finally{canvas.remove();Math.random=oldRandom}', '}finally{canvas.remove();Math.random=oldRandom;HonroVectorArt.draw=vectorDraw}')
    return s
