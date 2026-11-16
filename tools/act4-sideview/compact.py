"""Bounded numeric serialization, preserving every polygon segment and hole."""
from pathlib import Path
import sys,re,json,hashlib
from lxml import etree as E
from svgpathtools import parse_path,Line
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act4-sideview-p1-20261116'
for directory in (sys.argv[1:] or ['registered33-v2','registered40-v2']):
 td=OUT/directory;src=td/'color-opt005.svg';tree=E.parse(str(src));before=after=0;largest=0
 def fmt(v):return f'{v:.3f}'.rstrip('0').rstrip('.') if v else '0'
 for node in tree.findall('.//{*}path'):
  chunks=[]
  for raw in re.findall(r'M[^M]*',node.get('d')):
   p=parse_path(raw);assert all(isinstance(s,Line) for s in p)
   pts=[p[0].start]+[s.end for s in p];q=[complex(round(v.real,3),round(v.imag,3)) for v in pts]
   assert max(abs(a-b) for a,b in zip(pts,q))<.00071
   text='M'+fmt(q[0].real)+','+fmt(q[0].imag)
   if len(q)>2:text+='l'+' '.join(fmt((b-a).real)+','+fmt((b-a).imag) for a,b in zip(q[:-2],q[1:-1]))
   # Absolute final endpoint avoids a floating accumulation micro-segment at Z.
   text+='L'+fmt(q[-1].real)+','+fmt(q[-1].imag)
   if re.search(r'[zZ]\s*$',raw):text+='Z'
   assert len(parse_path(text))==len(p)
   chunks.append(text);before+=len(p);after+=len(parse_path(text));largest=max(largest,len(text))
  node.set('d',' '.join(chunks))
 dest=td/'color-final.svg';tree.write(str(dest),encoding='utf-8',xml_declaration=True)
 rec={'source':src.name,'output':dest.name,'sourceBytes':src.stat().st_size,'outputBytes':dest.stat().st_size,'segmentsBefore':before,'segmentsAfter':after,'largestSubpathChars':largest,'maxCoordinateRoundingSourcePx':.00071,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
 (td/'compact.json').write_text(json.dumps(rec,indent=2),encoding='utf8');print(json.dumps(rec))
