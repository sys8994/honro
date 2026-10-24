"""Exact approved deletion inventory, preserved inputs and temp-only far tool outputs."""
import hashlib,json,subprocess,tempfile
from pathlib import Path
from PIL import Image,__version__ as pillow
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'_local/reports/retired-art-assets-p23';OUT.mkdir(parents=True,exist_ok=True)
inv=json.loads((ROOT/'game/docs/retired-art-assets-p23-20261024/inventory.json').read_text());base=inv['base']
def blob(raw):return hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
for row in inv['files']:
 assert not (ROOT/row['path']).exists(),row['path']
 raw=subprocess.check_output(['git','show',base+':'+row['path']],cwd=ROOT)
 assert len(raw)==row['bytes'] and blob(raw)==row['blob'],row['path']
for row in inv['preserved']:
 raw=(ROOT/row['path']).read_bytes();assert blob(raw)==row['blob'],row['path']
deleted=set(subprocess.check_output(['git','diff','--name-only','--diff-filter=D',base],cwd=ROOT,text=True).splitlines());assert deleted=={r['path'] for r in inv['files']}
# Every other authored asset, fixture/migration input and current game source stays unchanged.
remaining=subprocess.check_output(['git','diff','--name-only','--diff-filter=AM',base,'--','shared/assets','shared/runtime','shared/data','shared/engine','shared/map','game/src','tests/fixtures','game/tests/fixtures','migration'],cwd=ROOT,text=True).splitlines();assert not remaining,remaining
for path in ['shared/assets/environment/rest-stage10','tools/environment/rest-stage10-assets.py']:
 subprocess.run(['git','diff','--exit-code',base,'--',path],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
operations=[
 ('tools/environment/painted-pilot-assets.py','pilots',[
 ('shared/assets/environment/location-far/source/mountain-dusk.png','stage1-mountain-dusk.webp',(2048,683)),
 ('shared/assets/environment/location-far/source/mountain-wet-valley.png','stage2-wet-valley.webp',(2048,1024)),
 ('shared/assets/environment/painted-pilots/source/stage18-rear.png','stage18-rear.webp',(1920,768)),
 ('shared/assets/environment/painted-pilots/source/stage27-rear.png','stage27-rear.webp',(1774,887))]),
 ('tools/environment/stage4-assets.py','stage4',[('shared/assets/environment/location-far/source/mountain-still-night.png','still-night.webp',(2048,1024))]),
 ('tools/map-forge/stage21-painted-assets.py','stage21',[('shared/assets/environment/stage21-painted/source/far-panorama.png','far.webp',(2048,683))])]
rows=[]
with tempfile.TemporaryDirectory(prefix='honro-p23-') as tmp:
 for tool,folder,items in operations:
  dest=Path(tmp)/folder
  for source,_,_ in items:assert (ROOT/source).is_file(),source
  subprocess.run(['python3',str(ROOT/tool),'--output-dir',str(dest)],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
  assert sorted(p.name for p in dest.iterdir())==sorted(x[1] for x in items)
  owner={'pilots':'painted-pilots','stage4':'stage4','stage21':'stage21'}[folder]
  for source,name,limit in items:
   generated=(dest/name).read_bytes();approved=(ROOT/'shared/assets/environment'/owner/name).read_bytes();im=Image.open(dest/name)
   assert im.width<=limit[0] and im.height<=limit[1];same=generated==approved
   rows.append({'tool':tool,'source':source,'output':name,'size':list(im.size),'mode':im.mode,'bytes':len(generated),'sha256':hashlib.sha256(generated).hexdigest(),'matchesApproved':same})
assert all(r['matchesApproved'] for r in rows),rows
result={'deletedFiles':len(inv['files']),'deletedBytes':sum(r['bytes'] for r in inv['files']),'inventoryExact':True,'preservedExceptionsExact':len(inv['preserved']),'allOtherAssetsAndGameCodeUnchanged':True,'pillow':pillow,'temporaryToolOutputs':rows,'approvedAssetsOverwritten':False};(OUT/'assets.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
