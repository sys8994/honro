#!/usr/bin/env python3
"""Stage 35 · 대숲의 옛길 — old road through the bamboo. Original ground kept
(clearings, ditch, bamboo clumps and thick-bamboo covers with the central shot
contract). New height: a rooted rock rise on the west, a log footbridge over
the ditch (the bypass above it), an east rock shelf over the third clearing,
dense non-colliding bamboo stands behind."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT, canonical_top, keep_elements
N, W, H = 35, 7200, 3100
p = Painter(N, W, H, seed=35)
p.solid('shore', canonical_top(N), [(W, H, 'c'), (0, H, 'c')], kind='earth', amp=0, role='old road ground',
        extend=[[(-1600, 1890), (40, 1886), (40, H), (-1600, H)], [(W - 40, 1800), (W + 1600, 1780), (W + 1600, H), (W - 40, H)]])
p.solid('west-rise', [(560, 1880), (640, 1800), (700, 1700), (820, 1650), (960, 1660), (1040, 1730), (1100, 1790)], [(1110, 1860, 'c'), (550, 1960, 'c')],
        role='rooted rock rise over the first clearing', amp=0.4)
p.solid('east-shelf', [(4180, 1885), (4260, 1800), (4380, 1740), (4560, 1730), (4700, 1770), (4800, 1880)], [(4810, 1970, 'c'), (4170, 1980, 'c')],
        role='rock shelf over the ditch exit', amp=0.4)
p.deck('ditch-bridge', [(1900, 1882), (2300, 1870), (2820, 1900)], role='log bridge over the ditch (bypass above)')
for x in (150, 1300, 2500, 3500, 5000, 6000, 6900):
    p.bamboo(x, 560, 5)
base = {'version': 1, 'stage': N, 'activePlayBounds': {'left': 180, 'top': 1300, 'right': 7000, 'bottom': 2100}, 'spawn': {'x': 260, 'y': 1880},
        'keepElements': [a for a in keep_elements(N) if 'bamboo-foreground' not in a], 'act4': {},
        'routes': [{'id': 'road', 'supports': ['shore', 'west-rise', 'shore', 'ditch-bridge', 'shore', 'east-shelf', 'shore']}], 'enemyAnchors': [], 'status': 'Claude v1'}
p.build(ROOT / 'art/act4-claude/stage35', ROOT / 'tools/act4-pilot/layouts/stage35-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/campaign-far/act4-far-bamboo.webp'))
