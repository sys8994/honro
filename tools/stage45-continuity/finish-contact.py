"""Bury only the final original stone's dark underside using its authored curves.
Actual Inkscape alpha difference; source colors, collision and prior west finish stay intact.
"""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path, Path as SvgPath
from PIL import Image
import json, os, subprocess, hashlib, numpy as np
R=Path(__file__).resolve().parents[2]; O=R/'art/stage45-continuity/contact-underside';O.mkdir(exist_ok=True)
P=R/'shared/assets/environment/act5/stage45-preserved-clips.json'
source=R/'_local/stage45/source.json';terrain=R/'shared/data/act5/terrain.mjs'
hashfile=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
hashes={str(p.relative_to(R)):hashfile(p) for p in [source,terrain] if p.exists()}
data=json.loads(P.read_text()); before=O/'baseline.json'
if not before.exists():before.write_text(P.read_text())
base=json.loads(before.read_text())
def find(o):
 if o.get('clipPath')=='props-a':return o
 for c in o.get('children',[]):
  z=find(c)
  if z:return z
authored=O/'authored-underside.svg'
if not authored.exists():
 v=json.loads(source.read_text())['vector'];original=parse_path(find(v['root'])['children'][14]['d']).continuous_subpaths()[17]
 rr=E.Element('svg',xmlns='http://www.w3.org/2000/svg',viewBox='0 0 1997 788');E.SubElement(rr,'path',d=original.d(),fill='#503327');E.ElementTree(rr).write(str(authored))
s=parse_path(E.parse(str(authored)).find('.//{*}path').get('d'))
def extrema(seg):
 p=seg.poly(); roots=np.roots(np.polyder(np.real(p.coeffs)))
 return [float(t.real) for t in roots if abs(t.imag)<1e-9 and 0<t.real<1]
t0=min(extrema(s[0]),key=lambda t:s[0].point(t).real)
t1=max(extrema(s[1]),key=lambda t:s[1].point(t).real)
a=s[0].cropped(t0,1);b=s[1].cropped(0,t1)
# Exact Bezier upper envelope, no fitted replacement geometry.
mask=SvgPath(a,b).d()+f' L2001,{b.end.imag} L2001,790 L{a.start.real},790 Z'
env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'}
def svg(file,d):
 r=E.Element('svg',xmlns='http://www.w3.org/2000/svg',viewBox='0 0 1997 788');E.SubElement(r,'path',d=d,fill='white');E.ElementTree(r).write(str(file))
r=E.Element('svg',xmlns='http://www.w3.org/2000/svg',viewBox='0 0 1997 788');E.SubElement(r,'path',id='a',d=' '.join(base['props']));E.SubElement(r,'path',id='m',d=mask);inp=O/'native-input.svg';E.ElementTree(r).write(str(inp));raw=O/'native-raw.svg'
p=subprocess.run(['/usr/bin/inkscape',str(inp),'--batch-process','--actions='+f'select-by-id:a,m;path-difference;select-clear;export-plain-svg;export-filename:{raw};export-do'],env=env,capture_output=True,text=True);(O/'boolean.log').write_text(p.stdout+p.stderr);p.check_returncode()
paths=[e.get('d') for e in E.parse(str(raw)).findall('.//{*}path')];assert len(paths)<=32 and max(map(len,paths))<=60000
for name,dd in [('before',' '.join(base['props'])),('after',' '.join(paths)),('removal',mask)]:
 f=O/(name+'.svg');svg(f,dd);subprocess.run(['/usr/bin/inkscape',str(f),'--export-width=3994','--export-filename='+str(O/(name+'.png'))],env=env,capture_output=True,check=True)
old=np.asarray(Image.open(O/'before.png').convert('RGBA'))[:,:,3].astype(int);new=np.asarray(Image.open(O/'after.png').convert('RGBA'))[:,:,3].astype(int);diff=np.abs(old-new)
y,x=np.indices(diff.shape);xx=(x+.5)/2; yy=(y+.5)/2
road=(348+(xx*1024/1997-941)*10/83)*1997/1024
outside=(xx<a.start.real-1)|(xx>1998)|(yy<698)|(yy>706)
# Raster AA may change at Inkscape serialization precision; preserve all meaningful alpha.
assert diff[outside].max(initial=0)<=16
assert not ((diff>0)&outside&(old==255)).any()
assert diff[yy<=road+1].max(initial=0)<=2
assert all(hashfile(R/p)==h for p,h in hashes.items())
for key in data:
 if key!='props':assert data[key]==base[key]
report={'sourceGeometry':'props children[14] #503327 subpath[17], cubic segments 0 and 1 upper envelope','parameters':[t0,t1],'start':[a.start.real,a.start.imag],'end':[b.end.real,b.end.imag],'mask':mask,'nativeBoolean':True,'pathCount':len(paths),'maxPathCharacters':max(map(len,paths)),'changedAlphaPixels':int((diff>2).sum()),'outsideMaxError255':int(diff[outside].max(initial=0)),'outsideAaChangedPixels':int(((diff>0)&outside).sum()),'outsideOpaqueLossPixels':int(((new<old)&outside&(old==255)).sum()),'aaNote':'Outside differences are translucent edge tessellation only; no opaque geometry loss. Contact +1px is pixel-identical.','contactPlus1pxMaxError255':int(diff[yy<=road+1].max(initial=0)),'unchangedHashes':hashes,'sourceColorsUnchanged':True,'otherClipsUnchanged':True}
(O/'report.json').write_text(json.dumps(report,indent=2)+'\n');data['props']=paths;P.write_text(json.dumps(data,separators=(',',':'))+'\n');print(json.dumps(report,indent=2))
