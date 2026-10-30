#!/usr/bin/env python3
"""Stage 36 roster: a few outskirts threats; the village centre stays silent."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
place(36, '_local/reports/act4-pilot/stage36/claude', {
    'w': [('west-terrace', 860, 'bow', 0), ('west-terrace', 990, 'guard', 0)],
    'e': [('east-ridge', 6500, 'bow', 0), ('east-ridge', 6700, 'guard', 1), ('east-ridge', 6840, 'close', 0)]}, active_limit=2)
