from PIL import Image,ImageDraw
import numpy as np,json,hashlib
from scipy.ndimage import gaussian_filter
from pathlib import Path
base=Path('_local/estuary-compression');src=Image.open('art/act4-estuary-far-v1/source.png').convert('RGB');a=np.asarray(src).astype(float)
def ssim(a,b):
    # Standard 11x11 Gaussian (sigma 1.5), valid interior, per-channel mean.
    ux=gaussian_filter(a,sigma=(1.5,1.5,0),truncate=3.5);uy=gaussian_filter(b,sigma=(1.5,1.5,0),truncate=3.5)
    vx=gaussian_filter(a*a,sigma=(1.5,1.5,0),truncate=3.5)-ux*ux;vy=gaussian_filter(b*b,sigma=(1.5,1.5,0),truncate=3.5)-uy*uy
    cov=gaussian_filter(a*b,sigma=(1.5,1.5,0),truncate=3.5)-ux*uy
    m=((2*ux*uy+6.5025)*(2*cov+58.5225))/((ux*ux+uy*uy+6.5025)*(vx+vy+58.5225))
    return float(m[5:-5,5:-5].mean())
ims=[src];report=[]
for q in [90,85,80]:
    p=base/f'q{q}.webp';im=Image.open(p).convert('RGB');b=np.asarray(im).astype(float);e=np.abs(a-b);mse=np.mean((a-b)**2)
    report.append(dict(quality=q,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),width=im.width,height=im.height,mae=float(e.mean()),p95=float(np.percentile(e,95)),p99=float(np.percentile(e,99)),max=int(e.max()),psnr=float(10*np.log10(255**2/mse)),ssimRGB=ssim(a,b)))
    ims.append(im)
for label,im in zip(['source','q90','q85','q80'],ims): im.resize((2048,682),Image.Resampling.LANCZOS).save(base/f'normal-{label}.png')
regions=[('reed island',(660,270,916,450)),('bright reflection',(1380,400,1636,580)),('quiet water and sky',(330,75,586,255)),('low contrast water',(230,490,486,670))]
sheet=Image.new('RGB',(2048,len(regions)*390),'#ddd');d=ImageDraw.Draw(sheet)
for row,(name,box) in enumerate(regions):
 for col,(label,im) in enumerate(zip(['source','q90','q85','q80'],ims)):
  x=col*512;y=row*390;d.text((x+8,y+8),name+' / '+label,fill='black');sheet.paste(im.crop(box).resize((512,360),Image.Resampling.NEAREST),(x,y+30))
sheet.save(base/'detail-sheet.png');(base/'measurements.json').write_text(json.dumps({'ssimDefinition':'RGB mean, Gaussian 11x11 sigma1.5 population covariance; valid interior','results':report},indent=2));print(json.dumps(report,indent=2))
