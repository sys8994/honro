"""Undo depth-only stretching in near fields; preserve existing near-camera points.
Prepared as a separate study awaiting isotropic deep-field composition.
"""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Line
import math,re,copy,json
ROOT=Path(__file__).resolve().parents[2];v3=ROOT.parent/'stage43-source-fields-v3';v4=ROOT.parent/'stage43-source-fields-v4';out=ROOT.parent/'stage43-source-fields-isotropic-upper';out.mkdir(exist_ok=True);ns='{http://www.w3.org/2000/svg}'
def unwarp(y,name):
 s=2172/1254 if name=='center' else 1740/1254
 base=710+s*280 if name=='center' else s*700
 k=(5300-(710+s*(1254-420)))/(554**2) if name=='center' else (5300-s*1254)/(554**2)
 if y<=base:return y
 u=2*(y-base)/(s+math.sqrt(s*s+4*k*(y-base)))
 return base+s*u

def convert(node,name):
 d=node.get('d');parts=[];cursor=0j
 for raw in re.findall('[Mm][^Mm]*',d):
  p=parse_path(raw,current_pos=cursor);assert all(isinstance(z,Line) for z in p)
  closed=bool(re.search('[zZ]\\s*$',raw));pts=[p[0].start]+[q.end for q in p];fmt=lambda z:f'{z.real:.3f},{unwarp(z.imag,name):.3f}'
  parts.append('M'+fmt(pts[0])+'L'+' '.join(fmt(z) for z in pts[1:])+('Z' if closed else ''));cursor=p[0].start if closed else p[-1].end
 node.set('d',' '.join(parts))
t=E.parse(str(v4/'color-combined.svg'))
for g in t.findall('.//'+ns+'g'):
 name=g.get('id').replace('field-','')
 for p in g.findall('.//'+ns+'path'):convert(p,name)
t.write(str(out/'color-combined.svg'))
a=E.Element(ns+'svg',nsmap={None:ns[1:-1]},viewBox='-1600 0 5372 5300',width='5372',height='5300')
for name in ['center','left','right']:
 path=v4/'left-alpha.svg' if name=='left' else v3/(name+'-alpha-final.svg')
 tree=E.parse(str(path))
 for i,p in enumerate(tree.findall('.//'+ns+'path')):
  p=copy.deepcopy(p);convert(p,name);p.set('id',name+'-alpha-'+str(i));a.append(p)
E.ElementTree(a).write(str(out/'alpha-fields.svg'))
(out/'report.json').write_text(json.dumps({'operation':'inverse of the previously applied quadratic depth warp, keeping near-camera part unchanged','nearNoChangeThroughY':{'sides':1740/1254*700,'center':710+2172/1254*280},'newFieldBottom':{'sides':1740,'center':710+2172/1254*(1254-420)},'status':'incomplete composition: deep field pending, DO NOT import as final coverage asset'},indent=2));print(out)
