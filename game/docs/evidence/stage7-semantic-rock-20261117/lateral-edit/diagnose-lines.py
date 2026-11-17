import xml.etree.ElementTree as E,copy,subprocess,json
from pathlib import Path
from PIL import Image
import numpy as np
P=Path(__file__).parent;N='{http://www.w3.org/2000/svg}';f=E.parse(P/'full.svg').getroot()
for name,mask in [('grass','grass-protection'),('eligible','editable')]:
 s=E.Element(N+'svg',width='1280',height='1198',viewBox='-1200 0 3848 3600');s.append(copy.deepcopy(f[0]));E.SubElement(s,N+'rect',x='-1200',y='0',width='3848',height='3600',fill='white',mask='url(#'+mask+')');E.ElementTree(s).write(P/('line-'+name+'.svg'));subprocess.run(['inkscape',str(P/('line-'+name+'.svg')),'--export-filename='+str(P/('line-'+name+'.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
a=np.array(Image.open(P/'full.png'));g=np.array(Image.open(P/'line-grass.png'));e=np.array(Image.open(P/'line-eligible.png'));r=[]
for y in range(352,359):
 for x in [405,415,425,435,450,480,510,525]:
  r.append({'pixel':[x,y],'source':[round(x*3848/1280-1200,2),round(y*3600/1198,2)],'rgba':a[y,x].tolist(),'grass':int(g[y,x,3]),'eligible':int(e[y,x,3])})
(P/'line-diagnosis.json').write_text(json.dumps(r,indent=2));print(json.dumps([v for v in r if v['pixel'][0] in [415,450,510]],indent=2))
