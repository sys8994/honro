#!/usr/bin/env python3
"""Stage 38 · 어긋난 해식굴 — misjoined sea cave.

Kept: frame (7200x4400), cave floor and ragged ceiling, the emergency ledges
(normal physical path), connection entry 3180 / destination 4520 / return 2980,
resident lane 4300-5700 and exit 6700/2400.
New: two climbable rock mounds on the cave floor (height and cover), an east
overhang bluff rooted at the map edge that shelters the lane and forms the
upper route, reached by timber stairs from the lane.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT

N, W, H = 38, 7200, 4400
p = Painter(N, W, H, seed=38)

FLOOR = [(0, 2800), (242, 2791), (508, 2820), (716, 2805), (1046, 2798), (1218, 2815), (1392, 2789), (1618, 2795), (1800, 2800),
         (1900, 2840), (2082, 2914), (2196, 2988), (2260, 3000), (2350, 3050), (3300, 3050)]
p.solid('shore', FLOOR, [(3300, 4400, 'c'), (0, 4400, 'c')], kind='earth', keep=[(-1, 700), (3100, 3301)], role='cave floor',
        extend=[(-1600, 2820), (40, 2800), (40, 4400), (-1600, 4400)])
CEIL = [(3300, 2200), (3236, 2211), (3172, 2197), (3120, 2200), (3080, 2128), (3020, 2155), (2922, 2156), (2850, 2124), (2810, 2090),
        (2752, 2056), (2700, 2094), (2624, 2118), (2500, 2082), (2458, 2055), (2426, 1999), (2400, 1991), (2306, 1987), (2234, 1957),
        (2156, 1977), (2124, 1975), (2056, 2034), (1964, 2032), (1906, 2056), (1862, 2051), (1810, 1981), (1758, 1954), (1732, 1921),
        (1674, 1959), (1562, 1978), (1504, 2023), (1384, 2026), (1298, 2005), (1270, 2006), (1150, 2071), (1098, 2029), (1024, 2013),
        (974, 1981), (932, 1968), (886, 1990), (842, 2020), (772, 2012), (700, 2044), (618, 2041), (540, 2002), (462, 1978), (402, 2019),
        (308, 1992), (238, 1987), (176, 2004), (150, 2051), (76, 2092), (0, 2100)]
p.solid('cave-roof', [(0, 600), (1450, 820), (2860, 600), (3150, 1500), (3300, 2190)], CEIL, role='cave roof / headland above', amp=0,
        extend=[(-1600, 560), (40, 600), (40, 2120), (-1600, 2860)])
# Interior back wall between the ragged ceiling and the floor (behind actors).
p.backwall([(x, y - 10) for x, y in reversed(CEIL)] + [(3240, 2240), (3260, 3060)] + [(x, y + 20) for x, y in reversed(FLOOR)] + [(-1600, 2860), (-1600, 2100)], seed=38)
p.solid('ledges', [(3200, 3050), (3440, 3230), (3670, 3210), (3800, 3140), (4060, 2940), (4290, 2790)],
        [(4320, 2820, 'c'), (4320, 4400, 'c'), (3200, 4400, 'c')], role='emergency ledges (normal physical path)', amp=0)
p.solid('east', [(4300, 2652), (4400, 2620), (4480, 2602), (4520, 2600), (5700, 2600), (6200, 2400), (7200, 2400)], [(7200, 4400, 'c'), (4300, 4400, 'c')], kind='earth', amp=0,
        role='resident lane and exit', extend=[(7160, 2400), (8800, 2380), (8800, 4400), (7160, 4400)])
# Cave-floor mounds: climbable rock humps for height and cover inside the cave.
p.solid('mound-west', [(820, 2805), (940, 2700), (1040, 2640), (1140, 2650), (1240, 2720), (1330, 2795)],
        [(1340, 2880, 'c'), (810, 2880, 'c')], role='cave-floor mound', amp=0.4)
p.solid('mound-east', [(1820, 2810), (1940, 2770), (2040, 2740), (2140, 2770), (2230, 2870), (2290, 2990)],
        [(2310, 3110, 'c'), (1810, 3110, 'c')], role='cave-floor mound', amp=0.4)
# East bluff: rooted at the map edge, overhangs the lane (headroom kept for
# residents and party), its top is the upper route down to the exit.
p.solid('east-bluff', [(5000, 2160), (5400, 2100), (5900, 2040), (6400, 1980), (6900, 1930), (7190, 1905)],
        [(7196, 2440, 'c'), (6910, 2440, 'c'), (6880, 2250), (6500, 2232, 'c'), (6200, 2262), (5900, 2322, 'c'), (5500, 2382),
         (5150, 2384, 'c'), (5030, 2262)], role='overhang shelter and upper route', amp=0.6)
p.deck('bluff-stairs', [(4560, 2598), (5010, 2160)], kind='stairs', role='lane up to the bluff')

for c in [('cave-rock', 1560, 2795, 110, 120), ('bluff-boulder', 6100, 2010, 100, 120)]:
    p.cover(*c)
p.pine(6600, 200)
for x in (4400, 6000):
    p.reeds(x, 6, 80)

base = {'version': 1, 'stage': N, 'intent': 'Misjoined sea cave: ragged cave with mounds, ledges past the low water, sheltered resident lane under an overhang bluff, upper route to the exit.',
        'activePlayBounds': {'left': 180, 'top': 1800, 'right': 7000, 'bottom': 3300}, 'spawn': {'x': 260, 'y': 2800},
        'act4': {'exit': {'x': 6700, 'y': 2400}},
        'routes': [{'id': 'cave-lane', 'supports': ['shore', 'mound-west', 'shore', 'mound-east', 'shore', 'ledges', 'east']},
                   {'id': 'bluff', 'supports': ['east', 'bluff-stairs', 'east-bluff']}],
        'enemyAnchors': [], 'status': 'Claude v1 geography'}
p.build(ROOT / 'art/act4-claude/stage38', ROOT / 'tools/act4-pilot/layouts/stage38-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/campaign-far/act4-far-coast.webp'))
