#!/usr/bin/env python3
"""Remeasure explicitly protected silhouette regions above the display sampling grid."""
import argparse,copy,importlib.util,json,xml.etree.ElementTree as E
from pathlib import Path
H=Path(__file__).resolve().parent;s=importlib.util.spec_from_file_location('opt',H/'optimize-svg.py');o=importlib.util.module_from_spec(s);s.loader.exec_module(o)
p=argparse.ArgumentParser();p.add_argument('raw');p.add_argument('candidate');p.add_argument('--config',required=True);p.add_argument('--output-dir',required=True);p.add_argument('--supersample',type=int,default=8);p.add_argument('--remove-reference-images',action='store_true');a=p.parse_args();c=json.loads(Path(a.config).read_text());out=Path(a.output_dir);out.mkdir(parents=True,exist_ok=True)
if not 2<=a.supersample<=16:raise ValueError('Supersample must be2..16')
regions=c.get('protectedRects',[])
if not regions:raise ValueError('Explicit protectedRects required for targeted supersampling')
report={'raw':a.raw,'candidate':a.candidate,'metric':'protected alpha silhouette; no palette-island displacement claim','supersample':a.supersample,'normalPixelSamplingStep':1/a.supersample,'visualApproval':'NOT REVIEWED','regions':regions,'errors':{}}
for scale in c.get('scales',[1,2]):
 samples=[]
 for i,(x,y,w,h) in enumerate(regions):
  images=[];pad=4
  for label,source in [('raw',a.raw),('candidate',a.candidate)]:
   root=E.parse(source).getroot()
   for parent in root.iter():
    for child in list(parent):
     if child.tag.split('}')[-1]=='image':
      if not a.remove_reference_images:raise ValueError('Explicit reference-image removal required')
      parent.remove(child)
   vx,vy,vw,vh=map(float,root.get('viewBox').split());factor=vw/c['width'];root.set('viewBox',f'{vx+(x-pad)*factor} {vy+(y-pad)*factor} {(w+2*pad)*factor} {(h+2*pad)*factor}')
   svg=out/f'{label}-{i}-{scale}.svg';E.ElementTree(root).write(svg,encoding='utf-8',xml_declaration=True);png=svg.with_suffix('.png');o.run(['node',str(H/'render-svg-target.mjs'),str(svg),str(png),str(round((w+2*pad)*scale*a.supersample))]);images.append(png)
  result=o.compare(*images,scale*a.supersample,{'protectionMode':'silhouette-feature','protectedRects':[[pad,pad,w,h]],'limits':c.get('limits',{})})
  samples.append({'region':i,'protectedSilhouetteMaxOffsetPx':result['protectedSilhouetteMaxOffsetPx']/a.supersample,'supersampledPixelOffset':result['protectedSilhouetteMaxOffsetPx'],'protectedRgbMAE255':result['protectedRgbMAE255'],'protectedChangedPixelFraction':result['protectedChangedPixelFraction']})
 maximum=max(v['protectedSilhouetteMaxOffsetPx'] for v in samples);report['errors'][str(scale)]={'samples':samples,'protectedSilhouetteMaxOffsetPx':maximum,'limitPx':c.get('limits',{}).get('protectedPx',.5)*scale,'silhouettePass':maximum<=c.get('limits',{}).get('protectedPx',.5)*scale}
report['silhouettePass']=all(v['silhouettePass'] for v in report['errors'].values());(out/'supersampled-silhouette.json').write_text(o.safe_json(report,indent=2)+'\n');print(o.safe_json(report));raise SystemExit(0 if report['silhouettePass'] else 2)
