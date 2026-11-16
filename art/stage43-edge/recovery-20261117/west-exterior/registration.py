from PIL import Image
import numpy as np,json
from scipy.signal import correlate2d
from pathlib import Path
p=Path(__file__).parent
r=Image.open(p/'west-reference.png').convert('RGB');g=Image.open(p/'concept-narrow-v1.png').convert('RGBA');bg=Image.new('RGBA',g.size,'white');bg.alpha_composite(g);g=bg.convert('RGB')
print(r.size,g.size)
k=g.width/r.width
# Non-geological masonry anchors only, avoiding generated exterior.
rows=[]
for box in [(535,540,610,675),(650,300,700,350),(500,940,550,1050)]:
 q=r.crop(box).resize((round((box[2]-box[0])*k),round((box[3]-box[1])*k)))
 ex,ey=round(box[0]*k),round(box[1]*k);win=g.crop((ex-35,ey-35,ex+q.width+35,ey+q.height+35));a=np.asarray(win).mean(2);t=np.asarray(q).mean(2);t=t-t.mean();c=correlate2d(a,t,mode='valid');s=correlate2d(a,np.ones(t.shape),mode='valid');ss=correlate2d(a*a,np.ones(t.shape),mode='valid');score=c/np.sqrt(np.maximum(1,ss-s*s/t.size)*np.sum(t*t));y,x=np.unravel_index(np.argmax(score),score.shape);rows.append({'referenceBox':box,'scale':k,'offset':[int(x)-35,int(y)-35],'score':float(score[y,x])})
print(rows);(p/'registration.json').write_text(json.dumps({'referenceSize':r.size,'generatedSize':g.size,'rows':rows},indent=2))
