"""Reject native SVG canvas-closure spikes before registering material-layer joins.
This is source inspection, not an artistic simplifier or physical contour editor.
Callers retain raw SVGs and deliberately select a stable interior crop column.
"""
from svgpathtools import parse_path
from bounded_flatten import flatten
from statistics import median

def crossings(el,x):
 p=parse_path(flatten(el.get('d'),.1));ys=[z.start.imag+(z.end.imag-z.start.imag)*(x-z.start.real)/(z.end.real-z.start.real)for z in p if abs(z.end.real-z.start.real)>1e-9 and min(z.start.real,z.end.real)<=x<=max(z.start.real,z.end.real)]
 if not ys:raise ValueError(f'No native material crossing at column {x}')
 return sorted(ys)

def verified_depth(layer,outer,x,interior_direction,world_depth_scale=1,maximum_jump_world=24):
 """Compare target with three inward neighbors. Fail rather than register to a closure."""
 assert interior_direction in [-1,1]
 cols=[x+i*interior_direction for i in range(4)]
 ds=[crossings(layer,c)[0]-crossings(outer,c)[0]for c in cols]
 jump=abs(ds[0]-median(ds[1:]))*world_depth_scale
 if jump>maximum_jump_world:raise ValueError(f'Native closure/outlier: column{x}, depthworld{ds[0]*world_depth_scale:.3f}, neighborworld{[round(v*world_depth_scale,3)for v in ds[1:]]}, jump{jump:.3f}>{maximum_jump_world}; choose verified interior crop, do not alter collider')
 return {'sampleColumn':x,'inwardColumns':cols,'depthSource':ds[0],'neighborDepthsSource':ds[1:],'maximumJumpWorld':maximum_jump_world,'observedJumpWorld':jump,'pass':True}
