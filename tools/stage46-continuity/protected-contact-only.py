"""Separate stage46 contact-only candidate; fixed complete collar is untouched."""
from pathlib import Path
from lxml import etree as E
import subprocess,os,json,copy
R=Path(__file__).resolve().parents[2];src=R/'_local/stage46/collar-fixed';out=R/'_local/stage46/contact-only';out.mkdir(exist_ok=True);env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'};result={}
for key in 'ab':
 t=E.parse(str(src/(key+'-protected-input.svg')));r=t.getroot()
 for e in list(r):
  if e.get('id')=='collar':r.remove(e)
 f=out/(key+'-input.svg');dest=out/(key+'-protected.svg');t.write(str(f));p=subprocess.run(['/usr/bin/inkscape',str(f),'--batch-process','--actions='+f'select-all;path-union;select-clear;export-plain-svg;export-filename:{dest};export-do'],env=env,capture_output=True,text=True);p.check_returncode();(out/(key+'.log')).write_text(p.stdout+p.stderr)
 result[key]=[e.get('d') for e in E.parse(str(dest)).findall('.//{*}path')];assert len(result[key])<=32 and max(map(len,result[key]))<=60000
 subprocess.run(['/usr/bin/inkscape',str(dest),'--export-width=1024','--export-filename='+str(out/(key+'-protected.png'))],env=env,capture_output=True,check=True)
(out/'protected-contact-only.json').write_text(json.dumps(result,separators=(',',':'))+'\n');(out/'report.json').write_text(json.dumps({'policy':'Only source road-support, selected visible-gold-support and source feature protection; noncontact wall collar excluded. Body canonical alpha must remain unchanged.','paths':{k:[len(d) for d in ds] for k,ds in result.items()}},indent=2)+'\n')
