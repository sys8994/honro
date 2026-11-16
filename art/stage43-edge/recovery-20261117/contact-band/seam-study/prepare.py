from pathlib import Path
from lxml import etree as E
import copy,os,subprocess,json
root=Path('/workspace/scratch/0b8c8f8d81c7');out=Path(__file__).parent;n='{http://www.w3.org/2000/svg}'
for kind,path in [('deep',root/'stage43-recovery-deep-study/foundation-native.svg'),('contact',root/'stage43-recovery-contact-band/v2/strip-native.svg')]:
 t=E.parse(str(path));r=t.getroot();r.set('viewBox','0 780 2172 240');r.set('width','2172');r.set('height','240')
 if kind=='contact':
  palette=json.loads((root/'stage43-recovery-contact-band/v5/palette-map.json').read_text())
  for p in t.findall('.//'+n+'path'):
   s=p.get('style','');fill=s.split('fill:')[-1].split(';')[0]
   if fill=='#fefefe':p.getparent().remove(p);continue
   if fill in palette:p.set('style','fill:'+palette[fill])
 f=out/(kind+'.svg');t.write(str(f));env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'};subprocess.run(['inkscape',str(f),'--export-width=2172','--export-filename='+str(out/(kind+'.png'))],env=env,check=True,capture_output=True)
