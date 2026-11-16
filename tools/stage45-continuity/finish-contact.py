"""Native alpha bevel of existing road end colour planes. No surface/collision edits.
Only the west lower corner is trimmed; the contact top stays intact.
"""
from pathlib import Path
from lxml import etree as E
import json,os,subprocess
R=Path(__file__).resolve().parents[2];o=R/'_local/stage45';p=R/'shared/assets/environment/act5/stage45-preserved-clips.json';d=json.loads(p.read_text());k=1997/2172
west=[(-1,667),(0,667),(3,668),(6,670),(12,674),(20,680),(20,800),(-1,800)]
r=E.Element('svg',xmlns='http://www.w3.org/2000/svg',viewBox='0 0 1997 788');E.SubElement(r,'path',id='a',d=' '.join(d['props']));mask=' '.join('M'+'L'.join(f'{x*k},{y*k/1.0012706480304956}'for x,y in poly)+'Z'for poly in [west]);E.SubElement(r,'path',id='m',d=mask);f=o/'road-cap-input.svg';E.ElementTree(r).write(str(f));dest=o/'road-cap-alpha.svg';proc=subprocess.run(['/usr/bin/inkscape',str(f),'--batch-process','--actions='+f'select-by-id:a,m;path-difference;select-clear;export-plain-svg;export-filename:{dest};export-do'],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'},capture_output=True,text=True);proc.check_returncode();d['props']=[e.get('d')for e in E.parse(str(dest)).findall('.//{*}path')];p.write_text(json.dumps(d,separators=(',',':'))+'\n')
