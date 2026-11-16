"""Source-referenced source-scale geology join; native Boolean, no gameplay edits."""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
import json,os,subprocess,sys
root=Path(__file__).resolve().parents[2];out=Path(sys.argv[1]);ns='{http://www.w3.org/2000/svg}';scale=2172/1774
# Top boundary remains below the existing y~684 walkable ledge. Lower contour
# follows the diagonally interlocking rock row in the reviewed source image.
mask='M0 697L118 700L230 696L380 701L520 697L680 700L840 695L1010 699L1170 697L1330 700L1510 697L1690 701L1860 696L2020 700L2172 697V1065L2070 1045L1990 1086L1840 1055L1760 1086L1600 1030L1460 1070L1340 1035L1200 1086L1080 1050L950 1086L820 1040L700 1086L580 1050L460 1086L310 1040L160 1086L0 1050Z'
for kind in ['color','alpha']:
 t=E.parse(str(out/f'{kind}-raw.svg'));t.getroot().set('viewBox','0 0 2172 1086');t.getroot().set('width','2172');t.getroot().set('height','1086');acts=[]
 for i,p in enumerate(t.findall('.//'+ns+'path')):
  p.set('d',parse_path(p.get('d')).scaled(scale).d());mid=f'seam-mask-{i}';E.SubElement(p.getparent(),ns+'path',id=mid,d=mask,style='fill:#000000');acts+=['select-clear',f'select-by-id:{p.get("id")},{mid}','path-intersection']
 src=out/f'{kind}-input.svg';dest=out/f'{kind}-seam.svg';t.write(str(src));acts+=['select-clear','export-plain-svg',f'export-filename:{dest}','export-do'];r=subprocess.run(['/usr/bin/inkscape',str(src),'--batch-process','--actions='+';'.join(acts)],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'profile')},capture_output=True,text=True);(out/f'{kind}-boolean.log').write_text(r.stdout+r.stderr);r.check_returncode()
c={'id':'act5:stage43:seam','semanticLayer':'BODY','bounds':{'x':0,'y':0,'w':2172,'h':1086},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':1086},'preserveCompounds':True};(root/'art/stage43-edge/seam-config.json').write_text(json.dumps(c,indent=2))
