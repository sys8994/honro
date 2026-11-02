"""Fail closed on explicit actual-browser receipts, including late exceptions."""
import json,sys
from pathlib import Path
for arg in sys.argv[1:]:
 p=Path(arg);r=json.loads(p.read_text());assert r.get('passed') is True,(arg,'not passed');assert not r.get('exception') and not r.get('error') and not r.get('errors'),(arg,'exception/error');print('PASS',arg)
assert len(sys.argv)>1,'No receipts supplied'
