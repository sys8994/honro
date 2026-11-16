"""Inkscape boolean extraction of exterior BODY, leaving raw trace untouched."""
from pathlib import Path
from lxml import etree as E
import subprocess,os
root=Path(__file__).resolve().parents[2]; out=root/'_local/reports/stage42-registered-trace12'; t=E.parse(str(out/'color-raw.svg')); actions=[]
for i,p in enumerate(t.findall('.//{*}path')):
 pid=p.get('id'); mid=f'exterior-mask-{i}'
 m=E.SubElement(p.getparent(),'{http://www.w3.org/2000/svg}path',id=mid,d='M0 0H280V836H0Z M1600 0H1881V836H1600Z M280 550H1600V836H280Z',style='fill:#000000')
 actions+=['select-clear',f'select-by-id:{pid},{mid}','path-intersection']
src=out/'exterior-boolean-input.svg'; dst=out/'exterior-raw.svg';t.write(str(src),encoding='utf-8',xml_declaration=True)
actions+=['select-clear','export-plain-svg',f'export-filename:{dst}','export-do']
p=subprocess.run(['/usr/bin/inkscape',str(src),'--batch-process','--actions='+';'.join(actions)],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'},capture_output=True,text=True)
(out/'exterior-boolean.log').write_text(p.stdout+'\n'+p.stderr);p.check_returncode()
print(dst)
