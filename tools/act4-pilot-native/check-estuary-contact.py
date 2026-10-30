#!/usr/bin/env python3
"""Sample exact painted boundary polynomial roots against handed-off top; not an Engine test."""
import json,sys,numpy as np
from svgpathtools import parse_path
boundary,top,out=sys.argv[1:];q=json.load(open(boundary));p=parse_path(q['d']);segments=[(s,s.bbox()) for s in p];t=np.array(json.load(open(top))['worldTop']);xs=np.unique(np.r_[np.arange(t[0,0],t[-1,0],5),t[:,0],t[-1,0]]);rows=[]
for x in xs:
 ys=[]
 for s,b in segments:
  if x<b[0]-1e-5 or x>b[1]+1e-5:continue
  c=np.array(np.real(s.poly().c));c[-1]-=x;c=np.trim_zeros(c,'f')
  if len(c)<2:continue
  for z in np.roots(c):
   if abs(z.imag)<1e-7 and -1e-7<=z.real<=1+1e-7:ys.append(s.point(min(1,max(0,float(z.real)))).imag)
 if not ys:raise ValueError(('no painted boundary',x))
 topY=float(np.interp(x,t[:,0],t[:,1]));paint=min(ys);rows.append((abs(paint-topY),float(x),paint,topY))
r={'samples':len(rows),'method':'Exact painted-boundary Bezier polynomial x intersections; profile interpolant; discrete samples not supremum proof','maxWorldError':max(rows)[0],'maxCSSNormal07':max(rows)[0]*.7,'maxCSSMax165':max(rows)[0]*1.65,'worstSample':max(rows),'protectedThresholdCSS':.5,'sampledPass':max(rows)[0]*1.65<=.5};json.dump(r,open(out,'w'),indent=2);print(json.dumps(r))
