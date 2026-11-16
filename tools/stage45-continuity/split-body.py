from lxml import etree as E
import copy,subprocess,os
p='_local/stage45/body-trace/';t=E.parse(p+'native-color.svg');acts=[]
for i,e in enumerate(t.findall('.//{*}path')):
 parent=e.getparent();parent.remove(e)
 for half,(x,w) in enumerate([(0,540),(540,540),(1080,540)]):
  a=copy.deepcopy(e);id=f'bodypart-{i}-{half}';a.set('id',id);parent.append(a);m=f'mask-{i}-{half}';E.SubElement(parent,'{http://www.w3.org/2000/svg}path',id=m,d=f'M{x} 0h{w}v1175h-{w}Z',style='fill:#000');acts+=['select-clear',f'select-by-id:{id},{m}','path-intersection']
t.write(p+'body-split-input.svg',encoding='utf-8',xml_declaration=True);acts+=['select-clear','export-plain-svg','export-filename:'+p+'body-split-raw.svg','export-do'];r=subprocess.run(['/usr/bin/inkscape',p+'body-split-input.svg','--batch-process','--actions='+';'.join(acts)],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'},capture_output=True,text=True);open(p+'body-split.log','w').write(r.stdout+'\n'+r.stderr);r.check_returncode()
