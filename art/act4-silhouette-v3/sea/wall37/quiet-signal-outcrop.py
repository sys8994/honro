"""Stage37 scenic-only role palette; native silhouette/placement/physics retained."""
import json,copy,hashlib
from pathlib import Path
D=Path(__file__).parent;R=D.parents[3];O=R/'_local/reports/sea-silhouette-v3';source=O/'stage37-edge-registered-0c1dbb45.json';p=json.load(open(source));s=next(s for s in p['stages']if s['id']=='stage-37');old=next(a for a in p['library']if a['id']=='s37v:signal-outcrop');a=copy.deepcopy(old);a['id']='s37-silhouette:signal-outcrop-quiet-v1';a['name']='새벽 안개 속 신호 바위';changes={}
def walk(x):
 if isinstance(x,dict):
  for k,v in x.items():
   if k in ['fill','stroke']and isinstance(v,str)and v.startswith('#')and len(v)==7:
    rgb=[int(v[i:i+2],16)for i in [1,3,5]];lum=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];c='#293f4e'if lum<75 else'#3d5665'if lum<120 else'#536c7a';changes[v]=c;x[k]=c
   else:walk(v)
 elif isinstance(x,list):
  for z in x:walk(z)
walk(a['vector']);a['params'].update(scenicPalette='three blue-dawn planes; native geometry preserved, signal flame separate and unchanged',sourceAssetId=old['id']);p['library'].append(a);e=next(e for e in s['elements']if e['id']=='a4-coast-37-art-12');assert e['assetId']==old['id'];e['assetId']=a['id'];raw=json.dumps(p,separators=(',',':'),ensure_ascii=False).encode();sha=hashlib.sha256(raw).hexdigest();f=O/f'stage37-final-quiet-{sha[:8]}.json';f.write_bytes(raw);(D/'quiet-outcrop-report.json').write_text(json.dumps({'source':str(source.relative_to(R)),'file':str(f.relative_to(R)),'sha256':sha,'asset':a['id'],'palette':changes,'onlyStageChange':'a4-coast-37-art-12.assetId','collision':[],'signalFlameUnchanged':True,'nativeOutlineUnchanged':True,'visualReview':'pending actual far-east browser'},indent=2));print(sha)
