"""Derive visible source-color areas using actual native Inkscape Booleans.
No geological contours are invented. Original color/alpha remain immutable.
"""
from pathlib import Path
from xml.etree import ElementTree as E
from copy import deepcopy
import subprocess,os,sys,json,hashlib
base=Path(__file__).resolve().parent;parent=base.parent;out=base/'native-visible';out.mkdir(parents=True,exist_ok=True);exe=Path(sys.argv[1]).resolve();env={**os.environ,'INKSCAPE_PROFILE_DIR':str(out/'inkscape-profile')};NS='http://www.w3.org/2000/svg';E.register_namespace('',NS)
source=parent/'composition-color.svg';original=E.parse(source).getroot();paint=[p for p in original.iter()if p.tag.split('}')[-1]=='path'];rows=[]
for i,p in enumerate(paint):
 target=out/(p.get('id')+'-visible.svg')
 if target.exists():raise RuntimeError('Preserve immutable native output; choose another candidate folder')
 r=E.Element('{'+NS+'}svg',{k:original.get(k)for k in ['width','height','viewBox']});q=deepcopy(p);q.set('id','base-color');r.append(q);above=[]
 for j,top in enumerate(paint[i+1:]):
  q=deepcopy(top);q.set('id','above-'+str(j));r.append(q);above.append(q.get('id'))
 inp=out/(p.get('id')+'-input.svg');E.ElementTree(r).write(inp,encoding='utf-8',xml_declaration=True)
 actions=('select-by-id:'+','.join(above)+';path-union;select-all;path-difference;' if len(above)>1 else 'select-all;path-difference;' if above else '')
 args=[str(exe),str(inp),'--batch-process','--actions='+actions+'export-plain-svg;export-filename:'+str(target)+';export-do'];result=subprocess.run(args,env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=180);(out/(p.get('id')+'.log')).write_text(json.dumps(args)+'\n'+result.stdout+result.stderr,encoding='utf-8')
 if result.returncode or not target.exists():raise RuntimeError('Native Boolean failed')
 paths=[p for p in E.parse(target).getroot().iter()if p.tag.split('}')[-1]=='path'];rows.append({'sourceId':p.get('id'),'fill':p.get('style'),'aboveCount':len(above),'nativeOutput':str(target.relative_to(base)),'paths':len(paths),'chars':sum(len(p.get('d',''))for p in paths),'command':args})
 print(json.dumps(rows[-1]),flush=True)
(out/'derivation.json').write_text(json.dumps({'status':'Intentional visibility decomposition; not optimization or artwork approval','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'operation':'Each original paint area minus union of every later stacked area. Native Inkscape path-union/path-difference. No new natural-art paths.','rows':rows},indent=2),encoding='utf-8')
