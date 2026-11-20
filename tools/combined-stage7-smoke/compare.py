import json,math
from pathlib import Path
from PIL import Image,ImageChops
p=Path('_local/reports/stage7-closure');a=json.loads((p/'stock/proof.json').read_text());b=json.loads((p/'candidate/proof.json').read_text());out=[]
for x,y in zip(a['frames'],b['frames'],strict=True):
 assert x['stage']==y['stage'] and x['view']==y['view'] and x['css']==y['css'] and x['backing']==y['backing'] and x['actual']==y['actual'] and x['physicsSha256']==y['physicsSha256'],(x['name'],x,y)
 im=Image.open(p/'stock'/x['name']).convert('RGB');jm=Image.open(p/'candidate'/y['name']).convert('RGB');box=ImageChops.difference(im,jm).getbbox()
 if x['stage']==6:assert box is None,(x['name'],box)
 else:
  expected=(5069.18-x['actual']['y'])*x['actual']['scale']+x['css']['h']/2
  if 0<expected<im.height:
   assert box is not None,x['name']
   assert box[1]>=math.floor(expected)-4 and box[3]<=math.ceil(expected)+4,(box,expected)
  else:assert box is None,(x['name'],box)
  assert len(x.get('rootFloorBottomNonwalk') or [])>0
  assert len(y.get('rootFloorBottomNonwalk') or [])==0
 out.append({'name':x['name'],'differenceBox':box,'cameraEqual':True,'physicsEqual':True})
(p/'comparison.json').write_text(json.dumps(out,indent=2));print(out)
