"""Map native-cleaned artwork to its existing world production frame.
Alpha clip is replaced by exact canonical collision clip; no collision write.
"""
from pathlib import Path
from lxml import etree as E
import json,subprocess,sys
root=Path(__file__).resolve().parents[2];p=root/'art/stage11-renewal-20261108/entry-rock-v4'
t=E.parse(str(p/'native-clean/cleaned.svg'))
for e in t.findall('.//{*}defs'):e.getparent().remove(e)
for e in t.iter():e.attrib.pop('clip-path',None)
t.write(str(p/'import.svg'),encoding='utf-8',xml_declaration=True)
j=json.loads((root/'art/stage11-renewal-20261108/structure-contract.json').read_text());rock=next(x for x in j['world'] if x['id']=='v4.11.firing-rock');d='M'+'L'.join(str(v['x'])+','+str(v['y']) for v in rock['vertices'])+'Z'
c=json.loads((p/'config.json').read_text());c['bodyClip']=[d];(p/'config.json').write_text(json.dumps(c,indent=2))
subprocess.run([sys.executable,str(root/'tools/vector-production/import-svg.py'),str(p/'import.svg'),'--config',str(p/'config.json'),'--output',str(p/'native.json')],check=True)
