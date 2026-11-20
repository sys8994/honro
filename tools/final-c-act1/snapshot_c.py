"""Single verified normal-C runtime copy; no source/browser transformations."""
from pathlib import Path,PurePosixPath
import argparse,hashlib,json,re,tarfile,shutil
H=Path(__file__).resolve().parent;P=json.loads((H/'pins.json').read_bytes())
def digest(o):return hashlib.sha256(json.dumps(o,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def file_hash(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1<<20),b''):h.update(b)
 return h.hexdigest()
def checked_proof(g):
 d=json.loads(g.read_bytes());assert d['source']==P['candidate'] and d['roles']==P['roles'] and d['leaves']==P['leaves'] and d['compiled']==P['compiled']
 assert d['htmlSHA256']==P['htmlSHA256']
 web={k:v for k,v in d['all'].items() if k.startswith('web/')}
 audio={k:{'bytes':v[0],'sha256':v[1]}for k,v in P['staticAudio'].items()}
 assert len(web)==P['allRows'] and digest(web)==P['extensionDAGSHA256']
 assert {k:v for k,v in d['all'].items() if k not in web}==audio
 assert all(re.fullmatch(r'web/(?:data|entries|fonts|graphics|runtime|styles)/[a-zA-Z0-9_.-]+\.[0-9a-f]{16}\.[a-zA-Z0-9]+',p) for p in web)
 return web|audio|{'HONRO.html':{'sha256':d['htmlSHA256']}}
def pack(root,bundle,graph):
 paths=checked_proof(graph)
 bundle.mkdir(exist_ok=False)
 tar=bundle/'final-c-runtime.tar.gz'
 with tarfile.open(tar,'w:gz',compresslevel=1) as z:
  for p,w in sorted(paths.items()):
   f=root/p
   assert f.is_file() and not f.is_symlink() and f.resolve().is_relative_to(root.resolve()) and file_hash(f)==w['sha256'],p
   info=tarfile.TarInfo(p);info.size=f.stat().st_size
   assert info.size==w.get('bytes',info.size)
   with f.open('rb') as src:z.addfile(info,src)
 shutil.copyfile(graph,bundle/'C-GRAPH.json')
 seals={p:{'sha256':file_hash(bundle/p),'bytes':(bundle/p).stat().st_size}for p in ('C-GRAPH.json',tar.name)}
 (bundle/'runtime-snapshot.json').write_text(json.dumps({'source':P['candidate'],'files':len(paths),'seal':seals},indent=2)+'\n')
def unpack(root,bundle):
 pins=json.loads((bundle/'runtime-snapshot.json').read_bytes())
 assert pins['source']==P['candidate'] and set(pins['seal'])=={'C-GRAPH.json','final-c-runtime.tar.gz'}
 for p,v in pins['seal'].items():
  f=bundle/p;assert f.is_file() and not f.is_symlink() and f.stat().st_size==v['bytes'] and file_hash(f)==v['sha256']
 paths=checked_proof(bundle/'C-GRAPH.json');assert len(paths)==pins['files']
 root.mkdir(exist_ok=False);seen=set()
 with tarfile.open(bundle/'final-c-runtime.tar.gz','r|gz') as z:
  for m in z:
   q=PurePosixPath(m.name);p=m.name
   assert p in paths and p not in seen and q.as_posix()==p and not q.is_absolute() and '..' not in q.parts and m.isfile() and not m.issym() and not m.islnk(),p
   w=paths[p];assert m.size==w.get('bytes',m.size) and m.size<=200_000_000,p
   f=root/p;f.parent.mkdir(parents=True,exist_ok=True)
   with z.extractfile(m) as r,f.open('xb') as out:shutil.copyfileobj(r,out,1<<20)
   assert file_hash(f)==w['sha256'],p
   seen.add(p)
 assert seen==set(paths)
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('phase',choices=['pack','unpack']);a.add_argument('root',type=Path);a.add_argument('bundle',type=Path);a.add_argument('--graph',type=Path);a=a.parse_args()
 if a.phase=='pack':assert a.graph;pack(a.root,a.bundle,a.graph)
 else:unpack(a.root,a.bundle)
