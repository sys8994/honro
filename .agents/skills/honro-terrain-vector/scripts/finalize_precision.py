#!/usr/bin/env python3
import sys,os,re,json,subprocess,shutil
from pathlib import Path
import numpy as np
from PIL import Image
from lxml import etree as ET
from scipy import ndimage as ndi
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent
out=Path(sys.argv[1]).resolve();raw=out/'02-inkscape-trace.svg';chosen=out/'03-optimized.svg'
report=json.loads((out/'metrics.json').read_text());source=np.array(Image.open(report['source']).convert('RGBA')).astype(float);baseline=np.array(Image.open(out/'02-inkscape-trace.png').convert('RGBA')).astype(float)
env=dict(os.environ,HOME=str(out/'runtime-home'),XDG_CONFIG_HOME=str(out/'config-round'),XDG_CACHE_HOME=str(out/'runtime-cache'),**({'LD_PRELOAD':str(Path(os.environ['HONRO_INKSCAPE_PRELOAD']).resolve())} if os.environ.get('HONRO_INKSCAPE_PRELOAD') else {}))
num=re.compile(r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?')
def composite(a):return a[:,:,:3]*a[:,:,3:4]/255+255*(1-a[:,:,3:4]/255)
def silhouette(a,b):
 a=a[:,:,3]>=128;b=b[:,:,3]>=128
 return max(float(ndi.distance_transform_edt(~a)[b].max()),float(ndi.distance_transform_edt(~b)[a].max()))
results=[]
for decimals in [2,3]:
 t=ET.parse(str(chosen))
 for e in t.findall('.//{*}path'):
  def rounding(m):
   f=round(float(m.group()),decimals)
   return str(int(f)) if f==int(f) else f'{f:.{decimals}f}'.rstrip('0').rstrip('.')
  d=num.sub(rounding,e.get('d',''))
  d=re.sub(r'\s*([A-Za-z])\s*',r'\1',d)
  d=re.sub(r'(?<![0-9])(-?)0\.',r'\1.',d)
  d=re.sub(r'\s+(-)',r'\1',d)
  e.set('d',d)
 candidate=out/f'precision-{decimals}.svg';candidate.write_bytes(ET.tostring(t,encoding='utf-8',xml_declaration=True))
 log=subprocess.run([sys.executable,str(HERE/'measure_geometry.py'),str(raw),str(candidate)],capture_output=True,text=True,timeout=300);(out/f'precision-{decimals}.log').write_text(log.stdout+log.stderr)
 if log.returncode: raise RuntimeError(log.stderr)
 g=json.loads(candidate.with_suffix('.geometry.json').read_text())
 png=candidate.with_suffix('.png');r=subprocess.run(['inkscape',str(candidate),'--export-type=png',f'--export-filename={png}','--export-background-opacity=0'],env=env,capture_output=True,text=True,timeout=300)
 if r.returncode:raise RuntimeError(r.stderr)
 a=np.array(Image.open(png).convert('RGBA')).astype(float);diff=np.abs(composite(baseline)-composite(a));metric=dict(decimals=decimals,bytes=candidate.stat().st_size,mean_abs_rgb=float(diff.mean()),fraction_pixels_maxdiff_gt24=float((diff.max(2)>24).mean()),internal_curve_hausdorff_upper_bound_px=g['max_upper_bound_px'],raw_silhouette_deviation_px=silhouette(baseline,a),source_silhouette_deviation_px=silhouette(source,a))
 metric['accepted']=metric['mean_abs_rgb']<=.8 and metric['fraction_pixels_maxdiff_gt24']<=.01 and metric['internal_curve_hausdorff_upper_bound_px']<=1.5 and metric['source_silhouette_deviation_px']<=1.5
 results.append(metric)
 if metric['accepted']:
  shutil.copy2(candidate,out/'04-final.svg');shutil.copy2(png,out/'04-final.png');break
else:
 shutil.copy2(chosen,out/'04-final.svg');shutil.copy2(out/'03-optimized.png',out/'04-final.png')
report['coordinate_precision_candidates']=results;report['delivered_file']='04-final.svg';report['delivered_bytes']=(out/'04-final.svg').stat().st_size
(out/'final-metrics.json').write_text(json.dumps(report,indent=2));print(json.dumps(dict(stage=out.parent.name,results=results,final_bytes=report['delivered_bytes'])))
