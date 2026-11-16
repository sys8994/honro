from pathlib import Path
from lxml import etree as E
from PIL import Image
import json,subprocess,os,numpy as np
R=Path(__file__).resolve().parents[2];O=R/'_local/stage47/mask-check';O.mkdir(exist_ok=True);ns='{http://www.w3.org/2000/svg}';v=json.loads((R/'shared/assets/environment/act5/near-import.json').read_text())[6]['vector'];r=E.Element(ns+'svg',nsmap={None:ns[1:-1]},viewBox='0 0 1024 1536',width='1024',height='1536')
for k in ['a','b']:E.SubElement(r,ns+'path',d=v['clips'][k][0],fill='#000000')
E.ElementTree(r).write(str(O/'original.svg'));t=E.parse(str(R/'art/stage47-continuity/source/protected-alpha.svg'));r=t.getroot();r.set('viewBox','270 810 251.34545454545454 377.0181818181818');r.set('width','1024');r.set('height','1536');t.write(str(O/'final.svg'))
for k in ['original','final']:subprocess.run(['inkscape',str(O/(k+'.svg')),'--export-filename='+str(O/(k+'.png'))],capture_output=True,check=True,env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'})
a,b=[np.array(Image.open(O/(k+'.png')).convert('RGBA'))[:,:,3]for k in ['original','final']];d=abs(a.astype(float)-b);report={'alphaMAE255':float(d.mean()),'pixelsDifferenceOver128':int((d>128).sum()),'totalPixels':int(d.size),'scope':'Same Inkscape rasterizer; exact original BODY silhouettes restored inside source rectangle, not color match or gameplay.'};(O/'report.json').write_text(json.dumps(report,indent=2));print(report)
