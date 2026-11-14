"""Canonicalization-only invariant test across package corpus; no simplification."""
import sys,json,pathlib
from optimize_svg import canonical_subpaths
from svgpathtools import parse_path
count=0; maxerr=0
for file in pathlib.Path(sys.argv[1]).glob('*.json'):
 def walk(x):
  global count,maxerr
  if isinstance(x,dict):
   d=x.get('d') or ' '.join(x.get('dParts',[]))
   if isinstance(d,str) and 'm' in d:
    a=parse_path(d);b=parse_path(' '.join(canonical_subpaths(d)))
    assert len(a)==len(b),(file,'count')
    for aa,bb in zip(a,b):
     assert type(aa)==type(bb),(file,'segment type')
     for t in [0,.25,.5,.75,1]:
      e=abs(aa.point(t)-bb.point(t));maxerr=max(e,maxerr)
      assert e<1e-9,(file,'geometry',e)
    count+=1
   for v in x.values():walk(v)
  elif isinstance(x,list):
   for v in x:walk(v)
 walk(json.loads(file.read_text()))
print(json.dumps({'paths_checked':count,'max_sample_error':maxerr,'status':'passed'}))
