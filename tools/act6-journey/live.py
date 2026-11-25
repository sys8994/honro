"""Verify actual deployed normal route without touching anyone's save."""
from hashlib import sha256
import json,sys,time
from pathlib import Path
from urllib.request import Request,urlopen
from playwright.sync_api import sync_playwright
from witness import witness

site='https://sys8994.github.io/honro/'
stock='honro-first-act-profile-1'
pin=sys.argv[1]
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
def fetch(path):
    with urlopen(Request(site+path,headers={'Cache-Control':'no-cache','User-Agent':'HONRO-Pages-readback'}),timeout=15) as res:
        assert res.status==200 and res.geturl().startswith(site)
        return res.read()
for _ in range(50):
    try:
        data=fetch('web/manifest.json')
        if sha256(data).hexdigest()==pin: break
    except Exception: pass
    time.sleep(8)
else: raise RuntimeError('Pages did not reach the exact candidate manifest')
j=json.loads(data)
assert j['gameEntry'].encode() in fetch('HONRO.html')
assert j['gameEntry'].encode() in fetch('index.html')
rows=[a for a in j['files'] if 'journey-map-act6.' in a['path']]
assert len(rows)==1
a=rows[0];plate=fetch(a['path'])
assert len(plate)==a['bytes'] and sha256(plate).hexdigest()==a['sha256']
p=json.loads((Path(__file__).parent/'settled-witness.json').read_bytes())['profile']
p['cleared'].update({str(n):True for n in range(1,50)})
p['lastStage']=50
raw=json.dumps(p,ensure_ascii=False,separators=(',',':'))
result={}
def tap(tab,selector,mobile):
    el=tab.locator(selector);el.wait_for(state='visible',timeout=20000)
    el.tap() if mobile else el.click()
with sync_playwright() as pw:
    b=pw.chromium.launch(chromium_sandbox=True)
    for case,w,h,mobile in [('PC',1440,900,False),('M',390,844,True)]:
        with b.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1) as cx:
            cfg=json.dumps([site,stock,raw])
            cx.add_init_script(f"""(()=>{{const [url,k,value]={cfg};if(location.href.startsWith(url)&&!localStorage.getItem(k))localStorage.setItem(k,value);}})()""")
            tab=cx.new_page(); errors=[]
            tab.on('pageerror',lambda err:errors.append(str(err)))
            tab.goto(site+'HONRO.html',wait_until='domcontentloaded',timeout=30000)
            tab.wait_for_function("globalThis.HonroApp?.screen==='title'&&!!globalThis.HONRO_READY",timeout=40000)
            tab.evaluate('async()=>await HONRO_READY')
            tap(tab,'.title-actions button.primary[data-action="rest"]',mobile)
            tab.wait_for_function("HonroApp.screen==='rest'",timeout=20000)
            for i in range(35):
                if not tab.evaluate('!!HonroApp.dialogue'):break
                tab.wait_for_timeout(350)
                tap(tab,'[data-action="dialogue-next"]',mobile)
            state={}; witness(tab,state,mobile,tap,out,case,51)
            tab.wait_for_timeout(450)
            tap(tab,'[data-action="journey-book"]',mobile)
            tap(tab,'[data-action="journey-act"][data-id="5"]',mobile)
            tab.wait_for_function("()=>document.querySelector('.journey-act-5 .journey-map-image')?.naturalWidth>0",timeout=12000)
            assert not tab.locator('.journey6-realm').count()
            tap(tab,'[data-action="journey-act"][data-id="6"]',mobile)
            tab.wait_for_function("()=>!!document.querySelector('.journey-act-6 [data-id=\"51\"]')",timeout=12000)
            state['stockAct5TabStillWorks']=True
            assert not errors,errors
            result[case]={'origin':tab.url,**state}
    b.close()
(out/'LIVE.json').write_text(json.dumps({'releaseManifest':pin,'asset':a,'cases':result},ensure_ascii=False,indent=2)+'\n')
