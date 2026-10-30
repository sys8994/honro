"""Actual source affine/physical contacts; does not infer gameplay from pixels."""
import gzip,json,xml.etree.ElementTree as ET
from pathlib import Path
D=Path('art/stage39-vector-production');s=json.load(gzip.open(D/'official-project.json.gz','rt'))['stages'][0]
for name in ['body','wreck']:
 if not (D/f'{name}-raw.svg').exists():continue
 vb=list(map(float,ET.parse(D/f'{name}-raw.svg').getroot().attrib['viewBox'].split()))
 if name=='body':m=json.loads((D/'body-mapping.json').read_text());x,y,w,h=[m[k]for k in ['x','y','w','h']]
 else:x,y,w,h=-650,-390,1300,480
 cfg={'id':f's39v:{name}','name':'돌아오는 물 지반'if name=='body'else'살아있는 폐선','semanticLayer':'BODY'if name=='body'else'INTERACT','category':'rock'if name=='body'else'architecture','bounds':{'x':x,'y':y,'w':w,'h':h},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':1800 if name=='body'else 0},'transform':[w/vb[2],0,0,h/vb[3],x-vb[0]*w/vb[2],y-vb[1]*h/vb[3]],'params':{'artRevision':1,'sourceConcept':name+'-concept.png','sourceRaw':name+'-raw.svg','sourceFit':'Native full-viewBox affine; original source physics authoritative'}}
 if name=='body':
  t=next(t for t in s['terrains']if t['id']=='a4-39-land');cfg['bodyClip']=[' '.join(('M'if i==0 else'L')+str(q['x'])+' '+str(q['y'])for i,q in enumerate(t['points']))+'Z'];cfg['params']['collisionSource']='official:a4-39-land'
 (D/f'{name}-config.json').write_text(json.dumps(cfg,indent=2,ensure_ascii=False))
 opt={'width':1400,'scales':[1,2.1],'protectionMode':'silhouette','limits':{'protectedChangedPixelFraction':.05}}
 if name=='body':opt['protectedPolylines']=[{'points':[[((q['x']-x)/w)*1400,((q['y']-y)/h)*(1400*vb[3]/vb[2])]for q in t['points']if x<=q['x']<=x+w and y<=q['y']<=y+h],'width':12}];opt['protectionMode']='contact'
 (D/f'{name}-optimize.json').write_text(json.dumps(opt,indent=2))
