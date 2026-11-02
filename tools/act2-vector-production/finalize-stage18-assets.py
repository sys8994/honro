"""Package only measured same-composition candidates; immutable trace and explicit palette retained."""
import json,hashlib,shutil,sys
from pathlib import Path
b=Path(sys.argv[1]);root=Path(__file__).resolve().parents[2];out=root/'art/act2-near-vector-candidates/stage18-bell-cavern-v1';out.mkdir(parents=True,exist_ok=True);rows=[]
for part in ['domain-v1','floor-local-v2','west-v2','east-v2']:
 p=b/part;q=json.loads((p/'native-comparison.json').read_text());assert q['qualityPass'],part
 assert hashlib.sha256((p/'candidate-bbox.svg').read_bytes()).hexdigest()==q['candidateSvgSha256']
 assert hashlib.sha256((p/'native-candidate.json').read_bytes()).hexdigest()==q['nativeCandidateSha256']
 shutil.copyfile(p/'candidate-bbox.svg',p/'final.svg');shutil.copyfile(p/'native-candidate.json',p/'native.json')
 raw=(p/'authored-raw.svg').stat().st_size;final=(p/'final.svg').stat().st_size
 asset=json.loads((root/f'_local/reports/stage18-final-composite/{part}-baked.json').read_text());asset['params'].pop('previewOnly',None)
 file='stage18-'+part+'.json';target=root/'shared/data/act2'/file;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(asset,separators=(',',':')))
 d=out/part;d.mkdir(exist_ok=True)
 for f in ['source.png','guide.svg','placement.json','submitted-prompt.json','authored-raw.svg.gz','original-trace.svg.gz','final.svg','config.json','pixel-config.json','native-comparison.json','candidate-bbox.report.json']:
  if(p/f).exists():shutil.copyfile(p/f,d/f)
 for f in ['trace-report.json','inkscape.log']:
  if(p/'trace'/f).exists():shutil.copyfile(p/'trace'/f,d/f)
 for log in (p/'trace').glob('layer*/trace.log'):
  shutil.copyfile(log,d/(log.parent.name+'-inkscape.log'))
 if(p/'contact-refinement.json').exists():shutil.copyfile(p/'contact-refinement.json',d/'contact-refinement.json')
 rows.append({'part':part,'file':file,'assetId':asset['id'],'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'rawBytes':raw,'finalBytes':final,'nativeBytes':target.stat().st_size,'qualityPass':True})
r=sum(x['rawBytes']for x in rows);f=sum(x['finalBytes']for x in rows);assert f<=r*.7,(r,f)
report={'stage':18,'parts':rows,'rawPackBytes':r,'finalSvgPackBytes':f,'reductionPercent':100*(1-f/r),'originalTracePackBytes':sum((b/x['part']/'trace/raw.svg').stat().st_size for x in rows),'limitsUnchanged':True,'scope':'Actual native canonical clip/contact raw/final1x2x; no browser/gameplay/full-stage acceptance'};(out/'final-pack-report.json').write_text(json.dumps(report,indent=2))
for f in ['palette-refinement.json','initial-failed-comparison.json','rejected-v1-pixel-passed-visual-failed.json']:shutil.copyfile(b/f,out/f)
stage=json.loads((b/'source/raw-stage.json').read_text());source={k:stage[k]for k in ['width','height','playBounds','terrainBounds','terrains'] if k in stage}
excluded=[t['id']for t in stage['terrains']if t.get('properties',{}).get('surfaceKind')!='cave'or any(t.get('properties',{}).get(k)for k in ['honroBellMoving','honroBellBody','honroBellRelease','honroMeleeTarget'])]
record={'stage':18,'sourceCommit':'ad56f6d7a4c6f6339f6c0f2ceb792c3ddff711fd','sourceContract':'Raw campaign before narrative; effective baked clipping separately locked/tested','source':source,'assets':rows,'excludedDynamicAndNativeTerrainIds':excluded};(root/'tools/act2-vector-production/stage18-art-source.json').write_text(json.dumps(record,indent=2));print(json.dumps({k:v for k,v in report.items()if k!='parts'}))
