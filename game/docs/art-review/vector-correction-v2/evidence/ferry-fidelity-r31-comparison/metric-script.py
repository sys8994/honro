from PIL import Image,ImageDraw
from scipy.ndimage import gaussian_filter,sobel
import numpy as np,json
from pathlib import Path
out=Path('_local/reports/ferry-fidelity-48');src=np.array(Image.open('game/art-studies/ferry-foreground-authoring/reference.png').convert('RGB'),dtype=float)
rows=[]
for name in ['r30','palette-only','regions-merged','native']:
 a=np.array(Image.open(out/(name+'.png')).convert('RGB'),dtype=float);err=a-src
 gray=a@np.array([.2126,.7152,.0722]);gsrc=src@np.array([.2126,.7152,.0722])
 rows.append({'variant':name,'meanAbsoluteRGB':float(np.abs(err).mean()),'PSNRdB':float(10*np.log10(255**2/np.mean(err**2))),'broadFormMAE_sigma3':float(np.abs(gaussian_filter(a,(3,3,0))-gaussian_filter(src,(3,3,0))).mean()),'luminanceEdgeMAE':float(np.abs(np.hypot(sobel(gray,0),sobel(gray,1))-np.hypot(sobel(gsrc,0),sobel(gsrc,1))).mean())})
(out/'loss.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(rows,indent=2))
crop=(806,20,1424,432);cw,ch=618,412;sheet=Image.new('RGB',(cw*3,ch+36),'#ebebe3');d=ImageDraw.Draw(sheet)
for j,(name,path)in enumerate([('Source - same projection','game/art-studies/ferry-foreground-authoring/reference.png'),('r30 - 8 roles',out/'r30.png'),('48 colours / 0.55px native',out/'native.png')]):
 sheet.paste(Image.open(path).convert('RGB').crop(crop),(cw*j,36));d.text((cw*j+12,12),name,fill='#222')
sheet.save(out/'normal-source-crop-comparison.png')
