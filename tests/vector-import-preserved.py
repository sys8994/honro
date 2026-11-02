"""Authoring adapter must preserve one fill and the runtime's existing limits."""
import importlib.util
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'tools/vector-production/import-svg.py';s=importlib.util.spec_from_file_location('importer',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
# Multiple overlapping contours and a hole retain the exact authored order/text.
unit='M0,0h100v100h-100z M20,20v60h60v-60z '
d=unit*1900;assert 60000<len(d)<240000
r=m.preserve_compound(d);assert ''.join(r['dParts'])==d;assert all(len(x)<=60000 for x in r['dParts']);assert len(r['dParts'])<=32
assert m.preserve_compound(unit)=={'d':unit}
for bad in ['M0 0h1z '+' '*240000,'M0 0L1 1<script>','M0 0Lnan 1','M0 0'+('l1,0 '*13000)+'z']:
 try:m.preserve_compound(bad)
 except (SystemExit,ValueError):pass
 else:raise AssertionError('Invalid/oversize path accepted')
print('PASS exact fill/contour order; existing per-part/total/syntax limits retained')
