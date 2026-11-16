from pathlib import Path
from lxml import etree as E
import copy,subprocess,os,json
R=Path(__file__).resolve().parents[2];o=R/'art/stage46-continuity/v3';S='{http://www.w3.org/2000/svg}'
env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'}
def execute(t,src,dst,acts):
 t.write(str(src));acts+=['select-clear','export-plain-svg',f'export-filename:{dst}','export-do'];p=subprocess.run(['/usr/bin/inkscape',str(src),'--batch-process','--actions='+';'.join(acts)],env=env,capture_output=True,text=True);src.with_suffix('.log').write_text(p.stdout+'\n'+p.stderr);p.check_returncode()
# The alpha is original outer-wall silhouette inside the old image, traced extended geology outside it.
t=E.parse(str(o/'alpha-registered-raw.svg'));r=t.getroot();acts=[]
for i,e in enumerate(t.findall('.//{*}path')):
 e.set('id',f'generated-{i}');E.SubElement(e.getparent(),S+'path',id=f'hole-{i}',d='M0 -100H1024V1536H0Z',style='fill:#000');acts+=['select-clear',f'select-by-id:generated-{i},hole-{i}','path-difference']
src=json.load(open(R/'_local/stage46/source.json'))
for key in ['a','b']:E.SubElement(r,S+'path',id='original-'+key,d=' '.join(src['vector']['clips'][key]),style='fill:#000')
acts+=['select-all','path-union'];execute(t,o/'alpha-compose-input.svg',o/'alpha-composed-raw.svg',acts)
# Exact Inkscape space partition, not string subpath splitting (holes preserved).
t=E.parse(str(o/'color-registered-raw.svg'));acts=[]
for i,e in enumerate(t.findall('.//{*}path')):
 parent=e.getparent();parent.remove(e)
 for j,(x,w) in enumerate([(-1250,850),(-400,800),(400,800),(1200,1200)]):
  a=copy.deepcopy(e);aid=f'face-{i}-{j}';a.set('id',aid);parent.append(a);mid=f'window-{i}-{j}';E.SubElement(parent,S+'path',id=mid,d=f'M{x} -100h{w}v3900h{-w}Z',style='fill:#000');acts+=['select-clear',f'select-by-id:{aid},{mid}','path-intersection']
execute(t,o/'color-partition-input.svg',o/'color-partition-raw.svg',acts)
