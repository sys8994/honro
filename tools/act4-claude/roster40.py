#!/usr/bin/env python3
"""Stage 40 roster: a short escort threat along the inlet; the closing ground stays open."""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
place(40, '_local/reports/act4-pilot/stage40/claude', {
    'a': [('shore', 2300, 'hound', 0), ('shore', 2600, 'guard', 0), ('shore', 4700, 'bow', 0), ('shore', 5250, 'bow', 0)]}, active_limit=3)
