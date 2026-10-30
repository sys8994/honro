#!/usr/bin/env python3
"""Stage 37 · 곶의 뒤편 — behind the headland. Original ground kept (haul
footings, winches, workshop frame, signal). Original hauling ramp (timber) and
broken retaining wall (stone) kept as supported decks. New: a rock crag on the
west slope and the upper cape over the approach to the exit."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT, canonical_top, keep_elements
N, W, H = 37, 7800, 4300
p = Painter(N, W, H, seed=37)
p.solid('shore', canonical_top(N), [(W, H, 'c'), (0, H, 'c')], kind='earth', amp=0, role='hauling slope ground',
        extend=[[(-1600, 3210), (40, 3200), (40, H), (-1600, H)], [(W - 40, 2200), (W + 1600, 2180), (W + 1600, H), (W - 40, H)]])
p.solid('west-crag', [(1150, 3000), (1230, 2920), (1300, 2820), (1420, 2770), (1560, 2790), (1660, 2880), (1740, 3005)], [(1750, 3080, 'c'), (1140, 3080, 'c')],
        role='rock crag on the lower slope', amp=0.4)
p.solid('upper-cape', [(6420, 2297), (6500, 2200), (6560, 2090), (6700, 2020), (6860, 2030), (6960, 2120), (7040, 2200)], [(7060, 2290, 'c'), (6410, 2390, 'c')],
        role='upper cape over the exit approach', amp=0.4)
p.deck('haul-ramp', [(1800, 3000), (2200, 2620), (3000, 2620), (3400, 2500)], role='hauling ramp (original contract)')
p.deck('broken-wall', [(5100, 2220), (5450, 2120), (6000, 2120)], kind='stone', role='broken retaining wall top (original contract)')
for x in (300, 4300, 7600):
    p.reeds(x, 6, 80)
p.pine(6720, 220)
base = {'version': 1, 'stage': N, 'activePlayBounds': {'left': 180, 'top': 1700, 'right': 7600, 'bottom': 3250}, 'spawn': {'x': 260, 'y': 3197},
        'keepElements': keep_elements(N), 'act4': {'exit': {'x': 7300, 'y': 2200}},
        'routes': [{'id': 'haul', 'supports': ['shore', 'west-crag', 'shore', 'haul-ramp', 'shore', 'broken-wall', 'shore', 'upper-cape', 'shore']}], 'enemyAnchors': [], 'status': 'Claude v1'}
p.build(ROOT / 'art/act4-claude/stage37', ROOT / 'tools/act4-pilot/layouts/stage37-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/campaign-far/act4-far-coast.webp'))
