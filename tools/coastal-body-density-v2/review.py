#!/usr/bin/env python3
import json,subprocess
from pathlib import Path
from PIL import Image
import numpy as np
for n in [33,37,39,40]:
 p=Path(f'art/stage{n}-density-v2');cfg=json.load(open(p/'body-config.json'));r=json.load(open(p/'body-edit-report.json'));r['paletteToFinal']={}
 for label,zoom in [('normal',.53),('max',1.10)]:
  w=round(cfg['bounds']['w']*zoom)
  for kind in ['palette','final']:
   subprocess.run(['node','tools/vector-production/render-svg-target.mjs',str(p/f'body-{kind}.svg'),f'/tmp/s{n}-{kind}-{label}.png',str(w)],check=True,stdout=subprocess.DEVNULL)
  a=np.array(Image.open(f'/tmp/s{n}-palette-{label}.png')).astype(float);b=np.array(Image.open(f'/tmp/s{n}-final-{label}.png')).astype(float);d=abs(a-b);r['paletteToFinal'][label]={'width':w,'worldZoom':zoom,'rgbMAE255':float(d[:,:,:3].mean()),'rgbMax255':float(d[:,:,:3].max()),'alphaChangedPixels':int((d[:,:,3]>0).sum()),'alphaMax255':float(d[:,:,3].max()),'binarySilhouetteChangedPixelsAlpha128':int(((a[:,:,3]>127)!=(b[:,:,3]>127)).sum())}
  im=Image.open(f'/tmp/s{n}-final-{label}.png');pixels=np.array(im);x=w//2;y=max(0,int(np.where(pixels[:,x,3]>127)[0][0])-80);im.crop((x-600,y,x+600,y+800)).save(p/f'body-review-{label}.png')
 (p/'body-edit-report.json').write_text(json.dumps(r,ensure_ascii=False,indent=2));print(n,r['runtimeBytes'],r['paletteToFinal'],flush=True)
