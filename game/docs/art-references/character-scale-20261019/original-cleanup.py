from PIL import Image, ImageDraw
import numpy as np
from scipy.ndimage import gaussian_filter, maximum_filter, minimum_filter
from pathlib import Path
p=Path(__file__).parent
src=Image.open(p.parent/'forest-sideview-medium-detail.png').convert('RGBA')
a=np.asarray(src).astype(np.float32)/255
rgb=a[:,:,:3]; alpha=a[:,:,3]
# Smooth guidance suppresses microcontrast while joint weighting avoids crossing broad material boundaries.
def joint_smooth(radius, color):
 guide=gaussian_filter(rgb,(2.2,2.2,0))
 pad=radius
 g=np.pad(guide,((pad,pad),(pad,pad),(0,0)),mode='edge')
 s=np.pad(rgb,((pad,pad),(pad,pad),(0,0)),mode='edge')
 ap=np.pad(alpha,((pad,pad),(pad,pad)),mode='edge')
 h,w=alpha.shape; total=np.zeros_like(rgb); weights=np.zeros_like(alpha)
 for dy in range(-radius,radius+1,2):
  for dx in range(-radius,radius+1,2):
   other=g[pad+dy:pad+dy+h,pad+dx:pad+dx+w]
   wt=np.exp(-((other-guide)**2).sum(2)/(2*color**2)-(dx*dx+dy*dy)/(2*(radius/2)**2))*ap[pad+dy:pad+dy+h,pad+dx:pad+dx+w]
   total+=s[pad+dy:pad+dy+h,pad+dx:pad+dx+w]*wt[:,:,None];weights+=wt
 return total/np.maximum(weights[:,:,None],1e-8)
# Protect continuous stronger edges; this is geometric, not semantic recognition of roots.
gray=(rgb*np.array([.2126,.7152,.0722])).sum(2)
lo=gaussian_filter(gray,1.8)
gy,gx=np.gradient(lo);edge=np.hypot(gx,gy)
protect=np.clip((edge-.012)/.035,0,1)
protect=gaussian_filter(maximum_filter(protect,size=3),.7)
border=(maximum_filter(alpha,size=7)-minimum_filter(alpha,size=7))>.1
protect=np.maximum(protect,border)
outs=[]
for label,radius,color,strength in [('mild',8,.08,.65),('strong',12,.10,.90)]:
 smooth=joint_smooth(radius,color)
 mix=strength*(1-.88*protect)
 out=rgb*(1-mix[:,:,None])+smooth*mix[:,:,None]
 out=np.dstack([out,alpha]); im=Image.fromarray(np.uint8(np.clip(out,0,1)*255));im.save(p/f'{label}.png');outs.append(im)
# Comparative crop strips at native resolution; muted neutral backing reveals alpha consistently.
boxes=[(240,260,660,590),(900,520,1320,850)]
for i,box in enumerate(boxes):
 board=Image.new('RGB',(1260,370),(35,38,36));d=ImageDraw.Draw(board)
 for j,(title,im) in enumerate(zip(['ORIGINAL','MILD','STRONG'],[src]+outs)):
  d.text((j*420+12,10),title,fill='white'); crop=im.crop(box);board.paste(crop,(j*420,40),crop)
 board.save(p/f'compare-{i+1}.png')
print('Saved mild, strong and two native-scale comparisons; alpha preserved.')
