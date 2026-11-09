"""Separate source/trace/semantic authoring/contact errors for bier asset.
Automatic records go to _local/reports, never become artwork approval.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,hashlib
p=Path(__file__).resolve().parent;out=Path('_local/reports/act2-redesign-20261109/bier');out.mkdir(parents=True,exist_ok=True)
paths={'source':p/'source-v1.png','native16':p/'native-v1-16smooth4/raw.png','underpaint':p/'authored-v5/underpaint-authored.png','floralRoi':p/'authored-v5/roi-authored.png','contact':p/'authored-v5/contact-authored.png'}
paths={k:(v if v.exists() else out/v.relative_to(p))for k,v in paths.items()}
images={k:Image.open(v).convert('RGBA')for k,v in paths.items()};arrays={k:np.array(v).astype(float)for k,v in images.items()}
def metrics(a,b):
 aa,bb=arrays[a],arrays[b];rgbA=aa[:,:,:3]*aa[:,:,3:]/255;rgbB=bb[:,:,:3]*bb[:,:,3:]/255;d=np.abs(rgbA-rgbB);ad=np.abs(aa[:,:,3]-bb[:,:,3]);return {'from':a,'to':b,'premultRgbMAE255':float(d.mean()),'rgbMax255':float(d.max()),'alphaMAE255':float(ad.mean()),'alphaChangedPixels':int((ad>0).sum())}
rows=[metrics('source','native16'),metrics('native16','underpaint'),metrics('underpaint','floralRoi'),metrics('floralRoi','contact')]
roi_report=[];reg=json.loads((p/'registration-contract.json').read_text())
for name,(x,y,w,h) in reg['semanticProtectedRoisSourcePixels'].items():
 row={'roi':name,'sourceBox':[x,y,w,h]}
 for label in ['native16','floralRoi']:
  a=arrays['source'][y:y+h,x:x+w];b=arrays[label][y:y+h,x:x+w];row[label+'PremultRgbMAE255']=float(np.abs(a[:,:,:3]*a[:,:,3:]/255-b[:,:,:3]*b[:,:,3:]/255).mean())
 roi_report.append(row)
 if name in ['centerMedallion','westFlagFlower','eastFlagFlower']:
  board=Image.new('RGB',(w*6,h*2+24),'#e5e1d8');draw=ImageDraw.Draw(board)
  for i,label in enumerate(['source','native16','floralRoi']):
   im=images[label].crop((x,y,x+w,y+h)).resize((w*2,h*2));white=Image.new('RGBA',im.size,'#e5e1d8');white.alpha_composite(im);board.paste(white.convert('RGB'),(i*w*2,24));draw.text((i*w*2+4,4),label,fill='black')
  board.save(out/(name+'-source-global-restored-200pct.png'))
lowerY=335;alphaChanged=int((arrays['native16'][lowerY:,:,3]!=arrays['contact'][lowerY:,:,3]).sum())
report={'scope':'Source trace loss and intentional authored changes; NOT RAW-to-optimized error. RGB is premultiplied over black.','sourcePixels':list(images['source'].size),'steps':rows,'protectedSourceRois':roi_report,'lowerAlphaCheck':{'sourcePixelYMin':lowerY,'native16ToContactChangedPixels':alphaChanged,'meaning':'Native lower cloth/legs/handles alpha retained; not scene floor burial approval.'},'sha256':{k:hashlib.sha256(v.read_bytes()).hexdigest()for k,v in paths.items()},'visualReview':'Original/global/ROI comparison and existing engine normal/200% inspected; final world layer/burial pending parent scene review.'}
(out/'production-loss.json').write_text(json.dumps(report,indent=2));print(json.dumps({'steps':rows,'lowerAlphaChangedPixels':alphaChanged}))
