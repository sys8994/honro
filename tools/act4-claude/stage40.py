#!/usr/bin/env python3
"""Stage 40 · 돌아가는 배 — the return. Original ground kept exactly (four
residents walk it; boat, dock, piers, houses, inlet water). Restyled earth
and a headland behind the safe point; the closing space stays open."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT, canonical_top, keep_elements
N, W, H = 40, 6200, 3200
p = Painter(N, W, H, seed=40)
p.crag = True
p.solid('shore', canonical_top(N), [(W, H, 'c'), (0, H, 'c')], kind='earth', amp=0, role='return ground and inlet',
        extend=[[(-1600, 1930), (40, 1920), (40, H), (-1600, H)], [(W - 40, 1710), (W + 1600, 1690), (W + 1600, H), (W - 40, H)]])
p.deck('high-walk', [(2810, 1790), (3100, 1720), (4200, 1720), (4650, 1780), (5100, 1780)], role='high route over the inlet (original contract)')
for x in (200, 1200, 2500, 5000):
    p.reeds(x, 6, 80)
p.pine(5900, 200)
p.pine(1500, 170)
base = {'version': 1, 'stage': N, 'activePlayBounds': {'left': 60, 'top': 1500, 'right': 6100, 'bottom': 2450}, 'spawn': {'x': 100, 'y': 1920},
        'keepElements': keep_elements(N), 'act4': {'exit': {'x': 5700, 'y': 1710}},
        'routes': [{'id': 'return', 'supports': ['shore', 'high-walk', 'shore']}], 'enemyAnchors': [], 'status': 'Claude v1'}
p.build(ROOT / 'art/act4-claude/stage40', ROOT / 'tools/act4-pilot/layouts/stage40-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/campaign-far/act4-far-harbor.webp'))
