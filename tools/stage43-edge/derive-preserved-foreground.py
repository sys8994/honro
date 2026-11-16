#!/usr/bin/env python3
"""Derive original foreground by changing only mainA alpha. Not art approval.

The native mask was assembled from reference-reviewed masonry/tree perimeters
and whole original stone contours. Hidden/occluded masonry is not reconstructed.
Outputs are authoring sourcePath vectors, not compiled runtime paths.
"""
from pathlib import Path
from lxml import etree as E
import argparse, hashlib, json
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
repo=Path(__file__).resolve().parents[2];src=repo/'art/stage43-edge';ns='{http://www.w3.org/2000/svg}'
assert hashlib.sha256((src/'source.svg').read_bytes()).hexdigest()=='d024022a56991bc56e6d507698a6683c11d47915984dfcf2ca02b936c1d927b4'
mask=E.parse(str(src/'foreground-preservation-mask.svg'));paths=mask.findall('.//'+ns+'path');assert paths and all(not e.get('transform') for e in paths)
ad=' '.join(e.get('d') for e in paths);assert len(ad)<=60000
svg=E.parse(str(src/'source.svg'));svg.find('.//'+ns+'clipPath[@id="a"]/'+ns+'path').set('d',ad)
vector=json.loads((src/'source.json').read_text());original=vector['clips']['b'];vector['clips']['a']=[ad];assert vector['clips']['b']==original
a.output.mkdir(parents=True,exist_ok=True);svg.write(str(a.output/'foreground.svg'));(a.output/'foreground-vector.json').write_text(json.dumps(vector,separators=(',',':'))+'\n')
print(json.dumps({'sourceUnchanged':True,'changedField':'clips.a only','clipCharacters':len(ad),'status':'unapproved isolated foreground study'}))
