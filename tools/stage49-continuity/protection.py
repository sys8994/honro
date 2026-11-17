"""Native source-preservation partition along existing paint edges, with all contact corridors kept."""
from pathlib import Path
from lxml import etree as E
import json,subprocess,os
import numpy as np
from PIL import Image
R=Path(__file__).resolve().parents[2];O=R/'art/stage49-continuity/source';ns='{http://www.w3.org/2000/svg}'
im=np.array(Image.open(R/'_local/stage49/source-native.png').convert('RGBA'));rgb=im[:,:,:3].astype(float)
def seam(data,lo,hi,target):
 gradient=np.linalg.norm(data[:,2:]-data[:,:-2],axis=2);values=np.arange(lo,hi);cost=-np.minimum(gradient[:,values-1],90)*.08+abs(values-target)[None,:]*.08
 prev=cost[0];back=[]
 for row in cost[1:]:
  choices=[]
  for d in range(-3,4):
   ar=np.full(len(values),1e8);a=max(0,d);b=min(len(values),len(values)+d);ar[a:b]=prev[a-d:b-d]+abs(d)*.3;choices.append(ar)
  a=np.stack(choices);idx=a.argmin(0);back.append(np.arange(len(values))-(idx-3));prev=a.min(0)+row
 idx=int(prev.argmin());out=[int(values[idx])]
 for b in reversed(back):idx=int(b[idx]);out.append(int(values[idx]))
 return out[::-1]
w=seam(rgb,8,55,25);e=seam(rgb,969,1016,997);b=seam(rgb.transpose(1,0,2),1422,1460,1440)
pts=[[w[y],y]for y in range(0,1422)]+[[x,b[x]]for x in range(w[1421],e[1421]+1)]+[[e[y],y]for y in range(1421,-1,-1)]
r=E.Element(ns+'svg',nsmap={None:ns[1:-1]},viewBox='-1100 -3300 3300 7900');E.SubElement(r,ns+'path',id='body',d='M'+'L'.join(f'{x},{y}'for x,y in pts)+'Z')
lines=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import{terrain}from'./shared/data/act5/terrain.mjs';console.log(JSON.stringify(terrain[8].lines))"],cwd=R,text=True))
acts=[]
for i,(_,ps) in enumerate(lines):
 # Protect source rail/stair art around every authored contact; the path is selection only.
 E.SubElement(r,ns+'path',id=f'contact-{i}',d='M'+'L'.join(f'{x},{y-8}'for x,y in ps),fill='none',stroke='black',**{'stroke-width':'52','stroke-linecap':'round','stroke-linejoin':'round'})
 acts+=['select-clear',f'select-by-id:contact-{i}','object-stroke-to-path']
E.SubElement(r,ns+'path',id='source-rect',d='M0 0H1024V1536H0Z');t=E.ElementTree(r);t.write(str(O/'protection-input.svg'));acts+=['select-clear','select-by-id:body,contact-0,contact-1,contact-2,contact-3,contact-4,contact-5,contact-6,contact-7','path-union','select-clear','select-all','path-intersection','select-clear','export-plain-svg',f'export-filename:{O/"protection-native.svg"}','export-do'];p=subprocess.run(['inkscape',str(O/'protection-input.svg'),'--batch-process','--actions='+';'.join(acts)],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'},capture_output=True,text=True);p.check_returncode();t=E.parse(str(O/'protection-native.svg'));paths=[p.get('d')for p in t.findall('.//'+ns+'path')];assert len(paths)==1
json.dump({'sourcePreserved':paths,'method':'source color-edge partition plus 52-source-unit corridors centered 8 units above every existing walk segment; no collision changes'},open(R/'art/stage49-continuity/protection.json','w'))
