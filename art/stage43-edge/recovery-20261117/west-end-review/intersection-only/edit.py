from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
import subprocess,os,copy,json,shutil
p=Path(__file__).resolve().parent;b=p.parent;n='{http://www.w3.org/2000/svg}';env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(p/'profile')}
def run(f,acts,out):
 z=subprocess.run(['inkscape',str(f),'--actions='+';'.join(acts+['select-clear','export-plain-svg',f'export-filename:{out}','export-do'])],env=env,capture_output=True,text=True);(p/(out.stem+'.log')).write_text(z.stdout+z.stderr);z.check_returncode()
def root():return E.Element(n+'svg',nsmap={None:n[1:-1]},viewBox='-200 0 650 850',width='650',height='850')
s=2172/912;tx=-18*s;ty=710.02-302*s;a=E.parse(str(b/'stage43-recovery-deep-study/body-alpha.svg')).find('.//'+n+'path');d=parse_path(a.get('d')).scaled(s).translated(complex(tx,ty)).d()
r=root();E.SubElement(r,n+'path',id='deep',d=d,style='fill:#000');E.SubElement(r,n+'path',id='upper',d='M-200 0H2400V710.02H-200Z',style='fill:#000');f=p/'domain-input.svg';E.ElementTree(r).write(str(f));run(f,['select-by-id:deep,upper','path-union'],p/'domain.svg');domain=E.parse(str(p/'domain.svg')).find('.//'+n+'path').get('d')
for name,inp in [('color','exterior-optimized.svg'),('alpha','exterior-mask.svg')]:
 r=E.parse(str(b/'stage43-recovery-west-study'/inp)).getroot();acts=[]
 for i,q in enumerate(r.findall('.//'+n+'path')):
  ident=f'original{i}';q.set('id',ident)
  if q.get('fill') and not q.get('style'):q.set('style','fill:'+q.get('fill')+';stroke:none')
  E.SubElement(r,n+'path',id=f'domain{i}',d=domain,style='fill:#000');acts += [f'select-by-id:{ident},domain{i}','path-intersection','select-clear']
 f=p/f'{name}-input.svg';E.ElementTree(r).write(str(f));run(f,acts,p/f'{name}.svg')
shutil.copyfile(b/'stage43-recovery-west-study/config.json',p/'config.json')
