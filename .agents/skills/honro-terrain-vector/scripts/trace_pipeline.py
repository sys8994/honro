#!/usr/bin/env python3
"""Actual Inkscape 1.4 trace + bounded post-trace native path simplification.
Usage: python trace_pipeline.py INPUT.png OUTPUT_DIR [scans=24]
"""
import sys,os,subprocess,json,base64,shutil,re,hashlib
from pathlib import Path
from PIL import Image
from lxml import etree as ET
import numpy as np
from scipy import ndimage as ndi
from copy import deepcopy
from svgpathtools import parse_path
HERE=Path(__file__).resolve().parent
ROOT=HERE.parent
src=Path(sys.argv[1]).resolve(); out=Path(sys.argv[2]).resolve(); out.mkdir(parents=True,exist_ok=True)
scans=int(sys.argv[3]) if len(sys.argv)>3 else 24
smooth=sys.argv[4] if len(sys.argv)>4 else 'false'
speckles=int(sys.argv[5]) if len(sys.argv)>5 else 0
base_env=dict(os.environ,HOME=str(out/'runtime-home'),XDG_CACHE_HOME=str(out/'runtime-cache'),**({'LD_PRELOAD':str(Path(os.environ['HONRO_INKSCAPE_PRELOAD']).resolve())} if os.environ.get('HONRO_INKSCAPE_PRELOAD') else {}))

def run(args,tag,threshold=None):
    config=out/('config-'+tag); (config/'inkscape').mkdir(parents=True,exist_ok=True)
    if threshold is not None:
        (config/'inkscape/preferences.xml').write_text(f'<inkscape><group id="options"><group id="simplifythreshold" value="{threshold}"/></group></inkscape>')
    env=dict(base_env,XDG_CONFIG_HOME=str(config))
    p=subprocess.run(['inkscape']+list(map(str,args)),env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=300)
    (out/(tag+'.log')).write_text('COMMAND: inkscape '+ ' '.join(map(str,args))+'\n'+p.stdout)
    if p.returncode: raise RuntimeError(f'{tag}: {p.returncode}: {p.stdout}')
    return p.stdout

def render(svg,tag):
    png=out/(tag+'.png');run([svg,'--export-type=png',f'--export-filename={png}','--export-background-opacity=0'],tag+'-render')
    return np.array(Image.open(png).convert('RGBA')).astype(float)

def stats(svg):
    t=ET.parse(str(svg));paths=t.findall('.//{*}path');segments=0;subpaths=0
    for p in paths:
        s=parse_path(p.get('d',''));segments+=len(s);subpaths+=len(s.continuous_subpaths()) if s else 0
    return dict(paths=len(paths),segments=segments,subpaths=subpaths,images=len(t.findall('.//{*}image')),bytes=svg.stat().st_size)

def compact(svg,dest):
    t=ET.parse(str(svg));root=t.getroot()
    for e in list(root.iter()):
        if not isinstance(e.tag,str): continue
        local=ET.QName(e).localname
        if local in ['namedview','metadata']:
            e.getparent().remove(e);continue
        for a in list(e.attrib):
            if a.startswith('{') and ET.QName(a).namespace not in ['http://www.w3.org/2000/svg']:
                del e.attrib[a]
    ET.cleanup_namespaces(root)
    dest.write_bytes(ET.tostring(t,encoding='utf-8',xml_declaration=True,pretty_print=False))

def composite(a):
    return a[:,:,:3]*a[:,:,3:4]/255+255*(1-a[:,:,3:4]/255)
def silhouette(a,b):
    ma=a[:,:,3]>=128;mb=b[:,:,3]>=128
    da=ndi.distance_transform_edt(~ma);db=ndi.distance_transform_edt(~mb)
    distance=max(float(da[mb].max()) if mb.any() else 0,float(db[ma].max()) if ma.any() else 0)
    return dict(max_silhouette_deviation_px=distance,components_a=int(ndi.label(ma,np.ones((3,3)))[1]),components_b=int(ndi.label(mb,np.ones((3,3)))[1]))
im=Image.open(src).convert('RGBA');w,h=im.size
trace_rgb=np.array(im)[:,:,:3].copy();trace_rgb[np.array(im)[:,:,3]<128]=255
trace_input=out/'trace-color-input.png';Image.fromarray(trace_rgb).save(trace_input)
b64=base64.b64encode(trace_input.read_bytes()).decode()
wrapped=out/'01-raster-wrapper.svg';wrapped.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><image id="raster" width="{w}" height="{h}" xlink:href="data:image/png;base64,{b64}"/></svg>')
raw=out/'02-inkscape-trace.svg'
params=f'{scans},{smooth},true,false,{speckles},1,0.2'
log=run([wrapped,'--batch-process',f'--actions=select-by-id:raster;object-trace:{params};select-clear;select-by-id:raster;delete;export-plain-svg;export-filename:{raw};export-do'],'trace')
assert 'Tracing done.' in log
# Preserve actual transparency with a separately traced native Inkscape alpha silhouette.
# White/highlight color layers remain intact; no background-color heuristic.
if np.array(im)[:,:,3].min()<255:
    alpha_png=out/'alpha-mask.png'
    alpha=np.array(im)[:,:,3]
    mask=np.where(alpha>=128,0,255).astype('uint8');Image.fromarray(mask).convert('RGB').save(alpha_png)
    ab=base64.b64encode(alpha_png.read_bytes()).decode();aw=out/'alpha-wrapper.svg'
    aw.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><image id="raster" width="{w}" height="{h}" xlink:href="data:image/png;base64,{ab}"/></svg>')
    av=out/'alpha-native-trace.svg'
    run([aw,'--batch-process',f'--actions=select-by-id:raster;object-trace:2,false,false,true,0,0,0.1;select-clear;select-by-id:raster;delete;export-plain-svg;export-filename:{av};export-do'],'alpha-trace')
    tree=ET.parse(str(raw));root=tree.getroot();ns='http://www.w3.org/2000/svg'
    defs=root.find('{*}defs')
    if defs is None: defs=ET.SubElement(root,'{'+ns+'}defs')
    clip=ET.SubElement(defs,'{'+ns+'}clipPath',id='source-alpha-silhouette',clipPathUnits='userSpaceOnUse')
    at=ET.parse(str(av))
    for e in at.getroot():
        if ET.QName(e).localname in ['g','path']:
            clone=deepcopy(e)
            for item in clone.iter():
                item.attrib.pop('id',None)
            clip.append(clone)
    group=ET.SubElement(root,'{'+ns+'}g',{'clip-path':'url(#source-alpha-silhouette)'})
    for e in list(root):
        if e is not group and ET.QName(e).localname in ['g','path']: root.remove(e);group.append(e)
    raw_unclipped=out/'02-inkscape-color-trace-unclipped.svg';shutil.copy2(raw,raw_unclipped)
    raw.write_bytes(ET.tostring(tree,encoding='utf-8',xml_declaration=True))
