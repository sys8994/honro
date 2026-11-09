"""Import native color paths and native alpha into existing HONRO vector.clips.

This adapter preserves one group clip instead of approximating it with repeated
Boolean intersections. All existing importer/vector budgets remain unchanged.
It does not certify raster equality, artwork or gameplay: render and compare.
"""
import argparse,hashlib,importlib.util,json,sys,xml.etree.ElementTree as E
from pathlib import Path

def compile_native_clip(color,alpha,config):
    here=Path(__file__).resolve().parent
    s=importlib.util.spec_from_file_location('honro_svg_import',here/'import-svg.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
    color,alpha=Path(color),Path(alpha);cfg=dict(config)
    transform=cfg.pop('transform',None);body_clip=cfg.pop('bodyClip',None)
    cfg['preserveCompounds']=True
    asset=m.compile_svg(color.read_text(encoding='utf-8'),cfg)
    a=E.parse(alpha).getroot();color_root=E.parse(color).getroot()
    if a.get('viewBox')!=color_root.get('viewBox'):raise ValueError('Native color/alpha viewBox must match exactly')
    paths=[]
    for e in a.iter():
        if e.tag.split('}')[-1]=='path':
            if e.get('transform') or 'evenodd' in e.get('style','') or e.get('fill-rule')=='evenodd':raise ValueError('Resolve alpha transforms/evenodd into source-coordinate nonzero paths in Inkscape')
            data=m.preserve_compound(e.get('d',''));paths.extend(data.get('dParts',[data.get('d')]))
        elif e.tag.split('}')[-1]=='g' and e.get('transform'):raise ValueError('Resolve alpha group transforms in Inkscape')
    if not 1<=len(paths)<=32 or any(not isinstance(d,str)or len(d)>60000 for d in paths):raise ValueError('Native alpha exceeds unchanged existing clip path budgets')
    # Source coordinates and native alpha share the SAME transform. Authored
    # BODY collision clipping, when explicitly requested, is outside in world.
    root={'tag':'g','clipPath':'native-source-alpha','children':[asset['vector']['root']]}
    clips={'native-source-alpha':paths}
    if transform is not None:
        import math
        if len(transform)!=6 or not all(isinstance(v,(int,float))and math.isfinite(v)for v in transform):raise ValueError('Config transform must be six finite affine values')
        root={'tag':'g','transform':transform,'children':[root]}
    if body_clip is not None:
        if cfg['semanticLayer']!='BODY':raise ValueError('bodyClip permitted only for a separate BODY asset')
        if not isinstance(body_clip,list)or not 1<=len(body_clip)<=32:raise ValueError('bodyClip must contain1..32 authored collision paths')
        clips['authoredBody']=[d for raw in body_clip for d in m.split_path(raw,'bodyClip',False)]
        if len(clips['authoredBody'])>32:raise ValueError('Authored BODY clip exceeds existing32 path limit')
        root={'tag':'g','clipPath':'authoredBody','children':[root]}
    asset['vector']['clips']=clips;asset['vector']['root']=root
    sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
    asset['params'].update(nativeColorSha256=sha(color),nativeAlphaSha256=sha(alpha),nativeAlphaMethod='single source-coordinate group clip, inside optional sourceToWorld transform and outside color stack',nativeAlphaAdapter='tools/vector-production/import-native-clip.py',nativeAlphaClipPaths=len(paths),visualApproval='NOT REVIEWED')
    return asset

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('color');p.add_argument('alpha');p.add_argument('--config',required=True);p.add_argument('--output',required=True);args=p.parse_args()
    try:
        asset=compile_native_clip(args.color,args.alpha,json.loads(Path(args.config).read_text(encoding='utf-8')))
        out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(asset,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
        print(json.dumps({'output':str(out),'bytes':out.stat().st_size,'nativeAlphaClipPaths':asset['params']['nativeAlphaClipPaths'],'scope':'Existing schema adapter only; actual runtime render comparison and visual review are required'}))
        return 0
    except(ValueError,KeyError,AssertionError)as error:
        print('Import rejected: '+str(error),file=sys.stderr);return 2

if __name__=='__main__':sys.exit(main())
