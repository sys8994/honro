"""Local visual editor regression requested as part of the authoring-script work.
Actual Chromium + normal DOM controls; no hidden game-state writes. The server
and browser share this one local test process, not a remote site or user PC.
"""
import functools, http.server, json, pathlib, threading
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/reports/stage31-direct/editor';OUT.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1600,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/HONRO_WORKSHOP.html',wait_until='domcontentloaded')
  page.locator('[data-stage="stage-31"]').wait_for(timeout=60000)
  page.locator('[data-stage="stage-31"]').click()
  page.locator('#productionToggle').click()
  page.locator('#productionBegin').wait_for()
  page.screenshot(path=str(OUT/'01-actual-rejected-stage.png'))
  assert 'x=6280' in page.locator('#rightContent').inner_text()
  page.locator('#productionBegin').click()
  page.locator('#productionIntent').fill('낮은 제방과 얕은물 우회로의 사격 위치 선택')
  page.locator('#productionIntent').press('Tab')
  page.locator('#productionRefs').select_option(['stage-3','stage-30'])
  page.locator('#productionExport').click()
  assert '차단' in page.locator('#toast').inner_text()
  page.screenshot(path=str(OUT/'02-contract-blocks-export.png'))
  with page.expect_download() as download:
   page.locator('#productionDraft').click()
  draft=download.value;assert '.draft.' in draft.suggested_filename
  draft.save_as(str(OUT/'stage31.draft.honro-map.json'))
  assert not errors,errors
  (OUT/'result.json').write_text(json.dumps({'scope':'Local Chromium editor UI, not campaign play','checks':['existing stage31 opened','actual cut detected','contract created','existing references selected','production export blocked','draft export named explicitly'],'pageErrors':errors},ensure_ascii=False,indent=2))
  print(str(OUT),flush=True);browser.close()
finally:server.shutdown();server.server_close()
