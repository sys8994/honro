from pathlib import Path
import json,gzip,hashlib,xml.etree.ElementTree as E
r=Path(__file__).resolve().parents[2]/'art/act2-near-vector-candidates/stage16-temple-v1';p=json.load(open(r/'pack-report.json'))
for q in p['parts']:
 d=r/q['part']
 for f,key in [('immutable-inkscape-raw.svg.gz','rawSha256'),('immutable-authored-raw.svg.gz','authoredRawSha256'),('final.svg','finalSha256')]:
  b=(d/f).read_bytes();b=gzip.decompress(b)if f.endswith('.gz')else b;assert hashlib.sha256(b).hexdigest()==q[key]
 tested=E.fromstring(gzip.decompress((d/'metric-final.svg.gz').read_bytes()));actual=E.fromstring((d/'final.svg').read_bytes());holder=list(list(tested)[1])[0];children=list(actual);assert [E.tostring(e)for e in list(holder)[-len(children):]]==[E.tostring(e)for e in children]
 c=json.load(open(d/'comparison.json'));assert c['qualityPass']and set(c['errors'])=={'1','2'}and all(v['pass']for v in c['errors'].values());assert c['config']['width']==2048 and c['config']['scales']==[1,2];assert c['config']['limits']=={'rgbMAE255':.8,'silhouettePx':1.5,'protectedRgbMAE255':1,'protectedPx':.5,'protectedChangedPixelFraction':.05};assert not any(e.tag.endswith('image')for e in E.fromstring((d/'final.svg').read_bytes()).iter())
assert p['finalSvgPackBytes']<=p['immutableRawPackBytes']*.7
print(json.dumps({'pass':True,'bytes':p['finalSvgPackBytes'],'reductionPercent':p['reductionVsImmutablePercent']}))
