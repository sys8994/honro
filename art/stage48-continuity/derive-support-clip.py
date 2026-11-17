"""Native union of original silhouettes and a non-walkable lower support gate.
Gate endpoints follow original foot and native-alpha scanline y740 intersections.
No source/collision contour is changed. Original authored silhouette is unioned.
"""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
import json,os,subprocess,hashlib
A=Path(__file__).resolve().parent;S=json.load(open(A/'source-seam.json'));ns='http://www.w3.org/2000/svg';tag=lambda x:'{'+ns+'}'+x
r=E.Element(tag('svg'),nsmap={None:ns},viewBox='-1400 -100 4400 5100')
gate='M4.975 650 H1536 C1566 680 1718 710 1811.32539 740 H3000 V5000 H-1400 V740 H-288.03982 C-256 710 -30 680 4.975 650 Z'
for i,d in enumerate([*S['sourceNativeClips'],gate]):E.SubElement(r,tag('path'),id=f'p{i}',d=d,fill='#000000')
inp=A/'support-mask-input.svg';out=A/'support-mask-native.svg';E.ElementTree(r).write(str(inp))
q=subprocess.run(['/usr/bin/inkscape',str(inp),'--batch-process',f'--actions=select-all;path-union;export-plain-svg;export-filename:{out};export-do'],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(A/'support-profile')},capture_output=True,text=True,check=True)
paths=[parse_path(p.get('d')).d() for p in E.parse(str(out)).findall('.//{*}path')];assert all(len(x)<60000 for x in paths)
json.dump({'method':'native Inkscape Boolean union of exact original silhouettes plus lower nonplay support gate; intersection with new native alpha occurs at render','sourceClipCount':len(S['sourceNativeClips']),'gate':gate,'clip':paths,'nativeSHA256':hashlib.sha256(out.read_bytes()).hexdigest()},open(A/'support-mask.json','w'),indent=2)
