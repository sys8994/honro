#!/usr/bin/env python3
"""Lossless SVG number grammar: a second decimal point starts the next number.
No number value, command, path topology, palette, or XML ID is changed.
Always require exact 1x/2x RGBA and native-render equality before adoption.
"""
import sys,re,xml.etree.ElementTree as E
from pathlib import Path
E.register_namespace('','http://www.w3.org/2000/svg')
a,b=map(Path,sys.argv[1:3]);t=E.parse(a)
for e in t.getroot().iter():
 if e.tag.endswith('path') and e.get('d'):e.set('d',re.sub(r'(\d*\.\d+) (?=\.\d)',r'\1',e.get('d')))
t.write(b,encoding='utf-8',xml_declaration=True)
print(f'{a.name}: {a.stat().st_size} -> {b.stat().st_size}')
