import argparse,hashlib,base64,concurrent.futures,json,os,re,subprocess,xml.etree.ElementTree as E
from pathlib import Path
import numpy as np
from PIL import Image
p=argparse.ArgumentParser();p.add_argument('merged',type=Path);p.add_argument('output',type=Path);p.add_argument('--image',type=Path);p.add_argument('--speckles',type=int,default=16);p.add_argument('--protected-colors',default='');p.add_argument('--remove-white-background',action='store_true');a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS)
r=E.parse(a.merged/'merged.svg').getroot();colors=sorted(set(re.findall(r'#[0-9a-fA-F]{6}', ''.join(e.get('style','') for e in r.iter()))),key=lambda c:sum(w*int(c[i:i+2],16) for w,i in zip([.2126,.7152,.0722],[1,3,5])))
im=np.asarray(Image.open(a.image or a.merged/'merged.png').convert('RGBA'));h,w=im.shape[:2];palette=np.array([[int(c[i:i+2],16) for i in [1,3,5]] for c in colors]);idx=np.argmin(np.sum((im[:,:,:3].astype(float)[:,:,None,:]-palette[None,None,:,:])**2,axis=3),axis=2);solid=im[:,:,3]>=128
if a.remove_white_background: solid &= np.min(im[:,:,:3],axis=2)<245
root=Path('/workspace/scratch/fff510b4df37');env=dict(os.environ,LD_PRELOAD=str(root/'honro-sideview-concepts/vector-test/init_wrappers.so'),INKSCAPE_PROFILE_DIR='/tmp/honro-fixed-palette',XDG_CACHE_HOME='/tmp/honro-font-cache')
def trace(i):
 folder=a.output/f'layer{i:02}';folder.mkdir(exist_ok=True);mask=solid&(idx>=i);Image.fromarray(np.where(mask,0,255).astype('uint8')).save(folder/'mask.png')
 (folder/'input.svg').write_text(f'<svg xmlns="{NS}" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><image id="source-bitmap" width="{w}" height="{h}" xlink:href="data:image/png;base64,{base64.b64encode((folder/"mask.png").read_bytes()).decode()}"/></svg>')
 ev=dict(env,INKSCAPE_PROFILE_DIR=f'/tmp/honro-fixed-{hashlib.sha256(str(a.output.resolve()).encode()).hexdigest()[:16]}-{i}');params=f'2,false,true,true,{0 if i==0 or colors[i] in a.protected_colors.split(',') else a.speckles},0.7,0.2'
 subprocess.run(['inkscape',str(folder/'input.svg'),'--batch-process',f'--actions=select-by-id:source-bitmap;object-trace:{params};export-filename:{folder/"traced.svg"};export-do'],env=ev,check=True,stdout=open(folder/'trace.log','w'),stderr=subprocess.STDOUT)
 t=E.parse(folder/'traced.svg').getroot();g=E.Element('{'+NS+'}g',{'id':f'color-{i}'})
 for e in t.iter():
  if e.tag.split('}')[-1]=='path':
   # Binary trace contains a black foreground only after white-background removal.
   style=e.get('style','');m=re.search(r'fill:(#[0-9a-fA-F]{6})',style)
   if not m or m[1].lower()!='#000000':
    from scipy.ndimage import label
    labels,n=label(mask);sizes=np.bincount(labels.ravel())[1:];largest=int(sizes.max()) if len(sizes) else 0
    if m and m[1].lower() in ['#ffffff','#fefefe'] and i>0 and colors[i] not in a.protected_colors.split(',') and largest<=a.speckles:
     (folder/'empty-layer.json').write_text(json.dumps({'reason':'All foreground components below explicit speckle threshold; reject Inkscape white background rectangle','largestComponent':largest,'threshold':a.speckles}));continue
    raise ValueError(('Unexpected binary color',style))
   e.set('style',style.replace('#000000',colors[i]));g.append(e)
 return g
out=E.Element('{'+NS+'}svg',{'width':str(w),'height':str(h),'viewBox':f'0 0 {w} {h}'})
with concurrent.futures.ThreadPoolExecutor(3) as pool:
 for g in pool.map(trace,range(len(colors))):out.append(g)
E.ElementTree(out).write(a.output/'raw.svg',encoding='utf-8',xml_declaration=True);subprocess.run(['inkscape',str(a.output/'raw.svg'),f'--export-filename={a.output/"raw.png"}'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
report={'colors':colors,'source':str(a.image or a.merged/'merged.png'),'paletteSource':str(a.merged/'merged.svg'),'bytes':(a.output/'raw.svg').stat().st_size,'method':'Fixed semantic palette, cumulative binary Inkscape traces; no random color-cluster substitution','visualReview':'PENDING'};(a.output/'trace-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
