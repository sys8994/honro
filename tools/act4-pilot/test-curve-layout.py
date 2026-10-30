"""Static functional invariants; not a replacement for Engine or artwork QA."""
import json,pathlib,hashlib
root=pathlib.Path(__file__).resolve().parents[2]
c=json.loads((root/'tools/act4-pilot/layouts/stage31-v2-controls.json').read_text())
raw=(root/c['base']).read_bytes();assert hashlib.sha256(raw).hexdigest()==c['baseSHA256']
a=json.loads(raw);b=json.loads((root/'tools/act4-pilot/layouts/stage31-v2.json').read_text())
assert a['routes']==b['routes']
assert a['boarding']['deckY']==b['boarding']['deckY']
assert a['boarding']['boardX1']==b['boarding']['boardX1']
assert a['boarding']['boardX2']==b['boarding']['boardX2']
for f in b['surfaces']:
 for p,q in zip(f['top'],f['top'][1:]):
  assert q[0]>p[0],f['id']
  assert abs((q[1]-p[1])/(q[0]-p[0]))<=1.35,f['id']
 if f['id'] in c['profiles']:
  assert f['top'][0]==c['profiles'][f['id']][0]
  assert f['top'][-1]==c['profiles'][f['id']][-1]
assert b['playerSupport']=='shore'
print('PASS immutable v1 SHA, route identity, boat bounds, support endpoint and actual slope invariants; no physics/art claim')
