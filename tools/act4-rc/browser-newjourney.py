import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
f=json.loads(Path('/workspace/honro-act4-rc/tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile']
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page();p.goto(os.environ['HONRO_QA_URL']);p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',f);p.reload();p.wait_for_function('window.HonroApp');p.locator('[data-action=settings]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('새 여정 시작',exact=True).click();p.get_by_text('기록 지우고 시작',exact=True).click();p.wait_for_timeout(1000);r=p.evaluate('''()=>({screen:HonroApp.screen,last:HonroApp.profile.lastStage,clear:Object.keys(HonroApp.profile.cleared).length,schema:HonroApp.profile.schema,storage:JSON.parse(localStorage.getItem('honro-first-act-profile-1')).lastStage})''');print('new journey official UI',r,flush=True);assert r['screen']=='title' and r['last']==1 and r['storage']==1 and r['clear']==0;b.close()
