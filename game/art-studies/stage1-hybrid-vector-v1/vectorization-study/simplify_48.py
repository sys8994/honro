#!/usr/bin/env python3
"""One geometry-only pass over balanced-48.svg; no retrace, palette edit or search.

Requires the existing svgpathtools and build-only shapely==2.2.0:
  python -m pip install --target /tmp/honro-geometry-tools --no-deps shapely==2.2.0
  PYTHONPATH=/tmp/honro-geometry-tools python path/to/simplify_48.py

Trusted operations: svgpathtools Bezier subdivision and GEOS topology-preserving
Douglas-Peucker. Curves are flattened using the Bezier convex-hull/chord bound,
not equal-distance samples that can miss a tight bend. Unrepresentable/invalid
compound paths are retained verbatim, never repaired or silently dropped.
"""
from pathlib import Path
from importlib.metadata import version
import gzip
import hashlib
import json
import math
import re
import xml.etree.ElementTree as ET

from svgpathtools import parse_path, CubicBezier, QuadraticBezier, Line
import shapely
from shapely.geometry import Polygon, MultiPolygon
from shapely.strtree import STRtree

HERE = Path(__file__).resolve().parent
SOURCE = HERE / 'balanced-48.svg'
DESTINATION = HERE / 'balanced-48-simplified.svg'
# One fixed setting: 0.20 flattening + 1.75 GEOS RDP + <=sqrt(2)*0.005
# decimal serialization displacement = <1.958 source px geometric budget.
FLATNESS = 0.20
RDP_TOLERANCE = 1.75
DECIMALS = 2
NS = 'http://www.w3.org/2000/svg'

class PreserveOriginal(Exception):
    pass


def distance_to_chord(point, start, end):
    chord = end - start
    if not chord:
        return abs(point - start)
    u = ((point - start).real * chord.real + (point - start).imag * chord.imag) / abs(chord) ** 2
    return abs(point - (start + max(0.0, min(1.0, u)) * chord))


def flatten(segment, points, depth=0):
    if isinstance(segment, Line):
        points.append(segment.end)
        return
    if not isinstance(segment, (CubicBezier, QuadraticBezier)):
        raise PreserveOriginal('unsupported segment; original path retained')
    control = segment.bpoints()
    # A Bezier lies inside its control hull. Distance to a convex line segment
    # is convex, so this maximum bounds the whole curve's chord deviation.
    if max(distance_to_chord(p, segment.start, segment.end) for p in control[1:-1]) <= FLATNESS:
        points.append(segment.end)
        return
    if depth >= 32:
        raise PreserveOriginal('subdivision depth exceeded; original path retained')
    left, right = segment.split(0.5)
    flatten(left, points, depth + 1)
    flatten(right, points, depth + 1)


def signed_area(points):
    return sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(points, points[1:])) / 2


def number(value):
    text = f'{value:.{DECIMALS}f}'.rstrip('0').rstrip('.')
    return '0' if text in ('-0', '') else text


def svg_ring(points):
    # The library may reverse ring order. Restore each original subpath's winding
    # before serialization, preserving SVG nonzero/evenodd hole semantics.
    pairs = [number(x) + ' ' + number(y) for x, y in points[:-1]]
    return 'M' + pairs[0] + 'L' + ' '.join(pairs[1:]) + 'Z'


