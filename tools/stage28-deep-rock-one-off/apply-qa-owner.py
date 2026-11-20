from pathlib import Path
import json
from subprocess import check_output
p=Path('tools/map-forge/stage28-record-court.mjs')
assert check_output(['git','hash-object',str(p)],text=True).strip()=='50d30526ba7f5d7809b2938ed00a760bbec9be77'
data=json.loads((Path(__file__).parent/'facets.json').read_text())
assert not data['collision'] and not data['sockets']
f=data['worldPlanes'];xy=[q for k in f for q in k['points']]
x,y=min(a for a,b in xy),min(b for a,b in xy);r,t=max(a for a,b in xy),max(b for a,b in xy)
assert y>=7830 and t>9300 and len(f)>=20
s=p.read_text();key=' authorPlaceEncounters(p,s);\n return p;'
assert s.count(key)==1
patch=f'''
 // Isolated CI evidence only. Ordinary art source registry, no runtime injection.
 const qaDeepPlanes={json.dumps(f,separators=(',',':'))};
 const qaDeep=asset('stage28:qa-only:deep-foundation','QA deep foundation',qaDeepPlanes.map(q=>P(q.points,q.fill)).join(''),[],{json.dumps([x,y,r-x,t-y])},'earth');
 qaDeep.params.semanticLayer='FORE';
 qaDeep.params.visualRole='decoration';
 qaDeep.params.rearOnly=true;
 put(p,s,qaDeep,'s28-qa-only-deep-foundation',0,0,1,'front');
'''
p.write_text(s.replace(key,' authorPlaceEncounters(p,s);'+patch+' return p;'))
