from lxml import etree as E
from pathlib import Path
import copy,subprocess,os,sys
p=Path(sys.argv[1]);t=E.parse(str(p/'seam-opt.svg'));acts=[]
for i,e in enumerate(t.findall('.//{*}path')):
 parent=e.getparent();parent.remove(e)
 for col,(x,w) in enumerate([(0,724),(724,724),(1448,724)]):
  for row,(y,h) in enumerate([(690,494),(1184,494),(1678,494)]):
   a=copy.deepcopy(e);id=f'part-{i}-{col}-{row}';a.set('id',id);parent.append(a);m=f'mask-{i}-{col}-{row}';E.SubElement(parent,'{http://www.w3.org/2000/svg}path',id=m,d=f'M{x} {y}h{w}v{h}h-{w}Z',style='fill:#000');acts+=['select-clear',f'select-by-id:{id},{m}','path-intersection']
t.write(str(p/'split-input.svg'));acts+=['select-clear','export-plain-svg','export-filename:'+str(p/'seam-split.svg'),'export-do'];r=subprocess.run(['/usr/bin/inkscape',str(p/'split-input.svg'),'--batch-process','--actions='+';'.join(acts)],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'},capture_output=True,text=True);(p/'split.log').write_text(r.stdout+r.stderr);r.check_returncode()
