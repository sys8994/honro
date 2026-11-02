#!/usr/bin/env python3
"""Lightweight immutable-byte and unchanged-pixel-contract regression (no rerender)."""
from pathlib import Path
import gzip,hashlib,json,xml.etree.ElementTree as E
root=Path(__file__).resolve().parents[2]/'art/act2-near-vector-candidates/stage13-hidden-gate-v1'
r=json.loads((root/'pack-report.json').read_text());raw=authored=final=0
for p in r['parts']:
 d=root/p['part'];a=gzip.decompress((d/'immutable-inkscape-raw.svg.gz').read_bytes());b=gzip.decompress((d/'immutable-authored-raw.svg.gz').read_bytes());c=(d/'final.svg').read_bytes();raw+=len(a);authored+=len(b);final+=len(c)
 for data,key,size in [(a,'rawSha256','immutableInkscapeBytes'),(b,'authoredRawSha256','authoredRawBytes'),(c,'finalSha256','finalSvgBytes')]:assert hashlib.sha256(data).hexdigest()==p[key] and len(data)==p[size],p['part']
 assert not any(e.tag.split('}')[-1]=='image' for e in E.fromstring(c).iter())
 q=json.loads((d/'comparison.json').read_text());assert q['qualityPass'] and set(q['errors'])=={'1','2'} and all(v['pass'] for v in q['errors'].values())
 assert q['config']['scales']==[1,2] and q['config']['width']==2048
 assert q['config']['limits']=={'rgbMAE255':.8,'silhouettePx':1.5,'protectedRgbMAE255':1,'protectedPx':.5,'protectedChangedPixelFraction':.05}
 assert q['config'].get('protectedRgbQuantizationTolerance255',0) in (0,1)
 # The tested native-composed final contains the exact selected SVG children.
 tested=E.fromstring(gzip.decompress((d/'metric-final.svg.gz').read_bytes()));actual=E.fromstring(c);holder=list(list(tested)[1])[0]
 expected=list(actual);embedded=list(holder)[-len(expected):]
 assert [E.tostring(e)for e in expected]==[E.tostring(e)for e in embedded],p['part']
assert (raw,authored,final)==(r['immutableRawPackBytes'],r['authoredRawPackBytes'],r['finalSvgPackBytes'])
assert final<=raw*.7 and final<=authored*.7
proof=json.loads((root/'lossless-proof.json').read_text());assert proof['pass'] and len(proof['checks'])==28 and all(x['bitIdentical']for x in proof['checks'])
native=json.loads((root/'lossless-native-proof.json').read_text());assert native['pass'] and len(native['checks'])==13 and all(x['bitIdentical']for x in native['checks'])
print(json.dumps({'pass':True,'parts':len(r['parts']),'immutableRawBytes':raw,'authoredRawBytes':authored,'finalBytes':final,'reductionVsImmutablePercent':100*(1-final/raw),'reductionVsAuthoredPercent':100*(1-final/authored)}))
