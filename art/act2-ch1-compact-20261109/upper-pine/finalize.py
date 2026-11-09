"""Package immutable native edge-authored color and unchanged registered alpha."""
import copy,importlib.util,json
from pathlib import Path
from xml.etree import ElementTree as E

base=Path(__file__).resolve().parent
root=Path.cwd()
spec=importlib.util.spec_from_file_location('adapter',root/'tools/vector-production/import-native-clip.py')
adapter=importlib.util.module_from_spec(spec)
spec.loader.exec_module(adapter)
color=base/'edge-authored/final-color.svg'
alpha=base/'registered8/native-alpha.svg'
for config_name,output in [('asset-source-config.json','final.asset.json'),('asset-world-config.json','final-world.asset.json')]:
    config=json.loads((base/config_name).read_text(encoding='utf8'))
    asset=adapter.compile_native_clip(color,alpha,config)
    (base/output).write_text(json.dumps(asset,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
ns='http://www.w3.org/2000/svg'
E.register_namespace('',ns)
svg=E.parse(color).getroot()
defs=E.SubElement(svg,'{'+ns+'}defs')
clip=E.SubElement(defs,'{'+ns+'}clipPath',{'id':'registered-source-alpha','clipPathUnits':'userSpaceOnUse'})
for p in E.parse(alpha).getroot().iter():
    if p.tag.split('}')[-1]=='path':clip.append(copy.deepcopy(p))
group=E.SubElement(svg,'{'+ns+'}g',{'clip-path':'url(#registered-source-alpha)'})
for p in list(svg):
    if p is not group and p.tag.split('}')[-1]in ['g','path']:
        svg.remove(p);group.append(p)
E.ElementTree(svg).write(base/'final.svg',encoding='utf8',xml_declaration=True)
print(json.dumps({'sourceAssetBytes':(base/'final.asset.json').stat().st_size,'worldAssetBytes':(base/'final-world.asset.json').stat().st_size,'scope':'Repackaged source edge-authoring candidate; separate same-engine and commonScene review required'}))
