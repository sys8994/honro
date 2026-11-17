"""Remove the original trace's 1.5-source-pixel left image-frame sliver via native Boolean mask."""
from pathlib import Path
from lxml import etree as E
import json,subprocess,os,importlib.util
R=Path(__file__).resolve().parents[2];O=R/'art/stage46-continuity/protection/frame-sliver';a=json.loads((O/'before.json').read_text());r=E.Element('svg',xmlns='http://www.w3.org/2000/svg',viewBox='0 0 1024 1536');E.SubElement(r,'path',id='original',d=' '.join(a['a']));E.SubElement(r,'path',id='frame',d='M1.5 -10H1030V1546H1.5Z');E.ElementTree(r).write(str(O/'input.svg'))
subprocess.run(['/usr/bin/inkscape',str(O/'input.svg'),'--batch-process','--actions=select-by-id:original,frame;path-intersection;select-clear;export-plain-svg;export-filename:'+str(O/'result.svg')+';export-do'],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'},check=True,capture_output=True)
s=importlib.util.spec_from_file_location('adapter',R/'tools/vector-production/import-svg.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);paths=[]
for el in E.parse(str(O/'result.svg')).findall('.//{*}path'):
 n=m.preserve_compound(el.get('d'));paths.extend(n.get('dParts',[n.get('d')]))
a['a']=paths;(R/'shared/assets/environment/act5/stage46-protected-clips.json').write_text(json.dumps(a,separators=(',',':'))+'\n')
