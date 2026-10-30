#!/usr/bin/env python3
"""Stage 39 roster: crag shooters, bank rushers, high-walk line, gallery, net blocker, exit guard; wreck boss kept."""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
D = '_local/reports/act4-pilot/stage39/claude'
cells = {
    'c': [('west-crag', 600, 'close', 0), ('west-crag', 760, 'guard', 0), ('west-crag', 870, 'bow', 0), ('west-crag', 1060, 'bow', 0), ('west-crag', 1150, 'bind', 1)],
    'b': [('shore', 1800, 'hound', 0), ('shore', 1900, 'hound', 0), ('shore', 2050, 'close', 0), ('shore', 2160, 'bow', 0)],
    'w': [('shore', 2600, 'guard', 0), ('shore', 2740, 'bow', 0)],
    'h': [('high-walk', 1900, 'bow', 0), ('high-walk', 2250, 'guard', 1), ('high-walk', 2350, 'bow', 0), ('high-walk', 2900, 'bind', 0),
          ('high-walk', 3300, 'arc', 0), ('high-walk', 3420, 'bow', 0), ('high-walk', 3900, 'guard', 0), ('high-walk', 4100, 'bow', 0), ('high-walk', 4300, 'close', 0)],
    'g': [('east-gallery', 4750, 'bow', 0), ('east-gallery', 5000, 'guard', 0), ('east-gallery', 5150, 'bind', 0), ('east-gallery', 5850, 'bow', 0)],
    'n': [('shore', 5600, 'midboss', 0), ('shore', 5750, 'guard', 1), ('shore', 5900, 'close', 0)],
    'e': [('shore', 8150, 'guard', 1), ('shore', 8300, 'bow', 0), ('shore', 8450, 'bow', 0), ('shore', 8650, 'lantern', 0), ('shore', 8800, 'arc', 0)],
}
stage = place(39, D, cells, active_limit=6, relocation=(6050, 'shore'))
# Keep the fixed wreck boss of the original design (bossRequired false).
world = json.loads(Path('shared/data/act4/world.json').read_text())
wreck = next(u for u in next(s for s in world['stages'] if s['metadata']['stageId'] == 39)['units'] if u['id'] == 'a4-wreck')
stage['units'].append(wreck)
stage['design']['vectorWreckAssetId'] = 's39c:korean-wreck'
Path(D + '/roster/stage.json').write_text(json.dumps(stage))
print('wreck kept', wreck['x'], wreck['y'])
