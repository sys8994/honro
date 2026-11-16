from pathlib import Path
import json,os,subprocess
from lxml import etree as E
R=Path(__file__).resolve().parents[2]; out=R/'_local/stage44/trace';ns='{http://www.w3.org/2000/svg}'
t=E.parse(str(out/'native-color.svg'));root=t.getroot();acts=[]
# Source rectangle mapped by measured near-identical scale. Overlap is hidden by untouched original.
mask='M0 350H338V724H0Z M1688 165H2172V724H1817Z M0 520H2172V724H0Z'
for i,p in enumerate(t.findall('.//{*}path')):
 mid=f'exterior-mask-{i}';E.SubElement(p.getparent(),ns+'path',id=mid,d=mask,style='fill:#000000');acts+=['select-clear',f'select-by-id:{p.get("id")},{mid}','path-intersection']
f=out/'exterior-input.svg';t.write(str(f),encoding='utf-8',xml_declaration=True)
acts+=['select-clear','export-plain-svg',f'export-filename:{out/"exterior-raw.svg"}','export-do']
p=subprocess.run(['/usr/bin/inkscape',str(f),'--batch-process','--actions='+';'.join(acts)],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'},capture_output=True,text=True);(out/'exterior.log').write_text(p.stdout+p.stderr);p.check_returncode()
c={'id':'act5:stage44:root-continuation','name':'귀림 외곽 뿌리 연결','semanticLayer':'BODY','category':'rock','anchor':{'x':0,'y':0},'foot':{'x':0,'y':962},'bounds':{'x':-351,'y':-4,'w':2896,'h':966},'scaleRange':[1,8],'backgroundRange':[1,8],'transform':[1/0.75,0,0,1/0.75,-263/0.75,-3/0.75]};(R/'art/stage44-edge/config.json').write_text(json.dumps(c))
