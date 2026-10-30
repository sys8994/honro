"""Technical collider proposal from approved-source native boundary; NOT artwork editing.
Does not apply to canonical data. Root must approve overlay before Engine tests.
"""
import argparse,json,pathlib,hashlib,math,numpy as np
from svgpathtools import parse_path
p=argparse.ArgumentParser();p.add_argument('--baseline',required=True);p.add_argument('--bodies',required=True);p.add_argument('--out',required=True);a=p.parse_args();base=pathlib.Path(a.baseline);bodies=pathlib.Path(a.bodies);out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True);s=json.loads((base/'blueprint.json').read_text());old=json.loads((base/'stage.json').read_text());rows=[]
def chord(z,a,b):
 d=b-a
 if abs(d)<1e-12:return abs(z-a)
 t=max(0,min(1,((z-a).real*d.real+(z-a).imag*d.imag)/abs(d)**2));return abs(z-(a+t*d))
def flatten(q,tol=.12,depth=0):
 controls=q.bpoints()
 if depth>22 or max((chord(c,q.start,q.end) for c in controls[1:-1]),default=0)<=tol:return [q.start,q.end]
 l,r=q.split(.5);return flatten(l,tol,depth+1)[:-1]+flatten(r,tol,depth+1)
def nearest_x_anchor(path,x,y):
 hits=[]
 for i,q in enumerate(path):
  co=np.real(q.poly().coeffs).copy();co[-1]-=x
  for r in np.roots(co):
   if abs(r.imag)<1e-7 and -1e-7<=r.real<=1+1e-7:
    t=max(0,min(1,float(r.real)));v=q.point(t);ii=i
    if t>1-1e-7:ii=(i+1)%len(path);t=0
    hits.append((abs(v.imag-y),ii,t,v))
 if not hits:raise ValueError('No boundary crossing at protected endpoint')
 return min(hits,key=lambda h:h[0])
def arc(path,a,b):
 i,t=a[1:3];j,u=b[1:3];points=[]
 for _ in range(len(path)+1):
  end=u if i==j else 1
  if end>t+1e-10:
   pts=flatten(path[i].cropped(t,end));points+=pts if not points else pts[1:]
  if i==j:break
  i=(i+1)%len(path);t=0
 else:raise ValueError('Cannot traverse native boundary')
 return points
def simplify(ps,tol=.1):
 if len(ps)<3:return ps
 ds=[chord(z,ps[0],ps[-1]) for z in ps[1:-1]];m=max(ds,default=0)
 if m<=tol:return [ps[0],ps[-1]]
 i=ds.index(m)+1;return simplify(ps[:i+1],tol)[:-1]+simplify(ps[i:],tol)
for f in s['surfaces']:
 if f['id'] not in ['west-ledge','ridge-court','east-overhang']:continue
 file=bodies/(f['id']+'-boundary.json');raw=file.read_bytes();meta=json.loads(raw);path=parse_path(meta['d']);left=nearest_x_anchor(path,*f['top'][0]);right=nearest_x_anchor(path,*f['top'][-1]);arcs=[arc(path,right,left),list(reversed(arc(path,left,right)))];lower=max(arcs,key=lambda ps:sum(z.imag for z in ps)/len(ps));lower=simplify(lower)
 f['bottom']=[[round(z.real,6),round(z.imag,6)] for z in lower[1:-1]]
 rows.append(dict(id=f['id'],nativeBoundaryRawSHA256=hashlib.sha256(raw).hexdigest(),nativePaintSourceSHA256=meta['sourceSHA256'],endpointNativeMismatchWorld=[left[0],right[0]],bodyVertices=len(f['bottom']),flattenErrorBoundWorld=.12,simplificationErrorBoundWorld=.1,topPreserved=True,bodyShapePolicy='Use the original entire lower native arc, not a rectangle cut to old trajectory. No extra walk edges are intentionally added; incidental upward edges require inventory.'))
s['status']='Native lower-body collider PROPOSAL ONLY; top/covers/boat preserved; root overlay approval required before Engine';s['geometryNotes']['nativeBodyProposal']={'sourceDirectory':str(bodies),'rows':rows,'pending':['root silhouette/collision overlay approval','native contact mismatch repair if needed','actual Engine side-entry/roots/dock validation','spawn/roster/exposure checks']};(out/'input.json').write_text(json.dumps(s,indent=2));(out/'proposal-report.json').write_text(json.dumps({'scope':'Technical collider proposal, NOT accepted or applied canonical geometry','rows':rows},indent=2))
# Functional overlay only; native art is not redrawn here.
W,H=s['width'],s['height'];v=f'<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="{round(1400*H/W)}" viewBox="0 0 {W} {H}"><rect width="{W}" height="{H}" fill="#f7f8fa"/>'
for t in old['terrains']:
 v+='<polygon points="'+' '.join(f'{p["x"]},{p["y"]}' for p in t['points'])+'" fill="none" stroke="#a7adb4" stroke-width="6"/>'
for f in s['surfaces']:
 if f['id'] in ['west-ledge','ridge-court','east-overhang']:
  ps=f['top']+f['bottom'];v+='<polygon points="'+' '.join(f'{x},{y}' for x,y in ps)+'" fill="#76bec8" fill-opacity=".65" stroke="#227b87" stroke-width="5"/>'
 v+='<polyline points="'+' '.join(f'{x},{y}' for x,y in f['top'])+'" fill="none" stroke="'+('#94723d' if f.get('material')=='wood' else '#b78313')+'" stroke-width="9"/>'
for c in s['covers']:v+=f'<rect x="{c["x"]}" y="{c["y"]-c["h"]}" width="{c["w"]}" height="{c["h"]}" fill="#657386"/>'
v+=f'<circle cx="{s["spawn"]["x"]}" cy="{s["spawn"]["y"]-46}" r="30" fill="#cf4d54"/><text x="100" y="140" font-size="57">BODY COLLIDER PROPOSAL — CYAN NEW / GRAY OLD / GOLD FIXED TOP</text><text x="100" y="225" font-size="42">NOT APPROVED. No canonical writes. Native contact errors remain explicitly reported.</text></svg>'
(out/'overlay.svg').write_text(v);print(json.dumps({'out':str(out),'rows':rows}))
