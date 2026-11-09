"""Native Inkscape alpha intersection with actual shallow floor geometry.

Intentional source packaging before optimization, not lossless optimization.
Preserves original native raw/color/alpha files. Never changes colliders.
"""
import copy, json, os, subprocess, sys
from pathlib import Path
from xml.etree import ElementTree as E

base = Path(__file__).resolve().parent
exe = Path(sys.argv[1]).resolve()
trace_suffix = sys.argv[2] if len(sys.argv) > 2 else 'trace16'
contract = json.loads((base / 'contract.json').read_text(encoding='utf8'))
ns = 'http://www.w3.org/2000/svg'
E.register_namespace('', ns)
for crop in contract['crops']:
    name = crop['id']
    src = base / (name+'-'+trace_suffix)
    out = base / (name+'-registered-'+trace_suffix)
    out.mkdir(exist_ok=True)
    if (out / 'raw.svg').exists():
        raise RuntimeError('Refuse to overwrite registered raw: '+name)
    x,y,w,h = crop['box']
    z = 1774/w
    pts = crop['top']
    band = pts + [dict(x=p['x'], y=p['y']+160) for p in reversed(pts)]
    d = 'M'+'L'.join(f"{(p['x']-x)*z:.9f},{(p['y']-y)*z:.9f}" for p in band)+'Z'
    alpha = E.parse(src / 'native-alpha.svg').getroot()
    ps = [p for p in alpha.iter() if p.tag.split('}')[-1]=='path']
    if len(ps)!=1:
        raise RuntimeError('Native source alpha should be one compound')
    svg = E.Element('{'+ns+'}svg', {'width':'1774','height':'887','viewBox':'0 0 1774 887'})
    original = copy.deepcopy(ps[0])
    original.set('id','source-alpha')
    svg.append(original)
    E.SubElement(svg,'{'+ns+'}path',{'id':'actual-band','d':d,'fill':'black'})
    inp = out / 'intersection-input.svg'
    E.ElementTree(svg).write(inp,encoding='utf8',xml_declaration=True)
    dest = out / 'native-alpha.svg'
    args = [str(exe),str(inp),'--batch-process','--actions=select-by-id:source-alpha,actual-band;path-intersection;export-plain-svg;export-filename:'+str(dest)+';export-do']
    env = dict(os.environ, INKSCAPE_PROFILE_DIR=str(out/'inkscape-profile'))
    run = subprocess.run(args,env=env,capture_output=True,text=True,encoding='utf8',errors='replace',timeout=120)
    (out/'native-contact.log').write_text(json.dumps(args)+'\n'+run.stdout+run.stderr,encoding='utf8')
    if run.returncode:
        raise RuntimeError('Native contact intersection failed '+name)
    paths = [p for p in E.parse(dest).getroot().iter() if p.tag.split('}')[-1]=='path']
    if len(paths)!=1:
        raise RuntimeError('Registered alpha must remain one native compound')
    color = E.parse(src/'native-color.svg').getroot()
    (out/'native-color.svg').write_bytes((src/'native-color.svg').read_bytes())
    defs = E.SubElement(color,'{'+ns+'}defs')
    clip = E.SubElement(defs,'{'+ns+'}clipPath',{'id':'surface-source-alpha','clipPathUnits':'userSpaceOnUse'})
    clip.append(copy.deepcopy(paths[0]))
    group = E.SubElement(color,'{'+ns+'}g',{'clip-path':'url(#surface-source-alpha)'})
    for e in list(color):
        if e is not group and e.tag.split('}')[-1] in ['g','path']:
            color.remove(e)
            group.append(e)
    E.ElementTree(color).write(out/'raw.svg',encoding='utf8',xml_declaration=True)
    print(json.dumps({'id':name,'registeredRawBytes':(out/'raw.svg').stat().st_size,'scope':'Intentional native source alpha intersection; unchanged colors/colliders'}),flush=True)
