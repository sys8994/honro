"""Disposable exact witness replay; itinerary remains only an actual pointer schedule."""
import hashlib, os, runpy, sys, tempfile
from pathlib import Path
H=Path(__file__).resolve().parent
witness=Path(sys.argv.pop(1)).resolve()
pins={
 'browser-detail.py':'312bfbcd495f6a4a7640621b81f713d3ba69737bca4d2d890cac13df25f98060',
 'detail-itinerary.json':'2a9127bc2394378eb60f6fbfca2e31cff25afa8108bde67fb92b9e5bb36399bd',
 'full-itinerary.json':'a4ef814abb314e4767f95096e769405232d46be1561044f95ff0d2ec582dc510',
 'game-full.js':'8184722f5c95987a95ec0c499281b4fba8c87e0e569a1ec54c1e78492fd2bfa1',
 'review-cameras.json':'041cbf05d49aa2f6722ab87938e91e60eb30650bcec2b7b47d1f1fbfdd196abc',
}
assert os.environ.get('HONRO_C01_DISPOSABLE_QA')=='1'
with tempfile.TemporaryDirectory(prefix='honro-c01-replay-',dir=os.getenv('RUNNER_TEMP')) as td:
 d=Path(td)
 for name,sha in pins.items():
  source=(witness/name).read_bytes()
  assert hashlib.sha256(source).hexdigest()==sha,name
  (d/name).write_bytes(source)
 original=(d/'browser-detail.py').read_text()
 anchor="   assert get(again)==complete,'Reopened detail native asset/ownership state did not match the saved detail state'\n"
 assert original.count(anchor)==1
 addon="""   from c01_pairs import capture
   assert len(raw)==2057 and len(detail_bytes)==3806
   r['c01']=capture(again,complete,r['scope_save']['sha256'],r['detail_manual_save']['sha256'],cameras,out)
   ck('c01-after-exact-native-reopen')
"""
 (d/'browser-detail.py').write_text(original.replace(anchor,anchor+addon))
 os.environ['HONRO_FULL42_ARTIST_ITINERARY']=str(d/'full-itinerary.json')
 sys.path.insert(0,str(H))
 runpy.run_path(str(d/'browser-detail.py'),run_name='__main__')
