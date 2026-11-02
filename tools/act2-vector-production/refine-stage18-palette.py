"""Explicit art direction edit, not lossless to generated source: quarry cap toned slate."""
from pathlib import Path
import json,sys,gzip,hashlib,subprocess
b=Path(sys.argv[1]);rows=[]
for p in [b/x for x in ['domain-v1','floor-v1','west-v1','east-v1']]:
 original=(p/'trace/raw.svg').read_bytes();assert b'#88887e'in original
 (p/'original-trace.svg.gz').write_bytes(gzip.compress(original,mtime=0))
 for name in ['authored-raw.svg','candidate-bbox.svg']:
  s=(p/name).read_text();assert '#88887e'in s;s=s.replace('#88887e','#68777b');(p/name).write_text(s)
 (p/'authored-raw.svg.gz').write_bytes(gzip.compress((p/'authored-raw.svg').read_bytes(),mtime=0))
 for source,target in [('authored-raw.svg','native-raw.json'),('candidate-bbox.svg','native-candidate.json')]:subprocess.run([sys.executable,'tools/vector-production/import-svg.py',str(p/source),'--config',str(p/'config.json'),'--output',str(p/target)],check=True)
 rows.append({'part':p.name,'originalTraceSha256':hashlib.sha256(original).hexdigest(),'originalTraceBytes':len(original),'authoredRawBytes':(p/'authored-raw.svg').stat().st_size,'authoredRawSha256':hashlib.sha256((p/'authored-raw.svg').read_bytes()).hexdigest()})
(b/'palette-refinement.json').write_text(json.dumps({'reason':'Reduce dominant beige cap at original actor92 scale; consistent slate stone, NOT lossless to source','mapping':{'#88887e':'#68777b'},'originalSourceAndTraceUnchanged':True,'comparisonBaseline':'Explicit authored palette RAW against equivalently recolored optimized output','parts':rows},indent=2))
