from PIL import Image
import numpy as np
from scipy.signal import fftconvolve
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
src=Image.open(ROOT/'art/stage42-edge/source.png').convert('RGB');tar=np.array(Image.open(ROOT/'art/stage42-edge/registered-edge-concept.png').convert('RGB')).mean(2)
for box in [(870,180,960,420),(1370,100,1480,210),(20,250,140,300),(510,390,650,490)]:
 best=None
 for scale in np.arange(.88,1.001,.01):
  a=np.array(src.crop(box).resize((round((box[2]-box[0])*scale),round((box[3]-box[1])*scale)))).mean(2);a=a-a.mean();k=np.ones(a.shape);mu=fftconvolve(tar,k,'valid');var=fftconvolve(tar**2,k,'valid')-mu**2/a.size
  c=fftconvolve(tar,a[::-1,::-1],'valid')/np.sqrt(np.maximum(1,var)*np.sum(a*a));idx=np.unravel_index(np.argmax(c),c.shape);score=c[idx]
  if best is None or score>best[0]:best=(float(score),float(scale),idx)
 print(box,best,flush=True)
