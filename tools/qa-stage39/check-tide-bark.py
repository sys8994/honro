"""Check recorded *natural* bark frame bounds, duration and subsequent input."""
import json,sys
from pathlib import Path
for name in sys.argv[1:]:
 p=Path(name);r=json.loads((p/'result.json').read_text());assert r['stopReason']=='tide-observed' and not r['errors'];start,end=r['naturalTideFrames'];assert start['kind']=='start' and end['kind']=='end' and end['duration']>=2.4 and float(start['font'][:-2])>=15
 x=r['tideBarkLayout']['rect']
 for o in r['tideBarkLayout']['obstacles']:
  y=o['rect']
  if o['visible'] and y:assert x['right']<=y['left'] or x['left']>=y['right'] or x['bottom']<=y['top'] or x['top']>=y['bottom'],(name,o)
 e=[json.loads(l) for l in (p/'events.jsonl').read_text().splitlines()];a=next(z for z in e if z['kind']=='tide-bark-ended')['state'];b=next(z for z in e if z['kind']=='post-tide-ui-movement')['state'];assert b['x']>a['x']+5
 print(p.name,'natural visible seconds',round(end['duration'],3),'font',start['font'],'post-input movement',round(b['x']-a['x'],1))
