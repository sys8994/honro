#!/usr/bin/env python3
import sys,json,math
from pathlib import Path
import numpy as np
from lxml import etree as ET
from scipy.spatial import cKDTree
from svgpathtools import parse_path,Line,CubicBezier,QuadraticBezier
STEP=0.5

def samples(d):
 out=[]
 for s in parse_path(d):
  if isinstance(s,Line): controls=[s.start,s.end]
  elif isinstance(s,CubicBezier): controls=[s.start,s.control1,s.control2,s.end]
  elif isinstance(s,QuadraticBezier): controls=[s.start,s.control,s.end]
  else: raise ValueError('Unsupported segment')
  bound=(len(controls)-1)*max(abs(b-a) for a,b in zip(controls,controls[1:]))
  n=max(1,math.ceil(bound/STEP));t=np.linspace(0,1,n+1);z=s.point(t)
  if np.ndim(z)==0:z=np.full(t.shape,z)
  out.append(np.column_stack((z.real,z.imag)))
 return np.concatenate(out)

def paths(p):
 t=ET.parse(str(p));assert not t.xpath('//@transform'), 'Transform must be resolved before source-pixel geometry comparison'
 items=[e for e in t.findall('.//{*}path') if not any(ET.QName(a).localname=='clipPath' for a in e.iterancestors())]
 keys=[e.get('style') for e in items]
 assert len(keys)==len(set(keys)), 'Expected one compound path per style; group repeated styles before measurement'
 return {e.get('style'):e.get('d') for e in items}
raw=Path(sys.argv[1]);candidate=Path(sys.argv[2]);a=paths(raw);b=paths(candidate);results=[]
assert a.keys()==b.keys(), 'Color-layer correspondence changed'
for key in a:
 x=samples(a[key]);y=samples(b[key]);tx=cKDTree(x);ty=cKDTree(y)
 m=max(float(ty.query(x,workers=1)[0].max()),float(tx.query(y,workers=1)[0].max()))
 results.append(dict(path=key,sampled_bidirectional_hausdorff_px=m,conservative_continuous_upper_bound_px=m+STEP/2,raw_samples=len(x),candidate_samples=len(y)))
r=dict(raw=str(raw),candidate=str(candidate),sample_max_arc_spacing_px=STEP,method='Per-color path boundary bidirectional nearest sampled points. Derivative bound gives <=0.5px arc spacing; +0.25px bounds unsampled curve locations. SVG units equal source pixels; no transforms.',paths=results,max_upper_bound_px=max(x['conservative_continuous_upper_bound_px'] for x in results))
out=candidate.with_suffix('.geometry.json');out.write_text(json.dumps(r,indent=2));print(json.dumps(dict(file=str(candidate),max_upper_bound_px=r['max_upper_bound_px'])))
