"""Native source-mask composition: keep the wall above the basin, retain authored
basin contact/ornament masks, omit the rectangular source image termination.
Original color geometry and collision are unchanged.
"""
from pathlib import Path
from lxml import etree as E
import json,subprocess,os,importlib.util
R=Path(__file__).resolve().parents[2];O=R/'_local/stage46-resume/bottom-contact';ns='http://www.w3.org/2000/svg';env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'}
base=json.loads((O/'original-protection.json').read_text());contact=json.loads((O/'contact-only.json').read_text())
r=E.Element('svg',xmlns=ns,viewBox='0 0 1024 1536');E.SubElement(r,'path',id='original',d=' '.join(base['b']));E.SubElement(r,'path',id='above',d='M0 0H1024V1390H0Z');E.SubElement(r,'path',id='contact',d=' '.join(contact['b']));inp=O/'input.svg';out=O/'raw.svg';E.ElementTree(r).write(str(inp));p=subprocess.run(['/usr/bin/inkscape',str(inp),'--batch-process','--actions=select-by-id:original,above;path-intersection;select-all;path-union;select-clear;export-plain-svg;export-filename:'+str(out)+';export-do'],env=env,capture_output=True,text=True);p.check_returncode()
s=importlib.util.spec_from_file_location('adapter',R/'tools/vector-production/import-svg.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
paths=[]
for el in E.parse(str(out)).findall('.//{*}path'):
 v=m.preserve_compound(el.get('d'));paths.extend(v.get('dParts',[v.get('d')]))
assert len(paths)<=32 and max(map(len,paths))<=60000;base['b']=paths
(R/'shared/assets/environment/act5/stage46-protected-clips.json').write_text(json.dumps(base,separators=(',',':'))+'\n');print('b mask chars',list(map(len,paths)))
