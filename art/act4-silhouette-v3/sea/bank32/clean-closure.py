"""Structured cleanup of the artificial left export edge, never implicit-command surgery."""
import json
import xml.etree.ElementTree as E
from pathlib import Path as FilePath
from svgpathtools import parse_path, Path, Line, CubicBezier
D=FilePath(__file__).parent
original=parse_path(next(e.get('d') for e in E.parse(D/'ground-master.svg').getroot().iter() if e.get('id')=='path2'))
subpaths=original.continuous_subpaths();outer=subpaths[0];start=complex(0,outer[0].start.imag);corner=complex(0,outer[0].end.imag);last=outer[-1]
cleaned=Path(Line(start,corner),Line(corner,outer[0].end),*outer[1:-1],CubicBezier(last.start,complex(0,last.control1.imag),complex(0,last.control2.imag),start))
assert list(cleaned)[2:-1]==list(outer)[1:-1], 'Every meaningful interior segment must remain exactly unchanged'
assert cleaned.isclosed()
d=' '.join(p.d() for p in [cleaned,*subpaths[1:]])
assert len(parse_path(d))==len(original)+1
p=D/'source-asset.json';a=json.loads(p.read_text());count=0

def walk(n):
 global count
 if n.get('tag')=='path':
  candidate=parse_path(n['d'])
  if candidate and abs(candidate[0].start.imag-460.75)<1e-8:
   # For the reviewed corrected source, serialization must be geometrically identical.
   if candidate[0].start.real==0:
    restored=parse_path(d); assert len(candidate)==len(restored)
    assert max(abs(u.point(t)-v.point(t)) for u,v in zip(candidate,restored) for t in [0,.25,.5,.75,1])<1e-9, 'Reviewed geometry drift'
   n['d']=d;count+=1
 for c in n.get('children',[]):walk(c)
walk(a['vector']['root']);assert count==1;p.write_text(json.dumps(a,separators=(',',':')))
print('PASS structured closure cleanup: all interior segments and hole paths preserved; reviewed geometry identical')
