"""Frozen v3 straight-run definition on projected functional support contours.
This is not final painted-silhouette visibility or an art approval.
"""
import json,math,hashlib,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
REF=ROOT.parent/'honro-criteria-report-20261030/HONRO_40_STAGE_CRITERIA_v3.data.json'
def dist(a,b):return math.hypot(a[0]-b[0],a[1]-b[1])
def chord_distance(p,a,b):
 dx,dy=b[0]-a[0],b[1]-a[1];q=dx*dx+dy*dy
 if not q:return dist(p,a)
 t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/q));return dist(p,(a[0]+t*dx,a[1]+t*dy))
def rdp(ps,eps=3):
 if len(ps)<3:return ps
 ds=[chord_distance(p,ps[0],ps[-1]) for p in ps[1:-1]];d=max(ds,default=0)
 if d<=eps:return [ps[0],ps[-1]]
 i=ds.index(d)+1;return rdp(ps[:i+1],eps)[:-1]+rdp(ps[i:],eps)
def resample(ps):
 out=[ps[0]];remaining=1
 for a,b in zip(ps,ps[1:]):
  length=dist(a,b);position=remaining
  while position<length:
   t=position/length;out.append((a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t));position+=1
  remaining=position-length
 if dist(out[-1],ps[-1])>1e-8:out.append(ps[-1])
 return out
# Clip actual authored segments only; never add a viewport-boundary closing line.
def clip(a,b,w,h):
 dx,dy=b[0]-a[0],b[1]-a[1];lo,hi=0,1
 for p,q in [(-dx,a[0]),(dx,w-a[0]),(-dy,a[1]),(dy,h-a[1])]:
  if abs(p)<1e-12:
   if q<0:return None
  else:
   u=q/p
   if p<0:lo=max(lo,u)
   else:hi=min(hi,u)
   if lo>hi:return None
 return ((a[0]+lo*dx,a[1]+lo*dy),(a[0]+hi*dx,a[1]+hi*dy))
def pieces(ps,w,h):
 out=[];part=[]
 for a,b in zip(ps,ps[1:]):
  q=clip(a,b,w,h)
  if not q:
   if len(part)>1:out.append(part)
   part=[];continue
  if part and dist(part[-1],q[0])>1e-5:
   if len(part)>1:out.append(part)
   part=[]
  if not part:part=[q[0]]
  part.append(q[1])
 if len(part)>1:out.append(part)
 return out

def measure(ps):
 ps=rdp(resample(ps),3);L=sum(dist(a,b) for a,b in zip(ps,ps[1:]));runs=[];start=0
 while start<len(ps)-1:
  last=start+1
  for end in range(start+2,len(ps)):
   turns=[]
   for i in range(start+1,end):
    a=math.atan2(ps[i][1]-ps[i-1][1],ps[i][0]-ps[i-1][0]);b=math.atan2(ps[i+1][1]-ps[i][1],ps[i+1][0]-ps[i][0]);turns.append(abs((b-a+math.pi)%(2*math.pi)-math.pi))
   if max(chord_distance(p,ps[start],ps[end]) for p in ps[start:end+1])>2+1e-9 or sum(turns)>math.radians(10)+1e-9:break
   last=end
  length=sum(dist(a,b) for a,b in zip(ps[start:last],ps[start+1:last+1]));runs.append(dict(length=length,points=ps[start:last+1]));start=last
 return L,runs

