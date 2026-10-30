#!/usr/bin/env python3
"""Stage 36 · 쇠가 없는 마을 — ironless village. Original ground kept (houses,
hingeless door the knight pushes, foundations). The quiet central yard stays
open; additions are low: an earthen terrace at the west edge, stone-wall
covers, and the rising eastern ridge as rock."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT, canonical_top, keep_elements
N, W, H = 36, 7200, 3100
p = Painter(N, W, H, seed=36)
p.solid('shore', canonical_top(N), [(W, H, 'c'), (0, H, 'c')], kind='earth', amp=0, role='village ground',
        extend=[[(-1600, 1800), (40, 1795), (40, H), (-1600, H)], [(W - 40, 1800), (W + 1600, 1780), (W + 1600, H), (W - 40, H)]])
p.solid('west-terrace', [(640, 1802), (720, 1740), (860, 1700), (1000, 1712), (1100, 1790), (1160, 1880)], [(1170, 1950, 'c'), (630, 1950, 'c')],
        role='earthen terrace over the village edge', amp=0.4)
p.solid('east-ridge', [(6320, 1830), (6400, 1760), (6520, 1690), (6680, 1680), (6800, 1730), (6900, 1820)], [(6910, 1900, 'c'), (6310, 1900, 'c')],
        role='rock ridge at the far edge', amp=0.4)
for c in [('wall-1', 2000, 1985, 140, 70), ('wall-2', 4100, 2036, 140, 70)]:
    p.cover(*c)
for x in (300, 5600):
    p.bamboo(x, 480, 4)
p.pine(6620, 200)
base = {'version': 1, 'stage': N, 'activePlayBounds': {'left': 180, 'top': 1500, 'right': 7000, 'bottom': 2100}, 'spawn': {'x': 260, 'y': 1800},
        'keepElements': keep_elements(N), 'act4': {},
        'routes': [{'id': 'village', 'supports': ['shore', 'west-terrace', 'shore', 'east-ridge', 'shore']}], 'enemyAnchors': [], 'status': 'Claude v1'}
p.build(ROOT / 'art/act4-claude/stage36', ROOT / 'tools/act4-pilot/layouts/stage36-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/campaign-far/act4-far-inland.webp'))