def simplify_compound(d):
    # Actual source uses absolute M/C/Z. Explicit M boundaries are retained even
    # when two subpaths happen to share endpoints; continuous_subpaths can join them.
    pieces = re.findall(r'M[^M]*', d)
    if len(pieces) != d.count('M') or re.search(r'[maqcsltvh]', d):
        raise PreserveOriginal('unexpected SVG command form; original path retained')
    rings = []
    sampled_count = 0
    for piece in pieces:
        curve = parse_path(piece)
        if not curve or not curve.isclosed():
            raise PreserveOriginal('open subpath; original path retained')
        samples = [curve[0].start]
        for segment in curve:
            flatten(segment, samples)
        points = [(v.real, v.imag) for i, v in enumerate(samples) if i == 0 or v != samples[i - 1]]
        if points[0] != points[-1]:
            points.append(points[0])
        if len(points) < 4 or abs(signed_area(points)) < 1e-8:
            raise PreserveOriginal('degenerate sampled ring; original path retained')
        rings.append(points)
        sampled_count += len(points) - 1
    polygons = [Polygon(points) for points in rings]
    if any(not p.is_valid or p.is_empty for p in polygons):
        raise PreserveOriginal('sampled ring not a valid polygon; original path retained')
    # Ring hierarchy creates an areal geometry so GEOS explicitly preserves shells,
    # holes and component order, instead of treating each ring as an independent line.
    tree = STRtree(polygons)
    parents = []
    for i, polygon in enumerate(polygons):
        candidates = [int(j) for j in tree.query(polygon.representative_point())
                      if int(j) != i and polygons[int(j)].area > polygon.area
                      and polygons[int(j)].covers(polygon)]
        parents.append(min(candidates, key=lambda j: polygons[j].area) if candidates else None)
    depth = []
    for i in range(len(rings)):
        visited = set()
        ancestor, level = parents[i], 0
        while ancestor is not None:
            if ancestor in visited:
                raise PreserveOriginal('cyclic ring hierarchy; original path retained')
            visited.add(ancestor)
            level += 1
            ancestor = parents[ancestor]
        depth.append(level)
    mapping = []
    areas = []
    for i in range(len(rings)):
        if depth[i] % 2:
            continue
        holes = [j for j in range(len(rings)) if parents[j] == i and depth[j] % 2]
        mapping.append((i, holes))
        areas.append(Polygon(rings[i], [rings[j] for j in holes]))
    geometry = areas[0] if len(areas) == 1 else MultiPolygon(areas)
    if not geometry.is_valid:
        raise PreserveOriginal('invalid compound geometry; original path retained')
    simplified = shapely.simplify(geometry, tolerance=RDP_TOLERANCE, preserve_topology=True)
    results = [simplified] if isinstance(simplified, Polygon) else list(simplified.geoms)
    if not simplified.is_valid or len(results) != len(mapping):
        raise PreserveOriginal('component structure changed; original path retained')
    output = [None] * len(rings)
    for polygon, (shell, holes) in zip(results, mapping):
        if len(polygon.interiors) != len(holes):
            raise PreserveOriginal('hole count changed; original path retained')
        output[shell] = list(polygon.exterior.coords)
        for ring, index in zip(polygon.interiors, holes):
            output[index] = list(ring.coords)
    for i, points in enumerate(output):
        if points is None or len(points) < 4 or abs(signed_area(points)) < 1e-8:
            raise PreserveOriginal('ring collapsed; original path retained')
        if signed_area(points) * signed_area(rings[i]) < 0:
            output[i] = list(reversed(points))
    return ''.join(svg_ring(points) for points in output), sampled_count, sum(len(points) - 1 for points in output), len(rings)


def stats(root, data):
    paths = root.findall(f'.//{{{NS}}}path')
    return dict(raw_bytes=len(data), gzip9_bytes=len(gzip.compress(data, compresslevel=9, mtime=0)),
                path_count=len(paths), subpath_count=sum(p.get('d', '').count('M') for p in paths),
                curve_count=sum(len(re.findall(r'[CcQqAa]', p.get('d', ''))) for p in paths),
                raster_reference_count=sum(node.tag.rsplit('}', 1)[-1] == 'image' for node in root.iter()))


def main():
    if shapely.__version__ != '2.2.0':
        raise RuntimeError('This recorded geometry pass uses shapely 2.2.0.')
    original = SOURCE.read_bytes()
    root = ET.fromstring(original)
    before = stats(root, original)
    totals = dict(simplified_paths=0, retained_original_paths=0, sampled_vertices=0, output_line_segments=0)
    reasons = {}
    for index, path in enumerate(root.findall(f'.//{{{NS}}}path')):
        # All actual source transforms are pure translations. They are kept exactly;
        # unsupported scales/skews are not silently evaluated in local tolerance units.
        if not re.fullmatch(r'translate\([-+\d.eE]+(?:[, ]+[-+\d.eE]+)?\)', path.get('transform', '')):
            raise RuntimeError('Non-translation source transform; pass stopped without output.')
        try:
            d, sampled, segments, rings = simplify_compound(path.get('d'))
        except PreserveOriginal as reason:
            totals['retained_original_paths'] += 1
            reasons[str(reason)] = reasons.get(str(reason), 0) + 1
            continue
        path.set('d', d)
        totals['simplified_paths'] += 1
        totals['sampled_vertices'] += sampled
        totals['output_line_segments'] += segments
        if (index + 1) % 500 == 0:
            print(f'{index + 1}/3119 paths', flush=True)
    ET.register_namespace('', NS)
    data = (ET.tostring(root, encoding='unicode').replace(' />', '/>') + '\n').encode()
    DESTINATION.write_bytes(data)
    report = dict(source='balanced-48.svg', source_sha256=hashlib.sha256(original).hexdigest(),
                  output=DESTINATION.name, settings=dict(flatten_chord_bound=FLATNESS,
                  topology_preserving_rdp_tolerance=RDP_TOLERANCE, output_decimal_places=DECIMALS,
                  combined_geometric_budget=FLATNESS + RDP_TOLERANCE + math.sqrt(2) * .005),
                  libraries=dict(svgpathtools=version('svgpathtools'), shapely=shapely.__version__, geos=shapely.geos_version_string),
                  before=before, after=stats(root, data), operations=totals, retained_original_reasons=reasons,
                  preservation='Original path order, explicit subpath count, winding, transforms, SVG viewport and paint attributes retained. Invalid polygon representations are kept as original Beziers; no repair, buffer, dropped holes or palette changes.',
                  limits='GEOS preserves topology of the chord-bounded polygon representation. This is not a formal certification of the exact original spline topology at subpixel contacts, nor a shared-boundary simplifier across separate colored paths. No unsupported cubic refitter or generic corner-rounding filter is used.')
    (HERE / 'simplification-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)

if __name__ == '__main__':
    main()
