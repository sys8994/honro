"""Compatibility entry point: the shared Node builder is the only bundler."""
from pathlib import Path
import subprocess
subprocess.run(['node',str(Path(__file__).with_name('build.mjs'))],check=True)
