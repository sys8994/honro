"""Join all nine independent camera jobs. No partial evidence can pass."""
from pathlib import Path
import hashlib,json,argparse,shutil
from PIL import Image
from snapshot_c import checked_proof
H=Path(__file__).resolve().parent
def j(p):return json.loads(p.read_bytes())
def sha(b):return hashlib.sha256(b).hexdigest()
p=argparse.ArgumentParser();p.add_argument('shots',type=Path);p.add_argument('bundle',type=Path);p.add_argument('out',type=Path);a=p.parse_args()
gpath=a.bundle/'C-GRAPH.json';paths=checked_proof(gpath);graph=j(gpath)
seal=j(a.bundle/'runtime-snapshot.json')['seal']['C-GRAPH.json']
assert seal=={'bytes':gpath.stat().st_size,'sha256':sha(gpath.read_bytes())}
P=j(H/'pins.json');groups=(4,5,6,10)
rows=[r for i in groups for r in j(H/f'rows-{i}.json')]
assert len(rows)==84
def key(g,s,v,w):return g,s,v,w
def wanted(r):q=r['q'];return key(r['group'],q['stage'],q['view'],q['width'])
assert len({wanted(r)for r in rows})==84
found={}
for n in range(9):
 d=a.shots/f'final-c-act1-shard-{n}'
 report=j(d/'ACT1-FINAL-C.json');signed=rows[n::9]
 assert len(report)==len(signed)==(10 if n<3 else 9),n
 expectedPNGs=set()
 for obs,row in zip(report,signed):
  q=row['q'];k=key(obs['group'],obs['stage'],obs['view'],obs['width'])
  assert k not in found and k==wanted(row) and obs['pass'] is True,k
  obs=obs.copy();detail=obs['detail']
  assert detail['noErrors'] is True and set(detail['repeat'])=={'raw','dom'} and all(n==0 for n in detail['repeat'].values()),k
  for field,v in row['proof'].items():assert detail[field]==v,(k,field)
  needed={P['roles'][r] for r in ('entry','manifest','loader')}|set(graph['leaves'][str(q['stage'])].values())|{x['path']for x in graph['compiled']}|set(P['fontAuthority'])
  assert needed<=detail['http'].keys()<=paths.keys(),k
  for path,v in detail['http'].items():
   if v['status']==206:assert path in P['staticAudio'],(k,path)
   else:assert v=={'status':200,'sha256':paths[path]['sha256']},(k,path)
  assert set(detail['png'])=={'raw','dom'}
  for kind in ('raw','dom'):
   name=f'C-s{q["stage"]:02}-{q["width"]}-{q["view"]}-{kind}.png';f=d/name
   assert sha(f.read_bytes())==detail['png'][kind],(k,name,'transport PNG digest')
   im=Image.open(f).convert('RGBA')
   assert {'size':list(im.size),'rgbaSHA256':sha(im.tobytes())}==row['images'][kind],(k,name,'decoded signed frame')
   expectedPNGs.add(name)
  found[k]=obs
 assert {f.name for f in d.glob('*.png')}==expectedPNGs,n
assert len(found)==84
a.out.mkdir(exist_ok=False)
(a.out/'act1').mkdir()
(a.out/'act1/ACT1-FINAL-C.json').write_text(json.dumps([found[wanted(r)]for r in rows],indent=2)+'\n')
shutil.copyfile(gpath,a.out/'C-GRAPH.json')
print('84 unique current C camera cases, 168 original PNGs, and immutable browser state/HTTP/graph receipts strictly verified.')
