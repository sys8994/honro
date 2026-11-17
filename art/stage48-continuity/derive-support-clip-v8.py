"""Native union of original silhouettes and a non-walkable lower support gate.
Gate endpoints follow original foot and native-alpha scanline y740 intersections.
No source/collision contour is changed. Original authored silhouette is unioned.
"""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
import json,os,subprocess,hashlib
A=Path(__file__).resolve().parent;S=json.load(open(A/'source-seam-v8.json'));ns='http://www.w3.org/2000/svg';tag=lambda x:'{'+ns+'}'+x
r=E.Element(tag('svg'),nsmap={None:ns},viewBox='-1400 -100 4400 5100')
gate=S['supportGate']
for i,d in enumerate([*S['sourceNativeClips'],gate]):E.SubElement(r,tag('path'),id=f'p{i}',d=d,fill='#000000')
inp=A/'support-mask-v8-input.svg';out=A/'support-mask-v8-native.svg';E.ElementTree(r).write(str(inp))
q=subprocess.run(['/usr/bin/inkscape',str(inp),'--batch-process',f'--actions=select-all;path-union;export-plain-svg;export-filename:{out};export-do'],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(A/'support-profile')},capture_output=True,text=True,check=True)
paths=[parse_path(p.get('d')).d() for p in E.parse(str(out)).findall('.//{*}path')];assert all(len(x)<60000 for x in paths)
json.dump({'method':'native Inkscape Boolean union of exact original silhouettes plus lower nonplay support gate; intersection with new native alpha occurs at render','sourceClipCount':len(S['sourceNativeClips']),'gate':gate,'clip':paths,'nativeSHA256':hashlib.sha256(out.read_bytes()).hexdigest()},open(A/'support-mask-v8.json','w'),indent=2)
# Preserve the original tunnel aperture even where the support envelope crosses it.
t=E.parse(str(out));root=t.getroot();holes=[]
for d in S['sourceNativeClips']:
 for p in parse_path(d).continuous_subpaths():
  if p.isclosed() and p.area()<0:holes.append(p.d())
assert len(holes)==1
E.SubElement(root,tag('path'),id='original-tunnel-cut',d=' '.join(holes),fill='#000000');hole_input=A/'support-mask-v8-hole-input.svg';t.write(str(hole_input));hole_out=A/'support-mask-v8-native-final.svg'
subprocess.run(['/usr/bin/inkscape',str(hole_input),'--batch-process',f'--actions=select-all;path-difference;export-plain-svg;export-filename:{hole_out};export-do'],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(A/'support-profile')},capture_output=True,text=True,check=True)
paths=[parse_path(p.get('d')).d() for p in E.parse(str(hole_out)).findall('.//{*}path')];assert all(len(x)<60000 for x in paths)
json.dump({'method':'native union of original silhouettes and contact envelope support, then native difference of exact original tunnel hole','sourceClipCount':2,'gate':gate,'clip':paths,'originalHoles':holes,'nativeSHA256':hashlib.sha256(hole_out.read_bytes()).hexdigest()},open(A/'support-mask-v8.json','w'),indent=2)
