"""Populate a detached QA harness directory with pinned Git object files; no writes to Git refs."""
import argparse, json, subprocess
from pathlib import Path
from prepare import blob, require
here=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('repo',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
P=json.loads((here/'PINS.json').read_text())
h=json.loads((here/'STAGE42-BOUNDS-HUNK.json').read_text())
def show(sha,path):
    return subprocess.check_output(['git','-C',str(a.repo),'show',f'{sha}:{path}'])
def store(path,b,expected):
    require(blob(b)==expected,path,'wrong Git byte identity',blob(b),expected)
    f=a.output/path
    f.parent.mkdir(parents=True,exist_ok=True)
    f.write_bytes(b)
base=P['base']
geometry='098419896fca823f35843bc3633140a058b5b7c9'
review='571d5f16340e4e75eaa3f04993ee531fbc3dbf84'
renderer='shared/runtime/renderer.js'
edge='shared/runtime/act5-edge-art.js'
body='shared/assets/environment/act5/stage42-registered-body.json'
require(not a.output.exists() or not any(a.output.iterdir()),'material target must be empty disposable directory')
base_paths=P['baselineDependencies'] | {renderer:P['renderer']}
for name,expected in base_paths.items():
    if name!=edge:store('fixture/'+name,show(base,name),expected)
for name,expected in P['stage42ChangedPaths'].items():
    if name!=edge:store('fixture/'+name,show(review,name),expected)
raw=show(base,edge)
old,new=[h[k].encode() for k in ('replaceExactlyOnce','with')]
require(blob(raw)==P['baselineDependencies'][edge] and raw.count(old)==1 and new not in raw,'old exact single hunk')
store('fixture/'+edge,raw.replace(old,new),P['stage42ChangedPaths'][edge])
store('approved42.json',show(geometry,body),P['approved42'])
print('Pinned local materials restored. Nothing written to product sources, commits, or Git refs.')
