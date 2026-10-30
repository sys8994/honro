#!/usr/bin/env python3
"""Stage 34 roster: cave crossing pocket, terrace climb, stairs under the roof, ridge court with the shelf gunner."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
cells = {
    # Cave: g0-1 is the wrongExit walker (enters at the stack, reappears on the roof).
    'g0': [('cave-stack', 3380, 'close', 0), ('cave-stack', 3500, 'bow', 0), ('cave-bridge', 2900, 'guard', 0),
           ('cave-bridge', 3720, 'bow', 0), ('cave-bridge', 3820, 'bind', 0), ('east-ledge', 4150, 'guard', 1),
           ('east-ledge', 4250, 'bow', 0), ('east-ledge', 4510, 'close', 0)],
    # Terraces: hounds rush down the carved steps, shooters hold the upper runs.
    'w': [('west-cliff', 800, 'hound', 0), ('west-cliff', 1080, 'guard', 0), ('west-cliff', 1170, 'hound', 0),
          ('west-cliff', 1390, 'bow', 0), ('west-cliff', 1800, 'bow', 0), ('west-cliff', 2000, 'bind', 0),
          ('west-cliff', 2090, 'guard', 1), ('west-cliff', 2350, 'arc', 0), ('west-cliff', 2440, 'bow', 0)],
    # Stairs under the roof: a narrow climb contested from the ledge and the roof tip.
    's': [('cave-stairs', 3300, 'bow', 0), ('cave-stairs', 3550, 'guard', 0), ('cave-stairs', 3800, 'close', 0), ('cave-stairs', 4040, 'bind', 0)],
    # Ridge: overhang fire down into the cave, the shelf gunner, summit guards.
    'r': [('east-cliff', 3360, 'bow', 0), ('east-cliff', 3450, 'guard', 0), ('east-cliff', 3540, 'bind', 0),
          ('east-cliff', 4300, 'arc', 1), ('east-cliff', 4650, 'bow', 0), ('east-cliff', 4750, 'midboss', 0), ('east-cliff', 4860, 'guard', 0),
          ('east-cliff', 5560, 'close', 0), ('east-cliff', 5660, 'guard', 1), ('east-cliff', 5780, 'bow', 0),
          ('east-cliff', 5900, 'bow', 0), ('east-cliff', 6080, 'lantern', 0)],
}
place(34, '_local/reports/act4-pilot/stage34/claude', cells, active_limit=6, relocation=(5150, 'east-cliff'))
