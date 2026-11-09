"""Bier-only native ROI restoration and exact physical roof registration.
Original whole-source/native RAW and ROI traces stay immutable.
"""
from pathlib import Path
from xml.etree import ElementTree as E
from copy import deepcopy
import subprocess,os,json,sys,hashlib,shutil
mode=sys.argv[3] if len(sys.argv)>3 else 'flower16-tight'
base=Path(__file__).resolve().parent;out=base/sys.argv[1];exe=Path(sys.argv[2]).resolve();out.mkdir(parents=True,exist_ok=True)
if (out/'contact-authored.svg').exists():raise RuntimeError('Use a new authoring directory')
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS)
reg=json.loads((base/'registration-contract.json').read_text());w,h=reg['actualSourcePixels'];points=reg['roofPixels'];env={**os.environ,'INKSCAPE_PROFILE_DIR':str(out/'inkscape-profile')};commands=[]
def write(r,p):E.ElementTree(r).write(p,encoding='utf-8',xml_declaration=True)
def native(src,dst,action):
 if len(sys.argv)>4 and dst.name in ['underpaint-color.svg','roi-west-underpaint.svg','roi-east-underpaint.svg']:
  cached=base/sys.argv[4]/dst.name;shutil.copy2(cached,dst);commands.append({'reusedNativeOutput':str(cached),'sha256':hashlib.sha256(cached.read_bytes()).hexdigest(),'reason':'Same immutable source, same action; center ROI is independently retraced.'});return
 args=[str(exe),str(src),'--batch-process','--actions='+action+';export-plain-svg;export-filename:'+str(dst)+';export-do'];p=subprocess.run(args,env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=180);commands.append(args);(out/(dst.stem+'.log')).write_text(p.stdout+p.stderr,encoding='utf-8')
 if p.returncode or not dst.exists():raise RuntimeError('Native authoring failed')
color=E.parse(base/'native-v1-16smooth4/native-color.svg').getroot();white=[p for p in color.iter()if p.tag.split('}')[-1]=='path' and 'fill:#fdfdfd' in p.get('style','')]
if len(white)!=1 or len(white[0].get('d'))>90:raise RuntimeError('Only full-page background may be recolored')
write(color,out/'underpaint-input.svg');native(out/'underpaint-input.svg',out/'underpaint-color.svg','select-by-id:'+white[0].get('id')+';object-set-property:fill,#69534a')
paint=[p for p in E.parse(out/'underpaint-color.svg').getroot().iter()if p.tag.split('}')[-1]=='path'];alpha=[p for p in E.parse(base/'native-v1-16smooth4/native-alpha.svg').getroot().iter()if p.tag.split('}')[-1]=='path'];placements=json.loads((base/(('roi-flower-tight-sources/placements.json' if mode=='flower16-tight' else 'roi-flower-component-sources/placements.json' if mode=='flower16-component' else 'roi-flower-sources/placements.json') if mode.startswith('flower16') else 'roi-sources/placements.json')).read_text())
roi_colors={}
if mode.startswith('flower16'):
 for name in placements:
  original=base/(f'roi-flower-{name}-native16-tight/native-color.svg' if mode=='flower16-tight' and name=='center' else f'roi-flower-{name}-native16-component/native-color.svg' if mode=='flower16-component' and name=='center' else f'roi-flower-{name}-native16/native-color.svg');tree=E.parse(original);paints=[p for p in tree.getroot().iter()if p.tag.split('}')[-1]=='path'];background=paints[0]
  if len(background.get('d'))>60 or 'fill:#fefefe' not in background.get('style',''):raise RuntimeError('ROI underpaint must be exact full-page trace background')
  dst=out/('roi-'+name+'-underpaint.svg');native(original,dst,'select-by-id:'+background.get('id')+';object-set-property:fill,#a28660');roi_colors[name]=dst
