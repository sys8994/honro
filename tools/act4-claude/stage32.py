#!/usr/bin/env python3
"""Stage 32 · 빈 포구 — v2 (design card: 6600x3200, aspect 2.06).

Plan (spec v0.2 32): a lived-in harbour village on stone terraces. Entrance
by the broken dock forks: the short exposed alley runs along the upper house
terrace (open line of fire), the low-wall detour runs under it through the
arched undercroft behind low dry-stone walls (cover, flank). Both join at the
common yard (quiet reunion space by the shelter door), then the path climbs
past the last house to the exit. The dock is edge context; houses and yard
are the centre. Roofs are never the only answer.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT, interp
from shapely.geometry import Polygon
from shapely.ops import unary_union
import math

N, W, H = 32, 6600, 3200
p = Painter(N, W, H, seed=32)
p.crag = True

# ---- entrance landing by the dock
p.solid('shore', [(0, 2310), (600, 2300), (1100, 2320)], [(1100, H, 'c'), (0, H, 'c')], kind='rock', amp=0, role='harbour landing',
        extend=[[(-1600, 2330), (40, 2310), (40, H + 1200), (-1600, H + 1200)], [(0, 2600), (1100, 2600), (1100, H + 1200), (0, H + 1200)]])
p.solids['shore']['path'] = True
# ---- the low lane, the common yard and the climb to the exit: one ground
LANE = [(1100, 2320), (1600, 2328), (2200, 2338), (2800, 2333), (3400, 2335), (3700, 2300), (3950, 2203), (4600, 2198), (5250, 2200),
        (5600, 2010), (5800, 1900), (6100, 1765), (6600, 1750)]
p.solid('lane-yard', LANE, [(W, H, 'c'), (1100, H, 'c')], amp=0, role='low-wall lane, common yard, climb to the exit',
        extend=[[(W - 40, 1750), (W + 1600, 1740), (W + 1600, H + 1200), (W - 40, H + 1200)], [(0, H - 40), (W, H - 40), (W, H + 1200), (0, H + 1200)]])
p.solids['lane-yard']['path'] = True
# ---- the upper house terrace (short exposed alley) over the undercroft
p.deck('entry-stairs', [(850, 2304), (1300, 1855)], kind='stonestair', role='stone steps up to the house terrace')
p.shelf('upper-alley', [(1300, 1855), (2400, 1845), (3500, 1855)], [140, 150, 140], kind='rock', role='short exposed alley on the house terrace')
p.solids['upper-alley']['path'] = True
p.solids['upper-alley']['moss'] = False
p.deck('down-stairs', [(3500, 1855), (3950, 2203)], kind='stonestair', role='stone steps down into the yard')
p.deck('maru', [(2550, 1770), (2800, 1770)], role='house porch (maru) on the terrace')
p.deck('net-loft', [(4300, 2060), (4600, 2060)], role='net-drying loft in the yard')
p.solid('yard-step', [(4950, 2199), (5000, 2110), (5200, 2105), (5240, 2200)], [(5245, 2240, 'c'), (4945, 2240, 'c')], role='stone platform by the shelter', amp=0)
p.solid('exit-rock', [(6250, 1762), (6300, 1680), (6440, 1672), (6500, 1755)], [(6505, 1800, 'c'), (6245, 1800, 'c')], role='rock by the exit path', amp=0.2)

# ---- stone terraces (석축): undercroft arcade behind the low lane, embankments
MASON = ('#3a4d66', '#475c77', '#566c88')
def mason(g, y):
    p._masonry_into('STRUCT', g, y_ref=y, scale=.75, tones=MASON, mortar='#172235')
U = p.solids['upper-alley']['walk']
L = p.solids['lane-yard']['walk']
xs = [1300 + i * 2200 / 40 for i in range(41)]
under = Polygon([(x, interp(U, x) + 130) for x in xs] + [(x, interp(L, x) + 4) for x in reversed(xs)]).buffer(0)
holes = []
for a, b in [(1450, 1950), (2150, 2650), (2850, 3350)]:   # arches of the undercroft
    pts = [(a + (b - a) * t / 16, interp(L, a + (b - a) * t / 16) - 300 * math.sin(math.pi * t / 16) ** .5) for t in range(17)]
    holes.append(Polygon(pts + [(b, interp(L, b) + 10), (a, interp(L, a) + 10)]).buffer(0))
arch = unary_union(holes)
mason(under.difference(arch), 2300)
p.add('STRUCT', ' '.join('M' + ' L'.join('%d %d' % c for c in g.exterior.coords[:-1]) + ' Z' for g in getattr(arch.intersection(under), 'geoms', [arch.intersection(under)])), '#121c2c')
# embankment faces: yard, exit and landing terraces sit on dressed walls above the rock
p.solids['lane-yard']['mason'] = [(3700, 5300, 300, MASON, '#172235'), (5300, 6600, 260, MASON, '#172235')]
p.solids['shore']['mason'] = [(0, 1100, 200, MASON, '#172235')]
p.art_features += ['undercroft', 'stone-terraces', 'common-yard']

for c in [('wall-1', 1850, 2330, 120, 80, 'wall'), ('wall-2', 2700, 2335, 130, 85, 'wall'), ('yard-wall', 4250, 2199, 120, 75, 'wall')]:
    p.cover(*c)
p.pine(6450, 200)
for x in (150, 1000):
    p.reeds(x, 6, 80)

HOUSE = 'density-bg:coastal-house-32-blue-dawn-v3'
for x, y, w, wl, rf, lit, sd in [(1650, 1852, 460, 200, 160, (1,), 1), (2950, 1852, 380, 180, 150, (0, 1), 2), (5050, 2203, 560, 230, 190, (0, 2), 3),
                                 (6350, 1752, 360, 170, 140, (1,), 4), (3300, 1852, 260, 150, 120, (), 5)]:
    p.hanok(x, y, w, wl, rf, lit=lit, seed=sd)
place = [{'assetId': 'a4:door', 'x': 4790, 'y': 2200, 'scale': .9},
          {'assetId': 'a4:dock', 'x': 200, 'y': 2330, 'scale': .5},
          {'assetId': 's32v:abandoned-skiff-s32-blue-dawn-v3', 'x': 150, 'y': 2345, 'scale': .5},
          {'assetId': 's32v:abandoned-skiff-s32-blue-dawn-v3', 'x': 4050, 'y': 2205, 'scale': .45},
          {'assetId': 'a4-coast:drying-frame-s32-blue-dawn-v3', 'x': 700, 'y': 2300, 'scale': .65},
          {'assetId': 'a4-coast:drying-frame-s32-blue-dawn-v3', 'x': 4450, 'y': 2198, 'scale': .8}]

base = {'version': 2, 'stage': N, 'intent': 'Harbour village on stone terraces: exposed upper alley and walled undercroft lane join at the quiet common yard by the shelter; path climbs to the exit.',
        'activePlayBounds': {'left': 180, 'top': 1500, 'right': 6450, 'bottom': 2450}, 'spawn': {'x': 260, 'y': 2310}, 'spawnSupport': 'shore',
        'keepElements': ['a4:door', 'a4:dock', 's32v:abandoned-skiff-s32-blue-dawn-v3', 'a4-coast:drying-frame-s32-blue-dawn-v3'],
        'placeElements': place,
        'npcs': [{'x': 4900, 'y': round(interp(LANE, 4900) - 0.5, 2)}],
        'act4': {'exit': {'x': 6200, 'y': 1760},
                 'shelter': {'x': 4790, 'y': 2200, 'count': 7, 'manifest': ['shelter-person-%d' % i for i in range(7)]},
                 'coords': {'shelterX': 4900, 'doorX': 4790, 'speakerY': 2200, 'doorMarkX': 4900, 'doorMarkY': 2040}},
        'routes': [{'id': 'exposed-alley', 'supports': ['shore', 'entry-stairs', 'upper-alley', 'down-stairs', 'lane-yard']},
                   {'id': 'walled-lane', 'supports': ['shore', 'lane-yard']}],
        'enemyAnchors': [], 'status': 'Claude v2 (plan-gated)'}
p.build(ROOT / 'art/act4-claude/stage32', ROOT / 'tools/act4-pilot/layouts/stage32-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/campaign-far/act4-far-harbor.webp'))