raw_stats=stats(raw);assert raw_stats['paths']>0 and raw_stats['images']==0
reference=render(raw,'02-inkscape-trace')
source_silhouette=silhouette(np.array(im).astype(float),reference)
candidates=[]
# Thresholds are deliberately conservative; only accept actual segment reduction
# and bounded full-resolution raster difference against the native traced SVG.
for threshold in [0.0001,0.00015,0.0002,0.00025,0.0005,0.001]:
    tag=f'simplify-{threshold}';candidate=out/(tag+'.svg')
    run([raw,'--batch-process',f'--actions=select-all:all;path-simplify;export-plain-svg;export-filename:{candidate};export-do'],tag,threshold)
    a=render(candidate,tag);diff=np.abs(composite(reference)-composite(a));s=stats(candidate)
    metric=dict(mean_abs_rgb=float(diff.mean()),fraction_pixels_maxdiff_gt24=float((diff.max(axis=2)>24).mean()),p99_max_rgb=float(np.percentile(diff.max(axis=2),99)))
    metric.update(silhouette(reference,a))
    accept=metric['max_silhouette_deviation_px']<=1.5 and metric['components_a']==metric['components_b'] and s['subpaths']==raw_stats['subpaths'] and s['segments']<raw_stats['segments'] and metric['mean_abs_rgb']<=0.8 and metric['fraction_pixels_maxdiff_gt24']<=0.01
    if accept:
        geometric=subprocess.run([sys.executable,str(HERE/'measure_geometry.py'),str(raw),str(candidate)],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=300)
        (out/(tag+'-geometry.log')).write_text(geometric.stdout)
        if geometric.returncode: raise RuntimeError(geometric.stdout)
        geometry=json.loads(candidate.with_suffix('.geometry.json').read_text())
        metric['internal_curve_hausdorff_upper_bound_px']=geometry['max_upper_bound_px']
        accept=geometry['max_upper_bound_px']<=1.5
    candidates.append(dict(file=candidate.name,threshold=threshold,stats=s,metrics=metric,accepted=accept))
accepted=[c for c in candidates if c['accepted']]
best=min(accepted,key=lambda c:c['stats']['segments']) if accepted else None
chosen=out/best['file'] if best else raw
final=out/'03-optimized.svg';compact(chosen,final);final_stats=stats(final);final_render=render(final,'03-optimized')
assert final_stats['images']==0 and final_stats['paths']>0
final_diff=np.abs(composite(reference)-composite(final_render))
version=subprocess.check_output(['inkscape','--version'],env=dict(base_env,XDG_CONFIG_HOME=str(out/'runtime-config')),text=True).strip()
source_diff=np.abs(composite(np.array(im).astype(float))-composite(reference))
report=dict(source_sha256=hashlib.sha256(src.read_bytes()).hexdigest(),color_input_sanitation=dict(operation='RGB unchanged where original alpha>=128; RGB forced to white where alpha<128; original alpha separately traced natively as clip',file='trace-color-input.png',sha256=hashlib.sha256(trace_input.read_bytes()).hexdigest()),source_to_raw_rgb_mae=float(source_diff.mean()),source_silhouette_vs_native=source_silhouette,source=str(src),source_size=[w,h],engine=version,trace_action='object-trace:'+params,native_headless_workaround=os.environ.get('HONRO_INKSCAPE_PRELOAD','none'),raw=raw_stats,candidates=candidates,selected=best['file'] if best else raw.name,final=final_stats,final_metrics=dict(mean_abs_rgb=float(final_diff.mean()),fraction_pixels_maxdiff_gt24=float((final_diff.max(axis=2)>24).mean())),segment_reduction_percent=100*(1-final_stats['segments']/raw_stats['segments']),bounds=dict(max_silhouette_deviation_px=1.5,mean_abs_rgb_max=0.8,fraction_pixels_maxdiff_gt24_max=0.01),note='Pixel bounds compare final vector to raw Inkscape trace, not to original painterly concept. Segment count is parsed SVG path segments, not Bezier control-point count.')
(out/'metrics.json').write_text(json.dumps(report,indent=2)); print(json.dumps(report,indent=2))
