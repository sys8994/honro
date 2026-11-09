"""Keep original source stack around all walk contacts; blend only lower join.
Uses existing axis-aligned pixelSnapClip to keep complementary clips seamless.
No renderer/schema change; native source and earlier candidates stay intact.
"""
from pathlib import Path
from xml.etree import ElementTree as E
from copy import deepcopy
import json,hashlib
base=Path(__file__).resolve().parent;parent=base.parent;cfg=json.loads((parent/'asset-config.json').read_text(encoding='utf-8'));original=json.loads((parent/'final-world.asset.json').read_text(encoding='utf-8'));b=json.loads((base/'candidate-B-v2.asset.json').read_text(encoding='utf-8'))
assert original['vector']['clips']==b['vector']['clips']
upper='M-6000,-10000H12200V2580H-6000Z';lower='M-6000,2580H12200V27200H-6000Z'
b['vector']['clips'].update(joinUpperPreserve=[upper],joinLowerBlend=[lower]);b['vector']['root']={'tag':'g','children':[{'tag':'g','clipPath':'joinLowerBlend','pixelSnapClip':True,'children':[b['vector']['root']]},{'tag':'g','clipPath':'joinUpperPreserve','pixelSnapClip':True,'children':[deepcopy(original['vector']['root'])]}]}
b['params'].update(joinCandidate='B-v3-preserved-source-contact',sourceEdit='Unchanged original stacked source aboveworld2580; native nonoverlap and per-color gradients only belowworld2580. Existing complementary axis-aligned pixelSnapClip prevents a fractional-pixel split seam.',contactSourceVectorSha256=hashlib.sha256(json.dumps(original['vector'],sort_keys=True).encode()).hexdigest())
(base/'candidate-B-v3-authored.asset.json').write_text(json.dumps(b,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS);r=E.parse(base/'candidate-B-v2-authored.svg').getroot();defs=r.find('{'+NS+'}defs');bottom=next(n for n in list(r)if n.tag.split('}')[-1]=='g');r.remove(bottom)
for name,d in [('joinUpperPreserve',upper),('joinLowerBlend',lower)]:cp=E.SubElement(defs,'{'+NS+'}clipPath',{'id':name,'clipPathUnits':'userSpaceOnUse'});E.SubElement(cp,'{'+NS+'}path',{'d':d})
low=E.SubElement(r,'{'+NS+'}g',{'clip-path':'url(#joinLowerBlend)'});low.append(bottom);top=E.SubElement(r,'{'+NS+'}g',{'clip-path':'url(#joinUpperPreserve)'});canonical=E.SubElement(top,'{'+NS+'}g',{'clip-path':'url(#canonical-world)'});transform=E.SubElement(canonical,'{'+NS+'}g',{'transform':'matrix('+','.join(map(str,cfg['transform']))+')'});alpha=E.SubElement(transform,'{'+NS+'}g',{'clip-path':'url(#native-alpha)'})
for p in E.parse(parent/'composition-color.svg').getroot().iter():
 if p.tag.split('}')[-1]=='path':q=deepcopy(p);q.set('id','preserved-upper-'+q.get('id'));alpha.append(q)
E.ElementTree(r).write(base/'candidate-B-v3-authored.svg',encoding='utf-8',xml_declaration=True)
(base/'contact-preservation.json').write_text(json.dumps({'status':'Source authoring candidate, not optimization','worldSplitY':2580,'maximumMainWalkingFloorY':2530,'marginWorld':50,'upperOriginalVectorUnchanged':True,'upperSourceVectorSha256':b['params']['contactSourceVectorSha256'],'nativeBooleanLimitedToLowerJoin':True,'schemaMapping':'Existing gradient table with original source-space coordinates; existing clip paths; existing pixelSnapClip true only on complementary canonical axis-aligned rectangles. Group opacity is not used. SVG counterparts preserve the mathematical clips, while pixel-snapped raster boundary is an existing engine semantic.','originalAssetSha256':hashlib.sha256((parent/'final-world.asset.json').read_bytes()).hexdigest(),'scope':'No collision, camera, movement, save or runtime-source changes; no threshold changes.'},indent=2),encoding='utf-8')
print(json.dumps({'assetBytes':(base/'candidate-B-v3-authored.asset.json').stat().st_size,'svgBytes':(base/'candidate-B-v3-authored.svg').stat().st_size}))
