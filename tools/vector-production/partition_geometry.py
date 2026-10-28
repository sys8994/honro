"""Optional offline GEOS fallback; polygonized cells retain SVG winding semantics."""
import numpy as np
from svgpathtools import parse_path
from shapely.geometry import LineString,box
from shapely.ops import unary_union,polygonize

def partition_linear(d,fill_rule,limit=40000,polygon_tolerance=0,coordinate_grid=0):
    rings=[]
    for p in parse_path(d).continuous_subpaths():
        pts=[(p[0].start.real,p[0].start.imag)]+[(s.end.real,s.end.imag) for s in p]
        if pts[-1]!=pts[0]:pts.append(pts[0])
        if len(pts)>3:rings.append(pts)
    lines=[LineString(r) for r in rings]
    segments=np.array([(r[i],r[i+1]) for r in rings for i in range(len(r)-1)],dtype=float)
    x0,y0,x1,y1=segments[:,0,0],segments[:,0,1],segments[:,1,0],segments[:,1,1]
    kept=[]
    for cell in polygonize(unary_union(lines)):
        p=cell.representative_point();x,y=p.x,p.y
        cross=(x1-x0)*(y-y0)-(x-x0)*(y1-y0)
        winding=int(np.count_nonzero((y0<=y)&(y1>y)&(cross>0))-np.count_nonzero((y0>y)&(y1<=y)&(cross<0)))
        if (winding%2!=0) if fill_rule=='evenodd' else winding!=0:kept.append(cell)
    geometry=unary_union(kept)
    if polygon_tolerance:geometry=geometry.simplify(polygon_tolerance,preserve_topology=True)
    parts=[]
    def polygons(g):
        if g.is_empty:return
        if g.geom_type=='Polygon':yield g
        elif hasattr(g,'geoms'):
            for child in g.geoms:yield from polygons(child)
    def fmt(value):
        if coordinate_grid:value=round(value/coordinate_grid)*coordinate_grid
        return f'{value:.12g}'
    def text(g):
        return ''.join('M'+'L'.join(f'{fmt(x)},{fmt(y)}' for x,y in list(ring.coords)[:-1])+'Z' for p in polygons(g) for ring in [p.exterior,*p.interiors])
    def cut(bounds,depth=0):
        g=geometry.intersection(box(*bounds));value=text(g)
        if not value:return
        if len(value)<=limit:parts.append({'d':value,'fillRule':'evenodd','box':bounds});return
        if depth>16 or len(parts)>=400:raise ValueError('Partition exceeds offline depth/node allowance')
        axis=0 if bounds[2]-bounds[0]>=bounds[3]-bounds[1] else 1
        mid=(bounds[axis]+bounds[axis+2])/2;a=list(bounds);b=list(bounds);a[axis+2]=mid;b[axis]=mid;cut(a,depth+1);cut(b,depth+1)
    if not geometry.is_empty:cut(list(geometry.bounds))
    return {'parts':parts,'sourceBounds':list(geometry.bounds),'operation':'GEOS polygonize; original nonzero/evenodd winding classification; non-overlapping tile intersections'}
