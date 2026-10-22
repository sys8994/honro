"""Use the current act-specific checks; historical reports are immutable."""
import runpy, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tests'))
runpy.run_path(str(ROOT/'tests/bgm-transitions.py'),run_name='__main__')
