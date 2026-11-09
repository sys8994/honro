"""Native stone-neck palette/contact registration; lower alpha stays intact.
Usage: python author-stone.py TRACE_DIR OUTPUT_DIR INKSCAPE_EXE
All source/native RAW inputs remain immutable. No invented natural terrain.
"""
from pathlib import Path
from xml.etree import ElementTree as E
from copy import deepcopy
import os,sys,subprocess,json,hashlib
trace,out,exe=[Path(x).resolve()for x in sys.argv[1:4]];out.mkdir(parents=True,exist_ok=True)
if (out/'contact-authored.svg').exists():raise RuntimeError('Use a new authoring directory')
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS);env={**os.environ,'INKSCAPE_PROFILE_DIR':str(out/'inkscape-profile')};commands=[]
registration=json.loads((out.parent/'registration-contract.json').read_text());w,h=registration['actualSourcePixels'];scale=registration['pixelsPerWorld'];points=registration['contactSourcePixels']
def root():return E.Element('{'+NS+'}svg',{'width':str(w),'height':str(h),'viewBox':f'0 0 {w} {h}'})
def write(r,p):E.ElementTree(r).write(p,encoding='utf-8',xml_declaration=True)
def native(source,target,actions,label):
 args=[str(exe),str(source),'--batch-process','--actions='+actions+f';export-plain-svg;export-filename:{target};export-do'];p=subprocess.run(args,env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=180);commands.append(args);(out/(label+'.log')).write_text(json.dumps(args)+'\n'+p.stdout+p.stderr,encoding='utf-8')
 if p.returncode or not target.exists():raise RuntimeError(label+' failed')
color=E.parse(trace/'native-color.svg').getroot();pair=[];white=None;changes=[]
for p in color.iter():
 if p.tag.split('}')[-1]!='path':continue
 fill=p.get('style','').split('fill:')[-1].split(';')[0]
 if fill in ['#8c8272','#887d6d']:changes.append({'id':p.get('id'),'from':fill,'to':'#8a8070','role':'same topsoil/mineral brown'});p.set('style','fill:#8a8070');pair.append(p.get('id'))
 if fill=='#fdfdfd':
  if len(p.get('d',''))>90:raise RuntimeError('Do not recolor meaningful white art')
  white=p.get('id');changes.append({'id':white,'from':fill,'to':'#7e7d80','role':'exact full-canvas trace background underpaint, not a highlight'})
if len(pair)!=2 or not white:raise RuntimeError('Inspect source palette instead of guessing IDs')
write(color,out/'palette-input.svg');native(out/'palette-input.svg',out/'palette-color.svg','select-by-id:'+','.join(pair)+';path-union;select-by-id:'+white+';object-set-property:fill,#7e7d80','palette-union')
paint=[p for p in E.parse(out/'palette-color.svg').getroot().iter()if p.tag.split('}')[-1]=='path'];alpha=[p for p in E.parse(trace/'native-alpha.svg').getroot().iter()if p.tag.split('}')[-1]=='path']
if len(alpha)!=1:raise RuntimeError('Expected exact single native alpha compound')
def clipped_art(with_band=False):
 r=root();defs=E.SubElement(r,'{'+NS+'}defs');clip=E.SubElement(defs,'{'+NS+'}clipPath',{'id':'source-alpha','clipPathUnits':'userSpaceOnUse'});clip.append(deepcopy(alpha[0]));outer=E.SubElement(r,'{'+NS+'}g',{'id':'art'})
 if with_band:
  band=points+[[x,y+14]for x,y in reversed(points)];d='M'+'L'.join(f'{x:.6f},{y:.6f}'for x,y in band)+'Z';E.SubElement(outer,'{'+NS+'}path',{'id':'contact-band','d':d,'style':'fill:#8a8070'})
 inner=E.SubElement(outer,'{'+NS+'}g',{'id':'source-alpha-art','clip-path':'url(#source-alpha)'})
 for p in paint:inner.append(deepcopy(p))
 return r
write(clipped_art(),out/'palette-authored.svg');r=clipped_art(True)
first=points[0];second=points[1];last=points[-1];before=points[-2];left_y=first[1]+(0-first[0])*(second[1]-first[1])/(second[0]-first[0]);right_y=last[1]+(w-last[0])*(last[1]-before[1])/(last[0]-before[0]);ceiling=[[0,left_y],*points,[w,right_y],[w,h],[0,h]];d='M'+'L'.join(f'{x:.6f},{y:.6f}'for x,y in ceiling)+'Z';E.SubElement(r,'{'+NS+'}path',{'id':'contact-ceiling','d':d,'style':'fill:#000000'});write(r,out/'contact-input.svg')
native(out/'contact-input.svg',out/'contact-authored.svg','select-by-id:art,contact-ceiling;object-set-clip','native-contact-clip')
for label in ['palette-authored','contact-authored']:
 p=subprocess.run([str(exe),str(out/(label+'.svg')),'--export-background-opacity=0','--export-filename='+str(out/(label+'.png'))],env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=120);(out/(label+'-render.log')).write_text(p.stdout+p.stderr,encoding='utf-8')
 if p.returncode:raise RuntimeError('Render failed')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report={'status':'Authored asset candidate; not scene approval','sourcePixels':[w,h],'sourceToWorld':1/scale,'paletteChanges':changes,'contactPixels':points,'contactBandSourceHeight':14,'contactPolicy':'Exact contact ceiling authored on NEW outer group;14px band below source-alpha color group fills only missing top registration. Existing native alpha remains untouched on inner group. Lower hollow is not reconstructed or filled.','nativeRawSha256':sha(trace/'raw.svg'),'nativeAlphaSha256':sha(trace/'native-alpha.svg'),'contactSha256':sha(out/'contact-authored.svg'),'commands':commands,'lossMeasurements':'PENDING','visualReview':'PENDING'};(out/'authoring.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps({'bytes':(out/'contact-authored.svg').stat().st_size,'contact':str(out/'contact-authored.svg')}))
