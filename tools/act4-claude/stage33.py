#!/usr/bin/env python3
"""Stage 33 · 물 빠진 갯길 — tidal flats.

Kept: frame (7600 wide), spawn bank, two tidal channels with recover water
(west 900-2900, east 3100-5200; tide 2280 -> 2135), exit 7100/1930.
Low route: the channel floors, open at ebb. High route: fishermen's boardwalks
on posts that stay above the flood, a central rock island overlooking both
channels, and the stepped east headland down to the exit.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT

N, W, H = 33, 7600, 3400
p = Painter(N, W, H, seed=33)

LAND = [(0, 2100), (363, 2113), (763, 2096), (882, 2118), (1123, 2202), (1293, 2248), (1781, 2300), (2008, 2277), (2117, 2244),
        (2239, 2227), (2378, 2173), (2524, 2130), (2719, 2094), (2860, 2087), (3132, 2086), (3364, 2145), (3523, 2195),
        (3679, 2230), (3748, 2271), (3895, 2306), (4002, 2324), (4244, 2330), (4691, 2236), (4987, 2193), (5248, 2141),
        (5467, 2102), (5757, 2063), (6137, 2060), (6348, 2022), (6550, 1934), (7011, 1936), (7379, 1931), (7600, 1910)]
p.solid('shore', LAND, [(7600, 3400, 'c'), (0, 3400, 'c')], kind='earth', keep=[(-1, 700), (6500, 7601)],
        role='bank, tidal channels, exit ground',
        extend=[[(-1600, 2110), (40, 2100), (40, 3400), (-1600, 3400)], [(7560, 1910), (9200, 1880), (9200, 3400), (7560, 3400)]])

# Central rock island between the channels: carved steps up from both sides.
p.solid('mid-rock', [(2820, 2090), (2900, 2010), (2930, 1880), (3010, 1790), (3080, 1740), (3200, 1730), (3290, 1790), (3330, 1900), (3380, 2010), (3440, 2140)],
        [(3460, 2260, 'c'), (2800, 2260, 'c')], role='island overlook between the channels', amp=0.5)

# East headland: stepped rock the route climbs over before dropping to the exit.
p.solid('east-head', [(5560, 2088), (5700, 1990), (5730, 1860), (5860, 1760), (5900, 1640), (6040, 1580), (6200, 1600), (6300, 1700),
                      (6330, 1820), (6420, 1900), (6470, 1960)],
        [(6500, 2080, 'c'), (5540, 2160, 'c')], role='headland high ground before the exit', amp=0.6)

# Boardwalks over the flats (posts stand on the channel floors).
p.deck('west-walk', [(900, 2100), (1250, 2010), (1650, 1950), (2250, 1935), (2700, 1950), (2915, 1985)], role='flood-proof walk, west')
p.deck('east-walk', [(3400, 2060), (3800, 1990), (4400, 1985), (5000, 2000), (5590, 2050)], role='flood-proof walk, east')

for c in [('flat-rock-1', 1500, 2276, 130, 110), ('flat-rock-2', 4150, 2329, 120, 100), ('head-boulder', 6000, 1590, 100, 120)]:
    p.cover(*c)
for x in (200, 760, 5300, 6900, 7300):
    p.reeds(x, 6, 84)
p.pine(6150, 220)
p.pine(3140, 180)

base = {'version': 1, 'stage': N, 'intent': 'Tidal flats: channel floors at ebb, boardwalks above the flood, island overlook, headland to the exit.',
        'activePlayBounds': {'left': 180, 'top': 1300, 'right': 7400, 'bottom': 2340}, 'spawn': {'x': 260, 'y': 2100},
        'act4': {'exit': {'x': 7100, 'y': 1930}},
        'routes': [{'id': 'boardwalk', 'supports': ['shore', 'west-walk', 'mid-rock', 'east-walk', 'east-head', 'shore']},
                   {'id': 'channels', 'supports': ['shore', 'mid-rock', 'shore', 'east-head', 'shore']}],
        'enemyAnchors': [], 'status': 'Claude v1 geography'}
p.build(ROOT / 'art/act4-claude/stage33', ROOT / 'tools/act4-pilot/layouts/stage33-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/campaign-far/act4-far-coast.webp'))
