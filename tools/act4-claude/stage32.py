#!/usr/bin/env python3
"""Stage 32 · 빈 포구 — empty harbour. Original ground kept exactly (houses,
door, dock, skiffs, shelter speaker stand on it). New: a rock knoll over the
lane (shooting perch above the outer fight), a stone embankment (석축) under
the east houses' yard edge, and a headland bluff by the exit; quiet reunion
yard around the door left open."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT, canonical_top, keep_elements
N, W, H = 32, 6600, 3200
p = Painter(N, W, H, seed=32)
p.solid('shore', canonical_top(N), [(W, H, 'c'), (0, H, 'c')], kind='earth', amp=0, role='harbour ground',
        extend=[[(-1600, 1910), (40, 1900), (40, H), (-1600, H)], [(W - 40, 1900), (W + 1600, 1880), (W + 1600, H), (W - 40, H)]])
p.deck('back-alley', [(1200, 2010), (1660, 1760), (2300, 1760), (2600, 2000)], kind='stairs', role='raised back alley (original contract)')
p.solid('exit-bluff', [(6260, 1902), (6330, 1820), (6380, 1730), (6470, 1700), (6596, 1710)], [(6598, 1990, 'c'), (6250, 1990, 'c')],
        role='headland bluff by the exit', amp=0.4)
p.deck('net-loft', [(3560, 1840), (3880, 1840)], role='drying-frame loft over the yard')
for c in [('yard-wall', 4300, 2010, 120, 70)]:
    p.cover(*c)
for x in (150, 2700, 5500):
    p.reeds(x, 6, 80)
p.pine(6480, 190)
base = {'version': 1, 'stage': N, 'activePlayBounds': {'left': 180, 'top': 1600, 'right': 6400, 'bottom': 2100}, 'spawn': {'x': 260, 'y': 1905},
        'keepElements': keep_elements(N), 'act4': {'exit': {'x': 6200, 'y': 1900}},
        'routes': [{'id': 'harbour', 'supports': ['shore', 'back-alley', 'shore', 'net-loft', 'shore']}], 'enemyAnchors': [], 'status': 'Claude v1'}
p.build(ROOT / 'art/act4-claude/stage32', ROOT / 'tools/act4-pilot/layouts/stage32-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/act4-far-harbor.webp'.replace('environment/', 'environment/campaign-far/')))
