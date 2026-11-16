from pathlib import Path
from lxml import etree as E
import subprocess,os,copy
R=Path(__file__).resolve().parents[2];o=R/'art/gwirim-top';t=E.parse(str(o/'canopy-normalized.svg'));ns='{http://www.w3.org/2000/svg}';acts=[]
for j,p in enumerate(list(t.findall('.//{*}path'))):
 if p.get('id')=='path16':p.getparent().remove(p);continue
 for i,(a,b) in enumerate([(0,500),(500,1000),(1000,1549)]):
  q=copy.deepcopy(p);q.set('id',f's{j}_{i}');p.getparent().append(q);k=f'c{j}_{i}';E.SubElement(p.getparent(),ns+'path',id=k,d=f'M{a} 0H{b}V620H{a}Z',style='fill:#000000');acts+=['select-clear',f'select-by-id:{q.get("id")},{k}','path-intersection']
 p.getparent().remove(p)
t.write(str(o/'partition-input.svg'));acts+=['select-clear','export-plain-svg',f'export-filename:{o/"canopy-partitioned.svg"}','export-do'];r=subprocess.run(['/usr/bin/inkscape',str(o/'partition-input.svg'),'--batch-process','--actions='+';'.join(acts)],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'},capture_output=True,text=True);r.check_returncode();(o/'partition.log').write_text(r.stdout+r.stderr)
