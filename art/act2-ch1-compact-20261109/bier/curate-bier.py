"""Move this asset's generated checks to ignored reports; preserve art sources.
Every source/target is verified under this asset or its named report/archive.
No deletion, active source changes, or cross-shell filesystem commands.
"""
from pathlib import Path
import shutil,json
base=Path(__file__).resolve().parent;root=Path.cwd().resolve();reports=(root/'_local/reports/act2-redesign-20261109/bier').resolve();archive=(root/'_local/archive/act2-redesign-20261109/bier').resolve()
assert base.is_relative_to(root/'art') and base.name=='bier'
assert reports.is_relative_to(root/'_local/reports') and archive.is_relative_to(root/'_local/archive')
moves=json.loads((base/'RELOCATION.json').read_text(encoding='utf-8'))['moves'] if (base/'RELOCATION.json').exists() else []
def move(src,dst):
 src=src.resolve();dst=dst.resolve();assert src.is_relative_to(base);assert dst.is_relative_to(reports)or dst.is_relative_to(archive)
 if src.is_dir() and dst.is_dir():
  for child in list(src.iterdir()):move(child,dst/child.name)
  return
 if dst.exists():raise RuntimeError('Preserve existing destination: '+str(dst))
 dst.parent.mkdir(parents=True,exist_ok=True);shutil.move(str(src),str(dst));moves.append({'from':str(src.relative_to(base)),'to':str(dst.relative_to(root))})
for d in list(base.iterdir()):
 if not d.is_dir():continue
 if d.name.startswith(('native-','roi-')) and d.name not in ['roi-sources','roi-flower-sources','roi-flower-component-sources','roi-flower-tight-sources']:
  for f in list(d.iterdir()):
   if f.is_dir()or f.suffix in ['.png','.log','.json']or f.name.endswith('-input.svg'):move(f,reports/d.name/f.name)
 elif d.name.startswith('authored-'):
  for f in list(d.iterdir()):
   if f.is_dir()or f.suffix in ['.png','.log','.json']:move(f,reports/d.name/f.name)
 elif d.name.startswith('optimized-'):
  for f in list(d.iterdir()):
   if f.is_dir()or f.suffix in ['.png','.log','.json']:move(f,reports/d.name/f.name)
for name in ['roi-center-native24','roi-west-native24','roi-east-native24','roi-sources','roi-flower-center-native16','authored-v1','authored-v2','authored-v3','optimized-v1','optimized-v2','optimized-v3','runtime','runtime-v2','runtime-v3','authored-v4','optimized-v4','runtime-v4','roi-flower-center-native16-component','roi-flower-component-sources']:
 d=base/name
 if d.exists():move(d,archive/name)
for name in ['precision-6.svg']:
 d=base/'optimized-v5'/name
 if d.exists():move(d,archive/'optimized-v5'/name)
(base/'RELOCATION.json').write_text(json.dumps({'paths':'Original artifact-relative -> current repository-relative. Selected art RAW/final remains in art; failed candidate art in archive; generated checks in reports.','moves':moves},indent=2))
print(json.dumps({'moved':len(moves),'reports':str(reports),'archive':str(archive)}))
