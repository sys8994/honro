#!/usr/bin/env python3
"""Stage 38 roster: cave pockets, ledge holders, bluff gunners with the cave-mouth screen; original pursuers kept."""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
D = '_local/reports/act4-pilot/stage38/claude'
cells = {
    'a': [('shore', 700, 'hound', 0), ('mound-west', 960, 'guard', 0), ('mound-west', 1060, 'bow', 0), ('mound-west', 1180, 'bow', 0), ('shore', 1450, 'close', 0), ('shore', 1750, 'bind', 0)],
    'b': [('mound-east', 1950, 'bow', 0), ('mound-east', 2050, 'guard', 1), ('mound-east', 2150, 'bind', 0), ('shore', 2500, 'hound', 0), ('shore', 2700, 'close', 0), ('shore', 2900, 'guard', 0), ('shore', 3150, 'bow', 0)],
    'c': [('ledges', 3450, 'hound', 0), ('ledges', 3560, 'bow', 0), ('ledges', 3750, 'guard', 0), ('ledges', 3950, 'bow', 0), ('ledges', 4150, 'close', 0)],
    'd': [('east', 5450, 'guard', 0), ('east', 5550, 'bow', 0)],
    'e': [('east-bluff', 5500, 'midboss', 0), ('east-bluff', 5700, 'bow', 0), ('east-bluff', 5800, 'guard', 0), ('east-bluff', 6300, 'arc', 1), ('east-bluff', 6500, 'bow', 0), ('east-bluff', 6650, 'close', 0), ('east-bluff', 6800, 'bind', 0), ('east-bluff', 7000, 'lantern', 0)],
    'f': [('bluff-stairs', 4800, 'bow', 0)],
}
stage = place(38, D, cells, active_limit=6)
world = json.loads(Path('shared/data/act4/world.json').read_text())
orig = next(s for s in world['stages'] if s['metadata']['stageId'] == 38)
for u in orig['units']:
    if (u.get('stageOverrides') or {}).get('honroAct4Pursuer'):
        stage['units'].append(u)
Path(D + '/roster/stage.json').write_text(json.dumps(stage))
print('pursuers kept')
