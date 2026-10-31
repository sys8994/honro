import hashlib,json
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path('/workspace/honro/_local/reports/stage32-browser-fullplay');raw=(out/'stage32-clear-export.json').read_text()
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1440,'height':900});p.goto('http://127.0.0.1:8767/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",v)',raw);p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===33');p.wait_for_timeout(2500)
 if p.evaluate('!!HonroApp.dialogue'):p.keyboard.press('Enter');p.wait_for_timeout(1000)
 p.keyboard.press('Escape');p.get_by_role('button',name='설정',exact=False).click();p.get_by_role('button',name='기록·관리',exact=False).click()
 with p.expect_download() as di:p.get_by_role('button',name='JSON 기록 내보내기').click()
 di.value.save_as(str(out/'stage32-same-context-export.json'));before=p.evaluate('''()=>({clear:HonroApp.profile.cleared['32'],stage:HonroApp.engine.b.honroStage,round:HonroApp.engine.b.round,xp:Object.fromEntries(Object.entries(HonroApp.profile.heroes).map(([k,v])=>[k,v.xp]))})''');print('before',before,flush=True)
 p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.screenshot(path=str(out/'same-context-reload-title.png'));p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===33');p.wait_for_timeout(2000);after=p.evaluate('''()=>({clear:HonroApp.profile.cleared['32'],stage:HonroApp.engine.b.honroStage,round:HonroApp.engine.b.round,xp:Object.fromEntries(Object.entries(HonroApp.profile.heroes).map(([k,v])=>[k,v.xp]))})''');p.screenshot(path=str(out/'same-context-resumed.png'));print('after',after,flush=True);assert before==after;b.close()
