from pathlib import Path
from lxml import etree as E
import json,os,subprocess
R=Path(__file__).resolve().parents[2];O=R/'art/stage47-continuity/source';v=json.loads((R/'shared/assets/environment/act5/near-import.json').read_text())[6]['vector'];ns='{http://www.w3.org/2000/svg}'
t=E.parse(str(O/'alpha-registered.svg'));r=t.getroot();p=t.find('.//'+ns+'path');p.set('id','generated-alpha');E.SubElement(r,ns+'path',id='protect',d='M270 810H521.345454545V1187.018181818H270Z');
for k in ['a','b']:
 E.SubElement(r,ns+'path',id='original-'+k,d=v['clips'][k][0],transform='matrix(.24545454545454545,0,0,.24545454545454545,270,810)')
inp=O/'protected-alpha-input.svg';out=O/'protected-alpha.svg';t.write(str(inp));acts=['select-clear','select-by-id:generated-alpha,protect','path-difference','select-clear','select-all','path-union','select-clear','export-plain-svg',f'export-filename:{out}','export-do'];p=subprocess.run(['inkscape',str(inp),'--batch-process','--actions='+';'.join(acts)],capture_output=True,text=True,env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'});(O/'protect.log').write_text(p.stdout+p.stderr);p.check_returncode()
# White transparent matte is not geology. Native mask remains authoritative.
t=E.parse(str(O/'color-partitioned.svg'))
for p in t.findall('.//'+ns+'path'):
 style=p.get('style','')
 for old,new in {'#fdfdfd':'#3a264b','#b48472':'#745278','#926870':'#6c466e','#68456b':'#4a3054','#593963':'#52365b'}.items():style=style.replace(old,new)
 p.set('style',style)
t.write(str(O/'color-protected.svg'))
