from pathlib import Path
from lxml import etree as E
import os,subprocess,json
R=Path(__file__).resolve().parents[2];o=R/'art/gwirim-top';t=E.parse(str(o/'trace-v2/native-color.svg'));ns='{http://www.w3.org/2000/svg}';acts=[]
# Retain new top only, small overlap behind the unchanged source crown.
for i,p in enumerate(t.findall('.//{*}path')):
 k='cut'+str(i);E.SubElement(p.getparent(),ns+'path',id=k,d='M0 0H1549V620H0Z',style='fill:#000000');acts += ['select-clear',f'select-by-id:{p.get("id")},{k}','path-intersection']
t.write(str(o/'canopy-input.svg'));acts+=['select-clear','export-plain-svg',f'export-filename:{o/"canopy-raw.svg"}','export-do']
r=subprocess.run(['/usr/bin/inkscape',str(o/'canopy-input.svg'),'--batch-process','--actions='+';'.join(acts)],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'},capture_output=True,text=True);r.check_returncode();(o/'extract.log').write_text(r.stdout+r.stderr)
c={'id':'act5:stage44:upper-canopy','name':'귀림 상부 수관 연장','semanticLayer':'REAR','category':'tree','anchor':{'x':0,'y':0},'foot':{'x':0,'y':50},'bounds':{'x':-8,'y':-705,'w':2185,'h':890},'scaleRange':[1,8],'backgroundRange':[1,8],'transform':[1/.713,0,0,1/.713,-3/.713,-500.5/.713]};(o/'config.json').write_text(json.dumps(c))
