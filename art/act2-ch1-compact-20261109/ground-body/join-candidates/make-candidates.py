"""Two bounded geological joining alternatives, using existing schema only.
Native visibility-derived clipping and per-color alpha gradients are authored
source edits. Neither is claimed to be lossless optimization or final art.
"""
from pathlib import Path
from xml.etree import ElementTree as E
from copy import deepcopy
import os,sys,json,subprocess,importlib.util,hashlib
base=Path(__file__).resolve().parent;parent=base.parent;exe=Path(sys.argv[1]).resolve();NS='http://www.w3.org/2000/svg';E.register_namespace('',NS)
cfg=json.loads((parent/'asset-config.json').read_text(encoding='utf-8'));scale=cfg['transform'][0];env={**os.environ,'INKSCAPE_PROFILE_DIR':str(base/'native-visible/clip-profile')}
def root():return E.Element('{'+NS+'}svg',{'width':'1774','height':'887','viewBox':'0 0 1774 887'})
def write(r,f):E.ElementTree(r).write(f,encoding='utf-8',xml_declaration=True)
def paths(f):return [deepcopy(p)for p in E.parse(f).getroot().iter()if p.tag.split('}')[-1]=='path']
visible=root()
for i in range(8,0,-1):
 for p in paths(base/f'native-visible/path{i}-visible.svg'):
  p.set('id','source-visible-'+str(i));visible.append(p)
write(visible,base/'nonoverlap-native-color.svg')
# Candidate A retains actual visible mineral/soil color areas and lets the
# unchanged foundation supply deep dark material. No authored U silhouette.
r=root();a=paths(parent/'composition-alpha.svg')[0];a.set('id','existing-alpha');r.append(a);ids=[]
for i in range(7,1,-1):
 for p in paths(base/f'native-visible/path{i}-visible.svg'):
  p.set('id','mineral-'+str(i));p.set('style','fill:#000000');ids.append(p.get('id'));r.append(p)
write(r,base/'mineral-clip-input.svg');target=base/'mineral-clip-native.svg'
if target.exists() and '--reuse-native' not in sys.argv:raise RuntimeError('Preserve native candidate output')
args=[str(exe),str(base/'mineral-clip-input.svg'),'--batch-process','--actions=select-by-id:'+','.join(ids)+';path-union;select-all;path-intersection;export-plain-svg;export-filename:'+str(target)+';export-do'];
if not target.exists():
 p=subprocess.run(args,env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=180);(base/'mineral-clip.log').write_text(json.dumps(args)+'\n'+p.stdout+p.stderr,encoding='utf-8')
 if p.returncode or not target.exists():raise RuntimeError('Native mineral intersection failed')
