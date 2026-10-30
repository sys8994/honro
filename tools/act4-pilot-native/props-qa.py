#!/usr/bin/env python3
"""Compare image-free native vs optimized 600px previews produced by render-svg-target."""
import json
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np
from scipy.ndimage import label
P=Path(__file__).resolve().parents[2]/'art/act4-pilot-props-v2';out={}
for n in ['pine','reeds','rocks','marker']:
 a=np.array(Image.open('/tmp/props-'+n+'-native.png').convert('RGBA'));b=np.array(Image.open('/tmp/props-'+n+'-optimized.png').convert('RGBA'));assert a.shape==b.shape
 aa=a[:,:,3];bb=b[:,:,3];pa=a[:,:,:3].astype(float)*aa[:,:,None]/255;pb=b[:,:,:3].astype(float)*bb[:,:,None]/255
 def holes(alpha):
  t=alpha<128;lab,num=label(t); edge=np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]]));areas=np.bincount(lab.ravel());ids=[i for i in range(1,num+1) if i not in edge];return {'count':len(ids),'pixels':int(sum(areas[i] for i in ids)),'largestPixels':int(max([areas[i] for i in ids] or [0]))}
 region=json.loads((P/n/'region.json').read_text())['region'];x,y,w0,h0=region
 source=np.array(Image.open(P/'concept.png').convert('RGBA').crop((x,y,x+w0,y+h0)).resize((a.shape[1],a.shape[0]),Image.Resampling.LANCZOS))
 sa=source[:,:,3];sp=source[:,:,:3].astype(float)*sa[:,:,None]/255
 source_diff={'meanAbsAlpha255':float(np.abs(sa.astype(float)-aa).mean()),'meanAbsPremultipliedRGB255':float(np.abs(sp-pa).mean()),'binaryAlphaDisagreementPixels':int(np.count_nonzero((sa>=128)!=(aa>=128)))}
 out[n]={'sourcePNGvsNative':source_diff,'renderPixels':[int(a.shape[1]),int(a.shape[0])],'meanAbsAlpha255':float(np.abs(aa.astype(float)-bb).mean()),'meanAbsPremultipliedRGB255':float(np.abs(pa-pb).mean()),'binaryAlphaDisagreementPixels':int(np.count_nonzero((aa>=128)!=(bb>=128))),'nativeHoles':holes(aa),'optimizedHoles':holes(bb)}
 # Composite on checkerboard; both use the exact same viewport.
 h,w=aa.shape; im=Image.new('RGB',(2*w,h+25));d=ImageDraw.Draw(im)
 for ox in (0,w):
  for y in range(0,h,16):
   for x in range(0,w,16):d.rectangle((ox+x,y+25,ox+x+15,y+40),fill=('#d2d2d2' if (x//16+y//16)%2 else '#eeeeee'))
 im.paste(Image.fromarray(a),(0,25),Image.fromarray(a));im.paste(Image.fromarray(b),(w,25),Image.fromarray(b));d=ImageDraw.Draw(im);d.text((5,5),'native vector, image removed',fill='black');d.text((w+5,5),'optimized',fill='black');im.save('/tmp/props-'+n+'-comparison.png')
(P/'comparison.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
