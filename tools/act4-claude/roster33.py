#!/usr/bin/env python3
"""Stage 33 roster: channel ambushers at ebb, boardwalk shooters, island guard, headland with the tide-line gunner, exit guard."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
cells = {
    'a': [('shore', 1300, 'hound', 0), ('shore', 1400, 'hound', 0), ('shore', 1800, 'guard', 0), ('shore', 1950, 'close', 0), ('shore', 2150, 'bow', 0)],
    'b': [('west-walk', 1350, 'bow', 0), ('west-walk', 1700, 'guard', 0), ('west-walk', 2100, 'bind', 0), ('west-walk', 2300, 'bow', 0), ('west-walk', 2600, 'arc', 1)],
    'c': [('mid-rock', 3050, 'bow', 0), ('mid-rock', 3150, 'guard', 1), ('mid-rock', 3250, 'bow', 0)],
    'd': [('shore', 3900, 'guard', 0), ('shore', 4050, 'close', 0), ('shore', 4300, 'hound', 0), ('shore', 4400, 'hound', 0), ('shore', 4600, 'bow', 0)],
    'e': [('east-walk', 3700, 'bow', 0), ('east-walk', 4000, 'bind', 0), ('east-walk', 4500, 'guard', 0), ('east-walk', 4800, 'bow', 0), ('east-walk', 5200, 'close', 0)],
    'f': [('east-head', 5800, 'arc', 1), ('east-head', 5920, 'bow', 0), ('east-head', 6220, 'midboss', 0), ('east-head', 5700, 'guard', 0), ('east-head', 6420, 'bind', 0)],
    'g': [('shore', 6700, 'guard', 0), ('shore', 6850, 'bow', 0), ('shore', 7000, 'lantern', 0), ('shore', 7200, 'close', 1), ('shore', 7350, 'bow', 0)],
}
place(33, '_local/reports/act4-pilot/stage33/claude', cells, active_limit=6)
