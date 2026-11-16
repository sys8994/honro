"""Source-referenced source-scale geology join; native Boolean, no gameplay edits."""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
import json,os,subprocess,sys
root=Path(__file__).resolve().parents[2];out=Path(sys.argv[1]);ns='{http://www.w3.org/2000/svg}';scale=2172/1254
# Top boundary remains below the existing y~684 walkable ledge. Lower contour
# follows the diagonally interlocking rock row in the reviewed source image.
mask='M0 697L118 700L230 696L380 701L520 697L680 700L840 695L1010 699L1170 697L1330 700L1510 697L1690 701L1860 696L2020 700L2172 697L2110 810L2140 930L2070 1040L2130 1180L2095 1340L2150 1510L2080 1700L2130 1880L2100 2030L2172 2172L2070 2110L1990 2172L1840 2140L1760 2172L1600 2120L1460 2172L1340 2145L1200 2172L1080 2135L950 2172L820 2130L700 2172L580 2140L460 2172L310 2130L160 2172L0 2140L70 2000L100 1800L20 1500L80 1300L40 1100L100 1000L30 900L60 800L0 697Z'
for kind in ['color','alpha']:
 t=E.parse(str(out/f'{kind}-raw.svg'));t.getroot().set('viewBox','0 0 2172 2172');t.getroot().set('width','2172');t.getroot().set('height','2172');acts=[]
 for i,p in enumerate(t.findall('.//'+ns+'path')):
  p.set('d',parse_path(p.get('d')).scaled(scale).d());mid=f'seam-mask-{i}';E.SubElement(p.getparent(),ns+'path',id=mid,d=mask,style='fill:#000000');acts+=['select-clear',f'select-by-id:{p.get("id")},{mid}','path-intersection']
 src=out/f'{kind}-input.svg';dest=out/f'{kind}-seam.svg';t.write(str(src));acts+=['select-clear','export-plain-svg',f'export-filename:{dest}','export-do'];r=subprocess.run(['/usr/bin/inkscape',str(src),'--batch-process','--actions='+';'.join(acts)],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'profile')},capture_output=True,text=True);(out/f'{kind}-boolean.log').write_text(r.stdout+r.stderr);r.check_returncode()
c={'id':'act5:stage43:seam','semanticLayer':'BODY','bounds':{'x':0,'y':0,'w':2172,'h':2172},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':2172},'preserveCompounds':True};(root/'art/stage43-edge/seam-config.json').write_text(json.dumps(c,indent=2))
