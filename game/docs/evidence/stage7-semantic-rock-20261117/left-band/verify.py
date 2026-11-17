from pathlib import Path
import xml.etree.ElementTree as E,copy,subprocess,json,base64,hashlib
from PIL import Image
import numpy as np
from scipy.ndimage import label
P=Path(__file__).parent;N='{http://www.w3.org/2000/svg}'
s=E.parse('stage7-semantic-study/lateral-edit/target.svg').getroot();s.set('width','4600');s.set('height','1600');E.ElementTree(s).write(P/'target-2x.svg');subprocess.run(['inkscape',str(P/'target-2x.svg'),'--export-filename='+str(P/'target-2x.png')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
a=np.asarray(Image.open(P/'source-contact.png').convert('RGBA'));b=np.asarray(Image.open(P/'target-2x.png').convert('RGBA'));opaque=b[:,:,3]==255;diff=np.any(a!=b,axis=2)
core=np.zeros(a.shape[:2],bool);core[:,round((9+450)*2):round((1434+450)*2)]=True
lab,n=label(a[:,:,3]>=128);counts=np.bincount(lab.ravel());counts[0]=0;main=counts.argmax()
floor=np.array(json.load(open('stage7-semantic-study/analysis.json'))['rootFloorSource']);xx=np.arange(a.shape[1])/2-450;yy=np.arange(a.shape[0])/2+750;protectedCore=core & (yy[:,None] <= np.interp(xx,floor[:,0],floor[:,1])[None,:]+24)
r={'protectedCoreChanged':int((diff&protectedCore).sum()),'protectedCorePixels':int(protectedCore.sum()),'generatedSHA256':hashlib.sha256(Path('stage7-semantic-study/lateral-edit/generated.png').read_bytes()).hexdigest(),'previousCandidateOpaquePixels':int(opaque.sum()),'changedPreviousOpaque':int((diff&opaque).sum()),'coreTransparentHolesChanged':int((diff&core&(b[:,:,3]==0)).sum()),'coreChanged':int((diff&core).sum()),'support':{}}
for side,lo,hi,y in [('left',-1200/3.13,8,991),('right',1447,1448+1200/3.13,884)]:
 cols=np.arange(int(np.floor((lo+450)*2)),int(np.ceil((hi+450)*2)));rows=np.arange(round((y-750)*2),round((y+24-750)*2)+1);v=a[rows[:,None],cols,3];components=lab[rows[:,None],cols]
 r['support'][side]={'halfPixelSamples':v.size,'alphaGE128':int((v>=128).sum()),'allConnectedToMainBody':bool((components==main).all()),'minAlpha':int(v.min())}
(P/'verification.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
