#!/usr/bin/env python3
"""Stage 37 v2 roster: ramp shooters on the diagonals, close guards at the wall foot,
gate vanguard on the third ramp knee, pass gunners; scaffold landings stay contested."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
place(37, '_local/reports/act4-pilot/stage37/claude', {
    'a': [('road-1', 1500, 'hound', 0), ('road-1', 1640, 'guard', 0), ('road-1', 2900, 'close', 0), ('road-1', 3900, 'bow', 0)],
    'b': [('road-2', 3800, 'bow', 0), ('road-2', 4400, 'guard', 1), ('road-2w', 2500, 'bind', 0), ('road-2w', 2100, 'bow', 0), ('r2-crag', 1450, 'close', 0)],
    'c': [('road-3w', 1500, 'bow', 0), ('road-3w', 1900, 'guard', 0), ('road-3', 3100, 'close', 0), ('road-3', 3500, 'bow', 0),
          ('road-3', 4000, 'midboss', 0), ('road-3', 4600, 'arc', 1), ('road-3', 4800, 'bow', 0)],
    'd': [('road-4', 4500, 'bow', 0), ('road-4', 4200, 'guard', 0), ('road-4', 3200, 'bind', 0), ('road-4', 2900, 'close', 0), ('road-4', 1900, 'bow', 0), ('road-4', 1500, 'guard', 1)],
    'e': [('pass', 1300, 'bow', 0), ('pass', 2300, 'guard', 0), ('pass', 2800, 'arc', 0), ('pass', 3900, 'bow', 0), ('pass', 4300, 'lantern', 0),
          ('pass', 5000, 'guard', 1), ('pass', 5300, 'bow', 0), ('pass', 5600, 'close', 0)],
}, active_limit=6)
