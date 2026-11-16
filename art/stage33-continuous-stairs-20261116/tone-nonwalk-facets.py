from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
import subprocess,os,json
r=Path(__file__).resolve().parent;src=r/'full-registered-v2/color.svg';tree=E.parse(str(src));group=tree.getroot().find('{*}g');out=r/'facet-tone';out.mkdir(exist_ok=True)
# Existing traced contours only, no authored rectangles or per-step geometry.
# These large end facets extend past the last walkable contact; tone the whole
# natural facet rather than add a separate high-contrast horizontal extension.
selected=[('path8',40,'#77695e'),('path8',29,'#877669'),('path8',20,'#877669')]
info=[]
for pid,idx,col in selected:
 p=next(x for x in tree.findall('.//{*}path')if x.get('id')==pid);sub=parse_path(p.get('d')).continuous_subpaths()[idx]
 el=E.SubElement(group,'{http://www.w3.org/2000/svg}path',id=f'quiet-end-facet-{pid}-{idx}',d=sub.d(),style='fill:'+col);info.append({'sourcePath':pid,'sourceContour':idx,'fill':col,'bounds':sub.bbox()})
raw=out/'color-edited.svg';tree.write(str(raw));dest=out/'color-native.svg'
env={**os.environ,'INKSCAPE_PROFILE_DIR':str(out/'inkscape-profile')}
p=subprocess.run(['/usr/bin/inkscape',str(raw),'--batch-process',f'--actions=export-plain-svg;export-filename:{dest};export-do'],env=env,capture_output=True,text=True,timeout=180)
(out/'native.log').write_text(p.stdout+p.stderr);assert p.returncode==0
(out/'tone.json').write_text(json.dumps(info,indent=2))
