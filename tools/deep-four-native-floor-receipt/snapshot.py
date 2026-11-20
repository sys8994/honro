"""Read-only serving closure: full built web + actual top-level assets, not source."""
import json,sys,tarfile
from pathlib import Path
from dag import sha,references
D=Path(__file__).parent
E=json.loads((D/'expected.json').read_text())
def tree(root):
 lis=[]
 for rel in ('HONRO.html','web','assets'):
  p=root/rel
  assert p.exists() and not p.is_symlink()
  lis.extend([p] if p.is_file() else (f for f in p.rglob('*') if not f.is_dir()))
 assert lis and all(f.is_file() and f.resolve().is_relative_to(root.resolve()) and not f.is_symlink() for f in lis)
 return {f.relative_to(root).as_posix():[f.stat().st_size,sha(f.read_bytes())]for f in sorted(lis)}
def pack(stock,target,out):
 root=[stock,target]; names=('stock','target')
 m={key:tree(w) for key,w in zip(names,root)}
 for k,w in zip(names,root):
  d=json.loads((out/(k+'-built-dag.json')).read_text())
  assert sha((w/'HONRO.html').read_bytes())==d['htmlSHA256']
  assert all(m[k][p]==[v['bytes'],v['sha256']]for p,v in d['reachable'].items())
  with tarfile.open(out/(k+'-serving-root.tar.gz'),'w:gz',compresslevel=3) as t:
   for rel in m[k]:
    t.add(w/rel,arcname=rel,recursive=False)
 a,b=m.values();g=json.loads((out/'approved-dag-diff.json').read_text())
 # The stock and candidate game reachable DAG was checked above. Full serving
 # roots may also contain unrelated (e.g. workshop entry) outputs, which are
 # packaged exactly but never exempt any unexpected live game response.
 commonAssets={k for k in a if k.startswith(('assets/','web/fonts/'))}
 assert commonAssets=={k for k in b if k.startswith(('assets/','web/fonts/'))} and all(a[k]==b[k] for k in commonAssets)
 assert set(g['removed'])<=set(a)-set(b) and set(g['added'])<=set(b)-set(a)
 gameAllowed=set(g['removed']+g['added']+['HONRO.html'])
 extra={k:{'stock':a.get(k),'target':b.get(k)}for k in (set(a)|set(b))-gameAllowed if a.get(k)!=b.get(k)}
 (out/'non-game-serving-delta.json').write_text(json.dumps(extra,indent=2,sort_keys=True)+'\n')
 (out/'serving-tree-sha.json').write_text(json.dumps(m,indent=2)+'\n')
 for k,v in m.items():print(k,len(v),sum(x[0]for x in v.values()))
def unpack(stock,target,archive):
 m=json.loads((archive/'serving-tree-sha.json').read_text())
 for k,w in zip(('stock','target'),(stock,target)):
  w.mkdir();names=set()
  with tarfile.open(archive/(k+'-serving-root.tar.gz'),'r:gz') as t:
   for x in t:
    rel=Path(x.name)
    assert x.isfile() and str(rel) in m[k] and str(rel) not in names and not rel.is_absolute() and '..' not in rel.parts
    f=w/rel;f.parent.mkdir(parents=True,exist_ok=True)
    data=t.extractfile(x).read();assert [len(data),sha(data)]==m[k][str(rel)]
    f.write_bytes(data);names.add(str(rel))
  assert names==set(m[k])
  d=references(w);d.pop('referenceDocument')
  archived=json.loads((archive/(k+'-built-dag.json')).read_text())
  archived['selected']={int(s):v for s,v in archived['selected'].items()}
  assert d==archived
if __name__=='__main__':
 mode,*x=sys.argv[1:]
 (pack if mode=='pack' else unpack if mode=='unpack' else sys.exit)(*map(Path,x))
