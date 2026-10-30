#!/usr/bin/env python3
"""Stage 37 · 곶의 뒤편 — v2 (design card: vertical 6200x7400, aspect 0.84).

Plan (spec v0.2 37): mountainside cut face; the main route climbs the old
hauling road's diagonal ramps (masonry retaining walls of irregular height,
switchbacks on abandoned timber stair towers); the alternate goes up through
the broken retaining walls on a timber hoist scaffold (side approach); the
route ends over the bent pass where the sea and the far signal reappear.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT

N, W, H = 37, 6200, 7400
p = Painter(N, W, H, seed=37)

# Valley floor at the foot of the cut face (start).
p.solid('shore', [(0, 7010), (450, 6990), (1300, 6960), (2600, 6930), (3900, 6940), (5200, 6960), (6200, 6990)],
        [(W, H, 'c'), (0, H, 'c')], kind='earth', keep=[(-1, 520)], role='foot of the cut face',
        extend=[[(-1600, 7020), (40, 7010), (40, H), (-1600, H)], [(W - 40, 6990), (W + 1600, 6980), (W + 1600, H), (W - 40, H)]])
# Cliff edges the towers lean on.
p.solid('west-rock', [(0, 2600), (120, 2640), (210, 2760)], [(230, 3400, 'c'), (190, 4300), (226, 5200, 'c'), (200, 6100), (232, 6990, 'c'), (0, 7000, 'c')],
        role='west cliff edge', amp=0)
p.solid('east-rock', [(5720, 3300), (5900, 3180), (6200, 3120)], [(6200, 7000, 'c'), (5760, 6990, 'c'), (5700, 6200), (5740, 5300, 'c'), (5690, 4400), (5730, 3600, 'c')],
        role='east cliff edge', amp=0.4)

# Hauling road: rock terraces with masonry retaining bands; every ramp has its
# own length and pitch, the turns sit at different depths, natural rock knees
# and outcrops break the rhythm, and the walls collapse at staggered places.
p.solid('road-1', [(450, 6990), (1800, 6850), (3200, 6760), (4400, 6620)],
        [(4460, 6660, 'c'), (4470, 6980, 'c'), (450, 6995, 'c')], kind='terrace', role='first ramp (embankment)', amp=0)
T1 = p.stair_tower('turn-1', 4450, 5150, 6620, 5960, start='west', end='west')
p.shelf('road-2', [(4450, 5960), (4050, 5890), (3650, 5820)], [320, 460, 380], kind='terrace', role='second ramp, east of the collapse')
p.shelf('road-2w', [(3000, 5770), (2400, 5735), (1900, 5700)], [420, 300, 360], kind='terrace', role='second ramp, west of the collapse')
p.shelf('r2-crag', [(1200, 5480), (1500, 5560), (1900, 5700)], [260, 420, 380], kind='rock', role='natural rock knee climbing to the second turn', amp=0.5)
T2 = p.stair_tower('turn-2', 600, 1200, 5480, 4900, start='east', end='east')
p.shelf('road-3w', [(1200, 4900), (1750, 4850), (2250, 4810)], [300, 380, 460], kind='terrace', role='third ramp, west of the collapse')
p.shelf('road-3', [(2850, 4770), (3400, 4690), (3900, 4600), (4400, 4520), (4920, 4420)], [460, 380, 320, 480, 360], kind='terrace', role='third ramp, east of the collapse, rising over a rock knee')
T3 = p.stair_tower('turn-3', 4950, 5650, 4420, 3800, start='west', end='west')
p.shelf('road-4', [(4950, 3800), (3700, 3690), (2600, 3560), (900, 3440)], [260, 440, 340, 300], kind='terrace', role='fourth ramp under the pass')
T4 = p.stair_tower('turn-4', 300, 900, 3440, 2870, start='east', end='east')
p.shelf('pass', [(900, 2870), (1800, 2720), (3000, 2570), (4200, 2620), (5200, 2700), (5900, 2760)], [300, 520, 640, 560, 600, 420],
        kind='rock', role='bent pass where the sea reappears', amp=0.6)
p.deck('gap-plank-2', [(3000, 5770), (3650, 5820)], role='planks over the collapsed wall (R2)')
p.deck('gap-plank-3', [(2250, 4810), (2850, 4770)], role='planks over the collapsed wall (R3)')
# Alternate: hoist scaffolds through the two collapses (staggered).
H1 = p.stair_tower('hoist-1', 3000, 3650, 6750, 5800, start='west', role='hoist scaffold through the broken wall (R1->R2)')
H2 = p.stair_tower('hoist-2', 2300, 2800, 5740, 4800, start='west', role='hoist scaffold through the broken wall (R2->R3)')

# Lit cut face behind the roads (the mountainside the road is cut into).
p.backwall([(0, 2750), (900, 2950), (2000, 2820), (3000, 2700), (4200, 2760), (5200, 2840), (5800, 3150), (6200, 3100),
            (6200, 7000), (0, 7000)], seed=37, fid='cut-face', lit=True)

for c in [('crate-r2', 4200, 5915, 90, 110), ('crate-r4', 3300, 3620, 90, 110), ('pass-rock', 3600, 2583, 110, 130), ('knee-rock', 4200, 4549, 100, 120)]:
    p.cover(c[0], c[1], c[2], c[3], c[4], kind='crate' if 'crate' in c[0] else 'boulder')
p.pine(2300, 210)
p.pine(5400, 190)
for x in (150, 3300):
    p.reeds(x, 6, 80)

base = {'version': 2, 'stage': N, 'intent': 'Vertical hauling road: masonry switchback ramps up a cut face, timber stair towers, hoist scaffold through broken walls, bent pass to the exit with the far signal.',
        'activePlayBounds': {'left': 180, 'top': 2300, 'right': 6050, 'bottom': 7050}, 'spawn': {'x': 260, 'y': 7010},
        'keepElements': ['a4-coast:signal'], 'moveElements': {'a4-coast:signal': {'x': 6080, 'y': 2350}},
        'act4': {'exit': {'x': 5750, 'y': 2750}, 'signal': {'x': 6080, 'y': 2350, 'approach': 5750, 'backgroundOnly': True},
                 'coords': {'signalViewX': 4200}},
        'routes': [{'id': 'hauling-road', 'supports': ['shore', 'road-1'] + T1 + ['road-2', 'gap-plank-2', 'road-2w', 'r2-crag'] + T2 + ['road-3w', 'gap-plank-3', 'road-3'] + T3 + ['road-4'] + T4 + ['pass']},
                   {'id': 'hoist', 'supports': ['shore', 'road-1'] + H1 + ['road-2', 'gap-plank-2', 'road-2w'] + H2 + ['road-3w', 'gap-plank-3', 'road-3'] + T3 + ['road-4'] + T4 + ['pass']}],
        'enemyAnchors': [], 'status': 'Claude v2 (plan-gated)'}
p.build(ROOT / 'art/act4-claude/stage37', ROOT / 'tools/act4-pilot/layouts/stage37-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/campaign-far/act4-far-coast.webp'))
