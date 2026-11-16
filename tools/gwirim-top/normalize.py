"""Normalize native path numbers, retaining the original raw unchanged."""
from pathlib import Path
from lxml import etree as E
import re
p=Path('art/gwirim-top');t=E.parse(str(p/'canopy-raw.svg'))
for n in t.findall('.//{*}path'):
 n.set('d',re.sub(r'[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?',lambda m:format(round(float(m[0]),2),'.2f').rstrip('0').rstrip('.'),n.get('d')))
t.write(str(p/'canopy-normalized.svg'))
