from pathlib import Path
import sys
work=Path(sys.argv[1])
a=work/'tools/map-forge/act1-naru-doldang.mjs';s=a.read_text()
orig=" artAsset(project,bodyId,site+' 지형',collage(body.vector,faces,[-390,0,sourceWidth+790,sourceHeight+380],true,edges),body.sha256);"
new=""" const sceneBody=collage(body.vector,faces,[-390,0,sourceWidth+790,sourceHeight+380],true,edges);
 if(n===7){
  const ids=sceneBody.root.children.map(x=>x.clipPath||x.symbol);
  const keep=['source',...Array.from({length:13},(_,i)=>'site-crop-'+i)];
  const all=[...keep,'site-edge-0','site-edge-1','site-edge-2'];
  if(JSON.stringify(ids)!==JSON.stringify(all)||body.sha256!=='acbffaafb8a346e3c28d039a17f8d1dd1f2f525b1563860727e45d3bf4651193') throw Error('Stage7 owner identity changed, stop diagnostic');
  sceneBody.root.children=sceneBody.root.children.slice(0,14);
 }
 artAsset(project,bodyId,site+' 지형',sceneBody,body.sha256);"""
assert s.count(orig)==1
a.write_text(s.replace(orig,new))
