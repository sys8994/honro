from pathlib import Path
from PIL import Image,ImageChops
import json,os,sys
ROOT,OUT=map(Path,sys.argv[1:3])
expected={
 'baseline':['a9f3200d572681ad29a0e80449f916f49565faf90d9bd8506e6d274d7eaf37e5','257e6f4f72ac5009a3c1a1e2ca308bb015dfae97dbcb6992bdada4e8b0f6f637','4e3017b97c6aa8601dd465840609301eb8895d3fdda5d627d6369417ae04251c'],
 'sample':['a9f3200d572681ad29a0e80449f916f49565faf90d9bd8506e6d274d7eaf37e5','2298b3fecbc0a43a346a0ebfb4e6a6d7e990f68af0a8bc0ae1b2cc17940d9ef4','90d619172a48c6feb5269887e59c887965de5244a4dcb158396f20f123e5633f']}
proof={'purpose':'Native Workshop central style sample; artist review pending, no gameplay test','errors':[],'frames':{},'dense_roi':{}}
p={}
for arm,pins in expected.items():
 r=OUT/arm/'result.json'
 a=json.loads(r.read_text()) if r.exists() else {}
 found=[a.get(k,{}).get('sha256') for k in ('scope_save','detail_manual_save','gate_save')]
 if int((ROOT/arm/'status').read_text()) or not a.get('pass') or found!=pins:
  proof['errors'].append({'arm':arm,'step':a.get('step'),'expected':pins,'actual':found,'error':a.get('error')})
 p[arm]=a.get('gate_frames',{})
 if os.environ.get('HONRO_SAMPLE_C01_ON')=='1' and not a.get('c01',{}).get('result'): proof['errors'].append(arm+': C01 QA evidence missing')
for name,frames in p['baseline'].items():
 b=p['sample'].get(name)
 if not b or b['actual']!=frames['actual']:
  proof['errors'].append(name+': camera mismatch')
  continue
 im=[Image.open(OUT/arm/f'gate-stock-{name}.png').convert('RGB') for arm in expected]
 d=ImageChops.difference(*im)
 if name=='gate' and d.getbbox() is not None:proof['errors'].append('Protected gate pixels changed')
 proof['frames'][name]={'actual':b['actual'],'bbox':d.getbbox()}
# Identical 95×49 ROIs at the native whole zoom. Never switch to quiet zone to pass.
areas={'west-bed-support':(441,481,536,530),'ladder-approach-bed':(679,461,774,510),'rise-toe-bed':(806,449,901,498)}
def values(im):
 w,h=im.size
 a=[.2126*r+.7152*g+.0722*b for r,g,b in im.getdata()]
 v=sorted(a)
 n=len(v)
 edge=sum(abs(a[i]-a[i+1])>5 for i in range(n) if i%w!=w-1)+sum(abs(a[i]-a[i+w])>5 for i in range(n-w))
 return {'contrast':round(v[int(.9*(n-1))]-v[int(.1*(n-1))],2),'adjacent_strong_percent':round(100*edge/(n-h+n-w),3)}
for arm in expected:
 f=OUT/arm/'gate-stock-whole.png'
 if f.exists():
  im=Image.open(f).convert('RGB')
  proof['dense_roi'][arm]={n:values(im.crop(r)) for n,r in areas.items()}
proof['roi_spec']=areas
proof['art_signoff']='not evaluated by code; contrast/edge density warn, never pass'
proof['pass_technical']=not proof['errors']
(OUT/'result.json').write_text(json.dumps(proof,indent=2)+'\n')
if proof['errors']:raise SystemExit(proof['errors'])
