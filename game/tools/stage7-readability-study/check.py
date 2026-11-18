from pathlib import Path
import json,numpy as np
from PIL import Image
P=Path('artifacts/stage7-readability-study');rows=[];errors=[]
for view in ['desktop-br','portrait-bl']:
 try:
  a=json.loads((P/f'original-{view}.json').read_text());b=json.loads((P/f'readability-{view}.json').read_text());old=np.array(Image.open(P/f'original-{view}.png').convert('RGBA'));new=np.array(Image.open(P/f'readability-{view}.png').convert('RGBA'));changed=np.any(old!=new,axis=2);ys,xs=np.where(changed)
  for key in ['stageSha256','physicsSha256','sourceSha256','capsSha256','runtimeSha','camera','readability']:
   if a[key]!=b[key]:errors.append(f'{view}: {key} changed')
  for r in [a,b]:
   if not r['ok'] or not r['save']['roundtrip'] or not r['movement']['moved'] or r['errors'] or r['storage'] or r['violations']:errors.append(f'{view}: runtime/save/movement')
  if a['movement']['trajectorySha256']!=b['movement']['trajectorySha256']:errors.append(f'{view}: movement trajectory')
  if not changed.any():errors.append(f'{view}: no visible pixel change; target line may not be visible')
  H,W=changed.shape;c=a['camera'];world=lambda x,y:[float((x-W/2)/c['scale']+c['x']),float((y-H/2)/c['scale']+c['y'])]
  row={'view':view,'changedPixels':int(changed.sum()),'screenBounds':[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())]if len(xs)else None,'worldBounds':[world(xs.min(),ys.min()),world(xs.max(),ys.max())]if len(xs)else None,'firstChanged':[{'screen':[int(x),int(y)],'world':world(x,y),'old':old[y,x].tolist(),'new':new[y,x].tolist()}for x,y in zip(xs[:30],ys[:30])],'removedSegments':a['readability']['removed'],'oldSegments':a['readability']['oldSegments'],'newSegments':a['readability']['newSegments'],'originalTiming':a['timing'],'candidateTiming':b['timing']};rows.append(row)
  diff=np.zeros_like(old);diff[changed]=[255,60,80,255];Image.fromarray(diff).save(P/f'diff-{view}.png')
 except Exception as e:errors.append(f'{view}: {type(e).__name__}: {e}')
report={'scope':'Actual Scene A/B with identical original BODY and frozen visual clock. Only root-domain nonwalking closure readability segments removed. No pixel tolerance; all changed pixels recorded. Manual image review required.','rows':rows,'errors':errors,'passed':not errors,'artAccepted':False};(P/'readability-comparison.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
if errors:raise SystemExit(1)
