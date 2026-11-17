from pathlib import Path
from PIL import Image
import numpy as np,xml.etree.ElementTree as E,copy,subprocess,json,base64
P=Path(__file__).parent;N='{http://www.w3.org/2000/svg}';b=E.parse('stage7-semantic-study/lateral-edit/target.svg').getroot();
for pp in b.iter():
 for cc in list(pp):
  if cc.tag==N+'image' and cc.get('mask')=='url(#editable)':pp.remove(cc)
r={};floor=np.array(json.load(open('stage7-semantic-study/analysis.json'))['rootFloorSource']);colors=np.array([[197,155,92],[174,144,86],[156,132,47],[139,119,43],[102,88,35]])
for name in ['full','portrait-left','desktop-right','join','source-contact']:
 s=E.parse(P/(name+'.svg')).getroot();box=list(map(float,s.get('viewBox').split()));w=int(s.get('width'));h=int(s.get('height'));q=copy.deepcopy(b);q.set('viewBox',s.get('viewBox'));q.set('width',str(w));q.set('height',str(h));E.ElementTree(q).write(P/(name+'-original.svg'));subprocess.run(['inkscape',str(P/(name+'-original.svg')),'--export-filename='+str(P/(name+'-original.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 a=np.array(Image.open(P/(name+'.png')).convert('RGBA'));orig=np.array(Image.open(P/(name+'-original.png')).convert('RGBA'));before=np.array(Image.open('stage7-semantic-study/lateral-edit/'+name+'.png').convert('RGBA'));diff=np.any(a!=before,axis=2);yy=box[1]+np.arange(h)*box[3]/h;xx=box[0]+np.arange(w)*box[2]/w;protect=(xx[None,:]>=9)&(xx[None,:]<1434)&(yy[:,None]<=np.interp(xx,floor[:,0],floor[:,1])[None,:]+24)
 warm=np.min(np.max(abs(orig[:,:,:3].astype(int)[:,:,None,:]-colors),axis=3),axis=2)<=1;warm&=orig[:,:,3]==255
 # Actual original grass anywhere, excluding left fake915 strip that is intentionally removed.
 warm&=~((xx[None,:]<9)&(yy[:,None]<991))
 r[name]={'protectedCorePixels':int(protect.sum()),'changedVsPreviousStudy':int((diff&protect).sum()),'protectedCoreChangedVsOriginal':int((np.any(a!=orig,axis=2)&protect).sum()),'opaqueWarmSourcePixels':int(warm.sum()),'rawWarmRGBChanged':int((np.any(a[:,:,:3]!=orig[:,:,:3],axis=2)&warm).sum()),'artificialClosureWarmChanged':int((np.any(a[:,:,:3]!=orig[:,:,:3],axis=2)&warm&(xx[None,:]>=0)&(xx[None,:]<=40)&(yy[:,None]>=1070)).sum()),'semanticWarmRGBChanged':int((np.any(a[:,:,:3]!=orig[:,:,:3],axis=2)&warm&~((xx[None,:]>=0)&(xx[None,:]<=40)&(yy[:,None]>=1070))).sum())}
 bg=base64.b64encode(Path('stage7-semantic-study/corrected/background-decoded.png').read_bytes()).decode();s.insert(0,E.Element(N+'image',x=str(box[0]),y=str(box[1]),width=str(box[2]),height=str(box[3]),preserveAspectRatio='none',href='data:image/png;base64,'+bg));E.ElementTree(s).write(P/(name+'-game.svg'));subprocess.run(['inkscape',str(P/(name+'-game.svg')),'--export-filename='+str(P/(name+'-game.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
(P/'verification.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
