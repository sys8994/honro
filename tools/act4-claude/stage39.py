#!/usr/bin/env python3
"""Stage 39 · 돌아오는 물 — tidal wreck basin.

Kept frame and event contracts: residents walk 4920-5310 -> safe high ground
6600-8000 (y~1700) without jumping; net 5470, anchor 6130, exit 8500; the
wreck is the fixed boss unit in the basin; tide low 2610 / high 2050 floods the
basin, the timber high walk and the net-drying gallery stay above it.
New: a west crag (first high ground with carved stairs), the basin carved as
real seabed with tide pools, the high walk on a trestle, the gallery on posts.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT

N, W, H = 39, 9000, 4600
p = Painter(N, W, H, seed=39)

# West of 4434: redesigned bank/basin. From 4434 east: the original resident
# lane and safe ground, exact points (residents walk it without jumping).
LAND = [(0, 1800), (420, 1782), (1100, 1770), (1240, 1860), (1380, 1990), (1700, 2003), (1760, 2080), (1940, 2165), (2120, 2330),
        (2420, 2495), (2830, 2575), (3120, 2608), (3400, 2600), (3700, 2527), (3970, 2499), (4070, 2415), (4240, 2272),
        (4434, 2062.6), (4455, 2027.8), (4479, 2007.2), (4500, 2000), (6200, 2000), (6227, 1970.3), (6245, 1950.5),
        (6299, 1925.2), (6326, 1895.5), (6356, 1862.5), (6386, 1829.5), (6428, 1809.4), (6482, 1794.5), (6515, 1767.5),
        (6554, 1728.7), (6581, 1705.6), (6600, 1700), (8000, 1700), (8069, 1674.3), (8153, 1652.8), (8255, 1642.2),
        (8342, 1652), (8423, 1655.8), (8500, 1650), (8594, 1644), (8681, 1648.1), (8759, 1667.8), (8843, 1690.6),
        (8900, 1692.3), (8963, 1680), (9000, 1660)]
p.solid('shore', LAND, [(9000, 4600, 'c'), (0, 4600, 'c')], kind='earth',
        keep=[(-1, 520), (1360, 1720), (4400, 9001)], role='bank, tidal basin floor, resident lane, safe ground',
        extend=[[(-1600, 1820), (40, 1800), (40, 4600), (-1600, 4600)], [(8960, 1660), (10600, 1640), (10600, 4600), (8960, 4600)]])

# West crag: first high ground over the bank, carved steps up from the spawn
# side, a sheer drop to the recovery bank.
p.solid('west-crag', [(470, 1781), (560, 1712), (700, 1640), (720, 1560), (860, 1500), (1020, 1488), (1170, 1540), (1300, 1640), (1330, 1700)],
        [(1350, 1760, 'c'), (1360, 1900), (1340, 2000, 'c'), (460, 2000, 'c'), (450, 1860)],
        role='west high ground', keep=[(640, 1200)], amp=0.5)

# East crag: second high ground beside the safe ground (lookout over the
# lane and the exit path), outside the resident stop positions (<= 7372).
p.solid('east-crag', [(7440, 1699), (7600, 1560), (7650, 1452), (7720, 1424), (7880, 1418), (7940, 1440), (8000, 1520), (8062, 1675)],
        [(8070, 1760, 'c'), (7430, 1760, 'c')], role='east high ground', amp=0.5)

# Rock outcrops in the basin: low cover at ebb, islands at flood.
p.cover('basin-rock-1', 2300, 2440, 140, 120)
p.cover('basin-rock-2', 3960, 2490, 120, 110)
p.cover('gallery-crates', 5650, 1720, 90, 110, kind='crate')

# Timber kept from the tide design: the high walk over the basin, the
# net-drying gallery above the resident lane.
p.deck('high-walk', [(1450, 1925), (2200, 1820), (3400, 1820), (4000, 1870), (4600, 1790)], role='crossing that survives the flood')
p.deck('east-gallery', [(4600, 1790), (5300, 1720), (6000, 1720)], role='net-drying gallery over the resident lane')

for x in (180, 1500, 4600, 6700, 8800):
    p.reeds(x, 6, 80)
p.pine(900, 210)
p.pine(7900, 180)

base = {'version': 1, 'stage': N, 'intent': 'Tidal wreck basin: bank, west crag, flooded basin with the wreck, high walk and gallery that stay dry, resident lane to the safe ground.',
        'activePlayBounds': {'left': 180, 'top': 1250, 'right': 8800, 'bottom': 2620},
        'spawn': {'x': 260, 'y': 1800},
        'keepElements': ['a4-coast:net'],
        'act4': {'exit': {'x': 8500, 'y': 1650}},
        'routes': [{'id': 'high-walk', 'supports': ['shore', 'high-walk', 'east-gallery', 'shore']},
                   {'id': 'basin', 'supports': ['shore', 'west-crag', 'shore', 'east-crag', 'shore']}],
        'enemyAnchors': [],
        'status': 'Claude v1 geography; physics probe required'}
p.build(ROOT / 'art/act4-claude/stage39', ROOT / 'tools/act4-pilot/layouts/stage39-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/campaign-far/act4-far-coast.webp'))
