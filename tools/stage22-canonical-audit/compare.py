import json,os,math
from pathlib import Path
from PIL import Image,ImageChops,ImageDraw,ImageFilter
P=Path(os.environ['OUT'])
A,B=({(f['stage'],f['width'],f['view']):f for f in json.loads((P/v/'proof.json').read_text())['frames']} for v in ('stock','candidate'))
assert A.keys()==B.keys() and len(A)==len(B)==16
rects=[(0,5660,1590,6600),(1610,4940,4810,6620)]
results=[]
terrain=json.loads((P/'packet-contract.json').read_text())['terrainPolygon']
for k,a in A.items():
 b=B[k]
 for q in ('physicsSha256','actual','viewport'):assert a[q]==b[q],k
 x,y=(Image.open(P/v/f['name']).convert('RGB') for v,f in [('stock',a),('candidate',b)])
 delta=ImageChops.difference(x,y)
 clip=Image.new('L',x.size)
 draw=ImageDraw.Draw(clip)
 t=a['viewport'];s=a['actual']['scale']
 for l,i,r,j in rects if a['stage']==22 else ():
  draw.rectangle((math.floor((l-t['left'])*s)-2,math.floor((i-t['top'])*s)-2,math.ceil((r-t['left'])*s)+2,math.ceil((j-t['top'])*s)+2),fill=255)
 if a['stage']==22:
  physical=Image.new('L',x.size)
  ImageDraw.Draw(physical).polygon([((p['x']-t['left'])*s,(p['y']-t['top'])*s) for p in terrain],fill=255)
  clip=ImageChops.darker(clip,physical.filter(ImageFilter.MaxFilter(5)))
 outside=Image.composite(Image.new('RGB',x.size),delta,clip)
 outside_max=max(z[1] for z in outside.getextrema())
 result={'key':k,'delta':delta.getbbox(),'outsideMaxRGB':outside_max}
 results.append(result)
 (P/'paired-checks.json').write_text(json.dumps(results,indent=2))
 assert outside_max<=(0 if a['stage']==21 else 1),result
assert all(next(q for q in results if q['key']==(22,w,'south'))['delta'] for w in (390,1440))
print('Compared 16 pairs: two-plane/solid pixel mask, Stage21 pixel exact, gameplay state unchanged.')