def main(n,source=None,folder=None):
 source=pathlib.Path(source) if source else ROOT/f'tools/act4-pilot/layouts/stage{n}.json';folder=pathlib.Path(folder) if folder else ROOT/f'_local/reports/act4-pilot/stage{n}/skeleton';folder.mkdir(parents=True,exist_ok=True);raw=source.read_bytes();spec=json.loads(raw);rows=[]
 for w,h in [(1280,720),(390,844)]:
  for zoom,z in [('minimum',max(w/6800,3.75/66)),('normal-policy',.7),('maximum',1.65)]:
   for view in spec['cameraViews']:
    mat=[z,0,0,z,w/2-view['x']*z,h/2-view['y']*z];total=0;straight={40:0,80:0,160:0};surfaces=[];svg=[]
    for f in spec['surfaces']:
     if f.get('material')=='wood':continue # Material exception only; all natural walking flats stay in denominator.
     ps=[(x*z+mat[4],y*z+mat[5]) for x,y in f['top']];L=0;lengths={40:0,80:0,160:0}
     for part in pieces(ps,w,h):
      plen,runs=measure(part);L+=plen
      for run in runs:
       for threshold in lengths:
        if run['length']>=threshold:lengths[threshold]+=run['length']
       svg.append('<polyline points="'+ ' '.join(f'{x:.2f},{y:.2f}' for x,y in run['points'])+'" fill="none" stroke="'+('#c33232' if run['length']>=80 else '#286c89')+'" stroke-width="3"/>')
     if L:surfaces.append(dict(id=f['id'],lengthCss=L,straightCss=lengths,ratios={k:v/L for k,v in lengths.items()}))
     total+=L
     for k in straight:straight[k]+=lengths[k]
    row=dict(viewportCSS=[w,h],camera=view['id'],center=[view['x'],view['y']],zoomName=zoom,scale=z,worldToCSS=mat,DPR=1,layer='functional SURFACE support tops',visibility='viewport crop only; final painted occlusion unknown',sampleStatus='EMPTY' if not total else 'SHORT_CONTOUR' if total<160 else 'MEASURED',naturalFlatExclusionRatio=0,timberExcludedIds=[f['id'] for f in spec['surfaces'] if f.get('material')=='wood'],lengthCss=total,straightCss=straight,ratios={k:v/total if total else None for k,v in straight.items()},surfaces=surfaces)
    rows.append(row)
    if w==1280 and zoom=='normal-policy':
     (folder/f'straights-{view["id"]}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}"><rect width="100%" height="100%" fill="#f7f8fa"/>'+''.join(svg)+f'<text x="20" y="30" font-size="18">Stage {n} / {view["id"]} / red ≥80CSSpx / diagnostic only</text></svg>')
 report=dict(stage=n,blueprintSHA256=hashlib.sha256(raw).hexdigest(),criteriaFile=str(REF),criteriaSHA256=hashlib.sha256(REF.read_bytes()).hexdigest(),definition='1 CSS px arc resample; open RDP epsilon3; deterministic maximal contiguous runs with max chord distance<=2CSSpx and cumulative absolute direction change<=10deg; length sensitivity40/80/160CSSpx.',normalization='Runtime bounds min=max(viewportWidth/6800,3.75/66), max1.65; diagnostic normal0.7 is renderer constructor scale, not a claimed observed gameplay camera. Centers predeclared in blueprint cameraViews. No full-world fit.',status='FUNCTIONAL_SUPPORT_DIAGNOSTIC; final visible art gate BLOCKED (painted masks/runtime camera observations absent). NO PASS CLAIM.',thresholds=dict(targetExclusive=.2,hardMaxExclusive=.3),rows=rows)
 path=folder/'support-straights.json';path.write_text(json.dumps(report,indent=2))
 brief=[]
 for zoom in ['minimum','normal-policy','maximum']:
  rr=[r for r in rows if r['zoomName']==zoom and r['ratios'][80] is not None];brief.append(dict(zoom=zoom,minRatio=min(r['ratios'][80] for r in rr),maxRatio=max(r['ratios'][80] for r in rr),atOrAboveHardMax=sum(r['ratios'][80]>=.3 for r in rr),samples=len(rr)))
 print(json.dumps(dict(stage=n,summary=brief,report=str(path))))
if __name__=='__main__':
 for n in [31,34,39]:main(n)
