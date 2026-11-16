from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
import json,re,copy,os,subprocess
p=Path(__file__).parent;n='{http://www.w3.org/2000/svg}';src=E.parse(str(p/'composed-native-palette.svg'));defs=src.find('.//'+n+'defs');clips={}
def compact(d):
 d=re.sub(r'[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?',lambda m:format(round(float(m.group()),3),'.3f').rstrip('0').rstrip('.') if '.' in format(round(float(m.group()),3),'.3f').rstrip('0').rstrip('.') else str(int(round(float(m.group()),3))),d)
 return re.sub(r'\s+',' ',d).strip()
def chunks(d,lim=59000):
 parts=re.findall('[Mm][^Mm]*',d);out=[];s=''
 for x in parts:
  if len(s)+len(x)>lim and s:out.append(s);s=''
  assert len(x)<=lim,len(x)
  s+=x
 if s:out.append(s)
 return out
def inv(d):
 q=parse_path(d);area=sum((v.start.real*v.end.imag-v.end.real*v.start.imag)for v in q)
 if area>0:q=q.reversed()
 return 'M-10 -10H2182V1034H-10Z '+q.d()
for id in ['contact-domain','source-alpha-or-deep']:
 cp=defs.find(n+'clipPath[@id="'+id+'"]');ds=[]
 for ch in cp:
  if ch.tag==n+'path':ds.append(ch.get('d'))
  elif ch.tag==n+'rect':
   deepd=E.parse(str(p.parent.parent/'stage43-recovery-deep-study/body-alpha.svg')).find('.//'+n+'path').get('d');ds.append(parse_path(deepd).scaled(2.3815789473684212).translated(complex(-42.86842105263158,-9.216842105263254)).d())
 clips[id]=chunks(compact(' '.join(ds)))
for i in [5,2,4]:clips[f'inverse-{i}']=chunks(compact(inv(E.parse(str(p/f'culled-{i}.svg')).find('.//'+n+'path').get('d'))))
clips['inverse-bridge']=chunks(compact(inv(defs.find(n+'clipPath[@id="b"]/'+n+'path').get('d'))))
a=E.parse(str(p.parent/'trace-v1/alpha-raw.svg')).find('.//'+n+'path');s=2172/1825;clips['generated-alpha']=chunks(compact(parse_path(a.get('d')).scaled(s).translated(-s*1j).d()))
g=src.find('.//'+n+'g[@clip-path="url(#contact-domain)"]');children=[]
for q in g.findall(n+'path'):
 fill=re.search('fill:([^;]+)',q.get('style')).group(1)
 if fill=='#fefefe':continue
 parts=chunks(compact(q.get('d')));node={'tag':'path','fill':fill,'stroke':'none','fillRule':'nonzero'};node['d' if len(parts)==1 else 'dParts']=parts[0]if len(parts)==1 else parts;children.append(node)
root={'tag':'g','children':children}
for id in reversed(list(clips)):root={'tag':'g','clipPath':id,'children':[root]}
asset={'id':'act5:stage43:contact-v5','name':'act5:stage43:contact-v5','category':'prop','visual':[],'collision':[],'sockets':[],'anchor':{'x':0,'y':0},'bounds':{'x':0,'y':650,'w':2172,'h':374},'reference':{'bounds':{'x':0,'y':650,'w':2172,'h':374},'heightM':374/60,'foot':{'x':1086,'y':1024},'scaleRange':[1,1],'backgroundRange':[1,1]},'params':{'semanticLayer':'BODY','silhouetteUnderpaint':False,'reviewStatus':'v5 actual Scene review pending'},'vector':{'version':1,'viewBox':[0,650,2172,374],'clips':clips,'root':root}}
(p/'asset-contact-v5.json').write_text(json.dumps(asset,separators=(',',':')))
# Equivalent native SVG, masks removed and replaced with the same nonzero clips.
r=E.Element(n+'svg',nsmap={None:n[1:-1]},viewBox='0 540 2172 480',width='2172',height='480');dd=E.SubElement(r,n+'defs')
for id,parts in clips.items():cp=E.SubElement(dd,n+'clipPath',id=id);E.SubElement(cp,n+'path',d=' '.join(parts))
def convert(node,parent):
 attrs={k:v for k,v in node.items() if k in ['fill','stroke']}
 if 'clipPath'in node:attrs['clip-path']='url(#'+node['clipPath']+')'
 if node['tag']=='path':attrs['d']=node.get('d')or' '.join(node['dParts'])
 e=E.SubElement(parent,n+node['tag'],attrib=attrs)
 for child in node.get('children',[]):convert(child,e)
convert(root,r);E.ElementTree(r).write(str(p/'patch-import.svg'));base=E.parse(str(p.parent/'v3/before-native.svg')).getroot();base.append(copy.deepcopy(dd));base.append(copy.deepcopy(r[1]));E.ElementTree(base).write(str(p/'composed-import.svg'));env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(p/'profile')}
for name in ['patch-import','composed-import']:subprocess.run(['inkscape',str(p/(name+'.svg')),'--export-width=2172','--export-filename='+str(p/(name+'.png'))],env=env,capture_output=True,check=True)
