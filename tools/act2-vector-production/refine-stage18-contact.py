"""Restore immutable RAW floor highlight contour at protected world (8236.6,7491.0)."""
from pathlib import Path
import xml.etree.ElementTree as E,re,json,hashlib,sys
b=Path(sys.argv[1]);p=b/'floor-v1';r=E.parse(p/'candidate-bbox.svg').getroot();raw=E.parse(p/'authored-raw.svg').getroot()
original=next(n for n in raw.iter() if n.tag.endswith('path')and'#88887e'in n.get('style',''));target=next(n for n in r.iter() if n.tag.endswith('path')and'#88887e'in n.get('style',''))
ss=re.findall('[Mm][^Mm]*',target.get('d'));ss[2]=re.findall('[Mm][^Mm]*',original.get('d'))[2];target.set('d',' '.join(ss));E.register_namespace('','http://www.w3.org/2000/svg');E.ElementTree(r).write(p/'candidate-bbox.svg',encoding='utf-8',xml_declaration=True)
(p/'contact-refinement.json').write_text(json.dumps({'restored':{'part':'floor-v1','color':'#88887e','subpath':2},'reason':'Native domain 1x protected edge shifted1px; restore original entire contour; thresholds unchanged'},indent=2))
