"""Replace broad west tree ROI with its native visible warm planes plus outline.
Actual road/gold masks and right-side ornaments are unchanged. Diagnostic only.
"""
from pathlib import Path
from lxml import etree as E
import subprocess,os,json,copy
R=Path(__file__).resolve().parents[2];src=R/'_local/stage46/collar-fixed';O=R/'_local/stage46/contact-semantic-v6';O.mkdir(exist_ok=True);env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'};S='{http://www.w3.org/2000/svg}'
def run(t,name,acts):
 f=O/(name+'-input.svg');out=O/(name+'.svg');t.write(str(f));p=subprocess.run(['/usr/bin/inkscape',str(f),'--batch-process','--actions='+acts+f';select-clear;export-plain-svg;export-filename:{out};export-do'],env=env,capture_output=True,text=True);p.check_returncode();return E.parse(str(out))
t=E.parse(str(src/'a-visible-warm.svg'));r=t.getroot();paths=t.findall('.//{*}path');assert len(paths)==1;paths[0].set('id','warm');E.SubElement(r,S+'path',id='roi',d='M20 220H180V410H20Z')
t=run(t,'warm-tree','select-by-id:warm,roi;path-intersection')
for e in t.findall('.//{*}path'):e.set('fill','white');e.set('stroke','white');e.set('stroke-width','3');e.set('stroke-linejoin','round');e.set('stroke-linecap','round')
t=run(t,'warm-tree-outline','select-all;object-stroke-to-path;select-all;object-ungroup;select-all;path-union')
result={}
for key in 'ab':
 q=E.parse(str(src/(key+'-protected-input.svg')));r=q.getroot()
 for e in list(r):
  if e.get('id')=='collar' or key=='a' and e.get('id')=='feature':r.remove(e)
 if key=='a':
  gold=r.find(".//*[@id='gold']"); tmp=E.ElementTree(E.Element(S+'svg',viewBox='0 0 1024 1536'));tmp.getroot().append(copy.deepcopy(gold));E.SubElement(tmp.getroot(),S+'path',id='frame',d='M0 220H20V370H0Z');fixed=run(tmp,'gold-frame-trim','select-by-id:gold,frame;path-difference');r.remove(gold)
  for e in fixed.findall('.//{*}path'):r.append(copy.deepcopy(e))
  for e in t.findall('.//{*}path'):r.append(copy.deepcopy(e))
 q=run(q,key+'-protected','select-all;path-union');result[key]=[e.get('d')for e in q.findall('.//{*}path')];assert len(result[key])==1
(O/'protected-contact-only.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
