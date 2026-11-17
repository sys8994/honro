"""Install native vector grid with canonical source-rock palette; geometry unchanged."""
import json,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[2]
palette=['#8d598e','#72508e','#734677','#643b6d','#583665','#493353','#482c56','#39244b','#311d43','#291834']
def rgb(s): return tuple(int(s[i:i+2],16) for i in (1,3,5))
def lum(s): return sum(a*b for a,b in zip(rgb(s),(.2126,.7152,.0722)))
report=[]
for i in range(6):
 p=root/f'art/stage46-continuity/v6-grid/{i}/candidate.json';a=json.loads(p.read_text());mapping={}
 def walk(n):
  f=n.get('fill','')
  if f.startswith('#') and len(f)==7:
   r,g,b=rgb(f)
   to='#493353' if min(r,g,b)>245 else '#643b6d' if r>b*1.25 and g>b else min(palette,key=lambda q:abs(lum(q)-lum(f)))
   mapping[f]=to;n['fill']=to
  for ch in n.get('children',[]):walk(ch)
 walk(a['vector']['root'])
 a['params']['paletteAdaptation']='Canonical original stage46 rock palette, same native vector geometry; generated gold removed so only canonical contacts/tree retain gold.'
 a['params']['paletteMap']=mapping
 dst=root/('shared/assets/environment/act5/stage46-exterior-'+('body' if i==0 else f'part-{i}')+'.json')
 dst.write_text(json.dumps(a,separators=(',',':'))+'\n')
 report.append({'part':i,'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'outputSha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'paletteMap':mapping})
(root/'art/stage46-continuity/v6-grid/palette-install-report.json').write_text(json.dumps(report,indent=2)+'\n')
