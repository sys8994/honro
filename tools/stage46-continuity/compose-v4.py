from pathlib import Path
from lxml import etree as E
import copy,subprocess,os,json
R=Path(__file__).resolve().parents[2];o=R/'art/stage46-continuity/v4';S='{http://www.w3.org/2000/svg}'
env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'}
def execute(t,src,dst,acts):
 t.write(str(src));acts+=['select-clear','export-plain-svg',f'export-filename:{dst}','export-do'];p=subprocess.run(['/usr/bin/inkscape',str(src),'--batch-process','--actions='+';'.join(acts)],env=env,capture_output=True,text=True);src.with_suffix('.log').write_text(p.stdout+'\n'+p.stderr);p.check_returncode()
# v4 deliberately retains v3 composed canonical alpha unchanged.
# Exact Inkscape space partition, not string subpath splitting (holes preserved).
t=E.parse(str(o/'color-registered-raw.svg'));acts=[]
for i,e in enumerate(t.findall('.//{*}path')):
 parent=e.getparent();parent.remove(e)
 for j,(x,w) in enumerate([(-1250,850),(-400,800),(400,800),(1200,1200)]):
  a=copy.deepcopy(e);aid=f'face-{i}-{j}';a.set('id',aid);parent.append(a);mid=f'window-{i}-{j}';E.SubElement(parent,S+'path',id=mid,d=f'M{x} -100h{w}v3900h{-w}Z',style='fill:#000');acts+=['select-clear',f'select-by-id:{aid},{mid}','path-intersection']
execute(t,o/'color-partition-input.svg',o/'color-partition-raw.svg',acts)
