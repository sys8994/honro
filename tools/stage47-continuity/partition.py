from pathlib import Path
from lxml import etree as E
import copy,os,subprocess,json
R=Path(__file__).resolve().parents[2];O=R/'art/stage47-continuity/source';t=E.parse(str(O/'color-registered.svg'));ns='{http://www.w3.org/2000/svg}';acts=[]
for i,p in enumerate(list(t.findall('.//'+ns+'path'))):
 if len(p.get('d'))<130000:continue
 par=p.getparent();idx=par.index(p);par.remove(p)
 for j in range(6):
  n=copy.deepcopy(p);n.set('id',f'color-{i}-{j}');par.insert(idx+j,n);mask=f'cut-{i}-{j}';E.SubElement(par,ns+'path',id=mask,d=f'M-10 {j*324-1}H820V{(j+1)*324-1}H-10Z');acts+=['select-clear',f'select-by-id:{n.get("id")},{mask}','path-intersection']
src=O/'partition-input.svg';out=O/'color-partitioned.svg';t.write(str(src));acts+=['select-clear','export-plain-svg',f'export-filename:{out}','export-do'];p=subprocess.run(['inkscape',str(src),'--batch-process','--actions='+';'.join(acts)],capture_output=True,text=True,env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'});(O/'partition.log').write_text(p.stdout+p.stderr);p.check_returncode()
