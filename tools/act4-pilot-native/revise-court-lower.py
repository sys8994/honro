#!/usr/bin/env python3
"""Owner-approved local lower-right court edit; exact Bezier subdivision, no boolean."""
import importlib.util,json,sys,math,hashlib
from pathlib import Path
import numpy as np
from svgpathtools import Path as SVGPath,parse_path,Line
H=Path(__file__).resolve().parent;spec=importlib.util.spec_from_file_location('warp',H/'warp-native-curves.py');w=importlib.util.module_from_spec(spec);spec.loader.exec_module(w)
source=Path(sys.argv[1]);dest=Path(sys.argv[2]);a=json.loads(source.read_text());alpha=.55;children=[];bounds=[];samples=0;mx=0;max_guard_error=0;pieces=0
for d,m,style in w.paths(a['vector']['root']):
 p=SVGPath(*(w.segmap(s,m) for s in parse_path(d)));subs=[]
 for sub in p.continuous_subpaths():
  closed=abs(sub[0].start-sub[-1].end)<1e-8;out=[]
  for seg in sub:
   coeff=seg.poly().c;ts=[0.,1.]
   for arr,v in ((np.real(coeff),4200),(np.imag(coeff),3600),(np.real(coeff)-np.imag(coeff),600)):
    co=np.array(arr,dtype=float);co[-1]-=v;co=np.trim_zeros(co,'f')
    if len(co)>1:
     ts.extend(float(t.real) for t in np.roots(co) if abs(t.imag)<1e-8 and 1e-9<t.real<1-1e-9)
   ts=sorted(ts);uniq=[ts[0]]
   for t in ts[1:]:
    if t-uniq[-1]>1e-8:uniq.append(t)
   for l,r in zip(uniq,uniq[1:]):
    if r-l<1e-10:continue
    piece=seg.cropped(l,r);z=piece.point(.5);x,y=z.real,z.imag
    if x<=4200 or y<=3600:mat=[1,0,0,1,0,0]
    elif x-4200<y-3600:mat=[1-alpha,0,0,1,alpha*4200,0]
    else:mat=[1,0,-alpha,1,alpha*3600,0]
    q=w.segmap(piece,mat)
    if out:
     if abs(q.start-out[-1].end)>1e-5:raise ValueError('discontinuous mapping')
     q.start=out[-1].end
    out.append(q);pieces+=1
    for t in (0,.25,.5,.75,1):
     old=piece.point(t);new=q.point(t);delta=abs(old.real-new.real);mx=max(mx,delta);samples+=1
     if old.real<=4200 or old.imag<=3600:max_guard_error=max(max_guard_error,delta,abs(old.imag-new.imag))
  if closed:
   if abs(out[-1].end-out[0].start)>1e-5:raise ValueError('discontinuous closure')
   out[-1].end=out[0].start
  out=[v for v in map(w.quantseg,out) if not w.degenerate(v)]
  if not out:continue
  for i in range(1,len(out)):out[i].start=out[i-1].end
  if closed:out[-1].end=out[0].start
  q=SVGPath(*out);bounds.append(q.bbox());serial=SVGPath(*list(q)[:-1]) if closed and isinstance(q[-1],Line) else q
  txt=w.compact_rel(serial.d(useSandT=True,use_closed_attrib=False,rel=True));txt='M'+txt[1:] if txt.startswith('m') else txt;txt+=('Z' if closed else '')
  decoded=parse_path(txt)
  if len(decoded)==len(q)+1 and abs(decoded[-1].end-decoded[-1].start)<.0011:decoded=decoded[:-1]
  if len(decoded)!=len(q) or any(max(abs(u.point(t)-v.point(t)) for t in (0,.25,.5,.75,1))>.0011 for u,v in zip(q,decoded)):raise ValueError('serialization roundtrip failed')
  subs.append((txt,q.bbox(),0))
 for chunk in w.safe_chunks(subs,style.get('fillRule','nonzero')):children.append({'tag':'path',**style,'d':chunk})
x=min(b[0] for b in bounds);X=max(b[1] for b in bounds);y=min(b[2] for b in bounds);Y=max(b[3] for b in bounds);box={'x':x,'y':y,'w':X-x,'h':Y-y};a['bounds']=box;a['reference']['bounds']=box;a['vector']={'version':1,'viewBox':[x,y,X-x,Y-y],'root':{'tag':'g','children':children}};a['params']['nodeCount']=len(children)+1;a['params']['courtLowerLocalRevision']={'alpha':alpha,'xGuard':4200,'yGuard':3600,'approved':'owner','collisionModified':False,'gridWorld':.001};dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(a,separators=(',',':')))
r={'input':str(source),'inputSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'output':str(dest),'alpha':alpha,'guard':'x<=4200 OR y<=3600: identity','yMapping':'unchanged','sampledMaxHorizontalMovementWorld':mx,'sampledGuardMappingErrorBeforeRoundingWorld':max_guard_error,'samples':samples,'bezierPieces':pieces,'bounds':box,'nodes':len(children)+1,'maxPathChars':max(len(c['d']) for c in children),'gridWorld':.001,'collisionModified':False,'geometryBooleanOperations':0,'visualApproval':'PENDING'};dest.with_suffix('.report.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r))
