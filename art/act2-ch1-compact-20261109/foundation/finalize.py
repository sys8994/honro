"""Repackage immutable native RAW with the unchanged canonical floor clip.

No drawing, trace, coordinate invention or optimizer acceptance occurs here.
The bounded optimizer selected RAW; its result is kept in _local/reports.
"""
import copy, importlib.util, json
from pathlib import Path
from xml.etree import ElementTree as E

base = Path(__file__).resolve().parent
root = Path.cwd()
config = json.loads((base / 'asset-config.json').read_text(encoding='utf8'))
color = base / 'trace6-v2/native-color.svg'
alpha = base / 'trace6-v2/native-alpha.svg'
spec = importlib.util.spec_from_file_location('native_clip', root / 'tools/vector-production/import-native-clip.py')
adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(adapter)
asset = adapter.compile_native_clip(color, alpha, config)
(base / 'final.asset.json').write_text(json.dumps(asset, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf8')
ns = 'http://www.w3.org/2000/svg'
E.register_namespace('', ns)
box=config['bounds']
svg = E.Element('{'+ns+'}svg', {'width':'1536','height':'1024','viewBox':f"{box['x']} {box['y']} {box['w']} {box['h']}"})
defs = E.SubElement(svg, '{'+ns+'}defs')
clip = E.SubElement(defs, '{'+ns+'}clipPath', {'id':'canonical-floor','clipPathUnits':'userSpaceOnUse'})
for d in config['bodyClip']:
    E.SubElement(clip, '{'+ns+'}path', {'d':d})
outer = E.SubElement(svg, '{'+ns+'}g', {'clip-path':'url(#canonical-floor)'})
inner = E.SubElement(outer, '{'+ns+'}g', {'transform':'matrix('+','.join(map(str,config['transform']))+')'})
for e in E.parse(color).getroot():
    if e.tag.split('}')[-1] in ['g','path']:
        inner.append(copy.deepcopy(e))
E.ElementTree(svg).write(base / 'final.svg', encoding='utf8', xml_declaration=True)
print(json.dumps({'assetBytes':(base/'final.asset.json').stat().st_size,'svgBytes':(base/'final.svg').stat().st_size,'selection':'native RAW fallback; no reduced-segment optimization candidate passed selection'}))
