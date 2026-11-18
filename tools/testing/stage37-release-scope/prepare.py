from pathlib import Path
import json,hashlib,shutil
R=Path('stage37-release-scope'); changes=[]
for p in (R/'master').rglob('*'):
 if p.is_file():
  d=R/'candidate'/p.relative_to(R/'master');d.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,d)
def patch(p,a,b):
 f=R/'candidate'/p;s=f.read_text();assert s.count(a)==1,(p,a);f.write_text(s.replace(a,b));changes.append(dict(path=p,old=a,new=b))
p='shared/build.mjs'
for c in json.load(open('stage3-selective-integration-local/patch-contract.json'))['changes']:
 if c['path']==p:patch(p,c['old'],c['new'])
# Exact verified common renderer/readability, whose differences from master concern only 3/7 and explicit flagged art.
for p in ['shared/runtime/renderer.js','shared/runtime/terrain-readability.js']:
 a=(R/'master'/p).read_text();b=(Path('stage3-selective-integration-local/production')/p).read_text()
 patch(p,a,b)
# Stage7 registry on master: no unrelated stage12/15 registrations.
p='shared/terrain-path-optimization.mjs'
stage7=(Path('stage7-integration-842-local/patch')/p).read_text()
start=stage7.index('  // Reviewed Stage7 vector revision:')
end=stage7.index('\n  return {',start)
patch(p,"  if (byId.size !== entries.length) throw Error('Duplicate terrain optimization asset');","  if (byId.size !== entries.length) throw Error('Duplicate terrain optimization asset');\n"+stage7[start:end])
patch(p,"        // Geometry hidden", "        if (asset.id === stage7.id && sha(JSON.stringify(asset.vector.symbols.source)) !== stage7.sourceRaw)\n          throw Error('Stage7 raw source changed before optimization');\n        // Geometry hidden")
patch(p,"        asset.vector = vector;","        if (asset.id === stage7.id && (sha(JSON.stringify(vector)) !== stage7.optimized ||\n            sha(JSON.stringify(vector.symbols.source)) !== stage7.sourceOptimized))\n          throw Error('Stage7 optimized result differs from reviewed registration');\n        asset.vector = vector;")
p='tools/map-forge/act1-naru-doldang.mjs'
patch(p,"import {readFile} from 'node:fs/promises';","import {readFile} from 'node:fs/promises';\nimport {finishStage7Body,loadStage7TerrainFinish} from './stage7-terrain-finish.mjs';")
patch(p,"function authorStage(project,s,data){","function authorStage(project,s,data,finishData){")
patch(p," artAsset(project,bodyId,site+' 지형',collage(body.vector,faces,[-390,0,sourceWidth+790,sourceHeight+380],true,edges),body.sha256);"," const bodyCollage=collage(body.vector,faces,[-390,0,sourceWidth+790,sourceHeight+380],true,edges);\n const finishedBody=n===7?finishStage7Body(bodyCollage,finishData):bodyCollage;\n artAsset(project,bodyId,site+' 지형',finishedBody,body.sha256);")
patch(p,"  authorStage(project,s,source);","  authorStage(project,s,source,id===7?await loadStage7TerrainFinish():null);")
newfiles=['shared/data/stage7-terrain-path-registration.json','tools/map-forge/stage7-terrain-finish.json','tools/map-forge/stage7-terrain-finish.mjs','tools/map-forge/naru-body-finish.mjs']
for p in newfiles:
 src=Path('stage3-selective-integration-local/production' if 'naru-body-finish' in p else 'stage7-integration-842-local/patch')/p
 dst=R/'candidate'/p;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dst)
for p in set(c['path'] for c in changes):
 s=(R/'candidate'/p).read_text()
 for c in reversed([c for c in changes if c['path']==p]):assert s.count(c['new'])==1;s=s.replace(c['new'],c['old'])
 assert s==(R/'master'/p).read_text()
files=[]
for p in sorted((R/'candidate').rglob('*')):
 if p.is_file():
  b=p.read_bytes();files.append(dict(path=str(p.relative_to(R/'candidate')),local=str(p),bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),blob=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()))
assert len(files)==9
(R/'manifest.json').write_text(json.dumps(dict(ready=False,base='5b2edf0b868a6f4ab656574b036586304eb12808',sourceOnly=True,scope='Stage3+7 only, no Stage32 helper/pilot or unrelated candidate placement',files=files),indent=2)+'\n')
(R/'patch-contract.json').write_text(json.dumps(dict(base='5b2edf0b868a6f4ab656574b036586304eb12808',changes=changes,newFiles=newfiles,inverseExact=True),indent=2)+'\n')
print('9 files, exact inverse to master for all five existing files')
