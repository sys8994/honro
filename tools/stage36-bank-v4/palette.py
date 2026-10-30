"""Stage36 semantic dawn palette; geometry/event metadata never modified."""
import copy,re
PALETTES={
'fallen-bamboo':{'#7e927f':'#5a7685','#486b5e':'#3b596e','#8e9e83':'#687f8c','#a7b09b':'#7e919c'},
'body':{'#726f64':'#2b4659','#666a62':'#233b4d','#807b6c':'#39566b'},
'home':dict(zip(['#b3a693','#978a78','#767b83','#86796a','#6a6e75','#5c626b','#706253','#565b65','#675a4d','#4d4d50','#4a433c','#423c37','#373a42','#323032','#1a1d24'],['#8997a1','#718390','#5f7485','#637989','#536a7d','#485f73','#536979','#42596d','#4b6274','#3a5063','#344b60','#30465a','#2c4258','#293e53','#172b3f'])),
'frame':dict(zip(['#807562','#6d6558','#666a68','#53534e','#555d60'],['#647787','#526a7c','#506b7c','#3c5367','#405b70'])),
'foundation':dict(zip(['#8b8578','#948673','#777d7c','#626763','#515652'],['#647b8e','#6c8191','#546f83','#435d73','#354d64'])),
'door':dict(zip(['#c59865','#b08457','#a47c53','#987452','#86664b','#765a46','#685547','#694d36','#4a3627','#382c24','#100f0e'],['#998a75','#877b6a','#7d7466','#746e64','#646460','#575b5b','#4c5458','#4c5153','#353f49','#293643','#152331'])),
'contact-clusters':dict(zip(['#807b6c','#8e8478','#847767','#726d65','#716659','#645a4f','#54514d'],['#4b657a','#597186','#526b80','#435c72','#40586d','#354e64','#2a4258']))}
def apply(project,stage):
 originals={a['id']:a for a in project['library']};changed=[]
 refs=[*stage['elements'],*stage.get('environment',{}).get('placements',[])];ids={e['assetId'] for e in refs}|{stage['design']['vectorDoorAssetId']}
 for id in sorted(ids):
  typ='fallen-bamboo' if id=='a4-art:fallen-bamboo' else next((k for k in PALETTES if id.startswith('s36-density:'+k)),None)
  if not typ:continue
  a=copy.deepcopy(originals[id]);a['id']=id+'-dawn-v4';pal=PALETTES[typ]
  def walk(o):
   if isinstance(o,dict):
    for k,v in o.items():
     if k in ['fill','stroke'] and isinstance(v,str) and v in pal:o[k]=pal[v]
     elif isinstance(v,(dict,list)):walk(v)
   elif isinstance(o,list):
    for v in o:walk(v)
  walk(a['vector']);a['params']['paletteRevision']='stage36-blue-dawn-v4; semantic paint only';project['library'].append(a)
  for e in refs:
   if e['assetId']==id:e['assetId']=a['id']
  if stage['design']['vectorDoorAssetId']==id:stage['design']['vectorDoorAssetId']=a['id']
  changed.append(a)
 stage['design']['vectorGround']['baseColor']='#233b4d'
 stage['design']['act4']['palette']={'top':'#526f83','light':'#718797','body':'#2c465a','seam':'#263f53','deep':'#233b4d'}
 return changed
