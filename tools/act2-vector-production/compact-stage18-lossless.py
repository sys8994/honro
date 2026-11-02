import re,xml.etree.ElementTree as E,json,sys
from pathlib import Path
NUMBER=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
p=Path(sys.argv[1]);r=E.parse(p/'candidate-bbox.svg').getroot()
for n in r.iter():
 n.attrib.pop('id',None)
 if not n.tag.endswith('path'):continue
 tokens=re.findall('[A-Za-z]|'+NUMBER,n.get('d'));a=[];prev=None;pn=False;last=''
 for t in tokens:
  if t.isalpha():
   if t not in 'MmZz' and prev==t:continue
   a.append(t);prev=t;pn=False;last=t
  else:
   t=re.sub(r'^(-?)0\.',r'\1.',t)
   if pn and not t.startswith(('-','+')) and not(t.startswith('.')and'.'in last and'e'not in last.lower()):a.append(' ')
   a.append(t);pn=True;last=t
 compact=''.join(a)
 from svgpathtools import parse_path
 before,after=parse_path(n.get('d')),parse_path(compact)
 assert len(before)==len(after) and all(x==y for x,y in zip(before,after)), 'Lossless geometry mismatch'
 n.set('d',compact)
E.register_namespace('','http://www.w3.org/2000/svg');E.ElementTree(r).write(p/'candidate-bbox.svg',encoding='utf-8',xml_declaration=True)
print(p.name,(p/'authored-raw.svg').stat().st_size,(p/'candidate-bbox.svg').stat().st_size)
