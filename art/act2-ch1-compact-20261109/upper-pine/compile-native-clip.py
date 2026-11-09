"""Asset-local adapter preserving native Inkscape alpha in existing vector.clips.
Uses unchanged importer/engine limits; no Boolean clipping/geometry invention.
Usage: python compile-native-clip.py COLOR.svg ALPHA.svg CONFIG.json OUT.json
"""
import hashlib,importlib.util,json,sys,xml.etree.ElementTree as E
from pathlib import Path
color,alpha,config,out=map(Path,sys.argv[1:5])
s=importlib.util.spec_from_file_location('honro_import','tools/vector-production/import-svg.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
cfg=json.loads(config.read_text(encoding='utf-8'));cfg['preserveCompounds']=True
asset=m.compile_svg(color.read_text(encoding='utf-8'),cfg)
a=E.parse(alpha).getroot();paths=[]
for e in a.iter():
    if e.tag.split('}')[-1]=='path':
        if e.get('transform') or 'evenodd' in e.get('style','') or e.get('fill-rule')=='evenodd': raise ValueError('Native alpha must be resolved nonzero source-coordinate geometry')
        d=e.get('d','')
        if len(d)>60000: raise ValueError('Native alpha exceeds unchanged existing clip path budget')
        paths.append(d)
if not 1<=len(paths)<=32:raise ValueError('Native alpha path count outside existing vector clip budget')
asset['vector']['clips']={'native-source-alpha':paths}
asset['vector']['root']={'tag':'g','clipPath':'native-source-alpha','children':[asset['vector']['root']]}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
asset['params'].update(nativeColorSha256=sha(color),nativeAlphaSha256=sha(alpha),nativeAlphaMethod='existing vector.clips + a single root group clip, matching Inkscape SVG clipping order',assetLocalAdapter='upper-pine/compile-native-clip.py',visualApproval='NOT REVIEWED')
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(asset,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print(json.dumps({'output':str(out),'bytes':out.stat().st_size,'clipPaths':len(paths),'colorSourceBytes':color.stat().st_size,'sourceAlphaBytes':alpha.stat().st_size,'scope':'Existing vector.clips preservation adapter; actual runtime render comparison pending'}))
