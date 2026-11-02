import re,xml.etree.ElementTree as E,sys,json,hashlib
from pathlib import Path
NUMBER=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
def mini(s):
 tok=re.findall('[A-Za-z]|'+NUMBER,s);out='';prev='';cmd=None
 for t in tok:
  if t.isalpha():
   if t not in 'MmZz' and cmd==t:continue
   out+=t;prev='';cmd=t;continue
  t=re.sub(r'^(-?)0\.',r'\1.',t)
  if prev and not t.startswith(('-','+')) and not (t.startswith('.') and '.' in prev and not re.search('[eE]',prev)):out+=' '
  out+=t;prev=t
 from svgpathtools import parse_path
 assert parse_path(s)==parse_path(out)
 return out
for arg in sys.argv[1:]:
 p=Path(arg);raw=p.read_bytes();r=E.fromstring(raw)
 for node in r.iter():
  node.attrib.pop('id',None)
  if 'd'in node.attrib:node.set('d',mini(node.get('d')))
 E.register_namespace('','http://www.w3.org/2000/svg');out=E.tostring(r,encoding='utf-8',xml_declaration=False);target=p.with_name('candidate-packed.svg');target.write_bytes(out);print(p.parent.name,len(raw),len(out))
