from bounded_flatten import flatten
from svgpathtools import parse_path
from shapely.geometry import LineString,Point
for d in ['M0 0C0 100 100 -100 100 0','M0 0Q50 100 100 0','M0 0A50 30 25 1 1 100 50','m10 10c0 30 30 30 30 0z m50 0h20v20h-20z']:
 tolerance=.02;raw=parse_path(d);flat=parse_path(flatten(d,tolerance));line=LineString([(flat[0].start.real,flat[0].start.imag)]+[(s.end.real,s.end.imag) for s in flat]);error=max(line.distance(Point(s.point(i/300).real,s.point(i/300).imag)) for s in raw for i in range(301));assert error<=tolerance+1e-9,(d,error);print(f'curve max sampled error {error:.7f} <= {tolerance}')
print('PASS: adaptive cubic/quadratic/arc and relative contour samples')
