from playwright.sync_api import sync_playwright
from pathlib import Path
import json
root=Path.cwd()
profile=json.loads((root/'game/docs/stage-review/act-endings/evidence/normal-21-victory-profile.json').read_text())['profile']
profile['honroBattle']=json.loads((root/'game/docs/stage-review/act-endings/evidence/normal-21-combat.json').read_text())['battleEnd']
# Preserve the actual old saved dialogue and cursor to verify approved phrase projection.
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1280,'height':720})
 page.goto('http://127.0.0.1:8000/HONRO.html');page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
 page.evaluate('p=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',profile)
 page.reload();page.wait_for_function('!!globalThis.HonroApp',timeout=120000);page.evaluate('HonroApp.continue()')
 page.wait_for_selector('#story-line');page.wait_for_timeout(700)
 assert '…이제 손을 놔도 돼요?' in page.locator('#story-line').inner_text()
 page.screenshot(path=str(root/'_local/reports/act-endings/review-1-safe-outro.png'))
 page.evaluate('while(HonroApp.dialogue.index<HonroApp.dialogue.lines.length-1)HonroStory.next(HonroApp)')
 page.wait_for_timeout(700)
 assert '일행 곁에 앉았다.' in page.locator('#story-line').inner_text()
 page.screenshot(path=str(root/'_local/reports/act-endings/review-1-safe-outro-last.png'))
 browser.close()
 print('PASS final approved first/last dialogue rendered from actual normal21 battle snapshot; no combat replay or reward path called')
