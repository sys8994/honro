import json,re,time
from pathlib import Path
from svgpathtools import parse_path
p=Path('stage32-J-field-cull');f=json.load(open('stage32-internal-boundary-review/foundation.json'))['vector']['root']['children'][0]['children'][0]['children'];out=[]
for i,n in enumerate(f):
 d=n.get('d') or ''.join(n.get('dParts',[]));ss=re.findall('[Mm][^Mm]*',d);assert ''.join(ss)==d
 a=[];cursor=0j
 for s in ss:
  assert s.rstrip()[-1].lower()=='z'
  q=parse_path(s,current_pos=cursor);b=q.bbox()
  match=re.match(r'[Mm]\s*([-+0-9.eE]+)[,\s]+([-+0-9.eE]+)',s);assert match
  start=complex(float(match[1]),float(match[2]))+(cursor if s[0]=='m' else 0j)
  absolute='M'+format(start.real,'.17g')+','+format(start.imag,'.17g')+s[match.end():]
  check=parse_path(absolute);assert check==q
  a.append({'d':s,'stub':s[:match.end()]+'Z','bounds':b});cursor=q.end
 out.append(a);print(i,len(a),flush=True)
(p/'subpaths.json').write_text(json.dumps(out,separators=(',',':')))
