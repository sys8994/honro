"""Execute exact copy of native slate replay with only camera-only iterations narrowed.
Original trusted pointer hits/receipt pins/source gates are unchanged.
"""
import hashlib,json,os,subprocess,sys
from pathlib import Path
from walk_probe import initial_only
from pilot import drive
H=Path(__file__).parent
driver=Path(sys.argv[2]).resolve(strict=True)
raw_driver=driver.read_bytes()
assert hashlib.sha256(raw_driver).hexdigest()=='caa9d40f1362c3dd2f3ca8643b9c277fb250e406a4bbbfa8b18a5f5b0f3148e0'
assert os.environ['HONRO_FULL42_URL']=='http://127.0.0.1:8881/HONRO_WORKSHOP.html'
assert os.environ['HONRO_C01_DISPOSABLE_QA']=='0' and os.environ['HONRO_COMPOSE_LIVE_WALK']=='0'
text=raw_driver.decode()
def one(s,a,b):
    assert s.count(a)==1,a
    return s.replace(a,b)
text=one(text,"cameras=json.loads((D/'review-cameras.json').read_text())",
         "cameras=[v for v in json.loads((D/'review-cameras.json').read_text()) if v['id'] in ['whole','gate']]\nassert [v['id'] for v in cameras]==['whole','gate']")
# Remove only archived eight device camera duplicates, not any source/draft Gate.
a="   r['legal_device_extremes']={}"; z="   ck('device-focus-extrema-captured')"
assert text.count(a)==text.count(z)==1
i=text.index(a);j=text.index(z,i)+len(z)
text=text[:i]+"   ck('whole-gate-stock-capture-for-slate-live-only')"+text[j:]
# Real original roof re-edit remains before the actual player test. Job may fail
# after generating honest live evidence; it never reports a pass from prediction.
before="   assert [x for x in v['asset'] if x[0]!=owned]==[x for x in gate_state['asset'] if x[0]!=owned]"
text=one(text,before,before+'''
   ck('slate-exact-pointer-receipts-verified-before-live')
   actual_slate_live(b,raw,detail_bytes,rb,out,D)
   ck('stock-slate-actual-first-required-fight')
''')
def actual_slate_live(browser,base,details,receipt,out,candidate_module_dir):
    expected=['a9f3200d572681ad29a0e80449f916f49565faf90d9bd8506e6d274d7eaf37e5',
              '6e8844f010bde9906b93b5f4bc30b25700dba297ec03891e43cb05c62f027ade',
              'eefbee39054a86317ce3620bc239b4c201cbce614798270758513ae3e75f8493']
    seen=[hashlib.sha256(s).hexdigest() for s in (base,details,receipt)]
    assert seen==expected,'Not exact observed slate authoring receipts'
    bundle=subprocess.check_output(['node',str(H/'build-composed-visual.mjs'),str(candidate_module_dir)],text=True)
    latest=out/'live-first-walk.json'
    def fight(page):
        (out/'live-slate-scope.json').write_text(json.dumps({'receipts_sha256':seen,'mode':'12 original native art owners + 3 visual roles; exact stock original campaign physics and enemies; fresh QA profile only'},indent=2))
        return drive(page,out,max_rounds=8,max_actions=36)
    try:
        after=initial_only(browser,base.decode(),details.decode(),receipt.decode(),bundle,
                     'http://127.0.0.1:8881/HONRO.html',latest,out/'08-stock-slate-first-walk.png',mounted_callback=fight)
    except Exception as e:
        if not latest.is_file():
            latest.write_text(json.dumps({'pass':False,'blocked_at':'first live Player mount/initial proof','error_type':type(e).__name__}))
        raise
    assert after['pass'],('live approach fight did not finish',after['reason'],after['actual_shots'])
exec(compile(text,str(driver),'exec'),{'__file__':str(driver),'__name__':'__main__','actual_slate_live':actual_slate_live})
