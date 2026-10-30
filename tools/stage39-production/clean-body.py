"""Bounded deep-palette cleanup from actual traced paths; raw immutable."""
from lxml import etree as E
from pathlib import Path
import json
D=Path('art/stage39-vector-production');r=E.parse(str(D/'body-raw.svg'));ps=r.findall('.//{http://www.w3.org/2000/svg}path');assert len(ps)==11
assert ps[8].get('style')=='fill:#2c3849' and ps[9].get('style')=='fill:#2a3648' and ps[10].get('style')=='fill:#2a3646'
for p in ps[9:]:p.getparent().remove(p)
ps[8].set('style','fill:#2a3647');r.write(str(D/'body-clean.svg'),encoding='utf-8',xml_declaration=True)
(D/'body-clean-lineage.json').write_text(json.dumps({'source':'body-raw.svg','removedTracePaths':[9,10],'recoloredTracePath':8,'from':'#2c3849','to':'#2a3647','purpose':'Remove nearly indistinguishable deep gradient quantization noise, preserve all original authored upper rock paths and contacts','scope':'Candidate only until bounded raw comparison and direct visual review'},indent=2))
