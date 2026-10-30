import json,copy
from pathlib import Path
D=Path('art/stage35-stone-style-v3');O=Path('_local/reports/stage35-stone-style-v3');O.mkdir(parents=True,exist_ok=True)
p=json.loads(Path('_local/reports/sea-silhouette-v3/candidate-related-covers-v1.json').read_text());s=next(s for s in p['stages'] if s['metadata']['stageId']==35);used={e['assetId'] for e in s['elements']};replacements={};assets=[]
maps={
'body':dict(zip(['#46595e','#5d6b61','#516267','#526260','#4c5e63','#495c5f','#485b60'],['#243a4b','#465d70','#2c4254','#304759','#293f51','#273d4f','#263c4e'])),
'central':dict(zip(['#9fa492','#8b9178','#7b836f','#566366','#4a5957','#3f5053','#46595e'],['#60788b','#4c6378','#465e72','#3b5266','#2b4155','#2b4155','#243a4b'])),
'bamboo':dict(zip(['#c6c9b4','#98a499','#8b8f7a','#799086','#6a837b','#526a68','#355255'],['#8b9ca8','#6b8391','#5e7787','#577483','#496777','#3c596c','#2a455b'])),
'fore':dict(zip(['#505651','#3f4947','#3a413b','#344140','#2e3c3c','#253334','#1b2a2d'],['#344b5c','#2b4355','#283f51','#263e50','#233a4c','#1e3446','#192f40'])),
'cover':dict(zip(['#a1a999','#87947a','#798a85','#738671','#546d64','#324a4a','#273d41'],['#7f94a0','#637f8c','#597586','#526f80','#3d5a6e','#2a445a','#223c52'])),
'fallen':dict(zip(['#7e927f','#486b5e','#8e9e83','#a7b09b'],['#627e8d','#385b70','#748b99','#8a9da8'])),
'rear':dict(zip(['#606b57','#79816c','#727a65','#516571','#57624b','#435967','#3d5261','#4d554b','#354852','#35444d','#2e3d46'],['#435b6c','#526b7d','#4e6678','#3f586b','#3e5668','#344e63','#30495e','#354d60','#2a4358','#273f53','#233b50']))}
for old in p['library']:
 if old['id'] not in used:continue
 aid=old['id'];role='body' if 'body-depthfade' in aid else 'central' if 'central-stone' in aid else 'bamboo' if aid=='a4-production:bamboo-clump' else 'fore' if 'bamboo-foreground' in aid else 'cover' if 'thick-bamboo-cover' in aid else 'fallen' if 'fallen-bamboo' in aid else 'rear' if 'rear-continuous' in aid else None
 if not role:continue
 a=copy.deepcopy(old);a['id']=aid+'-blue-dawn-v3';pal=maps[role]
 def walk(x):
  if isinstance(x,dict):
   for k,v in x.items():
    if k in ['fill','stroke'] and isinstance(v,str) and v in pal:x[k]=pal[v]
    elif isinstance(v,(dict,list)):walk(v)
  elif isinstance(x,list):
   for v in x:walk(v)
 walk(a.get('vector',a.get('visual')));a['params']['styleRevision']={'role':role,'palette':pal,'geometryUnchanged':True};assets.append(a);replacements[aid]=a['id']
a=json.loads((D/'asset.json').read_text());assets.append(a);replacements['density-play:stone-steps-left']=a['id']
def refs(x):
 if isinstance(x,dict):
  for k,v in x.items():
   if isinstance(v,str) and v in replacements:x[k]=replacements[v]
   elif isinstance(v,(dict,list)):refs(v)
 elif isinstance(x,list):
  for v in x:refs(v)
refs(s);p['library']+=assets;s['design']['vectorGround']['baseColor']='#243a4b';s['design']['act4']['palette']={'top':'#60788b','light':'#8a9ca7','body':'#304759','seam':'#263c4e','deep':'#243a4b'};s['environment']['atmosphere']['overrides'].update(json.loads(Path('art/act4-silhouette-v3/sea/palette32-manifest.json').read_text())['environmentOverrides']);p['stages']=[s];p['activeStageId']=s['id'];p['production']['cards'][s['id']]['cameraViews']=[{'id':'normal','x':1100,'y':1840,'scale':.53,'width':1440,'height':900},{'id':'detail','x':760,'y':1860,'scale':1.1,'width':1440,'height':900},{'id':'mobile','x':1100,'y':1840,'scale':.32,'width':430,'height':932}];(D/'palette-assets.json').write_text(json.dumps(assets,separators=(',',':')));(D/'palette-manifest.json').write_text(json.dumps({'replacements':replacements,'design':s['design'],'environment':s['environment'],'visualApproval':False},indent=2));(O/'candidate-project.json').write_text(json.dumps(p,separators=(',',':')));print(O/'candidate-project.json')
