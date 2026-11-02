"""Finalize only measured candidates; retain immutable source/raw/QA provenance."""
import json,hashlib,shutil,subprocess,sys,xml.etree.ElementTree as E
from pathlib import Path
base=Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/scratch/fff510b4df37/honro-act2-vector-rollout/stage15');parts=['outer-v1','west-flat-v2','east-flat-v2','arches-flat-v2'];rows=[]
for name in parts:
 p=base/name;q=json.loads((p/'native-comparison.json').read_text());assert q['qualityPass'],name
 standalone=json.loads((p/'qa-bbox/comparison.json').read_text())
 candidate=p/'candidate-contact.svg';normal=E.tostring(E.parse(candidate).getroot(),encoding='utf-8',xml_declaration=True)
 assert hashlib.sha256(candidate.read_bytes()).hexdigest()==q['candidateSvgSha256'],'Candidate changed since native QA'
 final=E.tostring(E.parse(candidate).getroot(),encoding='utf-8',xml_declaration=False);(p/'final.svg').write_bytes(final)
 # The comparison tool normalizes both renderer inputs identically. Removing only XML declaration is pixel-lossless.
 assert E.tostring(E.fromstring(final),encoding='utf-8',xml_declaration=True)==normal
 subprocess.run([sys.executable,'tools/vector-production/import-svg.py',str(p/'final.svg'),'--config',str(p/'config.json'),'--output',str(p/'native.json')],check=True)
 assert json.loads((p/'native.json').read_text())==json.loads((p/'native-candidate-contact.json').read_text()),'Final import differs from measured native candidate'
 raw=(p/'authored-raw.svg').read_bytes();row={'part':name,'rawBytes':len(raw),'finalBytes':len(final),'nativeBytes':(p/'native.json').stat().st_size,'reductionPercent':100*(1-len(final)/len(raw)),'qualityPass':True,'errors':q['errors'],'priorBboxStandaloneDiagnosticQualityPass':standalone['qualityPass'],'shippingComparisonConfig':q['config'],'losslessXmlDeclarationRemoval':True,'normalizedRendererInputSha256':hashlib.sha256(normal).hexdigest(),'hashes':{f:hashlib.sha256((p/f).read_bytes()).hexdigest() for f in ['source.png','authored-raw.svg','authored-raw.svg.gz','final.svg','native.json','submitted-prompt.json','config.json','pixel-config.json']}}
 (p/'final-report.json').write_text(json.dumps(row,indent=2));rows.append(row)
r=sum(x['rawBytes'] for x in rows);f=sum(x['finalBytes'] for x in rows);assert f/r<=.7,(r,f)
report={'stage':15,'parts':rows,'rawPackBytes':r,'finalSvgPackBytes':f,'reductionPercent':100*(1-f/r),'nativeUnclippedPackBytes':sum(x['nativeBytes'] for x in rows),'limitsUnchanged':True,'preservedExtremaReason':'Compound bbox drift changed antialiasing of otherwise exact protected curves. Exact extrema retained.','scope':'Immutable RAW and final through identical actual native canonical clip/contact-inset and authored opaque base composition. Standalone diagnostics retained without relabeling. No browser or gameplay-clear claim.'};(base/'final-pack-report.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='parts'}))
