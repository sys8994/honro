"""Compatibility entry point for the current chapter soundtrack browser checks."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('bgm-transitions.py')), run_name='__main__')
