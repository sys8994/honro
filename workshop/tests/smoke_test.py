"""Compatibility entry point for shared-runtime acceptance tests."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[2]
subprocess.run([sys.executable,"-X","utf8",str(root/"tests"/"integration.py")],cwd=root,check=True)
