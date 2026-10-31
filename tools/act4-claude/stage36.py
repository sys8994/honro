#!/usr/bin/env python3
"""Stage 36 · 쇠가 없는 마을 — v2 (design card: 6800x3200, aspect 2.13).

Plan (spec v0.2 36): a ruined village in a low basin. Entrance on the west
rock -> carved steps down to the empty workshop terrace (the hingeless door
the knight pushes) -> steps down into the wide, quiet event yard (no fighting
in the centre) -> steps up to the east house terrace -> the outskirts path
climbing to the exit (short defence possible). Short side move: the broken
timber gallery along the yard's back edge (one small gap). No sea.
Absence of iron is told by art: empty hinge seats, nail-less frames, hearths
without cauldrons, abandoned houses with dark windows.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT, interp
from shapely.geometry import Polygon

N, W, H = 36, 6800, 3200
p = Painter(N, W, H, seed=36)
p.crag = True
MASON = ('#4b4f55', '#5a5f63', '#6b6f70')
MORTAR = '#24272c'

p.solid('entrance', [(0, 2050), (600, 2040), (900, 2050), (1150, 2250)], [(1150, H, 'c'), (0, H, 'c')], amp=0, role='village entrance on the west rock',
        steps=[(905, 1145)], extend=[(-1600, 2060), (40, 2050), (40, H + 1200), (-1600, H + 1200)])
p.solid('workshop', [(1150, 2250), (2000, 2245), (2700, 2255)], [(2700, H, 'c'), (1150, H, 'c')], amp=0, role='empty workshop terrace')
p.solid('yard', [(2700, 2255), (2950, 2550), (3600, 2558), (4400, 2555), (4650, 2300)], [(4650, H, 'c'), (2700, H, 'c')], amp=0,
        role='wide quiet event yard in the basin', steps=[(2705, 2945), (4405, 4645)])
p.solid('east', [(4650, 2300), (5800, 2295), (6150, 2050)], [(6150, H, 'c'), (4650, H, 'c')], amp=0, role='east house terrace and the outskirts path',
        steps=[(5810, 6140)])
p.solid('exit-ledge', [(6150, 2050), (6500, 2042), (6800, 2040)], [(6800, H, 'c'), (6150, H, 'c')], amp=0, role='exit ledge',
        extend=[[(6760, 2040), (8400, 2020), (8400, H + 1200), (6760, H + 1200)], [(0, H - 40), (W, H - 40), (W, H + 1200), (0, H + 1200)]])
for k in ('entrance', 'workshop', 'yard', 'east', 'exit-ledge'):
    p.solids[k]['path'] = True
p.solids['yard']['mason'] = [(2700, 4650, 160, MASON, MORTAR)]
p.solids['workshop']['mason'] = [(1150, 2700, 300, MASON, MORTAR)]
p.solids['east']['mason'] = [(4650, 5800, 260, MASON, MORTAR)]
# short side move along the back of the yard: a broken timber gallery
p.deck('gallery-w', [(2640, 2180), (3350, 2190)], role='broken workshop gallery (side move)')
p.deck('gallery-e', [(3500, 2200), (4800, 2222)], role='gallery to the east terrace (side move)')
p.deck('loft', [(5150, 2170), (5400, 2170)], role='storehouse loft on the east terrace')

# ---- houses: abandoned, dark windows; the workshop open-fronted with an empty hearth
for x, y, w, wl, rf, sd in [(380, 2043, 380, 170, 140, 1), (1750, 2247, 560, 230, 190, 2), (5000, 2297, 440, 200, 160, 3), (5520, 2296, 360, 170, 140, 4),
                            (6480, 2042, 380, 180, 150, 5)]:
    p.hanok(x, y, w, wl, rf, lit=(), seed=sd)
# empty hearth in the workshop (no cauldron), hinge seats without hinges, broken roof
p.add('STRUCT', 'M1590 2213 L1590 2140 Q1640 2100 1690 2140 L1690 2213 Z', '#2a2626')
p.add('STRUCT', 'M1612 2213 L1612 2158 Q1640 2132 1668 2158 L1668 2213 Z', '#120f10')
for yy in (2150, 2190):
    p.add('STRUCT', 'M2008 %d L2018 %d L2018 %d L2008 %d Z' % (yy, yy, yy + 14, yy + 14), '#c2b9a8')
p.add('STRUCT', 'M4860 2016 L4930 2050 L4990 2030 L5040 2060 L4980 2075 L4890 2070 Z', '#0d1320')
p.art_features += ['quiet-yard', 'ironless-traces']

for c in [('wall-w', 1350, 2248, 120, 85, 'wall'), ('wall-e', 5650, 2296, 120, 85, 'wall'), ('exit-rock', 6250, 2047, 110, 120, 'boulder')]:
    p.cover(*c)
for x in (150, 6700):
    p.pine(x, 220)
p.bamboo(2600, 480, 4)
p.bamboo(4750, 460, 3)

base = {'version': 2, 'stage': N, 'intent': 'Ruined ironless village in a basin: entrance, empty workshop with the hingeless door, wide quiet event yard, east house terrace, outskirts path to the exit; broken gallery as the short side move.',
        'activePlayBounds': {'left': 180, 'top': 1700, 'right': 6650, 'bottom': 2700}, 'spawn': {'x': 260, 'y': 2050}, 'spawnSupport': 'entrance',
        'keepElements': ['a4:door', 's36-density:foundation-dawn-v4', 's36-density:frame-dawn-v4'],
        'placeElements': [{'assetId': 'a4:door', 'x': 2460, 'y': 2251, 'scale': 1},
                          {'assetId': 's36-density:frame-dawn-v4', 'x': 1250, 'y': 2250, 'scale': .6},
                          {'assetId': 's36-density:frame-dawn-v4', 'x': 5900, 'y': 2240, 'scale': .55},
                          {'assetId': 's36-density:foundation-dawn-v4', 'x': 2180, 'y': 2246, 'scale': .5},
                          {'assetId': 's36-density:foundation-dawn-v4', 'x': 5300, 'y': 2296, 'scale': .45}],
        'act4': {'coords': {'arrivalX': 1800, 'arrivalViewX': 3600, 'arrivalViewY': 2400, 'doorPushX': 2370, 'leaveX': 6100, 'completeX': 6500}},
        'routes': [{'id': 'yard', 'supports': ['entrance', 'workshop', 'yard', 'east', 'exit-ledge']},
                   {'id': 'gallery', 'supports': ['entrance', 'workshop', 'gallery-w', 'gallery-e', 'east', 'exit-ledge']}],
        'enemyAnchors': [], 'status': 'Claude v2 (plan-gated)'}
p.build(ROOT / 'art/act4-claude/stage36', ROOT / 'tools/act4-pilot/layouts/stage36-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/campaign-far/act4-far-inland.webp'))
