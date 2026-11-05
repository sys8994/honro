"""Actual browser presentation of an explicit recorded native cleanup fixture."""
import os,sys,json
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.path.insert(0,'tests')
from browser_support import ROOT,launch,serve_game
from stage21_source_preview import install_source_preview,source_preview_metadata
out=ROOT/'_local/reports/stage21-visible-tactics'/os.environ.get('HONRO_CLEARANCE_OUT','clearance-before');out.mkdir(parents=True,exist_ok=True)
f=json.loads((ROOT/'_local/reports/stage21-visible-tactics/clearance-entry.json').read_text());expected=os.environ.get('HONRO_CLEARANCE_TEXT','주민이 성문 안 안전지대까지 이동하도록 지키기');rows=[];errors=[]
with serve_game() as base,sync_playwright() as w:
 b=launch(w)
 for width,height in [(1280,800),(360,800)]:
  p=b.new_page(viewport={'width':width,'height':height});install_source_preview(p);p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',f['profile']);p.reload();p.locator('[data-action="continue"]').click();p.wait_for_function('HonroApp.engine?.b?.honroStage===21')
  for _ in range(120):
   if p.evaluate('!!HonroApp.dialogue'):p.keyboard.press('Enter')
   if p.evaluate('HonroApp.canInput()'):break
   p.wait_for_timeout(150)
  text=p.locator('#objective-text').inner_text();assert text==expected,(text,expected)
  p.screenshot(path=str(out/(str(width)+'-battle.png')));p.locator('#objective-text').click();help=p.locator('.battle-help-current').inner_text();assert help==expected
  p.screenshot(path=str(out/(str(width)+'-help.png')));rows.append({'width':width,'header':text,'help':help});p.close()
 b.close()
assert not errors
(out/'result.json').write_text(json.dumps({'scope':__doc__,'sourcePreview':source_preview_metadata(),'rows':rows,'errors':errors},ensure_ascii=False,indent=2));print('PASS cleanup header/help',rows)
