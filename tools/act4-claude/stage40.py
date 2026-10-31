#!/usr/bin/env python3
"""Stage 40 · 바다에서 돌아온 사람들 — v2 within the event contract.

The finale's runtime binds boarding/escort/safe/complete to fixed positions
(boarding deck 2820-3280 @1950, escort start x>2600, high route 5100, safe
5600, complete x>5300), so the walk line of the escort ground is kept (the
four residents walk it without jumping). Changed around it (spec v0.2 40):
the start is a cave mouth out of the underground (rock roof, dark interior,
light opening to the east), the ground is rock with dressed edges, a carved
lookout rises behind the wide look-back ground, and the houses are drawn
hanok. Combat stays lighter than 39.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT, canonical_top, interp
from shapely.geometry import Polygon

N, W, H = 40, 6200, 3200
p = Painter(N, W, H, seed=40)
p.crag = True
TOP = canonical_top(N)
p.solid('shore', TOP, [(W, H, 'c'), (0, H, 'c')], amp=0, role='return ground, inlet and the look-back ground',
        extend=[[(-1600, 1930), (40, 1920), (40, H + 1200), (-1600, H + 1200)], [(W - 40, 1710), (W + 1600, 1690), (W + 1600, H + 1200), (W - 40, H + 1200)],
                [(0, H - 40), (W, H - 40), (W, H + 1200), (0, H + 1200)]])
p.solids['shore']['path'] = True
p.solids['shore']['mason'] = [(2420, 2860, 220, ('#3a4d66', '#475c77', '#566c88'), '#172235'), (5100, 6200, 240, ('#3a4d66', '#475c77', '#566c88'), '#172235')]
# cave mouth: the underground the party walks out of
p.solid('cave-roof', [(0, 1000), (600, 1080), (1150, 1240)],
        [(1180, 1420, 'c'), (1000, 1560), (800, 1600, 'c'), (500, 1640), (200, 1650, 'c'), (0, 1660, 'c')],
        role='cave roof over the start (way out of the underground)', amp=0, extend=[(-1600, 900), (40, 1000), (40, 1660), (-1600, 1700)])
p.rock_mass('STRUCT', Polygon([(-1600, 950), (60, 1040), (180, 1300), (120, 1650), (60, 1930), (-1600, 1940)]).buffer(0), 402, cell=300)
p.backwall([(-1600, 1680), (0, 1650), (400, 1640), (700, 1620), (900, 1600), (1000, 1700), (900, 1920), (0, 1925), (-1600, 1930)], seed=40)
p.deck('high-walk', [(2810, 1790), (3100, 1720), (4200, 1720), (4650, 1780), (5100, 1780)], role='high route over the inlet (original contract)')
# carved lookout behind the look-back ground
p.solid('lookout', [(5720, 1717), (5850, 1620), (5950, 1560), (6100, 1500), (6200, 1495)], [(6200, 1760, 'c'), (5710, 1760, 'c')],
        role='carved lookout over the way home', amp=0, steps=[(5725, 6090)])
p.solids['lookout']['moss'] = False
p.rock_mass('STRUCT', Polygon([(5300, 1760), (5600, 1300), (5900, 1150), (6200, 1100), (6200, 1760)]).buffer(0), 401, cell=320)
p.hanok(5420, 1735, 420, 190, 160, lit=(0, 1), seed=1)
p.hanok(5950, 1580, 300, 150, 120, lit=(1,), seed=2)
p.art_features += ['cave-mouth', 'look-back']
for c in [('landing-rock', 1500, 1859, 110, 110)]:
    p.cover(*c)
for x in (2300, 5000):
    p.reeds(x, 6, 80)
p.pine(6100, 220)
p.pine(1800, 180)

KEEP = ['a4:boat', 'a4:dock', 's40v:abandoned-skiff-s40-blue-dawn-v4', 's40v:pier-40-2810', 's40v:pier-40-3350', 's40v:pier-40-4050',
        's40v:pier-40-4540', 's40v:pier-40-4930']
base = {'version': 2, 'stage': N, 'intent': 'Return: out of the cave mouth, short escort, boat and high-road fork over the inlet, wide look-back ground with a carved lookout.',
        'activePlayBounds': {'left': 60, 'top': 1300, 'right': 6100, 'bottom': 2450}, 'spawn': {'x': 100, 'y': 1920},
        'keepElements': KEEP, 'act4': {'exit': {'x': 5700, 'y': 1710}},
        'routes': [{'id': 'return', 'supports': ['shore', 'high-walk', 'shore']}, {'id': 'lookout', 'supports': ['shore', 'lookout']}],
        'enemyAnchors': [], 'status': 'Claude v2 (contract-bound)'}
p.build(ROOT / 'art/act4-claude/stage40', ROOT / 'tools/act4-pilot/layouts/stage40-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/campaign-far/act4-far-harbor.webp'))