def composite(roi=True,band=False):
 r=E.Element('{'+NS+'}svg',{'width':str(w),'height':str(h),'viewBox':f'0 0 {w} {h}'});defs=E.SubElement(r,'{'+NS+'}defs');clip=E.SubElement(defs,'{'+NS+'}clipPath',{'id':'source-alpha','clipPathUnits':'userSpaceOnUse'})
 for a in alpha:clip.append(deepcopy(a))
 outer=E.SubElement(r,'{'+NS+'}g',{'id':'art'})
 if band:
  (x,y),(xx,_)=points;E.SubElement(outer,'{'+NS+'}path',{'id':'contact-band','d':f'M{x},{y}H{xx}V{y+41}H{x}Z','style':'fill:#69534a'})
 inner=E.SubElement(outer,'{'+NS+'}g',{'id':'source-alpha-art','clip-path':'url(#source-alpha)'})
 for p in paint:inner.append(deepcopy(p))
 if roi:
  for name,(x,y,rw,rh) in placements.items():
   cp=E.SubElement(defs,'{'+NS+'}clipPath',{'id':'roi-'+name,'clipPathUnits':'userSpaceOnUse'})
   if mode.startswith('flower16'):
    for a in E.parse(base/(f'roi-flower-{name}-native16-tight/native-alpha.svg' if mode=='flower16-tight' and name=='center' else f'roi-flower-{name}-native16-component/native-alpha.svg' if mode=='flower16-component' and name=='center' else f'roi-flower-{name}-native16/native-alpha.svg')).getroot().iter():
     if a.tag.split('}')[-1]=='path':q=deepcopy(a);q.set('id','roi-alpha-'+name);cp.append(q)
   else:E.SubElement(cp,'{'+NS+'}path',{'d':f'M0,0H{rw}V{rh}H0Z'})
   g=E.SubElement(inner,'{'+NS+'}g',{'id':'roi-'+name+'-placement','transform':f'translate({x},{y})'});inside=E.SubElement(g,'{'+NS+'}g',{'clip-path':'url(#roi-'+name+')'})
   for p in E.parse(roi_colors[name] if mode.startswith('flower16') else base/f'roi-{name}-native24/native-color.svg').getroot().iter():
    if p.tag.split('}')[-1]=='path':
     q=deepcopy(p);q.set('id','roi-'+name+'-'+q.get('id'));inside.append(q)
 return r
write(composite(False),out/'underpaint-authored.svg');write(composite(),out/'roi-authored.svg');r=composite(True,True)
# Roof collider has one horizontal top. Original alpha is untouched; the new
# outer clip affects roof registration only. The source sides/cloth stay native.
ry=points[0][1];E.SubElement(r,'{'+NS+'}path',{'id':'contact-ceiling','d':f'M0,{ry}H{w}V{h}H0Z','style':'fill:#000000'});write(r,out/'contact-input.svg');native(out/'contact-input.svg',out/'contact-authored.svg','select-by-id:art,contact-ceiling;object-set-clip')
for label in ['underpaint-authored','roi-authored','contact-authored']:
 p=subprocess.run([str(exe),str(out/(label+'.svg')),'--export-background-opacity=0','--export-filename='+str(out/(label+'.png'))],env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=120)
 if p.returncode:raise RuntimeError('Render failed')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
(out/'authoring.json').write_text(json.dumps({'sourcePixels':[w,h],'nativeRawSha256':sha(base/'native-v1-16smooth4/raw.svg'),'contactSha256':sha(out/'contact-authored.svg'),'roofPixels':points,'contactBandSourceHeight':41,'changes':['Full-canvas white main trace background recolored wood; full-canvas white floral ROI backgrounds recolored gold to remove white AA fringe. Real cloth unchanged.','Three protected floral ROIs separately native-traced in '+mode+' mode from source RGB crops; flower16 uses source-derived gold mask and native alpha, avoiding rectangular palette seams. No invented flower.','41px wood registration strip behind original alpha group and NEW outer ceiling; original lower cloth/legs alpha untouched.'],'commands':commands,'visualApproval':'PENDING; native asset production only'},indent=2));print(json.dumps({'bytes':(out/'contact-authored.svg').stat().st_size,'contact':str(out/'contact-authored.svg')}))
