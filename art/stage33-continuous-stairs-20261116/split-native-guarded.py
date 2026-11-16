from pathlib import Path
from lxml import etree as E
import json,os,subprocess,copy,hashlib
root=Path(__file__).resolve().parent;src=root/'full-registered-v2';out=root/'native-roles-guarded';out.mkdir(exist_ok=True)
ns='http://www.w3.org/2000/svg';tag=lambda s:'{'+ns+'}'+s
terr=json.load(open(Path(__file__).resolve().parent/'contact-source.json'))['allTerrains'];low=next(t for t in terr if t['id']=='approved33-low');es=low['properties']['honroWalkEdges'];ground=[(-3300,1400),(0,2205),(216,2227.5),(450,2272.5)]+[(low['points'][i]['x'],low['points'][i]['y'])for i in es+[es[-1]+1]]+[(10700,1540)]
# The partition is an explicit semantic boundary from original lowland contact data.
# Native Boolean editing changes neither painted union nor gameplay.
record={'boundary':ground,'method':'Native Inkscape path-intersection; upper support REAR and lowland BODY share one exact original-contact partition; colors extend32world units past semantic alpha partition to avoid per-color Boolean edge AA; upper alpha overlaps8world inside BODY, exterior unchanged','files':[]}
for role,bottom in [('upper',False),('lowland',True)]:
 d='M'+'L'.join(f'{x},{y}'for x,y in ground)+f'L10700,{5600 if bottom else -1000}L-3300,{5600 if bottom else -1000}Z'
 roleout=out/role;roleout.mkdir(exist_ok=True)
 for kind in ['color','alpha']:
  shift=(-32 if bottom else 32) if kind=='color' else (0 if bottom else 8)
  d='M'+'L'.join(f'{x},{y+shift}'for x,y in ground)+f'L10700,{5600 if bottom else -1000}L-3300,{5600 if bottom else -1000}Z'
  original=E.parse(str(root/'facet-tone/color-native.svg' if kind=='color' else src/'alpha.svg'));dest=E.Element(tag('svg'),nsmap={None:ns},viewBox='-3300 -300 14000 5600',width='2800',height='1120')
  for idx,p in enumerate(original.findall('.//{*}path')):
   wrapper=E.Element(tag('svg'),nsmap={None:ns},viewBox='-3300 -300 14000 5600');a=copy.deepcopy(p);a.set('id','paint');wrapper.append(a);E.SubElement(wrapper,tag('path'),id='partition',d=d,fill='#000')
   inp=roleout/f'{kind}-{idx}-input.svg';res=roleout/f'{kind}-{idx}-native.svg';E.ElementTree(wrapper).write(str(inp))
   env={**os.environ,'INKSCAPE_PROFILE_DIR':str(roleout/'inkscape-profile')}
   run=subprocess.run(['/usr/bin/inkscape',str(inp),'--batch-process',f'--actions=select-by-id:paint,partition;path-intersection;export-plain-svg;export-filename:{res};export-do'],env=env,capture_output=True,text=True,timeout=180)
   (roleout/f'{kind}-{idx}.log').write_text(run.stdout+run.stderr)
   if run.returncode:raise RuntimeError(run.stderr)
   rr=E.parse(str(res));paths=rr.findall('.//{*}path')
   for q in paths:q.set('id',p.get('id',f'path{idx}'));dest.append(copy.deepcopy(q))
  target=roleout/f'{kind}-raw.svg';E.ElementTree(dest).write(str(target));record['files'].append({'path':str(target),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'paths':len(dest)})
(out/'split.json').write_text(json.dumps(record,indent=2));print(json.dumps(record))
