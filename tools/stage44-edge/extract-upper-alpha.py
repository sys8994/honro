from pathlib import Path
from lxml import etree as E
import json,os,subprocess
R=Path(__file__).resolve().parents[2];o=R/'_local/stage44';v=json.loads((R/'shared/assets/environment/act5/near-import.json').read_text())[3]['vector'];r=E.Element('svg',xmlns='http://www.w3.org/2000/svg',viewBox='0 0 2172 724');E.SubElement(r,'path',id='a',d=v['clips']['a'][0]);E.SubElement(r,'path',id='u',d='M0 0H2172V350H1900L1790 425L1710 495L1670 644L1390 642L920 646L550 640H0Z');f=o/'upper-alpha-input.svg';E.ElementTree(r).write(str(f))
p=subprocess.run(['/usr/bin/inkscape',str(f),'--batch-process','--actions=select-by-id:a,u;path-intersection;select-clear;export-plain-svg;export-filename:'+str(o/'upper-alpha-v2.svg')+';export-do'],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'},capture_output=True,text=True);p.check_returncode()
