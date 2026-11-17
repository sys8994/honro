import xml.etree.ElementTree as E,copy,json,subprocess,base64
from pathlib import Path
P=Path(__file__).parent;NS='{http://www.w3.org/2000/svg}';original=E.parse('stage7-exterior-study/body-original.svg').getroot();src=Path('stage7-semantic-study/original-author.mjs').read_text();foots=json.loads(src.split('const footholds=')[1].split(';')[0]);defs=copy.deepcopy(original.find(NS+'defs'));symbol=E.SubElement(defs,'g',id='original-body-source')
for g in list(original)[1:]:symbol.append(copy.deepcopy(g))
root=E.Element('svg',xmlns='http://www.w3.org/2000/svg',width='2300',height='700',viewBox='-450 750 2300 700');root.append(defs);E.SubElement(root,'use',href='#original-body-source')
for i,(x,y,w,h,dx,dy,dw,walk) in enumerate(foots):
 s=dw/w;clip=E.SubElement(defs,'clipPath',id='cap-'+str(i),clipPathUnits='userSpaceOnUse');E.SubElement(clip,'rect',x=str(x),y=str(y),width=str(w),height=str(h));g=E.SubElement(root,'g',transform=f'matrix({s},0,0,{s},{dx-x*s},{dy-y*s})',**{'clip-path':f'url(#cap-{i})'});E.SubElement(g,'use',href='#original-body-source')
for i,(x,y,w,h,dx,dy,dw,dh) in enumerate([[9,908,30,157,9,908,-390,157],[1421,882,13,181,1834,882,-400,181],[16,1049,1402,19,16,1068,1402,380]]):
 sx=dw/w;sy=dh/h;clip=E.SubElement(defs,'clipPath',id='edge-'+str(i),clipPathUnits='userSpaceOnUse');E.SubElement(clip,'rect',x=str(x),y=str(y),width=str(w),height=str(h));g=E.SubElement(root,'g',transform=f'matrix({sx},0,0,{sy},{dx-x*sx},{dy-y*sy})',**{'clip-path':f'url(#edge-{i})'});E.SubElement(g,'use',href='#original-body-source')
E.ElementTree(root).write(P/'baseline-collage.svg')
for variant in ['baseline','raw-study','with-original-sides']:
 if variant=='baseline':s=copy.deepcopy(root)
 else:
  q=E.parse('stage7-semantic-study/corrected/desktop-join.svg').getroot();s=E.Element('svg',xmlns='http://www.w3.org/2000/svg',width='2300',height='700',viewBox='-450 750 2300 700');s.append(copy.deepcopy(q.find(NS+'defs')))
  if variant=='raw-study':
   for g in list(original)[1:]:s.append(copy.deepcopy(g))
  else:
   # Additional defs include unmodified source and collage clip IDs.
   s.append(copy.deepcopy(defs))
   for g in list(root)[1:]:s.append(copy.deepcopy(g))
  s.append(copy.deepcopy(list(q)[-1]))
 # Actual physical sole, NOT proposed art.
 line=[[-1200/3.13,991]]+json.load(open('stage7-semantic-study/analysis.json'))['rootFloorSource']+[[1448+1200/3.13,884]]
 E.SubElement(s,'path',d='M '+' L '.join(f'{x},{y}' for x,y in line),fill='none',stroke='#00ffff',**{'stroke-width':'2'})
 E.SubElement(s,'path',d='M-381,915H9 M1434,882H1834',fill='none',stroke='#ff00ff',**{'stroke-width':'2','stroke-dasharray':'6 4'})
 E.ElementTree(s).write(P/(variant+'.svg'));subprocess.run(['inkscape',str(P/(variant+'.svg')),'--export-filename='+str(P/(variant+'.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
