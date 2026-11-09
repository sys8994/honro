"""Compile selected native color plus actual native registered source alpha.

SURFACE does not use the BODY-only bodyClip setting. Geographic registration
was performed in Inkscape before this packaging step. No collider is added.
"""
import argparse, copy, importlib.util, json
from pathlib import Path
from xml.etree import ElementTree as E

p = argparse.ArgumentParser()
p.add_argument('--preview-raw',action='store_true')
p.add_argument('--choices')
args = p.parse_args()
base = Path(__file__).resolve().parent
root = Path.cwd()
spec = importlib.util.spec_from_file_location('native_clip',root/'tools/vector-production/import-native-clip.py')
adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(adapter)
ns='http://www.w3.org/2000/svg'
E.register_namespace('',ns)
rows=[]
def remove_background(color,dest):
    tree=E.parse(color)
    parents={child:parent for parent in tree.iter() for child in parent}
    white=[p for p in tree.iter() if p.tag.split('}')[-1]=='path' and p.get('style')=='fill:#fdfdfd']
    if len(white)!=1:
        raise RuntimeError('Expected exactly the known full-canvas trace-background white, not a real white feature')
    parents[white[0]].remove(white[0])
    tree.write(dest,encoding='utf8',xml_declaration=True)
    return dest
for name in ['west','central','north']:
    reg=base/(name+'-registered-trace16')
    report=root/'_local/reports/act2-redesign-20261109/surface-production'/(name+'-opt16/report.json')
    chosen='raw' if args.preview_raw else json.loads(report.read_text(encoding='utf8'))['chosen']
    if args.choices and not args.preview_raw:
        chosen=json.loads(Path(args.choices).read_text(encoding='utf8')).get(name,chosen)
    if not chosen:
        raise RuntimeError('No feasible optimizer selection '+name)
    color=reg/'native-color.svg' if chosen=='raw' else report.parent/(chosen+'.svg')
    edge=base/(name+'-edge-authored')
    if (edge/'native-color.svg').exists():
        if chosen not in ['raw','precision-6']:raise RuntimeError('New protected edge base supports only registered RAW or tested precision6 core')
        raw_authored=edge/'native-color.svg'
        color=raw_authored if chosen=='raw' else edge/'final-color.svg'
    else:
        raw_authored=remove_background(reg/'native-color.svg',base/(name+'-authored-color.svg'))
        color=raw_authored if chosen=='raw' else remove_background(color,base/(name+'-selected-authored-color.svg'))
    alpha=reg/'native-alpha.svg'
    config=json.loads((base/(name+'-asset-config.json')).read_text(encoding='utf8'))
    asset=adapter.compile_native_clip(color,alpha,config)
    asset['params']['knownTraceBackgroundRemoved']='Only the single full-canvas #fdfdfd rectangle was removed; original native RAW preserved. Same operation applied to registered RAW and chosen candidate before actual-engine comparison.'
    tag='preview-raw' if args.preview_raw else 'final'
    file=(root/'_local/reports/act2-redesign-20261109/surface-production' if args.preview_raw else base)/(name+'-'+tag+'.asset.json')
    file.parent.mkdir(parents=True,exist_ok=True)
    file.write_text(json.dumps(asset,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
    if not args.preview_raw:
        (base/(name+'-final-color.svg')).write_bytes(color.read_bytes())
        x,y,w,h=config['params']['worldViewBox']
        svg=E.Element('{'+ns+'}svg',{'width':'1774','height':'887','viewBox':f'{x} {y} {w} {h}'})
        defs=E.SubElement(svg,'{'+ns+'}defs')
        clip=E.SubElement(defs,'{'+ns+'}clipPath',{'id':'registered-source-alpha','clipPathUnits':'userSpaceOnUse'})
        for q in E.parse(alpha).getroot().iter():
            if q.tag.split('}')[-1]=='path':clip.append(copy.deepcopy(q))
        transform=E.SubElement(svg,'{'+ns+'}g',{'transform':'matrix('+','.join(map(str,config['transform']))+')'})
        group=E.SubElement(transform,'{'+ns+'}g',{'clip-path':'url(#registered-source-alpha)'})
        for q in E.parse(color).getroot():
            if q.tag.split('}')[-1] in ['g','path']:group.append(copy.deepcopy(q))
        E.ElementTree(svg).write(base/(name+'-final.svg'),encoding='utf8',xml_declaration=True)
    rows.append({'id':name,'asset':str(file),'bytes':file.stat().st_size,'chosen':chosen,'previewOnly':args.preview_raw})
print(json.dumps(rows))
