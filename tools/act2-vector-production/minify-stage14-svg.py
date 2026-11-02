"""Lossless SVG path token spelling/whitespace cleanup. No numeric rounding."""
import re,sys,xml.etree.ElementTree as E
from pathlib import Path
p=Path(sys.argv[1]);r=E.parse(p).getroot();E.register_namespace('','http://www.w3.org/2000/svg')
assert not re.search(r'url\s*\(|(?:xlink:)?href\s*=',p.read_text()),'ID removal requires unreferenced trace paths'
NUMBER=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
for e in r.iter():
 e.attrib.pop('id',None)
 if 'd' not in e.attrib:continue
 tokens=re.findall(r'[MmZzLlHhVvCcSsQqTtAa]|'+NUMBER,e.get('d'));result=[];command=None;previous_number=False;last_token=''
 for token in tokens:
  if len(token)==1 and token.isalpha():
   if token not in 'MmZz' and token==command:continue
   result.append(token);command=token;previous_number=False
  else:
   token=re.sub(r'^(-?)0\.',r'\1.',token)
   if previous_number and not token.startswith(('-','+')) and not (token.startswith('.') and '.' in last_token and 'e' not in last_token.lower()):result.append(' ')
   result.append(token);previous_number=True;last_token=token
 e.set('d',''.join(result))
Path(sys.argv[2]).write_bytes(E.tostring(r,encoding='utf-8'))
