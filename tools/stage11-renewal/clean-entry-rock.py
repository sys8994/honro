"""Native Inkscape breakup/deletion of unneeded interior trace islands.
Does not change the alpha clip or construct new terrain coordinates.
Input must be the entry granite experiment, never characters or symbols.
"""
import os,sys,json,subprocess
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
src=Path(sys.argv[1]).resolve();out=Path(sys.argv[2]).resolve();out.mkdir(parents=True,exist_ok=True)
env=dict(os.environ,HOME=str(out/'home'),XDG_CONFIG_HOME=str(out/'config'))
if os.environ.get('HONRO_INKSCAPE_PRELOAD'):env['LD_PRELOAD']=str(Path(os.environ['HONRO_INKSCAPE_PRELOAD']).resolve())
def run(file,actions,tag):
 p=subprocess.run(['inkscape',str(file),'--batch-process','--actions='+actions],env=env,capture_output=True,text=True)
 (out/(tag+'.log')).write_text(p.stdout+p.stderr)
 if p.returncode:raise RuntimeError(tag)
paths=E.parse(str(src)).findall('.//{*}path');ids=[p.get('id') for p in paths if p.get('id')]
broken=out/'broken.svg'
run(src,'select-clear;select-by-id:'+','.join(ids)+';path-break-apart'+';select-clear;export-plain-svg;export-filename:'+str(broken)+';export-do','break-apart')
# Inkscape can retain the final compound from a multi-selection breakup.
for attempt in range(2):
 tree=E.parse(str(broken));remaining=[p.get('id') for p in tree.findall('.//{*}path') if p.get('id') and not any(E.QName(a).localname=='clipPath' for a in p.iterancestors()) and not parse_path(p.get('d','')).iscontinuous()]
 if not remaining:break
 dest=out/('broken-pass'+str(attempt+2)+'.svg')
 run(broken,'select-clear;select-by-id:'+','.join(remaining)+';path-break-apart;select-clear;export-plain-svg;export-filename:'+str(dest)+';export-do','break-pass'+str(attempt+2))
 broken=dest
tree=E.parse(str(broken));deleted=[]
for p in tree.findall('.//{*}path'):
 if not p.get('id') or any(E.QName(a).localname=='clipPath' for a in p.iterancestors()):continue
 path=parse_path(p.get('d',''))
 if not path.iscontinuous():continue # Retain unresolved compounds rather than deleting unknown shapes.
 area=abs(path.area()) if path.isclosed() else 0
 if area<1200 or p.get('style') in ['fill:#fdfdfd','fill:#cdcccb','fill:#c2bebb']:deleted.append({'id':p.get('id'),'area':area,'reason':'guide/matte color' if p.get('style') in ['fill:#fdfdfd','fill:#cdcccb','fill:#c2bebb'] else 'small interior island'})
final=out/'cleaned.svg'
run(broken,'select-clear;select-by-id:'+','.join(p['id'] for p in deleted)+';delete;select-clear;export-plain-svg;export-filename:'+str(final)+';export-do','delete-interior-islands')
run(final,'export-type:png;export-filename:'+str(out/'cleaned.png')+';export-do','render')
(out/'edit-report.json').write_text(json.dumps({'source':str(src),'sourceClipPreserved':True,'operation':'Native path-break-apart then delete interior shapes under 1200 source square pixels','warning':'Intentional art cleanup, not bounded raw optimization. Shelf alpha and future world contact clips remain protected. Needs visual review.','deleted':deleted},indent=2))
print(len(deleted),'interior shapes removed')
