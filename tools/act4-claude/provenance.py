#!/usr/bin/env python3
"""Hash the actual geometry, canonical world, runtime/build and asset inputs."""
import hashlib,importlib.metadata,json,os,pathlib,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parents[2]
def digest(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def python_dependencies():
 result={}
 for name in ('numpy','shapely','Pillow'):
  try:result[name]=importlib.metadata.version(name)
  except importlib.metadata.PackageNotFoundError:result[name]=None
 if result['shapely']:
  import shapely
  result['GEOS']=shapely.geos_version_string
 return result
def snapshot(n,directory):
 world=ROOT/'shared/data/act4/world.json';parts=ROOT/'shared/data/act4/world.parts';m=json.loads((parts/'manifest.json').read_text())
 if m.get('version')!=1 or m.get('encoding')!='utf-8' or not m.get('parts'):raise ValueError('Invalid world manifest')
 combined=hashlib.sha256();total=0
 for i,item in enumerate(m['parts']):
  if item['file']!=f'part-{i:03}.jsonpart':raise ValueError('Invalid world part order')
  p=parts/item['file']
  if p.parent!=parts or not p.is_file() or p.stat().st_size!=item['bytes'] or digest(p)!=item['sha256']:raise ValueError('Act4 world part mismatch: '+str(p))
  with p.open('rb') as f:
   for chunk in iter(lambda:f.read(1024*1024),b''):combined.update(chunk);total+=len(chunk)
 if total!=m['bytes'] or combined.hexdigest()!=m['sha256']:raise ValueError('Combined world parts mismatch')
 if not world.is_file() or world.stat().st_size!=m['bytes'] or digest(world)!=m['sha256']:raise ValueError('world.json differs from canonical world parts')
 paths=[]
 for name in ('shared','game/engine','game/vendor','game/config','game/src','game/docs/equipment','tools','workshop','art','assets'):
  base=ROOT/name
  if not base.is_dir():raise FileNotFoundError(base)
  paths.extend(p for p in base.rglob('*') if p.is_file() and '__pycache__' not in p.parts)
 for name in ('game/tests/helpers.mjs','game/node_modules/typescript/lib/typescript.js','package.json','package-lock.json','game/package.json','game/package-lock.json'):
  p=ROOT/name
  if not p.is_file():raise FileNotFoundError(p)
  paths.append(p)
 h=hashlib.sha256();assets=hashlib.sha256();engine=hashlib.sha256()
 for p in sorted(set(paths),key=lambda p:p.relative_to(ROOT).as_posix()):
  rel=p.relative_to(ROOT).as_posix();entry=rel.encode()+b'\0'+bytes.fromhex(digest(p));h.update(entry)
  (assets if rel.startswith(('shared/assets/','shared/data/','game/docs/equipment/','art/','assets/')) else engine).update(entry)
 stage=directory/'stage.json';blueprint=directory/'blueprint.json';layout=ROOT/f'tools/act4-pilot/layouts/stage{n}-claude.json'
 for p in (stage,blueprint,layout):
  if not p.is_file():raise FileNotFoundError(p)
 if json.loads(blueprint.read_text()) != json.loads(layout.read_text()):raise ValueError('Blueprint differs from current layout')
 return {'version':1,'stage':str(n),'worldSha256':m['sha256'],'sourceSha256':h.hexdigest(),'assetsSha256':assets.hexdigest(),'engineBuildSha256':engine.hexdigest(),'stageSha256':digest(stage),'blueprintSha256':digest(blueprint),'layoutSha256':digest(layout),'nodeVersion':subprocess.check_output(['node','--version'],text=True).strip(),'pythonVersion':sys.version,'pythonDependencies':python_dependencies()}
if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('usage: provenance.py STAGE REPORT_DIR')
 print(json.dumps(snapshot(sys.argv[1],pathlib.Path(sys.argv[2])),sort_keys=True))
