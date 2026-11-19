import json,hashlib
from pathlib import Path
from PIL import Image,ImageChops
p=Path('_local/reports/stage14-walk-ink');a=json.loads((p/'stock/report.json').read_text());b=json.loads((p/'integrated/report.json').read_text());rows=[]
for x,y in zip(a['rows'],b['rows']):
 assert x['camera']==y['camera'] and x['canvas']==y['canvas'] and x['gameplaySha256']==y['gameplaySha256'],(x,y)
 n=x['label'];im=Image.open(p/'stock'/f'{n}.png').convert('RGB');jm=Image.open(p/'integrated'/f'{n}.png').convert('RGB');box=ImageChops.difference(im,jm).getbbox()
 if n=='control13':assert box is None,box
 else:assert box is not None,n
 rows.append({'view':n,'differenceBox':box,'gameplayEqual':True,'cameraEqual':True})
(p/'comparison.json').write_text(json.dumps(rows,indent=2));print(rows)
