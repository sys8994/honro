"""Check the locally built browser's lazy-loaded stages against canonical parts.

This checks full stage JSON, not runtime code equivalence or production approval.
Run after building from the current source. A release build must pass its guard.
"""
import functools, hashlib, http.server, json, pathlib, threading
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[2];folder=root/'shared/data/act4';manifest=json.loads((folder/'world.parts/manifest.json').read_text())
parts=[]
for item in manifest['parts']:
 b=(folder/'world.parts'/item['file']).read_bytes()
 assert len(b)==item['bytes'] and hashlib.sha256(b).hexdigest()==item['sha256'],item['file']
 parts.append(b)
raw=b''.join(parts);assert len(raw)==manifest['bytes'] and hashlib.sha256(raw).hexdigest()==manifest['sha256']
assert (folder/'world.json').read_bytes()==raw,'world.json is out of sync with canonical parts'
source={s['metadata']['stageId']:s for s in json.loads(raw)['stages']}
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html');page.wait_for_function('!!window.HonroApp')
  for n in range(31,41):
   stage=page.evaluate('''async n=>{await HonroCampaignLoader.ensureStage(n);return HONRO_PROJECT.stages.find(s=>s.metadata.stageId===n)}''',n)
   # The compiler adds these narrative revision defaults when absent.
   for key in ('honroNarrativeRevision','honroStoryCanonRevision','honroNarrativeCatalogueRevision'):
    if key not in source[n].get('initialState',{}):
     assert stage.get('initialState',{}).pop(key,None) in (None,1),(n,key)
   assert stage==source[n],f'stage {n}: built browser data differs from canonical source beyond narrative defaults'
   print(f'PASS stage {n}: browser-loaded stage matches canonical source (narrative defaults allowed)',flush=True)
  assert not errors,errors;b.close()
finally:server.shutdown()
