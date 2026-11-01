"""Lossless diagnostic SVG serialization of an existing native vector asset."""
import argparse,json,xml.etree.ElementTree as E
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('asset');p.add_argument('output');a=p.parse_args();asset=json.loads(Path(a.asset).read_text());v=asset['vector'];S='http://www.w3.org/2000/svg';E.register_namespace('',S)
root=E.Element('{'+S+'}svg',{'viewBox':'4300 2150 1600 1550','width':'1200','height':'1163'});defs=E.SubElement(root,'{'+S+'}defs')
for name,paths in v.get('clips',{}).items():
 c=E.SubElement(defs,'{'+S+'}clipPath',{'id':name,'clipPathUnits':'userSpaceOnUse'})
 E.SubElement(c,'{'+S+'}path',{'d':' '.join(paths)})
def emit(parent,node):
 assert node['tag'] in ['g','path']
 attrs={}
 for k,val in node.items():
  if k in ['tag','children']:continue
  if k=='dParts':attrs['d']=' '.join(val)
  elif k=='transform':attrs[k]='matrix('+','.join(map(str,val))+')'
  elif k=='clipPath':attrs['clip-path']='url(#'+val+')'
  elif k=='fillRule':attrs['fill-rule']=val
  else:attrs[k]=str(val)
 e=E.SubElement(parent,'{'+S+'}'+node['tag'],attrs)
 for n in node.get('children',[]):emit(e,n)
emit(root,v['root']);E.ElementTree(root).write(a.output,encoding='utf-8',xml_declaration=True)
