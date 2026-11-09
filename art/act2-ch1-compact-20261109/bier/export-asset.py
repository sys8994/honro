"""Bier-specific alpha/contact adapter with behind-alpha contact fill; existing schema only.
Usage: python export-asset.py CONTACT.svg OUTPUT_PREFIX
No new renderer or budget changes. Native SVG -> engine pixels need comparison.
"""
from pathlib import Path
from xml.etree import ElementTree as E
from copy import deepcopy
import importlib.util,sys,json,re,hashlib
source,prefix=Path(sys.argv[1]).resolve(),Path(sys.argv[2]).resolve();prefix.parent.mkdir(parents=True,exist_ok=True)
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS)
r=E.parse(source).getroot();groups=[g for g in r.iter() if g.tag.split('}')[-1]=='g'];inner=next(g for g in groups if g.get('id')=='source-alpha-art');outer=next(g for g in groups if g.get('id')=='art')
def clip_path(group):
 name=re.fullmatch(r'url\(#(.+)\)',group.get('clip-path','')).group(1);node=next(p for p in r.iter() if p.get('id')==name);paths=[p for p in node.iter()if p.tag.split('}')[-1]=='path'];return paths
alphas=clip_path(inner);contacts=clip_path(outer)
def bare(paths,path):
 root=E.Element('{'+NS+'}svg',{k:r.get(k)for k in ['width','height','viewBox']})
 for p in paths:root.append(deepcopy(p))
 E.ElementTree(root).write(path,encoding='utf-8',xml_declaration=True)
color=prefix.with_name(prefix.name+'-color.svg');alpha=prefix.with_name(prefix.name+'-alpha.svg');bare([p for p in inner if p.tag.split('}')[-1]=='path'],color);bare(alphas,alpha)
spec=importlib.util.spec_from_file_location('native_clip','tools/vector-production/import-native-clip.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
cfg=json.loads((source.parent.parent/'optimization-config.json').read_text(encoding='utf-8'))['asset'] if (source.parent.parent/'optimization-config.json').exists() else json.loads((source.parent.parent.parent/'optimization-config.json').read_text(encoding='utf-8'))['asset']
asset=m.compile_native_clip(color,alpha,cfg)
# The color and alpha share the transform; the contact source-coordinate clip
# is outside the alpha group and inside that same source-to-world transform.
node=asset['vector']['root'];assert node.get('transform')==cfg['transform']
node['children']=[{'tag':'g','clipPath':'authored-contact-ceiling','children':node['children']}]
asset['vector']['clips']['authored-contact-ceiling']=[p.get('d')for p in contacts]
# The contact fill is a sibling behind the original alpha group.
importer_spec=importlib.util.spec_from_file_location('svg_import','tools/vector-production/import-svg.py');imp=importlib.util.module_from_spec(importer_spec);importer_spec.loader.exec_module(imp)
extra=[p for p in outer if p.tag.split('}')[-1]=='path']
if extra:
 band=prefix.with_name(prefix.name+'-band.svg');bare(extra,band);band_cfg=dict(cfg);band_cfg.pop('transform',None);band_cfg['preserveCompounds']=True;band_asset=imp.compile_svg(band.read_text(encoding='utf-8'),band_cfg);node['children'][0]['children'].insert(0,band_asset['vector']['root'])
# Native ROI colors retain their original source-pixel placements and one
# rectangular crop clip, INSIDE the unchanged global source-alpha group.
source_alpha_group=node['children'][0]['children'][-1]
for roi in [g for g in inner if g.tag.split('}')[-1]=='g']:
    name=roi.get('id');inside=list(roi)[0];roi_color=prefix.with_name(prefix.name+'-'+name+'.svg');bare(list(inside),roi_color)
    roi_cfg=dict(cfg);roi_cfg.pop('transform',None);roi_cfg['preserveCompounds']=True
    roi_asset=imp.compile_svg(roi_color.read_text(encoding='utf-8'),roi_cfg)
    transform=[float(n)for n in re.findall(r'[-+]?(?:\d*\.\d+|\d+)',roi.get('transform'))]
    if len(transform)!=2:raise RuntimeError('ROI translation must be source coordinates')
    clip_name='native-'+name
    asset['vector']['clips'][clip_name]=[p.get('d')for p in clip_path(inside)]
    source_alpha_group['children'].append({'tag':'g','transform':[1,0,0,1,*transform],'children':[{'tag':'g','clipPath':clip_name,'children':[roi_asset['vector']['root']]}]})
asset['params'].update(nativeContactSha256=hashlib.sha256(source.read_bytes()).hexdigest(),contactPolicy='Two nested source-coordinate group clips, matching native alpha then outer contact ceiling; no per-color Boolean flatten.',visualApproval='NOT APPROVED; parent actual composition review pending')
prefix.with_suffix('.json').write_text(json.dumps(asset,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print(json.dumps({'asset':str(prefix.with_suffix('.json')),'bytes':prefix.with_suffix('.json').stat().st_size,'clips':list(asset['vector']['clips'])}))
