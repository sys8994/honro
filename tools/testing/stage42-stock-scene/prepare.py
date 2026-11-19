"""CI-only package extraction/composition. Production files are read, never modified."""
import json,sys,hashlib,copy
from pathlib import Path
root,out=map(Path,sys.argv[1:3]);out.mkdir(parents=True,exist_ok=True)
def compact(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
if len(sys.argv)==3:
 assets=[json.loads((root/'shared/assets/environment/act5'/file).read_text()) for file in ['stage42-registered-body.json','stage42-surface.json']]
 p={'assets':assets};data=compact(p)
 assert hashlib.sha256(data).hexdigest()=='ec3172af1360b8b55aeda442f4ed57a5f4a5bf85fce94287a0ed86f54c16ce8b','Source baseline mismatch'
 (out/'baseline-package.json').write_bytes(data)
else:
 b=json.loads((out/'baseline-package.json').read_text());a=json.loads((out/'candidate-e18.json').read_text());c=json.loads((out/'candidate-e12.json').read_text());hybrid={'assets':[a['assets'][0],c['assets'][1]]}
 def strip(v):
  if isinstance(v,dict):
   if v.get('tag')=='path':v.pop('d',None);v.pop('dParts',None)
   for q in v.values():strip(q)
  elif isinstance(v,list):
   for q in v:strip(q)
 x,y=copy.deepcopy(b),copy.deepcopy(hybrid);strip(x);strip(y);assert x==y,'Changed non-path state'
 sys.path.insert(0,str(root/'tools/terrain-node-optimizer'));from growth_guard import package_metrics
 before,after=package_metrics(compact(b)),package_metrics(compact(hybrid))
 assert before['segments']==30928 and after['segments']==20866,(before,after)
 (out/'hybrid-18-12.json').write_bytes(compact(hybrid))
 (out/'hybrid-summary.json').write_text(json.dumps({'source_bytes':len(compact(b)),'candidate_bytes':len(compact(hybrid)),'source':before,'candidate':after,'all_except_path_data_exact':True},indent=2))
