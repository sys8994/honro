"""Move only this owned join prototype's generated checks/rejected art.
All resolved paths are checked under the named own/report/archive directories.
Original parent source/final/foundation files are never moved or edited.
"""
from pathlib import Path
import shutil,json
base=Path(__file__).resolve().parent;root=Path.cwd().resolve();reports=(root/'_local/reports/act2-redesign-20261109/ground-body-join').resolve();archive=(root/'_local/archive/act2-redesign-20261109/ground-body-join').resolve();assert base.is_relative_to(root/'art')and base.name=='join-candidates'and base.parent.name=='ground-body';assert reports.is_relative_to(root/'_local/reports')and archive.is_relative_to(root/'_local/archive');moves=[]
def move(src,dst):
 src=src.resolve();dst=dst.resolve();assert src.is_relative_to(base)and(dst.is_relative_to(reports)or dst.is_relative_to(archive))
 if src.is_dir()and dst.is_dir():
  for c in list(src.iterdir()):move(c,dst/c.name)
  return
 if dst.exists():raise RuntimeError('Preserve existing destination '+str(dst))
 dst.parent.mkdir(parents=True,exist_ok=True);shutil.move(str(src),str(dst));moves.append({'from':str(src.relative_to(base)),'to':str(dst.relative_to(root))})
native=base/'native-visible'
for f in list(native.iterdir()):
 if f.is_dir()or f.suffix=='.log'or f.name=='derivation.json':move(f,reports/'native-visible'/f.name)
for name in ['mineral-clip.log','source-id-normalization.json']:
 f=base/name
 if f.exists():move(f,reports/name)
old=base/'optimization-v1'
if old.exists():move(old,archive/'optimization-v1')
opt=base/'optimization-v2'
for f in list(opt.iterdir()):
 if f.name.startswith(('native-simplify-','precision-6-lower')):move(f,archive/'optimization-v2'/f.name)
for name in ['candidate-A.asset.json','candidate-B.asset.json','candidate-B-authored.svg','candidate-B-v2.asset.json','candidate-B-v2-authored.svg','candidate-B-v3-authored.asset.json','nonoverlap-solid-control.asset.json','engine-authored-raw.json']:
 f=base/name
 if f.exists():move(f,archive/name)
pycache=base/'__pycache__'
if pycache.exists():move(pycache,reports/'python-cache')
(base/'RELOCATION.json').write_text(json.dumps({'paths':'Original owned-folder relative -> repository-relative current report/archive. Selected RAW/final/native art inputs stay in art.','moves':moves},indent=2),encoding='utf-8');print(json.dumps({'moves':len(moves),'reports':str(reports)}))
