#!/usr/bin/env python3
"""Stage 35 · 대숲의 옛길 — v2 (design card: vertical 5800x6900, aspect 0.84).

Plan (spec v0.2 35 + criteria v3 vertical): an old stone road climbs a bamboo
hillside away from the sea. Entry valley -> carved entry stairs -> wide low
clearing (1) -> main stone flight -> slanted clearing (2) over the ditch ->
west crag bamboo ledge -> carved cliff stair -> clearing (3) under the ruined
stone wall (exit). Low detour (1->2): down-steps into the ditch, under the
arch of (2), up the rubble gully and a fallen bamboo onto (2). Side-gap detour
(2->3): old timber flights in the cleft through the rock of (3).
Three clearings differ in width, height and cover. Thin bamboo is
non-colliding dressing; stone wall stubs are the real covers.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT
from shapely.geometry import Polygon

N, W, H = 35, 5800, 6900
p = Painter(N, W, H, seed=35)
p.depth = (2700, 6700)
p.crag = True

# ---- bottom-left: entry valley, carved entry stairs, clearing 1
p.solid('shore', [(0, 6670), (400, 6655), (700, 6670)], [(700, H, 'c'), (0, H, 'c')], kind='earth', amp=0, role='entry valley',
        extend=[(-1600, 6690), (40, 6670), (40, H + 1800), (-1600, H + 1800)])
p.solid('entry-stairs', [(700, 6670), (950, 6460), (1200, 6250)], [(1200, H, 'c'), (700, H, 'c')], amp=0,
        role='curved entry stairs', steps=[(710, 1190)], moss=False)
p.solid('clear-1', [(1200, 6250), (1700, 6225), (2200, 6240), (2600, 6210)], [(2600, H, 'c'), (1200, H, 'c')], amp=0,
        role='clearing 1: low and wide')
# ---- low detour: down-steps into the ditch under clearing 2, rubble gully, fallen bamboo
p.solid('ditch', [(2600, 6210), (2800, 6340), (3000, 6470), (3500, 6520), (4000, 6540), (4300, 6530)], [(4300, H, 'c'), (2600, H, 'c')],
        kind='earth', amp=0, role='down-steps and the deep ditch (low detour)', steps=[(2610, 2990)])
p.solid('gully', [(4300, 6530), (4550, 6260), (4750, 5960), (4900, 5700), (5000, 5600)], [(5050, H, 'c'), (4300, H, 'c')], amp=0,
        role='rubble gully climbing out of the ditch')
p.deck('fallen-bamboo', [(4280, 4975), (4950, 5648)], kind='log', role='fallen bamboo from the gully onto clearing 2')
# ---- middle: clearing 2 (slanted, over the ditch), knoll, main flights
p.shelf('clear-2', [(2600, 5000), (3200, 4985), (3800, 4940), (4300, 4970)], [380, 520, 560, 360], kind='rock',
        role='clearing 2: slanted, beside the ditch')
p.solid('knoll', [(3350, 4990), (3450, 4930), (3560, 4910), (3660, 4950), (3720, 4972)], [(3730, 5040, 'c'), (3340, 5040, 'c')], amp=0.3,
        role='rock knoll on clearing 2 (height and cover)')
p.deck('flight-1', [(1250, 6249), (2600, 5000)], kind='stonestair', role='main stone flight (1->2)')
p.deck('flight-2', [(2450, 3810), (3650, 4945)], kind='stonestair', role='stone flight up to the crag landing')
p.shelf('crag', [(1900, 3800), (2200, 3785), (2500, 3810)], [380, 460, 340], kind='rock', role='crag landing with the bamboo grove')
p.deck('flight-3', [(2000, 3795), (3000, 2760)], kind='stonestair', role='stone flight onto clearing 3')
# ---- top-right: clearing 3 (west + east under the ruined wall), side-cleft detour
p.shelf('clear-3a', [(3000, 2760), (3500, 2745), (3950, 2770)], [420, 520, 480], kind='rock', role='clearing 3 west: arrival')
CF = p.stair_tower('cleft', 3990, 4440, 4955, 2775, start='west', end='east', role='old timber flights in the side cleft (detour 2->3)', pitch=0.7)
p.deck('cleft-bamboo', [(3930, 2768), (4460, 2778)], kind='log', role='fallen bamboo over the cleft')
p.solid('clear-3b', [(4440, 2775), (4900, 2760), (5400, 2740), (5800, 2750)],
        [(5800, H, 'c'), (5100, H, 'c'), (5100, 5500), (4750, 4300), (4470, 3300, 'c')], role='clearing 3 east: under the ruined wall',
        amp=0, extend=[[(5760, 2750), (7400, 2730), (7400, H + 1800), (5760, H + 1800)], [(0, H - 40), (5800, H - 40), (5800, H + 1800), (0, H + 1800)]])

for k in ('clear-1', 'clear-2', 'clear-3a', 'clear-3b'):
    p.solids[k]['path'] = True

# ---- depth: rock bodies rooted down to the level below (behind actors)
p.hang_body('clear-3a', 1300, 351, to='clear-2')
p.hang_body('crag', 900, 352, to='clear-1')
# dark side cleft behind the timber detour
p.add('STRUCT', 'M3930 2800 L4000 3400 L3960 4100 L4060 4980 L4420 4985 L4520 4300 L4470 3300 L4460 2790 Z', '#0d1830')
p.buttress('flight-1', seed=361)
p.buttress('flight-2', seed=362)
p.buttress('flight-3', depth=420, seed=363)
p.hang_body('clear-2', 1300, 353, to='ditch', arch=(2950, 4250, 6520, 520))
p.art_features.append('hillside')
# ruined stone walls (behind actors): pillars on clearing 1, wall line on 3a, the big wall over 3b
def ruin(pts, y_ref):
    p._masonry_into('STRUCT', Polygon(pts).buffer(0), y_ref=y_ref, scale=.55, tones=('#748886', '#8a9b98', '#a2b1ac'), mortar='#3e5157')
ruin([(1290, 6250), (1290, 5950), (1345, 5925), (1400, 5950), (1400, 6250)], 6250)
ruin([(1420, 6250), (1420, 6090), (1620, 6070), (1720, 6100), (1780, 6160), (1810, 6235)], 6250)
ruin([(4950, 2765), (4950, 2240), (5100, 2180), (5140, 2300), (5270, 2260), (5310, 2100), (5450, 2010), (5490, 2160), (5600, 2240), (5600, 2750)], 2750)
ruin([(3150, 2760), (3150, 2620), (3270, 2600), (3310, 2680), (3460, 2690), (3500, 2750)], 2750)

# real cover: wall stubs (돌담) and boulders
for c in [('wall-c1', 2050, 6235, 120, 110, 'wall'), ('wall-c2', 2950, 4992, 130, 120, 'wall'), ('wall-c3', 5150, 2750, 140, 120, 'wall'),
          ('rock-crag', 2150, 3786, 100, 110, 'boulder'), ('rock-c3a', 3650, 2752, 110, 120, 'boulder')]:
    p.cover(*c)

# traced bamboo dressing (non-colliding): groves behind, clumps at clearing edges
for name, x, y, h, flip in [('bamboo-grove', 2180, 3790, 1150, False), ('bamboo-clump', 2450, 6225, 620, False), ('bamboo-clump', 450, 6660, 640, True),
                            ('bamboo-grove', 3550, 2750, 900, True), ('bamboo-top', 4700, 2770, 560, False), ('bamboo-clump', 4150, 4965, 560, True),
                            ('bamboo-top', 5700, 2750, 520, True), ('bamboo-clump', 3300, 6510, 600, False), ('bamboo-clump', 1900, 6230, 520, True)]:
    p.decor(name, x, y, h, layer='REAR', flip=flip)
for name, x, y, h, flip in [('fern', 950, 6560, 170, False), ('fern', 2900, 6440, 150, True), ('fern', 1950, 3800, 150, False), ('fern', 4950, 5600, 150, True)]:
    p.decor(name, x, y, h, layer='FORE', flip=flip)

base = {'version': 2, 'stage': N, 'intent': 'Vertical bamboo hillside: old stone road through three clearings of different width and height; low ditch detour and side-cleft detour; ruined wall over the top clearing and exit.',
        'activePlayBounds': {'left': 180, 'top': 2100, 'right': 5700, 'bottom': 6800}, 'spawn': {'x': 300, 'y': 6660},
        'envGroupY': {'a4-35-rear': 6950, 'landscape-L4': 6700},
        'act4': {'exit': {'x': 5600, 'y': 2740},
                 'coords': {'entryViewX': 700, 'entryViewY': 6400, 'flaskX1': 1950, 'flaskX2': 2450, 'flaskYMax': 3900,
                            'clearingX1': 4700, 'clearingX2': 5050, 'clearingYMax': 3300, 'clearingFoeX': 4400, 'clearingFoeYMax': 3400,
                            'completeX': 5300, 'completeYMax': 3300}},
        'routes': [{'id': 'old-road', 'supports': ['shore', 'entry-stairs', 'clear-1', 'flight-1', 'clear-2', 'flight-2', 'crag', 'flight-3', 'clear-3a', 'cleft-bamboo', 'clear-3b']},
                   {'id': 'ditch-and-cleft', 'supports': ['shore', 'entry-stairs', 'clear-1', 'ditch', 'gully', 'fallen-bamboo', 'clear-2'] + CF + ['clear-3b']}],
        'enemyAnchors': [], 'status': 'Claude v2 (plan-gated)'}
p.build(ROOT / 'art/act4-claude/stage35', ROOT / 'tools/act4-pilot/layouts/stage35-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/campaign-far/act4-far-bamboo.webp'))
