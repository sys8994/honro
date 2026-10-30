"""Exact declared support patches stay unchanged even when surrounding art/collider changes."""
import json,sys,hashlib
from pathlib import Path
n=int(sys.argv[1]);file=sys.argv[2];out=Path(sys.argv[3]);base=json.load(open('_local/reports/sea-silhouette-v3/project.json'));p=json.load(open(file));a=next(s for s in base['stages']if s['metadata']['stageId']==n);b=next(s for s in p['stages']if s['metadata']['stageId']==n);old=next(t for t in a['terrains']if t['id']==f'a4-{n}-land')['points'];new=next(t for t in b['terrains']if t['id']==f'a4-{n}-land')['points'];ranges={35:[(540,920),(2820,3160)],39:[(1380,1700),(4500,6200),(6600,8000)]}[n]
def support(pts,x):return min(u['y']+(v['y']-u['y'])*(x-u['x'])/(v['x']-u['x'])for u,v in zip(pts,pts[1:]+pts[:1])if v['x']>u['x']and u['x']<=x<=v['x'])
rows=[]
for lo,hi in ranges:
 xs=sorted(set([lo,hi,*range(lo,hi+1,10),*[q['x']for q in old+new if lo<=q['x']<=hi]]));errors=[abs(support(old,x)-support(new,x))for x in xs];assert max(errors)<1e-6,(lo,hi,max(errors));rows.append({'range':[lo,hi],'sampleCount':len(xs),'maxErrorWorld':max(errors),'sourceVerticesInsideRangeExact':[{k:q[k]for k in ['x','y']}for q in old if lo<=q['x']<=hi]==[{k:q[k]for k in ['x','y']}for q in new if lo<=q['x']<=hi]})
r={'stage':n,'scope':'Declared stairs/recovery/resident/objective/safe supports only. Not fullplay or visual approval.','projectRawSHA256':hashlib.sha256(Path(file).read_bytes()).hexdigest(),'pass':True,'rows':rows};out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(r,indent=2));print(json.dumps(r))
