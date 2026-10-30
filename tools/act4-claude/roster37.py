#!/usr/bin/env python3
"""Stage 37 roster: crag shooters, ramp and under-ramp pockets, wall-gate vanguard on the broken wall, cape gunners."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
place(37, '_local/reports/act4-pilot/stage37/claude', {
    'a': [('shore', 500, 'hound', 0), ('shore', 700, 'guard', 0), ('shore', 850, 'close', 0), ('west-crag', 1420, 'bow', 0), ('west-crag', 1520, 'bow', 0), ('west-crag', 1620, 'guard', 1)],
    'b': [('haul-ramp', 2300, 'bow', 0), ('haul-ramp', 2450, 'guard', 0), ('haul-ramp', 2620, 'close', 0), ('haul-ramp', 3100, 'bind', 0), ('haul-ramp', 3250, 'bow', 0),
          ('shore', 2350, 'hound', 0), ('shore', 2600, 'close', 0), ('shore', 2950, 'guard', 0)],
    'c': [('shore', 3500, 'bind', 0), ('shore', 3600, 'bow', 0), ('shore', 3800, 'guard', 0), ('shore', 4100, 'arc', 1), ('shore', 4300, 'bow', 0), ('shore', 4500, 'close', 0), ('shore', 4700, 'hound', 0)],
    'd': [('broken-wall', 5350, 'midboss', 0), ('broken-wall', 5500, 'bow', 0), ('broken-wall', 5800, 'guard', 0), ('broken-wall', 5950, 'bow', 0),
          ('shore', 5300, 'hound', 0), ('shore', 5600, 'close', 0), ('shore', 6050, 'guard', 0)],
    'e': [('upper-cape', 6600, 'bow', 0), ('upper-cape', 6750, 'guard', 1), ('upper-cape', 6900, 'bow', 0)],
    'f': [('shore', 7200, 'guard', 1), ('shore', 7450, 'lantern', 0), ('shore', 7650, 'bow', 0)]}, active_limit=6)
