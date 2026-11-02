"""Package only strictly passing Stage11 native candidates and immutable evidence."""
from pathlib import Path
import json,shutil,gzip,hashlib
import sys
root=Path(__file__).resolve().parents[2];base=Path(sys.argv[1]).resolve();out=root/'art/act2-near-vector-candidates/stage11-ravine-v1';out.mkdir(parents=True,exist_ok=True);dest=root/'shared/data/act2';dest.mkdir(exist_ok=True)
parts=['floor-domain-v1','floor-entry-v1','west-v2','central-v2','lower-v2','east-v3','entry-rock-v1'];rows=[];assets=[]
for part in parts:
 assert (root/f'_local/reports/stage11-art-preview/{part}-baked.json').exists(),f'Native bake missing: {part}'
 assert json.load(open(base/part/'qa-final/comparison.json'))['qualityPass'],part
for part in parts:
 p=base/part;q=out/part;q.mkdir(exist_ok=True)
 qa=json.load(open(p/'qa-final/comparison.json'));assert qa['qualityPass'],part
 for src,name in [('final.svg','body.svg'),('world.svg','world.svg'),('protected.report.json','optimization.json'),('lossless-report.json','lossless-report.json'),('pixel-config.json','pixel-config.json'),('preparation.json','preparation.json'),('trace8/trace-report.json','trace-report.json'),('qa-final/comparison.json','comparison.json'),('placement.json','placement.json')]:shutil.copyfile(p/src,q/name)
 raw=(p/'trace8/raw.svg').read_bytes();(q/'immutable-raw.svg.gz').write_bytes(gzip.compress(raw,mtime=0));assert gzip.decompress((q/'immutable-raw.svg.gz').read_bytes())==raw
 guide=p/'guide.svg'
 if not guide.exists():guide=base/({'west-v2':'west-v1','central-v2':'central-v1','lower-v2':'lower-v1','east-v3':'east-v2'}[part])/'guide.svg'
 shutil.copyfile(guide,q/'guide.svg')
 a=json.load(open(root/f'_local/reports/stage11-art-preview/{part}-baked.json'));a['params']['previewOnly']=False;file=f'stage11-{part}-candidate.json';(dest/file).write_text(json.dumps(a,separators=(',',':'))+'\n');assets.append({'file':file,'assetId':a['id']})
 sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
 record={'part':part,'sourceImage':str(p/'source.png'),'sourceSha256':sha(p/'source.png'),'preparedImageSha256':sha(p/'vector-ready.png'),'immutableRawSha256':hashlib.sha256(raw).hexdigest(),'optimizedSha256':sha(p/'final.svg'),'nativeSha256':sha(dest/file),'rawBytes':len(raw),'optimizedBytes':(p/'final.svg').stat().st_size,'nativeBytes':(dest/file).stat().st_size,'qualityPass':True,'sourceScaleGate':'Native actor-size 92 world-unit hero; original camera scale retained','scope':'Material-only; canonical body/contact clips; no raster runtime asset','sourceGeneration':'Imagegen reference-based source with canonical silhouette guide. Production brief below is a reconstruction, not a verbatim API prompt.'}
 (q/'contract.json').write_text(json.dumps(record,indent=2));rows.append(record)
 (q/'production-brief.txt').write_text('Strict side-view Korean ravine rock material. Restrained angular flat vector planes, dark grey-green stone, modest olive moss. No people, buildings or far background in source. Respect canonical supplied silhouette and original actor-size contact scale; calm deep body planes. Style references: Act1 stage02/body-v2 and stage10/floor-v4, not copying their green palette. White source matte removed before actual Inkscape fixed seven-color palette tracing. Source geometry is clipped to canonical production terrain and contact inset at runtime.\n')
record=json.load(open(root/'tools/act2-vector-production/stage11-art-source.json'));record['assets']=assets;(root/'tools/act2-vector-production/stage11-art-source.json').write_text(json.dumps(record,indent=2)+'\n')
r=sum(x['rawBytes'] for x in rows);o=sum(x['optimizedBytes'] for x in rows);assert o<=r*.7
(out/'pack-report.json').write_text(json.dumps({'stage':11,'rawBytes':r,'optimizedBytes':o,'reductionFraction':1-o/r,'parts':rows,'browserAccepted':False,'gameplayAccepted':False},indent=2)+'\n')
print(r,o,1-o/r)
