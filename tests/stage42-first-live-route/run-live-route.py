"""Local isolated bridge: execute exact previous successful Gate flow before testing stock walk.
The driver expands two reviewed Python insertion points; no prior QA files are mutated.
"""
import hashlib,sys
from pathlib import Path
from walk_probe import initial_only
here=Path(__file__).parent
p=here.parent/'stage42-full-native-workshop'/'browser-gate.py'
original=p.read_bytes()
assert hashlib.sha256(original).hexdigest()=='bd5c5f091e7e7aa7b2e274b17c121af0c5e88706136c7d8801c30686a09aa312','Original Gate browser driver drift'
text=original.decode()
old="   assert [x for x in v['asset'] if x[0]!=owned]==complete['asset']"
assert text.count(old)==1
new=old+'''
   ck('exact-gate-proof-preserved-before-isolated-player')
   first_live_walk(b,raw.decode(),detail_bytes.decode(),rb.decode(),out)
   ck('actual-stock-held-lower-route-walk-only')
'''
text=text.replace(old,new)
def first_live_walk(browser,base,details,gate,evidence):
    bundle=Path(sys.argv[2]).read_text()
    initial_only(browser,base,details,gate,bundle,'http://127.0.0.1:8870/HONRO.html',
                 evidence/'live-first-walk.json',evidence/'08-stock-stage42-first-walk.png')
# The trusted namespace keeps __file__ on the pinned prior source for its data paths.
exec(compile(text,str(p),'exec'), {'__file__':str(p),'__name__':'__main__','first_live_walk':first_live_walk})
