import json
from pathlib import Path
from PIL import Image,ImageDraw
root=Path('/workspace/scratch/fff510b4df37/honro-act2-vector-rollout/stage16');s=json.load(open('/workspace/scratch/fff510b4df37/honro-act2-stage16/_local/reports/stage16-original/source.json'))['stage']
parts={'floor-west':([-700,4900,4800,2500],['act2-floor']),'floor-east':([6600,4000,5200,3000],['act2-floor']),'floor-under':([3200,5400,5200,2300],['act2-floor']),'roof':([-6000,-3000,23000,7500],['cave-roof'])}
for n,(r,ids) in parts.items():
 p=root/n;p.mkdir(exist_ok=True);W,H=1536,1024;x,y,w,h=r;im=Image.new('RGB',(W,H),'white');d=ImageDraw.Draw(im)
 for t in s['terrains']:
  if t['id']in ids:d.polygon([((a['x']-x)/w*W,(a['y']-y)/h*H)for a in t['points']],fill='#283e49')
 im.save(p/'guide.png');(p/'contract.json').write_text(json.dumps({'worldRect':r,'bodyTerrainIds':ids,'heroHeight':92,'localMaterial':n!='roof'},indent=2))
 prompt=('Use case: stylized-concept. Flat vector-ready near terrain material for Korean underground temple J amunsa. Input is exact collision silhouette guide, not art style. KEEP guide silhouette and white empty space precisely. Sideview orthographic cutaway, no perspective. Fill colored silhouette with continuous dark slate rock base #283e49 and a limited number of sharp connected angular planes. Use 5 flat opaque cool slate grey colors, clean antialiased edges, no gradients or texture. '
 + ('Within a narrow band just below top walkable edge, natural medium-sized rock faces roughly 30–60 image pixels wide, 2–4 connected planes per group. Hypothetical actor is about 35 pixels tall; do not draw actor. Fade facet presence by shape, not opacity, toward solid base within bottom half and last120 pixels at side edges. Preserve every rise and fall. NOT loose boulders or pebble clusters. ' if n!='roof' else 'Cave roof material, subdued broad irregular interlocking rock sheets rather than massive geometric triangles. Rock occupies above the lower boundary, white cave opening below. Follow contour from below with sparse inward-reaching layers and taper all details into solid base at upper and side edges. ')+'No humans, monsters, buildings, Buddha, trees, horizon, distant scenery, water, icons, text, outlines, tiny cracks, noise, grain, repeated tiles or decorative microdetail. Plain hard-edged vector color blocks suitable for Inkscape trace. Do not invent any platforms or change the outline.')
 (p/'prompt.txt').write_text(prompt)
