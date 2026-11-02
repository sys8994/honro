"""Restore RAW west highlight contour at protected low-density contact; lossless token minification."""
import re,json,sys,hashlib,xml.etree.ElementTree as E
from pathlib import Path
base=Path(sys.argv[1]);num=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
for part in ['outer-v1','west-flat-v2','east-flat-v2','arches-flat-v2']:
 p=base/part;r=E.parse(p/'candidate-bbox.svg').getroot();restore=[]
 if part=='west-flat-v2':
  original=next(n for n in E.parse(p/'authored-raw.svg').getroot().iter() if n.tag.endswith('path') and '#88887e' in n.get('style',''))
  target=next(n for n in r.iter() if n.tag.endswith('path') and '#88887e' in n.get('style',''))
  ss=re.findall('[Mm][^Mm]*',target.get('d'));ss[3]=re.findall('[Mm][^Mm]*',original.get('d'))[3];target.set('d',' '.join(ss));restore=[{'fill':'#88887e','subpath':3,'reason':'Retain exact RAW contour at west floor contact in full-domain 1x native projection'}]
 for n in r.iter():
  if not n.tag.endswith('path'):continue
  before=re.findall('[A-Za-z]|'+num,n.get('d'));s='';pn=False
  for t in before:
   if not t.isalpha() and pn and not t.startswith(('-','+')):s+=' '
   s+=t;pn=not t.isalpha()
  assert re.findall('[A-Za-z]|'+num,s)==before;n.set('d',s)
 E.register_namespace('','http://www.w3.org/2000/svg');E.ElementTree(r).write(p/'candidate-contact.svg',encoding='utf-8',xml_declaration=True)
 (p/'contact-refinement.json').write_text(json.dumps({'rawSha256':hashlib.sha256((p/'authored-raw.svg').read_bytes()).hexdigest(),'inputSha256':hashlib.sha256((p/'candidate-bbox.svg').read_bytes()).hexdigest(),'outputSha256':hashlib.sha256((p/'candidate-contact.svg').read_bytes()).hexdigest(),'restoredContours':restore,'losslessTokenSequenceVerification':True},indent=2))
 print(part,(p/'candidate-contact.svg').stat().st_size)
