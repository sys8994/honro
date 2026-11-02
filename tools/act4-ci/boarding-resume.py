"""Replay exact archived normal-input combat save. Debugging only, not fresh release proof."""
import os,json,lzma,hashlib,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
from boarding_inputs import board_party
out=Path('_local/reports/stage31-boarding-resume');out.mkdir(parents=True,exist_ok=True)
raw=lzma.decompress(Path('tests/fixtures/stage31/boarding-r14-resume.json.xz').read_bytes())
assert hashlib.sha256(raw).hexdigest()=='2279ee07da40cbe789bae5723bf91be58d583b7359fe009e0fda89d0390476af'
r={'passed':False,'scope':'Exact archived R14 combat save resumed through normal UI on deployed game. Controller debugging only, not fresh full-run release evidence.','profileSha256':hashlib.sha256(raw).hexdigest(),'events':[],'errors':[]}
try:
 with sync_playwright() as w:
  browser=w.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:r['errors'].append(str(e)))
  p.goto('https://sys8994.github.io/honro/HONRO.html?boarding-resume=20261102',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=60000)
  p.evaluate('(text)=>localStorage.setItem("honro-first-act-profile-1",text)',raw.decode());p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=60000)
  p.locator('[data-action="continue"]:visible').first.click()
  p.wait_for_function('HonroApp.engine?.b?.honroStage===31',timeout=60000)
  def record(label,s):
   r['events'].append({'label':label,'state':s});print(json.dumps(r['events'][-1]),flush=True)
  r['final']=board_party(p,record,lambda name:p.screenshot(path=str(out/(name+'.png'))))
  assert r['final']['round']<=20 and not r['errors'];r['passed']=True;browser.close()
except Exception:
 r['error']=traceback.format_exc()
 try:p.screenshot(path=str(out/'failure.png'))
 except Exception:pass
finally:(out/'result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2));print(json.dumps(r,ensure_ascii=False),flush=True)
if not r['passed']:raise SystemExit(1)
