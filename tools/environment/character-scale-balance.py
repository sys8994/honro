from PIL import Image
import numpy as np
from scipy.ndimage import gaussian_filter
from pathlib import Path
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--source',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
p=args.output
p.mkdir(parents=True,exist_ok=True)
a=np.asarray(Image.open(args.source).convert('RGBA'))
b=np.asarray(Image.open(p/'mild.png').convert('RGBA'))
s=np.asarray(Image.open(p/'strong.png').convert('RGBA'))
f=a[:,:,:3].astype(float)/255
# Conservative material-color proxy, not semantic segmentation.
hsv=np.asarray(Image.fromarray(a[:,:,:3]).convert('HSV')).astype(float)
fol=(hsv[:,:,0]>38)&(hsv[:,:,0]<105)&(hsv[:,:,1]>38)
fol=gaussian_filter(fol.astype(float),3)
base=.85*b[:,:,:3]+.15*s[:,:,:3]
# Keep more original leaf structure; no new marks introduced.
out=base*(1-.35*fol[:,:,None])+a[:,:,:3]*(.35*fol[:,:,None])
result=np.dstack([np.uint8(np.clip(out,0,255)),a[:,:,3]])
Image.fromarray(result).save(p/'balanced.png')
print('alpha identical:',np.array_equal(result[:,:,3],a[:,:,3]))
