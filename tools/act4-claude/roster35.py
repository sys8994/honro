#!/usr/bin/env python3
"""Stage 35 roster: clearing pockets, ditch and bridge, shelf shooters, flank commander in the middle clearing."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
place(35, '_local/reports/act4-pilot/stage35/claude', {
    'a': [('west-rise', 760, 'bow', 0), ('west-rise', 880, 'bow', 0), ('west-rise', 980, 'guard', 0), ('shore', 1250, 'guard', 0), ('shore', 1350, 'hound', 0), ('shore', 1500, 'bow', 0), ('shore', 1650, 'close', 0)],
    'b': [('shore', 2200, 'hound', 0), ('shore', 2300, 'hound', 0), ('shore', 2500, 'close', 0), ('ditch-bridge', 2100, 'bow', 0), ('ditch-bridge', 2400, 'bind', 0), ('ditch-bridge', 2650, 'guard', 0)],
    'c': [('shore', 3300, 'guard', 1), ('shore', 3500, 'midboss', 0), ('shore', 3620, 'bow', 0), ('shore', 3760, 'bind', 0), ('shore', 3880, 'arc', 0)],
    'd': [('east-shelf', 4380, 'bow', 0), ('east-shelf', 4500, 'bow', 0), ('east-shelf', 4620, 'guard', 1), ('shore', 5050, 'hound', 0)],
    'e': [('shore', 5400, 'guard', 0), ('shore', 5550, 'bow', 0), ('shore', 5700, 'close', 0), ('shore', 5820, 'bind', 0)],
    'f': [('shore', 6300, 'guard', 1), ('shore', 6500, 'bow', 0), ('shore', 6700, 'lantern', 0), ('shore', 6900, 'bow', 0)]}, active_limit=6)
