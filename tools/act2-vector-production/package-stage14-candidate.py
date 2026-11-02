"""Package Stage14 immutable evidence only after native bake and strict passing QA."""
from pathlib import Path
import json,hashlib,gzip,shutil
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[2];base=root.parent/'honro-act2-vector-rollout/stage14';out=root/'art/act2-near-vector-candidates/stage14-village-v1';dest=root/'shared/data/act2';out.mkdir(parents=True,exist_ok=True);dest.mkdir(exist_ok=True)
sha=lambda data:hashlib.sha256(data).hexdigest()
canonical=lambda v:json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'))
parts=['domain-v3','upper-v2','west-v1','east-v1','family-v1','refuge-v2','vault-v2'];rows=[];assets=[]
refs=out/'submitted-references';refs.mkdir(exist_ok=True)
for part in parts:
 p=base/part;q=out/part;q.mkdir(exist_ok=True);qa=json.load(open(p/'qa-final/comparison.json'));assert qa['qualityPass'],part
 references=[]
 for ref in json.load(open(p/'prompt.txt')).get('referenced_image_paths',[]):
  rp=Path(ref);rs=sha(rp.read_bytes());rn=rs+rp.suffix;shutil.copyfile(rp,refs/rn);references.append({'submittedPath':ref,'sha256':rs,'preservedPath':'submitted-references/'+rn})
 raw=(p/'trace/raw.svg').read_bytes();final=(p/'final.svg').read_bytes()
 proof=json.load(open(p/'lossless-proof.json'));assert proof['afterSha256']==sha(final) and all(x['rgbaPixelIdentical'] for x in proof['scales']),part
 assert sha(raw)==json.load(open(p/'selected-optimization.json'))['sourceSha256'],part
 for src,name in [('source.png','source.png'),('prompt.txt','prompt.txt'),('guide.svg','guide.svg'),('final.svg','final.svg'),('pixel-config.json','pixel-config.json'),('pixel-composed.json','pixel-composed.json'),('contract.json','placement.json'),('config.json','import-config.json'),('selected-optimization.json','optimization.json'),('trace/trace-report.json','trace-report.json'),('qa-final/comparison.json','comparison.json'),('lossless-proof.json','lossless-proof.json')]:shutil.copyfile(p/src,q/name)
 (q/'immutable-raw.svg.gz').write_bytes(gzip.compress(raw,mtime=0));assert gzip.decompress((q/'immutable-raw.svg.gz').read_bytes())==raw
 a=json.load(open(root/f'_local/reports/stage14-art-preview/{part}-baked.json'));a['params']['previewOnly']=False;file=f'stage14-{part}-candidate.json';data=(json.dumps(a,ensure_ascii=False,separators=(',',':'))+'\n').encode();(dest/file).write_bytes(data);assets.append({'file':file,'assetId':a['id'],'sha256':sha(canonical(a).encode())})
 (q/'composed-reference.svg.gz').write_bytes(gzip.compress((p/'composed-raw.svg').read_bytes(),mtime=0));(q/'composed-candidate.svg.gz').write_bytes(gzip.compress((p/'composed-candidate.svg').read_bytes(),mtime=0))
 source=np.asarray(Image.open(p/'source.png').convert('RGBA')).copy();source[:,:,3]=np.where(source[:,:,:3].min(2)>=245,0,source[:,:,3]);traced=np.asarray(Image.open(p/'trace/raw.png').convert('RGBA'));solid=(source[:,:,3]>=128)&(traced[:,:,3]>=128);mae=float(np.abs(source[:,:,:3].astype(float)-traced[:,:,:3])[solid].mean()) if solid.any() else None;alphaDisagreement=float(((source[:,:,3]>=128)!=(traced[:,:,3]>=128)).mean())
 row={'part':part,'submittedReferences':references,'sourceSha256':sha((p/'source.png').read_bytes()),'promptSha256':sha((p/'prompt.txt').read_bytes()),'rawSha256':sha(raw),'finalSha256':sha(final),'nativeFileSha256':sha(data),'rawBytes':len(raw),'finalBytes':len(final),'nativeBytes':len(data),'rawGzipPath':part+'/immutable-raw.svg.gz','finalPath':part+'/final.svg','qualityComparison':part+'/comparison.json','sourceToTrace':{'visibleRgbMAE255':mae,'binaryAlphaDisagreementFraction':alphaDisagreement,'scope':'Palette reduction and binary Inkscape trace losses, not optimizer loss or artwork approval'},'sourceGeneration':'Exact submitted JSON prompt and referenced_image_paths saved before imagegen; original PNG immutable.','localSourcePath':str(p/'source.png')};rows.append(row);(q/'provenance.json').write_text(json.dumps(row,indent=2)+'\n')
r=sum(x['rawBytes']for x in rows);f=sum(x['finalBytes']for x in rows);assert f<=.7*r,(r,f,100*(1-f/r))
(out/'optimization-summary.json').write_text(json.dumps({'stage':14,'packRawBytes':r,'packFinalBytes':f,'packReductionPercent':100*(1-f/r),'nativePackBytes':sum(x['nativeBytes']for x in rows),'parts':rows,'scope':'Native candidate only. Browser/full-gameplay/public deployment remain parent-owned.'},indent=2)+'\n')
shutil.copyfile(root/'_local/reports/stage14-original/source.json',out/'effective-source.json')
record=json.load(open(root/'tools/act2-vector-production/stage14-art-source.json'));record['assets']=assets;record['bodyAssetIds']=[x['assetId']for x in assets];(root/'tools/act2-vector-production/stage14-art-source.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'raw':r,'final':f,'reductionPercent':100*(1-f/r),'native':sum(x['nativeBytes']for x in rows)}))

import subprocess
subprocess.run(['node','--input-type=module','-e',"import{readFileSync,writeFileSync}from'node:fs';import{stage14Digest}from'./tools/act2-vector-production/apply-stage14-candidate.mjs';const p='tools/act2-vector-production/stage14-art-source.json',r=JSON.parse(readFileSync(p));for(const a of r.assets)a.sha256=stage14Digest(JSON.parse(readFileSync('shared/data/act2/'+a.file)));writeFileSync(p,JSON.stringify(r,null,2));"],cwd=root,check=True)
