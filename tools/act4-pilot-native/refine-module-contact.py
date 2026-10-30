#!/usr/bin/env python3
"""Refine root-approved moss exterior convention; source geometry supplies every point."""
import sys,json,re,xml.etree.ElementTree as E
from pathlib import Path
import numpy as np
from svgpathtools import parse_path
H=Path(__file__).resolve().parents[1];sys.path.insert(0,str(H/'vector-production'))
from bounded_flatten import flatten
P=H.parent/'art/act4-pilot-modules-v2';S='http://www.w3.org/2000/svg';E.register_namespace('',S)
def rdp_vertical(p,tol):
 if len(p)<3:return p
 pred=np.interp(p[:,0],[p[0,0],p[-1,0]],[p[0,1],p[-1,1]]);err=abs(pred-p[:,1]);i=int(np.argmax(err))
 if err[i]<=tol:return p[[0,-1]]
 return np.vstack([rdp_vertical(p[:i+1],tol)[:-1],rdp_vertical(p[i:],tol)])
for name in ['ascending','plateau','descending','overhang']:
 d=P/name;u=json.loads((d/'native-union.json').read_text());cs=[q for q in parse_path(u['d']).continuous_subpaths() if len(q) and q.isclosed()];outer=max(cs,key=lambda q:abs(q.area()));rawtext=outer.d(use_closed_attrib=True)
 green=next(e for e in E.parse(d/'raw.svg').getroot() if e.get('id')=='path8');greenparts=[q for q in parse_path(green.get('d')).continuous_subpaths() if len(q) and q.isclosed()];cap=max(greenparts,key=lambda q:abs(q.area()));flat=parse_path(flatten(cap.d(use_closed_attrib=True),.03));edges=[((s.start.real,s.start.imag),(s.end.real,s.end.imag)) for s in flat];pts=np.array([p for edge in edges for p in edge]);xmin,xmax=pts[:,0].min(),pts[:,0].max();end=758. if name=='descending' else xmax
 xs=np.unique(np.concatenate([np.arange(xmin,end,.25),pts[(pts[:,0]>=xmin)&(pts[:,0]<=end),0],[xmin,end]]));ys=np.full(len(xs),np.inf)
 for a,b in edges:
  if abs(b[0]-a[0])<1e-12:
   mask=np.isclose(xs,a[0],rtol=0,atol=1e-7);ys[mask]=np.minimum(ys[mask],min(a[1],b[1]));continue
  lo,hi=sorted([a[0],b[0]]);mask=(xs>=lo-1e-8)&(xs<=hi+1e-8);yy=a[1]+(xs[mask]-a[0])*(b[1]-a[1])/(b[0]-a[0]);ys[mask]=np.minimum(ys[mask],yy)
 assert np.isfinite(ys).all();full=np.column_stack([xs,ys]);simplified=rdp_vertical(full,.15);error=float(abs(np.interp(xs,simplified[:,0],simplified[:,1])-ys).max())
 report={'status':'ROOT APPROVED CONVENTION; geometry-refined candidate, final placement not approved','nativeContactPaint':'path8 moss cap; upper envelope of largest cap contour','sourceTop':simplified.tolist(),'sourceBounds':u['bounds'],'sampledVerticalErrorSourceUnits':error,'nativeCurveFlattenBoundSourceUnits':.03,'underfill':'All native union rings resolved with positive winding to fill internal seam holes; coordinates .01sourcegrid; no rectangular or expanded exterior backing.','underfillRemovedInteriorContours':len(cs)-1,'decorativeOverhangMaxSourceUnits':20 if name=='descending' else 0,'supportEndSourceX':end,'sourceProfilePoints':len(simplified)}
 (d/'contact.json').write_text(json.dumps(report,indent=2)+'\n')
 underfill=' '.join((q if q.area()>0 else q.reversed()).d(use_closed_attrib=True) for q in cs);underfill=re.sub(r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',lambda m:format(round(float(m[0]),2),'.12g'),underfill);r=E.parse(d/'optimized.svg').getroot();r.insert(0,E.Element('{'+S+'}path',id='native-exterior-underfill',fill='#12213a',d=underfill));E.ElementTree(r).write(d/'seam-fixed.svg',encoding='utf-8',xml_declaration=True)
 print(name,'profilepoints',len(simplified),'verticalerror',error,'underfillchars',len(rawtext),flush=True)
