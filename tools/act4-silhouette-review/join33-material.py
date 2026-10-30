"""Local source-backed node correction across two native32 material edges, no terrain change."""
import xml.etree.ElementTree as E,json,sys,subprocess,os
from pathlib import Path
from svgpathtools import parse_path
sys.path.insert(0,'tools/vector-production');from bounded_flatten import flatten
D=Path('art/stage33-bank-silhouette-v4/connected-soil');B=Path('art/act4-silhouette-v3/sea/bank32');L=E.parse(B/'ground-master.svg').getroot();R=E.parse(B/'ground-right-master.svg').getroot();pl={e.get('id'):e for e in L.iter()if e.tag.endswith('path')};pr={e.get('id'):e for e in R.iter()if e.tag.endswith('path')}
def largest(p):return max(parse_path(p.get('d')).continuous_subpaths(),key=lambda q:abs(q.area())if q.isclosed() else 0)
def yAt(p,x):
 q=parse_path(flatten(largest(p).d(),.1));return min(z.start.imag+(z.end.imag-z.start.imag)*(x-z.start.real)/(z.end.real-z.start.real)for z in q if abs(z.end.real-z.start.real)>1e-8 and min(z.start.real,z.end.real)<=x<=max(z.start.real,z.end.real))
lt=yAt(pl['path7'],2168);rt=yAt(pr['path7'],4);changes=[]
for pid in ['path5','path4','path3','path2']:
 delta=(yAt(pl[pid],2168)-lt)-(yAt(pr[pid],4)-rt);q=parse_path(flatten(largest(pr[pid]).d(),.1));pts=[q[0].start]+[z.end for z in q];out=[]
 for z in pts:
  u=max(0,min(1,(z.real-4)/(400*2164/3800)));w=1-u*u*(3-2*u);out.append((z.real,z.imag+delta*w))
 pr[pid].set('d','M'+'L'.join(f'{x:.5f} {y:.5f}'for x,y in out)+'Z');changes.append({'path':pid,'sourceEdgeDeltaY':delta,'worldDepthDelta':1.4*delta,'transitionWorld':400})
E.ElementTree(R).write(D/'right-material-joined-input.svg');env={**os.environ,'INKSCAPE_PROFILE_DIR':'/tmp/honro33material','XDG_CACHE_HOME':'/tmp/honro33cache'};subprocess.run(['inkscape',str(D/'right-material-joined-input.svg'),'--export-plain-svg','--export-type=svg',f'--export-filename={D/"right-material-joined.svg"}'],env=env,check=True);(D/'seam-node-reconciliation.json').write_text(json.dumps({'scope':'native source material nodes only; outer path7 and collider untouched','changes':changes,'sourceFlattenTolerance':.1,'physicalTopUnchanged':True,'visualReviewPending':True},indent=2));print(changes)
