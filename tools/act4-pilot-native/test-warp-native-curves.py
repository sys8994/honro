#!/usr/bin/env python3
"""Regression for exact affine subdivision and native east overhang endpoints/profile."""
import importlib.util,json,math,sys
from pathlib import Path
import numpy as np
from svgpathtools import parse_path,CubicBezier
P=Path(__file__).resolve().parent;sp=importlib.util.spec_from_file_location('warp',P/'warp-native-curves.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w)
# Cubic crosses a cut three times; subdivided curves must preserve positions.
s=CubicBezier(0+0j,5+3j,-4+6j,1+9j);parts=w.cut_curve(s,[.5]);assert len(parts)==4,len(parts)
knots=[0.,*sorted(w.roots_at_x(s,.5)),1.]
for p,t0,t1 in zip(parts,knots,knots[1:]):
 for t in (0,.25,.5,.75,1):assert abs(p.point(t)-s.point(t0+(t1-t0)*t))<1e-8
assert all(abs(a.end-b.start)<1e-8 for a,b in zip(parts,parts[1:]));assert abs(parts[0].start-s.start)<1e-9 and abs(parts[-1].end-s.end)<1e-9
# A closing cubic is not replaceable with a straight Z edge.
fixture={'id':'fixture','collision':[],'bounds':{'x':0,'y':0,'w':10,'h':10},'anchor':{'x':0,'y':0},'reference':{},'params':{},'vector':{'version':1,'root':{'tag':'g','children':[{'tag':'path','fill':'#000000','stroke':'none','fillRule':'nonzero','d':'M0 0 L0 0 C0 0 0 0 0 0 L10 0 L10 10 C9 5 3 1 0 0 Z'}]}}}
fc={'id':'fixture-warped','sourceTop':[[0,0],[10,0]],'targetTop':[[0,0],[10,0]],'depthScale':1}
fa,_=w.run(fixture,fc);fd=fa['vector']['root']['children'][0]['d'];curve=[v for v in parse_path(fd) if isinstance(v,CubicBezier)];assert len(curve)==1 and abs(curve[0].point(.5)-(5.75+3.5j))<.001,fd
root=P.parents[1]; fixture_path=root/'_local/reports/stage31-body-v1-fit/east-overhang-fit.json'
if not fixture_path.exists():print('PASS synthetic; SKIP local east fixture');sys.exit(0)
source=json.load(open(root/'art/act4-pilot-body31-v1/east-overhang/asset.json'));config=json.load(open(fixture_path));a,r=w.run(source,config)
segments=[]
def walk(n):
 if n['tag']=='path':
  for s in parse_path(n['d']):
   lo,hi,_,_=s.bbox();segments.append((lo,hi,s))
 for c in n.get('children',[]):walk(c)
walk(a['vector']['root'])
def top(x):
 ys=[]
 for lo,hi,s in segments:
  if not lo-1e-5<=x<=hi+1e-5:continue
  co=np.real(s.poly().c).astype(float);co[-1]-=x;co=np.trim_zeros(co,'f')
  if len(co)>1:
   for t in np.roots(co):
    if abs(t.imag)<1e-7 and -1e-6<=t.real<=1+1e-6:ys.append(s.point(float(t.real)).imag)
 if not ys:raise ValueError(('no contact',x))
 return min(ys)
tp=w.profile(config['targetTop']);results=[]
for x in np.linspace(tp[0][0],tp[-1][0],170):
 m,b=w.line(tp,float(x));obs=top(float(x));results.append({'x':float(x),'nativeTop':obs,'target':m*x+b,'errorWorld':abs(obs-(m*x+b))})
mx=max(results,key=lambda z:z['errorWorld']);ends=[results[0],results[-1]];assert abs(ends[0]['nativeTop']-2260)<.05 and abs(ends[1]['nativeTop']-2646.67)<.05,ends
assert mx['errorWorld']*1.65<=.5, mx
assert r['maxPathChars']<60000 and r['nodes']<512 and r['booleanOperations']==0
print(json.dumps({'samples':len(results),'endpoints':ends,'maximum':mx,'maxNormalCSS':mx['errorWorld']*.7,'maxZoomCSS':mx['errorWorld']*1.65,'report':r},indent=2))
