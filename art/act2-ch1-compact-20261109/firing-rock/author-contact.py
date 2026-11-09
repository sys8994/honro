"""Firing-rock authoring only: native unions and native contact clipping.
Never overwrites native-v4 raw. Palette/contact editing is NOT optimization.
Usage: python author-contact.py TRACE_DIR OUTPUT_DIR INKSCAPE_EXE
"""
from pathlib import Path
from xml.etree import ElementTree as E
from copy import deepcopy
import subprocess,sys,json,hashlib,os
trace,out,exe=[Path(x).resolve() for x in sys.argv[1:4]]
out.mkdir(parents=True,exist_ok=True)
if (out/'contact-authored.svg').exists():raise RuntimeError('Use a new immutable authoring directory')
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS)
env={**os.environ,'INKSCAPE_PROFILE_DIR':str(out/'inkscape-profile')}
commands=[]
def run(source,target,actions,label):
 args=[str(exe),str(source),'--batch-process','--actions='+actions+f';export-plain-svg;export-filename:{target};export-do']
 p=subprocess.run(args,env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=180)
 (out/(label+'.log')).write_text(json.dumps(args)+'\n'+p.stdout+p.stderr,encoding='utf-8');commands.append(args)
 if p.returncode or not target.exists():raise RuntimeError(label+' failed')
def root():return E.Element('{'+NS+'}svg',{'width':'1536','height':'1024','viewBox':'0 0 1536 1024'})
def write(tree,path):E.ElementTree(tree).write(path,encoding='utf-8',xml_declaration=True)
color=E.parse(trace/'native-color.svg').getroot();alpha=E.parse(trace/'native-alpha.svg').getroot()
palette={'#a0958f':'#9e948e','#9d938c':'#9e948e','#817974':'#7e7772','#7c7571':'#7e7772'}
groups={};source_ids=[]
for p in color.iter():
 if p.tag.split('}')[-1]!='path':continue
 style=p.get('style','');old=style.split('fill:')[-1].split(';')[0]
 if old in palette:p.set('style','fill:'+palette[old]);groups.setdefault(palette[old],[]).append(p.get('id'));source_ids.append({'id':p.get('id'),'from':old,'to':palette[old]})
write(color,out/'palette-input.svg')
actions=';'.join('select-by-id:'+','.join(ids)+';path-union;select-clear' for ids in groups.values())
run(out/'palette-input.svg',out/'palette-native-color.svg',actions,'palette-union')
palette_color=E.parse(out/'palette-native-color.svg').getroot()
alpha_paths=[p for p in alpha.iter() if p.tag.split('}')[-1]=='path']
if len(alpha_paths)!=1:raise RuntimeError('Expected one native alpha compound')
def clip_art(paints,mask,path):
 r=root();defs=E.SubElement(r,'{'+NS+'}defs');clip=E.SubElement(defs,'{'+NS+'}clipPath',{'id':'source-alpha','clipPathUnits':'userSpaceOnUse'});clip.append(deepcopy(mask));g=E.SubElement(r,'{'+NS+'}g',{'id':'art','clip-path':'url(#source-alpha)'})
 for p in paints:g.append(deepcopy(p))
 write(r,path);return r
paints=[p for p in palette_color.iter() if p.tag.split('}')[-1]=='path']
clip_art(paints,alpha_paths[0],out/'palette-authored.svg')
union=root();a=deepcopy(alpha_paths[0]);a.set('id','alpha');union.append(a)
band=E.SubElement(union,'{'+NS+'}path',{'id':'contact-fill','d':'M180,480H450V502H180Z','style':'fill:#000000'})
write(union,out/'alpha-union-input.svg')
run(out/'alpha-union-input.svg',out/'alpha-contact-union.svg','select-by-id:alpha,contact-fill;path-union','alpha-contact-union')
union_mask=[p for p in E.parse(out/'alpha-contact-union.svg').getroot().iter() if p.tag.split('}')[-1]=='path']
if len(union_mask)!=1:raise RuntimeError('Native alpha union must remain one compound')
band.set('id','low-contact-surface');band.set('style','fill:#9e948e')
r=clip_art([*paints,band],union_mask[0],out/'contact-input.svg')
# object-set-clip replaces a clip on its selected group. Preserve source alpha
# on an inner group and author the contact ceiling on a NEW outer group.
inner=r.find('{'+NS+'}g');inner.set('id','source-alpha-art');r.remove(inner)
outer=E.SubElement(r,'{'+NS+'}g',{'id':'art'});outer.append(inner)
E.SubElement(r,'{'+NS+'}path',{'id':'contact-ceiling','d':'M0,480H450V180H1350L1536,450V1024H0Z','style':'fill:#000000'})
write(r,out/'contact-input.svg')
run(out/'contact-input.svg',out/'contact-authored.svg','select-by-id:art,contact-ceiling;object-set-clip','native-contact-clip')
for name in ['palette-authored','contact-authored']:
 p=subprocess.run([str(exe),str(out/(name+'.svg')),'--export-background-opacity=0','--export-filename='+str(out/(name+'.png'))],env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=120)
 (out/(name+'-render.log')).write_text(p.stdout+p.stderr,encoding='utf-8')
 if p.returncode:raise RuntimeError('Render failed '+name)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report={'status':'Authored candidate, not visually approved or integrated','nativeRawSha256':sha(trace/'raw.svg'),'nativeRawUnchanged':True,'paletteChanges':source_ids,'paletteScope':'Two near-identical grays per same light/main role merged; light/main/deep roles remain distinct. Native six-color trace already lost the small moss color role; not claimed preserved.','contactSourceEdit':'22-source-pixel low-tread paint band; native alpha union; exact guide ceiling through native object-set-clip. This intentional contact authoring is not an optimization error result.','contactGuide':[[180,480],[450,480],[450,180],[1350,180]],'outputs':{name:sha(out/name) for name in ['palette-authored.svg','contact-authored.svg']},'commands':commands,'version':subprocess.check_output([str(exe),'--version'],text=True).strip(),'pixelComparisons':'PENDING','actualGameReview':'PENDING'}
(out/'authoring.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'output':str(out/'contact-authored.svg'),'bytes':(out/'contact-authored.svg').stat().st_size}))
