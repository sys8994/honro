"""Pixel-gate regression: explicit 1LSB RGB-only tolerance, never alpha relaxation."""
import importlib.util,tempfile
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('metrics',root/'tools/vector-production/optimize-svg.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
cfg={'protectedRects':[[0,0,32,32]],'sourcePalette':[[80,87,71]],'limits':{'rgbMAE255':2,'silhouettePx':1.5,'protectedRgbMAE255':1,'protectedPx':.5,'protectedChangedPixelFraction':.05},'protectedRgbQuantizationTolerance255':1}
def run(a,b,cfg=cfg):
 with tempfile.TemporaryDirectory() as d:
  x=Path(d)/'a.png';y=Path(d)/'b.png';Image.fromarray(a).save(x);Image.fromarray(b).save(y);return m.compare(x,y,1,cfg)
a=np.zeros((32,32,4),dtype=np.uint8);a[:]=[20,30,20,255];a[8:24,8:24]=[80,87,71,255]
a[8,15]=[77,87,68,255];b=a.copy();b[8,15]=[76,87,68,255]
r=run(a,b);assert r['pass'] and r['protectedQuantizationPixels']>0 and r['protectedColorEdgeRawMaxOffsetPx']>=1,r
assert not run(a,b,{**cfg,'protectedRgbQuantizationTolerance255':0})['pass']
b=a.copy();b[8,15]=[75,87,68,255];assert not run(a,b)['pass'],'2LSB crossing must remain visible'
a=np.zeros((32,32,4),dtype=np.uint8);a[:]=[20,30,20,255];a[8:24,8:24]=[80,87,71,255]
b=np.roll(a,1,axis=1);assert not run(a,b)['pass'],'high-contrast one-pixel shift'
a=np.zeros((32,32,4),dtype=np.uint8);a[:]=[20,30,20,255];a[16,16]=[80,87,71,255];b=a.copy();b[16,16]=[20,30,20,255];assert not run(a,b)['pass'],'isolated feature dropout'
a[8:24,16]=[80,87,71,255];b=a.copy();b[8:24,16]=[20,30,20,255];assert not run(a,b)['pass'],'thin-line dropout'
a[:]=[80,87,71,255];a[16,16]=[77,87,68,255];b=a.copy();b[16,16]=[76,87,68,254];r=run(a,b);assert r['protectedQuantizationPixels']==0 and not r['pass'],'alpha must not be tolerated'
print('PASS: 1LSB explicit opt-in; raw metric retained; 2LSB, high-contrast shift/dropout, thin line and alpha rejected. Entirely <=1LSB features remain a declared raster limit.')
