"""Check the exact published ending through real settings clicks; disposable Chromium only."""
from hashlib import sha256
import json,sys,time
from pathlib import Path
from urllib.request import Request,urlopen
from playwright.sync_api import sync_playwright
from debug_ui import check
base='https://sys8994.github.io/honro/'
expected=sys.argv[1]
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
def get(path):
    req=Request(base+path,headers={'Cache-Control':'no-cache','User-Agent':'HONRO-Ending-Pages-Readback'})
    with urlopen(req,timeout=12) as res:
        assert res.status==200 and res.geturl().startswith(base)
        return res.read()
for n in range(60):
    try:
        m=get('web/manifest.json')
        if sha256(m).hexdigest()==expected:break
    except Exception: pass
    if n<59:time.sleep(7)
else: raise RuntimeError('The expected release has not arrived at Pages')
j=json.loads(m)
for f in ['HONRO.html','index.html']:assert j['gameEntry'].encode() in get(f)
parts=[r for r in j['files'] if any(k in r['path'] for k in ('act6-ending-preview-','act6-ending-scene-','act6-ending-dawn-','act6-ending-actor-','act6-ending-shore-dawn','act6-ending-dossier-room','journey-map-act6.cd2aff500c4b2055.'))]
assert sum('act6-ending-preview-' in r['path'] for r in parts)==6
assert sum('act6-ending-dawn-' in r['path'] for r in parts)==2
assert all(sum(k in r['path'] for r in parts)==n for k,n in [('act6-ending-shore-dawn',2),('act6-ending-dossier-room',2),('journey-map-act6.cd2aff500c4b2055.',1)])
for a in parts:
    raw=get(a['path'])
    assert len(raw)==a['bytes'] and sha256(raw).hexdigest()==a['sha256'],a['path']
assert sha256(get('assets/bgm/main.mp3')).hexdigest()=='a2ffcceb9b0045f72e6baeab7292fd503fd92c4969d727009c057a60cbaca5fd'
def tap(t,selector,mobile):
    el=t.locator(selector)
    el.wait_for(state='visible',timeout=24000)
    el.tap(timeout=11000) if mobile else el.click(timeout=11000)
outer={}
with sync_playwright() as p:
    b=p.chromium.launch(chromium_sandbox=True)
    check(b,lambda ctx:None,tap,base+'HONRO.html',out,outer)
    b.close()
(out/'LIVE.json').write_text(json.dumps({'releaseManifest':expected,'publicFilesVerified':len(parts),'checks':outer},ensure_ascii=False,indent=2)+'\n')
