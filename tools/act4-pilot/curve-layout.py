"""PCHIP functional collider authoring, not artwork generation."""
import json,math,hashlib,pathlib
root=pathlib.Path(__file__).resolve().parents[2];c=json.loads((root/'tools/act4-pilot/layouts/stage31-v2-controls.json').read_text());raw=(root/c['base']).read_bytes();assert hashlib.sha256(raw).hexdigest()==c['baseSHA256'];s=json.loads(raw)
def curve(ps):
 x=[p[0] for p in ps];y=[p[1] for p in ps];h=[b-a for a,b in zip(x,x[1:])];d=[(b-a)/dx for a,b,dx in zip(y,y[1:],h)];m=[d[0]]
 for i in range(1,len(x)-1):
  if d[i-1]*d[i]<=0:m.append(0)
  else:
   w1=2*h[i]+h[i-1];w2=h[i]+2*h[i-1];m.append((w1+w2)/(w1/d[i-1]+w2/d[i]))
 m.append(d[-1]);out=[]
 for i in range(len(h)):
  count=math.ceil(h[i]/5)
  for j in range(count):
   t=j/count;v=(2*t**3-3*t*t+1)*y[i]+(t**3-2*t*t+t)*h[i]*m[i]+(-2*t**3+3*t*t)*y[i+1]+(t**3-t*t)*h[i]*m[i+1];out.append([round(x[i]+t*h[i],4),round(v,4)])
 out.append(ps[-1]);return out
for f in s['surfaces']:
 if f['id'] in c['profiles']:f['top']=curve(c['profiles'][f['id']])
by={f['id']:f for f in s['surfaces']}
def at(id,x):
 for a,b in zip(by[id]['top'],by[id]['top'][1:]):
  if a[0]<=x<=b[0]:return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])
for cover in s['covers']:
 support={'court-cover':'ridge-court','low-cover':'shore','lookout-cover':'lookout'}[cover['id']];cover['y']=max(at(support,cover['x']+i*cover['w']/10) for i in range(11))+2
s['version']=2;s['status']='Independent curved-support revision; not physics/art accepted';s['spawn']={'x':260,'y':at('shore',260)};s['playerSupport']='shore';s['boarding']['startY']=s['spawn']['y']-90;s['geometryNotes']['curveAuthoring']=c;s['geometryNotes']['protectedFlats']=[{'id':'boarding-bank','x1':5940,'x2':6220,'y':3900},{'id':'boarding-dock','x1':6100,'x2':6270,'y':3900}];s['geometryNotes']['measuredReachableHeight']=None
(root/'tools/act4-pilot/layouts/stage31-v2.json').write_text(json.dumps(s,indent=2))
print(json.dumps({'out':'tools/act4-pilot/layouts/stage31-v2.json','maxSlopes':{f['id']:round(max(abs((b[1]-a[1])/(b[0]-a[0])) for a,b in zip(f['top'],f['top'][1:])),3) for f in s['surfaces']}}))
