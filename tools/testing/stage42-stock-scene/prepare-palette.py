"""Deterministic paint-only refinement of the preserved continuity topology."""
from pathlib import Path
import json,copy,hashlib,runpy,sys
here=Path(__file__).parent
runpy.run_path(str(here/'prepare-continuity.py'),run_name='__main__')
out=Path(sys.argv[2]);enc=lambda x:json.dumps(x,ensure_ascii=False,separators=(',',':')).encode();sha=lambda x:hashlib.sha256(enc(x)).hexdigest()
old=json.loads((out/'continuity-candidate.json').read_text());assert sha(old)=='46a2cae054d4f7ebbd1bf0c3054381bdcd15c1f4e50a6bf8a929c8ed68aed61c'
mod=copy.deepcopy(old);mapping=json.loads((here/'palette-study.json').read_text())['mapping']
paths=mod['assets'][0]['vector']['root']['children'][1]['children'][0]['children'];assert len(paths)==14
before=[copy.deepcopy(p)for p in paths]
for p in paths:p['fill']=mapping[p['fill']]
for a,b in zip(before,paths):
 aa=copy.deepcopy(a);bb=copy.deepcopy(b);aa.pop('fill');bb.pop('fill');assert aa==bb
rest=copy.deepcopy(mod)
rest['assets'][0]['vector']['root']['children'][1]['children'][0]['children']=before
assert rest==old,'Any non-fill change prohibited'
(out/'palette-candidate.json').write_bytes(enc(mod))
(out/'palette-reconstruction.json').write_text(json.dumps({'continuitySha256':sha(old),'paletteSha256':sha(mod),'geometryMasksCoverageMetadataUnchanged':True,'only14NewPaintFieldsChanged':True,'originalBodyAndSurfaceUnchanged':True,'mapping':mapping},indent=2))
