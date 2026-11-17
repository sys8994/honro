from pathlib import Path
import xml.etree.ElementTree as E,subprocess,copy,base64,json
from scipy.ndimage import distance_transform_edt
import numpy as np
from PIL import Image
P=Path(__file__).parent;NS='{http://www.w3.org/2000/svg}';rootline=np.array(json.load(open(P.parent/'semantic-analysis.json'))['rootFloorSource']);out=[]
for name in ['source','zoom-join','desktop-join','desktop-right','portrait-left','full']:
 r=E.parse(P/(name+'.svg')).getroot();box=list(map(float,r.get('viewBox').split()));W=int(r.get('width'));H=int(r.get('height'))
 # Exact original geometry at identical viewport and render backend.
 base=copy.deepcopy(r);base.remove(list(base)[-1]);E.ElementTree(base).write(P/(name+'-original.svg'));subprocess.run(['inkscape',str(P/(name+'-original.svg')),'--export-filename='+str(P/(name+'-original.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 a=np.array(Image.open(P/(name+'-original.png')).convert('RGBA'));b=np.array(Image.open(P/(name+'.png')).convert('RGBA'));xx=box[0]+(np.arange(W)+.5)*box[2]/W;yy=box[1]+(np.arange(H)+.5)*box[3]/H;line=np.interp(xx,rootline[:,0],rootline[:,1]);upper=yy[:,None] <=line[None,:]+24
 warm=np.zeros((H,W),bool)
 for c in ['c59b5c','ae9056','9c842f','8b772b','665823']:
  rgb=np.array([int(c[i:i+2],16)for i in(0,2,4)]);warm|=(abs(a[:,:,:3].astype(int)-rgb).max(axis=2)<=2)&(a[:,:,3]>128)
 warm &= (yy[:,None]<1070)&((distance_transform_edt(a[:,:,3]>0)>4*W/box[2])|upper)
 protect=upper|warm;diff=np.any(a!=b,axis=2);out.append({'view':name,'size':[W,H],'scale':W/box[2],'protectedPixels':int(protect.sum()),'protectedChanged':int((diff&protect).sum()),'warmPixels':int(warm.sum()),'warmChanged':int((diff&warm).sum())})
 for bg in ['gray','game']:
  s=copy.deepcopy(r)
  if bg=='gray':q=E.Element(NS+'rect',x=str(box[0]),y=str(box[1]),width=str(box[2]),height=str(box[3]),fill='#808080')
  else:q=E.Element(NS+'image',x=str(box[0]),y=str(box[1]),width=str(box[2]),height=str(box[3]),preserveAspectRatio='none',href='data:image/png;base64,'+base64.b64encode((P/'background-decoded.png').read_bytes()).decode())
  s.insert(1,q);E.ElementTree(s).write(P/(name+'-'+bg+'.svg'));subprocess.run(['inkscape',str(P/(name+'-'+bg+'.svg')),'--export-filename='+str(P/(name+'-'+bg+'.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
(P/'multiscale-protection.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
