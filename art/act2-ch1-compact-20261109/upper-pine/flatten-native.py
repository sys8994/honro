"""Resolve native color/alpha clip using real Inkscape Boolean intersections.
Usage: python flatten-native.py TRACE_DIR OUTPUT_DIR INKSCAPE_EXE
Preserves trace raw. This makes no artwork/quality approval; compare pixels.
"""
import copy, hashlib, json, os, subprocess, sys, time
from pathlib import Path
from xml.etree import ElementTree as E

trace, out, exe = [Path(x).resolve() for x in sys.argv[1:4]]
out.mkdir(parents=True, exist_ok=True)
final = out/'plain.svg'
if final.exists(): raise RuntimeError('Refuse to overwrite existing plain.svg')
NS='http://www.w3.org/2000/svg'; E.register_namespace('',NS)
source=trace/'native-color.svg'; alpha=trace/'native-alpha.svg'
color=E.parse(source).getroot(); mask=E.parse(alpha).getroot()
color_paths=[e for e in color.iter() if e.tag.split('}')[-1]=='path']
alpha_paths=[e for e in mask.iter() if e.tag.split('}')[-1]=='path']
if len(alpha_paths)!=1: raise RuntimeError('Expected one exact native alpha compound; author a reviewed union before flattening')
root=E.Element('{'+NS+'}svg', {k:color.get(k) for k in ['width','height','viewBox']})
env={**os.environ,'INKSCAPE_PROFILE_DIR':str(out/'inkscape-profile')}
rows=[]
for i,paint in enumerate(color_paths):
    work=E.Element('{'+NS+'}svg',{k:color.get(k) for k in ['width','height','viewBox']})
    a,b=copy.deepcopy(paint),copy.deepcopy(alpha_paths[0]);a.set('id','paint');b.set('id','alpha')
    work.extend([a,b]);inp=out/f'layer-{i}-input.svg';result=out/f'layer-{i}.svg'
    E.ElementTree(work).write(inp,encoding='utf-8',xml_declaration=True)
    actions=f'select-by-id:paint,alpha;path-intersection;export-plain-svg;export-filename:{result};export-do'
    args=[str(exe),str(inp),'--batch-process','--actions='+actions]
    start=time.monotonic();p=subprocess.run(args,env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=180)
    (out/f'layer-{i}.log').write_text(json.dumps(args)+'\n'+p.stdout+p.stderr,encoding='utf-8')
    if p.returncode or not result.exists(): raise RuntimeError(f'Native intersection failed for layer {i}')
    r=E.parse(result).getroot();shapes=[e for e in r.iter() if e.tag.split('}')[-1]=='path']
    if not shapes: raise RuntimeError(f'Intersection empty for layer {i}; inspect rather than silently drop color')
    for k,e in enumerate(shapes):
        e=copy.deepcopy(e);e.set('id',f'color-{i}-{k}')
        # Intersection changes geometry in Inkscape. Preserve original paint,
        # not the topmost alpha mask's black appearance.
        for attr in ['style','fill','fill-opacity','opacity','fill-rule','stroke']:
            if paint.get(attr) is not None:e.set(attr,paint.get(attr))
            elif attr in e.attrib:del e.attrib[attr]
        root.append(e)
    rows.append({'colorIndex':i,'sourceId':paint.get('id'),'sourceStyle':paint.get('style'),'resultPaths':len(shapes),'seconds':time.monotonic()-start,'command':args})
E.ElementTree(root).write(final,encoding='utf-8',xml_declaration=True)
if root.findall('.//{'+NS+'}image') or root.findall('.//{'+NS+'}clipPath'): raise RuntimeError('Plain result must contain no raster/clip dependency')
args=[str(exe),str(final),'--export-background-opacity=0','--export-filename='+str(out/'plain.png')]
p=subprocess.run(args,env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=120)
(out/'render.log').write_text(p.stdout+p.stderr,encoding='utf-8')
if p.returncode:raise RuntimeError('Render failed')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report={'scope':'Actual Inkscape per-color path-intersection with immutable native alpha compound. Group-clip/per-path antialias differences require independent pixel comparison. Not artwork approval.','colorSource':str(source),'colorSha256':sha(source),'alphaSource':str(alpha),'alphaSha256':sha(alpha),'plain':str(final),'plainSha256':sha(final),'plainBytes':final.stat().st_size,'rows':rows,'version':subprocess.check_output([str(exe),'--version'],text=True).strip(),'visualReview':'PENDING','pixelComparison':'NOT RUN'}
(out/'flatten.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:report[k]for k in ['plain','plainBytes','plainSha256']}))
