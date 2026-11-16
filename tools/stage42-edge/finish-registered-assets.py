"""Keep SURFACE near its authored top; remove accidental wood colors from BODY."""
from pathlib import Path
import json
from svgpathtools import parse_path, Path as SVGPath, Line
import math
import runpy
edge_depth=runpy.run_path(str(Path(__file__).with_name("source-contact.py")))["edge_depth"]
r=Path(__file__).resolve().parents[2];d=r/'shared/assets/environment/act5';s=json.load(open(r/'art/stage42-edge/source.json'))
p=d/'stage42-registered-body.json';a=json.load(open(p))
def walk(n):
 c=n.get('fill')
 if c in ['#fdfdfd','#9f9d9e']:n['fill']='#4a5158'
 if c in ['#c98a57','#b07345','#945c36','#714729','#52321c']:n['fill']='#3b434f'
 for q in n.get('children',[]):walk(q)
walk(a['vector']['root']);json.dump(a,open(p,'w'),separators=(',',':'))
p=d/'stage42-surface.json';a=json.load(open(p));paths=s['vector']['clips']['a']
# Full authored stair treads need depth; flat ground must not carry a broad rock band.
def depth(x,y):
    return edge_depth(x)+max(0,min(1,(652-y)/32))*max((extra*max(0,min(1,(x-lo)/25,(hi-x)/25))) for lo,hi,extra in [(400,690,72),(1225,1420,72),(1660,1870,142)])
def lower(d):
    lines=[]
    for segment in parse_path(d):
        assert isinstance(segment,Line), 'Source contour changed; re-review walking skin'
        n=max(1,math.ceil(segment.length()/5))
        points=[segment.point(i/n) for i in range(n+1)]
        points=[z+depth(z.real,z.imag)*1j for z in points]
        lines.extend(Line(u,v) for u,v in zip(points,points[1:]))
    return SVGPath(*lines).reversed().d()
a['vector']['clips']['source-walking-skin']=[' '.join(paths)+' '+' '.join(lower(v) for v in paths)]
if a['vector']['root'].get('clipPath')!='source-walking-skin':a['vector']['root']={'tag':'g','clipPath':'source-walking-skin','children':[a['vector']['root']]}
a['params']['walkingSkinDepth']={'flat':18,'westStairs':90,'centerStairs':90,'eastStairs':160,'transition':25}
b=parse_path(' '.join(s['vector']['clips']['b'])).continuous_subpaths();a['params']['croppedEdgeShrub']=b[52].d();a['params']['wholeShrub']=b[53].d();json.dump(a,open(p,'w'),separators=(',',':'))
