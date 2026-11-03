"""Lossless SVG path token spelling/whitespace cleanup. No numeric rounding."""
import re,sys,xml.etree.ElementTree as E
from pathlib import Path
p=Path(sys.argv[1]);r=E.parse(p).getroot();E.register_namespace('','http://www.w3.org/2000/svg')
for e in r.iter():
 e.attrib.pop('id',None)
 if 'd' not in e.attrib:continue
 tokens=re.findall(r'[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',e.get('d'));out='';lastcmd=None;aftercmd=False
 for t in tokens:
  if re.fullmatch('[A-Za-z]',t):
   if t==lastcmd and t.lower() not in ['m','z']:aftercmd=False;continue
   out+=t;lastcmd=t;aftercmd=True;continue
  t=re.sub(r'^(-?)0\.',r'\1.',t)
  out+=('' if not out or aftercmd or t.startswith('-') else ' ')+t;aftercmd=False
 e.set('d',out)
Path(sys.argv[2]).write_bytes(E.tostring(r,encoding='utf-8'))
