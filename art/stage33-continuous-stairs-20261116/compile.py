import json,importlib.util
from pathlib import Path
A=Path(__file__).resolve().parent;R=A.parents[1]
spec=importlib.util.spec_from_file_location('native',R/'tools/vector-production/import-native-clip.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
p=json.load(open(A/'provider-metadata.json'));root=A/'production'
for i,role,semantic in [(0,'upper','REAR'),(4,'lowland','BODY')]:
 d=root/role;a=m.compile_native_clip(d/'color-opt.svg',d/'alpha-raw.svg',{'id':p['assets'][i]['id'],'name':'Stage33 continuous '+role+' geology','semanticLayer':semantic,'bounds':{'x':-3300,'y':-300,'w':14000,'h':5600},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':2205},'scaleRange':[.1,8],'backgroundRange':[.1,8],'params':{'silhouetteUnderpaint':False,'nativeSemanticPartition':role,'collisionSource':'unchanged stage33','visualApproval':'PENDING'}})
 def edge(n):
  c=n.get('fill','')
  if c.startswith('#') and len(c)==7 and min(int(c[j:j+2],16) for j in (1,3,5))>245:n['fill']='#62594c'
  for q in n.get('children',[]):edge(q)
 edge(a['vector']['root']);p['assets'][i]=a
for i in [1,2,3]:
 p['assets'][i]['vector']['root']={'tag':'g','children':[]};p['assets'][i]['vector']['clips']={};p['assets'][i]['params']={'silhouetteUnderpaint':False,'coastalV2SourceSlotRetained':True}
json.dump(p,open(R/'shared/data/act4/sideview-art/33-coastal-v2.json','w'),separators=(',',':'))
