"""Derive an alpha partition from source colour edges below protected contacts.
No terrain or colour path is authored here. Pixel-edge diagnostic, not art approval.
"""
from pathlib import Path
import json,subprocess
import numpy as np
from PIL import Image
from svgpathtools import parse_path
from scipy.ndimage import gaussian_filter
A=Path(__file__).resolve().parent;R=A.parents[1]
im=np.array(Image.open(A/'source-native.png').convert('RGBA'));rgb=im[:,:,:3].astype(float);h,w=im.shape[:2]
lines=json.loads(subprocess.run(['node','--input-type=module','-e',"import{terrain}from'./shared/data/act5/terrain.mjs';console.log(JSON.stringify(terrain[7].lines))"],cwd=R,capture_output=True,text=True,check=True).stdout)
low=np.full(w,260.);x=np.arange(w)
for key,ps in lines:
 p=np.array(ps)*1.5
 for a,b in zip(p,p[1:]):
  if b[0]<=a[0]:continue
  yes=(x>=a[0])&(x<=b[0]);low[yes]=np.maximum(low[yes],a[1]+(x[yes]-a[0])*(b[1]-a[1])/(b[0]-a[0])+15)
# Follow existing painted edge gradients; the soft target merely selects the lower support region.
target=np.interp(x,[0,150,300,500,800,1050,1250,1450,1535],[646,590,595,644,644,640,620,520,500]);target=np.maximum(target,low+2)
y=np.arange(260,650);gradient=np.linalg.norm(rgb[y+1]-rgb[y-1],axis=2);cost=-np.minimum(gradient,120)*.05+abs(y[:,None]-target)*.025
cost[y[:,None]<low]=1e6
# Keep seam on source rock when present; outside source edge has no source pixels to discard.
for j in range(w):
 valid=im[y,j,3]>240
 if valid.any():cost[~valid,j]+=30
prev=cost[:,0].copy();back=np.zeros((len(y),w),np.int16)
for j in range(1,w):
 choices=[]
 for d in range(-4,5):
  arr=np.full(len(y),1e9);lo=max(0,d);hi=min(len(y),len(y)+d);arr[lo:hi]=prev[lo-d:hi-d]+abs(d)*.3;choices.append(arr)
 z=np.stack(choices);idx=z.argmin(0);back[:,j]=np.arange(len(y))-(idx-4);prev=z.min(0)+cost[:,j]
row=int(prev.argmin());pts=[]
for j in range(w-1,-1,-1):pts.append([j,int(y[row])]);row=int(back[row,j]) if j else row
pts=pts[::-1]
# Exact per-column edge, compressed only across collinear samples.
keep=[pts[0]]
for i in range(1,len(pts)-1):
 if pts[i][1]-pts[i-1][1]!=pts[i+1][1]-pts[i][1]:keep.append(pts[i])
keep.append(pts[-1]);d='M-10,-10H1546V'+str(keep[-1][1])+'L'+' '.join(f'{p[0]},{p[1]}'for p in reversed(keep))+'L-10,'+str(keep[0][1])+'Z'
json.dump({'sourceNativeClips':[parse_path(d).d() for v in next(q for q in json.load(open(R/'shared/assets/environment/act5/near-import.json')) if q['id']==48)['vector']['clips'].values() for d in v],'version':1,'sourceWidth':w,'sourceHeight':h,'clip':d,'method':'source color-edge dynamic path below authored contacts +15 source units; no new color faces or collision','contactMinMargin':float(np.min(np.array([p[1]for p in pts])-low+15)),'points':keep},open(A/'source-seam.json','w'),indent=2)
