# Public-route exclusion smoke for an UNPUBLISHED checkout; not an Act 6 playtest.
import argparse
import hashlib
import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

p=argparse.ArgumentParser()
p.add_argument('--root', type=Path, required=True)
p.add_argument('--out', type=Path, required=True)
a=p.parse_args()
root=a.root.resolve()
out=a.out.resolve()
out.mkdir(parents=True, exist_ok=True)
payload={key:hashlib.sha256((root/key).read_bytes()).hexdigest() for key in ('HONRO.html','web/manifest.json')}
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=root))
threading.Thread(target=server.serve_forever,daemon=True).start()
evidence={'snapshot':payload,'scope':'ordinary existing app; feature OFF; not Act 6 play','devices':{}}
try:
    with sync_playwright() as p:
        browser=p.chromium.launch()
        for platform, width, height in [('pc',1440,900),('mobile',390,844)]:
            context=browser.new_context(viewport={'width':width,'height':height},is_mobile=platform=='mobile',has_touch=platform=='mobile',device_scale_factor=1)
            page=context.new_page()
            failures=[]
            requested=[]
            page.on('pageerror',lambda err:failures.append(str(err)))
            page.on('request',lambda r: requested.append(urlsplit(r.url).path))
            prefix=f'http://127.0.0.1:{server.server_port}'
            page.goto(f'{prefix}/HONRO.html',wait_until='domcontentloaded',timeout=45000)
            button=page.get_by_role('button',name='길을 열다',exact=True)
            button.wait_for(state='visible',timeout=45000)
            page.screenshot(path=out/f'{platform}-title.png')
            assert page.evaluate("globalThis.HonroApp?.screen === 'title'"), 'wrong app title owner'
            button.click()
            page.wait_for_function("typeof globalThis.HonroApp?.screen==='string' && globalThis.HonroApp.screen!=='title'",timeout=30000)
            state=page.evaluate("""() => ({screen:HonroApp.screen, current:HonroApp.engine?.b?.honroStage ?? null,
                                              registered:globalThis.HONRO_CONTENT?.stages?.length ?? null})""")
            page.screenshot(path=out/f'{platform}-after-open.png')
            import re
            new_requests=[r for r in requested if re.search(r'/chapter-(5[1-9]|60)[.-]',r)]
            evidence['devices'][platform]={'state':state,'pageErrors':failures,'act6PacketRequests':new_requests}
            assert not failures and not new_requests, evidence['devices'][platform]
            assert state['registered']==50, state
            assert state['current'] is None or 1 <= state['current'] <= 50, state
            context.close()
        browser.close()
finally:
    (out/'report.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2))
    server.shutdown()
    server.server_close()