spec=importlib.util.spec_from_file_location('adapter','tools/vector-production/import-native-clip.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
clip_asset=m.compile_native_clip(parent/'composition-color.svg',target,cfg)
clip_asset['params'].update(joinCandidate='A-native-visible-mineral-clip',sourceEdit='Existing source-visible mineral/soil union intersected with unchanged composition alpha; dark base supplied by foundation.',artStatus='unapproved source-edit prototype')
(base/'candidate-A.asset.json').write_text(json.dumps(clip_asset,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
# Candidate B: visible source colors are disjoint BEFORE applying alpha.
# This avoids faded translucent stack layers darkening/building up over one
# another. Gradients are existing vector.gradients, not SVG-import extensions.
b=m.compile_native_clip(base/'nonoverlap-native-color.svg',parent/'composition-alpha.svg',cfg)
ranges={'#545050':[2580,2940],'#969598':[2680,2980],'#918375':[2660,2920],'#807e81':[2640,2960],'#7e7e80':[2660,2980],'#737274':[2680,2980],'#84715e':[2640,2900]};gradients={}
for i,(color,(start,end))in enumerate(ranges.items()):
 gid='source-mineral-'+str(i);gradients[gid]={'type':'linear','x1':0,'y1':(start-500)/scale,'x2':0,'y2':(end-500)/scale,'stops':[{'offset':0,'color':color,'opacity':1},{'offset':1,'color':color,'opacity':0}]}
def change(n):
 if isinstance(n,dict):
  if n.get('tag')=='path':
   color=n.get('fill');i=list(ranges).index(color);n['fill']='url(#source-mineral-'+str(i)+')'
  for v in n.values():change(v)
 elif isinstance(n,list):
  for v in n:change(v)
change(b['vector']['root']);b['vector']['gradients']=gradients;b['params'].update(joinCandidate='B-native-nonoverlap-mineral-alpha',sourceEdit='Actual native source-visible color areas, existing per-color linear alpha gradient below walking zones, existing composition-alpha retained; all per-color fades finish before lower U lip. No new silhouette authored.',artStatus='unapproved source-edit prototype')
(base/'candidate-B-v2.asset.json').write_text(json.dumps(b,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
# Portable editable pure SVG counterpart, with identical native source paths.
r=root();defs=E.SubElement(r,'{'+NS+'}defs');cp=E.SubElement(defs,'{'+NS+'}clipPath',{'id':'native-alpha','clipPathUnits':'userSpaceOnUse'})
for p in paths(parent/'composition-alpha.svg'):p.attrib.pop('id',None);cp.append(p)
for gid,grad in gradients.items():
 g=E.SubElement(defs,'{'+NS+'}linearGradient',{'id':gid,'gradientUnits':'userSpaceOnUse',**{k:str(grad[k])for k in ['x1','y1','x2','y2']}})
 for stop in grad['stops']:E.SubElement(g,'{'+NS+'}stop',{'offset':str(stop['offset']),'stop-color':stop['color'],'stop-opacity':str(stop['opacity'])})
g=E.SubElement(r,'{'+NS+'}g',{'clip-path':'url(#native-alpha)'})
for p in list(visible):
 color=p.get('style').split('fill:')[1].split(';')[0];p=deepcopy(p);p.set('style','fill:url(#source-mineral-'+str(list(ranges).index(color))+')');g.append(p)
# Standalone SVG has the same canonical world clip and uniform transform as
# the existing engine asset, while preserving native source-space gradients.
r.set('viewBox','-200 500 6600 3300');worldcp=E.SubElement(defs,'{'+NS+'}clipPath',{'id':'canonical-world','clipPathUnits':'userSpaceOnUse'})
for d in cfg['bodyClip']:E.SubElement(worldcp,'{'+NS+'}path',{'d':d})
r.remove(g);outer=E.SubElement(r,'{'+NS+'}g',{'clip-path':'url(#canonical-world)'});transformed=E.SubElement(outer,'{'+NS+'}g',{'transform':'matrix('+','.join(map(str,cfg['transform']))+')'});transformed.append(g)
write(r,base/'candidate-B-v2-authored.svg')
report={'scope':'Two intentional source authoring prototypes, not optimization/gameplay/art approval','sourceFiles':{str(f.relative_to(parent.parent)):hashlib.sha256(f.read_bytes()).hexdigest()for f in [parent/'composition-color.svg',parent/'native-alpha.svg',parent/'composition-alpha.svg',parent.parent/'foundation/final.asset.json']},'A':{'asset':'candidate-A.asset.json','alpha':'mineral-clip-native.svg','method':'Actual native source-visible mineral union intersection'},'B':{'asset':'candidate-B-v2.asset.json','svg':'candidate-B-v2-authored.svg','worldFadeRangesByOriginalColor':ranges,'method':'Actual native nonoverlap areas and existing schema gradients; no renderer/schema change'},'commands':[args],'risks':['Native Boolean decomposition may introduce seam AA compared with stacked original.','Candidate A may keep hard mineral edges; source handoff is not natural-art approval.','Candidate B may reveal unchanged foundation plane scale/contrast and source side edges.','No collision/camera/domain edits. Source-to-author loss must be evaluated separately from any future raw-to-final optimization.']}
(base/'candidates.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps({'Abytes':(base/'candidate-A.asset.json').stat().st_size,'Bbytes':(base/'candidate-B-v2.asset.json').stat().st_size}))
