#!/usr/bin/env python3
"""Re-measure upper envelope after native stack trace; do not reuse old geometry."""
import sys,json,xml.etree.ElementTree as E
from pathlib import Path
import numpy as np
from svgpathtools import parse_path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools/vector-production'))
from bounded_flatten import flatten

def rdp(p,t):
 if len(p)<3:return p
 e=abs(np.interp(p[:,0],[p[0,0],p[-1,0]],[p[0,1],p[-1,1]])-p[:,1]);i=int(np.argmax(e))
 return p[[0,-1]] if e[i]<=t else np.vstack([rdp(p[:i+1],t)[:-1],rdp(p[i:],t)])
for name in ['ascending','plateau','descending','overhang']:
 d=ROOT/'art/act4-pilot-modules-v2'/name;old=json.loads((d/'contact.json').read_text());green=next(e for e in E.parse(d/'stacked-raw.svg').getroot() if e.get('id')=='path8');cap=max(parse_path(green.get('d')).continuous_subpaths(),key=lambda p:abs(p.area()));flat=parse_path(flatten(cap.d(),.02));edges=[((s.start.real,s.start.imag),(s.end.real,s.end.imag)) for s in flat];points=np.array([p for e in edges for p in e]);xmin,xmax=points[:,0].min(),points[:,0].max();end=758 if name=='descending' else xmax
 xs=np.unique(np.r_[np.arange(xmin,end,.2),points[(points[:,0]>=xmin)&(points[:,0]<=end),0],xmin,end]);ys=np.full(len(xs),np.inf)
 for a,b in edges:
  if abs(a[0]-b[0])<1e-12:
   m=np.isclose(xs,a[0],rtol=0,atol=1e-7);ys[m]=np.minimum(ys[m],min(a[1],b[1]));continue
  lo,hi=sorted([a[0],b[0]]);m=(xs>=lo-1e-8)&(xs<=hi+1e-8);ys[m]=np.minimum(ys[m],a[1]+(xs[m]-a[0])*(b[1]-a[1])/(b[0]-a[0]))
 assert np.isfinite(ys).all();profile=rdp(np.c_[xs,ys],.08);op=np.array(old['sourceTop']);mask=(xs>=op[0,0])&(xs<=op[-1,0]);delta=float(abs(ys[mask]-np.interp(xs[mask],op[:,0],op[:,1])).max())
 out={'status':'Native stacked source boundary candidate; root-approved exterior convention, actual-use error/visual acceptance pending','nativeSource':'modules-stacked.svg','sourceTop':profile.tolist(),'nativeCurveFlattenBoundSourceUnits':.02,'sampledVerticalErrorSourceUnits':float(abs(np.interp(xs,profile[:,0],profile[:,1])-ys).max()),'oldUnstackedProfileMaxVerticalDifferenceSourceUnits':delta,'sourceProfilePoints':len(profile),'supportEndSourceX':end,'decorativeOverhangMaxSourceUnits':20 if name=='descending' else 2};(d/'stacked-contact.json').write_text(json.dumps(out,indent=2)+'\n');print(name,len(profile),'old-profile-delta',delta)
